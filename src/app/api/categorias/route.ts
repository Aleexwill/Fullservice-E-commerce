import { NextRequest, NextResponse } from 'next/server';
import { getCategorias, createCategoria, type CategoryScope } from '@/lib/categorias-store';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const scope = request.nextUrl.searchParams.get('scope') as CategoryScope | null;
  const active = request.nextUrl.searchParams.get('active') === 'true';
  const items = await getCategorias(scope ?? undefined, active);
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const { name, slug, scope, order } = body;

  if (!name || !slug || !scope) {
    return NextResponse.json({ error: 'name, slug y scope son requeridos' }, { status: 400 });
  }

  const validScopes: CategoryScope[] = ['productos', 'trabajos', 'servicios', 'inventario'];
  if (!validScopes.includes(scope)) {
    return NextResponse.json({ error: 'scope inválido' }, { status: 400 });
  }

  try {
    const item = await createCategoria({ name, slug, scope, order });
    return NextResponse.json(item, { status: 201 });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe una categoría con ese slug en este scope' }, { status: 409 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
