import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { parseBody } from '@/lib/schemas';
import { z } from 'zod';
import { guardarParams, leerCrecimiento, leerEstadoDb, normalizarParams, proyectarDias, registrarSnapshotDelDia } from '@/lib/ti/db';

export const dynamic = 'force-dynamic';

/** Estado de la base de datos (solo lectura). Al consultarlo se guarda el punto del día para ver el crecimiento. */
export async function GET() {
  const a = await requireRole('canManageConfig');
  if (a instanceof NextResponse) return a;
  try {
    const estado = await leerEstadoDb();
    await registrarSnapshotDelDia(estado.tablas, estado.totalBytes);
    const crec = await leerCrecimiento(90);
    return NextResponse.json({ ...estado, crecimiento: { puntos: crec.puntos, bytesPorDia: crec.bytesPorDia, diasHastaLimite: proyectarDias(crec.bytesPorDia, estado.totalBytes, estado.limiteBytes) } });
  } catch (e) {
    console.error('GET /api/ti/db:', e);
    return NextResponse.json({ error: 'No se pudo leer el estado de la base de datos' }, { status: 500 });
  }
}

const ParamsSchema = z.object({ limiteMb: z.number(), alertaPct: z.number(), criticoPct: z.number(), maxConexiones: z.number() });

/** Cambia solo los umbrales de alerta (no toca la base). */
export async function PUT(request: NextRequest) {
  const a = await requireRole('canManageConfig');
  if (a instanceof NextResponse) return a;
  const p = await parseBody(request, ParamsSchema);
  if (p.error) return p.error;
  const nuevos = normalizarParams(p.data);
  if (nuevos.alertaPct !== p.data.alertaPct || nuevos.criticoPct !== p.data.criticoPct) return NextResponse.json({ error: 'El umbral crítico debe ser mayor que el de aviso' }, { status: 400 });
  await guardarParams(nuevos);
  return NextResponse.json({ ok: true, params: nuevos });
}
