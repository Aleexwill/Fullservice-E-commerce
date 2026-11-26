import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth';
import { can, RESTRICTED_ROUTES, RESTRICTED_API_ROUTES } from '@/lib/roles';

// Rutas de API que deben quedar abiertas al público (formularios del sitio, tracking).
// Todo lo demás bajo /api requiere sesión de admin.
function isPublicApi(pathname: string, method: string): boolean {
  if (pathname.startsWith('/api/auth/')) return true;
  if (pathname.startsWith('/api/invitaciones/')) return true; // token lookup + activation
  // Customer portal routes manage their own auth via requireCustomerAuth
  if (pathname.startsWith('/api/customer/')) return true;

  if (method === 'POST' && ['/api/leads', '/api/pedidos', '/api/presupuestos', '/api/analytics'].includes(pathname)) {
    return true;
  }

  if (method === 'GET') {
    if (pathname === '/api/config' || pathname === '/api/contenido') return true;
    if (pathname === '/api/promo-banners' || pathname === '/api/carousel-slides') return true;
    if (/^\/api\/(productos|portfolio|trabajos|servicios-cms)(\/[^/]+)?$/.test(pathname) && !pathname.endsWith('/stats')) {
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
    // Role-based API enforcement: GET requests to public-readable resources already
    // filtered above; all other methods (POST/PUT/PATCH/DELETE) and admin-only GETs
    // are checked here.
    const restricted = RESTRICTED_API_ROUTES.find(r => pathname.startsWith(r.path));
    if (restricted && !can(session.role, restricted.requiredPermission)) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
    }
    return NextResponse.next();
  }

  // PWA de marcación en terreno: toda la sección exige sesión, salvo el login y los archivos de la PWA.
  if (pathname.startsWith('/marcacion')) {
    // Páginas y archivos públicos de la PWA: login, service worker, manifest, íconos, logo y modelos de reconocimiento
    // (el navegador los pide sin sesión, por ejemplo los íconos del manifest al instalar)
    if (pathname === '/marcacion/login' || /^\/marcacion\/(sw\.js|manifest\.webmanifest|isotipo\.png|apple-touch-icon\.png|icon-[\w-]+\.png|models\/[\w.-]+)$/.test(pathname)) {
      return NextResponse.next();
    }
    const session = await getSession(token);
    if (!session) {
      const loginUrl = new URL('/marcacion/login', request.url);
      if (pathname !== '/marcacion') loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.mustChangePassword) {
      return NextResponse.redirect(new URL('/admin/cambiar-password', request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return NextResponse.next();
    if (pathname.startsWith('/admin/invitacion/')) return NextResponse.next();
    if (pathname === '/admin/cambiar-password') return NextResponse.next();

    const session = await getSession(token);
    if (!session) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (session.mustChangePassword && pathname !== '/admin/cambiar-password') {
      return NextResponse.redirect(new URL('/admin/cambiar-password', request.url));
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
  matcher: ['/admin/:path*', '/marcacion/:path*', '/api/:path*'],
};
