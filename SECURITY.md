# Security Policy

## 🛡️ Architecture & Security Model

This repository implements a multi-tier, zero-trust security architecture designed for high integrity and minimal attack surface across the monorepo:

### 1. Edge Security & Authentication Boundary

- **Fail-Closed Edge Proxy (`apps/web/src/proxy.ts` + `edge-jwt.ts`):** Protected Knowledge Base domain sections (everything under `/knowledge-base/*` except the public hub and `/knowledge-base/this-project/*`) are guarded at the Edge runtime using native **Web Crypto API** (`HMAC-SHA256`), validating `alg === 'HS256'`, `sub`, `role` (`USER | ADMIN`), `exp`, and `nbf`. In strict production (`NODE_ENV=production` without `WORKFOLIO_DEMO_MODE=true`), `resolveEdgeJwtSecretStrict` fails closed if `JWT_SECRET` is missing, `< 32` chars, or equal to the dev default. Static exclusions in `matcher` use an explicit extension allowlist rather than blanket `.*\\..*`.
- **XSS-Resistant Tokens & Offline Cache Isolation:** JWT access tokens (`1d` TTL) are stored strictly in `HttpOnly`, `Secure`, `SameSite=Lax` cookies (`kb_access_token`). The IndexedDB persister (`QueryProvider`) enforces a strict `shouldDehydrateQuery` allowlist (`['knowledge']` only), ensuring `['auth', 'me']` and live telemetry are never persisted across cold starts.

### 2. HTTP Security Headers & Web Hardening (`apps/web`)

- **Strict CSP ([`security-headers.config.ts`](./apps/web/config/security-headers.config.ts)):** Custom Content-Security-Policy isolating scripts, styles, fonts (`font-src 'self' data:` with zero external font CDNs thanks to build-time self-hosted `next/font/google` `.woff2` assets), and images (`'unsafe-eval'` stripped in production; `connect-src` restricted strictly to `'self'` plus validated `NEXT_PUBLIC_API_URL` / PostHog / Sentry origins with no blanket `https:` wildcard; `object-src 'self'` and `frame-src 'self'` restricted strictly to same-origin while `frame-ancestors 'none'` blocks framing on all routes except `/cv/:path+` static PDFs).
- **Stealth & Isolation:** `poweredByHeader: false` in `next.config.ts` strips `X-Powered-By: Next.js`; `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Resource-Policy: same-origin` isolate browsing and resource contexts.
- **Clickjacking & MIME Defense:** Hardened globally with `X-Frame-Options: DENY`, `frame-ancestors 'none'`, and `X-Content-Type-Options: nosniff` (with `SAMEORIGIN` / `frame-ancestors 'self'` scoped exclusively to `/cv/:path+` PDF assets so only internal CV PDFs can ever be embedded inside `<object>`).
- **HSTS:** Strict-Transport-Security enforced in production with `max-age=63072000; includeSubDomains; preload` (2 years).
- **Permissions-Policy:** Explicitly disabling `camera`, `microphone`, `geolocation`, and `browsing-topics`.

### 3. API Gateway Hardening, CSRF & Rate Limiting (`apps/api`)

- **Helmet & JSON-Only CSRF Defense:** Configured with strict `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'` on JSON API responses, `crossOriginResourcePolicy: { policy: 'cross-origin' }` for explicit cross-domain CORS (`WEB_ORIGIN`), configurable `TRUST_PROXY_HOPS` (`0..5`, default `1`), disabled `application/x-www-form-urlencoded` body parser, and `CsrfOriginMiddleware` validating `Content-Type: application/json`, `Origin`, and `Sec-Fetch-Site` on all mutating routes.
- **Brute-Force & SSE DoS Protection (`@nestjs/throttler`):** Global Free-Tier quota of `60 req/min` per IP; `/api/auth/guest-pass` and `/api/auth/login` share a single `5 req/min` per-IP bucket; `HS256` JWT TTL is bounded to `1d` with explicit `algorithms: ['HS256']` pinning and Zod claim validation; wrong non-empty `adminPasscode` fails closed with `403 Forbidden`. `GET /api/telemetry/stream` enforces `5 handshakes/min` per IP, max `2` concurrent streams/IP, max `50` global streams, and a `15-minute` max stream lifetime.

