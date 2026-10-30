import { z } from 'zod'

export const TechCategoryEnum = z.enum(['Frontend', 'Backend', 'Database & Storage', 'DevOps & DX', 'Architecture'])
export type TechCategory = z.infer<typeof TechCategoryEnum>

export const TechLevelEnum = z.enum(['Core', 'Production', 'Experimental'])
export type TechLevel = z.infer<typeof TechLevelEnum>

export const TechRadarItemSchema = z.object({
  id: z.string().min(1),
  adrNumber: z.number().int().min(1).max(15),
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

export const TECH_RADAR_ITEMS: readonly TechRadarItem[] = [
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
      'Одновременно нужны идеальное SEO и мгновенная загрузка для CV + статей (SSG) И строгая серверная проверка прав доступа до рендера страницы (Edge Middleware + SSR).',
    adrWhere: 'Приложение apps/web.',
    adrHow:
      'SSG (generateStaticParams) для статей, Edge Middleware для валидации JWT в куках на /knowledge-base/* и React Server Components без раздувания JS-бандла.',
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
    adrHow: 'Подключен @tanstack/query-persist-client-core + адаптер idb-keyval с политикой gcTime / maxAge 24 часа.',
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
    name: 'TanStack Table & TanStack Redact',
    category: 'Frontend',
    experienceYears: 3,
    level: 'Experimental',
    summary: 'Headless-движок таблиц для Tech Radar и эксперимент по уменьшению React-бандла на ~20%.',
    adrWhy:
      'TanStack Table берет на себя математику сортировки и мульти-фильтрации при 100% контроле верстки, а TanStack Redact уменьшает клиентский рантайм на ~35 KB.',
    adrWhere: 'Матрица навыков Tech Radar на странице CV и конфигурация next.config.ts.',
    adrHow:
      'Таблица с фильтрами и ADR-поповерами на главной странице + флаг ENABLE_REDACT и замер бандла в Базе Знаний.',
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
      'Хранение JWT в LocalStorage уязвимо к XSS. Передача через HttpOnly, Secure, SameSite=Lax куку делает токен недоступным для JS и автоматически работает с Next.js Edge Middleware.',
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
] as const
