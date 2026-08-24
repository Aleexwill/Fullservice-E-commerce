import { NextRequest, NextResponse } from 'next/server';
import { getPresupuestoById, updatePresupuesto, addNoteToPresupuesto, deletePresupuesto } from '@/lib/presupuestos-store';
import { prisma } from '@/lib/prisma';

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
    if (!p) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    // When approved: create/update Cliente and mark Lead as won
    if (body.status === 'aprobado') {
      try {
        const cuid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
        const c = p.customer as { name: string; email: string; phone: string; company: string; address: string };
        // Upsert cliente by email or phone
        const existing = (c.email || c.phone) ? await prisma.cliente.findFirst({
          where: { OR: [c.email ? { email: c.email } : undefined, c.phone ? { phone: c.phone } : undefined].filter(Boolean) as any },
        }) : null;
        if (existing) {
          await prisma.cliente.update({
            where: { id: existing.id },
            data: { jobsCount: { increment: 1 }, lastServiceAt: new Date().toISOString().split('T')[0] },
          });
        } else {
          await prisma.cliente.create({
            data: {
              name: c.name, email: c.email || '', phone: c.phone || '',
              company: c.company || '', address: c.address || '',
              category: 'servicios', jobsCount: 1,
              lastServiceAt: new Date().toISOString().split('T')[0],
            },
          });
        }
        // Mark related lead as won
        if (c.email) {
          await prisma.lead.updateMany({
            where: { status: { not: 'won' }, customer: { path: ['email'], equals: c.email } },
            data: { status: 'won' },
          });
        }
      } catch (_) { /* non-blocking */ }
    }

    return NextResponse.json(p);
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
