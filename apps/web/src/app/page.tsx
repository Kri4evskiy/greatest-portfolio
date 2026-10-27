import { AdrInspectorModal } from '@/components/cv/adr-inspector-modal';
import { TechRadarTable } from '@/components/cv/tech-radar-table';
import { UnlockKbBanner } from '@/components/cv/unlock-kb-banner';
import {
  Badge,
  Callout,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui';
import {
  Briefcase,
  Code2,
  Database,
  ExternalLink,
  GitBranch,
  Layers,
  Shield,
  Sparkles,
  Terminal,
} from 'lucide-react';
import type * as React from 'react';

const WORKFOLIO_PROJECTS = [
  {
    title: 'Distributed Portfolio & Engineering Knowledge Base',
    category: 'Full-Stack Monorepo',
    period: '2026 • Flagship Architecture',
    metrics: '15 ADRs • 0ms IndexedDB Cache • <60ms Biome Check',
    description:
      'Production-grade монорепозиторий (pnpm + Turborepo), объединяющий витрину резюме в стиле Notion Workfolio, закрытую базу знаний (MDX + D3.js), основной бэкенд на NestJS + Prisma и микросервис реального времени (SSE).',
    tags: ['Next.js App Router', 'NestJS', 'Prisma + Neon', 'TanStack Query + IDB', 'SSE'],
  },
  {
    title: 'Zero-Trust RBAC & HttpOnly Session Gateway',
    category: 'Security & Edge Computing',
    period: 'Production Module',
    metrics: '100% XSS Token Immunity • Edge Verification',
    description:
      'Система контроля доступа (GUEST / USER / ADMIN) без хранения токенов в LocalStorage. Выпуск подписанных JWT в HttpOnly, Secure, SameSite=Lax куках с проверкой на уровне Next.js Edge Middleware.',
    tags: ['JWT HttpOnly', 'Edge Middleware', 'React Hook Form', 'Shared Zod Schemas'],
  },
  {
    title: 'Real-Time Telemetry Bus & Bundle Optimizer',
    category: 'Microservices & Performance',
    period: 'Engineering Research',
    metrics: '~20% JS Bundle Reduction • 15s SSE Heartbeat',
    description:
      'Асинхронная шина событий (@nestjs/microservices TCP -> RxJS Observable @Sse) для стриминга живой аналитики и исследование оптимизации клиентского рантайма через TanStack Redact.',
    tags: ['@nestjs/microservices', 'RxJS SSE', 'D3.js SVG', 'TanStack Redact'],
  },
] as const;

const EXPERIENCE_TIMELINE = [
  {
    role: 'Senior Full-Stack Engineer / Software Architect',
    company: 'Enterprise & Product Engineering',
    period: '2023 — Present',
    highlights: [
      'Проектирование масштабируемых монорепозиториев (pnpm + Turborepo) с едиными Zod-контрактами между Next.js и NestJS.',
      'Перевод клиентских приложений на Offline-First архитектуру (TanStack Query v5 + IndexedDB Persister) и строгое разделение серверного и UI-стейта.',
      'Внедрение автоматизированных пайплайнов качества кода (Strict TypeScript, Biome.js на Rust, Lefthook, Multi-stage Docker с turbo prune).',
    ],
  },
  {
    role: 'Full-Stack TypeScript Developer',
    company: 'High-Load Web Platforms',
    period: '2021 — 2023',
    highlights: [
      'Разработка модульных бэкенд-сервисов на NestJS, PostgreSQL и Prisma ORM с ролевой моделью RBAC и защищенными HttpOnly сессиями.',
      'Создание доступных дизайн-систем (Tailwind CSS, Radix UI / shadcn/ui) с изолированным тестированием компонентов в Storybook.',
      'Оптимизация Core Web Vitals, SSR/SSG рендеринга и интерактивной визуализации данных на D3.js и TanStack Table.',
    ],
  },
] as const;

export default function WorkfolioLandingPage(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Notion Workfolio Cover & Page Icon */}
      <div className="relative mb-8 overflow-hidden rounded-xl border border-border bg-gradient-to-r from-stone-100 via-amber-50/60 to-emerald-50/50 p-6 dark:from-stone-900 dark:via-stone-900 dark:to-emerald-950/30 sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background text-2xl shadow-sm">
              👨‍💻
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="core">Senior Full-Stack TypeScript Engineer</Badge>
              <Badge variant="secondary">System Architecture & AI DX</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Workfolio & Engineering Knowledge Base
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base leading-relaxed">
              Чистая инженерная архитектура, строгая типизация от базы данных до UI-примитивов и
              документированные решения (ADR) по каждому инструменту в стеке.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <a
              href="#tech-radar"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
            >
              <Layers className="h-3.5 w-3.5 text-emerald-600" />
              15 ADR Stack
            </a>
            <a
              href="#projects"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
            >
              <Terminal className="h-3.5 w-3.5 text-blue-600" />
              Case Studies
            </a>
          </div>
        </div>
      </div>

      {/* Notion Callout: Architecture Overview */}
      <Callout icon="🧭" title="Как устроен этот проект (Architecture Inspector)">
        Это не просто статическая визитка. Прямо сейчас вы находитесь в монорепозитории{' '}
        <span className="font-mono text-xs font-medium text-foreground">pnpm + Turborepo</span>:
        верхний хедер проверяет вашу роль через{' '}
        <span className="font-mono text-xs font-medium text-foreground">
          NestJS JWT HttpOnly Cookies
        </span>
        , клиентский кэш синхронизируется с браузерной БД{' '}
        <span className="font-mono text-xs font-medium text-foreground">IndexedDB (TTL 24h)</span>,
        а в футере работает живой поток{' '}
        <span className="font-mono text-xs font-medium text-foreground">
          Server-Sent Events (@Sse)
        </span>{' '}
        от микросервиса телеметрии.
      </Callout>

      {/* Protected Knowledge Base Quick Unlock Banner */}
      <section className="mt-8">
        <UnlockKbBanner />
      </section>

      {/* Workfolio Section 1: Interactive Project Gallery (Case Studies) */}
      <section id="projects" className="mt-14 scroll-mt-20 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold tracking-tight">
              Featured Case Studies & Systems
            </h2>
          </div>
          <span className="font-mono text-xs text-muted-foreground">Gallery View • 3 items</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {WORKFOLIO_PROJECTS.map((project) => (
            <Card key={project.title} className="flex flex-col justify-between">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="text-[11px]">
                    {project.category}
                  </Badge>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <CardTitle className="text-base">{project.title}</CardTitle>
                <p className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                  {project.metrics}
                </p>
                <CardDescription className="text-xs leading-relaxed">
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 pt-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Workfolio Section 2: Experience & Resume Timeline */}
      <section id="experience" className="mt-14 scroll-mt-20 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold tracking-tight">
              Experience & Architectural Track
            </h2>
          </div>
          <span className="font-mono text-xs text-muted-foreground">Timeline View</span>
        </div>

        <div className="space-y-4">
          {EXPERIENCE_TIMELINE.map((exp) => (
            <div
              key={exp.role}
              className="rounded-lg border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/20"
            >
              <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-semibold text-foreground">{exp.role}</h3>
                  <p className="text-xs text-muted-foreground">{exp.company}</p>
                </div>
                <Badge variant="outline" className="w-fit font-mono">
                  {exp.period}
                </Badge>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                {exp.highlights.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                    <span className="leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Workfolio Section 3: Architectural Pillars */}
      <section className="mt-14 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <GitBranch className="h-4 w-4 text-emerald-600" />
            <span>Single Source of Truth</span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            Zod-схемы в <code className="font-mono">@repo/shared-schemas</code> валидируют и формы
            React Hook Form на клиенте, и DTO через ZodValidationPipe в NestJS.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Database className="h-4 w-4 text-blue-600" />
            <span>Offline-First IndexedDB</span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            Серверный стейт в TanStack Query v5 автоматически персистится в IndexedDB на 24 часа, а
            Zustand хранит исключительно легкий UI-стейт.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Shield className="h-4 w-4 text-amber-600" />
            <span>Zero LocalStorage JWT</span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            Токены сессии передаются только через <code className="font-mono">HttpOnly</code> куки и
            проверяются на границе Next.js Edge Middleware.
          </p>
        </div>
      </section>

      {/* Workfolio Section 4: Tech Radar Database (TanStack Table + 15 ADRs) */}
      <section id="tech-radar" className="mt-14 scroll-mt-20 space-y-4">
        <div className="flex flex-col justify-between gap-2 border-b border-border pb-3 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h2 className="text-lg font-semibold tracking-tight">
                Tech Radar & Architecture Decision Records (15 ADR)
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Интерактивная база данных на базе TanStack Table. Нажмите «Почему в стеке? (ADR)» для
              просмотра обоснования (Why / Where / How).
            </p>
          </div>
          <Badge variant="core" className="w-fit font-mono">
            TanStack Table v8 • 15 / 15 ADRs
          </Badge>
        </div>

        <TechRadarTable />
      </section>

      <AdrInspectorModal />
    </div>
  );
}
