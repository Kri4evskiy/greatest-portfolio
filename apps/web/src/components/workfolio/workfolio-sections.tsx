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
import { useRouter } from 'next/navigation'
import { useVisitorProfile } from '@/hooks/use-visitor-profile'
import { trackEvent } from '@/lib/analytics'
import { useUIStore } from '@/store/use-ui-store'

interface CaseStudy {
  id: string
  title: string
  subtitle: string
  metrics: string
  tags: string[]
  articleSlug: string
  articleCategory: string
}

const CASE_STUDIES: readonly CaseStudy[] = [
  {
    id: 'monorepo-adr',
    title: 'Enterprise Monorepo & End-to-End Zod Contracts',
    subtitle:
      'Единый граф сборки pnpm + Turborepo для Next.js 16, NestJS 12 (Native ESM) и микросервиса телеметрии со сквозной типизацией без кодогенерации OpenAPI.',
    metrics: '-68% времени CI • 0 рассинхронизаций API',
    tags: ['pnpm', 'Turborepo', 'Zod', 'Biome.js', 'Lefthook'],
    articleSlug: 'adr-full-stack-catalog',
    articleCategory: 'typescript',
  },
  {
    id: 'react19-compiler-d3',
    title: 'React 18 vs React 19 Compiler & Interactive D3.js Simulations',
    subtitle:
      'Глубокое исследование автоматической мемоизации в React 19, хука use() и визуализация графа рендера на базе D3.js + Zustand.',
    metrics: '-42% лишних ререндеров • 60 FPS SVG Graph',
    tags: ['React 19', 'Next.js 16', 'D3.js', 'Zustand', 'SSG'],
    articleSlug: 'react-18-vs-19-compiler-d3',
    articleCategory: 'react',
  },
  {
    id: 'zero-trust-jwt-sse',
    title: 'Zero-Trust Auth (JWT HttpOnly Cookies) & Real-Time SSE Telemetry',
    subtitle:
      'Защита от XSS через HttpOnly куки, проверка ролей на уровне Next.js Edge Middleware + NestJS Guards и реактивный стрим событий из TCP-микросервиса.',
    metrics: '0 XSS token leaks • <15ms Edge RBAC check',
    tags: ['NestJS', 'JWT HttpOnly', 'Prisma ORM', 'Microservices', 'RxJS SSE'],
    articleSlug: 'nestjs-jwt-httponly-prisma-sse',
    articleCategory: 'nestjs-prisma',
  },
  {
    id: 'offline-first-redact-docker',
    title: 'IndexedDB Offline-First Cache, TanStack Redact & Multi-Stage Docker',
    subtitle:
      'Персистентный кэш TanStack Query в IndexedDB (отдача за 0 мс в авиарежиме), эксперимент с рантаймом TanStack Redact и 3-ступенчатая сборка с turbo prune.',
    metrics: '0ms Offline Reads • -21% JS Bundle',
    tags: ['IndexedDB', 'TanStack Query v5', 'TanStack Redact', 'Docker', 'Sentry'],
    articleSlug: 'tanstack-redact-bundle-docker',
    articleCategory: 'architecture-devops',
  },
]

const EXPERIENCE_TIMELINE = [
  {
    period: '2023 — Настоящее время',
    role: 'Senior Full-Stack TypeScript Engineer / System Architect',
    company: 'High-Load B2B SaaS & FinTech Platform',
    highlights: [
      'Спроектировал и мигрировал фронтенд и бэкенд в монорепозиторий pnpm + Turborepo (Next.js App Router + NestJS + пакеты общих Zod-контрактов и UI-кита).',
      'Внедрил Offline-First архитектуру клиентского кэша через TanStack Query v5 + IndexedDB, снизив нагрузку на чтение метаданных API на 55%.',
      'Реализовал распределенную телеметрию на базе @nestjs/microservices (TCP/Redis) и Server-Sent Events (SSE) для живого мониторинга сессий.',
    ],
  },
  {
    period: '2021 — 2023',
    role: 'Full-Stack Developer (React / Node.js / PostgreSQL)',
    company: 'Enterprise Product Team',
    highlights: [
      'Разработал дизайн-систему компании на базе Tailwind CSS + Radix UI (shadcn/ui) с полным покрытием документацией в Storybook.',
      'Перевел авторизацию с уязвимого LocalStorage на защищенные HttpOnly, Secure, SameSite=Lax куки с ролевой моделью RBAC (GUEST / USER / ADMIN).',
      'Оптимизировал запросы Prisma ORM в PostgreSQL (Neon) и настроил CI/CD пайплайны с Biome.js и Multi-stage Docker образами.',
    ],
  },
] as const

