'use client'

import { useEffect, useRef, useState } from 'react'
import { WebGLManager }        from '@/webgl/WebGLManager'
import { useDeviceCapability } from '@/hooks/useDeviceCapability'
import { WebGLErrorBoundary }  from './WebGLErrorBoundary'

function WebGLCanvasInner() {
  const ref              = useRef<HTMLCanvasElement>(null)
  const cap              = useDeviceCapability()
  const [contextLost, setContextLost] = useState(false)

  useEffect(() => {
    if (!ref.current || cap.tier === 'low') return

    const mgr = WebGLManager.getInstance()
    mgr.initialize(ref.current).catch(console.error)

    const onLost   = () => setContextLost(true)
    const onFailed = () => { throw new Error('WebGL context failed to restore') }

    window.addEventListener('hme:contextlost',   onLost)
    window.addEventListener('hme:contextfailed', onFailed)

    return () => {
      mgr.destroy()
      window.removeEventListener('hme:contextlost',   onLost)
      window.removeEventListener('hme:contextfailed', onFailed)
    }
  }, [cap.tier])

  if (cap.tier === 'low') return null

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
