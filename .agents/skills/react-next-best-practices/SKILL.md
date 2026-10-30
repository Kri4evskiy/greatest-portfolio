---

name: react-next-best-practices
description: Official Vercel Engineering React & Next.js Best Practices (vercel-labs/agent-skills) and Next.js AI Agents Guide (nextjs.org/docs/app/guides/ai-agents). Use when writing, reviewing, or refactoring React 19 and Next.js App Router code.
---

# React & Next.js Best Practices (Vercel Engineering + Next.js AI Agents Guide)

Источники:
- `https://nextjs.org/docs/app/guides/ai-agents`
- `https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/SKILL.md`

## 1. Next.js AI Agent Integration Rules (`nextjs.org/docs/app/guides/ai-agents`)

1. **Локальная документация под точную версию (`Version-Matched Docs`):** При любых сомнениях в API Next.js (например, асинхронные `params`, `searchParams`, `cookies()`, `headers()`, `next.config.ts`) агент обязан сверяться с локальной документацией установленной версии внутри `apps/web/node_modules/next/dist/docs/`, а не полагаться на устаревшие знания.
2. **Next.js DevTools & MCP (`/_next/mcp`):** При запущенном `next dev` использовать диагностику маршрутов, ошибок компиляции и гидратации напрямую из рантайма Next.js.

## 2. Матрица приоритетов оптимизации (Vercel `react-best-practices` — 8 категорий)

### Priority 1: Eliminating Waterfalls (`async-*`) — CRITICAL

- **`async-parallel`:** Всегда запускай независимые асинхронные операции параллельно через `Promise.all([fetchA(), fetchB()])`, никогда не делай последовательные `await` без зависимости данных.
- **`async-defer-await`:** Перемещай `await` непосредственно в ту ветку кода, где результат реально используется (сначала проверяй быстрые синхронные условия).
- **`async-suspense-boundaries`:** Оборачивай медленные серверные секции в `<Suspense fallback={<Skeleton />}>`, чтобы стримить статический каркас страницы (Workfolio Header & Hero) мгновенно.

### Priority 2: Bundle Size Optimization (`bundle-*`) — CRITICAL

- **`bundle-dynamic-imports`:** Тяжелые клиентские визуализации (интерактивные графы `D3.js`, модальные инспекторы ADR, сложные диаграммы) всегда загружай лениво через `next/dynamic` (`ssr: false` для чистых SVG/Canvas-графов).
- **`bundle-barrel-imports`:** Избегай тяжелых ре-экспортов сторонних библиотек; используй `optimizePackageImports` в `next.config.ts` для `lucide-react`, `d3`, `@repo/ui`.
- **`bundle-defer-third-party`:** Аналитика (`PostHog`) и мониторинг (`Sentry`) не должны блокировать гидратацию основного потока.
- **`bundle-preload`:** Предзагружай тяжелые чанки при `onMouseEnter` / `onFocus` на интерактивных кнопках (например, при наведении на кнопку `🔒 Base of Knowledge`).

### Priority 3: Server-Side Performance (`server-*`) — HIGH

- **`server-serialization`:** Минимизируй объем данных, передаваемых через границу `Server Component -> Client Component` (передавай только нужные примитивные поля, а не весь объект документа/сессии).
- **`server-cache-react`:** Используй `React.cache()` для дедупликации чтения `.mdx` файлов и метаданных в рамках одного серверного рендера (`generateMetadata` + `Page`).

### Priority 4: Client-Side Data Fetching (`client-*`) — MEDIUM-HIGH

- **`client-query-dedup`:** Все клиентские запросы к `apps/api` идут строго через `TanStack Query v5` с персистером в `IndexedDB` (`idb-keyval`), обеспечивая автоматическую дедупликацию и Offline-First кэш.
- **`client-passive-event-listeners`:** Используй `{ passive: true }` для обработчиков `scroll` / `wheel` / `touchstart`.

### Priority 5: Re-render Optimization (`rerender-*`) — MEDIUM

- **`rerender-derived-state`:** В `Zustand` подписывайся через атомарные селекторы (`useUIStore((s) => s.isGuestPassModalOpen)`), никогда не деструктурируй весь стор (`const { ... } = useUIStore()`).
- **`rerender-use-ref-transient-values`:** Часто меняющиеся значения (координаты курсора на графе `D3.js`, таймеры анимации) храни в `useRef`, а не в `useState`.
- **`rerender-simple-expression-in-memo`:** Не оборачивай примитивные выражения (`const isAdmin = role === 'ADMIN'`) в `useMemo`.

### Priority 6: Rendering Performance (`rendering-*`) — MEDIUM

- **`rendering-conditional-render`:** Используй явный тернарный оператор `count > 0 ? <Badge /> : null` вместо `count && <Badge />`, чтобы не отрендерить `0` в DOM.
- **`rendering-content-visibility`:** Применяй `content-visibility: auto` для длинных секций и таблиц.

### Priority 7: JavaScript Performance (`js-*`) — LOW-MEDIUM

- **`js-set-map-lookups`:** Используй `Set` / `Map` для $O(1)$ проверок в фильтрах вместо многократных `Array.includes()`.
- **`js-tosorted-immutable`:** Используй иммутабельный `.toSorted()` вместо мутирующего `.sort()`.
