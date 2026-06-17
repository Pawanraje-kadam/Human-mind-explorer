'use client'

import { lazy, Suspense } from 'react'
import { useMindStore }   from '@/store/mindStore'
import { MindState }      from '@/types/mind'
import { StateErrorBoundary } from './StateErrorBoundary'
import { AwakeningContent }   from './states/AwakeningContent'

const RecognitionContent    = lazy(() => import('./states/RecognitionContent'))
const DepthContent          = lazy(() => import('./states/DepthContent'))
const DisorientationContent = lazy(() => import('./states/DisorientationContent'))
const DiscoveryContent      = lazy(() => import('./states/DiscoveryContent'))
const ClarityContent        = lazy(() => import('./states/ClarityContent'))
const ExpansionContent      = lazy(() => import('./states/ExpansionContent'))
const IntegrationContent    = lazy(() => import('./states/IntegrationContent'))

const STATE_COMPONENTS: Record<MindState, React.ComponentType> = {
  [MindState.AWAKENING]:      AwakeningContent,
  [MindState.RECOGNITION]:    RecognitionContent,
  [MindState.DEPTH]:          DepthContent,
  [MindState.DISORIENTATION]: DisorientationContent,
  [MindState.DISCOVERY]:      DiscoveryContent,
  [MindState.CLARITY]:        ClarityContent,
  [MindState.EXPANSION]:      ExpansionContent,
  [MindState.INTEGRATION]:    IntegrationContent,
}

export function StateContentManager() {
  const activeState     = useMindStore(s => s.activeState)
  const ActiveComponent = STATE_COMPONENTS[activeState]

  return (
    <div className="fixed inset-0 z-10 pointer-events-none">
      <Suspense fallback={null}>
        <StateErrorBoundary stateName={activeState}>
          <ActiveComponent />
        </StateErrorBoundary>
      </Suspense>
    </div>
  )
}
