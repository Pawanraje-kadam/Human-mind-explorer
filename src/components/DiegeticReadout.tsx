'use client'

import { useEffect, useRef } from 'react'
import { progressStore } from '@/store/progressStore'
import { useMindStore }  from '@/store/mindStore'

// Bottom-left state readout — "recognition.exe — 0.23 / 1.0"
// The progress number updates via direct DOM mutation (60fps,
// no React re-render). The state name only re-renders on the
// 8 discrete boundary crossings via Zustand.
export function DiegeticReadout() {
  const progressSpanRef = useRef<HTMLSpanElement>(null)
  const activeState     = useMindStore(s => s.activeState)

  useEffect(() => {
    return progressStore.subscribe(({ mindProgress }) => {
      if (progressSpanRef.current) {
        progressSpanRef.current.textContent = mindProgress.toFixed(2)
      }
    })
  }, [])

  return (
    <div
      aria-hidden="true"
      className="fixed bottom-[4vh] left-[4vh] z-30
                 font-mono text-[0.563rem] text-neural-ghost
                 tracking-[0.08em] pointer-events-none"
      style={{ opacity: 0.4 }}
    >
      <span data-readout-state>
        {activeState.toLowerCase()}.exe —{' '}
      </span>
      <span ref={progressSpanRef}>0.00</span>
      <span> / 1.0</span>
    </div>
  )
}
