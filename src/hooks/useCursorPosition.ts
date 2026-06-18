'use client'

import { useEffect } from 'react'
import { progressStore } from '@/store/progressStore'

export function useCursorPosition(): void {
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      progressStore.set({
        cursorNorm: {
          x: e.clientX / window.innerWidth,
          y: e.clientY / window.innerHeight,
        },
      })
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])
}
