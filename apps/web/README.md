# 🌐 `@repo/web` — Фронтенд-приложение (Next.js 16 + React 19 + FSD-Modular)

Публичное портфолио в редакционной эстетике **Workfolio**, интерактивное CV (`/cv`), глобальный поиск `Cmd+K` и защищённая мультиязычная **База Знаний** (`/knowledge-base`). Приложение построено на **Next.js 16 (App Router)**, **React 19 Compiler**, **Tailwind CSS v4 (CSS-first Oxide)**, **Zero-CLS `next/font`**, **FSD-Modular**, **Zero-Eval HAST MDX Engine**, **next-intl (`EN / UK / RU`)**, **TanStack Query v5 + IndexedDB** и **Zustand**.

---

## 1. Архитектура: 5-слойный стандарт `FSD-Modular`

Классический Feature-Sliced Design адаптирован под **Next.js 16 App Router**: вместо слоя `pages/` используется нативный роутер `src/app/`, а инфраструктурный конфиг заголовков безопасности вынесен за пределы `src/` (`apps/web/config/`).

Зависимости направлены строго сверху вниз (`app` ➔ `widgets` ➔ `features` ➔ `entities` ➔ `shared`) — нижний слой никогда не импортирует верхний:

```text
apps/web/
├── config/
│   └── security-headers.config.ts        # Генератор CSP, HSTS, X-Frame-Options, Permissions-Policy
├── content/                              # Colocated MDX-статьи (*.{en,uk,ru}.mdx) по категориям
├── messages/                             # Словари UI-переводов next-intl (en.json, uk.json, ru.json)
└── src/
    ├── proxy.ts                          # Next.js 16 Edge Proxy: Web Crypto JWT + next-intl роутинг
    │
    ├── app/                              # [Слой 1: Routing & Composition]
    │   ├── globals.css                   # Composition Root Tailwind v4 (@import "@repo/ui/theme.css" + @source)
    │   ├── global-error.tsx              # Глобальный Error Boundary (аварийный fallback всего <html>)
    │   ├── icon.tsx                      # Статическая фавиконка 32×32 (Obsidian Terminal Prompt >_)
    │   ├── apple-icon.tsx                # Иконка 180×180 для Apple / мобильных закладок
    │   ├── llms.txt/route.ts             # Статический SSG AI-манифест /llms.txt для LLM-поисковиков (force-static)
    │   ├── robots.ts                     # Статический SSG /robots.txt (force-static)
    │   ├── sitemap.ts                    # Статический SSG /sitemap.xml со всеми локалями и hreflang (force-static)
    │   ├── search-index/[locale]/
    │   │   └── route.ts                  # Статический SSG JSON-индекс для Cmd+K (force-static)
    │   └── [locale]/
    │       ├── layout.tsx                # Корневой layout: next/font, Zero-FOUC palette <script>, metadataBase, провайдеры
    │       ├── opengraph-image.tsx       # Статическая карточка-превью 1200×630 (Obsidian Editorial Dark, next/og)
    │       ├── page.tsx                  # Главная страница Workfolio (RSC)
    │       ├── error.tsx                 # Локализованный Error Boundary внутри LocaleRootLayout ('use client')
    │       ├── not-found.tsx             # Локализованная 404 страница внутри LocaleRootLayout (чистый RSC)
    │       ├── [...rest]/page.tsx        # Catch-all роут неизвестных путей внутри локали ➔ notFound()
    │       ├── cv/page.tsx               # Страница резюме (PDF <object> + структурированный ATS-вид)
    │       ├── system-status/page.tsx    # System Observability & API Inspector (SSG + Client Dashboard)
    │       └── knowledge-base/           # Защищённая База Знаний (layout + index + [...slug] catch-all)
    │
    ├── widgets/                          # [Слой 2: Composite UI Blocks]
    │   ├── header/                       # WorkfolioHeader, LanguageSwitcher, ThemeToggle (2D Mode × Palette)
    │   ├── footer/                       # WorkfolioFooter (кликабельный SSE LIVE бейдж ➔ /system-status)
    │   └── section-nav/                  # PageSectionNavigator (плавающий outline / мобильная pill-кнопка)
    │
    ├── features/                         # [Слой 3: User Scenarios & Interactions]
    │   ├── auth/                         # GuestPassModal + lib/auth-cross-tab-sync.ts + queries/use-visitor-profile.ts
    │   ├── search/                       # CommandPaletteModal (на базе @repo/ui Dialog) + search-index-client.ts
    │   ├── telemetry-stream/             # FooterSseStatus + use-telemetry-stream.ts + queries/use-system-observability.ts
    │   │                                 # + lib/system-status-helpers.ts + ui/{system-status-dashboard,capabilities-matrix-card,live-event-log-card,knowledge-leaderboard-card,observability-data-table}.tsx
    │   └── kb-sandboxes/ui/              # Ленивые клиентские острова (mdx-client-widgets.tsx, D3, MCP)
    │
    ├── entities/                         # [Слой 4: Business Data Representation]
    │   ├── workfolio-profile/            # author-profile.ts, cv-file.ts, workfolio-sections.tsx, CvDocumentShowcase
    │   ├── engineering-roadmap/          # engineering-roadmap.ts, EngineeringRoadmapBoard, TechRadarTable
    │   ├── knowledge-content/            # Серверный MDX/HAST-движок (mdx-fs-loader, mdx-ast-parser, shiki, sanitizer)
    │   └── knowledge-article/            # Рендеринг статей (MdxArticleRenderer, Sidebar, TOC) + queries/use-knowledge-metrics.ts
    │
    └── shared/                           # [Слой 5: Infrastructure & Common Tools]
        ├── hooks/                        # Чистые браузерные DOM/ScrollSpy-хуки (use-section-navigation.ts)
        ├── i18n/                         # app-routes.ts (APP_ROUTES, resolveHeaderRouteBadge, buildKnowledgeBasePath), routing.ts, request.ts, navigation.ts
        ├── lib/                          # api-client.ts (typed fetch + AbortSignal + Zod), edge-jwt.ts (Web Crypto HS256), seo.ts (canonical/hreflang), palette.ts (Zero-FOUC), analytics.ts
        ├── providers/                    # ThemeProvider (next-themes), QueryProvider (TanStack + IndexedDB)
        └── store/                        # useUIStore (Zustand — модалки, фильтры, папки сайдбара, palette)
```

