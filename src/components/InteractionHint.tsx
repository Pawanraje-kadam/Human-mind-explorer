'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { progressStore } from '@/store/progressStore'

interface InteractionHintProps {
  text:     string
  appearAt: number // mindProgress value (global, 0..1) when hint appears
}

export function InteractionHint({ text, appearAt }: InteractionHintProps) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    return progressStore.subscribe(({ mindProgress }) => {
      if (!shown && mindProgress >= appearAt) {
        setShown(true)
      }
    })
  }, [appearAt, shown])

  useEffect(() => {
    if (!shown || !ref.current) return
    gsap.fromTo(ref.current,
      { opacity: 0 },
      { opacity: 0.5, duration: 2.0, ease: 'mind.emerge' }
    )
  }, [shown])

  if (!shown || !text) return null

  return (
    <p
      ref={ref}
      aria-hidden="true"
      className="fixed bottom-[8vh] left-1/2 -translate-x-1/2
                 font-mono text-sm text-neural-silver
                 tracking-[0.08em] pointer-events-none z-20"
      style={{ opacity: 0 }}
    >
      {text}
    </p>
  )
}
