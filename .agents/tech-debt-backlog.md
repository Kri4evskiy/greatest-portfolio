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

> **Зачем делать ДО Redis:** первый выход на боевой HTTPS (**Vercel Hobby + Koyeb Frankfurt + Neon.tech Frankfurt**) валидирует `HttpOnly; Secure` куки, CORS, CSP, `TRUST_PROXY_HOPS=2`, SEO (`sitemap.xml`, `robots.txt`, `og:image`, GSC) и реальный Lighthouse/CrUX до усложнения архитектуры кэшем Redis и S3.

- [ ] **Шаг 1 — Инфраструктурный деплой (выполняет пользователь, ~15–20 мин):**
  1. **Neon.tech (EU Frankfurt):** создать PostgreSQL (`?sslmode=require`), скопировать **Pooled** `DATABASE_URL` и **Direct** `DIRECT_URL`, накатить схему и сид снаружи (`pnpm --filter @repo/api prisma:push` + `pnpm --filter @repo/api prisma:seed` — `prisma.config.ts` использует `DIRECT_URL || DATABASE_URL`).
  2. **Backend на Koyeb (`https://app.koyeb.com`, Free Web Service, Frankfurt `fra`, 1 сервис без отдельного `telemetry-ms`):** развернуть `docker/api.Dockerfile` (Build context `.`, порт `4000`, HTTP Health Check `/api/health`), задать `NODE_ENV=production`, `PORT=4000`, `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` (`>= 32` символов), `ADMIN_SECRET_PASSCODE` (`>= 16` символов), `TRUST_PROXY_HOPS=2` (`Vercel Edge Rewrite + Koyeb Edge Proxy = 2 хопа`), временный `WEB_ORIGIN=http://localhost:3000` (без `WORKFOLIO_DEMO_MODE`). Проверить `https://<service>.koyeb.app/api/health` и `/api/capabilities` (`persistence: "postgresql"`). _(Альтернатива без карты: Render Free.)_
  3. **Frontend на Vercel Hobby:** подключить репозиторий (Node `22.x`, build command `pnpm turbo run build --filter=@repo/web...`), задать `API_INTERNAL_URL=https://<service>.koyeb.app`, `JWT_SECRET` (идентичный API!). После получения домена `https://<app>.vercel.app` добавить `NEXT_PUBLIC_SITE_URL=https://<app>.vercel.app` (без слэша на конце) и сделать **Redeploy**, чтобы SSG-артефакты (`sitemap.xml`, `canonical`, `og:url`) запеклись с реальным HTTPS-доменом (`NODE_ENV=production` Vercel выставляет автоматически; `APP_ENV` не требуется).
  4. **Замкнуть `WEB_ORIGIN`:** в Koyeb заменить `WEB_ORIGIN` с `http://localhost:3000` на `https://<app>.vercel.app` (авто-редеплой) и передать боевой HTTPS URL ИИ-агенту для Шага 2.
