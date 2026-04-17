# Architecture

## 1. Architectural decision

Целевая архитектура проекта:

- `Next.js` - основной frontend framework и web platform;
- `Python backend` - основной backend layer;
- `Supabase` - managed `PostgreSQL` + storage + optional auth infrastructure;
- `domain-oriented modular frontend` - основной способ организации frontend-кода;
- `modular backend` - основной способ организации Python-кода.

Ключевая идея:

- не строить тяжёлый микросервисный зоопарк;
- не складывать всё в один хаотичный монолит;
- строить модульную систему с чёткими границами и возможностью эволюции.

## 2. Why this architecture

Эта схема оптимальна для проекта, потому что она одновременно покрывает:

- SEO и контентную силу `Next.js`;
- инженерную ценность backend-разработки на `Python`;
- надёжную data-layer базу через `PostgreSQL`;
- быструю инфраструктурную сборку через `Supabase`;
- хорошую масштабируемость без преждевременных микросервисов.

## 3. System context

Высокоуровневая модель выглядит так:

```text
Browser
  -> Next.js app
      -> Python API
          -> PostgreSQL (Supabase)
          -> Storage (Supabase)
          -> Email provider
          -> Optional external integrations
```

Дополнительно:

```text
Playwright -> end-to-end checks against deployed app
pytest -> backend unit/integration/API tests
GitHub Actions -> CI/CD pipelines
```

## 4. Responsibility split

### Next.js

Отвечает за:

- публичные страницы;
- SEO;
- i18n;
- page composition;
- presentation layer;
- route-level orchestration;
- частично server-side rendering concerns.

Не должен превращаться в:

- главный слой доменной backend-логики;
- второй backend параллельно Python;
- место, где живут все интеграции без границ.

### Python backend

Отвечает за:

- доменную бизнес-логику;
- backend API;
- интеграции;
- отправку писем;
- background jobs;
- административные операции;
- domain orchestration;
- потенциальные AI/data workflows.

### Supabase

Отвечает за:

- `PostgreSQL`;
- storage;
- auth infrastructure при выбранной модели;
- platform capabilities around database.

## 5. Next.js vs Vite

Финальное решение: `Next.js`.

### Почему не Vite как основа приложения

- проект не является просто SPA;
- у проекта выраженная контентная природа;
- нужен сильный SEO-baseline;
- нужны server capabilities;
- нужны перспективы SSR/SSG/streaming и хорошая интеграция с routing.

### Где остаётся Vite

- в базовой архитектуре нигде не остаётся.

Итог:

- `Next.js` - app platform;
- `pytest` - основной test tooling для backend;
- не смешивать эти роли.

## 6. Python backend model

Рекомендуемый фреймворк-кандидат:

- `FastAPI`

Почему:

- современный DX;
- сильная работа с typing и schema-driven API;
- хорошая связка с `Pydantic`;
- подходит для API-first и сервисного слоя;
- хорош для асинхронных и интеграционных задач.

Альтернативы:

- `Django` - если понадобится очень много встроенных батареек;
- `Litestar` - если захочется более niche modern approach;
- `Flask` - только если нужен ультраминимализм.

Базовая рекомендация: `FastAPI`.

## 7. Database strategy

Основной путь:

- `Supabase Postgres` как primary DB;
- schema design проектируется под домены;
- миграции должны быть дисциплинированными;
- auth-пользователь и доменные сущности разделяются концептуально.

Потенциальные домены БД:

- users;
- profiles;
- roles/permissions;
- projects;
- articles;
- tags;
- locales/translations;
- media;
- contact requests;
- notifications;
- audit fields.

## 8. Auth strategy

Рекомендуемая стартовая модель:

- identity layer: `Supabase Auth`;
- domain authorization: на уровне Python backend и доменной модели;
- profile/domain data: в собственных таблицах Postgres.

### Why this is better

- не нужно вручную писать всю auth-инфраструктуру;
- снижается security-риск;
- Python при этом остаётся центральным backend-слоем;
- Next.js не превращается в auth-server.

### Alternative

Полностью кастомный auth на Python возможен, но не рекомендуется для старта, потому что:

- дороже по времени;
- выше риск ошибок;
- не даёт реального выигрыша для первой версии.

## 9. Email strategy

Нужно разделять два класса писем.

### Auth emails

- registration confirmation;
- password reset;
- magic link.

Если auth идёт через `Supabase Auth`, эти письма логично оставить там.

### Product emails

- contact form;
- notifications;
- digest/newsletter;
- internal workflow emails.

Их должен отправлять `Python backend` через внешний provider.

Рекомендуемые провайдеры:

