'use client'

import { ArrowUp, ChevronUp, ListTree, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import {
  useActiveWorkfolioSection,
  useSectionNavigation,
  WORKFOLIO_SECTION_IDS,
  type WorkfolioSectionId,
} from '@/hooks/use-section-navigation'

const SECTION_TRANSLATION_KEYS: Record<WorkfolioSectionId, 'about' | 'projects' | 'experience' | 'techRadar'> = {
  about: 'about',
  projects: 'projects',
  experience: 'experience',
  'tech-radar': 'techRadar',
}

const SECTION_INDICES: Record<WorkfolioSectionId, string> = {
  about: '01',
  projects: '02',
  experience: '03',
  'tech-radar': '04',
}

export function PageSectionNavigator() {
  const t = useTranslations('Header')
  const activeSection = useActiveWorkfolioSection()
  const { scrollToSection, scrollToTop } = useSectionNavigation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isMobileMenuOpen) return

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown, { passive: true })
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMobileMenuOpen])

  const activeLabel = t(`nav.${SECTION_TRANSLATION_KEYS[activeSection]}`)
  const activeIndex = SECTION_INDICES[activeSection]

  const handleSelectSection = (id: WorkfolioSectionId) => {
    scrollToSection(id)
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Desktop Notion-style Floating Section Rail (xl: >= 1280px) */}
      <aside
        aria-label={t('sectionNavTitle')}
        className="group/rail fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 xl:block 2xl:right-6"
      >
        <div className="rounded-xl border border-border/70 bg-card/90 p-2 shadow-sm backdrop-blur-md transition-all duration-200 hover:border-border hover:bg-card hover:shadow-lg">
          <div className="mb-1.5 hidden px-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground group-hover/rail:block min-[1480px]:block">
            {t('sectionNavTitle')}
          </div>

          <nav className="flex flex-col gap-1">
            {WORKFOLIO_SECTION_IDS.map((sectionId) => {
              const isActive = activeSection === sectionId
              const label = t(`nav.${SECTION_TRANSLATION_KEYS[sectionId]}`)
              const stepNum = SECTION_INDICES[sectionId]

              return (
                <button
                  key={sectionId}
                  type="button"
                  onClick={() => handleSelectSection(sectionId)}
                  title={label}
                  className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                    isActive
                      ? 'bg-primary/10 font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
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
                </button>
              )
            })}
          </nav>

          <div className="mt-1.5 border-t border-border/60 pt-1.5">
            <button
              type="button"
              onClick={scrollToTop}
              title={t('scrollToTop')}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground group-hover/rail:justify-start min-[1480px]:justify-start"
            >
              <ArrowUp className="h-3 w-3 shrink-0" />
              <span className="hidden group-hover/rail:inline min-[1480px]:inline">{t('scrollToTop')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile & Tablet Thumb-Friendly Floating Pill Navigator (< 1280px) */}
      <div ref={mobileMenuRef} className="fixed bottom-4 right-4 z-40 xl:hidden">
        {isMobileMenuOpen ? (
          <div className="mb-2 w-64 rounded-xl border border-border bg-card/95 p-2 shadow-xl backdrop-blur-md">
            <div className="mb-1.5 flex items-center justify-between border-b border-border/60 px-2.5 pb-1.5">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t('sectionNavTitle')}
              </span>
              <button
                type="button"
                onClick={scrollToTop}
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ArrowUp className="h-3 w-3" />
                <span>{t('scrollToTop')}</span>
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              {WORKFOLIO_SECTION_IDS.map((sectionId) => {
                const isActive = activeSection === sectionId
                const label = t(`nav.${SECTION_TRANSLATION_KEYS[sectionId]}`)
                const stepNum = SECTION_INDICES[sectionId]

                return (
                  <button
                    key={sectionId}
                    type="button"
                    onClick={() => handleSelectSection(sectionId)}
                    className={`flex min-h-10 items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                      isActive ? 'bg-primary text-primary-foreground font-semibold' : 'text-foreground hover:bg-muted'
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
                  </button>
                )
              })}
            </nav>
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="button"
            aria-expanded={isMobileMenuOpen}
            aria-label={t('sectionNavTitle')}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card/95 px-3.5 text-xs font-medium text-foreground shadow-lg backdrop-blur-md transition-transform active:scale-95"
          >
            <ListTree className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-[10px] text-muted-foreground">{activeIndex}</span>
            <span className="max-w-[120px] truncate">{activeLabel}</span>
            {isMobileMenuOpen ? (
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
    </>
  )
}
