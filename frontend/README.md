# Frontend

`Next.js` frontend platform for `greatest-portfolio`.

## Main commands

From repo root:

```bash
bun run dev
bun run build
bun run check
bun run test:e2e
```

Directly from `frontend/`:

```bash
bun run dev
bun run build
bun run typecheck
bun run check
bun run test:e2e
```

## Stack

- `Next.js 16`
- `TypeScript`
- `Tailwind CSS 4`
- `Biome`
- `Playwright`
- `react-hook-form`
- `Zod`
- `TanStack Query`

## Structure

- `src/app` - routing, layouts, providers
- `src/modules` - domain-oriented frontend modules
- `src/components` - reusable UI blocks
- `src/shared` - shared UI/util/config foundations
- `src/server` - server-only frontend-side helpers
- `src/styles` - global styling foundations
