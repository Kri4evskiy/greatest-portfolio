import { DEFAULT_LOCALE, SUPPORTED_LOCALES, SupportedLocaleEnum } from '@repo/shared-schemas'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { SystemStatusDashboard } from '@/features/telemetry-stream/ui/system-status-dashboard'
import { buildLocalizedUrl, buildPageAlternates, resolveOgLocale } from '@/shared/lib/seo'

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
    alternates: buildPageAlternates('/system-status', resolvedLocale),
    openGraph: {
      title,
      description,
      url: buildLocalizedUrl('/system-status', resolvedLocale),
      locale: resolveOgLocale(resolvedLocale),
      type: 'website',
    },
  }
}

export default async function SystemStatusPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const parsed = SupportedLocaleEnum.safeParse(locale)
  const resolvedLocale = parsed.success ? parsed.data : DEFAULT_LOCALE

  return <SystemStatusDashboard locale={resolvedLocale} />
}
