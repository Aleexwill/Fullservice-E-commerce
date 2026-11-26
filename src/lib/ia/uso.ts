import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { GenerativeModel } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';
import type { SessionPayload } from '@/lib/auth';
import { generateWithUsage } from '@/lib/gemini';
import { costoUsd, FUNCIONES_IA, getConfigIa } from './config';
import { depurarSiCorresponde } from './depurar';
import type { FuncionIA, FuncionRegistro, ProveedorIA } from './config';

/** Quién hace la llamada: la sesión del admin. Si no hay (no debería ocurrir), se registra como anónimo. */
export async function sesionActual(): Promise<SessionPayload | null> {
  try { return await verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value); } catch { return null; }
}

// Los límites mensuales y diarios se cuentan por calendario de Paraguay (America/Asuncion, UTC-3 fijo), no por UTC
const hoyAsuncion = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Asuncion' }).format(new Date());
const inicioMes = () => new Date(`${hoyAsuncion().slice(0, 7)}-01T00:00:00-03:00`);
const inicioDia = () => new Date(`${hoyAsuncion()}T00:00:00-03:00`);

async function registrar(d: {
  funcion: FuncionRegistro; proveedor: ProveedorIA | ''; modelo: string; session: SessionPayload | null; tokensEntrada?: number; tokensSalida?: number; ms?: number; estado: 'OK' | 'ERROR' | 'BLOQUEADA'; error?: string;
}) {
  try {
    await prisma.usoIA.create({
      data: {
        funcion: d.funcion, proveedor: d.proveedor, modelo: d.modelo, userId: d.session?.userId ?? null, userName: d.session?.displayName ?? d.session?.username ?? '',
        tokensEntrada: d.tokensEntrada ?? 0, tokensSalida: d.tokensSalida ?? 0, ms: d.ms ?? 0, estado: d.estado, error: (d.error ?? '').slice(0, 300),
      },
    });
  } catch (e) {
    console.error('[ia] no se pudo registrar el uso:', e instanceof Error ? e.message : e);
  }
  await depurarSiCorresponde(); // como máximo una vez por día; nunca lanza
}

/**
 * Antes de llamar a la IA: aplica el interruptor global, el de la funcionalidad y los límites configurados.
 * Devuelve una respuesta HTTP si está bloqueada (y la registra), o null si puede continuar.
 * Si la medición falla (base de datos caída) NO bloquea: la IA sigue disponible.
 */
export async function autorizarIA(funcion: FuncionIA, session: SessionPayload | null): Promise<NextResponse | null> {
  try {
    const cfg = await getConfigIa();
    const bloquear = async (mensaje: string, status: number) => {
      await registrar({ funcion, proveedor: '', modelo: '', session, estado: 'BLOQUEADA', error: mensaje });
      return NextResponse.json({ error: mensaje, bloqueadaPorAdministracion: true }, { status });
    };
    if (!cfg.global.activo) return bloquear('La IA está desactivada por administración.', 503);
    const f = cfg.funciones[funcion];
    if (!f.activo) return bloquear(`La función «${FUNCIONES_IA[funcion].label}» está desactivada por administración.`, 503);

    const mes = inicioMes();
    if (cfg.global.limiteMensualLlamadas !== null || cfg.global.limiteMensualUsd !== null) {
      const filas = await prisma.usoIA.groupBy({ by: ['modelo'], where: { createdAt: { gte: mes }, estado: 'OK' }, _count: { _all: true }, _sum: { tokensEntrada: true, tokensSalida: true } });
      const llamadas = filas.reduce((s, x) => s + x._count._all, 0);
      if (cfg.global.limiteMensualLlamadas !== null && llamadas >= cfg.global.limiteMensualLlamadas) return bloquear('Se alcanzó el límite mensual de llamadas de IA.', 429);
      if (cfg.global.limiteMensualUsd !== null) {
        const gasto = filas.reduce((s, x) => s + (costoUsd(cfg.tarifas, x.modelo, x._sum.tokensEntrada ?? 0, x._sum.tokensSalida ?? 0) ?? 0), 0);
        if (gasto >= cfg.global.limiteMensualUsd) return bloquear('Se alcanzó el límite mensual de gasto de IA.', 429);
      }
    }
    if (f.limiteMensualLlamadas !== null) {
      const n = await prisma.usoIA.count({ where: { funcion, createdAt: { gte: mes }, estado: 'OK' } });
      if (n >= f.limiteMensualLlamadas) return bloquear(`Se alcanzó el límite mensual de «${FUNCIONES_IA[funcion].label}».`, 429);
    }
    if (f.limiteDiarioPorUsuario !== null && session) {
      const n = await prisma.usoIA.count({ where: { funcion, createdAt: { gte: inicioDia() }, estado: 'OK', userName: session.displayName ?? session.username } });
      if (n >= f.limiteDiarioPorUsuario) return bloquear(`Alcanzaste tu límite diario de «${FUNCIONES_IA[funcion].label}». Probá mañana.`, 429);
    }
  } catch (e) {
    console.error('[ia] no se pudo verificar los límites (se permite la llamada):', e instanceof Error ? e.message : e);
  }
  return null;
}

/** Ejecuta una llamada a un proveedor midiendo tiempo y tokens. Registra éxito o error y vuelve a lanzar el error. */
export async function medirIA<T>(
  ctx: { funcion: FuncionRegistro; proveedor: ProveedorIA; modelo: string; session: SessionPayload | null },
  fn: () => Promise<{ valor: T; tokensEntrada?: number; tokensSalida?: number }>,
): Promise<T> {
  const t0 = Date.now();
  try {
    const r = await fn();
    await registrar({ ...ctx, tokensEntrada: r.tokensEntrada, tokensSalida: r.tokensSalida, ms: Date.now() - t0, estado: 'OK' });
    return r.valor;
  } catch (e) {
    // El mensaje de error del proveedor puede traer la URL con la clave: se limpia antes de guardarlo
    const msg = (e instanceof Error ? e.message : String(e)).replace(/key=[^&\s"']+/gi, 'key=***').replace(/(sk-|AIza)[\w-]{6,}/g, '***');
    await registrar({ ...ctx, ms: Date.now() - t0, estado: 'ERROR', error: msg });
    throw e;
  }
}

/** Gemini por SDK con medición: reemplaza a generateWithRetry en los endpoints. */
export function generarConGemini(
  ctx: { funcion: FuncionRegistro; modelo: string; session: SessionPayload | null },
  model: GenerativeModel, parts: unknown,
): Promise<string> {
  return medirIA({ ...ctx, proveedor: 'gemini' }, async () => {
    const r = await generateWithUsage(model, parts);
    return { valor: r.text, tokensEntrada: r.tokensEntrada, tokensSalida: r.tokensSalida };
  });
}
