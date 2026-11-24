# 📐 Архитектура файловой структуры: FSD-Modular (`apps/web`, Next.js 16)

Этот документ описывает стандарт организации файлов и папок во фронтенд-приложении `apps/web` и адаптацию принципов **Feature-Sliced Design (FSD)** под Next.js App Router.
_(Архитектура бэкенда `apps/api` описана отдельно в `.agents/backend/architecture-enterprise-modular.md`.)_

---

## 1. Проблема классического FSD в Next.js 16 App Router

Классический **Feature-Sliced Design (FSD)** разрабатывался под SPA (Single Page Applications) с делением на слои:
`app` ➔ `pages` ➔ `widgets` ➔ `features` ➔ `entities` ➔ `shared`.

### Почему классический FSD конфликтует с Next.js App Router:

1. **Папка `app/` в Next.js — это не просто инициализация, а сам роутер:**
   В Next.js `app/[locale]/...` управляет маршрутизацией, вложенными layouts, генерацией статических параметров (`generateStaticParams`), метаданными (`generateMetadata`) и Server Components.
2. **Слой `pages/` в FSD дублирует App Router:**
   Если создать папку `pages/` рядом с `app/`, возникает коллизия концепций.
3. **React Server Components (RSC) и Colocation:**
   В Next.js 16 выгодно держать серверный data fetching и тонкие контроллеры страниц максимально близко к роуту, делегируя рендеринг в изолированные сущности и виджеты.

---

## 2. Стандарт FSD-Modular для `apps/web` (Next.js 16 + React 19)

Мы берем лучшие принципы FSD (направленный поток зависимостей сверху вниз, изоляция фичей, запрет циклических импортов) и гармонично соединяем их с рекомендациями **Vercel Engineering**:

```text
apps/web/
├── vitest.config.ts            # Конфигурация Vitest + @vitejs/plugin-react + jsdom + tsconfig paths
├── vitest.setup.ts             # @testing-library/jest-dom + автоматический afterEach(cleanup)
├── playwright.config.ts        # Playwright E2E + multi-service WebServer (IPv4-first NODE_OPTIONS)
├── e2e/                        # E2E-тесты по паттерну POM (Page Object Model) + test.step
│   ├── fixtures/app.fixture.ts # Типизированные фикстуры страниц (guestPassPage, systemStatusPage)
│   ├── pages/                  # Page Objects (guest-pass.page.ts, system-status.page.ts)
│   └── specs/                  # Спеки сценариев (rbac-and-observability.spec.ts)
│
└── src/
    │
    ├── app/                    # [Слой 1: Routing & Composition]
    │                           # ТОЛЬКО тонкие Server Components: layout, page, route
    ├── globals.css
    ├── global-error.tsx
    ├── icon.tsx                # Фавиконка 32×32 (Obsidian Terminal Prompt >_)
    ├── apple-icon.tsx          # Иконка 180×180 для Apple / мобильных закладок
    ├── llms.txt/route.ts       # Статический SSG /llms.txt для AI-поисковиков (force-static)
    ├── robots.ts               # Статический SSG /robots.txt (force-static)
    ├── sitemap.ts              # Статический SSG /sitemap.xml с матрицей hreflang (force-static)
    ├── [locale]/
    │   ├── layout.tsx          # Провайдеры (нарезанный NextIntlClientProvider), Header, Footer, lazy Modals, metadataBase
    │   ├── opengraph-image.tsx # Локализованная OpenGraph карточка 1200×630 (Obsidian Editorial Dark + Inter TTF)
    │   ├── page.tsx            # Главная: сборка Hero, Experience, Roadmap (+ scoped NextIntlClientProvider)
    │   ├── error.tsx           # Локализованный Error Boundary внутри LocaleRootLayout
    │   ├── not-found.tsx       # Локализованный 404 RSC внутри LocaleRootLayout
    │   ├── [...rest]/page.tsx  # Catch-all неизвестных маршрутов ➔ notFound()
    │   ├── cv/page.tsx         # Страница резюме (Server Island CvDocumentShowcase + CvViewTabs)
    │   ├── system-status/      # System Observability & Live API Inspector (page.tsx + loading.tsx)
    │   └── knowledge-base/     # Роуты базы знаний (layout + page + loading.tsx + [...slug] с dynamicParams=false)
    └── search-index/[locale]/  # API route статического индекса
    │
    ├── widgets/                # [Слой 2: Composite UI Blocks]
    │   │                       # Крупные композиционные блоки, собирающие несколько сущностей
    │   ├── header/             # WorkfolioHeader, LanguageSwitcher, ThemeToggle
    │   ├── footer/             # WorkfolioFooter (кликабельный FooterSseStatus ➔ /system-status)
    │   └── section-nav/        # PageSectionNavigator
    │
    ├── features/               # [Слой 3: User Scenarios & Interactions]
    │   │                       # Интерактивные фичи с действиями пользователя
    │   ├── auth/               # GuestPassModalLoader (next/dynamic) + GuestPassModal + AuthCrossTabSyncBridge + lib/auth-cross-tab-sync.ts + queries/use-visitor-profile
    │   ├── search/             # CommandPaletteLoader (Cmd+K, next/dynamic) + CommandPaletteModal, search-index-client.ts (Zod)
    │   ├── telemetry-stream/   # FooterSseStatus, useTelemetryStream (ref-counted singleton SSE),
    │   │                       # queries/use-system-observability, lib/system-status-helpers,
    │   │                       # ui/{system-status-dashboard,capabilities-matrix-card,live-event-log-card,knowledge-leaderboard-card},
    │   │                       # ui/table/{observability-data-table,knowledge-leaderboard-columns,live-event-log-columns}
    │   │                       # + __tests__/knowledge-leaderboard-card.integration.test.tsx (RTL + MSW v3)
    │   └── kb-sandboxes/       # Интерактивные песочницы в статьях (next/dynamic, точечный D3, MCP)
    │
    ├── entities/               # [Слой 4: Business Data Representation]
    │   │                       # Отображение данных предметной области (без глобальных сайд-эффектов)
    │   ├── knowledge-article/  # HAST RSC-рендер (mdx-article-renderer, code-block, callout-config, knowledge-skeletons),
    │   │                       # ArticleToc (IntersectionObserver), MetricsBar, DirectoryExplorer, KnowledgeSidebar,
    │   │                       # queries/use-knowledge-metrics (metrics, paginated metrics, mutations)
    │   ├── knowledge-content/  # mdx-fs-loader (primitive React.cache), mdx-ast-parser (remark/rehype HAST), mdx-search-index,
    │   │                       # link-sanitizer, shiki-highlighter (FIFO), mdx-types
    │   ├── workfolio-profile/  # author-profile.ts, cv-file.ts (React.cache), CvDocumentShowcase (RSC) + CvViewTabs (Client Island)
    │   └── engineering-roadmap/# engineering-roadmap.ts, EngineeringRoadmapBoard, TechRadarTable + table/{tech-radar-data-table,tech-radar-columns}
    │
    └── shared/                 # [Слой 5: Infrastructure & Common Tools]
        │                       # Фундамент, не знающий о специфике бизнес-фичей
        ├── config/             # env.ts (Zod env validation + fail-closed Edge JWT secret resolver)
        ├── hooks/              # Браузерные DOM/ScrollSpy UI-хуки на IntersectionObserver (use-section-navigation.ts)
        ├── i18n/               # app-routes.ts (Hybrid KB policy + __tests__/app-routes.test.ts), pick-messages.ts, navigation.ts, routing.ts, request.ts
        ├── lib/                # api-client.ts (+ __tests__/api-client.test.ts), edge-jwt.ts (+ __tests__/edge-jwt.test.ts), seo.ts, analytics.ts, palette.ts
        ├── providers/          # ThemeProvider, QueryProvider (IDB allowlist + __tests__/query-provider.test.tsx)
        ├── store/              # Zustand (use-ui-store: actions + атомарные use* хуки + uiStore + __tests__/use-ui-store.test.ts)
        └── ui/                 # brand-icons.tsx (локальные SVG GithubIcon / LinkedinIcon для lucide-react v1)
```

