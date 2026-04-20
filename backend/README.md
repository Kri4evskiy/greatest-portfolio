# Backend

`FastAPI`-ориентированный backend для `greatest-portfolio`.

## Planned stack

- `FastAPI`
- `SQLAlchemy 2`
- `Alembic`
- `pytest`
- `Supabase Postgres`

## Local setup target

```bash
python -m venv .venv
.venv\Scripts\python -m pip install -e .[dev]
```

## Run target

```bash
.venv\Scripts\python -m uvicorn app.main:app --reload
```

## Test target

```bash
.venv\Scripts\python -m pytest
```
