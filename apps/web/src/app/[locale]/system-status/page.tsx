import { DEFAULT_LOCALE, SUPPORTED_LOCALES, SupportedLocaleEnum } from '@repo/shared-schemas'
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { SystemStatusDashboard } from '@/features/telemetry-stream/ui/system-status-dashboard'
import { APP_ROUTES } from '@/shared/i18n/app-routes'
import { pickIntlMessages } from '@/shared/i18n/pick-messages'
import { buildOpenGraphMetadata, buildPageAlternates } from '@/shared/lib/seo'

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const parsed = SupportedLocaleEnum.safeParse(locale)
  const resolvedLocale = parsed.success ? parsed.data : DEFAULT_LOCALE
  const t = await getTranslations({ locale: resolvedLocale, namespace: 'SystemStatusPage' })
  const title = t('metaTitle')
  const description = t('metaDescription')

  return {
    title,
    description,
    alternates: buildPageAlternates(APP_ROUTES.systemStatus, resolvedLocale),
    openGraph: buildOpenGraphMetadata({
      title,
      description,
      pathname: APP_ROUTES.systemStatus,
      locale: resolvedLocale,
      type: 'website',
    }),
  }
}

export default async function SystemStatusPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const parsed = SupportedLocaleEnum.safeParse(locale)
  const resolvedLocale = parsed.success ? parsed.data : DEFAULT_LOCALE
  const messages = await getMessages({ locale: resolvedLocale })
  const statusClientMessages = pickIntlMessages(messages, ['SystemStatusPage'])

  return (
    <NextIntlClientProvider locale={resolvedLocale} messages={statusClientMessages}>
      <SystemStatusDashboard locale={resolvedLocale} />
    </NextIntlClientProvider>
  )
}
