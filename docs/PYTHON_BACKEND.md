# Python Backend Guide

## Purpose

Этот документ фиксирует, что читать по backend-стеку проекта и в каком порядке это лучше делать.

## Reading order

1. `FastAPI`
2. `Pydantic Settings`
3. `SQLAlchemy 2`
4. `Alembic`
5. `pytest`
6. `HTTPX` и `FastAPI TestClient`

## What to read

### 1. FastAPI

Начать отсюда:

- `https://fastapi.tiangolo.com/tutorial/`
- `https://fastapi.tiangolo.com/advanced/`

Что важно изучить:

- routing;
- request/response models;
- dependency injection;
- error handling;
- project structure;
- testing basics.

### 2. Pydantic Settings

- `https://docs.pydantic.dev/latest/concepts/pydantic_settings/`

Что важно:

- env-driven config;
- settings model;
- локальная и production-конфигурация.

### 3. SQLAlchemy 2

- `https://docs.sqlalchemy.org/en/20/tutorial/`
- `https://docs.sqlalchemy.org/en/20/orm/quickstart.html`

Что важно:

- engine;
- session;
- ORM models;
- relationships;
- select/update patterns;
- async vs sync strategy.

### 4. Alembic

- `https://alembic.sqlalchemy.org/en/latest/tutorial.html`

Что важно:

- revision workflow;
- upgrade/downgrade;
- migration discipline;
- naming conventions.

### 5. pytest

- `https://docs.pytest.org/en/stable/getting-started.html`
- `https://docs.pytest.org/en/stable/explanation/goodpractices.html`

Что важно:

- test discovery;
- fixtures;
- parametrization;
- assertion style;
- test organization.

### 6. HTTPX / TestClient

- `https://www.python-httpx.org/`
- `https://fastapi.tiangolo.com/tutorial/testing/`

Что важно:

- API testing;
- integration-like tests;
- request lifecycle basics.

## Local commands target

### From repo root

```bash
npm run dev
npm run check
npm run test
```

Это поднимает или проверяет проект через root-level orchestration.

### Backend setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\python -m pip install -e .[dev]
```

### Run backend

```bash
cd backend
.venv\Scripts\python -m uvicorn app.main:app --reload
```

### Run tests

```bash
cd backend
.venv\Scripts\python -m pytest
```

## Project-specific note

В этом проекте backend нужно мыслить так:

- `FastAPI` - API and service layer;
- `SQLAlchemy 2` - data access layer;
- `Alembic` - schema evolution;
- `pytest` - correctness verification.
