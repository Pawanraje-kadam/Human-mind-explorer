import {
  PlaneGeometry,
  ShaderMaterial,
  Mesh,
  Group,
  Scene,
  Color,
  FogExp2,
} from 'three'
import passthroughVertex from '@/webgl/shaders/shared/passthrough.vertex.glsl'
import depthFragment     from '@/webgl/shaders/depth/fragment.glsl'
import type { DeviceCapabilities } from '@/types/mind'

// 12 translucent memory layers (6 on mobile), exponentially spaced
// in depth. Scroll-speed reactive: fast scroll blurs distant layers,
// slow/stopped scroll reveals full detail (Phase 8).

export class DepthState {
  private layers: Mesh[] = []
  private group:  Group
  private fog:    FogExp2

  constructor(scene: Scene, capabilities: DeviceCapabilities) {
    this.group = new Group()
    scene.add(this.group)

    const layerCount = capabilities.tier === 'low' ? 0 : capabilities.tier === 'mid' ? 8 : 12

    const indigoLight = new Color(0x4a3aa8)
    const indigoMid    = new Color(0x2d2270)
    const indigoDeep    = new Color(0x1a1440)

    for (let i = 0; i < layerCount; i++) {
      const geometry = new PlaneGeometry(8, 8, 32, 32)
      const layerDepth = i / Math.max(1, layerCount - 1)

      const material = new ShaderMaterial({
        vertexShader:   passthroughVertex,
        fragmentShader: depthFragment,
        transparent:    true,
        depthWrite:      false,
        uniforms: {
          uTime:         { value: 0 },
          uLayerIndex:   { value: i },
          uLayerDepth:   { value: layerDepth },
          uScrollSpeed:  { value: 0 },
          uIndigoLight:  { value: indigoLight },
          uIndigoMid:    { value: indigoMid },
          uIndigoDeep:   { value: indigoDeep },
        },
      })

      const mesh = new Mesh(geometry, material)
      // Exponential spacing — formula from Phase 8 spec
      const y = -0.5 * Math.pow(i * 1.4, 1.3)
      mesh.position.set(0, Math.max(y, -14), -2 - i * 0.8)
      this.group.add(mesh)
      this.layers.push(mesh)
    }

    this.fog = new FogExp2(0x1a1440, 0)
    scene.fog = this.fog
  }

  update(
    time: number,
    stateProgress: number,
    scrollSpeed: number
  ): void {
    for (const layer of this.layers) {
      const mat = layer.material as ShaderMaterial
      mat.uniforms.uTime.value        = time
      mat.uniforms.uScrollSpeed.value = scrollSpeed
    }

    // Fog density rises with scroll speed and overall state progress
    this.fog.density = 0.08 * stateProgress + scrollSpeed * 0.04
  }

  setVisible(visible: boolean): void {
    this.group.visible = visible
  }

  dispose(): void {
    for (const layer of this.layers) {
      layer.geometry.dispose()
      ;(layer.material as ShaderMaterial).dispose()
    }
    this.layers = []
  }
}
