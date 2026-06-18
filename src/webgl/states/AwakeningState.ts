import {
  SphereGeometry,
  ShaderMaterial,
  Mesh,
  Scene,
  Vector2,
} from 'three'
import awakeningVertex   from '../shaders/awakening/vertex.glsl'
import awakeningFragment from '../shaders/awakening/fragment.glsl'
import { lerp } from '../../lib/math'
import type { DeviceCapabilities } from '../../types/mind'
// The Awakening orb. This object is never disposed for the lifetime
// of the experience — it persists through every state (hidden when
// not needed) and reappears at Integration. See Phase 8/10 notes:
// "the orb was always there."

export class AwakeningState {
  private geometry: SphereGeometry
  private material: ShaderMaterial
  public  mesh:      Mesh

  // Cursor-attraction interaction state (Phase 7 spec)
  private interacting   = 0    // 0 → 1, eases in when cursor held still
  private cursorStillMs = 0
  private lastCursor    = { x: 0.5, y: 0.5 }

  constructor(scene: Scene, _capabilities: DeviceCapabilities) {
    this.geometry = new SphereGeometry(0.008, 32, 32)

    this.material = new ShaderMaterial({
      vertexShader:   awakeningVertex,
      fragmentShader: awakeningFragment,
      transparent:    true,
      depthWrite:     false,
      uniforms: {
        uTime:         { value: 0 },
        uProgress:     { value: 0 },
        uPulse:        { value: 1 },
        uCursor:       { value: new Vector2(0.5, 0.5) },
        uInteracting:  { value: 0 },
      },
    })

    this.mesh = new Mesh(this.geometry, this.material)
    this.mesh.position.set(0, 0, 0)
    scene.add(this.mesh)
  }

  update(time: number, delta: number, stateProgress: number, cursor: { x: number; y: number }): void {
    const u = this.material.uniforms
    u.uTime.value     = time
    u.uProgress.value = stateProgress

    // Heartbeat pulse — 0.8s cycle, matches Entry Gate tempo
    u.uPulse.value = 0.6 + Math.sin(time * (Math.PI * 2) / 0.8) * 0.5 + 0.5

    // Cursor stillness detection — 2s threshold (Phase 7)
    const dx = Math.abs(cursor.x - this.lastCursor.x)
    const dy = Math.abs(cursor.y - this.lastCursor.y)
    const moved = Math.sqrt(dx * dx + dy * dy) > 0.003

    if (moved) {
      this.cursorStillMs = 0
      this.lastCursor = { ...cursor }
    } else {
      this.cursorStillMs += delta * 1000
    }

    const targetInteracting = this.cursorStillMs > 2000 ? 1 : 0
    this.interacting = lerp(this.interacting, targetInteracting, 0.02)

    u.uInteracting.value = this.interacting
    ;(u.uCursor.value as Vector2).set(cursor.x, cursor.y)

    // Auto-fallback: if no interaction by mid-state, trigger gently anyway
    if (stateProgress > 0.55 && this.interacting < 0.3) {
      this.interacting = lerp(this.interacting, 0.3, 0.01)
      u.uInteracting.value = this.interacting
    }
  }

  setVisible(visible: boolean): void {
    this.mesh.visible = visible
  }

  dispose(): void {
    // Intentionally NOT disposing geometry/material —
    // this object persists for the entire experience lifetime
    // and is reused by IntegrationState. Only hide via setVisible.
  }
}
