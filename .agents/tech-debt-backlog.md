# 🛠️ Tech Debt & Post-MVP Backlog

## 📌 База (реализовано и в продакшен-состоянии)

Архитектурное ядро **MVP + Этапы 1–5.5** завершено (подробности и ADR лежат в `.agents/frontend/*`, `.agents/backend/*`, `.agents/architecture/*` и MDX-базе):
`pnpm 12.18.0` + `Turborepo` + `Biome 2.6.4` + `Lefthook` · `@repo/shared-schemas` (`Zod v4`) + `@repo/ui` (`Storybook 10`) · `NestJS 12 ESM` + `Prisma` (с In-Memory fallback) + `HttpOnly JWT` + TCP/`SSE` · `Next.js 16` + `next-intl` (`EN/UK/RU`) + `TanStack Query v5` / `IndexedDB` + `Cmd+K` + Remark AST MDX + `D3.js` · Multi-stage `Docker` + `GitHub Actions CI/CD`.

---

## 🗺️ Следующий этап продукта

### ⏳ Этап 6 (Next Epoch — UI v2): Визуальный редизайн Notion Workfolio

- [ ] **Notion Workfolio Authentic Visual Redesign (`UI v2`):** перевести визуальный язык с классических SaaS-карточек ближе к оригинальному Notion Workfolio (обложка и аватар страницы, палитра «тёплой бумаги и чернил» для Light/Dark, облегчённые таблицы/списки без тяжёлых рамок, спокойная типографика) поверх готового ядра.

---

## 🔧 Активный технический бэклог (Open Tech Debt)

### 1. CI/CD, Turborepo Cache & DX Optimization

- [ ] **Отвязать `APP_VERSION` от `@repo/shared-schemas`, чтобы заработали `FULL TURBO` и узкий `--affected` (напоминание):** сейчас `lefthook` (`scripts/bump-patch-version.mjs`) на каждый коммит обновляет `packages/shared-schemas/src/version.ts`. Так как `@repo/shared-schemas` стоит в корне `^build`:
  1. На `main` каждый коммит (даже только в `.md`/доки) инвалидирует кэш всех 4 сборок (`Cached: 0/4`), из-за чего `FULL TURBO` не срабатывает, а архив `.turbo` в GitHub Actions растёт с каждым коммитом.
  2. На PR изменение `version.ts` заставляет `turbo --affected` пересобирать сразу `shared-schemas`, `api`, `telemetry-ms` и `web` даже при правке одного сервиса.
     _Решение на будущее:_ перенести чтение версии на уровень `apps/web` (`next.config.ts` / build-time env из корневого `package.json`), убрав частые мутации из `packages/shared-schemas`.
- [ ] **Проверить `--affected` на первом реальном PR (`TURBO_SCM_BASE`):** по логам первого PR убедиться, что в detached `HEAD` Turborepo корректно видит базу сравнения (`origin/main`) без предупреждения `Unable to resolve base branch`; при необходимости добавить `TURBO_SCM_BASE: origin/${{ github.base_ref }}` в `typecheck` / `build` / `storybook`.
- [ ] **CI Security & Workflow Hardening:** добавить еженедельный `schedule:` крон для `pnpm audit --prod --audit-level=high` + `.github/dependabot.yml` (`npm` и `github-actions`), выставить `persist-credentials: false` на `actions/checkout@v6`, добавить `actionlint` в `lint` и при росте UI-кита подключить кэш `.turbo` в джобу `storybook`.

### 2. Security & Production Hardening (`apps/web`, `apps/api`)

- [ ] **Access + Refresh JWT Rotation:** дополнить Edge HS256-верификацию парой короткоживущего `Access` (`15m`) + ротируемого `HttpOnly Refresh` (`7d`) токенов с хранением и отзывом сессий в `VisitorSession` (`PostgreSQL`).
- [ ] **HTTP Security Headers (CSP & HSTS):** настроить `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff` и `Referrer-Policy` в `apps/web/next.config.ts` + `helmet` в `apps/api`.
- [ ] **Rate Limiting:** подключить `@nestjs/throttler` на `POST /api/auth/login` в `apps/api` против перебора пасскодов (`ADMIN` / `GUEST`).

### 3. Observability & Real Cloud Integrations

- [ ] **Live Sentry & PostHog SDK:** заменить обёртки-заглушки на реальные транспорты `@sentry/nextjs`, `@sentry/nestjs` и `posthog-js`, включаемые при наличии ключей в `.env`.
- [ ] **Neon.tech Cloud Database Migration:** подключить боевой `DATABASE_URL` от Neon.tech PostgreSQL, прогнать `prisma migrate deploy` и сид (`prisma/seed.ts`).

