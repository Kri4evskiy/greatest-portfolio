# 🧠 Управление состоянием, Offline-First кэш и Формы (`apps/web`)

Этот документ устанавливает строгие границы между серверным кэшем, клиентским UI-стейтом и формами.

## 1. Железное правило разделения стейта

- **Серверный стейт (`TanStack Query v5`):** Любые данные, приходящие из `apps/api` (профиль текущей сессии `/api/auth/me`, матрица `/api/capabilities`, метрики статей `/api/knowledge/metrics*`, телеметрия `/api/telemetry/*`, отправка реакции `helpful`).
  - **Стандарт 3-слойной структуры `queries/*.ts`:**
    1. **Standalone Fetcher (Service):** экспортируемая функция (`fetchSystemCapabilities(signal?)`, `fetchPaginatedKnowledgeMetrics(params, signal?)`), использующая `apiClient` (`apps/web/src/shared/lib/api-client.ts` — `get`, `post`, `put`, `patch`, `delete`, `interceptors`, `X-Request-Id`, `204 No Content`, `FormData`, `AbortSignal` + таймаут `10_000ms`) поверх нативного `fetch` с `ApiEndpointPath` и Zod-валидацией.
    2. **Options Factory (`queryOptions` / `infiniteQueryOptions`):** единый источник `queryKey`, `queryFn: ({ signal }) => fetcher(..., signal)` и `staleTime` — переиспользуется и в хуках, и при императивном `prefetchQuery` / `invalidateQueries`. При размонтировании/смене фильтров отмена пробрасывается в `fetch`, а глобальный `QueryCache.onError` в `QueryProvider` отфильтровывает `AbortError` / `CancelledError` (включая штатные отмены `React 19 StrictMode` в `dev` — в DevTools Network их можно скрыть фильтром `-status-code:0`) и передаёт реальные 5xx/сетевые сбои в prod-only `captureClientException` (`NODE_ENV === 'production'`).
    3. **Hook Controller (`use*`):** тонкий хук (`useQuery(...)`, `useInfiniteQuery(...)`, `useMutation(...)`) для UI-компонентов.
- **Клиентский UI-стейт (`Zustand`):** Только синхронное состояние интерфейса, не принадлежащее серверу:
  - [`apps/web/src/shared/store/use-ui-store.ts`](../../apps/web/src/shared/store/use-ui-store.ts): модалки `Guest Pass` и `Cmd+K`, выбранная технология в `ADR Inspector` и фильтры `Tech Radar`, состояние открытых веток сайдбара Базы Знаний (`expandedKbFolders`), активная палитра `palette` (с императивным вызовом `uiStore.getState().actions.syncPaletteFromStorage()` в `ThemeProvider` без лишней подписки на стор).
  - **ЗАПРЕЩЕНО** сохранять ответы `fetch` / `axios` или JWT-токены внутри `Zustand`.

### Стандарт написания Zustand-сторов (Обязательно для всех новых сторов)

1. **Разделение `State` и `actions`:** описывай `interface DomainState` (данные) и `interface DomainActions` (мутаторы) раздельно (`type DomainStore = DomainState & { actions: DomainActions }`). Объект `actions` создаётся один раз при инициализации стора, имеет стабильную ссылку и не вызывает ре-рендеров при смене полей состояния.
2. **Приватный базовый стор:** `const useDomainStoreBase = create<DomainStore>(...)` **никогда не экспортируется** напрямую — на уровне TypeScript исключается случайный вызов `useStore()` без селектора (подписка на весь стор).
3. **Экспорт только явных атомарных хуков и `use<Domain>Actions()`:**
   - для каждого поля состояния экспортируй точечный хук: `export const usePalette = () => useUIStoreBase((s) => s.palette)`;
   - для экшенов экспортируй единый хук: `export const useUIActions = () => useUIStoreBase((s) => s.actions)`;
   - для императивных вызовов вне React-компонентов (провайдеры, `storage`-слушатели, unit-тесты) экспортируй non-hook хендл: `export const uiStore: Pick<StoreApi<UIStore>, 'getState' | 'subscribe'> = { getState: useUIStoreBase.getState, subscribe: useUIStoreBase.subscribe }`.
4. **Совместимость с `React 19 Compiler` и Next.js SSR/SSG:**
   - **НЕ используй `createSelectors` (`store.use.field()`):** при включённом `babel-plugin-react-compiler` динамический вызов хуков через свойство объекта не соответствует статическому правилу `use*` и может ломать авто-мемоизацию / Rules of Hooks.
   - **НЕ читай `localStorage` / `sessionStorage` на top-level модуля** при инициализации `initialState`: в Next.js App Router (SSR/SSG) это приведёт к `ReferenceError` на сервере или `Hydration Mismatch` — гидратацию браузерного хранилища выполняй строго после монтирования через экшены (`syncPaletteFromStorage`, `hydrateKbFoldersFromSession`) или `<head>` Zero-FOUC скрипт.

## 2. Браузерная БД `IndexedDB` + `TanStack Query Persister`

- Для реализации стандарта **Offline-First** используется синглтон `getQueryClient()` в `apps/web/src/shared/providers/query-provider.tsx` (изолированный инстанс на каждый SSR/SSG-рендер на сервере и единый `browserQueryClient` в браузере) совместно с однократным восстановлением из `IndexedDB` (`greatest-portfolio-query-cache`) через низкоуровневые `persistQueryClientRestore` / `persistQueryClientSubscribe` и `IsRestoringProvider` (`@tanstack/react-query-persist-client` + `idb-keyval`).
- Такой паттерн обязателен для Next.js 16 с `next/root-params`, где `app/[locale]/layout.tsx` является корневым layout: при переключении локали (`[locale]`) `QueryProvider` перемонтируется, но кэш в памяти и флаг завершения первичной гидратации сохраняются без сброса `isRestoring` в `true` и без hydration mismatch при холодном старте.
- Политика жизни кэша: `gcTime: 1000 * 60 * 60 * 24` (24 часа) и `maxAge: 1000 * 60 * 60 * 24` (24 часа).
- Когда Team Lead повторно открывает прочитанную статью или переключает вкладки даже с отключенной сетью в Chrome DevTools (`Offline`), метаданные и клиентский кэш отдаются из `IndexedDB` за `0 мс`.

## 3. Формы и валидация (`React Hook Form` + `Zod`)

- Все формы строятся исключительно на `react-hook-form` + `@hookform/resolvers/zod`.
- Схемы валидации импортируются напрямую из `@repo/shared-schemas` (например, `GuestPassFormSchema`).
- Инпуты работают без лишних ререндеров всего дерева формы; кнопки сабмита блокируются на время `isSubmitting` / `mutation.isPending` и поддерживают Optimistic UI для реакций на статьи.
