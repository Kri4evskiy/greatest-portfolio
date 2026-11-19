# ⚙️ `@repo/api` — Основной бэкенд (NestJS 12 ESM)

Основное HTTP/SSE API портфолио и инженерной базы знаний. Приложение построено на **NestJS 12 (Native ESM)**, **Prisma 7 ORM (`@prisma/adapter-pg` + PostgreSQL + In-Memory fallback)**, **Zod v4 (`@repo/shared-schemas`)** и **TCP-клиенте к микросервису телеметрии (`apps/telemetry-ms`)**.

---

## 1. Архитектура: 4-компонентный Enterprise-стандарт

Исходный код в `src/` разделён на чёткие слои по ответственности:

```text
apps/api/src/
├── main.ts                     # Bootstrap: Helmet, CORS, CookieParser, SentryExceptionFilter, LoggingInterceptor
├── app.module.ts               # Root Module: ThrottlerModule, APP_GUARD (ThrottlerGuard), APP_INTERCEPTOR (TimeoutInterceptor), LoggingMiddleware
├── app.controller.ts           # Healthcheck (GET /api/health)
│
├── common/                     # Сквозные механизмы фреймворка (Cross-Cutting Concerns)
│   ├── decorators/             # @Public() и @SkipTimeout()
│   ├── dto/                    # PaginationQuerySchema / PaginationQueryDto (заготовка под пагинацию логов и MCP)
│   ├── filters/                # SentryExceptionFilter (глобальный @Catch(), маскирует 5xx детали)
│   ├── guards/                 # Директория для общих гардов (.gitkeep)
│   ├── interceptors/           # LoggingInterceptor (debug) и TimeoutInterceptor (15s с обходом SSE)
│   ├── middleware/             # LoggingMiddleware (Express-уровень на '{*path}')
│   └── pipes/                  # ZodValidationPipe (точечная валидация через схемы @repo/shared-schemas)
│
├── config/                     # Типизированная Fail-Fast конфигурация (Zod)
│   ├── app.config.ts           # PORT, WEB_ORIGIN, JWT_SECRET, ADMIN_SECRET_PASSCODE, TELEMETRY_MS_*, SENTRY_DSN
│   └── database.config.ts      # DATABASE_URL, DIRECT_URL, парсер ?schema=
│
├── generated/prisma/           # Автогенерируемый ESM-клиент Prisma 7 (игнорируется Git и Biome)
│
├── migrations/                 # Слой управления сидированием БД
│   └── scripts/
│       ├── seed-data.ts        # Единый источник INITIAL_ARTICLE_SEEDS (для seed.ts и In-Memory fallback)
│       └── seed.ts             # Идемпотентный CLI-скрипт (Pool + PrismaPg, upsert в ArticleMetrics)
│
├── prisma/                     # Доступ к данным (@Global() PrismaModule)
│   ├── prisma.module.ts
│   └── prisma.service.ts       # Композиция PrismaClient + @prisma/adapter-pg + In-Memory fallback без DATABASE_URL
│
└── modules/                    # Изолированные доменные модули (Domain Modules)
    ├── auth/                   # JWT в HttpOnly Cookies, Guest Pass, RBAC
    │   ├── decorators/         # @Roles(...)
    │   ├── dto/                # Реэкспорт схем/типов из @repo/shared-schemas
    │   ├── guards/             # JwtRolesGuard
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   └── auth.module.ts
    ├── knowledge/              # Метрики и реакции статей Базы Знаний
    │   ├── dto/                # Реэкспорт схем/типов из @repo/shared-schemas
    │   ├── knowledge.controller.ts
    │   ├── knowledge.service.ts
    │   └── knowledge.module.ts
    └── telemetry/              # Прокси к apps/telemetry-ms (TCP :4001) + SSE-стрим
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
       helmet() ➔ cookieParser() ➔ CORS ➔ LoggingMiddleware ('{*path}')
  │
  ▼ 2. Guards (глобальный APP_GUARD ➔ контроллерный @UseGuards)
       ThrottlerGuard (100 req/min глобально, 5 req/min на auth)
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

1. **`LoggingMiddleware` vs `LoggingInterceptor`:**
   - `LoggingMiddleware` работает на уровне Express **до** гардов и роутинга — поэтому он видит **все** запросы, включая `404`, `403` (отбитые `JwtRolesGuard`) и `429` (отбитые `ThrottlerGuard`). Использует named wildcard `'{*path}'` (требование `path-to-regexp` в NestJS 12 / Express 5 вместо устаревшего `'*'`).
   - `LoggingInterceptor` работает **после** гардов вокруг контроллера через RxJS `tap()` и имеет доступ к NestJS `ExecutionContext`.
2. **Глобальный `TimeoutInterceptor` + защита SSE:**
   - В `AppModule` подключён `TimeoutInterceptor` (15 секунд — запас под cold start Serverless PostgreSQL в Neon.tech).
   - Чтобы он не обрывал долгоживущий SSE-стрим каждые 15 секунд, `TimeoutInterceptor` инжектирует `Reflector` и автоматически пропускает любой метод с метаданными `@Sse()` (`'__sse__'`), а также маршруты с явным `@SkipTimeout()`.
3. **Почему нет `app.useGlobalPipes(new ValidationPipe())`:**
   - Вместо дублирования DTO-классов с `class-validator`, монорепозиторий использует **единый контракт на базе `Zod v4`** в пакете `@repo/shared-schemas`.
   - TypeScript-типы `z.infer<...>` стираются после компиляции, поэтому `reflect-metadata` не видит схему в runtime. Для этого наш `ZodValidationPipe` принимает конкретную Zod-схему точечно в параметре (`@Body(new ZodValidationPipe(GuestPassFormSchema))`), а файлы `modules/*/dto/*.dto.ts` служат доменными реэкспортами из `@repo/shared-schemas`.
4. **Мост для `@nestjs/throttler` в `AppModule`:**
   - `@nestjs/core@12` работает на нативном ESM, тогда как `@nestjs/throttler@6.7.1` публикуется как CommonJS. В `AppModule` добавлен явный мост токена `Reflector` через `Reflect.getMetadata('design:paramtypes', ThrottlerGuard)?.[2]`, чтобы DI работал одинаково и в `tsx watch`, и в скомпилированном `dist/`.

---

## 3. Безопасность и Fail-Fast конфигурация

1. **Zod-валидация окружения при старте (`src/config/app.config.ts`):**
   - В `development`/`test` допускаются безопасные дефолты для быстрого локального старта.
   - В `NODE_ENV === 'production'` запуск процесса **принудительно падает**, если:
     - `JWT_SECRET` не задан, короче 32 символов или равен dev-значению;
     - `ADMIN_SECRET_PASSCODE` не переопределён и остался равным dev-значению.
2. **Хранение сессий и защита от атак:**
   - JWT хранится исключительно в `HttpOnly`, `SameSite=Lax` (`Secure` в production) cookie `kb_access_token` — никаких токенов в `LocalStorage`.
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

| Метод и путь                        | Доступ / Лимит                      | Назначение                                                                        |
| :---------------------------------- | :---------------------------------- | :-------------------------------------------------------------------------------- |
| `GET /api/health`                   | Public (`100/min`)                  | Проверка состояния сервиса и подключения к PostgreSQL                             |
| `POST /api/auth/guest-pass`         | Public (`5/min`)                    | Выдача `Guest Pass` (`USER` или `ADMIN` по пасскоду), установка `HttpOnly` cookie |
| `POST /api/auth/login`              | Public (`5/min`)                    | Алиас `guest-pass`                                                                |
| `GET /api/auth/me`                  | Public (`100/min`)                  | Чтение текущего профиля из cookie (возвращает `GUEST`, если cookie нет)           |
| `POST /api/auth/logout`             | Public (`100/min`)                  | Очистка `kb_access_token` cookie                                                  |
| `GET /api/knowledge/metrics`        | `@Roles('USER', 'ADMIN')`           | Список метрик статей Базы Знаний                                                  |
| `POST /api/knowledge/:slug/view`    | `@Roles('USER', 'ADMIN')`           | Атомарный инкремент просмотров + событие в `telemetry-ms`                         |
| `POST /api/knowledge/:slug/helpful` | `@Roles('USER', 'ADMIN')`           | Атомарный инкремент «полезно» + событие в `telemetry-ms`                          |
| `GET /api/telemetry/stream`         | `@SkipThrottle()`, `@SkipTimeout()` | Постоянный SSE-поток событий телеметрии                                           |
| `GET /api/telemetry/stats`          | Public (`100/min`)                  | Статистика из TCP-микросервиса `apps/telemetry-ms`                                |

---

## 6. Команды разработки

```bash
# Запуск в dev-режиме (из корня монорепозитория или apps/api)
pnpm --filter @repo/api dev

# Проверка типов и линтер Biome
pnpm --filter @repo/api typecheck
pnpm --filter @repo/api lint

# Сборка (prisma generate + tsc -p tsconfig.build.json)
pnpm --filter @repo/api build

# Работа с Prisma и сидирование PostgreSQL
pnpm --filter @repo/api prisma:push
pnpm --filter @repo/api prisma:seed
```
