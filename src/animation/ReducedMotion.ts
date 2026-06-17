import gsap from 'gsap'
import { WebGLManager } from '@/webgl/WebGLManager'
import { LERP_SPEEDS }  from './MotionProfiles'
import { MindState }    from '@/types/mind'

export function applyReducedMotionOverrides(): void {
  if (typeof window === 'undefined') return

  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  if (!mq.matches) return

  // All GSAP animations complete 10× faster — effectively instant
  gsap.globalTimeline.timeScale(10)

  // All state transitions are instant (no lerp resistance)
  Object.keys(LERP_SPEEDS).forEach(key => {
    LERP_SPEEDS[key as MindState] = 1.0
  })

  // Signal WebGL to disable camera movement and particle animation
  WebGLManager.getInstance().setReducedMotion(true)
}
