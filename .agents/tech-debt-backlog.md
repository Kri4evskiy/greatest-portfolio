# 🛠️ Tech Debt & Post-MVP Backlog

## 📌 Текущая база (Production Baseline — `v0.10.0`)

Архитектурное ядро и pre-deploy hardening gate (`Security`, `Stability`, `CWV`, `SEO`, `CI Hardening`, `Docker Build Hygiene`) полностью завершены в `v0.10.0` (подробности и 16 ADR — в `.agents/{frontend,backend,architecture}/*` и статьях `this-project/`):

- **Monorepo & DX:** `pnpm 12.21.0` + `Turborepo 2.11` + `TypeScript 7.0.2` (native Go compiler) + `Biome 2.6.8` (`noImportCycles: error`) + `Lefthook` · `@repo/shared-schemas` (`Zod v4`: `SystemCapabilitiesSchema`, `KnowledgeSearchPayloadSchema`, `API_ENDPOINTS` + `resolveEndpoint`, `LOCALE_METADATA`, Offset/Cursor контракты) + `@repo/ui` (`Tailwind CSS v4.3.5` + `Storybook 10` на `Vite 8.3`, 100% coverage, 12/12 компонентов включая `Collapsible`) · 3-уровневое QA (`Vitest 5`: 18 файлов / 72 теста + `V8 coverage` + `Vitest UI :5124`, `Supertest` HTTP E2E, `Playwright` POM + `test.step`, `INITIAL_ARTICLE_SEEDS` из 10 слагов) · Multi-stage `Docker` (`docker-compose.yml` demo + hardened `docker-compose.prod.yml` с `build.args`) + 7-джобный `GitHub Actions CI/CD` (`actionlint v1.7.12`, еженедельный `security-audit.yml`, `dependabot.yml`).
- **Frontend (`apps/web`):** `Next.js 16.4.6` (`React 19 Compiler`) · `FSD-Modular` (`app` ➔ `widgets` ➔ `features` ➔ `entities` ➔ `shared`, `APP_ROUTES`, декомпозиция KB `sidebar/` + `directory/` + `search/`) · `next-intl` (`EN/UK/RU` SSG, `pickIntlMessages` slicing) · Hybrid KB Soft-Lock UX (`this-project/**` публично, закрытые ветки с `Tooltip` + in-place `GuestPassModal`, `useCachedAuth` на `skipToken`, `214` SSG страниц, `96` MDX-файлов включая раздел `Next.js`) · `TanStack Table v9` (`useTable`, `tableFeatures`, `metaHelper`) · `Cmd+K` SSG-индекс + `MiniSearch` (fuzzy/prefix) · `/[locale]/system-status` · `CvDocumentShowcase` Server Island · `robots.ts` + `sitemap.ts` + `/llms.txt` + `JSON-LD` + локализованный `opengraph-image.tsx` · `Zero-Eval HAST MDX Engine` (`mtimeMs` кэш + `Dual-Theme Shiki v4` FIFO) · `TanStack Query v5` (`IndexedDB` allowlist `['knowledge']` + `Axios` `apiClient`) · ref-counted `bfcache`-безопасный `EventSource` SSE · fail-closed `Edge Web Crypto JWT` + строгий `CSP` / `CORP`.
- **Backend (`apps/api` & `apps/telemetry-ms`):** `NestJS 12 ESM` (`common`/`config`/`migrations`/`modules`, `CsrfOriginMiddleware`, `Helmet`, `@nestjs/throttler` 60 req/min, configurable `TRUST_PROXY_HOPS`, `enableShutdownHooks()` + `takeUntil(shutdown$)`, `X-Request-Id`, `TimeoutInterceptor` 15s) + `Prisma 7` (`@prisma/adapter-pg` + bounded In-Memory fallback + `KNOWN_KNOWLEDGE_SLUGS` allowlist + UUID dedup) + `1d` HS256 `HttpOnly JWT` + `@Roles('ADMIN')` diagnostics stub + TCP-микросервис телеметрии (`:4001`) с лимитами SSE (`2/IP`, `50` global, `15m` TTL).

---