- [ ] **Шаг 2 — Автоматическая приёмка боевого деплоя (выполняет ИИ-агент через `run_command` + `browser`-субагент):**
  1. **HTTP Security & SEO Smoke-Check:** проверить отсутствие `localhost:3000` в `/robots.txt`, `/sitemap.xml`, `/llms.txt`; убедиться, что все URL из `sitemap.xml` отдают `200 OK` (ноль `307`!); проверить заголовки `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `Cross-Origin-Resource-Policy`, `X-Request-Id`; проверить `GET /api/health` и `GET /api/capabilities` (`mode: 'production'`, `persistence: 'postgresql'`); проверить `403` на неверный `adminPasscode`, `429` на превышение лимита, `Set-Cookie` с `HttpOnly; Secure; SameSite=Lax`, а также поведение `GET /api/telemetry/stream` (учесть, что Vercel Hobby `rewrites()` может обрывать долгий SSE через 30–60s — клиентский backoff в `use-telemetry-stream.ts` должен переподключаться без ошибок).
  2. **Live Browser E2E (`browser`-субагент):** пройти по `/`, `/cv` (проверить SSR-резюме), `/knowledge-base/this-project/...` (открывается без auth), закрытому разделу `/knowledge-base/react/...` (редирект ➔ `GuestPassModal` без подсказки `workfolio-admin-2026` ➔ вход ➔ доступ к статье), `/system-status` (`SSE LIVE`, 0 дублей событий, пагинация, 0 консольных ошибок), `/opengraph-image`.
  3. **Post-Deploy SEO Indexing (пользователь):** подключить домен в Google Search Console, отправить `sitemap.xml`, прописать боевой URL в GitHub / LinkedIn / Telegram / PDF-резюме (`sameAs` Entity Graph).

---

### Приоритет №2 (Сразу после боевого деплоя): Production Observability — Live Sentry (`web` + `api`), PostHog & Telegram Admin Ops Bot (Фаза 1)

> **Почему сразу после деплоя (Приоритет №2):** как только боевая ссылка пойдёт рекрутерам и тимлидам, критично видеть реальные ошибки на фронте и бэке, понимать, кто именно заходил и что смотрел, и получать мгновенные алерты прямо в свой приватный Telegram-канал за `$0/мес`.
> - **Sentry Free (Developer Plan):** 1 организация, 1 seat, **несколько проектов** (`workfolio-web` + `workfolio-api` с двумя отдельными DSN), общий пул `5 000` errors/мес, `5M` performance spans/мес, `50` replays/мес, 30 дней хранения (hard-cap).
> - **PostHog Free:** 1 проект (индустриальный стандарт продуктовой аналитики + Session Replays), `1 000 000` events/мес, `5 000` web replays/мес, `1 000 000` feature flags/мес, 1 год хранения (hard-cap).
> - **Telegram Bot API (`@GreatestWorkfolioBot`, 1 бот на всё):** 100% бесплатно; Фаза 1 — приватный Admin Ops канал (`TELEGRAM_ADMIN_CHAT_ID`), Фаза 2 — персональный Welcome и беспарольный вход для гостей через Deep Link (`?start=welcome_<nonce>` / `?start=auth_<nonce>`).
> - **📚 Обязательное напоминание для ИИ-агента при старте Приоритета №2 (и Telegram Фазы 2):** в начале реализации обязательно скинуть пользователю подборку ссылок (официальная документация Telegram Bot API Deep Linking `t.me/<bot>?start=<payload>` и `secret_token` webhooks, Sentry/PostHog Webhooks, а также проверенные инженерные статьи/разборы про паттерн _Passwordless Telegram Deep Link Auth + SSE tab unlock_), чтобы пользователь мог спокойно изучить механику.

- [ ] **Sentry Full-Stack (`@sentry/nextjs` + `@sentry/nestjs`):**
  - Подключить два проекта в одной бесплатной организации Sentry: `workfolio-web` (`NEXT_PUBLIC_SENTRY_DSN`) и `workfolio-api` (`SENTRY_DSN`).
  - Заменить обёртки-заглушки (`captureClientException`, `SentryExceptionFilter`) на реальный SDK с graceful no-op при пустом DSN, `sendDefaultPii: false`, корректными `CSP` (`connect-src` / `worker-src` / опциональный `tunnelRoute` против ad-blocker'ов) и upload source maps в CI/Vercel.
  - На бэкенде в `SentryExceptionFilter` крепить `X-Request-Id` (`scope.setTag('requestId', requestId)`) и контекст авторизованного пользователя (`id`, `username: displayName`, `role`, `visitorType`) для сквозной трассировки `Next.js ➔ NestJS`.
  - Автоматически переключить индикатор `sentryObservability` в `/system-status` на активный при заданном `SENTRY_DSN`.
- [ ] **PostHog Analytics + Session Replay + Учебная идентификация пользователей (`posthog-js`):**
  - Инициализация с `person_profiles: 'identified_only'` (анонимные визиты и боты не плодят мусорные профили и не тратят лишнюю квоту; хранятся агрегированно) и `session_recording: { maskAllInputs: true }` (чтобы никогда не записать `adminPasscode` или личные вводы).
  - **Правильный цикл идентификации (чтобы видеть имена и роли вместо голых UUID):**
    - Вынести единый `<ObservabilityIdentityBridge />` рядом с `AuthCrossTabSyncBridge` в корневом `[locale]/layout.tsx` (строго по FSD, без дублирования в компонентах).
    - При появлении авторизованной сессии (`profile.id && profile.role !== 'GUEST'` после `GuestPassModal` или восстановления через `/api/auth/me`) вызывать:
      - `posthog.identify(profile.id, { name: profile.displayName, visitorType: profile.visitorType, role: profile.role })` — PostHog автоматически склеивает всю анонимную историю кликов до логина с читаемым профилем (`Alex • Team Lead`), позволяя чётко разделять параллельных посетителей в дашборде и Session Replays.
      - `Sentry.setUser({ id: profile.id, username: profile.displayName ?? undefined })` + `Sentry.setTag('visitorType', ...)` / `Sentry.setTag('role', ...)` — любая пойманная ошибка сразу привязана к конкретному посетителю.
    - При выходе (`useLogoutMutation` / возврате `role === 'GUEST'`) обязательно вызывать `posthog.reset()` и `Sentry.setUser(null)` (чтобы следующий пользователь в том же браузере не склеился с предыдущим).
  - Перевести существующий хелпер `apps/web/src/shared/lib/analytics.ts` (`trackEvent`) на реальный `posthog.capture(...)` с graceful no-op без `NEXT_PUBLIC_POSTHOG_KEY`.
- [ ] **Telegram Admin Ops Channel — Фаза 1 (`TelegramNotifierService` в `apps/api`, zero-dep `fetch`):**
  - Один бот `@GreatestWorkfolioBot` (`TELEGRAM_BOT_TOKEN` + `TELEGRAM_ADMIN_CHAT_ID`, опционально `message_thread_id` для топиков `#errors` / `#visitors` / `#alerts`), graceful no-op без токена + in-memory cooldown/dedup против флуда одинаковых ошибок.
  - Отправлять в твой приватный канал: новые входы визиторов (`GuestPass`), `ADMIN_ESCALATION_FAILED`, реакции `ARTICLE_HELPFUL`, а также входящие вебхуки **Sentry (`POST /api/webhooks/sentry` с проверкой HMAC-SHA256 `Sentry-Hook-Signature` и кнопкой `[Open in Sentry]`)** и **PostHog Alerts (`POST /api/webhooks/posthog`)**.
