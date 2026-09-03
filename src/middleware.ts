import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth';
import { can, RESTRICTED_ROUTES } from '@/lib/roles';

// Rutas de API que deben quedar abiertas al público (formularios del sitio, tracking).
// Todo lo demás bajo /api requiere sesión de admin.
function isPublicApi(pathname: string, method: string): boolean {
  if (pathname.startsWith('/api/auth/')) return true;
  if (pathname.startsWith('/api/invitaciones/')) return true; // token lookup + activation

  if (method === 'POST' && ['/api/leads', '/api/pedidos', '/api/presupuestos', '/api/analytics'].includes(pathname)) {
    return true;
  }

  if (method === 'GET') {
    if (pathname === '/api/config' || pathname === '/api/contenido') return true;
    if (pathname === '/api/promo-banners' || pathname === '/api/carousel-slides') return true;
    if (/^\/api\/(productos|portfolio|servicios-cms)(\/[^/]+)?$/.test(pathname) && !pathname.endsWith('/stats')) {
      return true;
    }
  }

  return false;
}

async function getSession(token: string | undefined) {
  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (pathname.startsWith('/api/')) {
    if (isPublicApi(pathname, request.method)) return NextResponse.next();
    const session = await getSession(token);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return NextResponse.next();
    // Invitation acceptance pages are public
    if (pathname.startsWith('/admin/invitacion/')) return NextResponse.next();

    const session = await getSession(token);
    if (!session) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based route enforcement
    const restricted = RESTRICTED_ROUTES.find(r => pathname.startsWith(r.path));
    if (restricted && !can(session.role, restricted.requiredPermission)) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
