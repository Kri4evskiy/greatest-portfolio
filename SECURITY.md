# Security Policy

## 🛡️ Architecture & Security Model

This repository implements a multi-tier, zero-trust security architecture designed for high integrity and minimal attack surface across the monorepo:

### 1. Edge Security & Authentication Boundary

- **Edge Proxy (`apps/web/src/proxy.ts`):** Protected routes (e.g., Knowledge Base articles) are guarded at the Edge runtime using native **Web Crypto API** (`HMAC-SHA256`). Token validation occurs before rendering or executing server components.
- **XSS-Resistant Tokens:** JWT access tokens are stored strictly in `HttpOnly`, `Secure`, `SameSite=Lax` cookies (`kb_access_token`). They are inaccessible via client-side JavaScript (`document.cookie` / `localStorage`).

### 2. HTTP Security Headers & Web Hardening (`apps/web`)

- **Strict CSP ([`security-headers.config.ts`](./apps/web/config/security-headers.config.ts)):** Custom Content-Security-Policy isolating scripts, styles, fonts (`font-src 'self' data:` with zero external font CDNs thanks to build-time self-hosted `next/font/google` `.woff2` assets), and images (`'unsafe-eval'` stripped in production; internal ports omitted in production `connect-src`; `object-src 'self'` and `frame-src 'self'` restricted strictly to same-origin while `frame-ancestors 'none'` blocks framing on all routes except `/cv/:path+` static PDFs) while supporting `next-themes` and static allowlisted `PALETTE_INIT_SCRIPT` theme hydration, SPA `<Link href="/cv">` transitions, and Server-Sent Events.
- **Stealth & Isolation:** `poweredByHeader: false` in `next.config.ts` strips `X-Powered-By: Next.js`; `Cross-Origin-Opener-Policy: same-origin` isolates browsing contexts.
- **Clickjacking & MIME Defense:** Hardened globally with `X-Frame-Options: DENY`, `frame-ancestors 'none'`, and `X-Content-Type-Options: nosniff` (with `SAMEORIGIN` / `frame-ancestors 'self'` scoped exclusively to `/cv/:path+` PDF assets so only internal CV PDFs can ever be embedded inside `<object>`).
- **HSTS:** Strict-Transport-Security enforced in production with `max-age=63072000; includeSubDomains; preload` (2 years).
- **Permissions-Policy:** Explicitly disabling `camera`, `microphone`, `geolocation`, and `browsing-topics`.

### 3. API Gateway Hardening & Rate Limiting (`apps/api`)

- **Helmet Integration:** Configured with `crossOriginResourcePolicy: { policy: 'cross-origin' }` to allow seamless SSE telemetry streams without compromising HTTP protection, alongside `trust proxy` (1 hop) and environment-strict CORS (`WEB_ORIGIN`).
- **Brute-Force Protection (`@nestjs/throttler`):** Sliding window rate limiting protecting authentication endpoints (`POST /api/auth/guest-pass`, `POST /api/auth/login`) with a max quota of 5 requests per minute per IP. Only `@Sse('stream')` is exempt via `@SkipThrottle()`, keeping `GET /api/telemetry/stats` protected by the global quota.

### 4. Zero-Trust Backend & Microservice Isolation

- **Private Docker Network:** The `apps/telemetry-ms` microservice runs within an isolated internal Docker bridge (`backend-network`) communicating exclusively over TCP (`:4001`). No host ports are exposed to the public internet.
- **Reviewer Demo vs. Strict Production Compose Split:**
  - `docker-compose.yml` enables `WORKFOLIO_DEMO_MODE=true` (falling back via `resolveJwtSecret()` to the shared `DEFAULT_DEV_JWT_SECRET` in `@repo/shared-schemas` when `.env` is absent) and HTTP-compatible cookie flags (`Secure: false` on `localhost`) for zero-friction evaluation without an `.env` file.
  - `docker-compose.prod.yml` omits `WORKFOLIO_DEMO_MODE`, enforces mandatory non-default `JWT_SECRET` (`>= 32` chars), `ADMIN_SECRET_PASSCODE`, and `POSTGRES_PASSWORD` at both Compose parse time (`${VAR:?}`) and NestJS startup (`loadAppConfig`), sets `Secure: true` on `HttpOnly` cookies, and unpublishes PostgreSQL port `5432` from the host.
- **Controlled Ingress & Anonymized Telemetry:** All external HTTP and SSE traffic enters through the public gateway (`apps/web` rewrites or `apps/api`), preventing direct probing of internal microservices. Public SSE telemetry (`GET /api/telemetry/stream`) strips personal `actorName` values and internal privilege roles (`ADMIN`).

### 5. Contract Validation & Input Sanitization

- **Runtime Validation:** All API inputs and cross-service telemetry payloads are strictly validated against **Zod v4 schemas** ([`@repo/shared-schemas`](./packages/shared-schemas/src/)). Invalid payloads are rejected before business logic execution.
- **Database Safety:** All PostgreSQL interactions are mediated through **Prisma 7 ORM** (`@prisma/adapter-pg` + `pg` parameterized queries), eliminating SQL injection vectors while running Rust-free in Native ESM without external native query engine binaries.

### 6. Supply Chain & Build Security

- **Strict Dependency Isolation:** Powered by **pnpm 12** and [`pnpm-workspace.yaml`](./pnpm-workspace.yaml). Unapproved native package build scripts are blocked via strict `allowBuilds` allowlisting.
- **Zero Secrets Commitment:** No API keys, database credentials, or real secret keys are committed to the repository. Both `.gitignore` and `.dockerignore` block `.env` and all `.env.*` variants (including `.env.prod`, allowing only `.env.example`).
- **Automated Security Gates:** Every push and pull request enforces `persist-credentials: false` on `actions/checkout@v6`, runs isolated `docker compose config --quiet` + `pnpm audit --prod --audit-level=high` (`security` job with zero `node_modules` installed), and executes `Vitest` security regression suites (`edge-jwt`, `jwt-roles.guard`, `request-id.util`, `app.config`).

---

## 🔒 Supported Versions

Only the latest `main` branch is actively supported with security patches:

| Component                 | Version / Target                 | Supported |
| :------------------------ | :------------------------------- | :-------- |
| `apps/web`                | Next.js 16 (React 19)            | ✅ Yes    |
| `apps/api`                | NestJS 12, Prisma 7 (`7.10.1`)   | ✅ Yes    |
| `apps/telemetry-ms`       | NestJS Microservices (TCP)       | ✅ Yes    |
| `packages/shared-schemas` | Zod v4 (`^4.6.7`)                | ✅ Yes    |
| Toolchain                 | TypeScript 7 (`^7.0.2`), pnpm 12 | ✅ Yes    |

---

## 🚨 Reporting a Vulnerability

If you discover a potential security vulnerability in this project, please **do not open a public issue**. Instead, follow responsible disclosure:

1. **GitHub Security Advisory:** Navigate to the **Security** tab of this repository and click [Report a vulnerability](https://github.com/Kri4evskiy/greatest-portfolio/security/advisories/new).
2. **Direct Contact:** Alternatively, reach out directly to the maintainer via GitHub profile [@Kri4evskiy](https://github.com/Kri4evskiy).

Please include:
- A clear description of the vulnerability and potential impact.
- Steps to reproduce or proof-of-concept (PoC).
- Suggested remediation, if available.

Reports are typically acknowledged within **48 hours**, and verified issues will be remediated in a dedicated security patch.
