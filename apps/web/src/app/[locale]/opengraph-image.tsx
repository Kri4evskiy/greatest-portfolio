import { SUPPORTED_LOCALES } from '@repo/shared-schemas'
import { ImageResponse } from 'next/og'

export const alt = 'Stanislav Krychevskyi — Senior Frontend / Full-Stack Engineer & Engineering Knowledge Base'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

const STACK_ROW_1 = ['Next.js 16 (App Router)', 'React 19 Compiler', 'NestJS 12 ESM', 'TypeScript 7.0'] as const
const STACK_ROW_2 = ['Prisma 7 ORM (Wasm)', 'Tailwind CSS v4', 'XYFlow & D3.js', 'TCP Microservice + SSE'] as const

const LOCALE_BADGE_MAP: Record<string, string> = {
  en: 'EN • DEFAULT EDITION',
  uk: 'UA • UKRAINIAN EDITION',
  ru: 'RU • RUSSIAN EDITION',
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const editionLabel = LOCALE_BADGE_MAP[locale] ?? LOCALE_BADGE_MAP.en

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#111110',
        color: '#F5F2EB',
        padding: '44px 56px',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}
    >
      {/* Outer Editorial Frame */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          borderRadius: 24,
          border: '2px solid #272725',
          backgroundColor: '#161615',
          padding: '38px 48px',
        }}
      >
        {/* Top Bar: Terminal Prompt >_ + Breadcrumb + Protected Status Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1.5px solid #262624',
            paddingBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 46,
                height: 46,
                borderRadius: 12,
                backgroundColor: '#111110',
                border: '1.5px solid #2F2F2C',
              }}
            >
              <span style={{ color: '#F5F2EB', fontSize: 22, fontWeight: 700 }}>{'>'}</span>
              <span style={{ color: '#10B981', fontSize: 22, fontWeight: 700 }}>_</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, color: '#A1A19A' }}>
                <span>workspace</span>
                <span style={{ color: '#52524E' }}>/</span>
                <span style={{ color: '#F5F2EB', fontWeight: 600 }}>workfolio-cv</span>
              </div>
              <span style={{ fontSize: 12, color: '#71716B', letterSpacing: 1.5 }}>{editionLabel}</span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              borderRadius: 9999,
              backgroundColor: '#111110',
              border: '1.5px solid #272725',
              padding: '10px 20px',
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 9999,
                backgroundColor: '#10B981',
              }}
            />
            <span style={{ fontSize: 15, color: '#E4E2DD', fontWeight: 600 }}>16 ADRs • Protected Knowledge Base</span>
          </div>
        </div>

        {/* Center Hero Section */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            marginTop: 8,
            marginBottom: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: '#10B981',
                letterSpacing: 2.5,
                textTransform: 'uppercase',
              }}
            >
              SENIOR FRONTEND / FULL-STACK ENGINEER • 5+ YEARS
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span
              style={{
                fontSize: 64,
                fontWeight: 700,
                color: '#F5F2EB',
                letterSpacing: -1.8,
                lineHeight: 1.05,
              }}
            >
              Stanislav Krychevskyi
            </span>
            <span
              style={{
                fontSize: 26,
                fontWeight: 400,
                color: '#A1A19A',
                lineHeight: 1.35,
              }}
            >
              Interactive Editorial Workfolio, Architecture Case Studies & Engineering Knowledge Base
            </span>
          </div>

          {/* Tech Stack Pills (2 rows of 4) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {STACK_ROW_1.map((item) => (
                <div
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 10,
                    backgroundColor: '#1E1E1C',
                    border: '1px solid #2E2E2B',
                    padding: '8px 16px',
                    fontSize: 16,
                    color: '#E4E2DD',
                    fontWeight: 600,
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {STACK_ROW_2.map((item) => (
                <div
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 10,
                    backgroundColor: '#111110',
                    border: '1px solid #272725',
                    padding: '8px 16px',
                    fontSize: 15,
                    color: '#A1A19A',
                    fontWeight: 500,
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Architectural Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1.5px solid #262624',
            paddingTop: 20,
            fontSize: 15,
            color: '#8E8E86',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#10B981', fontWeight: 700 }}>●</span>
              <span>Edge Web Crypto JWT (HS256)</span>
            </div>
            <span style={{ color: '#3F3F3B' }}>|</span>
            <span>Zero-Eval HAST MDX & Shiki</span>
            <span style={{ color: '#3F3F3B' }}>|</span>
            <span>IndexedDB Offline-First Cache</span>
          </div>

          <span style={{ color: '#F5F2EB', fontWeight: 600 }}>pnpm + Turborepo Monorepo</span>
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  )
}