### 4. Testing (`packages/*`, `apps/*`)

- [ ] **Unit & Integration Tests (`Vitest`):** тесты Zod v4 схем (`@repo/shared-schemas`), Zustand-сторов и NestJS-сервисов + интеграция джобы `unit-tests` в Stage 1 CI (`turbo run test --affected`).
- [ ] **E2E Playwright Suite:** проверка RBAC-флоу (`GuestPassModal` → `HttpOnly` кука → чтение `.mdx` → маскирование `<Redact />`) + джоба `e2e` после `build` в CI (и обновить карточку `playwright-vitest-ci` в `engineering-roadmap.ts`).

### 5. Content & Workfolio Polish (`apps/web/content/*`)

- [ ] **Новые инженерные статьи `.mdx`:** расширить раздел `NestJS` и смежные темы разборами `DI & Custom Providers`, `Guards / Pipes / Interceptors`, `NestJS Microservices + SSE`.
- [ ] **Интерактивный фильтр в матрице ADR:** фильтрация по категориям (`Frontend`, `Backend`, `DevOps`, `Architecture`) и поиск в `TechRadarTable`, плюс поправить мелкие неточности в старых текстах (`15 ADR` → `16 ADR`, `NestJS 11` → `NestJS 12` в ранней статье `pnpm-turborepo-tsconfig-biome`).

### 6. Backend AI & Model Context Protocol (`apps/api` — Future Milestone)

- [ ] **Read-Only шоукейс `@nestjs/mcp` (`$0` за токены, статус `evaluating`):** публичный MCP (`Streamable HTTP`) с 16 ADR, опытом CV и `TL;DR` статей для `Cursor` / `Claude Desktop` — строго **Read-Only**, строго после `@nestjs/throttler`, с лимитами Zod (`limit <= 16`, `.max(60)`) и соблюдением `<Redact />`.
- [ ] _(Отложено / `deferred`)_ **Живой агент `@nestjs/ai`:** не нужен, пока поиск закрывает `Cmd+K` за $0/мес; при возврате — строго за `@UseGuards(JwtRolesGuard)` с `maxOutputTokens`.

---

## ☁️ Архитектура бесплатного продакшен-деплоя (Runbook)

| Компонент               | Стек                      | Совместимость с Vercel Hobby                                      | Где хостить бесплатно                                |
| :---------------------- | :------------------------ | :---------------------------------------------------------------- | :--------------------------------------------------- |
| **`apps/web`**          | `Next.js 16 (App Router)` | **100% совместимо** (SSG/SSR/RSC, Edge Proxy, Turbo Remote Cache) | **Vercel** (Hobby, $0)                               |
| **`apps/api`**          | `NestJS 12`               | Несовместимо (долгоживущий процесс, SSE `@Sse('stream')`)         | **Render.com** / **Koyeb** / **Fly.io** (Docker, $0) |
| **`apps/telemetry-ms`** | `NestJS Microservice`     | Несовместимо (постоянный TCP `:4001`)                             | Docker Compose / фоновый воркер рядом с API ($0)     |
| **БД**                  | `PostgreSQL 16`           | Нет встроенной БД                                                 | **Neon.tech** (Serverless Postgres, 0.5 GB)          |

```text
[ Браузер ] ──(1) HTML / RSC────────────────────────► [ Vercel: apps/web ] (NEXT_PUBLIC_API_URL)
            └─(2) REST / SSE / HttpOnly Cookies────► [ Render/Koyeb: apps/api ] ──TCP :4001──► [ telemetry-ms ]
                                                                 └──DATABASE_URL──► [ Neon.tech Postgres ]
```

1. **Neon.tech:** создать БД с `?sslmode=require`, накатить схему из CI/локально (`prisma migrate deploy` / `prisma:push`, т.к. прод-образ `api` очищен через `pnpm prune --prod`).
2. **Backend (`docker/api.Dockerfile` + `docker/telemetry-ms.Dockerfile`):** задать `DATABASE_URL`, `JWT_ACCESS_SECRET`, `TELEMETRY_MS_HOST`, `TELEMETRY_MS_TCP_PORT=4001`, `CORS_ORIGIN=https://<vercel-app>`, `NODE_ENV=production`.
3. **Frontend (`Vercel`):** Node `22.x` (`Corepack` подхватит `"packageManager": "pnpm@12.18.0"` и `pnpm-workspace.yaml`), build command `pnpm turbo run build --filter=@repo/web...`, env `NEXT_PUBLIC_API_URL`, `APP_ENV=production`.
