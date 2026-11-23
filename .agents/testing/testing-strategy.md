# 🧪 Enterprise Testing Strategy (`Vitest` + `MSW` + `Supertest` + `Playwright`)

Этот документ — единственный источник правды для AI-агентов и разработчиков по написанию, структурированию и отладке тестов в монорепозитории `greatest-portfolio`.

---

## 1. Пирамида тестирования и архитектура папок

В монорепозитории используется 3-уровневая пирамида (строго без `Jest` и `ts-jest`, так как стек построен на `TypeScript 7.0.2` и `NestJS 12 Native ESM`):

```text
greatest-portfolio/
├── vitest.config.ts                            # Корневой projects-индекс для IDE Testing Explorer
├── packages/shared-schemas/
│   ├── vitest.config.ts                        # environment: 'node'
│   └── src/__tests__/*.test.ts                 # [Unit] Контракты Zod v4, resolveEndpoint, Tech Radar
├── packages/ui/
│   └── vitest.config.ts                        # База под UI-утилиты и будущий @storybook/addon-vitest
├── apps/web/
│   ├── vitest.config.ts                        # environment: 'jsdom', url: 'http://localhost:3000', coverage: v8
│   ├── vitest.setup.ts                         # @testing-library/jest-dom/vitest + явный afterEach(cleanup)
│   ├── playwright.config.ts                    # Dual prod webServer (api + web), fullyParallel + workers scaling
│   ├── src/**/__tests__/*.test.ts(x)           # [Unit] Co-located рядом с модулем (apiClient, edge-jwt, store, routes, QueryProvider)
│   ├── src/**/__tests__/*.integration.test.tsx # [Integration] RTL + реальный TanStack Query + apiClient + MSW v3
│   └── e2e/                                    # [Full-Stack E2E] Выделенная папка фронтенда (POM)
│       ├── fixtures/app.fixture.ts             # Авто-проверка 0 console.error / 0 pageerror / 0 >=500 API
│       ├── pages/*.page.ts                     # Page Object Models
│       └── specs/*.spec.ts                     # Сценарии с test.step(...)
├── apps/api/
│   ├── vitest.base.ts                          # Общая ESM/SWC-конфигурация + coverage v8 (pool: 'forks', .js -> .ts resolver)
│   ├── vitest.config.ts                        # [Unit] src/**/*.spec.ts
│   ├── vitest.e2e.config.ts                    # [Backend E2E] test/**/*.e2e-spec.ts
│   ├── vitest.setup.ts                         # import 'reflect-metadata'
│   ├── src/**/__tests__/*.spec.ts              # [Unit] PrismaService In-Memory, loadAppConfig, request-id.util, AuthService/Controller/JwtRolesGuard
│   └── test/*.e2e-spec.ts                      # [Backend HTTP E2E] Реальный AppModule + Supertest + Pipes + Guards + Cookies
└── apps/telemetry-ms/
    ├── vitest.config.ts                        # [Unit] environment: 'node', pool: 'forks' (обязателен для NestJS ESM + IDE Explorer), coverage: v8
    └── src/__tests__/*.spec.ts                 # [Unit] TelemetryMicroserviceController (TCP @EventPattern / @MessagePattern)
```

### Когда какой слой использовать

1. **Unit-тесты (`*.test.ts` / `*.spec.ts`, рядом с кодом):** чистая логика, Zod-схемы, сторы, роутинг, конфигурация, сервисы NestJS с мокнутыми зависимостями. Быстрые, покрываем по максимуму.
2. **Frontend Integration (`*.integration.test.tsx`):** тестирование связки `Компонент ➔ Хук TanStack Query ➔ apiClient ➔ MSW v3`. **ЗАПРЕЩЕНО** мокировать `useQuery` / `useMutation` напрямую — мок ставится только на границе HTTP (`msw/node`).
3. **Backend HTTP E2E (`apps/api/test/*.e2e-spec.ts`):** поднимает реальный `AppModule` в памяти и бьёт по эндпоинтам через `supertest` (проверяет `Middleware ➔ Guards ➔ Interceptors ➔ ZodValidationPipe ➔ HttpOnly Cookies ➔ SentryExceptionFilter`).
4. **Full-Stack Browser E2E (`apps/web/e2e/specs/*.spec.ts`):** реальный Chromium против production-сборок `apps/api` и `apps/web` (`WORKFOLIO_DEMO_MODE=true`). Покрываем только критические сквозные пути (RBAC, переходы, ключевые виджеты).
5. **Storybook 10 (`packages/ui`):** изолированная визуальная витрина UI-кита (`build-storybook` в CI). При необходимости взаимодействия внутри примитивов в будущем подключается `@storybook/addon-vitest`.

