import { ImageResponse } from 'next/og'

export const runtime     = 'edge'
export const alt         = 'Human Mind Explorer — An interactive journey through the human mind'
export const size        = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width:          '100%',
          height:         '100%',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          backgroundColor: '#020408',
          fontFamily:     'sans-serif',
        }}
      >
        {/* Radial glow — the awakening orb */}
        <div
          style={{
            width:           8,
            height:          8,
            borderRadius:    '50%',
            backgroundColor: '#F0EEE8',
            boxShadow:       '0 0 80px 40px rgba(240,238,232,0.3), 0 0 200px 100px rgba(240,238,232,0.1)',
            marginBottom:    80,
          }}
        />

        <p
          style={{
            fontSize:      48,
            fontWeight:    200,
            color:         '#F0EEE8',
            letterSpacing: '0.02em',
            margin:        0,
            marginBottom:  24,
          }}
        >
          human mind explorer
        </p>

        <p
          style={{
            fontSize:      18,
            fontWeight:    300,
            color:         '#A8B4C0',
            letterSpacing: '0.04em',
            margin:        0,
          }}
        >
          an interactive journey through consciousness
        </p>
      </div>
    ),
    { ...size }
  )
}
