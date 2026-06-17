'use client'

import { useState, useEffect } from 'react'
import { useMindStore } from '@/store/mindStore'
import { MindState }    from '@/types/mind'

const STATE_LABELS: Record<MindState, string> = {
  [MindState.AWAKENING]:      '1/8 Awakening',
  [MindState.RECOGNITION]:    '2/8 Recognition',
  [MindState.DEPTH]:          '3/8 Depth',
  [MindState.DISORIENTATION]: '4/8 Disorientation',
  [MindState.DISCOVERY]:      '5/8 Discovery',
  [MindState.CLARITY]:        '6/8 Clarity',
  [MindState.EXPANSION]:      '7/8 Expansion',
  [MindState.INTEGRATION]:    '8/8 Integration',
}

// Shows arrow-key navigation hints once the user demonstrates
// keyboard usage (first Tab press). Hidden by default for mouse users.
export function KeyboardNavIndicator() {
  const [isKeyboard, setIsKeyboard] = useState(false)
  const activeState = useMindStore(s => s.activeState)

  useEffect(() => {
    const onKeyDown   = (e: KeyboardEvent) => { if (e.key === 'Tab') setIsKeyboard(true) }
    const onMouseDown = () => setIsKeyboard(false)

    window.addEventListener('keydown',   onKeyDown)
    window.addEventListener('mousedown', onMouseDown)
    return () => {
      window.removeEventListener('keydown',   onKeyDown)
      window.removeEventListener('mousedown', onMouseDown)
    }
  }, [])

  if (!isKeyboard) return null

  return (
    <div
      role="navigation"
      aria-label="Journey navigation"
      className="fixed bottom-[4vh] right-[8vh] z-50
                 font-mono text-xs text-neural-silver
                 tracking-[0.08em] pointer-events-none"
      style={{ opacity: 0.6 }}
    >
      <p>↑↓ navigate states</p>
      <p aria-live="polite" aria-atomic="true">{STATE_LABELS[activeState]}</p>
    </div>
  )
}