### Почему нет плоских папок `components/`, `hooks/`, `lib/` и как разделены хуки

1. **Изоляция по доменам и направлениям зависимостей:** плоские папки `src/components/` и `src/lib/` скрывают связи между доменами и быстро превращаются в «свалку» с циклическими импортами. В `FSD-Modular` каждый модуль лежит в своём слое и публикует чёткую границу ответственности.
2. **Серверные `queries/` vs браузерные `shared/hooks/`:**
   - **Серверные хуки (`TanStack Query`)** привязаны к конкретному бизнес-домену и API-контракту, поэтому живут строго внутри доменных подпапок `queries/`: `features/auth/queries/use-visitor-profile.ts` и `entities/knowledge-article/queries/use-knowledge-metrics.ts`.
   - **Браузерные DOM-хуки** (не знающие о серверном кэше) вынесены в `shared/hooks/use-section-navigation.ts` (пассивный `requestAnimationFrame` ScrollSpy и программный `#hash`-скролл).

---

## 2. Жизненный цикл запроса и рендеринга (Request & Rendering Lifecycle)

```text
Входящий HTTP / RSC-запрос
  │
  ▼ 1. Edge Proxy (src/proxy.ts)
       Проверка маршрута /knowledge-base ➔ verifyEdgeJwtHs256() через Web Crypto API (crypto.subtle)
       Нет/невалидна cookie kb_access_token ➔ Redirect на /?unlock=knowledge-base&redirect=...
       Валидна (или публичный роут) ➔ next-intl роутинг (en без префикса, /ua, /ru)
  │
  ▼ 2. Server Components / SSG (app/[locale]/*)
       Дерево и хабы: getAllKnowledgeFrontmatters() (только gray-matter + mtimeMs-кэш, 0 парсинга тела)
       Статья: getArticleByPathSegments() ➔ Zero-Eval HAST (remark ➔ rehype) + Shiki (кэш + Promise.all)
       Локали: pickLocalized(field, locale) нарезает только активную локаль на сервере
  │
  ▼ 3. Streaming & Client Islands ('use client')
       Тяжёлые визуализации (D3.js) грузятся лениво через next/dynamic (ssr: false)
       Cmd+K индекс предзагружается по hover/focus (search-index-client.ts ➔ /search-index/[locale])
       Live SSE (use-telemetry-stream.ts) переподключается на pageshow/pagehide для сохранения bfcache
  │
  ▼ 4. Client State & Offline Cache
       Typed apiClient (shared/lib/api-client.ts) над нативным fetch + AbortSignal + Zod-валидация и API_ENDPOINTS
       3-слойные queries/*.ts (Standalone Fetcher ➔ queryOptions / infiniteQueryOptions ➔ use* Hook)
       TanStack Query v5 + IndexedDB Persister (idb-keyval, 24h TTL) кэширует ответы API (/api/auth/me, /api/capabilities, /api/knowledge/metrics*, /api/telemetry/*)
       Zustand (useUIStore) хранит только локальное UI-состояние (модалки, фильтры Tech Radar, папки сайдбара в sessionStorage)
```

