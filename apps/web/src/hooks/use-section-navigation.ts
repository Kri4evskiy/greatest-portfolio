'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from '@/i18n/navigation'

export const WORKFOLIO_SECTION_IDS = ['about', 'projects', 'experience', 'tech-radar'] as const

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
 * Passive ScrollSpy hook tracking which CV section is currently in the viewport.
 */
export function useActiveWorkfolioSection(): WorkfolioSectionId {
  const [activeSection, setActiveSection] = useState<WorkfolioSectionId>('about')

  useEffect(() => {
    let rafId = 0

    const computeActiveSection = () => {
      const scrollY = window.scrollY
      const viewportHeight = window.innerHeight
      const docHeight = document.documentElement.scrollHeight

      if (scrollY < 48) {
        setActiveSection('about')
        return
      }

      if (scrollY + viewportHeight >= docHeight - 48) {
        setActiveSection('tech-radar')
        return
      }

      const triggerOffset = 160
      let matched: WorkfolioSectionId = 'about'

      for (const id of WORKFOLIO_SECTION_IDS) {
        const el = document.getElementById(id)
        if (!el) continue
        const top = el.getBoundingClientRect().top
        if (top <= triggerOffset) {
          matched = id
        }
      }

      setActiveSection(matched)
    }

    const handleScroll = () => {
      if (rafId !== 0) return
      rafId = window.requestAnimationFrame(() => {
        rafId = 0
        computeActiveSection()
      })
    }

    computeActiveSection()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId)
      }
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  return activeSection
}
