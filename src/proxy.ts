import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth/sessions';

const PUBLIC_PATHS = ['/', '/login', '/api/auth/login', '/api/health'];

// Public-by-design route prefixes:
//   - Next.js metadata routes (icon, apple-icon, opengraph-image, twitter-image)
//     so crawlers and social-card bots can fetch PNGs without a session.
//   - /landing/* public assets used by the marketing landing page (banner PNGs).
//   - /_next/* framework assets (also pre-excluded by matcher below; kept here for clarity).
const PUBLIC_PATH_PREFIXES = [
  '/_next',
  '/icon',
  '/apple-icon',
  '/opengraph-image',
  '/twitter-image',
  '/landing',
];

// Static asset file extensions always reachable without auth.
// Covers images, fonts, common static resources, and PWA / SEO routes
// (sitemap.xml, robots.txt, manifest.webmanifest).
const PUBLIC_FILE_EXTENSIONS =
  /\.(?:png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf|eot|css|map|txt|xml|json|webmanifest)$/i;

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    PUBLIC_PATHS.some((p) => pathname === p) ||
    PUBLIC_PATH_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(`${p}.`),
    ) ||
    PUBLIC_FILE_EXTENSIONS.test(pathname) ||
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
