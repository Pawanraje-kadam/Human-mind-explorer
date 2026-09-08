import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'

// Self-hosted (SIL OFL, via @fontsource). Zero external requests at
// build or runtime — LCP font arrives from our own origin, preloaded.
const dmSans = localFont({
  src: [
    { path: '../assets/fonts/dm-sans-latin-200-normal.woff2', weight: '200', style: 'normal' },
    { path: '../assets/fonts/dm-sans-latin-300-normal.woff2', weight: '300', style: 'normal' },
    { path: '../assets/fonts/dm-sans-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../assets/fonts/dm-sans-latin-500-normal.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--font-dm-sans',
  display:  'swap',
  preload:  true,
})

const dmMono = localFont({
  src: [
    { path: '../assets/fonts/dm-mono-latin-300-normal.woff2', weight: '300', style: 'normal' },
    { path: '../assets/fonts/dm-mono-latin-400-normal.woff2', weight: '400', style: 'normal' },
  ],
  variable: '--font-dm-mono',
  display:  'swap',
  preload:  false,
})

export const viewport: Viewport = {
  width:        'device-width',
  initialScale: 1,
  themeColor:   '#020408',
  colorScheme:  'dark',
}

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  ),
  title:       'Human Mind Explorer',
  description: 'An interactive journey through the human mind — from the first spark of consciousness to full integration.',
  keywords:    ['interactive', 'WebGL', 'consciousness', 'mind', 'creative', 'experience'],
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="4" fill="%23F0EEE8"/></svg>',
  },
  openGraph: {
    title:       'Human Mind Explorer',
    description: 'An interactive journey through the human mind.',
    type:        'website',
    locale:      'en_US',
    siteName:    'Human Mind Explorer',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Human Mind Explorer',
    description: 'An interactive journey through the human mind.',
  },
  robots: {
    index:  true,
    follow: true,
  },
  other: {
    'format-detection': 'telephone=no',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
