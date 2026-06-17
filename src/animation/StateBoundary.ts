import { useMindStore }  from '@/store/mindStore'
import { STATE_CONFIGS } from '@/lib/stateConfigs'
import { MindState }     from '@/types/mind'

const HYSTERESIS = 0.005
let currentState: MindState = MindState.AWAKENING
let lastCrossedAt           = 0

export function checkStateBoundary(rawProgress: number): void {
  for (const config of Object.values(STATE_CONFIGS)) {
    if (
      rawProgress >= config.start + HYSTERESIS &&
      rawProgress <= config.end &&
      config.id !== currentState &&
      rawProgress - lastCrossedAt > 0.01
    ) {
      lastCrossedAt = rawProgress
      currentState  = config.id
      useMindStore.getState().setActiveState(config.id)
      break
    }
  }
}

export function resetBoundary(): void {
  currentState  = MindState.AWAKENING
  lastCrossedAt = 0
}
