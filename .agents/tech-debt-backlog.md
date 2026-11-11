# 🛠️ Tech Debt & Post-MVP Backlog

## 📌 Текущий статус проекта (Baseline State)

Базовая архитектура монорепозитория (**Epics 1–7, MVP**) **полностью реализована и работает**:
- **Monorepo Core:** `pnpm 12.16.1` Workspaces (`allowBuilds`) + `Turborepo` + `Biome 2.6.4` + `Lefthook 2.2.2` + `scripts/bootstrap-env.mjs`.
- **Shared Packages:** `@repo/shared-schemas` (Zod-контракты API/SSE/RBAC) и `@repo/ui` (Tailwind CSS, shadcn/ui, Storybook 10).
- **Backend (`apps/api` + `apps/telemetry-ms`):** `NestJS 12` (Native ESM), `Prisma ORM` (с In-Memory fallback без БД), `HttpOnly` JWT Cookie Auth (`ADMIN` / `GUEST`), `@Sse('stream')` проксирование TCP-телеметрии.
- **Frontend (`apps/web`):** `Next.js 16` App Router, `src/proxy.ts` Edge-защита роутов, `TanStack Query v5` + `IndexedDB` Offline-First кэш, `Zustand`, `TanStack Table` (15 ADR), SSG `.mdx` инженерная база знаний с `D3.js` симуляциями.
- **DevOps:** Мультистейдж `Dockerfile` в `docker/*` и `docker-compose.yml`.

---

## 🗺️ Утверждённая поэтапная очередь развития продукта (Master Product Queue — Phases 1–5)

Продукт развивается как **двуединая платформа**:
1. **Личный образовательный портал («Вторая память»)** с глубокой многоуровневой иерархией разделов и подпунктов на 100+ конспектов/шпаргалок.
2. **Репрезентативное инженерное портфолио (Notion Workfolio)** для Team Lead / CTO с эталонным Mobile-First UX.

### ✅ Этап 1 (Phase 1): Mobile-First фундамент, разгрузка Хедера, Боковой Навигатор Страницы и фикс Анкоров

- [x] **Разгрузка `WorkfolioHeader`:** убрать центральный список ссылок (`About`, `Projects`, `Experience`, `Tech Radar`) из шапки; оставить справа от `Base of Knowledge` единственную быструю кнопку `ADR` (и `CV` внутри Базы Знаний); адаптировать `LanguageSwitcher` в компактный триггер на узких мобильных экранах (`< sm`).
- [x] **Безотказный скролл по якорям (`useSectionNavigation`):** устранить «замирание» роутера Next.js при повторном клике на один и тот же `#hash` после ручного скролла; добавить `IntersectionObserver` (`ScrollSpy`) для отслеживания активной секции.
- [x] **Боковой навигатор секций (`PageSectionNavigator`):** парящий индикатор-оглавление в духе Notion сбоку от контента на десктопе (`xl:`) и эргономичная плавающая кнопка-таблетка с быстрым меню разделов под большой палец на мобильных и планшетах (`< xl`).
- [x] **Mobile-First адаптация экранов:**
  - `TechRadarTable`: переключение в режим карточек (`Card View`) на экранах `< md` и сохранение `TanStack Table` на `>= md`.
  - `KnowledgeSidebar`: на смартфонах (`< md`) дерево статей закрыто по умолчанию (открывается по кнопке-шторке и само закрывается при выборе статьи), чтобы не перекрывать первый экран чтения конспекта.
  - `D3.js` графы и `WorkfolioFooter`: горизонтальный touch-scroll контейнер с сохранением читаемого масштаба узлов на узких экранах.

### ✅ Этап 2 (Phase 2): Многоуровневое дерево Базы Знаний (`Category → Subtopic → Nested Subtopics → Article`) и раздел «Этот проект»

