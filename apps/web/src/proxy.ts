import { type NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const KB_ACCESS_COOKIE_NAME = 'kb_access_token'
const handleI18nRouting = createMiddleware(routing)

const PROTECTED_KB_REGEX = /^(?:\/(en|ua|ru))?\/knowledge-base(?:\/.*)?$/

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl
  const kbMatch = pathname.match(PROTECTED_KB_REGEX)

  if (kbMatch) {
    const token = request.cookies.get(KB_ACCESS_COOKIE_NAME)?.value
    if (token?.split('.').length !== 3) {
      const matchedLocale = kbMatch[1]
      const homePath = matchedLocale && matchedLocale !== routing.defaultLocale ? `/${matchedLocale}` : '/'
      const redirectUrl = new URL(homePath, request.url)
      redirectUrl.searchParams.set('unlock', 'knowledge-base')
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return handleI18nRouting(request)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
