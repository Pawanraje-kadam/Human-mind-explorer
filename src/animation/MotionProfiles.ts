import { MindState } from '@/types/mind'

// Lerp speed per state — higher = more responsive, lower = more inertia
export const LERP_SPEEDS: Record<MindState, number> = {
  [MindState.AWAKENING]:      0.015,
  [MindState.RECOGNITION]:    0.060,
  [MindState.DEPTH]:          0.040,
  [MindState.DISORIENTATION]: 0.080,
  [MindState.DISCOVERY]:      0.040,
  [MindState.CLARITY]:        0.025,
  [MindState.EXPANSION]:      0.055,
  [MindState.INTEGRATION]:    0.015,
}
