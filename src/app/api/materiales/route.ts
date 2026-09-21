import { NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseBody, CreateMaterialSchema } from '@/lib/schemas';


export async function GET(request: Request) {
  const auth = await requireRole('canManageInventory');
  if (auth instanceof NextResponse) return auth;
  try {
    
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const limit = Math.min(Number(searchParams.get('limit') || '30'), 100);

    const where: any = { isActive: true };
    if (q) where.description = { contains: q, mode: 'insensitive' };
    if (category) where.category = category;

    const materials = await prisma.material.findMany({
      where, take: limit,
      orderBy: { description: 'asc' },
      select: { id: true, description: true, unit: true, unitPrice: true, provider: true, category: true, code: true },
    });

    const categories = await prisma.material.groupBy({
      by: ['category'], where: { isActive: true }, _count: true, orderBy: { category: 'asc' },
    });

    return NextResponse.json({ materials, categories: categories.map(c => ({ name: c.category, count: c._count })) });
  } catch (error) {
    console.error('Error en GET /api/materiales:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al obtener materiales: ${message}` }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireRole('canManageInventory');
  if (auth instanceof NextResponse) return auth;
  try {
    
    const parsed = await parseBody(request, CreateMaterialSchema);
    if (parsed.error) return parsed.error;
    const body = parsed.data;
    const material = await prisma.material.create({ data: body });
    return NextResponse.json(material, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/materiales:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al crear material: ${message}` }, { status: 500 });
  }
}
