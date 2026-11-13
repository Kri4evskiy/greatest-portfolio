# GitHub Copilot & Coding Agent Instructions

You are a Senior Full-Stack AI Engineer working on the **Engineer Workfolio & Living Knowledge Base** monorepo.

## 🧭 Monorepo Architecture Overview

This monorepo is powered by **pnpm workspaces** (`pnpm@12.x`) and **Turborepo** (`turbo@2.x`):

- **`apps/web`:** Next.js 16 (App Router), React 19, Tailwind CSS v4, multi-slug MDX knowledge base, Edge Proxy.
- **`apps/api`:** NestJS 12 HTTP & SSE API, Prisma ORM, JWT authentication.
- **`apps/telemetry-ms`:** Standalone NestJS Microservice isolated over TCP (`:4001`) for real-time telemetry events.
- **`packages/shared-schemas`:** Source-of-truth Zod v4 schemas, shared DTOs, and TypeScript contracts across web, api, and telemetry.
- **`packages/ui`:** Shared UI component library built with Tailwind CSS and Radix UI primitives.

All packages are linked automatically. **Never suggest running `cd` into nested directories to install packages or build.**

---

## 🚫 Critical Constraints (Never Violate)

1. **Strict Biome Linter & Formatter:**
   - **Never install ESLint or Prettier.** The repository exclusively uses **Biome.js**.
   - Check with `pnpm run lint`, auto-fix with `pnpm run lint:fix`.

2. **Strict TypeScript:**
   - TypeScript is configured in strict mode (`strict: true`, `noUncheckedIndexedAccess: true`).
   - **Never use `any` or `@ts-ignore` / `@ts-expect-error`** without explicit architectural justification. Prefer narrow types, discriminated unions, and Zod inference (`z.infer<typeof Schema>`).

3. **Authentication & Token Storage:**
   - JWT access tokens (`kb_access_token`) must be stored strictly in **`HttpOnly, Secure, SameSite=Lax` cookies**.
   - **Never store access tokens in `localStorage` or expose them to client JavaScript.**
   - Edge authentication in `apps/web/src/proxy.ts` must use the native **Web Crypto API** (`crypto.subtle`) for zero-runtime HMAC-SHA256 verification. Never import Node.js native crypto in Edge proxy.

4. **Zero-Trust Microservice Network Isolation:**
   - `apps/telemetry-ms` is isolated on the internal Docker `backend-network` on TCP `:4001`.
   - **Never expose external host ports for `telemetry-ms`.**
   - The public EventSource/SSE endpoint is hosted by `apps/api` (`@Sse('stream')`), which bridges the internal TCP events to the client.

5. **Supply Chain & pnpm 12:**
   - In `pnpm 12+`, never add `"onlyBuiltDependencies"` or `"pnpm"` configuration to `package.json`.
   - All workspace configuration and approved native build dependencies reside strictly in `pnpm-workspace.yaml` under `allowBuilds`.

---

## 🛠️ Verification & Quality Commands

When suggesting or executing commands, always use the root workspace scripts:

- **Lint check:** `pnpm run lint`
- **Lint fix:** `pnpm run lint:fix`
- **Typecheck:** `pnpm run typecheck` (Turborepo typecheck across all 5 packages)
- **Development:** `pnpm run dev`
- **Production Build:** `pnpm run build`