---

## 3. Ключевые архитектурные решения («Почему сделано именно так»)

1. **`src/proxy.ts` + `next/root-params` вместо устаревших `middleware.ts` и `setRequestLocale()`:**
   - В Next.js 16 точка перехвата на Edge перенесена в `src/proxy.ts` (`export async function proxy(request: NextRequest)`), где объединены крипто-проверка JWT и `createMiddleware(routing)` из `next-intl`.
   - Локаль в Server Components и `src/shared/i18n/request.ts` резолвится нативно через `await rootParams.locale()` (`next/root-params`) с валидацией через `SupportedLocaleEnum`, без устаревшего костыля `setRequestLocale()`.
2. **Zero-Eval HAST MDX (`remark-directive` + `hast-util-to-jsx-runtime`) вместо `eval` / `next-mdx-remote`:**
   - Классические MDX-раннеры компилируют Markdown в JS-код и исполняют его через `new Function()` / `eval`, что ломает строгий `CSP` без `'unsafe-eval'` и утяжеляет клиентский бандл.
   - Наш конвейер в `entities/knowledge-content/lib/mdx-ast-parser.ts` строит синтаксическое дерево (`remark-parse` + `remark-gfm` + `remark-directive`), вырезает произвольный сырой HTML, переводит дерево в `HastRoot` (`remark-rehype`) и рендерит React-элементы прямо на сервере через `toJsxRuntime` (`hast-util-to-jsx-runtime`).
   - Интерактивные виджеты подключаются декларативно через `<Widget />` или директивы `::sandbox{name="..."}` / `:::sandbox{name="..."}` и маппятся через типизированный реестр `MDX_WIDGET_REGISTRY` в `features/kb-sandboxes/ui/mdx-client-widgets.tsx`.
   - Для скорости в `next dev` и при `next build` дерево сайдбара использует `getAllKnowledgeFrontmatters()` без парсинга тела статей, а `getArticleByPathSegments()` парсит HAST только для одной запрошенной статьи с проверкой `fs.statSync().mtimeMs`.
3. **Жёсткое разделение серверного стейта (`TanStack Query`) и клиентского UI-стейта (`Zustand`):**
   - Серверные сущности (`/api/auth/me`, `/api/knowledge/metrics`) никогда не дублируются в `Zustand`. Ими управляет `TanStack Query v5` с персистенцией в `IndexedDB` (`src/shared/providers/query-provider.tsx`, `gcTime` и `maxAge` — 24 часа, `staleTime` — 5 минут) и оптимистичными обновлениями (`onMutate` / `onError` в `useIncrementHelpfulMutation`).
   - `useUIStore` (`Zustand`) отвечает исключительно за синхронное UI-состояние: открытие `GuestPassModal` / `CommandPaletteModal`, фильтр `TechRadarTable`, инспектор ADR и раскрытые ветки `KnowledgeSidebar` (с SSR-безопасной гидратацией из `sessionStorage`).
