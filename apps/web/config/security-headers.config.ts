export interface SecurityHeaderEntry {
  key: string
  value: string
}

export interface ContentSecurityPolicyOptions {
  /**
   * Allows same-origin `<object>` / `<iframe>` PDF rendering exclusively on `/cv` routes.
   * Remains `false` (`'none'`) on all other application routes.
   */
  allowSelfObjectAndFrame?: boolean
  /**
   * Relaxes `frame-ancestors` from `'none'` to `'self'` exclusively for `/cv/*.pdf` assets
   * so the portfolio's own `/cv` page can render the PDF inline while blocking external sites.
   */
  allowSameOriginFraming?: boolean
}

/**
 * Builds the Content-Security-Policy (CSP) string tailored for Next.js 16, React 19,
 * theme hydration, Server-Sent Events, and scoped same-origin CV PDF rendering.
 *
 * Security Principle:
 * - Production: Strict zero-trust policy without internal ports or localhost leaks.
 * - Development: Permissive localhost and evaluation policies required for React Fast Refresh and HMR.
 */
export function buildContentSecurityPolicy(
  isProduction: boolean,
  publicApiUrl = '',
  options: ContentSecurityPolicyOptions = {},
): string {
  const { allowSelfObjectAndFrame = false, allowSameOriginFraming = false } = options
  const normalizedPublicApi = publicApiUrl.trim() ? ` ${publicApiUrl.trim()}` : ''

  // In production, internal ports must NEVER be leaked in HTTP response headers.
  // In development, localhost API and microservice ports are allowed for local developer workflow.
  const connectSrc = isProduction
    ? `'self' https:${normalizedPublicApi}`
    : `'self' http://localhost:4000 http://localhost:4001 http://127.0.0.1:4000 http://127.0.0.1:4001 ws: wss: https:${normalizedPublicApi}`

  // In production, 'unsafe-eval' MUST NOT be enabled — our MDX pipeline compiles to React AST
  // without dynamic eval/new Function, closing XSS eval gadgets.
  // In development, 'unsafe-eval' is required for Next.js Fast Refresh / HMR.
  const scriptSrc = isProduction ? "'self' 'unsafe-inline'" : "'self' 'unsafe-inline' 'unsafe-eval'"
  const objectSrc = allowSelfObjectAndFrame ? "'self'" : "'none'"
  const frameSrc = allowSelfObjectAndFrame ? "'self'" : "'none'"
  const frameAncestors = allowSameOriginFraming ? "'self'" : "'none'"

  const directives: string[] = [
    // Default fallback: Restrict all resources to current origin unless explicitly allowed
    "default-src 'self'",

    // Scripts: 'unsafe-inline' preserves next-themes FOUC prevention & static RSC payloads
    `script-src ${scriptSrc}`,

    // Styles: 'unsafe-inline' required for Tailwind CSS, CSS variables, and dynamic theme switching
    "style-src 'self' 'unsafe-inline'",

    // Images: Allow local images, blobs, data-URIs, and secure HTTPS remote sources
    "img-src 'self' blob: data: https:",

    // Fonts: Allow local fonts, data-URIs, and secure HTTPS fonts (e.g. Google Fonts / Geist)
    "font-src 'self' data: https:",

    // Network Connections: REST API, SSE telemetry stream, and cloud observability (Sentry / PostHog)
    `connect-src ${connectSrc}`,

    // Embedded subframes: Blocked globally ('none'), scoped to 'self' only on CV PDF viewer routes
    `frame-src ${frameSrc}`,

    // Clickjacking Defense: Block all framing globally; allow same-origin only for static /cv/*.pdf assets
    `frame-ancestors ${frameAncestors}`,

    // Form Submissions: Restrict HTML form targets to self origin
    "form-action 'self'",

    // Base URI: Prevent DOM injection of malicious <base href="..."> tags
    "base-uri 'self'",

    // Plugins / Objects: Blocked globally ('none'); scoped to 'self' only on CV routes for inline PDF <object>
    `object-src ${objectSrc}`,

    // Enforce HTTPS upgrade exclusively in production (do not break local http://localhost)
    ...(isProduction ? ['upgrade-insecure-requests'] : []),
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
  return [
    {
      key: 'Content-Security-Policy',
      value: buildContentSecurityPolicy(isProduction, publicApiUrl, options),
    },
    ...(isProduction
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
