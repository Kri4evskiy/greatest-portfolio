# 📦 Общие контракты и Zod-схемы (`packages/shared-schemas`)

Этот документ регламентирует работу с пакетом `@repo/shared-schemas` (`packages/shared-schemas`), который является **единым источником истины (Single Source of Truth)** для валидации и типов между `apps/web` (Next.js) и `apps/api` / `apps/telemetry-ms` (NestJS).

## 🎯 Архитектурные правила

1. **Запрет на дублирование типов:** Никогда не создавай ручные интерфейсы DTO на фронтенде или бэкенде, если эти данные пересекают границу сети (HTTP / SSE / Microservice).
2. **Схема первична, тип вторичен:** Сначала описывается `Zod`-схема, затем из неё выводится тип через `z.infer<typeof Schema>`.
3. **Zero Runtime Dependencies (кроме `zod`):** В `packages/shared-schemas` не должно быть зависимостей от React, Next.js, NestJS или Prisma.

## 🧱 Обязательные схемы пакета

### 1. Роли и RBAC (`roles.schema.ts`)

- `RoleEnum = z.enum(['GUEST', 'USER', 'ADMIN'])`
- `VisitorRoleType = z.enum(['TEAM_LEAD', 'RECRUITER', 'DEVELOPER', 'FOUNDER', 'OTHER'])`

### 2. Микро-форма получения доступа (`auth.schema.ts`)

- `GuestPassFormSchema`:
  - `displayName`: `z.string().trim().min(2).max(50)` — имя посетителя (в 1 клик для тимлида/рекрутера).
  - `visitorType`: `VisitorRoleType` — роль посетителя в компании.
  - `adminPasscode`: `z.string().trim().max(100).optional()` — опциональный секретный ключ владельца для повышения роли до `ADMIN`.
- `SessionProfileSchema`:
  - `id`: `z.uuid().nullable()`
  - `displayName`: `z.string().nullable()`
  - `visitorType`: `VisitorRoleType.nullable()`
  - `role`: `RoleEnum`
  - `expiresAt`: `z.iso.datetime().nullable()`

### 3. Метаданные Базы Знаний (`knowledge.schema.ts`)

- `KnowledgeCategoryEnum = z.enum(['this-project', 'react', 'typescript', 'nestjs', 'nestjs-prisma', 'architecture-devops', 'databases-sql', 'testing', 'system-design', 'others'])`
- `getKnowledgeCategoryLabel(category, locale)` и `formatKnowledgeSegmentLabel(segment, locale)` — локализованные названия корневых разделов и вложенных подпапок любой глубины.
- `ArticleMetaSchema`:
  - `slug`: `z.string().min(1)`
  - `category`: `KnowledgeCategoryEnum`
  - `viewsCount`: `z.number().int().nonnegative()`
  - `helpfulCount`: `z.number().int().nonnegative()`
  - `updatedAt`: `z.iso.datetime()`

### 4. События телеметрии и SSE (`telemetry.schema.ts`)

- `TelemetryEventTypeEnum = z.enum(['GUEST_PASS_ISSUED', 'ARTICLE_VIEWED', 'ARTICLE_HELPFUL', 'SYSTEM_HEARTBEAT'])`
- `TelemetryEventSchema`:
  - `id`: `z.uuid()`
  - `type`: `TelemetryEventTypeEnum`
  - `message`: `z.string()`
  - `actorName`: `z.string().optional()`
  - `actorRole`: `VisitorRoleType.optional()`
  - `slug`: `z.string().optional()`
  - `timestamp`: `z.iso.datetime()`

### 5. Матрица технологий и ADR (`tech-radar.schema.ts`)

- `TechCategoryEnum = z.enum(['Frontend', 'Backend', 'Database & Storage', 'DevOps & DX', 'Architecture'])`
- `TechRadarItemSchema`:
  - `id`: `z.string()`
  - `name`: `z.string()`
  - `category`: `TechCategoryEnum`
  - `experienceYears`: `z.number()`
  - `level`: `z.enum(['Core', 'Production', 'Experimental'])`
  - `adrWhy`: `z.string()`
  - `adrWhere`: `z.string()`
  - `adrHow`: `z.string()`

### 6. Мультиязычность и локали (`locale.schema.ts`)

- `SupportedLocaleEnum = z.enum(['en', 'uk', 'ru'])`
- `DEFAULT_LOCALE = 'en'`
- `LOCALE_METADATA`: словарь кодов, коротких меток (`EN`, `UA`, `RU`), нативных названий языков, тегов для `Intl` (`intlLocale`: `'en-US' | 'uk-UA' | 'ru-RU'`), OpenGraph-локалей (`ogLocale`: `'en_US' | 'uk_UA' | 'ru_RU'`) и URL-префиксов (`urlPrefix`: `'' | '/ua' | '/ru'`).

### 7. Контракты Offset и Cursor пагинации (`pagination.schema.ts`, `knowledge.schema.ts`, `telemetry.schema.ts`)

- `OffsetPaginationQuerySchema` (`limit`, `offset`), `PaginatedArticleMetricsQuerySchema` (`limit`, `offset`, `category`, `sortBy: 'viewsCount' | 'helpfulCount'`) и фабрика `createOffsetPaginatedResponseSchema(ItemSchema)` (используется в `PaginatedArticleMetricsResponseSchema` для `GET /api/knowledge/metrics/paginated`).
- `CursorPaginationQuerySchema` (`limit`, `cursor`), `SystemEventsQuerySchema` (`limit`, `cursor`, `eventType`), `TelemetryStatsResponseSchema` и фабрика `createCursorPaginatedResponseSchema(ItemSchema)` (используется в `PaginatedSystemEventsResponseSchema` для `GET /api/telemetry/events`).

### 8. Возможности системы и общие роуты (`capabilities.schema.ts`, `api-routes.ts`)

- `SystemCapabilitiesSchema` (`status: 'ok'`, `mode: 'demo' | 'development' | 'production'`, `persistence: 'postgresql' | 'in-memory-fallback'`, `rateLimiter: 'redis' | 'in-memory'`, `telemetryTcpConnected: boolean`, `integrations: { redisCache, s3ObjectStorage, telegramBotAuth, sentryObservability }`, `timestamp: z.iso.datetime()`).
- `API_ENDPOINTS`, типы `ApiEndpointPath` / `EndpointPathParams` и универсальный резолвер `resolveEndpoint(template, pathParams)` — единый реестр клиентских `/api/*` путей (включая параметризованные шаблоны вроде `/api/knowledge/:slug/view`), потребляемый Axios-клиентом `apiClient` (`apps/web/src/shared/lib/api-client.ts`).

### 9. Тестирование контрактов (`src/__tests__/`)

- Регрессионные unit-тесты на `Vitest` (`api-routes.test.ts` и `contracts.test.ts`) покрывают `resolveEndpoint`, валидацию `SystemCapabilitiesSchema`, `PaginatedArticleMetricsQuerySchema` (defaults & bounds), `SystemEventsQuerySchema` и целостность 16 локализованных ADR в `tech-radar.schema.ts` (см. `.agents/testing/testing-strategy.md`).
