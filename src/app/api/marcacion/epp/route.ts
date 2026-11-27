import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hoy, userKeyOf, guardarFoto, JORNADA_INCLUDE, toJornada } from '@/lib/marcacion/server';
import { EPP_ITEMS } from '@/lib/marcacion/shared';

/** El trabajador envía la foto de su equipo de seguridad al llegar al lugar. */
export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;
  try {
    const body = await request.json();
    const jornada = await prisma.jornada.findUnique({
      where: { userKey_fecha: { userKey: userKeyOf(session), fecha: hoy() } },
      include: { epps: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!jornada || jornada.estado !== 'EN_LUGAR') {
      return NextResponse.json({ error: 'Primero marcá la llegada al lugar' }, { status: 409 });
    }
    if (jornada.epps[0]?.estado === 'PENDIENTE') {
      return NextResponse.json({ error: 'Ya hay una foto esperando aprobación' }, { status: 409 });
    }
    let fotoUrl: string;
    try { fotoUrl = await guardarFoto(body.foto, 'epp'); }
    catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Foto inválida' }, { status: 400 }); }

    const declarado: Record<string, boolean> = {};
    for (const it of EPP_ITEMS) declarado[it.key] = body.declarado?.[it.key] === true;

    await prisma.verificacionEpp.create({ data: { jornadaId: jornada.id, fotoUrl, declarado } });
    const saved = await prisma.jornada.findUniqueOrThrow({ where: { id: jornada.id }, include: JORNADA_INCLUDE });
    return NextResponse.json({ ok: true, jornada: toJornada(saved) });
  } catch (e) {
    console.error('POST /api/marcacion/epp:', e);
    return NextResponse.json({ error: 'Error al enviar la foto' }, { status: 500 });
  }
}
