# 🗺️ Пошаговый Implementation Plan & Implementation Notes

Этот документ — пошаговое руководство по реализации монорепозитория (`greatest-portfolio`). Мы идем **строго по шагам**, проверяя критерий готовности (Definition of Done) после каждого этапа.

---

## 🎨 Визуальный и продуктовый ориентир стартовой страницы

- **Референс:** [Notion Workfolio Template](https://www.notion.com/templates/workfolio) — минималистичная, чистая редакционная подача личного портфолио, где акцент сделан на типографике, карточках кейсов, таймлайне опыта и структурированных базах данных.
- **Наше инженерное усиление поверх Workfolio:**
  1. **Sticky Header сверху:** Хлебные крошки в духе Notion (`workspace / workfolio`), быстрые якоря по разделам резюме и выделенная кнопка перехода в **`Base of Knowledge`** с живым индикатором роли (`🔒 Protected` для `GUEST` -> клик открывает 1-клик модалку для Team Lead -> меняется на `🔓 Base of Knowledge` для `USER`/`ADMIN`).
  2. **Интерактивная база данных навыков (`Tech Radar` на `TanStack Table`):** Встроена прямо в тело страницы Workfolio как нативная таблица Notion, но с мгновенной мульти-фильтрацией и кнопками **«ADR: Почему / Где / Как»** по каждой из 15 технологий.
  3. **Живой инженерный Footer:** Отображает актуальную патч-версию из `package.json` (обновляется хуком `Lefthook` на каждый коммит) и индикатор реального времени `Server-Sent Events (SSE)` от микросервиса `telemetry-ms`.

---

## ЭПИК 1: Фундамент монорепозитория, Каскадный ИИ-контекст и DX

### [x] Шаг 1.1: Инициализация Workspace (`pnpm` + `Turborepo`)

- **Контекст ИИ:** `.agents/architecture/adr-stack.md`
- **Что именно делаем (Implementation Notes):**
  1. Создаем корневой `package.json` (`"name": "greatest-portfolio"`, `"version": "0.0.1"`, `"private": true`, `"packageManager": "pnpm@..."`) со скриптами `dev`, `build`, `lint`, `typecheck`, `format`.
  2. Создаем `pnpm-workspace.yaml`, объединяющий `apps/*` и `packages/*`.
  3. Создаем `turbo.json` (v2 schema `tasks`) с пайплайнами `build` (`dependsOn: ["^build"]`), `typecheck` (`dependsOn: ["^typecheck"]`), `lint`, `dev` (`cache: false`, `persistent: true`).
  4. Обновляем корневой `.gitignore` (игнорируем `node_modules`, `.turbo`, `.next`, `dist`, `storybook-static`, `.env*` кроме `.env.example`).
- **Критерий готовности:** Команда `pnpm install` отрабатывает без ошибок и формирует `pnpm-lock.yaml`.

### [x] Шаг 1.2: Развертывание каскадной системы контекста `.agents/`

- **Контекст ИИ:** `AGENTS.md`
- **Что именно делаем (Implementation Notes):**
  1. Корневой роутер `AGENTS.md` с жесткой таблицей маршрутизации контекста.
  2. Полное дерево правил `.agents/{architecture,frontend,backend}` и этот файл `.agents/implementation-plan.md`.
  3. Интеграция официальных гайдов Next.js AI Agents (`nextjs.org/docs/app/guides/ai-agents`) и Vercel Engineering React Best Practices (`vercel-labs/agent-skills`) в `.agents/skills/react-next-best-practices/SKILL.md`.
- **Критерий готовности:** Все файлы контекста созданы, очищены старые шаблонные папки и связаны с `AGENTS.md` _(Выполнено)_.

### [x] Шаг 1.3: Строгий TypeScript и `Biome.js`

- **Контекст ИИ:** `.agents/architecture/adr-stack.md`
- **Что именно делаем (Implementation Notes):**
  1. Создаем корневой `tsconfig.base.json` с флагами максимальной строгости:
     - `strict: true`
     - `noUncheckedIndexedAccess: true`
     - `exactOptionalPropertyTypes: true`
     - `noImplicitOverride: true`
     - `noFallthroughCasesInSwitch: true`
  2. Устанавливаем `@biomejs/biome` и `typescript` в корень монорепозитория.
  3. Создаем `biome.json`: включаем `organizeImports`, `linter` (правила `recommended`, `correctness`, `suspicious`, запрет `noExplicitAny`) и `formatter` (отступы 2 пробела, одинарные кавычки).
- **Критерий готовности:** Команда `pnpm biome check .` выполняется за ~50–100 мс без ошибок.

### [x] Шаг 1.4: Pre-commit хуки (`Lefthook`) и Авто-версионирование

- **Контекст ИИ:** `.agents/architecture/adr-stack.md`
- **Что именно делаем (Implementation Notes):**
  1. Пишем Node.js скрипт `scripts/bump-patch-version.mjs`, который:
     - Читает корневой `package.json`, парсит `version` (`major.minor.patch`) и увеличивает `patch` на `+1` (`0.0.1` -> `0.0.2`).
     - Записывает обновленный `package.json` и генерирует константу/файл версии (`packages/shared-schemas/src/version.ts` или `.env`), чтобы версия автоматически попадала в футер сайта.
     - Добавляет обновленные файлы в индекс `git add`.
  2. Настраиваем `lefthook.yml` на хук `pre-commit` с последовательным выполнением:
     - `biome check --write --no-errors-on-unmatched {staged_files}` (`stage_fixed: true`)
     - `pnpm turbo typecheck`
     - `node scripts/bump-patch-version.mjs`
- **Критерий готовности:** При тестовом коммите запускается Biome, проверка типов `tsc`, и версия в `package.json` автоматически увеличивается на `+0.0.1`.

---

## ЭПИК 2: Общие контракты (`packages/shared-schemas`) и UI-Kit (`packages/ui`)

### [x] Шаг 2.1: Создание пакета `packages/shared-schemas` (`Zod`)

- **Контекст ИИ:** `.agents/architecture/shared-contracts.md`
- **Что именно делаем (Implementation Notes):**
  1. Инициализируем пакет `@repo/shared-schemas` (`packages/shared-schemas/package.json`, `tsconfig.json`).
  2. Реализуем модульные Zod-схемы и экспортируем выведенные типы (`z.infer`):
     - `RoleEnum` (`GUEST`, `USER`, `ADMIN`) и `VisitorRoleType` (`TEAM_LEAD`, `RECRUITER`, `DEVELOPER`, `FOUNDER`, `OTHER`).
     - `GuestPassFormSchema` (имя посетителя, роль в компании, опциональный секретный ключ админа) и `SessionProfileSchema`.
     - `ArticleMetaSchema` (`slug`, `category`, `viewsCount`, `helpfulCount`, `updatedAt`).
     - `TelemetryEventSchema` (структура ивента для микросервиса `telemetry-ms` и `SSE`).
     - `TechRadarItemSchema` + массив всех 15 технологий нашего стека с заполненными полями `adrWhy`, `adrWhere`, `adrHow`.
- **Критерий готовности:** Пакет `@repo/shared-schemas` успешно проходит `pnpm --filter @repo/shared-schemas typecheck`.

### [x] Шаг 2.2: Создание пакета `packages/ui` (`Tailwind CSS` + `shadcn/ui` + `Storybook`)

- **Контекст ИИ:** `.agents/frontend/ui-storybook.md`
- **Что именно делаем (Implementation Notes):**
  1. Инициализируем пакет `@repo/ui` (`packages/ui`).
  2. Настраиваем `Tailwind CSS` и утилиту `cn()` (`clsx` + `tailwind-merge`).
  3. Создаем атомарные компоненты `shadcn/ui` на базе `Radix UI` в эстетике **Notion Workfolio**:
     - `Button`, `Input`, `Badge`, `Card`, `Dialog`, `Tooltip`, `Tabs`, `Skeleton`, `Callout`.
  4. Настраиваем `Storybook` (`packages/ui/.storybook`) и пишем `*.stories.tsx` для каждого компонента.
- **Критерий готовности:** Команда `pnpm --filter @repo/ui storybook` открывает интерактивную витрину компонентов, а `pnpm turbo typecheck` проходит без ошибок.

---

## ЭПИК 3: Бэкенд — `NestJS`, `PostgreSQL (Neon)` и `Prisma` (`apps/api`)

### [x] Шаг 3.1: Инициализация `apps/api` (`NestJS`) и подключение `Prisma ORM`

- **Контекст ИИ:** `.agents/backend/development.md`, `.agents/backend/database-prisma.md`
- **Что именно делаем (Implementation Notes):**
  1. Создаем приложение `@repo/api` (`apps/api`) на `NestJS` (порт `4000`, префикс `/api`).
  2. Настраиваем `Prisma ORM` (`apps/api/prisma/schema.prisma`) под PostgreSQL (`Neon.tech` / локальный Postgres) с тремя моделями:
     - `VisitorSession` (`id`, `displayName`, `visitorType`, `role`, `createdAt`, `expiresAt`).
     - `ArticleMetrics` (`slug`, `category`, `viewsCount`, `helpfulCount`, `updatedAt`).
     - `SystemEventLog` (`id`, `eventType`, `payload`, `createdAt`).
  3. Создаем глобальный `PrismaModule` и `PrismaService`, а также `ZodValidationPipe` для валидации DTO через `@repo/shared-schemas`.
- **Критерий готовности:** `prisma generate` генерирует типы `PrismaClient`, миграция готова к применению, `apps/api` успешно собирается.

### [x] Шаг 3.2: Модуль Авторизации (`AuthModule`), `JWT` в `HttpOnly Cookies` и `RBAC Guards`

- **Контекст ИИ:** `.agents/backend/security-jwt.md`
- **Что именно делаем (Implementation Notes):**
  1. Подключаем `@nestjs/jwt` и `cookie-parser`.
  2. Реализуем в `AuthController` и `AuthService`:
     - `POST /api/auth/guest-pass`: валидирует тело через `GuestPassFormSchema`, проверяет опциональный `adminPasscode` (если совпадает с `ADMIN_SECRET_PASSCODE` — выдает роль `ADMIN`, иначе `USER`), сохраняет `VisitorSession` в БД, подписывает JWT и ставит куку `kb_access_token` с флагами `HttpOnly, Secure, SameSite=Lax`.
     - `GET /api/auth/me`: возвращает текущую сессию (`GUEST`, если куки нет, либо `USER`/`ADMIN` из верифицированного токена).
     - `POST /api/auth/logout`: очищает куку `kb_access_token`.
  3. Создаем декоратор `@Roles(...)` и `JwtRolesGuard`.
- **Критерий готовности:** Запрос к `POST /api/auth/guest-pass` возвращает заголовок `Set-Cookie: kb_access_token=...; HttpOnly` и сохраняет сессию.

### [x] Шаг 3.3: Модуль метаданных Базы Знаний (`KnowledgeModule`)

- **Контекст ИИ:** `.agents/backend/development.md`
- **Что именно делаем (Implementation Notes):**
  1. Реализуем защищенные декоратором `@Roles('USER', 'ADMIN')` и `JwtRolesGuard` эндпоинты:
     - `GET /api/knowledge/metrics` — список метрик всех статей.
     - `POST /api/knowledge/:slug/view` — атомарный инкремент просмотров статьи в `Prisma`.
     - `POST /api/knowledge/:slug/helpful` — атомарный инкремент реакции «Полезно» (`helpfulCount`).
- **Критерий готовности:** Эндпоинты возвращают `403 Forbidden` для `GUEST` и `200 OK` с актуальными метриками для `USER`/`ADMIN`.

---

## ЭПИК 4: Микросервис и Server-Sent Events (`apps/telemetry-ms` + `SSE`)

### [x] Шаг 4.1: Создание микросервиса `apps/telemetry-ms` (`@nestjs/microservices`)

- **Контекст ИИ:** `.agents/backend/microservices-sse.md`
- **Что именно делаем (Implementation Notes):**
  1. Создаем приложение `@repo/telemetry-ms` (`apps/telemetry-ms`) на базе `@nestjs/microservices` (транспорт `Transport.TCP`, порт `4001`).
  2. Реализуем контроллер с `@EventPattern('telemetry.event')` и `@MessagePattern('telemetry.stats')`, который валидирует и обогащает события (`GUEST_PASS_ISSUED`, `ARTICLE_VIEWED`, `ARTICLE_HELPFUL`).
- **Критерий готовности:** Микросервис запускается и принимает события от основного бэкенда `apps/api`.

### [x] Шаг 4.2: Эндпоинт Server-Sent Events (`@Sse('/api/telemetry/stream')`)

- **Контекст ИИ:** `.agents/backend/microservices-sse.md`
- **Что именно делаем (Implementation Notes):**
  1. В `apps/api` создаем `TelemetryModule`, который связывается с `apps/telemetry-ms` через `ClientsModule` (`ClientProxy`).
  2. Реализуем эндпоинт `GET /api/telemetry/stream` с декоратором `@Sse('stream')` на базе `RxJS Subject` + `interval(15000)`, транслирующий живые события и пульс сервера каждые 15 секунд.
- **Критерий готовности:** Открытие `/api/telemetry/stream` держит соединение `text/event-stream` и стримит JSON-события в реальном времени.

---

## ЭПИК 5: Фронтенд — Ядро `Next.js`, Авторизация и Публичное CV в стиле Workfolio (`apps/web`)

### [x] Шаг 5.1: Инициализация `apps/web` (`Next.js App Router`) и Провайдеров

- **Контекст ИИ:** `.agents/frontend/development.md`, `.agents/frontend/state-and-forms.md`
- **Что именно делаем (Implementation Notes):**
  1. Инициализируем приложение `@repo/web` (`apps/web`), подключаем `@repo/ui` и `@repo/shared-schemas`.
  2. Настраиваем `PersistQueryClientProvider` (`TanStack Query v5`) с асинхронным персистером в браузерную БД `IndexedDB` через `idb-keyval` (TTL 24 часа, ключ `greatest-portfolio-query-cache`).
  3. Создаем клиентские сторы на `Zustand`:
     - `useUIStore` (открытие модалки Guest Pass, активная карточка ADR Inspector, фильтр таблицы, состояние сайдбара Базы Знаний и контролов D3.js).
- **Критерий готовности:** Во вкладке `Application -> IndexedDB` в DevTools создается хранилище кэша запросов `TanStack Query`.

### [x] Шаг 5.2: Защита роутов (`Next.js Middleware`) и Микро-форма для Team Lead

- **Контекст ИИ:** `.agents/frontend/security-auth.md`, `.agents/frontend/state-and-forms.md`
- **Что именно делаем (Implementation Notes):**
  1. Пишем `apps/web/src/middleware.ts`, проверяющий наличие куки `kb_access_token` при переходе на `/knowledge-base/*`. Если куки нет — редирект на `/?unlock=knowledge-base`.
  2. Верстаем верхний `Sticky Header` (в стиле Notion Workfolio):
     - Кнопка `Base of Knowledge` отображается с иконкой замка `🔒` для `GUEST` и при клике открывает модальное окно (`React Hook Form` + `Zod` `GuestPassFormSchema`).
     - В модалке — пресеты в 1 клик (`Team Lead`, `Tech Recruiter`, `Senior Engineer`) и архитектурное пояснение: _«Введи любое имя в 1 клик — это демо работы RHF + Zod + NestJS JWT HttpOnly Cookies + RBAC»_.
     - После сабмита замок меняется на `🔓` и открывается переход в `/knowledge-base`.
- **Критерий готовности:** Полный цикл от клика по заблокированной вкладке до получения `HttpOnly` куки и перехода в `/knowledge-base` работает бесшовно.

### [x] Шаг 5.3: Верстка главной страницы CV в стиле Notion Workfolio и матрицы навыков (`TanStack Table`)

- **Контекст ИИ:** `.agents/frontend/development.md`, `.agents/frontend/ui-storybook.md`
- **Что именно делаем (Implementation Notes):**
  1. Реализуем стартовую страницу `/` по визуальному канону **Notion Workfolio** (`https://www.notion.com/templates/workfolio`):
     - **Hero-блок:** Имя, роль, статус доступности, краткое инженерное интро и `Callout`-блок с описанием архитектуры проекта.
     - **Workfolio Project Gallery:** Карточки избранных проектов/кейсов с архитектурными тегами и метриками.
     - **Experience & Resume Timeline:** Структурированный опыт работы и ключевые достижения.
     - **Tech Radar Database (`TanStack Table`):** Интерактивная таблица всех 15 технологий стека с поиском, фильтрацией по категориям (`Frontend`, `Backend`, `Database & Storage`, `DevOps & DX`, `Architecture`), сортировкой по опыту и кнопкой открытия **ADR-обоснования (Почему, Где и Как)**.
     - **Footer:** Текущая версия из `package.json` + живой виджет `SSE Stream` (показывает пульс сервера и события из `telemetry-ms`).
- **Критерий готовности:** Главная страница CV мгновенно грузится, выглядит как выверенный Notion Workfolio, а таблица `TanStack Table` фильтрует, сортирует и открывает ADR-карточки.

---

## ЭПИК 6: Закрытая База Знаний (`SSG` + `MDX` + `WebP` + `D3.js` + `TanStack Redact`)

### [x] Шаг 6.1: Layout Базы Знаний с Sidebar и MDX-движком (`SSG`)

- **Контекст ИИ:** `.agents/frontend/development.md`
- **Что именно делаем (Implementation Notes):**
  1. Создаем защищенный Layout `/knowledge-base` с древовидным сайдбаром по 4 инженерным разделам:
     - `TypeScript & Architecture`
     - `React 18 vs React 19`
     - `NestJS, Prisma & Microservices`
     - `DevOps, Docker & Bundle Optimization`
  2. Настраиваем парсинг `.mdx` файлов из `apps/web/content/` и статическую генерацию маршрутов через `generateStaticParams` (`SSG`).
  3. Создаем кастомный MDX-компонент `<ArticleImageGrid />` для рендера массивов изображений в формате `WebP` в адаптивной сетке, а также виджет метрик статьи (счетчик просмотров + кнопка `Helpful` с Optimistic UI через `TanStack Query` и кэшем в `IndexedDB`).
- **Критерий готовности:** Любая новая статья добавляется простым созданием `.mdx` файла в `apps/web/content/` и автоматически появляется в сайдбаре и статической сборке.

### [x] Шаг 6.2: Интерактивные визуализации на `D3.js` и наполнение стартовых статей

- **Контекст ИИ:** `.agents/frontend/development.md`, `.agents/frontend/ui-storybook.md`
- **Что именно делаем (Implementation Notes):**
  1. Разрабатываем 2 интерактивных компонента на `D3.js` (управляемых фильтрами из `Zustand`) для встраивания прямо внутрь `.mdx` статей:
     - **`<ReactRenderGraphD3 />`:** Интерактивное сравнение рендеринга дерева компонентов `React 18` (ручные `useMemo` / `useCallback`) против `React 19` (React Compiler + хук `use()`).
     - **`<ArchitectureFlowD3 />`:** Интерактивный граф прохождения запроса и событий в нашем монорепозитории (`Next.js Edge -> NestJS API -> Prisma/Neon -> Telemetry Microservice -> SSE Stream`).
  2. Наполняем стартовые инженерные статьи в `apps/web/content/` (включая полный каталог 15 ADR, разбор React 18 vs 19, JWT HttpOnly Security и TanStack Redact).
- **Критерий готовности:** Внутри статей базы знаний работают живые интерактивные `D3.js`-графики, реагирующие на клики и переключатели режимов.

### [x] Шаг 6.3: Эксперимент с бандлом через `TanStack Redact`

- **Контекст ИИ:** `.agents/frontend/development.md`
- **Что именно делаем (Implementation Notes):**
  1. В `apps/web/next.config.ts` подключаем `@next/bundle-analyzer` и обертку экспериментального рантайма `TanStack Redact` (`ENABLE_REDACT=true`) с безопасным fallback на стандартный сборщик Next.js.
  2. Оформляем результаты замера размера клиентского JS-бандла в виде наглядной таблицы и кейса внутри статьи Базы Знаний.
- **Критерий готовности:** Проект стабильно собирается (`pnpm turbo build`), а в Базе Знаний доступен разбор оптимизации бандла.

---

## ЭПИК 7: `Docker`, Мониторинг (`Sentry` + `PostHog`) и Релиз

### [x] Шаг 7.1: Контейнеризация (`Docker` + `docker-compose.yml`)

- **Контекст ИИ:** `.agents/architecture/docker-deploy.md`
- **Что именно делаем (Implementation Notes):**
  1. Пишем оптимизированные 3-ступенчатые `Dockerfile` (с использованием `turbo prune --docker` и `node:22-alpine` под `non-root` пользователем) в папке `docker/`:
     - `docker/web.Dockerfile`
     - `docker/api.Dockerfile`
     - `docker/telemetry-ms.Dockerfile`
  2. Собираем корневой `docker-compose.yml`, поднимающий `postgres`, `telemetry-ms`, `api` и `web` в единой сети с healthcheck'ами.
- **Критерий готовности:** Конфигурация `docker compose` валидна и поднимает все сервисы монорепозитория одной командой.

### [x] Шаг 7.2: Интеграция `Sentry` и `PostHog`

- **Контекст ИИ:** `.agents/architecture/docker-deploy.md`
- **Что именно делаем (Implementation Notes):**
  1. Подключаем перехват ошибок `Sentry` (`ErrorBoundary` / `global-error.tsx` в `apps/web` и `SentryExceptionFilter` в `apps/api`).
  2. Подключаем провайдер продуктовой аналитики `PostHog` в `apps/web` с трекингом ключевых действий тимлида (открытие модалки Guest Pass, получение доступа, клик по ADR в таблице технологий, чтение статьи).
  3. Создаем эталонный `.env.example` со всеми переменными окружения.
- **Критерий готовности:** Весь монорепозиторий проходит `pnpm biome check .`, `pnpm turbo typecheck` и `pnpm turbo build` без единой ошибки.
