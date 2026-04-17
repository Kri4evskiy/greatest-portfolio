# Greatest Portfolio Project Plan

## 1. Цель проекта

Собрать не просто сайт-портфолио, а сильный инженерный продукт, который одновременно:

- представляет меня как разработчика;
- показывает мои статьи, идеи, решения, эксперименты и подход к архитектуре;
- служит реальной production-площадкой для лучших практик современного Next.js-стека;
- готов к развитию: от статического контента до авторизации, базы данных, админских сценариев, аналитики, автоматизации и AI-first разработки.

Этот проект должен быть не "демо ради демо", а долговечной платформой.

## 2. Главная идея архитектуры

Базовая рекомендация для старта:

- frontend + BFF/API: `Next.js` последней стабильной версии;
- основная БД: `PostgreSQL`;
- hosted database/platform: `Supabase`;
- ORM/typed DB layer: `Drizzle ORM` как основной кандидат;
- валидация: `Zod`;
- формы: `react-hook-form`;
- клиентский data fetching/state sync: `TanStack Query`;
- стили: `Tailwind CSS`;
- i18n: `LinguiJS`;
- backend tests: `pytest` как основной кандидат;
- e2e: `Playwright`;
- quality tooling: `TypeScript` + `Biome`;
- CI/CD: `GitHub Actions` + preview/prod deployments;
- AI workflow standard: отдельный файл `AGENTS.md`.

Стратегическое решение:

- не микросервисы на старте;
- не жёсткий монолит в плохом смысле;
- оптимальный путь: `modular monolith` с чёткими доменами и возможностью позже вынести отдельные части в сервисы.

Это даст:

- высокую скорость разработки;
- меньше инфраструктурной сложности;
- понятную кодовую базу;
- реальную возможность эволюции без костылей.

## 3. Что проект должен включать функционально

Минимальный продукт первого сильного релиза:

- главная страница;
- about / bio / skills;
- projects showcase;
- articles / notes / ideas;
- страница отдельных статей;
- страница отдельных проектов;
- контактная форма;
- регистрация / логин;
- личный кабинет или приватная зона для черновиков/управления контентом;
- многоязычность;
- SEO, OG, sitemap, robots;
- аналитика и техническое наблюдение за качеством.

Дальнейшее развитие:

- admin/editor interface;
- комментарии или reactions;
- newsletter;
- AI-assisted content workflows;
- импорт контента из Markdown/MDX/Notion/GitHub;
- background jobs;
- рекомендательная логика для статей/проектов.

## 4. Ключевое правило: AI-first standard file

Это один из самых важных пунктов. В проекте нужен файл, который задаёт стандарт разработки через AI-ассистента.

Рекомендуемое имя:

- `AGENTS.md`

Почему не только `.agents`:

- `AGENTS.md` легче читать человеку;
- Markdown удобнее для структурирования правил, workflows и примеров;
- файл хорошо подходит как единая точка инженерных стандартов;
- его можно дополнять ссылками на смежные спецификации.

Если позже потребуется, можно добавить и `.agents`, но на старте лучше иметь основной человеко-читаемый документ.

### Что должно быть в `AGENTS.md`

- миссия проекта;
- архитектурные принципы;
- правила работы с директориями и доменами;
- правила именования;
- best practices по TypeScript, React, Next.js, forms, DB, API, testing;
- правила работы с миграциями;
- требования к PR;
- требования к тестам;
- требования к документации;
- правила для AI-ассистента: что можно менять, что нельзя, как проверять изменения, какие команды запускать;
- список MCP-интеграций и их роль;
- definition of done для задач.

### Обязательные разделы `AGENTS.md`

1. `Project Intent`
2. `Architecture Rules`
3. `Coding Standards`
4. `Testing Standards`
5. `Database Rules`
6. `API Contracts`
7. `UI/UX Rules`
8. `AI Assistant Workflow`
9. `MCP Usage Rules`
10. `Git / PR / CI Rules`

## 5. Почему Next.js

`Next.js` здесь выглядит лучшим выбором, потому что проект сочетает:

- SSR/SSG/ISR потребности;
- контентные страницы;
- SEO-критичные маршруты;
- forms и authenticated flows;
- возможность держать рядом UI и server-side логику;
- хорошую интеграцию с React ecosystem;
- зрелую production-экосистему.

