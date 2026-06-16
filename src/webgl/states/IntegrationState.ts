import {
  PlaneGeometry,
  ShaderMaterial,
  Mesh,
  Scene,
} from 'three'
import passthroughVertex   from '@/webgl/shaders/shared/passthrough.vertex.glsl'
import integrationFragment from '@/webgl/shaders/integration/fragment.glsl'
import type { DeviceCapabilities } from '@/types/mind'

// Integration compositing layer. Per Phase 8's resolved architectural
// risk: this does NOT render all 8 prior shader systems individually.
// It renders 4 simplified "visual families" (reduced-fidelity replicas
// of Recognition / Depth / Discovery / Expansion signatures) blended
// via weighted uniforms on a single fullscreen-ish plane. The actual
// Awakening orb is handled separately by AwakeningState (never disposed,
// just hidden, then made visible again here).

export class IntegrationState {
  private geometry: PlaneGeometry
  private material: ShaderMaterial
  public  mesh:      Mesh

  constructor(scene: Scene, _capabilities: DeviceCapabilities) {
    this.geometry = new PlaneGeometry(10, 10)

    this.material = new ShaderMaterial({
      vertexShader:   passthroughVertex,
      fragmentShader: integrationFragment,
      transparent:    true,
      depthWrite:     false,
      uniforms: {
        uTime:      { value: 0 },
        uBlend1:    { value: 0 }, // Neural threads (amber)
        uBlend2:    { value: 0 }, // Memory planes (indigo)
        uBlend3:    { value: 0 }, // Sacred geometry (gold)
        uBlend4:    { value: 0 }, // Fluid particles (violet)
        uConverge:  { value: 0 },
      },
    })

    this.mesh = new Mesh(this.geometry, this.material)
    this.mesh.position.set(0, 0, -2)
    scene.add(this.mesh)
  }

  update(time: number, stateProgress: number): void {
    const u = this.material.uniforms
    u.uTime.value = time

    // Blend weights ramp in sequence per Phase 8 timing:
    // Family 1: 0.87→0.89 (state-local: 0.01→0.03 within INTEGRATION 0.86-1.0)
    // Family 2: 0.88→0.90
    // Family 3: 0.89→0.91
    // Family 4: 0.90→0.92
    // Converted to state-local progress (state spans 0.86 to 1.00):
    u.uBlend1.value = rampStateLocal(stateProgress, 0.007, 0.021)
    u.uBlend2.value = rampStateLocal(stateProgress, 0.014, 0.029)
    u.uBlend3.value = rampStateLocal(stateProgress, 0.021, 0.036)
    u.uBlend4.value = rampStateLocal(stateProgress, 0.029, 0.043)

    // Convergence toward neural-white ramps through the back half
    u.uConverge.value = Math.max(0, (stateProgress - 0.5) / 0.5)
  }

  setVisible(visible: boolean): void {
    this.mesh.visible = visible
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
  }
}

function rampStateLocal(stateProgress: number, start: number, end: number): number {
  if (stateProgress <= start) return 0
  if (stateProgress >= end)   return 1
  return (stateProgress - start) / (end - start)
}
