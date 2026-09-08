import { Experience }   from '@/experience/Experience'
import { LoadingState } from '@/components/LoadingState'

export default function Page() {
  return (
    // A plain wrapper — the single <main> landmark lives inside
    // AccessibilityLayer so screen readers get one canonical region.
    <div id="hme-root">
      <LoadingState />
      <Experience />
    </div>
  )
}