- [ ] **Интеграция в `/system-status` и Admin-Only UI Guard:**
  - _(Опционально, через серверные Read-Only ключи с кэшем 5–10 мин)_ добавить в `apps/api` безопасный агрегатор: публичная сводка на `/system-status` (`unresolvedIssues24h` без стектрейсов и PII + агрегированные счётчики), а детальный список ошибок/профилей, `GET /api/telemetry/admin-diagnostics` и прямые deep-links в Sentry/PostHog — строго под `@Roles('ADMIN')`.
  - **Admin-Only UI Guard на `/system-status`:** на клиенте запрашивать приватные админ-метрики строго при `enabled: profile?.role === 'ADMIN'` (для `GUEST` и `USER` запросы вообще не отправляются — ноль лишних `403` в Network), а вместо данных показывать заблюренную плашку (`Admin-Only Diagnostics`) с кнопкой открытия `GuestPassModal` для входа по `ADMIN_SECRET_PASSCODE`.
- [ ] **Две обязательные статьи-шпаргалки в Базе Знаний по новому UI 2025/2026 (`en` / `ru` / `uk`):**
  1. `architecture-devops/observability/sentry-modern-ui-and-fullstack-tracing.{en,ru,uk}.mdx` — **Sentry (новый UI 2025/2026):** пошаговый разбор вкладок `Issues` (`Issue Views`), `Explore`, `Insights`, новая архитектура `Monitors` + `Alerts`, чтение Stack Trace + Breadcrumbs + `X-Request-Id`, Source Maps и REST API/Webhooks.
  2. `architecture-devops/observability/posthog-modern-ui-identification-and-replays.{en,ru,uk}.mdx` — **PostHog (новый 5-секционный UI 2025/2026):** разбор `Home`, `Analytics` (`Web Analytics` vs `Product Analytics` + `HogQL SQL`), `People ➔ Persons` (`identify()` + `reset()` + `identified_only`), `Session Replay` (`maskAllInputs`), `Alerts` и Query API.

---

### Приоритет №3: Внедрение Redis (Distributed Rate Limiting, Response Cache & Session Revocation)

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

### Приоритет №4: Визуальный редизайн (`UI v2`) + Интерактивная лаборатория `/[locale]/lab` (XYFlow & Sandboxes)

> База знаний (`/knowledge-base`) остаётся быстрой статической документацией (0 KB лишнего JS, удобно копировать статьи как промпты), а тяжёлые интерактивные библиотеки переезжают в выделенный полноэкранный раздел `/lab`.

