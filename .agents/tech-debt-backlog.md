# 🛠️ Tech Debt & Post-MVP Backlog

## 📌 Текущая база (Production Baseline)

Архитектурное ядро находится в продакшен-состоянии (`v0.9.0`; подробности и 16 ADR лежат в `.agents/frontend/*`, `.agents/backend/*`, `.agents/architecture/*` и статьях базы знаний):

- **Monorepo & DX:** `pnpm 12.21.0` + `Turborepo` + `TypeScript 7.0.2` (native Go compiler) + `Biome 2.6.4` + `Lefthook` · `@repo/shared-schemas` (`Zod v4`: `SystemCapabilitiesSchema`, `API_ENDPOINTS` + `resolveEndpoint`, `LOCALE_METADATA`, Offset/Cursor контракты) + `@repo/ui` (`Tailwind CSS v4.3.5` + `Storybook 10` (100% coverage, 11/11 компонентов)) · 3-уровневое QA (`Vitest` 15 файлов / 56 тестов + `V8 coverage` + `Vitest UI :5124`, `Supertest` HTTP E2E, `Playwright` POM + `test.step`, `INITIAL_ARTICLE_SEEDS` из 10 слагов) · Multi-stage `Docker` + 7-джобный `GitHub Actions CI/CD`.
- **Frontend (`apps/web`):** `Next.js 16.4.6` (`React 19 Compiler`) · архитектура `FSD-Modular` (`app` ➔ `widgets` ➔ `features` ➔ `entities` ➔ `shared`, централизованный реестр маршрутов `APP_ROUTES`) · `next-intl` (`EN/UK/RU` SSG) · `/[locale]/system-status` (`System Observability & Live API Inspector`: матрица `Capability Gated`, Cursor-лог событий с `SSE` и Offset-рейтинг на `TanStack Table`) · кликабельный `SSE LIVE` в футере · `robots.ts` + мультиязычный `sitemap.ts` + `/llms.txt` + `JSON-LD` (`ProfilePage`, `Person`, `TechArticle`) + `icon.tsx` / `apple-icon.tsx` / `opengraph-image.tsx` + локализованные `[locale]/not-found.tsx` и `[locale]/error.tsx` (с prod-only `captureClientException`) · 2D Appearance + cross-tab auth sync (`BroadcastChannel`) · `Zero-Eval HAST MDX Engine` (`mtimeMs` кэш + `Dual-Theme Shiki`) · `Cmd+K` SSG-индекс · `TanStack Query v5` (`IndexedDB` + 3-слойные `queryOptions` + `QueryCache.onError` `AbortError`-shield + `Axios` `apiClient` с `allowAbsoluteUrls: false`, `16s` таймаутом и `X-Request-Id`) · `D3.js` острова · `Edge Web Crypto JWT` + строгий `CSP`.
- **Backend (`apps/api` & `apps/telemetry-ms`):** `NestJS 12 ESM` (`common`/`config`/`migrations`/`modules`, Zod env validation & timing-safe auth, `enableShutdownHooks()` + `takeUntil(shutdown$)`, `X-Request-Id` Correlation ID, `TimeoutInterceptor` 15s, `WORKFOLIO_DEMO_MODE` vs `docker-compose.prod.yml`) + `Prisma 7` (`7.10.1`, Rust-free Wasm + `@prisma/adapter-pg` + In-Memory fallback + `prisma:seed`) + `GET /api/capabilities` (типизированные runtime-флаги), публичный Read-Only `GET /api/knowledge/metrics/paginated` (с `category`/`sortBy`), `GET /api/telemetry/events` (Cursor + `eventType`) + `HttpOnly JWT` + `Helmet` + `@nestjs/throttler` + TCP-микросервис телеметрии (`:4001`) с `SSE`.

---

## 🔥 Приоритетная очередь разработки (Next Up)

> **Политика ролей (`RoleEnum`):** в системе строго 3 роли доступа — `GUEST` (без куки), `USER` (прошёл auth) и `ADMIN` (владелец портфолио). `VisitorRoleTypeEnum` (`TEAM_LEAD`, `RECRUITER`, `DEVELOPER`, `FOUNDER`, `OTHER`) используется исключительно как бейдж профиля визитора, не как уровень прав. Для `ADMIN` закладывается явная заготовка (`@Roles('ADMIN')`) под будущие закрытые операции.
> **Политика Free-Tier:** все лимиты (rate limiting, SSE, in-memory fallback, пагинация, TTL) проектируются жёстко, чтобы исключить исчерпание бесплатных квот Vercel Hobby / Render / Koyeb / Neon.tech / Upstash.

---

### Приоритет №0 (ОБЯЗАТЕЛЬНО ДО Redis и Деплоя): Security, Stability, CWV & SEO Gate

> Выполняется в **3 изолированных сессиях** (каждая заканчивается зелёными `pnpm lint`, `pnpm typecheck`, `pnpm test` и отдельным коммитом), чтобы не смешивать контекст и гарантировать чистую базу перед первым деплоем и внедрением Redis.

#### Сессия 1 — Backend Security, Stability & Free-Tier Hardening _(Recommended Effort: **High** — ✅ Завершена)_

_Область:_ `packages/shared-schemas/**`, `apps/api/**`, `apps/telemetry-ms/**`, `docker-compose*.yml`.

- [x] **Unbounded Memory & DB Bloat (`apps/api/src/prisma/prisma.service.ts`, `apps/api/src/modules/knowledge/*`):**
  - Ввести лимиты `MAX_MEMORY_SESSIONS = 200` и `MAX_MEMORY_METRICS = 200` + очистку просроченных сессий в in-memory fallback.
  - Валидировать `:slug` на `POST /api/knowledge/:slug/view` и `/:slug/helpful` по allowlist реальных слагов статей (`404 NotFoundException` для неизвестных слагов) + дедупликация `helpful` по `(sessionId, slug)` против накрутки и засорения `ArticleMetrics`.
- [x] **Uncaught Async RxJS Error & Counter Cap (`apps/api/src/modules/telemetry/telemetry.service.ts`):**
  - Заменить синхронный `try/catch` вокруг `this.telemetryClient.emit('telemetry.event', rawEvent)` на `.pipe(takeUntil(this.shutdown$)).subscribe({ error: ... })`, чтобы падение `telemetry-ms` не роняло процесс асинхронной ошибкой RxJS.
  - Заменить `totalEventsProcessed: this.recentEvents.length` (упирается в потолок `25`) на монотонный счётчик.
- [x] **SSE DoS & Free-Tier Protection (`apps/api/src/modules/telemetry/telemetry.controller.ts`, `telemetry.service.ts`):**
  - Убрать `@SkipThrottle()` с `GET /api/telemetry/stream`; поставить connect-limit **`5 req / min` на IP**.
  - Ввести лимиты одновременных SSE-стримов: **макс. `2` на IP**, **макс. `50` глобально**, плюс **max stream TTL = `15 минут`** с `finalize()` очисткой счётчиков и `429`/`503` при превышении.
- [x] **Configurable `TRUST_PROXY_HOPS` (`apps/api/src/config/app.config.ts`, `apps/api/src/main.ts`):**
  - Вынести `TRUST_PROXY_HOPS` в Zod `AppEnvSchema` (`z.coerce.number().int().min(0).max(5).default(1)`) вместо хардкода `app.set('trust proxy', 1)`.
