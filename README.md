# Greatest Portfolio & Engineering Knowledge Base

Production-grade Full-Stack монорепозиторий персонального портфолио (в эстетике **Notion Workfolio**) и закрытой интерактивной **Инженерной Базы Знаний** с демонстрацией современной Enterprise-архитектуры (`Next.js 16`, `NestJS 12 Native ESM`, `Prisma ORM`, `Microservices TCP + SSE`, `TanStack Query v5 + IndexedDB`, `D3.js`).

---

## ⚡ Быстрый старт (Onboarding в 3 команды)

Проект построен как единый монорепозиторий на базе **`pnpm workspaces`** ([`pnpm-workspace.yaml`](./pnpm-workspace.yaml)) и **`Turborepo`** ([`turbo.json`](./turbo.json)).
**Вам НЕ нужно заходить во вложенные папки (`apps/*`, `packages/*`) и устанавливать зависимости вручную** — одна команда в корне подготовит сразу все 6 пакетов монорепозитория.

### Предварительные требования

- **Node.js:** `>= 22.0.0`
- **pnpm:** `>= 10.x` (можно активировать через встроенный в Node.js `corepack enable`)

### Вариант 1: Мгновенный локальный запуск (без настройки БД и Docker)

Бэкенд оснащен отказоустойчивым слоем `PrismaService`: если локальный PostgreSQL не запущен, API автоматически переключается на in-memory стор с сохранением всех контрактов `Prisma`, `JWT HttpOnly Cookies` и `SSE`-стриминга.

```bash
# 1. Клонировать репозиторий
git clone <URL_РЕПОЗИТОРИЯ>
cd greatest-portfolio

# 2. Установить зависимости всех пакетов монорепозитория одной командой
# (postinstall-скрипт автоматически создаст .env из .env.example,
#  соберет пакет @repo/shared-schemas и сгенерирует типы Prisma Client)
pnpm install

# 3. Запустить все сервисы параллельно (Next.js 16 + NestJS 12 API + Telemetry Microservice)
pnpm run dev
# (Адаптивный раннер scripts/dev-runner.mjs запускает Turborepo, а в случае блокировки
# нативных бинарников, например Windows Smart App Control, бесшовно переключается на pnpm workspaces)
```

