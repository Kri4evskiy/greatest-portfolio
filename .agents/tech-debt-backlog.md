# 🛠️ Tech Debt & Post-MVP Backlog

## 📌 Текущая база (Production Baseline)

Архитектурное ядро находится в продакшен-состоянии (`v0.8.0`; подробности и 16 ADR лежат в `.agents/frontend/*`, `.agents/backend/*`, `.agents/architecture/*` и статьях базы знаний):
- **Monorepo & DX:** `pnpm 12.21.0` + `Turborepo` + `TypeScript 7.0.2` (native Go compiler) + `Biome 2.6.4` + `Lefthook` · `@repo/shared-schemas` (`Zod v4`) + `@repo/ui` (`Tailwind CSS v4.3.5` + `Storybook 10` (100% coverage)) · Multi-stage `Docker` + `GitHub Actions CI/CD`.
- **Frontend (`apps/web`):** `Next.js 16.4.6` (`React 19 Compiler`) · архитектура `FSD-Modular` (`app` ➔ `widgets` ➔ `features` ➔ `entities` ➔ `shared`) · `next-intl` (`EN/UK/RU`, `167` SSG-роутов) · 2D Appearance (`Mode × Palette` + Zero-FOUC `PALETTE_INIT_SCRIPT` + cross-tab sync в `ThemeProvider` через `uiStore.getState().actions.syncPaletteFromStorage()`) · self-hosted Zero-CLS `Inter` + `JetBrains Mono` (`next/font/google`) · `@starting-style` + `@container` · `Zero-Eval HAST MDX Engine` (`remark-directive` `:::sandbox` + `remark-rehype` + `hast-util-to-jsx-runtime` + `mtimeMs` кэш + `Dual-Theme Shiki`) · `KnowledgeDirectoryExplorer` (инкрементальный `Show more` разделов по 6, свёртывание подтем `> 6` и Топ-10 `#тегов` с поиском) · `Cmd+K` SSG-индекс · `TanStack Query v5` (`IndexedDB`) · `D3.js` клиентские острова · `Edge Web Crypto JWT` + строгий `CSP` (`font-src 'self' data:`).
- **Backend (`apps/api` & `apps/telemetry-ms`):** `NestJS 12 ESM` (4-компонентная Enterprise-структура `common`/`config`/`migrations`/`modules`, fail-fast Zod env validation & timing-safe auth) + `Prisma 7` (`7.10.1`, Rust-free Wasm + Native ESM + `@prisma/adapter-pg`, с In-Memory fallback и CLI `prisma:seed`) + общие Zod-схемы Offset/Cursor пагинации (`@repo/shared-schemas`) и эндпоинты `GET /api/knowledge/metrics/paginated` / `GET /api/telemetry/events` + `HttpOnly JWT` + `Helmet` + `@nestjs/throttler` + изолированный TCP-микросервис телеметрии (`:4001`) с `SSE`-стримингом.

---

## 🔥 Приоритетная очередь разработки (Next Up)

### Приоритет №1: Production SEO (`robots.ts` / `sitemap.ts`), Локализованные Error/404 и Zero-Friction `Docker Compose` Demo

- [ ] **Технический SEO-минимум и границы ошибок (`apps/web/src/app`):**
  1. `apps/web/src/app/robots.ts` и `sitemap.ts`: генерация правил индексации и карты всех **167 SSG-роутов** с `alternates.languages` (`hreflang` для `en` / `ua` / `ru`) + `metadataBase`.
  2. Локализованные `apps/web/src/app/[locale]/not-found.tsx` и `error.tsx` в дополнение к root `global-error.tsx`.
     _(Динамические `opengraph-image.tsx` / `icon.tsx` вынесены в отдельную задачу бэклога ниже — логично делать их в связке с `UI v2`, чтобы не перерисовывать карточку дважды.)_
