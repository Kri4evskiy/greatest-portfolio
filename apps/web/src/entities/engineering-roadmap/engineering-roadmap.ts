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
    id: 'system-observability-api-inspector',
    status: 'shipped',
    kind: 'architecture',
    priority: 'P1',
    effort: 'S',
    title: {
      en: 'Live System Observability Page (/system-status), Cursor/Offset API Inspector & Capability Matrix',
      uk: 'Сторінка System Observability (/system-status), Cursor/Offset API інспектор і матриця інтеграцій',
      ru: 'Страница System Observability (/system-status), Cursor/Offset API-инспектор и матрица интеграций',
    },
    summary: {
      en: 'Dedicated /system-status page (linked from the footer SSE LIVE indicator) showcasing real Cursor pagination (GET /api/telemetry/events), Offset pagination (GET /api/knowledge/metrics/paginated), TCP microservice stats, and the GET /api/capabilities matrix.',
      uk: 'Виділена сторінка /system-status (відкривається кліком по футеру SSE LIVE), що демонструє живу Cursor-пагінацію (/api/telemetry/events), Offset-пагінацію (/api/knowledge/metrics/paginated), статистику TCP-мікросервісу та матрицю /api/capabilities.',
      ru: 'Выделенная страница /system-status (открывается по клику на пульс SSE LIVE в футере), демонстрирующая живую Cursor-пагинацию (/api/telemetry/events), Offset-пагинацию (/api/knowledge/metrics/paginated), статы TCP-микросервиса и матрицу /api/capabilities.',
    },
    rationale: {
      en: 'Immediately surfaces 100% of our existing NestJS 12 pagination & microservice endpoints in the UI while establishing the SystemCapabilitiesSchema contract used by Redis, S3/R2, and Telegram Bot capability gating.',
      uk: 'Миттєво виводить у інтерфейс уже готові ендпоінти Cursor/Offset пагінації та TCP-телеметрії NestJS 12 і закладає контракт SystemCapabilitiesSchema для Redis, S3/R2 і Telegram-бота.',
      ru: 'Мгновенно выводит в UI уже написанные на бэкенде эндпоинты Cursor/Offset пагинации и TCP-телеметрии NestJS 12, одновременно закладывая контракт SystemCapabilitiesSchema для Redis, S3/R2 и Telegram-бота.',
    },
    pros: {
      en: [
        'Zero wasted backend code: reviewers can inspect real Cursor (useInfiniteQuery) and Offset pagination in DevTools Network Tab',
        'Provides a single source of truth (/api/capabilities) for active vs. fallback infrastructure modes without leaking secrets',
      ],
      uk: [
        'Жодного «мертвого» коду на бекенді: рев’юер бачить живу Cursor (useInfiniteQuery) та Offset пагінацію прямо в Network Tab',
        'Єдиний безпечний контракт (/api/capabilities) для індикації активних сервісів та In-Memory фолбеків без витоку ключів',
      ],
      ru: [
        'Никакого «спящего» кода на API: тимлид видит живую Cursor (useInfiniteQuery) и Offset пагинацию прямо в Network Tab',
        'Единый безопасный контракт (/api/capabilities) для отображения активных сервисов и In-Memory фолбэков без утечки ключей',
      ],
    },
    constraints: {
      en: [
        'Page shell must remain SSG-compatible for Docker/CI builds while hydrating live pagination & SSE streams on the client',
      ],
      uk: [
        'Оболонка сторінки має залишатися SSG-сумісною для збірки в Docker/CI, підвантажуючи живу пагінацію та SSE на клієнті',
      ],
      ru: [
        'Оболочка страницы должна оставаться SSG-совместимой для сборки в Docker/CI, подгружая живую пагинацию и SSE на клиенте',
      ],
    },
  },
  {
    id: 'seo-og-error-boundaries',
    status: 'shipped',
    kind: 'ui-ux',
    priority: 'P1',
    effort: 'S',
    title: {
      en: 'Production SEO (Sitemap / Robots), Localized Error Boundaries & Zero-Friction Docker Demo',
      uk: 'Production SEO (Sitemap / Robots), локалізовані Error Boundaries і Zero-Friction Docker Demo',
      ru: 'Production SEO (Sitemap / Robots), локализованные Error Boundaries и Zero-Friction Docker Demo',
    },
    summary: {
      en: 'Ship sitemap.ts (all localized SSG routes with hreflang), robots.ts, Obsidian Editorial Dark opengraph-image.tsx (1200x630) & terminal >_ icon.tsx, localized [locale]/not-found.tsx & error.tsx, and clean separation between 1-command Docker reviewer demo and strict production secrets.',
      uk: 'Додати sitemap.ts (усі локалізовані SSG-маршрути з hreflang), robots.ts, Obsidian Editorial Dark opengraph-image.tsx (1200x630) та іконки >_ icon.tsx, локалізовані not-found.tsx / error.tsx та чітко розділити 1-командне Docker Demo для рев’юера і суворі прод-секрети.',
      ru: 'Добавить sitemap.ts (все локализованные SSG-роуты с hreflang), robots.ts, карточки Obsidian Editorial Dark opengraph-image.tsx (1200x630) и иконки >_ icon.tsx, локализованные not-found.tsx / error.tsx и разделить 1-командное Docker Demo для тимлида и строгие прод-секреты.',
    },
    rationale: {
      en: 'Delivers full EN/UA/RU search indexing, branded 1200x630 social preview cards, localized 404/Error recovery, and effortless docker compose up --build without API keys while keeping strict fail-fast validation in docker-compose.prod.yml.',
      uk: 'Забезпечує EN/UA/RU пошукову індексацію, брендовані 1200x630 картки-прев’ю, локалізовані 404/Error-сторінки та безшовний docker compose up --build без API-ключів, зберігаючи жорсткий fail-fast у docker-compose.prod.yml.',
      ru: 'Обеспечивает EN/UA/RU индексацию, брендированные 1200x630 карточки-превью, локализованные 404/Error-страницы и лёгкий запуск docker compose up --build без API-ключей при сохранении строгого fail-fast в docker-compose.prod.yml.',
    },
    pros: {
      en: [
        'Full EN/UA/RU SEO sitemap coverage + branded 1200x630 OpenGraph cards & terminal >_ favicons via next/og',
        '1-command Docker onboarding for reviewers with zero manual .env edits while docker-compose.prod.yml enforces strict secrets',
      ],
      uk: [
        'Повне EN/UA/RU SEO-покриття + брендовані 1200x630 OpenGraph-картки та іконки >_ через next/og',
        'Запуск через Docker однією командою без ручного налаштування .env при суворому захисті docker-compose.prod.yml',
      ],
      ru: [
        'Полная EN/UA/RU индексация + брендированные 1200x630 OpenGraph-карточки и фавиконки >_ через next/og',
        'Запуск в Docker одной командой без ручного создания .env при строгой защите в docker-compose.prod.yml',
      ],
    },
    constraints: {
      en: [
        'Uses the built-in offline Satori font buffer so social preview cards build deterministically in air-gapped Docker/CI environments',
      ],
      uk: [
        'Використовує вбудований офлайн-буфер шрифту Satori, щоб картки стабільно збиралися в ізольованих Docker/CI середовищах',
      ],
      ru: [
        'Использует встроенный офлайн-буфер шрифта Satori, чтобы карточки гарантированно собирались в изолированных Docker/CI контейнерах',
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
      en: 'With Tailwind v4, CSS-first palettes, Storybook 10 (100% coverage), and core MDX/Auth mechanics already shipped, UI v2 can focus 100% on visual craft, hierarchy, and mobile ergonomics without touching state or routing.',
      uk: 'Коли Tailwind v4, 2D-палітри, Storybook 10 (100% покриття) та ядро MDX/Auth уже реалізовані, редизайн UI v2 сфокусується виключно на візуальній якості, ієрархії та мобільній ергономіці без переписування логіки.',
      ru: 'Когда Tailwind v4, 2D-палитры, Storybook 10 (100% покрытие) и ядро MDX/Auth уже готовы, UI v2 может на 100% сфокусироваться на визуальном вкусе, иерархии и мобильной эргономике без правок логики.',
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
  {
    id: 'headless-cms-vs-git-mdx',
    status: 'planned',
    kind: 'architecture',
    priority: 'P1',
    effort: 'L',
    title: {
      en: 'DB-Backed Knowledge Base CMS (NestJS Entities, Prisma 7, R2/MinIO & Server Pagination)',
      uk: 'CMS-бекенд Бази Знань (NestJS Entities, Prisma 7, R2/MinIO та серверна пагінація)',
      ru: 'CMS-бэкенд Базы Знаний (NestJS Entities, Prisma 7, R2/MinIO и серверная пагинация)',
    },
    summary: {
      en: 'Evolve the Knowledge Base catalog from static build-only files to PostgreSQL metadata entities (Topic, Subtopic, Article, Tag) + Cloudflare R2/MinIO .mdx storage, server-side Offset/Cursor pagination, and TanStack Query useInfiniteQuery (keeping local .mdx as air-gapped fallback).',
      uk: 'Перевести каталог Бази Знаний на сутності PostgreSQL (Topic, Subtopic, Article, Tag) + об’єктне сховище R2/MinIO для .mdx, серверну Offset/Cursor пагінацію та useInfiniteQuery зі збереженням локального .mdx як офлайн-фолбеку.',
      ru: 'Перевести каталог Базы Знаний на сущности PostgreSQL (Topic, Subtopic, Article, Tag) + хранение тел .mdx в Cloudflare R2/MinIO, серверную Offset/Cursor пагинацию и useInfiniteQuery при сохранении локального .mdx фолбека.',
    },
    rationale: {
      en: 'Replaces pure client-side collapsing on Show More with real backend SQL pagination & tag search as the knowledge base scales, while offloading large assets cleanly into S3-compatible storage and triggering On-Demand ISR.',
      uk: 'Замінює суто клієнтське згортання за кнопкою Show More на справжні SQL-запити пагінації й пошуку тегів при зростанні бази, з On-Demand ISR та збереженням медіа у R2/MinIO.',
      ru: 'Превращает кнопки «Показать ещё» и поиск по #тегам в реальные SQL-запросы к NestJS API по мере роста базы, разгружая сборку через R2/MinIO и On-Demand ISR.',
    },
    pros: {
      en: [
        'Real full-stack pagination (useInfiniteQuery -> NestJS 12 -> Prisma 7) for topics, subtopic grids, and #tags',
        'Decouples publishing new notes and heavy assets from full frontend rebuilds',
      ],
      uk: [
        'Справжня full-stack пагінація (useInfiniteQuery -> NestJS 12 -> Prisma 7) для розділів, підтем і #тегів',
        'Додавання статей і медіа без повної перезбірки фронтенду',
      ],
      ru: [
        'Настоящая full-stack пагинация (useInfiniteQuery -> NestJS 12 -> Prisma 7) для разделов, подтем и #тегов',
        'Публикация новых заметок и медиа без пересборки всего фронтенда',
      ],
    },
    constraints: {
      en: [
        'Requires PostgreSQL schema modeling, HAST cache invalidation via contentHash/On-Demand ISR, and S3 bucket setup',
        'Must keep local apps/web/content/*.mdx graceful fallback intact for zero-config air-gapped reviewer demos',
      ],
      uk: [
        'Потребує реляційної схеми, інвалідації HAST-кешу через On-Demand ISR та налаштування S3-бакета',
        'Має зберігати graceful fallback на локальні .mdx-файли для демо без підключених ключів',
      ],
      ru: [
        'Требует реляционной схемы в Prisma, инвалидации HAST-кэша через On-Demand ISR и настройки бакета R2/MinIO',
        'Обязателен graceful fallback на локальные .mdx для запуска демо без внешних ключей',
      ],
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
