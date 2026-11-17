# ⚙️ Архитектура основного бэкенда NestJS (`apps/api`)

Этот документ описывает правила разработки в приложении `apps/api` по 4-компонентному Enterprise-стандарту (`common`, `config`, `migrations`, `modules`).

## 1. Структура слоёв (`apps/api/src`)

1. **`common/` — Сквозные компоненты фреймворка (Cross-Cutting Concerns):**
   - `decorators/`: `public.decorator.ts` (`@Public()`), `skip-timeout.decorator.ts` (`@SkipTimeout()`).
   - `dto/`: `pagination-query.dto.ts` (Zod-схема и тип пагинации `limit`/`offset`).
   - `filters/`: `sentry-exception.filter.ts` (глобальный фильтр 5xx и необработанных исключений).
   - `interceptors/`: `logging.interceptor.ts` (глобальное логирование HTTP-времени ответа), `timeout.interceptor.ts` (глобальный таймаут 15с через `APP_INTERCEPTOR` с `408 Request Timeout`; автоматически пропускает `@Sse()` и `@SkipTimeout()`).
   - `middleware/`: `logging.middleware.ts` (подключён в `AppModule.configure()` для всех маршрутов).
   - `pipes/`: `zod-validation.pipe.ts` (сквозная валидация через схемы из `@repo/shared-schemas`).
2. **`config/` — Централизованная типизированная конфигурация:**
   - `app.config.ts`: Zod-валидация env-переменных при старте процесса (`PORT`, `WEB_ORIGIN`, `JWT_SECRET`, `ADMIN_SECRET_PASSCODE`, `TELEMETRY_MS_HOST/PORT`, `SENTRY_DSN`, `API_KEY`). В режиме `NODE_ENV === 'production'` запуск блокируется, если `JWT_SECRET` не задан или совпадает с дефолтным dev-ключом.
   - `database.config.ts`: валидация `DATABASE_URL` и `DIRECT_URL` (допускает пустые значения для In-Memory fallback).
3. **`migrations/` — Слой управления миграциями и сидированием БД:**
   - `scripts/seed-data.ts`: единый источник начальных метрик статей (переиспользуется и в `seed.ts`, и в In-Memory fallback `PrismaService`).
   - `scripts/seed.ts`: идемпотентный CLI-скрипт сидирования `ArticleMetrics` в PostgreSQL.
4. **`prisma/` — Доступ к данным (`@Global()` `PrismaModule`, `PrismaService`):**
   - Управляет жизненным циклом соединения с PostgreSQL (`Neon.tech` / локальный Docker Postgres) и автоматическим In-Memory fallback.
5. **`modules/` — Изолированные доменные модули (Domain-Driven NestJS Modules):**
   - `auth/` (`guards/jwt-roles.guard.ts`, `decorators/roles.decorator.ts`, `dto/auth.dto.ts`, `auth.controller.ts`, `auth.service.ts`, `auth.module.ts`): Выпуск и верификация `JWT` в `HttpOnly Cookies`, управление гостевыми сессиями (`VisitorSession`) и `RBAC`.
   - `knowledge/` (`dto/knowledge.dto.ts`, `knowledge.controller.ts`, `knowledge.service.ts`, `knowledge.module.ts`): Управление метриками статей Базы Знаний (`GET /api/knowledge/metrics`, `POST /api/knowledge/:slug/view`, `POST /api/knowledge/:slug/helpful`), защищенное ролями `USER` и `ADMIN`.
   - `telemetry/` (`telemetry.controller.ts`, `telemetry.service.ts`, `telemetry.module.ts`): Проксирование событий в микросервис `apps/telemetry-ms` через `@nestjs/microservices` и раздача реального времени клиентам через `@Sse('/api/telemetry/stream')`.

## 2. Сквозная валидация через `ZodValidationPipe`

- Вместо дублирования классов с `class-validator`, все входящие `Body`, `Query` и `Params` валидируются кастомным `ZodValidationPipe`, который принимает схемы напрямую из `@repo/shared-schemas` (через доменные реэкспорты в `modules/*/dto/`).
- При ошибке валидации возвращается структурированный `400 Bad Request` со списком полей `issues`.

## 3. Стандарты контроллеров и сервисов

- Никакой бизнес-логики в контроллерах или корневом `AppModule`.
- Глобальный префикс API: `/api`.
- Включен `cookie-parser`, `LoggingInterceptor`, `LoggingMiddleware` и строгий `CORS` с `credentials: true`, разрешающий обмен `HttpOnly` куками с `apps/web`.
- Все исключения проходят через `SentryExceptionFilter` (с интеграцией в `Sentry`).
