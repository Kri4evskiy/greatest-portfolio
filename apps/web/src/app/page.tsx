import { TechRadarTable } from '@/components/workfolio/tech-radar-table';
import {
  WorkfolioExperienceSection,
  WorkfolioHeroSection,
  WorkfolioProjectsSection,
} from '@/components/workfolio/workfolio-sections';

export default function WorkfolioHomePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-16 px-4 py-6 sm:px-6">
      <WorkfolioHeroSection />
      <WorkfolioProjectsSection />
      <WorkfolioExperienceSection />
      <TechRadarTable />
    </div>
  );
}
