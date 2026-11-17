# 🛠️ Tech Debt & Post-MVP Backlog

## 📌 Текущая база (Production Baseline)

Архитектурное ядро находится в продакшен-состоянии (подробности и 16 ADR лежат в `.agents/frontend/*`, `.agents/backend/*`, `.agents/architecture/*` и статьях базы знаний):
- **Monorepo & DX:** `pnpm 12.21.0` + `Turborepo` + `Biome 2.6.4` + `Lefthook` · `@repo/shared-schemas` (`Zod v4`) + `@repo/ui` (`Storybook 10`) · Multi-stage `Docker` + `GitHub Actions CI/CD`.
- **Frontend (`apps/web`):** `Next.js 16` (`React 19 Compiler`) · архитектура `FSD-Modular` (`app` ➔ `widgets` ➔ `features` ➔ `entities` ➔ `shared`) · `next-intl` (`EN/UK/RU`) · `Zero-Eval HAST MDX Engine` (`remark-directive` `:::sandbox` + `remark-rehype` + `hast-util-to-jsx-runtime` + `mtimeMs` кэш + `Dual-Theme Shiki`) · `Cmd+K` SSG-индекс · `TanStack Query v5` (`IndexedDB`) · `D3.js` / `MCP` клиентские острова · `Edge Web Crypto JWT` + строгий `CSP`.
- **Backend (`apps/api` & `apps/telemetry-ms`):** `NestJS 12 ESM` + `Prisma` (с In-Memory fallback) + `HttpOnly JWT` + `Helmet` + `@nestjs/throttler` + изолированный TCP-микросервис телеметрии (`:4001`) с `SSE`-стримингом.

---

## 🔥 Приоритетная очередь разработки (Next Up)

### Приоритет №1: Реструктуризация бэкенда NestJS 12 по Enterprise-стандарту (`apps/api/src`)

- [x] **Переход от плоской структуры в `apps/api/src` к 4-компонентному разделению (`common`, `config`, `migrations`, `modules` — по аналогии с `coffee-app`):**
  1. `common/` — **Общие компоненты фреймворка (Cross-Cutting Concerns):**
     - `decorators/` — кастомные декораторы (`public.decorator.ts`, `skip-timeout.decorator.ts`);
     - `dto/` — общие DTO (`pagination-query.dto.ts`);
     - `filters/` — централизованные обработчики ошибок (`sentry-exception.filter.ts`);
     - `interceptors/` — сквозные перехватчики (`logging.interceptor.ts`, `timeout.interceptor.ts` через `APP_INTERCEPTOR`);
     - `middleware/` — промежуточные слои логирования (`logging.middleware.ts`);
     - `pipes/` — строгие валидаторы входных данных (`zod-validation.pipe.ts`).
  2. `config/` — **Централизованная типизированная конфигурация:** `app.config.ts`, `database.config.ts` с Zod-валидацией env-переменных при старте процесса (включая запрет дефолтного `JWT_SECRET` при `NODE_ENV === 'production'`).
  3. `migrations/` — **Слой управления миграциями и схемой БД:** `scripts/seed-data.ts`, `scripts/seed.ts`.
  4. `modules/` — **Изолированные доменные модули (Domain Modules):**
     - `modules/auth/` — `guards/jwt-roles.guard.ts`, `decorators/roles.decorator.ts`, `dto/auth.dto.ts`, `auth.controller.ts`, `auth.service.ts`, `auth.module.ts`;
     - `modules/knowledge/` — `dto/knowledge.dto.ts`, `knowledge.controller.ts`, `knowledge.service.ts`, `knowledge.module.ts`;
     - `modules/telemetry/` — `telemetry.controller.ts`, `telemetry.service.ts`, `telemetry.module.ts`.
  - **Спецификация:** `.agents/backend/architecture-enterprise-modular.md` и `.agents/backend/development.md`.

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

### Приоритет №3: Полноценный переход с Tailwind CSS v3 на Tailwind CSS v4 (`packages/ui`, `apps/web`)

