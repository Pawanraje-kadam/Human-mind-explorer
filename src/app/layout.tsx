import type { Metadata, Viewport } from 'next'
import { DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'

const dmMono = DM_Mono({
  subsets:  ['latin'],
  weight:   ['300', '400'],
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
