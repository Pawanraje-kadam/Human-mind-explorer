import {
  IcosahedronGeometry,
  BufferAttribute,
  ShaderMaterial,
  Mesh,
  Scene,
  Color,
  Vector3,
} from 'three'
import clarityVertex   from '../shaders/clarity/vertex.glsl'
import clarityFragment from '../shaders/clarity/fragment.glsl'
import type { DeviceCapabilities } from '../../types/mind'

// Single icosahedron wireframe. Requires a per-vertex barycentric
// attribute for the fragment shader's edge-detection wireframe
// technique — IcosahedronGeometry does not include this by default,
// so we inject it here. Geometry is non-indexed (each triangle has
// its own 3 unique vertices), so the (1,0,0)/(0,1,0)/(0,0,1) pattern
// can be assigned directly per vertex-triple.

function addBarycentricAttribute(geometry: IcosahedronGeometry): void {
  const vertexCount = geometry.attributes.position.count
  const barycentric = new Float32Array(vertexCount * 3)

  for (let i = 0; i < vertexCount; i += 3) {
    // Vertex 0 of each triangle
    barycentric[i * 3 + 0] = 1; barycentric[i * 3 + 1] = 0; barycentric[i * 3 + 2] = 0
    // Vertex 1
    barycentric[(i + 1) * 3 + 0] = 0; barycentric[(i + 1) * 3 + 1] = 1; barycentric[(i + 1) * 3 + 2] = 0
    // Vertex 2
    barycentric[(i + 2) * 3 + 0] = 0; barycentric[(i + 2) * 3 + 1] = 0; barycentric[(i + 2) * 3 + 2] = 1
  }

  geometry.setAttribute('aBarycentric', new BufferAttribute(barycentric, 3))
}

export class ClarityState {
  private geometry: IcosahedronGeometry
  private material: ShaderMaterial
  public  mesh:      Mesh

  private rotationSpeed = { x: 0.002, y: 0.005 }

  constructor(scene: Scene, _capabilities: DeviceCapabilities) {
    // detail level 1, non-indexed by default in modern Three.js —
    // verified required for the per-triangle barycentric trick to work
    this.geometry = new IcosahedronGeometry(0.3, 1)
    this.geometry = this.geometry.toNonIndexed()
    addBarycentricAttribute(this.geometry)

    this.material = new ShaderMaterial({
      vertexShader:   clarityVertex,
      fragmentShader: clarityFragment,
      transparent:    true,
      depthWrite:     false,
      wireframe:      false, // wireframe is hand-rolled in fragment shader
      uniforms: {
        uTime:         { value: 0 },
        uProgress:     { value: 0 },
        uBreath:       { value: 1 },
        uFocusDist:    { value: 1 },
        uCursorWorld:  { value: new Vector3() },
        uNeuralWhite:  { value: new Color(0xf0eee8) },
      },
    })

    this.mesh = new Mesh(this.geometry, this.material)
    this.mesh.position.set(0, 0, 0)
    scene.add(this.mesh)
  }

  update(
    time: number,
    stateProgress: number,
    cursorWorld: Vector3,
    cursorStillSeconds: number
  ): void {
    const u = this.material.uniforms
    u.uTime.value     = time
    u.uProgress.value = stateProgress

    // Subtle breathing scale — barely perceptible (Phase 8 spec: ±0.008)
    u.uBreath.value = 1 + Math.sin(time * 0.3) * 0.008

    // Rotation slows during sustained cursor stillness
    const slowFactor = cursorStillSeconds > 3 ? 0.2 : 1
    this.mesh.rotation.y += this.rotationSpeed.y * slowFactor
    this.mesh.rotation.x += this.rotationSpeed.x * slowFactor

    ;(u.uCursorWorld.value as Vector3).copy(cursorWorld)
    u.uFocusDist.value = this.mesh.position.distanceTo(cursorWorld) / 2
  }

  setVisible(visible: boolean): void {
    this.mesh.visible = visible
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
  }
}