- [ ] **Многоуровневая миграция дизайн-системы на `Tailwind CSS v4` (Oxide / CSS-first Engine):**
  - **Базовый источник истины:** строго следовать официальному руководству **`https://tailwindcss.com/docs/upgrade-guide`**, пройтись по каждому пункту breaking changes и сопоставить со всеми нашими CSS-файлами (`packages/ui/src/styles/globals.css`, `apps/web/src/app/globals.css`) и компонентами (`packages/ui/src/components/*`, `apps/web/src/{widgets,features,entities,shared}/*`), пока кодовая база UI-компонентов компактна.
  - **Шаг 1 (`@repo/ui` + Storybook 10 — CSS-first & `@theme`):** перевод `packages/ui/src/styles/globals.css` с `@tailwind base/components/utilities` на `@import "tailwindcss";`, описание дизайн-токенов внутри директивы `@theme` и `@utility` поверх наших семантических CSS-переменных, настройка `@custom-variant dark (&:where(.dark, .dark *));`, замена `tailwindcss-animate` на совместимые анимации v4 и проверка всех `*.stories.tsx` в Storybook 10.
  - **Шаг 2 (`apps/web` PostCSS + `@source`):** переключение `apps/web/postcss.config.mjs` на `@tailwindcss/postcss`, подключение `@source` для сканирования компонентов `@repo/ui` и FSD-слоёв (`app`, `widgets`, `features`, `entities`, `shared`), удаление устаревших JS-конфигов `tailwind.config.ts`.
  - **Шаг 3 (Аудит переименованных утилит по `upgrade-guide`):** комплексная замена изменённых классов во всех компонентах (`shadow-sm` ➔ `shadow-xs`, `rounded-sm` ➔ `rounded-xs`, `blur-sm` ➔ `blur-xs`, `outline-none` ➔ `outline-hidden`, `ring` ➔ `ring-3`, явный цвет границ `border-border` для `border`/`divide`, суффиксный `!important` вида `flex!` вместо `!flex`) с сохранением Zero-FOUC переключения тем.
  - **Шаг 4 (Фиксация современных таргетов `"browserslist"` в `package.json` — Zero Legacy Polyfills):**
    - Поскольку `Tailwind CSS v4` спроектирован строго под современные движки (**`Safari 16.4+`**, **`Chrome 111+`**, **`Firefox 128+`** — нативные `@property`, `color-mix()`, `@layer`), старые версии этих браузеров не поддерживаются.
    - Добавить поле **`"browserslist": ["Chrome >= 111", "Edge >= 111", "Firefox >= 128", "Safari >= 16.4"]`** в `apps/web/package.json` (и `packages/ui/package.json`). Это запретит компиляторам `Next.js SWC` / `Turbopack` и `Lightning CSS` генерировать лишние синтаксические трансформы, вендорные префиксы и полифилы под устаревшие браузеры.

### Приоритет №4: Визуальный редизайн Notion Workfolio (`UI v2`)

- [ ] **Notion Workfolio Authentic Visual Redesign (`UI v2`):** после миграции на `Tailwind CSS v4` перевести визуальный язык с классических SaaS-карточек ближе к оригинальному Notion Workfolio (обложка и аватар страницы, палитра «тёплой бумаги и чернил» для Light/Dark, облегчённые таблицы/списки без тяжёлых рамок, спокойная типографика).

---

## 🔧 Инфраструктурный и Архитектурный Бэклог

### 1. CI/CD, Turborepo Cache & DX Optimization

- [ ] **CI Security & Workflow Hardening:** добавить еженедельный `schedule:` крон для `pnpm audit --prod --audit-level=high` + `.github/dependabot.yml` (`npm` и `github-actions`), выставить `persist-credentials: false` на `actions/checkout@v6`, добавить `actionlint` в `lint` и при росте UI-кита подключить кэш `.turbo` в джобу `storybook`.

### 2. Security & Production Hardening (`apps/web`, `apps/api`)

