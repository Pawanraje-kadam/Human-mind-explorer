import gsap from 'gsap'
import { WebGLManager }  from '@/webgl/WebGLManager'
import { progressStore } from '@/store/progressStore'
import { useMindStore }  from '@/store/mindStore'
import { LERP_SPEEDS }   from './MotionProfiles'
import { lerp, clamp }   from '@/lib/math'

let rawProgress     = 0
let displayProgress = 0
let initialized     = false

export function initTicker(): () => void {
  if (initialized) return () => {}
  initialized = true

  gsap.ticker.fps(60)
  gsap.ticker.lagSmoothing(500, 33)

  const tick = (time: number, delta: number) => {
    if (document.hidden) return

    const activeState = useMindStore.getState().activeState
    const lerpSpeed   = LERP_SPEEDS[activeState]

    displayProgress = lerp(displayProgress, rawProgress, lerpSpeed)
    const clamped   = clamp(displayProgress, 0, 1)

    progressStore.set({ mindProgress: clamped })

    const wgl = WebGLManager.getInstance()
    wgl.update(time * 0.001, delta * 0.001)
    wgl.render()
  }

  gsap.ticker.add(tick)

  return () => {
    gsap.ticker.remove(tick)
    initialized = false
  }
}

export function setRawProgress(progress: number): void {
  rawProgress = progress
}
