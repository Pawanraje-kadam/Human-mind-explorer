'use client'

import { useRef } from 'react'
import { MindState }       from '@/types/mind'
import { ThoughtText }     from '@/components/ThoughtText'
import { InteractionHint } from '@/components/InteractionHint'
import { useStateContent } from '@/hooks/useStateContent'
import { STATE_CONFIGS }   from '@/lib/stateConfigs'

export default function DepthContent() {
  const headlineRef = useRef<HTMLElement>(null)
  const breathRef   = useRef<HTMLElement>(null)
  const state        = MindState.DEPTH
  const { content }  = useStateContent({ state, headlineRef, breathRef })

  const cfg    = STATE_CONFIGS[state]
  const hintAt = cfg.start + (cfg.end - cfg.start) * 0.50

  return (
    <>
      {/* Headline caps at 0.6 max opacity via useStateContent's
          BREATH_OPACITY-style fade logic — memory is imprecise */}
      <ThoughtText
        ref={headlineRef} as="h2" size="xl" weight={200}
        position={{ x: '50%', y: '32%' }}
        align="center" state={state} role="headline"
      >
        {content.headline}
      </ThoughtText>

      <ThoughtText
        ref={breathRef} as="p" size="base" weight={300}
        position={{ x: '50%', y: '52%' }}
        align="center" maxWidth="38ch" state={state} role="breath"
      >
        {content.breathText}
      </ThoughtText>

      <InteractionHint text={content.hint} appearAt={hintAt} />
    </>
  )
}
