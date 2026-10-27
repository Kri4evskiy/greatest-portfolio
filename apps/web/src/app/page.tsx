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
  Award,
  Briefcase,
  Code2,
  Cpu,
  ExternalLink,
  Globe,
  GraduationCap,
  Layers,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Send,
  Sparkles,
} from 'lucide-react';
import type * as React from 'react';

const FEATURED_CASE_STUDIES = [
  {
    title: 'Visual Workflow Automation & E-Commerce Platforms',
    company: 'Superscript Systems',
    links: 'titlepool.com • firsttouch.com • wallet.niftybridge.io',
    metrics: '-15–40% LCP/TTI • 100% Stripe Checkout • +30% Diagnostics',
    description:
      'Интерактивный конструктор автоматизаций на базе XYFlow (React Flow) с кастомным drag-and-drop, роутингом ребер и синхронизацией через Zustand. Внедрение Stripe Embedded UI и наблюдаемости Sentry + PostHog.',
    tags: ['Next.js', 'React Flow (XYFlow)', 'Zustand', 'TanStack', 'Stripe', 'Sentry & PostHog'],
  },
  {
    title: 'Real-World Asset (RWA) Tokenization & D3.js Analytics',
    company: 'Risesoft',
    links: 'Tokenization of Real Assets (RWA)',
    metrics: '8+ D3.js Financial Dashboards • +15% Delivery Speed',
    description:
      'Сквозной типобезопасный API-слой на базе T3 Stack (Next.js, tRPC, Prisma) и 8+ интерактивных финансовых дашбордов на D3.js + Tailwind для визуализации ликвидности и токенизации активов в реальном времени.',
    tags: ['Next.js', 'D3.js', 'tRPC', 'Prisma ORM', 'TypeScript Strict', 'Wagmi'],
  },
  {
    title: 'High-Load E-Commerce & Real-Time Admin Portals',
    company: 'Brander (Kyivstar & Enterprise)',
    links: 'shop.kyivstar.ua • businessadmin.a1st.app',
    metrics: '50,000+ DAU • 10,000+ SKUs • 4-Month MVP Delivery',
    description:
      'Высоконагруженный каталог и чекаут для 50,000+ дневных пользователей (shop.kyivstar.ua) и real-time административная панель на WebSockets + Redux Toolkit с полным владением фронтенд-архитектурой.',
    tags: ['React.js', 'Next.js', 'WebSockets', 'Redux Toolkit', 'i18n', 'High-Load'],
  },
  {
    title: 'Greatest Portfolio & Engineering Knowledge Base (This System)',
    company: 'Personal Flagship Architecture',
    links: 'pnpm + Turborepo Monorepo',
    metrics: '15 ADRs • 0ms IndexedDB Cache • Microservice SSE',
    description:
      'Production-grade монорепозиторий: витрина Workfolio CV, закрытая база знаний (MDX + D3.js) под защитой Next.js Edge Middleware и NestJS JWT HttpOnly кук, плюс реактивный стрим телеметрии @Sse.',
    tags: ['pnpm + Turborepo', 'Next.js App Router', 'NestJS', 'Prisma + Neon', 'IndexedDB'],
  },
] as const;

const HARD_SKILLS_GROUPS = [
  {
    category: 'Languages & Core Runtimes',
    items: ['TypeScript (Strict)', 'JavaScript (ES2024)', 'Python', 'Node.js'],
  },
  {
    category: 'Frameworks & Architecture',
    items: ['React.js (18 / 19)', 'Next.js (App Router, SSR/SSG)', 'NestJS', 'Gatsby.js'],
  },
  {
    category: 'State, Forms & Offline Storage',
    items: [
      'TanStack Query v5',
      'Zustand',
      'IndexedDB Persister',
      'Effector',
      'Redux Toolkit (RTK)',
      'React Hook Form',
      'Zod',
      'TanStack Table',
    ],
  },
  {
    category: 'Data Visualization & Interactive Canvas',
    items: ['D3.js', 'XYFlow (React Flow)', 'Chart.js', 'Matplotlib (Python)'],
  },
  {
    category: 'Backend, APIs & Security',
    items: [
      'REST API',
      'Server-Sent Events (SSE)',
      'WebSocket',
      '@nestjs/microservices',
      'tRPC',
      'JWT (HttpOnly) / OAuth 2.0',
      'Swagger (OpenAPI)',
      'Stripe (Embedded / Elements)',
    ],
  },
  {
    category: 'Databases, Testing & DevOps DX',
    items: [
      'PostgreSQL (Neon.tech)',
      'Prisma ORM',
      'TypeORM',
      'MongoDB',
      'Playwright (E2E)',
      'Vitest / Jest',
      'Docker & Compose',
      'Sentry & PostHog',
      'Storybook',
      'Biome.js & Lefthook',
    ],
  },
  {
    category: 'UI Systems & AI Engineering Workflows',
    items: [
      'Tailwind CSS',
      'shadcn/ui (Radix UI)',
      'MUI / Ant Design',
      'Cursor',
      'Claude Code / Antigravity',
      'GitHub Copilot',
      'Cascading .agents/ Context',
    ],
  },
] as const;

