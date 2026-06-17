export interface ProgressState {
  mindProgress:   number
  cursorNorm:     { x: number; y: number }
  scrollVelocity: number
  isScrolling:    boolean
}

type Subscriber = (state: ProgressState) => void

let state: ProgressState = {
  mindProgress:   0,
  cursorNorm:     { x: 0.5, y: 0.5 },
  scrollVelocity: 0,
  isScrolling:    false,
}

const subscribers = new Set<Subscriber>()

export const progressStore = {
  get: (): ProgressState => state,

  set: (partial: Partial<ProgressState>): void => {
    state = { ...state, ...partial }
    subscribers.forEach(fn => fn(state))
  },

  subscribe: (fn: Subscriber): (() => void) => {
    subscribers.add(fn)
    return () => subscribers.delete(fn)
  },
}
