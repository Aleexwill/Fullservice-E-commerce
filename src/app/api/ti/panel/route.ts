import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { leerEstadoDb, leerCrecimiento, proyectarDias } from '@/lib/ti/db';
import { ESTADOS_ABIERTOS } from '@/lib/ti/tickets';

export const dynamic = 'force-dynamic';

/** Resumen del panel de TI: tickets, base de datos y uso de IA del mes. */
export async function GET() {
  const a = await requireRole('canManageConfig');
  if (a instanceof NextResponse) return a;
  try {
    const abiertos = { estado: { in: [...ESTADOS_ABIERTOS] } };
    const desdeMes = new Date(); desdeMes.setDate(1); desdeMes.setHours(0, 0, 0, 0);
    const [total, criticos, sinAsignar, nuevos, recientes, db, crec, ia] = await Promise.all([
      prisma.ticket.count({ where: abiertos }),
      prisma.ticket.count({ where: { ...abiertos, prioridad: 'CRITICA' } }),
      prisma.ticket.count({ where: { ...abiertos, asignadoId: null } }),
      prisma.ticket.count({ where: { estado: 'NUEVO' } }),
      prisma.ticket.findMany({ where: abiertos, orderBy: [{ updatedAt: 'desc' }], take: 6, select: { id: true, numero: true, titulo: true, tipo: true, prioridad: true, estado: true, updatedAt: true } }),
      leerEstadoDb().catch(() => null),
      leerCrecimiento(90).catch(() => null),
      prisma.usoIA.aggregate({ where: { createdAt: { gte: desdeMes }, estado: 'OK' }, _count: { _all: true } }).catch(() => null),
    ]);
    return NextResponse.json({
      tickets: { abiertos: total, criticos, sinAsignar, nuevos, recientes },
      db: db && { totalBytes: db.totalBytes, limiteBytes: db.limiteBytes, usoPct: db.usoPct, alertas: db.alertas,
        diasHastaLimite: crec ? proyectarDias(crec.bytesPorDia, db.totalBytes, db.limiteBytes) : null },
      ia: ia && { llamadasMes: ia._count._all },
    });
  } catch (e) {
    console.error('GET /api/ti/panel:', e);
    return NextResponse.json({ error: 'No se pudo cargar el panel' }, { status: 500 });
  }
}
