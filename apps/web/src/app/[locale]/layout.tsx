import '../globals.css'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, SupportedLocaleEnum } from '@repo/shared-schemas'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { type ReactNode, Suspense } from 'react'
import { GuestPassModal } from '@/features/auth/guest-pass-modal'
import { CommandPaletteModal } from '@/features/search/command-palette-modal'
import { PALETTE_INIT_SCRIPT } from '@/shared/lib/palette'
import { QueryProvider } from '@/shared/providers/query-provider'
import { ThemeProvider } from '@/shared/providers/theme-provider'
import { WorkfolioFooter } from '@/widgets/footer/workfolio-footer'
import { WorkfolioHeader } from '@/widgets/header/workfolio-header'

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const parsed = SupportedLocaleEnum.safeParse(locale)
  const resolvedLocale = parsed.success ? parsed.data : DEFAULT_LOCALE
  const t = await getTranslations({ locale: resolvedLocale, namespace: 'Metadata' })

  return {
    title: t('title'),
    description: t('description'),
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
    <html lang={parsed.data} suppressHydrationWarning>
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
              <div className="flex min-h-screen flex-col">
                <WorkfolioHeader />
                <Suspense fallback={null}>
                  <GuestPassModal />
                </Suspense>
                <CommandPaletteModal locale={parsed.data} />
                <main className="flex-1">{children}</main>
                <WorkfolioFooter locale={parsed.data} />
              </div>
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