- [ ] **`docker-compose.yml` Zero-Friction Demo для тимлида vs Strict Production (`docker-compose.prod.yml`):**
  - **Проблема сейчас:** в `docker-compose.yml` задан `NODE_ENV: production`, но не передан `JWT_SECRET` и оставлен дефолтный `ADMIN_SECRET_PASSCODE`, из-за чего `docker compose up --build` у тимлида (без `.env` и `pnpm install`) упадёт на fail-fast проверке в `apps/api/src/config/app.config.ts`.
  - **Целевое разделение:**
    1. `docker-compose.yml` (**Local Reviewer Demo**): явный opt-in флаг `WORKFOLIO_DEMO_MODE=true` с согласованным demo `JWT_SECRET` между `api` и `web`, явным предупреждением в логах при старте; основное ядро (CV + База Знаний + Guest Pass + SSE) поднимается одной командой без API-ключей, а внешние интеграции без ключей остаются **заблокированы через Capability Gating** с плашкой «нет API-ключа».
    2. `docker-compose.prod.yml` (**Real Production**): demo-режим строго запрещён (`WORKFOLIO_DEMO_MODE` отсутствует), обязательные секреты форсируются уже на этапе парсинга Compose (`${JWT_SECRET:?Set JWT_SECRET (>=32 chars)}` и `${ADMIN_SECRET_PASSCODE:?...}`) + fail-fast проверкой в NestJS.
    3. Обновить команды и пояснения в `README.md`.

### Приоритет №2: Внедрение Redis (Distributed Rate Limiting & Response Cache)

- [ ] **Архитектурное внедрение Redis (`apps/api`, `docker-compose.yml`):**
  - **Зачем:**
    1. _Distributed Rate Limiting:_ масштабирование защиты от брутфорса (`POST /api/auth/login`, `POST /api/auth/guest-pass`) при работе нескольких реплик API.
    2. _Response Caching (Cache-Aside):_ кэширование аналитических эндпоинтов (`GET /api/knowledge/stats`) с TTL 60 сек, снижающее нагрузку на PostgreSQL (Neon.tech) на 95%.
    3. _Session Revocation:_ фундамент для мгновенного отзыва скомпрометированных сессий и Refresh-токенов (`VisitorSession`).
  - **Паттерн Graceful In-Memory Fallback:** если переменная `REDIS_URL` отсутствует в `.env`, система автоматически и без ошибок откатывается на встроенный `In-Memory Throttler` и прямое чтение из БД.
  - **Инфраструктура и пакетная модель:**
    - _Docker:_ `redis:7-alpine` (~30 МБ) в приватной сети `backend-network` (`127.0.0.1:6379:6379`, healthcheck `redis-cli ping`).
    - _Архитектурная развилка:_ прямое подключение `ioredis` + `@nest-lab/throttler-storage-redis` + `@nestjs/cache-manager` в `apps/api` либо выделение пакета `packages/redis` (`@repo/cache`) для переиспользования между `apps/api` и `apps/telemetry-ms`.
  - **Спецификация:** `.agents/backend/security-jwt.md` (Секция 4).

### Приоритет №3: Автоматическое тестирование (`Vitest` + `Playwright` в CI)

- [ ] **Unit & Integration Tests (`Vitest`):** тесты Zod v4 схем (`@repo/shared-schemas`), Zustand-сторов (`uiStore` / `use-ui-store.ts`, `palette.ts`) и NestJS-сервисов (`AuthService`, `app.config.ts`) + интеграция джобы `unit-tests` в Stage 1 CI (`turbo run test --affected`). _(Строго `Vitest`, без `Jest`/`ts-jest`: `ts-jest` ограничен `typescript <7` и завязан на legacy JS Compiler API, тогда как `Vitest` нативно совместим с `TypeScript 7`.)_
- [ ] **E2E Playwright Suite:** проверка RBAC-флоу (`GuestPassModal` → `HttpOnly` кука → чтение `.mdx` → маскирование `<Redact />`) + джоба `e2e` после `build` в CI (и синхронизация карточки `playwright-vitest-ci` в `engineering-roadmap.ts`).

### Приоритет №4: Переосмысление визуального дизайна (Mobile-First Editorial `UI v2`)

