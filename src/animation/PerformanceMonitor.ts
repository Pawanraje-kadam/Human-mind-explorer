import gsap from 'gsap'
import { WebGLManager } from '@/webgl/WebGLManager'
import { LERP_SPEEDS }  from './MotionProfiles'
import { MindState }    from '@/types/mind'

let frameCount    = 0
let totalTime     = 0
let degraded      = false
let lastTimestamp = 0

export function initPerformanceMonitor(): () => void {
  lastTimestamp = performance.now()

  const tick = () => {
    const now       = performance.now()
    const frameTime = now - lastTimestamp
    lastTimestamp   = now

    // Ignore tab-resume spikes
    if (frameTime > 0 && frameTime < 200) {
      frameCount++
      totalTime += frameTime
    }

    // Evaluate every 60 frames (~1 second)
    if (frameCount > 0 && frameCount % 60 === 0) {
      const avg   = totalTime / frameCount
      totalTime   = 0
      frameCount  = 0

      if (avg > 20 && !degraded) {
        degraded = true
        applyDegradation()
      }
    }
  }

  gsap.ticker.add(tick)
  return () => gsap.ticker.remove(tick)
}

function applyDegradation(): void {
  if (process.env.NODE_ENV !== 'production') {
    console.info('[HME] Performance below 50fps — reducing quality')
  }

  WebGLManager.getInstance().reduceParticles(0.5)
  WebGLManager.getInstance().disableSecondaryPasses()

  Object.keys(LERP_SPEEDS).forEach(key => {
    LERP_SPEEDS[key as MindState] = Math.max(
      LERP_SPEEDS[key as MindState] * 0.7,
      0.01
    )
  })
}
