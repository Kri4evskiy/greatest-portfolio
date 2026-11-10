import { DEFAULT_LOCALE, getTechRadarItems, SupportedLocaleEnum } from '@repo/shared-schemas'
import { PageSectionNavigator } from '@/components/layout/page-section-navigator'
import { EngineeringRoadmapBoard } from '@/components/workfolio/engineering-roadmap-board'
import { TechRadarTable } from '@/components/workfolio/tech-radar-table'
import {
  WorkfolioExperienceSection,
  WorkfolioHeroSection,
  WorkfolioProjectsSection,
} from '@/components/workfolio/workfolio-sections'
import { getLocalizedRoadmapItems } from '@/data/engineering-roadmap'

export default async function WorkfolioHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const parsed = SupportedLocaleEnum.safeParse(locale)
  const resolvedLocale = parsed.success ? parsed.data : DEFAULT_LOCALE

  // Project only the active locale on the server so inactive locale dictionaries never enter client JS
  const techRadarItems = getTechRadarItems(resolvedLocale)
  const roadmapItems = getLocalizedRoadmapItems(resolvedLocale)

  return (
    <>
      <div className="mx-auto max-w-5xl space-y-12 px-4 py-6 sm:space-y-16 sm:px-6">
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
