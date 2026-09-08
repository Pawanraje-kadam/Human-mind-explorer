import { MindState } from '@/types/mind'

// Design-token bridge: called when the journey crosses a state
// boundary. UI chrome (progress spine fill, hints, readout accents)
// reads these variables, so the interface itself changes color with
// the mind's state.
const STATE_ACCENT: Record<MindState, string> = {
  [MindState.AWAKENING]:      'var(--neural-white)',
  [MindState.RECOGNITION]:    'var(--amber-fire)',
  [MindState.DEPTH]:          'var(--indigo-light)',
  [MindState.DISORIENTATION]: 'var(--neural-silver)',
  [MindState.DISCOVERY]:      'var(--gold-pure)',
  [MindState.CLARITY]:        'var(--neural-white)',
  [MindState.EXPANSION]:      'var(--spectrum-violet)',
  [MindState.INTEGRATION]:    'var(--neural-white)',
}

let lastApplied: MindState | null = null

export function applyStateTheme(state: MindState): void {
  if (state === lastApplied) return
  lastApplied = state

  if (typeof document === 'undefined') return
  document.documentElement.style.setProperty(
    '--state-accent',
    STATE_ACCENT[state]
  )
}

export function resetStateTheme(): void {
  lastApplied = null
}