## 🔥 Приоритетная очередь разработки (Next Up)

> **Политика ролей (`RoleEnum`):** строго 3 роли доступа — `GUEST` (без куки), `USER` (прошёл auth) и `ADMIN` (владелец портфолио). `VisitorRoleTypeEnum` используется исключительно как бейдж профиля визитора, не как уровень прав.
> **Политика Free-Tier:** все лимиты (rate limiting, SSE, in-memory fallback, пагинация, TTL) проектируются жёстко, чтобы исключить исчерпание бесплатных квот Vercel Hobby / Render / Koyeb / Neon.tech / Upstash.

---

### Приоритет №1 (ДО Redis): Первый Live Production Deploy & Agent-Assisted Verification

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

### Приоритет №2: Внедрение Redis (Distributed Rate Limiting, Response Cache & Session Revocation)

> **⛔ Pre-Flight Readiness Gate (проверить ДО написания первой строчки Redis-кода):**
> 1. Завершён `Приоритет №1` (боевой HTTPS стабильно работает; `TRUST_PROXY_HOPS`, fail-closed `edge-jwt.ts`, IndexedDB allowlist, allowlist слагов и лимиты SSE уже готовы в `v0.10.0`).
> 2. Совместимость с NestJS 12 ESM (`"type": "module"`): вместо CJS-проблемного `@nest-lab/throttler-storage-redis` написать собственный легковесный `RedisThrottlerStorage implements ThrottlerStorage` поверх `ioredis` с атомарным Lua-скриптом (`INCR` + `PEXPIRE`).
> 3. **Не создавать преждевременно `packages/redis`:** подключать `ioredis` напрямую в `apps/api`; выносить в общий пакет только если `apps/telemetry-ms` перейдёт на Redis Pub/Sub.

- [ ] **Архитектурное внедрение Redis (`apps/api`, `docker-compose.yml`, `docker-compose.prod.yml`):**
  - **Нативный паттерн модуля:** оформить `RedisModule` через `ConfigurableModuleBuilder` (`@nestjs/common`, `setClassMethodName('forRoot')` + `setExtras({ isGlobal: true })`) с выносом DI-токенов в `redis.constants.ts`.
  - **Зачем:**
    1. _Distributed Rate Limiting:_ масштабирование защиты от брутфорса (`POST /api/auth/guest-pass`, SSE connect) при нескольких репликах API (Upstash Redis на Free Tier / локальный `redis:7-alpine`).
    2. _Response Caching (Cache-Aside + TTL Jitter):_ кэширование `GET /api/knowledge/metrics/paginated` и `GET /api/telemetry/stats` с TTL `60s ± 10%` (защита от Cache Stampede), снижающее нагрузку на Neon.tech PostgreSQL на ~95%.
    3. _Access (`15m`) + Rotating Refresh (`1d`/`7d`) & Session Revocation:_ мгновенный отзыв скомпрометированных сессий в Redis (`VisitorSession` + revocation set) и single-flight `401` refresh очередь в `apiClient.interceptors`.
    4. _Интеграция с `/system-status`:_ автоматическое переключение `rateLimiter` в `GET /api/capabilities` из `'in-memory'` в `'redis'`.
  - **Graceful In-Memory Fallback:** при отсутствии `REDIS_URL` автоматический откат на встроенный `In-Memory Throttler` и прямое чтение из БД.
  - **Docker:** `redis:7-alpine` (~30 МБ) в `backend-network` (`127.0.0.1:${REDIS_HOST_PORT:-6379}:6379` в `docker-compose.yml`, без хост-порта в `docker-compose.prod.yml`, healthcheck `redis-cli ping`, `cap_drop: ALL`, `no-new-privileges`).
  - **Спецификация:** `.agents/backend/security-jwt.md` (Секция 5).
- [ ] **Обязательная статья в `this-project` (`apps/web/content/this-project/backend-architecture/redis-rate-limiting-cache-and-session-revocation.{en,ru,uk}.mdx`):**
  - Раздел **«Pre-Flight Readiness Checklist: что проверить ДО внедрения Redis»** + разбор реализации `RedisModule`, Lua rate-limiter, Cache-Aside + TTL Jitter и `maxmemory-policy allkeys-lru`.

