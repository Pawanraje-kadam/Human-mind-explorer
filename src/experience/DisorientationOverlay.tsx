'use client'

import { useEffect, useRef }   from 'react'
import gsap                    from 'gsap'
import { useMindStore }        from '@/store/mindStore'
import { progressStore }       from '@/store/progressStore'
import { WebGLManager }        from '@/webgl/WebGLManager'
import { MindState }           from '@/types/mind'
import { useReducedMotion }    from '@/hooks/useReducedMotion'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'

export function DisorientationOverlay() {
  const activeState      = useMindStore(s => s.activeState)
  const setTransitioning = useMindStore(s => s.setTransitioning)
  const prefersReduced   = useReducedMotion()
  const textRef          = useRef<HTMLParagraphElement>(null)
  const triggered        = useRef(false)
  const scrambleRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const timelineRef      = useRef<gsap.core.Timeline | null>(null)
  const timeoutRef       = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (activeState !== MindState.DISORIENTATION) {
      triggered.current = false
    }
  }, [activeState])

  useEffect(() => {
    if (activeState !== MindState.DISORIENTATION) return
    if (prefersReduced) return

    const unsub = progressStore.subscribe(({ mindProgress }) => {
      if (mindProgress >= 0.44 && mindProgress <= 0.46 && !triggered.current) {
        triggered.current = true
        unsub()
        executeTakeover()
      }
    })

    return () => {
      unsub()
      restoreControl()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeState, prefersReduced])

  function executeTakeover() {
    document.body.style.overflow = 'hidden'
    setTransitioning(true)

    const wgl = WebGLManager.getInstance()

    const readoutState = document.querySelector('[data-readout-state]')
    if (readoutState) {
      const original = readoutState.textContent ?? ''
      scrambleRef.current = setInterval(() => {
        readoutState.textContent = Array.from(original)
          .map(c =>
            c === ' ' || c === '.' || c === '-'
              ? c
              : CHARS[Math.floor(Math.random() * CHARS.length)]
          )
          .join('')
      }, 80)
    }

    const rollTarget = { roll: 0 }
    const tl = gsap.timeline({ onComplete: restoreControl })
    timelineRef.current = tl

    tl.fromTo(textRef.current,
      { opacity: 0 },
      { opacity: 0.7, duration: 0.4, ease: 'mind.fire' },
      0
    )

    tl.to(rollTarget, {
      roll: 15, duration: 0.8, ease: 'mind.chaos',
      onUpdate: () => wgl.setCameraRoll(rollTarget.roll),
    }, 0)

    tl.to(rollTarget, {
      roll: -8, duration: 0.6, ease: 'mind.chaos',
      onUpdate: () => wgl.setCameraRoll(rollTarget.roll),
    }, 0.8)

    const canvas = wgl.getCanvasElement()
    if (canvas) {
      tl.to(canvas, {
        x: () => Math.random() * 4 - 2,
        y: () => Math.random() * 4 - 2,
        duration: 0.083,
        ease: 'none',
        repeat: 24,
      }, 0.8)
    }

    tl.to(rollTarget, {
      roll: 0, duration: 0.6, ease: 'mind.emerge',
      onUpdate: () => wgl.setCameraRoll(rollTarget.roll),
    }, 2.4)

    if (canvas) {
      tl.to(canvas, { x: 0, y: 0, duration: 0.3, ease: 'mind.emerge' }, 2.4)
    }

    tl.to(textRef.current, {
      opacity: 0, duration: 0.6, ease: 'mind.breathe',
    }, 2.4)

    // Hard cap — unconditional restore at 3.1s
    timeoutRef.current = setTimeout(() => {
      if (timelineRef.current) {
        timelineRef.current.progress(1).kill()
        timelineRef.current = null
      }
      restoreControl()
    }, 3100)
  }

  function restoreControl() {
    document.body.style.overflow = ''
    setTransitioning(false)

    if (scrambleRef.current) {
      clearInterval(scrambleRef.current)
      scrambleRef.current = null
      const readoutState = document.querySelector('[data-readout-state]')
      if (readoutState) readoutState.textContent = 'disorientation.exe — '
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      document.body.style.overflow = ''
      if (scrambleRef.current)  clearInterval(scrambleRef.current)
      if (timeoutRef.current)   clearTimeout(timeoutRef.current)
      if (timelineRef.current)  timelineRef.current.kill()
    }
  }, [])

  if (activeState !== MindState.DISORIENTATION) return null

  return (
    <div aria-hidden="true" className="fixed inset-0 z-20 pointer-events-none">
      <p
        ref={textRef}
        className="fixed bottom-[8vh] left-1/2 -translate-x-1/2
                   font-mono text-sm text-neural-silver tracking-[0.08em]"
        style={{ opacity: 0 }}
      >
        surrendering control for a moment...
      </p>
    </div>
  )
}
