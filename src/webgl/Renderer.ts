import {
  WebGLRenderer,
  SRGBColorSpace,
  ACESFilmicToneMapping,
} from 'three'
import type { DeviceCapabilities } from '@/types/mind'

export function createRenderer(
  canvas: HTMLCanvasElement,
  capabilities: DeviceCapabilities
): WebGLRenderer {
  const renderer = new WebGLRenderer({
    canvas,
    antialias:       capabilities.tier === 'high',
    alpha:           false,
    powerPreference: 'high-performance',
    stencil:         false,
    depth:           true,
  })

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, capabilities.tier === 'high' ? 2 : 1)
  )
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.outputColorSpace   = SRGBColorSpace
  renderer.toneMapping        = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  renderer.shadowMap.enabled  = false

  return renderer
}
