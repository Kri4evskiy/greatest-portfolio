# 🐳 Инфраструктура, Docker и Наблюдаемость (`docker/`, `Sentry`, `PostHog`)

Этот документ описывает правила контейнеризации монорепозитория и подключения инструментов Observability.

## 1. Multi-stage Dockerfiles с `turbo prune`

Каждое приложение (`apps/web`, `apps/api`, `apps/telemetry-ms`) собирается по 3-ступенчатому шаблону в папке `docker/`:
1. **Stage 1 (`pruner`):** Использует `turbo prune @repo/<app-name> --docker`, чтобы вырезать из монорепозитория только те пакеты (`packages/shared-schemas`, `packages/ui`), от которых зависит конкретный сервис, и сформировать изолированный lockfile.
2. **Stage 2 (`installer & builder`):** Ставит зависимости через `pnpm install --frozen-lockfile` (используя кэш слоев Docker) и запускает `pnpm turbo build --filter=@repo/<app-name>...`.
3. **Stage 3 (`runner`):** Чистый `node:22-alpine` образ, работающий от непривилегированного пользователя (`USER node` / `nextjs`), содержащий только скомпилированный артефакт (`standalone` для Next.js, `dist` для NestJS).

## 2. Единый `docker-compose.yml`

Поднимает одной командой `docker compose up --build` весь стек для проверки тимлидом локально:
- `postgres`: `postgres:16-alpine` с healthcheck и volume (чтобы стек работал даже полностью автономно без внешнего интернета/Neon).
- `telemetry-ms`: Микросервис телеметрии (порт TCP `4001`).
- `api`: Основной бэкенд NestJS (порт HTTP `4000`, накатывает миграции Prisma и подключается к `telemetry-ms`).
- `web`: Фронтенд Next.js (порт HTTP `3000`).

## 3. Наблюдаемость (`Sentry` + `PostHog`)

- **Sentry:**
  - В `apps/web`: `global-error.tsx` и клиентский/серверный перехват исключений.
  - В `apps/api`: `SentryExceptionFilter` (глобальный фильтр исключений NestJS, логирующий 5xx ошибки с контекстом запроса).
  - Работает по принципу Graceful Degradation: если `SENTRY_DSN` не задан в `.env`, приложение работает штатно без падений.
- **PostHog:**
  - Легковесный провайдер в `apps/web` для продуктовой аналитики: отслеживает события `guest_pass_modal_opened`, `guest_pass_unlocked`, `adr_popover_inspected`, `article_read`.
  - Если `NEXT_PUBLIC_POSTHOG_KEY` пуст — переходит в no-op режим разработки.
