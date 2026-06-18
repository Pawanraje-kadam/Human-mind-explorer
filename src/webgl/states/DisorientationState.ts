import {
  PlaneGeometry,
  BufferGeometry,
  BufferAttribute,
  ShaderMaterial,
  Mesh,
  Group,
  Scene,
} from 'three'
import passthroughVertex      from '../shaders/shared/passthrough.vertex.glsl'
import disorientationFragment from '../shaders/disorientation/fragment.glsl'
import type { DeviceCapabilities } from '../../types/mind'

interface Shard {
  mesh:     Mesh
  velocity: { x: number; y: number; z: number }
  angVel:   { x: number; y: number; z: number }
  origin:   { x: number; y: number; z: number }
}

// Pre-fractured plane. Desktop: 140 triangles. Mobile: 60.
// uChaos (0→1) controls separation distance from origin.
// Driven externally by WebGLManager during the scripted takeover.

export class DisorientationState {
  private group: Group
  private shards: Shard[] = []
  private chaos = 0

  constructor(scene: Scene, capabilities: DeviceCapabilities) {
    this.group = new Group()
    scene.add(this.group)

    const triangleCount = capabilities.tier === 'low' ? 0 : capabilities.tier === 'mid' ? 90 : 140
    const gridSize = Math.ceil(Math.sqrt(triangleCount / 2))

    for (let i = 0; i < triangleCount; i++) {
      const size = 6 / gridSize
      const geometry = new PlaneGeometry(size, size)

      const material = new ShaderMaterial({
        vertexShader:   passthroughVertex,
        fragmentShader: disorientationFragment,
        transparent:    true,
        depthWrite:     false,
        side:           0, // FrontSide
        uniforms: {
          uTime:     { value: 0 },
          uChaos:    { value: 0 },
          uProgress: { value: 0 },
        },
      })

      const mesh = new Mesh(geometry, material)
      const col = i % gridSize
      const row = Math.floor(i / gridSize)
      const ox  = (col - gridSize / 2) * size
      const oy  = (row - gridSize / 2) * size

      mesh.position.set(ox, oy, 0)
      this.group.add(mesh)

      this.shards.push({
        mesh,
        origin:   { x: ox, y: oy, z: 0 },
        velocity: {
          x: (Math.random() - 0.5) * 0.004,
          y: (Math.random() - 0.5) * 0.004,
          z: (Math.random() - 0.5) * 0.002,
        },
        angVel: {
          x: (Math.random() - 0.5) * 0.1,
          y: (Math.random() - 0.5) * 0.1,
          z: (Math.random() - 0.5) * 0.1,
        },
      })
    }
  }

  update(time: number, stateProgress: number): void {
    // uChaos ramps 0→1 over first ~12% of state (0.42→0.47 in global terms,
    // here expressed as stateProgress 0.0→0.28 since state spans 0.42-0.50)
    this.chaos = Math.min(1, stateProgress / 0.28)

    for (const shard of this.shards) {
      const mat = shard.mesh.material as ShaderMaterial
      mat.uniforms.uTime.value     = time
      mat.uniforms.uChaos.value    = this.chaos
      mat.uniforms.uProgress.value = stateProgress

      shard.mesh.position.set(
        shard.origin.x + shard.velocity.x * this.chaos * 200,
        shard.origin.y + shard.velocity.y * this.chaos * 200,
        shard.origin.z + shard.velocity.z * this.chaos * 200
      )
      shard.mesh.rotation.x += shard.angVel.x * this.chaos
      shard.mesh.rotation.y += shard.angVel.y * this.chaos
      shard.mesh.rotation.z += shard.angVel.z * this.chaos
    }
  }

  // Called by DisorientationOverlay's GSAP timeline during the
  // scripted 3s takeover to force a freeze/reassembly motion
  setChaosOverride(value: number): void {
    this.chaos = value
  }

  setVisible(visible: boolean): void {
    this.group.visible = visible
  }

  dispose(): void {
    for (const shard of this.shards) {
      shard.mesh.geometry.dispose()
      ;(shard.mesh.material as ShaderMaterial).dispose()
    }
    this.shards = []
  }
}
