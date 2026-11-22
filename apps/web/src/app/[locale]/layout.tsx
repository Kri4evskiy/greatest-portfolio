import '../globals.css'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, SupportedLocaleEnum } from '@repo/shared-schemas'
import { TooltipProvider } from '@repo/ui'
import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { type ReactNode, Suspense } from 'react'
import { GuestPassModal } from '@/features/auth/guest-pass-modal'
import { CommandPaletteModal } from '@/features/search/command-palette-modal'
import { PALETTE_INIT_SCRIPT } from '@/shared/lib/palette'
import { buildLocalizedUrl, buildPageAlternates, resolveOgLocale, resolveSiteUrl } from '@/shared/lib/seo'
import { QueryProvider } from '@/shared/providers/query-provider'
import { ThemeProvider } from '@/shared/providers/theme-provider'
import { WorkfolioFooter } from '@/widgets/footer/workfolio-footer'
import { WorkfolioHeader } from '@/widgets/header/workfolio-header'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF8F5' },
    { media: '(prefers-color-scheme: dark)', color: '#121211' },
  ],
  colorScheme: 'light dark',
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const parsed = SupportedLocaleEnum.safeParse(locale)
  const resolvedLocale = parsed.success ? parsed.data : DEFAULT_LOCALE
  const t = await getTranslations({ locale: resolvedLocale, namespace: 'Metadata' })
  const title = t('title')
  const description = t('description')

  return {
    metadataBase: new URL(resolveSiteUrl()),
    title,
    description,
    authors: [{ name: 'Stanislav Krychevskyi', url: 'https://github.com/Kri4evskiy' }],
    creator: 'Stanislav Krychevskyi',
    publisher: 'Stanislav Krychevskyi',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    alternates: buildPageAlternates('/', resolvedLocale),
    openGraph: {
      title,
      description,
      url: buildLocalizedUrl('/', resolvedLocale),
      siteName: 'Stanislav Krychevskyi — Workfolio & Knowledge Base',
      locale: resolveOgLocale(resolvedLocale),
      type: 'website',
    },
  }
}

export default async function LocaleRootLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const parsed = SupportedLocaleEnum.safeParse(locale)
  if (!parsed.success) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <html
      lang={parsed.data}
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: Static allowlisted IIFE preventing FOUC for saved data-palette before hydration */}
        <script dangerouslySetInnerHTML={{ __html: PALETTE_INIT_SCRIPT }} />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-primary selection:text-primary-foreground"
      >
        <NextIntlClientProvider locale={parsed.data} messages={messages}>
          <ThemeProvider>
            <QueryProvider>
              <TooltipProvider delayDuration={300} skipDelayDuration={200}>
                <div className="flex min-h-screen flex-col">
                  <WorkfolioHeader />
                  <Suspense fallback={null}>
                    <GuestPassModal />
                  </Suspense>
                  <CommandPaletteModal locale={parsed.data} />
                  <main className="flex-1">{children}</main>
                  <WorkfolioFooter locale={parsed.data} />
                </div>
              </TooltipProvider>
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
