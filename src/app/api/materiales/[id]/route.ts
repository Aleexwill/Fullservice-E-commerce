import { NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole('canManageInventory');
  if (auth instanceof NextResponse) return auth;
  try {
    
    const body = await request.json();
    const material = await prisma.material.update({
      where: { id: params.id },
      data: {
        ...(body.description !== undefined && { description: body.description }),
        ...(body.unit !== undefined && { unit: body.unit }),
        ...(body.unitPrice !== undefined && { unitPrice: body.unitPrice }),
        ...(body.provider !== undefined && { provider: body.provider }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    });
    return NextResponse.json(material);
  } catch (error) {
    console.error('Error en PUT /api/materiales/[id]:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al actualizar material: ${message}` }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole('canManageInventory');
  if (auth instanceof NextResponse) return auth;
  try {
    
    await prisma.material.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error en DELETE /api/materiales/[id]:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al eliminar material: ${message}` }, { status: 500 });
  }
}
