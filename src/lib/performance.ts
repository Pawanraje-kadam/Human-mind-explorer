import type { DeviceCapabilities } from '@/types/mind'

export async function detectCapabilities(
  canvas: HTMLCanvasElement
): Promise<DeviceCapabilities> {
  const cores  = navigator.hardwareConcurrency ?? 2
 const memory = (navigator as any).deviceMemory ?? 2
  const gpuScore = await benchmarkGPU()

  if (gpuScore > 14 && cores >= 8 && memory >= 8) {
    return {
      tier: 'high',
      maxParticles:      150_000,
      maxDrawCalls:      12,
      usePostProcessing: true,
      useComplexShaders: true,
      useGPGPU:          true,
    }
  }

  if (gpuScore > 8 && cores >= 4) {
    return {
      tier: 'mid',
      maxParticles:      60_000,
      maxDrawCalls:      8,
      usePostProcessing: true,
      useComplexShaders: false,
      useGPGPU:          false,
    }
  }

  return {
    tier: 'low',
    maxParticles:      0,
    maxDrawCalls:      0,
    usePostProcessing: false,
    useComplexShaders: false,
    useGPGPU:          false,
  }
}

async function benchmarkGPU(): Promise<number> {
  return new Promise((resolve) => {
    const start = performance.now()
    let count   = 0
    const tick  = () => {
      count++
      if (count < 10) {
        requestAnimationFrame(tick)
      } else {
        const elapsed = performance.now() - start
        resolve(Math.min(20, 150 / elapsed))
      }
    }
    requestAnimationFrame(tick)
  })
}