- [ ] **Авторский редизайн Workfolio (`UI v2`) + Feature Discoverability UX:**
  - **Полная мастер-спецификация (ОБЯЗАТЕЛЬНО прочитать перед стартом!):** `.agents/frontend/ui-v2-redesign-spec.md`.
  - Кратко: переход от шаблонного «коробочного» `shadcn/ui` к _Editorial Craft × Linear Precision_ — «Border Diet» (убрать ~70% рамок/бейджей и `<ShieldCheck />` из опыта), чистый 3-зонный хедер без замка и тулбар-шума, 2-колоночный Statement Hero + `Live System Bento Card`, Hairline Skills Table, 2-колоночный Experience Timeline, Editorial Work Archive, Discoverability-плашка на `/cv`, Colophon-футер, один сдержанный `--brand-accent`, опциональный Editorial Serif, примитивы React 19.2+ (`<Activity>`, `useEffectEvent`, `<ViewTransition>`), поэтапно в 5 батчей с QA на `360px–1440px`.
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
    - _Full-Stack лаборатории (поверх Приоритета №3 — Redis):_
      3. **Redis Rate Limiter & Cache-Aside Sandbox (`/lab/redis-playground`):** кнопка «Burst 10 requests» в песочный эндпоинт NestJS — в UI в реальном времени видны `Cache MISS (PostgreSQL)` ➔ `Cache HIT (Redis)` через `Server-Timing`, остаток окна лимитера, реальный `429 Too Many Requests` и живые события в SSE-логе (с graceful fallback в `In-Memory Simulation Mode` по `/api/capabilities`, если `REDIS_URL` не задан).
      4. _(Опционально)_ сохранение пользовательских пресетов/графов в PostgreSQL (Prisma) для `USER`/`ADMIN`.

---

### Приоритет №5: `S3/R2 Object Storage` (Фаза 1) + 4 инженерных «Вау-эффекта»

> **Перед стартом проверить:** Приоритеты №1–№3 завершены, боевой HTTPS-домен работает стабильно, Sentry/PostHog и Redis активны для мониторинга, rate-limiting и кэширования новых эндпоинтов.

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

### Приоритет №6 (Deferred / Learning Track): Nginx Reverse Proxy (VPS) & Re-Scoped Postgres KB Index

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

- [ ] **Telegram Bot — Фаза 2: Персональный Welcome + Беспарольный вход через Deep Link & SSE (`@GreatestWorkfolioBot`, `apps/api`, `PostgreSQL`):**
  1. Переиспользовать того же бота из Приоритета №2 (`TELEGRAM_BOT_TOKEN`, 32+ символьный `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_ADMIN_CHAT_ID`); `grammy` (native ESM) или zero-dep `fetch` + модели одноразовых токенов в Prisma 7.
  2. **Два сценария Deep Link (обход антиспам-запрета Telegram писать первым по `@username`/телефону):**
     - `?start=welcome_<nonce>`: кнопка _«Получить Welcome и PDF CV в Telegram»_ ➔ пользователь жмёт `Start` ➔ бот присылает персональное приветствие по имени из `VisitorSession` с Inline-кнопками (`PDF CV`, `16 ADR`, `Написать @Kri4evskiy`).
     - `?start=auth_<nonce>`: _«Войти в 1 клик через Telegram»_ (`POST /api/auth/telegram/init` сохраняет `SHA-256` хэш 24-байтного `nonce` на `10 мин` + QR-код) ➔ пользователь жмёт `Start` ➔ бот шлёт Welcome, а вкладка на сайте **автоматически разблокируется через SSE** (`POST /api/auth/telegram/exchange` ➔ `HttpOnly` JWT) + резервный одноразовый invite-код для рекрутеров без Telegram.
  3. Dev: Long Polling (`getUpdates`); Prod: `POST /api/auth/telegram/webhook` с `crypto.timingSafeEqual` по `X-Telegram-Bot-Api-Secret-Token`.
  4. Приватность, строгий `@Throttle`, Capability Gating при отсутствии `TELEGRAM_BOT_TOKEN` и **обязательная подборка ссылок/статей пользователю** для изучения паттерна.
- [ ] **Throttler ESM Upgrade Cleanup (`apps/api`):** отслеживать переход `@nestjs/throttler` на нативный ESM и удалить временный CJS/ESM мост для `Reflector` в `apps/api/src/app.module.ts`.
- [ ] **`next-themes` React 19 Dev Warning Cleanup (`apps/web`):** отслеживать upstream-фикс `pacocoursey/next-themes#385` и удалить закомментированный блок из `apps/web/src/shared/providers/theme-provider.tsx`.

