# 🛠️ Tech Debt & Post-MVP Backlog

## 📌 Текущая база (Production Baseline)

Архитектурное ядро находится в продакшен-состоянии (`v0.8.0`; подробности и 16 ADR лежат в `.agents/frontend/*`, `.agents/backend/*`, `.agents/architecture/*` и статьях базы знаний):
- **Monorepo & DX:** `pnpm 12.21.0` + `Turborepo` + `TypeScript 7.0.2` (native Go compiler) + `Biome 2.6.4` + `Lefthook` · `@repo/shared-schemas` (`Zod v4`) + `@repo/ui` (`Tailwind CSS v4.3.5` + `Storybook 10` `9/9`) · Multi-stage `Docker` + `GitHub Actions CI/CD`.
- **Frontend (`apps/web`):** `Next.js 16.4.6` (`React 19 Compiler`) · архитектура `FSD-Modular` (`app` ➔ `widgets` ➔ `features` ➔ `entities` ➔ `shared`) · `next-intl` (`EN/UK/RU`, `143` SSG-роута) · 2D Appearance (`Mode × Palette` + Zero-FOUC `PALETTE_INIT_SCRIPT` + cross-tab sync в `ThemeProvider` через `useUIStore.getState()`) · self-hosted Zero-CLS `Inter` + `JetBrains Mono` (`next/font/google`) · `@starting-style` + `@container` · `Zero-Eval HAST MDX Engine` (`remark-directive` `:::sandbox` + `remark-rehype` + `hast-util-to-jsx-runtime` + `mtimeMs` кэш + `Dual-Theme Shiki`) · `Cmd+K` SSG-индекс · `TanStack Query v5` (`IndexedDB`) · `D3.js` клиентские острова · `Edge Web Crypto JWT` + строгий `CSP` (`font-src 'self' data:`).
- **Backend (`apps/api` & `apps/telemetry-ms`):** `NestJS 12 ESM` (4-компонентная Enterprise-структура `common`/`config`/`migrations`/`modules`, fail-fast Zod env validation & timing-safe auth) + `Prisma` (с In-Memory fallback и CLI `prisma:seed`) + `HttpOnly JWT` + `Helmet` + `@nestjs/throttler` + изолированный TCP-микросервис телеметрии (`:4001`) с `SSE`-стримингом.

---

## 🔥 Приоритетная очередь разработки (Next Up)

### Приоритет №1: Апгрейд `Prisma ORM` с v6 (`6.4.1`) до `Prisma 7` (`apps/api`, `docker/api.Dockerfile`)

- [ ] **Миграция слоя персистентности на `Prisma 7` (Rust-free Wasm + Native ESM):**
  - **Зачем:** переход на нативный ESM без Rust-бинарников, уменьшение холодного старта и размера Docker-образов, полная актуализация стека следом за `TypeScript 7.0.2` и `Tailwind CSS v4.3.5`.
  - **Ключевые шаги (`apps/api`):**
    1. Обновить `prisma` и `@prisma/client` с `6.4.1` до `7.x`.
    2. Перенести URL-конфигурацию БД из `prisma/schema.prisma` (`url` / `directUrl`) в корневой конфиг пакета `apps/api/prisma.config.ts` (`defineConfig`, `env('DATABASE_URL')`).
    3. Переключить генератор с `prisma-client-js` на `prisma-client` с явным полем `output` (`./generated/prisma`), подключить обязательный SQL driver adapter (`@prisma/adapter-pg` + `pg`) и обновить импорты в `PrismaService` и `src/migrations/scripts/seed.ts`.
    4. Сохранить 100% работоспособность **Graceful In-Memory Fallback** (когда `DATABASE_URL` отсутствует), строгую проверку типов в `TypeScript 7`, ESM-запуск в `NestJS 12` и сборку `docker/api.Dockerfile`.

### Приоритет №2: Production SEO, OpenGraph, Локализованные Error/404 и `Docker Compose` Secrets DX

- [ ] **SEO, Social Previews и границы ошибок (`apps/web/src/app`):**
  1. `apps/web/src/app/robots.ts` и `sitemap.ts`: генерация правил индексации и карты всех **143 SSG-маршрутов** с `alternates.languages` (`hreflang` для `en` / `ua` / `ru`).
  2. `opengraph-image.tsx` + `icon.tsx` + `metadataBase`: динамическая генерация брендированных OpenGraph-превью (`1200×630` через `ImageResponse`) для корректных карточек ссылок в Telegram, LinkedIn и Slack, а также favicon/app-icon.
  3. Локализованные `apps/web/src/app/[locale]/not-found.tsx` и `error.tsx` в дополнение к root `global-error.tsx`.
