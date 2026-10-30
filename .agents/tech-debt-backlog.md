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