4. **Интеграция с монорепозиторием (`@repo/shared-schemas`, `@repo/ui`, `apps/api`):**
   - `@repo/shared-schemas` (`Zod v4`) — единый источник контрактов: `GuestPassFormSchema` (валидация формы `React Hook Form` на клиенте и `ZodValidationPipe` на бэкенде), `SessionProfileSchema`, `ArticleMetaSchema`, `TelemetryEventSchema`, `KnowledgeCategoryEnum` и константы `KB_ACCESS_COOKIE_NAME`.
   - `@repo/ui` — дизайн-система на **Tailwind CSS v4** + **Radix UI** со 100% покрытием всех компонентов в Storybook 10.
   - Связь с `apps/api` идёт через same-origin `/api/*` rewrites в `next.config.ts` (`API_INTERNAL_URL`), что позволяет бесшовно передавать `HttpOnly` cookie `kb_access_token` и держать `EventSource` на `/api/telemetry/stream`.
5. **CSS-first Tailwind CSS v4, 2D Appearance (`Mode × Palette`), Zero-CLS шрифты и осознанные Modern Web trade-offs:**
   - **Composition Root + инверсия зависимостей:** `apps/web/src/app/globals.css` запускает движок `@tailwindcss/postcss`, импортирует чистый контракт дизайн-системы `@repo/ui/theme.css` (`@theme inline`, `@custom-variant dark`) и объявляет границы сканирования `@source` для `src/`, `content/` и `packages/ui/src`.
   - **Cascade Layers & Baseline UX:** в `@layer base` включены `scrollbar-gutter: stable`, `scrollbar-width: thin`, `scroll-padding-top`, `text-wrap: balance` (заголовки) и `text-wrap: pretty` (абзацы); `.shiki`, `@starting-style` анимации входа `Dialog` и синхронизированные с Radix Popper `@keyframes` входа/выхода для `Popover` и `Tooltip` изолированы в `@layer components`; `@media (prefers-reduced-motion: reduce)` вынесено вне `@layer`, чтобы перекрывать утилиты без `!important`.
   - **2D Appearance и Zero-CLS шрифты:** `ThemeToggle` объединяет тему (`Light / Dark / System`) и семантическую палитру (`Warm Paper / Graphite / Sepia`) с синхронным Zero-FOUC `<script>` в `<head>` (`PALETTE_INIT_SCRIPT`); `Inter` и `JetBrains Mono` (`latin + cyrillic`) встраиваются на этапе сборки через `next/font/google`.
   - **Точечные `@container` queries и компромиссы:** `Card` и `ArticleImageGrid` адаптируются от ширины собственного контейнера (`@xs`, `@sm`, `@md`); для модальных окон и `CommandPaletteModal` осознанно оставлен `Radix UI Dialog` (фокус-трап и scroll-lock) с CSS `@starting-style` вместо нативного `<dialog>`, а `CSS Anchor Positioning` и `light-dark()` отложены до полного соответствия нашему `browserslist` (`Chrome >= 111`, `Edge >= 111`, `Firefox >= 128`, `Safari >= 16.4`).

---

## 4. Безопасность фронтенда

1. **Строгий `Content-Security-Policy` и HTTP-заголовки (`config/security-headers.config.ts`):**
   - В `production` из `script-src` полностью исключён `'unsafe-eval'`, а из `connect-src` убраны локальные порты (`:4000`, `:4001`, `localhost`).
   - Включены `Strict-Transport-Security` (2 года, `preload`), `Cross-Origin-Opener-Policy: same-origin`, `X-Content-Type-Options: nosniff`, `Permissions-Policy` и `poweredByHeader: false`.
   - **Clickjacking + SPA-безопасный `/cv` PDF:** все страницы сайта отдаются с `frame-ancestors 'none'` и `X-Frame-Options: DENY`. Документные заголовки содержат `object-src 'self'` и `frame-src 'self'`, чтобы клиентские SPA-переходы `<Link href="/cv">` не блокировали встроенный `<object type="application/pdf">`, а `frame-ancestors 'self'` / `X-Frame-Options: SAMEORIGIN` разрешены **исключительно** для статических PDF-ассетов `/cv/:path+`.
