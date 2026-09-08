import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Vector2,
  Vector3,
} from 'three'
import { createRenderer }   from './Renderer'
import { createScene, createCamera } from './Scene'
import { CameraRig }        from './CameraRig'
import { PostProcessing }   from './PostProcessing'
import { ParticleField }    from './ParticleField'
import { progressStore }    from '@/store/progressStore'
import { STATE_CONFIGS }    from '@/lib/stateConfigs'
import { MindState, DeviceCapabilities } from '@/types/mind'

import { AwakeningState }      from './states/AwakeningState'
import { RecognitionState }    from './states/RecognitionState'
import { DepthState }          from './states/DepthState'
import { DisorientationState } from './states/DisorientationState'
import { DiscoveryState }      from './states/DiscoveryState'
import { ClarityState }        from './states/ClarityState'
import { ExpansionState }      from './states/ExpansionState'
import { IntegrationState }    from './states/IntegrationState'

type AnyState =
  | AwakeningState | RecognitionState | DepthState | DisorientationState
  | DiscoveryState | ClarityState | ExpansionState | IntegrationState

export class WebGLManager {
  private static instance: WebGLManager | null = null

  private renderer!:     WebGLRenderer
  private scene!:        Scene
  private camera!:       PerspectiveCamera
  private cameraRig!:    CameraRig
  private post:          PostProcessing | null = null
  private capabilities!: DeviceCapabilities

  private awakening: AwakeningState | null = null
  private particles: ParticleField | null = null
  private loadedStates = new Map<MindState, AnyState>()

  private initialized   = false
  private isContextLost = false
  private reducedMotion = false
  private degraded      = false
  private canvas: HTMLCanvasElement | null = null
  private lastTime = 0

  // Cursor stillness tracking (Clarity: "what you look at becomes more real")
  private lastCursor      = { x: 0.5, y: 0.5 }
  private cursorStillTime = 0

  // Reduced motion & context lifecycle bookkeeping
  private frozenTime: number | null = null
  private contextListenersAdded = false

  private readonly onResizeBound = () => this.onResize()

  static getInstance(): WebGLManager {
    if (!WebGLManager.instance) {
      WebGLManager.instance = new WebGLManager()
    }
    return WebGLManager.instance
  }

  // Synchronous by design — once the caller has probed capabilities,
  // nothing here needs to await, which keeps strict-mode mount →
  // destroy → mount cycles race-free.
  initialize(canvas: HTMLCanvasElement, capabilities: DeviceCapabilities): void {
    if (typeof window === 'undefined') return
    if (this.initialized) return

    this.canvas       = canvas
    this.capabilities = capabilities

    this.renderer  = createRenderer(canvas, this.capabilities)
    this.scene     = createScene()
    this.camera    = createCamera()
    this.cameraRig = new CameraRig(this.camera)

    // GPGPU particle simulation needs float render targets — fall back
    // to the CPU particle path when the extension is missing.
    if (this.capabilities.useGPGPU) {
      const gl = this.renderer.getContext()
      const floatOK = !!gl.getExtension('EXT_color_buffer_float')
      if (!floatOK) {
        this.capabilities = { ...this.capabilities, useGPGPU: false }
      }
    }

    this.post = new PostProcessing(
      this.renderer, this.scene, this.camera, this.capabilities
    )

    this.awakening = new AwakeningState(this.scene, this.capabilities)
    this.particles = new ParticleField(this.scene, this.capabilities)

    this.initContextLossHandling()
    window.addEventListener('resize', this.onResizeBound)

    this.initialized = true
  }