Что особенно важно для такого портфолио:

- можно рендерить статьи и проекты как SEO-first страницы;
- можно иметь App Router и server components там, где это оправдано;
- можно постепенно добавлять auth, DB и server actions/route handlers;
- можно строить проект как серьёзный production app, а не как просто витрину.

### Рекомендация

Использовать:

- `Next.js latest stable`
- `App Router`
- `TypeScript strict`
- server components по умолчанию
- client components только там, где реально нужен интерактив

### Финальное решение по фреймворку

Если выбирать между `Next.js` и `Vite` именно для этого проекта, то базовое решение должно быть таким:

- основной frontend framework: `Next.js`;
- `Vite` не выбирать как основу приложения;
- не включать `Vitest` в обязательный baseline стека.

Почему это решение лучше не только "чтобы казаться продвинутым", но и по факту:

- проект контентный и SEO-критичный;
- нужны SSR/SSG/streaming/server capabilities;
- Next.js сейчас остаётся одним из самых репрезентативных production-фреймворков для React ecosystem;
- Vercel даёт очень естественную среду для такого типа продукта, даже если хостинг не является единственным критерием;
- для портфолио-платформы с auth, контентом, i18n и growth-path к более сложной системе Next.js даёт более сильную базу.

Если бы проект был:

- чистым SPA;
- внутренней панелью без выраженного SEO;
- очень тонким фронтом поверх внешнего backend API;
- экспериментальной UI-песочницей,

тогда `Vite` мог бы быть предпочтительнее.

Но для данного проекта `Next.js` выглядит стратегически лучше.

## 6. Важный конфликт: Next.js и Vite

Здесь нужно зафиксировать важный архитектурный нюанс.

`Next.js` уже имеет свой dev/build pipeline. Поэтому:

- `Vite` не должен использоваться как основной сборщик приложения вместе с Next.js;
- это конфликт ролей;
- делать "Next.js app на Vite" не нужно.

Наличие `Vitest` не должно определять архитектуру проекта и не должно добавляться "на всякий случай".

### Правильная трактовка пункта про Vite

Оставляем:

- `Playwright` как основной frontend confidence layer;
- `pytest` как основной backend test layer;
- frontend unit runner не включаем в стартовый baseline.

Не используем:

- отдельную Vite-сборку как runtime app bundler для основного фронтенда.

Итог:

- `Next.js` отвечает за приложение;
- `pytest` отвечает за backend unit/integration testing;
- frontend unit runner не является обязательным столпом проекта;
- `Playwright` отвечает за e2e.

### Decision matrix

`Next.js` выигрывает по:

- SEO и контентным сценариям;
- SSR/SSG/ISR и гибридному рендерингу;
- работе с App Router;
- production-ready fullstack UX;
- образу современного инженерного продукта.

`Vite` выигрывает по:

- простоте старта для SPA;
- лёгкости ментальной модели;
- скорости минималистичных фронтенд-проектов.

### Окончательный вердикт

Для `greatest-portfolio` правильнее считать стек так:

- `Next.js` - frontend platform;
- `FastAPI` или аналогичный Python framework - backend platform;
- `pytest` - основной backend test runner;
- `Playwright` - e2e runner.

То есть выбор не `Vite или Next.js`, а `Next.js как web platform` плюс `Python backend`, если Python действительно является частью цели проекта.

## 7. База данных: PostgreSQL + Supabase

Это правильное направление, но важно корректно назвать роли.

`Supabase` сам по себе не ORM.

Supabase даёт:

- managed PostgreSQL;
- auth;
- storage;
- policies / RLS;
- realtime;
- edge capabilities;
- удобную платформу вокруг Postgres.

### Рекомендация

Использовать:

- `Supabase` как платформу и managed Postgres;
- `PostgreSQL` как основную БД;
- `Drizzle ORM` как типобезопасный ORM/query layer.

### Почему `Drizzle ORM`

- очень хорошо сочетается с TypeScript-first разработкой;
- даёт хороший контроль над SQL;
- не слишком тяжёлый;
- хорошо подходит для архитектуры, где важна прозрачность схемы;
- проще держать дисциплину вокруг миграций и typed schema.

