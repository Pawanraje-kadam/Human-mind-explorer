'use client'

import { useState, useEffect }  from 'react'
import { detectCapabilities }   from '@/lib/performance'
import type { DeviceCapabilities } from '@/types/mind'

const DEFAULT: DeviceCapabilities = {
  tier:              'high',
  maxParticles:      150_000,
  maxDrawCalls:      12,
  usePostProcessing: true,
  useComplexShaders: true,
  useGPGPU:          true,
}

export function useDeviceCapability(): DeviceCapabilities {
  const [cap, setCap] = useState<DeviceCapabilities>(DEFAULT)

  useEffect(() => {
    const canvas = document.createElement('canvas')
    detectCapabilities(canvas).then(setCap)
  }, [])

  return cap
}
