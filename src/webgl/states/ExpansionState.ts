import {
  WebGLRenderer,
  WebGLRenderTarget,
  DataTexture,
  FloatType,
  RGBAFormat,
  NearestFilter,
  BufferGeometry,
  BufferAttribute,
  ShaderMaterial,
  Points,
  Scene,
  Camera,
  OrthographicCamera,
  PlaneGeometry,
  Mesh,
} from 'three'
import expansionVertex   from '../shaders/expansion/vertex.glsl'
import expansionFragment from '../shaders/expansion/fragment.glsl'
import type { DeviceCapabilities } from '../../types/mind'

// GPGPU fluid particle system. Desktop: 80,000 particles via
// ping-pong position/velocity render targets (Phase 8 architecture
// decision — CPU updates cannot handle this particle count at 60fps).
// Mid-tier falls back to 40,000 CPU-updated particles (no GPGPU).
// Low-tier: disabled entirely (handled upstream by WebGLManager).

const POSITION_FRAG = /* glsl */ `
  uniform sampler2D uPositionTexture;
  uniform sampler2D uVelocityTexture;
  uniform float     uDelta;
  varying vec2       vUv;
  void main() {
    vec4 pos = texture2D(uPositionTexture, vUv);
    vec4 vel = texture2D(uVelocityTexture, vUv);
    pos.xyz += vel.xyz * uDelta * 60.0;
    // Wrap back toward center if particle travels too far (infinite field)
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

    // Curl-noise-style turbulence (simplified, cheap approximation)
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

    // Convergence toward origin during Expansion -> Integration transition
    vec3 toOrigin = -pos.xyz;
    newVel = mix(newVel, normalize(toOrigin + 0.0001) * 0.08, uConverge);

    // Speed clamp
    float speed = length(newVel);
    if (speed > 0.08) newVel = normalize(newVel) * 0.08;

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

export class ExpansionState {
  private capabilities: DeviceCapabilities
  private useGPGPU:     boolean
  private particleCount: number
  private textureSize:   number

  // GPGPU resources
  private positionRT: [WebGLRenderTarget, WebGLRenderTarget] | null = null
  private velocityRT:  [WebGLRenderTarget, WebGLRenderTarget] | null = null
  private simScene:    Scene | null = null
  private simCamera:   OrthographicCamera | null = null
  private positionSimMaterial: ShaderMaterial | null = null
  private velocitySimMaterial: ShaderMaterial | null = null
  private simQuad: Mesh | null = null
  private ping = 0

  // Render resources
  private geometry: BufferGeometry
  private material: ShaderMaterial
  public  points:    Points

  constructor(
    scene: Scene,
    capabilities: DeviceCapabilities
  ) {
    this.capabilities = capabilities
    this.useGPGPU      = capabilities.useGPGPU
    this.particleCount = capabilities.tier === 'high' ? 80_000
                        : capabilities.tier === 'mid'  ? 40_000
                        : 0

    this.textureSize = Math.ceil(Math.sqrt(this.particleCount))

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
      },
    })

    if (this.useGPGPU && this.particleCount > 0) {
      this.initGPGPU(scene)
    } else if (this.particleCount > 0) {
      this.initCPUFallback()
    }

    this.points = new Points(this.geometry, this.material)
    scene.add(this.points)
  }

  private initGPGPU(_scene: Scene): void {
    const size = this.textureSize

    const posData = new Float32Array(size * size * 4)
    const velData = new Float32Array(size * size * 4)

    for (let i = 0; i < size * size; i++) {
      const i4 = i * 4
      // Spawn at origin — they'll explode outward via velocity sim
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

    const makeRT = (data: Float32Array) => {
      const tex = new DataTexture(data, size, size, RGBAFormat, FloatType)
      tex.needsUpdate = true
      const rtA = new WebGLRenderTarget(size, size, {
        type: FloatType, format: RGBAFormat,
        minFilter: NearestFilter, magFilter: NearestFilter,
      })
      const rtB = rtA.clone()
      return { tex, pair: [rtA, rtB] as [WebGLRenderTarget, WebGLRenderTarget] }
    }

    const posSetup = makeRT(posData)
    const velSetup = makeRT(velData)
    this.positionRT = posSetup.pair
    this.velocityRT = velSetup.pair

    // Simulation scene — fullscreen quad, two materials swapped per pass
    this.simScene  = new Scene()
    this.simCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)

    this.positionSimMaterial = new ShaderMaterial({
      vertexShader:   SIM_VERTEX,
      fragmentShader: POSITION_FRAG,
      uniforms: {
        uPositionTexture: { value: posSetup.tex },
        uVelocityTexture: { value: velSetup.tex },
        uDelta:           { value: 0 },
      },
    })

    this.velocitySimMaterial = new ShaderMaterial({
      vertexShader:   SIM_VERTEX,
      fragmentShader: VELOCITY_FRAG,
      uniforms: {
        uPositionTexture: { value: posSetup.tex },
        uVelocityTexture: { value: velSetup.tex },
        uCursorWorld:     { value: { x: 0, y: 0, z: 0 } },
        uTime:            { value: 0 },
        uConverge:        { value: 0 },
      },
    })

    this.simQuad = new Mesh(new PlaneGeometry(2, 2), this.positionSimMaterial)
    this.simScene.add(this.simQuad)

    // Particle geometry: just UV lookup coords, no real positions
    // (positions live in the GPGPU texture, sampled in vertex shader)
    const uvs = new Float32Array(size * size * 2)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = y * size + x
        uvs[i * 2]     = x / (size - 1)
        uvs[i * 2 + 1] = y / (size - 1)
      }
    }

    this.geometry.setAttribute('position', new BufferAttribute(new Float32Array(size * size * 3), 3))
    this.geometry.setAttribute('aTextureCoord', new BufferAttribute(uvs, 2))
  }

  private initCPUFallback(): void {
    // Mid-tier: 40,000 CPU-updated particles, no GPGPU.
    // Uses the standard particle vertex shader pattern instead.
    const positions  = new Float32Array(this.particleCount * 3)
    const colors     = new Float32Array(this.particleCount * 3)
    const sizes      = new Float32Array(this.particleCount)
    const alphas     = new Float32Array(this.particleCount)

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3
      positions[i3] = positions[i3 + 1] = positions[i3 + 2] = 0
      sizes[i]  = 1.5
      alphas[i] = 0.8
      colors[i3] = 0.439; colors[i3 + 1] = 0.251; colors[i3 + 2] = 0.784
    }

    this.geometry.setAttribute('position', new BufferAttribute(positions, 3))
    this.geometry.setAttribute('aColor',   new BufferAttribute(colors, 3))
    this.geometry.setAttribute('aSize',    new BufferAttribute(sizes, 1))
    this.geometry.setAttribute('aAlpha',   new BufferAttribute(alphas, 1))
  }

  // Runs the GPGPU simulation passes — must be called with the real
  // WebGLRenderer from WebGLManager, separate from the main scene render
  simulate(renderer: WebGLRenderer, delta: number, cursorWorld: { x: number; y: number; z: number }, time: number, converge: number): void {
    if (!this.useGPGPU || !this.positionRT || !this.velocityRT || !this.simScene || !this.simCamera || !this.simQuad) return

    const nextPing = 1 - this.ping
    const currentPosTex = this.positionRT[this.ping].texture
    const currentVelTex = this.velocityRT[this.ping].texture

    // Velocity pass
    this.velocitySimMaterial!.uniforms.uPositionTexture.value = currentPosTex
    this.velocitySimMaterial!.uniforms.uVelocityTexture.value = currentVelTex
    this.velocitySimMaterial!.uniforms.uCursorWorld.value     = cursorWorld
    this.velocitySimMaterial!.uniforms.uTime.value            = time
    this.velocitySimMaterial!.uniforms.uConverge.value        = converge
    this.simQuad.material = this.velocitySimMaterial!
    renderer.setRenderTarget(this.velocityRT[nextPing])
    renderer.render(this.simScene, this.simCamera)

    // Position pass (reads the velocity we just wrote)
    this.positionSimMaterial!.uniforms.uPositionTexture.value = currentPosTex
    this.positionSimMaterial!.uniforms.uVelocityTexture.value = this.velocityRT[nextPing].texture
    this.positionSimMaterial!.uniforms.uDelta.value            = delta
    this.simQuad.material = this.positionSimMaterial!
    renderer.setRenderTarget(this.positionRT[nextPing])
    renderer.render(this.simScene, this.simCamera)

    renderer.setRenderTarget(null)

    this.material.uniforms.uPositionTexture.value = this.positionRT[nextPing].texture
    this.material.uniforms.uVelocityTexture.value = this.velocityRT[nextPing].texture

    this.ping = nextPing
  }

  update(time: number, stateProgress: number, cursorSpeed: number): void {
    this.material.uniforms.uTime.value         = time
    this.material.uniforms.uProgress.value     = stateProgress
    this.material.uniforms.uCursorSpeed.value  = cursorSpeed
  }

  setVisible(visible: boolean): void {
    this.points.visible = visible
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
    this.positionRT?.forEach(rt => rt.dispose())
    this.velocityRT?.forEach(rt => rt.dispose())
    this.positionSimMaterial?.dispose()
    this.velocitySimMaterial?.dispose()
    this.simQuad?.geometry.dispose()
  }
}

// Standard (non-GPGPU) particle vertex shader for mid-tier CPU fallback
const FALLBACK_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute vec3  aColor;
  attribute float aAlpha;
  uniform float    uTime;
  uniform float    uPixelRatio;
  varying vec3     vColor;
  varying float    vAlpha;
  varying float    vVelocity;
  void main() {
    vColor = aColor;
    vAlpha = aAlpha;
    vVelocity = 0.0;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio * (300.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`
