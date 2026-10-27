# Greatest Portfolio & Engineering Knowledge Base

Production-grade Full-Stack монорепозиторий персонального портфолио (в эстетике **Notion Workfolio**) и закрытой интерактивной Инженерной Базы Знаний с демонстрацией современной Enterprise-архитектуры.

## 🏛️ Архитектурный стек (15 ключевых решений)

1. **Монорепозиторий:** `pnpm` Workspaces + `Turborepo`
2. **DX и качество кода:** `TypeScript (Strict)` + `Biome.js` + `Lefthook` (с авто-инкрементом патч-версии при коммите)
3. **Frontend-платформа:** `Next.js (App Router)` — гибрид SSG + SSR + RSC + Edge Middleware
4. **Разделение стейта:** `TanStack Query v5` (серверный кэш) + `Zustand` (клиентский UI-стейт)
5. **Offline-First БД в браузере:** `IndexedDB` (`idb-keyval` + TanStack Query Persister с TTL 24 часа)
6. **Формы и сквозная валидация:** `React Hook Form` + `Zod` (`packages/shared-schemas`)
7. **UI-система и документация:** `Tailwind CSS` + `shadcn/ui` (Radix UI) + `Storybook`
8. **Таблицы и экспериментальный рантайм:** `TanStack Table` (Tech Radar + ADR) & `TanStack Redact`
9. **Контент и визуализация:** `MDX` + `WebP` (`next/image` гриды) + интерактивные графы `D3.js`
10. **Основной Backend:** `NestJS` (модульная DI-архитектура)
11. **Безопасность:** `JWT` в `HttpOnly Cookies` (`kb_access_token`) + `RBAC` (`GUEST` / `USER` / `ADMIN`)
12. **База данных и ORM:** `PostgreSQL` (`Neon.tech`) + `Prisma ORM`
13. **Микросервисы и Real-Time:** `@nestjs/microservices` (`apps/telemetry-ms`) + `Server-Sent Events (@Sse)`
14. **Инфраструктура:** `Docker` (Multi-stage builds с `turbo prune`) + `Docker Compose`
15. **Наблюдаемость:** `Sentry` (Error Tracking) + `PostHog` (Product Analytics & Feature Flags)

## 📂 Структура монорепозитория

```text
greatest-portfolio/
├── .agents/                    # Каскадная система контекста и ADR для ИИ-агентов
│   ├── implementation-plan.md  # Пошаговый план реализации (Эпики 1–7)
│   ├── architecture/           # ADR-каталог, общие контракты, Docker & Observability
│   ├── frontend/               # Правила Next.js, Workfolio UI, Storybook, State, Auth
│   └── backend/                # Правила NestJS, JWT Security, Prisma, Microservices & SSE
├── apps/
│   ├── web/                    # Next.js App Router (Workfolio CV + закрытая Knowledge Base)
│   ├── api/                    # Основной бэкенд NestJS + Prisma + SSE Stream
│   └── telemetry-ms/           # Микросервис телеметрии и аналитики (@nestjs/microservices)
├── packages/
│   ├── shared-schemas/         # Единые Zod-схемы и TS-типы для фронта и бэка
│   └── ui/                     # UI-кит (Tailwind + shadcn/ui + Storybook)
├── docker/                     # Multi-stage Dockerfiles
├── scripts/                    # Скрипты автоматизации (авто-бамп версии и др.)
├── AGENTS.md                   # Корневой роутер контекста для ИИ
├── biome.json                  # Единый линтер и форматтер (Rust)
├── lefthook.yml                # Git-хуки (Biome + Typecheck + Semver bump)
├── pnpm-workspace.yaml         # Конфигурация пакетов монорепозитория
├── tsconfig.base.json          # Строгий базовый конфиг TypeScript
└── turbo.json                  # Пайплайны сборки и кэширования Turborepo
```

## 🚀 Навигация по документации

- [Корневой роутер контекста ИИ (`AGENTS.md`)](./AGENTS.md)
- [Пошаговый план реализации и Implementation Notes (`.agents/implementation-plan.md`)](./.agents/implementation-plan.md)
- [Полный каталог ADR: Почему, Где и Как (`.agents/architecture/adr-stack.md`)](./.agents/architecture/adr-stack.md)
