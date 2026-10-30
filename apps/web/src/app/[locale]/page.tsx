import { DEFAULT_LOCALE, SupportedLocaleEnum } from '@repo/shared-schemas'
import { setRequestLocale } from 'next-intl/server'
import { TechRadarTable } from '@/components/workfolio/tech-radar-table'
import {
  WorkfolioExperienceSection,
  WorkfolioHeroSection,
  WorkfolioProjectsSection,
} from '@/components/workfolio/workfolio-sections'

export default async function WorkfolioHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const parsed = SupportedLocaleEnum.safeParse(locale)
  setRequestLocale(parsed.success ? parsed.data : DEFAULT_LOCALE)

  return (
    <div className="mx-auto max-w-5xl space-y-16 px-4 py-6 sm:px-6">
      <WorkfolioHeroSection />
      <WorkfolioProjectsSection />
      <WorkfolioExperienceSection />
      <TechRadarTable />
    </div>
  )
}