- [x] **Иерархический Catch-All роутинг `/[locale]/knowledge-base/[...slug]`:** уход от жесткой двухуровневой схемы `[category]/[slug]` к произвольной глубине вложенности папок и подпунктов в `apps/web/content/` (например: `this-project/monorepo-docker/...`, `this-project/mobile-first-ui/...`).
- [x] **Рекурсивный сайдбар `<KnowledgeSidebar />` и `Breadcrumbs`:** сворачиваемые ветки разделов и подразделов любой глубины (состояние открытых узлов в `Zustand` + авто-раскрытие активного пути), хлебные крошки пути и обзорные SSG-страницы для каждой папки/подпункта.
- [x] **Корневой раздел `Этот проект (This Project / Workfolio)`:** выделенная ветка в Базе Знаний с вложенными подразделами `monorepo-docker` и `mobile-first-ui` на 3 языках (`en/uk/ru`).

### ✅ Этап 3 (Phase 3): Движок чтения конспектов MDX 2.0, подсветка `Shiki`, вложенное Оглавление статьи и `TL;DR`

- [x] **Полноценный парсинг и рендеринг Markdown/MDX (`mdx-content.ts` + `MdxArticleRenderer`):** поддержка инлайн-форматирования (`**bold**`, `*italic*`, `` `inline code` ``, `~~strike~~`, `[links](...)`), заголовков `h2 / h3 / h4` (с Unicode-безопасной дедупликацией `id` и якорными ссылками), GFM-таблиц с выравниванием колонок, вложенных списков, чеклистов (`- [x]`) и GitHub-стиль Callout-блоков (`> [!TIP]`, `[!NOTE]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`).
- [x] **Серверная подсветка синтаксиса (`Shiki` — `0 KB` client JS) + клиентский остров `CodeCopyButton` в 1 клик** и заголовки файлов `title="..."` у блоков кода.
- [x] **Навигатор внутри статьи (`DesktopArticleToc` / `MobileArticleToc` + блок `⚡ TL;DR`):** липкая правая колонка `On This Page` с деревом `h2 → h3 → h4` и `ScrollSpy` на десктопе (`xl+`), выпадающее оглавление на мобильных (`< xl`) и блок быстрого повторения `tldr:` в YAML-фронтматтере.
- [x] **Этап 3.5 — Рефакторинг Левого Сайдбара (`KnowledgeSidebar`) и единого Мультислаг-дерева:** аккордеон со стрелочками `▸ / ▾` по клику на всю строку раздела (свёрнуто по умолчанию, авто-раскрытие активной ветки, кнопка свернуть/развернуть все), короткие однострочные подписи `sidebarLabel` во фронтматтере и разбиение всех разделов на вложенные подпапки (`react/compiler`, `react/react-19`, `react/react-18-vs-19`, `typescript/zod-contracts`, `typescript/adr-catalog`, `nestjs-prisma/security`, `architecture-devops/offline-bundle`).

### ✅ Этап 4 (Phase 4): Глобальный поиск `Cmd+K` / `Ctrl+K`, система `#тегов` и навигация `Prev / Next`

- [x] **Command Palette (`Cmd+K` / `Ctrl+K` — `CommandPaletteModal`):** мгновенный клиентский поиск с любого экрана (плюс кнопка в `WorkfolioHeader` и `KnowledgeSidebar`) по названиям статей, путям тем/подтем, подзаголовкам `h2/h3` (с переходом к `#id` секции), `#тегам` и быстрым командам навигации с учётом RBAC (`GuestPassModal`).
- [x] **Фильтрация по `#тегам` и формату материала (`Cheat Sheet` / `Deep Dive` / `ADR` — `KnowledgeDirectoryExplorer`)** + блок перелинковки `Предыдущая / Следующая статья` и `Похожие конспекты по #тегам` (`ArticleFooterNav`).

### ✅ Этап 5 (Phase 5): Персонализация CV для Тимлида, живая доска Tech Debt / Идей и выделение AI Skill

