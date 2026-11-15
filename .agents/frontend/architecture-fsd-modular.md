# 📐 Архитектура файловой структуры: FSD-Modular (Next.js 16) и Enterprise Modules (NestJS 12)

Этот документ описывает стандарт организации файлов и папок в монорепозитории, адаптацию принципов **Feature-Sliced Design (FSD)** под Next.js App Router и модульный паттерн NestJS по эталону Enterprise-приложений.

---

## 1. Проблема классического FSD в Next.js 16 App Router

Классический **Feature-Sliced Design (FSD)** разрабатывался под SPA (Single Page Applications) с делением на слои:
`app` ➔ `pages` ➔ `widgets` ➔ `features` ➔ `entities` ➔ `shared`.

### Почему классический FSD конфликтует с Next.js App Router:

1. **Папка `app/` в Next.js — это не просто инициализация, а сам роутер:**
   В Next.js `app/[locale]/...` управляет маршрутизацией, вложенными layouts, генерацией статических параметров (`generateStaticParams`), метаданными (`generateMetadata`) и Server Components.
2. **Слой `pages/` в FSD дублирует App Router:**
   Если создать папку `pages/` рядом с `app/`, возникает коллизия концепций.
3. **React Server Components (RSC) и Colocation:**
   В Next.js 16 выгодно держать серверный data fetching и тонкие контроллеры страниц максимально близко к роуту, делегируя рендеринг в изолированные сущности и виджеты.

---

## 2. Стандарт FSD-Modular для `apps/web` (Next.js 16 + React 19)

Мы берем лучшие принципы FSD (направленный поток зависимостей сверху вниз, изоляция фичей, запрет циклических импортов) и гармонично соединяем их с рекомендациями **Vercel Engineering**:

```text
apps/web/src/
│
├── app/                        # [Слой 1: Routing & Composition]
│   │                           # ТОЛЬКО тонкие Server Components: layout, page, route
│   ├── globals.css
│   ├── global-error.tsx
│   ├── [locale]/
│   │   ├── layout.tsx          # Провайдеры, Header, Footer, Modals
│   │   ├── page.tsx            # Главная: сборка Hero, Experience, Roadmap
│   │   ├── cv/page.tsx         # Страница резюме
│   │   └── knowledge-base/     # Роуты базы знаний
│   └── search-index/[locale]/  # API route статического индекса
│
├── widgets/                    # [Слой 2: Composite UI Blocks]
│   │                           # Крупные композиционные блоки, собирающие несколько сущностей
│   ├── header/                 # WorkfolioHeader, LanguageSwitcher, ThemeToggle
│   ├── footer/                 # WorkfolioFooter, FooterSseStatus
│   └── section-nav/            # PageSectionNavigator, UI-хук use-section-navigation
│
├── features/                   # [Слой 3: User Scenarios & Interactions]
│   │                           # Интерактивные фичи с действиями пользователя
│   ├── auth/                   # GuestPassModal + queries/use-visitor-profile
│   ├── search/                 # CommandPaletteModal, useSearchIndex, search-client
│   ├── telemetry-stream/       # FooterSseStatus, useTelemetryStream hook
│   └── kb-sandboxes/           # Интерактивные песочницы в статьях (Zod, JWT, SSE, Redis)
│
├── entities/                   # [Слой 4: Business Data Representation]
│   │                           # Отображение данных предметной области (без глобальных сайд-эффектов)
│   ├── knowledge-article/      # Декомпозированный рендер: inline-ast, code-block, markdown-table,
│   │                           # callout-config, ArticleToc, MetricsBar, DirectoryExplorer,
│   │                           # queries/use-knowledge-metrics
│   ├── knowledge-content/      # mdx-fs-loader, mdx-ast-parser (remark/rehype), mdx-search-index,
│   │                           # link-sanitizer, mdx-client-widgets (next/dynamic), shiki-highlighter
│   ├── workfolio-profile/      # author-profile.ts, cv-file.ts, CvDocumentShowcase
│   └── engineering-roadmap/    # engineering-roadmap.ts, EngineeringRoadmapBoard, TechRadarTable
│
└── shared/                     # [Слой 5: Infrastructure & Common Tools]
    │                           # Фундамент, не знающий о специфике бизнес-фичей
    ├── i18n/                   # navigation.ts, routing.ts, request.ts
    ├── lib/                    # edge-jwt.ts, analytics.ts
    ├── providers/              # ThemeProvider, QueryProvider
    └── store/                  # useUIStore (Zustand)
```

