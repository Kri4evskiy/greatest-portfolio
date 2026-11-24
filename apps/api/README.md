# ⚙️ `@repo/api` — Основной бэкенд (NestJS 12 ESM)

Основное HTTP/SSE API портфолио и инженерной базы знаний. Приложение построено на **NestJS 12 (Native ESM)**, **Prisma 7 ORM (`@prisma/adapter-pg` + PostgreSQL + In-Memory fallback)**, **Zod v4 (`@repo/shared-schemas`)** и **TCP-клиенте к микросервису телеметрии (`apps/telemetry-ms`)**.

---

## 1. Архитектура: 4-компонентный Enterprise-стандарт

Исходный код в `src/` разделён на чёткие слои по ответственности:

```text
apps/api/
├── vitest.base.ts              # Общая база Vitest + unplugin-swc + ESM (.js->.ts) + SWC_NATIVE_BINDING_CACHE
├── vitest.config.ts            # Конфигурация unit-тестов (src/**/*.spec.ts)
├── vitest.e2e.config.ts        # Конфигурация HTTP E2E-тестов (test/*.e2e-spec.ts)
├── vitest.setup.ts             # reflect-metadata для декораторов NestJS
├── test/
│   └── auth-and-observability.e2e-spec.ts # Full AppModule + Supertest E2E
│
└── src/
    ├── main.ts                     # Bootstrap: JSON-only bodyParser, Helmet (strict CSP), CORS (exposedHeaders: X-Request-Id), TRUST_PROXY_HOPS, enableShutdownHooks(), CookieParser
    ├── app.module.ts               # Root Module: ThrottlerModule (60 req/min + shared auth bucket), APP_GUARD, APP_INTERCEPTOR, LoggingMiddleware + CsrfOriginMiddleware
    ├── app.controller.ts           # Healthcheck (GET /api/health) и матрица возможностей (GET /api/capabilities)
│
    │
    ├── common/                     # Сквозные механизмы фреймворка (Cross-Cutting Concerns)
    │   ├── decorators/             # @Public() и @SkipTimeout()
    │   ├── dto/                    # PaginationQuerySchema / PaginationQueryDto (заготовка под пагинацию логов и MCP)
    │   ├── filters/                # SentryExceptionFilter (глобальный @Catch(), guard headersSent для SSE, санитизация URL, requestId)
    │   ├── guards/                 # Директория для общих гардов (.gitkeep)
    │   ├── interceptors/           # LoggingInterceptor (debug + log-sanitization) и TimeoutInterceptor (15s с обходом SSE)
    │   ├── middleware/             # LoggingMiddleware + CsrfOriginMiddleware (JSON Content-Type + Origin/Sec-Fetch-Site на мутациях)
    │   ├── pipes/                  # ZodValidationPipe (точечная валидация через схемы @repo/shared-schemas)
    │   └── utils/                  # request-id.util.ts, log-sanitizer.util.ts, express-request.util.ts (+ __tests__/request-id.util.spec.ts)
    │
    ├── config/                     # Типизированная Fail-Fast конфигурация (Zod)
    │   ├── __tests__/              # app.config.spec.ts
    │   ├── app.config.ts           # PORT, TRUST_PROXY_HOPS, WEB_ORIGIN, WORKFOLIO_DEMO_MODE, JWT_SECRET, ADMIN_SECRET_PASSCODE (>=16), TELEMETRY_MS_*, SENTRY_DSN, integration flags
    │   └── database.config.ts      # DATABASE_URL, DIRECT_URL, парсер ?schema=
    │
    ├── generated/prisma/           # Автогенерируемый ESM-клиент Prisma 7 (игнорируется Git и Biome)
    │
    ├── migrations/                 # Слой управления сидированием БД
    │   └── scripts/
    │       ├── seed-data.ts        # Единый источник INITIAL_ARTICLE_SEEDS (10 слагов) + KNOWN_KNOWLEDGE_SLUGS allowlist (30 слагов)
    │       └── seed.ts             # Идемпотентный CLI-скрипт (Pool + PrismaPg, upsert в ArticleMetrics)
    │
    ├── prisma/                     # Доступ к данным (@Global() PrismaModule)
    │   ├── __tests__/              # prisma.service.spec.ts (тесты In-Memory fallback, лимитов 200 записей, пагинации и фильтрации)
    │   ├── prisma.module.ts
    │   └── prisma.service.ts       # Композиция PrismaClient + @prisma/adapter-pg + bounded In-Memory fallback (cap 200) без DATABASE_URL
    │
    └── modules/                    # Изолированные доменные модули (Domain Modules)
        ├── auth/                   # JWT (HS256, 1d) в HttpOnly Cookies, Guest Pass, RBAC
        │   ├── __tests__/          # auth.service.spec.ts, auth.controller.spec.ts, jwt-roles.guard.spec.ts
        │   ├── decorators/         # @Roles(...)
        │   ├── dto/                # Реэкспорт схем/типов из @repo/shared-schemas
        │   ├── guards/             # JwtRolesGuard
        │   ├── auth.controller.ts
        │   ├── auth.service.ts
        │   └── auth.module.ts
        ├── knowledge/              # Метрики и реакции статей Базы Знаний (slug allowlist + helpful dedup)
        │   ├── dto/                # Реэкспорт схем/типов из @repo/shared-schemas
        │   ├── knowledge.controller.ts
        │   ├── knowledge.service.ts
        │   └── knowledge.module.ts
        └── telemetry/              # Прокси к apps/telemetry-ms (TCP :4001) + Cursor-лог + SSE-стрим (2/IP, 50 global, 15m TTL) + ADMIN diagnostics
            ├── __tests__/          # telemetry.service.spec.ts
            ├── dto/                # telemetry.dto.ts (SystemEventsQuerySchema)
            ├── telemetry.controller.ts
            ├── telemetry.service.ts
            └── telemetry.module.ts
```

