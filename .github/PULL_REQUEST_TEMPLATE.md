## 📌 Description

<!-- Brief summary of what changes this Pull Request introduces and why. -->

## 📦 Workspaces Affected

<!-- Check all packages modified in this PR: -->
- [ ] `apps/web` (Next.js 16 App Router)
- [ ] `apps/api` (NestJS 12 HTTP & SSE API)
- [ ] `apps/telemetry-ms` (TCP Telemetry Microservice)
- [ ] `packages/shared-schemas` (Zod v4 contracts & DTOs)
- [ ] `packages/ui` (Design system & UI primitives)
- [ ] Root / Tooling / CI/CD (`.github`, `turbo.json`, `biome.json`)

## 🛠️ Type of Change

- [ ] `feat`: New feature or capability
- [ ] `fix`: Bug fix
- [ ] `docs`: Documentation or MDX Knowledge Base update
- [ ] `refactor`: Code refactoring without behavior changes
- [ ] `perf`: Performance optimization
- [ ] `chore`: Tooling, dependencies, or maintenance

## 🧪 Quality Gates Checklist

- [ ] Formatted and linted: `pnpm run lint` passes (0 Biome errors)
- [ ] Type-safe: `pnpm run typecheck` passes (strict TypeScript across all 5 packages)
- [ ] Build verified: `pnpm run build` succeeds locally
- [ ] Architecture sync: If schemas or architecture changed, updated corresponding `.mdx` articles in `apps/web/content/` and `README.md`