### Золотое правило зависимостей FSD-Modular:

`app` ➔ `widgets` ➔ `features` ➔ `entities` ➔ `shared`.
- Модуль нижнего слоя **никогда не может импортировать** модуль верхнего слоя.
- `entities` не знают о `features` (например, компонент статьи не знает о модалке гостевого пропуска).
- `features` могут использовать `entities` (модалка авторизации знает о профиле посетителя).

---

## 3. Стандарт Enterprise Modules для `apps/api` (NestJS 12)

По образцу эталонной архитектуры (проект `coffee-app`):

```text
apps/api/src/
│
├── main.ts                     # Bootstrap: Helmet, CORS, CookieParser, Listen
├── app.module.ts               # Root Module: импорт core-модулей, ThrottlerGuard
│
├── common/                     # Общий код фреймворка (Cross-Cutting Concerns)
│   ├── decorators/             # Общие кастомные декораторы (@Protocol, @Public)
│   ├── dto/                    # Общие DTO (пагинация, сортировка)
│   ├── filters/                # SentryExceptionFilter, HttpExceptionFilter
│   ├── guards/                 # ThrottlerGuard, ApiKeyGuard
│   ├── interceptors/           # LoggingInterceptor, TransformInterceptor, TimeoutInterceptor
│   ├── middleware/             # LoggingMiddleware, RequestContextMiddleware
│   └── pipes/                  # ZodValidationPipe
│
├── config/                     # Типизированная конфигурация окружения
│   └── app.config.ts           # Порты, URL-ы, секреты с валидацией
│
├── migrations/                 # Слой управления миграциями БД (Prisma / SQL)
│   └── scripts/                # Скрипты наката и сидирования
│
├── prisma/                     # Слой доступа к данным (Database Persistence)
│   ├── prisma.module.ts
│   └── prisma.service.ts
│
└── modules/                    # Доменные модули (Domain Modules)
    │
    ├── auth/                   # Модуль аутентификации и сессий
    │   ├── guards/             # JwtRolesGuard
    │   ├── decorators/         # RolesDecorator (@Roles)
    │   ├── dto/                # GuestPassDto, LoginDto (реэкспорт из @repo/shared-schemas)
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   └── auth.module.ts
    │
    ├── knowledge/              # Модуль Базы Знаний и метрик
    │   ├── dto/                # ArticleMetricsDto, ReactionDto
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

## 4. Пошаговый план безопасной миграции (Zero Breaking Changes)

Рефакторинг файловой структуры проводится по шагам с обязательным прогоном `pnpm biome check` и `pnpm turbo build` на каждом этапе:

1. **Фаза 1 (Бэкенд `apps/api`):**
   - Перенос `jwt-roles.guard.ts` в `modules/auth/guards/`;
   - Перенос `roles.decorator.ts` в `modules/auth/decorators/`;
   - Создание папки `common/guards/` и `common/interceptors/`.
2. **Фаза 2 (Фронтенд `apps/web` — создание слоев):**
   - Создание папок `widgets/`, `entities/`, `shared/`;
   - Перемещение `providers/`, `store/`, `i18n/` внутрь `shared/` (с сохранением `@/` алиасов в `tsconfig.json`);
   - Перенос компонентов статьи из `components/knowledge/` в `entities/knowledge-article/` и `use-knowledge-metrics` в `entities/knowledge-article/queries/`;
   - Перенос `guest-pass-modal` и `use-visitor-profile` в единый фиче-модуль `features/auth/` (серверные хуки в `features/auth/queries/`, отдельно от UI-хуков);
   - Перенос `use-section-navigation` в `widgets/section-nav/` (или `hooks/`);
   - Перенос `command-palette-modal` и поискового клиента в `features/search/`.
3. **Фаза 3 (Верификация):**
   - Проверка путей импорта в `apps/web/src/app/[locale]/...`;
   - Запуск `pnpm turbo typecheck` и `pnpm turbo build`.
