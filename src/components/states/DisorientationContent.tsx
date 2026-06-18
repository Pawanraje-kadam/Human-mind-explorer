'use client'

import { useRef } from 'react'
import { MindState }       from '@/types/mind'
import { ThoughtText }     from '@/components/ThoughtText'
import { useStateContent } from '@/hooks/useStateContent'
import { STATE_CONTENT }   from '@/lib/stateConfigs'

// No breath text, no hint — by design (Phase 7/8: "chaos has no
// explanation; absence is the design"). Headline gets CSS RGB
// fringing during the chaos peak via pseudo-elements (no JS needed,
// keeps the accessibility tree clean — AccessibilityLayer carries
// the real text).
export default function DisorientationContent() {
  const headlineRef = useRef<HTMLElement>(null)
  const state        = MindState.DISORIENTATION
  useStateContent({ state, headlineRef }) // no breathRef passed

  const headline = STATE_CONTENT[state].headline

  return (
    <ThoughtText
      ref={headlineRef} as="h2" size="xl" weight={200}
      position={{ x: '50%', y: '38%' }}
      align="center" state={state} role="headline"
    >
      <span
        className="relative inline-block
          before:content-[attr(data-text)] before:absolute before:left-0
          before:text-[#FF000080] before:translate-x-[2px]
          after:content-[attr(data-text)] after:absolute after:left-0
          after:text-[#0000FF80] after:-translate-x-[2px]"
        data-text={headline}
      >
        {headline}
      </span>
    </ThoughtText>
  )
}
