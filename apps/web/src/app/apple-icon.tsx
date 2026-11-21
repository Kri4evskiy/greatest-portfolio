import { ImageResponse } from 'next/og'

export const dynamic = 'force-static'

export const size = {
  width: 180,
  height: 180,
}

export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111110',
        borderRadius: 40,
        border: '4px solid #2A2A28',
        position: 'relative',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 22,
          right: 22,
          width: 14,
          height: 14,
          borderRadius: 9999,
          backgroundColor: '#10B981',
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          marginTop: -4,
        }}
      >
        <span
          style={{
            color: '#F5F2EB',
            fontSize: 82,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: -2,
          }}
        >
          {'>'}
        </span>
        <span
          style={{
            color: '#10B981',
            fontSize: 82,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          _
        </span>
      </div>
      <span
        style={{
          marginTop: 6,
          color: '#A1A19A',
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: 3,
        }}
      >
        SK • CV
      </span>
    </div>,
    {
      ...size,
    },
  )
}
