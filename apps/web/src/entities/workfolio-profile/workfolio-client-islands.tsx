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
import { useVisitorProfile } from '@/features/auth/queries/use-visitor-profile'
import { useSectionNavigation } from '@/shared/hooks/use-section-navigation'
import { APP_ROUTES, isPublicKnowledgeBasePath } from '@/shared/i18n/app-routes'
import { Link, useRouter } from '@/shared/i18n/navigation'
import { trackEvent } from '@/shared/lib/analytics'
import { useUIActions } from '@/shared/store/use-ui-store'

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

  const isUnlocked = profile?.role === 'USER' || profile?.role === 'ADMIN'

  const handleOpenKnowledgeBase = () => {
    router.push(APP_ROUTES.knowledgeBase)
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

      <Button
        asChild
        variant="outline"
        size="lg"
        className="w-full justify-center gap-2 border-primary/30 bg-primary/5 px-4 text-foreground hover:border-primary hover:bg-primary/10 sm:w-auto"
      >
        <Link href="/cv">
          <FileDown className="h-4 w-4 shrink-0 text-primary" />
          <span>{ctaCvPdf}</span>
        </Link>
      </Button>

      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() => scrollToSection('tech-radar')}
        className="w-full justify-center gap-2 px-4 sm:w-auto"
      >
        <Cpu className="h-4 w-4 shrink-0 text-primary" />
        <span>{ctaTechRadar}</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() => scrollToSection('roadmap')}
        className="w-full justify-center gap-2 px-4 sm:w-auto"
      >
        <Compass className="h-4 w-4 shrink-0 text-primary" />
        <span>{ctaRoadmap}</span>
      </Button>
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
  const { openGuestPassModal } = useUIActions()

  const isUnlocked = profile?.role === 'USER' || profile?.role === 'ADMIN'

  const targetUrl = `/knowledge-base/${category}/${slug}`
  const isAccessible = isUnlocked || isPublicKnowledgeBasePath(targetUrl)

  const handleReadCaseStudy = () => {
    if (isAccessible) {
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
      <span>{isAccessible ? readUnlockedLabel : readLockedLabel}</span>
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
      <Button
        type="button"
        variant="outline"
        aria-expanded={showEarlierRoles}
        onClick={() => setShowEarlierRoles((prev) => !prev)}
        className="h-auto w-full justify-between whitespace-normal rounded-xl border-dashed bg-muted/30 px-4 py-2.5 text-left font-mono text-xs font-medium text-foreground hover:border-primary/40 hover:bg-muted/60"
      >
        <span>{showEarlierRoles ? hideLabel : showLabel}</span>
        {showEarlierRoles ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
      </Button>

      {showEarlierRoles ? <div className="space-y-3">{children}</div> : null}
    </div>
  )
}
