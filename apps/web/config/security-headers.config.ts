import { parseSafeHttpOrigin } from './utils/url-origin.util'

export interface SecurityHeaderEntry {
  key: string
  value: string
}

export interface ContentSecurityPolicyOptions {
  /**
   * Relaxes `frame-ancestors` from `'none'` to `'self'` (and `X-Frame-Options` to `SAMEORIGIN`)
   * exclusively for `/cv/:path+` static PDF assets so the portfolio's own `/cv` page can render
   * the PDF inline (including after client-side SPA `<Link href="/cv">` transitions) while
   * blocking external sites and all other internal routes from being framed.
   */
  allowSameOriginFraming?: boolean
  /**
   * Controls whether `upgrade-insecure-requests` and `Strict-Transport-Security` are emitted.
   * Defaults to `true` only when running in strict production with an explicit `https://` `NEXT_PUBLIC_SITE_URL`
   * (disabled for local HTTP `next start`, CI Playwright E2E, and `WORKFOLIO_DEMO_MODE=true` Docker demos
   * so Chromium does not upgrade `http://localhost:3000` fetches to `https://` and fail with `ERR_SSL_PROTOCOL_ERROR`).
   */
  enforceHttpsTransport?: boolean
}

function resolveEnforceHttpsTransport(isProduction: boolean, override?: boolean): boolean {
  if (typeof override === 'boolean') return override
  if (!isProduction) return false
  if (process.env.WORKFOLIO_DEMO_MODE === 'true') return false
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim().toLowerCase()
  return siteUrl.startsWith('https://')
}

/**
 * Builds the Content-Security-Policy (CSP) string tailored for Next.js 16, React 19,
 * theme hydration, Server-Sent Events, and SPA-safe same-origin CV PDF rendering.
 *
 * Security Principle:
 * - Production: Strict zero-trust policy without internal ports or localhost leaks.
 * - Development: Permissive localhost and evaluation policies required for React Fast Refresh and HMR.
 * - SPA Navigation & CV PDF Isolation: `object-src 'self'` and `frame-src 'self'` are set on document
 *   responses so client-side `<Link href="/cv">` transitions from `/` or `/knowledge-base` never block
 *   `<object type="application/pdf">`, while `frame-ancestors 'none'` (`X-Frame-Options: DENY`) on all
 *   routes except `/cv/:path+` guarantees that ONLY internal `/cv/*.pdf` assets can ever be framed.
 */
