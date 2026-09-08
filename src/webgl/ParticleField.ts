import {
  BufferGeometry,
  BufferAttribute,
  ShaderMaterial,
  Points,
  Scene,
  Color,
} from 'three'
import particleVertex   from './shaders/particle/vertex.glsl'
import particleFragment from './shaders/particle/fragment.glsl'
import { lerp } from '@/lib/math'
import type { DeviceCapabilities } from '@/types/mind'

// Persistent ambient particle field. Mounted once, lives for the
// entire journey; only its global alpha is modulated per state —
// the dust dims to near-nothing during Clarity and swells during
// Expansion. It is the connective tissue between the eight worlds.

const STATE_TARGET_ALPHA = [
  0.35, // AWAKENING
  0.50, // RECOGNITION
  0.45, // DEPTH
  0.30, // DISORIENTATION
  0.40, // DISCOVERY
  0.10, // CLARITY — everything falls away
  0.65, // EXPANSION
  0.55, // INTEGRATION
]

const STATE_PROGRESS_POINTS = [0, 0.18, 0.28, 0.42, 0.50, 0.62, 0.72, 0.86, 1.0]

export class ParticleField {
  private geometry: BufferGeometry
  private material: ShaderMaterial
  public  points:   Points

  private currentAlpha = STATE_TARGET_ALPHA[0]

  constructor(scene: Scene, capabilities: DeviceCapabilities) {
    const count = capabilities.tier === 'high' ? 4000
                : capabilities.tier === 'mid'  ? 1500
                : 0

    const positions = new Float32Array(count * 3)
    const colors    = new Float32Array(count * 3)
    const sizes     = new Float32Array(count)
    const alphas    = new Float32Array(count)
    const seeds     = new Float32Array(count)

    const neuralWhite = new Color(0xf0eee8)
    const amber       = new Color(0xe8803a)
    const indigo      = new Color(0x4a3aa8)
    const gold        = new Color(0xd4a840)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3

      // Hollow shell distribution — dust around the action, never
      // crowding the centre where the states perform
      const r     = 1.8 + Math.random() * 2.4
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      positions[i3]     = r * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i3 + 2] = r * Math.cos(phi)

      // Mostly neural-white, rare accents from the journey palette
      const roll = Math.random()
      const c = roll < 0.78 ? neuralWhite
              : roll < 0.86 ? amber
              : roll < 0.94 ? indigo
              : gold
      colors[i3] = c.r; colors[i3 + 1] = c.g; colors[i3 + 2] = c.b

      sizes[i]  = 0.8 + Math.random() * 1.6
      alphas[i] = 0.25 + Math.random() * 0.55
      seeds[i]  = Math.random()
    }

    this.geometry = new BufferGeometry()
    this.geometry.setAttribute('position', new BufferAttribute(positions, 3))
    this.geometry.setAttribute('aColor',   new BufferAttribute(colors, 3))
    this.geometry.setAttribute('aSize',    new BufferAttribute(sizes, 1))
    this.geometry.setAttribute('aAlpha',   new BufferAttribute(alphas, 1))
    this.geometry.setAttribute('aSeed',    new BufferAttribute(seeds, 1))

    this.material = new ShaderMaterial({
      vertexShader:   particleVertex,
      fragmentShader: particleFragment,
      transparent:    true,
      depthWrite:     false,
      uniforms: {
        uTime:        { value: 0 },
        uPixelRatio:  { value: Math.min(window.devicePixelRatio, 2) },
        uGlobalAlpha: { value: this.currentAlpha },
      },
    })

    this.points = new Points(this.geometry, this.material)
    this.points.frustumCulled = false
    scene.add(this.points)
  }

  update(time: number, delta: number, mindProgress: number): void {
    // Blend the field's brightness toward the active state's target
    const target = this.alphaForProgress(mindProgress)
    this.currentAlpha = lerp(this.currentAlpha, target, 0.03)

    this.material.uniforms.uTime.value        = time
    this.material.uniforms.uGlobalAlpha.value = this.currentAlpha

    // Whole-field slow rotation — the room breathes
    this.points.rotation.y += delta * 0.008
  }

  private alphaForProgress(mindProgress: number): number {
    for (let i = 0; i < STATE_PROGRESS_POINTS.length - 1; i++) {
      const a = STATE_PROGRESS_POINTS[i]
      const b = STATE_PROGRESS_POINTS[i + 1]
      if (mindProgress >= a && mindProgress <= b) {
        const t = (mindProgress - a) / Math.max(1e-5, b - a)
        return lerp(STATE_TARGET_ALPHA[i], STATE_TARGET_ALPHA[i + 1], t)
      }
    }
    return STATE_TARGET_ALPHA[STATE_TARGET_ALPHA.length - 1]
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
  }
}
