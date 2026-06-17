'use client'

import { forwardRef } from 'react'

interface ThoughtTextProps {
  as?:       'h1' | 'h2' | 'h3' | 'p' | 'span'
  size?:     'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  weight?:   200 | 300 | 400 | 500
  position?: { x: string; y: string }
  align?:    'left' | 'center' | 'right'
  maxWidth?: string
  state?:    string
  role?:     'headline' | 'breath' | 'hint'
  children:  React.ReactNode
  className?: string
}

const SIZE_MAP: Record<string, string> = {
  xs:   'text-[0.563rem]',
  sm:   'text-[0.75rem]',
  base: 'text-[1rem]',
  md:   'text-[1.333rem]',
  lg:   'text-[1.777rem]',
  xl:   'text-[2.369rem]',
  '2xl':'text-[3.157rem]',
  '3xl':'text-[4.209rem]',
}

export const ThoughtText = forwardRef<HTMLElement, ThoughtTextProps>(
  function ThoughtText({
    as: Tag = 'p',
    size = 'base',
    weight = 300,
    position,
    align = 'left',
    maxWidth,
    state,
    role,
    children,
    className = '',
  }, ref) {

    const posStyle: React.CSSProperties = position ? {
      position:  'fixed',
      left:      position.x,
      top:       position.y,
      transform: align === 'center'
        ? 'translate(-50%, -50%)'
        : 'translateY(-50%)',
    } : {}

    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <Tag
        ref={ref as any}
        data-text-role={role}
        data-state={state}
        className={[
          'font-sans tracking-[0.02em] leading-[1.1]',
          'text-neural-white pointer-events-none',
          SIZE_MAP[size] ?? SIZE_MAP.base,
          align === 'center' ? 'text-center' : '',
          className,
        ].join(' ')}
        style={{
          ...posStyle,
          fontWeight: weight,
          maxWidth:   maxWidth ?? 'none',
          opacity:    0,
        }}
      >
        {children}
      </Tag>
    )
  }
)
