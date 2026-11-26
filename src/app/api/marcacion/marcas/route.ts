import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { hoy, userKeyOf, userNameOf, getOficina, guardarFoto, GEOFENCE_MODE, MAX_PRECISION_M, JORNADA_INCLUDE, toJornada } from '@/lib/marcacion/server';
import { verificarRostro } from '@/lib/marcacion/face';
import { haversineM, TIPOS_MARCA, TIPOS_CON_ROSTRO, formatDist } from '@/lib/marcacion/shared';
import type { Estado, TipoMarca } from '@/lib/marcacion/shared';

// Máquina de estados: cada marca solo es válida desde un estado y lleva a otro.
// 'oficina' / 'destino' indican contra qué sitio se valida el radio (null = solo se registra el GPS).
const FLUJO: Record<TipoMarca, { desde: Estado | null; hasta: Estado; sitio: 'oficina' | 'destino' | null }> = {
  INGRESO: { desde: null, hasta: 'EN_OFICINA', sitio: 'oficina' },
  TRASLADO_IDA: { desde: 'EN_OFICINA', hasta: 'EN_TRASLADO_IDA', sitio: null },
  LLEGADA_LUGAR: { desde: 'EN_TRASLADO_IDA', hasta: 'EN_LUGAR', sitio: 'destino' },
  SALIDA_LUGAR: { desde: 'TRABAJANDO', hasta: 'EN_TRASLADO_VUELTA', sitio: null },
  LLEGADA_OFICINA: { desde: 'EN_TRASLADO_VUELTA', hasta: 'EN_OFICINA_FIN', sitio: 'oficina' },
  SALIDA: { desde: 'EN_OFICINA_FIN', hasta: 'CERRADA', sitio: 'oficina' },
};

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  const userKey = userKeyOf(session);
  if (!rateLimit(`marca:${userKey}`, 30, 60_000).allowed) {
    return NextResponse.json({ error: 'Demasiados intentos, esperá un momento' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const tipo = body?.tipo as TipoMarca;
    if (!TIPOS_MARCA.includes(tipo)) return NextResponse.json({ error: 'Tipo de marca inválido' }, { status: 400 });
    const lat = num(body.lat), lng = num(body.lng);
    if (lat === null || lng === null || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return NextResponse.json({ error: 'No se recibió la ubicación GPS' }, { status: 400 });
    }
    const precisionM = num(body.precisionM);
    if (precisionM !== null && precisionM > MAX_PRECISION_M) {
      return NextResponse.json({ error: `La precisión del GPS es baja (±${Math.round(precisionM)} m). Salí a un lugar abierto e intentá de nuevo.` }, { status: 422 });
    }

    const regla = FLUJO[tipo];
    const fecha = hoy();
    let jornada = await prisma.jornada.findUnique({ where: { userKey_fecha: { userKey, fecha } } });

    if (regla.desde === null) {
      if (jornada) return NextResponse.json({ error: 'Ya marcaste el ingreso de hoy' }, { status: 409 });
    } else if (!jornada || jornada.estado !== regla.desde) {
      return NextResponse.json({ error: 'Esta marca no corresponde al paso actual', estado: jornada?.estado ?? null }, { status: 409 });
    }

    // Sitio contra el que se valida el radio
    let sitio: { id: string; nombre: string; lat: number; lng: number; radioM: number } | null = null;
    let sitioId = jornada?.sitioId ?? null;
    if (tipo === 'TRASLADO_IDA') {
      if (typeof body.sitioId !== 'string') return NextResponse.json({ error: 'Elegí el lugar de trabajo' }, { status: 400 });
      const destino = await prisma.sitio.findFirst({ where: { id: body.sitioId, tipo: 'OBRA', isActive: true } });
      if (!destino) return NextResponse.json({ error: 'Lugar de trabajo no encontrado' }, { status: 404 });
      sitioId = destino.id;
      sitio = destino;
    } else if (regla.sitio === 'oficina') {
      sitio = await getOficina();
      if (!sitio) return NextResponse.json({ error: 'No hay una oficina configurada. Pedile al administrador que la cargue en Sitios.' }, { status: 409 });
    } else if (regla.sitio === 'destino') {
      sitio = sitioId ? await prisma.sitio.findUnique({ where: { id: sitioId } }) : null;
      if (!sitio) return NextResponse.json({ error: 'La jornada no tiene lugar de destino' }, { status: 409 });
    } else if (sitioId) {
      sitio = await prisma.sitio.findUnique({ where: { id: sitioId } });
    }

    // Radio: se calcula en el servidor, no se confía en el cliente
    let distanciaM: number | null = null;
    let fueraDeRango = false;
    if (sitio && tipo !== 'TRASLADO_IDA') {
      distanciaM = haversineM({ lat, lng }, sitio);
      if (regla.sitio && distanciaM > sitio.radioM) {
        if (GEOFENCE_MODE === 'strict') {
          return NextResponse.json({ error: `Estás a ${formatDist(distanciaM)} de ${sitio.nombre}. Acercate a menos de ${sitio.radioM} m.`, distanciaM }, { status: 422 });
        }
        fueraDeRango = true;
      }
    }

    // Rostro: selfie obligatoria en ingreso/salida
    let fotoUrl: string | null = null;
    let rostroScore: number | null = null;
    if (TIPOS_CON_ROSTRO.includes(tipo)) {
      try { fotoUrl = await guardarFoto(body.foto, 'rostro'); }
      catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Foto inválida' }, { status: 400 }); }
      const r = await verificarRostro(userKey, fotoUrl);
      if (!r.ok) return NextResponse.json({ error: 'No pudimos verificar tu rostro. Intentá de nuevo con buena luz.' }, { status: 422 });
      rostroScore = r.score;
    }

    const otRef = typeof body.otRef === 'string' ? body.otRef.trim().slice(0, 60) : '';
    const marcaData = { tipo, metodo: fotoUrl ? 'ROSTRO' : 'GPS', lat, lng, precisionM, distanciaM, fueraDeRango, sitioNombre: sitio?.nombre ?? '', fotoUrl, rostroScore };

    const saved = await prisma.$transaction(async tx => {
      if (!jornada) {
        jornada = await tx.jornada.create({ data: { userKey, userName: userNameOf(session), fecha, estado: regla.hasta } });
      } else {
        // updateMany con el estado esperado evita doble marca por doble toque / carrera
        const upd = await tx.jornada.updateMany({
          where: { id: jornada.id, estado: regla.desde! },
          data: { estado: regla.hasta, ...(tipo === 'TRASLADO_IDA' ? { sitioId, sitioNombre: sitio!.nombre, otRef } : {}) },
        });
        if (upd.count === 0) throw new Error('CONFLICTO');
      }
      await tx.marca.create({ data: { jornadaId: jornada.id, ...marcaData } });
      return tx.jornada.findUniqueOrThrow({ where: { id: jornada.id }, include: JORNADA_INCLUDE });
    });

    return NextResponse.json({ ok: true, jornada: toJornada(saved) });
  } catch (e) {
    if (e instanceof Error && e.message === 'CONFLICTO') return NextResponse.json({ error: 'La marca ya fue registrada' }, { status: 409 });
    if ((e as { code?: string })?.code === 'P2002') return NextResponse.json({ error: 'Ya marcaste el ingreso de hoy' }, { status: 409 });
    console.error('POST /api/marcacion/marcas:', e);
    return NextResponse.json({ error: 'Error al registrar la marca' }, { status: 500 });
  }
}
