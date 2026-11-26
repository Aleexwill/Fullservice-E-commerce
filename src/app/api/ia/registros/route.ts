export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** Últimas llamadas (solo metadatos: nunca el texto enviado ni recibido). ?estado=OK|ERROR|BLOQUEADA &funcion= &pagina= */
export async function GET(request: NextRequest) {
  const a = await requireRole('canManageConfig');
  if (a instanceof NextResponse) return a;
  const q = new URL(request.url).searchParams;
  const estado = q.get('estado'), funcion = q.get('funcion');
  const pagina = Math.max(1, Number(q.get('pagina')) || 1), limite = 30;
  const where = { ...(estado && ['OK', 'ERROR', 'BLOQUEADA'].includes(estado) ? { estado } : {}), ...(funcion ? { funcion } : {}) };
  const [filas, total] = await Promise.all([
    prisma.usoIA.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (pagina - 1) * limite, take: limite }),
    prisma.usoIA.count({ where }),
  ]);
  return NextResponse.json({ total, pagina, paginas: Math.max(1, Math.ceil(total / limite)), registros: filas.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })) });
}

/** Borra registros anteriores a N días (mínimo 7). */
export async function DELETE(request: NextRequest) {
  const a = await requireRole('canManageConfig');
  if (a instanceof NextResponse) return a;
  const dias = Number(new URL(request.url).searchParams.get('antesDeDias'));
  if (!Number.isFinite(dias) || dias < 7) return NextResponse.json({ error: 'Indicá una antigüedad de al menos 7 días' }, { status: 400 });
  const limite = new Date(Date.now() - dias * 86_400_000);
  const r = await prisma.usoIA.deleteMany({ where: { createdAt: { lt: limite } } });
  return NextResponse.json({ borrados: r.count });
}