- [ ] **Авторский редизайн Workfolio (`UI v2`):** глубокое визуальное и типографическое переосмысление интерфейса поверх уже готового фундамента (`Tailwind CSS v4`, 2D-палитры `Warm Paper / Graphite / Sepia`, Zero-CLS шрифты `Inter` + `JetBrains Mono`, `@starting-style`, `@container` и опциональные `View Transitions`), строго следуя `.agents/frontend/*` (Mobile-First с опорой на `360px`, чистая иерархия, продуманные карточки и таблицы без визуального шума).

### Приоритет №5 (Full-Stack Backend Track): DB-Backed Knowledge Base CMS (`NestJS Entities` + `Prisma 7` + `R2/MinIO` + Server-Side Pagination)

- [ ] **Полноценный CMS-бэкенд для Базы Знаний с реальной пагинацией из БД и объектным хранением `.mdx`:**
  1. **Цель и контекст (результаты аудита диска):** перенести каталог и выдачу Базы Знаний на реальные SQL-запросы к PostgreSQL через NestJS 12, чтобы кнопки `Показать ещё разделы`, `Показать ещё` внутри подтем (`4+` карточек) и фильтрация/поиск `#тегов` выполняли настоящие запросы на бэкенд, а `.mdx`-тела статей и медиафайлы хранились в `Cloudflare R2` / `MinIO` без пересборки всего фронтенда при добавлении новых заметок. _(Фактический аудит репозитория: текущие `.mdx` в `apps/web/content` занимают лишь ~699 KB; основной объём диска съедает локальный кэш `.turbo` — ~6.4 GB — и общий `node_modules` ~1.22 GB, поэтому `.turbo` достаточно периодически очищать.)_
  2. **Реляционная схема `Prisma 7` (`apps/api/prisma/schema.prisma`) — новые Entities:**
     - `KnowledgeTopic` (`id`, `slug @unique`, `order`, `icon`, локализованные заголовки `titleEn`/`titleRu`/`titleUk`, связь `1:N` ➔ `KnowledgeSubtopic`).
     - `KnowledgeSubtopic` (`id`, `topicId`, `slug`, `order`, локализованные заголовки `titleEn`/`titleRu`/`titleUk`, `@@unique([topicId, slug])`, `@@index([topicId, order])`, связь `1:N` ➔ `KnowledgeArticle`).
     - `KnowledgeArticle` (`id`, `subtopicId`, `slug`, `routePath @unique`, `locale`, `format`, `title`, `sidebarLabel`, `summary`, `readingTime`, `order`, `status`: `DRAFT | PUBLISHED | ARCHIVED`, `storageKey` для тела `.mdx` в R2/MinIO, `contentHash` SHA-256 для ETag/инвалидации кэша, `byteSize`, связь с `ArticleMetrics`, `@@index([subtopicId, locale, status, order])`).
     - `KnowledgeTag` (`id`, `slug @unique`, `label`, `usageCount`) + join-таблица `KnowledgeArticleTag` (`@@id([articleId, tagId])`, `@@index([tagId])`) для быстрого `Топ-10` и SQL-фильтрации `M:N`.
  3. **Модули `NestJS 12` и API-контракты (`apps/api/src/modules/knowledge-cms/*` + `@repo/shared-schemas`):**
     - Enterprise-декомпозиция сервисов: `TopicsService`, `SubtopicsService`, `ArticlesService`, `TagsService`, `StorageService` (`@aws-sdk/client-s3` для R2/MinIO).
     - Переиспользование уже готовых Zod-контрактов `OffsetPaginationQuerySchema` и `CursorPaginationQuerySchema` из `@repo/shared-schemas`:
       - `GET /api/knowledge/topics?limit=6&offset=0&locale=ru` — Offset-пагинация верхних разделов с превью первых подтем, `total` и `hasMore` для кнопки `Показать ещё разделы`.
       - `GET /api/knowledge/topics/:topicSlug/subtopics?limit=6&offset=0&locale=ru` — Offset-пагинация подтем внутри выбранного раздела.
       - `GET /api/knowledge/articles?topic=&subtopic=&tag=&format=&q=&limit=4&cursor=` — Cursor-пагинация (`take: limit + 1`) для сетки `4 карточки + Show more` в подтемах, серверной фильтрации по `#тегу`/формату и полнотекстового поиска PostgreSQL (`tsvector` + GIN-индекс).
       - `GET /api/knowledge/tags?limit=10&search=&offset=0` — серверный `Топ-10 #тегов` и серверный поиск с пагинацией при раскрытии панели «Все теги».
       - `GET /api/knowledge/articles/:routePath` — чтение метадаты из PostgreSQL + скачивание сырого `.mdx` из R2/MinIO с кэшированием скомпилированного HAST в Redis/памяти по `contentHash`.
       - Admin CRUD (`@Roles('ADMIN')`) + CLI-скрипт `sync:mdx-to-cms` для первичной и инкрементальной синхронизации локальных `apps/web/content/**/*.mdx` в PostgreSQL + R2/MinIO.
  4. **Frontend-интеграция (`apps/web`, FSD-Modular + `TanStack Query v5`):**
     - **SSR/ISR HydrationBoundary + `useInfiniteQuery`:** серверный prefetch первой порции (6 разделов + Топ-10 тегов) для мгновенного первого экрана и SEO, а догрузка по кнопкам `Показать ещё` (разделы, подтемы, сетка 4+ статей) — через `useInfiniteQuery` в `apps/web/src/entities/knowledge-article/queries/` с реальными запросами в Network Tab.
     - **Debounced (`250ms`) серверный поиск по `#тегам`** в раскрывающейся панели с кэшированием в `TanStack Query`.
     - **On-Demand ISR (`revalidateTag`)** при создании/обновлении статьи в Admin API или синхронизации с R2.
     - **Graceful Air-Gapped Fallback:** если `DATABASE_URL` или S3/R2-ключи не заданы, UI без ошибок работает на локальном SSG-движке `apps/web/content/*.mdx` (в единой модели Capability Gating).

