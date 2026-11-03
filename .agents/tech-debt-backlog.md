# 🛠️ Tech Debt & Post-MVP Backlog

## 📌 Текущий статус проекта (Baseline State)

Базовая архитектура монорепозитория (**Epics 1–7, MVP**) **полностью реализована и работает**:
- **Monorepo Core:** `pnpm` Workspaces + `Turborepo` + `Biome 2.6.4` + `Lefthook 2.2.2` + `scripts/bootstrap-env.mjs`.
- **Shared Packages:** `@repo/shared-schemas` (Zod-контракты API/SSE/RBAC) и `@repo/ui` (Tailwind CSS, shadcn/ui, Storybook 8).
- **Backend (`apps/api` + `apps/telemetry-ms`):** `NestJS 12` (Native ESM), `Prisma ORM` (с In-Memory fallback без БД), `HttpOnly` JWT Cookie Auth (`ADMIN` / `GUEST`), `@Sse('stream')` проксирование TCP-телеметрии.
- **Frontend (`apps/web`):** `Next.js 16` App Router, `src/proxy.ts` Edge-защита роутов, `TanStack Query v5` + `IndexedDB` Offline-First кэш, `Zustand`, `TanStack Table` (15 ADR), SSG `.mdx` инженерная база знаний с `D3.js` симуляциями.
- **DevOps:** Мультистейдж `Dockerfile` в `docker/*` и `docker-compose.yml`.

---

## 🚀 Приоритетный бэклог улучшений (Tech Debt & Roadmap)

### 1. Performance & Lighthouse 100/100 (`apps/web`)

- [ ] **SSE Lifecycle & Back/Forward Cache (`bfcache`):** В `apps/web/src/components/workfolio-footer.tsx` закрывать соединение `EventSource('/api/telemetry/stream')` по браузерному событию `pagehide` и переподключать на `pageshow`, чтобы браузер беспрепятственно помещал страницу в `bfcache`.
- [ ] **Production Bundle Analysis:** Добавить `@next/bundle-analyzer` в `apps/web/next.config.ts` для контроля веса клиентских чанков `D3.js` и `TanStack Table`.

### 2. Security & Production Hardening (`apps/web`, `apps/api`)

- [ ] **HTTP Security Headers (CSP & HSTS):** Настроить строгие заголовки `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff` и `Referrer-Policy` в `apps/web/next.config.ts` (и `helmet` в `apps/api`).
- [ ] **Rate Limiting:** Подключить `@nestjs/throttler` на эндпоинт `POST /api/auth/login` в `apps/api` для защиты от брутфорса паролей (`ADMIN` / `GUEST`).

### 3. Observability & Real Cloud Integrations (`apps/web`, `apps/api`)

- [ ] **Live Sentry & PostHog SDK:** Заменить легковесные архитектурные провайдеры-обертки на полноценные продакшен-транспорты `@sentry/nextjs`, `@sentry/nestjs` и `posthog-js`, активируемые при наличии реальных ключей в `.env`.
- [ ] **Neon.tech Cloud Database Migration:** Подключить боевой `DATABASE_URL` от Neon.tech PostgreSQL, прогнать `pnpm --filter api prisma migrate deploy` и наполнить БД начальным сидом (`prisma/seed.ts`).

### 4. Testing & Quality Gates (`packages/*`, `apps/*`)

- [ ] **Unit & Integration Tests:** Настроить `Vitest` для тестирования Zod-схем (`@repo/shared-schemas`), Zustand-сторов и NestJS-сервисов.
- [ ] **E2E Playwright Suite:** Добавить сценарий проверки RBAC-флоу (открытие `GuestPassModal` -> вход по `guest`/`admin` -> чтение `.mdx` статьи -> маскирование `<Redact>`).
- [ ] **GitHub Actions CI/CD:** Создать `.github/workflows/ci.yml` с прогоном `pnpm biome check .`, `pnpm turbo typecheck` и `pnpm turbo build` на каждый Pull Request.

### 5. Content & Workfolio Polish (`apps/web/content/*`)

- [ ] **Новые инженерные статьи в `.mdx`:** Расширить базу знаний новыми разборами (например, проектирование `pnpm` + `Turborepo` пайплайнов, паттерны `NestJS Microservices` + `SSE`, `Zero-Trust Auth` с `HttpOnly` куками).
- [ ] **Интерактивный фильтр в матрице ADR:** Добавить фильтрацию по категориям (`Frontend`, `Backend`, `DevOps`, `Architecture`) и полнотекстовый поиск в `TechRadarTable`.

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
   - Выполнить миграцию: `pnpm --filter @repo/api prisma:push` или `prisma migrate deploy`.

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
   - Vercel автоматически распознает `turbo.json` и `pnpm-workspace.yaml`.
   - В настройках проекта Vercel указать:
     - **Root Directory:** `apps/web` (или корень репозитория с фильтром `@repo/web`).
     - **Build Command:** `pnpm turbo run build --filter=@repo/web...`
     - **Output Directory:** `.next`
   - Переменные окружения Vercel:
     - `NEXT_PUBLIC_API_URL`: публичный URL бэкенда (`https://your-api.onrender.com/api`).
     - `APP_ENV`: `production`.

### 4. Почему Vercel идеален для фронтенда и Turborepo

- Vercel бесплатно предоставляет **Turborepo Remote Cache**: каждый билд в Vercel использует хэши из облака, сборка повторных изменений занимает секунды.
- Бесплатный SSL, глобальный CDN (Edge Network) и поддержка Server Components (RSC) из коробки.

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
   - Выполнить миграцию: `pnpm --filter @repo/api prisma:push` или `prisma migrate deploy`.

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
   - Vercel автоматически распознает `turbo.json` и `pnpm-workspace.yaml`.
   - В настройках проекта Vercel указать:
     - **Root Directory:** `apps/web` (или корень репозитория с фильтром `@repo/web`).
     - **Build Command:** `pnpm turbo run build --filter=@repo/web...`
     - **Output Directory:** `.next`
   - Переменные окружения Vercel:
     - `NEXT_PUBLIC_API_URL`: публичный URL бэкенда (`https://your-api.onrender.com/api`).
     - `APP_ENV`: `production`.

### 4. Почему Vercel идеален для фронтенда и Turborepo

- Vercel бесплатно предоставляет **Turborepo Remote Cache**: каждый билд в Vercel использует хэши из облака, сборка повторных изменений занимает секунды.
- Бесплатный SSL, глобальный CDN (Edge Network) и поддержка Server Components (RSC) из коробки.
