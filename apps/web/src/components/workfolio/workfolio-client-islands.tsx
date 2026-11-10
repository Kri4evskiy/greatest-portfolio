'use client'

import { Button } from '@repo/ui'
import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Compass,
  Cpu,
  ExternalLink,
  FileDown,
  Lock,
  LockOpen,
} from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { useSectionNavigation } from '@/hooks/use-section-navigation'
import { useVisitorProfile } from '@/hooks/use-visitor-profile'
import { Link, useRouter } from '@/i18n/navigation'
import { trackEvent } from '@/lib/analytics'
import { useUIStore } from '@/store/use-ui-store'

interface HeroActionRowProps {
  ctaUnlocked: string
  ctaLocked: string
  ctaCvPdf: string
  ctaTechRadar: string
  ctaRoadmap: string
}

export function HeroActionRow({ ctaUnlocked, ctaLocked, ctaCvPdf, ctaTechRadar, ctaRoadmap }: HeroActionRowProps) {
  const router = useRouter()
  const { scrollToSection } = useSectionNavigation()
  const { data: profile } = useVisitorProfile()
  const openGuestPassModal = useUIStore((s) => s.openGuestPassModal)

  const isUnlocked = profile?.role === 'USER' || profile?.role === 'ADMIN'

  const handleOpenKnowledgeBase = () => {
    if (isUnlocked) {
      router.push('/knowledge-base')
      return
    }
    trackEvent('guest_pass_modal_opened', { source: 'hero_cta' })
    openGuestPassModal('/knowledge-base')
  }

  return (
    <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
      <Button
        type="button"
        size="lg"
        onClick={handleOpenKnowledgeBase}
        className="w-full justify-center gap-2 sm:w-auto"
      >
        {isUnlocked ? (
          <>
            <LockOpen className="h-4 w-4 shrink-0 text-success" />
            <span className="truncate">{ctaUnlocked}</span>
          </>
        ) : (
          <>
            <Lock className="h-4 w-4 shrink-0 text-warning" />
            <span className="truncate">{ctaLocked}</span>
          </>
        )}
        <ArrowUpRight className="h-4 w-4 shrink-0" />
      </Button>

      <Link
        href="/cv"
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-4 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/10 sm:w-auto"
      >
        <FileDown className="h-4 w-4 shrink-0 text-primary" />
        <span>{ctaCvPdf}</span>
      </Link>

      <button
        type="button"
        onClick={() => scrollToSection('tech-radar')}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent sm:w-auto"
      >
        <Cpu className="h-4 w-4 shrink-0 text-primary" />
        <span>{ctaTechRadar}</span>
      </button>

      <button
        type="button"
        onClick={() => scrollToSection('roadmap')}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent sm:w-auto"
      >
        <Compass className="h-4 w-4 shrink-0 text-primary" />
        <span>{ctaRoadmap}</span>
      </button>
    </div>
  )
}

interface CaseStudyReadButtonProps {
  category: string
  slug: string
  readUnlockedLabel: string
  readLockedLabel: string
}

export function CaseStudyReadButton({ category, slug, readUnlockedLabel, readLockedLabel }: CaseStudyReadButtonProps) {
  const router = useRouter()
  const { data: profile } = useVisitorProfile()
  const openGuestPassModal = useUIStore((s) => s.openGuestPassModal)

  const isUnlocked = profile?.role === 'USER' || profile?.role === 'ADMIN'

  const handleReadCaseStudy = () => {
    const targetUrl = `/knowledge-base/${category}/${slug}`
    if (isUnlocked) {
      router.push(targetUrl)
      return
    }
    trackEvent('guest_pass_modal_opened', { source: `case_study_${slug}` })
    openGuestPassModal(targetUrl)
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleReadCaseStudy}
      className="w-full justify-between font-mono text-xs"
    >
      <span>{isUnlocked ? readUnlockedLabel : readLockedLabel}</span>
      <ExternalLink className="h-3.5 w-3.5" />
    </Button>
  )
}

interface EarlierRolesDisclosureProps {
  showLabel: string
  hideLabel: string
  children: ReactNode
}

export function EarlierRolesDisclosure({ showLabel, hideLabel, children }: EarlierRolesDisclosureProps) {
  const [showEarlierRoles, setShowEarlierRoles] = useState(false)

  return (
    <div className="space-y-3">
      <button
        type="button"
        aria-expanded={showEarlierRoles}
        onClick={() => setShowEarlierRoles((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border border-dashed border-border bg-muted/30 px-4 py-2.5 text-left font-mono text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted/60"
      >
        <span>{showEarlierRoles ? hideLabel : showLabel}</span>
        {showEarlierRoles ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {showEarlierRoles ? <div className="space-y-3">{children}</div> : null}
    </div>
  )
}
