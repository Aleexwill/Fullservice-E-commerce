import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getAllClientesLogo, createClienteLogo } from '@/lib/clientes-logo-store';

export async function GET() {
  try {
    const clientes = await getAllClientesLogo();
    return NextResponse.json({ clientes });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole('canManageContent');
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await req.json();
    if (!body.name) return NextResponse.json({ error: 'Nombre obligatorio' }, { status: 400 });
    const cliente = await createClienteLogo({
      name: body.name,
      logoUrl: body.logoUrl || '',
      website: body.website || '',
      parentId: body.parentId || null,
      isActive: body.isActive !== false,
      order: body.order || 0,
    });
    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
