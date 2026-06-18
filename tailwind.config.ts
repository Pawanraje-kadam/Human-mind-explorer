import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'void-black':    'var(--void-black)',
        'void-deep':     'var(--void-deep)',
        'void-surface':  'var(--void-surface)',
        'neural-white':  'var(--neural-white)',
        'neural-silver': 'var(--neural-silver)',
        'neural-ghost':  'var(--neural-ghost)',
        'amber-fire':    'var(--amber-fire)',
        'amber-warm':    'var(--amber-warm)',
        'amber-ember':   'var(--amber-ember)',
        'indigo-deep':   'var(--indigo-deep)',
        'indigo-mid':    'var(--indigo-mid)',
        'indigo-light':  'var(--indigo-light)',
        'gold-pure':     'var(--gold-pure)',
        'gold-pale':     'var(--gold-pale)',
        'gold-dim':      'var(--gold-dim)',
        'spectrum-rose':   'var(--spectrum-rose)',
        'spectrum-violet': 'var(--spectrum-violet)',
        'spectrum-teal':   'var(--spectrum-teal)',
        'spectrum-lime':   'var(--spectrum-lime)',
        'state-primary': 'var(--state-primary)',
        'state-accent':  'var(--state-accent)',
        'state-bg':      'var(--state-bg)',
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'monospace'],
      },
      transitionTimingFunction: {
        'mind-emerge':  'cubic-bezier(0.18, 0, 0.08, 1)',
        'mind-fire':    'cubic-bezier(0.42, 0, 0.18, 1)',
        'mind-breathe': 'cubic-bezier(0.38, 0, 0.62, 1)',
      },
    },
  },
  plugins: [],
}

export default config