---

## 🔧 Инфраструктурный и Архитектурный Бэклог

### 1. CI/CD, Turborepo Cache & DX Optimization

- [ ] **CI Security & Workflow Hardening:** добавить еженедельный `schedule:` крон для `pnpm audit --prod --audit-level=high` + `.github/dependabot.yml` (`npm` и `github-actions`), выставить `persist-credentials: false` на `actions/checkout@v6`, добавить `actionlint` в `lint` и при росте UI-кита подключить кэш `.turbo` в джобу `storybook`.

### 2. Security & Production Hardening (`apps/web`, `apps/api`)

- [ ] **Access + Refresh JWT Rotation:** дополнить Edge HS256-верификацию парой короткоживущего `Access` (`15m`) + ротируемого `HttpOnly Refresh` (`7d`) токенов с хранением и отзывом сессий в `VisitorSession` (`PostgreSQL`). _(Готовая заготовка: при переходе `JwtRolesGuard` на глобальный `APP_GUARD` использовать `@Public()` из `common/decorators/public.decorator.ts` для открытых эндпоинтов.)_
- [ ] **Next-Gen Auth & Telegram Bot Access для Базы Знаний (`apps/api`, `PostgreSQL`, `Telegram Bot API`):** заменить открытую 1-click демо-заглушку на полноценную БД-авторизацию с хэшированными токенами и опциональной регистрацией через Telegram-бота:
  1. _Инфраструктура и переменные окружения:_ создать бота в `@BotFather` (`/newbot`) ➔ `TELEGRAM_BOT_TOKEN`, 32+ символьный `TELEGRAM_WEBHOOK_SECRET`, опционально `TELEGRAM_ADMIN_CHAT_ID`; в `apps/api` использовать `grammy` (native ESM + TypeScript) или zero-dep `fetch` + модели сессий/токенов в PostgreSQL (`Prisma 7`).
  2. _Антиспам-ограничение Telegram Bot API и обходные решения:_ бот **не имеет права** писать первым по номеру телефона или username (защита Telegram от спама). Рабочий прод-паттерн — **Deep Link `https://t.me/<bot>?start=<nonce>`**:
     - `POST /api/auth/telegram/init`: генерирует 24-байтный `base64url` `nonce`, сохраняет в БД **только** его `SHA-256` хэш с TTL `10 мин` (и `sessionId`/`clientId`), а на UI показывает кнопку «Продолжить в Telegram» (+ QR-код для десктопа).
     - Внутри Telegram пользователь жмёт `Start` (если нужна привязка телефона — бот показывает нативную кнопку `ReplyKeyboardMarkup` с `request_contact: true`; бэкенд **обязательно** проверяет `contact.user_id === message.from.id`, чтобы исключить подмену чужим контактом).
     - Бот отправляет подтверждение доступа прямо в чат пользователя (опционально — инлайн-кнопки `[✅ Approve] [❌ Reject]` админу в `TELEGRAM_ADMIN_CHAT_ID`), а сайт через SSE/polling получает одноразовый `exchangeToken` и обменивает его через `POST /api/auth/telegram/exchange` на `HttpOnly` JWT-куку `kb_access_token`.
     - _Fallback без Telegram:_ одноразовый invite-код (хранится как `SHA-256` / `Argon2id` / `scrypt` хэш в PostgreSQL с лимитом использований и TTL) для рекрутеров без Telegram.
  3. _Локальная разработка Webhook vs Polling:_ Telegram требует публичный `HTTPS` для webhook. Решение: в `NODE_ENV=development` (при наличии `TELEGRAM_BOT_TOKEN`) бот работает через **Long Polling (`getUpdates`)**, а в `NODE_ENV=production` — через `POST /api/auth/telegram/webhook` с `crypto.timingSafeEqual` проверкой заголовка `X-Telegram-Bot-Api-Secret-Token` (при необходимости тестирования webhook локально — через `cloudflared tunnel` / `ngrok`).
  4. _Приватность, Rate Limit и Capability Gating:_ номера телефонов никогда не логируются и не попадают в публичный SSE/`localStorage`; на `/init` и `/exchange` действует строгий `@nestjs/throttler`; если `TELEGRAM_BOT_TOKEN` не задан — кнопка в модалке остаётся видимой в состоянии `disabled` с явной плашкой _«Нет API-ключа для использования данного сервиса»_.
