'use client'

import { useRef, useEffect } from 'react'
import { MindState }         from '@/types/mind'
import { ThoughtText }       from '@/components/ThoughtText'
import { InteractionHint }   from '@/components/InteractionHint'
import { useStateContent }   from '@/hooks/useStateContent'
import { STATE_CONFIGS }     from '@/lib/stateConfigs'
import { WebGLManager }      from '@/webgl/WebGLManager'

export default function DiscoveryContent() {
  const headlineRef = useRef<HTMLElement>(null)
  const breathRef   = useRef<HTMLElement>(null)
  const state        = MindState.DISCOVERY
  const { content, onInteract } = useStateContent({ state, headlineRef, breathRef })

  const cfg    = STATE_CONFIGS[state]
  const hintAt = cfg.start + (cfg.end - cfg.start) * 0.55

  // Click reveals geometry that was already complete, just invisible —
  // forwarded directly to the DiscoveryState WebGL class
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      onInteract()
      const normX = e.clientX / window.innerWidth
      const normY = e.clientY / window.innerHeight
      WebGLManager.getInstance().registerDiscoveryClick(normX, normY)
    }
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [onInteract])

  return (
    <>
      <ThoughtText
        ref={headlineRef} as="h2" size="xl" weight={200}
        position={{ x: '50%', y: '28%' }}
        align="center" state={state} role="headline"
      >
        {content.headline}
      </ThoughtText>

      <ThoughtText
        ref={breathRef} as="p" size="base" weight={300}
        position={{ x: '50%', y: '68%' }}
        align="center" maxWidth="38ch" state={state} role="breath"
      >
        {content.breathText}
      </ThoughtText>

      <InteractionHint text={content.hint} appearAt={hintAt} />
    </>
  )
}
