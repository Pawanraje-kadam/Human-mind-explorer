import {
  WebGLRenderer,
  Scene,
  Camera,
  Vector2,
  Color,
} from 'three'
import { EffectComposer }  from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass }      from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass }      from 'three/examples/jsm/postprocessing/ShaderPass.js'
import type { DeviceCapabilities } from '@/types/mind'

const VignetteShader = {
  uniforms: {
    tDiffuse:   { value: null },
    uIntensity: { value: 0.7 },
    uColor:     { value: new Color(0x020408) },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float     uIntensity;
    uniform vec3      uColor;
    varying vec2      vUv;
    void main() {
      vec4  tex  = texture2D(tDiffuse, vUv);
      vec2  uv2  = vUv * 2.0 - 1.0;
      float vign = 1.0 - dot(uv2, uv2) * uIntensity * 0.5;
      vign = clamp(vign, 0.0, 1.0);
      vec3  col  = mix(uColor, tex.rgb, vign);
      gl_FragColor = vec4(col, tex.a);
    }
  `,
}

const FilmGrainShader = {
  uniforms: {
    tDiffuse:   { value: null },
    uIntensity: { value: 0.04 },
    uTime:      { value: 0 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float     uIntensity;
    uniform float     uTime;
    varying vec2      vUv;
    float hash(vec2 p) {
      return fract(sin(dot(p + uTime, vec2(127.1, 311.7))) * 43758.5453);
    }
    void main() {
      vec4  tex   = texture2D(tDiffuse, vUv);
      float grain = (hash(vUv * 800.0) - 0.5) * uIntensity;
      gl_FragColor = vec4(tex.rgb + grain, tex.a);
    }
  `,
}

export class PostProcessing {
  private composer:      EffectComposer
  private bloomPass:     UnrealBloomPass
  private vignettePass:  ShaderPass
  private grainPass:     ShaderPass
  private capabilities:  DeviceCapabilities

  public bloomStrength     = 2.4
  public bloomThreshold    = 0.08
  public bloomRadius       = 0.9
  public vignetteIntensity = 0.7
  public grainIntensity    = 0.04

  constructor(
    renderer: WebGLRenderer,
    scene: Scene,
    camera: Camera,
    capabilities: DeviceCapabilities
  ) {
    this.capabilities = capabilities
    this.composer     = new EffectComposer(renderer)

    this.composer.addPass(new RenderPass(scene, camera))

    this.bloomPass = new UnrealBloomPass(
      new Vector2(window.innerWidth, window.innerHeight),
      this.bloomStrength,
      this.bloomRadius,
      this.bloomThreshold
    )
    if (capabilities.usePostProcessing) {
      this.composer.addPass(this.bloomPass)
    }

    this.vignettePass = new ShaderPass(VignetteShader)
    this.composer.addPass(this.vignettePass)

    this.grainPass = new ShaderPass(FilmGrainShader)
    if (capabilities.tier === 'high') {
      this.composer.addPass(this.grainPass)
    }
  }

  update(time: number): void {
    // Lerp bloom toward targets
    this.bloomPass.strength  += (this.bloomStrength  - this.bloomPass.strength)  * 0.05
    this.bloomPass.radius    += (this.bloomRadius    - this.bloomPass.radius)    * 0.05
    this.bloomPass.threshold += (this.bloomThreshold - this.bloomPass.threshold) * 0.05

    const vU = this.vignettePass.uniforms as Record<string, { value: unknown }>
    const curVig = vU.uIntensity.value as number
    vU.uIntensity.value = curVig + (this.vignetteIntensity - curVig) * 0.05

    const gU = this.grainPass.uniforms as Record<string, { value: unknown }>
    gU.uTime.value      = time
    gU.uIntensity.value = this.grainIntensity
  }

  setBloom(strength: number, threshold: number, radius?: number): void {
    this.bloomStrength  = strength
    this.bloomThreshold = threshold
    if (radius !== undefined) this.bloomRadius = radius
  }

  setVignette(intensity: number): void {
    this.vignetteIntensity = intensity
  }

  setGrain(intensity: number): void {
    this.grainIntensity = intensity
  }

  render(): void {
    this.composer.render()
  }

  resize(): void {
    this.composer.setSize(window.innerWidth, window.innerHeight)
    this.bloomPass.setSize(window.innerWidth, window.innerHeight)
  }

  dispose(): void {
    this.composer.dispose()
  }
}
