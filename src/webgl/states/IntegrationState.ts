import {
  PlaneGeometry,
  ShaderMaterial,
  Mesh,
  Scene,
} from 'three'
import passthroughVertex   from '../shaders/shared/passthrough.vertex.glsl'
import integrationFragment from '../shaders/integration/fragment.glsl'
import type { DeviceCapabilities } from '../../types/mind'

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

    // Each visual family returns in turn — global progress
    // 0.87→0.92 over the state's 0.84→1.00 window (local ramps below).
    // The previous constants were 10× too small and all four families
    // snapped on within the first ~4% of the state.
    u.uBlend1.value = smooth01(ramp(stateProgress, 0.19, 0.31))
    u.uBlend2.value = smooth01(ramp(stateProgress, 0.25, 0.38))
    u.uBlend3.value = smooth01(ramp(stateProgress, 0.31, 0.44))
    u.uBlend4.value = smooth01(ramp(stateProgress, 0.38, 0.50))

    // Convergence toward neural-white ramps through the back half
    u.uConverge.value = smooth01(ramp(stateProgress, 0.55, 0.95))
  }

  setVisible(visible: boolean): void {
    this.mesh.visible = visible
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
  }
}

function ramp(value: number, start: number, end: number): number {
  if (value <= start) return 0
  if (value >= end)   return 1
  return (value - start) / (end - start)
}

function smooth01(t: number): number {
  return t * t * (3 - 2 * t)
}