- [ ] **Throttler ESM Upgrade Cleanup (`apps/api`):** периодически проверять обновления `@nestjs/throttler` и после перехода пакета на нативный ESM (`"type": "module"`) удалить временный CJS/ESM мост для `Reflector` из `apps/api/src/app.module.ts`.
- [ ] **`next-themes` React 19 Dev Warning Cleanup (`apps/web`):** отслеживать upstream-фикс `pacocoursey/next-themes#385` под React 19 и удалить закомментированный блок подавления предупреждения из `apps/web/src/shared/providers/theme-provider.tsx`.

### 3. Observability, Cloud Storage & Self-Hosted Learning Track

- [ ] **Live Sentry & PostHog SDK:** заменить обёртки-заглушки на реальные транспорты `@sentry/nextjs`, `@sentry/nestjs` и `posthog-js`, включаемые при наличии ключей в `.env`.
- [ ] **Neon.tech Cloud Database Migration:** подключить боевой `DATABASE_URL` от Neon.tech PostgreSQL, прогнать `prisma migrate deploy` и сид (`pnpm --filter @repo/api prisma:seed` / `src/migrations/scripts/seed.ts`).
- [ ] **S3-compatible Object Storage (`Cloudflare R2` + локальный `MinIO` — Backend Learning & Showcase):** освоить и внедрить в `apps/api` интеграцию через `@aws-sdk/client-s3`:
  - _Зачем:_ практическое изучение работы с приватными объектными бакетами (`R2` / `MinIO`), IAM least-privilege ключами, генерацией краткоживущих **Presigned URLs** и безопасным бэкенд-стримингом/проксированием PDF-резюме и загружаемых ассетов с проверкой MIME-типов и размеров файлов. Единый `StorageService` / бакет обслуживает как CV (`/cv/*.pdf`), так и тела `.mdx`-статей + медиа-ассеты Базы Знаний для **Приоритета №5**.
  - _Локальная разработка:_ легковесный `minio` сервис в `docker-compose` + graceful fallback на локальный статический файл `/cv/*.pdf` и локальные `apps/web/content/*.mdx`, когда S3 env-переменные не заданы.
