# AGENTS.md

## Project Intent

`greatest-portfolio` - это personal portfolio platform, которая должна одновременно быть:

- сильным публичным продуктом;
- инженерно зрелым `Next.js + Python` проектом;
- базой для контента, идей, статей и экспериментов;
- AI-friendly кодовой базой с понятными правилами работы.

## Architectural Baseline

- `Next.js` - frontend platform
- `Python` - backend platform
- `Supabase` - managed Postgres/storage/auth infrastructure
- `Playwright` - основной frontend e2e/smoke layer
- `pytest` - основной backend test layer
- frontend unit runner не входит в обязательный baseline стека

## Frontend Rules

- `app/` не должен превращаться в свалку логики;
- route files должны оставаться тонкими;
- использовать доменно-модульную структуру, а не слепой FSD;
- server components по умолчанию, client components только по необходимости;
- UI должен быть выразительным, но production-grade.

## Backend Rules

- Python отвечает за доменную backend-логику и интеграции;
- не дублировать роли `Next.js`;
- auth-инфраструктуру не писать вручную без веской причины;
- модули строить вертикально по доменам.

## Testing Rules

- ключевая пользовательская уверенность идёт через `Playwright`;
- backend correctness идёт через `pytest`;
- frontend unit runner не добавляется в стек без доказанной пользы;
- каждая серьёзная фича должна иметь понятный testing story.

## Agent Workflow

- перед архитектурными и творческими задачами использовать `.agents/skills/brainstorming`;
- при работе по утверждённому плану использовать `.agents/skills/executing-plans`;
- при UI-heavy задачах использовать `.agents/skills/frontend-design`;
- при формах использовать `.agents/skills/react-hook-form`;
- при React/Next performance review использовать `.agents/skills/react-next-best-practices`;
- при локальном упрощении кода использовать `.agents/skills/code-simplifier`.

## Documentation Priority

Перед изменением архитектурного направления сначала обновляются:

1. `PROJECT_PLAN.md`
2. `ARCHITECTURE.md`
3. `STACK_DECISIONS.md`
4. `docs/PROJECT_STRUCTURE.md`, если меняется структура проекта
5. `AGENTS.md`
6. `README.md`, если изменился список ключевых точек входа

Только затем реализация.

## Documentation Rule

Документация в этом проекте считается частью продукта, а не второстепенным артефактом.

Обязательные правила:

- любое изменение архитектурного решения должно сопровождаться обновлением документации;
- устаревшая документация считается дефектом проекта;
- `README.md`, `PROJECT_PLAN.md`, `ARCHITECTURE.md`, `STACK_DECISIONS.md`, `AGENTS.md`, `docs/README.md`, `docs/PROJECT_STRUCTURE.md` должны поддерживаться в актуальном состоянии;
- definition of done для архитектурных и инфраструктурных изменений включает обновление релевантных `.md` файлов.