---

### Приоритет №3: Визуальный редизайн (`UI v2`) + Интерактивная лаборатория `/[locale]/lab` (XYFlow & Sandboxes)

> База знаний (`/knowledge-base`) остаётся быстрой статической документацией (0 KB лишнего JS, удобно копировать статьи как промпты), а тяжёлые интерактивные библиотеки переезжают в выделенный полноэкранный раздел `/lab`.

- [ ] **Авторский редизайн Workfolio (`UI v2`):** глубокое визуальное и типографическое переосмысление поверх готового фундамента (`Tailwind CSS v4`, 2D-палитры, Zero-CLS шрифты, `@starting-style`, `@container`), включая точечное применение примитивов React 19.2+ (`<Activity>`, `useEffectEvent`, опциональные `<ViewTransition>`), Mobile-First от `360px`.
- [ ] **Новый роут `/[locale]/lab` (Engineering Lab / Interactive Playground):**
  - **Зачем:** отделить тяжёлые интерактивные песочницы от текстовых `.mdx`-статей, получить полноэкранный canvas вместо узкой `prose`-колонки и изолировать бандлы через route-level code-splitting.
  - **Структура (FSD-Modular):** новый слайс `apps/web/src/features/interactive-labs/*` + реестр `entities/interactive-lab/lab-registry.ts` + роуты `apps/web/src/app/[locale]/lab/page.tsx` и `apps/web/src/app/[locale]/lab/[slug]/page.tsx`, кнопка перехода в шапке (`APP_ROUTES.lab`).
  - **Двусторонняя синхронизация `Knowledge Base ↔ Lab` (без ручного дублирования и битых ссылок):**
    - Единый типизированный реестр `LAB_REGISTRY` хранит `slug`, локализованные метаданные, `relatedArticlePaths` (массив `routePath` из Базы Знаний) и `backendCapabilities` (например, `['redisCache']`).
    - **`KB ➔ Lab` (автоматически):** на странице статьи `[...slug]/page.tsx` сервер вызывает `getLabsForArticle(article.routePath)` и автоматически рендерит карточку-переход **«Open Interactive Lab ➔ `/lab/<slug>?from=<routePath>`»** без ручных правок в 3 локалях `.mdx` (плюс опциональная директива `::lab{slug="..."}` для точечной вставки в текст).
    - **`Lab ➔ KB`:** внутри `/lab/[slug]` отображается кнопка возврата `← Back to Article` (из `?from=...`), боковая панель со всеми `relatedArticlePaths`, а в `XYFlow` клик по конкретному узлу открывает карточку со ссылкой на соответствующую статью.
    - **CI-страховка:** unit-тест в Vitest проверяет, что каждый `routePath` из `LAB_REGISTRY` существует среди реальных `.mdx`-файлов (0 битых ссылок при рефакторинге статей).
  - **Связка с бэкендом (`NestJS` + `Redis` + `PostgreSQL` + `SSE`) и Capability Gating:**
    - _Клиентские лаборатории (работают всегда, включая offline/demo):_
      1. `@xyflow/react` Interactive Architecture Canvas — drag-and-drop узлы, кастомные edges, режимы Monorepo / Request Lifecycle / Edge Auth, мини-карта, экспорт графа + переходы в `/knowledge-base/this-project/*`.
      2. React 19 Compiler & Render Tree Lab — расширение D3-демо в интерактивную песочницу мемоизации и TanStack Query кэша.
    - _Full-Stack лаборатории (поверх Приоритета №2 — Redis):_
      3. **Redis Rate Limiter & Cache-Aside Sandbox (`/lab/redis-playground`):** кнопка «Burst 10 requests» в песочный эндпоинт NestJS — в UI в реальном времени видны `Cache MISS (PostgreSQL)` ➔ `Cache HIT (Redis)` через `Server-Timing`, остаток окна лимитера, реальный `429 Too Many Requests` и живые события в SSE-логе (с graceful fallback в `In-Memory Simulation Mode` по `/api/capabilities`, если `REDIS_URL` не задан).
      4. _(Опционально)_ сохранение пользовательских пресетов/графов в PostgreSQL (Prisma) для `USER`/`ADMIN`.

