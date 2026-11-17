# 📐 Архитектура файловой структуры бэкенда: Enterprise Modules (`apps/api`, NestJS 12)

Этот документ описывает стандарт организации файлов и папок в `apps/api/src` по 4-компонентному Enterprise-паттерну (`common`, `config`, `migrations`, `modules`).

---

## 1. Структура `apps/api/src`

```text
apps/api/src/
│
├── main.ts                     # Bootstrap: Helmet, CORS, CookieParser, Filters, Interceptors
├── app.module.ts               # Root Module: импорт core-модулей, ThrottlerGuard, TimeoutInterceptor, LoggingMiddleware
├── app.controller.ts           # Healthcheck (/api/health)

├── common/                     # Общий код фреймворка (Cross-Cutting Concerns)
│   ├── decorators/             # public.decorator.ts (@Public), skip-timeout.decorator.ts (@SkipTimeout)
│   ├── dto/                    # pagination-query.dto.ts
│   ├── filters/                # sentry-exception.filter.ts
│   ├── interceptors/           # logging.interceptor.ts, timeout.interceptor.ts
│   ├── middleware/             # logging.middleware.ts
│   └── pipes/                  # zod-validation.pipe.ts
│
├── config/                     # Типизированная конфигурация окружения (Zod)
│   ├── app.config.ts           # Порты, URL-ы, секреты с production-проверкой JWT_SECRET
│   └── database.config.ts      # DATABASE_URL / DIRECT_URL
│
├── migrations/                 # Слой управления миграциями и сидированием БД
│   └── scripts/                # seed-data.ts, seed.ts (pnpm --filter @repo/api prisma:seed)
│
├── prisma/                     # Слой доступа к данным (Database Persistence)
│   ├── prisma.module.ts
│   └── prisma.service.ts
│
└── modules/                    # Доменные модули (Domain Modules)
    │
    ├── auth/                   # Модуль аутентификации и сессий
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
        ├── telemetry.controller.ts
        ├── telemetry.service.ts
        └── telemetry.module.ts
```

---

## 2. Границы ответственности слоёв

1. **`common/`** — переиспользуемые сквозные механизмы NestJS (гарды, пайпы, фильтры, интерцепторы, middleware, общие декораторы и DTO), не привязанные к конкретному бизнес-домену.
2. **`config/`** — единая точка чтения и Zod-валидации `process.env` при старте процесса. Прямое чтение `process.env` внутри сервисов и модулей запрещено.
3. **`migrations/`** — скрипты сидирования и версионирования данных БД (`pnpm --filter @repo/api prisma:seed`).
4. **`modules/<domain>/`** — изолированные доменные модули. Доменные гарды, декораторы и DTO живут внутри своего модуля (`modules/auth/guards/`, `modules/auth/decorators/`, `modules/auth/dto/`).

---

## 3. Чеклист при добавлении новых модулей

1. Размещай доменную логику в `modules/<domain>/`, а сквозные гарды, интерцепторы, пайпы и фильтры — в `common/`.
2. Новые env-переменные добавляй в Zod-схему в `config/app.config.ts` или `config/database.config.ts`.
3. Верификация: `pnpm biome check --write .`, `pnpm turbo typecheck`, `pnpm turbo build --filter=@repo/api`.
