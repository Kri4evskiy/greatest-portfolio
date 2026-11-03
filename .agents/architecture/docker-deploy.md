# 🐳 Инфраструктура, Docker и Наблюдаемость (`docker/`, `Sentry`, `PostHog`)

Этот документ описывает правила контейнеризации монорепозитория и подключения инструментов Observability.

## 1. Multi-stage Dockerfiles с `turbo prune`

Каждое приложение (`apps/web`, `apps/api`, `apps/telemetry-ms`) собирается по 3-ступенчатому шаблону в папке `docker/`:
1. **Stage 1 (`pruner`):** Использует `turbo prune @repo/<app-name> --docker`, чтобы вырезать из монорепозитория только те пакеты (`packages/shared-schemas`, `packages/ui`), от которых зависит конкретный сервис, и сформировать изолированный lockfile.
2. **Stage 2 (`installer & builder`):** Ставит зависимости через `pnpm install --frozen-lockfile` (используя кэш слоев Docker) и запускает `pnpm turbo build --filter=@repo/<app-name>...`.
3. **Stage 3 (`runner`):** Чистый `node:22-alpine` образ, работающий от непривилегированного пользователя (`USER node` / `nextjs`), содержащий только скомпилированный артефакт (`standalone` для Next.js, `dist` для NestJS).

## 2. Единый `docker-compose.yml` и сетевая изоляция (Zero-Trust Network Segmentation)

Стек поднимается одной командой `docker compose up --build -d` с разделением на две изолированные bridge-сети:
- **`backend-network` (полностью закрытый контур):**
  - `postgres`: `postgres:16-alpine` с healthcheck (`pg_isready`) и volume. Порт `127.0.0.1:5432:5432` привязан строго к loopback-интерфейсу хоста (для DBeaver/DataGrip), защищая базу от внешнего доступа из локальной сети.
  - `telemetry-ms`: микросервис телеметрии (TCP `:4001`). Порт **не экспонируется наружу** на хост и доступен только для `api` внутри docker-сети.
- **`frontend-network` (демилитаризованный контур):**
  - `api`: основной бэкенд NestJS 12. Подключен к **обеим сетям**, выступает защищенным шлюзом. Оснащен встроенным healthcheck (`wget http://127.0.0.1:4000/api/health`).
  - `web`: фронтенд Next.js 16 (порт `3000:3000`). Подключен только к `frontend-network`, не имеет прямого доступа к базе данных и TCP-микросервису. Запускается строго после успешного healthcheck API (`condition: service_healthy`).

## 3. Наблюдаемость (`Sentry` + `PostHog`)

- **Sentry:**
  - В `apps/web`: `global-error.tsx` и клиентский/серверный перехват исключений.
  - В `apps/api`: `SentryExceptionFilter` (глобальный фильтр исключений NestJS, логирующий 5xx ошибки с контекстом запроса).
  - Работает по принципу Graceful Degradation: если `SENTRY_DSN` не задан в `.env`, приложение работает штатно без падений.
- **PostHog:**
  - Легковесный провайдер в `apps/web` для продуктовой аналитики: отслеживает события `guest_pass_modal_opened`, `guest_pass_unlocked`, `adr_popover_inspected`, `article_read`.
  - Если `NEXT_PUBLIC_POSTHOG_KEY` пуст — переходит в no-op режим разработки.