---

## 2. Правила E2E (`Playwright`), `data-testid` и Radix UI

### 2.1. Железное правило селекторов (`data-testid` Zero-Cruft Policy)

1. **Обращение строго по `data-testid`:** в E2E-тестах обращайся к кнопкам, модалкам, таблицам и полям **только** через `page.getByTestId('...')`.
2. **Запрещены хрупкие селекторы:** никогда не используй выбор по HTML-тегам (`button`, `tbody tr`), CSS-классам или локализованному тексту (`getByRole('button', { name: 'Submit' })` — ломается при смене локали `EN/UA/RU` и при редизайне).
3. **Zero-Cruft (не мусорим ID-шниками):**
   - Вешай `data-testid` **только** на те элементы, которые реально используются в существующих Playwright-сценариях.
   - При удалении или изменении E2E-сценария **обязательно удаляй** неиспользуемые `data-testid` из JSX/TSX-компонентов!

### 2.2. Работа с Radix UI (`Dialog`, `Popover`, `Tooltip`, `Tabs`)

1. **Portals (`document.body`):** компоненты `DialogContent`, `PopoverContent`, `TooltipContent` в `@repo/ui` рендерятся через `<Portal>` в `document.body`, **вне** DOM-дерева родителя. Всегда ищи их от корня `page.getByTestId(...)`, а не через `parentLocator.getByTestId(...)`.
2. **Анимации входа/выхода и гидратация:**
   - Перед взаимодействием с диалогом дожидайся `await expect(dialog).toBeVisible()` и `await expect(dialog).toHaveAttribute('data-state', 'open')`.
   - После сабмита дожидайся завершения анимации закрытия через `await expect(dialog).toBeHidden()`.
   - **Никогда не используй `page.waitForTimeout(...)`** — только web-first assertions (`expect(...)`) и `page.waitForResponse(...)`.
3. **Почему `data-testid`, а не HTML `id` на кнопках/модалках:** Radix UI сам управляет внутренними `id` для `aria-labelledby` / `aria-controls` / `useId()`. `data-testid` не конфликтует с A11y и `#anchor`-скроллом.

### 2.3. Структура E2E-сценариев, `test.step` и масштабирование воркеров

1. **Обязательная разбивка через `test.step(...)`:** каждый шаг пользовательского пути оборачивай в `await test.step('1. Описание шага', async () => { ... })` для наглядных отчётов и трейсов в Playwright HTML Report / CI.
2. **Page Object Model + Фикстура `app.fixture.ts`:** вся разметка `getByTestId` инкапсулируется в `apps/web/e2e/pages/*.page.ts`. Базовая фикстура автоматически падает при любых `console.error`, `pageerror` и HTTP `>= 500`.
3. **Масштабирование воркеров (`playwright.config.ts`):**
   - Глобально включены `fullyParallel: true` и `...(process.env.CI ? { workers: 2 } : {})` (условный spread вместо `undefined` требуется при `exactOptionalPropertyTypes: true` в `tsconfig.base.json`).
   - Если сьют проверяет общий разделяемый In-Memory стейт API (например, порядок глобального лидерборда или счётчики событий), помечай такой `test.describe` директивой `test.describe.configure({ mode: 'serial' })`. Новые изолированные read-only/per-slug тесты будут автоматически параллелиться воркерами.
4. **Windows + Node 24 Happy Eyeballs (ВАЖНЫЙ НЮАНС):**
   - `apps/api/src/main.ts` слушает `0.0.0.0:4000` (IPv4), тогда как `localhost` в Node 24 на Windows резолвится сначала в IPv6 `::1`. При параллельных прокси-запросах `/api/*` через `next start` это вызывало `AggregateError (ECONNREFUSED ::1:4000 / EADDRINUSE 127.0.0.1:4000)`.
   - В `apps/web/playwright.config.ts` для Next.js `webServer` обязательно передаётся `NODE_OPTIONS: '--dns-result-order=ipv4first --no-network-family-autoselection'`.

---

## 3. Нюансы и Best Practices `Vitest` (Frontend & Backend)

### 3.1. Общие правила конфигурации и TypeScript 7