  private initContextLossHandling(): void {
    if (!this.canvas || this.contextListenersAdded) return
    this.contextListenersAdded = true

    this.canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault()
      this.isContextLost = true
      window.dispatchEvent(new CustomEvent('hme:contextlost'))
    })

    this.canvas.addEventListener('webglcontextrestored', () => {
      this.isContextLost = false
      if (!this.canvas) return

      // Full rebuild on the restored context — every GL object held by
      // the old renderer died with the loss; a plain re-render shows
      // a black canvas. destroy() resets `initialized`, then initialize
      // re-wraps the (now live) context and re-uploads the world.
      try {
        this.destroy()
        this.initialize(this.canvas, this.capabilities)
      } catch {
        window.dispatchEvent(new CustomEvent('hme:contextfailed'))
      }
    })
  }

  update(time: number, delta: number): void {
    if (!this.initialized || this.isContextLost) return
    this.lastTime = time

    const { mindProgress, cursorNorm, scrollVelocity } = progressStore.get()

    // Reduced motion: time freezes (nothing animates) while
    // progress-driven changes still apply — the journey becomes a
    // sequence of stills the user steps through by scrolling.
    const t = this.reducedMotion ? (this.frozenTime ??= time) : time
    const d = this.reducedMotion ? 0 : delta

    if (!this.reducedMotion) {
      this.cameraRig.setCameraPositionFromProgress(mindProgress)
      this.cameraRig.update(d)

      if (this.post) {
        this.post.update(t)
        this.updateBloomByProgress(mindProgress)
      }
    }

    this.checkStateStreaming(mindProgress)

    const cursorWorld = this.cursorToWorld(cursorNorm)

    // Sustained cursor stillness (seconds) — drives Clarity slowdown
    const dx = Math.abs(cursorNorm.x - this.lastCursor.x)
    const dy = Math.abs(cursorNorm.y - this.lastCursor.y)
    if (Math.sqrt(dx * dx + dy * dy) > 0.003) {
      this.lastCursor      = { ...cursorNorm }
      this.cursorStillTime = 0
    } else {
      this.cursorStillTime += d
    }

    // Ambient particle field — the connective tissue between states
    this.particles?.update(t, d, mindProgress)

    this.awakening?.update(
      t, d,
      this.localProgress(MindState.AWAKENING, mindProgress),
      cursorNorm
    )

    // Cursor velocity — Expansion draws rivers with the pointer
    const cursorSpeed = clamp01(Math.sqrt(dx * dx + dy * dy) * 24)

    for (const [stateId, state] of this.loadedStates) {
      const local = this.localProgress(stateId, mindProgress)

      switch (stateId) {
        case MindState.RECOGNITION:
          (state as RecognitionState).update(t, d, local, cursorWorld)
          break
        case MindState.DEPTH:
          (state as DepthState).update(t, local, scrollVelocity)
          break
        case MindState.DISORIENTATION:
          (state as DisorientationState).update(t, local)
          break
        case MindState.DISCOVERY:
          (state as DiscoveryState).update(t, d, local)
          break
        case MindState.CLARITY:
          (state as ClarityState).update(
            t, d, local, cursorWorld, this.cursorStillTime
          )
          break
        case MindState.EXPANSION: {
          const exp = state as ExpansionState
          exp.simulate(
            this.renderer, d,
            cursorWorld, t, this.convergeFactor(mindProgress)
          )
          exp.update(t, d, local, cursorSpeed, cursorWorld)
          break
        }
        case MindState.INTEGRATION:
          (state as IntegrationState).update(t, local)
          break
      }
    }

    this.updateVisibility(mindProgress)
  }

  render(): void {
    if (!this.initialized || this.isContextLost || !this.post) return
    this.post.render()
  }

  // Expansion starts exploding from the state's first frame and pulls
  // back toward the origin as Integration approaches — one continuous
  // exhale/inhale across the boundary.
  private convergeFactor(mindProgress: number): number {
    const start = STATE_CONFIGS[MindState.EXPANSION].end - 0.06
    return Math.max(0, Math.min(1, (mindProgress - start) / 0.08))
  }

  private checkStateStreaming(mindProgress: number): void {
    for (const config of Object.values(STATE_CONFIGS)) {
      if (config.id === MindState.AWAKENING) continue

      const shouldBeLoaded = mindProgress >= config.preloadAt && mindProgress < config.disposeAt
      const isLoaded        = this.loadedStates.has(config.id)

      if (shouldBeLoaded && !isLoaded) {
        this.loadState(config.id)
      } else if (!shouldBeLoaded && isLoaded) {
        this.disposeState(config.id)
      }
    }
  }

  private loadState(id: MindState): void {
    let instance: AnyState

    switch (id) {
      case MindState.RECOGNITION:
        instance = new RecognitionState(this.scene, this.capabilities); break
      case MindState.DEPTH:
        instance = new DepthState(this.scene, this.capabilities); break
      case MindState.DISORIENTATION:
        instance = new DisorientationState(this.scene, this.capabilities); break
      case MindState.DISCOVERY:
        instance = new DiscoveryState(this.scene, this.capabilities); break
      case MindState.CLARITY:
        instance = new ClarityState(this.scene, this.capabilities); break
      case MindState.EXPANSION:
        instance = new ExpansionState(this.scene, this.capabilities); break
      case MindState.INTEGRATION:
        instance = new IntegrationState(this.scene, this.capabilities); break
      default:
        return
    }

    this.loadedStates.set(id, instance)
  }

  private disposeState(id: MindState): void {
    const instance = this.loadedStates.get(id)
    if (!instance) return
    instance.dispose()
    this.scene.remove(...this.ownedRoots(instance))
    this.loadedStates.delete(id)
  }

  // Each state exposes its root object(s) via a public field; collect
  // them so disposal detaches from the scene graph as well as freeing
  // GPU resources (previously only buffers were freed).
  private ownedRoots(state: AnyState): import('three').Object3D[] {
    const roots: import('three').Object3D[] = []
    const s = state as unknown as Record<string, unknown>
    for (const key of ['mesh', 'lines', 'points', 'group']) {
      const obj = s[key]
      if (obj && (obj as import('three').Object3D).isObject3D) {
        roots.push(obj as import('three').Object3D)
      }
    }
    return roots
  }

  private updateVisibility(mindProgress: number): void {
    const awakeningConfig   = STATE_CONFIGS[MindState.AWAKENING]
    const integrationConfig = STATE_CONFIGS[MindState.INTEGRATION]
    const inAwakeningRange   = mindProgress <= awakeningConfig.end + 0.02
    const inIntegrationRange = mindProgress >= integrationConfig.start + 0.06
    this.awakening?.setVisible(inAwakeningRange || inIntegrationRange)

    for (const [stateId, state] of this.loadedStates) {
      const config = STATE_CONFIGS[stateId]
      const visible = mindProgress >= config.start - 0.02 && mindProgress <= config.end + 0.02
      state.setVisible(visible)
    }
  }

  private localProgress(stateId: MindState, mindProgress: number): number {
    const config = STATE_CONFIGS[stateId]
    const span = config.end - config.start
    if (span <= 0) return 0
    return Math.max(0, Math.min(1, (mindProgress - config.start) / span))
  }

  // Accurate screen→world: unproject the cursor ray onto the z=0
  // plane in view space (replaces the old fixed ±2 fudge factor).
  private cursorToWorld(cursorNorm: { x: number; y: number }): Vector3 {
    const ndc = new Vector3(
      cursorNorm.x * 2 - 1,
      -(cursorNorm.y * 2 - 1),
      0.5
    )
    ndc.unproject(this.camera)

    const dir = ndc.sub(this.camera.position).normalize()
    if (Math.abs(dir.z) < 1e-5) return new Vector3(0, 0, 0)

    const t = -this.camera.position.z / dir.z
    return new Vector3().copy(this.camera.position).addScaledVector(dir, t)
  }

  private updateBloomByProgress(p: number): void {
    if (!this.post) return
    if      (p < 0.18) this.post.setBloom(2.4, 0.08, 0.9)
    else if (p < 0.28) this.post.setBloom(1.2, 0.12, 0.6)
    else if (p < 0.42) this.post.setBloom(0.8, 0.15, 1.2)
    else if (p < 0.50) this.post.setBloom(0.4, 0.20, 0.4)
    else if (p < 0.62) this.post.setBloom(1.4, 0.10, 0.5)
    else if (p < 0.72) this.post.setBloom(1.8, 0.08, 0.4)
    else if (p < 0.86) this.post.setBloom(2.0, 0.06, 1.4)
    else               this.post.setBloom(2.0, 0.08, 0.8)
  }

  getCameraRigRef(): CameraRig {
    return this.cameraRig
  }

  getCanvasElement(): HTMLCanvasElement | null {
    return this.canvas
  }

  setCameraRoll(degrees: number): void {
    this.cameraRig?.setRoll(degrees)
  }

  setReducedMotion(value: boolean): void {
    this.reducedMotion = value
  }

  setDisorientationChaos(value: number): void {
    const state = this.loadedStates.get(MindState.DISORIENTATION) as DisorientationState | undefined
    state?.setChaosOverride(value)
  }

  registerDiscoveryClick(normX: number, normY: number): void {
    const state = this.loadedStates.get(MindState.DISCOVERY) as DiscoveryState | undefined
    if (!state || !this.camera) return

    // Map the click onto the z=-1 plane the geometry is rendered on,
    // then into that plane's 0..1 UV space (plane spans 6×6 units).
    const ndc = new Vector3(normX * 2 - 1, -(normY * 2 - 1), 0.5)
    ndc.unproject(this.camera)
    const dir = ndc.sub(this.camera.position).normalize()
    if (Math.abs(dir.z) < 1e-5) return

    const t = (-1 - this.camera.position.z) / dir.z
    if (t <= 0) return

    const hit  = new Vector2(
      this.camera.position.x + dir.x * t,
      this.camera.position.y + dir.y * t
    )
    state.registerClick(hit.x / 6 + 0.5, hit.y / 6 + 0.5)
  }

  // Real quality degradation (was a no-op placeholder): drop to 1×
  // pixel ratio and shed the costly post passes. Called once by the
  // PerformanceMonitor when sustained fps falls below target.
  degradeQuality(): void {
    if (this.degraded || !this.initialized) return
    this.degraded = true

    this.renderer?.setPixelRatio(1)
    this.post?.setDegraded(true)
    this.onResize()
  }

  reduceParticles(_factor: number): void {
    this.degradeQuality()
  }

  disableSecondaryPasses(): void {
    this.post?.setDegraded(true)
  }

  beginTransition(_from: string, _to: string, _duration: number): void {
    // handled by streaming load/dispose + GSAP timelines
  }

  private onResize(): void {
    if (!this.initialized) return
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.cameraRig.resize()
    this.post?.resize()
  }

  destroy(): void {
    window.removeEventListener('resize', this.onResizeBound)

    this.awakening?.dispose()
    if (this.awakening) this.scene?.remove(this.awakening.mesh)
    this.awakening = null

    this.particles?.dispose()
    if (this.particles) this.scene?.remove(this.particles.points)
    this.particles   = null
    this.frozenTime  = null

    for (const id of Array.from(this.loadedStates.keys())) {
      this.disposeState(id)
    }

    this.post?.dispose()
    this.post = null

    // Dispose all GPU resources the renderer allocated. The canvas's
    // underlying context is left intact so a subsequent initialize()
    // on the same <canvas> re-wraps it cleanly (strict-mode safe).
    this.renderer?.dispose()

    this.initialized = false
    this.degraded    = false
  }
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}
