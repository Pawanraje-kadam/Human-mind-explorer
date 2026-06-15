'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import gsap                from 'gsap'
import { useMindStore }    from '@/store/mindStore'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function EntryGate() {
  const containerRef   = useRef<HTMLDivElement>(null)
  const orbRef         = useRef<HTMLDivElement>(null)
  const line1Ref       = useRef<HTMLParagraphElement>(null)
  const hintRef        = useRef<HTMLParagraphElement>(null)
  const phonesRef      = useRef<HTMLParagraphElement>(null)
  const markEntered    = useMindStore(s => s.markEntered)
  const prefersReduced = useReducedMotion()
  const entered        = useRef(false)
  const [hintText, setHintText] = useState('press any key — or touch — to enter')

  // Focus container on mount so keyboard users are oriented
  useEffect(() => {
    const timer = setTimeout(() => containerRef.current?.focus(), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    document.body.setAttribute('data-gate-active', 'true')

    const ctx = gsap.context(() => {
      if (prefersReduced) {
        gsap.set([line1Ref.current, hintRef.current, phonesRef.current], { opacity: 1 })
        return
      }

      // Orb appears
      gsap.fromTo(orbRef.current,
        { opacity: 0, scale: 0.5 },
        { opacity: 1, scale: 1, duration: 0.5, ease: 'mind.emerge', delay: 0.8 }
      )

      // Orb heartbeat pulse — 0.8s cycle (75 BPM)
      gsap.to(orbRef.current, {
        scale:       1.4,
        opacity:     0.6,
        duration:    0.4,
        ease:        'mind.breathe',
        yoyo:        true,
        repeat:      -1,
        repeatDelay: 0.4,
        delay:       1.3,
      })

      // Text reveals — staggered
      gsap.fromTo(line1Ref.current,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'mind.emerge', delay: 1.5 }
      )
      gsap.fromTo(hintRef.current,
        { opacity: 0 },
        { opacity: 0.6, duration: 1.0, ease: 'mind.emerge', delay: 3.2 }
      )
      gsap.fromTo(phonesRef.current,
        { opacity: 0 },
        { opacity: 0.4, duration: 1.0, ease: 'mind.emerge', delay: 4.8 }
      )
    }, containerRef)

    return () => {
      ctx.revert()
      document.body.removeAttribute('data-gate-active')
    }
  }, [prefersReduced])

  const enter = useCallback(() => {
    if (entered.current || !containerRef.current) return
    entered.current = true

    // Post-entry instruction — user has committed, now give them something to do
    setHintText('close your eyes.')

    if (prefersReduced) {
      gsap.to(containerRef.current, {
        opacity: 0, duration: 0.1, onComplete: markEntered,
      })
      return
    }

    // Orb expands to fill viewport — radial wipe
    gsap.to(orbRef.current, {
      scale: 200, opacity: 1, duration: 1.5, ease: 'power2.in',
    })

    gsap.to(containerRef.current, {
      opacity:    0,
      duration:   0.8,
      ease:       'power2.inOut',
      delay:      0.7,
      onComplete: markEntered,
    })
  }, [markEntered, prefersReduced])

  // Any input enters — keyboard, touch, click
  useEffect(() => {
    const handler = () => enter()
    window.addEventListener('keydown',  handler, { once: true })
    window.addEventListener('touchend', handler, { once: true })
    window.addEventListener('click',    handler, { once: true })
    return () => {
      window.removeEventListener('keydown',  handler)
      window.removeEventListener('touchend', handler)
      window.removeEventListener('click',    handler)
    }
  }, [enter])

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Enter the Human Mind Explorer experience. Press any key or tap to begin."
      tabIndex={-1}
      className="fixed inset-0 z-50 flex flex-col items-center
                 justify-center bg-void-black focus:outline-none"
    >
      {/* Heartbeat orb */}
      <div
        ref={orbRef}
        aria-hidden="true"
        className="absolute w-[2px] h-[2px] rounded-full bg-neural-white"
        style={{
          boxShadow: '0 0 12px 4px rgba(240,238,232,0.4)',
          opacity:   0,
        }}
      />

      {/* Text stack */}
      <div className="relative z-10 text-center space-y-6" aria-hidden="true">
        <p
          ref={line1Ref}
          className="font-sans font-light tracking-[0.02em]
                     text-[2.369rem] text-neural-white"
          style={{ opacity: 0 }}
        >
          a mind is waiting
        </p>
      </div>

      {/* Hint — changes text after entry */}
      <p
        ref={hintRef}
        className="absolute bottom-[8vh] font-mono text-sm
                   text-neural-silver tracking-[0.08em]"
        style={{ opacity: 0 }}
      >
        {hintText}
      </p>

      {/* Headphones recommendation */}
      <p
        ref={phonesRef}
        className="absolute bottom-[4vh] font-mono text-xs
                   text-neural-ghost tracking-[0.08em]"
        style={{ opacity: 0 }}
      >
        ○ headphones recommended
      </p>
    </div>
  )
}
