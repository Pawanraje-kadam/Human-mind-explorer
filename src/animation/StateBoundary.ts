import { useMindStore }     from '@/store/mindStore'
import { STATE_CONFIGS }    from '@/lib/stateConfigs'
import { applyStateTheme }  from '@/lib/stateTheme'
import { MindState }        from '@/types/mind'

const HYSTERESIS = 0.005
let currentState: MindState = MindState.AWAKENING
let lastCrossedAt           = 0

export function checkStateBoundary(rawProgress: number): void {
  // Debounce applies in both scroll directions — previously only
  // positive deltas passed, so scrolling *back up* the journey could
  // never leave the current state.
  if (Math.abs(rawProgress - lastCrossedAt) <= 0.01) return

  for (const config of Object.values(STATE_CONFIGS)) {
    if (
      rawProgress >= config.start + HYSTERESIS &&
      rawProgress <= config.end &&
      config.id !== currentState
    ) {
      lastCrossedAt = rawProgress
      currentState  = config.id
      useMindStore.getState().setActiveState(config.id)
      applyStateTheme(config.id)
      break
    }
  }
}

export function resetBoundary(): void {
  currentState  = MindState.AWAKENING
  lastCrossedAt = 0
  applyStateTheme(MindState.AWAKENING)
}
