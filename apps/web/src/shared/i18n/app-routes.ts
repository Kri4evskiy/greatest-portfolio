export const APP_ROUTES = {
  home: '/',
  cv: '/cv',
  systemStatus: '/system-status',
  knowledgeBase: '/knowledge-base',
} as const

export type AppStaticRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES]

export interface HeaderRouteBadgeConfig {
  route: AppStaticRoute
  badgeLabel: string
  matchPrefix?: boolean
}

export const HEADER_ROUTE_BADGES: readonly HeaderRouteBadgeConfig[] = [
  { route: APP_ROUTES.knowledgeBase, badgeLabel: 'knowledge-base', matchPrefix: true },
  { route: APP_ROUTES.cv, badgeLabel: 'cv.pdf' },
  { route: APP_ROUTES.systemStatus, badgeLabel: 'system-status' },
] as const

export function isRouteActive(pathname: string, route: AppStaticRoute, matchPrefix = false): boolean {
  if (matchPrefix) {
    return pathname === route || pathname.startsWith(`${route}/`)
  }
  return pathname === route
}

export function resolveHeaderRouteBadge(pathname: string): string | null {
  for (const entry of HEADER_ROUTE_BADGES) {
    if (isRouteActive(pathname, entry.route, entry.matchPrefix)) {
      return entry.badgeLabel
    }
  }
  return null
}

export function buildKnowledgeBasePath(routePath?: string): string {
  if (!routePath) {
    return APP_ROUTES.knowledgeBase
  }
  const normalized = routePath.replace(/^\/+/, '')
  return normalized ? `${APP_ROUTES.knowledgeBase}/${normalized}` : APP_ROUTES.knowledgeBase
}

export const PUBLIC_KB_ROOT_SEGMENTS = ['this-project'] as const

const LOCALE_PREFIX_REGEX = /^\/(en|ua|uk|ru)(?=\/|$)/

function stripLocalePrefix(pathname: string): string {
  const stripped = pathname.replace(LOCALE_PREFIX_REGEX, '')
  return stripped || '/'
}

/**
 * Hybrid Knowledge Base access policy:
 * - Public & SEO-indexed: `/knowledge-base` hub and `/knowledge-base/this-project/**`
 *   (transparent architecture blueprint open to crawlers, recruiters, and Team Leads with zero 307 redirects).
 * - Protected behind Edge Web Crypto JWT Proxy: all other domain study notes (`/knowledge-base/react/**`, etc.).
 */
export function isPublicKnowledgeBasePath(pathname: string): boolean {
  const normalized = stripLocalePrefix(pathname).replace(/\/+$/, '') || '/'
  if (normalized === APP_ROUTES.knowledgeBase) {
    return true
  }
  return PUBLIC_KB_ROOT_SEGMENTS.some(
    (segment) =>
      normalized === `${APP_ROUTES.knowledgeBase}/${segment}` ||
      normalized.startsWith(`${APP_ROUTES.knowledgeBase}/${segment}/`),
  )
}

export function isProtectedKnowledgeBasePath(pathname: string): boolean {
  const normalized = stripLocalePrefix(pathname).replace(/\/+$/, '') || '/'
  if (!isRouteActive(normalized, APP_ROUTES.knowledgeBase, true)) {
    return false
  }
  return !isPublicKnowledgeBasePath(normalized)
}

export function normalizeKbRedirectPath(rawPath: string | null | undefined): string {
  const trimmed = rawPath?.trim()
  if (!trimmed?.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return APP_ROUTES.knowledgeBase
  }

  const withoutLocale = trimmed.replace(LOCALE_PREFIX_REGEX, '')
  return isRouteActive(withoutLocale, APP_ROUTES.knowledgeBase, true) ? withoutLocale : APP_ROUTES.knowledgeBase
}
