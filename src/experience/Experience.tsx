'use client'

import { useEffect, useRef }        from 'react'
import { useMindStore }             from '@/store/mindStore'
import { initAnimationSystem }      from '@/animation'
import { initPerformanceMonitor }   from '@/animation/PerformanceMonitor'
import { useReducedMotion }         from '@/hooks/useReducedMotion'
import { useDeviceCapability }      from '@/hooks/useDeviceCapability'
import { useCursorPosition }        from '@/hooks/useCursorPosition'
import { useKeyboardNavigation }    from '@/hooks/useKeyboardNavigation'
import { AccessibilityLayer }       from '@/components/AccessibilityLayer'
import { WebGLCanvas }              from '@/components/Canvas'
import { ProgressSpine }            from '@/components/ProgressSpine'
import { DiegeticReadout }          from '@/components/DiegeticReadout'
import { StateContentManager }      from '@/components/StateContentManager'
import { StateAnnouncer }           from '@/components/StateAnnouncer'
import { KeyboardNavIndicator }     from '@/components/KeyboardNavIndicator'
import { EntryGate }                from './EntryGate'
import { ScrollContainer }          from './ScrollContainer'
import { ExitPortal }               from './ExitPortal'
import { DisorientationOverlay }    from './DisorientationOverlay'

export function Experience() {
  const scrollRef      = useRef<HTMLDivElement>(null)
  const hasEntered     = useMindStore(s => s.hasEntered)
  const hasCompleted   = useMindStore(s => s.hasCompleted)
  const prefersReduced = useReducedMotion()
  const capabilities   = useDeviceCapability()

  useCursorPosition()
  useKeyboardNavigation(hasEntered)

  useEffect(() => {
    if (!hasEntered) return

    // Small delay to ensure ScrollContainer is mounted and measured
    const timer = setTimeout(() => {
      if (!scrollRef.current) return

      let animCleanup:    (() => void) | undefined
      let monitorCleanup: (() => void) | undefined

      initAnimationSystem(scrollRef.current)
        .then(fn => { animCleanup = fn })

      monitorCleanup = initPerformanceMonitor()

      return () => {
        animCleanup?.()
        monitorCleanup?.()
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [hasEntered])

  return (
    <>
      <AccessibilityLayer />
      <StateAnnouncer />

      <div
        aria-hidden="true"
        data-tier={capabilities.tier}
        data-reduced-motion={String(prefersReduced)}
        className="relative w-full"
      >
        {!hasEntered && <EntryGate />}

        {hasEntered && (
          <>
            <WebGLCanvas />
            <ScrollContainer ref={scrollRef} />

            <div className="fixed inset-0 z-10 pointer-events-none">
              <StateContentManager />
              <ProgressSpine />
              <DiegeticReadout />
            </div>

            <DisorientationOverlay />
          </>
        )}

        {hasCompleted && <ExitPortal />}
      </div>

      <KeyboardNavIndicator />
    </>
  )
}
