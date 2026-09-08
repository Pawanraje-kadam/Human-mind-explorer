import type { DeviceCapabilities } from '@/types/mind'

export async function detectCapabilities(): Promise<DeviceCapabilities> {
  // A device with no WebGL context at all is the true "low" tier.
  if (!supportsWebGL()) {
    return lowTier()
  }

  const cores    = navigator.hardwareConcurrency ?? 4
  const memory   = (navigator as { deviceMemory?: number }).deviceMemory ?? 4
  const gpuScore = await benchmarkGPU()

  // gpuScore ≈ sustained fps / 4:  60fps → 15 ·  48fps → 12 ·  30fps → 7.5
  if (gpuScore > 14 && cores >= 8 && memory >= 8) {
    return {
      tier:              'high',
      maxParticles:      150_000,
      maxDrawCalls:      12,
      usePostProcessing: true,
      useComplexShaders: true,
      useGPGPU:          true,
    }
  }

  if (gpuScore > 8 && cores >= 4) {
    return {
      tier:              'mid',
      maxParticles:      60_000,
      maxDrawCalls:      8,
      usePostProcessing: true,
      useComplexShaders: false,
      useGPGPU:          false,
    }
  }

  return lowTier()
}

function lowTier(): DeviceCapabilities {
  return {
    tier:              'low',
    maxParticles:      0,
    maxDrawCalls:      0,
    usePostProcessing: false,
    useComplexShaders: false,
    useGPGPU:          false,
  }
}

// Probe on a *throwaway* canvas — never the one handed to THREE later,
// so we don't pre-create a context with the wrong attributes.
function supportsWebGL(): boolean {
  try {
    const probe = document.createElement('canvas')
    const gl =
      probe.getContext('webgl2') ??
      probe.getContext('webgl') ??
      probe.getContext('experimental-webgl')
    return gl !== null
  } catch {
    return false
  }
}

// Measures sustained rAF throughput over 12 frames and maps it to a
// 0–20 score. Previously this divided a constant by the elapsed *ms*,
// which scored a healthy 60Hz display at ~0.9 and tiered every real
// device as "low" (WebGL disabled). Scoring from frames-per-second fixes
// that: any display refreshing ≥ ~33fps reaches the mid tier.
async function benchmarkGPU(): Promise<number> {
  return new Promise((resolve) => {
    const FRAMES = 12
    let count = 0
    let start = 0

    const tick = (now: number) => {
      if (count === 0) start = now
      count++
      if (count < FRAMES) {
        requestAnimationFrame(tick)
      } else {
        const elapsed = Math.max(1, now - start)
        const fps     = ((FRAMES - 1) * 1000) / elapsed
        resolve(Math.min(20, fps / 4))
      }
    }
    requestAnimationFrame(tick)
  })
}