### Золотое правило зависимостей FSD-Modular:

`app` ➔ `widgets` ➔ `features` ➔ `entities` ➔ `shared`.

- Модуль нижнего слоя **никогда не может импортировать** модуль верхнего слоя.
- `entities` не знают о `features` (например, компонент статьи не знает о модалке гостевого пропуска).
- `features` могут использовать `entities` (модалка авторизации знает о профиле посетителя).

---

## 3. Внутренняя анатомия слайса (`features/<slice>/`, `entities/<slice>/`) и Чеклист

Чтобы файлы внутри слайса не превращались в монолиты со смешанной ответственностью, соблюдай разделение по подпапкам:

- **`ui/`** — React-компоненты отображения (Server или Client Components).
- **`queries/`** — **ИСКЛЮЧИТЕЛЬНО** серверные хуки `TanStack Query` (`useQuery`, `useMutation`, `useInfiniteQuery`) и функции `fetch`. **ЗАПРЕЩЕНО** размещать внутри `queries/*` низкоуровневую работу с `BroadcastChannel`, `localStorage`, `sessionStorage` или сложные алгоритмы трансформации — выноси их в `lib/`.
- **`lib/`** — чистые доменные хелперы, парсеры, валидаторы и кросс-вкладочные синхронизаторы (например, `features/auth/lib/auth-cross-tab-sync.ts`, `entities/knowledge-content/lib/*`).
- **`shared/hooks/`** — чистые браузерные DOM / UI хуки (`ScrollSpy`, `ResizeObserver`), не привязанные к серверному API.

### Чеклист при добавлении новых модулей (`apps/web/src`):

1. Размещай новый модуль строго в его слое (`widgets/`, `features/`, `entities/`, `shared/`) и соответствующей подпапке (`ui/`, `queries/`, `lib/`).
2. Если добавляешь File-Based Metadata роут в `src/app/` без расширения файла в URL (`icon.tsx`, `apple-icon.tsx`, `opengraph-image.tsx`, `manifest.ts`), **обязательно** проверь `matcher` в `apps/web/src/proxy.ts`, чтобы `next-intl` не перехватывал его как локаль.
3. **Синхронизация дерева:** обнови ASCII-дерево в этом файле и в `apps/web/README.md`.
4. **Верификация:** прогоняй `pnpm biome check --write .`, `pnpm turbo typecheck`, `pnpm --filter @repo/web test`, `pnpm turbo build` и `pnpm --filter @repo/web test:e2e` (стандарты тестов описаны в `.agents/testing/testing-strategy.md`).
