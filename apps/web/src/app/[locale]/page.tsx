import { DEFAULT_LOCALE, getTechRadarItems, SupportedLocaleEnum } from '@repo/shared-schemas'
import { getLocalizedRoadmapItems } from '@/entities/engineering-roadmap/engineering-roadmap'
import { EngineeringRoadmapBoard } from '@/entities/engineering-roadmap/engineering-roadmap-board'
import { TechRadarTable } from '@/entities/engineering-roadmap/tech-radar-table'
import {
  WorkfolioExperienceSection,
  WorkfolioHeroSection,
  WorkfolioProjectsSection,
} from '@/entities/workfolio-profile/workfolio-sections'
import { PageSectionNavigator } from '@/widgets/section-nav/page-section-navigator'

export default async function WorkfolioHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const parsed = SupportedLocaleEnum.safeParse(locale)
  const resolvedLocale = parsed.success ? parsed.data : DEFAULT_LOCALE

  // Project only the active locale on the server so inactive locale dictionaries never enter client JS
  const techRadarItems = getTechRadarItems(resolvedLocale)
  const roadmapItems = getLocalizedRoadmapItems(resolvedLocale)

  return (
    <>
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-6 sm:space-y-16 sm:px-6 xl:pr-24 min-[1440px]:pr-6">
        <WorkfolioHeroSection locale={resolvedLocale} />
        <WorkfolioProjectsSection locale={resolvedLocale} />
        <WorkfolioExperienceSection locale={resolvedLocale} />
        <TechRadarTable items={techRadarItems} />
        <EngineeringRoadmapBoard items={roadmapItems} />
      </div>
      <PageSectionNavigator />
    </>
  )
}