---

### Приоритет №4: `S3/R2 Object Storage` (Фаза 1) + 4 инженерных «Вау-эффекта»

> **Перед стартом проверить:** Приоритеты №1 и №2 завершены, боевой HTTPS-домен работает стабильно, Redis активен для rate-limiting и кэширования новых эндпоинтов.

- [ ] **Фаза 1 — `S3-compatible Object Storage` (`@aws-sdk/client-s3` для `Cloudflare R2` + локальный `MinIO`):**
  - Оформить `StorageModule` через `ConfigurableModuleBuilder` (`forRoot` / `forRootAsync`, DI-токены в `storage.constants.ts`), выделить `StorageService` в `apps/api` (IAM least-privilege, Presigned URLs, проверка MIME/размера) и подключить `minio` в `docker-compose`.
  - Перевести на `StorageService` отдачу PDF-резюме (`/cv/*.pdf`) с graceful fallback на `public/cv/*.pdf`; переключить индикатор `s3ObjectStorage` на `/system-status`.
- [ ] **Вау-эффект №1 — Public Read-Only `@nestjs/mcp` Server (`Streamable HTTP`) + Live MCP Playground (`$0/мес`):**
  - Модуль `apps/api/src/modules/mcp/*` (строго Read-Only): `get_author_cv`, `query_adr_decisions`, `search_public_knowledge` (`this-project` only), `get_system_capabilities`; Zod-лимиты (`limit <= 16`, `query.max(60)`), `@Throttle` (`20 req/min` через Redis), вкладка **MCP Live Inspector** на `/[locale]/system-status`.
- [ ] **Вау-эффект №2 — Real User Monitoring (RUM) Core Web Vitals Pipeline:**
  - `web-vitals` + `navigator.sendBeacon` ➔ `POST /api/telemetry/vitals` (Zod + rate limit) ➔ агрегация p75 (LCP/INP/CLS/TTFB) в Redis/PostgreSQL + live SSE-трансляция на `/system-status`.
- [ ] **Вау-эффект №3 — Interactive Architecture Trace Explorer (`X-Request-Id` + `Server-Timing` Waterfall Drawer):**
  - Заголовок `Server-Timing` (`db;dur=..., tcp;dur=..., total;dur=...`) в `LoggingInterceptor`; кольцевой буфер последних 20 запросов в `apiClient` + Trace Drawer на `/system-status`.
- [ ] **Вау-эффект №4 — Live GitHub Engineering Pulse со Streaming `<Suspense>` + ISR (`revalidateTag`):**
  - Server-only `GITHUB_TOKEN`, `next: { revalidate: 3600 }`, Redis-кэш, **Circuit Breaker** против таймаутов внешнего API и Capability Gating.
- [ ] **Resilience Upgrade — Circuit Breaker для TCP-моста `telemetry-ms` (`apps/api/src/modules/telemetry/`):**
  - Лёгкий Circuit Breaker (`Closed -> Open 30s после 3 ECONNREFUSED/timeout -> Half-Open`) + вынос `TELEMETRY_MS_CLIENT` в `telemetry.constants.ts` ➔ падение задержки fallback с `800ms` до `<1ms`.

---

### Приоритет №5 (Deferred / Learning Track): Nginx Reverse Proxy (VPS) & Re-Scoped Postgres KB Index

> **Почему отложено в конец:** текущие `.mdx` статьи занимают `< 1 MB` (~96 файлов / 32 статьи × 3 локали), а Git + Zero-Eval HAST SSG даёт нулевой TTFB, PR-диффы и `$0` инфраструктуры. При росте до 500–1000+ файлов первый шаг — On-Demand ISR; перенос метаданных/поиска в Postgres `tsvector` — только при необходимости поиска по абзацам или серверной фильтрации RBAC.