---

## 2. Жизненный цикл HTTP-запроса (Request Lifecycle)

Порядок прохождения запроса в `apps/api`:

```text
Входящий HTTP-запрос
  │
  ▼ 1. Express Middleware (main.ts + AppModule.configure)
       helmet() ➔ cookieParser() ➔ CORS ➔ LoggingMiddleware + CsrfOriginMiddleware ('{*path}')
  │
  ▼ 2. Guards (глобальный APP_GUARD ➔ контроллерный @UseGuards)
       ThrottlerGuard (60 req/min глобально, общий 5 req/min на auth, 5 req/min на SSE handshake)
       ➔ JwtRolesGuard (читает HttpOnly cookie kb_access_token, проверяет @Public() и @Roles())
  │
  ▼ 3. Interceptors (Before)
       LoggingInterceptor (старт таймера)
       ➔ TimeoutInterceptor (15s таймаут; автоматически пропускает @Sse() и @SkipTimeout())
  │
  ▼ 4. Pipes
       ZodValidationPipe(Schema) — валидация Body / Param / Query по схеме из @repo/shared-schemas
  │
  ▼ 5. Controller ➔ Service ➔ PrismaService / TelemetryService (TCP :4001)
  │
  ▼ 6. Interceptors (After) или Exception Filters
       Успех: LoggingInterceptor (время ответа) ➔ JSON / SSE
       Ошибка: SentryExceptionFilter (@Catch() — 5xx логирует и отдаёт безопасный ответ без stack trace)
```

### Почему выбраны именно такие решения

1. **`LoggingMiddleware` (`X-Request-Id` Correlation ID) vs `LoggingInterceptor`:**
   - `LoggingMiddleware` работает на уровне Express **до** гардов и роутинга — поэтому он видит **все** запросы, включая `404`, `403` (отбитые `JwtRolesGuard`) и `429` (отбитые `ThrottlerGuard`). Генерирует или валидирует заголовок `X-Request-Id` (`SAFE_REQUEST_ID_REGEX = /^[A-Za-z0-9_-]{8,64}$/` для защиты от Log Injection), прокидывает его в ответ и `SentryExceptionFilter`, и использует named wildcard `'{*path}'` (требование `path-to-regexp` в NestJS 12 / Express 5 вместо устаревшего `'*'`).
   - `LoggingInterceptor` работает **после** гардов вокруг контроллера через RxJS `tap()` и имеет доступ к NestJS `ExecutionContext`.
