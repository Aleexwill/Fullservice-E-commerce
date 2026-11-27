import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { hoy, userKeyOf, userNameOf, getOficina, GEOFENCE_MODE, MAX_PRECISION_M, JORNADA_INCLUDE, toJornada } from '@/lib/marcacion/server';
import { verificarRostro, validarVector } from '@/lib/marcacion/face';
import { getParametros } from '@/lib/marcacion/config-server';
import { haversineM, TIPOS_MARCA, TIPOS_CON_ROSTRO, formatDist } from '@/lib/marcacion/shared';
import type { Estado, TipoMarca } from '@/lib/marcacion/shared';

// Máquina de estados: cada marca solo es válida desde un estado y lleva a otro.
// 'oficina' / 'destino' indican contra qué sitio se valida el radio (null = solo se registra el GPS).
type TipoFlujo = Exclude<TipoMarca, 'INICIO_ALMUERZO' | 'FIN_ALMUERZO'>;
const FLUJO: Record<TipoFlujo, { desde: Estado | null; hasta: Estado; sitio: 'oficina' | 'destino' | null }> = {
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

    const fecha = hoy();

    // Almuerzo: se puede marcar en cualquier momento de la jornada abierta, solo con GPS
    if (tipo === 'INICIO_ALMUERZO' || tipo === 'FIN_ALMUERZO') {
      const inicio = tipo === 'INICIO_ALMUERZO';
      const j = await prisma.jornada.findUnique({ where: { userKey_fecha: { userKey, fecha } } });
      if (!j || j.estado === 'CERRADA') return NextResponse.json({ error: 'No hay una jornada abierta' }, { status: 409 });
      if (j.enAlmuerzo === inicio) return NextResponse.json({ error: inicio ? 'Ya estás en almuerzo' : 'No estás en almuerzo' }, { status: 409 });
      const saved = await prisma.$transaction(async tx => {
        const upd = await tx.jornada.updateMany({ where: { id: j.id, enAlmuerzo: !inicio }, data: { enAlmuerzo: inicio } });
        if (upd.count === 0) throw new Error('CONFLICTO');
        await tx.marca.create({ data: { jornadaId: j.id, tipo, metodo: 'GPS', lat, lng, precisionM } });
        return tx.jornada.findUniqueOrThrow({ where: { id: j.id }, include: JORNADA_INCLUDE });
      });
      return NextResponse.json({ ok: true, jornada: toJornada(saved) });
    }

    const regla = FLUJO[tipo];
    let jornada = await prisma.jornada.findUnique({ where: { userKey_fecha: { userKey, fecha } } });

    if (regla.desde === null) {
      if (jornada) return NextResponse.json({ error: 'Ya marcaste el ingreso de hoy' }, { status: 409 });
    } else if (jornada?.enAlmuerzo) {
      return NextResponse.json({ error: 'Terminá el almuerzo antes de seguir' }, { status: 409 });
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

    // Rostro: en ingreso/salida el teléfono envía la huella facial (128 números, sin imagen) y se compara con la enrolada
    let rostroEstado: string | null = null;
    let rostroScore: number | null = null;
    if (TIPOS_CON_ROSTRO.includes(tipo)) {
      if (!rateLimit(`rostro:${userKey}`, 15, 10 * 60_000).allowed) return NextResponse.json({ error: 'Demasiados intentos de verificación. Esperá unos minutos o pedile ayuda al encargado.' }, { status: 429 });
      const vector = validarVector(body.rostro);
      if (!vector) return NextResponse.json({ error: 'Falta la verificación de rostro' }, { status: 400 });
      const params = await getParametros();
      const r = await verificarRostro(userKey, vector, params);
      if (r.estado === 'RECHAZADO') return NextResponse.json({ error: 'No pudimos confirmar que seas vos. Probá de nuevo con buena luz y de frente.', rostro: 'RECHAZADO' }, { status: 422 });
      if (r.estado === 'SIN_PLANTILLA' && params.rostroObligatorio) return NextResponse.json({ error: 'Todavía no tenés tu rostro enrolado. Pedile al administrador que lo registre.', rostro: 'SIN_PLANTILLA' }, { status: 422 });
      rostroEstado = r.estado; rostroScore = r.distancia;
    }

    const otRef = typeof body.otRef === 'string' ? body.otRef.trim().slice(0, 60) : '';
    const marcaData = { tipo, metodo: rostroEstado === 'VERIFICADO' || rostroEstado === 'DUDOSO' ? 'ROSTRO' : 'GPS', lat, lng, precisionM, distanciaM, fueraDeRango, sitioNombre: sitio?.nombre ?? '', rostroEstado, rostroScore };

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