### Когда можно рассмотреть Prisma

- если приоритетом станет удобство DX именно Prisma-экосистемы;
- если понадобится широкая база community recipes;
- если команда уже плотно работает через Prisma.

Но для этого проекта стартовый фаворит: `Drizzle`.

### Что продумать сразу по БД

- схема пользователей;
- профиль пользователя;
- проекты;
- статьи;
- теги;
- локализации контента;
- черновики/статусы публикации;
- media assets;
- audit fields: `created_at`, `updated_at`, `published_at`;
- slug strategy;
- soft delete policy только если реально нужна;
- индексы под slug, language, published status, dates.

## 8. Документация по стеку

Нужно сразу завести раздел ссылок на официальную документацию.

### Обязательные официальные источники

- Next.js: `https://nextjs.org/docs`
- React: `https://react.dev`
- TypeScript: `https://www.typescriptlang.org/docs/`
- Tailwind CSS: `https://tailwindcss.com/docs`
- React Hook Form: `https://react-hook-form.com`
- Zod: `https://zod.dev`
- TanStack Query: `https://tanstack.com/query/latest`
- Supabase: `https://supabase.com/docs`
- PostgreSQL: `https://www.postgresql.org/docs/`
- Drizzle ORM: `https://orm.drizzle.team/docs/overview`
- LinguiJS: `https://lingui.dev`
- Vitest: `https://vitest.dev`
- pytest: `https://docs.pytest.org/`
- Playwright: `https://playwright.dev`
- Biome: `https://biomejs.dev`
- GitHub Actions: `https://docs.github.com/actions`

В дальнейшем это можно вынести в `README.md` и/или `docs/stack.md`.

## 9. Интернационализация: LinguiJS

`LinguiJS` подходит, если нужна серьёзная i18n-стратегия, а не поверхностный перевод пары строк.

Почему это хороший выбор:

- зрелый подход к переводам;
- extraction workflow;
- удобен для масштабирования;
- хорошо сочетается с React/TypeScript;
- подходит для контентного проекта с несколькими локалями.

### Что продумать сразу

- базовые языки: например `ru` + `en`;
- URL strategy: `/ru/...`, `/en/...`;
- default locale policy;
- переводим ли UI только или также контент;
- где хранятся статьи: в БД, MDX, гибридно;
- fallback strategy;
- SEO для каждой локали: `hreflang`, canonical, localized metadata.

### Рекомендация

На старте:

- переводить UI гарантированно;
- контент делать либо двуязычным частично, либо с понятным fallback;
- не обещать полную локализацию всех статей в первой версии, если это не тянется ресурсно.

## 10. UI stack: Tailwind + RHF + Zod + TanStack Query

Этот набор очень сильный и логичный.

### Tailwind CSS

Нужен для:

- быстрой разработки;
- предсказуемого design system подхода;
- удобной поддержки responsive layouts;
- аккуратной токенизации дизайна.

Сразу продумать:

- design tokens;
- spacing scale;
- typography scale;
- light/dark theme;
- semantic color roles;
- container/layout primitives.

### React Hook Form

Нужен для:

- регистрации;
- логина;
- контактной формы;
- админских форм;
- editor workflows.

### Zod

Нужен для:

- единой схемы валидации;
- form validation;
- API validation;
- environment variable validation;
- type-safe contracts между слоями.

### TanStack Query

Это действительно один из самых сильных элементов стека.

Нужен для:

- клиентского кэширования;
- мутаций;
- optimistic updates при необходимости;
- синхронизации UI и серверных данных;
- ясного разделения server state и UI state.

### Важная рекомендация по границам использования

В Next.js App Router не нужно тащить TanStack Query везде без разбора.

Правильнее:

- серверные данные, хорошо работающие через server components, оставлять на стороне сервера;
- TanStack Query использовать там, где есть client-side sync, mutations, revalidation, личные кабинеты, формы, dashboard-паттерны.

## 11. TypeScript, strictness и качество кода

Минимум для такого проекта:

- `TypeScript strict: true`;
- запрет на `any` без обоснования;
- typed env validation;
- typed route contracts;
- typed DB schema;
- typed DTO/validation schemas.

