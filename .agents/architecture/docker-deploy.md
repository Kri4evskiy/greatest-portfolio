# 🐳 Инфраструктура, Docker и Наблюдаемость (`docker/`, `Sentry`, `PostHog`)

Этот документ описывает правила контейнеризации монорепозитория и подключения инструментов Observability.

## 1. Multi-stage Dockerfiles с `turbo prune`

Каждое приложение (`apps/web`, `apps/api`, `apps/telemetry-ms`) собирается по 3-ступенчатому шаблону в папке `docker/`:
1. **Stage 1 (`pruner`):** Использует `turbo prune @repo/<app-name> --docker`, чтобы вырезать из монорепозитория только те пакеты (`packages/shared-schemas`, `packages/ui`), от которых зависит конкретный сервис, и сформировать изолированный lockfile.
2. **Stage 2 (`installer & builder`):** Предварительно прогревает бинарник `pnpm@12.21.0` в кэшируемом слое (`corepack prepare ... && pnpm --version`), ставит зависимости через `pnpm install --frozen-lockfile --ignore-scripts` с использованием BuildKit Cache Mount (`--mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store`), запускает `pnpm turbo run build --filter=@repo/<app-name>...` и очищает `devDependencies` (`pnpm prune --prod --ignore-scripts`). Для `api` на базе Rust-free Prisma 7 не требуется обход с `/tmp/.prisma`: сгенерированный ESM-клиент компилируется `tsc` прямо в `apps/api/dist/generated/prisma/`, а WASM-рантайм остаётся в production-зависимостях `@prisma/client`.
3. **Stage 3 (`runner`):** Чистый `node:22-alpine` образ, работающий от непривилегированного пользователя (`USER node` / `nextjs`), содержащий только скомпилированный артефакт (`standalone` для Next.js, `dist` + production `node_modules` для NestJS — без `openssl` в рантайме для `api`).

## 2. Разделение `docker-compose.yml` (Zero-Friction Demo) и `docker-compose.prod.yml` (Strict Production)

> **⚠️ ПРАВИЛО СИНХРОНИЗАЦИИ COMPOSE-ФАЙЛОВ:** При добавлении новых сервисов (например, `redis`, `minio`, `nginx`), сетей, volumes или переменных окружения **ОБЯЗАТЕЛЬНО** синхронизировать изменения сразу в обоих файлах (`docker-compose.yml` и `docker-compose.prod.yml`) с учетом их режима безопасности.

Оркестрация разделена на два режима с сохранением двух изолированных bridge-сетей (`backend-network` и `frontend-network`):

1. **`docker-compose.yml` (Local Reviewer Demo — запуск в 1 команду без `.env`):**
   - Поднимается командой `docker compose up --build -d`.
   - В `api` передается `WORKFOLIO_DEMO_MODE: "true"` и `JWT_SECRET: ${JWT_SECRET:-}` (если `.env` нет, оба сервиса `api` и `web` автоматически подтягивают единый `DEFAULT_DEV_JWT_SECRET` из `@repo/shared-schemas` через `resolveJwtSecret()`).
   - При `isProduction && isDemoMode` в `apps/api/src/config/app.config.ts` разрешается старт с демо-кредами, выводится предупреждение `[WORKFOLIO DEMO MODE]` в лог, а кука `kb_access_token` ставится с `secure: false` для работы по `http://localhost:3000`.
2. **`docker-compose.prod.yml` (Strict Production):**
   - Поднимается командой `docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d`.
   - `WORKFOLIO_DEMO_MODE` отсутствует: `JWT_SECRET` (`>= 32` символов), `ADMIN_SECRET_PASSCODE`, `POSTGRES_PASSWORD`, `WEB_ORIGIN` и `NEXT_PUBLIC_SITE_URL` принудительно проверяются на уровне парсинга Compose (`${VAR:?}`) и fail-fast валидацией `loadAppConfig()` в NestJS.
   - Порт `postgres` (`5432`) **не публикуется** на хост-машину и доступен исключительно внутри закрытой сети `backend-network`.

Сетевая сегментация (Zero-Trust Network Segmentation):
- **`backend-network` (полностью закрытый контур):**
  - `postgres`: `postgres:16-alpine` с healthcheck (`pg_isready`) и volume. В локальном `docker-compose.yml` порт `127.0.0.1:5432:5432` привязан строго к loopback-интерфейсу хоста (для DBeaver/DataGrip); в `docker-compose.prod.yml` секция `ports` удалена полностью.
  - `redis` **[Planned — Приоритет №2, ещё не добавлен в `docker-compose.yml`]:** планируемый in-memory кэш и distributed rate limiter (`redis:7-alpine`) с healthcheck (`redis-cli ping`). Будет привязан к `127.0.0.1:6379:6379` локально для Redis Insight и изолирован строго внутри `backend-network` в продакшене (с graceful in-memory fallback без `REDIS_URL`).
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

## 4. Nginx Reverse Proxy, Load Balancer и Dual-Mode (Офлайн vs Облако)

Подробная архитектурная спецификация Nginx, пакета `@repo/redis`, интеграции с Cloudflare R2 / AWS S3 и работы системы в автономном режиме («The Big Toggle») задокументирована в:
👉 **[enterprise-infrastructure-roadmap.md](./enterprise-infrastructure-roadmap.md)**.
