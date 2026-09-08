'use client'

import { forwardRef } from 'react'

export const ScrollContainer = forwardRef<HTMLDivElement>(
  function ScrollContainer(_, ref) {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        data-scroll-container
        style={{
          height:        '800vh',
          width:         '100%',
          position:      'relative',
          pointerEvents: 'none',
        }}
      />
    )
  }
)
