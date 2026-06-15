import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
} from 'three'
import { createRenderer }   from './Renderer'
import { createScene, createCamera } from './Scene'
import { CameraRig }        from './CameraRig'
import { ParticleSystem }   from './ParticleSystem'
import { PostProcessing }   from './PostProcessing'
import { progressStore }    from '@/store/progressStore'
import { detectCapabilities } from '@/lib/performance'
import { MindState, DeviceCapabilities } from '@/types/mind'

export class WebGLManager {
  private static instance: WebGLManager | null = null

  private renderer!:       WebGLRenderer
  private scene!:          Scene
  private camera!:         PerspectiveCamera
  private cameraRig!:      CameraRig
  private particles!:      ParticleSystem
  private post!:           PostProcessing
  private capabilities!:   DeviceCapabilities

  private initialized  = false
  private isContextLost = false
  private reducedMotion = false
  private canvas:      HTMLCanvasElement | null = null

  static getInstance(): WebGLManager {
    if (!WebGLManager.instance) {
      WebGLManager.instance = new WebGLManager()
    }
    return WebGLManager.instance
  }

  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    if (typeof window === 'undefined') return
    if (this.initialized) return

    this.canvas       = canvas
    this.capabilities = await detectCapabilities(canvas)

    this.renderer  = createRenderer(canvas, this.capabilities)
    this.scene     = createScene()
    this.camera    = createCamera()
    this.cameraRig = new CameraRig(this.camera)
    this.particles = new ParticleSystem(this.scene, this.capabilities)
    this.post      = new PostProcessing(
      this.renderer, this.scene, this.camera, this.capabilities
    )

    this.initContextLossHandling()
    window.addEventListener('resize', this.onResize.bind(this))

    this.initialized = true
  }

  private initContextLossHandling(): void {
    if (!this.canvas) return

    this.canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault()
      this.isContextLost = true
      window.dispatchEvent(new CustomEvent('hme:contextlost'))
    })

    this.canvas.addEventListener('webglcontextrestored', () => {
      this.isContextLost = false
      if (this.canvas) {
        this.initialize(this.canvas).catch(() => {
          window.dispatchEvent(new CustomEvent('hme:contextfailed'))
        })
      }
    })
  }

  update(time: number, delta: number): void {
    if (!this.initialized || this.isContextLost || this.reducedMotion) return

    const { mindProgress } = progressStore.get()

    this.cameraRig.setCameraPositionFromProgress(mindProgress)
    this.cameraRig.update(delta)
    this.particles.update(time, mindProgress)
    this.post.update(time)
    this.updateParticleColors(mindProgress)
    this.updateBloomByProgress(mindProgress)
  }

  render(): void {
    if (!this.initialized || this.isContextLost) return
    this.post.render()
  }

  private updateParticleColors(p: number): void {
    if      (p < 0.18) this.particles.setColorTarget(0.051, 0.082, 0.125, 0.10)
    else if (p < 0.28) this.particles.setColorTarget(0.910, 0.502, 0.227, 0.30)
    else if (p < 0.42) this.particles.setColorTarget(0.290, 0.227, 0.659, 0.25)
    else if (p < 0.50) this.particles.setColorTarget(0.941, 0.937, 0.914, 0.40)
    else if (p < 0.62) this.particles.setColorTarget(0.831, 0.659, 0.251, 0.30)
    else if (p < 0.72) this.particles.setColorTarget(0.941, 0.937, 0.914, 0.15)
    else if (p < 0.86) this.particles.setColorTarget(0.439, 0.251, 0.784, 0.50)
    else               this.particles.setColorTarget(0.941, 0.900, 0.800, 0.35)
  }

  private updateBloomByProgress(p: number): void {
    if      (p < 0.18) this.post.setBloom(2.4, 0.08, 0.9)
    else if (p < 0.28) this.post.setBloom(1.2, 0.12, 0.6)
    else if (p < 0.42) this.post.setBloom(0.8, 0.15, 1.2)
    else if (p < 0.50) this.post.setBloom(0.4, 0.20, 0.4)
    else if (p < 0.62) this.post.setBloom(1.4, 0.10, 0.5)
    else if (p < 0.72) this.post.setBloom(1.8, 0.08, 0.4)
    else if (p < 0.86) this.post.setBloom(2.0, 0.06, 1.4)
    else               this.post.setBloom(2.0, 0.08, 0.8)
  }

  // ── Public API ─────────────────────────────────────────

  getCameraRigRef(): CameraRig {
    return this.cameraRig
  }

  getCanvasElement(): HTMLCanvasElement | null {
    return this.canvas
  }

  setCameraRoll(degrees: number): void {
    this.cameraRig.setRoll(degrees)
  }

  setReducedMotion(value: boolean): void {
    this.reducedMotion = value
  }

  reduceParticles(factor: number): void {
    this.particles.setColorTarget(
      0.941 * factor, 0.937 * factor, 0.914 * factor, 0.2 * factor
    )
  }

  disableSecondaryPasses(): void {
    this.post.setBloom(0.8, 0.2)
  }

  beginTransition(_from: string, _to: string, _duration: number): void {
    // State-specific transition logic handled per-state geometry
  }

  private onResize(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.cameraRig.resize()
    this.post.resize()
  }

  destroy(): void {
    window.removeEventListener('resize', this.onResize.bind(this))
    this.particles?.dispose()
    this.post?.dispose()
    this.renderer?.dispose()
    WebGLManager.instance = null
    this.initialized = false
  }
}