const EXPERIENCE_TIMELINE = [
  {
    role: 'Frontend / Fullstack Engineer',
    company: 'Superscript Systems',
    meta: 'e-commerce domain • outstaff',
    period: 'Mar 2024 — Jul 2026',
    projects: 'titlepool.com / firsttouch.com / wallet.niftybridge.io / superscriptsystems.com',
    highlights: [
      'Spearheaded performance optimization, reducing LCP/TTI by 15–40% and significantly decreasing memory footprint through efficient memoization and virtualization across 2 production platforms.',
      'Engineered interactive node-based workflows using XYFlow (React Flow) with custom drag-and-drop, edge routing, and state syncing via Zustand, powering visual automation builders across products.',
      'Set up observability and user behavior tracking by integrating Sentry and PostHog, accelerating frontend error diagnostics by 30% in production.',
      'Integrated Stripe (Embedded UI / Elements) into the frontend checkout flow, handling payment states across 100% of customer checkout transactions.',
    ],
    tech: 'Next.js, React.js, TypeScript, Tailwind, TanStack, Effector, Zustand, XYFlow (React Flow), React Hook Form, Zod, Stripe (Embedded), Sentry, PostHog, NestJS',
  },
  {
    role: 'Frontend Engineer (T3 Stack & D3.js)',
    company: 'Risesoft',
    meta: 'crypto domain • contract • Tokenization of Real Assets (RWA)',
    period: 'Dec 2023 — Mar 2024',
    projects: 'RWA Tokenization & Financial Analytics Platform',
    highlights: [
      'Built end-to-end typesafe API layers using T3 Stack (Next.js, tRPC, Prisma), eliminating runtime type errors and accelerating contract-to-UI feature delivery by ~15%.',
      'Developed 8+ interactive financial and analytical dashboards using D3.js and Tailwind, enabling real-time visualization of asset tokenization, liquidity metrics, and portfolio performance.',
      'Established frontend engineering standards from scratch: configured linter/formatter rule sets, strict TypeScript configs, and project documentation, aligning the codebase for multi-developer scaling.',
    ],
    tech: 'T3 Stack, Next.js, TypeScript, tRPC, Prisma, Tailwind, NextAuth, Redux, D3.js, Wagmi',
  },
  {
    role: 'Frontend Engineer',
    company: 'Brander',
    meta: 'e-commerce domain • outsource / outstaff',
    period: 'Dec 2022 — Oct 2023',
    projects: 'shop.kyivstar.ua / businessadmin.a1st.app',
    highlights: [
      'Contributed to high-load e-commerce solutions (including shop.kyivstar.ua), building responsive catalog, product, and checkout flows optimized to handle 50,000+ daily active users and a catalog of 10,000+ SKUs.',
      'Engineered real-time data synchronizations using WebSockets and Redux Toolkit, providing instant order status updates and interactive administrative dashboards (businessadmin.a1st.app).',
      'Delivered a production-ready e-commerce MVP from scratch within 4 months, owning frontend architecture, state design, and multi-language support (i18n).',
      'Mentored 2 junior developers via structured code reviews, architectural pairing, and best practice workshops, helping them transition to independent feature ownership.',
    ],
    tech: 'React.js, Next.js, TypeScript, Redux Toolkit, Styled Components, WebSocket, Material UI, i18n, Scrum',
  },
  {
    role: 'Frontend Engineer',
    company: 'DevsX',
    meta: 'e-commerce & well-being domain • contract',
    period: 'Jul 2022 — Nov 2022',
    projects: 'happylemonusa.com / Fitness web-platform',
    highlights: [
      'Rapidly launched an MVP for a wellness/fitness web platform, designing a library of 25+ reusable UI components with Next.js and Tailwind.',
      'Redesigned core user dashboard modules for happylemonusa.com, improving mobile responsiveness and cross-browser consistency.',
    ],
    tech: 'React.js, Next.js, TypeScript, Redux, Tailwind, Styled Components',
  },
  {
    role: 'Frontend Engineer',
    company: 'AIHelps',
    meta: 'e-commerce domain • product',
    period: 'Feb 2021 — May 2022',
    projects: 'suplery.com (B2B E-Commerce Platform)',
    highlights: [
      'Co-developed core frontend modules from scratch for the B2B e-commerce platform suplery.com, building clean, responsive UI with React, TypeScript, and Ant Design.',
      'Onboarded and mentored 3 new frontend engineers, established code review workflows in Jira, and collaborated closely with backend and UI/UX teams.',
      'Translated 40+ Figma screen mockups into pixel-perfect, reusable components.',
    ],
    tech: 'React.js, TypeScript, MobX (MST), Ant Design, Styled Components, i18n',
  },
  {
    role: 'Frontend Developer',
    company: 'Velas Network AG',
    meta: 'crypto domain • product',
    period: 'May 2020 — Oct 2020',
    projects: 'velas.com',
    highlights: [
      'Implemented responsive UI components and features for velas.com using React, Redux, and Material UI.',
    ],
    tech: 'React.js, Redux, Material UI, Styled Components',
  },
] as const;

