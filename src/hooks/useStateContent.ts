'use client'

import { useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'
import { progressStore }    from '@/store/progressStore'
import { useMindStore }     from '@/store/mindStore'
import { STATE_CONFIGS, STATE_CONTENT } from '@/lib/stateConfigs'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { stateProgress }    from '@/lib/math'
import type { MindState }   from '@/types/mind'

interface UseStateContentOptions {
  state:       MindState
  headlineRef: React.RefObject<HTMLElement>
  breathRef?:  React.RefObject<HTMLElement>
}

type AnimType = 'chars' | 'words' | 'fade'

const HEADLINE_ANIM_TYPE: Record<string, AnimType> = {
  AWAKENING:      'chars',
  RECOGNITION:    'chars',
  DEPTH:          'chars',
  DISORIENTATION: 'chars',
  DISCOVERY:      'words',
  CLARITY:        'fade',
  EXPANSION:      'words',
  INTEGRATION:    'chars',
}

interface AnimConfig {
  offsetY:               number
  duration:              number
  charStagger:           number
  wordStagger:           number
  ease:                  string
  jitter?:               boolean
  breathingOscillation?: boolean
}

const ANIM_CONFIGS: Record<string, AnimConfig> = {
  AWAKENING:      { offsetY: 8,  duration: 0.6, charStagger: 0.030, wordStagger: 0.20, ease: 'mind.emerge' },
  RECOGNITION:    { offsetY: 6,  duration: 0.4, charStagger: 0.025, wordStagger: 0.15, ease: 'mind.fire'   },
  DEPTH:          { offsetY: 10, duration: 0.8, charStagger: 0.040, wordStagger: 0.25, ease: 'mind.fall'   },
  DISORIENTATION: { offsetY: 4,  duration: 0.3, charStagger: 0.020, wordStagger: 0.10, ease: 'mind.chaos', jitter: true },
  DISCOVERY:      { offsetY: 6,  duration: 0.5, charStagger: 0.030, wordStagger: 0.40, ease: 'mind.snap'   },
  CLARITY:        { offsetY: 0,  duration: 0.8, charStagger: 0.000, wordStagger: 0.00, ease: 'mind.emerge' },
  EXPANSION:      { offsetY: 8,  duration: 0.4, charStagger: 0.030, wordStagger: 0.15, ease: 'mind.fire'   },
  INTEGRATION:    { offsetY: 6,  duration: 0.7, charStagger: 0.050, wordStagger: 0.20, ease: 'mind.emerge', breathingOscillation: true },
}

const BREATH_OPACITY: Record<string, number> = {
  AWAKENING:      0.7,
  RECOGNITION:    0.7,
  DEPTH:          0.5,
  DISORIENTATION: 0.0,
  DISCOVERY:      0.7,
  CLARITY:        0.6,
  EXPANSION:      0.8,
  INTEGRATION:    0.7,
}

function splitIntoSpans(el: HTMLElement, type: 'chars' | 'words'): HTMLElement[] {
  const text   = el.textContent ?? ''
  const spans: HTMLElement[] = []
  el.innerHTML = ''

  if (type === 'words') {
    text.split(' ').forEach((word, wi, arr) => {
      const span            = document.createElement('span')
      span.style.display    = 'inline-block'
      span.textContent      = word + (wi < arr.length - 1 ? '\u00A0' : '')
      span.style.opacity    = '0'
      el.appendChild(span)
      spans.push(span)
    })
  } else {
    text.split('').forEach(char => {
      const span            = document.createElement('span')
      span.style.display    = 'inline-block'
      span.textContent      = char === ' ' ? '\u00A0' : char
      span.style.opacity    = '0'
      el.appendChild(span)
      spans.push(span)
    })
  }

  return spans
}

export function useStateContent({
  state,
  headlineRef,
  breathRef,
}: UseStateContentOptions) {
  const markInteracted = useMindStore(s => s.markInteracted)
  const hasInteracted  = useMindStore(s => s.interactionFlags[state])
  const prefersReduced = useReducedMotion()
  const config         = STATE_CONFIGS[state]
  const content        = STATE_CONTENT[state]
  const animatedRef    = useRef(false)
  const ctxRef         = useRef<gsap.Context | null>(null)

  useEffect(() => {
    if (animatedRef.current || !headlineRef.current) return
    animatedRef.current = true

    ctxRef.current = gsap.context(() => {
      const el       = headlineRef.current!
      const animType = HEADLINE_ANIM_TYPE[state]
      const cfg      = ANIM_CONFIGS[state]

      if (prefersReduced) {
        gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.3 })
        if (breathRef?.current) {
          gsap.fromTo(breathRef.current,
            { opacity: 0 },
            { opacity: BREATH_OPACITY[state], duration: 0.3, delay: 0.3 }
          )
        }
        return
      }

      if (animType === 'fade') {
        gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: cfg.duration, ease: cfg.ease })
      } else {
        const spans = splitIntoSpans(el, animType)
        gsap.fromTo(
          spans,
          { opacity: 0, y: cfg.offsetY },
          {
            opacity:  1,
            y:        0,
            duration: cfg.duration,
            ease:     cfg.ease,
            stagger:  animType === 'words' ? cfg.wordStagger : cfg.charStagger,
          }
        )

        if (cfg.jitter) {
          const delay = cfg.duration + spans.length * cfg.charStagger + 0.4
          gsap.to(el, {
            x: () => Math.random() * 6 - 3,
            y: () => Math.random() * 4 - 2,
            duration: 0.1,
            ease: 'none',
            repeat: 20,
            delay,
          })
        }

        if (cfg.breathingOscillation) {
          const delay = cfg.duration + spans.length * cfg.charStagger + 0.5
          gsap.to(spans, {
            opacity:  '+=0.15',
            duration: 2.0,
            ease:     'mind.breathe',
            yoyo:     true,
            repeat:   -1,
            stagger:  { each: 0.08, repeat: -1 },
            delay,
          })
        }
      }

      if (breathRef?.current && content.breathText) {
        const headlineDur = cfg.duration +
          (content.headline.length * cfg.charStagger) + 0.3
        gsap.fromTo(
          breathRef.current,
          { opacity: 0 },
          {
            opacity:  BREATH_OPACITY[state],
            duration: 1.2,
            ease:     'mind.emerge',
            delay:    headlineDur,
          }
        )
      }
    })

    return () => {
      ctxRef.current?.revert()
      animatedRef.current = false
    }
  }, [state, prefersReduced])

  // Fade out at end of state
  useEffect(() => {
    return progressStore.subscribe(({ mindProgress }) => {
      const sp = stateProgress(mindProgress, config.start, config.end)
      if (sp > 0.85) {
        const fade = (sp - 0.85) / 0.15
        const op   = 1.0 - fade

        if (headlineRef.current) {
          headlineRef.current.style.opacity = String(
            state === 'INTEGRATION' ? Math.max(0.15, op) : Math.max(0, op)
          )
        }
        if (breathRef?.current) {
          breathRef.current.style.opacity = String(
            Math.max(0, op * BREATH_OPACITY[state])
          )
        }
      }
    })
  }, [state, config, headlineRef, breathRef])

  const onInteract = useCallback(() => {
    if (!hasInteracted) markInteracted(state)
  }, [hasInteracted, markInteracted, state])

  return { content, config, hasInteracted, onInteract, prefersReduced }
}
