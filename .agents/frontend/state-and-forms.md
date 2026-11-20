# 🧠 Управление состоянием, Offline-First кэш и Формы (`apps/web`)

Этот документ устанавливает строгие границы между серверным кэшем, клиентским UI-стейтом и формами.

## 1. Железное правило разделения стейта

- **Серверный стейт (`TanStack Query v5`):** Любые данные, приходящие из `apps/api` (профиль текущей сессии `/api/auth/me`, метрики статей `/api/knowledge/metrics`, отправка реакции `helpful`).
- **Клиентский UI-стейт (`Zustand`):** Только синхронное состояние интерфейса, не принадлежащее серверу:
  - `useUIStore`: открыта ли модалка `Guest Pass`, выбранная технология в `ADR Inspector`, свернут ли сайдбар Базы Знаний, активная палитра `palette` (с императивным вызывом `useUIStore.getState().syncPaletteFromStorage()` в `ThemeProvider` без лишней подписки на стор), активный фильтр/режим симуляции на графе `D3.js`.
  - **ЗАПРЕЩЕНО** сохранять ответы `fetch` / `axios` внутри `Zustand`.

## 2. Браузерная БД `IndexedDB` + `TanStack Query Persister`

- Для реализации стандарта **Offline-First** используется синглтон `getQueryClient()` в `apps/web/src/shared/providers/query-provider.tsx` (изолированный инстанс на каждый SSR/SSG-рендер на сервере и единый `browserQueryClient` в браузере) совместно с однократным восстановлением из `IndexedDB` (`greatest-portfolio-query-cache`) через низкоуровневые `persistQueryClientRestore` / `persistQueryClientSubscribe` и `IsRestoringProvider` (`@tanstack/react-query-persist-client` + `idb-keyval`).
- Такой паттерн обязателен для Next.js 16 с `next/root-params`, где `app/[locale]/layout.tsx` является корневым layout: при переключении локали (`[locale]`) `QueryProvider` перемонтируется, но кэш в памяти и флаг завершения первичной гидратации сохраняются без сброса `isRestoring` в `true` и без hydration mismatch при холодном старте.
- Политика жизни кэша: `gcTime: 1000 * 60 * 60 * 24` (24 часа) и `maxAge: 1000 * 60 * 60 * 24` (24 часа).
- Когда Team Lead повторно открывает прочитанную статью или переключает вкладки даже с отключенной сетью в Chrome DevTools (`Offline`), метаданные и клиентский кэш отдаются из `IndexedDB` за `0 мс`.

## 3. Формы и валидация (`React Hook Form` + `Zod`)

- Все формы строятся исключительно на `react-hook-form` + `@hookform/resolvers/zod`.
- Схемы валидации импортируются напрямую из `@repo/shared-schemas` (например, `GuestPassFormSchema`).
- Инпуты работают без лишних ререндеров всего дерева формы; кнопки сабмита блокируются на время `isSubmitting` / `mutation.isPending` и поддерживают Optimistic UI для реакций на статьи.