### 4. Zero-Trust Backend & Microservice Isolation

- **Private Docker Network & Loopback Defaults:** `apps/telemetry-ms` defaults to `127.0.0.1:4001` locally (overridden to `0.0.0.0` only inside Docker's isolated `backend-network`) with zero host ports published. All `docker-compose.prod.yml` containers enforce `no-new-privileges:true`, `cap_drop: [ALL]`, `pids_limit: 256`, `read_only: true` + `tmpfs` (for Node services), and Docker `healthcheck`s.
- **Reviewer Demo vs. Strict Production Compose Split:**
  - `docker-compose.yml` enables `WORKFOLIO_DEMO_MODE=true` across both `api` and `web` (falling back via `resolveJwtSecret()` to the shared `DEFAULT_DEV_JWT_SECRET` in `@repo/shared-schemas` when `.env` is absent), binds all local ports strictly to `127.0.0.1` (parameterizable via `*_HOST_PORT`), and uses HTTP-compatible cookie flags (`Secure: false` on `localhost`) for zero-friction evaluation without an `.env` file.
  - `docker-compose.prod.yml` omits `WORKFOLIO_DEMO_MODE`, enforces mandatory non-default `JWT_SECRET` (`>= 32` chars), `ADMIN_SECRET_PASSCODE` (`>= 16` chars), and `POSTGRES_PASSWORD` at both Compose parse time (`${VAR:?}`) and NestJS startup (`loadAppConfig`), sets `Secure: true` on `HttpOnly` cookies, and unpublishes PostgreSQL port `5432` from the host.
- **Controlled Ingress & Anonymized Telemetry:** All external HTTP and SSE traffic enters through the public gateway (`apps/web` rewrites or `apps/api`), preventing direct probing of internal microservices. Public SSE telemetry (`GET /api/telemetry/stream`) strips personal `actorName` values and internal privilege roles (`ADMIN`).

### 5. Contract Validation & Input Sanitization

- **Runtime Validation:** All API inputs and cross-service telemetry payloads are strictly validated against **Zod v4 schemas** ([`@repo/shared-schemas`](./packages/shared-schemas/src/)). Invalid payloads are rejected before business logic execution.
- **Database Safety:** All PostgreSQL interactions are mediated through **Prisma 7 ORM** (`@prisma/adapter-pg` + `pg` parameterized queries), eliminating SQL injection vectors while running Rust-free in Native ESM without external native query engine binaries.

### 6. Supply Chain & Build Security

- **Strict Dependency Isolation:** Powered by **pnpm 12** and [`pnpm-workspace.yaml`](./pnpm-workspace.yaml). Unapproved native package build scripts are blocked via strict `allowBuilds` allowlisting.
- **Zero Secrets Commitment:** No API keys, database credentials, or real secret keys are committed to the repository. Both `.gitignore` and `.dockerignore` block `.env` and all `.env.*` variants (including `.env.prod`, allowing only `.env.example`).
- **Automated Security Gates:** Every push and pull request enforces `persist-credentials: false` on `actions/checkout@v6`, runs `actionlint` + `Biome noImportCycles` in `lint`, runs isolated `docker compose config --quiet` + `pnpm audit --prod --audit-level=high` (`security` job with zero `node_modules` installed, plus a weekly scheduled `.github/workflows/security-audit.yml` and `.github/dependabot.yml` for `npm` + `github-actions`), and executes `Vitest` security regression suites (`edge-jwt`, `jwt-roles.guard`, `request-id.util`, `app.config`, `telemetry-ms.config`).

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
