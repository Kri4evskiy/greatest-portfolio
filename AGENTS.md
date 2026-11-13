# 🧭 AGENTS.md — Root AI Context Router

Ты — Senior Full-Stack AI-инженер и со-архитектор, работающий в монорепозитории портфолио и инженерной базы знаний (`pnpm` + `Turborepo`).

## ⚠️ ГЛАВНОЕ ПРАВИЛО ЭКОНОМИИ ТОКЕНОВ (STRICT CONTEXT ROUTING)

**ЗАПРЕЩЕНО** сканировать весь репозиторий или читать все файлы документации подряд.
1. Определи область текущей задачи пользователя.
2. Прочитай **ТОЛЬКО** соответствующий узкий файл контекста из таблицы ниже.
3. Приступай к написанию кода строго по правилам из прочитанного файла и пошагового плана.

## 🗺️ Каскадная таблица маршрутизации контекста (`.agents/`)

| Домен задачи                                                    | Какой файл читать ПЕРВЫМ                                                                | Какие папки кода трогать                                                   |
| :-------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :------------------------------------------------------------------------- |
| **Бэклог, Tech Debt и план развития (Post-MVP Roadmap)**        | `.agents/tech-debt-backlog.md`                                                          | Зависит от выбранной задачи из бэклога                                     |
| **Архитектура / Почему выбрана технология (16 ADR)**            | `.agents/architecture/adr-stack.md`                                                     | `turbo.json`, `biome.json`, `tsconfig.base.json`                           |
| **Общие Zod-схемы и контракты API / Локалей**                   | `.agents/architecture/shared-contracts.md`                                              | `packages/shared-schemas/*`                                                |
| **UI-компоненты, Tailwind, shadcn/ui, Storybook, Workfolio UI** | `.agents/frontend/ui-storybook.md`                                                      | `packages/ui/*`, `apps/web/src/components/*`                               |
| **Next.js, i18n (`next-intl`), Роутинг `[locale]`, MDX, D3.js** | `.agents/frontend/development.md` + `.agents/skills/react-next-best-practices/SKILL.md` | `apps/web/src/app/[locale]/*`, `apps/web/messages/*`, `apps/web/content/*` |
| **Стейт, Формы, Кэш (Zustand, TanStack Query, IndexedDB)**      | `.agents/frontend/state-and-forms.md` + `.agents/skills/react-hook-form/SKILL.md`       | `apps/web/src/store/*`, `apps/web/src/hooks/*`                             |
| **Фронтенд Security (Middleware, RBAC UI, Guest Pass Modal)**   | `.agents/frontend/security-auth.md`                                                     | `apps/web/src/middleware.ts`, `apps/web/src/features/auth/*`               |
| **NestJS Core, Модули, DTO, Пайпы**                             | `.agents/backend/development.md`                                                        | `apps/api/src/*`                                                           |
| **Бэкенд Security (JWT, HttpOnly Cookies, Guards)**             | `.agents/backend/security-jwt.md`                                                       | `apps/api/src/modules/auth/*`                                              |
| **База данных (PostgreSQL, Neon.tech, Prisma ORM)**             | `.agents/backend/database-prisma.md`                                                    | `apps/api/prisma/*`, `apps/api/src/prisma/*`                               |
| **Микросервисы и Server-Sent Events (SSE)**                     | `.agents/backend/microservices-sse.md`                                                  | `apps/telemetry-ms/*`, `apps/api/src/modules/telemetry/*`                  |
| **CI/CD (GitHub Actions, Composite Actions, Quality Gates)**    | `.agents/architecture/ci-cd.md`                                                         | `.github/workflows/*`, `.github/actions/*`                                 |
| **Docker и Мониторинг (Sentry, PostHog)**                       | `.agents/architecture/docker-deploy.md`                                                 | `docker/*`, `docker-compose.yml`                                           |

## 🛠️ Базовые команды монорепозитория

- Проверка форматирования и линтинга: `pnpm biome check --write .`
- Проверка типов TypeScript: `pnpm turbo typecheck`
- Запуск в dev-режиме: `pnpm turbo dev`
- Сборка: `pnpm turbo build`

## 🚫 Глобальные запреты (Never Do)

1. Никогда не используй `any` или `@ts-ignore` (у нас строгий TypeScript: `strict: true`, `noUncheckedIndexedAccess: true`).
2. Никогда не ставь `ESLint` или `Prettier` — проект использует исключительно `Biome.js`.
3. Никогда не храни серверные данные API в `Zustand` (для этого есть `TanStack Query` + `IndexedDB Persister`).
4. Никогда не храни JWT-токены в `LocalStorage` (только `HttpOnly, Secure, SameSite=Lax Cookies`).
5. Никогда не добавляй секцию `"pnpm"` (например, `onlyBuiltDependencies`) в `package.json` — в `pnpm 12+` все настройки воркспейса и `allowBuilds` живут строго в `pnpm-workspace.yaml`.

## 🔄 Правило синхронизации системной документации (Root Docs Sync)

При внесении архитектурных изменений агент обязан поддерживать актуальность корневых документов:
1. **`SECURITY.md`:** обновлять, если меняется модель аутентификации (JWT, Cookies), Edge Web Crypto, изоляция портов микросервисов, `allowBuilds` в `pnpm-workspace.yaml` или мажорные версии стека.
2. **`CONTRIBUTING.md` и `README.md`:** обновлять, если меняются воркспейсы (добавлен/удалён пакет в `packages/*` или `apps/*`), базовые команды монорепозитория (`dev`, `build`, `lint`, `typecheck`) или pre-commit хуки Lefthook.
3. **`CODE_OF_CONDUCT.md`:** статичный стандарт (Contributor Covenant v2.1), обновляется только при смене контактов мейнтейнера.
