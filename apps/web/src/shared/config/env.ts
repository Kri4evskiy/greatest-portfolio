import { DEFAULT_DEV_JWT_SECRET, resolveJwtSecret } from '@repo/shared-schemas'
import { z } from 'zod'

const DEFAULT_SITE_URL = 'http://localhost:3000'
const DEFAULT_POSTHOG_HOST = 'https://app.posthog.com'
const MIN_PROD_JWT_SECRET_LENGTH = 32

let hasWarnedMissingSiteUrl = false

const HttpOriginSchema = z
  .string()
  .trim()
  .transform((value) => {
    try {
      const parsed = new URL(value)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return null
      }
      return parsed.origin
    } catch {
      return null
    }
  })

const WebEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  WORKFOLIO_DEMO_MODE: z.enum(['true', 'false']).optional().default('false'),
  JWT_SECRET: z.string().trim().optional(),
  API_INTERNAL_URL: z.string().trim().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().trim().optional(),
  NEXT_PUBLIC_API_URL: z.string().trim().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().trim().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().trim().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().trim().optional(),
})

export function parseSafeHttpOrigin(raw?: string | null): string | null {
  if (!raw) {
    return null
  }
  const parsed = HttpOriginSchema.safeParse(raw)
  return parsed.success ? parsed.data : null
}

/**
 * Resolves the Edge JWT HMAC-SHA256 verification secret with strict fail-closed semantics:
 * - In production (outside explicit WORKFOLIO_DEMO_MODE=true), rejects missing, short (<32),
 *   or default dev secrets by returning `null` so Edge Proxy NEVER falls back to a public key.
 * - In development/test or local Docker demo mode (`WORKFOLIO_DEMO_MODE=true`), preserves
 *   zero-friction fallback to `DEFAULT_DEV_JWT_SECRET`.
 */
export function resolveEdgeJwtSecretStrict(env: NodeJS.ProcessEnv = process.env): string | null {
  const parsed = WebEnvSchema.safeParse(env)
  const nodeEnv = parsed.success ? parsed.data.NODE_ENV : process.env.NODE_ENV
  const isProduction = nodeEnv === 'production'
  const isDemoMode = (parsed.success ? parsed.data.WORKFOLIO_DEMO_MODE : env.WORKFOLIO_DEMO_MODE) === 'true'
  const rawSecret = (parsed.success ? parsed.data.JWT_SECRET : env.JWT_SECRET)?.trim() ?? ''

  if (isProduction && !isDemoMode) {
    if (rawSecret.length < MIN_PROD_JWT_SECRET_LENGTH || rawSecret === DEFAULT_DEV_JWT_SECRET) {
      return null
    }
    return rawSecret
  }

  return resolveJwtSecret(rawSecret || undefined)
}

export function resolvePublicSiteUrl(env: NodeJS.ProcessEnv = process.env): string {
  const raw = env.NEXT_PUBLIC_SITE_URL?.trim()
  const origin = parseSafeHttpOrigin(raw)
  if (origin) {
    return origin
  }

  const isProd = env.NODE_ENV === 'production'
  const isDemo = env.WORKFOLIO_DEMO_MODE === 'true'
  if (isProd && !isDemo && !hasWarnedMissingSiteUrl) {
    hasWarnedMissingSiteUrl = true
    console.warn(
      '[SEO Config Warning] NEXT_PUBLIC_SITE_URL is missing or invalid in production — falling back to http://localhost:3000. Set NEXT_PUBLIC_SITE_URL to your HTTPS domain before production deploy.',
    )
  }

  return DEFAULT_SITE_URL
}

export function resolvePublicPosthogHost(env: NodeJS.ProcessEnv = process.env): string {
  const raw = env.NEXT_PUBLIC_POSTHOG_HOST?.trim()
  if (!raw) {
    return DEFAULT_POSTHOG_HOST
  }
  const normalized = raw.replace(/\/+$/, '')
  return parseSafeHttpOrigin(normalized) ? normalized : DEFAULT_POSTHOG_HOST
}
