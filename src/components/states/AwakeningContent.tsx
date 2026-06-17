'use client'

import { useRef } from 'react'
import { MindState }       from '@/types/mind'
import { ThoughtText }     from '@/components/ThoughtText'
import { InteractionHint } from '@/components/InteractionHint'
import { useStateContent } from '@/hooks/useStateContent'
import { STATE_CONFIGS }   from '@/lib/stateConfigs'

export function AwakeningContent() {
  const headlineRef = useRef<HTMLElement>(null)
  const breathRef   = useRef<HTMLElement>(null)
  const state        = MindState.AWAKENING
  const { content }  = useStateContent({ state, headlineRef, breathRef })

  const cfg    = STATE_CONFIGS[state]
  const hintAt = cfg.start + (cfg.end - cfg.start) * 0.40

  return (
    <>
      <ThoughtText
        ref={headlineRef} as="h2" size="xl" weight={200}
        position={{ x: '50%', y: '38%' }}
        align="center" state={state} role="headline"
      >
        {content.headline}
      </ThoughtText>

      <ThoughtText
        ref={breathRef} as="p" size="base" weight={300}
        position={{ x: '50%', y: '58%' }}
        align="center" maxWidth="38ch" state={state} role="breath"
      >
        {content.breathText}
      </ThoughtText>

      <InteractionHint text={content.hint} appearAt={hintAt} />
    </>
  )
}
