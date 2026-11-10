import { z } from 'zod'
import type { SupportedLocale } from './locale.schema.js'

export const TechCategoryEnum = z.enum(['Frontend', 'Backend', 'Database & Storage', 'DevOps & DX', 'Architecture'])
export type TechCategory = z.infer<typeof TechCategoryEnum>

export const TechLevelEnum = z.enum(['Core', 'Production', 'Experimental'])
export type TechLevel = z.infer<typeof TechLevelEnum>

export const TechRadarItemSchema = z.object({
  id: z.string().min(1),
  adrNumber: z.number().int().min(1).max(16),
  name: z.string().min(1),
  category: TechCategoryEnum,
  experienceYears: z.number().positive(),
  level: TechLevelEnum,
  summary: z.string().min(1),
  adrWhy: z.string().min(1),
  adrWhere: z.string().min(1),
  adrHow: z.string().min(1),
})
export type TechRadarItem = z.infer<typeof TechRadarItemSchema>

export const TECH_RADAR_ITEMS_RU: readonly TechRadarItem[] = [
  {
    id: 'pnpm-turborepo',
    adrNumber: 1,
    name: 'pnpm + Turborepo',
    category: 'Architecture',
    experienceYears: 4,
    level: 'Core',
    summary: 'Монорепозиторий с жесткой изоляцией зависимостей и кэшированием пайплайнов.',
    adrWhy:
      'Устраняет рассинхронизацию типов между Next.js и NestJS. pnpm экономит до 70% места за счет hard links и защищает от фантомных зависимостей, а Turborepo дает кэширование сборки и параллельный запуск.',
    adrWhere:
      'В корне проекта: объединяет apps/web, apps/api, apps/telemetry-ms и пакеты packages/shared-schemas, packages/ui.',
    adrHow:
      'Единый pnpm-workspace.yaml и turbo.json с пайплайнами build, lint, typecheck, dev и общими Zod-контрактами.',
  },
  {
    id: 'ts-biome-lefthook',
    adrNumber: 2,
    name: 'TypeScript (Strict) + Biome.js + Lefthook',
    category: 'DevOps & DX',
    experienceYears: 5,
    level: 'Core',
    summary: 'Линтинг и форматирование на Rust за ~50 мс + авто-версионирование на pre-commit.',
    adrWhy:
      'Связка ESLint + Prettier медленная. Biome.js на Rust заменяет оба инструмента одним бинарником, а Lefthook физически не пропускает сломанный код в git.',
    adrWhere: 'Глобально во всех пакетах и приложениях монорепозитория на этапе git commit и в CI.',
    adrHow:
      'В tsconfig.base.json включены strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes. В lefthook.yml: biome check -> turbo typecheck -> авто-инкремент патч-версии.',
  },
  {
    id: 'nextjs-app-router',
    adrNumber: 3,
    name: 'Next.js (App Router: SSG + SSR + RSC)',
    category: 'Frontend',
    experienceYears: 4,
    level: 'Core',
    summary: 'Гибридный рендеринг для мгновенного Workfolio CV и защищенной Базы Знаний.',
    adrWhy:
      'Одновременно нужны идеальное SEO и мгновенная загрузка для CV + статей (SSG) И строгая серверная проверка прав доступа до рендера страницы (Edge Proxy + SSR).',
    adrWhere: 'Приложение apps/web.',
    adrHow:
      'SSG (generateStaticParams) для статей, Edge Proxy для валидации JWT в куках на /knowledge-base/* и React Server Components без раздувания JS-бандла.',
  },
  {
    id: 'zustand-vs-tanstack-query',
    adrNumber: 4,
    name: 'Zustand vs TanStack Query (v5)',
    category: 'Frontend',
    experienceYears: 4,
    level: 'Core',
    summary: 'Строгое разделение серверного кэша и синхронного клиентского UI-стейта.',
    adrWhy:
      'Смешивать данные из API и UI-состояние в одном глобальном сторе — антипаттерн. TanStack Query отвечает за кэш, инвалидацию и Optimistic UI, а микроскопический Zustand (~1 KB) — за синхронный UI без Context Provider.',
    adrWhere: 'В приложении apps/web (src/store/* и src/hooks/*).',
    adrHow:
      'В Zustand хранятся модалки, состояние сайдбара и фильтры D3.js; в TanStack Query — профиль сессии и метрики статей.',
  },
  {
    id: 'indexeddb-persister',
    adrNumber: 5,
    name: 'IndexedDB + TanStack Query Persister',
    category: 'Database & Storage',
    experienceYears: 3,
    level: 'Production',
    summary: 'Offline-First клиентская БД с мгновенной отдачей статей за 0 мс (TTL 24ч).',
    adrWhy:
      'LocalStorage синхронный (блокирует главный поток) и вмещает всего ~5 МБ. Для Offline-First кэша нужна асинхронная транзакционная БД IndexedDB.',
    adrWhere: 'Ядро провайдеров и модуль Базы Знаний в apps/web.',
    adrHow: 'Подключен @tanstack/react-query-persist-client + адаптер idb-keyval с политикой gcTime / maxAge 24 часа.',
  },
  {
    id: 'rhf-zod',
    adrNumber: 6,
    name: 'React Hook Form + Zod',
    category: 'Frontend',
    experienceYears: 4,
    level: 'Core',
    summary: 'Формы без лишних ререндеров и единая сквозная схема валидации клиент + сервер.',
    adrWhy:
      'React Hook Form работает на неуправляемых инпутах через ref без ререндера всей формы на каждое нажатие клавиши, а Zod дает вывод TS-типов из одной схемы.',
    adrWhere: 'Микро-форма Guest Pass в хедере, фильтры и валидация DTO в NestJS.',
    adrHow:
      'GuestPassFormSchema в packages/shared-schemas подключена на фронте через @hookform/resolvers/zod и на бэке через ZodValidationPipe.',
  },
  {
    id: 'tailwind-shadcn-storybook',
    adrNumber: 7,
    name: 'Tailwind CSS + shadcn/ui + Storybook',
    category: 'Frontend',
    experienceYears: 4,
    level: 'Core',
    summary: 'Дизайн-система в эстетике Notion Workfolio на базе Radix UI с документацией в Storybook.',
    adrWhy:
      'В отличие от тяжелых рантайм-библиотек (MUI/AntD), shadcn/ui дает полный контроль кода и доступность WAI-ARIA из коробки, а Storybook позволяет тестировать UI изолированно.',
    adrWhere: 'Пакет packages/ui (@repo/ui), используемый в apps/web.',
    adrHow:
      'Атомарные компоненты (Button, Input, Badge, Card, Dialog, Tabs, Callout) покрыты .stories.tsx в изолированном каталоге Storybook.',
  },
  {
    id: 'tanstack-table-redact',
    adrNumber: 8,
    name: 'TanStack Table & React 19 Compiler',
    category: 'Frontend',
    experienceYears: 3,
    level: 'Core',
    summary: 'Headless-движок таблиц для Tech Radar, авто-мемоизация React Compiler и агрессивный Tree-Shaking.',
    adrWhy:
      'TanStack Table берет на себя математику сортировки и мульти-фильтрации при 100% контроле верстки, а babel-plugin-react-compiler и optimizePackageImports устраняют лишние ререндеры и мертвый JS-код.',
    adrWhere: 'Матрица навыков Tech Radar на странице CV и конфигурация reactCompiler: true в next.config.ts.',
    adrHow:
      'Таблица с фильтрами и ADR-инспектором на главной странице + авто-мемоизация React 19 Compiler и @next/bundle-analyzer.',
  },
  {
    id: 'mdx-webp-d3',
    adrNumber: 9,
    name: 'MDX + WebP + D3.js',
    category: 'Frontend',
    experienceYears: 3,
    level: 'Production',
    summary: 'Интерактивные инженерные статьи с живыми графами D3.js и оптимизированной графикой WebP.',
    adrWhy:
      'MDX позволяет рендерить внутри текста статей живые React-компоненты и интерактивные SVG-симуляции D3.js, а WebP сжимает изображения на 30–50% лучше PNG/JPEG.',
    adrWhere: 'Раздел /knowledge-base/[category]/[slug] в apps/web.',
    adrHow:
      'Кастомные MDX-компоненты <ArticleImageGrid /> и лениво загружаемые графы <ReactRenderGraphD3 /> и <ArchitectureFlowD3 />.',
  },
  {
    id: 'nestjs-modular',
    adrNumber: 10,
    name: 'NestJS (Modular Architecture)',
    category: 'Backend',
    experienceYears: 4,
    level: 'Core',
    summary: 'Строгая Enterprise-архитектура бэкенда с DI, модулями, пайпами и гардами.',
    adrWhy:
      'Next.js API Routes в крупном проекте превращаются в спагетти-код. NestJS дает строгую структуру (DI, Modules, Controllers, Services, Guards), понятную любому бэкенд-тимлиду.',
    adrWhere: 'Приложение apps/api.',
    adrHow: 'Изолированные доменные модули: AuthModule, KnowledgeModule, TelemetryModule, PrismaModule.',
  },
  {
    id: 'jwt-httponly-rbac',
    adrNumber: 11,
    name: 'JWT in HttpOnly Cookies + RBAC',
    category: 'Backend',
    experienceYears: 4,
    level: 'Core',
    summary: 'Защита от XSS через HttpOnly куки и ролевая модель GUEST / USER / ADMIN.',
    adrWhy:
      'Хранение JWT в LocalStorage уязвимо к XSS. Передача через HttpOnly, Secure, SameSite=Lax куку делает токен недоступным для JS и автоматически работает с Next.js Edge Proxy.',
    adrWhere: 'Связка apps/api (выпуск и верификация) и apps/web (защита роутов).',
    adrHow:
      'Кука kb_access_token, декоратор @Roles(...) и JwtRolesGuard + бесшовный переход GUEST -> USER/ADMIN через микро-форму.',
  },
  {
    id: 'postgresql-neon-prisma',
    adrNumber: 12,
    name: 'PostgreSQL (Neon.tech) + Prisma ORM',
    category: 'Database & Storage',
    experienceYears: 4,
    level: 'Core',
    summary: 'Serverless PostgreSQL со строгой типобезопасностью запросов и декларативными миграциями.',
    adrWhy:
      'PostgreSQL — индустриальный стандарт, Neon.tech дает бесплатный Serverless Postgres с масштабированием, а Prisma ORM гарантирует 100% типобезопасность запросов.',
    adrWhere: 'Слой персистентности в apps/api/prisma.',
    adrHow: 'Модели VisitorSession, ArticleMetrics и SystemEventLog с атомарными upsert-операциями.',
  },
  {
    id: 'microservices-sse',
    adrNumber: 13,
    name: '@nestjs/microservices + Server-Sent Events (SSE)',
    category: 'Architecture',
    experienceYears: 3,
    level: 'Production',
    summary: 'Отдельный микросервис аналитики и реактивный real-time стрим в браузер по HTTP.',
    adrWhy:
      'Вынос телеметрии в микросервис демонстрирует распределенную архитектуру, а SSE (@Sse) легче WebSockets для однонаправленного стриминга и сам переподключается при обрыве.',
    adrWhere: 'Связка apps/api <-> apps/telemetry-ms -> apps/web.',
    adrHow:
      'Асинхронные события emit("telemetry.event") в микросервис и RxJS Observable в @Sse("/api/telemetry/stream") с пульсом 15с.',
  },
  {
    id: 'docker-multistage',
    adrNumber: 14,
    name: 'Docker (Multi-stage + turbo prune)',
    category: 'DevOps & DX',
    experienceYears: 3,
    level: 'Production',
    summary: '3-ступенчатые образы на Alpine под non-root пользователем и запуск стека одной командой.',
    adrWhy:
      'Гарантирует идентичность окружений и минимальный размер образов за счет вырезания только нужных подграфов монорепозитория через turbo prune.',
    adrWhere: 'Папка docker/ и корневой docker-compose.yml.',
    adrHow:
      'Этапы pruner -> builder -> runner (node:22-alpine) и единый docker compose up --build с локальным Postgres.',
  },
  {
    id: 'sentry-posthog',
    adrNumber: 15,
    name: 'Sentry + PostHog Observability',
    category: 'DevOps & DX',
    experienceYears: 3,
    level: 'Production',
    summary: 'Перехват исключений на фронте и бэке + продуктовая аналитика действий тимлидов.',
    adrWhy:
      'Продакшен без мониторинга — слепой полет. Sentry ловит ошибки со стектрейсом, а PostHog показывает воронку открытий Guest Pass и чтения статей.',
    adrWhere: 'В приложениях apps/web и apps/api.',
    adrHow:
      'Error Boundaries в Next.js + GlobalExceptionFilter в NestJS для Sentry и клиентский провайдер аналитики PostHog.',
  },
  {
    id: 'next-intl-mdx-i18n',
    adrNumber: 16,
    name: 'next-intl (RSC i18n) + Multilingual MDX (EN / UA / RU)',
    category: 'Frontend',
    experienceYears: 4,
    level: 'Core',
    summary: 'Мультиязычная маршрутизация (EN по умолчанию + UA / RU) со 100% SSG и локализованными .mdx статьями.',
    adrWhy:
      'Публичное портфолио и инженерная база знаний должны одинаково комфортно читаться международными рекрутерами (EN) и локальными командами (UA / RU) без потери SSG, SEO и единых метрик статей.',
    adrWhere: 'Глобально на всех страницах apps/web (src/i18n/*, src/app/[locale]/*, messages/* и content/*).',
    adrHow:
      'next-intl с localePrefix: "as-needed" и localeDetection: false (чистый URL / всегда открывает EN), переключатель EN | UA | RU в хедере и colocated файлы *.en.mdx, *.uk.mdx, *.ru.mdx с fallback на EN.',
  },
] as const

