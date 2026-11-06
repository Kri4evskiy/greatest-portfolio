import type { LocalizedText } from './author-profile'

/**
 * 🛠️ ENGINEERING BACKLOG, TECH DEBT & ARCHITECTURAL TRADE-OFFS REGISTRY
 *
 * Как добавлять новые идеи, техдолг или отложенные решения:
 * Просто добавьте новый объект в массив `ENGINEERING_ROADMAP_ITEMS` ниже.
 * Поля:
 * - `status`:
 *    - 'planned'    → В очереди на реализацию (следующие спринты)
 *    - 'evaluating' → Идея в проработке / оценка ROI
 *    - 'deferred'   → Осознанно отложено (с инженерными аргументами почему сейчас НЕ делаем)
 *    - 'shipped'    → Уже реализовано в текущем фундаменте
 * - `kind`: 'ui-ux' | 'tech-debt' | 'architecture' | 'idea' | 'devops'
 * - `priority`: 'P1' | 'P2' | 'P3'
 * - `effort`: 'S' | 'M' | 'L'
 * - `pros` / `constraints`: списки аргументов «За (ценность)» и «Ограничения / почему не сразу».
 */

export type RoadmapItemStatus = 'planned' | 'evaluating' | 'deferred' | 'shipped'
export type RoadmapItemKind = 'ui-ux' | 'tech-debt' | 'architecture' | 'idea' | 'devops'
export type RoadmapPriority = 'P1' | 'P2' | 'P3'
export type RoadmapEffort = 'S' | 'M' | 'L'

export interface EngineeringRoadmapItem {
  id: string
  status: RoadmapItemStatus
  kind: RoadmapItemKind
  priority: RoadmapPriority
  effort: RoadmapEffort
  title: LocalizedText
  summary: LocalizedText
  rationale: LocalizedText
  pros: {
    en: readonly string[]
    uk: readonly string[]
    ru: readonly string[]
  }
  constraints: {
    en: readonly string[]
    uk: readonly string[]
    ru: readonly string[]
  }
}

