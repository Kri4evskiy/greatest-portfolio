'use client'

import { Button, Popover, PopoverContent, PopoverTrigger } from '@repo/ui'
import { ArrowUp, ChevronUp, ListTree, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import {
  useActiveWorkfolioSection,
  useSectionNavigation,
  WORKFOLIO_SECTION_IDS,
  type WorkfolioSectionId,
} from '@/shared/hooks/use-section-navigation'

const SECTION_TRANSLATION_KEYS: Record<
  WorkfolioSectionId,
  'about' | 'projects' | 'experience' | 'techRadar' | 'roadmap'
> = {
  about: 'about',
  projects: 'projects',
  experience: 'experience',
  'tech-radar': 'techRadar',
  roadmap: 'roadmap',
}

const SECTION_INDICES: Record<WorkfolioSectionId, string> = {
  about: '01',
  projects: '02',
  experience: '03',
  'tech-radar': '04',
  roadmap: '05',
}

export function PageSectionNavigator() {
  const t = useTranslations('Header')
  const activeSection = useActiveWorkfolioSection()
  const { scrollToSection, scrollToTop } = useSectionNavigation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const activeLabel = t(`nav.${SECTION_TRANSLATION_KEYS[activeSection]}`)
  const activeIndex = SECTION_INDICES[activeSection]

  const handleSelectSection = (id: WorkfolioSectionId) => {
    scrollToSection(id)
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Desktop Editorial Floating Section Rail (xl: >= 1280px) */}
      <aside
        aria-label={t('sectionNavTitle')}
        className="group/rail fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 xl:block 2xl:right-6"
      >
        <div className="rounded-xl border border-border/70 bg-card/90 p-2 shadow-xs backdrop-blur-md transition-all duration-200 hover:border-border hover:bg-card hover:shadow-lg">
          <div className="mb-1.5 hidden px-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground group-hover/rail:block min-[1480px]:block">
            {t('sectionNavTitle')}
          </div>

          <nav className="flex flex-col gap-1">
            {WORKFOLIO_SECTION_IDS.map((sectionId) => {
              const isActive = activeSection === sectionId
              const label = t(`nav.${SECTION_TRANSLATION_KEYS[sectionId]}`)
              const stepNum = SECTION_INDICES[sectionId]

              return (
                <Button
                  key={sectionId}
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={label}
                  aria-current={isActive ? 'location' : undefined}
                  onClick={() => handleSelectSection(sectionId)}
                  className={`h-auto justify-start gap-2.5 rounded-lg px-2 py-1.5 text-left text-xs ${
                    isActive
                      ? 'bg-primary/10 font-semibold text-foreground hover:bg-primary/15'
                      : 'font-normal text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  }`}
                >
                  <span
                    className={`h-1.5 rounded-full transition-all ${
                      isActive ? 'w-4 bg-primary' : 'w-2 bg-muted-foreground/40'
                    }`}
                  />
                  <span className="font-mono text-[10px] opacity-75">{stepNum}</span>
                  <span className="hidden max-w-[148px] truncate group-hover/rail:inline min-[1480px]:inline">
                    {label}
                  </span>
                </Button>
              )
            })}
          </nav>

          <div className="mt-1.5 border-t border-border/60 pt-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={t('scrollToTop')}
              onClick={scrollToTop}
              className="h-auto w-full justify-center gap-1.5 rounded-lg px-2 py-1 font-mono text-[10px] font-normal text-muted-foreground hover:bg-muted/70 hover:text-foreground group-hover/rail:justify-start min-[1480px]:justify-start"
            >
              <ArrowUp className="h-3 w-3 shrink-0" />
              <span className="hidden group-hover/rail:inline min-[1480px]:inline">{t('scrollToTop')}</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile & Tablet Thumb-Friendly Floating Pill Navigator (< 1280px) */}
      <div className="fixed bottom-4 right-4 z-40 xl:hidden">
        <Popover open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              aria-label={t('sectionNavTitle')}
              className="h-10 gap-2 rounded-full border-border bg-card/95 px-3.5 text-xs font-medium text-foreground shadow-lg backdrop-blur-md transition-transform active:scale-95"
            >
              <ListTree className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono text-[10px] text-muted-foreground">{activeIndex}</span>
              <span className="max-w-[120px] truncate">{activeLabel}</span>
              {isMobileMenuOpen ? (
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent
            side="top"
            align="end"
            sideOffset={8}
            className="w-64 rounded-xl border-border bg-card/95 p-2 shadow-xl backdrop-blur-md xl:hidden"
          >
            <div className="mb-1.5 flex items-center justify-between border-b border-border/60 px-2.5 pb-1.5">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t('sectionNavTitle')}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  scrollToTop()
                  setIsMobileMenuOpen(false)
                }}
                className="h-auto gap-1 rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-normal text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ArrowUp className="h-3 w-3" />
                <span>{t('scrollToTop')}</span>
              </Button>
            </div>

            <nav className="flex flex-col gap-1">
              {WORKFOLIO_SECTION_IDS.map((sectionId) => {
                const isActive = activeSection === sectionId
                const label = t(`nav.${SECTION_TRANSLATION_KEYS[sectionId]}`)
                const stepNum = SECTION_INDICES[sectionId]

                return (
                  <Button
                    key={sectionId}
                    type="button"
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleSelectSection(sectionId)}
                    className={`h-auto min-h-10 w-full justify-between rounded-lg px-3 py-2 text-left text-xs ${
                      isActive ? 'font-semibold' : 'font-normal text-foreground hover:bg-muted'
                    }`}
                  >
                    <span className="truncate">{label}</span>
                    <span
                      className={`ml-2 font-mono text-[10px] ${
                        isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                      }`}
                    >
                      {stepNum}
                    </span>
                  </Button>
                )
              })}
            </nav>
          </PopoverContent>
        </Popover>
      </div>
    </>
  )
}
