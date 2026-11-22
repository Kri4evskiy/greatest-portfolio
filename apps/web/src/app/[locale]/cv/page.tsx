import { DEFAULT_LOCALE, SUPPORTED_LOCALES, SupportedLocaleEnum } from '@repo/shared-schemas'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AUTHOR_PROFILE, AUTHOR_SKILL_GROUPS, pickLocalized } from '@/entities/workfolio-profile/author-profile'
import { CvDocumentShowcase } from '@/entities/workfolio-profile/cv-document-showcase'
import { getLatestCvFileMetadata } from '@/entities/workfolio-profile/cv-file'
import { APP_ROUTES } from '@/shared/i18n/app-routes'
import { buildLocalizedUrl, buildPageAlternates, buildProfilePageJsonLd, resolveOgLocale } from '@/shared/lib/seo'

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const parsed = SupportedLocaleEnum.safeParse(locale)
  const resolvedLocale = parsed.success ? parsed.data : DEFAULT_LOCALE
  const t = await getTranslations({ locale: resolvedLocale, namespace: 'CvPage' })
  const title = t('metaTitle')
  const description = t('metaDescription')

  return {
    title,
    description,
    alternates: buildPageAlternates(APP_ROUTES.cv, resolvedLocale),
    openGraph: {
      title,
      description,
      url: buildLocalizedUrl(APP_ROUTES.cv, resolvedLocale),
      locale: resolveOgLocale(resolvedLocale),
      type: 'profile',
    },
  }
}

export default async function CvResumePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const parsed = SupportedLocaleEnum.safeParse(locale)
  const resolvedLocale = parsed.success ? parsed.data : DEFAULT_LOCALE
  const cvMeta = getLatestCvFileMetadata()
  const t = await getTranslations({ locale: resolvedLocale, namespace: 'CvPage' })
  const cvJsonLd = buildProfilePageJsonLd({
    locale: resolvedLocale,
    pathname: APP_ROUTES.cv,
    fullName: pickLocalized(AUTHOR_PROFILE.fullName, resolvedLocale),
    roleTitle: pickLocalized(AUTHOR_PROFILE.roleTitle, resolvedLocale),
    description: t('metaDescription'),
    sameAs: [
      AUTHOR_PROFILE.contacts.githubUrl,
      AUTHOR_PROFILE.contacts.linkedinUrl,
      AUTHOR_PROFILE.contacts.telegramUrl,
    ],
    knowsAbout: AUTHOR_SKILL_GROUPS.flatMap((group) => group.skills),
  })

  return (
    <>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: Server-serialized JSON-LD escaped against < script injection */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: cvJsonLd }} />
      <CvDocumentShowcase cvMeta={cvMeta} locale={resolvedLocale} />
    </>
  )
}