- [ ] **Access + Refresh JWT Rotation:** дополнить Edge HS256-верификацию парой короткоживущего `Access` (`15m`) + ротируемого `HttpOnly Refresh` (`7d`) токенов с хранением и отзывом сессий в `VisitorSession` (`PostgreSQL`). _(Готовая заготовка: при переходе `JwtRolesGuard` на глобальный `APP_GUARD` использовать `@Public()` из `common/decorators/public.decorator.ts` для открытых эндпоинтов.)_
- [ ] **Throttler ESM Upgrade Cleanup (`apps/api`):** периодически проверять обновления `@nestjs/throttler` и после перехода пакета на нативный ESM (`"type": "module"`) удалить временный CJS/ESM мост для `Reflector` из `apps/api/src/app.module.ts`.

### 3. Observability & Real Cloud Integrations

- [ ] **Live Sentry & PostHog SDK:** заменить обёртки-заглушки на реальные транспорты `@sentry/nextjs`, `@sentry/nestjs` и `posthog-js`, включаемые при наличии ключей в `.env`.
- [ ] **Neon.tech Cloud Database Migration:** подключить боевой `DATABASE_URL` от Neon.tech PostgreSQL, прогнать `prisma migrate deploy` и сид (`pnpm --filter @repo/api prisma:seed` / `src/migrations/scripts/seed.ts`). _(Готовая заготовка: при добавлении админ-таблицы логов `SystemEventLog` / `VisitorSession` использовать `PaginationQueryDto` из `common/dto/pagination-query.dto.ts`.)_
- [ ] **Nginx Reverse Proxy для VPS-деплоя (`docker-compose.prod.yml`):** легковесный Nginx как единая точка входа (порты 80/443, SSL Let's Encrypt, сквозное проксирование на `web:3000` и `api:4000`).
- [ ] **Dual-Mode Air-Gapped Local Environment («Тумблер офлайна»):** гарантировать запуск 100% функционала монорепозитория (база знаний, MDX, поиск, локальная телеметрия TCP `:4001`) при полном отсутствии интернета и внешних облачных сервисов (In-Memory Prisma + In-Memory Throttler).
- [ ] **S3-compatible Object Storage (Cloudflare R2 vs AWS S3):** интеграция `@aws-sdk/client-s3` с эндпоинтом Cloudflare R2 ($0 за трафик, 10 ГБ навсегда бесплатно) для сгенерированных PDF-резюме и ассетов + локальный MinIO в Docker.
- [ ] **Cross-Domain API Deployment (`NEXT_PUBLIC_API_URL`):** при выносе `apps/api` на отдельный домен добавить `NEXT_PUBLIC_API_URL` в `.env`, `.env.example`, `turbo.json` (`globalEnv`), перевести клиентские `fetch` / `EventSource` на `NEXT_PUBLIC_API_URL` с фолбэком на `''` и прокинуть домен в CSP `connect-src`.

### 4. Testing (`packages/*`, `apps/*`)

- [ ] **Unit & Integration Tests (`Vitest`):** тесты Zod v4 схем (`@repo/shared-schemas`), Zustand-сторов и NestJS-сервисов + интеграция джобы `unit-tests` в Stage 1 CI (`turbo run test --affected`).
- [ ] **E2E Playwright Suite:** проверка RBAC-флоу (`GuestPassModal` → `HttpOnly` кука → чтение `.mdx` → маскирование `<Redact />`) + джоба `e2e` после `build` в CI (и обновить карточку `playwright-vitest-ci` в `engineering-roadmap.ts`).

### 5. Backend AI & Model Context Protocol (`apps/api` — Future Milestone)

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
2. **Backend (`docker/api.Dockerfile` + `docker/telemetry-ms.Dockerfile`):** задать `DATABASE_URL`, `JWT_ACCESS_SECRET`, `TELEMETRY_MS_HOST`, `TELEMETRY_MS_TCP_PORT=4001`, `CORS_ORIGIN=https://<vercel-app>`, `NODE_ENV=production`.
3. **Frontend (`Vercel`):** Node `22.x` (`Corepack` подхватит `"packageManager": "pnpm@12.21.0"` и `pnpm-workspace.yaml`), build command `pnpm turbo run build --filter=@repo/web...`, env `NEXT_PUBLIC_API_URL`, `APP_ENV=production`.
