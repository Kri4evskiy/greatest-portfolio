# ⚡ Next.js App Router, Workfolio CV, MDX, D3.js и TanStack Redact (`apps/web`)

Этот документ описывает архитектуру фронтенд-приложения `apps/web`.

## 1. Главная страница (`/`) — Ориентир Notion Workfolio + Верхний Header
Стартовая страница — это ссылка-визитка, которую получают рекрутеры, тимлиды и СТО. Она сочетает минималистичную структуру **Notion Workfolio** (`https://www.notion.com/templates/workfolio`) и живую демонстрацию нашей Full-Stack архитектуры:

1. **Sticky Top Header (Шапка сайта):**
   - Слева: Имя / логотип в стиле хлебных крошек Notion (`workspace / portfolio`) + статус-бейдж.
   - По центру / справа: Навигация по секциям резюме (`About`, `Projects`, `Experience`, `Tech Radar`) и **главная кнопка-переход `Base of Knowledge`**.
   - **Индикация доступа на кнопке `Base of Knowledge`:**
     - Для роли `GUEST`: иконка замка `🔒 Base of Knowledge` + бейдж `Protected`. Клик открывает микро-модалку получения `Guest Pass` в 1 клик.
     - Для ролей `USER` / `ADMIN`: иконка открытого замка `🔓 Base of Knowledge` + имя гостя и прямой переход в `/knowledge-base`.
2. **Hero & Personal Intro (в стиле Workfolio):**
   - Лаконичное позиционирование, ключевая специализация (Full-Stack TypeScript: Next.js, NestJS, Microservices, Architecture), быстрые ссылки (GitHub, LinkedIn, Telegram, Download CV) и краткий `Callout`-блок об архитектуре самого сайта.
3. **Featured Case Studies & Project Gallery (Workfolio Cards):**
   - Карточки ключевых проектов с фильтрацией по категориям, метриками результата и кнопкой просмотра архитектурного разбора.
4. **Experience & Engineering Timeline:**
   - Четкий хронологический список опыта работы, зон ответственности и инженерных достижений.
5. **Интерактивная матрица навыков — Tech Radar (`TanStack Table` + ADR Inspector):**
   - Выглядит как нативная интерактивная база данных Notion, но работает на `TanStack Table`.
   - Поддерживает поиск, фильтрацию по доменам (`Frontend`, `Backend`, `Database & Storage`, `DevOps & DX`, `Architecture`) и сортировку по опыту.
   - У каждой из 15 технологий есть кнопка **«Почему в стеке? (ADR)»**, открывающая структурное объяснение `Why / Where / How` из нашего ADR-каталога.
6. **Инженерный Footer:**
   - Автоматически проброшенная версия сборки из `package.json` (инкрементируется хуком `Lefthook` на каждый коммит, например `v0.0.14`).
   - Живой индикатор `Server-Sent Events (SSE)` из микросервиса `telemetry-ms` (показывает пульс сервера и последние обезличенные события в реальном времени).

## 2. Закрытая База Знаний (`/knowledge-base/*`) — SSG + MDX + WebP + D3.js
- **Layout с древовидным Sidebar:** Разделы `TypeScript`, `React 18 vs 19`, `NestJS & Prisma`, `Architecture & DevOps`. Состояние открытых секций сайдбара хранится в `Zustand` (`useUIStore`).
- **SSG (`generateStaticParams`):** Все статьи `.mdx` из папки `apps/web/content/` компилируются на этапе сборки в быстрый статический HTML, а динамические метрики (просмотры, кнопка «Полезно») подгружаются и кэшируются через `TanStack Query` + `IndexedDB`.
- **Кастомные MDX-компоненты:**
  - `<ArticleImageGrid />`: Обертка над `next/image` с автоматической отдачей в формате `WebP`, адаптивными сетками (`1-col`, `2-col`, `masonry`) и зумом по клику.
  - `<D3Playground />`: Интерактивные визуализации на `D3.js` (управляются через `useRef` + `Zustand`-фильтры):
    1. Граф сравнения пайплайна рендеринга и мемоизации `React 18 vs React 19` (`useCallback`, `useMemo`, React Compiler, `use()`).
    2. Интерактивный граф архитектуры этого монорепозитория (`Client -> Next.js Edge -> NestJS API -> Prisma/Neon -> Telemetry Microservice -> SSE`).

## 3. Экспериментальный рантайм `TanStack Redact`
- В `next.config.ts` подготовлена обертка `withRedact` и `@next/bundle-analyzer`, управляемая через флаг окружения `ENABLE_REDACT=true`.
- Результаты сравнения бандла (стандартный React DOM против TanStack Redact) задокументированы в виде отдельной инженерной статьи внутри Базы Знаний.

## 4. Стандарты Next.js AI Agents & Vercel React Best Practices
Обязательно соблюдать правила из `.agents/skills/react-next-best-practices/SKILL.md`:
1. **Next.js Local Version-Matched Docs (`nextjs.org/docs/app/guides/ai-agents`):** При работе с API Next.js сверяться с локальной документацией пакета в `apps/web/node_modules/next/dist/docs/` и соблюдать асинхронные контракты (`await params`, `await searchParams`, `await cookies()`).
2. **Eliminate Waterfalls (`async-*`):** Запускать независимые запросы параллельно через `Promise.all`, использовать `React.cache()` для чтения MDX на сервере.
3. **Bundle Optimization (`bundle-*`):** Грузить тяжелые клиентские модули (`D3.js` графы, модалки ADR) через `next/dynamic`, настраивать `optimizePackageImports` в `next.config.ts` и минимизировать сериализацию пропсов на границе `RSC -> Client Component`.
4. **Re-render Hygiene (`rerender-*`):** Использовать только атомарные селекторы в `Zustand` (`useUIStore((s) => s.field)`) и `useRef` для транзиентных значений в `D3.js`.
