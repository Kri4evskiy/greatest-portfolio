import { DEFAULT_LOCALE, SUPPORTED_LOCALES, SupportedLocaleEnum } from '@repo/shared-schemas'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { CvDocumentShowcase } from '@/components/workfolio/cv-document-showcase'
import { getLatestCvFileMetadata } from '@/lib/cv-file'

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const parsed = SupportedLocaleEnum.safeParse(locale)
  const resolvedLocale = parsed.success ? parsed.data : DEFAULT_LOCALE
  const t = await getTranslations({ locale: resolvedLocale, namespace: 'CvPage' })

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

export default async function CvResumePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const parsed = SupportedLocaleEnum.safeParse(locale)
  const resolvedLocale = parsed.success ? parsed.data : DEFAULT_LOCALE
  const cvMeta = getLatestCvFileMetadata()

  return <CvDocumentShowcase cvMeta={cvMeta} locale={resolvedLocale} />
}
