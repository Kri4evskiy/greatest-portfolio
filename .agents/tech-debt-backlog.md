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

### 🔥 Ближайший приоритет №1: Архитектурный рефакторинг файловой структуры (FSD-Modular Next.js 16 + NestJS 12 Enterprise Modules)

- [ ] **Архитектурное построение папок и файлов во фронтенде по принципам Feature-Sliced Design (FSD) с учетом специфики Next.js 16 (App Router):**
  - **Контекст и цели:** Ликвидация структурного «mess» в `apps/web/src` (где компоненты, хуки, данные и утилиты разбросаны между плоскими папками `components/`, `data/`, `features/` с единственным файлом, `hooks/` и `lib/`).
  - **Архитектурное решение (FSD-Modular):** Адаптация принципов FSD с учетом архитектуры Next.js App Router (RSC, layouts, Server Actions, colocation):
    1. `app/` — **Routing & Composition Layer:** исключительно тонкие Server Components (`layout.tsx`, `page.tsx`, `route.ts`), отвечающие только за маршрутизацию `[locale]`, `generateStaticParams`, `generateMetadata` и сборку страниц из виджетов.
    2. `widgets/` — **Composite UI Layer:** самостоятельные композиционные блоки интерфейса (`header/`, `footer/`, `section-nav/`).
    3. `features/` — **User Scenarios Layer:** законченные интерактивные сценарии пользователя с бизнес-действиями (`features/auth` — модалка входа и хук профиля, `features/search` — поисковая палитра `Cmd+K` и клиентский индекс, `features/telemetry-status` — индикатор SSE).
    4. `entities/` — **Business Data Representation Layer:** компоненты отображения бизнес-сущностей (`entities/knowledge-article` — рендерер статьи, TOC, метрики, сайдбар; `entities/knowledge-content` — парсер MDX, AST-виджеты; `entities/workfolio-profile` — данные резюме и showcase; `entities/engineering-roadmap` — доска роадмапа и техрадар).
    5. `shared/` — **Infrastructure Foundation Layer:** переиспользуемые модули, абстрагированные от бизнес-логики (`shared/lib` — crypto, analytics; `shared/providers` — theme, query; `shared/store` — UI store; `shared/i18n` — routing, navigation, request).
  - **Правило зависимостей:** Строгий однонаправленный поток сверху вниз (`app` ➔ `widgets` ➔ `features` ➔ `entities` ➔ `shared`) без циклических импортов.
  - **Документ спецификации:** `.agents/frontend/architecture-fsd-modular.md`.

- [ ] **Реструктуризация бэкенда NestJS 12 по Enterprise-стандарту (по аналогии с проектом `coffee-app`):**
  - **Контекст и цели:** Переход от плоской структуры в `apps/api/src` к четкому 4-компонентному разделению приложения на **modules**, **migrations**, **config** и **common**:
    1. `common/` — **Общие компоненты фреймворка (Cross-Cutting Concerns):**
       - `decorators/` — кастомные декораторы (`@Protocol`, `@Public`, `@Roles`);
       - `dto/` — общие DTO (пагинация, сортировка, мета-ответы);
       - `filters/` — централизованные обработчики ошибок (`sentry-exception.filter.ts`, `http-exception.filter.ts`);
       - `guards/` — глобальные и межмодульные гарды (`throttler.guard.ts`, `api-key.guard.ts`);
       - `interceptors/` — сквозные перехватчики (`logging.interceptor.ts`, `transform.interceptor.ts`, `timeout.interceptor.ts`);
       - `middleware/` — промежуточные слои логирования и контекста запроса;
       - `pipes/` — строгие валидаторы входных данных (`zod-validation.pipe.ts`).
    2. `config/` — **Централизованная типизированная конфигурация:** `app.config.ts`, `database.config.ts` с Zod-валидацией env-переменных при старте процесса.
    3. `migrations/` — **Слой управления миграциями и схемой БД:** выделенные скрипты версионирования, наката и сидирования схемы базы данных.
    4. `modules/` — **Изолированные доменные модули (Domain Modules):**
       - `modules/auth/` — разделение на `guards/` (`jwt-roles.guard.ts`), `decorators/` (`roles.decorator.ts`), `dto/`, `auth.controller.ts`, `auth.service.ts`, `auth.module.ts`;
       - `modules/knowledge/` — `dto/`, `knowledge.controller.ts`, `knowledge.service.ts`, `knowledge.module.ts`;
       - `modules/telemetry/` — `telemetry.controller.ts`, `telemetry.service.ts`, `telemetry.module.ts`.
  - **Документ спецификации:** `.agents/frontend/architecture-fsd-modular.md` (Секция 3).

