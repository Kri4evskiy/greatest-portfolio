# Contributing Guide

Thank you for your interest in contributing to the **Engineer Workfolio & Living Knowledge Base** monorepo! This project is maintained with strict engineering standards, high type safety, and automated quality gates.

---

## 🧭 Monorepo Architecture Overview

This repository uses **pnpm workspaces** and **Turborepo**:

- **`apps/web`:** Next.js 16 App Router, React 19, Tailwind CSS v4, dynamic MDX knowledge base.
- **`apps/api`:** NestJS 12 HTTP & SSE API, Prisma ORM, JWT authentication.
- **`apps/telemetry-ms`:** NestJS Microservice isolated over TCP (`:4001`) for real-time telemetry.
- **`packages/shared-schemas`:** Source-of-truth Zod v4 schemas and TypeScript contracts.
- **`packages/ui`:** Shared UI component library and Radix UI primitives.

All workspace packages are linked automatically. **Do NOT run `cd` into subdirectories to install dependencies.**

---

## 🛠️ Prerequisites & Setup

1. **Node.js:** `>= 22.0.0`
2. **pnpm:** `>= 12.x` (enable via `corepack enable` or install via `npm i -g pnpm@latest`)

```bash
# 1. Clone repository
git clone https://github.com/Kri4evskiy/greatest-portfolio.git
cd greatest-portfolio

# 2. Install workspace dependencies
pnpm install

# 3. Create local environment
cp .env.example .env

# 4. Start all apps concurrently in dev mode
pnpm run dev
```

---

## 📐 Development Workflow

### 1. Branching Strategy

Create a feature branch from `main`:
```bash
git checkout -b feat/your-feature-name
# or fix/your-bugfix-name
# or docs/your-article-name
```

### 2. Code Quality & Tooling Rules

Our project enforces strict, zero-overhead tooling:
- **Linter & Formatter:** Exclusively **Biome.js** (never install or run ESLint or Prettier).
- **TypeScript:** Strict mode enabled (`strict: true`, `noUncheckedIndexedAccess: true`). Never use `any` or `@ts-ignore`.
- **Pre-commit Hooks:** Configured via **Lefthook** (`lefthook.yml`) to automatically check staged files before committing.

### 3. Local Verification Commands

Before submitting a PR, verify all Quality Gates pass locally:
```bash
# Check formatting and lint rules across all files
pnpm run lint

# Auto-fix formatting and safe lint diagnostics
pnpm run lint:fix

# Run TypeScript typecheck across all 5 workspace packages via Turborepo
pnpm run typecheck

# Full production build
pnpm run build
```

---

## 📝 Commit Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat(web): add D3 graph node filtering`
- `fix(api): correct SSE keep-alive interval`
- `docs(kb): add article on Edge Web Crypto JWT proxy`
- `refactor(schemas): migrate telemetry event to Zod v4`
- `chore(ci): update GitHub Actions setup`

---

## 🔍 Pull Request Process

1. **Keep PRs Focused:** Address a single feature, bugfix, or article per PR.
2. **Sync Architecture Docs:** If your changes affect APIs, schemas, or security boundaries, make sure to update:
   - Corresponding `.mdx` articles in `apps/web/content/`
   - Architecture diagrams or tables in [`README.md`](./README.md)
3. **CI Pipeline:** Ensure all GitHub Actions jobs pass (`lint`, `typecheck`, `build`, `security`).
