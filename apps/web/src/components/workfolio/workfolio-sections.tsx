'use client'

import { SupportedLocaleEnum } from '@repo/shared-schemas'
import { Badge, Button, Callout, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@repo/ui'
import {
  ArrowUpRight,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Compass,
  Cpu,
  ExternalLink,
  GitBranch,
  Github,
  GraduationCap,
  Languages,
  Linkedin,
  Lock,
  LockOpen,
  Mail,
  MapPin,
  Send,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import {
  AUTHOR_PROFILE,
  AUTHOR_SKILL_GROUPS,
  COMMERCIAL_EXPERIENCE,
  type CommercialExperienceItem,
  pickLocalized,
} from '@/data/author-profile'
import { useSectionNavigation } from '@/hooks/use-section-navigation'
import { useVisitorProfile } from '@/hooks/use-visitor-profile'
import { useRouter } from '@/i18n/navigation'
import { trackEvent } from '@/lib/analytics'
import { useUIStore } from '@/store/use-ui-store'

interface CaseStudyConfig {
  id:
    | 'this-project-engine'
    | 'monorepo-adr'
    | 'react19-compiler-d3'
    | 'zero-trust-jwt-sse'
    | 'offline-first-redact-docker'
  tags: readonly string[]
  articleSlug: string
  articleCategory: string
  isFlagship?: boolean
}

const CASE_STUDY_CONFIGS: readonly CaseStudyConfig[] = [
  {
    id: 'this-project-engine',
    tags: ['MDX 2.0', 'Shiki 0KB JS', 'Cmd+K Search', '3-Tier Multi-Slug', 'Mobile-First'],
    articleSlug: 'knowledge-engine/three-tier-mdx-cmdk-architecture',
    articleCategory: 'this-project',
    isFlagship: true,
  },
  {
    id: 'monorepo-adr',
    tags: ['pnpm 12', 'Turborepo', 'Zod', 'Biome.js', 'Lefthook'],
    articleSlug: 'adr-catalog/adr-full-stack-catalog',
    articleCategory: 'typescript',
  },
  {
    id: 'react19-compiler-d3',
    tags: ['React 19', 'Next.js 16', 'D3.js', 'Zustand', 'SSG'],
    articleSlug: 'react-18-vs-19/rendering-diff-d3',
    articleCategory: 'react',
  },
  {
    id: 'zero-trust-jwt-sse',
    tags: ['NestJS', 'JWT HttpOnly', 'Prisma ORM', 'Microservices', 'RxJS SSE'],
    articleSlug: 'security/nestjs-jwt-httponly-prisma-sse',
    articleCategory: 'nestjs-prisma',
  },
  {
    id: 'offline-first-redact-docker',
    tags: ['IndexedDB', 'TanStack Query v5', 'TanStack Redact', 'Docker BuildKit', 'Sentry'],
    articleSlug: 'offline-bundle/tanstack-redact-bundle-docker',
    articleCategory: 'architecture-devops',
  },
]

export function WorkfolioHeroSection() {
  const t = useTranslations('Hero')
  const router = useRouter()
  const rawLocale = useLocale()
  const parsedLocale = SupportedLocaleEnum.safeParse(rawLocale)
  const locale = parsedLocale.success ? parsedLocale.data : 'en'

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
          <Badge variant="outline" className="inline-flex items-center gap-1 font-mono text-[11px] sm:text-xs">
            <MapPin className="h-3 w-3 text-primary" />
            <span>{pickLocalized(AUTHOR_PROFILE.location, locale)}</span>
          </Badge>
          <Badge variant="secondary" className="font-mono text-[11px] sm:text-xs">
            {AUTHOR_PROFILE.yearsOfExperience} {t('yearsExpBadge')}
          </Badge>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            {pickLocalized(AUTHOR_PROFILE.fullName, locale)}
          </h1>
          <p className="font-mono text-sm font-semibold text-primary sm:text-lg">
            {pickLocalized(AUTHOR_PROFILE.roleTitle, locale)}
          </p>
        </div>

        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">{t('description')}</p>

        {/* Direct Contact Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <a
            href={AUTHOR_PROFILE.contacts.telegramUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-xs font-medium text-foreground shadow-2xs transition-colors hover:border-primary/40 hover:bg-accent"
          >
            <Send className="h-3.5 w-3.5 text-primary" />
            <span>Telegram ({AUTHOR_PROFILE.contacts.telegramHandle})</span>
          </a>
          <a
            href={AUTHOR_PROFILE.contacts.linkedinUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-xs font-medium text-foreground shadow-2xs transition-colors hover:border-primary/40 hover:bg-accent"
          >
            <Linkedin className="h-3.5 w-3.5 text-primary" />
            <span>LinkedIn</span>
          </a>
          <a
            href={AUTHOR_PROFILE.contacts.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-xs font-medium text-foreground shadow-2xs transition-colors hover:border-primary/40 hover:bg-accent"
          >
            <Github className="h-3.5 w-3.5 text-primary" />
            <span>GitHub</span>
          </a>
          <a
            href={`mailto:${AUTHOR_PROFILE.contacts.email}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-xs font-medium text-foreground shadow-2xs transition-colors hover:border-primary/40 hover:bg-accent"
          >
            <Mail className="h-3.5 w-3.5 text-primary" />
            <span>{AUTHOR_PROFILE.contacts.email}</span>
          </a>
        </div>

        {/* Primary Action CTAs */}
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
            <Cpu className="h-4 w-4 shrink-0 text-primary" />
            <span>{t('ctaTechRadar')}</span>
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('roadmap')}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent sm:w-auto"
          >
            <Compass className="h-4 w-4 shrink-0 text-primary" />
            <span>{t('ctaRoadmap')}</span>
          </button>
        </div>
      </div>

      {/* Hard Skills Matrix from CV */}
      <div className="grid gap-3 sm:grid-cols-2">
        {AUTHOR_SKILL_GROUPS.map((group) => (
          <div key={group.id} className="rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs">
            <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {pickLocalized(group.label, locale)}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {group.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="font-mono text-[11px] font-normal">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        ))}
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
          <Card
            key={item.id}
            className={`flex flex-col justify-between transition-shadow hover:shadow-md ${
              item.isFlagship ? 'border-primary/40 md:col-span-2' : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant={item.isFlagship ? 'default' : 'secondary'} className="font-mono text-[11px]">
                  {item.isFlagship ? (
                    <Sparkles className="mr-1 h-3 w-3" />
                  ) : (
                    <Zap className="mr-1 h-3 w-3 text-amber-500" />
                  )}
                  {t(`items.${item.id}.metrics`)}
                </Badge>
                <span className="font-mono text-[11px] text-muted-foreground">
                  /knowledge-base/{item.articleCategory}
                </span>
              </div>
              <CardTitle className="mt-2 text-lg leading-snug">{t(`items.${item.id}.title`)}</CardTitle>
              <CardDescription className="text-xs leading-relaxed sm:text-sm">
                {t(`items.${item.id}.subtitle`)}
              </CardDescription>
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

function ExperienceCard({
  item,
  locale,
  projectsLabel,
}: {
  item: CommercialExperienceItem
  locale: 'en' | 'uk' | 'ru'
  projectsLabel: string
}) {
  const highlights = item.highlights[locale] ?? item.highlights.en

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-foreground">{item.company}</h3>
            <Badge variant="secondary" className="font-mono text-[10px]">
              {pickLocalized(item.domain, locale)}
            </Badge>
          </div>
          <p className="text-xs font-medium text-primary">{pickLocalized(item.engagement, locale)}</p>
          {item.projects.length > 0 ? (
            <p className="font-mono text-[11px] text-muted-foreground">
              {projectsLabel}: {item.projects.join(' • ')}
            </p>
          ) : null}
        </div>

        <Badge variant="outline" className="w-fit shrink-0 font-mono text-xs">
          {pickLocalized(item.period, locale)}
        </Badge>
      </div>

      <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
        {highlights.map((point) => (
          <li key={point} className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{point}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3.5 flex flex-wrap gap-1.5 border-t border-border/60 pt-3">
        {item.technologies.map((tech) => (
          <Badge key={tech} variant="outline" className="font-mono text-[10px]">
            {tech}
          </Badge>
        ))}
      </div>
    </div>
  )
}

export function WorkfolioExperienceSection() {
  const t = useTranslations('Experience')
  const rawLocale = useLocale()
  const parsedLocale = SupportedLocaleEnum.safeParse(rawLocale)
  const locale = parsedLocale.success ? parsedLocale.data : 'en'

  const [showEarlierRoles, setShowEarlierRoles] = useState(false)

  const featuredRoles = COMMERCIAL_EXPERIENCE.filter((role) => role.featured)
  const earlierRoles = COMMERCIAL_EXPERIENCE.filter((role) => !role.featured)

  return (
    <section id="experience" className="scroll-mt-20 space-y-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">{t('title')}</h2>
        </div>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="space-y-4">
        {featuredRoles.map((role) => (
          <ExperienceCard key={role.id} item={role} locale={locale} projectsLabel={t('projectsLabel')} />
        ))}

        {earlierRoles.length > 0 ? (
          <div className="space-y-3">
            <button
              type="button"
              aria-expanded={showEarlierRoles}
              onClick={() => setShowEarlierRoles((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-xl border border-dashed border-border bg-muted/30 px-4 py-2.5 text-left font-mono text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted/60"
            >
              <span>
                {showEarlierRoles ? t('hideEarlierRoles') : t('showEarlierRoles', { count: earlierRoles.length })}
              </span>
              {showEarlierRoles ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showEarlierRoles ? (
              <div className="space-y-3">
                {earlierRoles.map((role) => (
                  <ExperienceCard key={role.id} item={role} locale={locale} projectsLabel={t('projectsLabel')} />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Education & Spoken Languages Summary Card */}
      <div className="grid gap-3 pt-1 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-2xs">
          <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="space-y-0.5">
            <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('educationHeading')}
            </div>
            <div className="text-sm font-semibold text-foreground">
              {pickLocalized(AUTHOR_PROFILE.education.degree, locale)}
            </div>
            <div className="text-xs text-muted-foreground">
              {pickLocalized(AUTHOR_PROFILE.education.institution, locale)}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-2xs">
          <Languages className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="space-y-0.5">
            <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('languagesHeading')}
            </div>
            <div className="text-sm font-semibold text-foreground">
              {pickLocalized(AUTHOR_PROFILE.spokenLanguages, locale)}
            </div>
            <div className="text-xs text-muted-foreground">{t('aiWorkflowsNote')}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