export function buildContentSecurityPolicy(
  isProduction: boolean,
  publicApiUrl = '',
  options: ContentSecurityPolicyOptions = {},
): string {
  const { allowSameOriginFraming = false, enforceHttpsTransport } = options
  const shouldUpgradeHttps = resolveEnforceHttpsTransport(isProduction, enforceHttpsTransport)
  const allowedConnectOrigins = new Set<string>()
  const safeApiOrigin = parseSafeHttpOrigin(publicApiUrl)
  if (safeApiOrigin) {
    allowedConnectOrigins.add(safeApiOrigin)
  }

  // Allow explicitly configured PostHog / Sentry ingestion origins without opening blanket `https:` exfiltration
  const posthogOrigin = parseSafeHttpOrigin(process.env.NEXT_PUBLIC_POSTHOG_HOST)
  if (posthogOrigin) {
    allowedConnectOrigins.add(posthogOrigin)
  }
  const sentryOrigin = parseSafeHttpOrigin(process.env.NEXT_PUBLIC_SENTRY_DSN)
  if (sentryOrigin) {
    allowedConnectOrigins.add(sentryOrigin)
  }

  const extraConnectSrc = allowedConnectOrigins.size > 0 ? ` ${Array.from(allowedConnectOrigins).join(' ')}` : ''

  // In production, internal ports and blanket `https:` must NEVER be allowed in connect-src.
  // In development, localhost API and microservice ports are allowed for local developer workflow.
  const connectSrc = isProduction
    ? `'self'${extraConnectSrc}`
    : `'self' http://localhost:4000 http://localhost:4001 http://127.0.0.1:4000 http://127.0.0.1:4001 ws: wss:${extraConnectSrc}`

  // In production, 'unsafe-eval' MUST NOT be enabled — our MDX pipeline compiles to HAST
  // without dynamic eval/new Function, closing XSS eval gadgets.
  // In development, 'unsafe-eval' is required for Next.js Fast Refresh / HMR.
  const scriptSrc = isProduction ? "'self' 'unsafe-inline'" : "'self' 'unsafe-inline' 'unsafe-eval'"
  const frameAncestors = allowSameOriginFraming ? "'self'" : "'none'"

  const directives: string[] = [
    // Default fallback: Restrict all resources to current origin unless explicitly allowed
    "default-src 'self'",

    // Scripts: 'unsafe-inline' preserves next-themes, static allowlisted PALETTE_INIT_SCRIPT FOUC prevention & RSC payloads
    `script-src ${scriptSrc}`,

    // Styles: 'unsafe-inline' required for Tailwind CSS, CSS variables, and dynamic theme switching
    "style-src 'self' 'unsafe-inline'",

    // Images: Allow local images, blobs, data-URIs, and secure HTTPS remote sources
    "img-src 'self' blob: data: https:",

    // Fonts: Self-hosted next/font/google .woff2 assets + data-URIs only (zero external font CDNs at runtime)
    "font-src 'self' data:",

    // Network Connections: REST API, SSE telemetry stream, and cloud observability (Sentry / PostHog)
    `connect-src ${connectSrc}`,

    // Embedded subframes: Restricted strictly to same-origin ('self'); only /cv/:path+ permits framing via frame-ancestors
    "frame-src 'self'",

    // Clickjacking Defense: Block all framing globally ('none'); allow 'self' only on static /cv/:path+ PDF assets
    `frame-ancestors ${frameAncestors}`,

    // Form Submissions: Restrict HTML form targets to self origin
    "form-action 'self'",

    // Base URI: Prevent DOM injection of malicious <base href="..."> tags
    "base-uri 'self'",

    // Plugins / Objects: Restricted strictly to same-origin ('self') so SPA <Link href="/cv"> navigation renders /cv/*.pdf
    "object-src 'self'",

    // Enforce HTTPS upgrade exclusively on HTTPS production origins (do not break local http://localhost)
    ...(shouldUpgradeHttps ? ['upgrade-insecure-requests'] : []),
  ]

  return directives.join('; ').trim()
}

/**
 * Returns comprehensive production-grade HTTP security headers conforming to A+ grade standards.
 *
 * NOTE (`NEXT_PUBLIC_API_URL`):
 * Currently, all browser requests target same-origin `/api/*` paths proxied via Next.js
 * `rewrites()` (`API_INTERNAL_URL`), so `NEXT_PUBLIC_API_URL` is not yet required in `.env`.
 * When deploying `apps/api` to a dedicated external domain (e.g., `https://api.yourdomain.com`
 * on Render/VPS for direct cross-origin REST/SSE), add `NEXT_PUBLIC_API_URL` to `.env`,
 * `.env.example`, `turbo.json` (`globalEnv`), and cloud env settings so `connect-src`
 * explicitly allowlists that origin.
 */
export function getSecurityHeaders(
  isProduction = process.env.NODE_ENV === 'production',
  publicApiUrl = process.env.NEXT_PUBLIC_API_URL ?? '',
  options: ContentSecurityPolicyOptions = {},
): SecurityHeaderEntry[] {
  const shouldEmitHsts = resolveEnforceHttpsTransport(isProduction, options.enforceHttpsTransport)

  return [
    {
      key: 'Content-Security-Policy',
      value: buildContentSecurityPolicy(isProduction, publicApiUrl, options),
    },
    ...(shouldEmitHsts
      ? [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ]
      : []),
    {
      key: 'Cross-Origin-Opener-Policy',
      value: 'same-origin',
    },
    {
      key: 'Cross-Origin-Resource-Policy',
      value: 'same-origin',
    },
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
    {
      key: 'X-Frame-Options',
      value: options.allowSameOriginFraming ? 'SAMEORIGIN' : 'DENY',
    },
    {
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin',
    },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
    },
  ]
}
