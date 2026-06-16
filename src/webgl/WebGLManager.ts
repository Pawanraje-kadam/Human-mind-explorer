import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Vector3,
} from 'three'
import { createRenderer }   from './Renderer'
import { createScene, createCamera } from './Scene'
import { CameraRig }        from './CameraRig'
import { PostProcessing }   from './PostProcessing'
import { progressStore }    from '@/store/progressStore'
import { detectCapabilities } from '@/lib/performance'
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

// Union of every state class — each exposes update()/setVisible()/dispose()
type AnyState =
  | AwakeningState | RecognitionState | DepthState | DisorientationState
  | DiscoveryState | ClarityState | ExpansionState | IntegrationState

export class WebGLManager {
  private static instance: WebGLManager | null = null

  private renderer!:     WebGLRenderer
  private scene!:        Scene
  private camera!:       PerspectiveCamera
  private cameraRig!:    CameraRig
  private post!:         PostProcessing
  private capabilities!: DeviceCapabilities

  // Awakening is special: created once, never disposed, reused by Integration
  private awakening: AwakeningState | null = null

  // All other states: created/disposed dynamically as the user scrolls
  private loadedStates = new Map<MindState, AnyState>()

  private initialized   = false
  private isContextLost = false
  private reducedMotion = false
  private canvas: HTMLCanvasElement | null = null
  private lastTime = 0

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
    this.post      = new PostProcessing(
      this.renderer, this.scene, this.camera, this.capabilities
    )

    // Awakening orb is created immediately — it's visible from t=0
    // and persists for the entire experience lifetime (Phase 8 spec:
    // "the orb was always there")
    this.awakening = new AwakeningState(this.scene, this.capabilities)

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

  // ── Main per-frame update ───────────────────────────────

  update(time: number, delta: number): void {
    if (!this.initialized || this.isContextLost || this.reducedMotion) return
    this.lastTime = time

    const { mindProgress, cursorNorm, scrollVelocity } = progressStore.get()

    this.cameraRig.setCameraPositionFromProgress(mindProgress)
    this.cameraRig.update(delta)
    this.post.update(time)
    this.updateBloomByProgress(mindProgress)

    // Stream states in/out based on preloadAt / disposeAt thresholds
    this.checkStateStreaming(mindProgress)

    const cursorWorld = this.cursorToWorld(cursorNorm)

    // Awakening always updates (it's either the active visual or
    // sitting hidden, waiting to reappear in Integration)
    this.awakening?.update(time, delta, this.localProgress(MindState.AWAKENING, mindProgress), cursorNorm)

    for (const [stateId, state] of this.loadedStates) {
      const local = this.localProgress(stateId, mindProgress)

      switch (stateId) {
        case MindState.RECOGNITION:
          (state as RecognitionState).update(time, delta, local, cursorWorld)
          break
        case MindState.DEPTH:
          (state as DepthState).update(time, local, scrollVelocity)
          break
        case MindState.DISORIENTATION:
          (state as DisorientationState).update(time, local)
          break
        case MindState.DISCOVERY:
          (state as DiscoveryState).update(time, local)
          break
        case MindState.CLARITY: {
          const stillSeconds = scrollVelocity < 0.02 ? delta : 0
          ;(state as ClarityState).update(time, local, cursorWorld, stillSeconds)
          break
        }
        case MindState.EXPANSION: {
          const exp = state as ExpansionState
          const cursorSpeed = Math.min(1, scrollVelocity * 2)
          exp.simulate(this.renderer, delta, { x: cursorWorld.x, y: cursorWorld.y, z: cursorWorld.z }, time, 0)
          exp.update(time, local, cursorSpeed)
          break
        }
        case MindState.INTEGRATION:
          (state as IntegrationState).update(time, local)
          break
      }
    }

    // Visibility: only the state(s) within range of current progress show
    this.updateVisibility(mindProgress)
  }

  render(): void {
    if (!this.initialized || this.isContextLost) return
    this.post.render()
  }

  // ── State streaming — load ahead, dispose behind ────────

  private checkStateStreaming(mindProgress: number): void {
    for (const config of Object.values(STATE_CONFIGS)) {
      if (config.id === MindState.AWAKENING) continue // never streamed

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
    instance?.dispose()
    this.loadedStates.delete(id)
  }

  // ── Visibility — only show states relevant to current progress ──

  private updateVisibility(mindProgress: number): void {
    // Awakening visible at the very start, and again during Integration
    const awakeningConfig   = STATE_CONFIGS[MindState.AWAKENING]
    const integrationConfig = STATE_CONFIGS[MindState.INTEGRATION]
    const inAwakeningRange   = mindProgress <= awakeningConfig.end + 0.02
    const inIntegrationRange = mindProgress >= integrationConfig.start + 0.06 // orb reappears ~0.92
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

  private cursorToWorld(cursorNorm: { x: number; y: number }): Vector3 {
    // Maps normalized screen cursor (0..1) to an approximate world-space
    // point at the camera's look-at depth. Simplified projection —
    // sufficient for proximity-based interactions (thread growth,
    // cursor attraction, focus distance).
    const x = (cursorNorm.x - 0.5) * 4
    const y = -(cursorNorm.y - 0.5) * 4
    return new Vector3(x, y, 0)
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

  // ── Public API (used by DisorientationOverlay, hooks, etc.) ──

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

  // Called by DisorientationOverlay during the scripted takeover to
  // force the shard scatter amount directly, bypassing scroll-driven progress
  setDisorientationChaos(value: number): void {
    const state = this.loadedStates.get(MindState.DISORIENTATION) as DisorientationState | undefined
    state?.setChaosOverride(value)
  }

  // Called by DiscoveryContent on click — registers a reveal at the
  // given normalized screen position
  registerDiscoveryClick(normX: number, normY: number): void {
    const state = this.loadedStates.get(MindState.DISCOVERY) as DiscoveryState | undefined
    state?.registerClick(normX, normY)
  }

  reduceParticles(_factor: number): void {
    // Runtime degradation hook — currently a no-op placeholder since
    // particle counts are now fixed per-state at construction time
    // based on device tier. Future: could swap loaded states to a
    // lower-fidelity variant here.
  }

  disableSecondaryPasses(): void {
    this.post.setBloom(0.8, 0.2)
  }

  beginTransition(_from: string, _to: string, _duration: number): void {
    // Transition visuals are expressed through the streaming load/dispose
    // + visibility fade windows above, plus GSAP timelines in
    // TransitionOrchestrator for DOM-side effects.
  }

  private onResize(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.cameraRig.resize()
    this.post.resize()
  }

  destroy(): void {
    window.removeEventListener('resize', this.onResize.bind(this))

    this.awakening?.dispose()
    for (const id of Array.from(this.loadedStates.keys())) {
      this.disposeState(id)
    }

    this.post?.dispose()
    this.renderer?.dispose()
    WebGLManager.instance = null
    this.initialized = false
  }
}