1. **Явные импорты вместо `globals: true`:** в тестах явно импортируй `{ describe, expect, it, vi }` из `'vitest'` — это исключает конфликты типов под `TypeScript 7.0.2` и `Biome`.
2. **Гигиена моков и окружения:** во всех `vitest.config.ts` включены `clearMocks: true`, `unstubEnvs: true`, `unstubGlobals: true`.
3. **Исключение тестов из сборки:** `packages/shared-schemas/tsconfig.build.json` и `apps/api/tsconfig.build.json` обязаны исключать `**/*.test.ts`, `**/*.spec.ts` и `test/`, чтобы тестовый код не попадал в `dist/`.
4. **IDE Testing Explorer:** корневой [vitest.config.ts](../../vitest.config.ts) агрегирует `projects: ['packages/*', 'apps/*']`, а в `.vscode/settings.json` выставлены `"vitest.maximumConfigs": 10` и `"playwright.config": "apps/web/playwright.config.ts"`.

### 3.2. Frontend (`apps/web`)

1. **Явный DOM-cleanup:** так как `globals` отключён, [apps/web/vitest.setup.ts](../../apps/web/vitest.setup.ts) явно регистрирует `afterEach(() => { cleanup() })` — без этого смонтированный DOM из предыдущего теста протекает в следующий.
2. **MSW v3 API:** в `msw@^3` опция `onUnhandledRequest` заменена на **`onUnhandledFrame: 'error'`**.
3. **Изолированный `QueryClient`:** в тестах всегда создавай свежий инстанс через `makeQueryClient()` из `query-provider.tsx` (не используй глобальный браузерный синглтон).
4. **Тестирование отмен (`AbortError` / StrictMode):** при проверке отмены запроса нельзя ассертить `status === 'pending'` (он такой на 0-м тике до старта запроса). Нужно дождаться старта запроса в `MSW`, выполнить `unmount()` + `cancelQueries()`, дождаться `client.isFetching() === 0` и только потом проверять `captureClientException`.
5. **Защита от отсутствия `IndexedDB` в `jsdom`:** `QueryProvider` проверяет `typeof window.indexedDB === 'undefined'` перед обращением к `idb-keyval`, исключая `ReferenceError` в `stderr`.

### 3.3. Backend (`apps/api`, NestJS 12 Native ESM + SWC)

1. **ESM + `emitDecoratorMetadata`:** в [apps/api/vitest.base.ts](../../apps/api/vitest.base.ts) подключены `unplugin-swc` (с явным `module: { type: 'es6' }`, `legacyDecorator: true`, `decoratorMetadata: true`), `resolveTsExtensionPlugin()` (маппинг относительных `.js` ➔ `.ts`) и `setupFiles: ['./vitest.setup.ts']` с `import 'reflect-metadata'`. Все тестовые пакеты (`unplugin-swc`, `@swc/core`, `@nestjs/testing`, `supertest`) лежат строго в `devDependencies`.
2. **`pool: 'forks'`:** обязателен для NestJS / Prisma Wasm / `vi.stubEnv` тестов (избегает крешей и утечек `worker_threads`).
3. **`SWC_NATIVE_BINDING_CACHE` (Windows MAX_PATH + Turborepo):**
   - На Windows `@swc/core` создаёт длинные имена lock-файлов (`SID + SHA-256`). Если `SWC_NATIVE_BINDING_CACHE` не задан, `vitest.base.ts` создаёт короткий путь `.turbo/swc` (чтобы не превысить `MAX_PATH = 260` и не писать в защищённый `AppData\Local`).
   - Переменная передана в `turbo.json` через `passThroughEnv: ["SWC_NATIVE_BINDING_CACHE"]` (не в `.env` и не в `globalEnv`, чтобы не сбрасывать кэш сборки).
4. **Supertest в ESM:** импортируй строго как default import (`import request from 'supertest'`), а в `afterAll` обязательно вызывай `await app?.close()` для закрытия TCP/RxJS-ресурсов.

---

## 4. Команды запуска

```bash
pnpm run test                         # Все Unit & Integration тесты через Turborepo
pnpm run test:coverage                # V8 Coverage по воркспейсам через Turborepo (или pnpm exec vitest run --coverage из корня)
pnpm run test:ui                      # Интерактивный Vitest UI + Coverage на http://localhost:5124/__vitest__/ (порт вне резервов Hyper-V)
pnpm run test:watch                   # Watch-режим (внутри конкретного воркспейса)
pnpm --filter @repo/api test:e2e      # Backend HTTP E2E (AppModule + Supertest)
pnpm run build && pnpm run test:e2e   # Full-Stack Playwright E2E против prod-сборок
```
