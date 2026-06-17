import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { MindState } from '@/types/mind'

interface MindStore {
  activeState:      MindState
  previousState:    MindState | null
  isTransitioning:  boolean
  hasEntered:       boolean
  hasCompleted:     boolean
  interactionFlags: Record<MindState, boolean>

  setActiveState:   (state: MindState) => void
  setTransitioning: (value: boolean) => void
  markEntered:      () => void
  markCompleted:    () => void
  markInteracted:   (state: MindState) => void
}

const defaultFlags = Object.fromEntries(
  Object.values(MindState).map(s => [s, false])
) as Record<MindState, boolean>

export const useMindStore = create<MindStore>()(
  subscribeWithSelector((set) => ({
    activeState:      MindState.AWAKENING,
    previousState:    null,
    isTransitioning:  false,
    hasEntered:       false,
    hasCompleted:     false,
    interactionFlags: { ...defaultFlags },

    setActiveState: (state) =>
      set(prev => ({ previousState: prev.activeState, activeState: state })),
    setTransitioning: (value) => set({ isTransitioning: value }),
    markEntered:      () => set({ hasEntered: true }),
    markCompleted:    () => set({ hasCompleted: true }),
    markInteracted:   (state) =>
      set(prev => ({
        interactionFlags: { ...prev.interactionFlags, [state]: true },
      })),
  }))
)