- [x] **CSRF & Helmet Hardening (`apps/api/src/main.ts`):**
  - Удалить `app.useBodyParser('urlencoded', ...)` (API принимает только JSON — закрывает Login/Logout CSRF через HTML-формы).
  - Добавить `CsrfOriginMiddleware` для всех `POST`/`PUT`/`PATCH`/`DELETE`: проверка `Sec-Fetch-Site === 'same-origin'` либо совпадение `Origin` с `appConfig.allowedOrigins` + обязательный `Content-Type: application/json` для мутаций с телом.
  - Включить `contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } }` на JSON API в Helmet; снизить глобальный `@Throttle` до **`60 req / min`**.
- [x] **JWT Hardening, `1d` TTL, Admin Passcode & Admin Stub (`apps/api/src/modules/auth/*`, `app.config.ts`):**
  - Сократить срок жизни токена с `7d` до **`1d`** (`KB_COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 24`).
  - Закрепить `signOptions: { algorithm: 'HS256', expiresIn: '1d' }` и `verifyOptions: { algorithms: ['HS256'] }` + валидировать расшифрованный JWT payload через Zod-схему.
  - Объединить rate-limit бакет для `/api/auth/guest-pass` и `/api/auth/login` (`5 req / min` суммарно).
  - При передаче непустого неверного `adminPasscode` возвращать **`403 Forbidden`** + структурированный аудит-лог `ADMIN_ESCALATION_FAILED` (без тихого даунгрейда в `USER`).
  - В `app.config.ts` требовать `ADMIN_SECRET_PASSCODE.length >= 16` в `production` (вне demo mode).
  - Добавить заготовку `@Roles('ADMIN')` эндпоинта (например, `GET /api/telemetry/admin-diagnostics` или `POST /api/telemetry/cache-reset`) для будущего расширения прав `ADMIN`.
- [x] **UUID Deduplication Fix (`apps/api/src/prisma/prisma.service.ts`):**
  - Передавать `id: rawEvent.id` в `prisma.systemEventLog.create({ data: { id, eventType, payload } })`, чтобы живые SSE-события и записи БД на `/system-status` не дублировались.
- [x] **Microservice, RBAC, Validation & Error Filter Hygiene:**
  - В `apps/telemetry-ms/src/main.ts` сменить дефолт `TELEMETRY_MS_HOST` с `'0.0.0.0'` на `'127.0.0.1'` (Docker Compose явно задаёт `0.0.0.0` внутри приватной сети), добавить Zod-валидацию `TELEMETRY_MS_PORT` и `.catch()` в `bootstrap()` (и в `apps/api/src/main.ts`).
  - Согласовать RBAC между `GET /api/knowledge/metrics` и `GET /api/knowledge/metrics/paginated` (оба либо `@Public()` как публичная статистика лидерборда, либо оба защищены).
  - В `packages/shared-schemas/src/pagination.schema.ts` ограничить `offset` сверху (`.max(500)`).
  - В `apps/api/src/common/filters/sentry-exception.filter.ts` добавить `if (response.headersSent) return` **с подробным комментарием** (защита от `ERR_HTTP_HEADERS_SENT` при обрыве SSE/стриминга), санитизировать `\r\n`/ANSI в `req.originalUrl` и `enriched.message` в логах (защита от log forging), и не раскрывать `requiredRoles` в production 403-ответах.
  - Убрать raw `as` касты в `prisma.service.ts` (через Zod `safeParse`) и в `jwt-roles.guard.ts` (через Express `declare module` augmentation).
- [x] **Docker Hardening & Zero-Friction Team Lead Demo (`docker-compose.yml`, `docker-compose.prod.yml`):**
  - В локальном `docker-compose.yml`: добавить `WORKFOLIO_DEMO_MODE: ${WORKFOLIO_DEMO_MODE:-true}` в сервис `web` (чтобы `docker compose up --build` работал у тимлида без ручной настройки `.env`), привязать `web` к `127.0.0.1:${WEB_HOST_PORT:-3000}:3000`, сделать хост-порты БД и API параметризуемыми на loopback (`127.0.0.1:${POSTGRES_HOST_PORT:-5432}:5432`, `127.0.0.1:${API_HOST_PORT:-4000}:4000`) против локальных коллизий портов.
  - В `docker-compose.prod.yml`: добавить `security_opt: ["no-new-privileges:true"]`, `cap_drop: ["ALL"]`, `read_only: true` + `tmpfs: [/tmp]`, `pids_limit`, а также `healthcheck` для `web` (`:3000`) и `telemetry-ms`.

#### Сессия 2 — Frontend Security, Auth Modal UX, Cache/SSE/Race Fixes & SEO _(Recommended Effort: **High** — ✅ Завершена)_

_Область:_ `apps/web/config/security-headers.config.ts`, `apps/web/src/{proxy.ts,shared/*,features/auth/*,features/search/*,features/telemetry-stream/*,entities/knowledge-article/queries/*,app/{sitemap.ts,robots.ts,llms.txt}}`.

