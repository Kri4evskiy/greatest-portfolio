import { type NextRequest, NextResponse } from 'next/server';

const KB_ACCESS_COOKIE = 'kb_access_token';

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/knowledge-base')) {
    const accessCookie = request.cookies.get(KB_ACCESS_COOKIE);

    if (!accessCookie || !accessCookie.value) {
      const redirectUrl = new URL('/', request.url);
      redirectUrl.searchParams.set('unlock', 'knowledge-base');
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/knowledge-base/:path*'],
};