- [x] **Персональный профиль Станислава Кричевского (`author-profile.ts`) в `Hero`, `Header`, `Experience` и `Footer`:** реальные контакты (`Telegram @Kri4evskiy`, `LinkedIn`, `GitHub`, `kri4evskiy@gmail.com`), матрица Hard Skills, все 6 реальных коммерческих мест работы (`Superscript Systems`, `Risesoft`, `Brander`, `DevsX`, `AIHelps`, `Velas Network AG`), образование и языки на `EN / UK / RU`.
- [x] **Живая интерактивная секция `Engineering Backlog, Tech Debt & Trade-offs` (`#roadmap` — `engineering-roadmap.ts` + `EngineeringRoadmapBoard`):** открытая доска идей, техдолга и осознанно отложенных решений с аргументами «За» и «Ограничения / Компромиссы» прямо на главной странице (интегрирована в `PageSectionNavigator` `05` и глобальный поиск `Cmd+K`).
- [x] **Флагманская статья в разделе `Этот проект` (`this-project/knowledge-engine/three-tier-mdx-cmdk-architecture.{en,uk,ru}.mdx`)** + выделение переиспользуемого агентского скилла `.agents/skills/mobile-first-workfolio/SKILL.md`.

### ✅ Этап 5.5 (Pre-UI v2 Hardening): Мульти-темные токены, RSC-диета, серверный AST MDX и Edge Web Crypto JWT

- [x] **Design Tokens v2 & Dual-Theme `Shiki` (`packages/ui/src/styles/globals.css`, `shiki-highlighter.ts`):** расширена семантическая матрица токенов (`--surface-subtle`, `--surface-elevated`, `--popover`, `--success`, `--warning`, `--info`, `--destructive`, `--chart-1..4`, `--code-*`), заложена поддержка палитр/тенантов `[data-palette="..."]`, устранена инверсия зависимостей в `@repo/ui/tailwind.config` (`preset`), а `Shiki v4` переведён на Dual-Theme CSS-переменные (`0 KB` client JS).
- [x] **RSC-диета и масштабирование `Cmd+K` за 100+ конспектов:** поисковый индекс вынесен из корневого `layout.tsx` в статический SSG-роут `/search-index/[locale]` (`0 KB` в начальном HTML, ленивый prefetch в `search-index-client.ts`); секции главной страницы переведены в Server Components с нарезкой только активной локали и микро-островами интерактивности.
- [x] **Серверный AST-парсер Markdown/MDX (`gray-matter` + `unified` + `remark-parse` + `remark-gfm`):** заменён построчный `RegExp`-сканер с сохранением `0 KB` клиентского JS, поддержкой вложенного кода в callout/списках, нативных изображений `![alt](url)` и пропсов кастомных MDX-виджетов.
- [x] **Крипто-проверка `HS256` JWT на Edge (`apps/web/src/proxy.ts`) и чистота ядра:** внедрена проверка `HMAC-SHA256` и `exp` через Edge Web Crypto (`crypto.subtle`), включён реальный `reactCompiler: true` в `next.config.ts`, удалён стаб `withRedact`, изолированы локальные состояния D3-графов и добавлена синхронизация `expandedKbFolders` с `sessionStorage`. Оформлена трёхъязычная статья `this-project/frontend-architecture/tokens-rsc-edge-hardening.{en,uk,ru}.mdx`.

### ⏳ Этап 6 (Next Epoch — UI v2): Визуальный редизайн в аутентичной эстетике Notion Workfolio

- [ ] **Notion Workfolio Authentic Visual Redesign (`UI v2`):** перевести визуальный язык с классических SaaS-карточек ближе к оригинальному Notion Workfolio (обложка и аватар страницы в стиле Notion, мягкая палитра «тёплой бумаги и чернил» для Light/Dark, облегчённые списки/таблицы без тяжёлых рамок, спокойная типографика) поверх уже готового архитектурного ядра Этапов 1–5.

