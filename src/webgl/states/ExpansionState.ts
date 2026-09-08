import {
  WebGLRenderer,
  WebGLRenderTarget,
  DataTexture,
  FloatType,
  RGBAFormat,
  NearestFilter,
  BufferGeometry,
  BufferAttribute,
  DynamicDrawUsage,
  ShaderMaterial,
  Points,
  Scene,
  Color,
  Vector3,
  OrthographicCamera,
  PlaneGeometry,
  Mesh,
} from 'three'
import expansionVertex   from '../shaders/expansion/vertex.glsl'
import expansionFragment from '../shaders/expansion/fragment.glsl'
import { clamp }         from '../../lib/math'
import type { DeviceCapabilities } from '../../types/mind'

// GPGPU fluid particle system. Desktop: 80,000 particles via
// ping-pong position/velocity render targets. Mid-tier falls back to
// 40,000 CPU-simulated particles (no float render targets required).

const POSITION_FRAG = /* glsl */ `
  uniform sampler2D uPositionTexture;
  uniform sampler2D uVelocityTexture;
  uniform float     uDelta;
  varying vec2       vUv;
  void main() {
    vec4 pos = texture2D(uPositionTexture, vUv);
    vec4 vel = texture2D(uVelocityTexture, vUv);
    pos.xyz += vel.xyz * uDelta * 60.0;
    // Recycle — particles that fly too far respawn near the core
    if (length(pos.xyz) > 4.0) {
      pos.xyz *= 0.05;
    }
    gl_FragColor = pos;
  }
`

const VELOCITY_FRAG = /* glsl */ `
  uniform sampler2D uPositionTexture;
  uniform sampler2D uVelocityTexture;
  uniform vec3      uCursorWorld;
  uniform float     uTime;
  uniform float     uConverge; // 0 = explosive, 1 = converging to origin
  varying vec2      vUv;

  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
  }

  void main() {
    vec4 pos = texture2D(uPositionTexture, vUv);
    vec4 vel = texture2D(uVelocityTexture, vUv);

    // Cheap curl-ish turbulence
    vec3 noise = vec3(
      hash(pos.xyz + uTime * 0.1) - 0.5,
      hash(pos.xyz + uTime * 0.1 + 1.0) - 0.5,
      hash(pos.xyz + uTime * 0.1 + 2.0) - 0.5
    ) * 0.02;

    vec3 newVel = vel.xyz + noise;

    // Cursor attraction within 0.5 units
    vec3 toCursor = uCursorWorld - pos.xyz;
    float distToCursor = length(toCursor);
    if (distToCursor < 0.5 && distToCursor > 0.001) {
      newVel += normalize(toCursor) * 0.01;
    }

    // Convergence toward origin as Expansion hands over to Integration
    vec3 toOrigin = -pos.xyz;
    float originDist = max(length(toOrigin), 0.0001);
    newVel = mix(newVel, (toOrigin / originDist) * 0.08, uConverge);

    // Speed clamp
    float speed = length(newVel);
    if (speed > 0.08) newVel = (newVel / speed) * 0.08;

    gl_FragColor = vec4(newVel, vel.w);
  }
`

const SIM_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

// Mid-tier CPU path — same semantics as the GPGPU vertex shader but
// fed from plain buffer attributes.
const FALLBACK_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute vec3  aColor;
  attribute float aAlpha;
  attribute float aSpeed;

  uniform float uProgress;
  uniform float uPixelRatio;

  varying vec3  vColor;
  varying float vAlpha;
  varying float vVelocity;

  void main() {
    vColor    = aColor;
    vVelocity = clamp(aSpeed / 0.08, 0.0, 1.0);
    vAlpha    = aAlpha * clamp(uProgress * 4.0, 0.0, 1.0);

    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = min(aSize * uPixelRatio * (5.0 / -mv.z), 28.0 * uPixelRatio);
    gl_Position  = projectionMatrix * mv;
  }