### Biome вместо ESLint + Prettier

Это сильная идея, но нужно понимать границы.

Плюсы:

- быстрый;
- единый toolchain;
- удобен для format + lint;
- уменьшает конфигурационный шум.

Риски:

- часть ecosystem-правил из ESLint может быть недоступна или потребует адаптации;
- если в проекте понадобятся специфические React/Next lint rules, возможно придётся отдельно проверить покрытие.

### Рекомендация

Стартовать с:

- `Biome` как formatter/linter;
- проверить, хватает ли правил для Next.js production discipline;
- при нехватке не ломать себе архитектуру ради "чистоты идеи", а локально добрать нужные проверки.

## 12. Регистрация, auth и роль Python-бэкенда

Это один из самых тонких архитектурных вопросов.

### Обновлённое решение

Так как одна из целей проекта - подтянуть `Python` и писать backend именно на нём, это нужно признать частью основной архитектуры, а не просто бонусом.

Правильная схема для этого проекта:

- `Next.js` отвечает за frontend, routing, SEO, presentation layer и часть edge/web concerns;
- `Python backend` отвечает за основную доменную backend-логику;
- `Supabase` отвечает за managed `PostgreSQL`, storage и при необходимости auth-инфраструктуру;
- frontend и Python backend взаимодействуют через явный API-контракт.

### Противоречит ли `Supabase` использованию Python

Нет, не противоречит.

Наоборот, связка может быть очень сильной:

- `Supabase` даёт готовый managed Postgres;
- `Python` работает как backend-слой поверх этой базы;
- `Next.js` даёт сильный UX, SEO и контентный слой.

То есть `Supabase` нужен не вместо Python, а как инфраструктурная база для Python и всего приложения.

### Как лучше разложить ответственности

`Next.js`

- SSR/SSG страницы;
- UI;
- i18n;
- контентный experience layer;
- публичные страницы и клиентские сценарии.

`Python backend`

- бизнес-логика;
- доменные сервисы;
- интеграции;
- background jobs;
- отправка писем;
- административные сценарии;
- API для frontend.

`Supabase`

- PostgreSQL;
- storage;
- auth, если решим не писать auth с нуля;
- инфраструктурные возможности вокруг Postgres.

### Что делать с auth и регистрацией

Лучшая стартовая рекомендация:

- использовать `Supabase Auth` как identity layer;
- Python backend валидирует JWT/claims и работает как защищённый domain API;
- профиль, роли, права и доменные сущности хранятся в собственных таблицах Postgres.

Почему это лучше, чем писать auth полностью вручную на Python с нуля:

- меньше риск security-ошибок;
- быстрее delivery;
- остаётся место для Python как серьёзного backend-слоя;
- не тратится большая часть энергии на пересборку уже решённой инфраструктурной задачи.

### Что делать с письмами

Нужно разделить типы писем.

`Auth emails`

- подтверждение регистрации;
- reset password;
- magic link, если понадобится.

Эти письма логично оставить за `Supabase Auth`, если auth остаётся на нём.

`Product / transactional emails`

- contact form;
- уведомления;
- newsletter;
- письма по действиям внутри проекта.

Эти письма лучше отправлять из `Python backend` через специализированный email provider.

### Рекомендуемый email stack

- `Resend` как основной кандидат;
- альтернативы: `Postmark`, `Mailgun`, `SendGrid`.

### Если захочется сделать Python ещё заметнее, но без вреда архитектуре

Сильные и уместные варианты:

- `FastAPI` как основной backend API;
- Python worker для background jobs;
- сервис генерации/обработки контента;
- AI/LLM-пайплайны;
- классификация, теги, embedding/search-задачи;
- автоматизация email/notification workflows.

### Вывод

Для этого проекта Python уместен, если:

- он получает понятную backend-роль;
- не дублирует frontend platform responsibilities Next.js;
- не заставляет писать auth и всё инфраструктурное вручную без необходимости.

## 13. Микросервисы или нет

Короткий ответ: `нет, не на старте`.

### Почему микросервисы сейчас не лучший выбор

- проект пока не требует независимого масштабирования десятков доменов;
- стоимость DevOps и CI/CD возрастёт;
- локальная разработка станет сложнее;
- отладка будет тяжелее;
- сильно вырастет число инфраструктурных решений ещё до появления реальной бизнес-нагрузки.