export const TECH_RADAR_ITEMS_EN: readonly TechRadarItem[] = [
  {
    id: 'pnpm-turborepo',
    adrNumber: 1,
    name: 'pnpm + Turborepo',
    category: 'Architecture',
    experienceYears: 4,
    level: 'Core',
    summary: 'Monorepo with strict dependency isolation and cached build pipelines.',
    adrWhy:
      'Eliminates type drift between Next.js and NestJS. pnpm saves up to 70% disk space via hard links and prevents phantom dependencies, while Turborepo provides incremental caching and parallel task execution.',
    adrWhere:
      'Root workspace orchestrating apps/web, apps/api, apps/telemetry-ms and shared packages/shared-schemas, packages/ui.',
    adrHow:
      'Unified pnpm-workspace.yaml and turbo.json with build, lint, typecheck, and dev pipelines backed by shared Zod contracts.',
  },
  {
    id: 'ts-biome-lefthook',
    adrNumber: 2,
    name: 'TypeScript (Strict) + Biome.js + Lefthook',
    category: 'DevOps & DX',
    experienceYears: 5,
    level: 'Core',
    summary: 'Rust-powered linting and formatting in ~50ms + automated SemVer bump on pre-commit.',
    adrWhy:
      'ESLint + Prettier is slow and heavy. Biome.js (written in Rust) replaces both with a single binary, while Lefthook blocks broken code from entering Git.',
    adrWhere: 'Globally across all packages and applications during git commit and CI.',
    adrHow:
      'tsconfig.base.json enables strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes. lefthook.yml runs biome check -> turbo typecheck -> patch version bump.',
  },
  {
    id: 'nextjs-app-router',
    adrNumber: 3,
    name: 'Next.js (App Router: SSG + SSR + RSC)',
    category: 'Frontend',
    experienceYears: 4,
    level: 'Core',
    summary: 'Hybrid rendering for an instant Workfolio CV and an Edge-protected Knowledge Base.',
    adrWhy:
      'We simultaneously need top SEO & instant page loads for the CV and articles (SSG) AND strict server-side access verification before rendering protected routes (Edge Proxy + SSR).',
    adrWhere: 'Frontend application apps/web.',
    adrHow:
      'SSG (generateStaticParams) for localized MDX articles, Edge Proxy for validating JWT cookies on /knowledge-base/*, and React Server Components with next-intl.',
  },
  {
    id: 'zustand-vs-tanstack-query',
    adrNumber: 4,
    name: 'Zustand vs TanStack Query (v5)',
    category: 'Frontend',
    experienceYears: 4,
    level: 'Core',
    summary: 'Strict separation of server cache state and synchronous client UI state.',
    adrWhy:
      'Mixing API cache and UI state in one global store is an anti-pattern. TanStack Query handles server cache, invalidation, and Optimistic UI, while Zustand (~1 KB) manages synchronous UI state without Context provider overhead.',
    adrWhere: 'In apps/web (src/store/* and src/hooks/*).',
    adrHow:
      'Zustand stores modals, sidebar state, and D3.js filters using atomic selectors; TanStack Query manages visitor session profiles and article metrics.',
  },
  {
    id: 'indexeddb-persister',
    adrNumber: 5,
    name: 'IndexedDB + TanStack Query Persister',
    category: 'Database & Storage',
    experienceYears: 3,
    level: 'Production',
    summary: 'Offline-First browser database delivering cached articles in 0ms (24h TTL).',
    adrWhy:
      'LocalStorage is synchronous (blocking the main thread) and capped at ~5 MB. Offline-First caching requires the asynchronous transactional IndexedDB storage engine.',
    adrWhere: 'Core query provider and Knowledge Base module in apps/web.',
    adrHow:
      'Configured @tanstack/react-query-persist-client with an idb-keyval async adapter and a 24-hour gcTime policy.',
  },
  {
    id: 'rhf-zod',
    adrNumber: 6,
    name: 'React Hook Form + Zod',
    category: 'Frontend',
    experienceYears: 4,
    level: 'Core',
    summary: 'Zero-rerender forms with a single end-to-end validation schema across client and server.',
    adrWhy:
      'React Hook Form uses uncontrolled inputs via refs to avoid full-form re-renders on keystrokes, while Zod infers static TypeScript types from a single runtime schema.',
    adrWhere: '1-Click Guest Pass modal in the header, filters, and DTO validation in NestJS.',
    adrHow:
      'GuestPassFormSchema in packages/shared-schemas is wired on the frontend via @hookform/resolvers/zod and on the backend via ZodValidationPipe.',
  },
  {
    id: 'tailwind-shadcn-storybook',
    adrNumber: 7,
    name: 'Tailwind CSS + shadcn/ui + Storybook',
    category: 'Frontend',
    experienceYears: 4,
    level: 'Core',
    summary: 'Notion Workfolio design system built on Radix UI primitives and documented in Storybook.',
    adrWhy:
      'Unlike heavy runtime component libraries (MUI/AntD), shadcn/ui gives full source ownership and WAI-ARIA accessibility out of the box, while Storybook enables isolated visual testing.',
    adrWhere: 'Shared package packages/ui (@repo/ui) consumed by apps/web.',
    adrHow:
      'Atomic components (Button, Input, Badge, Card, Dialog, Tabs, Callout) covered by .stories.tsx in Storybook 8.',
  },
  {
    id: 'tanstack-table-redact',
    adrNumber: 8,
    name: 'TanStack Table & React 19 Compiler',
    category: 'Frontend',
    experienceYears: 3,
    level: 'Core',
    summary: 'Headless table engine for the Tech Radar, React Compiler auto-memoization, and aggressive tree-shaking.',
    adrWhy:
      'TanStack Table handles sorting and multi-filtering math with 100% markup freedom, while babel-plugin-react-compiler and optimizePackageImports eliminate redundant re-renders and dead client JS.',
    adrWhere: 'Interactive Tech Radar matrix on the CV page and reactCompiler: true in next.config.ts.',
    adrHow:
      'Sortable/filterable ADR matrix with inspector dialogs + React 19 Compiler auto-memoization and @next/bundle-analyzer.',
  },
  {
    id: 'mdx-webp-d3',
    adrNumber: 9,
    name: 'MDX + WebP + D3.js',
    category: 'Frontend',
    experienceYears: 3,
    level: 'Production',
    summary: 'Interactive multilingual engineering articles with live D3.js graphs and WebP imagery.',
    adrWhy:
      'MDX embeds live React components and interactive D3.js SVG simulations directly inside technical prose, while WebP shrinks images by 30–50% over PNG/JPEG.',
    adrWhere: 'Protected /knowledge-base/[category]/[slug] routes in apps/web.',
    adrHow:
      'Colocated localized MDX files (.en.mdx, .uk.mdx, .ru.mdx) with custom <ArticleImageGrid />, <ReactRenderGraphD3 />, and <ArchitectureFlowD3 />.',
  },
  {
    id: 'nestjs-modular',
    adrNumber: 10,
    name: 'NestJS (Modular Architecture)',
    category: 'Backend',
    experienceYears: 4,
    level: 'Core',
    summary: 'Enterprise backend architecture with Dependency Injection, modules, pipes, and guards.',
    adrWhy:
      'Next.js API Routes become hard to scale in large domains. NestJS enforces a clean architecture (DI, Modules, Controllers, Services, Guards) familiar to any backend engineering lead.',
    adrWhere: 'Backend application apps/api.',
    adrHow: 'Isolated domain modules: AuthModule, KnowledgeModule, TelemetryModule, and PrismaModule.',
  },
  {
    id: 'jwt-httponly-rbac',
    adrNumber: 11,
    name: 'JWT in HttpOnly Cookies + RBAC',
    category: 'Backend',
    experienceYears: 4,
    level: 'Core',
    summary: 'XSS-immune authentication via HttpOnly cookies and GUEST / USER / ADMIN role-based access.',
    adrWhy:
      'Storing JWTs in LocalStorage exposes tokens to XSS. Delivering tokens via HttpOnly, Secure, SameSite=Lax cookies hides them from client JS and works natively with Next.js Edge Proxy.',
    adrWhere: 'Integrated across apps/api (signing & verification) and apps/web (route protection).',
    adrHow:
      'kb_access_token cookie, @Roles(...) decorator, and JwtRolesGuard + seamless GUEST -> USER/ADMIN upgrade via the 1-Click modal.',
  },
  {
    id: 'postgresql-neon-prisma',
    adrNumber: 12,
    name: 'PostgreSQL (Neon.tech) + Prisma ORM',
    category: 'Database & Storage',
    experienceYears: 4,
    level: 'Core',
    summary: 'Serverless PostgreSQL with end-to-end type-safe queries and declarative migrations.',
    adrWhy:
      'PostgreSQL is the industry gold standard, Neon.tech provides serverless autoscaling Postgres, and Prisma ORM guarantees 100% compile-time query safety.',
    adrWhere: 'Persistence layer in apps/api/prisma.',
    adrHow:
      'VisitorSession, ArticleMetrics, and SystemEventLog models with atomic upsert operations and resilient fallback.',
  },
  {
    id: 'microservices-sse',
    adrNumber: 13,
    name: '@nestjs/microservices + Server-Sent Events (SSE)',
    category: 'Architecture',
    experienceYears: 3,
    level: 'Production',
    summary: 'Dedicated telemetry microservice and reactive real-time HTTP streaming to the browser.',
    adrWhy:
      'Extracting telemetry into a microservice demonstrates distributed systems design, while SSE (@Sse) is lighter than WebSockets for unidirectional live feeds and reconnects automatically.',
    adrWhere: 'Pipeline connecting apps/api <-> apps/telemetry-ms -> apps/web.',
    adrHow:
      'Asynchronous emit("telemetry.event") over TCP (:4001) and RxJS Observable in @Sse("/api/telemetry/stream") with a 15s heartbeat.',
  },
  {
    id: 'docker-multistage',
    adrNumber: 14,
    name: 'Docker (Multi-stage + turbo prune)',
    category: 'DevOps & DX',
    experienceYears: 3,
    level: 'Production',
    summary: '3-stage Alpine images running as non-root user and 1-command stack orchestration.',
    adrWhy:
      'Guarantees environment parity and minimal image sizes by extracting only the required workspace subgraph via turbo prune.',
    adrWhere: 'docker/ directory and root docker-compose.yml.',
    adrHow: 'pruner -> builder -> runner (node:22-alpine) stages orchestrated via docker compose up --build.',
  },
  {
    id: 'sentry-posthog',
    adrNumber: 15,
    name: 'Sentry + PostHog Observability',
    category: 'DevOps & DX',
    experienceYears: 3,
    level: 'Production',
    summary: 'Full-stack exception tracking and product analytics for recruiter & tech lead journeys.',
    adrWhy:
      'Running production without observability is flying blind. Sentry captures stack traces while PostHog tracks the Guest Pass and article engagement funnel.',
    adrWhere: 'Integrated in apps/web and apps/api.',
    adrHow:
      'Next.js Error Boundaries + NestJS GlobalExceptionFilter for Sentry and client-side PostHog event tracking.',
  },
  {
    id: 'next-intl-mdx-i18n',
    adrNumber: 16,
    name: 'next-intl (RSC i18n) + Multilingual MDX (EN / UA / RU)',
    category: 'Frontend',
    experienceYears: 4,
    level: 'Core',
    summary: 'Multilingual routing (EN default + UA / RU) with 100% SSG preservation and colocated .mdx articles.',
    adrWhy:
      'The Workfolio CV and Engineering Knowledge Base must seamlessly serve international recruiters (EN) and regional engineering teams (UA / RU) without sacrificing SSG, SEO, or unified article metrics.',
    adrWhere: 'Globally across all routes in apps/web (src/i18n/*, src/app/[locale]/*, messages/*, and content/*).',
    adrHow:
      'next-intl configured with localePrefix: "as-needed" and localeDetection: false (clean / URL always opens EN), header EN | UA | RU switcher, and colocated *.en.mdx, *.uk.mdx, *.ru.mdx files with automatic EN fallback.',
  },
] as const

