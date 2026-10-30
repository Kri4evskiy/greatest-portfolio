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
- `GET /api/auth/me`: Читает куку `kb_access_token`. Если она отсутствует или невалидна — возвращает `{ role: 'GUEST', displayName: null, visitorType: null }` со статусом `200 OK` (чтобы фронтенд знал текущий статус без лишних красных ошибок в консоли).
- `POST /api/auth/logout`: Очищает куку `kb_access_token` и возвращает статус `GUEST`.
