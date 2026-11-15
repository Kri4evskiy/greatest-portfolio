# 🛡️ Бэкенд Security: JWT в HttpOnly Cookies и RBAC Guards (`apps/api`)

Этот документ описывает реализацию безопасности и ролевой модели в `apps/api`.

## 1. Почему только `HttpOnly Cookies`

- Токен доступа `kb_access_token` **никогда** не передается в теле JSON для сохранения в `LocalStorage`.
- При вызове `POST /api/auth/guest-pass` сервер подписывает JWT (`@nestjs/jwt`) с полезной нагрузкой `{ sub: session.id, displayName, visitorType, role }` и устанавливает куку:
  - `httpOnly: true` (защита от XSS — `document.cookie` не видит токен);
  - `secure: process.env.NODE_ENV === 'production'`;
  - `sameSite: 'lax'`;
  - `path: '/'`;
  - `maxAge: 1000 * 60 * 60 * 24 * 7` (7 дней).

## 2. Ролевая модель RBAC (`GUEST` / `USER` / `ADMIN`)

1. `GUEST`: Посетитель без куки `kb_access_token`. Имеет доступ к публичным эндпоинтам (`/api/auth/me`, `/api/auth/guest-pass`, `/api/telemetry/stream`), но получает `403 Forbidden` при обращении к защищенным эндпоинтам `/api/knowledge/*`.
2. `USER`: Посетитель, заполнивший микро-форму Guest Pass. Получает полный доступ к чтению и интерактивным метрикам Базы Знаний (`/api/knowledge/*`).
3. `ADMIN`: Владелец портфолио, указавший валидный `ADMIN_SECRET_PASSCODE` при получении пропуска. Имеет доступ к расширенным логам телеметрии и сбросу/модерации метрик.

## 3. Эндпоинты `AuthController`

- `POST /api/auth/guest-pass`: Валидирует `GuestPassFormSchema`, создает запись `VisitorSession` в БД через Prisma, отправляет событие `GUEST_PASS_ISSUED` в микросервис телеметрии, ставит `HttpOnly` куку и возвращает профиль сессии.
- `POST /api/auth/login`: Алиас для `guest-pass` с идентичной защитой от брутфорса.
- `GET /api/auth/me`: Читает куку `kb_access_token`. Если она отсутствует или невалидна — возвращает `{ role: 'GUEST', displayName: null, visitorType: null }` со статусом `200 OK` (чтобы фронтенд знал текущий статус без лишних красных ошибок в консоли).
- `POST /api/auth/logout`: Очищает куку `kb_access_token` и возвращает статус `GUEST`.

## 4. Rate Limiting (`@nestjs/throttler`) и защита от брутфорса

1. Глобальный `ThrottlerGuard` подключен через `APP_GUARD` в `AppModule` с базовым скользящим окном `ttl: 60000` (60 сек) и лимитом `limit: 100`.
2. Эндпоинты `POST /api/auth/guest-pass` и `POST /api/auth/login` защищены строгим декоратором:
   `@Throttle({ default: { limit: 5, ttl: 60000 } })` — максимум 5 попыток ввода пасскода за 60 секунд на IP-адрес.
3. Постоянный SSE-стрим `GET /api/telemetry/stream` помечен `@SkipThrottle()` точечно на методе (в то время как `GET /api/telemetry/stats` защищён общим лимитом 100 req/min).
4. **Нюанс ESM / CommonJS (`tsx` Dual Package Hazard):**
   `@nestjs/core@12.x` перешёл на нативный ESM (`"type": "module"`), тогда как `@nestjs/throttler@6.7.1` всё ещё публикуется как CommonJS. В dev-режиме (`tsx watch`) это создаёт разные ссылки на класс `Reflector` в памяти. В `apps/api/src/app.module.ts` реализован явный мост через `Reflect.getMetadata('design:paramtypes', ThrottlerGuard)?.[2]` + `useExisting: Reflector`. Когда `@nestjs/throttler` обновится и выйдет с нативным ESM (`"type": "module"`), этот мост можно удалить.
5. **Продакшен за прокси (Next.js rewrites / Nginx / Render):**
   В `apps/api/src/main.ts` в продакшен-режиме включён `app.set('trust proxy', 1)` (доверие ровно 1 прокси-хопу), благодаря чему троттлер считывает реальный IP клиента из `X-Forwarded-For` без уязвимости к подмене заголовка.

## 5. Спецификация перехода на Redis (Distributed Throttling & Caching)

При масштабировании бэкенда на 2+ инстанса (или деплое нескольких реплик за балансировщиком нагрузки) память In-Memory разделяется. Для сохранения единого лимита и разгрузки базы данных подключается **Redis** (Upstash / Docker):

### А. Архитектурный паттерн Graceful Degradation (In-Memory Fallback):

Если переменная `REDIS_URL` не задана в `.env`, `AppModule` инициализирует стандартный In-Memory сторадж без ошибок. Если `REDIS_URL` задан — подключается распределенный Redis-клиент:

```typescript
// Пример подключения в ThrottlerModule.forRootAsync:
ThrottlerModule.forRootAsync({
  useFactory: () => {
    const redisUrl = process.env.REDIS_URL
    return {
      throttlers: [{ ttl: 60000, limit: 100 }],
      storage: redisUrl ? new ThrottlerStorageRedisService(new Redis(redisUrl)) : undefined,
    }
  },
})
```

### Б. Caching аналитики (`GET /api/knowledge/stats`):

- Пакеты: `@nestjs/cache-manager` + `cache-manager-redis-yet`.
- Декоратор: `@UseInterceptors(CacheInterceptor)` с `@CacheTTL(60000)` на `getStats()`.
- Результат: агрегированные метрики статей читаются из RAM за 1 мс, разгружая PostgreSQL (Neon.tech) на 95%.

### В. Затрагиваемые файлы при внедрении:

1. `docker-compose.yml` (сервис `redis:7-alpine`, порт `6379`, сеть `backend-network`).
2. `apps/api/package.json` (`ioredis`, `@nest-lab/throttler-storage-redis`, `@nestjs/cache-manager`).
3. `apps/api/src/app.module.ts` (фабрика с проверкой `process.env.REDIS_URL`).
4. `apps/api/src/modules/knowledge/knowledge.controller.ts` (кэш на чтение статистики).
5. `.env.example` (`REDIS_URL=redis://localhost:6379`).