- [ ] **`docker-compose.yml` Fail-Fast Secrets DX:**
  - Устранить гарантированное падение `docker compose up --build` после появления fail-fast проверки в `apps/api/src/config/app.config.ts` (`NODE_ENV: production` при пустом `JWT_SECRET` и дефолтном `ADMIN_SECRET_PASSCODE`): ввести явное требование секретов через `${JWT_SECRET:?...}` / автогенерацию dev-продового `.env` в `scripts/bootstrap-env.mjs` или отдельный профиль запуска и обновить инструкции в `README.md`.

### Приоритет №3: Внедрение Redis (Distributed Rate Limiting & Response Cache)

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

### Приоритет №4: Автоматическое тестирование (`Vitest` + `Playwright` в CI)

- [ ] **Unit & Integration Tests (`Vitest`):** тесты Zod v4 схем (`@repo/shared-schemas`), Zustand-сторов (`useUIStore`, `palette.ts`) и NestJS-сервисов (`AuthService`, `app.config.ts`) + интеграция джобы `unit-tests` в Stage 1 CI (`turbo run test --affected`). _(Строго `Vitest`, без `Jest`/`ts-jest`: `ts-jest` ограничен `typescript <7` и завязан на legacy JS Compiler API, тогда как `Vitest` нативно совместим с `TypeScript 7`.)_
- [ ] **E2E Playwright Suite:** проверка RBAC-флоу (`GuestPassModal` → `HttpOnly` кука → чтение `.mdx` → маскирование `<Redact />`) + джоба `e2e` после `build` в CI (и синхронизация карточки `playwright-vitest-ci` в `engineering-roadmap.ts`).

### Приоритет №5: Переосмысление визуального дизайна (Mobile-First Editorial `UI v2`)

- [ ] **Авторский редизайн Workfolio (`UI v2`):** глубокое визуальное и типографическое переосмысление интерфейса поверх уже готового фундамента (`Tailwind CSS v4`, 2D-палитры `Warm Paper / Graphite / Sepia`, Zero-CLS шрифты `Inter` + `JetBrains Mono`, `@starting-style`, `@container` и опциональные `View Transitions`), строго следуя `.agents/frontend/*` (Mobile-First с опорой на `360px`, чистая иерархия, продуманные карточки и таблицы без визуального шума).

---

## 🔧 Инфраструктурный и Архитектурный Бэклог

### 1. CI/CD, Turborepo Cache & DX Optimization

- [ ] **CI Security & Workflow Hardening:** добавить еженедельный `schedule:` крон для `pnpm audit --prod --audit-level=high` + `.github/dependabot.yml` (`npm` и `github-actions`), выставить `persist-credentials: false` на `actions/checkout@v6`, добавить `actionlint` в `lint` и при росте UI-кита подключить кэш `.turbo` в джобу `storybook`.

### 2. Security & Production Hardening (`apps/web`, `apps/api`)

- [ ] **Access + Refresh JWT Rotation:** дополнить Edge HS256-верификацию парой короткоживущего `Access` (`15m`) + ротируемого `HttpOnly Refresh` (`7d`) токенов с хранением и отзывом сессий в `VisitorSession` (`PostgreSQL`). _(Готовая заготовка: при переходе `JwtRolesGuard` на глобальный `APP_GUARD` использовать `@Public()` из `common/decorators/public.decorator.ts` для открытых эндпоинтов.)_
- [ ] **Next-Gen Auth & Telegram Bot Access для Базы Знаний (`apps/api`, `PostgreSQL`, `Telegram Bot API`):** заменить открытую 1-click демо-заглушку на полноценный сценарий регистрации и авторизации для реальных пользователей и рекрутеров:
  1. _Хэширование и БД-состояние:_ хранение учётных записей/сессий в PostgreSQL через Prisma (`Argon2id`/`scrypt` для паролей/PIN, одноразовые `invite`/`auth-nonce` токены в БД в виде `SHA-256` хэшей с жёстким TTL).
  2. _Поток Telegram Bot без спам-блокировки:_ по правилам Telegram Bot API бот **не может** сам написать пользователю первым по номеру телефона, поэтому регистрация строится через **Deep Link `https://t.me/<bot>?start=<nonce>`**: пользователь нажимает кнопку на сайте ➔ открывается бот с одноразовым `<nonce>` (при необходимости делится контактом через нативную кнопку Telegram `request_contact`) ➔ Telegram присылает update на защищённый webhook NestJS (проверка `X-Telegram-Bot-Api-Secret-Token` + лимит `@nestjs/throttler`) ➔ бот отправляет подтверждение с данными доступа прямо пользователю (и уведомление/кнопку Approve админу), а сайт мгновенно авторизует вкладку через SSE-стрим или polling и выставляет `HttpOnly` JWT-куку.
  3. _Fallback для безтелеграмных рекрутеров:_ сохранение быстрого одноразового demo/recruiter invite-кода с лимитом попыток.
