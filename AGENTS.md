# 🧭 AGENTS.md — Root AI Context Router

Ты — Senior Full-Stack AI-инженер и со-архитектор, работающий в монорепозитории портфолио и инженерной базы знаний (`pnpm` + `Turborepo`).

## ⚠️ ГЛАВНОЕ ПРАВИЛО ЭКОНОМИИ ТОКЕНОВ (STRICT CONTEXT ROUTING)

**ЗАПРЕЩЕНО** сканировать весь репозиторий или читать все файлы документации подряд.

1. Определи область текущей задачи пользователя.
2. Прочитай **ТОЛЬКО** соответствующий узкий файл контекста из таблицы ниже.
3. Приступай к написанию кода строго по правилам из прочитанного файла и пошагового плана.

## 🗺️ Каскадная таблица маршрутизации контекста (`.agents/`)

| Домен задачи                                                         | Какой файл читать ПЕРВЫМ                                                                                                                 | Какие папки кода трогать                                                                              |
| :------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| **Бэклог, Tech Debt и план развития (Post-MVP Roadmap)**             | `.agents/tech-debt-backlog.md`                                                                                                           | Зависит от выбранной задачи из бэклога                                                                |
| **Архитектура / Почему выбрана технология (16 ADR)**                 | `.agents/architecture/adr-stack.md`                                                                                                      | `turbo.json`, `biome.json`, `tsconfig.base.json`                                                      |
| **Общие Zod-схемы и контракты API / Локалей**                        | `.agents/architecture/shared-contracts.md`                                                                                               | `packages/shared-schemas/*`                                                                           |
| **UI-компоненты, Tailwind, shadcn/ui, Storybook, Workfolio UI**      | `.agents/frontend/ui-storybook.md`                                                                                                       | `packages/ui/*`, `apps/web/src/widgets/*`, `apps/web/src/entities/*`                                  |
| **Next.js, Архитектура FSD-Modular, MDX, i18n, D3.js**               | `.agents/frontend/development.md` + `.agents/frontend/architecture-fsd-modular.md` + `.agents/skills/react-next-best-practices/SKILL.md` | `apps/web/src/{app,widgets,features,entities,shared}/*`, `apps/web/content/*`                         |
| **Стейт, Формы, Кэш (Zustand, TanStack Query, IndexedDB)**           | `.agents/frontend/state-and-forms.md` + `.agents/skills/react-hook-form/SKILL.md`                                                        | `apps/web/src/shared/store/*`, `apps/web/src/{features,entities}/*/queries/*`                         |
| **Фронтенд Security (Edge Proxy, RBAC UI, Guest Pass Modal)**        | `.agents/frontend/security-auth.md`                                                                                                      | `apps/web/src/proxy.ts`, `apps/web/config/security-headers.config.ts`, `apps/web/src/features/auth/*` |
| **NestJS Core, Модули, DTO, Пайпы, Enterprise-структура**            | `.agents/backend/development.md` + `.agents/backend/architecture-enterprise-modular.md`                                                  | `apps/api/src/*`                                                                                      |
| **Бэкенд Security (JWT, HttpOnly Cookies, Guards)**                  | `.agents/backend/security-jwt.md`                                                                                                        | `apps/api/src/modules/auth/*`                                                                         |
| **База данных (PostgreSQL, Neon.tech, Prisma ORM)**                  | `.agents/backend/database-prisma.md`                                                                                                     | `apps/api/prisma/*`, `apps/api/src/prisma/*`                                                          |
| **Микросервисы и Server-Sent Events (SSE)**                          | `.agents/backend/microservices-sse.md`                                                                                                   | `apps/telemetry-ms/*`, `apps/api/src/modules/telemetry/*`                                             |
| **CI/CD (GitHub Actions, Composite Actions, Quality Gates)**         | `.agents/architecture/ci-cd.md`                                                                                                          | `.github/workflows/*`, `.github/actions/*`                                                            |
| **Тестирование (Vitest, MSW, Supertest, Playwright, `data-testid`)** | `.agents/testing/testing-strategy.md`                                                                                                    | `vitest*.ts`, `apps/web/e2e/*`, `apps/api/test/*`, `**/__tests__/*`                                   |
| **Docker, Мониторинг и Инфраструктура (Nginx, Redis, AWS Roadmap)**  | `.agents/architecture/docker-deploy.md` + `.agents/architecture/enterprise-infrastructure-roadmap.md`                                    | `docker/*`, `docker-compose.yml`, `docker-compose.prod.yml`                                           |

## 🛠️ Базовые команды монорепозитория

- Проверка форматирования и линтинга: `pnpm biome check --write .`
- Проверка типов TypeScript: `pnpm turbo typecheck`
- Запуск в dev-режиме: `pnpm turbo dev`
- Сборка: `pnpm turbo build`

