import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth/sessions';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/health'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    PUBLIC_PATHS.some((p) => pathname === p) ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (!hasSession) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