- [ ] **Throttler ESM Upgrade Cleanup (`apps/api`):** периодически проверять обновления `@nestjs/throttler` и после перехода пакета на нативный ESM (`"type": "module"`) удалить временный CJS/ESM мост для `Reflector` из `apps/api/src/app.module.ts`.
- [ ] **`next-themes` React 19 Dev Warning Cleanup (`apps/web`):** отслеживать upstream-фикс `pacocoursey/next-themes#385` под React 19 и удалить закомментированный блок подавления предупреждения из `apps/web/src/shared/providers/theme-provider.tsx`.

### 3. Observability, Cloud Storage & Self-Hosted Learning Track

- [ ] **Live Sentry & PostHog SDK:** заменить обёртки-заглушки на реальные транспорты `@sentry/nextjs`, `@sentry/nestjs` и `posthog-js`, включаемые при наличии ключей в `.env`.
- [ ] **Neon.tech Cloud Database Migration:** подключить боевой `DATABASE_URL` от Neon.tech PostgreSQL, прогнать `prisma migrate deploy` и сид (`pnpm --filter @repo/api prisma:seed` / `src/migrations/scripts/seed.ts`). _(Готовая заготовка: при добавлении админ-таблицы логов `SystemEventLog` / `VisitorSession` использовать `PaginationQueryDto` из `common/dto/pagination-query.dto.ts`.)_
- [ ] **S3-compatible Object Storage (`Cloudflare R2` + локальный `MinIO` — Backend Learning & Showcase):** освоить и внедрить в `apps/api` интеграцию через `@aws-sdk/client-s3`:
  - _Зачем:_ практическое изучение работы с приватными объектными бакетами (`R2` / `MinIO`), IAM least-privilege ключами, генерацией краткоживущих **Presigned URLs** и безопасным бэкенд-стримингом/проксированием PDF-резюме и загружаемых ассетов с проверкой MIME-типов и размеров файлов.
  - _Локальная разработка:_ легковесный `minio` сервис в `docker-compose` + graceful fallback на локальный статический файл `/cv/*.pdf`, когда S3 env-переменные не заданы.
- [ ] **Nginx Reverse Proxy (`docker-compose.prod.yml` — Self-Hosted / VPS Learning Track):** настроить `Nginx` как единую точку входа (порты `80/443`, TLS) между внешними клиентами, фронтендом (`web:3000`) и бэкендом (`api:4000`) в качестве self-hosted/VPS альтернативы облачному Runbook (Vercel + Render):
  - отработать конфигурирование upstream-проксирования `/api/*` ➔ `api:4000`, отключение буферизации (`proxy_buffering off;`, `proxy_read_timeout`, `Connection ''`) для бесперебойных **SSE-стримов**, передачу `X-Forwarded-For` / `X-Real-IP` для `@nestjs/throttler` (`trust proxy: 1`), L7 rate limiting и базовую защиту заголовков.
- [ ] **Dual-Mode Air-Gapped Local Environment («Тумблер офлайна»):** сохранить единый graceful-fallback режим для всех _будущих_ внешних интеграций (`Redis`, `S3/R2/MinIO`, `Sentry`, `PostHog`, `Telegram Bot API`), развивая уже работающий автономный runtime (`In-Memory Prisma`, `In-Memory Throttler`, self-hosted `.woff2` шрифты и локальный MDX/Shiki), и обеспечить предсказуемое поведение офлайн-сборки.
- [ ] **Cross-Domain API Deployment (`NEXT_PUBLIC_API_URL`):** при выносе `apps/api` на отдельный домен добавить `NEXT_PUBLIC_API_URL` в `.env`, `.env.example`, `turbo.json` (`globalEnv`), перевести клиентские `fetch` / `EventSource` на `NEXT_PUBLIC_API_URL` с фолбэком на `''` и прокинуть домен в CSP `connect-src`.

### 4. Backend AI & Model Context Protocol (`apps/api` — Future Milestone)

- [ ] **Read-Only шоукейс `@nestjs/mcp` (`$0` за токены, статус `evaluating`):** публичный MCP (`Streamable HTTP`) с 16 ADR, опытом CV и `TL;DR` статей для `Cursor` / `Claude Desktop` — строго **Read-Only**, строго после `@nestjs/throttler`, с лимитами Zod (`limit <= 16`, `.max(60)`) и соблюдением `<Redact />`. _(Готовая заготовка: `PaginationQueryDto` / `PaginationQuerySchema` в `common/dto/pagination-query.dto.ts` при необходимости пагинации списков.)_
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
