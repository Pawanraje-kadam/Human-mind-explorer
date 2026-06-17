'use client'

import { useEffect, useRef, useState } from 'react'
import { useMindStore }  from '@/store/mindStore'
import { STATE_CONTENT } from '@/lib/stateConfigs'

// ARIA live region — announces state transitions to screen readers.
// role="status" (not "alert") because this is informational,
// not urgent — it shouldn't interrupt the user's current reading.
export function StateAnnouncer() {
  const activeState  = useMindStore(s => s.activeState)
  const prevStateRef = useRef(activeState)
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    if (activeState !== prevStateRef.current) {
      setAnnouncement(
        `Now entering: ${activeState.toLowerCase()}. ${STATE_CONTENT[activeState].headline}`
      )
      prevStateRef.current = activeState
    }
  }, [activeState])

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {announcement}
    </div>
  )
}
