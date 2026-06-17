'use client'

import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

type ErrorType = 'webgl-unsupported' | 'webgl-lost' | 'init-failed' | 'unknown'

interface State {
  hasError:  boolean
  errorType: ErrorType
}

export class WebGLErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, errorType: 'unknown' }
  }

  static getDerivedStateFromError(error: Error): State {
    const msg = error.message.toLowerCase()

    if (msg.includes('webgl') && msg.includes('support')) {
      return { hasError: true, errorType: 'webgl-unsupported' }
    }
    if (msg.includes('context') && msg.includes('lost')) {
      return { hasError: true, errorType: 'webgl-lost' }
    }
    if (msg.includes('initialize') || msg.includes('renderer')) {
      return { hasError: true, errorType: 'init-failed' }
    }
    return { hasError: true, errorType: 'unknown' }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (process.env.NODE_ENV === 'production') {
      console.error('[HME] WebGL Error:', error.message, info.componentStack)
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return <WebGLFallbackUI errorType={this.state.errorType} />
  }
}

const MESSAGES: Record<ErrorType, { headline: string; body: string; action: string | null }> = {
  'webgl-unsupported': {
    headline: 'this experience requires WebGL.',
    body:     'your browser or device does not support WebGL. try Chrome, Firefox, or Safari on a modern device.',
    action:   null,
  },
  'webgl-lost': {
    headline: 'the mind lost its thread.',
    body:     'the graphics context was interrupted — this can happen when your device sleeps or under memory pressure.',
    action:   'reload to restore',
  },
  'init-failed': {
    headline: 'something went wrong initializing the experience.',
    body:     'this may be a temporary issue.',
    action:   'try again',
  },
  'unknown': {
    headline: 'something unexpected happened.',
    body:     'the experience encountered an error it could not recover from.',
    action:   'reload to try again',
  },
}

function WebGLFallbackUI({ errorType }: { errorType: ErrorType }) {
  const msg = MESSAGES[errorType]

  return (
    <div
      role="alert"
      className="fixed inset-0 z-[999] flex flex-col items-center
                 justify-center bg-void-black text-center px-8"
    >
      <div
        aria-hidden="true"
        className="mb-12 w-[2px] h-[2px] rounded-full bg-neural-white"
        style={{ boxShadow: '0 0 12px 4px rgba(240,238,232,0.4)' }}
      />

      <p className="font-sans font-light text-[2.369rem]
                    text-neural-white tracking-[0.02em] mb-6">
        {msg.headline}
      </p>

      <p className="font-sans font-light text-base
                    text-neural-silver tracking-[0.02em]
                    max-w-[36ch] mb-12">
        {msg.body}
      </p>

      {msg.action && (
        <button
          onClick={() => window.location.reload()}
          className="font-mono text-sm text-neural-silver
                     tracking-[0.08em] hover:text-neural-white
                     transition-colors duration-[400ms]
                     min-h-[44px] px-4"
        >
          {msg.action} →
        </button>
      )}
    </div>
  )
}