`

export class ExpansionState {
  private capabilities: DeviceCapabilities
  private useGPGPU:     boolean
  private particleCount: number
  private textureSize:   number

  // GPGPU resources
  private positionRT: [WebGLRenderTarget, WebGLRenderTarget] | null = null
  private velocityRT: [WebGLRenderTarget, WebGLRenderTarget] | null = null
  private seedTextures: { pos: DataTexture; vel: DataTexture } | null = null
  private simScene:    Scene | null = null
  private simCamera:   OrthographicCamera | null = null
  private positionSimMaterial: ShaderMaterial | null = null
  private velocitySimMaterial: ShaderMaterial | null = null
  private simQuad: Mesh | null = null
  private ping   = 0
  private seeded = false

  // CPU fallback state
  private cpuPositions: Float32Array | null = null
  private cpuVelocities: Float32Array | null = null

  // Render resources
  private geometry: BufferGeometry
  private material: ShaderMaterial
  public  points:    Points

  constructor(
    scene: Scene,
    capabilities: DeviceCapabilities
  ) {
    this.capabilities  = capabilities
    this.useGPGPU      = capabilities.useGPGPU
    this.particleCount = capabilities.tier === 'high' ? 80_000
                        : capabilities.tier === 'mid'  ? 40_000
                        : 0

    this.textureSize = Math.ceil(Math.sqrt(Math.max(1, this.particleCount)))

    this.geometry = new BufferGeometry()
    this.material = new ShaderMaterial({
      vertexShader:   this.useGPGPU ? expansionVertex : FALLBACK_VERTEX,
      fragmentShader: expansionFragment,
      transparent:    true,
      depthWrite:     false,
      uniforms: {
        uTime:            { value: 0 },
        uProgress:        { value: 0 },
        uCursorSpeed:     { value: 0 },
        uPixelRatio:      { value: Math.min(window.devicePixelRatio, 2) },
        uPositionTexture: { value: null },
        uVelocityTexture: { value: null },
        uSpectrumColors:  { value: [
          new Color(0xd4406a), // rose
          new Color(0x7040c8), // violet
          new Color(0x20a8a0), // teal
          new Color(0x80c840), // lime
        ]},
      },
    })

    if (this.useGPGPU && this.particleCount > 0) {
      this.initGPGPU()
    } else if (this.particleCount > 0) {
      this.initCPUFallback()
    }

    this.points = new Points(this.geometry, this.material)
    this.points.frustumCulled = false
    scene.add(this.points)
  }

  private initGPGPU(): void {
    const size = this.textureSize

    const posData = new Float32Array(size * size * 4)
    const velData = new Float32Array(size * size * 4)

    for (let i = 0; i < size * size; i++) {
      const i4 = i * 4
      // Spawn at origin — the velocity field explodes them outward
      posData[i4] = posData[i4 + 1] = posData[i4 + 2] = 0
      posData[i4 + 3] = 1 // life

      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      const speed = 0.1 + Math.random() * 0.3
      velData[i4]     = speed * Math.sin(phi) * Math.cos(theta)
      velData[i4 + 1] = speed * Math.sin(phi) * Math.sin(theta)
      velData[i4 + 2] = speed * Math.cos(phi)
      velData[i4 + 3] = 1
    }

    const makePair = () => {
      const opts = {
        type: FloatType, format: RGBAFormat,
        minFilter: NearestFilter, magFilter: NearestFilter,
        depthBuffer: false, stencilBuffer: false,
      }
      return [
        new WebGLRenderTarget(size, size, opts),
        new WebGLRenderTarget(size, size, opts),
      ] as [WebGLRenderTarget, WebGLRenderTarget]
    }

    this.positionRT = makePair()
    this.velocityRT = makePair()

    const posTex = new DataTexture(posData, size, size, RGBAFormat, FloatType)
    posTex.needsUpdate = true
    const velTex = new DataTexture(velData, size, size, RGBAFormat, FloatType)
    velTex.needsUpdate = true
    this.seedTextures = { pos: posTex, vel: velTex }

    // Simulation scene — fullscreen quad, two materials swapped per pass
    this.simScene  = new Scene()
    this.simCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)

    this.positionSimMaterial = new ShaderMaterial({
      vertexShader:   SIM_VERTEX,
      fragmentShader: POSITION_FRAG,
      uniforms: {
        uPositionTexture: { value: posTex },
        uVelocityTexture: { value: velTex },
        uDelta:           { value: 0 },
      },
    })

    this.velocitySimMaterial = new ShaderMaterial({
      vertexShader:   SIM_VERTEX,
      fragmentShader: VELOCITY_FRAG,
      uniforms: {
        uPositionTexture: { value: posTex },
        uVelocityTexture: { value: velTex },
        uCursorWorld:     { value: new Vector3() },
        uTime:            { value: 0 },
        uConverge:        { value: 0 },
      },
    })

    this.simQuad = new Mesh(new PlaneGeometry(2, 2), this.positionSimMaterial)
    this.simScene.add(this.simQuad)

    // Particle geometry: only UV lookup coords — real positions live
    // in the GPGPU texture and are sampled in the vertex shader.
    const count = size * size
    const uvs   = new Float32Array(count * 2)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = y * size + x
        uvs[i * 2]     = (x + 0.5) / size
        uvs[i * 2 + 1] = (y + 0.5) / size
      }
    }

    this.geometry.setAttribute(
      'position', new BufferAttribute(new Float32Array(count * 3), 3)
    )
    this.geometry.setAttribute('aTextureCoord', new BufferAttribute(uvs, 2))
  }

  // The seed DataTextures never reach the ping-pong targets by
  // themselves — copy them in on the first frame, before the loop.
  private seedGPGPU(renderer: WebGLRenderer): void {
    if (
      !this.seedTextures || !this.positionRT || !this.velocityRT ||
      !this.simScene || !this.simCamera || !this.simQuad
    ) return

    this.velocitySimMaterial!.uniforms.uPositionTexture.value = this.seedTextures.pos
    this.velocitySimMaterial!.uniforms.uVelocityTexture.value = this.seedTextures.vel
    this.velocitySimMaterial!.uniforms.uTime.value            = 0
    this.velocitySimMaterial!.uniforms.uConverge.value        = 0
    this.simQuad.material = this.velocitySimMaterial!
    renderer.setRenderTarget(this.velocityRT[0])
    renderer.render(this.simScene, this.simCamera)

    this.positionSimMaterial!.uniforms.uPositionTexture.value = this.seedTextures.pos
    this.positionSimMaterial!.uniforms.uVelocityTexture.value = this.velocityRT[0].texture
    this.positionSimMaterial!.uniforms.uDelta.value           = 0
    this.simQuad.material = this.positionSimMaterial!
    renderer.setRenderTarget(this.positionRT[0])
    renderer.render(this.simScene, this.simCamera)

    renderer.setRenderTarget(null)
    this.seeded = true
  }

  private initCPUFallback(): void {
    const n = this.particleCount

    const positions = new Float32Array(n * 3)
    const velocities = new Float32Array(n * 3)
    const colors     = new Float32Array(n * 3)
    const sizes      = new Float32Array(n)
    const alphas     = new Float32Array(n)
    const speeds     = new Float32Array(n)

    const spectrum = [
      new Color(0xd4406a), new Color(0x7040c8),
      new Color(0x20a8a0), new Color(0x80c840),
    ]

    for (let i = 0; i < n; i++) {
      const i3 = i * 3
      positions[i3] = positions[i3 + 1] = positions[i3 + 2] = 0

      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      const speed = 0.1 + Math.random() * 0.3
      velocities[i3]     = speed * Math.sin(phi) * Math.cos(theta)
      velocities[i3 + 1] = speed * Math.sin(phi) * Math.sin(theta)
      velocities[i3 + 2] = speed * Math.cos(phi)

      const c = spectrum[Math.floor(Math.random() * 4)]
      colors[i3] = c.r; colors[i3 + 1] = c.g; colors[i3 + 2] = c.b

      sizes[i]  = 1.0 + Math.random() * 2.0
      alphas[i] = 0.9
      speeds[i] = speed
    }

    this.cpuPositions  = positions
    this.cpuVelocities = velocities

    this.geometry.setAttribute(
      'position', new BufferAttribute(positions, 3).setUsage(DynamicDrawUsage)
    )
    this.geometry.setAttribute('aColor',   new BufferAttribute(colors, 3))
    this.geometry.setAttribute('aSize',    new BufferAttribute(sizes, 1))
    this.geometry.setAttribute('aAlpha',   new BufferAttribute(alphas, 1))
    this.geometry.setAttribute(
      'aSpeed', new BufferAttribute(speeds, 1).setUsage(DynamicDrawUsage)
    )
  }

  // GPGPU simulation passes — separate from the main scene render.
  simulate(
    renderer: WebGLRenderer,
    delta: number,
    cursorWorld: Vector3,
    time: number,
    converge: number
  ): void {
    if (!this.useGPGPU) return
    if (!this.positionRT || !this.velocityRT || !this.simScene || !this.simCamera || !this.simQuad) return

    if (!this.seeded) this.seedGPGPU(renderer)

    const nextPing = 1 - this.ping

    // Velocity pass
    this.velocitySimMaterial!.uniforms.uPositionTexture.value = this.positionRT[this.ping].texture
    this.velocitySimMaterial!.uniforms.uVelocityTexture.value = this.velocityRT[this.ping].texture
    ;(this.velocitySimMaterial!.uniforms.uCursorWorld.value as Vector3).copy(cursorWorld)
    this.velocitySimMaterial!.uniforms.uTime.value            = time
    this.velocitySimMaterial!.uniforms.uConverge.value        = converge
    this.simQuad.material = this.velocitySimMaterial!
    renderer.setRenderTarget(this.velocityRT[nextPing])
    renderer.render(this.simScene, this.simCamera)

    // Position pass (reads the velocity just written)
    this.positionSimMaterial!.uniforms.uPositionTexture.value = this.positionRT[this.ping].texture
    this.positionSimMaterial!.uniforms.uVelocityTexture.value = this.velocityRT[nextPing].texture
    this.positionSimMaterial!.uniforms.uDelta.value           = delta
    this.simQuad.material = this.positionSimMaterial!
    renderer.setRenderTarget(this.positionRT[nextPing])
    renderer.render(this.simScene, this.simCamera)

    renderer.setRenderTarget(null)

    this.material.uniforms.uPositionTexture.value = this.positionRT[nextPing].texture
    this.material.uniforms.uVelocityTexture.value = this.velocityRT[nextPing].texture

    this.ping = nextPing
  }

  update(
    time: number,
    delta: number,
    stateProgress: number,
    cursorSpeed: number,
    cursorWorld: Vector3
  ): void {
    this.material.uniforms.uTime.value        = time
    this.material.uniforms.uProgress.value    = stateProgress
    this.material.uniforms.uCursorSpeed.value = cursorSpeed

    if (!this.useGPGPU && this.cpuPositions && this.cpuVelocities) {
      this.stepCPU(delta, cursorWorld)
    }
  }

  private stepCPU(delta: number, cursorWorld: Vector3): void {
    const pos = this.cpuPositions!
    const vel = this.cpuVelocities!
    const n   = this.particleCount
    const dt  = Math.min(delta, 0.05) * 60

    const cx = cursorWorld.x
    const cy = cursorWorld.y
    const cz = cursorWorld.z

    const speedAttr = this.geometry.attributes.aSpeed as BufferAttribute

    for (let i = 0; i < n; i++) {
      const i3 = i * 3

      // Cursor attraction
      const dx = cx - pos[i3]
      const dy = cy - pos[i3 + 1]
      const dz = cz - pos[i3 + 2]
      const d2 = dx * dx + dy * dy + dz * dz
      if (d2 < 0.25 && d2 > 1e-6) {
        const inv = 0.01 / Math.sqrt(d2)
        vel[i3] += dx * inv * 0.01
        vel[i3 + 1] += dy * inv * 0.01
        vel[i3 + 2] += dz * inv * 0.01
      }

      // Mild turbulence + speed clamp
      vel[i3]     += (Math.random() - 0.5) * 0.004
      vel[i3 + 1] += (Math.random() - 0.5) * 0.004
      vel[i3 + 2] += (Math.random() - 0.5) * 0.004

      const speed = Math.sqrt(
        vel[i3] * vel[i3] + vel[i3 + 1] * vel[i3 + 1] + vel[i3 + 2] * vel[i3 + 2]
      )
      if (speed > 0.08) {
        const s = 0.08 / speed
        vel[i3] *= s; vel[i3 + 1] *= s; vel[i3 + 2] *= s
      }

      pos[i3]     += vel[i3] * dt
      pos[i3 + 1] += vel[i3 + 1] * dt
      pos[i3 + 2] += vel[i3 + 2] * dt

      // Recycle far-flung particles near the core
      if (pos[i3] * pos[i3] + pos[i3 + 1] * pos[i3 + 1] + pos[i3 + 2] * pos[i3 + 2] > 16) {
        pos[i3] *= 0.05; pos[i3 + 1] *= 0.05; pos[i3 + 2] *= 0.05
      }

      speedAttr.setX(i, clamp(speed, 0, 0.08))
    }

    this.geometry.attributes.position.needsUpdate = true
    speedAttr.needsUpdate = true
  }

  setVisible(visible: boolean): void {
    this.points.visible = visible
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
    this.positionRT?.forEach(rt => rt.dispose())
    this.velocityRT?.forEach(rt => rt.dispose())
    this.seedTextures?.pos.dispose()
    this.seedTextures?.vel.dispose()
    this.positionSimMaterial?.dispose()
    this.velocitySimMaterial?.dispose()
    this.simQuad?.geometry.dispose()
    this.cpuPositions  = null
    this.cpuVelocities = null
    this.seeded = false
  }
}
