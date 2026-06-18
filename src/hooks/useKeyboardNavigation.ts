'use client'

import { useEffect } from 'react'
import { useMindStore }    from '@/store/mindStore'
import { setRawProgress }  from '@/animation/Ticker'
import { STATE_CONFIGS }   from '@/lib/stateConfigs'
import { MindState }       from '@/types/mind'

const STATE_ORDER = Object.values(MindState)
const STATE_PEAKS = STATE_ORDER.map(s => STATE_CONFIGS[s].peak)

function progressToScrollY(progress: number): number {
  return progress * (document.body.scrollHeight - window.innerHeight)
}

export function useKeyboardNavigation(enabled: boolean): void {
  const activeState = useMindStore(s => s.activeState)

  useEffect(() => {
    if (!enabled) return

    const NAV_KEYS = [
      'ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft',
      'PageDown', 'PageUp', 'Home', 'End',
    ]

    const onKeyDown = (e: KeyboardEvent) => {
      if (!NAV_KEYS.includes(e.key)) return
      const tag = (e.target as HTMLElement).tagName
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(tag)) return

      e.preventDefault()

      const currentIndex = STATE_ORDER.indexOf(activeState)
      let targetProgress: number

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
        case 'PageDown': {
          const next = Math.min(currentIndex + 1, STATE_PEAKS.length - 1)
          targetProgress = STATE_PEAKS[next]
          break
        }
        case 'ArrowUp':
        case 'ArrowLeft':
        case 'PageUp': {
          const prev = Math.max(currentIndex - 1, 0)
          targetProgress = STATE_PEAKS[prev]
          break
        }
        case 'Home':
          targetProgress = 0
          break
        case 'End':
          targetProgress = 1.0
          break
        default:
          return
      }

      window.scrollTo({ top: progressToScrollY(targetProgress), behavior: 'smooth' })
      setRawProgress(targetProgress)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled, activeState])
}
