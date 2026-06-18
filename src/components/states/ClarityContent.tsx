'use client'

import { useRef } from 'react'
import { MindState }       from '@/types/mind'
import { ThoughtText }     from '@/components/ThoughtText'
import { InteractionHint } from '@/components/InteractionHint'
import { useStateContent } from '@/hooks/useStateContent'
import { STATE_CONFIGS }   from '@/lib/stateConfigs'

export default function ClarityContent() {
  const headlineRef = useRef<HTMLElement>(null)
  const breathRef   = useRef<HTMLElement>(null)
  const state        = MindState.CLARITY
  const { content }  = useStateContent({ state, headlineRef, breathRef })

  const cfg    = STATE_CONFIGS[state]
  const hintAt = cfg.start + (cfg.end - cfg.start) * 0.30

  return (
    <>
      {/* Left-aligned — the only left-aligned headline in the
          experience. Off-center placement enacts the concept:
          one thing, attended to. */}
      <ThoughtText
        ref={headlineRef} as="h2" size="2xl" weight={200}
        position={{ x: '12%', y: '42%' }}
        align="left" state={state} role="headline"
      >
        {content.headline}
      </ThoughtText>

      <ThoughtText
        ref={breathRef} as="p" size="base" weight={300}
        position={{ x: '12%', y: '56%' }}
        align="left" maxWidth="32ch" state={state} role="breath"
      >
        {content.breathText}
      </ThoughtText>

      <InteractionHint text={content.hint} appearAt={hintAt} />
    </>
  )
}
