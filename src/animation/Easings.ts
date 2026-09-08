import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

let registered = false

// Idempotent + self-invoking: DOM components (EntryGate, ExitPortal,
// InteractionHint, useStateContent…) run before initAnimationSystem,
// and previously their 'mind.*' eases silently fell back to GSAP's
// default. Importing this module guarantees the eases exist on the
// client, whoever asks first.
export function registerEasings(): void {
  if (registered || typeof window === 'undefined') return
  registered = true

  gsap.registerPlugin(CustomEase)

  // Slow start, confident arrival — consciousness emerging
  CustomEase.create('mind.emerge',  'M0,0 C0.18,0 0.08,1 1,1')
  // Fast start, quick settle — synaptic firing
  CustomEase.create('mind.fire',    'M0,0 C0.42,0 0.18,1 1,1')
  // Gravity pull — memory sinking
  CustomEase.create('mind.fall',    'M0,0 C0.06,0.12 0.72,1 1,1')
  // Immediate, cushioned — clarity
  CustomEase.create('mind.snap',    'M0,0 C0.58,0 0.84,0.96 1,1')
  // Symmetric — meditative breathing
  CustomEase.create('mind.breathe', 'M0,0 C0.38,0 0.62,1 1,1')
  // Irregular — disorientation only
  CustomEase.create('mind.chaos',   'M0,0 C0.84,0.18 0.16,0.92 1,1')
}

registerEasings()