- [ ] **Nginx Reverse Proxy (`docker-compose.prod.yml` — Self-Hosted / VPS Learning Track):** настроить `Nginx` как единую точку входа (порты `80/443`, TLS) между внешними клиентами, фронтендом (`web:3000`) и бэкендом (`api:4000`) в качестве self-hosted/VPS альтернативы облачному Runbook (Vercel + Render):
  - отработать конфигурирование upstream-проксирования `/api/*` ➔ `api:4000`, отключение буферизации (`proxy_buffering off;`, `proxy_read_timeout`, `Connection ''`) для бесперебойных **SSE-стримов**, передачу `X-Forwarded-For` / `X-Real-IP` для `@nestjs/throttler` (`trust proxy: 1`), L7 rate limiting и базовую защиту заголовков.
- [ ] **Dual-Mode Air-Gapped Local Environment и Capability-Gated UI («Тумблер офлайна»):** развивать единый graceful-режим для всех _будущих_ внешних сервисов (`Redis`, `S3/R2/MinIO`, `Sentry`, `PostHog`, `Telegram Bot API`), не ломая уже автономное ядро (`In-Memory Prisma`, `In-Memory Throttler`, self-hosted `.woff2` шрифты, локальный MDX/Shiki):
  - бэкенд отдаёт безопасные булевы флаги доступности интеграций (например, `{ telegramAuth, s3Storage, redisCache }` через `/api/health` или `/api/capabilities` — **никогда** не передавая сами ключи на клиент);
  - если у интеграции (например, `TELEGRAM_BOT_TOKEN` или S3-ключей) не задан API-ключ, интерфейс **показывает** саму фичу, блокирует триггер (`disabled` / `aria-disabled`) и выводит локализованную плашку: _«Нет API-ключа для использования данного сервиса»_.
- [ ] **Cross-Domain API Deployment (`NEXT_PUBLIC_API_URL`):** при выносе `apps/api` на отдельный домен добавить `NEXT_PUBLIC_API_URL` в `.env`, `.env.example`, `turbo.json` (`globalEnv`), перевести клиентские `fetch` / `EventSource` на `NEXT_PUBLIC_API_URL` с фолбэком на `''` и прокинуть домен в CSP `connect-src`.

### 4. Frontend SEO & Branded Social Cards (`apps/web` — в связке с `UI v2`)

- [ ] **Dynamic OpenGraph Image, Twitter Card & App Icons (`opengraph-image.tsx` + `icon.tsx`):** вынесено в отдельную задачу после обновления дизайна `UI v2`, чтобы не перерисовывать карточку дважды.
  - **Что нужно для реализации в Next.js 16:**
    1. `apps/web/src/app/[locale]/opengraph-image.tsx` (и при желании `twitter-image.tsx`) на базе `next/og` (`ImageResponse` / Satori) размером `1200×630` PNG + экспортами `alt`, `size`, `contentType` — чтобы при отправке ссылки в **Telegram, LinkedIn, Slack или X** вместо пустой ссылки отображалась фирменная карточка-превью с именем, позицией и стеком.
    2. `apps/web/src/app/icon.tsx` (`32×32`) + `apple-icon.tsx` (`180×180`) и корректный `metadataBase` (`new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000')`) в `layout.tsx`, иначе абсолютные `og:image` URL при деплое собираются с `localhost`.
    3. _Нюанс Satori + Air-Gapped / CSS-токены:_ `ImageResponse` не поддерживает `var(--background)` / CSS-переменные и внешние Google Fonts в офлайне — цветовые константы нужно передавать инлайн-стилями (Satori subset flexbox), а шрифт `Inter` грузить локальным буфером `.ttf` / `.otf` / `.woff` через `node:fs/promises` (`.woff2` Satori не парсит!).
    4. _2 уровня генерации:_ сначала корневая карточка для `/` и `/cv`, затем опционально `opengraph-image.tsx` внутри `/knowledge-base/[...slug]/` с `generateStaticParams` (автогенерация превью из `title`, `category` и `tags` каждой статьи — сейчас 167 SSG-роутов).

### 5. Backend AI & Model Context Protocol (`apps/api` — Future Milestone)

