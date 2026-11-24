import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale, SupportedLocaleEnum } from '@repo/shared-schemas'
import { ImageResponse } from 'next/og'

export const alt = 'Stanislav Krychevskyi — Senior Frontend / Full-Stack Engineer & Engineering Knowledge Base'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

const STACK_ROW_1 = ['Next.js 16 (App Router)', 'React 19 Compiler', 'NestJS 12 ESM', 'TypeScript 7.0'] as const
const STACK_ROW_2 = ['Prisma 7 ORM (Wasm)', 'Tailwind CSS v4', 'XYFlow & D3.js', 'TCP Microservice + SSE'] as const

interface OgLocaleCopy {
  editionLabel: string
  statusPill: string
  roleEyebrow: string
  fullName: string
  tagline: string
  footerBadge: string
}

const OG_LOCALE_COPY: Record<SupportedLocale, OgLocaleCopy> = {
  en: {
    editionLabel: 'EN • DEFAULT EDITION',
    statusPill: '16 ADRs • Engineering Knowledge Base',
    roleEyebrow: 'SENIOR FRONTEND / FULL-STACK ENGINEER • 5+ YEARS',
    fullName: 'Stanislav Krychevskyi',
    tagline: 'Interactive Editorial Workfolio, Architecture Case Studies & Engineering Knowledge Base',
    footerBadge: 'pnpm + Turborepo Monorepo',
  },
  uk: {
    editionLabel: 'UA • УКРАЇНСЬКА ВЕРСІЯ',
    statusPill: '16 ADR • Інженерна База Знань',
    roleEyebrow: 'SENIOR FRONTEND / FULL-STACK ІНЖЕНЕР • 5+ РОКІВ',
    fullName: 'Станіслав Кричевський',
    tagline: 'Інтерактивне Workfolio-резюме, архітектурні кейси та інженерна База Знань',
    footerBadge: 'pnpm + Turborepo Монорепозиторій',
  },
  ru: {
    editionLabel: 'RU • РУССКАЯ ВЕРСИЯ',
    statusPill: '16 ADR • Инженерная База Знаний',
    roleEyebrow: 'SENIOR FRONTEND / FULL-STACK ИНЖЕНЕР • 5+ ЛЕТ',
    fullName: 'Станислав Кричевский',
    tagline: 'Интерактивное Workfolio-резюме, архитектурные кейсы и инженерная База Знаний',
    footerBadge: 'pnpm + Turborepo Монорепозиторий',
  },
}

interface SatoriFont {
  name: string
  data: ArrayBuffer
  weight: 400 | 700
  style: 'normal'
}

let cachedInterFontsPromise: Promise<SatoriFont[]> | null = null

async function fetchGoogleFontTtf(weight: 400 | 700): Promise<SatoriFont | null> {
  try {
    // Requesting Google Fonts CSS without a modern woff2 User-Agent yields direct .ttf URLs supported by Satori
    const cssRes = await fetch(`https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&display=swap`, {
      signal: AbortSignal.timeout(4000),
    })
    if (!cssRes.ok) return null
    const css = await cssRes.text()
    const match = css.match(/src:\s*url\((https:\/\/[^)]+\.ttf)\)/)
    const fontUrl = match?.[1]
    if (!fontUrl) return null

    const fontRes = await fetch(fontUrl, { signal: AbortSignal.timeout(4000) })
    if (!fontRes.ok) return null
    return {
      name: 'Inter',
      data: await fontRes.arrayBuffer(),
      weight,
      style: 'normal',
    }
  } catch {
    return null
  }
}

function loadInterOgFonts(): Promise<SatoriFont[]> {
  if (!cachedInterFontsPromise) {
    cachedInterFontsPromise = Promise.all([fetchGoogleFontTtf(400), fetchGoogleFontTtf(700)]).then((results) =>
      results.filter((entry): entry is SatoriFont => entry !== null),
    )
  }
  return cachedInterFontsPromise
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const parsed = SupportedLocaleEnum.safeParse(locale)
  const resolvedLocale = parsed.success ? parsed.data : DEFAULT_LOCALE

  const fonts = await loadInterOgFonts()
  const hasCyrillicCapableFont = fonts.length > 0
  // Fallback to English copy when offline build cannot fetch Inter TTF so Satori never renders tofu glyphs
  const copy = hasCyrillicCapableFont ? OG_LOCALE_COPY[resolvedLocale] : OG_LOCALE_COPY.en

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
        fontFamily: hasCyrillicCapableFont ? 'Inter, sans-serif' : 'sans-serif',
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
        {/* Top Bar: Terminal Prompt >_ + Breadcrumb + Status Pill */}
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
                <span style={{ color: '#F5F2EB', fontWeight: 700 }}>workfolio-cv</span>
              </div>
              <span style={{ fontSize: 12, color: '#71716B', letterSpacing: 1.5 }}>{copy.editionLabel}</span>
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
            <span style={{ fontSize: 15, color: '#E4E2DD', fontWeight: 700 }}>{copy.statusPill}</span>
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
                letterSpacing: 2.2,
                textTransform: 'uppercase',
              }}
            >
              {copy.roleEyebrow}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span
              style={{
                fontSize: 62,
                fontWeight: 700,
                color: '#F5F2EB',
                letterSpacing: -1.6,
                lineHeight: 1.05,
              }}
            >
              {copy.fullName}
            </span>
            <span
              style={{
                fontSize: 25,
                fontWeight: 400,
                color: '#A1A19A',
                lineHeight: 1.35,
              }}
            >
              {copy.tagline}
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
                    fontWeight: 700,
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
                    fontWeight: 400,
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

          <span style={{ color: '#F5F2EB', fontWeight: 700 }}>{copy.footerBadge}</span>
        </div>
      </div>
    </div>,
    {
      ...size,
      ...(fonts.length > 0 ? { fonts } : {}),
    },
  )
}