export const ENGINEERING_ROADMAP_ITEMS: readonly EngineeringRoadmapItem[] = [
  {
    id: 'notion-workfolio-ui-v2',
    status: 'planned',
    kind: 'ui-ux',
    priority: 'P1',
    effort: 'M',
    title: {
      en: 'Notion Workfolio Authentic Visual Redesign (UI v2)',
      uk: 'Візуальний редизайн в естетиці Notion Workfolio (UI v2)',
      ru: 'Визуальный редизайн в эстетике Notion Workfolio (UI v2)',
    },
    summary: {
      en: 'Refine visual language closer to warm Notion Workfolio aesthetics: page cover & avatar header, softer paper/ink palette, cleaner borderless database views, and calmer typography.',
      uk: 'Наблизити візуальну мову до автентичного Notion Workfolio: обкладинка й аватар сторінки, тепліша палітра паперу/чорнила, легкі таблиці без важких рамок і спокійніша типографіка.',
      ru: 'Приблизить визуальный язык к теплой эстетике оригинального Notion Workfolio: обложка и аватар страницы, мягкая палитра бумаги/чернил, облегченные списки вместо тяжелых карточных рамок.',
    },
    rationale: {
      en: 'Architecture-first strategy: Phases 1–5 deliberately focused on multi-slug MDX 2.0 routing, Cmd+K search, RBAC, and Mobile-First mechanics so UI v2 becomes a pure design-token and layout pass without rewriting state or routing.',
      uk: 'Підхід Architecture-First: на етапах 1–5 ми свідомо закрили мультислаг-роутинг MDX 2.0, пошук Cmd+K, RBAC і Mobile-First механіку, щоб редизайн UI v2 ліг поверх готової логіки чисто через дизайн-токени.',
      ru: 'Подход Architecture-First: на этапах 1–5 мы осознанно сфокусировались на мультислаг-роутинге MDX 2.0, поиске Cmd+K, RBAC и Mobile-First навигации, чтобы редизайн UI v2 лёг поверх готовой логики без переписывания ядра.',
    },
    pros: {
      en: [
        'Distinctive personal Notion-like identity instead of standard SaaS dashboard cards.',
        'Zero risk of breaking routing, i18n, or MDX rendering because business logic is already isolated.',
      ],
      uk: [
        'Впізнаваний авторський стиль у дусі Notion замість типових SaaS-карток.',
        'Нульовий ризик зламати роутинг, i18n чи MDX-парсер завдяки вже ізольованій логіці.',
      ],
      ru: [
        'Узнаваемый авторский стиль в духе Notion Workfolio вместо стандартных SaaS-карточек.',
        'Нулевой риск сломать роутинг, i18n или MDX-движок благодаря уже изолированной бизнес-логике.',
      ],
    },
    constraints: {
      en: [
        'Requires careful contrast tuning across both Light (warm paper) and Dark (obsidian ink) themes.',
        'Interactive D3.js and TanStack Table views must adapt to softer Notion-like borders without losing legibility on mobile.',
      ],
      uk: [
        'Потребує ретельного калібрування контрасту для світлої (теплий папір) і темної тем.',
        'Графи D3.js і таблиця TanStack Table мають органічно вписатися в мінімалістичні рамки без втрати читабельності на смартфонах.',
      ],
      ru: [
        'Требует тонкой калибровки контраста одновременно для светлой («тёплая бумага») и тёмной темы.',
        'Интерактивные графы D3.js и таблица TanStack Table должны вписаться в минималистичный стиль без потери читаемости на смартфонах.',
      ],
    },
  },
  {
    id: 'security-csp-rate-limit',
    status: 'planned',
    kind: 'tech-debt',
    priority: 'P1',
    effort: 'S',
    title: {
      en: 'Strict HTTP Security Headers (CSP / HSTS) & Auth Rate Limiting',
      uk: 'Суворі HTTP Security Headers (CSP / HSTS) та Rate Limiting авторизації',
      ru: 'Строгие HTTP Security Headers (CSP / HSTS) и Rate Limiting авторизации',
    },
    summary: {
      en: 'Add Content-Security-Policy and HSTS in Next.js + Helmet and @nestjs/throttler on POST /api/auth/login before public cloud rollout.',
      uk: 'Додати Content-Security-Policy та HSTS у Next.js + Helmet і @nestjs/throttler на POST /api/auth/login перед публічним деплоєм.',
      ru: 'Настроить Content-Security-Policy и HSTS в Next.js + Helmet и @nestjs/throttler на POST /api/auth/login перед публичным облачным деплоем.',
    },
    rationale: {
      en: 'HttpOnly SameSite=Lax JWT cookies already block XSS token theft, but strict CSP and brute-force throttling on the Admin Passcode endpoint are mandatory before exposing the API publicly.',
      uk: 'HttpOnly куки вже захищають JWT від крадіжки через XSS, але перед виходом у публічний інтернет потрібні CSP та захист від перебору Admin Passcode.',
      ru: 'HttpOnly куки уже защищают JWT от кражи через XSS, но перед публикацией API на внешнем домене обязательны CSP и защита Admin Passcode от брутфорса.',
    },
    pros: {
      en: [
        'A+ Mozilla Observatory security posture',
        'Protects NestJS login endpoint against automated credential stuffing',
      ],
      uk: ['Оцінка A+ у Mozilla Observatory', 'Захищає NestJS ендпоінт логіну від автоматизованого брутфорсу'],
      ru: ['Оценка A+ по безопасности заголовков', 'Защищает эндпоинт входа NestJS от автоматического перебора ключей'],
    },
    constraints: {
      en: ['CSP nonces in Next.js App Router require testing alongside inline theme-hydration scripts and PostHog'],
      uk: ['CSP nonce в Next.js App Router потребує перевірки сумісності зі скриптом теми без мерехтіння'],
      ru: [
        'Настройка CSP nonce в Next.js App Router требует аккуратной связки со скриптом инициализации темы (ThemeProvider)',
      ],
    },
  },
  {
    id: 'sse-bfcache-lifecycle',
    status: 'planned',
    kind: 'tech-debt',
    priority: 'P2',
    effort: 'S',
    title: {
      en: 'SSE Lifecycle Management for Browser Back/Forward Cache (bfcache)',
      uk: 'Керування життєвим циклом SSE для браузерного bfcache',
      ru: 'Управление жизненным циклом SSE для браузерного bfcache',
    },
    summary: {
      en: 'Close EventSource(/api/telemetry/stream) on pagehide and reconnect on pageshow in WorkfolioFooter so mobile browsers keep the page in instant bfcache.',
      uk: 'Закривати EventSource(/api/telemetry/stream) на pagehide і перепідключати на pageshow у футері для миттєвої навігації Назад/Вперед.',
      ru: 'Закрывать соединение EventSource(/api/telemetry/stream) по событию pagehide и переподключать на pageshow, чтобы браузер помещал страницу в мгновенный bfcache.',
    },
    rationale: {
      en: 'Active streaming connections can prevent Chromium/Safari from snapshotting pages into Back/Forward cache during external link navigation.',
      uk: 'Відкритий стрім EventSource інколи заважає мобільним браузерам зберігати знімок сторінки в кеші переходів.',
      ru: 'Открытый стрим EventSource в футере может мешать мобильным браузерам сохранять снимок страницы при переходе по внешним ссылкам и возврате назад.',
    },
    pros: {
      en: ['0ms Back/Forward navigation on mobile Safari & Chrome', '100/100 Lighthouse Performance audit compliance'],
      uk: ['0 мс при натисканні «Назад» у мобільних браузерах', 'Повна відповідність аудиту Lighthouse 100/100'],
      ru: [
        'Мгновенный возврат «Назад» за 0 мс на смартфонах',
        'Прохождение строгой проверки bfcache в Lighthouse 100/100',
      ],
    },
    constraints: {
      en: ['Needs graceful exponential backoff when the NestJS API container is sleeping on free-tier hosting'],
      uk: ['Потребує м’якого backoff-перепідключення при холодному старті безкоштовного контейнера API'],
      ru: [
        'Нужен аккуратный backoff-таймер, чтобы не спамить реконнектами при холодном старте бесплатного контейнера API',
      ],
    },
  },
  {
    id: 'playwright-vitest-ci',
    status: 'planned',
    kind: 'devops',
    priority: 'P2',
    effort: 'M',
    title: {
      en: 'Playwright E2E RBAC Suite + GitHub Actions CI Pipeline',
      uk: 'Playwright E2E тести RBAC + пайплайн GitHub Actions CI',
      ru: 'Playwright E2E-тесты RBAC-флоу + пайплайн GitHub Actions CI',
    },
    summary: {
      en: 'Automate biome check, turbo typecheck, Vitest schema tests, and Playwright E2E verification of 1-Click Guest Pass -> HttpOnly Cookie -> MDX unlock on every PR.',
      uk: 'Автоматизувати biome check, turbo typecheck, Vitest та E2E перевірку видачі гостьової куки і відкриття статей на кожен PR.',
      ru: 'Автоматизировать biome check, turbo typecheck, Vitest и E2E-сценарий выдачи гостевой HttpOnly куки и разблокировки MDX-конспектов на каждый Pull Request.',
    },
    rationale: {
      en: 'During rapid architectural iteration (Phases 1–5), Lefthook pre-commit + strict tsc gave instant feedback; CI + E2E locks in regression safety as content scales past 100 notes.',
      uk: 'На етапі активного проєктування швидкий зворотний зв’язок давали Lefthook + суворий tsc; тепер час зафіксувати стабільність у CI.',
      ru: 'Во время быстрой сборки ядра мгновенную обратную связь обеспечивали Lefthook + строгий tsc; при росте базы за 100 статей критические пути нужно закрыть E2E в CI.',
    },
    pros: {
      en: [
        'Prevents regressions in Edge Proxy cookie redirects and i18n routing',
        'Demonstrates production QA culture directly in the public repo',
      ],
      uk: [
        'Унеможливлює регресії в Edge Proxy редіректах та i18n роутингу',
        'Наочно демонструє культуру автотестування в публічному репозиторії',
      ],
      ru: [
        'Исключает регрессии в редиректах Edge Proxy и локализованных маршрутах',
        'Наглядно показывает инженерную культуру тестирования в репозитории',
      ],
    },
    constraints: {
      en: ['GitHub Actions minutes budget requires caching pnpm store and Playwright browsers cleanly'],
      uk: ['Потрібне кешування pnpm store та браузерів Playwright для економії хвилин GitHub Actions'],
      ru: [
        'Требуется грамотное кэширование pnpm store и бинарников браузеров, чтобы билд в GitHub Actions укладывался в 2 минуты',
      ],
    },
  },
  {
    id: 'xyflow-interactive-architecture-map',
    status: 'evaluating',
    kind: 'idea',
    priority: 'P2',
    effort: 'M',
    title: {
      en: 'Interactive Node-Based Monorepo Architecture Map (XYFlow / React Flow)',
      uk: 'Інтерактивна вузлова карта архітектури монорепозиторію (XYFlow / React Flow)',
      ru: 'Интерактивная нодовая карта архитектуры монорепозитория (XYFlow / React Flow)',
    },
    summary: {
      en: 'Interactive system-design canvas showing live data flow between Next.js 16, Edge Proxy, NestJS API, TCP Telemetry Microservice, IndexedDB, and Neon PostgreSQL.',
      uk: 'Інтерактивне полотно системного дизайну з візуалізацією потоків даних між Next.js 16, Edge Proxy, NestJS API, TCP-мікросервісом та IndexedDB.',
      ru: 'Интерактивный холст системного дизайна с живыми связями между Next.js 16, Edge Proxy, NestJS API, TCP-микросервисом, IndexedDB и Neon PostgreSQL.',
    },
    rationale: {
      en: 'Directly showcases commercial expertise with XYFlow (from Superscript Systems) while helping CTOs grasp the full-stack topology in 10 seconds.',
      uk: 'Напряму демонструє комерційний досвід роботи з XYFlow (проєкти Superscript Systems) і пояснює топологію монорепо за 10 секунд.',
      ru: 'Напрямую демонстрирует мой коммерческий опыт со сложными графами на XYFlow (из Superscript Systems) и объясняет топологию монорепозитория за 10 секунд.',
    },
    pros: {
      en: [
        'High visual impact for technical interviewers',
        'Clickable nodes can jump straight to corresponding ADR or MDX deep-dives',
      ],
      uk: [
        'Сильний візуальний ефект на технічній співбесіді',
        'Клік по вузлу може відкривати відповідний ADR або статтю в Базі Знань',
      ],
      ru: [
        'Сильный инженерный вау-эффект для ревьюера',
        'Клик по узлу графа сможет сразу открывать соответствующий ADR или конспект',
      ],
    },
    constraints: {
      en: [
        '@xyflow/react adds ~45 KB gzipped client JS — must be isolated via next/dynamic({ ssr: false }) inside a dedicated tab or MDX simulation.',
        'Pan/zoom canvases trap touch-scroll on narrow smartphones unless paired with a static summary or explicit "Tap to interact" guard.',
      ],
      uk: [
        '@xyflow/react додає ~45 KB gzip клієнтського JS — обов’язковий ледачий імпорт через next/dynamic.',
        'На вузьких екранах панорамування полотна перехоплює скрол сторінки — потрібен режим «Натисніть для взаємодії».',
      ],
      ru: [
        '@xyflow/react добавляет ~45 KB gzip клиентского JS — обязателен ленивый чанк через next/dynamic без влияния на первый экран.',
        'На смартфонах pan/zoom холст перехватывает свайп страницы — потребуется блокировка до явного нажатия «Развернуть интерактивный граф».',
      ],
    },
  },
  {
    id: 'ai-rag-chat-vs-cmdk',
    status: 'deferred',
    kind: 'idea',
    priority: 'P3',
    effort: 'L',
    title: {
      en: 'LLM RAG Assistant ("Ask My Second Brain / CV") vs Static Cmd+K Index',
      uk: 'LLM RAG-асистент («Запитай моє CV / Базу Знань») проти статичного Cmd+K',
      ru: 'LLM RAG-ассистент («Спроси моё CV и Базу Знаний») против статического Cmd+K',
    },
    summary: {
      en: 'Semantic vector search (pgvector + LLM streaming answers) over MDX notes and experience.',
      uk: 'Семантичний векторний пошук (pgvector + стрімінг відповідей LLM) по статтях і досвіду.',
      ru: 'Семантический векторный поиск (pgvector + стриминг ответов LLM) по моим статьям и опыту.',
    },
    rationale: {
      en: 'Consciously deferred (YAGNI at current scale): for < 300 structured notes, our build-time RSC Cmd+K index matches titles, #tags, and h2/h3 anchors in < 5ms at $0/month, works offline, and never hallucinates.',
      uk: 'Свідомо відкладено (YAGNI на поточному масштабі): до 300 структурованих статей статичний RSC-індекс Cmd+K шукає по заголовках h2/h3 і #тегах за < 5 мс, коштує $0/міс і не галюцинує.',
      ru: 'Осознанно отложено (принцип YAGNI на текущем объёме): до 300 структурированных конспектов наш статический RSC-индекс Cmd+K ищет по заголовкам h2/h3 и #тегам быстрее 5 мс, стоит $0/мес, работает оффлайн и не галлюцинирует.',
    },
    pros: {
      en: ['Natural-language Q&A for recruiters ("Does Stanislav have FinTech / Stripe experience?")'],
      uk: ['Відповіді природною мовою для рекрутерів («Чи є досвід зі Stripe та високими навантаженнями?»)'],
      ru: ['Ответы естественным языком для рекрутеров («Какой опыт со Stripe, D3.js и высокими нагрузками?»)'],
    },
    constraints: {
      en: [
        'Requires ongoing LLM API token budget, strict rate-limiting against abuse, and prompt-injection guardrails.',
        'Adds 800–2000ms network latency where deterministic Cmd+K search responds instantaneously.',
      ],
      uk: [
        'Вимагає витрат на токени LLM API, жорсткого захисту від зловживань і prompt-injection.',
        'Додає 800–2000 мс мережевої затримки там, де детермінований пошук Cmd+K відповідає миттєво.',
      ],
      ru: [
        'Требует постоянного бюджета на токены LLM API, жёсткой защиты от спам-запросов и prompt-injection.',
        'Добавляет 800–2000 мс сетевой задержки там, где детерминированный поиск Cmd+K отвечает за единицы миллисекунд.',
      ],
    },
  },
  {
    id: 'headless-cms-vs-git-mdx',
    status: 'deferred',
    kind: 'architecture',
    priority: 'P3',
    effort: 'L',
    title: {
      en: 'Database / Headless CMS Admin Editor vs Git-Backed .mdx Files',
      uk: 'Візуальна адмін-панель (Headless CMS) проти Git-файлів .mdx',
      ru: 'Визуальная админ-панель (Headless CMS / БД) против Git-файлов .mdx',
    },
    summary: {
      en: 'Storing articles in PostgreSQL with a web WYSIWYG editor instead of version-controlled .mdx files inside apps/web/content/.',
      uk: 'Зберігання конспектів у PostgreSQL із веб-редактором замість версіонованих файлів .mdx у репозиторії.',
      ru: 'Хранение конспектов в PostgreSQL с веб-редактором вместо версионируемых .mdx файлов в apps/web/content/.',
    },
    rationale: {
      en: 'Consciously rejected for a personal developer portal: authoring notes in VS Code / Cursor alongside AI agents, typechecked code snippets, and Git history is 5x faster and enables pure zero-latency SSG + server-side Shiki.',
      uk: 'Свідомо відхилено для інженерного порталу: написання конспектів у Cursor / IDE разом із Git-історією в 5 разів швидше й дає миттєвий SSG із серверним Shiki.',
      ru: 'Осознанно отклонено для личного инженерного портала: писать шпаргалки в IDE / Cursor рядом с кодом и Git-историей кратно быстрее, а сборка SSG + серверный Shiki дают 0 мс задержки и 0 КБ лишнего JS.',
    },
    pros: {
      en: ['Allows editing typos from a phone browser without a Git commit'],
      uk: ['Дозволяє виправити одруківку з телефону без Git-коміту'],
      ru: ['Позволяет поправить опечатку со смартфона без Git-коммита и пересборки'],
    },
    constraints: {
      en: [
        'Introduces runtime DB dependency for reading articles, cache invalidation complexity (ISR), and security surface for admin CRUD.',
        'Loses atomic Git diffs and AI-assisted bulk refactoring across locales.',
      ],
      uk: [
        'Створює залежність читання статей від БД у рантаймі, ускладнює інвалідацію кешу (ISR) та розширює поверхню атак.',
        'Втрачаються атомарні Git-діфи та зручний AI-рефакторинг перекладів.',
      ],
      ru: [
        'Появляется зависимость чтения статей от БД в рантайме, сложность инвалидации кэша (ISR) и лишняя поверхность атак админки.',
        'Теряются атомарные Git-диффы и мгновенная помощь AI-агентов при синхронизации 3 локалей.',
      ],
    },
  },
  {
    id: 'foundation-mdx2-cmdk-mobile-shipped',
    status: 'shipped',
    kind: 'architecture',
    priority: 'P1',
    effort: 'L',
    title: {
      en: '3-Tier Multi-Slug MDX 2.0 Engine, Server Shiki, Cmd+K & Mobile-First Navigator',
      uk: '3-рівневий мультислаг-рушій MDX 2.0, серверний Shiki, Cmd+K та Mobile-First навігатор',
      ru: '3-уровневый мультислаг-движок MDX 2.0, серверный Shiki, Cmd+K и Mobile-First навигатор',
    },
    summary: {
      en: 'Completed architectural foundation (Phases 1–5): Topic -> Subtopic Tabs -> Articles hierarchy, 0 KB client JS syntax highlighting, deep h2/h3 search, #tags, and thumb-friendly section navigation.',
      uk: 'Реалізований фундамент платформи (Етапи 1–5): ієрархія Тема -> Підтеми -> Статті, 0 КБ клієнтського JS для підсвічування коду, пошук Cmd+K по h2/h3 і #тегах.',
      ru: 'Готовый архитектурный фундамент (Этапы 1–5): иерархия Тема -> Вкладки подтем -> Статьи, 0 КБ клиентского JS на подсветку кода, поиск Cmd+K по h2/h3 и #тегам, плавающий навигатор.',
    },
    rationale: {
      en: 'Prioritized before visual polish so the platform immediately works as a daily engineering "Second Brain" scalable to 100+ notes.',
      uk: 'Реалізовано до візуального полірування, щоб платформа вже працювала як щоденна «Друга пам’ять» на 100+ конспектів.',
      ru: 'Реализовано в первую очередь до визуальной полировки, чтобы портал уже работал как ежедневная «Вторая память» с запасом масштабирования на 100+ конспектов.',
    },
    pros: {
      en: [
        'Sub-second static page loads',
        'Clean separation of content (.mdx), contracts (@repo/shared-schemas), and UI',
      ],
      uk: ['Миттєве завантаження статичних сторінок', 'Чисте розділення контенту (.mdx), контрактів та UI'],
      ru: ['Мгновенная отдача статических страниц', 'Чистое разделение контента (.mdx), Zod-контрактов и слоёв UI'],
    },
    constraints: {
      en: ['Adding a new locale or frontmatter field requires updating mdx-content.ts parser once'],
      uk: ['Нові поля фронтматтера додаються централізовано через парсер mdx-content.ts'],
      ru: ['Новые поля фронтматтера централизованно типизируются через парсер mdx-content.ts'],
    },
  },
]
