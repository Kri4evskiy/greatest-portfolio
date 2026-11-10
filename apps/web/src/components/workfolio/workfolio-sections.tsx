import type { SupportedLocale } from '@repo/shared-schemas'
import { Badge, Callout, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@repo/ui'
import {
  Briefcase,
  GitBranch,
  Github,
  GraduationCap,
  Languages,
  Linkedin,
  Mail,
  MapPin,
  Send,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import {
  AUTHOR_PROFILE,
  AUTHOR_SKILL_GROUPS,
  COMMERCIAL_EXPERIENCE,
  type CommercialExperienceItem,
  pickLocalized,
} from '@/data/author-profile'
import { CaseStudyReadButton, EarlierRolesDisclosure, HeroActionRow } from './workfolio-client-islands'

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
    tags: ['Server MDX AST', 'Dual-Theme Shiki', 'Lazy Cmd+K', '3-Tier Multi-Slug', 'Mobile-First'],
    articleSlug: 'knowledge-engine/server-mdx-ast-dual-theme-shiki',
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
    tags: ['React 19 Compiler', 'Next.js 16', 'D3.js', 'Zustand', 'SSG'],
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
    tags: ['IndexedDB', 'TanStack Query v5', 'React Compiler', 'Docker BuildKit', 'Sentry'],
    articleSlug: 'offline-bundle/indexeddb-bundle-diet-docker',
    articleCategory: 'architecture-devops',
  },
]

export async function WorkfolioHeroSection({ locale }: { locale: SupportedLocale }) {
  const t = await getTranslations({ locale, namespace: 'Hero' })

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

        {/* Client Island: Primary Action CTAs */}
        <HeroActionRow
          ctaUnlocked={t('ctaUnlocked')}
          ctaLocked={t('ctaLocked')}
          ctaCvPdf={t('ctaCvPdf')}
          ctaTechRadar={t('ctaTechRadar')}
          ctaRoadmap={t('ctaRoadmap')}
        />
      </div>

      {/* Hard Skills Matrix from CV (100% Server-Rendered) */}
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

export async function WorkfolioProjectsSection({ locale }: { locale: SupportedLocale }) {
  const t = await getTranslations({ locale, namespace: 'Projects' })

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
                    <Zap className="mr-1 h-3 w-3 text-warning" />
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
              <CaseStudyReadButton
                category={item.articleCategory}
                slug={item.articleSlug}
                readUnlockedLabel={t('readUnlocked')}
                readLockedLabel={t('readLocked')}
              />
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
  locale: SupportedLocale
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
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
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

export async function WorkfolioExperienceSection({ locale }: { locale: SupportedLocale }) {
  const t = await getTranslations({ locale, namespace: 'Experience' })

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
          <EarlierRolesDisclosure
            showLabel={t('showEarlierRoles', { count: earlierRoles.length })}
            hideLabel={t('hideEarlierRoles')}
          >
            {earlierRoles.map((role) => (
              <ExperienceCard key={role.id} item={role} locale={locale} projectsLabel={t('projectsLabel')} />
            ))}
          </EarlierRolesDisclosure>
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