2. **Глобальный `TimeoutInterceptor` + защита SSE и `Graceful Shutdown` (`enableShutdownHooks`):**
   - В `AppModule` подключён `TimeoutInterceptor` (15 секунд — запас под cold start Serverless PostgreSQL в Neon.tech).
   - Чтобы он не обрывал долгоживущий SSE-стрим каждые 15 секунд, `TimeoutInterceptor` инжектирует `Reflector` и автоматически пропускает любой метод с метаданными `@Sse()` (`'__sse__'`), а также маршруты с явным `@SkipTimeout()`.
   - В `main.ts` (`apps/api` и `apps/telemetry-ms`) активирован `app.enableShutdownHooks()`, а в `TelemetryService.onModuleDestroy()` поток SSE обернут в `takeUntil(this.shutdown$)` с закрытием `telemetryClient.close()`, чтобы при `SIGTERM` в Docker/Render активные `interval(15000)` SSE-стримы и `pg.Pool` закрывались за `< 200 мс` без зависания контейнера до `SIGKILL`.
3. **Почему нет `app.useGlobalPipes(new ValidationPipe())`:**
   - Вместо дублирования DTO-классов с `class-validator`, монорепозиторий использует **единый контракт на базе `Zod v4`** в пакете `@repo/shared-schemas`.
   - TypeScript-типы `z.infer<...>` стираются после компиляции, поэтому `reflect-metadata` не видит схему в runtime. Для этого наш `ZodValidationPipe` принимает конкретную Zod-схему точечно в параметре (`@Body(new ZodValidationPipe(GuestPassFormSchema))`), а файлы `modules/*/dto/*.dto.ts` служат доменными реэкспортами из `@repo/shared-schemas`.
4. **Мост для `@nestjs/throttler` в `AppModule`:**
   - `@nestjs/core@12` работает на нативном ESM, тогда как `@nestjs/throttler@6.7.1` публикуется как CommonJS. В `AppModule` добавлен явный мост токена `Reflector` через `Reflect.getMetadata('design:paramtypes', ThrottlerGuard)?.[2]`, чтобы DI работал одинаково и в `tsx watch`, и в скомпилированном `dist/`.

---

## 3. Безопасность и Fail-Fast конфигурация

1. **Zod-валидация окружения при старте (`src/config/app.config.ts`):**
   - В `development`/`test` допускаются безопасные дефолты для быстрого локального старта.
   - В `NODE_ENV === 'production'` при `WORKFOLIO_DEMO_MODE !== 'true'` (`docker-compose.prod.yml`) запуск процесса **принудительно падает (Fail-Fast)**, если:
     - `JWT_SECRET` не задан, короче 32 символов или равен dev-значению;
     - `ADMIN_SECRET_PASSCODE` не переопределён и остался равным dev-значению.
   - В режиме локального ревьюер-демо (`WORKFOLIO_DEMO_MODE === 'true'` в `docker-compose.yml`) разрешается старт одной командой `docker compose up --build` без `.env` (оба сервиса через `resolveJwtSecret()` берут единый `DEFAULT_DEV_JWT_SECRET` из `@repo/shared-schemas`), с выводом предупреждения `[WORKFOLIO DEMO MODE]` и установкой `secure: false` на куке `kb_access_token` для работы по `http://localhost:3000`.
2. **Хранение сессий и защита от атак:**
   - JWT хранится исключительно в `HttpOnly`, `SameSite=Lax` (`Secure` в production при `!isDemoMode`) cookie `kb_access_token` — никаких токенов в `LocalStorage`.
   - Проверка `adminPasscode` в `AuthService` выполняется через SHA-256 + `crypto.timingSafeEqual` (защита от timing-атак).
   - В `production` включён `app.set('trust proxy', 1)` для корректного определения IP клиента в `ThrottlerGuard` за Nginx / облачным прокси.
   - На `/api/auth/guest-pass` и `/api/auth/login` стоит строгий лимит `5 req / 60s`.

---

## 4. База данных, In-Memory Fallback и Сидирование