## 🚫 Глобальные запреты (Never Do)

1. Никогда не используй `any` или `@ts-ignore` (у нас строгий TypeScript: `strict: true`, `noUncheckedIndexedAccess: true`).
2. Никогда не ставь `ESLint` или `Prettier` — проект использует исключительно `Biome.js`.
3. Никогда не храни серверные данные API или auth/JWT в `Zustand` (для API есть `TanStack Query` + `IndexedDB Persister`); все Zustand-сторы обязаны следовать стандарту из `.agents/frontend/state-and-forms.md` (раздельные `State` + `actions`, приватный базовый стор без прямого экспорта, явные `use*` атомарные хуки + `use<Domain>Actions()`, без `createSelectors` `.use.field()` под `React 19 Compiler` и без top-level чтения `localStorage`).
4. Никогда не храни JWT-токены в `LocalStorage` (только `HttpOnly, Secure, SameSite=Lax Cookies`).
5. Никогда не добавляй секцию `"pnpm"` (например, `onlyBuiltDependencies`) в `package.json` — в `pnpm 12+` все настройки воркспейса и `allowBuilds` живут строго в `pnpm-workspace.yaml`.
6. Никогда не нарушай границы слоёв `FSD-Modular` в `apps/web/src` (`app` ➔ `widgets` ➔ `features` ➔ `entities` ➔ `shared`) и подпапок внутри слайса (`ui/` — компоненты, `queries/` — **только** `TanStack Query` хуки без браузерных `BroadcastChannel`/`localStorage` сайд-эффектов, `lib/` — чистые хелперы и синхронизаторы, `shared/hooks/` — браузерные DOM-хуки); не создавай плоские папки `src/components`, `src/data`, `src/hooks` или `src/lib`.
7. Никогда не допускай горизонтальных импортов между соседними слоями `apps/api/src/common/*` (например, `filters/` не должен импортировать из `middleware/` или `interceptors/` — общие типы и чистые функции выноси в `common/utils/*`) и всегда завершай бесконечные RxJS-стримы (`@Sse`, `interval`) через `takeUntil(this.shutdown$)` в `onModuleDestroy()`.
8. Никогда не используй устаревший `setRequestLocale()` из `next-intl` (локаль резолвится нативно через `next/root-params` в `src/shared/i18n/request.ts`), не создавай `src/middleware.ts` (в Next.js 16 используется `src/proxy.ts`), а при добавлении новых роутов метаданных без расширения файла в `apps/web/src/app/` (`icon.tsx`, `apple-icon.tsx`, `opengraph-image.tsx`, `manifest.ts`) обязательно исключай их в `matcher` внутри `apps/web/src/proxy.ts`.

## 🔄 Правило синхронизации системной и модульной документации (Docs & Tree Sync Checklist)

При добавлении/удалении файлов, роутов, подтем или архитектурных механизмов агент **ОБЯЗАН в том же шаге (до отчёта пользователю)** синхронизировать:

1. **`apps/web/README.md` + `.agents/frontend/architecture-fsd-modular.md`:** обновлять ASCII-дерево файлов и таблицу маршрутов при любом добавлении/перемещении файлов в `apps/web/src/*`.
2. **`apps/api/README.md` + `.agents/backend/architecture-enterprise-modular.md` + `.agents/backend/development.md`:** обновлять дерево `apps/api/src/*`, таблицу эндпоинтов и описание жизненного цикла запроса при любых изменениях на бэкенде.
3. **`SECURITY.md`:** обновлять, если меняется модель аутентификации (JWT, Cookies, `WORKFOLIO_DEMO_MODE`), Edge Web Crypto, изоляция портов микросервисов, `allowBuilds` в `pnpm-workspace.yaml` или мажорные версии стека.
4. **`CONTRIBUTING.md` и корневой `README.md`:** обновлять, если меняются воркспейсы (`packages/*`, `apps/*`), Docker Compose файлы (`docker-compose.yml` / `docker-compose.prod.yml`), базовые команды монорепозитория или pre-commit хуки Lefthook.
5. **`CODE_OF_CONDUCT.md`:** статичный стандарт (Contributor Covenant v2.1), обновляется только при смене контактов мейнтейнера.
6. **Статьи базы знаний (`apps/web/content/this-project/*/*.{en,ru,uk}.mdx`) и `packages/shared-schemas/src/knowledge.schema.ts`:** при изменении архитектуры фронтенда (`frontend-architecture/`), бэкенда (`backend-architecture/`), Docker/CI (`monorepo-docker/`), дизайн-системы (`design-system/`), MDX-движка (`knowledge-engine/`) или безопасности (`security/`) обязательно синхронизировать соответствующие статьи во всех трёх локалях (`en`, `ru`, `uk`).
