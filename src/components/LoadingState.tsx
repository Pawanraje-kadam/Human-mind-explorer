'use client'

import { useState, useEffect } from 'react'

// Bridges the gap between HTML parse and the first GSAP animation
// (Entry Gate orb fades in at ~0.8s). Hides once fonts are ready
// since the headline text is the LCP element.
export function LoadingState() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const hide = () => setVisible(false)

    if (document.fonts) {
      document.fonts.ready.then(hide)
    } else {
      setTimeout(hide, 1000)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[60] bg-void-black
                 flex items-center justify-center"
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="w-[2px] h-[2px] rounded-full bg-neural-white"
        style={{
          boxShadow: '0 0 8px 3px rgba(240,238,232,0.3)',
          animation: 'hme-pulse 0.8s ease-in-out infinite alternate',
        }}
      />
    </div>
  )
}
