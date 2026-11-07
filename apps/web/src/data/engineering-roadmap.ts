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
    id: 'nestjs-mcp-zero-cost-server',
    status: 'evaluating',
    kind: 'architecture',
    priority: 'P2',
    effort: 'S',
    title: {
      en: 'Read-Only @nestjs/mcp Portfolio Context Server ($0 Token Cost)',
      uk: 'Read-Only MCP-сервер портфоліо на @nestjs/mcp ($0 за токени)',
      ru: 'Read-Only MCP-сервер портфолио на @nestjs/mcp ($0 за токены)',
    },
    summary: {
      en: 'Expose the 16 ADRs, commercial CV timeline, and MDX summaries via @nestjs/mcp (Streamable HTTP) in apps/api so reviewing CTOs can connect Cursor or Claude Desktop directly to the API.',
      uk: 'Відкрити 16 ADR, комерційний досвід із CV та конспекти Бази Знань як MCP-ресурси через @nestjs/mcp (Streamable HTTP), щоб CTO міг підключити Cursor або Claude прямо до нашого API.',
      ru: 'Отдавать 16 ADR, коммерческий опыт из CV и конспекты Базы Знаний как MCP-ресурсы через @nestjs/mcp (Streamable HTTP), чтобы тимлид мог подключить Cursor или Claude к нашему API.',
    },
    rationale: {
      en: 'Strong candidate for the upcoming backend milestone: unlike a hosted chat bot, @nestjs/mcp costs $0 in server LLM tokens (inference runs inside the reviewer’s own Cursor/Claude client) and reuses our @repo/shared-schemas Zod contracts.',
      uk: 'Перспективний шоукейс для бекенд-етапу: на відміну від вбудованого чату, @nestjs/mcp витрачає $0 серверних токенів (генерацію оплачує клієнт Cursor/Claude рев’юера) та напряму перевикористовує наші Zod-схеми.',
      ru: 'Перспективный бесплатный шоукейс для этапа доработки бэкенда: в отличие от живого чата, @nestjs/mcp стоит $0 серверных токенов (генерацию выполняет сам Cursor/Claude ревьюера) и нативно ложится на наши Zod-контракты.',
    },
    pros: {
      en: [
        '$0 ongoing LLM API cost — zero server API keys required',
        'Demonstrates cutting-edge NestJS 12 MCP ecosystem mastery in live technical interviews',
      ],
      uk: [
        '$0 витрат на LLM API — сервер взагалі не потребує платних ключів моделей',
        'Наочна демонстрація володіння найновішим стеком NestJS 12 MCP на співбесіді',
      ],
      ru: [
        '$0 расходов на токены LLM API — на сервере вообще не нужны платные ключи провайдеров',
        'Яркая демонстрация владения свежайшей экосистемой NestJS 12 MCP для техлида/CTO',
      ],
    },
    constraints: {
      en: [
        'Must ship strictly after @nestjs/throttler (P1) with hard per-IP quotas (e.g. 20 req/min) and SSE session caps to protect 512 MB free-tier containers.',
        'Strictly Read-Only scope with bounded Zod limits (limit <= 16) and mandatory masking of ADMIN-only <Redact /> NDA metrics.',
      ],
      uk: [
        'Запускати виключно після @nestjs/throttler (P1) із жорстким лімітом запитів за IP (20 req/хв) та обмеженням активних сесій.',
        'Суворий Read-Only контур із лімітами Zod (limit <= 16) і маскуванням закритих NDA-метрик <Redact />.',
      ],
      ru: [
        'Внедрять строго после настройки @nestjs/throttler (P1) с жёстким лимитом по IP (20 req/мин) и потолком активных сессий.',
        'Строго Read-Only контур без мутаций БД, с верхними лимитами в Zod (limit <= 16) и маскированием закрытых метрик <Redact />.',
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
      en: 'Live @nestjs/ai Agent ("Ask My CV / Second Brain" behind Guest Pass) vs Static Cmd+K',
      uk: 'Живий агент на @nestjs/ai («Запитай моє CV» під захистом Guest Pass) проти Cmd+K',
      ru: 'Живой агент на @nestjs/ai («Спроси моё CV» под защитой Guest Pass) против Cmd+K',
    },
    summary: {
      en: 'Conversational LLM assistant built on @nestjs/ai (AiModule.forRoot, @AgentFunction + Zod, model fallbacks) gated behind our HttpOnly Guest Pass cookie.',
      uk: 'Діалоговий LLM-асистент на базі @nestjs/ai (AiModule.forRoot, @AgentFunction + Zod, фолбеки моделей) під захистом нашої HttpOnly куки Guest Pass.',
      ru: 'Диалоговый LLM-ассистент на базе @nestjs/ai (AiModule.forRoot, @AgentFunction + Zod, фолбэки моделей) под защитой нашей HttpOnly куки Guest Pass.',
    },
    rationale: {
      en: 'Consciously deferred because paid LLM inference is unnecessary right now: static Cmd+K searches titles, #tags, and h2/h3 anchors in < 5ms for $0/month. If revisited later, @nestjs/ai + JwtRolesGuard + maxOutputTokens is our chosen blueprint.',
      uk: 'Свідомо відкладено, бо платна генерація зараз не потрібна: статичний Cmd+K шукає по статтях і заголовках h2/h3 за < 5 мс і $0/міс. Якщо повернемося пізніше — базою стане саме @nestjs/ai + Guest Pass + maxOutputTokens.',
      ru: 'Осознанно отложено, так как агент платный и сейчас избыточен: статический индекс Cmd+K ищет по конспектам и секциям h2/h3 быстрее 5 мс за $0/мес. Если решим добавить позже — архитектура ляжет на @nestjs/ai + Guest Pass + maxOutputTokens.',
    },
    pros: {
      en: [
        'Natural-language Q&A for recruiters ("Summarize Stanislav’s FinTech & D3.js experience")',
        'AiModule natively enforces maxOutputTokens, pricing tracking, and Claude -> GPT fallbacks',
      ],
      uk: [
        'Відповіді природною мовою для рекрутерів («Підсумуй досвід зі Stripe та D3.js»)',
        'AiModule із коробки контролює maxOutputTokens, ціну запиту та фолбек Claude -> GPT',
      ],
      ru: [
        'Ответы естественным языком для рекрутеров («Резюмируй опыт со Stripe, D3.js и высокими нагрузками»)',
        'AiModule из коробки даёт жёсткий лимит maxOutputTokens, подсчёт цены и авто-фолбэк Claude -> GPT',
      ],
    },
    constraints: {
      en: [
        'Requires recurring paid LLM token budget, response caching for common questions, and prompt-injection defenses.',
        'Adds 800–2000ms streaming latency where deterministic Cmd+K search responds instantaneously offline.',
      ],
      uk: [
        'Вимагає постійного бюджету на платні токени LLM, кешування частих запитань і захисту від prompt-injection.',
        'Додає 800–2000 мс мережевої затримки там, де детермінований пошук Cmd+K відповідає миттєво.',
      ],
      ru: [
        'Требует постоянного бюджета на платные токены LLM, кэша частых вопросов и защиты от prompt-injection.',
        'Добавляет 800–2000 мс сетевой задержки там, где детерминированный поиск Cmd+K отвечает мгновенно и оффлайн.',
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
