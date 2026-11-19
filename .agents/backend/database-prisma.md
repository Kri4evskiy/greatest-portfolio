# 🗄️ База данных PostgreSQL (Neon.tech) и Prisma 7 ORM (`apps/api/prisma`)

Этот документ описывает схему базы данных и правила работы с `Prisma 7 ORM` (Rust-free Wasm + Native ESM).

## 1. Подключение к PostgreSQL

- В продакшене и облачной разработке используется Serverless PostgreSQL от **Neon.tech** (`DATABASE_URL` с пулингом соединений для рантайма `@prisma/adapter-pg` + `pg.Pool` и `DIRECT_URL` для CLI-миграций).
- Конфигурация Prisma CLI вынесена из `schema.prisma` в `apps/api/prisma.config.ts` (`defineConfig`), где подгружаются `apps/api/.env` и корневой `.env` через нативный `node:process` (`loadEnvFile`), а для `datasource.url` используется `DIRECT_URL || DATABASE_URL || placeholder`, чтобы `prisma generate` работал в CI/Docker и air-gapped режиме без БД.
- Для автономного локального запуска через `docker compose up --build` поднимается контейнер `postgres:16-alpine` с автоматическим применением схемы.

## 2. Модели `schema.prisma`

### `VisitorSession` (Выданные гостевые доступы и роли)

- `id`: `String @id @default(uuid())`
- `displayName`: `String`
- `visitorType`: `String` (`TEAM_LEAD`, `RECRUITER`, `DEVELOPER`, `FOUNDER`, `OTHER`)
- `role`: `String @default("USER")` (`USER`, `ADMIN`)
- `userAgent`: `String?`
- `createdAt`: `DateTime @default(now())`
- `expiresAt`: `DateTime`

### `ArticleMetrics` (Метрики и реакции для каждой MDX-статьи)

- `slug`: `String @id`
- `category`: `String`
- `viewsCount`: `Int @default(0)`
- `helpfulCount`: `Int @default(0)`
- `updatedAt`: `DateTime @updatedAt`

### `SystemEventLog` (Аудит-лог событий для микросервиса и админ-панели)

- `id`: `String @id @default(uuid())`
- `eventType`: `String` (`GUEST_PASS_ISSUED`, `ARTICLE_VIEWED`, `ARTICLE_HELPFUL`)
- `payload`: `Json`
- `createdAt`: `DateTime @default(now())`

## 3. Правила работы с Prisma 7 в `apps/api`

- Генератор в `schema.prisma` использует `provider = "prisma-client"`, `output = "../src/generated/prisma"`, `moduleFormat = "esm"` и `importFileExtension = "js"`, поэтому клиент компилируется через `tsc` прямо в `dist/generated/prisma/`.
- Все запросы к БД выполняются через инжектируемый `PrismaService` (`implements OnModuleInit, OnModuleDestroy`) на базе **композиции**: сервис держит опциональные `client: PrismaClient | null` и `pool: Pool | null`, создаёт их через `PrismaPg` (`@prisma/adapter-pg`) только при наличии `DATABASE_URL` (с поддержкой `?schema=...` через `extractPostgresSchema`) и выполняет eager-проверку доступности `await client.$connect()` + `await client.$queryRaw\`SELECT 1\``. Если `DATABASE_URL` отсутствует или база недоступна, пул корректно закрывается (`pool.end()`) и сервис без падения откатывается на In-Memory хранилище.
- Для инкремента счетчиков (`viewsCount`, `helpfulCount`) используется атомарная операция `upsert` с `{ increment: 1 }`, исключающая состояние гонки (race conditions).
- Скрипт сидирования `src/migrations/scripts/seed.ts` (и команда `seed` в `prisma.config.ts`) использует тот же драйверный адаптер `Pool` + `PrismaPg` и закрывает и `prisma.$disconnect()`, и `pool.end()` в `finally`.