- `Resend`;
- `Postmark`;
- `Mailgun`.

## 10. Frontend architecture

Для этого проекта лучше подходит не строгий `FSD`, а лёгкая доменно-модульная структура.

### Почему не FSD

- у `Next.js App Router` уже есть сильная техническая структура;
- для контентного портфолио FSD может дать больше ритуалов, чем пользы;
- проекту нужна не архитектурная идеология ради идеологии, а ясность и эволюционность.

### Main rule

- `app/` отвечает за маршруты и app wiring;
- бизнес-структура живёт вне `app/` в доменных модулях;
- логика не размазывается по route files.

### Recommended structure

```text
src/
  app/
  modules/
  components/
  shared/
```

### Layer responsibilities

`app/`

- providers;
- layouts;
- route groups;
- route-level loading/error/not-found files;
- metadata wiring.

`modules/`

- вертикальные домены и их локальная логика.

`components/`

- переиспользуемые UI-компоненты и композиции.

`shared/`

- ui-kit;
- utilities;
- config;
- api clients;
- hooks;
- constants.

## 11. Backend architecture in Python

Для backend лучше использовать модульную вертикальную организацию.

### Recommended structure

```text
backend/
  app/
    core/
    modules/
      auth/
      users/
      profiles/
      projects/
      articles/
      contacts/
      notifications/
    integrations/
    workers/
    main.py
```

### Module internals

Каждый модуль по возможности содержит:

- `router`;
- `service`;
- `schemas`;
- `repository`;
- `models`;
- `tasks`, если нужны фоновые операции.

Это не FSD буквально, но близко по принципу:

- вертикальные домены;
- ясные зависимости;
- минимум cross-module хаоса.

## 12. API contract strategy

Так как система двуслойная (`Next.js` + `Python API`), контракты критичны.

Нужно заранее зафиксировать:

- versioning policy;
- error format;
- auth strategy;
- pagination policy;
- filtering/sorting conventions;
- locale-aware endpoints, если понадобятся;
- DTO discipline.

Рекомендация:

- schemas-first подход;
- единый стиль API response envelopes только если это реально нужно;
- без избыточной абстракции в первой версии.

## 13. Content architecture

Контентная модель проекта гибридная.

### Recommended approach

- структурированные сущности в БД;
- long-form content может храниться в `MDX` или позже в editor-backed storage;
- локализация должна быть продумана с самого начала.

### Core content domains

- projects;
- articles;
- notes;
- ideas;
- drafts;
- tags;
- localized variants.

## 14. Storybook

`Storybook` не обязателен в Day 1, но должен считаться архитектурно совместимым.

Правило:

- строить `shared/ui`, `components` и `modules` так, чтобы Storybook можно было добавить без переделки архитектуры.

Лучшее время подключения:

- после появления первых стабильных UI primitives и повторно используемых компонентов.

## 15. Testing architecture

### Frontend tests

- `Playwright` как главный user-journey и regression слой;
- отдельный frontend unit runner не входит в стартовый baseline.

### E2E

- `Playwright`;
- focus на ключевые user journeys.

### Backend testing

Для Python backend стоит отдельно заложить:

- `pytest`;
- unit tests;
- integration tests;
- API tests.

Инструмент можно выбрать позже, но архитектурно это обязательно.

## 16. CI/CD architecture

Минимальная схема:

- PR quality checks;
- build verification;
- frontend tests;
- backend tests;
- e2e smoke;
- preview deployment;
- production deployment.

## 17. What not to do

Не стоит:

- делать `Vite` и `Next.js` одновременно как конкурирующие основы приложения;
- писать auth полностью вручную без необходимости;
- дробить проект на микросервисы слишком рано;
- хранить всю логику прямо в route files;
- тащить Storybook раньше, чем появится UI-system;
- смешивать инфраструктуру, domain logic и presentation без границ.

## 18. Final recommendation

Если зафиксировать архитектуру одной строкой:

`Next.js frontend + Python backend + Supabase Postgres + domain-oriented modular frontend + modular architecture everywhere`

## 19. Documentation maintenance

Документация в этом проекте обязательна к сопровождению.

Это означает:

- архитектурные изменения должны сразу отражаться в документах;
- стековые решения должны фиксироваться в отдельном decision log;
- устаревшая документация считается дефектом, а не мелочью;
- реализация не считается завершённой без обновления релевантных `.md` файлов.

Это самый сильный и современный старт для данного проекта с учётом:

- портфолио-природы проекта;
- желания выглядеть сильно как инженерно, так и визуально;
- реальной долгосрочной перспективы;
- цели подтянуть `Python` без разрушения общей архитектуры.
