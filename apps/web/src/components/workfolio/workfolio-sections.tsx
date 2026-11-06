'use client'

import { Badge, Button, Callout, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@repo/ui'
import {
  ArrowUpRight,
  Briefcase,
  Cpu,
  ExternalLink,
  GitBranch,
  Lock,
  LockOpen,
  ShieldCheck,
  Terminal,
  Zap,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useSectionNavigation } from '@/hooks/use-section-navigation'
import { useVisitorProfile } from '@/hooks/use-visitor-profile'
import { useRouter } from '@/i18n/navigation'
import { trackEvent } from '@/lib/analytics'
import { useUIStore } from '@/store/use-ui-store'

interface CaseStudyConfig {
  id: 'monorepo-adr' | 'react19-compiler-d3' | 'zero-trust-jwt-sse' | 'offline-first-redact-docker'
  tags: string[]
  articleSlug: string
  articleCategory: string
}

const CASE_STUDY_CONFIGS: readonly CaseStudyConfig[] = [
  {
    id: 'monorepo-adr',
    tags: ['pnpm', 'Turborepo', 'Zod', 'Biome.js', 'Lefthook'],
    articleSlug: 'adr-full-stack-catalog',
    articleCategory: 'typescript',
  },
  {
    id: 'react19-compiler-d3',
    tags: ['React 19', 'Next.js 16', 'D3.js', 'Zustand', 'SSG'],
    articleSlug: 'react-18-vs-19-compiler-d3',
    articleCategory: 'react',
  },
  {
    id: 'zero-trust-jwt-sse',
    tags: ['NestJS', 'JWT HttpOnly', 'Prisma ORM', 'Microservices', 'RxJS SSE'],
    articleSlug: 'nestjs-jwt-httponly-prisma-sse',
    articleCategory: 'nestjs-prisma',
  },
  {
    id: 'offline-first-redact-docker',
    tags: ['IndexedDB', 'TanStack Query v5', 'TanStack Redact', 'Docker', 'Sentry'],
    articleSlug: 'tanstack-redact-bundle-docker',
    articleCategory: 'architecture-devops',
  },
]

const EXPERIENCE_KEYS = ['senior', 'fullstack'] as const

export function WorkfolioHeroSection() {
  const t = useTranslations('Hero')
  const router = useRouter()
  const { scrollToSection } = useSectionNavigation()
  const { data: profile } = useVisitorProfile()
  const openGuestPassModal = useUIStore((s) => s.openGuestPassModal)

  const isUnlocked = profile?.role === 'USER' || profile?.role === 'ADMIN'

  const handleOpenKnowledgeBase = (targetPath = '/knowledge-base') => {
    if (isUnlocked) {
      router.push(targetPath)
      return
    }
    trackEvent('guest_pass_modal_opened', { source: 'hero_cta' })
    openGuestPassModal(targetPath)
  }

  return (
    <section id="about" className="scroll-mt-20 space-y-6 pt-3 sm:pt-6">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success" className="font-mono text-[11px] sm:text-xs">
            {t('openBadge')}
          </Badge>
          <Badge variant="outline" className="font-mono text-[11px] sm:text-xs">
            {t('stackBadge')}
          </Badge>
        </div>

        <h1 className="text-2xl font-bold tracking-tight sm:text-5xl">{t('title')}</h1>

        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-lg">{t('description')}</p>

        <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <Button
            type="button"
            size="lg"
            onClick={() => handleOpenKnowledgeBase('/knowledge-base')}
            className="w-full justify-center gap-2 sm:w-auto"
          >
            {isUnlocked ? (
              <>
                <LockOpen className="h-4 w-4 shrink-0 text-emerald-400" />
                <span className="truncate">{t('ctaUnlocked')}</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 shrink-0 text-amber-400" />
                <span className="truncate">{t('ctaLocked')}</span>
              </>
            )}
            <ArrowUpRight className="h-4 w-4 shrink-0" />
          </Button>

          <button
            type="button"
            onClick={() => scrollToSection('tech-radar')}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent sm:w-auto"
          >
            <Cpu className="h-4 w-4 shrink-0" />
            <span>{t('ctaTechRadar')}</span>
          </button>
        </div>
      </div>

      <Callout variant="default" title={t('calloutTitle')} icon={<Terminal className="h-4 w-4 text-primary" />}>
        <div className="grid gap-2 pt-1 text-xs sm:grid-cols-3">
          <div className="rounded border border-border/70 bg-background/80 p-2.5">
            <div className="font-mono font-semibold text-foreground">{t('pillar1Title')}</div>
            <p className="mt-0.5 text-muted-foreground">{t('pillar1Desc')}</p>
          </div>
          <div className="rounded border border-border/70 bg-background/80 p-2.5">
            <div className="font-mono font-semibold text-foreground">{t('pillar2Title')}</div>
            <p className="mt-0.5 text-muted-foreground">{t('pillar2Desc')}</p>
          </div>
          <div className="rounded border border-border/70 bg-background/80 p-2.5">
            <div className="font-mono font-semibold text-foreground">{t('pillar3Title')}</div>
            <p className="mt-0.5 text-muted-foreground">{t('pillar3Desc')}</p>
          </div>
        </div>
      </Callout>
    </section>
  )
}

export function WorkfolioProjectsSection() {
  const t = useTranslations('Projects')
  const router = useRouter()
  const { data: profile } = useVisitorProfile()
  const openGuestPassModal = useUIStore((s) => s.openGuestPassModal)

  const isUnlocked = profile?.role === 'USER' || profile?.role === 'ADMIN'

  const handleReadCaseStudy = (category: string, slug: string) => {
    const targetUrl = `/knowledge-base/${category}/${slug}`
    if (isUnlocked) {
      router.push(targetUrl)
      return
    }
    trackEvent('guest_pass_modal_opened', { source: `case_study_${slug}` })
    openGuestPassModal(targetUrl)
  }

  return (
    <section id="projects" className="scroll-mt-20 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">{t('title')}</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {CASE_STUDY_CONFIGS.map((item) => (
          <Card key={item.id} className="flex flex-col justify-between transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="secondary" className="font-mono text-[11px]">
                  <Zap className="mr-1 h-3 w-3 text-amber-500" />
                  {t(`items.${item.id}.metrics`)}
                </Badge>
                <span className="font-mono text-[11px] text-muted-foreground">
                  /knowledge-base/{item.articleCategory}
                </span>
              </div>
              <CardTitle className="mt-2 text-lg leading-snug">{t(`items.${item.id}.title`)}</CardTitle>
              <CardDescription className="text-xs leading-relaxed">{t(`items.${item.id}.subtitle`)}</CardDescription>
            </CardHeader>

            <CardContent className="pb-3">
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="font-mono text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>

            <CardFooter className="border-t border-border/60 pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleReadCaseStudy(item.articleCategory, item.articleSlug)}
                className="w-full justify-between font-mono text-xs"
              >
                <span>{isUnlocked ? t('readUnlocked') : t('readLocked')}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  )
}

export function WorkfolioExperienceSection() {
  const t = useTranslations('Experience')

  return (
    <section id="experience" className="scroll-mt-20 space-y-4">
      <div className="flex items-center gap-2">
        <Briefcase className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold tracking-tight">{t('title')}</h2>
      </div>

      <div className="space-y-4">
        {EXPERIENCE_KEYS.map((key) => {
          const highlights = [t(`items.${key}.h1`), t(`items.${key}.h2`), t(`items.${key}.h3`)]
          return (
            <div key={key} className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-semibold text-base text-foreground">{t(`items.${key}.role`)}</h3>
                  <p className="text-xs font-medium text-muted-foreground">{t(`items.${key}.company`)}</p>
                </div>
                <Badge variant="outline" className="w-fit font-mono text-xs">
                  {t(`items.${key}.period`)}
                </Badge>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                {highlights.map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <ShieldCheck className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}