После запуска откройте в браузере:
- 🌐 **Frontend (Workfolio CV & Knowledge Base):** [http://localhost:3000](http://localhost:3000)
- ⚙️ **Backend API Healthcheck:** [http://localhost:4000/api/health](http://localhost:4000/api/health)
- 📡 **Live SSE Telemetry Stream:** [http://localhost:4000/api/telemetry/stream](http://localhost:4000/api/telemetry/stream)
- 🎨 **UI-Kit Storybook (отдельной командой при необходимости):** `pnpm --filter @repo/ui storybook` ([http://localhost:6006](http://localhost:6006))

---

### Вариант 2: Полный запуск в Docker (PostgreSQL 16 + Microservice + API + Web)

Если вы хотите поднять весь стек включая контейнер `postgres:16-alpine` и протестировать multi-stage сборку (`turbo prune --docker`):

```bash
docker compose up --build
```

---

## 🔑 Как протестировать закрытую Базу Знаний и RBAC (для Team Lead / Recruiter)

1. На главной странице [http://localhost:3000](http://localhost:3000) нажмите в верхней шапке на кнопку **`🔒 Base of Knowledge (Protected • 1-Click)`**.
2. Откроется модальное окно **1-Click Guest Pass** (`React Hook Form` + `Zod` из `@repo/shared-schemas`):
   - Нажмите на любой из быстрых пресетов (**`⚡ Alex (Team Lead)`**, **`🎯 Maria (Tech Recruiter)`** или **`🚀 David (CTO)`**) для входа в 1 клик с ролью `USER`.
   - Либо откройте спойлер _«Я владелец портфолио (Admin Passcode)»_ и введите демо-ключ: `workfolio-admin-2026`, чтобы получить роль `ADMIN`.
3. Бэкенд `NestJS` подпишет JWT, установит защищенную куку `Set-Cookie: kb_access_token=...; HttpOnly; SameSite=Lax`, отправит событие в TCP-микросервис телеметрии (`:4001`), обновит статус в футере по `SSE` и откроет доступ к разделу `/knowledge-base` (защищенному на уровне `src/proxy.ts` в Next.js 16 и `JwtRolesGuard` в NestJS 12).

---

## 🛠️ Основные команды монорепозитория (из корневой папки)

| Команда                            | Описание                                                                                          |
| :--------------------------------- | :------------------------------------------------------------------------------------------------ |
| `pnpm install`                     | Устанавливает зависимости всех `apps/*` и `packages/*` + запускает `setup`                        |
| `pnpm run setup`                   | Принудительно синхронизирует `.env`, собирает `@repo/shared-schemas` и генерирует `Prisma Client` |
| `pnpm run dev`                     | **Адаптивный запуск:** Turborepo с автоматическим graceful fallback на `pnpm workspaces`          |
| `pnpm run dev:pnpm`                | Принудительный прямой запуск всех сервисов через `pnpm --parallel` (без вызова `turbo.exe`)       |
| `pnpm run dev:turbo`               | Принудительный запуск через `Turborepo` (`turbo run dev`)                                         |
| `pnpm run build`                   | Продакшен-сборка всех пакетов и приложений через `Turborepo`                                      |
| `pnpm run build:pnpm`              | Сборка монорепозитория напрямую через `pnpm -r build` (топологический порядок)                    |
| `pnpm run typecheck`               | Строгая проверка типов TypeScript (`tsc --noEmit`) во всех пакетах через `Turborepo`              |
| `pnpm run typecheck:pnpm`          | Проверка типов TypeScript напрямую через `pnpm -r typecheck`                                      |
| `pnpm run lint`                    | Молниеносная проверка кода и форматирования через `Biome.js` (Rust)                               |
| `pnpm run lint:fix`                | Авто-исправление линтинга и форматирования через `Biome.js`                                       |
| `pnpm --filter @repo/ui storybook` | Запуск интерактивной витрины UI-компонентов `Storybook` на порту `6006`                           |

### 🛡️ Отказоустойчивость DX и Windows Smart App Control (SAC)

В современных версиях Windows 11 включена политика ядра **Smart App Control (SAC)**, которая может блокировать неподписанные бинарные файлы экосистемы (например, `turbo.exe` из `@turbo/windows-64`, генерируя ошибку `spawn UNKNOWN / 0x800711C7`).

Архитектура проекта спроектирована по стандарту **Zero-Friction Onboarding**:
- Скрипт `scripts/dev-runner.mjs` выполняет префлайт-проверку доступности Turborepo.
- Если система блокирует бинарник, раннер выводит понятное предупреждение и **прозрачно подхватывает запуск через нативный `pnpm workspaces`**, гарантируя, что любой тимлид или ревьюер сможет поднять проект в 1 команду на любой машине.
- В CI/CD и Docker (Linux) всегда на 100% задействуются нативный `Turborepo`, `turbo prune` и удаленное кэширование Vercel.

---

## 🏛️ Архитектурный стек (16 ключевых решений — ADR)

1. **Монорепозиторий:** `pnpm` Workspaces + `Turborepo`
2. **DX и качество кода:** `TypeScript (Strict)` + `Biome.js` + `Lefthook` (с авто-инкрементом патч-версии в корневом `package.json` при каждом коммите)
3. **Frontend-платформа:** `Next.js 16 (App Router)` — гибрид SSG + SSR + RSC + Edge Proxy (`src/proxy.ts`)
4. **Разделение стейта:** `TanStack Query v5` (серверный кэш) + `Zustand` (клиентский UI-стейт)
5. **Offline-First БД в браузере:** `IndexedDB` (`idb-keyval` + TanStack Query Persister с TTL 24 часа)
6. **Формы и сквозная валидация:** `React Hook Form` + `Zod` (`packages/shared-schemas`)
7. **UI-система и документация:** `Tailwind CSS` + `shadcn/ui` (Radix UI) + `Storybook`
8. **Таблицы и экспериментальный рантайм:** `TanStack Table` (Tech Radar + ADR) & `TanStack Redact`
9. **Контент и визуализация:** `MDX` + `WebP` (`<ArticleImageGrid />`) + интерактивные графы `D3.js`
10. **Основной Backend:** `NestJS 12` (Native ESM, модульная DI-архитектура)
11. **Безопасность:** `JWT` в `HttpOnly Cookies` (`kb_access_token`) + `RBAC` (`GUEST` / `USER` / `ADMIN`)
12. **База данных и ORM:** `PostgreSQL` (`Neon.tech` / Docker Postgres) + `Prisma ORM`
13. **Микросервисы и Real-Time:** `@nestjs/microservices` (`apps/telemetry-ms`, TCP `:4001`) + `Server-Sent Events (@Sse)`
14. **Инфраструктура:** `Docker` (Multi-stage builds с `turbo prune`) + `Docker Compose`
15. **Наблюдаемость:** `Sentry` (Error Tracking) + `PostHog` (Product Analytics)
16. **Мультиязычность (i18n):** `next-intl` (App Router RSC, `EN` default + `UA` / `RU`) + локализованные статьи `*.{en,uk,ru}.mdx`

---

## 📂 Структура монорепозитория

```text
greatest-portfolio/
├── .agents/                    # Каскадная система контекста и ADR для ИИ-агентов
│   ├── tech-debt-backlog.md    # Бэклог, Tech Debt и Post-MVP план развития
│   ├── architecture/           # ADR-каталог, общие контракты, Docker & Observability
│   ├── frontend/               # Правила Next.js, Workfolio UI, Storybook, State, Auth
│   └── backend/                # Правила NestJS, JWT Security, Prisma, Microservices & SSE
├── apps/
│   ├── web/                    # Next.js 16 App Router (Workfolio CV + закрытая Knowledge Base)
│   ├── api/                    # Основной бэкенд NestJS 12 (ESM) + Prisma + SSE Stream
│   └── telemetry-ms/           # Микросервис телеметрии и аналитики (@nestjs/microservices)
├── packages/
│   ├── shared-schemas/         # Единые Zod-схемы и TS-типы для фронта и бэка (ESM)
│   └── ui/                     # UI-кит в эстетике Notion Workfolio (Tailwind + Radix + Storybook)
├── docker/                     # Оптимизированные 3-stage Dockerfiles (turbo prune)
├── scripts/                    # Скрипты автоматизации (bootstrap-env.mjs, bump-patch-version.mjs)
├── AGENTS.md                   # Корневой роутер контекста для ИИ
├── biome.json                  # Единый линтер и форматтер (Rust)
├── docker-compose.yml          # Оркестрация postgres + telemetry-ms + api + web
├── lefthook.yml                # Git-хуки (Biome + Typecheck + Semver bump)
├── pnpm-workspace.yaml         # Конфигурация пакетов монорепозитория
├── tsconfig.base.json          # Строгий базовый конфиг TypeScript
└── turbo.json                  # Пайплайны сборки и кэширования Turborepo
```

## 🧭 Навигация по архитектурной документации

- [Корневой роутер контекста ИИ (`AGENTS.md`)](./AGENTS.md)
- [Бэклог, Tech Debt и Post-MVP план развития (`.agents/tech-debt-backlog.md`)](./.agents/tech-debt-backlog.md)
- [Полный каталог 16 ADR: Почему, Где и Как (`.agents/architecture/adr-stack.md`)](./.agents/architecture/adr-stack.md)