### ⏳ Ближайший приоритет №2: Внедрение Redis (Distributed Rate Limiting & Response Cache)

- [ ] **Архитектурное внедрение Redis (`apps/api`, `docker-compose.yml`):**
  - **Зачем:**
    1. _Distributed Rate Limiting:_ масштабирование защиты от брутфорса (`POST /api/auth/login`, `POST /api/auth/guest-pass`) при работе нескольких реплик API (защита от распределенного перебора, когда запросы балансируются между инстансами).
    2. _Response Caching (Cache-Aside):_ кэширование высоконагруженных аналитических эндпоинтов (`GET /api/knowledge/stats`) с TTL 60 сек, снижающее нагрузку на PostgreSQL (Neon.tech) на 95%.
    3. _Session Revocation:_ фундамент для мгновенного отзыва скомпрометированных сессий и Refresh-токенов (`VisitorSession`).
  - **Паттерн Graceful In-Memory Fallback:** если переменная `REDIS_URL` отсутствует в `.env`, система автоматически и без ошибок откатывается на встроенный `In-Memory Throttler` и прямое чтение из БД.
  - **Инфраструктура и Пакетная модель монорепозитория:**
    - _Инфраструктурный уровень (Docker):_ Redis запускается как нативный легковесный сервис на C (`redis:7-alpine`, ~30 МБ) в `backend-network`. Ему не требуется собственный Node.js образ или компиляция.
    - _Пакетный уровень (Архитектурная развилка):_
      - _Вариант 1 (Прямой):_ Подключение `ioredis` и кэш-интерцепторов напрямую в `apps/api`.
      - _Вариант 2 (Модульный Enterprise):_ Выделение общего пакета `packages/redis` (или `@repo/cache`) со своим изолированным `package.json`, строгой Zod-типизацией ключей/TTL и готовыми хелперами для повторного использования в `apps/api` и микросервисе `apps/telemetry-ms`.
  - **Какие файлы затронет задача:**
    - `docker-compose.yml`: добавление сервиса `redis` (`image: redis:7-alpine`, порт `127.0.0.1:6379:6379`, сеть `backend-network`, healthcheck `redis-cli ping`).
    - `.env.example`: добавление `REDIS_URL=redis://localhost:6379` (или `rediss://...` от Upstash).
    - `apps/api/package.json`: установка `ioredis`, `@nest-lab/throttler-storage-redis`, `@nestjs/cache-manager`, `cache-manager-redis-yet`.
    - `apps/api/src/app.module.ts`: переключение `ThrottlerModule.forRootAsync` на фабрику с `ThrottlerStorageRedisService` при наличии `REDIS_URL` + подключение `CacheModule`.
    - `apps/api/src/modules/knowledge/knowledge.controller.ts` и `knowledge.service.ts`: кэширование агрегированных счетчиков `stats` (`viewsCount`, `helpfulCount`).
  - **Где читать контекст перед реализацией:**
    - `.agents/backend/security-jwt.md` (Секция 4: Спецификация Redis Throttling & Caching).
    - Статья `apps/web/content/this-project/security/production-security-hardening-csp-helmet-throttler.mdx`.
    - NestJS Docs: `docs.nestjs.com/security/rate-limiting#proxies-and-distributed-storage`.
    - Upstash Docs: `upstash.com/docs/redis/overall/getstarted`.

### 1. CI/CD, Turborepo Cache & DX Optimization

- [ ] **CI Security & Workflow Hardening:** добавить еженедельный `schedule:` крон для `pnpm audit --prod --audit-level=high` + `.github/dependabot.yml` (`npm` и `github-actions`), выставить `persist-credentials: false` на `actions/checkout@v6`, добавить `actionlint` в `lint` и при росте UI-кита подключить кэш `.turbo` в джобу `storybook`.

### 2. Security & Production Hardening (`apps/web`, `apps/api`)

- [ ] **Access + Refresh JWT Rotation:** дополнить Edge HS256-верификацию парой короткоживущего `Access` (`15m`) + ротируемого `HttpOnly Refresh` (`7d`) токенов с хранением и отзывом сессий в `VisitorSession` (`PostgreSQL`).
- [x] **HTTP Security Headers (CSP & HSTS):** настроить `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff` и `Referrer-Policy` в `apps/web/config/security-headers.config.ts` + `helmet` в `apps/api`.
- [x] **Rate Limiting:** подключить `@nestjs/throttler` на `POST /api/auth/login` и `POST /api/auth/guest-pass` в `apps/api` против перебора пасскодов (`ADMIN` / `GUEST`).
- [ ] **Throttler ESM Upgrade Cleanup (`apps/api`):**
  - Периодически проверять обновления `@nestjs/throttler`: как только пакет перейдёт на нативный ESM (`"type": "module"`), удалить временный CJS/ESM мост для `Reflector` из `apps/api/src/app.module.ts` (настройка `trust proxy: 1` для продакшена за прокси уже добавлена в `apps/api/src/main.ts`).