- [ ] **Nginx Reverse Proxy (`docker-compose.prod.yml` — Self-Hosted / VPS Learning Track):**
  1. **Прямая маршрутизация `/api/*` из Nginx в `api:4000`** (убирает двойной хоп через Next.js `rewrites()`, сохраняет `TRUST_PROXY_HOPS=1` и разгружает сокеты `web` от SSE).
  2. **Удаление хост-портов у `api` и `web` в `docker-compose.prod.yml`** (единственная точка входа — Nginx `80`/`443`).
  3. **Заголовки доверия и защита от спуфинга IP:** `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`, `Host` (без недоверенного `X-Forwarded-Host`).
  4. **Long-Lived SSE (`location = /api/telemetry/stream`):** `proxy_http_version 1.1`, `Connection ''`, `proxy_buffering off`, `proxy_cache off`, `chunked_transfer_encoding off`, `proxy_read_timeout 16m`.
  5. **Порядок старта:** `depends_on` с `condition: service_healthy` для `web` и `api`.
  6. **Дополнительно:** TLS Termination, кэш `/_next/static/`, L7 `limit_req_zone`.
- [ ] **Re-Scoped DB-Backed Knowledge Base Search & Metadata Index (опционально — Фаза 2 CMS):**
  - Прагматичный вариант: `.mdx` в Git/SSG, а в PostgreSQL (`Prisma 7`) синхронизация метаданных/текста с `tsvector` + GIN для `GET /api/knowledge/search` поверх `KnowledgeSearchPayloadSchema`.

---

## 🔧 Инфраструктурный и Архитектурный Бэклог

### 1. Security & Auth Extensions (`apps/web`, `apps/api`)

- [ ] **Next-Gen Auth & Telegram Bot Access для закрытых разделов Базы Знаний (`apps/api`, `PostgreSQL`, `Telegram Bot API`):**
  1. `TELEGRAM_BOT_TOKEN`, 32+ символьный `TELEGRAM_WEBHOOK_SECRET`, опционально `TELEGRAM_ADMIN_CHAT_ID`; `grammy` (native ESM) или zero-dep `fetch` + модели в Prisma 7.
  2. Deep Link `https://t.me/<bot>?start=<nonce>` (`POST /api/auth/telegram/init` с `SHA-256` хэшем 24-байтного `nonce` TTL `10 мин` + QR-код; `POST /api/auth/telegram/exchange` ➔ `HttpOnly` JWT) + одноразовый хэшированный invite-код для рекрутеров без Telegram.
  3. Dev: Long Polling (`getUpdates`); Prod: `POST /api/auth/telegram/webhook` с `crypto.timingSafeEqual` по `X-Telegram-Bot-Api-Secret-Token`.
  4. Приватность, строгий `@Throttle` и Capability Gating при отсутствии `TELEGRAM_BOT_TOKEN`.
- [ ] **Throttler ESM Upgrade Cleanup (`apps/api`):** отслеживать переход `@nestjs/throttler` на нативный ESM и удалить временный CJS/ESM мост для `Reflector` в `apps/api/src/app.module.ts`.
- [ ] **`next-themes` React 19 Dev Warning Cleanup (`apps/web`):** отслеживать upstream-фикс `pacocoursey/next-themes#385` и удалить закомментированный блок из `apps/web/src/shared/providers/theme-provider.tsx`.

### 2. Observability & Deployment Extensions

- [ ] **Live Sentry & PostHog SDK:** заменить заглушки на реальные транспорты `@sentry/nextjs`, `@sentry/nestjs` и `posthog-js`, включаемые при наличии ключей в `.env`.
- [ ] **Расширение Capability-Gated UI для новых фич (Redis, S3/R2, MCP, GitHub Pulse, Telegram Bot):** показывать фичу `disabled` / `aria-disabled` с локализованной плашкой при отсутствии ключа.
- [ ] **Cross-Domain API Deployment (`NEXT_PUBLIC_API_URL`):** при выносе `apps/api` на отдельный домен добавить `NEXT_PUBLIC_API_URL` в `.env`, `.env.example`, `turbo.json`, пробросить `baseURL` в `apiClient` и `EventSource`, и добавить домен в CSP `connect-src`.
- [ ] **Article-Level OpenGraph Previews (`/knowledge-base/[...slug]/opengraph-image.tsx`):** опциональный генератор превью второго уровня из `title`, `category` и `#tags`.
- [ ] _(Отложено / `deferred`)_ **Живой агент `@nestjs/ai`:** не нужен, пока поиск закрывает `Cmd+K` и Read-Only MCP за `$0/мес`; при возврате — строго за `@UseGuards(JwtRolesGuard)` с `maxOutputTokens`.

