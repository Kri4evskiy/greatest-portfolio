import { ImageResponse } from 'next/og'

export const dynamic = 'force-static'

export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111110',
        borderRadius: 8,
        border: '1.5px solid #2A2A28',
        position: 'relative',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          marginTop: -1,
        }}
      >
        <span
          style={{
            color: '#F5F2EB',
            fontSize: 16,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {'>'}
        </span>
        <span
          style={{
            color: '#10B981',
            fontSize: 16,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          _
        </span>
      </div>
    </div>,
    {
      ...size,
    },
  )
}
