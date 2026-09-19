import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getClienteLogoById, updateClienteLogo, deleteClienteLogo } from '@/lib/clientes-logo-store';

export async function GET(_r: NextRequest, { params }: { params: { id: string } }) {
  try {
    const c = await getClienteLogoById(params.id);
    return c ? NextResponse.json(c) : NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole('canManageContent');
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await req.json();
    const c = await updateClienteLogo(params.id, body);
    return c ? NextResponse.json(c) : NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_r: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole('canManageContent');
  if (auth instanceof NextResponse) return auth;
  try {
    return (await deleteClienteLogo(params.id))
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