export function WorkfolioHeroSection() {
  const router = useRouter()
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
    <section id="about" className="scroll-mt-20 space-y-6 pt-6">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success" className="font-mono text-xs">
            ● Open to Senior Full-Stack / Tech Lead Proposals
          </Badge>
          <Badge variant="outline" className="font-mono text-xs">
            TypeScript Strict • Next.js 16 • NestJS 12 (ESM) • Prisma • Microservices
          </Badge>
        </div>

        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Senior Full-Stack Engineer &amp; Systems Architect
        </h1>

        <p className="max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Добро пожаловать в интерактивное <strong>Workfolio CV</strong> и защищенную{' '}
          <strong>Инженерную Базу Знаний</strong>. Вместо статичного PDF-резюме этот монорепозиторий сам является живым
          доказательством архитектуры: от сквозных Zod-контрактов и <code>HttpOnly JWT</code> до{' '}
          <code>IndexedDB Offline-First</code> кэша, <code>D3.js</code> графов и реактивного стрима{' '}
          <code>Server-Sent Events</code>.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button type="button" size="lg" onClick={() => handleOpenKnowledgeBase('/knowledge-base')} className="gap-2">
            {isUnlocked ? (
              <>
                <LockOpen className="h-4 w-4 text-emerald-400" />
                <span>Открыть Инженерную Базу Знаний</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 text-amber-400" />
                <span>Разблокировать Базу Знаний (1-Click Guest Pass)</span>
              </>
            )}
            <ArrowUpRight className="h-4 w-4" />
          </Button>

          <a
            href="#tech-radar"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-accent"
          >
            <Cpu className="h-4 w-4" />
            <span>Матрица 15 технологий (ADR)</span>
          </a>
        </div>
      </div>

      <Callout
        variant="default"
        title="Как устроен этот проект (Notion Workfolio + Production Full-Stack)"
        icon={<Terminal className="h-4 w-4 text-primary" />}
      >
        <div className="grid gap-2 pt-1 text-xs sm:grid-cols-3">
          <div className="rounded border border-border/70 bg-background/80 p-2.5">
            <div className="font-mono font-semibold text-foreground">1. 1-Click RBAC Demo</div>
            <p className="mt-0.5 text-muted-foreground">
              Клик по кнопке <code>Base of Knowledge</code> в шапке открывает микро-форму на <code>RHF + Zod</code>,
              выписывает <code>HttpOnly JWT</code> куку и пушит событие в <code>SSE</code>.
            </p>
          </div>
          <div className="rounded border border-border/70 bg-background/80 p-2.5">
            <div className="font-mono font-semibold text-foreground">2. Offline-First IndexedDB</div>
            <p className="mt-0.5 text-muted-foreground">
              Все запросы <code>TanStack Query v5</code> синхронизируются с браузерной БД <code>IndexedDB</code> (TTL
              24ч) — статьи и метрики открываются за 0 мс.
            </p>
          </div>
          <div className="rounded border border-border/70 bg-background/80 p-2.5">
            <div className="font-mono font-semibold text-foreground">3. 15 интерактивных ADR</div>
            <p className="mt-0.5 text-muted-foreground">
              Ниже в таблице <code>TanStack Table</code> у каждого инструмента есть разбор{' '}
              <strong>Почему / Где / Как</strong> он применен в этом репозитории.
            </p>
          </div>
        </div>
      </Callout>
    </section>
  )
}

export function WorkfolioProjectsSection() {
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
            <h2 className="text-xl font-bold tracking-tight">Featured Engineering Case Studies (Workfolio Gallery)</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Ключевые архитектурные модули этого монорепозитория с переходом к подробным MDX-статьям и интерактивным
            графам D3.js.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {CASE_STUDIES.map((item) => (
          <Card key={item.id} className="flex flex-col justify-between transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="secondary" className="font-mono text-[11px]">
                  <Zap className="mr-1 h-3 w-3 text-amber-500" />
                  {item.metrics}
                </Badge>
                <span className="font-mono text-[11px] text-muted-foreground">
                  /knowledge-base/{item.articleCategory}
                </span>
              </div>
              <CardTitle className="mt-2 text-lg leading-snug">{item.title}</CardTitle>
              <CardDescription className="text-xs leading-relaxed">{item.subtitle}</CardDescription>
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
                <span>
                  {isUnlocked
                    ? 'Читать инженерный разбор в Базе Знаний'
                    : '🔒 Разблокировать и открыть статью (1 клик)'}
                </span>
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
  return (
    <section id="experience" className="scroll-mt-20 space-y-4">
      <div className="flex items-center gap-2">
        <Briefcase className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold tracking-tight">Experience &amp; Engineering Timeline</h2>
      </div>

      <div className="space-y-4">
        {EXPERIENCE_TIMELINE.map((roleItem) => (
          <div key={roleItem.period} className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-semibold text-base text-foreground">{roleItem.role}</h3>
                <p className="text-xs font-medium text-muted-foreground">{roleItem.company}</p>
              </div>
              <Badge variant="outline" className="w-fit font-mono text-xs">
                {roleItem.period}
              </Badge>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {roleItem.highlights.map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <ShieldCheck className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