### Что выбрать вместо этого

`Modular monolith with extraction-ready boundaries`

То есть:

- один основной репозиторий;
- один главный Next.js app;
- чёткие доменные модули;
- отдельные слои доступа к данным;
- отдельные сервисы/адаптеры по интеграциям;
- выделенные контракты и схемы;
- возможность позже вынести часть функционала в отдельный сервис.

### Какие части потенциально можно будет выделить позже

- auth/profile domain;
- content management domain;
- search/indexing service;
- notifications/mail service;
- analytics/event processing;
- AI/Python service;
- media processing.

### Архитектурный вывод

Сейчас проект должен строиться как:

- модульный application core;
- без преждевременного дробления на микросервисы;
- с заранее продуманными интерфейсами между доменами.

## 14. Рекомендуемая структура приложения

Так как проект не должен страдать от архитектурной догматичности, лучше брать не `FSD` как строгую систему, а `domain-oriented modular frontend architecture`.

## 15. Правило актуальности документации

Это обязательное правило проекта.

Документация должна поддерживаться в актуальном состоянии постоянно.

### Что это означает practically

- любое изменение архитектуры должно обновлять релевантные `.md` файлы;
- любое изменение стека должно фиксироваться явно;
- устаревшая документация считается реальной инженерной проблемой;
- документация входит в `definition of done`.

### Какие документы считаются обязательными

- `README.md`
- `PROJECT_PLAN.md`
- `ARCHITECTURE.md`
- `STACK_DECISIONS.md`
- `AGENTS.md`

### Принцип

Если решение принято, но не отражено в документации, значит решение не завершено.

### Почему не FSD как базовое правило

- `Next.js App Router` уже задаёт сильную структуру;
- для портфолио-контентного продукта полный FSD часто оказывается тяжелее, чем полезнее;
- FSD хорош в крупных SPA, но здесь легко получить лишнюю прослойку абстракций;
- нам важнее ясность доменов и чистые границы, чем следование конкретной методологии.

### Что выбрать вместо FSD

`Lightweight domain-driven modular structure`

Ключевая идея:

- `app/` остаётся техническим маршрутизатором Next.js;
- рядом живут понятные доменные модули;
- UI-композиции и бизнес-сценарии группируются по смыслу, а не по идеологии.

### Рекомендуемая структура frontend-приложения

```text
src/
  app/
  modules/
  components/
  shared/

server/
  api/
  services/
  repositories/
  db/
  auth/
  integrations/

content/
messages/
tests/
```

### Смысл слоёв

- `app/` - entrypoints, providers, layouts, route segments, global app wiring;
- `modules/` - вертикальные домены: projects, articles, auth, profile, contact, home;
- `components/` - переиспользуемые UI-компоненты без искусственного дробления;
- `shared/` - ui-kit, utils, config, constants, api clients, lib;
- `server/` - server-only слой для Next-side интеграций и инфраструктуры;
- `content/` - MDX/content assets;
- `messages/` - локализации;
- `tests/` - общая тестовая инфраструктура.

### Важная адаптация под Next.js

Так как `app/` в Next.js уже имеет техническое значение, нельзя слепо копировать SPA-методологии.

Нужно придерживаться такого правила:

- `app/` содержит только маршрутный и композиционный слой;
- доменная и UI-логика уходит в `modules`, `components`, `shared`;
- page route собирает экран из понятных доменных блоков.

### Пример мыслительной модели

`app/[locale]/projects/[slug]/page.tsx`

- делает route-level orchestration;
- получает данные;
- подключает page-level composition.

`modules/projects/`

- содержит ui, queries, types, helpers, server adapters для домена проектов.

`components/project-hero/`, `components/project-content/`

- общие или page-level UI-блоки.

### Для Python backend

Для Python backend не нужно тянуть FSD-терминологию вообще.

Лучше использовать близкую по духу модульную структуру:

- `app/modules/users/`
- `app/modules/articles/`
- `app/modules/projects/`
- `app/modules/auth/`
- `app/modules/notifications/`

Внутри каждого модуля:

- router;
- service;
- schemas;
- repository;
- models.