---

## 🔧 Дополнительный технический бэклог (Infrastructure & Hardening)

### 1. Performance & Lighthouse 100/100 (`apps/web`)

- [x] **SSE Lifecycle & Back/Forward Cache (`bfcache`):** В клиентском острове `apps/web/src/components/layout/footer-sse-status.tsx` соединение `EventSource('/api/telemetry/stream')` закрывается по событию `pagehide` и переподключается на `pageshow`, обеспечивая совместимость с мобильным `bfcache`.
- [x] **Production Bundle Analysis & React Compiler:** В `apps/web/next.config.ts` подключены `@next/bundle-analyzer` (`ANALYZE=true`), `babel-plugin-react-compiler` (`reactCompiler: true`) и `optimizePackageImports`.

### 2. Security & Production Hardening (`apps/web`, `apps/api`)

- [x] **Edge Cryptographic JWT Verification (`HS256`):** В `apps/web/src/proxy.ts` реализована проверка подписи `HMAC-SHA256` и `exp` через `crypto.subtle` с авто-очисткой битых/просроченных кук.
- [ ] **Access + Refresh JWT Rotation (Backend Milestone):** Дополнить stateless Edge-верификацию парой короткоживущего `Access` (`15m`) + ротируемого `HttpOnly Refresh` (`7d`) токенов с хранением и отзывом сессий в `VisitorSession` (`PostgreSQL`).
- [ ] **HTTP Security Headers (CSP & HSTS):** Настроить строгие заголовки `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff` и `Referrer-Policy` в `apps/web/next.config.ts` (и `helmet` в `apps/api`).
- [ ] **Rate Limiting:** Подключить `@nestjs/throttler` на эндпоинт `POST /api/auth/login` в `apps/api` для защиты от брутфорса паролей (`ADMIN` / `GUEST`).

### 3. Observability & Real Cloud Integrations (`apps/web`, `apps/api`)

- [ ] **Live Sentry & PostHog SDK:** Заменить легковесные архитектурные провайдеры-обертки на полноценные продакшен-транспорты `@sentry/nextjs`, `@sentry/nestjs` и `posthog-js`, активируемые при наличии реальных ключей в `.env`.
- [ ] **Neon.tech Cloud Database Migration:** Подключить боевой `DATABASE_URL` от Neon.tech PostgreSQL, прогнать `pnpm --filter api prisma migrate deploy` и наполнить БД начальным сидом (`prisma/seed.ts`).

### 4. Testing & Quality Gates (`packages/*`, `apps/*`)

- [ ] **Unit & Integration Tests:** Настроить `Vitest` для тестирования Zod-схем (`@repo/shared-schemas`), Zustand-сторов и NestJS-сервисов.
- [ ] **E2E Playwright Suite:** Добавить сценарий проверки RBAC-флоу (открытие `GuestPassModal` -> вход по `guest`/`admin` -> чтение `.mdx` статьи -> маскирование `<Redact>`).
- [x] **GitHub Actions CI/CD:** Настроен production-grade DAG-пайплайн `.github/workflows/ci.yml` с композитным экшеном `.github/actions/setup-workspace/action.yml`: параллельные `lint` (`Biome`), `security` (`pnpm audit --prod` + `docker compose config`) и `typecheck` (с кодогенерацией `@repo/shared-schemas`, Prisma, `next typegen`) -> параллельные `build` (`Turborepo`) и `storybook` (`build-storybook` в `turbo.json`), аудит-безопасной `concurrency` на `main` и `--affected` (`fetch-depth: 0`) на PR.

### 5. Content & Workfolio Polish (`apps/web/content/*`)

