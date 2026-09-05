import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getServiceById, updateService, deleteService } from '@/lib/services-store';

export async function GET(_r: NextRequest, { params }: { params: { id: string } }) {
  try { const s = await getServiceById(params.id); return s ? NextResponse.json(s) : NextResponse.json({ error: 'No encontrado' }, { status: 404 }); }
  catch (error) {
    console.error('Error en GET /api/servicios-cms/[id]:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error: ${message}` }, { status: 500 });
  }
}
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  try { const body = await req.json(); const s = await updateService(params.id, body); return s ? NextResponse.json(s) : NextResponse.json({ error: 'No encontrado' }, { status: 404 }); }
  catch (error) {
    console.error('Error en PUT /api/servicios-cms/[id]:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error: ${message}` }, { status: 500 });
  }
}
export async function DELETE(_r: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  try { return (await deleteService(params.id)) ? NextResponse.json({ success: true }) : NextResponse.json({ error: 'No encontrado' }, { status: 404 }); }
  catch (error) {
    console.error('Error en DELETE /api/servicios-cms/[id]:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error: ${message}` }, { status: 500 });
  }
}
