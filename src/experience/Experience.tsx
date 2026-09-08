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

    let disposed       = false
    let animCleanup:    (() => void) | undefined
    let monitorCleanup: (() => void) | undefined

    // One rAF is enough for the ScrollContainer to be laid out —
    // the previous 500ms setTimeout left an arbitrary dead window
    // where scrolling did nothing.
    const raf = requestAnimationFrame(() => {
      if (disposed || !scrollRef.current) return

      initAnimationSystem(scrollRef.current)
        .then(fn => {
          // The effect may have been torn down while the async
          // initialiser ran (strict mode) — dispose immediately.
          if (disposed) fn()
          else animCleanup = fn
        })

      monitorCleanup = initPerformanceMonitor()
      if (disposed) { monitorCleanup(); monitorCleanup = undefined }
    })

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      animCleanup?.()
      monitorCleanup?.()
    }
  }, [hasEntered])

  return (
    <>
      <AccessibilityLayer />
      <StateAnnouncer />

      <div
        aria-hidden="true"
        data-tier={capabilities?.tier ?? 'detecting'}
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
