# ⚙️ Архитектура основного бэкенда NestJS (`apps/api`)

Этот документ описывает правила разработки в приложении `apps/api`.

## 1. Модульная структура (Domain-Driven NestJS Modules)
Никакой бизнес-логики в контроллерах или корневом `AppModule`. Приложение разделено на изолированные модули:
- `PrismaModule` (`@Global()`): Управляет жизненным циклом соединения с PostgreSQL (`Neon.tech` / локальный Docker Postgres).
- `AuthModule`: Выпуск и верификация `JWT` в `HttpOnly Cookies`, управление гостевыми сессиями (`VisitorSession`) и `RBAC` (`JwtRolesGuard`, `@Roles()`).
- `KnowledgeModule`: Управление метриками статей Базы Знаний (`GET /api/knowledge/metrics`, `POST /api/knowledge/:slug/view`, `POST /api/knowledge/:slug/helpful`), защищенное ролями `USER` и `ADMIN`.
- `TelemetryModule`: Проксирование событий в микросервис `apps/telemetry-ms` через `@nestjs/microservices` и раздача реального времени клиентам через `@Sse('/api/telemetry/stream')`.

## 2. Сквозная валидация через `ZodValidationPipe`
- Вместо дублирования классов с `class-validator`, все входящие `Body`, `Query` и `Params` валидируются кастомным `ZodValidationPipe`, который принимает схемы напрямую из `@repo/shared-schemas`.
- При ошибке валидации возвращается структурированный `400 Bad Request` со списком полей `issues`.

## 3. Стандарты контроллеров и сервисов
- Глобальный префикс API: `/api`.
- Включен `cookie-parser` и строгий `CORS` с `credentials: true`, разрешающий обмен `HttpOnly` куками с `apps/web`.
- Все 5xx исключения проходят через `GlobalExceptionFilter` (с интеграцией в `Sentry`).
