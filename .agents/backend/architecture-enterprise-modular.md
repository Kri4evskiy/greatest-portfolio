# 📐 Архитектура файловой структуры бэкенда: Enterprise Modules (`apps/api`, NestJS 12)

Этот документ описывает стандарт организации файлов и папок в `apps/api/src` по 4-компонентному Enterprise-паттерну (`common`, `config`, `migrations`, `modules`).

---

## 1. Структура `apps/api/src`

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
    ├── main.ts                     # Bootstrap: Helmet, CORS, CookieParser, Filters, Interceptors
    ├── app.module.ts               # Root Module: импорт core-модулей, ThrottlerGuard, TimeoutInterceptor, LoggingMiddleware
    ├── app.controller.ts           # Healthcheck (/api/health) и матрица возможностей (/api/capabilities)

    │
    ├── common/                     # Общий код фреймворка (Cross-Cutting Concerns)
    │   ├── decorators/             # public.decorator.ts (@Public), skip-timeout.decorator.ts (@SkipTimeout)
    │   ├── dto/                    # pagination-query.dto.ts
    │   ├── filters/                # sentry-exception.filter.ts
    │   ├── interceptors/           # logging.interceptor.ts, timeout.interceptor.ts
    │   ├── middleware/             # logging.middleware.ts
    │   ├── pipes/                  # zod-validation.pipe.ts
    │   └── utils/                  # request-id.util.ts (X-Request-Id Correlation ID + защита от Log Injection)
    │
    ├── config/                     # Типизированная конфигурация окружения (Zod)
    │   ├── __tests__/              # app.config.spec.ts
    │   ├── app.config.ts           # Порты, URL-ы, секреты с production-проверкой JWT_SECRET
    │   └── database.config.ts      # DATABASE_URL / DIRECT_URL
    │
    ├── migrations/                 # Слой управления миграциями и сидированием БД
    │   └── scripts/                # seed-data.ts, seed.ts (pnpm --filter @repo/api prisma:seed)
    │
    ├── prisma/                     # Слой доступа к данным (Database Persistence)
    │   ├── __tests__/              # prisma.service.spec.ts (In-Memory fallback и фильтрация)
    │   ├── prisma.module.ts
    │   └── prisma.service.ts
    │
    └── modules/                    # Доменные модули (Domain Modules)
        │
        ├── auth/                   # Модуль аутентификации и сессий
        │   ├── __tests__/          # auth.service.spec.ts, auth.controller.spec.ts
        │   ├── guards/             # jwt-roles.guard.ts
        │   ├── decorators/         # roles.decorator.ts (@Roles)
        │   ├── dto/                # auth.dto.ts (реэкспорт из @repo/shared-schemas)
        │   ├── auth.controller.ts
        │   ├── auth.service.ts
        │   └── auth.module.ts
        │
        ├── knowledge/              # Модуль Базы Знаний и метрик
        │   ├── dto/                # knowledge.dto.ts (реэкспорт из @repo/shared-schemas)
        │   ├── knowledge.controller.ts
        │   ├── knowledge.service.ts
        │   └── knowledge.module.ts
        │
        └── telemetry/              # Модуль телеметрии и SSE
            ├── dto/                # telemetry.dto.ts (SystemEventsQuerySchema из @repo/shared-schemas)
            ├── telemetry.controller.ts
            ├── telemetry.service.ts
            └── telemetry.module.ts
```

---

## 2. Границы ответственности слоёв и запрет горизонтальных связей

1. **`common/`** — переиспользуемые сквозные механизмы NestJS (гарды, пайпы, фильтры, интерцепторы, middleware, общие декораторы, DTO и `utils`), не привязанные к конкретному бизнес-домену.
   - **Правило изоляции внутри `common/`:** соседние инфраструктурные папки (`filters/`, `middleware/`, `interceptors/`, `guards/`, `pipes/`) **НЕ должны импортировать друг друга напрямую**. Любые общие типы запроса (например, `RequestWithCorrelationId`), константы заголовков (`REQUEST_ID_HEADER`) и чистые функции-валидаторы выносятся в `common/utils/*` (`request-id.util.ts`).
2. **`config/`** — единая точка чтения и Zod-валидации `process.env` при старте процесса. Прямое чтение `process.env` внутри сервисов и модулей запрещено.
3. **`migrations/`** — скрипты сидирования и версионирования данных БД (`pnpm --filter @repo/api prisma:seed`).
4. **`modules/<domain>/`** — изолированные доменные модули. Доменные гарды, декораторы и DTO живут внутри своего модуля (`modules/auth/guards/`, `modules/auth/decorators/`, `modules/auth/dto/`).
5. **Правило `Graceful Shutdown` для потоков и сокетов:** любой сервис, создающий бесконечные RxJS-потоки (`@Sse`, `interval`, `Subject`) или внешние пулы/TCP-клиенты, обязан реализовывать `OnModuleDestroy` и завершать потоки через `takeUntil(this.shutdown$)`, чтобы при `SIGTERM` контейнер останавливался за `< 200 мс`.

---

## 3. Чеклист при добавлении новых модулей

1. Размещай доменную логику в `modules/<domain>/`, сквозные механизмы — в `common/`, а чистые переиспользуемые хелперы — в `common/utils/`.
2. Новые env-переменные добавляй в Zod-схему в `config/app.config.ts` или `config/database.config.ts`.
3. **Синхронизация документации:** при изменении структуры папок или эндпоинтов сразу обновляй `apps/api/README.md`, `.agents/backend/development.md` и этот файл.
4. Верификация: `pnpm biome check --write .`, `pnpm turbo typecheck`, `pnpm --filter @repo/api test`, `pnpm --filter @repo/api test:e2e` и `pnpm turbo build --filter=@repo/api` (подробности NestJS + `SWC` + `Vitest` см. в `.agents/testing/testing-strategy.md`).
