const DEFAULT_API_INTERNAL_URL = 'http://localhost:4000'

/**
 * Parses a raw URL string and returns its safe `http:` / `https:` origin (`scheme://host[:port]`),
 * rejecting malformed strings or non-HTTP schemes (e.g. `javascript:`, `data:`) so values can be
 * interpolated safely into CSP directives and Next.js proxy rewrites.
 */
export function parseSafeHttpOrigin(raw?: string | null): string | null {
  const trimmed = raw?.trim()
  if (!trimmed) {
    return null
  }
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }
    return parsed.origin
  } catch {
    return null
  }
}

/**
 * Normalizes `API_INTERNAL_URL` for Next.js `rewrites()` by stripping trailing slashes
 * and validating the scheme, preventing `//api/:path*` double-slashes or malformed startup crashes.
 */
export function resolveNormalizedApiInternalUrl(raw = process.env.API_INTERNAL_URL): string {
  const trimmed = raw?.trim()
  if (!trimmed) {
    return DEFAULT_API_INTERNAL_URL
  }
  const normalized = trimmed.replace(/\/+$/, '')
  return parseSafeHttpOrigin(normalized) ? normalized : DEFAULT_API_INTERNAL_URL
}
