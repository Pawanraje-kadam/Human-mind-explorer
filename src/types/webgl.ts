import type { MindState } from './mind'

export interface BaseUniforms {
  uTime:         { value: number }
  uProgress:     { value: number }
  uMindProgress: { value: number }
  uResolution:   { value: { x: number; y: number } }
  uCursor:       { value: { x: number; y: number } }
}

export interface WebGLState {
  isInitialized: boolean
  currentState:  MindState
  reducedMotion: boolean
}

export interface CameraRigTarget {
  x:    number
  y:    number
  z:    number
  roll: number
}