- [ ] **Read-Only шоукейс `@nestjs/mcp` (`$0` за токены, статус `evaluating`):** публичный MCP (`Streamable HTTP`) с 16 ADR, опытом CV и `TL;DR` статей для `Cursor` / `Claude Desktop` — строго **Read-Only**, строго после `@nestjs/throttler`, с лимитами Zod (`limit <= 16`, `.max(60)`) и соблюдением `<Redact />`.
- [ ] _(Отложено / `deferred`)_ **Живой агент `@nestjs/ai`:** не нужен, пока поиск закрывает `Cmd+K` за $0/мес; при возврате — строго за `@UseGuards(JwtRolesGuard)` с `maxOutputTokens`.

---

## 📚 План наполнения контентом Базы Знаний (Content Expansion)

> Инфраструктура рендеринга `.mdx` (`Zero-Eval HAST`) и механизм встраивания ленивых клиентских островов (`features/kb-sandboxes/ui/mdx-client-widgets.tsx` через `<Widget />` или директиву `:::sandbox{name="..."}`) **полностью реализованы**. Задачи ниже — это написание новых инженерных конспектов (при необходимости к любой новой статье можно добавить специализированный интерактивный демо-остров в `MDX_WIDGET_REGISTRY`).

- [ ] **Цикл из 3 профильных статей по безопасности в `others/security/` (в дополнение к обзорному манифесту Zero-Trust):**
  1. `frontend-browser-security-playbook.{en,ru,uk}.mdx` — **Frontend & Browser Defense:** углублённый разбор CSP (`nonce` vs `SSG`, `Trusted Types`, `SRI`), `HttpOnly`/`__Host-` кук, DOM/AST-санитизации, защиты от Open Redirect, Clickjacking и методов борьбы с мультимодальными AI-ботами (WebAuthn Passkeys, Turnstile, PAT вместо визуальных CAPTCHA).
  2. `backend-api-gateway-security-playbook.{en,ru,uk}.mdx` — **Backend & API Defense:** защита от распределённого AI-фаззинга (Sliding-Window Redis Rate Limiting + Tarpitting), ротация и отзыв `Access/Refresh` токенов, защита от BOLA/IDOR и Race Conditions (`SELECT FOR UPDATE`), Zod-схемы против Prototype Pollution/Mass Assignment и песочницы для MCP/AI-инструментов.
  3. `devops-supply-chain-container-security.{en,ru,uk}.mdx` — **DevOps, Docker & Supply Chain Defense:** изоляция внутренних сетей Docker (`backend-network`, zero host ports), `non-root` Alpine-образы, защита от вредоносных npm `postinstall`-скриптов через `allowBuilds` и `--ignore-scripts`, харденинг GitHub Actions (`persist-credentials: false`, SHA-пиннинг) и управление секретами.
- [ ] **Новые инженерные статьи `.mdx` по бэкенду и архитектуре:** расширить раздел `nestjs/` и смежные темы разборами `DI & Custom Providers` (`core-di`), `Guards / Pipes / Interceptors` (`guards-pipes`) и `NestJS Microservices + SSE`.

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
                                                                 └──DATABASE_URL──► [ Neon.tech Postgres ]
```

1. **Neon.tech:** создать БД с `?sslmode=require`, накатить схему из CI/локально (`prisma migrate deploy` / `prisma:push`, т.к. прод-образ `api` очищен через `pnpm prune --prod`).
2. **Backend (`docker/api.Dockerfile` + `docker/telemetry-ms.Dockerfile`):** задать `DATABASE_URL`, `JWT_SECRET` (`>= 32` символов, не dev-дефолт), `ADMIN_SECRET_PASSCODE` (не dev-дефолт), `TELEMETRY_MS_HOST`, `TELEMETRY_MS_PORT=4001`, `WEB_ORIGIN=https://<vercel-app>`, `NODE_ENV=production`.
3. **Frontend (`Vercel`):** Node `22.x` (`Corepack` подхватит `"packageManager": "pnpm@12.21.0"` и `pnpm-workspace.yaml`), build command `pnpm turbo run build --filter=@repo/web...`, env `API_INTERNAL_URL` (или `NEXT_PUBLIC_API_URL` при кросс-домене), `JWT_SECRET`, `APP_ENV=production`.