- **PostgreSQL + Prisma 7 (`prisma.config.ts` + `src/prisma/prisma.service.ts`):** генератор `prisma-client` (Rust-free Wasm, Native ESM в `src/generated/prisma/`), драйверный адаптер `@prisma/adapter-pg` + `pg.Pool`, модели `VisitorSession`, `ArticleMetrics`, `SystemEventLog`. Конфиг `prisma.config.ts` использует `DIRECT_URL` (или `DATABASE_URL` с безопасным placeholder для автономного `prisma generate`).
- **Resilient In-Memory Fallback:** если `DATABASE_URL` не задан или проверка `SELECT 1` при старте в `onModuleInit` обнаруживает недоступность PostgreSQL, `PrismaService` корректно закрывает пул и автоматически переключается на встроенное хранилище в памяти (`Map`), используя те же начальные данные `INITIAL_ARTICLE_SEEDS`. Это позволяет поднимать 100% функционала API локально без внешней БД.
- **Сидирование реальной БД (`src/migrations/scripts/seed.ts`):** standalone CLI-скрипт (через `pnpm --filter @repo/api prisma:seed` или `prisma db seed`), который при старте сервера **не** запускается, а вызывается вручную или на этапе деплоя для идемпотентного `upsert` начальных записей `ArticleMetrics`.

---

## 5. Эндпоинты API (префикс `/api`)

| Метод и путь                           | Доступ / Лимит                                   | Назначение                                                                               |
| :------------------------------------- | :----------------------------------------------- | :--------------------------------------------------------------------------------------- |
| `GET /api/health`                      | Public (`60/min`)                                | Проверка состояния сервиса и подключения к PostgreSQL                                    |
| `GET /api/capabilities`                | Public (`60/min`)                                | Безопасная матрица возможностей системы (`SystemCapabilities`, без секретов)             |
| `POST /api/auth/guest-pass`            | Public (`5/min` общий бакет с `/login`)          | Выдача `Guest Pass` (`USER` или `ADMIN` по пасскоду, `403` на неверный код), `1d` cookie |
| `POST /api/auth/login`                 | Public (`5/min` общий бакет с `/guest-pass`)     | Алиас `guest-pass`                                                                       |
| `GET /api/auth/me`                     | Public (`60/min`)                                | Чтение текущего профиля из cookie (возвращает `GUEST`, если cookie нет)                  |
| `POST /api/auth/logout`                | Public (`60/min`, CSRF Origin guard)             | Очистка `kb_access_token` cookie                                                         |
| `GET /api/knowledge/metrics`           | Public (`60/min`, Read-Only)                     | Список метрик статей Базы Знаний                                                         |
| `GET /api/knowledge/metrics/paginated` | Public (`60/min`, Read-Only, `offset <= 500`)    | Offset-пагинация рейтинга статей (`limit`, `offset`, `category`, `sortBy`)               |
| `POST /api/knowledge/:slug/view`       | `@Roles('USER', 'ADMIN')` + slug allowlist       | Атомарный инкремент просмотров (`404` для неизвестных слагов) + событие в `telemetry-ms` |
| `POST /api/knowledge/:slug/helpful`    | `@Roles('USER', 'ADMIN')` + slug allowlist/dedup | Атомарный инкремент «полезно» (дедупликация на сессию) + событие в `telemetry-ms`        |
| `GET /api/telemetry/stream`            | `5/min` handshake, `@SkipTimeout()`              | SSE-поток событий телеметрии (макс. `2`/IP, `50` глобально, TTL `15 мин`)                |
| `GET /api/telemetry/events`            | Public (`60/min`)                                | Cursor-пагинация системных событий (`limit`, `cursor`, `eventType`)                      |
| `GET /api/telemetry/stats`             | Public (`60/min`)                                | Статистика из TCP-микросервиса `apps/telemetry-ms`                                       |
| `GET /api/telemetry/admin-diagnostics` | `@Roles('ADMIN')`                                | Диагностика SSE-слотов, in-memory буферов и БД (заготовка прав `ADMIN`)                  |

---

## 6. Команды разработки

```bash
# Запуск в dev-режиме (из корня монорепозитория или apps/api)
pnpm --filter @repo/api dev

# Проверка типов, линтер Biome и тесты (Vitest Unit + Supertest HTTP E2E)
pnpm --filter @repo/api typecheck
pnpm --filter @repo/api lint
pnpm --filter @repo/api test
pnpm --filter @repo/api test:coverage
pnpm --filter @repo/api test:e2e

# Сборка (prisma generate + tsc -p tsconfig.build.json)
pnpm --filter @repo/api build

# Работа с Prisma и сидирование PostgreSQL
pnpm --filter @repo/api prisma:push
pnpm --filter @repo/api prisma:seed
```