export default function WorkfolioLandingPage(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Notion Workfolio Cover & Personal Profile Header */}
      <div className="relative mb-8 overflow-hidden rounded-xl border border-border bg-gradient-to-r from-stone-100 via-amber-50/60 to-emerald-50/50 p-6 dark:from-stone-900 dark:via-stone-900 dark:to-emerald-950/30 sm:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-background text-xl font-bold shadow-sm">
                SK
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="core">5+ Years Experience</Badge>
                  <Badge variant="secondary">React • Next.js • NestJS • AI DX</Badge>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                  Kyiv, Ukraine • Open to Remote / Full-Time / Contract
                </p>
              </div>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Stanislav Krychevskyi
            </h1>
            <p className="text-base font-medium text-foreground/90">
              Middle+ / Senior Frontend & Fullstack Engineer
            </p>
            <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
              Frontend Engineer with 5+ years of experience specializing in the React ecosystem with
              Fullstack capabilities (Node.js / NestJS / Python). Experienced in architecting
              scalable platforms (up to 50,000+ DAU) with a strong focus on performance (-15–40%
              LCP/TTI) and system design. Proficient in AI-assisted engineering (Cursor, Claude,
              Copilot, cascading LLM workflows) to accelerate sprint velocity without compromising
              code quality.
            </p>
          </div>

          {/* Direct Contact Hub (Notion Properties Style) */}
          <div className="flex flex-col gap-2 rounded-lg border border-border/80 bg-background/90 p-3.5 text-xs shadow-sm sm:min-w-[235px]">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Direct Contacts
            </span>
            <a
              href="https://t.me/Kri4evskiy"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded px-1.5 py-1 text-foreground transition-colors hover:bg-accent"
            >
              <Send className="h-3.5 w-3.5 text-blue-500" />
              <span>t.me/Kri4evskiy</span>
            </a>
            <a
              href="mailto:kri4evskiy@gmail.com"
              className="flex items-center gap-2 rounded px-1.5 py-1 text-foreground transition-colors hover:bg-accent"
            >
              <Mail className="h-3.5 w-3.5 text-amber-600" />
              <span>kri4evskiy@gmail.com</span>
            </a>
            <a
              href="tel:+380739090494"
              className="flex items-center gap-2 rounded px-1.5 py-1 text-foreground transition-colors hover:bg-accent"
            >
              <Phone className="h-3.5 w-3.5 text-emerald-600" />
              <span>+380 73 909 04 94</span>
            </a>
            <a
              href="https://linkedin.com/in/kri4evskiy"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded px-1.5 py-1 text-foreground transition-colors hover:bg-accent"
            >
              <Linkedin className="h-3.5 w-3.5 text-sky-600" />
              <span>linkedin.com/in/kri4evskiy</span>
            </a>
          </div>
        </div>
      </div>

      {/* Notion Callout: Live Architecture Overview */}
      <Callout icon="🧭" title="Live Architecture Inspector (Why this Workfolio is unique)">
        Вы находитесь внутри живого монорепозитория{' '}
        <span className="font-mono text-xs font-medium text-foreground">pnpm + Turborepo</span>:
        верхний хедер проверяет вашу роль через{' '}
        <span className="font-mono text-xs font-medium text-foreground">
          NestJS JWT HttpOnly Cookies
        </span>
        , клиентский кэш синхронизируется с браузерной БД{' '}
        <span className="font-mono text-xs font-medium text-foreground">IndexedDB (TTL 24h)</span>,
        а в футере работает реактивный поток{' '}
        <span className="font-mono text-xs font-medium text-foreground">
          Server-Sent Events (@Sse)
        </span>{' '}
        от микросервиса телеметрии.
      </Callout>

      {/* Protected Knowledge Base Quick Unlock Banner */}
      <section className="mt-8">
        <UnlockKbBanner />
      </section>

      {/* Workfolio Section 1: Featured Case Studies & Production Projects */}
      <section id="projects" className="mt-14 scroll-mt-20 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold tracking-tight">
              Featured Production Projects & Case Studies
            </h2>
          </div>
          <span className="font-mono text-xs text-muted-foreground">Gallery View • 4 systems</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURED_CASE_STUDIES.map((project) => (
            <Card key={project.title} className="flex flex-col justify-between">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="text-[11px]">
                    {project.company}
                  </Badge>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <CardTitle className="text-base">{project.title}</CardTitle>
                <p className="font-mono text-[11px] text-muted-foreground">{project.links}</p>
                <p className="font-mono text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  {project.metrics}
                </p>
                <CardDescription className="text-xs leading-relaxed">
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 pt-1">
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

      {/* Workfolio Section 2: Commercial Experience Timeline (6 Companies) */}
      <section id="experience" className="mt-14 scroll-mt-20 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold tracking-tight">
              Commercial Experience (5+ Years • 6 Companies)
            </h2>
          </div>
          <span className="font-mono text-xs text-muted-foreground">2020 — 2026</span>
        </div>

        <div className="space-y-4">
          {EXPERIENCE_TIMELINE.map((exp) => (
            <div
              key={`${exp.company}-${exp.period}`}
              className="rounded-lg border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/20"
            >
              <div className="flex flex-col justify-between gap-1.5 sm:flex-row sm:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground">{exp.company}</h3>
                    <span className="text-xs text-muted-foreground">• {exp.role}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{exp.meta}</p>
                  <p className="mt-1 font-mono text-xs text-emerald-700 dark:text-emerald-400">
                    Projects: {exp.projects}
                  </p>
                </div>
                <Badge variant="outline" className="w-fit shrink-0 font-mono">
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

              <div className="mt-3 border-t border-border/60 pt-2.5">
                <p className="font-mono text-[11px] text-muted-foreground">
                  <strong className="font-semibold text-foreground">Technologies:</strong>{' '}
                  {exp.tech}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Workfolio Section 3: Structured Hard Skills Matrix */}
      <section id="skills" className="mt-14 scroll-mt-20 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold tracking-tight">Hard Skills & Tooling Matrix</h2>
          </div>
          <span className="font-mono text-xs text-muted-foreground">Full-Stack & AI DX</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {HARD_SKILLS_GROUPS.map((group) => (
            <div
              key={group.category}
              className="rounded-lg border border-border bg-card p-4 shadow-sm"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.category}
              </h3>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {group.items.map((skill) => (
                  <Badge key={skill} variant="secondary" className="font-normal">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Workfolio Section 4: Tech Radar Database (TanStack Table + 15 ADRs) */}
      <section id="tech-radar" className="mt-14 scroll-mt-20 space-y-4">
        <div className="flex flex-col justify-between gap-2 border-b border-border pb-3 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h2 className="text-lg font-semibold tracking-tight">
                Architecture Decision Records (15 ADR • Why, Where & How)
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Интерактивная таблица на базе TanStack Table. Нажмите «Почему в стеке? (ADR)» на любой
              из 15 технологий этого проекта для просмотра архитектурного обоснования.
            </p>
          </div>
          <Badge variant="core" className="w-fit font-mono">
            <Layers className="h-3 w-3" />
            TanStack Table • 15 ADRs
          </Badge>
        </div>

        <TechRadarTable />
      </section>

      {/* Workfolio Section 5: Education, Courses & Languages */}
      <section className="mt-14 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <GraduationCap className="h-4 w-4 text-emerald-600" />
            <span>Education</span>
          </div>
          <p className="mt-2 text-xs font-medium text-foreground">Kyiv International University</p>
          <p className="text-xs text-muted-foreground">
            Master&apos;s Degree in International Relations (2006 – 2011)
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Award className="h-4 w-4 text-blue-600" />
            <span>Engineering Courses</span>
          </div>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>• Andersen Lab — Frontend Developer (2019–2020)</li>
            <li>• CyberBionic Systematic — Frontend (2019)</li>
          </ul>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Globe className="h-4 w-4 text-amber-600" />
            <span>Languages</span>
          </div>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>
              • <strong className="text-foreground">English:</strong> Upper-Intermediate (B2)
            </li>
            <li>
              • <strong className="text-foreground">Ukrainian:</strong> Native
            </li>
          </ul>
        </div>
      </section>

      <AdrInspectorModal />
    </div>
  );
}
