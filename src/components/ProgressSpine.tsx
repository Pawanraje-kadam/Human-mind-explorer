'use client'

import { useEffect, useRef } from 'react'
import { progressStore } from '@/store/progressStore'

// Right-edge progress indicator. Updates via direct DOM mutation
// on every scroll tick — never via React state — so it tracks at
// 60fps without triggering a single re-render.
export function ProgressSpine() {
  const fillRef = useRef<HTMLDivElement>(null)
  const dotRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return progressStore.subscribe(({ mindProgress }) => {
      if (fillRef.current) {
        fillRef.current.style.transform = `scaleY(${mindProgress})`
      }
      if (dotRef.current) {
        dotRef.current.style.top = `${mindProgress * 100}vh`
      }
    })
  }, [])

  return (
    <div
      aria-hidden="true"
      className="fixed right-[4vh] top-0 bottom-0 z-30 w-px pointer-events-none"
      style={{ background: 'var(--neural-ghost)', opacity: 0.2 }}
    >
      <div
        ref={fillRef}
        className="absolute inset-0 origin-top"
        style={{
          background: 'var(--state-accent)',
          transform:  'scaleY(0)',
          transition: 'background 0.6s ease',
        }}
      />
      <div
        ref={dotRef}
        data-role="progress-spine-fill"
        className="absolute left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full"
        style={{ background: 'var(--state-accent)' }}
      />
    </div>
  )
}