То есть философия та же: вертикальные домены, ясные границы, минимум хаоса.

## 16. Storybook как потенциальная часть системы

`Storybook` не обязателен на первом этапе, но его точно стоит держать в архитектурном горизонте.

### Когда Storybook оправдан

- появляется собственный UI-kit;
- появляется много переиспользуемых компонентов;
- нужен изолированный review UI;
- хочется фиксировать visual states компонентов;
- команда растёт или дизайн-система усложняется.

### Когда его лучше не тащить слишком рано

- если UI пока ещё формируется;
- если компонентов мало;
- если это замедлит старт первой версии.

### Рекомендация

- не включать Storybook в самый первый bootstrap как обязательный блокер;
- но проектировать `shared/ui`, `components` и `modules` так, чтобы Storybook можно было подключить без болезненной переделки;
- добавить его в `Phase 2` или `Phase 3`, когда появятся реальные UI primitives.

## 17. Контентная стратегия

Так как это портфолио + статьи + идеи, нужно заранее решить, где будет жить контент.

### Варианты

1. `MDX-first`
2. `Database-first`
3. `Hybrid`

### Рекомендация

`Hybrid` выглядит сильнее всего:

- ключевые страницы и структурированный контент можно хранить в БД;
- технические статьи и long-form content можно держать в MDX или позже переносить в editor-backed storage;
- это даст и контроль, и гибкость.

### Что важно продумать

- drafts/publication workflow;
- slug uniqueness;
- tags/categories;
- series/collections;
- featured content;
- localized content policy;
- full-text search в будущем.

## 18. MCP: что потенциально использовать

Так как проект AI-first, MCP нужно продумать как часть engineering workflow.

### Категории MCP, которые могут быть полезны

1. `Filesystem MCP`
2. `Git / GitHub MCP`
3. `PostgreSQL MCP`
4. `Supabase MCP`
5. `Browser / Playwright MCP`
6. `Docs / Knowledge MCP`
7. `Design / Figma MCP`
8. `HTTP / API MCP`
9. `Observability MCP`
10. `Package / Registry MCP`

### Практическая польза

`Filesystem MCP`

- чтение/поиск/редактирование проекта;
- генерация спецификаций;
- помощь в рефакторинге.

`Git / GitHub MCP`

- PR workflows;
- issue management;
- changelog generation;
- code review support.

`PostgreSQL MCP`

- исследование схемы;
- safe database introspection;
- проверка SQL и индексов.

`Supabase MCP`

- работа с проектом, схемой, policies, auth-related сценариями;
- проверка конфигурации и ресурсов.

`Browser / Playwright MCP`

- e2e сценарии;
- regression checks;
- визуальная проверка UX.

`Docs / Knowledge MCP`

- доступ к официальной документации;
- быстрая верификация API и best practices.

`Design / Figma MCP`

- если дизайн будет идти через Figma;
- синхронизация токенов и UI-решений.

`HTTP / API MCP`

- проверка внешних API;
- интеграционные сценарии;
- smoke validation.

`Observability MCP`

- логи, ошибки, traces;
- анализ production проблем.

### Рекомендация на старт

Минимальный набор MCP:

- filesystem;
- git/github;
- docs;
- browser/playwright;
- postgres/supabase.

## 19. Тестирование: обязательно и системно

Это должен быть проект, где тестирование не добавляется "когда-нибудь потом".

### Стек тестирования

- `Playwright` как основной e2e и frontend smoke/regression инструмент;
- `pytest` как основной backend unit/integration/API testing инструмент;
- при необходимости `Testing Library` для узких component tests.

### Финальное решение по unit-тестированию

На текущем этапе лучший baseline для проекта такой:

- `pytest` для unit/integration/API на backend;
- `Playwright` для frontend user journeys, smoke и regression;
- отдельный frontend unit runner не включать в обязательный стек.

Почему это выглядит сильнее:

- основная бизнес-логика будет жить в `Python backend`;
- frontend у проекта в первую очередь experience-driven, SEO-driven и integration-driven;
- лишний test runner добавит ещё один слой поддержки без гарантированной пользы;
- лучше иметь один сильный backend test layer и один сильный end-to-end слой, чем распыляться на слабосвязанные инструменты.

