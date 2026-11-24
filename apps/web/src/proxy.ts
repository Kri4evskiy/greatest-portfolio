import { KB_ACCESS_COOKIE_NAME } from '@repo/shared-schemas'
import { type NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { isProtectedKnowledgeBasePath } from './shared/i18n/app-routes'
import { routing } from './shared/i18n/routing'
import { verifyEdgeJwtHs256 } from './shared/lib/edge-jwt'

const handleI18nRouting = createMiddleware(routing)

const LOCALE_PREFIX_MATCH_REGEX = /^\/(en|ua|ru)(?=\/|$)/

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // Hybrid KB boundary: `/knowledge-base` and `/knowledge-base/this-project/**` are public & SEO-indexed;
  // all other domain study-note trees require a valid Edge-verified HS256 `kb_access_token` cookie.
  if (isProtectedKnowledgeBasePath(pathname)) {
    const token = request.cookies.get(KB_ACCESS_COOKIE_NAME)?.value
    const isValid = await verifyEdgeJwtHs256(token)

    if (!isValid) {
      const matchedLocale = pathname.match(LOCALE_PREFIX_MATCH_REGEX)?.[1]
      const homePath = matchedLocale && matchedLocale !== routing.defaultLocale ? `/${matchedLocale}` : '/'
      const redirectUrl = new URL(homePath, request.url)
      redirectUrl.searchParams.set('unlock', 'knowledge-base')
      redirectUrl.searchParams.set('redirect', pathname)

      const response = NextResponse.redirect(redirectUrl)
      if (token) {
        response.cookies.delete(KB_ACCESS_COOKIE_NAME)
      }
      return response
    }
  }

  return handleI18nRouting(request)
}

// Explicitly exclude known static asset extensions instead of blanket `.*\..*`
// so future Knowledge Base slugs containing dots (e.g. `next.js-16`) never bypass Edge Auth.
export const config = {
  matcher: [
    '/((?!api|search-index|icon|apple-icon|_next|_vercel|.*opengraph-image.*|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|avif|pdf|css|js|mjs|map|woff|woff2|ttf|otf|txt|xml|json|webmanifest)$).*)',
  ],
}