- [x] **Frontend Zod Env Validation & Fail-Closed Edge JWT (`apps/web/src/shared/config/env.ts`, `edge-jwt.ts`, `proxy.ts`):**
  - Создать Zod-валидатор серверных и клиентских env-переменных фронтенда (`JWT_SECRET`, `WORKFOLIO_DEMO_MODE`, `API_INTERNAL_URL` со стриппингом trailing `/`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_POSTHOG_HOST`).
  - Сделать `verifyEdgeJwtHs256()` **строго fail-closed** при `NODE_ENV === 'production' && WORKFOLIO_DEMO_MODE !== 'true'` (отклонять пустой, `< 32` символов или `DEFAULT_DEV_JWT_SECRET`); добавить проверку claims `sub`, `role` (`'USER' | 'ADMIN'`), `nbf`; сбрасывать `cachedHmacKeyPromise` в `.catch()`.
  - В `proxy.ts` сузить исключение `.*\\..*` до явного списка расширений статики (`\\.(?:ico|png|jpg|jpeg|svg|webp|pdf|css|js|woff2|txt|xml|json)$`), чтобы будущие слаги с точкой (например, `next.js-16`) не обходили Edge Auth.
- [x] **IndexedDB Persister Dehydration Allowlist (`apps/web/src/shared/providers/query-provider.tsx`):**
  - Передать `dehydrateOptions: { shouldDehydrateQuery }` со строгим allowlist (`['knowledge']` и `status === 'success'`), чтобы `['auth', 'me']`, `['system', 'capabilities']` и `['telemetry', ...]` **никогда** не сохранялись в IndexedDB. `CACHE_BUSTER` оставить `'v1'` (локальный IDB на `localhost:3000` очищается вручную в DevTools).
- [x] **Гибридная модель доступа Базы Знаний и чистый SEO (`proxy.ts`, `sitemap.ts`, `robots.ts`, `llms.txt/route.ts`):**
  - **Публично и индексируется:** `/`, `/cv`, `/system-status`, каталог `/knowledge-base` и **весь раздел `/knowledge-base/this-project/**`** (открыто для тимлидов, рекрутеров и Google без 307-редиректов).
  - **Под Edge Web Crypto JWT Auth (`USER` / `ADMIN`):** все остальные конспекты `/knowledge-base/**` (кроме `this-project/**` и корня `/knowledge-base`) и статьи с `visibility: 'private'`.
  - Исключить закрытые разделы из `sitemap.ts` и прямых ссылок `llms.txt`, добавить их в `disallow` в `robots.ts` ➔ **0 ошибок `307 Redirect` в Google Search Console**.
- [x] **Auth Modal UX & Race Condition Hardening (`guest-pass-modal.tsx`, `use-ui-store.ts`, `command-palette-modal.tsx`, `search-index-client.ts`):**
  - Обновить `GuestPassModal`: рендерить подсказку `workfolio-admin-2026` **только** когда `capabilities.mode === 'demo'`; обернуть `mutateAsync` в `try/catch` + `inFlightRef` guard; повесить **`disabled` + спиннер** на все кнопки отправки и пресеты во время мутации; очищать `?unlock` в URL (`router.replace`) и `pendingRedirectPath: null` при закрытии; визуально довести модалку до уровня продакшен-портфолио.
  - В `CommandPaletteModal`: хранить `{ locale, payload }` (убрать stale-locale flash при переключении языка) и валидировать ответ `/search-index/[locale]` через Zod-схему (убрать `as Partial<KnowledgeSearchPayload>`).
- [x] **Single Shared SSE Manager & `BroadcastChannel` Deduplication (`use-telemetry-stream.ts`, `use-visitor-profile.ts`, `auth-cross-tab-sync-bridge.tsx`):**
  - Вынести `EventSource` в единый ref-counted менеджер (подписка через `useSyncExternalStore`) с обработкой `EventSource.CLOSED` + exponential backoff (1 стрим на всю вкладку даже на `/system-status`, с поясняющими комментариями в коде о Free-Tier и лимитах HTTP/1.1).
  - Перенести `subscribeAuthSessionChange` один раз в `AuthCrossTabSyncBridge` (внутри `QueryProvider` в root layout, строго по FSD) с `senderId` вкладки (устраняет 8× шторм рефетчей в той же вкладке).
  - В `fetchVisitorProfile()` возвращать `FALLBACK_GUEST_PROFILE` только на явный `401`/`403` (не кэшировать 5xx/сетевой сбой как `GUEST` на 10 мин); в `useLogoutMutation` добавить `invalidateQueries({ queryKey: ['knowledge'] })`.
- [x] **Technical SEO, Strict `apiClient`, CSP & Parser Hardening:**
  - Создать `buildOpenGraphMetadata(...)` в `seo.ts` (сохраняет `siteName`, добавляет `alternateLocale` на всех дочерних страницах); добавить `mainEntityOfPage`, `publisher`, `image` в `TechArticle` JSON-LD, `BreadcrumbList` для статей, `robots: { index: false, follow: false }` на 404-метадате; предупреждать при prod-билде без `NEXT_PUBLIC_SITE_URL`.
  - В `api-client.ts`: conditional type для `pathParams` (обязателен для параметризованных роутов `:slug`, `never` для остальных).
  - В `use-knowledge-metrics.ts` и `article-metrics-bar.tsx`: починить оптимистичное добавление новой статьи в `useIncrementHelpfulMutation` и заменить фейковые `100`/`25` на `<Skeleton>`.
  - В `security-headers.config.ts`: валидировать `publicApiUrl` через `new URL(...).origin`, сузить `connect-src` до явных origin'ов (убрать широкий `https:`), добавить `Cross-Origin-Resource-Policy: same-origin`.
  - В `link-sanitizer.ts`: запретить `/\` (`!trimmed.startsWith('/\\')`). В `mdx-ast-parser.ts`: явно отключить JS-движки в `gray-matter`.

#### Сессия 3A — Frontend RSC/Streaming, Bundle & CWV Optimization _(Recommended Effort: **High** — ✅ Завершена)_

_Область:_ `packages/shared-schemas/package.json`, `packages/ui/*`, `apps/web/next.config.ts`, `apps/web/src/app/**`, `CvDocumentShowcase`, `D3`, `scrollspy`.

- [x] **Устранение утечек клиентского бандла (`H5`, `I4`):**
  - Добавить `"sideEffects": false` в `packages/shared-schemas/package.json` и `"sideEffects": ["*.css"]` в `packages/ui/package.json` + `'@repo/shared-schemas'` в `optimizePackageImports`, чтобы 43.6 КБ `tech-radar.schema.ts` не утекали в клиентский бандл.
  - Заменить `import * as d3 from 'd3'` на точечные импорты (`select`, `hierarchy`, `tree`, `linkHorizontal`), добавить cleanup в `useEffect`, keyboard a11y (`role="button"`, `tabIndex={0}`), убрать мёртвый `pulseCounterRef` и хардкод русских строк в D3-виджетах.
  - Перевести `NestAiMcpDiagram`, `ArticleImageGrid`, `GuestPassModal` и `CommandPaletteModal` на `next/dynamic` (оставив в layout только лёгкие триггеры `GuestPassModalLoader` и `CommandPaletteLoader`).
- [x] **Server-Island для `/cv` (`H6`):**
  - Разбить `CvDocumentShowcase` на Server Component (рендерит структурированное резюме и шапку только для активной локали) + клиентский `<CvViewTabs structuredSlot={...}>` (с `forceMount` + `data-[state=inactive]:hidden`), чтобы поисковики получали полный HTML резюме при SSR, а `author-profile.ts` (18.7 КБ, 3 языка) не попадал в клиентский JS.
- [x] **Streaming `<Suspense>`, `NextIntlClientProvider` Slicing, `loading.tsx` & `global-error.tsx` (`H7`):**
  - Порезать `messages` в `[locale]/layout.tsx` до глобально нужных клиентских неймспейсов (`pickIntlMessages`), а страничные (`CvPage`, `SystemStatusPage`, `TechRadar`, `Roadmap`) прокидывать локально.
  - Обернуть `<MdxArticleRenderer>` в `<Suspense fallback={<ArticleBodySkeleton />}>`; экспортировать `export const dynamicParams = false` в `[...slug]/page.tsx`.
  - Добавить `loading.tsx` для `/knowledge-base` и `/system-status`.
  - Импортировать `./globals.css` в `apps/web/src/app/global-error.tsx`.
- [x] **CWV, CLS, `IntersectionObserver` & Table/Cache Hygiene (`H12`, `I4`, `I5`):**
  - Выровнять высоты скелетонов D3 (`min-h-[420px]`) и `KnowledgeDirectoryExplorer` (заменить `fallback={null}` на скелетон).
  - Перевести `useActiveWorkfolioSection` и `useActiveHeading` (TOC) с `getBoundingClientRect()` на `IntersectionObserver`.
  - Добавить `'use client'` в `packages/ui/src/components/dialog.tsx` и `tabs.tsx`; ключи `segments.join('/')` в `React.cache` (`mdx-fs-loader.ts`) и `React.cache` в `cv-file.ts`; FIFO-вытеснение в `shiki-highlighter.ts`; убрать `router.prefetch` KB для гостя; деструктурировать оставшиеся `useQuery`/`useInfiniteQuery` и стабилизировать `columns` + типизировать `ColumnMeta` в `ObservabilityDataTable`; убрать `useLocale() as SupportedLocale` в `language-switcher.tsx`; локализовать `opengraph-image.tsx` со шрифтом `Inter`.

#### Сессия 3B — Синхронизация `this-project` MDX (42 файла), Docs & CI Quick-Wins _(Recommended Effort: **Medium** — ✅ Завершена)_

_Область:_ `apps/web/content/this-project/**`, `.github/**`, `README.md`, `.agents/**`, `SECURITY.md`, `biome.json`.

- [x] **Фактчекинг и полная синхронизация всех 14 статей (42 файла) `apps/web/content/this-project/**`** под итоговый код после Сессий 1–3A и CI Hardening:
  - Синхронизированы все 14 статей во всех 3 локалях (`en`, `ru`, `uk`): `nestjs-12-esm-prisma-7-sse-graceful-architecture`, `multi-theme-tokens-tailwind-preset`, `programmatic-scrollspy-section-nav`, `edge-web-crypto-jwt-proxy`, `production-seo-i18n-sitemap-architecture`, `react-compiler-config-boundaries`, `rsc-locale-slicing-client-islands`, `server-mdx-ast-dual-theme-shiki`, `static-search-index-cmdk-palette`, `github-actions-ci-pipeline`, `multi-stage-buildkit-docker`, `pnpm-turborepo-tsconfig-biome`, `production-security-hardening-csp-helmet-throttler` (включая `CsrfOriginMiddleware` и паттерны расширения под медиа-загрузки), `vitest-playwright-enterprise-testing-pyramid`.
- [x] **Синхронизация системной документации** по чеклисту `AGENTS.md` (`README.md`, `apps/web/README.md`, `apps/api/README.md`, `.agents/frontend/*`, `.agents/backend/*`, `.agents/architecture/ci-cd.md`, `SECURITY.md`).
- [x] **CI Security & Workflow Hardening:** добавлены еженедельный workflow `.github/workflows/security-audit.yml` (`cron: "0 6 * * 1"`), `.github/dependabot.yml` (`npm` + `github-actions`), шаг `actionlint` (`v1.7.12` + SHA-256 checksum) в `lint` джобе `.github/workflows/ci.yml` и правило `suspicious.noImportCycles: "error"` в `biome.json` (0 циклических импортов по всему монорепозиторию).

---

### Приоритет №0.5 (Сразу после Gate №0, ДО Redis): Первый Live Production Deploy & Agent-Assisted Verification

> **Зачем делать ДО Redis:** первый выход на боевой HTTPS (Vercel Hobby + Render/Koyeb + Neon.tech) валидирует `HttpOnly; Secure` куки, CORS, CSP, `TRUST_PROXY_HOPS`, SEO (`sitemap.xml`, `robots.txt`, `og:image`, GSC) и реальный Lighthouse/CrUX до усложнения архитектуры кэшем Redis и S3.

- [ ] **Шаг 1 — Инфраструктурный деплой (выполняет пользователь, ~15–20 мин):**
  1. **Neon.tech:** создать PostgreSQL (`?sslmode=require`), накатить схему и сид снаружи (`pnpm --filter @repo/api prisma:push` / `prisma migrate deploy` + `pnpm --filter @repo/api prisma:seed`).
  2. **Backend (Render / Koyeb / Fly.io):** развернуть `docker/api.Dockerfile` (+ `telemetry-ms`), задать `DATABASE_URL`, `JWT_SECRET` (`>= 32` символов), `ADMIN_SECRET_PASSCODE` (`>= 16` символов), `WEB_ORIGIN=https://<vercel-domain>`, `TRUST_PROXY_HOPS=1`, `NODE_ENV=production` (без `WORKFOLIO_DEMO_MODE`).
  3. **Frontend (Vercel Hobby):** подключить репозиторий, build command `pnpm turbo run build --filter=@repo/web...`, задать `NEXT_PUBLIC_SITE_URL=https://<vercel-domain>`, `API_INTERNAL_URL` (или `NEXT_PUBLIC_API_URL`), `JWT_SECRET` (идентичный API!), `APP_ENV=production`.
  4. Передать боевой HTTPS URL ИИ-агенту для запуска автоматической приёмки (Шаг 2).
- [ ] **Шаг 2 — Автоматическая приёмка боевого деплоя (выполняет ИИ-агент через `run_command` + `browser`-субагент):**
  1. **HTTP Security & SEO Smoke-Check:** проверить отсутствие `localhost:3000` в `/robots.txt`, `/sitemap.xml`, `/llms.txt`; убедиться, что все URL из `sitemap.xml` отдают `200 OK` (ноль `307`!); проверить заголовки `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `Cross-Origin-Resource-Policy`, `X-Request-Id`; проверить `GET /api/health` и `GET /api/capabilities` (`mode: 'production'`, `persistence: 'postgresql'`); проверить `403` на неверный `adminPasscode`, `429` на превышение лимита и `Set-Cookie` с `HttpOnly; Secure; SameSite=Lax`.
  2. **Live Browser E2E (`browser`-субагент):** пройти по `/`, `/cv` (проверить SSR-резюме), `/knowledge-base/this-project/...` (открывается без auth), закрытому разделу `/knowledge-base/react/...` (редирект ➔ `GuestPassModal` без подсказки `workfolio-admin-2026` ➔ вход ➔ доступ к статье), `/system-status` (`SSE LIVE`, 0 дублей событий, пагинация, 0 консольных ошибок), `/opengraph-image`.
  3. **Post-Deploy SEO Indexing (пользователь):** подключить домен в Google Search Console, отправить `sitemap.xml`, прописать боевой URL в GitHub / LinkedIn / Telegram / PDF-резюме (`sameAs` Entity Graph).

---

### Приоритет №1: Внедрение Redis (Distributed Rate Limiting, Response Cache & Session Revocation)

> **⛔ Pre-Flight Readiness Gate (обязательно проверить ДО написания первой строчки Redis-кода):**
> 1. Закрыт `Приоритет №0`: `TRUST_PROXY_HOPS` вынесен в env (иначе распределённый Rate Limiter заблокирует всех пользователей под одним IP прокси), `edge-jwt.ts` работает fail-closed, `QueryProvider` не кэширует `['auth', 'me']` в IndexedDB (иначе отозванные в Redis сессии будут воскресать из IDB), `ArticleMetrics` защищён allowlist'ом слагов (иначе Redis закэширует спам-строки), а SSE имеет лимиты соединений.
> 2. Проверена совместимость с NestJS 12 ESM (`"type": "module"`): вместо CJS-проблемного `@nest-lab/throttler-storage-redis` предпочтительнее написать собственный легковесный `RedisThrottlerStorage implements ThrottlerStorage` поверх `ioredis` с атомарным Lua-скриптом (`INCR` + `PEXPIRE`) — ноль CJS/ESM-хаков и чистый контроль над окном.
> 3. **Не создавать преждевременно `packages/redis`:** подключать `ioredis` напрямую в `apps/api`; выносить в общий пакет только если `apps/telemetry-ms` перейдёт на Redis Pub/Sub.

- [ ] **Архитектурное внедрение Redis (`apps/api`, `docker-compose.yml`, `docker-compose.prod.yml`):**
  - **Нативный паттерн модуля:** оформить `RedisModule` через нативный `ConfigurableModuleBuilder` (`@nestjs/common`, `setClassMethodName('forRoot')` + `setExtras({ isGlobal: true })`) с выносом DI-токенов в отдельный `redis.constants.ts` (чистый Enterprise-стандарт без 100 строк ручного boilerplate).
  - **Зачем:**
    1. _Distributed Rate Limiting:_ масштабирование защиты от брутфорса (`POST /api/auth/guest-pass`, SSE connect) при работе нескольких реплик API (Upstash Redis на Free Tier / локальный `redis:7-alpine`).
    2. _Response Caching (Cache-Aside + TTL Jitter):_ кэширование аналитических эндпоинтов (`GET /api/knowledge/metrics/paginated`, `GET /api/telemetry/stats`) с TTL `60s ± 10%` (защита от Cache Stampede), снижающее нагрузку на Neon.tech PostgreSQL на ~95%.
    3. _Access (`15m`) + Rotating Refresh (`1d`/`7d`) & Session Revocation:_ мгновенный отзыв скомпрометированных сессий в Redis (`VisitorSession` + blocklist/revocation set) и single-flight `401` refresh очередь в `apiClient.interceptors` (`Axios`). _(Готовая заготовка: при переходе `JwtRolesGuard` на глобальный `APP_GUARD` использовать `@Public()` из `common/decorators/public.decorator.ts`.)_
    4. _Интеграция с `/system-status`:_ автоматическое переключение индикатора `rateLimiter` в `GET /api/capabilities` из `'in-memory'` в `'redis'`.
  - **Паттерн Graceful In-Memory Fallback:** если переменная `REDIS_URL` отсутствует в `.env`, система автоматически и без ошибок откатывается на встроенный `In-Memory Throttler` и прямое чтение из БД.
  - **Docker:** `redis:7-alpine` (~30 МБ) в приватной сети `backend-network` (`127.0.0.1:${REDIS_HOST_PORT:-6379}:6379` в `docker-compose.yml` и без хост-порта в `docker-compose.prod.yml`, healthcheck `redis-cli ping`, `cap_drop: ALL`, `no-new-privileges`).
  - **Спецификация:** `.agents/backend/security-jwt.md` (Секция 5).
- [ ] **Обязательная статья в `this-project` (`apps/web/content/this-project/backend-architecture/redis-rate-limiting-cache-and-session-revocation.{en,ru,uk}.mdx`):**
  - Включить подробный раздел **«Pre-Flight Readiness Checklist: что нужно проверить в проекте ДО внедрения Redis»** (топология `trust proxy`, fail-closed auth, исключение auth из клиентского IDB-кэша, защита от кэширования мусора, CJS/ESM совместимость, защита от Cache Stampede / TTL Jitter, лимиты памяти `maxmemory-policy allkeys-lru`), а также архитектурный разбор того, **зачем** мы внедрили Redis и **как** он устроен в `greatest-portfolio`.

---

### Приоритет №2: Визуальный редизайн (`UI v2`) + Интерактивная лаборатория `/[locale]/lab` (XYFlow & Sandboxes)

> Поднято выше полного CMS ради максимального визуального и инженерного ROI. База знаний (`/knowledge-base`) остаётся быстрой статической документацией (0 KB лишнего JS, удобно копировать статьи как промпты), а тяжёлые интерактивные библиотеки переезжают в выделенный полноэкранный раздел `/lab`.

- [ ] **Авторский редизайн Workfolio (`UI v2`):** глубокое визуальное и типографическое переосмысление интерфейса поверх готового фундамента (`Tailwind CSS v4`, 2D-палитры `Warm Paper / Graphite / Sepia`, Zero-CLS шрифты `Inter` + `JetBrains Mono`, `@starting-style`, `@container`), включая точечное применение современных примитивов React 19.2+ (`<Activity>` для сохранения состояния скрытых табов без размонтирования, `useEffectEvent` для чтения актуальных значений в эффектах без лишних переподписок и опциональные `<ViewTransition>`), строго следуя `.agents/frontend/*` (Mobile-First с опорой на `360px`).
- [ ] **Новый роут `/[locale]/lab` (Engineering Lab / Interactive Playground):**
  - **Зачем:** отделить тяжёлые интерактивные песочницы от текстовых `.mdx`-статей, получить полноэкранный canvas вместо узкой `prose`-колонки и изолировать бандлы через route-level code-splitting.
  - **Структура (FSD-Modular):** новый слайс `apps/web/src/features/interactive-labs/*` + роуты `apps/web/src/app/[locale]/lab/page.tsx` и `apps/web/src/app/[locale]/lab/[slug]/page.tsx`, кнопка перехода в шапке (`APP_ROUTES.lab`).
  - **Первые лаборатории:**
    1. _React Ecosystem — `@xyflow/react` Interactive Architecture Canvas:_ drag-and-drop узлы, кастомные edges, переключение режимов (Monorepo / Request Lifecycle / Edge Auth), мини-карта, экспорт графа + боковая карточка со ссылкой на соответствующую статью в `/knowledge-base/this-project/*`.
    2. _React Render Tree & TanStack Query Cache Lab:_ перенос/расширение интерактивных D3-демо в полноценную песочницу с двусторонними ссылками из Базы Знаний.

---

### Приоритет №3: `S3/R2 Object Storage` (Фаза 1) + 4 инженерных «Вау-эффекта»

> **Перед стартом проверить:** Приоритеты №0, №0.5 и №1 завершены, боевой HTTPS-домен работает стабильно, Redis активен для rate-limiting и кэширования новых эндпоинтов.

- [ ] **Фаза 1 — `S3-compatible Object Storage` (`@aws-sdk/client-s3` для `Cloudflare R2` + локальный `MinIO`):**
  - Оформить `StorageModule` через нативный `ConfigurableModuleBuilder` (`forRoot` / `forRootAsync`, DI-токены в `storage.constants.ts`), выделить `StorageService` в `apps/api` (IAM least-privilege ключи, генерация краткоживущих Presigned URLs, стриминг/проксирование с проверкой MIME и размера файла) и подключить легковесный `minio` сервис в `docker-compose`.
  - Перевести на `StorageService` отдачу PDF-резюме (`/cv/*.pdf`) с graceful fallback на локальную статику `public/cv/*.pdf` при отсутствии S3-переменных; переключить индикатор `s3ObjectStorage` на `/system-status`.
- [ ] **Вау-эффект №1 — Public Read-Only `@nestjs/mcp` Server (`Streamable HTTP`) + Live MCP Playground (`$0/мес`):**
  - **Зачем:** дать техлидам и рекрутерам возможность подключить `greatest-portfolio` напрямую к `Cursor` / `Claude Desktop` и интерактивно «опрашивать» архитектуру, 16 ADR и опыт CV через протокол MCP, либо тестировать JSON-RPC вызовы прямо на `/system-status`.
  - **Архитектура и безопасность:** новый модуль `apps/api/src/modules/mcp/*` (строго **Read-Only**):
    - Tools: `get_author_cv`, `query_adr_decisions` (поиск/фильтр по 16 ADR), `search_public_knowledge` (строго по публичному разделу `this-project`, полная изоляция закрытых/NDA-статей), `get_system_capabilities`.
    - Защита: строгие Zod-схемы аргументов (`limit <= 16`, `query.max(60)`), отдельный `@Throttle` (например `20 req / min` через Redis), zero LLM token spend (`$0/мес`), Capability Gating в `/system-status`.
  - **Frontend:** вкладка/виджет **MCP Live Inspector** на `/[locale]/system-status` с готовым конфигом подключения для Cursor/Claude и кнопкой «Try tool call».
- [ ] **Вау-эффект №2 — Real User Monitoring (RUM) Core Web Vitals Pipeline:**
  - **Зачем:** заменить чисто синтетические пульсы на `/system-status` реальной продакшен-телеметрией пользовательского опыта (LCP, INP, CLS, TTFB).
  - **Реализация:** подключить `web-vitals` на клиенте (`apps/web`), отправлять метрики батчем через `navigator.sendBeacon` (нулевое влияние на INP) на новый `POST /api/telemetry/vitals` (строгая Zod-схема + жёсткий rate limit), агрегировать p75 в Redis/PostgreSQL и транслировать живые обновления в `/system-status` через SSE.
- [ ] **Вау-эффект №3 — Interactive Architecture Trace Explorer (`X-Request-Id` + `Server-Timing` Waterfall Drawer):**
  - **Зачем:** визуализировать сквозную трассировку, которая уже работает под капотом (`Axios -> Next.js -> NestJS -> Prisma -> TelemetryMS`).
  - **Реализация:** в `LoggingInterceptor` (`apps/api`) добавлять стандартный заголовок `Server-Timing` (`db;dur=..., tcp;dur=..., total;dur=...`); в `apiClient` (`apps/web`) вести кольцевой буфер последних 20 запросов (`X-Request-Id`, статус, latency, `Server-Timing`, источник `IDB Cache vs Network`); вывести компактный Trace Drawer / секцию на `/system-status`.
- [ ] **Вау-эффект №4 — Live GitHub Engineering Pulse со Streaming `<Suspense>` + ISR (`revalidateTag`):**
  - **Зачем:** нативно продемонстрировать Streaming SSR + ISR + устойчивость к недоступности внешнего API.
  - **Реализация:** серверный компонент в `<Suspense fallback={<GitHubPulseSkeleton />}>` на главной / в `Engineering Roadmap`, запрашивающий статус CI-воркфлоу, последние коммиты и релизы репозитория (через server-only `GITHUB_TOKEN`, `next: { revalidate: 3600 }`, Redis-кэш, **Circuit Breaker** против залипания на таймаутах внешнего API и graceful Capability Gating при отсутствии токена).
- [ ] **Resilience Upgrade — Circuit Breaker для TCP-моста `telemetry-ms` (`apps/api/src/modules/telemetry/`):**
  - **Зачем:** сейчас при выключенном `telemetry-ms` каждый вызов `GET /api/capabilities` или `GET /api/telemetry/stats` ждёт `timeout(800)` (800ms) перед уходом в fallback.
  - **Реализация:** лёгкий Circuit Breaker (`Closed -> Open на 30s после 3 подряд ECONNREFUSED/timeout -> Half-Open проба`, либо `opossum`) вокруг TCP-вызова к `telemetry-ms` (и вынос токена `TELEMETRY_MS_CLIENT` в `telemetry.constants.ts`) ➔ падение задержки fallback-ответа с `800ms` до `<1ms`.

---

### Приоритет №4 (Deferred / Learning Track): Nginx Reverse Proxy (VPS) & Re-Scoped Postgres KB Index

> **Почему отложено в конец:** текущие `.mdx` статьи занимают лишь `~699 KB` (~30 файлов), а Git + Zero-Eval HAST SSG даёт нулевой TTFB, PR-диффы и `$0` инфраструктуры. Полноценный перенос тел `.mdx` в R2 + Postgres на данном этапе — переинжиниринг; при желании показать SQL-пагинацию/поиск каталога достаточно вынести в Postgres **индекс метаданных и тегов** (с синхронизацией в CI), оставив исходники `.mdx` в Git.

- [ ] **Nginx Reverse Proxy (`docker-compose.prod.yml` — Self-Hosted / VPS Learning Track):**
  - **Архитектурные требования и нюансы `TRUST_PROXY_HOPS` (ОБЯЗАТЕЛЬНО учесть при реализации!):**
    1. **Прямая маршрутизация `/api/*` из Nginx в `api:4000` (УБИРАЕМ ХОП Next.js `rewrites()`!):**
       - `/` ➔ `http://web:3000`
       - `/api/*` ➔ `http://api:4000` (напрямую, минуя Next.js!).
       - _Зачем:_ если проксировать `/api/*` по цепочке `Client -> Nginx -> Next.js rewrites -> NestJS`, появляется **2 прокси-хопа** (ломает `TRUST_PROXY_HOPS=1`, либо все клиенты делят один IP-бакет в `@nestjs/throttler`/Redis) и тратятся лишние сокеты Next.js на долгоживущий SSE-стрим. Прямой роут `/api/* -> api:4000` сохраняет ровно **1 хоп** (`TRUST_PROXY_HOPS=1`) и разгружает фронтенд-контейнер.
    2. **Полное удаление хост-портов бэкенда и фронтенда в `docker-compose.prod.yml`:**
       - После добавления `nginx` (`ports: ["80:80", "443:443"]`) **полностью удалить** секции `ports:` у `api` и `web` (по аналогии с `postgres` и `telemetry-ms`). Единственная входная точка — Nginx; остальные сервисы общаются строго внутри приватных Docker-сетей (`frontend-network` / `backend-network`).
    3. **Заголовки доверия и защита от спуфинга IP:** передавать `proxy_set_header X-Real-IP $remote_addr;`, `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`, `proxy_set_header X-Forwarded-Proto $scheme;`, `proxy_set_header Host $host;` (отбрасывая недоверенный входящий `X-Forwarded-Host`).
    4. **Конфигурация Long-Lived SSE для `/api/telemetry/stream`:** отдельный `location = /api/telemetry/stream` с `proxy_http_version 1.1;`, `proxy_set_header Connection '';`, `proxy_buffering off;`, `proxy_cache off;`, `chunked_transfer_encoding off;`, `proxy_read_timeout 16m;` (согласовано с серверным max stream TTL `15m`).
    5. **Порядок старта (`HEALTHCHECK`):** `nginx` обязан ждать `depends_on: web: { condition: service_healthy }` и `api: { condition: service_healthy }`, чтобы не отдавать `502` в первую секунду старта (сами `healthcheck` для `web` и `telemetry-ms` добавляются уже в Сессии 1).
    6. **Дополнительные кейсы Nginx:** TLS Termination, Static Asset / Edge Caching (`/_next/static/`), L7 Rate Limiting (`limit_req_zone`) перед Node.js.
- [ ] **Re-Scoped DB-Backed Knowledge Base Search & Metadata Index (опционально — Фаза 2 CMS):**
  - _Рекомендуемый прагматичный вариант:_ хранить `.mdx` в Git/SSG, а в PostgreSQL (`Prisma 7`) синхронизировать таблицы метаданных (`KnowledgeTopic`, `KnowledgeSubtopic`, `KnowledgeArticle`, `KnowledgeTag`, `KnowledgeArticleTag`) с `tsvector` + GIN-индексом для серверной пагинации (`useInfiniteQuery`: 6 разделов / 4 статьи / Топ-10 тегов) и полнотекстового SQL-поиска.
  - _Полный CMS-вариант (только если нужен учебный шоукейс R2-хранения текстов):_ перенос тел `.mdx` в `Cloudflare R2`/`MinIO` по `storageKey` + `contentHash` (SHA-256) + Admin CRUD (`@Roles('ADMIN')`) + `sync:mdx-to-cms` + On-Demand ISR (`revalidateTag`) + Dual-Source Air-Gapped Fallback.

---

## 🔧 Инфраструктурный и Архитектурный Бэклог

### 1. Security & Auth Extensions (`apps/web`, `apps/api`)

- [ ] **Next-Gen Auth & Telegram Bot Access для закрытых разделов Базы Знаний (`apps/api`, `PostgreSQL`, `Telegram Bot API`):** заменить открытую 1-click демо-заглушку на полноценную БД-авторизацию с хэшированными токенами и опциональной регистрацией через Telegram-бота:
  1. _Инфраструктура и переменные окружения:_ создать бота в `@BotFather` (`/newbot`) ➔ `TELEGRAM_BOT_TOKEN`, 32+ символьный `TELEGRAM_WEBHOOK_SECRET`, опционально `TELEGRAM_ADMIN_CHAT_ID`; в `apps/api` использовать `grammy` (native ESM + TypeScript) или zero-dep `fetch` + модели сессий/токенов в PostgreSQL (`Prisma 7`).
  2. _Антиспам-ограничение Telegram Bot API и обходные решения:_ бот **не имеет права** писать первым по номеру телефона или username. Рабочий прод-паттерн — **Deep Link `https://t.me/<bot>?start=<nonce>`**:
     - `POST /api/auth/telegram/init`: генерирует 24-байтный `base64url` `nonce`, сохраняет в БД **только** его `SHA-256` хэш с TTL `10 мин`, а на UI показывает кнопку «Продолжить в Telegram» (+ QR-код для десктопа).
     - Внутри Telegram пользователь жмёт `Start` (при привязке телефона — `ReplyKeyboardMarkup` с `request_contact: true` и обязательной проверкой `contact.user_id === message.from.id`).
     - Бот отправляет подтверждение доступа (опционально — инлайн-кнопки `[✅ Approve] [❌ Reject]` админу в `TELEGRAM_ADMIN_CHAT_ID`), а сайт через SSE/polling получает одноразовый `exchangeToken` и обменивает его через `POST /api/auth/telegram/exchange` на `HttpOnly` JWT-куку `kb_access_token`.
     - _Fallback без Telegram:_ одноразовый invite-код (хранится как `SHA-256` / `Argon2id` / `scrypt` хэш в PostgreSQL с лимитом использований и TTL) для рекрутеров без Telegram.
  3. _Webhook vs Polling:_ в `NODE_ENV=development` — Long Polling (`getUpdates`), в `NODE_ENV=production` — `POST /api/auth/telegram/webhook` с `crypto.timingSafeEqual` проверкой `X-Telegram-Bot-Api-Secret-Token`.
  4. _Приватность, Rate Limit и Capability Gating:_ телефоны не логируются и не попадают в SSE/`localStorage`; на `/init` и `/exchange` действует строгий `@nestjs/throttler`; без `TELEGRAM_BOT_TOKEN` кнопка отображается `disabled` с плашкой _«Нет API-ключа для использования данного сервиса»_.
- [ ] **Throttler ESM Upgrade Cleanup (`apps/api`):** отслеживать переход `@nestjs/throttler` на нативный ESM (`"type": "module"`) и удалить временный CJS/ESM мост для `Reflector` из `apps/api/src/app.module.ts`.
- [ ] **`next-themes` React 19 Dev Warning Cleanup (`apps/web`):** отслеживать upstream-фикс `pacocoursey/next-themes#385` и удалить закомментированный блок из `apps/web/src/shared/providers/theme-provider.tsx`.

### 2. Observability & Deployment Extensions

- [ ] **Live Sentry & PostHog SDK:** заменить обёртки-заглушки на реальные транспорты `@sentry/nextjs`, `@sentry/nestjs` и `posthog-js`, включаемые при наличии ключей в `.env`.
- [ ] **Расширение Capability-Gated UI для новых фич (Redis, S3/R2, MCP, GitHub Pulse, Telegram Bot):** контракт `GET /api/capabilities` (`SystemCapabilitiesSchema`) и матрица `/system-status` уже работают; при отсутствии API-ключа интерфейс **показывает** фичу в состоянии `disabled` / `aria-disabled` с локализованной плашкой _«Нет API-ключа для использования данного сервиса»_.
- [ ] **Cross-Domain API Deployment (`NEXT_PUBLIC_API_URL`):** при выносе `apps/api` на отдельный домен добавить `NEXT_PUBLIC_API_URL` в `.env`, `.env.example`, `turbo.json` (`globalEnv`), пробросить `baseURL` в `Axios` (`api-client.ts`) и `EventSource` с фолбэком на `''` и добавить домен в CSP `connect-src`.
- [ ] **Article-Level OpenGraph Previews (`/knowledge-base/[...slug]/opengraph-image.tsx`):** опциональное расширение генератора превью второго уровня из `title`, `category` и `#tags` каждой статьи (с локальным `.ttf`-буфером шрифта для кириллицы).
- [ ] _(Отложено / `deferred`)_ **Живой агент `@nestjs/ai`:** не нужен, пока поиск закрывает `Cmd+K` и Read-Only MCP за `$0/мес`; при возврате — строго за `@UseGuards(JwtRolesGuard)` с `maxOutputTokens`.

---

## 📚 План наполнения контентом Базы Знаний (Content Expansion)

> Инфраструктура рендеринга `.mdx` (`Zero-Eval HAST`) и ленивые клиентские острова (`features/kb-sandboxes/ui/mdx-client-widgets.tsx`) полностью реализованы. Тяжёлые интерактивные песочницы (вроде `@xyflow/react`) развиваются в отдельном роуте `/[locale]/lab` с двусторонними ссылками из статей.

- [ ] **Новые архитектурные статьи в `this-project/` (незадокументированные подсистемы):**
  1. `this-project/backend-architecture/redis-rate-limiting-cache-and-session-revocation.{en,ru,uk}.mdx` — **Redis & Pre-Flight Readiness Checklist** (создаётся в Приоритете №1).
  2. `this-project/frontend-architecture/system-status-observability-and-offline-query-cache.{en,ru,uk}.mdx` — **System Observability (`/system-status`), Capability-Gated UI, Offline `TanStack Query` + `IndexedDB` Allowlist, `BroadcastChannel` Sync & Native `next/root-params`** (плюс разбор CJS/ESM `Reflector` моста в NestJS 12).
- [ ] **Цикл из 3 профильных статей по безопасности в `others/security/`:**
  1. `frontend-browser-security-playbook.{en,ru,uk}.mdx` — **Frontend & Browser Defense:** CSP (`nonce`/hash vs `SSG`, `Trusted Types`, `SRI`), `HttpOnly`/`__Host-` куки, DOM/AST-санитизация, Open Redirect, Clickjacking, защита от AI-ботов (WebAuthn Passkeys, Turnstile, PAT).
  2. `backend-api-gateway-security-playbook.{en,ru,uk}.mdx` — **Backend & API Defense (+ «7 ошибок JWT на код-ревью»):** `localStorage` vs `HttpOnly`, запрет PII в claims, `15m Access + Rotating Refresh`, серверный отзыв в `VisitorSession`/Redis, `alg: "none"`, `verify()` vs `decode()`, Sliding-Window Redis Rate Limiting, BOLA/IDOR, Race Conditions (`SELECT FOR UPDATE`), Zod против Mass Assignment, песочницы для MCP.
  3. `devops-supply-chain-container-security.{en,ru,uk}.mdx` — **DevOps, Docker & Supply Chain Defense:** изоляция Docker-сетей (`backend-network`, zero host ports), `non-root` / `cap_drop: ALL` / `read_only`, защита от `postinstall` через `allowBuilds` и `--ignore-scripts`, харденинг GitHub Actions (`persist-credentials: false`, SHA-пиннинг).
- [ ] **Расширение раздела «Архитектура» (`architecture-devops/`):**
  1. `architecture-devops/caching/caching-strategies-and-redis-patterns.{en,ru,uk}.mdx` — **Top 5 Caching Strategies & Redis Patterns** (`Cache-Aside`, `Read-Through`, `Write-Through`, `Write-Around`, `Write-Back`, TTL Jitter, Request Coalescing).
  2. `architecture-devops/networking/nginx-reverse-proxy-load-balancing-and-sse.{en,ru,uk}.mdx` — **Top 8 NGINX Use Cases & SSE Streaming** (`proxy_buffering off`, `TRUST_PROXY_HOPS`, L7 Rate Limiting, TLS Termination).
- [ ] **Свежие возможности `React 19.2+` в `react/react-19/`:**
  - `react/react-19/react-19-2-activity-effect-event-and-view-transitions.{en,ru,uk}.mdx` — `<Activity>`, `useEffectEvent`, `<ViewTransition>`, `React Performance Tracks` и правильное откладывание клиентского рендера в RSC.
- [ ] **Новые инженерные статьи `.mdx` по бэкенду:** `nestjs/` (`DI & Custom Providers`, `Guards / Pipes / Interceptors`, `NestJS Microservices + SSE`).

---

## ☁️ Архитектура бесплатного продакшен-деплоя (Runbook)

| Компонент               | Стек                      | Совместимость с Vercel Hobby                                      | Где хостить бесплатно                                |
| :---------------------- | :------------------------ | :---------------------------------------------------------------- | :--------------------------------------------------- |
| **`apps/web`**          | `Next.js 16 (App Router)` | **100% совместимо** (SSG/SSR/RSC, Edge Proxy, Turbo Remote Cache) | **Vercel** (Hobby, $0)                               |
| **`apps/api`**          | `NestJS 12`               | Несовместимо (долгоживущий процесс, SSE `@Sse('stream')`)         | **Render.com** / **Koyeb** / **Fly.io** (Docker, $0) |
| **`apps/telemetry-ms`** | `NestJS Microservice`     | Несовместимо (постоянный TCP `:4001`)                             | Docker Compose / фоновый воркер рядом с API ($0)     |
| **БД**                  | `PostgreSQL 16`           | Нет встроенной БД                                                 | **Neon.tech** (Serverless Postgres, 0.5 GB)          |
| **Кэш / Rate Limiter**  | `Redis` (Upstash)         | Совместимо (Serverless REST / TCP)                                | **Upstash Redis** (Free tier, 10k req/day)           |

```text
[ Браузер ] ──(1) HTML / RSC────────────────────────► [ Vercel: apps/web ] (NEXT_PUBLIC_API_URL)
            └─(2) REST / SSE / HttpOnly Cookies────► [ Render/Koyeb: apps/api ] ──TCP :4001──► [ telemetry-ms ]
                                                                 ├──DATABASE_URL──► [ Neon.tech Postgres ]
                                                                 └──REDIS_URL─────► [ Upstash Redis ]
```

1. **Neon.tech:** создать БД с `?sslmode=require`, накатить схему из CI/локально (`prisma migrate deploy` / `prisma:push`, т.к. прод-образ `api` очищен через `pnpm prune --prod`).
2. **Backend (`docker/api.Dockerfile` + `docker/telemetry-ms.Dockerfile`):** задать `DATABASE_URL`, `JWT_SECRET` (`>= 32` символов, не dev-дефолт), `ADMIN_SECRET_PASSCODE` (`>= 16` символов, не dev-дефолт), `TRUST_PROXY_HOPS` (`1` за Render/Koyeb/Nginx direct, `2` если поверх Nginx стоит ещё Next.js rewrite), `TELEMETRY_MS_HOST`, `TELEMETRY_MS_PORT=4001`, `WEB_ORIGIN=https://<vercel-app>`, `NODE_ENV=production`.
3. **Frontend (`Vercel`):** Node `22.x` (`Corepack` подхватит `"packageManager": "pnpm@12.21.0"` и `pnpm-workspace.yaml`), build command `pnpm turbo run build --filter=@repo/web...`, env `NEXT_PUBLIC_SITE_URL=https://<vercel-domain>`, `API_INTERNAL_URL` (или `NEXT_PUBLIC_API_URL` при кросс-домене), `JWT_SECRET` (идентичный `api`!), `APP_ENV=production`.
4. **Обязательный Post-Deploy SEO & Indexing Checklist (Агент обязан напомнить пользователю сразу после деплоя на Vercel):**
   - [ ] **Проверить `NEXT_PUBLIC_SITE_URL` в Vercel Environment Variables:** убедиться, что задан боевой HTTPS-домен (без слэша на конце) и после этого выполнен продакшен-билд, чтобы в `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `canonical` и `og:image` прописался реальный домен, а не `localhost:3000`.
   - [ ] **Google Search Console (Мгновенная индексация за 2 минуты):** добавить домен в [Google Search Console](https://search.google.com/search-console), подтвердить владение (через DNS TXT-запись или HTML-тег) и в разделе **Sitemaps** отправить ссылку `https://<domain>/sitemap.xml` + запросить индексацию главной страницы (`/`, `/ua`, `/ru`), `/cv` и `/knowledge-base/this-project`.
   - [ ] **Трастовые внешние ссылки (`sameAs` Entity Graph):** добавить боевую ссылку на сайт в шапку профиля **GitHub** (`github.com/Kri4evskiy`), в блок **About (Website)** самого репозитория `greatest-portfolio`, в контактную информацию **LinkedIn** (`in/kri4evskiy`), в био **Telegram** (`@Kri4evskiy`) и в шапку PDF-резюме (`public/cv/*.pdf`), чтобы Google связал `JSON-LD Person` в единый граф и вывел сайт в ТОП-1 по имени.
   - [ ] **Проверка карточек-превью и AI-манифеста:** открыть в браузере `https://<domain>/opengraph-image`, `https://<domain>/llms.txt` и `https://<domain>/robots.txt`, а затем скинуть ссылку на сайт в «Избранное» (**Saved Messages**) в Telegram и в [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/), чтобы прогреть кэш превью-баннера `1200×630`.
