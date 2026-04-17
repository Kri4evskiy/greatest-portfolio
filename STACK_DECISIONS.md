# Stack Decisions

## Purpose

Этот файл фиксирует принятые стековые решения проекта.

Его задача:

- не терять архитектурный контекст;
- не возвращаться к уже решённым вопросам без причины;
- явно фиксировать, почему был выбран именно этот путь;
- служить decision log для дальнейшего развития проекта.

## Rule: keep this file updated

Это обязательный документ.

Если меняется хотя бы одно важное стековое решение, `STACK_DECISIONS.md` должен быть обновлён в тот же цикл изменений.

Правило:

- изменился стек -> обнови decision log;
- изменился baseline подход -> обнови decision log;
- изменился testing strategy -> обнови decision log.

## 1. Frontend framework

### Decision

Используем `Next.js`.

### Why

- проект SEO-critical;
- проект контентный;
- нужны SSR/SSG/server capabilities;
- `Next.js` лучше подходит для public-facing portfolio platform;
- это сильный современный production baseline.

### Rejected alternative

`Vite` как основа основного приложения.

### Why rejected

- слабее подходит под SEO/content-first задачи;
- не даёт тех же встроенных fullstack-web преимуществ;
- для данного проекта был бы скорее упрощением не в ту сторону.

## 2. Backend framework direction

### Decision

Используем `Python backend` как основной backend layer.

Основной кандидат: `FastAPI`.

### Why

- это соответствует цели проекта по росту в `Python`;
- backend-логика и интеграции логичнее живут отдельно от frontend;
- `FastAPI` современный, typed и хорошо подходит под API-first подход.

## 3. Database platform

### Decision

Используем `Supabase` + `PostgreSQL`.

### Why

- нужен `Postgres`;
- нужен удобный managed foundation;
- `Supabase` даёт storage и auth-инфраструктуру;
- это не конфликтует с `Python backend`.

## 4. ORM / data access

### Decision

Основной backend data access stack:

- `SQLAlchemy 2`
- `Alembic`

### Why

- это естественный production-grade выбор для `Python backend`;
- зрелый и устойчивый стек для PostgreSQL;
- хорошо подходит под модульный backend с явным data access;
- даёт сильную миграционную дисциплину.

### Rejected alternative

`Drizzle ORM` как основной ORM проекта.

### Why rejected

- основной backend у проекта на `Python`, а не на `TypeScript`;
- главный ORM должен жить в том runtime, где будет основная доменная логика;
- `Drizzle` имел бы смысл только при TypeScript-first backend стратегии.

## 5. Auth strategy

### Decision

Базово ориентируемся на `Supabase Auth` как identity layer.

### Why

- не нужно вручную писать всю auth-инфраструктуру;
- ниже security-risk;
- быстрее delivery;
- `Python backend` при этом остаётся основным domain/backend слоем.

## 6. Frontend architecture style

### Decision

Не использовать `FSD` как обязательную базовую архитектурную методологию.

Вместо этого использовать `domain-oriented modular frontend architecture`.

### Why

- `Next.js App Router` уже задаёт структуру;
- для такого проекта FSD может быть тяжелее, чем полезнее;
- доменно-модульный подход проще и чище для portfolio/content platform.

## 7. Testing strategy

### Decision

Основная стратегия тестирования:

- `pytest` для backend unit/integration/API tests;
- `Playwright` для frontend e2e, smoke и regression;
- frontend unit runner не включать в стартовый baseline.

### Why

- главная доменная логика будет жить в `Python backend`;
- frontend в этом проекте важнее проверять через реальные пользовательские потоки;
- отдельный frontend unit runner увеличивает сложность поддержки;
- два сильных слоя лучше, чем три слабосвязанных слоя без чёткого оправдания.

### About Vitest

`Vitest` сейчас не считается лучшим обязательным решением для этого проекта.

Не потому что он плохой, а потому что:

- он не нужен как baseline при выбранной архитектуре;
- он добавляет ещё один слой инфраструктуры;
- его польза пока не доказана структурой будущего проекта.

### When to reconsider

Возвращаемся к вопросу frontend unit runner только если позже появится существенный объём:

- сложной клиентской логики;
- editor-like UI;
- rich interactive components;
- isolated logic, которую неудобно проверять только через Playwright.

До этого момента решение остаётся таким:

- `pytest + Playwright`, без обязательного `Vitest`.

## 8. UI documentation tooling

### Decision

`Storybook` учитывать архитектурно, но не включать в Day 1 baseline.

### Why

- в начале важнее собрать сам продукт и стабильные UI primitives;
- Storybook полезен, когда UI-system уже начал оформляться.

## 9. Documentation policy

### Decision

Документация обязательна к постоянной актуализации.

### Why

- проект задуман как инженерно зрелый;
- архитектурные решения будут накапливаться;
- без актуальной документации проект быстро потеряет ясность.

### Mandatory docs

- `README.md`
- `PROJECT_PLAN.md`
- `ARCHITECTURE.md`
- `STACK_DECISIONS.md`
- `AGENTS.md`
- `docs/README.md`
- `docs/PROJECT_STRUCTURE.md`

## 10. Current final baseline

На текущий момент базовый стек проекта считается таким:

- `Next.js`
- `Python backend` (`FastAPI` как основной кандидат)
- `Supabase`
- `PostgreSQL`
- `SQLAlchemy 2`
- `Alembic`
- `Tailwind CSS`
- `react-hook-form`
- `Zod`
- `TanStack Query`
- `LinguiJS`
- `Biome`
- `Playwright`
- `pytest`

Без обязательного включения:

- `Vitest`
- `FSD`
- `Storybook` на старте
