import { MindState }     from '@/types/mind'
import { STATE_CONTENT } from '@/lib/stateConfigs'

const JOURNEY_NARRATIVE: Record<MindState, {
  heading:     string
  description: string
}> = {
  [MindState.AWAKENING]: {
    heading:     'Awakening — The Beginning of Consciousness',
    description: 'A single point of light in absolute darkness. The mind emerges from nothing — the first moment of awareness, reaching toward the only thing it can perceive.',
  },
  [MindState.RECOGNITION]: {
    heading:     'Recognition — The First Thoughts',
    description: 'Neural threads fire and connect. Thoughts arrive rapidly, each one leaving a trace. The network of the mind begins to activate, warm with the amber glow of new awareness.',
  },
  [MindState.DEPTH]: {
    heading:     'Depth — The Memory Chamber',
    description: 'The mind descends into memory. Translucent layers recede into infinite depth — everything ever experienced, still present, forming the foundation beneath every new thought.',
  },
  [MindState.DISORIENTATION]: {
    heading:     'Disorientation — When the Mind Loses the Thread',
    description: 'Space fragments. Geometry breaks apart. For a moment, the mind surrenders control — the vertiginous, necessary experience of not knowing. Then: stillness returns.',
  },
  [MindState.DISCOVERY]: {
    heading:     'Discovery — The Pattern Beneath the Chaos',
    description: 'From the disorder, a pattern emerges. Sacred geometry constructs itself from a central point outward — circles intersecting in ancient mathematical harmony. It was always there.',
  },
  [MindState.CLARITY]: {
    heading:     'Clarity — One Thing, Perfectly Seen',
    description: 'Everything falls away. A single geometric form remains in near-silence — an icosahedron, rotating slowly. The mind discovers what it feels like to give complete attention to one thing.',
  },
  [MindState.EXPANSION]: {
    heading:     'Expansion — The Creative Explosion',
    description: 'From singular clarity, an explosion of color and light. Eighty thousand particles fill the space — rose, violet, teal, green — flowing and multiplying. One idea becomes everything.',
  },
  [MindState.INTEGRATION]: {
    heading:     'Integration — The Whole Mind',
    description: 'All states return simultaneously. Neural threads, memory layers, sacred geometry, flowing particles — all present at once, orbiting the original point of light. The journey completes where it began.',
  },
}

export function AccessibilityLayer() {
  return (
    <div className="sr-only" aria-label="Human Mind Explorer — Accessible Version">

      <nav aria-label="Skip navigation">
        <a
          href="#mind-journey"
          className="focus:not-sr-only focus:fixed focus:top-4
                     focus:left-4 focus:z-[100] focus:p-4
                     focus:bg-[#020408] focus:text-[#F0EEE8]
                     focus:outline focus:outline-2 focus:outline-[#F0EEE8]"
        >
          Skip to journey content
        </a>
        <a
          href="#experience-summary"
          className="focus:not-sr-only focus:fixed focus:top-4
                     focus:left-32 focus:z-[100] focus:p-4
                     focus:bg-[#020408] focus:text-[#F0EEE8]
                     focus:outline focus:outline-2 focus:outline-[#F0EEE8]"
        >
          Skip to summary
        </a>
      </nav>

      <header>
        <h1>Human Mind Explorer</h1>
        <p>
          An interactive journey through eight psychological states of
          the human mind. This accessible version presents the complete
          narrative and reflections from each state.
        </p>
        <p>
          <strong>For the full visual experience:</strong> this page
          includes an immersive WebGL journey requiring a modern browser
          and pointer device. The narrative below is equivalent in content.
        </p>
      </header>

      <main id="mind-journey" tabIndex={-1}>
        <h2>The Journey</h2>

        {Object.values(MindState).map((state, index) => {
          const narrative = JOURNEY_NARRATIVE[state]
          const content   = STATE_CONTENT[state]

          return (
            <article key={state} aria-labelledby={`state-heading-${state}`}>
              <h3 id={`state-heading-${state}`}>
                {index + 1} of 8 — {narrative.heading}
              </h3>

              <blockquote cite="Human Mind Explorer visual experience">
                <p>{content.headline}</p>
              </blockquote>

              <p>{narrative.description}</p>

              {content.breathText && (
                <p><em>Reflection: {content.breathText}</em></p>
              )}
            </article>
          )
        })}
      </main>

      <section id="experience-summary" tabIndex={-1}>
        <h2>The Complete Journey</h2>
        <p>
          From the first spark of awakening, through recognition,
          depth, disorientation, discovery, clarity, and expansion —
          to integration: the mind returning to its origin, now aware
          of its own complexity.
        </p>
        <p>
          <em>
            You have traveled the length of a thought. What remains
            is yours.
          </em>
        </p>
      </section>
    </div>
  )
}
