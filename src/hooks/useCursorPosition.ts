'use client'

import { useEffect } from 'react'
import { progressStore } from '@/store/progressStore'

export function useCursorPosition(): void {
  useEffect(() => {
    // pointermove covers mouse, pen, and touch-drag — Recognition's
    // threads and Expansion's rivers respond on touchscreens too
    // (the previous mousemove-only listener ignored them entirely)
    const onMove = (e: PointerEvent) => {
      progressStore.set({
        cursorNorm: {
          x: e.clientX / window.innerWidth,
          y: e.clientY / window.innerHeight,
        },
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])
}
