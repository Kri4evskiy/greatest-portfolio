# Security Policy

## 🛡️ Architecture & Security Model

This repository implements a multi-tier, zero-trust security architecture designed for high integrity and minimal attack surface across the monorepo:

### 1. Edge Security & Authentication Boundary

- **Edge Proxy (`apps/web/src/proxy.ts`):** Protected routes (e.g., Knowledge Base articles) are guarded at the Edge runtime using native **Web Crypto API** (`HMAC-SHA256`). Token validation occurs before rendering or executing server components.
- **XSS-Resistant Tokens:** JWT access tokens are stored strictly in `HttpOnly`, `Secure`, `SameSite=Lax` cookies (`kb_access_token`). They are inaccessible via client-side JavaScript (`document.cookie` / `localStorage`).

### 2. HTTP Security Headers & Web Hardening (`apps/web`)

- **Strict CSP ([`security-headers.config.ts`](./apps/web/config/security-headers.config.ts)):** Custom Content-Security-Policy isolating scripts, styles, fonts, and images (`'unsafe-eval'` stripped in production; internal ports omitted in production `connect-src`) while supporting theme hydration and Server-Sent Events.
- **Stealth & Isolation:** `poweredByHeader: false` in `next.config.ts` strips `X-Powered-By: Next.js`; `Cross-Origin-Opener-Policy: same-origin` isolates browsing contexts.
- **Clickjacking & MIME Defense:** Hardened with `X-Frame-Options: DENY`, `frame-ancestors 'none'`, and `X-Content-Type-Options: nosniff`.
- **HSTS:** Strict-Transport-Security enforced in production with `max-age=63072000; includeSubDomains; preload` (2 years).
- **Permissions-Policy:** Explicitly disabling `camera`, `microphone`, `geolocation`, and `browsing-topics`.

### 3. API Gateway Hardening & Rate Limiting (`apps/api`)

- **Helmet Integration:** Configured with `crossOriginResourcePolicy: { policy: 'cross-origin' }` to allow seamless SSE telemetry streams without compromising HTTP protection, alongside `trust proxy` (1 hop) and environment-strict CORS (`WEB_ORIGIN`).
- **Brute-Force Protection (`@nestjs/throttler`):** Sliding window rate limiting protecting authentication endpoints (`POST /api/auth/guest-pass`, `POST /api/auth/login`) with a max quota of 5 requests per minute per IP. Only `@Sse('stream')` is exempt via `@SkipThrottle()`, keeping `GET /api/telemetry/stats` protected by the global quota.

### 4. Zero-Trust Backend & Microservice Isolation

- **Private Docker Network:** The `apps/telemetry-ms` microservice runs within an isolated internal Docker bridge (`backend-network`) communicating exclusively over TCP (`:4001`). No host ports are exposed to the public internet.
- **Controlled Ingress:** All external HTTP and SSE traffic enters through the public gateway (`apps/web` rewrites or `apps/api`), preventing direct probing of internal microservices.

### 5. Contract Validation & Input Sanitization

- **Runtime Validation:** All API inputs and cross-service telemetry payloads are strictly validated against **Zod v4 schemas** ([`@repo/shared-schemas`](./packages/shared-schemas/src/)). Invalid payloads are rejected before business logic execution.
- **Database Safety:** All PostgreSQL interactions are mediated through **Prisma ORM**, eliminating SQL injection vectors through parameterized queries.

### 6. Supply Chain & Build Security

- **Strict Dependency Isolation:** Powered by **pnpm 12** and [`pnpm-workspace.yaml`](./pnpm-workspace.yaml). Unapproved native package build scripts are blocked via strict `allowBuilds` allowlisting.
- **Zero Secrets Commitment:** No API keys, database credentials, or secret keys are committed to the repository. The `.gitignore` prevents leaks of `.env` files.
- **Automated Security Gates:** Every push and pull request triggers automated dependency vulnerability audits (`pnpm audit`) and static analysis in GitHub Actions.

---

## 🔒 Supported Versions

Only the latest `main` branch is actively supported with security patches:

| Component                 | Version / Target           | Supported |
| :------------------------ | :------------------------- | :-------- |
| `apps/web`                | Next.js 16 (React 19)      | ✅ Yes    |
| `apps/api`                | NestJS 12                  | ✅ Yes    |
| `apps/telemetry-ms`       | NestJS Microservices (TCP) | ✅ Yes    |
| `packages/shared-schemas` | Zod v4 Preview             | ✅ Yes    |

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
