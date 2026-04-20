# greatest-portfolio

Engineering-first portfolio platform.

## What this repo is becoming

- `Next.js` frontend platform
- `Python` backend platform
- `Supabase` + `PostgreSQL`
- `Bun` for JS/TS package management and script execution
- `TypeScript 6` on the frontend
- AI-first workflow with local agent docs

## Main commands

```bash
bun install
bun run dev
bun run build
bun run check
bun run test
bun run format
```

`bun run dev` запускает `frontend` и `backend` вместе из корня репозитория.

Git workflow quality gates:

- `pre-commit` запускает быстрый staged-only `Biome` autofix для frontend-файлов
- `pre-push` запускает `bun run check`

Repository workflow model:

- корень репозитория оркестрирует общий workflow
- `frontend/` владеет JS/TS quality tooling, включая `Biome` и `lint-staged`
- `backend/` живёт отдельно как Python application layer

Endpoints during local development:

- frontend: `http://localhost:3000`
- backend: `http://127.0.0.1:8000`

## Core docs

- `PROJECT_PLAN.md`
- `ARCHITECTURE.md`
- `STACK_DECISIONS.md`
- `AGENTS.md`
- `docs/README.md`
- `docs/PROJECT_STRUCTURE.md`
- `docs/PYTHON_BACKEND.md`

## Documentation rule

Документация обязательна к актуализации.

Если меняется архитектура, стек, структура проекта или базовые правила работы, нужно обновлять релевантные `.md` файлы.

`README.md` должен оставаться коротким и служить входной точкой. Детали должны жить в документах внутри `docs/` и в профильных root-level спецификациях.