- [x] **Выделенный корневой раздел `NestJS` (`apps/web/content/nestjs/*`):** добавлена отдельная корневая тема `nestjs` в `KnowledgeCategoryEnum` и трёхъязычный архитектурный разбор `nestjs/ai-mcp/nestjs-ai-and-mcp-architecture.{en,uk,ru}.mdx` с интерактивной схемой `<NestAiMcpDiagram />`.
- [ ] **Новые инженерные статьи в `.mdx`:** Расширить раздел `NestJS` и смежные темы новыми разборами (паттерны `DI & Custom Providers`, `Guards / Pipes / Interceptors`, проектирование `pnpm` + `Turborepo` пайплайнов, `NestJS Microservices` + `SSE`).
- [ ] **Интерактивный фильтр в матрице ADR:** Добавить фильтрацию по категориям (`Frontend`, `Backend`, `DevOps`, `Architecture`) и полнотекстовый поиск в `TechRadarTable`.

### 6. Backend AI & Model Context Protocol (`apps/api` — Future Backend Milestone)

- [ ] **Бесплатный Read-Only шоукейс на `@nestjs/mcp` (`$0` за токены, статус `evaluating`):** при переходе к этапу доработки бэкенда выставить в `apps/api` публичный MCP-эндпоинт (`Streamable HTTP`) с 16 ADR, таймлайном опыта из CV и краткими выжимками (`TL;DR`) статей для подключения `Cursor` / `Claude Desktop`. **Обязательные здравые ограничения перед запуском:**
  1. Строго **Read-Only** контур (никаких мутаций БД, чтения ФС или переменных окружения).
  2. Предварительно включённый **`@nestjs/throttler`** (лимит запросов по IP, например `20 req/мин`, и лимит активных сессий для защиты `512 MB` RAM бесплатного контейнера).
  3. Жёсткие верхние лимиты входных параметров в `Zod` (`limit <= 16`, `.max(60)` на поисковые строки).
  4. Строгое соблюдение политики **`<Redact />`** (не отдавать закрытые `ADMIN`-метрики в публичный MCP-ответ).
- [ ] _(Осознанно отложено / `deferred`)_ **Живой агент на `@nestjs/ai` (`AiModule` под защитой `Guest Pass`):** так как вызову нейросети на стороне сервера требуются платные токены провайдеров (`Anthropic` / `OpenAI`), сейчас он не нужен (поиск по базе мгновенно и бесплатно закрывает `Cmd+K`). Если вернёмся к этой идее позже — использовать `AiModule.forRoot` (`maxOutputTokens`, `pricing`, авто-фолбэк моделей) + `@AgentFunction` со сквозными `Zod`-схемами из `@repo/shared-schemas` строго за `@UseGuards(JwtRolesGuard)` (`HttpOnly` кука `Guest Pass`).

---

## ☁️ Архитектура бесплатного продакшен-деплоя (Free-Tier Production Deployment Strategy)

Этот раздел фиксирует утвержденную стратегию бесплатного хостинга всех компонентов монорепозитория, чтобы не возвращаться к повторному анализу ограничений платформ.

### 1. Архитектурный анализ компонентов монорепозитория

| Компонент               | Стек                      | Специфика рантайма                                                                                 | Совместимость с Vercel Hobby                                                          | Где хостить бесплатно                                                           |
| :---------------------- | :------------------------ | :------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------ |
| **`apps/web`**          | `Next.js 16 (App Router)` | SSG, SSR, RSC, Serverless Functions, Edge Proxy (`src/proxy.ts`)                                   | **100% совместимо** (нативная среда Vercel, автоматический Turborepo Remote Caching)  | **Vercel** (Hobby Plan, $0)                                                     |
| **`apps/api`**          | `NestJS 12`               | Долгоживущий Node.js демон (`long-running process`), HTTP REST, Prisma ORM, SSE (`@Sse('stream')`) | **Несовместимо** (лимит Serverless-функции 10–15 сек, разрыв долгоживущих соединений) | **Render.com** / **Koyeb** / **Fly.io** (Docker Web Service, $0)                |
| **`apps/telemetry-ms`** | `NestJS Microservice`     | **Постоянный TCP-сокет** на порту `4001` (транспорт `@nestjs/microservices`)                       | **Несовместимо** (Vercel не маршрутизирует произвольные TCP-порты)                    | Разворачивается в едином Docker Compose или как фоновый воркер рядом с API ($0) |
| **База данных**         | `PostgreSQL 16`           | Транзакционная реляционная СУБД для `Prisma ORM`                                                   | Нет встроенной СУБД на Vercel Hobby                                                   | **Neon.tech** (Serverless PostgreSQL, бесплатный tier 0.5 GB)                   |

