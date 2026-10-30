import { type NextRequest, NextResponse } from 'next/server';

const KB_ACCESS_COOKIE_NAME = 'kb_access_token';

export function proxy(request: NextRequest): NextResponse {
  const token = request.cookies.get(KB_ACCESS_COOKIE_NAME)?.value;

  if (!token || token.split('.').length !== 3) {
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('unlock', 'knowledge-base');
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/knowledge-base', '/knowledge-base/:path*'],
};
