import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth';

// Rutas de API que deben quedar abiertas al público (formularios del sitio, tracking).
// Todo lo demás bajo /api requiere sesión de admin.
function isPublicApi(pathname: string, method: string): boolean {
  if (pathname.startsWith('/api/auth/')) return true;

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
  // Falla "cerrado": cualquier error al verificar (ej. SESSION_SECRET
  // no configurado) se trata como "sin sesión", nunca deja pasar la
  // request ni tumba el middleware con una excepción sin manejar.
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
    const session = await getSession(token);
    if (!session) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
