'use client'

import { useEffect, useRef, useState } from 'react'
import { WebGLManager }        from '@/webgl/WebGLManager'
import { useDeviceCapability } from '@/hooks/useDeviceCapability'
import { WebGLErrorBoundary }  from './WebGLErrorBoundary'

function WebGLCanvasInner() {
  const ref = useRef<HTMLCanvasElement>(null)
  const cap = useDeviceCapability()
  const [contextFailed, setContextFailed] = useState(false)

  useEffect(() => {
    // Wait for the capability probe — never spin up WebGL on a guess.
    if (!ref.current || !cap || cap.tier === 'low') return

    const mgr = WebGLManager.getInstance()

    try {
      mgr.initialize(ref.current, cap)
    } catch (err) {
      console.error('[HME] WebGL init failed', err)
      setContextFailed(true)
      return
    }

    const onLost   = () => { /* manager self-heals on restore */ }
    const onFailed = () => setContextFailed(true)

    window.addEventListener('hme:contextlost',   onLost)
    window.addEventListener('hme:contextfailed', onFailed)

    return () => {
      mgr.destroy()
      window.removeEventListener('hme:contextlost',   onLost)
      window.removeEventListener('hme:contextfailed', onFailed)
    }
  }, [cap])

  // Still probing, or a genuinely GL-less device — the DOM text
  // journey carries the experience either way.
  if (!cap || cap.tier === 'low') return null

  if (contextFailed) {
    return (
      <button
        onClick={() => window.location.reload()}
        className="fixed bottom-[8vh] left-1/2 -translate-x-1/2 z-40
                   font-mono text-xs text-neural-silver tracking-[0.08em]
                   hover:text-neural-white transition-colors duration-[400ms]
                   px-4 py-3 min-h-[44px]"
      >
        the mind lost its thread. tap to restore.
      </button>
    )
  }

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  )
}

export function WebGLCanvas() {
  return (
    <WebGLErrorBoundary>
      <WebGLCanvasInner />
    </WebGLErrorBoundary>
  )
}
