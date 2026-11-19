import type { SupportedLocale } from '@repo/shared-schemas'
import { type LocalizedText, pickLocalized } from '@/entities/workfolio-profile/author-profile'

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
    id: 'prisma-7-migration',
    status: 'planned',
    kind: 'tech-debt',
    priority: 'P1',
    effort: 'M',
    title: {
      en: 'Prisma 6.4.1 -> Prisma 7 Migration (Wasm Engine, Native ESM & Driver Adapters)',
      uk: 'Міграція Prisma 6.4.1 -> Prisma 7 (Wasm-рушій, Native ESM і Driver Adapters)',
      ru: 'Миграция Prisma 6.4.1 -> Prisma 7 (Wasm-движок, Native ESM и Driver Adapters)',
    },
    summary: {
      en: 'Upgrade persistence layer in apps/api to Prisma 7 with prisma.config.ts, explicit prisma-client generator output, and @prisma/adapter-pg while preserving In-Memory fallback and TS 7 compatibility.',
      uk: 'Оновити шар персистентності в apps/api до Prisma 7 із prisma.config.ts, явним output генератора prisma-client і @prisma/adapter-pg зі збереженням In-Memory fallback і сумісності з TS 7.',
      ru: 'Обновить слой персистентности в apps/api до Prisma 7 с prisma.config.ts, явным output генератора prisma-client и @prisma/adapter-pg при сохранении In-Memory fallback и совместимости с TS 7.',
    },
    rationale: {
      en: 'Completes the modern toolchain upgrade immediately after TypeScript 7.0.2 and NestJS 12 native ESM, removing Rust query engine binaries and shrinking Docker runtime images.',
      uk: 'Логічно завершує модернізацію стеку одразу після TypeScript 7.0.2 і NestJS 12 ESM, прибираючи Rust-бінарники та зменшуючи розмір Docker-образів.',
      ru: 'Логично завершает модернизацию стека сразу после TypeScript 7.0.2 и NestJS 12 ESM, убирая Rust-бинарники и уменьшая размер Docker-образов.',
    },
    pros: {
      en: [
        'Rust-free Wasm core with native ESM alignment across NestJS 12 and TypeScript 7',
        'Smaller API container footprint and explicit typed datasource config via prisma.config.ts',
      ],
      uk: [
        'Wasm-ядро без Rust-бінарників і повна сумісність із нативним ESM у NestJS 12 та TypeScript 7',
        'Менший розмір Docker-контейнера API та явна типізована конфігурація в prisma.config.ts',
      ],
      ru: [
        'Wasm-ядро без Rust-бинарников и полная гармония с нативным ESM в NestJS 12 и TypeScript 7',
        'Меньший размер Docker-образа API и явный типизированный конфиг в prisma.config.ts',
      ],
    },
    constraints: {
      en: [
        'Requires updating PrismaService and seed imports to generated client paths and wiring @prisma/adapter-pg',
        'Must keep docker/api.Dockerfile prisma generate step and zero-DB In-Memory fallback intact',
      ],
      uk: [
        'Потрібно оновити імпорти PrismaService та seed під згенерований клієнт і підключити @prisma/adapter-pg',
        'Обов’язково зберегти крок генерації в docker/api.Dockerfile та автономний In-Memory режим без БД',
      ],
      ru: [
        'Требуется обновить импорты в PrismaService и seed.ts под сгенерированный клиент и подключить @prisma/adapter-pg',
        'Нужно сохранить шаг генерации в docker/api.Dockerfile и автономный In-Memory fallback без БД',
      ],
    },
  },
  {
    id: 'seo-og-error-boundaries',
    status: 'planned',
    kind: 'ui-ux',
    priority: 'P1',
    effort: 'S',
    title: {
      en: 'Production SEO (Sitemap / Robots), Localized Error Boundaries & Zero-Friction Docker Demo',
      uk: 'Production SEO (Sitemap / Robots), локалізовані Error Boundaries і Zero-Friction Docker Demo',
      ru: 'Production SEO (Sitemap / Robots), локализованные Error Boundaries и Zero-Friction Docker Demo',
    },
    summary: {
      en: 'Ship sitemap.ts (143 SSG routes with hreflang), robots.ts, localized [locale]/not-found.tsx & error.tsx, and clean separation between 1-command Docker reviewer demo and strict production secrets (with OpenGraph image cards queued cleanly alongside UI v2).',
      uk: 'Додати sitemap.ts (143 SSG-маршрути з hreflang), robots.ts, локалізовані not-found.tsx / error.tsx та чітко розділити 1-командне Docker Demo для рев’юера і суворі прод-секрети (динамічні OpenGraph-картки заплановані разом з UI v2).',
      ru: 'Добавить sitemap.ts (143 SSG-роута с hreflang), robots.ts, локализованные not-found.tsx / error.tsx и разделить 1-командное Docker Demo для тимлида и строгие прод-секреты (а OpenGraph-карточки вынести в пару к UI v2).',
    },
    rationale: {
      en: 'Delivers full EN/UA/RU search indexing, localized 404/Error recovery, and effortless docker compose up --build without API keys (via capability-gated disabled badges) while keeping strict fail-fast validation in docker-compose.prod.yml.',
      uk: 'Забезпечує EN/UA/RU пошукову індексацію, локалізовані 404/Error-сторінки та безшовний docker compose up --build без API-ключів (із блокуванням зовнішніх інтеграцій через capability-плашки), зберігаючи жорсткий fail-fast у docker-compose.prod.yml.',
      ru: 'Обеспечивает EN/UA/RU индексацию, локализованные 404/Error-страницы и лёгкий запуск docker compose up --build без API-ключей (с блокировкой внешних сервисов через плашку «нет API-ключа») при сохранении строгого fail-fast в docker-compose.prod.yml.',
    },
    pros: {
      en: [
        'Full EN/UA/RU SEO sitemap coverage + 1-command Docker onboarding for reviewers with zero manual .env edits',
        'Capability-gated UI cleanly disables external services missing API keys instead of crashing startup',
      ],
      uk: [
        'Повне EN/UA/RU SEO-покриття + запуск через Docker однією командою без ручного налаштування .env',
        'Capability-gated UI акуратно блокує зовнішні сервіси без API-ключів замість падіння при старті',
      ],
      ru: [
        'Полная EN/UA/RU индексация + запуск в Docker одной командой без ручного создания .env',
        'Capability-gated UI честно отключает внешние сервисы без API-ключей вместо падения контейнера',
      ],
    },
    constraints: {
      en: [
        'Dynamic 1200x630 opengraph-image.tsx (ImageResponse + local TTF font buffer) is deferred to pair cleanly with UI v2',
      ],
      uk: [
        'Динамічні opengraph-image.tsx (1200x630, ImageResponse + локальний TTF-шрифт) відкладено до редизайну UI v2',
      ],
      ru: [
        'Динамические карточки opengraph-image.tsx (1200x630, ImageResponse + локальный TTF-шрифт) запланированы в пару к UI v2',
      ],
    },
  },
  {
    id: 'workfolio-ui-v2-redesign',
    status: 'planned',
    kind: 'ui-ux',
    priority: 'P2',
    effort: 'M',
    title: {
      en: 'Editorial Mobile-First Visual Redesign (Workfolio UI v2)',
      uk: 'Авторський Mobile-First візуальний редизайн (Workfolio UI v2)',
      ru: 'Авторский Mobile-First визуальный редизайн (Workfolio UI v2)',
    },
    summary: {
      en: 'Craft a cohesive, distinctive editorial visual identity and calmer layout rhythm on top of the shipped Tailwind v4 2D token matrix, Zero-CLS typography, @container queries, and @starting-style transitions.',
      uk: 'Переосмислити авторський візуальний стиль і типографічний ритм поверх готового фундаменту Tailwind v4: 2D-палітр, Zero-CLS шрифтів, @container-запитів і @starting-style переходів.',
      ru: 'Переосмыслить авторский визуальный язык и композиционный ритм поверх уже готового фундамента Tailwind v4: 2D-палитр, Zero-CLS шрифтов, @container-запросов и @starting-style анимаций.',
    },
    rationale: {
      en: 'With Tailwind v4, CSS-first palettes, Storybook 10 (9/9), and core MDX/Auth mechanics already shipped, UI v2 can focus 100% on visual craft, hierarchy, and mobile ergonomics without touching state or routing.',
      uk: 'Коли Tailwind v4, 2D-палітри, Storybook 10 (9/9) та ядро MDX/Auth уже реалізовані, редизайн UI v2 сфокусується виключно на візуальній якості, ієрархії та мобільній ергономіці без переписування логіки.',
      ru: 'Когда Tailwind v4, 2D-палитры, Storybook 10 (9/9) и ядро MDX/Auth уже готовы, UI v2 может на 100% сфокусироваться на визуальном вкусе, иерархии и мобильной эргономике без правок логики.',
    },
    pros: {
      en: [
        'Original editorial craftsmanship instead of generic template cards',
        'Zero risk of breaking routing, i18n, or MDX rendering because business logic is already isolated',
      ],
      uk: [
        'Оригінальний авторський дизайн замість шаблонних карток',
        'Нульовий ризик зламати роутинг, i18n чи MDX-парсер завдяки вже ізольованій логіці',
      ],
      ru: [
        'Самобытный авторский дизайн вместо типовых шаблонных карточек',
        'Нулевой риск сломать роутинг, i18n или MDX-движок благодаря уже изолированной бизнес-логике',
      ],
    },
    constraints: {
      en: [
        'Requires strict contrast tuning across all 6 Light/Dark x Warm Paper/Graphite/Sepia combinations',
        'Interactive D3.js and TanStack Table views must remain scannable on 360px smartphones',
      ],
      uk: [
        'Потребує ретельного калібрування контрасту для всіх 6 комбінацій Light/Dark x Warm Paper/Graphite/Sepia',
        'Графи D3.js і таблиця TanStack Table мають лишатися зручними на екранах 360px',
      ],
      ru: [
        'Требует калибровки контраста сразу для всех 6 комбинаций Light/Dark x Warm Paper/Graphite/Sepia',
        'Интерактивные графы D3.js и таблица TanStack Table должны оставаться читаемыми на смартфонах 360px',
      ],
    },
  },
  {
    id: 'v080-enterprise-ts7-tailwind4',
    status: 'shipped',
    kind: 'architecture',
    priority: 'P1',
    effort: 'L',
    title: {
      en: 'TypeScript 7, Tailwind CSS v4, 4-Layer NestJS 12 Enterprise & 2D Appearance (v0.7.0 – v0.8.0)',
      uk: 'TypeScript 7, Tailwind CSS v4, 4-шаровий NestJS 12 Enterprise та 2D Appearance (v0.7.0 – v0.8.0)',
      ru: 'TypeScript 7, Tailwind CSS v4, 4-слойный NestJS 12 Enterprise и 2D Appearance (v0.7.0 – v0.8.0)',
    },
    summary: {
      en: 'Shipped FSD-Modular decomposition (apps/web), 4-layer NestJS 12 ESM architecture (common/config/migrations/modules), TypeScript 7.0.2, Tailwind v4.3.5 (@repo/ui/theme.css), 2D Appearance switcher, Zero-CLS Inter/JetBrains Mono fonts, @starting-style + @container, and 9/9 Storybook 10.',
      uk: 'Реалізовано FSD-Modular декомпозицію (apps/web), 4-шарову архітектуру NestJS 12 ESM (common/config/migrations/modules), TypeScript 7.0.2, Tailwind v4.3.5 (@repo/ui/theme.css), 2D-перемикач палітр, Zero-CLS шрифти Inter/JetBrains Mono, @starting-style + @container та 9/9 Storybook 10.',
      ru: 'Реализованы FSD-Modular декомпозиция (apps/web), 4-слойная архитектура NestJS 12 ESM (common/config/migrations/modules), TypeScript 7.0.2, Tailwind v4.3.5 (@repo/ui/theme.css), 2D-переключатель палитр, Zero-CLS шрифты Inter/JetBrains Mono, @starting-style + @container и 9/9 Storybook 10.',
    },
    rationale: {
      en: 'Upgraded the entire compiler, design-system, and backend architecture baseline before new product features so builds stay fast, tokens scale cleanly, and zero legacy v3/v5 debt remains.',
      uk: 'Оновили компілятор, дизайн-систему та бекенд-архітектуру до запуску нових продуктових фіч, щоб прибрати легасі v3/v5 і гарантувати масштабованість.',
      ru: 'Обновили компилятор, дизайн-систему и бэкенд-архитектуру до новых продуктовых фич, чтобы убрать легаси v3/v5 и обеспечить чистый масштаб.',
    },
    pros: {
      en: [
        'Native TS 7 speed + CSS-first Tailwind v4 engine with zero runtime CSS-in-JS',
        '6 instant CSS-variable theme combinations (Zero-FOUC + cross-tab sync) and 143 statically generated pages',
      ],
      uk: [
        'Швидкість нативного TS 7 + CSS-first рушій Tailwind v4 без рантайм-CSS-in-JS',
        '6 миттєвих комбінацій тем на CSS-змінних (Zero-FOUC + sync між вкладками) та 143 SSG-сторінки',
      ],
      ru: [
        'Скорость нативного TS 7 + CSS-first движок Tailwind v4 без JS-рантайма стилей',
        '6 мгновенных комбинаций тем на CSS-переменных (Zero-FOUC + sync вкладок) и 143 SSG-страницы',
      ],
    },
    constraints: {
      en: ['Vitest (not Jest/ts-jest) must be used for upcoming unit tests due to TS 7 compiler compatibility'],
      uk: ['Для unit-тестів потрібен суворо Vitest (без Jest/ts-jest) через сумісність із TS 7'],
      ru: ['Для будущих unit-тестов подходит строго Vitest (без Jest/ts-jest) из-за совместимости с TS 7'],
    },
  },
  {
    id: 'security-csp-rate-limit',
    status: 'shipped',
    kind: 'tech-debt',
    priority: 'P1',
    effort: 'S',
    title: {
      en: 'Strict HTTP Security Headers (CSP / HSTS), Fail-Fast Secrets & Auth Rate Limiting',
      uk: 'Суворі HTTP Security Headers (CSP / HSTS), Fail-Fast секрети та Rate Limiting авторизації',
      ru: 'Строгие HTTP Security Headers (CSP / HSTS), Fail-Fast секреты и Rate Limiting авторизации',
    },
    summary: {
      en: "Configured scoped CSP (including tightened font-src 'self' data:) & HSTS in Next.js, Helmet (CORP: cross-origin), @nestjs/throttler on auth endpoints, fail-fast Zod env secrets validation, and timingSafeEqual passcode checks.",
      uk: "Налаштовано scoped CSP (включно з жорстким font-src 'self' data:) та HSTS у Next.js, Helmet (CORP: cross-origin), @nestjs/throttler, fail-fast валідацію секретів через Zod і timingSafeEqual перевірку пароля адміна.",
      ru: "Настроены scoped CSP (включая зажатый font-src 'self' data:) и HSTS в Next.js, Helmet (CORP: cross-origin), @nestjs/throttler, fail-fast валидация секретов через Zod и timingSafeEqual проверка админ-ключа.",
    },
    rationale: {
      en: 'HttpOnly SameSite=Lax JWT cookies block XSS token theft, self-hosted next/font eliminates external font CDNs from CSP, and 5 req/min brute-force throttling + timing-safe hashing harden auth.',
      uk: 'HttpOnly куки захищають JWT від крадіжки через XSS, self-hosted next/font прибирає зовнішні CDN із CSP, а ліміт 5 req/min і timing-safe хешування захищають авторизацію.',
      ru: 'HttpOnly куки защищают JWT от XSS, self-hosted next/font убирает внешние CDN шрифтов из CSP, а лимит 5 req/min и timing-safe сравнение укрепляют авторизацию.',
    },
    pros: {
      en: [
        "Hardened HTTP security headers with self-only CV PDF embedding and font-src 'self' data:",
        'Blocks NODE_ENV=production boots with dev secrets and resolves real proxy IPs cleanly',
      ],
      uk: [
        "Посилений захист HTTP-заголовків зі скоупінгом для CV PDF та font-src 'self' data:",
        'Блокує запуск NODE_ENV=production із дефолтними секретами та коректно читає IP за проксі',
      ],
      ru: [
        "Усиленная политика заголовков со скоупингом для CV PDF и font-src 'self' data:",
        'Блокирует запуск NODE_ENV=production с дев-секретами и корректно читает IP за прокси',
      ],
    },
    constraints: {
      en: [
        'Strict per-request CSP nonces remain optional future work for replacing unsafe-inline theme/hydration scripts',
        'Temporary CJS/ESM Reflector bridge in AppModule stays until @nestjs/throttler ships native ESM',
      ],
      uk: [
        'Перехід на per-request CSP nonces для заміни unsafe-inline лишається подальшим покращенням',
        'Тимчасовий CJS/ESM міст Reflector в AppModule потрібен до релізу нативного ESM у @nestjs/throttler',
      ],
      ru: [
        'Переход на per-request CSP nonces вместо unsafe-inline остаётся опциональным шагом',
        'Временный CJS/ESM мост Reflector в AppModule нужен до выхода нативного ESM в @nestjs/throttler',
      ],
    },
  },
  {
    id: 'sse-bfcache-lifecycle',
    status: 'shipped',
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
      en: 'Vitest Unit Suite + Playwright E2E RBAC Tests in GitHub Actions CI',
      uk: 'Vitest Unit-тести + Playwright E2E тести RBAC у GitHub Actions CI',
      ru: 'Vitest Unit-тесты + Playwright E2E-тесты RBAC в пайплайне GitHub Actions CI',
    },
    summary: {
      en: 'Extend the live GitHub Actions CI (Biome lint, Docker/audit security, TypeScript 7 typecheck, Turborepo build, Storybook 10) with Vitest unit tests and Playwright E2E coverage for 1-Click Guest Pass -> HttpOnly Cookie -> MDX unlock.',
      uk: 'Доповнити активний GitHub Actions CI (Biome, Docker/audit security, TS 7 typecheck, build, Storybook 10) юніт-тестами на Vitest і Playwright E2E перевіркою видачі гостьової куки та відкриття статей.',
      ru: 'Дополнить работающий GitHub Actions CI (Biome, Docker/audit security, TS 7 typecheck, build, Storybook 10) unit-тестами на Vitest и Playwright E2E-сценарием выдачи HttpOnly куки и открытия MDX-конспектов.',
    },
    rationale: {
      en: 'Lint, security audit, TS 7 typecheck, Next.js build, and Storybook CI gates are already active; adding Vitest (native TS 7 compatible) and Playwright locks in runtime RBAC and Zod contract safety.',
      uk: 'Гейти lint, security, TS 7 typecheck, build і Storybook у CI вже працюють; Vitest (сумісний із TS 7) та Playwright закриють поведінкові й RBAC-регресії.',
      ru: 'Базовые гейты lint, security, TS 7 typecheck, build и Storybook в CI уже работают; добавление Vitest (совместим с TS 7) и Playwright закроет регрессии RBAC и Zod-контрактов.',
    },
    pros: {
      en: [
        'Prevents regressions in Edge Proxy cookie redirects, Zustand sync, and NestJS AuthService',
        'Demonstrates full automated QA pyramid directly in the public repo',
      ],
      uk: [
        'Унеможливлює регресії в Edge Proxy редіректах, Zustand і NestJS AuthService',
        'Наочно демонструє повну піраміду автотестів у публічному репозиторії',
      ],
      ru: [
        'Исключает регрессии в редиректах Edge Proxy, сторах Zustand и NestJS AuthService',
        'Наглядно демонстрирует полную пирамиду автотестирования в репозитории',
      ],
    },
    constraints: {
      en: ['Strict Vitest only (no Jest/ts-jest due to TypeScript 7 compatibility); CI must cache Playwright cleanly'],
      uk: [
        'Суворо Vitest (без Jest/ts-jest через сумісність із TypeScript 7); потрібне кешування браузерів Playwright',
      ],
      ru: ['Строго Vitest (без Jest/ts-jest из-за TypeScript 7); в CI нужно аккуратно кэшировать браузеры Playwright'],
    },
  },
  {
    id: 'telegram-bot-auth-knowledge-base',
    status: 'evaluating',
    kind: 'architecture',
    priority: 'P2',
    effort: 'M',
    title: {
      en: 'Next-Gen Auth & Telegram Bot Onboarding for Knowledge Base Access',
      uk: 'Повноцінна БД-авторизація та доступ до Бази Знань через Telegram-бота',
      ru: 'Полноценная БД-авторизация и доступ в Базу Знаний через Telegram-бота',
    },
    summary: {
      en: 'Replace the open 1-click guest stub with PostgreSQL-backed hashed invite/nonce tokens (SHA-256 / Argon2id) paired with a lightweight Telegram Bot Deep Link flow (/start <nonce>) sending instant access confirmation to users.',
      uk: 'Замінити відкриту 1-клік заглушку на БД-авторизацію з хешованими токенами (SHA-256 / Argon2id) та простим Telegram-ботом через Deep Link (/start <nonce>), що надсилає підтвердження доступу користувачу.',
      ru: 'Заменить открытую 1-click заглушку на БД-авторизацию с хэшированными токенами (SHA-256 / Argon2id) и простым Telegram-ботом через Deep Link (/start <nonce>), который отправляет пользователю подтверждение доступа.',
    },
    rationale: {
      en: 'Hands-on backend security & Bot API milestone: teaches cryptographic token hashing, anti-spam Deep Link handshakes (since Telegram bots cannot initiate messages by phone number), authenticated webhooks, and real-time SSE tab unlock.',
      uk: 'Практичне вивчення бекенд-безпеки та Bot API: хешування токенів у БД, Deep Link /start <nonce> (оскільки бот не може писати першим за номером телефону), захист webhook і розблокування вкладки через SSE.',
      ru: 'Практическая задача по бэкенд-безопасности и Bot API: хэширование токенов в БД, Deep Link /start <nonce> (так как Telegram-бот не может писать первым по номеру телефона), проверка webhook и моментальный вход через SSE.',
    },
    pros: {
      en: [
        'Demonstrates real-world webhook security (X-Telegram-Bot-Api-Secret-Token) + hashed single-use DB tokens',
        'Keeps recruiter fallback (one-time invite code) and graceful dev fallback when BOT_TOKEN is unset',
      ],
      uk: [
        'Практична демонстрація безпеки webhook (X-Telegram-Bot-Api-Secret-Token) + хешованих одноразових токенів у БД',
        'Залишає запасний інвайт-код для рекрутерів без Telegram і graceful fallback без BOT_TOKEN',
      ],
      ru: [
        'Живая демонстрация защиты webhook (X-Telegram-Bot-Api-Secret-Token) + хэшированных одноразовых токенов в БД',
        'Сохраняет резервный инвайт-код для рекрутеров без Telegram и graceful fallback при пустом BOT_TOKEN',
      ],
    },
    constraints: {
      en: [
        'Telegram API forbids bots from messaging uninitiated users by phone — requires Deep Link click or request_contact inside bot',
        'Depends on live PostgreSQL persistence and short-lived TTL token cleanup',
      ],
      uk: [
        'Telegram API забороняє боту писати першим за телефоном — потрібен клік по Deep Link або request_contact усередині бота',
        'Потребує підключеної БД PostgreSQL і очищення прострочених nonce-токенів за TTL',
      ],
      ru: [
        'Telegram API запрещает боту писать первым по номеру телефона — нужен переход по Deep Link или request_contact в боте',
        'Требует подключённой БД PostgreSQL и очистки просроченных nonce-токенов по TTL',
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
    id: 'foundation-mdx-cmdk-mobile-shipped',
    status: 'shipped',
    kind: 'architecture',
    priority: 'P1',
    effort: 'L',
    title: {
      en: '3-Tier Multi-Slug MDX Engine, Server Shiki, Cmd+K & Mobile-First Navigator',
      uk: '3-рівневий мультислаг-рушій MDX, серверний Shiki, Cmd+K та Mobile-First навігатор',
      ru: '3-уровневый мультислаг-движок MDX, серверный Shiki, Cmd+K и Mobile-First навигатор',
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
      en: ['Adding a new locale or frontmatter field requires updating mdx-ast-parser.ts once'],
      uk: ['Нові поля фронтматтера додаються централізовано через парсер mdx-ast-parser.ts'],
      ru: ['Новые поля фронтматтера централизованно типизируются через парсер mdx-ast-parser.ts'],
    },
  },
  {
    id: 'pre-ui-v2-foundation-hardening',
    status: 'shipped',
    kind: 'architecture',
    priority: 'P1',
    effort: 'L',
    title: {
      en: 'Pre-UI v2 Hardening: Design Tokens v2, RSC Diet, Remark AST & Edge Web Crypto JWT',
      uk: 'Харденінг перед UI v2: Design Tokens v2, RSC-дієта, Remark AST та Edge Web Crypto JWT',
      ru: 'Харденинг перед UI v2: Design Tokens v2, RSC-диета, Remark AST и Edge Web Crypto JWT',
    },
    summary: {
      en: 'Multi-theme/multi-tenant CSS token matrix + Dual-Theme Shiki, static /search-index/[locale] (0 KB initial HTML), server remark AST, Edge HS256 JWT verification via crypto.subtle, and React 19 Compiler.',
      uk: 'Мульти-палітрові семантичні CSS-токени + Dual-Theme Shiki, статичний /search-index/[locale] (0 КБ у HTML), серверний remark AST, крипто-перевірка HS256 JWT на Edge та React 19 Compiler.',
      ru: 'Мульти-палитровые/multi-tenant CSS-токены + Dual-Theme Shiki, статический /search-index/[locale] (0 КБ в HTML), серверный remark AST, крипто-проверка HS256 JWT на Edge и React 19 Compiler.',
    },
    rationale: {
      en: 'Eliminated token narrow-coupling, 3-locale client bundle duplication, regex parser fragility, and superficial Edge cookie checks before starting the UI v2 redesign.',
      uk: 'Прибрали вузькі місця палітр, дублювання локалей у клієнтському бандлі, крихкість RegExp-парсера та поверхневу перевірку кук до старту UI v2.',
      ru: 'Устранили узкую палитру токенов, дублирование 3 локалей в клиентском JS, хрупкость RegExp-парсера и поверхностную проверку кук до старта редизайна UI v2.',
    },
    pros: {
      en: [
        'Instant theme/tenant switching via CSS variables ([data-palette] + .dark) with 0 KB Shiki client JS',
        'Scales cleanly past 100+ articles while blocking forged JWT cookies directly at the Edge in <0.2ms',
      ],
      uk: [
        'Миттєва зміна палітр/тенантів через CSS-змінні ([data-palette] + .dark) при 0 КБ клієнтського JS у Shiki',
        'Масштабується за 100+ конспектів і відсікає підроблені JWT-куки прямо на Edge за <0.2 мс',
      ],
      ru: [
        'Мгновенная смена тем и палитр тенантов через CSS-переменные ([data-palette] + .dark) при 0 КБ JS у Shiki',
        'Масштабируется за 100+ статей и криптографически отсекает поддельные JWT-куки на Edge за <0.2 мс',
      ],
    },
    constraints: {
      en: [
        'Server-side session revocation awaits short-lived Access + Refresh token rotation in the Backend Milestone',
      ],
      uk: ['Миттєве відкликання сесій на сервері буде додано через пару Access + Refresh токенів на етапі бекенду'],
      ru: ['Мгновенный отзыв сессий на сервере будет закрыт ротацией Access + Refresh токенов на этапе бэкенда'],
    },
  },
  {
    id: 'jwt-access-refresh-rotation',
    status: 'planned',
    kind: 'architecture',
    priority: 'P2',
    effort: 'M',
    title: {
      en: 'Short-Lived Access (15m) + Refresh (7d) JWT Rotation & Session Revocation',
      uk: 'Ротація короткоживучих Access (15m) + Refresh (7d) JWT та відкликання сесій',
      ru: 'Ротация короткоживущих Access (15m) + Refresh (7d) JWT и отзыв сессий',
    },
    summary: {
      en: 'Complement Edge HS256 signature verification with short-lived Access cookies and rotating HttpOnly Refresh tokens backed by VisitorSession in PostgreSQL.',
      uk: 'Доповнити Edge HS256 верифікацію короткоживучим Access-токеном та ротацією HttpOnly Refresh-токенів із записом у PostgreSQL.',
      ru: 'Дополнить крипто-проверку HS256 на Edge связкой короткоживущего Access-токена (15 мин) и ротируемого HttpOnly Refresh-токена с хранением сессии в PostgreSQL.',
    },
    rationale: {
      en: 'Stateless 7-day JWTs verify cryptographically in <0.2ms at the Edge without DB latency, whereas adding Refresh rotation in the Backend Milestone enables instant session revocation.',
      uk: 'Stateless JWT перевіряється на Edge за <0.2 мс без запитів у БД, а ротація Refresh-токенів на етапі бекенду дасть миттєве відкликання сесій.',
      ru: 'Stateless JWT проверяется на Edge за <0.2 мс без похода в БД, а ротация Refresh-токенов на бэкенд-этапе позволит мгновенно отзывать выданные доступы.',
    },
    pros: {
      en: ['Sub-millisecond Edge checks + server-controlled revocation window of <=15 minutes'],
      uk: ['Субмілісекундна перевірка на Edge + контрольоване вікно відкликання <=15 хвилин'],
      ru: ['Субмиллисекундная проверка на Edge + управляемое окно отзыва доступа не более 15 минут'],
    },
    constraints: {
      en: ['Requires silent token refresh interceptor on 401 responses without race conditions across parallel tabs'],
      uk: ['Потребує безшовного перехоплення 401 із захистом від гонитви запитів між відкритими вкладками'],
      ru: ['Требует аккуратного бесшовного обновления по 401 с защитой от гонки запросов из соседних вкладок'],
    },
  },
]

export interface LocalizedRoadmapItem {
  id: string
  status: RoadmapItemStatus
  kind: RoadmapItemKind
  priority: RoadmapPriority
  effort: RoadmapEffort
  title: string
  summary: string
  rationale: string
  pros: readonly string[]
  constraints: readonly string[]
}

export function getLocalizedRoadmapItems(locale: SupportedLocale): LocalizedRoadmapItem[] {
  return ENGINEERING_ROADMAP_ITEMS.map((item) => ({
    id: item.id,
    status: item.status,
    kind: item.kind,
    priority: item.priority,
    effort: item.effort,
    title: pickLocalized(item.title, locale),
    summary: pickLocalized(item.summary, locale),
    rationale: pickLocalized(item.rationale, locale),
    pros: item.pros[locale] ?? item.pros.en,
    constraints: item.constraints[locale] ?? item.constraints.en,
  }))
}
