import { registerEasings }           from './Easings'
import { initTicker }                from './Ticker'
import { initScrollEngine }          from './ScrollEngine'
import { applyReducedMotionOverrides } from './ReducedMotion'

export async function initAnimationSystem(
  scrollContainer: HTMLElement
): Promise<() => void> {
  const cleanups: Array<() => void> = []

  // Order is critical
  registerEasings()
  applyReducedMotionOverrides()

  cleanups.push(initTicker())
  cleanups.push(initScrollEngine(scrollContainer))

  return () => cleanups.forEach(fn => fn())
}