### Когда вообще возвращаться к вопросу frontend unit runner

Только если позже в проекте появятся:

- сложные клиентские утилиты;
- насыщенные interactive components с нетривиальной логикой;
- сложные editor-like сценарии;
- большой объём чистой frontend logic, которую невыгодно проверять только через e2e.

До этого момента отдельный frontend unit runner не нужен.

### Что покрывать frontend unit тестами, если они вообще нужны

- утилиты;
- Zod schemas;
- data transformation;
- form logic;
- critical UI logic с чистой изоляцией.

### Что покрывать backend тестами через `pytest`

- domain services;
- repositories;
- auth-related helpers and guards;
- API contracts;
- integrations с тестовыми double/mocks;
- email workflows;
- background tasks.

### Что покрывать e2e тестами

- открытие главной страницы;
- навигация по разделам;
- смена локали;
- регистрация/логин;
- отправка формы;
- просмотр статьи;
- просмотр проекта;
- protected routes;
- SEO-critical routing basics;
- базовые smoke сценарии после деплоя.

### Test strategy

- опора на `Playwright` для пользовательской уверенности;
- опора на `pytest` для backend correctness;
- frontend unit tests добавлять избирательно, а не по инерции;
- не пытаться покрыть e2e всё подряд;
- критические сценарии должны быть стабильными и не флейковыми.

### Обязательное правило

Любая важная фича должна приходить с ответом на вопрос:

- что покрыто unit;
- что покрыто integration;
- что покрыто e2e;
- какие риски остались непокрытыми.

## 20. CI/CD: обязательно с самого начала

Да, без CI/CD такой проект реально теряет серьёзность.

### Что должно быть в CI

- install dependencies;
- typecheck;
- biome check;
- unit/integration tests;
- build;
- playwright smoke/e2e на нужных ветках или preview среде.

### Что должно быть в CD

- preview deploy на PR;
- production deploy на main;
- protected deployment process;
- env management;
- database migration strategy;
- rollback strategy.

### GitHub Actions pipeline minimum

1. `quality.yml`
2. `test.yml`
3. `build.yml`
4. `e2e.yml`
5. `deploy.yml`

### Что ещё важно

- status checks mandatory;
- branch protection;
- conventional PR expectations;
- secrets management;
- no direct broken deploys to prod.

## 21. Расширения и tooling spec

Пункт про расширения действительно полезен. Это можно позже вынести в `README.md`, но уже сейчас стоит зафиксировать список.

### Рекомендуемые VS Code extensions

- `Biome`
- `Tailwind CSS IntelliSense`
- `ES7+ React/TypeScript snippets` или более минималистичный аналог
- `GitLens`
- `Playwright Test for VSCode`
- `EditorConfig for VS Code`
- `Markdown All in One`
- `Even Better TOML`
- `DotENV`
- `PostgreSQL` extension или SQL tooling по вкусу
- `GitHub Pull Requests and Issues`

### Опционально

- `Error Lens`
- `Code Spell Checker`
- `Material Icon Theme` или другой icon pack
- `Docker`
- `Dev Containers`

### Что важно описать в README позже

- обязательные расширения;
- рекомендуемые расширения;
- настройки editor;
- format on save policy;
- test commands;
- naming conventions;
- onboarding flow.

## 22. Обязательные инженерные моменты, которые нужно добавить сверх исходного списка

Ниже то, что обязательно стоит включить, даже если это не было явно сформулировано.

### Environment strategy

- `.env.example`;
- схема env через Zod;
- разделение local / preview / production;
- явный список обязательных переменных окружения.

### Security baseline

- secure auth flows;
- CSRF/headers/cookies policy;
- rate limiting для чувствительных маршрутов;
- secrets discipline;
- RLS review при использовании Supabase.

### SEO baseline

- metadata strategy;
- Open Graph;
- sitemap;
- robots;
- canonical URLs;
- localized SEO.

### Accessibility baseline

- keyboard navigation;
- focus states;
- semantic HTML;
- color contrast;
- form accessibility.

### Observability

- error tracking;
- structured logs;
- analytics/events;
- performance monitoring.

### Performance

