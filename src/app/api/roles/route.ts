import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth';
import { can } from '@/lib/roles';

async function checkAdmin(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token).catch(() => null);
  if (!session || !can(session.role as any, 'canManageUsers')) return null;
  return session;
}

export async function GET(request: NextRequest) {
  try {
    const session = await checkAdmin(request);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const roles = await prisma.customRole.findMany({ orderBy: [{ isSystem: 'desc' }, { createdAt: 'asc' }] });
    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Error GET /api/roles:', error);
    return NextResponse.json({ error: 'Error al obtener roles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await checkAdmin(request);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { name, label, permissions } = await request.json();
    if (!name || !label) return NextResponse.json({ error: 'Nombre y etiqueta requeridos' }, { status: 400 });

    const slug = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (!slug) return NextResponse.json({ error: 'Nombre inválido' }, { status: 400 });

    const existing = await prisma.customRole.findUnique({ where: { name: slug } });
    if (existing) return NextResponse.json({ error: 'Ya existe un rol con ese nombre' }, { status: 409 });

    const role = await prisma.customRole.create({
      data: { name: slug, label, permissions: permissions ?? {}, isSystem: false },
    });
    return NextResponse.json({ role });
  } catch (error) {
    console.error('Error POST /api/roles:', error);
    return NextResponse.json({ error: 'Error al crear rol' }, { status: 500 });
  }
}
