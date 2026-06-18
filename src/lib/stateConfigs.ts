import { MindState, StateConfig, StateContent } from '@/types/mind'

export const STATE_CONFIGS: Record<MindState, StateConfig> = {
  [MindState.AWAKENING]: {
    id: MindState.AWAKENING,
    start: 0.00, end: 0.18, peak: 0.09,
    preloadAt: 0.00, disposeAt: 0.30,
  },
  [MindState.RECOGNITION]: {
    id: MindState.RECOGNITION,
    start: 0.16, end: 0.28, peak: 0.22,
    preloadAt: 0.12, disposeAt: 0.40,
  },
  [MindState.DEPTH]: {
    id: MindState.DEPTH,
    start: 0.26, end: 0.42, peak: 0.34,
    preloadAt: 0.22, disposeAt: 0.52,
  },
  [MindState.DISORIENTATION]: {
    id: MindState.DISORIENTATION,
    start: 0.40, end: 0.50, peak: 0.45,
    preloadAt: 0.36, disposeAt: 0.62,
  },
  [MindState.DISCOVERY]: {
    id: MindState.DISCOVERY,
    start: 0.48, end: 0.62, peak: 0.55,
    preloadAt: 0.44, disposeAt: 0.74,
  },
  [MindState.CLARITY]: {
    id: MindState.CLARITY,
    start: 0.60, end: 0.72, peak: 0.66,
    preloadAt: 0.56, disposeAt: 0.84,
  },
  [MindState.EXPANSION]: {
    id: MindState.EXPANSION,
    start: 0.70, end: 0.86, peak: 0.78,
    preloadAt: 0.66, disposeAt: 0.98,
  },
  [MindState.INTEGRATION]: {
    id: MindState.INTEGRATION,
    start: 0.84, end: 1.00, peak: 0.92,
    preloadAt: 0.80, disposeAt: 1.00,
  },
}

export const STATE_CONTENT: Record<MindState, StateContent> = {
  [MindState.AWAKENING]: {
    headline:      'you were not. then you were.',
    breathText:    'consciousness reaches toward the first thing it perceives. that first thing is you.',
    hint:          'hold still.',
    interactionAt: 0.40,
  },
  [MindState.RECOGNITION]: {
    headline:      'a thought. another. the mind remembers how.',
    breathText:    'every movement leaves a trace. every thought changes what comes after.',
    hint:          'move.',
    interactionAt: 0.40,
  },
  [MindState.DEPTH]: {
    headline:      'everything you were is still here.',
    breathText:    'memory does not disappear. it becomes the floor everything else stands on.',
    hint:          'slow down.',
    interactionAt: 0.50,
  },
  [MindState.DISORIENTATION]: {
    headline:      'sometimes the mind loses the thread.',
    breathText:    '',
    hint:          '',
    interactionAt: 0,
  },
  [MindState.DISCOVERY]: {
    headline:      'beneath the chaos, a pattern was always there.',
    breathText:    'you did not create this. you only learned to see it.',
    hint:          'click.',
    interactionAt: 0.55,
  },
  [MindState.CLARITY]: {
    headline:      'one thing. perfectly seen.',
    breathText:    'the mind, when quiet, sees everything it needs.',
    hint:          'look.',
    interactionAt: 0.30,
  },
  [MindState.EXPANSION]: {
    headline:      'one idea becomes everything.',
    breathText:    'creativity is not the destination. it is what happens when you stop trying to arrive.',
    hint:          'draw.',
    interactionAt: 0.20,
  },
  [MindState.INTEGRATION]: {
    headline:      'you are all of this. simultaneously.',
    breathText:    'a mind that has traveled this far is not the same mind that began.',
    hint:          '',
    interactionAt: 0.60,
  },
}
