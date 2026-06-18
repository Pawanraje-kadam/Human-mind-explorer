import {
  PlaneGeometry,
  ShaderMaterial,
  Mesh,
  Scene,
  Color,
  Vector2,
} from 'three'
import passthroughVertex from '../shaders/shared/passthrough.vertex.glsl'
import discoveryFragment from '../shaders/discovery/fragment.glsl'
import { lerp } from '../../lib/math'
import type { DeviceCapabilities } from '../../types/mind'

interface ClickReveal {
  center:   Vector2
  progress: number // 0 → 1, drives expanding reveal ring
}

// Sacred geometry (Flower of Life) rendered on a single plane via
// SDF-style circle math in the fragment shader. Up to 8 click reveals
// tracked simultaneously (Phase 8).

export class DiscoveryState {
  private geometry: PlaneGeometry
  private material: ShaderMaterial
  public  mesh:      Mesh

  private reveals: ClickReveal[] = []
  private maxReveals = 8

  constructor(scene: Scene, _capabilities: DeviceCapabilities) {
    this.geometry = new PlaneGeometry(6, 6)

    this.material = new ShaderMaterial({
      vertexShader:   passthroughVertex,
      fragmentShader: discoveryFragment,
      transparent:    true,
      depthWrite:     false,
      uniforms: {
        uTime:          { value: 0 },
        uProgress:      { value: 0 },
        uRevealRadius:  { value: 0 },
        uRevealCenter:  { value: new Vector2(0.5, 0.5) },
        uGoldColor:     { value: new Color(0xd4a840) },
        uGoldPale:      { value: new Color(0xe8d090) },
      },
    })

    this.mesh = new Mesh(this.geometry, this.material)
    this.mesh.position.set(0, 0, -1)
    scene.add(this.mesh)
  }

  update(time: number, stateProgress: number): void {
    const u = this.material.uniforms
    u.uTime.value     = time
    u.uProgress.value = stateProgress

    // Advance and merge active reveals — fragment shader currently
    // only consumes a single center/radius pair, so we render the
    // most recent unfinished reveal (simple, performant approximation
    // of the "up to 8 reveals" spec — see note below)
    for (const reveal of this.reveals) {
      reveal.progress = Math.min(1, reveal.progress + 0.02)
    }
    this.reveals = this.reveals.filter(r => r.progress < 1 || this.reveals.length <= 1)

    const active = this.reveals[this.reveals.length - 1]
    if (active) {
      ;(u.uRevealCenter.value as Vector2).copy(active.center)
      u.uRevealRadius.value = lerp(0, 2.5, active.progress)
    }
  }

  registerClick(normX: number, normY: number): void {
    if (this.reveals.length >= this.maxReveals) {
      this.reveals.shift()
    }
    this.reveals.push({
      center:   new Vector2(normX, normY),
      progress: 0,
    })
  }

  setVisible(visible: boolean): void {
    this.mesh.visible = visible
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
  }
}
