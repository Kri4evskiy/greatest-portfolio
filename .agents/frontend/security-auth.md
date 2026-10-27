# 🔐 Фронтенд Security: Edge Middleware, RBAC UI и Микро-форма для Team Lead (`apps/web`)

Этот документ описывает защиту клиентских и серверных маршрутов в `apps/web` и UX получения гостевого доступа.

## 1. Защита роутов на уровне Next.js Edge Middleware (`src/middleware.ts`)
- Middleware перехватывает все запросы к `/knowledge-base` и `/knowledge-base/:path*`.
- Проверяет наличие и структуру куки `kb_access_token` (`HttpOnly` JWT, выписанный бэкендом `apps/api`).
- Если куки нет или токен истек:
  - При прямом заходе по URL `/knowledge-base/...` делает безопасный редирект на `/?unlock=knowledge-base&redirect=/knowledge-base/...`.
  - На главной странице параметр `?unlock=knowledge-base` автоматически открывает приветственную микро-модалку получения доступа.

## 2. UX Микро-формы «Guest Pass в 1 клик» для Рекрутера / Team Lead
Мы не заставляем занятого тимлида придумывать пароли или подтверждать email. Микро-форма в хедере решает две задачи: защищает роут и демонстрирует инженерную связку в действии:
- В модалке выводится прозрачный инженерный дисклеймер:
  > *«Введи любое имя и выбери свою роль в 1 клик — это живое демо работы `React Hook Form` + `Zod` (`packages/shared-schemas`) + `NestJS JWT HttpOnly Cookies` + `Next.js Edge Middleware` + `RBAC` + `SSE Telemetry`.»*
- Поля формы:
  1. `Имя / Никнейм` (плюс кнопки быстрого заполнения в 1 клик: `Alex (Team Lead)`, `Maria (Tech Recruiter)`, `CTO Guest`).
  2. `Роль посетителя` (`TEAM_LEAD`, `RECRUITER`, `DEVELOPER`, `FOUNDER`).
  3. Скрывающийся спойлер `I am the owner (Admin Passcode)` для получения роли `ADMIN`.
- После успешного `POST /api/auth/guest-pass`:
  1. Бэкенд выставляет `Set-Cookie: kb_access_token=...; HttpOnly; SameSite=Lax`.
  2. Инвалидируется запрос `useVisitorProfile()`, иконка замка в хедере плавно меняется с `🔒` на `🔓`.
  3. В SSE-стрим улетает событие о выдаче пропуска, а пользователь бесшовно переходит в `/knowledge-base`.