2. **Edge Web Crypto JWT-верификация (`src/proxy.ts` + `src/shared/lib/edge-jwt.ts`):**
   - Токен `kb_access_token` хранится только в `HttpOnly, SameSite=Lax` (`Secure` в prod) cookie — он физически недоступен из `document.cookie` или `LocalStorage`.
   - На Edge перед рендерингом `/knowledge-base` проверяется `alg === 'HS256'`, `exp` и криптографическая подпись через нативный `crypto.subtle.verify` с кэшированием `CryptoKey` (`0 KB` внешних JWT-библиотек).
3. **RBAC UI, Open Redirect и санитизация контента:**
   - Доступ к Базе Знаний и закрытым кейсам контролируется на уровне UI (`WorkfolioHeader`, `CaseStudyReadButton` с открытием `GuestPassModal` в 1 клик) и на уровне Edge (`src/proxy.ts`) + API (`JwtRolesGuard`), а публичный SSE-стрим и фронтенд не экспонируют чувствительные поля и админские секреты.
   - `GuestPassModal` нормализует `?redirect=` через `normalizeKbRedirectPath` (разрешены только внутренние пути `/knowledge-base*`).
   - `link-sanitizer.ts` (`classifySafeMarkdownLink`, `isSafeMarkdownImageSrc`) блокирует `javascript:`, `data:` и protocol-relative `//` ссылки в Markdown.

---

## 5. Структура роутов и команды разработки

### Основные маршруты (`apps/web/src/app`)

| Маршрут                              | Тип рендеринга                | Назначение                                                                              |
| :----------------------------------- | :---------------------------- | :-------------------------------------------------------------------------------------- |
| `/[locale]` (`/`, `/ua`, `/ru`)      | `SSG`                         | Главная страница Workfolio CV: Hero, Case Studies, Experience, Tech Radar, Roadmap      |
| `/[locale]/cv`                       | `SSG`                         | Страница резюме: встроенный просмотр `public/cv/*.pdf` и структурированный ATS-режим    |
| `/[locale]/system-status`            | `SSG` + Client Inspector      | Инспектор API: матрица `/api/capabilities`, Cursor-лог событий (`SSE`) и Offset-рейтинг |
| `/[locale]/knowledge-base`           | `SSG` + Edge JWT              | Обзорный каталог Базы Знаний с фильтром по категориям, форматам и `#тегам`              |
| `/[locale]/knowledge-base/[...slug]` | `SSG` + Edge JWT              | Универсальный catch-all роут: хабы тем, вкладки подтем и статьи с `TOC` и метриками     |
| `/[locale]/[...rest]`                | `RSC` (`notFound()`)          | Перехват неизвестных URL внутри локали с рендером `[locale]/not-found.tsx` в layout     |
| `/robots.txt` и `/sitemap.xml`       | Static Route (`force-static`) | SSG-правила индексации и мультиязычная карта сайта с матрицей `hreflang` (`en/uk/ru`)   |
| `/llms.txt`                          | Static Route (`force-static`) | Машиночитаемый Markdown-паспорт портфолио, 16 ADR и каталога статей для AI-агентов      |
| `/search-index/[locale]`             | Static Route (`force-static`) | Предсобранный JSON-индекс для мгновенного поиска `Cmd+K`                                |

### Команды разработки

```bash
# Запуск dev-сервера Next.js на порту 3000 (из корня монорепозитория)
pnpm --filter @repo/web dev

# Проверка типов TypeScript и линтер/форматтер Biome
pnpm --filter @repo/web typecheck
pnpm --filter @repo/web lint

# Форматирование всего монорепозитория через Biome
pnpm biome check --write .

# Production-сборка (включая SSG-генерацию всех страниц и /search-index/*)
pnpm --filter @repo/web build

# Анализ клиентского бандла (@next/bundle-analyzer)
ANALYZE=true pnpm --filter @repo/web build
```