- image optimization;
- route-level loading strategy;
- caching strategy;
- avoiding unnecessary client-side code;
- Core Web Vitals focus.

### Content governance

- editorial workflow;
- statuses: draft/review/published;
- versioning policy;
- ownership rules for content.

## 23. Основные конфликтные зоны, которые нужно признать заранее

### Конфликт 1: `Next.js` vs `Vite as app bundler`

Решение:

- Vite не используем как сборщик основного приложения;
- frontend unit runner не считаем обязательным;
- основной тестовый каркас строим вокруг `Playwright` и `pytest`.

### Конфликт 2: `Supabase` как ORM

Решение:

- Supabase = платформа и managed Postgres;
- ORM = `Drizzle`.

### Конфликт 3: `Python backend сразу` vs `простота старта`

Решение:

- Python допускается как core backend-слой уже со старта;
- но не нужно дублировать им роли `Next.js` и auth-инфраструктуры без необходимости.

### Конфликт 4: `Микросервисы` vs `реальная скорость разработки`

Решение:

- брать modular monolith;
- проектировать границы на вырост.

### Конфликт 5: `максимально мощный стек` vs `операционная сложность`

Решение:

- стек брать сильный, но с дисциплиной фаз внедрения;
- не внедрять всё сразу в production complexity mode.

## 24. Рекомендуемый roadmap по фазам

### Phase 0. Foundation

- выбрать окончательный стек;
- зафиксировать архитектурные решения;
- создать `AGENTS.md`;
- обновить `README.md`;
- описать env, tooling, conventions.

### Phase 1. App bootstrap

- поднять Next.js проект;
- подключить TypeScript strict;
- подключить Biome;
- подключить Tailwind;
- настроить базовую структуру директорий;
- настроить Lingui;
- настроить Playwright и backend test stack;
- не добавлять frontend unit runner, пока его необходимость не доказана.

### Phase 2. Design system and shell

- layout;
- navigation;
- themes;
- typography;
- reusable UI primitives;
- basic pages.

### Phase 3. Data and auth

- Supabase project;
- PostgreSQL schema;
- Drizzle setup;
- migrations;
- auth;
- profile model.

### Phase 4. Content engine

- projects;
- articles;
- tags;
- slugs;
- localized content strategy;
- publication pipeline.

### Phase 5. User-facing features

- contact forms;
- dashboard/private area;
- content browsing UX;
- search/filtering basics.

### Phase 6. Quality and delivery

- CI/CD;
- preview deployments;
- smoke tests;
- observability;
- performance and SEO hardening.

### Phase 7. Advanced evolution

- Python service if justified;
- AI workflows;
- background jobs;
- advanced content/editor capabilities;
- analytics and recommendation logic.

## 25. Definition of success

Проект можно считать действительно сильным, если он:

- красивый и профессиональный как портфолио;
- масштабируемый как инженерная система;
- удобный для AI-assisted разработки;
- покрыт тестами и пайплайнами;
- не перегружен преждевременной сложностью;
- готов к росту без архитектурного развала.

## 26. Финальная стратегическая рекомендация

Если зафиксировать всё коротко, то лучший старт для этого проекта такой:

- `Next.js` как основной application framework;
- `TypeScript strict`;
- `Tailwind + RHF + Zod + TanStack Query`;
- `Supabase + PostgreSQL + Drizzle`;
- `LinguiJS` для i18n;
- `Biome` для качества кода;
- `pytest + Playwright` как основной testing strategy;
- без обязательного frontend unit runner на старте.
- `GitHub Actions` для CI/CD;
- `AGENTS.md` как AI-first инженерный стандарт;
- архитектура `modular monolith`, а не микросервисы на старте;
- `Python` как потенциальный отдельный сервис на следующем этапе, а не как обязательный центр системы прямо сейчас.

## 27. Следующий шаг после этого плана

После утверждения этого документа логично сделать три следующих артефакта:

1. `AGENTS.md` - инженерный стандарт проекта для AI и человека.
2. `README.md` - краткий onboarding, стек, команды, расширения, правила старта.
3. `ARCHITECTURE.md` - более строгая техническая схема модулей, слоёв, данных и интеграций.

Этот `PROJECT_PLAN.md` должен стать живым документом и обновляться по мере роста проекта.
