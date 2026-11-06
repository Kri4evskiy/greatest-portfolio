# ⚡ Next.js App Router, Workfolio CV, MDX, D3.js и TanStack Redact (`apps/web`)

Этот документ описывает архитектуру фронтенд-приложения `apps/web`.

## 1. Главная страница (`/`) — Ориентир Notion Workfolio + Верхний Header

Стартовая страница — это ссылка-визитка, которую получают рекрутеры, тимлиды и СТО. Она сочетает минималистичную структуру **Notion Workfolio** (`https://www.notion.com/templates/workfolio`) и живую демонстрацию нашей Full-Stack архитектуры:

1. **Sticky Top Header (Разгруженная шапка сайта — Mobile-First):**
   - Слева: Имя / логотип в стиле хлебных крошек Notion (`workspace / workfolio-cv`) + статус-бейдж (`md+`).
   - Справа: `ThemeToggle`, адаптивный `LanguageSwitcher` (компактная циклическая кнопка на `< sm`, сегментированный переключатель `EN | UA | RU` на `>= sm`), **главная кнопка `Base of Knowledge`** и единственная быстрая кнопка **`ADR`** (на главной программно скроллит к `#tech-radar`, внутри Базы Знаний заменяется на `CV`).
   - Центральный список якорных ссылок из хедера **вынесен** в отдельный парящий навигатор страницы (`PageSectionNavigator`), чтобы не перегружать шапку на мобильных и планшетных экранах.
   - **Индикация доступа на кнопке `Base of Knowledge`:**
     - Для роли `GUEST`: иконка замка `🔒 Base of Knowledge` + бейдж `Protected`. Клик открывает микро-модалку получения `Guest Pass` в 1 клик.
     - Для ролей `USER` / `ADMIN`: иконка открытого замка `🔓 Base of Knowledge` + роль и прямой переход в `/knowledge-base`.
       1.1. **Боковой Навигатор Секций (`PageSectionNavigator` + `useSectionNavigation`):**
   - Отслеживает текущую видимую секцию (`about`, `projects`, `experience`, `tech-radar`) через `IntersectionObserver` (`ScrollSpy`).
   - Гарантирует плавный повторный скролл (`scrollIntoView`) даже если хэш в URL уже совпадает с выбранной секцией.
   - На десктопе (`xl:`) рендерится как минималистичный парящий outline-индикатор в духе Notion сбоку от контента; на мобильных и планшетах (`< xl`) — как компактная плавающая кнопка-таблетка в правом нижнем углу с всплывающим списком разделов.
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

## 2. Закрытая База Знаний (`/[locale]/knowledge-base/*`) — SSG + MDX + WebP + D3.js + i18n (`next-intl`)

- **Мультиязычность (`next-intl`, `en` по умолчанию, `uk`, `ru` — ADR #16):**
  - Маршрутизация настроена в `apps/web/src/i18n/routing.ts` с режимом `localePrefix: 'as-needed'` и `localeDetection: false`: дефолтный английский язык открывается по чистым ссылкам (`/`, `/knowledge-base/...`), а украинский и русский — с префиксами `/uk/...` и `/ru/...`.
  - Для всех внутренних переходов в клиентских и серверных компонентах используй типизированные хелперы `Link`, `useRouter`, `usePathname` из `@/i18n/navigation` (а не напрямую из `next/link` или `next/navigation`), чтобы сохранять активную локаль.
  - **Правило ICU MessageFormat в `apps/web/messages/*.json`:** Фигурные скобки `{...}` в строках JSON-словарей зарезервированы под переменные интерполяции (`{count}`, `{years}`). **ЗАПРЕЩЕНО** использовать неэкранированные фигурные скобки для обычного текста (например, `{a,b}` вызовет ошибку `INVALID_MESSAGE: INVALID_ARGUMENT_TYPE`) — используй квадратные скобки `[category]` или экранирование `'{'...'}`.
  - В шапке `WorkfolioHeader` встроен переключатель `LanguageSwitcher` (`EN | UA | RU`).
- **Layout с древовидным Sidebar:** Разделы `TypeScript`, `React 18 vs 19`, `NestJS & Prisma`, `Architecture & DevOps`. Состояние открытых секций сайдбара хранится в `Zustand` (`useUIStore`).
- **SSG (`generateStaticParams`) и Colocated MDX:** Все статьи `.mdx` из папки `apps/web/content/` хранятся рядом с суффиксом локали (`*.en.mdx`, `*.uk.mdx`, `*.ru.mdx`) с автоматическим fallback на `.en.mdx` и компилируются на этапе сборки в быстрый статический HTML, а динамические метрики (просмотры, кнопка «Полезно») подгружаются и кэшируются через `TanStack Query` + `IndexedDB`.
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