---

## 📚 План наполнения контентом Базы Знаний (Content Expansion)

> Инфраструктура `.mdx` (`Zero-Eval HAST`) и клиентские острова полностью готовы. Тяжёлые песочницы развиваются в `/[locale]/lab` с двусторонними ссылками из статей.

- [ ] **Новые архитектурные статьи в `this-project/`:**
  1. `this-project/backend-architecture/redis-rate-limiting-cache-and-session-revocation.{en,ru,uk}.mdx` — **Redis & Pre-Flight Readiness Checklist** (создаётся в Приоритете №2).
  2. `this-project/frontend-architecture/system-status-observability-and-offline-query-cache.{en,ru,uk}.mdx` — **System Observability (`/system-status`), Capability-Gated UI, Offline `TanStack Query` + `IndexedDB` Allowlist, `BroadcastChannel` Sync & Native `next/root-params`** (плюс CJS/ESM `Reflector` мост в NestJS 12).
- [ ] **Цикл из 3 профильных статей по безопасности в `others/security/`:**
  1. `frontend-browser-security-playbook.{en,ru,uk}.mdx` — CSP, `HttpOnly`/`__Host-`, DOM/AST-санитизация, Open Redirect, Clickjacking, WebAuthn/Turnstile.
  2. `backend-api-gateway-security-playbook.{en,ru,uk}.mdx` — «7 ошибок JWT на код-ревью», `15m Access + Rotating Refresh`, Redis Rate Limiting, BOLA/IDOR, Race Conditions, Zod против Mass Assignment, MCP sandboxes.
  3. `devops-supply-chain-container-security.{en,ru,uk}.mdx` — Docker isolation, `non-root`/`cap_drop: ALL`/`read_only`, `allowBuilds`/`--ignore-scripts`, GitHub Actions hardening.
- [ ] **Расширение раздела «Архитектура» (`architecture-devops/`):**
  1. `architecture-devops/caching/caching-strategies-and-redis-patterns.{en,ru,uk}.mdx` — Top 5 Caching Strategies & Redis Patterns.
  2. `architecture-devops/networking/nginx-reverse-proxy-load-balancing-and-sse.{en,ru,uk}.mdx` — Top 8 NGINX Use Cases & SSE Streaming.
- [ ] **Свежие возможности `React 19.2+` в `react/react-19/`:**
  - `react/react-19/react-19-2-activity-effect-event-and-view-transitions.{en,ru,uk}.mdx` — `<Activity>`, `useEffectEvent`, `<ViewTransition>`, `React Performance Tracks`.
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
   - [ ] **Проверить `NEXT_PUBLIC_SITE_URL` в Vercel Environment Variables:** боевой HTTPS-домен без слэша на конце + пересборка, чтобы в `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `canonical` и `og:image` был реальный домен.
   - [ ] **Google Search Console:** добавить домен, подтвердить владение, отправить `https://<domain>/sitemap.xml` и запросить индексацию `/`, `/ua`, `/ru`, `/cv`, `/knowledge-base/this-project`.
   - [ ] **Трастовые внешние ссылки (`sameAs` Entity Graph):** добавить боевой URL в профиль GitHub (`github.com/Kri4evskiy`), About репозитория `greatest-portfolio`, LinkedIn (`in/kri4evskiy`), био Telegram (`@Kri4evskiy`) и шапку PDF-резюме (`public/cv/*.pdf`).
   - [ ] **Проверка превью и AI-манифеста:** открыть `https://<domain>/opengraph-image`, `/llms.txt`, `/robots.txt`, прогреть превью `1200×630` в Telegram Saved Messages и LinkedIn Post Inspector.
