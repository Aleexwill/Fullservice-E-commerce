import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { getProjectById, updateProject, deleteProject } from '@/lib/portfolio-store';

export async function GET(_r: NextRequest, { params }: { params: { id: string } }) {
  try { const p = await getProjectById(params.id); return p ? NextResponse.json(p) : NextResponse.json({ error: 'No encontrado' }, { status: 404 }); }
  catch (error) {
    console.error('Error en GET /api/portfolio/[id]:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error: ${message}` }, { status: 500 });
  }
}
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole('canManageContent');
  if (auth instanceof NextResponse) return auth;
  try { const body = await req.json(); const p = await updateProject(params.id, body); return p ? NextResponse.json(p) : NextResponse.json({ error: 'No encontrado' }, { status: 404 }); }
  catch (error) {
    console.error('Error en PUT /api/portfolio/[id]:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error: ${message}` }, { status: 500 });
  }
}
export async function DELETE(_r: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole('canManageContent');
  if (auth instanceof NextResponse) return auth;
  try { return (await deleteProject(params.id)) ? NextResponse.json({ success: true }) : NextResponse.json({ error: 'No encontrado' }, { status: 404 }); }
  catch (error) {
    console.error('Error en DELETE /api/portfolio/[id]:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error: ${message}` }, { status: 500 });
  }
}
