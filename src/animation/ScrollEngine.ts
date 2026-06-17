import gsap from 'gsap'
import { ScrollTrigger }       from 'gsap/ScrollTrigger'
import { setRawProgress }      from './Ticker'
import { checkStateBoundary }  from './StateBoundary'
import { progressStore }       from '@/store/progressStore'
import { STATE_CONFIGS }       from '@/lib/stateConfigs'
import { MindState }           from '@/types/mind'
import { clamp }               from '@/lib/math'

gsap.registerPlugin(ScrollTrigger)

export function initScrollEngine(container: HTMLElement): () => void {
  const trigger = ScrollTrigger.create({
    trigger: container,
    start:   'top top',
    end:     'bottom bottom',
    scrub:   1.2,

    onUpdate: (self) => {
      setRawProgress(self.progress)
      progressStore.set({
        scrollVelocity: clamp(Math.abs(self.getVelocity()) / 2000, 0, 1),
        isScrolling:    Math.abs(self.getVelocity()) > 0.01,
      })
      checkStateBoundary(self.progress)
    },

    onLeave:     () => progressStore.set({ isScrolling: false }),
    onLeaveBack: () => progressStore.set({ isScrolling: false }),
  })

  initComponentPreloader()

  return () => trigger.kill()
}

function initComponentPreloader(): void {
  const thresholds = Object.values(STATE_CONFIGS)
    .filter(c => c.id !== MindState.AWAKENING)
    .map(c => ({ id: c.id, at: c.preloadAt, done: false }))

  progressStore.subscribe(({ mindProgress }) => {
    for (const t of thresholds) {
      if (!t.done && mindProgress >= t.at) {
        t.done = true
        preloadState(t.id)
      }
    }
  })
}

function preloadState(state: MindState): void {
  const load = () => {
    const map: Partial<Record<MindState, () => Promise<unknown>>> = {
      [MindState.RECOGNITION]:    () => import('@/components/states/RecognitionContent'),
      [MindState.DEPTH]:          () => import('@/components/states/DepthContent'),
      [MindState.DISORIENTATION]: () => import('@/components/states/DisorientationContent'),
      [MindState.DISCOVERY]:      () => import('@/components/states/DiscoveryContent'),
      [MindState.CLARITY]:        () => import('@/components/states/ClarityContent'),
      [MindState.EXPANSION]:      () => import('@/components/states/ExpansionContent'),
      [MindState.INTEGRATION]:    () => import('@/components/states/IntegrationContent'),
    }
    map[state]?.()
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(load)
  } else {
    setTimeout(load, 200)
  }
}
