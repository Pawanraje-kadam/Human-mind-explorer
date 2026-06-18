'use client'

import { useRef, useEffect } from 'react'
import { MindState }         from '@/types/mind'
import { ThoughtText }       from '@/components/ThoughtText'
import { InteractionHint }   from '@/components/InteractionHint'
import { useStateContent }   from '@/hooks/useStateContent'
import { STATE_CONFIGS }     from '@/lib/stateConfigs'

export default function ExpansionContent() {
  const headlineRef = useRef<HTMLElement>(null)
  const breathRef   = useRef<HTMLElement>(null)
  const state         = MindState.EXPANSION
  const { content, onInteract } = useStateContent({ state, headlineRef, breathRef })

  const cfg    = STATE_CONFIGS[state]
  const hintAt = cfg.start + (cfg.end - cfg.start) * 0.20

  // Sustained cursor movement (not just any movement) triggers
  // the interaction flag — matches the "draw" hint's intent
  useEffect(() => {
    let lastX = 0
    let lastY = 0

    const handler = (e: MouseEvent) => {
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      const speed = Math.sqrt(dx * dx + dy * dy)
      lastX = e.clientX
      lastY = e.clientY
      if (speed > 8) onInteract()
    }

    window.addEventListener('mousemove', handler, { passive: true })
    return () => window.removeEventListener('mousemove', handler)
  }, [onInteract])

  return (
    <>
      <ThoughtText
        ref={headlineRef} as="h2" size="xl" weight={200}
        position={{ x: '50%', y: '20%' }}
        align="center" state={state} role="headline"
      >
        {content.headline}
      </ThoughtText>

      <ThoughtText
        ref={breathRef} as="p" size="base" weight={300}
        position={{ x: '50%', y: '82%' }}
        align="center" maxWidth="44ch" state={state} role="breath"
      >
        {content.breathText}
      </ThoughtText>

      <InteractionHint text={content.hint} appearAt={hintAt} />
    </>
  )
}
