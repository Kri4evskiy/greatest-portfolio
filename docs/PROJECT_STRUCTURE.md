# Project Structure

## Purpose

Этот документ фиксирует целевую структуру репозитория до старта реализации.

Он нужен, чтобы:

- не собирать проект хаотично;
- сразу заложить границы между `frontend` и `backend`;
- понимать, куда должна ложиться каждая новая часть системы;
- избежать будущих костылей при росте проекта.

## Top-level structure

```text
greatest-portfolio/
  .agents/
  docs/
  frontend/
  backend/
  infra/
  scripts/
  PROJECT_PLAN.md
  ARCHITECTURE.md
  STACK_DECISIONS.md
  AGENTS.md
  README.md
  LICENSE
```

## Top-level responsibilities

`.agents/`

- локальные AI-oriented skills и правила работы.

`docs/`

- рабочая документация проекта.

`frontend/`

- `Next.js` приложение.

`backend/`

- `Python backend`.

`infra/`

- инфраструктурные конфиги, deployment notes, environment-oriented материалы, docker-related файлы при необходимости.

`scripts/`

- служебные скрипты проекта.

## Frontend structure

Целевая модель для `frontend/`:

```text
frontend/
  src/
  public/
  tests/
  messages/
  content/
  package.json
  tsconfig.json
  next.config.ts
  biome.json
  playwright.config.ts
```

### Frontend folders

`src/`

- основной код frontend-приложения.

`public/`

- статические assets.

`tests/`

- frontend-oriented test infrastructure, если понадобится отдельная организация test assets/helpers.

`messages/`

- ресурсы локализации.

`content/`

- локальный content layer, если часть контента будет жить рядом с frontend.

## Frontend internal structure

Целевая структура внутри `frontend/src/`:

```text
frontend/src/
  app/
  modules/
  components/
  shared/
  server/
  styles/
```

### Frontend layer responsibilities

`app/`

- `Next.js App Router`
- layouts
- providers
- route segments
- metadata wiring
- route-level orchestration

`modules/`

- вертикальные домены frontend-части проекта
- примеры: `home`, `projects`, `articles`, `auth`, `profile`, `contact`

`components/`

- переиспользуемые UI-компоненты и композиционные блоки

`shared/`

- ui-kit
- utils
- config
- constants
- hooks
- api clients
- validation helpers

`server/`

- server-only helpers на стороне frontend-платформы
- adapters
- route-safe integration helpers

`styles/`

- global styles
- theme tokens
- typography and design foundations

## Example frontend domain shape

Пример домена в `frontend/src/modules/projects/`:

```text
frontend/src/modules/projects/
  ui/
  lib/
  api/
  model/
  types/
```

### Meaning

`ui/`

- project-specific UI blocks

`lib/`

- локальные утилиты домена

`api/`

- frontend-side adapters и запросы к backend

`model/`

- доменные client-side mappers, selectors, helpers

`types/`

- типы домена

## Backend structure

Целевая модель для `backend/`:

```text
backend/
  app/
  tests/
  migrations/
  pyproject.toml
  README.md
```

## Backend internal structure

```text
backend/app/
  core/
  modules/
  integrations/
  workers/
  main.py
```

### Backend layer responsibilities

`core/`

- config
- settings
- security helpers
- shared backend foundations
- common error handling

`modules/`

- вертикальные backend-домены
- примеры: `auth`, `users`, `profiles`, `projects`, `articles`, `contacts`, `notifications`

`integrations/`

- email provider
- Supabase-facing infra adapters where needed
- external APIs
- storage-related adapters

`workers/`

- background jobs
- async workflows
- automation or AI-related jobs later

`main.py`

- backend entrypoint

## Example backend module shape

```text
backend/app/modules/projects/
  router.py
  service.py
  repository.py
  schemas.py
  models.py
```

### Meaning

`router.py`

- API endpoints

`service.py`

- бизнес-логика домена

`repository.py`

- data access

`schemas.py`

- request/response schemas

`models.py`

- domain/data representations

## Infra structure

`infra/` пока не должен быть перегружен, но целевой смысл такой:

```text
infra/
  ci/
  deploy/
  env/
  docker/
```

### Meaning

`ci/`

- pipeline notes or helper configs

`deploy/`

- deployment docs and scripts

`env/`

- environment documentation and templates

`docker/`

- container-related files, если реально понадобятся

## What should not happen

Не должно быть такого:

- frontend и backend логика свалены в одну папку;
- route files содержат всю бизнес-логику;
- интеграции размазаны без явных границ;
- shared превращается в мусорную корзину;
- docs отстают от реальной структуры.

## Final principle

Сначала структура должна помогать мыслить о системе правильно.

Только после этого она должна помогать писать код быстро.
