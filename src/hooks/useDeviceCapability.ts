'use client'

import { useState, useEffect }  from 'react'
import { detectCapabilities }   from '@/lib/performance'
import type { DeviceCapabilities } from '@/types/mind'

// Runs the GPU capability probe exactly once per session and shares
// the result. `null` = still probing — callers must not assume a tier
// before this resolves (the previous "default to high" caused every
// device to boot a high-tier WebGL context, then tear it down).
let cached: DeviceCapabilities | null = null
let inflight: Promise<DeviceCapabilities> | null = null

function probe(): Promise<DeviceCapabilities> {
  if (!inflight) {
    inflight = detectCapabilities().then(c => { cached = c; return c })
  }
  return inflight
}

export function useDeviceCapability(): DeviceCapabilities | null {
  const [cap, setCap] = useState<DeviceCapabilities | null>(cached)

  useEffect(() => {
    if (cached) return
    let live = true
    probe().then(c => { if (live) setCap(c) })
    return () => { live = false }
  }, [])

  return cap
}
