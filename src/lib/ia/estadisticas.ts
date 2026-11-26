import { prisma } from '@/lib/prisma';
import { costoUsd, FUNCIONES_IA, getConfigIa, PROVEEDORES } from './config';
import type { ProveedorIA } from './config';
import { GEMINI_MODEL_ID } from '@/lib/gemini';

export interface ProveedorEstado { id: ProveedorIA; nombre: string; configurado: boolean; modelo: string }

/** Estado de las claves: solo si están configuradas. Nunca se expone su valor. */
export function estadoProveedores(): ProveedorEstado[] {
  const gemini = process.env.GEMINI_API_KEY;
  const openai = process.env.OPENAI_API_KEY;
  return [
    { id: 'gemini', nombre: PROVEEDORES.gemini, configurado: !!gemini && gemini.length > 10, modelo: GEMINI_MODEL_ID },
    { id: 'anthropic', nombre: PROVEEDORES.anthropic, configurado: !!process.env.ANTHROPIC_API_KEY, modelo: 'claude-haiku-4-5' },
    { id: 'openai', nombre: PROVEEDORES.openai, configurado: !!openai && openai !== 'sk-YOUR-KEY-HERE', modelo: 'gpt-4o-mini' },
  ];
}

const rango = (mes: string) => {
  const [y, m] = mes.split('-').map(Number);
  const sig = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
  return { desde: new Date(`${mes}-01T00:00:00-03:00`), hasta: new Date(`${sig}-01T00:00:00-03:00`) };
};

export interface Panel {
  mes: string;
  proveedores: ProveedorEstado[];
  total: { llamadas: number; errores: number; bloqueadas: number; tokensEntrada: number; tokensSalida: number; costoUsd: number | null; costoParcial: boolean; msPromedio: number };
  porFuncion: { funcion: string; label: string; llamadas: number; errores: number; tokensEntrada: number; tokensSalida: number }[];
  porModelo: { modelo: string; proveedor: string; llamadas: number; tokensEntrada: number; tokensSalida: number; costoUsd: number | null }[];
  porUsuario: { usuario: string; llamadas: number; tokens: number }[];
  porDia: { dia: string; llamadas: number; errores: number }[];
  config: Awaited<ReturnType<typeof getConfigIa>>;
}

/** Consumo de IA de un mes (YYYY-MM). El costo es una estimación y solo cuenta modelos con tarifa cargada. */
export async function panelIA(mes: string): Promise<Panel> {
  const { desde, hasta } = rango(mes);
  const where = { createdAt: { gte: desde, lt: hasta } };
  const [config, estados, porFuncionRaw, porModeloRaw, porUsuarioRaw, ms, dias] = await Promise.all([
    getConfigIa(),
    prisma.usoIA.groupBy({ by: ['estado'], where, _count: { _all: true } }),
    prisma.usoIA.groupBy({ by: ['funcion', 'estado'], where, _count: { _all: true }, _sum: { tokensEntrada: true, tokensSalida: true } }),
    prisma.usoIA.groupBy({ by: ['modelo', 'proveedor'], where: { ...where, estado: 'OK' }, _count: { _all: true }, _sum: { tokensEntrada: true, tokensSalida: true } }),
    prisma.usoIA.groupBy({ by: ['userName'], where: { ...where, estado: 'OK' }, _count: { _all: true }, _sum: { tokensEntrada: true, tokensSalida: true }, orderBy: { _count: { userName: 'desc' } }, take: 10 }),
    prisma.usoIA.aggregate({ where: { ...where, estado: 'OK' }, _avg: { ms: true } }),
    prisma.$queryRaw<{ dia: string; llamadas: bigint; errores: bigint }[]>`
      SELECT to_char(("createdAt" AT TIME ZONE 'America/Asuncion')::date, 'YYYY-MM-DD') AS dia,
             COUNT(*) FILTER (WHERE estado = 'OK') AS llamadas, COUNT(*) FILTER (WHERE estado = 'ERROR') AS errores
      FROM "UsoIA" WHERE "createdAt" >= ${desde} AND "createdAt" < ${hasta} GROUP BY 1 ORDER BY 1`,
  ]);

  const cuenta = (e: string) => estados.find(x => x.estado === e)?._count._all ?? 0;
  const modelos = porModeloRaw.map(m => ({
    modelo: m.modelo, proveedor: m.proveedor, llamadas: m._count._all, tokensEntrada: m._sum.tokensEntrada ?? 0, tokensSalida: m._sum.tokensSalida ?? 0,
    costoUsd: costoUsd(config.tarifas, m.modelo, m._sum.tokensEntrada ?? 0, m._sum.tokensSalida ?? 0),
  }));
  const conCosto = modelos.filter(m => m.costoUsd !== null);
  const funciones = new Map<string, Panel['porFuncion'][number]>();
  for (const f of porFuncionRaw) {
    const x = funciones.get(f.funcion) ?? { funcion: f.funcion, label: f.funcion in FUNCIONES_IA ? FUNCIONES_IA[f.funcion as keyof typeof FUNCIONES_IA].label : f.funcion === 'prueba' ? 'Prueba de conexión' : f.funcion, llamadas: 0, errores: 0, tokensEntrada: 0, tokensSalida: 0 };
    if (f.estado === 'OK') { x.llamadas += f._count._all; x.tokensEntrada += f._sum.tokensEntrada ?? 0; x.tokensSalida += f._sum.tokensSalida ?? 0; }
    if (f.estado === 'ERROR') x.errores += f._count._all;
    funciones.set(f.funcion, x);
  }
  return {
    mes, proveedores: estadoProveedores(), config,
    total: {
      llamadas: cuenta('OK'), errores: cuenta('ERROR'), bloqueadas: cuenta('BLOQUEADA'),
      tokensEntrada: modelos.reduce((s, m) => s + m.tokensEntrada, 0), tokensSalida: modelos.reduce((s, m) => s + m.tokensSalida, 0),
      costoUsd: conCosto.length ? conCosto.reduce((s, m) => s + (m.costoUsd ?? 0), 0) : null, costoParcial: conCosto.length < modelos.length,
      msPromedio: Math.round(ms._avg.ms ?? 0),
    },
    porFuncion: [...funciones.values()].sort((a, b) => b.llamadas - a.llamadas),
    porModelo: modelos.sort((a, b) => b.llamadas - a.llamadas),
    porUsuario: porUsuarioRaw.map(u => ({ usuario: u.userName || 'Sin identificar', llamadas: u._count._all, tokens: (u._sum.tokensEntrada ?? 0) + (u._sum.tokensSalida ?? 0) })),
    porDia: dias.map(d => ({ dia: d.dia, llamadas: Number(d.llamadas), errores: Number(d.errores) })),
  };
}
