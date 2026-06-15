import {
  BufferGeometry,
  BufferAttribute,
  Points,
  ShaderMaterial,
  Scene,
} from 'three'
import type { DeviceCapabilities } from '@/types/mind'

const vertexShader = /* glsl */`
attribute float aSize;
attribute vec3  aColor;
attribute float aAlpha;
uniform float   uTime;
uniform float   uPixelRatio;
varying vec3    vColor;
varying float   vAlpha;
void main() {
  vColor = aColor;
  vAlpha = aAlpha;
  vec4 mv     = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uPixelRatio * (300.0 / -mv.z);
  gl_Position  = projectionMatrix * mv;
}`

const fragmentShader = /* glsl */`
varying vec3  vColor;
varying float vAlpha;
void main() {
  vec2  c = gl_PointCoord - vec2(0.5);
  float d = length(c);
  if (d > 0.5) discard;
  float a      = smoothstep(0.5, 0.2, d) * vAlpha;
  gl_FragColor = vec4(vColor, a);
}`

export class ParticleSystem {
  private geometry:   BufferGeometry
  private material:   ShaderMaterial
  public  points:     Points
  private count:      number
  private positions:  Float32Array
  private colors:     Float32Array
  private sizes:      Float32Array
  private alphas:     Float32Array
  private velocities: Float32Array

  constructor(scene: Scene, capabilities: DeviceCapabilities) {
    this.count = Math.max(capabilities.maxParticles, 3000)

    this.positions  = new Float32Array(this.count * 3)
    this.colors     = new Float32Array(this.count * 3)
    this.sizes      = new Float32Array(this.count)
    this.alphas     = new Float32Array(this.count)
    this.velocities = new Float32Array(this.count * 3)

    this.initParticles()

    this.geometry = new BufferGeometry()
    this.geometry.setAttribute('position', new BufferAttribute(this.positions, 3))
    this.geometry.setAttribute('aColor',   new BufferAttribute(this.colors, 3))
    this.geometry.setAttribute('aSize',    new BufferAttribute(this.sizes, 1))
    this.geometry.setAttribute('aAlpha',   new BufferAttribute(this.alphas, 1))

    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite:  false,
      uniforms: {
        uTime:       { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
    })

    this.points = new Points(this.geometry, this.material)
    scene.add(this.points)
  }

  private initParticles(): void {
    for (let i = 0; i < this.count; i++) {
      const i3    = i * 3
      const r     = 8 * Math.cbrt(Math.random())
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)

      this.positions[i3]     = r * Math.sin(phi) * Math.cos(theta)
      this.positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      this.positions[i3 + 2] = r * Math.cos(phi)

      // Initial: void-surface colour
      this.colors[i3]     = 0.051
      this.colors[i3 + 1] = 0.082
      this.colors[i3 + 2] = 0.125

      this.sizes[i]  = 0.5 + Math.random()
      this.alphas[i] = 0.05 + Math.random() * 0.15

      this.velocities[i3]     = (Math.random() - 0.5) * 0.0001
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.0001
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.0001
    }
  }

  update(time: number, _mindProgress: number): void {
    this.material.uniforms.uTime.value = time

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3
      this.positions[i3]     += this.velocities[i3]
      this.positions[i3 + 1] += this.velocities[i3 + 1]
      this.positions[i3 + 2] += this.velocities[i3 + 2]
    }

    this.geometry.attributes.position.needsUpdate = true
  }

  setColorTarget(r: number, g: number, b: number, alpha: number): void {
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3
      this.colors[i3]     += (r     - this.colors[i3])     * 0.02
      this.colors[i3 + 1] += (g     - this.colors[i3 + 1]) * 0.02
      this.colors[i3 + 2] += (b     - this.colors[i3 + 2]) * 0.02
      this.alphas[i]       += (alpha - this.alphas[i])       * 0.02
    }
    this.geometry.attributes.aColor.needsUpdate = true
    this.geometry.attributes.aAlpha.needsUpdate = true
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
  }
}