export const TECH_RADAR_ITEMS_UK: readonly TechRadarItem[] = [
  {
    id: 'pnpm-turborepo',
    adrNumber: 1,
    name: 'pnpm + Turborepo',
    category: 'Architecture',
    experienceYears: 4,
    level: 'Core',
    summary: 'Монорепозиторій із суворою ізоляцією залежностей та кешуванням пайплайнів.',
    adrWhy:
      'Усуває розсинхронізацію типів між Next.js та NestJS. pnpm заощаджує до 70% місця завдяки hard links і захищає від фантомних залежностей, а Turborepo дає кешування збірки та паралельний запуск.',
    adrWhere:
      'У корені проєкту: об’єднує apps/web, apps/api, apps/telemetry-ms та пакети packages/shared-schemas, packages/ui.',
    adrHow:
      'Єдиний pnpm-workspace.yaml та turbo.json із пайплайнами build, lint, typecheck, dev та спільними Zod-контрактами.',
  },
  {
    id: 'ts-biome-lefthook',
    adrNumber: 2,
    name: 'TypeScript (Strict) + Biome.js + Lefthook',
    category: 'DevOps & DX',
    experienceYears: 5,
    level: 'Core',
    summary: 'Лінтинг і форматування на Rust за ~50 мс + авто-версіонування на pre-commit.',
    adrWhy:
      'Зв’язка ESLint + Prettier повільна. Biome.js на Rust замінює обидва інструменти одним бінарником, а Lefthook фізично не пропускає зламаний код у git.',
    adrWhere: 'Глобально в усіх пакетах і застосунках монорепозиторію на етапі git commit та в CI.',
    adrHow:
      'У tsconfig.base.json увімкнено strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes. У lefthook.yml: biome check -> turbo typecheck -> авто-інкремент патч-версії.',
  },
  {
    id: 'nextjs-app-router',
    adrNumber: 3,
    name: 'Next.js (App Router: SSG + SSR + RSC)',
    category: 'Frontend',
    experienceYears: 4,
    level: 'Core',
    summary: 'Гібридний рендеринг для миттєвого Workfolio CV та захищеної Бази Знань.',
    adrWhy:
      'Одночасно потрібні ідеальне SEO та миттєве завантаження для CV + статей (SSG) І сувора серверна перевірка прав доступу до рендеру сторінки (Edge Proxy + SSR).',
    adrWhere: 'Застосунок apps/web.',
    adrHow:
      'SSG (generateStaticParams) для мультимовних статей, Edge Proxy для валідації JWT у куках на /knowledge-base/* та React Server Components без роздування JS-бандла.',
  },
  {
    id: 'zustand-vs-tanstack-query',
    adrNumber: 4,
    name: 'Zustand vs TanStack Query (v5)',
    category: 'Frontend',
    experienceYears: 4,
    level: 'Core',
    summary: 'Суворе розділення серверного кешу та синхронного клієнтського UI-стейту.',
    adrWhy:
      'Змішувати дані з API та UI-стан в одному глобальному сторі — антипатерн. TanStack Query відповідає за кеш, інвалідацію та Optimistic UI, а мікроскопічний Zustand (~1 KB) — за синхронний UI без Context Provider.',
    adrWhere: 'У застосунку apps/web (src/store/* та src/hooks/*).',
    adrHow:
      'У Zustand зберігаються модалки, стан сайдбару та фільтри D3.js; у TanStack Query — профіль сесії та метрики статей.',
  },
  {
    id: 'indexeddb-persister',
    adrNumber: 5,
    name: 'IndexedDB + TanStack Query Persister',
    category: 'Database & Storage',
    experienceYears: 3,
    level: 'Production',
    summary: 'Offline-First клієнтська БД із миттєвою віддачею статей за 0 мс (TTL 24 год).',
    adrWhy:
      'LocalStorage синхронний (блокує головний потік) і вміщує лише ~5 МБ. Для Offline-First кешу потрібна асинхронна транзакційна БД IndexedDB.',
    adrWhere: 'Ядро провайдерів та модуль Бази Знань в apps/web.',
    adrHow:
      'Підключено @tanstack/react-query-persist-client + адаптер idb-keyval із політикою gcTime / maxAge 24 години.',
  },
  {
    id: 'rhf-zod',
    adrNumber: 6,
    name: 'React Hook Form + Zod',
    category: 'Frontend',
    experienceYears: 4,
    level: 'Core',
    summary: 'Форми без зайвих ререндерів та єдина наскрізна схема валідації клієнт + сервер.',
    adrWhy:
      'React Hook Form працює на некерованих інпутах через ref без ререндеру всієї форми на кожне натискання клавіші, а Zod дає виведення TS-типів з однієї схеми.',
    adrWhere: 'Мікро-форма Guest Pass у хедері, фільтри та валідація DTO в NestJS.',
    adrHow:
      'GuestPassFormSchema у packages/shared-schemas підключена на фронті через @hookform/resolvers/zod і на беку через ZodValidationPipe.',
  },
  {
    id: 'tailwind-shadcn-storybook',
    adrNumber: 7,
    name: 'Tailwind CSS + shadcn/ui + Storybook',
    category: 'Frontend',
    experienceYears: 4,
    level: 'Core',
    summary: 'Дизайн-система в естетиці Notion Workfolio на базі Radix UI з документацією в Storybook.',
    adrWhy:
      'На відміну від важких рантайм-бібліотек (MUI/AntD), shadcn/ui дає повний контроль коду та доступність WAI-ARIA з коробки, а Storybook дозволяє тестувати UI ізольовано.',
    adrWhere: 'Пакет packages/ui (@repo/ui), що використовується в apps/web.',
    adrHow:
      'Атомарні компоненти (Button, Input, Badge, Card, Dialog, Tabs, Callout) покриті .stories.tsx в ізольованому каталозі Storybook.',
  },
  {
    id: 'tanstack-table-redact',
    adrNumber: 8,
    name: 'TanStack Table & React 19 Compiler',
    category: 'Frontend',
    experienceYears: 3,
    level: 'Core',
    summary: 'Headless-рушій таблиць для Tech Radar, авто-мемоїзація React Compiler та агресивний Tree-Shaking.',
    adrWhy:
      'TanStack Table бере на себе математику сортування й мульти-фільтрації при 100% контролі верстки, а babel-plugin-react-compiler та optimizePackageImports прибирають зайві ререндери й мертвий JS-код.',
    adrWhere: 'Матриця навичок Tech Radar на сторінці CV та конфігурація reactCompiler: true в next.config.ts.',
    adrHow:
      'Таблиця з фільтрами та ADR-діалогами на головній сторінці + авто-мемоїзація React 19 Compiler і @next/bundle-analyzer.',
  },
  {
    id: 'mdx-webp-d3',
    adrNumber: 9,
    name: 'MDX + WebP + D3.js',
    category: 'Frontend',
    experienceYears: 3,
    level: 'Production',
    summary: 'Інтерактивні інженерні статті з живими графами D3.js та оптимізованою графікою WebP.',
    adrWhy:
      'MDX дозволяє рендерити всередині тексту статей живі React-компоненти та інтерактивні SVG-симуляції D3.js, а WebP стискає зображення на 30–50% краще за PNG/JPEG.',
    adrWhere: 'Розділ /knowledge-base/[category]/[slug] в apps/web.',
    adrHow:
      'Мультимовні MDX-файли (.en.mdx, .uk.mdx, .ru.mdx) та кастомні компоненти <ArticleImageGrid />, <ReactRenderGraphD3 /> і <ArchitectureFlowD3 />.',
  },
  {
    id: 'nestjs-modular',
    adrNumber: 10,
    name: 'NestJS (Modular Architecture)',
    category: 'Backend',
    experienceYears: 4,
    level: 'Core',
    summary: 'Сувора Enterprise-архітектура бекенду з DI, модулями, пайпами та гардами.',
    adrWhy:
      'Next.js API Routes у великому проєкті перетворюються на спагеті-код. NestJS дає сувору структуру (DI, Modules, Controllers, Services, Guards), зрозумілу будь-якому бекенд-тімліду.',
    adrWhere: 'Застосунок apps/api.',
    adrHow: 'Ізольовані доменні модулі: AuthModule, KnowledgeModule, TelemetryModule, PrismaModule.',
  },
  {
    id: 'jwt-httponly-rbac',
    adrNumber: 11,
    name: 'JWT in HttpOnly Cookies + RBAC',
    category: 'Backend',
    experienceYears: 4,
    level: 'Core',
    summary: 'Захист від XSS через HttpOnly куки та рольова модель GUEST / USER / ADMIN.',
    adrWhy:
      'Зберігання JWT у LocalStorage вразливе до XSS. Передача через HttpOnly, Secure, SameSite=Lax куку робить токен недоступним для JS і автоматично працює з Next.js Edge Proxy.',
    adrWhere: 'Зв’язка apps/api (випуск і верифікація) та apps/web (захист роутів).',
    adrHow:
      'Кука kb_access_token, декоратор @Roles(...) та JwtRolesGuard + безшовний перехід GUEST -> USER/ADMIN через мікро-форму.',
  },
  {
    id: 'postgresql-neon-prisma',
    adrNumber: 12,
    name: 'PostgreSQL (Neon.tech) + Prisma ORM',
    category: 'Database & Storage',
    experienceYears: 4,
    level: 'Core',
    summary: 'Serverless PostgreSQL із суворою типобезпекою запитів та декларативними міграціями.',
    adrWhy:
      'PostgreSQL — індустріальний стандарт, Neon.tech дає безкоштовний Serverless Postgres із масштабуванням, а Prisma ORM гарантує 100% типобезпеку запитів.',
    adrWhere: 'Шар персистентності в apps/api/prisma.',
    adrHow: 'Моделі VisitorSession, ArticleMetrics та SystemEventLog з атомарними upsert-операціями.',
  },
  {
    id: 'microservices-sse',
    adrNumber: 13,
    name: '@nestjs/microservices + Server-Sent Events (SSE)',
    category: 'Architecture',
    experienceYears: 3,
    level: 'Production',
    summary: 'Окремий мікросервіс аналітики та реактивний real-time стрім у браузер по HTTP.',
    adrWhy:
      'Винесення телеметрії в мікросервіс демонструє розподілену архітектуру, а SSE (@Sse) легший за WebSockets для односпрямованого стрімінгу і сам перепідключається при обриві.',
    adrWhere: 'Зв’язка apps/api <-> apps/telemetry-ms -> apps/web.',
    adrHow:
      'Асинхронні події emit("telemetry.event") у мікросервіс та RxJS Observable в @Sse("/api/telemetry/stream") із пульсом 15с.',
  },
  {
    id: 'docker-multistage',
    adrNumber: 14,
    name: 'Docker (Multi-stage + turbo prune)',
    category: 'DevOps & DX',
    experienceYears: 3,
    level: 'Production',
    summary: '3-ступеневі образи на Alpine під non-root користувачем та запуск стека однією командою.',
    adrWhy:
      'Гарантує ідентичність середовищ і мінімальний розмір образів за рахунок вирізання лише потрібних підграфів монорепозиторію через turbo prune.',
    adrWhere: 'Папка docker/ та кореневий docker-compose.yml.',
    adrHow:
      'Етапи pruner -> builder -> runner (node:22-alpine) та єдиний docker compose up --build із локальним Postgres.',
  },
  {
    id: 'sentry-posthog',
    adrNumber: 15,
    name: 'Sentry + PostHog Observability',
    category: 'DevOps & DX',
    experienceYears: 3,
    level: 'Production',
    summary: 'Перехоплення винятків на фронті й беку + продуктова аналітика дій тімлідів.',
    adrWhy:
      'Продакшен без моніторингу — сліпий політ. Sentry ловить помилки зі стектрейсом, а PostHog показує воронку відкриттів Guest Pass та читання статей.',
    adrWhere: 'У застосунках apps/web та apps/api.',
    adrHow:
      'Error Boundaries у Next.js + GlobalExceptionFilter у NestJS для Sentry та клієнтський провайдер аналітики PostHog.',
  },
  {
    id: 'next-intl-mdx-i18n',
    adrNumber: 16,
    name: 'next-intl (RSC i18n) + Multilingual MDX (EN / UA / RU)',
    category: 'Frontend',
    experienceYears: 4,
    level: 'Core',
    summary: 'Мультимовна маршрутизація (EN за замовчуванням + UA / RU) зі 100% SSG та локалізованими .mdx статтями.',
    adrWhy:
      'Публічне портфоліо та інженерна база знань мають однаково зручно читатися міжнародними рекрутерами (EN) та локальними командами (UA / RU) без втрати SSG, SEO та спільних метрик статей.',
    adrWhere: 'Глобально на всіх сторінках apps/web (src/i18n/*, src/app/[locale]/*, messages/* та content/*).',
    adrHow:
      'next-intl із localePrefix: "as-needed" та localeDetection: false (чистий URL / завжди відкриває EN), перемикач EN | UA | RU у хедері та colocated файли *.en.mdx, *.uk.mdx, *.ru.mdx із fallback на EN.',
  },
] as const

export const TECH_RADAR_ITEMS: readonly TechRadarItem[] = TECH_RADAR_ITEMS_EN

export function getTechRadarItems(locale: SupportedLocale = 'en'): readonly TechRadarItem[] {
  if (locale === 'uk') {
    return TECH_RADAR_ITEMS_UK
  }
  if (locale === 'ru') {
    return TECH_RADAR_ITEMS_RU
  }
  return TECH_RADAR_ITEMS_EN
}
