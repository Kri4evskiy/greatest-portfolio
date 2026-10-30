# 🗄️ База данных PostgreSQL (Neon.tech) и Prisma ORM (`apps/api/prisma`)

Этот документ описывает схему базы данных и правила работы с `Prisma ORM`.

## 1. Подключение к PostgreSQL

- В продакшене и облачной разработке используется Serverless PostgreSQL от **Neon.tech** (`DATABASE_URL` с пулингом соединений и `DIRECT_URL` для миграций).
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

## 3. Правила работы с Prisma в `apps/api`

- Все запросы к БД выполняются через инжектируемый `PrismaService` (`extends PrismaClient implements OnModuleInit, OnModuleDestroy`).
- Для инкремента счетчиков (`viewsCount`, `helpfulCount`) используется атомарная операция `upsert` с `{ increment: 1 }`, исключающая состояние гонки (race conditions).
