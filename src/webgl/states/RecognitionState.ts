import {
  BufferGeometry,
  BufferAttribute,
  ShaderMaterial,
  LineSegments,
  SphereGeometry,
  Mesh,
  InstancedMesh,
  Scene,
  Color,
  Vector3,
} from 'three'
import passthroughVertex   from '@/webgl/shaders/shared/passthrough.vertex.glsl'
import recognitionFragment from '@/webgl/shaders/recognition/fragment.glsl'
import type { DeviceCapabilities } from '@/types/mind'

interface Thread {
  points:    Vector3[]
  age:       number
  maxLength: number
  growSpeed: number
  alive:     boolean
}

// Neural thread network. Desktop: 180 threads / 40 nodes.
// Mobile: 60 threads / 15 nodes. Cursor proximity accelerates
// thread growth and biases new thread spawn direction (Phase 8).

export class RecognitionState {
  private geometry: BufferGeometry
  private material: ShaderMaterial
  public  lines:     LineSegments

  private nodes:   Vector3[] = []
  private threads: Thread[]  = []
  private threadCount: number
  private nodeCount:   number
  private maxSegmentsPerThread = 12

  constructor(scene: Scene, capabilities: DeviceCapabilities) {
    this.threadCount = capabilities.tier === 'low' ? 0 : capabilities.tier === 'mid' ? 100 : 180
    this.nodeCount    = capabilities.tier === 'low' ? 0 : capabilities.tier === 'mid' ? 25  : 40

    this.initNodes()

    const maxVerts = this.threadCount * this.maxSegmentsPerThread * 2
    const positions = new Float32Array(maxVerts * 3)

    this.geometry = new BufferGeometry()
    this.geometry.setAttribute('position', new BufferAttribute(positions, 3))

    this.material = new ShaderMaterial({
      vertexShader:   passthroughVertex,
      fragmentShader: recognitionFragment,
      transparent:    true,
      depthWrite:     false,
      uniforms: {
        uTime:        { value: 0 },
        uProgress:    { value: 0 },
        uActivation:  { value: 0 },
        uAmberColor:  { value: new Color(0xe8803a) },
      },
    })

    this.lines = new LineSegments(this.geometry, this.material)
    scene.add(this.lines)

    for (let i = 0; i < this.threadCount; i++) {
      this.spawnThread()
    }
  }

  private initNodes(): void {
    for (let i = 0; i < this.nodeCount; i++) {
      const r     = 1.5 * Math.cbrt(Math.random())
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      this.nodes.push(new Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      ))
    }
  }

  private spawnThread(biasTowards?: Vector3): void {
    if (this.nodes.length === 0) return
    const origin = this.nodes[Math.floor(Math.random() * this.nodes.length)].clone()

    let dir = new Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    ).normalize()

    if (biasTowards) {
      dir = dir.lerp(biasTowards.clone().sub(origin).normalize(), 0.6).normalize()
    }

    this.threads.push({
      points:    [origin],
      age:       0,
      maxLength: 0.5 + Math.random(),
      growSpeed: 0.02 + Math.random() * 0.04,
      alive:     true,
    })
  }

  update(
    time: number,
    delta: number,
    stateProgress: number,
    cursorWorld: Vector3
  ): void {
    const u = this.material.uniforms
    u.uTime.value       = time
    u.uProgress.value   = stateProgress
    u.uActivation.value = Math.min(1, stateProgress * 1.5)

    // Grow / cull threads
    for (const thread of this.threads) {
      if (!thread.alive) continue

      const last = thread.points[thread.points.length - 1]
      const distToCursor = last.distanceTo(cursorWorld)
      const speedMultiplier = distToCursor < 0.4 ? 3 : 1

      thread.age += thread.growSpeed * speedMultiplier * delta * 60

      if (thread.age >= thread.maxLength) {
        thread.alive = false
        continue
      }

      if (thread.points.length < this.maxSegmentsPerThread) {
        const dir = new Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize().multiplyScalar(0.05)
        thread.points.push(last.clone().add(dir))
      }
    }

    // Respawn dead threads — preferentially toward cursor
    const deadCount = this.threads.filter(t => !t.alive).length
    for (let i = 0; i < deadCount; i++) {
      const idx = this.threads.findIndex(t => !t.alive)
      if (idx === -1) break
      this.threads.splice(idx, 1)
      this.spawnThread(Math.random() < 0.5 ? cursorWorld : undefined)
    }

    this.writeGeometry()
  }

  private writeGeometry(): void {
    const positions = this.geometry.attributes.position.array as Float32Array
    let ptr = 0

    for (const thread of this.threads) {
      for (let i = 0; i < thread.points.length - 1; i++) {
        const a = thread.points[i]
        const b = thread.points[i + 1]
        if (ptr + 6 > positions.length) break

        positions[ptr++] = a.x; positions[ptr++] = a.y; positions[ptr++] = a.z
        positions[ptr++] = b.x; positions[ptr++] = b.y; positions[ptr++] = b.z
      }
    }

    // Zero remaining buffer so stale segments don't render
    for (; ptr < positions.length; ptr++) positions[ptr] = 0

    this.geometry.attributes.position.needsUpdate = true
  }

  setVisible(visible: boolean): void {
    this.lines.visible = visible
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
  }
}
