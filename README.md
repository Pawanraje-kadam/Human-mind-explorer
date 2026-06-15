# Human-mind-explorer
Human Mind Explorer An immersive WebGL journey through eight psychological states of the human mind. Built with Next.js, Three.js, and GSAP. You are a thought becoming aware of itself — scrolling through Awakening, Recognition, Depth, Disorientation, Discovery, Clarity, Expansion, and Integration.
<div align="center">

```
          ·
       ·     ·
     ·    ✦    ·
       ·     ·
          ·
```

# human mind explorer

*an interactive journey through consciousness*

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Three.js](https://img.shields.io/badge/Three.js-0.166-black?style=flat-square&logo=three.js)](https://threejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-black?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![GSAP](https://img.shields.io/badge/GSAP-3.12-black?style=flat-square)](https://greensock.com)

</div>

---

> *You are not exploring a mind. You are a thought — becoming aware of itself.*

**Human Mind Explorer** is a scroll-driven WebGL experience that takes you through eight psychological states of human consciousness. Each state is a distinct visual environment: custom GLSL shaders, a persistent particle system, cinematic camera movements along a predefined spline, and GSAP-orchestrated text that surfaces the mind's internal voice.

No images. No videos. Every pixel is generated at runtime.

---

## the journey

```
0.00 ────── 0.18   AWAKENING        A single orb in the void. Consciousness
                                    emerging from nothing. Hold still — it
                                    reaches toward you.

0.18 ────── 0.28   RECOGNITION      Neural threads fire and connect. Amber
                                    warmth arrives — the first color the
                                    mind has ever seen. Your movement draws
                                    new thought.

0.28 ────── 0.42   DEPTH            The camera descends into memory. Twelve
                                    translucent indigo layers recede into
                                    infinity. Slow down — patience reveals
                                    what speed cannot.

0.42 ────── 0.50   DISORIENTATION   Space fractures. The mind loses the
                                    thread. For exactly three seconds,
                                    you surrender control. Then: stillness.

0.50 ────── 0.62   DISCOVERY        Sacred geometry constructs itself from
                                    a point outward. A pattern that was
                                    always there. Click anywhere — you do
                                    not create it. You only learn to see it.

0.62 ────── 0.72   CLARITY          Everything falls away. One icosahedron.
                                    Complete silence. Your cursor is
                                    attention — what you look at becomes
                                    more real.

0.72 ────── 0.86   EXPANSION        80,000 particles explode from the point
                                    of clarity. Four spectrum colors. Your
                                    cursor draws rivers of light. One idea
                                    becomes everything.

0.86 ────── 1.00   INTEGRATION      All states return simultaneously. The
                                    camera arrives at the exact position
                                    where the journey began. The orb pulses.
                                    The mind recognizes itself.
```

---

## technical architecture

The entire experience is driven by a single normalized float — `mindProgress: 0.0 → 1.0` — that never enters React's render cycle during scroll.

```
ScrollTrigger ──► setRawProgress()
                        │
                        ▼
              GSAP Ticker (60fps)
              ┌─────────────────────────────────┐
              │  lerp(displayed, raw, lerpSpeed) │  ← per-state resistance
              │  progressStore.set()             │  ← plain JS, no React
              │  WebGLManager.update()           │  ← Three.js uniforms
              │  WebGLManager.render()           │  ← EffectComposer
              └─────────────────────────────────┘
                        │
              ┌─────────┴──────────┐
              ▼                    ▼
        Three.js               Zustand
    (continuous 60fps)    (8 boundary events)
                               │
                               ▼
                         React components
                        (re-renders ≤ 8×)
```

### state management — two layers

| Layer | Technology | Updates | Consumers |
|-------|-----------|---------|-----------|
| High-frequency scroll data | Plain JS module | 60fps | Three.js, GSAP |
| Discrete state boundaries | Zustand | 8× per journey | React components |

React reconciliation never competes with the animation frame.

### device tiers

| Tier | Detection | Particles | Post-processing |
|------|-----------|-----------|----------------|
| High | 8+ cores, 8GB RAM, GPU score >14 | 150,000 | Bloom + Vignette + Film grain |
| Mid  | 4+ cores, GPU score >8 | 60,000 | Bloom + Vignette |
| Low  | Below mid | 0 (WebGL disabled) | CSS fallback |

---

## stack

```
Next.js 14      App Router, edge OG image generation, next/font
Three.js 0.166  WebGL renderer, custom GLSL shaders, EffectComposer
GSAP 3.12       Single RAF loop, ScrollTrigger, CustomEase, SplitText*
Zustand 4.5     Discrete state with subscribeWithSelector
TypeScript 5.5  Strict mode throughout
Tailwind 3.4    Utility layer only — design tokens live in CSS variables
```

*SplitText requires GSAP Club. Open-source fallback included at `src/lib/splitText.ts`.

---

## getting started

```bash
# install
npm install

# develop
npm run dev

# build
npm run build

# analyze bundle
npm run analyze
```

Open [http://localhost:3000](http://localhost:3000). Use headphones.

---

## project structure

```
src/
├── app/                    Next.js App Router shell
├── experience/             Orchestration layer
│   ├── Experience.tsx      Single 'use client' boundary
│   ├── EntryGate.tsx       Pre-experience gate
│   ├── DisorientationOverlay.tsx  Scripted 3s takeover
│   └── ExitPortal.tsx      Post-experience reflection
├── webgl/                  Three.js — never imports React
│   ├── WebGLManager.ts     Singleton renderer + lifecycle
│   ├── CameraRig.ts        Spline-based camera controller
│   ├── ParticleSystem.ts   Persistent 150k particle system
│   ├── PostProcessing.ts   EffectComposer + bloom + vignette
│   └── shaders/            GLSL per state
├── animation/              GSAP — never imports React components
│   ├── Ticker.ts           Single RAF loop (GSAP-driven)
│   ├── ScrollEngine.ts     ScrollTrigger + component preloader
│   ├── Easings.ts          6 named CustomEase curves
│   └── PerformanceMonitor.ts  Runtime degradation
├── store/
│   ├── progressStore.ts    Plain JS — 60fps scroll state
│   └── mindStore.ts        Zustand — discrete mind state
├── components/
│   ├── states/             8 lazy-loaded state content components
│   └── ...                 UI primitives
├── hooks/                  Shared React logic
├── lib/                    Pure utilities, no framework deps
└── types/                  TypeScript definitions
```

---

## performance

| Metric | Target | Strategy |
|--------|--------|---------|
| JS bundle (gzipped) | < 280KB | Named Three.js imports, tree-shaking |
| Lighthouse desktop | 90+ | No images, minimal JS on critical path |
| Lighthouse mobile | 80+ | Three device tiers, adaptive quality |
| LCP | < 2.5s | Font preload, void-black set in HTML |
| CLS | 0 | All elements fixed or absolute positioned |
| Frame budget | 16.67ms | GSAP owns RAF, React never re-renders on scroll |

---

## accessibility

Two complete parallel experiences:

**Experience A** — Full WebGL journey (`aria-hidden` from screen readers)

**Experience B** — Complete text narrative, always in DOM, keyboard navigable

```
Keyboard navigation:  ↑ ↓ arrow keys move between states
Screen readers:       Full narrative in AccessibilityLayer
Reduced motion:       Static visual alternative, no animation
Low-end devices:      CSS/layout version, no WebGL
```

All text meets WCAG 2.1 AA contrast minimums.

---

## shaders

Each state has a custom GLSL shader pair. All geometry is procedural — zero texture files.

| State | Shader technique |
|-------|-----------------|
| Awakening | Radial SDF glow + bloom |
| Recognition | UV-based thread renderer + activation pulse |
| Depth | Simplex noise memory forms + scroll-speed blur |
| Disorientation | Edge highlight on fractured geometry |
| Discovery | Flower of Life geometry + expanding reveal ring |
| Clarity | Barycentric wireframe + cursor focus |
| Expansion | Velocity-based point sizing + spectrum color |
| Integration | Weighted composite of all four visual families |

---

## easing language

Six custom curves define the motion character of the experience:

```
mind.emerge   slow start → confident arrival    consciousness rising
mind.fire     fast start → quick settle         synaptic firing
mind.fall     gravity pull → heavy landing      memory descending
mind.snap     immediate → cushioned             clarity arriving
mind.breathe  symmetric ease in-out             ambient oscillation
mind.chaos    irregular → unpredictable         disorientation only
```

---

## design system

**Palette** — 22 tokens across 6 families: Void, Neural, Amber, Indigo, Gold, Spectrum.
Semantic tokens (`--state-primary`, `--state-accent`, `--state-bg`) updated by JS at state boundaries.

**Typography** — DM Sans Variable (headlines weight 200, always) + DM Mono (diegetic UI only).
The typeface recedes. The environment leads.

**Motion rule** — Every animation communicates psychological state. Decorative motion does not exist.

---

<div align="center">

*a mind that has traveled this far*
*is not the same mind that began.*

---

MIT License

</div>
