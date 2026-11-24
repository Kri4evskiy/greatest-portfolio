import { DEFAULT_LOCALE, getTechRadarItems, SupportedLocaleEnum } from '@repo/shared-schemas'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { getLocalizedRoadmapItems } from '@/entities/engineering-roadmap/engineering-roadmap'
import { EngineeringRoadmapBoard } from '@/entities/engineering-roadmap/engineering-roadmap-board'
import { TechRadarTable } from '@/entities/engineering-roadmap/tech-radar-table'
import { AUTHOR_PROFILE, AUTHOR_SKILL_GROUPS, pickLocalized } from '@/entities/workfolio-profile/author-profile'
import {
  WorkfolioExperienceSection,
  WorkfolioHeroSection,
  WorkfolioProjectsSection,
} from '@/entities/workfolio-profile/workfolio-sections'
import { pickIntlMessages } from '@/shared/i18n/pick-messages'
import { buildProfilePageJsonLd } from '@/shared/lib/seo'
import { PageSectionNavigator } from '@/widgets/section-nav/page-section-navigator'

export default async function WorkfolioHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const parsed = SupportedLocaleEnum.safeParse(locale)
  const resolvedLocale = parsed.success ? parsed.data : DEFAULT_LOCALE
  const [tMeta, messages] = await Promise.all([
    getTranslations({ locale: resolvedLocale, namespace: 'Metadata' }),
    getMessages({ locale: resolvedLocale }),
  ])
  const homeClientMessages = pickIntlMessages(messages, ['TechRadar', 'Roadmap'])

  // Project only the active locale on the server so inactive locale dictionaries never enter client JS
  const techRadarItems = getTechRadarItems(resolvedLocale)
  const roadmapItems = getLocalizedRoadmapItems(resolvedLocale)
  const profileJsonLd = buildProfilePageJsonLd({
    locale: resolvedLocale,
    pathname: '/',
    fullName: pickLocalized(AUTHOR_PROFILE.fullName, resolvedLocale),
    roleTitle: pickLocalized(AUTHOR_PROFILE.roleTitle, resolvedLocale),
    description: tMeta('description'),
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: profileJsonLd }} />
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-6 sm:space-y-16 sm:px-6 xl:pr-24 min-[1440px]:pr-6">
        <WorkfolioHeroSection locale={resolvedLocale} />
        <WorkfolioProjectsSection locale={resolvedLocale} />
        <WorkfolioExperienceSection locale={resolvedLocale} />
        <NextIntlClientProvider locale={resolvedLocale} messages={homeClientMessages}>
          <TechRadarTable items={techRadarItems} />
          <EngineeringRoadmapBoard items={roadmapItems} />
        </NextIntlClientProvider>
      </div>
      <PageSectionNavigator />
    </>
  )
}
