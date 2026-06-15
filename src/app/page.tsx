import { Experience }   from '@/experience/Experience'
import { LoadingState } from '@/components/LoadingState'

export default function Page() {
  return (
    <main>
      <LoadingState />
      <Experience />
    </main>
  )
}
