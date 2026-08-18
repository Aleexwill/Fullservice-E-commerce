import { NextRequest, NextResponse } from 'next/server';
import { getPresupuestoById, updatePresupuesto, addNoteToPresupuesto, deletePresupuesto } from '@/lib/presupuestos-store';

export async function GET(_r: NextRequest, { params }: { params: { id: string } }) {
  try { const p = await getPresupuestoById(params.id); return p ? NextResponse.json(p) : NextResponse.json({ error: 'No encontrado' }, { status: 404 }); }
  catch (error) {
    console.error('Error en GET /api/presupuestos/[id]:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error: ${message}` }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    if (body._addNote) { const p = await addNoteToPresupuesto(params.id, body._addNote); return p ? NextResponse.json(p) : NextResponse.json({ error: 'No encontrado' }, { status: 404 }); }
    const p = await updatePresupuesto(params.id, body);
    return p ? NextResponse.json(p) : NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  } catch (error) {
    console.error('Error en PUT /api/presupuestos/[id]:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error: ${message}` }, { status: 500 });
  }
}

export async function DELETE(_r: NextRequest, { params }: { params: { id: string } }) {
  try { return (await deletePresupuesto(params.id)) ? NextResponse.json({ success: true }) : NextResponse.json({ error: 'No encontrado' }, { status: 404 }); }
  catch (error) {
    console.error('Error en DELETE /api/presupuestos/[id]:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error: ${message}` }, { status: 500 });
  }
}
