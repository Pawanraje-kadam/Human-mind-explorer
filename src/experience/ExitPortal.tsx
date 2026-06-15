'use client'

import { useEffect, useRef } from 'react'
import gsap                  from 'gsap'
import { useMindStore }      from '@/store/mindStore'

function generateReflection(flags: Record<string, boolean>): string {
  const count = Object.values(flags).filter(Boolean).length
  if (count === 8) return 'what remains is yours. all of it.'
  if (count >= 5)  return 'what remains is yours.'
  if (count >= 3)  return 'some rooms you entered. others you watched from outside.'
  if (count === 0) return 'even the mind that moves quickly leaves something behind.'
  return 'some doors opened. some you passed.'
}

export function ExitPortal() {
  const containerRef = useRef<HTMLDivElement>(null)
  const line1Ref     = useRef<HTMLParagraphElement>(null)
  const line2Ref     = useRef<HTMLParagraphElement>(null)
  const actionsRef   = useRef<HTMLDivElement>(null)
  const interactionFlags = useMindStore(s => s.interactionFlags)
  const reflection       = generateReflection(interactionFlags)

  // Move focus to portal after fade-in completes
  useEffect(() => {
    const timer = setTimeout(() => containerRef.current?.focus(), 2500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline()

      tl.fromTo(containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 2.0, ease: 'mind.emerge' }
      )
      .fromTo(line1Ref.current,
        { opacity: 0 },
        { opacity: 1, duration: 1.0, ease: 'mind.emerge' },
        '+=0.5'
      )
      .fromTo(line2Ref.current,
        { opacity: 0 },
        { opacity: 1, duration: 1.0, ease: 'mind.emerge' },
        '+=5'
      )
      .fromTo(actionsRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: 'mind.emerge' },
        '+=3'
      )
    }, containerRef)

    return () => ctx.revert()
  }, [])

  function handleRestart() {
    window.scrollTo({ top: 0, behavior: 'instant' })
    window.location.reload()
  }

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Journey complete"
      tabIndex={-1}
      className="fixed inset-0 z-40 flex flex-col items-center
                 justify-center focus:outline-none"
      style={{ opacity: 0, background: 'rgba(2,4,8,0.92)' }}
    >
      {/* First phrase */}
      <p
        ref={line1Ref}
        className="font-sans font-light text-[2.369rem]
                   text-neural-white tracking-[0.02em] text-center
                   max-w-[20ch] leading-[1.1]"
        style={{ opacity: 0 }}
      >
        you have traveled the length of a thought.
      </p>

      {/* Personalised reflection */}
      <p
        ref={line2Ref}
        className="font-sans font-light text-base text-neural-silver
                   tracking-[0.02em] text-center mt-8 max-w-[40ch]"
        style={{ opacity: 0 }}
      >
        {reflection}
      </p>

      {/* Actions */}
      <div
        ref={actionsRef}
        className="flex gap-16 mt-16"
        style={{ opacity: 0 }}
      >
        <button
          onClick={handleRestart}
          className="font-mono text-sm text-neural-silver tracking-[0.08em]
                     hover:text-neural-white transition-colors duration-[400ms]
                     min-h-[44px] min-w-[44px] px-4 py-3"
        >
          ○ experience again
        </button>

        <button
          onClick={() => {
            // Carry this with you — shares or copies a reflection
            if (navigator.share) {
              navigator.share({
                title: 'Human Mind Explorer',
                text:  `I traveled the length of a thought. ${reflection}`,
                url:   window.location.href,
              }).catch(() => {})
            } else {
              navigator.clipboard?.writeText(
                `Human Mind Explorer\n\n${reflection}\n\n${window.location.href}`
              ).catch(() => {})
            }
          }}
          className="font-mono text-sm text-neural-silver tracking-[0.08em]
                     hover:text-neural-white transition-colors duration-[400ms]
                     min-h-[44px] min-w-[44px] px-4 py-3"
        >
          carry this with you →
        </button>
      </div>
    </div>
  )
}