### 3. Observability & Real Cloud Integrations

- [ ] **Live Sentry & PostHog SDK:** заменить обёртки-заглушки на реальные транспорты `@sentry/nextjs`, `@sentry/nestjs` и `posthog-js`, включаемые при наличии ключей в `.env`.
- [ ] **Neon.tech Cloud Database Migration:** подключить боевой `DATABASE_URL` от Neon.tech PostgreSQL, прогнать `prisma migrate deploy` и сид (`prisma/seed.ts`).
- [ ] **Nginx Reverse Proxy для VPS-деплоя (`docker-compose.prod.yml`):** легковесный Nginx как единая точка входа (порты 80/443, SSL Let's Encrypt, сквозное проксирование на `web:3000` и `api:4000`) без избыточного балансировщика нагрузки.
- [ ] **Dual-Mode Air-Gapped Local Environment («Тумблер офлайна»):** гарантировать запуск 100% функционала монорепозитория (база знаний, MDX, поиск, локальная телеметрия TCP :4001) при полном отсутствии интернета и внешних облачных сервисов (In-Memory Prisma + In-Memory Throttler).
- [ ] **S3-compatible Object Storage (Cloudflare R2 vs AWS S3):** интеграция `@aws-sdk/client-s3` с эндпоинтом Cloudflare R2 ($0 за трафик, 10 ГБ навсегда бесплатно) для сгенерированных PDF-резюме и ассетов + локальный MinIO в Docker.
- [ ] **Cross-Domain API Deployment (`NEXT_PUBLIC_API_URL`):** при выносе `apps/api` на отдельный домен (например, `https://api.yourdomain.com` на Render/VPS, чтобы прямые SSE-стримы не обрывались таймаутами Next.js `rewrites`):
  - Добавить `NEXT_PUBLIC_API_URL` в `.env`, `.env.example`, `turbo.json` (`globalEnv`) и переменные среды хостинга (`Vercel`).
  - Перевести клиентские `fetch` / `EventSource` (`apps/web`) на использование `NEXT_PUBLIC_API_URL` с фолбэком на `''` (same-origin), а также настроить `WEB_ORIGIN` на бэкенде и убедиться, что `getSecurityHeaders()` в `apps/web/config/security-headers.config.ts` подхватывает этот домен в CSP `connect-src`.

### 4. Testing (`packages/*`, `apps/*`)

- [ ] **Unit & Integration Tests (`Vitest`):** тесты Zod v4 схем (`@repo/shared-schemas`), Zustand-сторов и NestJS-сервисов + интеграция джобы `unit-tests` в Stage 1 CI (`turbo run test --affected`).
- [ ] **E2E Playwright Suite:** проверка RBAC-флоу (`GuestPassModal` → `HttpOnly` кука → чтение `.mdx` → маскирование `<Redact />`) + джоба `e2e` после `build` в CI (и обновить карточку `playwright-vitest-ci` в `engineering-roadmap.ts`).

### 5. Content, MDX Engine Evolution & Interactive Sandboxes (`apps/web/content/*`)

- [ ] **Декомпозиция MDX-движка на FSD-подкатегории (в рамках Приоритета №1 — `FSD-Modular`):**
  - **Текущий диагноз:** связка `unified` + `remark-parse` + `remark-gfm` (`mdx-content.ts`, ~954 строки) и `MdxArticleRenderer` (~530 строк) уже построена правильно с точки зрения безопасности и SSG (`0 KB` клиентского парсера, серверный `Shiki`, отсутствие `eval`/`'unsafe-eval'` в CSP, поддержка `.{en,uk,ru}.mdx` с fallback), но страдает от двух проблем:
    1. Двойная конвертация AST (`mdast` → самописный `MdxBlock[]`/`MdxInlineNode[]` → ручной перебор массивами в JSX), из-за которой любую новую Markdown-конструкцию приходится дописывать в двух местах.
    2. Монолитность (смешаны чтение ФС, парсинг AST, поисковый индекс, санитизация URL, Shiki-подсветка и UI-блоки).
  - **Сравнение подходов (почему мы пришли к текущему решению и дальнейшей эволюции):**
    - `@next/mdx`: неудобен для динамического catch-all дерева `[...slug]` с локалями `.{en,uk,ru}.mdx` и fallback на `.en.mdx`.
    - `next-mdx-remote/rsc`: тяжелее на 137+ SSG-страницах, требует JSX-компиляции и усложняет Zero-Eval CSP, авто-TOC и сборку статического индекса `Cmd+K`.
    - **Выбор (Фаза A — сейчас при FSD-рефакторинге):** оставить быстрый и проверенный data-driven AST-движок без `eval`, но разбить его на чёткие FSD-подкатегории:
      - `entities/knowledge-content/lib/mdx-fs-loader.ts` — чтение дерева файлов и локальных fallback'ов;
      - `entities/knowledge-content/lib/mdx-ast-parser.ts` — `remark-parse` / `remark-gfm` и парсинг блоков/TOC;
      - `entities/knowledge-content/lib/mdx-search-index.ts` — лёгкая проекция для `/search-index/[locale]` и `Cmd+K`;
      - `entities/knowledge-content/lib/link-sanitizer.ts` — проверка безопасных схем URL (`http/https/mailto/#/`, запрет `javascript:`/`data:`);
      - `entities/knowledge-article/ui/` — декомпозированный `MdxArticleRenderer` (`inline-ast.tsx`, `code-block.tsx`, `markdown-table.tsx`, `callout-config.tsx`, `article-blocks.tsx`);
      - `features/kb-sandboxes/ui/` — ленивые интерактивные полигоны (`next/dynamic(..., { ssr: false })` через `MdxInteractiveWidget`).
    - **Эволюция (Фаза B — при необходимости сложного Markdown / контейнерных песочниц):** заменить промежуточный слой `MdxBlock` на стандартный конвейер **`unified` + `remark-parse` + `remark-gfm` + `remark-directive` (`:::sandbox{...}`) → `remark-rehype` + `@shikijs/rehype` + `rehype-sanitize` → `hast-util-to-jsx-runtime`**. Это полностью уберёт ~500 строк ручных AST-свитчей, позволит передавать в интерактивные виджеты вложенный контент/JSON прямо из `.mdx` и при этом сохранит **Zero-Eval CSP**, React 19 RSC и `0 KB` клиентского парсера.
- [ ] **Interactive Tech Sandboxes in Knowledge Base:** добавление интерактивных полигонов прямо в статьи (Zod Live JSON Validator, JWT WebCrypto Signature Tester, SSE Live Trigger Button для телеметрии, Redis Latency Visualizer), подключаемых как ленивые `next/dynamic` клиентские острова (одна строка `<Widget />` или `:::sandbox` в `.mdx`) без утяжеления других страниц.
- [ ] **Новые инженерные статьи `.mdx`:** расширить раздел `NestJS` и смежные темы разборами `DI & Custom Providers`, `Guards / Pipes / Interceptors`, `NestJS Microservices + SSE`.

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
| **Кэш / Rate Limiter**  | `Redis` (Upstash)         | Совместимо (Serverless REST / TCP)                                | **Upstash Redis** (Free tier, 10k req/day)           |

```text
[ Браузер ] ──(1) HTML / RSC────────────────────────► [ Vercel: apps/web ] (NEXT_PUBLIC_API_URL)
            └─(2) REST / SSE / HttpOnly Cookies────► [ Render/Koyeb: apps/api ] ──TCP :4001──► [ telemetry-ms ]
                                                                 └──DATABASE_URL──► [ Neon.tech Postgres ]
```

1. **Neon.tech:** создать БД с `?sslmode=require`, накатить схему из CI/локально (`prisma migrate deploy` / `prisma:push`, т.к. прод-образ `api` очищен через `pnpm prune --prod`).
2. **Backend (`docker/api.Dockerfile` + `docker/telemetry-ms.Dockerfile`):** задать `DATABASE_URL`, `JWT_ACCESS_SECRET`, `TELEMETRY_MS_HOST`, `TELEMETRY_MS_TCP_PORT=4001`, `CORS_ORIGIN=https://<vercel-app>`, `NODE_ENV=production`.
3. **Frontend (`Vercel`):** Node `22.x` (`Corepack` подхватит `"packageManager": "pnpm@12.18.0"` и `pnpm-workspace.yaml`), build command `pnpm turbo run build --filter=@repo/web...`, env `NEXT_PUBLIC_API_URL`, `APP_ENV=production`.
