export const MindState = {
  AWAKENING:      'AWAKENING',
  RECOGNITION:    'RECOGNITION',
  DEPTH:          'DEPTH',
  DISORIENTATION: 'DISORIENTATION',
  DISCOVERY:      'DISCOVERY',
  CLARITY:        'CLARITY',
  EXPANSION:      'EXPANSION',
  INTEGRATION:    'INTEGRATION',
} as const

export type MindState = typeof MindState[keyof typeof MindState]

export interface StateConfig {
  id:        MindState
  start:     number
  end:       number
  peak:      number
  preloadAt: number
  disposeAt: number
}

export interface StateContent {
  headline:      string
  breathText:    string
  hint:          string
  interactionAt: number
}

export interface DeviceCapabilities {
  tier:              'high' | 'mid' | 'low'
  maxParticles:      number
  maxDrawCalls:      number
  usePostProcessing: boolean
  useComplexShaders: boolean
  useGPGPU:          boolean
}