### 2. Observability & Deployment Extensions

- [ ] **Расширение Capability-Gated UI для новых фич (Redis, S3/R2, MCP, GitHub Pulse, Telegram Bot):** показывать фичу `disabled` / `aria-disabled` с локализованной плашкой при отсутствии ключа.
- [ ] **Cross-Domain API Deployment (`NEXT_PUBLIC_API_URL`):** при выносе `apps/api` на отдельный домен добавить `NEXT_PUBLIC_API_URL` в `.env`, `.env.example`, `turbo.json`, пробросить `baseURL` в `apiClient` и `EventSource`, и добавить домен в CSP `connect-src`.
- [ ] **Article-Level OpenGraph Previews (`/knowledge-base/[...slug]/opengraph-image.tsx`):** опциональный генератор превью второго уровня из `title`, `category` и `#tags`.
- [ ] _(Отложено / `deferred`)_ **Живой агент `@nestjs/ai`:** не нужен, пока поиск закрывает `Cmd+K` и Read-Only MCP за `$0/мес`; при возврате — строго за `@UseGuards(JwtRolesGuard)` с `maxOutputTokens`.

---

## 📚 План наполнения контентом Базы Знаний (Content Expansion)

> Инфраструктура `.mdx` (`Zero-Eval HAST`) и клиентские острова полностью готовы. Тяжёлые песочницы развиваются в `/[locale]/lab` с двусторонними ссылками из статей.

- [ ] **Новые архитектурные статьи в `this-project/`:**
  1. `this-project/backend-architecture/redis-rate-limiting-cache-and-session-revocation.{en,ru,uk}.mdx` — **Redis & Pre-Flight Readiness Checklist** (создаётся в Приоритете №3).
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

1. **Neon.tech (EU Frankfurt):** создать БД с `?sslmode=require`, накатить схему локально (`pnpm --filter @repo/api prisma:push` + `prisma:seed`, т.к. прод-образ `api` очищен через `pnpm prune --prod`).
2. **Backend на Koyeb (`docker/api.Dockerfile`, Frankfurt `fra`, порт `4000`, healthcheck `/api/health`):** задать `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` (`>= 32` символов, не dev-дефолт), `ADMIN_SECRET_PASSCODE` (`>= 16` символов, не dev-дефолт), `TRUST_PROXY_HOPS=2` (`Vercel rewrite -> Koyeb`; `1` — только при прямом доступе без Vercel rewrite), `WEB_ORIGIN=https://<vercel-app>`, `NODE_ENV=production` (отдельный `telemetry-ms` на Free Tier не требуется).
3. **Frontend (`Vercel Hobby`):** Node `22.x` (`Corepack` подхватит `"packageManager": "pnpm@12.21.0"` и `pnpm-workspace.yaml`), build command `pnpm turbo run build --filter=@repo/web...`, env `NEXT_PUBLIC_SITE_URL=https://<vercel-domain>`, `API_INTERNAL_URL=https://<service>.koyeb.app`, `JWT_SECRET` (идентичный `api`!).
4. **Обязательный Post-Deploy SEO & Indexing Checklist (Агент обязан напомнить пользователю сразу после деплоя на Vercel):**
   - [ ] **Проверить `NEXT_PUBLIC_SITE_URL` в Vercel Environment Variables:** боевой HTTPS-домен без слэша на конце + пересборка, чтобы в `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `canonical` и `og:image` был реальный домен.
   - [ ] **Google Search Console:** добавить домен, подтвердить владение, отправить `https://<domain>/sitemap.xml` и запросить индексацию `/`, `/ua`, `/ru`, `/cv`, `/knowledge-base/this-project`.
   - [ ] **Трастовые внешние ссылки (`sameAs` Entity Graph):** добавить боевой URL в профиль GitHub (`github.com/Kri4evskiy`), About репозитория `greatest-portfolio`, LinkedIn (`in/kri4evskiy`), био Telegram (`@Kri4evskiy`) и шапку PDF-резюме (`public/cv/*.pdf`).
   - [ ] **Проверка превью и AI-манифеста:** открыть `https://<domain>/opengraph-image`, `/llms.txt`, `/robots.txt`, прогреть превью `1200×630` в Telegram Saved Messages и LinkedIn Post Inspector.
