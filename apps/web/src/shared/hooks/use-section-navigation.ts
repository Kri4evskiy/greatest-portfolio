'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from '@/shared/i18n/navigation'

export const WORKFOLIO_SECTION_IDS = ['about', 'projects', 'experience', 'tech-radar', 'roadmap'] as const

export type WorkfolioSectionId = (typeof WORKFOLIO_SECTION_IDS)[number]

/**
 * Reliable programmatic anchor navigation that avoids Next.js App Router ignoring
 * repeated clicks on an already-active URL #hash after manual user scrolling.
 */
export function useSectionNavigation() {
  const pathname = usePathname()
  const router = useRouter()

  const scrollToSection = useCallback(
    (sectionId: WorkfolioSectionId) => {
      if (pathname === '/') {
        const element = document.getElementById(sectionId)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          window.history.replaceState(null, '', `#${sectionId}`)
          return
        }
      }
      router.push(`/#${sectionId}`)
    },
    [pathname, router],
  )

  const scrollToTop = useCallback(() => {
    if (pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
      return
    }
    router.push('/')
  }, [pathname, router])

  return {
    scrollToSection,
    scrollToTop,
  }
}

/**
 * Zero-layout-thrashing IntersectionObserver ScrollSpy tracking which CV section
 * is currently active in the viewport without scroll-tick `getBoundingClientRect()` loops.
 */
export function useActiveWorkfolioSection(): WorkfolioSectionId {
  const [activeSection, setActiveSection] = useState<WorkfolioSectionId>('about')

  useEffect(() => {
    const elements = WORKFOLIO_SECTION_IDS.map((id) => ({
      id,
      el: document.getElementById(id),
    })).filter((item): item is { id: WorkfolioSectionId; el: HTMLElement } => item.el !== null)

    if (elements.length === 0) return

    const visibleSet = new Set<WorkfolioSectionId>()
    const lastTopMap = new Map<WorkfolioSectionId, number>()
    let isLastSectionFullyVisible = false

    const resolveActive = () => {
      if (isLastSectionFullyVisible) {
        setActiveSection('roadmap')
        return
      }

      for (const id of WORKFOLIO_SECTION_IDS) {
        if (visibleSet.has(id)) {
          setActiveSection(id)
          return
        }
      }

      let fallback: WorkfolioSectionId = 'about'
      for (const id of WORKFOLIO_SECTION_IDS) {
        const top = lastTopMap.get(id)
        if (top !== undefined && top <= 160) {
          fallback = id
        }
      }
      setActiveSection(fallback)
    }

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id as WorkfolioSectionId
          lastTopMap.set(id, entry.boundingClientRect.top)
          if (entry.isIntersecting) {
            visibleSet.add(id)
          } else {
            visibleSet.delete(id)
          }
        }
        resolveActive()
      },
      {
        rootMargin: '-112px 0px -55% 0px',
        threshold: 0,
      },
    )

    for (const { el } of elements) {
      sectionObserver.observe(el)
    }

    // Ensure the short bottom section (`roadmap`) activates reliably when scrolled to the bottom
    const roadmapEl = document.getElementById('roadmap')
    const bottomObserver = roadmapEl
      ? new IntersectionObserver(
          (entries) => {
            const entry = entries[0]
            if (!entry) return
            isLastSectionFullyVisible = entry.isIntersecting
            resolveActive()
          },
          { threshold: 0.85 },
        )
      : null

    if (roadmapEl && bottomObserver) {
      bottomObserver.observe(roadmapEl)
    }

    return () => {
      sectionObserver.disconnect()
      bottomObserver?.disconnect()
    }
  }, [])

  return activeSection
}
