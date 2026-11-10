import { KB_ACCESS_COOKIE_NAME } from '@repo/shared-schemas'
import { type NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { verifyEdgeJwtHs256 } from './lib/edge-jwt'

const handleI18nRouting = createMiddleware(routing)

const PROTECTED_KB_REGEX = /^(?:\/(en|ua|ru))?\/knowledge-base(?:\/.*)?$/

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl
  const kbMatch = pathname.match(PROTECTED_KB_REGEX)

  if (kbMatch) {
    const token = request.cookies.get(KB_ACCESS_COOKIE_NAME)?.value
    const isValid = await verifyEdgeJwtHs256(token)

    if (!isValid) {
      const matchedLocale = kbMatch[1]
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

export const config = {
  matcher: ['/((?!api|search-index|_next|_vercel|.*\\..*).*)'],
}