### 2. Схема взаимодействия в продакшене

```text
[ Пользователь / Браузер ]
          │
          ├── (1) HTTP / HTML / RSC ─────────► [ Vercel: apps/web ] (Next.js 16)
          │                                         │
          │                                         │ NEXT_PUBLIC_API_URL
          │                                         ▼
          └── (2) REST / SSE / HttpOnly Cookies ──► [ Render / Koyeb: apps/api ] (NestJS 12)
                                                        │                  │
                                           TCP :4001    │                  │ DATABASE_URL
                                                        ▼                  ▼
                                              [ apps/telemetry-ms ]    [ Neon.tech ]
                                              (TCP Microservice)     (Serverless Postgres)
```

### 3. Пошаговый чеклист деплоя (Runbook)

1. **База данных (Neon.tech):**
   - Создать бесплатный проект на [neon.tech](https://neon.tech).
   - Скопировать Connection String `postgresql://...` с параметром `?sslmode=require`.
   - Выполнить миграцию из локального терминала или CI/CD (так как продакшен-контейнер `api` очищен от `devDependencies` через `pnpm prune --prod` и содержит только рантайм `@prisma/client`): `pnpm --filter @repo/api prisma:push` или `prisma migrate deploy`.

2. **Бэкенд-сервисы (`apps/api` + `apps/telemetry-ms` на Render.com или Koyeb):**
   - Использовать готовые мультистейдж докерфайлы из `docker/api.Dockerfile` и `docker/telemetry-ms.Dockerfile` (либо один общий `docker-compose.yml` на бесплатном VPS).
   - Настроить переменные окружения:
     - `DATABASE_URL`: строка подключения от Neon.tech.
     - `JWT_ACCESS_SECRET`: надежный секретный ключ.
     - `TELEMETRY_MS_HOST`: внутреннее имя хоста или `localhost`.
     - `TELEMETRY_MS_TCP_PORT`: `4001`.
     - `CORS_ORIGIN`: URL фронтенда на Vercel (`https://your-portfolio.vercel.app`).
     - `NODE_ENV`: `production`.

3. **Фронтенд (`apps/web` на Vercel):**
   - Импортировать репозиторий в Vercel.
   - Vercel через `Corepack` автоматически распознает `"packageManager": "pnpm@12.16.1"`, `turbo.json` и `allowBuilds` в `pnpm-workspace.yaml`.
   - В настройках проекта Vercel указать:
     - **Node.js Version:** `22.x` (обязательно для `pnpm 12+`).
     - **Root Directory:** `apps/web` (или корень репозитория с фильтром `@repo/web`).
     - **Build Command:** `pnpm turbo run build --filter=@repo/web...`
     - **Output Directory:** `.next`
   - Переменные окружения Vercel:
     - `NEXT_PUBLIC_API_URL`: публичный URL бэкенда (`https://your-api.onrender.com/api`).
     - `APP_ENV`: `production`.

### 4. Почему Vercel идеален для фронтенда и Turborepo

- Vercel бесплатно предоставляет **Turborepo Remote Cache**: каждый билд в Vercel использует хэши из облака, сборка повторных изменений занимает секунды.
- Бесплатный SSL, глобальный CDN (Edge Network) и поддержка Server Components (RSC) из коробки.
