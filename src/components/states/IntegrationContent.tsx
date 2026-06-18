'use client'

import { useRef, useEffect } from 'react'
import { MindState }       from '@/types/mind'
import { ThoughtText }     from '@/components/ThoughtText'
import { useStateContent } from '@/hooks/useStateContent'
import { STATE_CONTENT }   from '@/lib/stateConfigs'
import { useMindStore }    from '@/store/mindStore'
import { progressStore }   from '@/store/progressStore'

export default function IntegrationContent() {
  const headlineRef  = useRef<HTMLElement>(null)
  const breathRef    = useRef<HTMLElement>(null)
  const state         = MindState.INTEGRATION
  const markCompleted = useMindStore(s => s.markCompleted)

  useStateContent({ state, headlineRef, breathRef })

  const content = STATE_CONTENT[state]

  // Mark the experience complete near the very end of scroll —
  // ExitPortal mounts in response to this
  useEffect(() => {
    return progressStore.subscribe(({ mindProgress }) => {
      if (mindProgress >= 0.995) markCompleted()
    })
  }, [markCompleted])

  return (
    <>
      <ThoughtText
        ref={headlineRef} as="h2" size="2xl" weight={200}
        position={{ x: '50%', y: '30%' }}
        align="center" state={state} role="headline"
      >
        {content.headline}
      </ThoughtText>

      <ThoughtText
        ref={breathRef} as="p" size="base" weight={300}
        position={{ x: '50%', y: '62%' }}
        align="center" maxWidth="40ch" state={state} role="breath"
      >
        {content.breathText}
      </ThoughtText>

      {/* No hint — all prior interactions are available simultaneously */}
    </>
  )
}
