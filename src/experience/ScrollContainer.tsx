'use client'

import { forwardRef, useEffect, useRef } from 'react'

export const ScrollContainer = forwardRef<HTMLDivElement>(
  function ScrollContainer(_, ref) {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        style={{
          height:       '800vh',
          width:        '100%',
          position:     'relative',
          pointerEvents: 'none',
        }}
      />
    )
  }
)
