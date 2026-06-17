'use client'

import { Component } from 'react'
import type { ReactNode } from 'react'

interface Props {
  children:  ReactNode
  stateName: string
}

interface State {
  hasError: boolean
}

// Lightweight boundary for individual state content components.
// If one state's text component fails to load/render, the journey
// continues silently — that state simply has no headline/breath text
// rather than crashing the entire experience.
export class StateErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error): void {
    console.error(`[HME] State component failed: ${this.props.stateName}`, error)
  }

  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}
