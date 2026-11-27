// Monitoreo de solo lectura de la base de datos (PostgreSQL). Nunca ejecuta SQL que venga del usuario.
import { prisma } from '@/lib/prisma';
import { hoy } from '@/lib/marcacion/server';

export interface TiParams {
  limiteMb: number;        // tope del plan (Neon gratuito: 512 MB)
  alertaPct: number;       // aviso
  criticoPct: number;      // crítico
  maxConexiones: number;   // tope de conexiones del plan
}
export const TI_PARAMS_DEFAULT: TiParams = { limiteMb: 512, alertaPct: 80, criticoPct: 90, maxConexiones: 100 };

export function normalizarParams(raw: unknown): TiParams {
  const r = (raw ?? {}) as Partial<Record<keyof TiParams, unknown>>;
  const n = (v: unknown, d: number, min: number, max: number) => (typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : d);
  const p: TiParams = {
    limiteMb: n(r.limiteMb, TI_PARAMS_DEFAULT.limiteMb, 1, 10_000_000),
    alertaPct: n(r.alertaPct, TI_PARAMS_DEFAULT.alertaPct, 1, 99),
    criticoPct: n(r.criticoPct, TI_PARAMS_DEFAULT.criticoPct, 2, 100),
    maxConexiones: n(r.maxConexiones, TI_PARAMS_DEFAULT.maxConexiones, 1, 100_000),
  };
  if (p.criticoPct <= p.alertaPct) { p.alertaPct = TI_PARAMS_DEFAULT.alertaPct; p.criticoPct = TI_PARAMS_DEFAULT.criticoPct; }
  return p;
}

export async function leerParams(): Promise<TiParams> {
  const c = await prisma.tiConfig.findUnique({ where: { id: 'default' } });
  return normalizarParams(c?.data);
}
export async function guardarParams(p: TiParams) {
  await prisma.tiConfig.upsert({ where: { id: 'default' }, create: { id: 'default', data: p as object }, update: { data: p as object } });
}

export interface TablaInfo { tabla: string; bytes: number; tablaBytes: number; indiceBytes: number; filas: number; muertas: number; ultimaLimpieza: string | null }
export interface IndiceSinUso { tabla: string; indice: string; bytes: number }
export interface MigracionInfo { nombre: string; terminada: boolean; fecha: string | null }
export interface Alerta { nivel: 'critica' | 'aviso'; titulo: string; detalle: string }

export interface EstadoDb {
  version: string;
  totalBytes: number;
  limiteBytes: number;
  usoPct: number;
  tablas: TablaInfo[];
  conexiones: { total: number; activas: number; inactivas: number; enTransaccionInactiva: number; max: number; consultaMasLargaSeg: number | null };
  cacheHitPct: number | null;
  indicesSinUso: IndiceSinUso[];
  migraciones: { total: number; fallidas: MigracionInfo[]; ultima: MigracionInfo | null };
  alertas: Alerta[];
  params: TiParams;
}

const num = (v: unknown) => Number(v ?? 0);

export async function leerEstadoDb(): Promise<EstadoDb> {
  const params = await leerParams();
  const [ver, tablasRaw, conn, cache, idx, mig] = await Promise.all([
    prisma.$queryRaw<{ v: string }[]>`SELECT version() AS v`,
    prisma.$queryRaw<{ tabla: string; total: bigint; tbl: bigint; idx: bigint; filas: bigint; muertas: bigint; limpieza: Date | null }[]>`
      SELECT c.relname AS tabla, pg_total_relation_size(c.oid) AS total, pg_relation_size(c.oid) AS tbl, pg_indexes_size(c.oid) AS idx,
             COALESCE(s.n_live_tup, 0) AS filas, COALESCE(s.n_dead_tup, 0) AS muertas,
             GREATEST(s.last_autovacuum, s.last_vacuum) AS limpieza
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
      WHERE n.nspname = 'public' AND c.relkind = 'r' ORDER BY total DESC`,
    prisma.$queryRaw<{ total: bigint; activas: bigint; inactivas: bigint; idle_tx: bigint; max_seg: number | null; maxc: number }[]>`
      SELECT count(*) AS total,
             count(*) FILTER (WHERE state = 'active') AS activas,
             count(*) FILTER (WHERE state = 'idle') AS inactivas,
             count(*) FILTER (WHERE state LIKE 'idle in transaction%') AS idle_tx,
             max(EXTRACT(EPOCH FROM (now() - query_start))) FILTER (WHERE state = 'active' AND pid <> pg_backend_pid()) AS max_seg,
             current_setting('max_connections')::int AS maxc
      FROM pg_stat_activity WHERE datname = current_database()`,
    prisma.$queryRaw<{ pct: number | null }[]>`
      SELECT CASE WHEN sum(heap_blks_hit + heap_blks_read) = 0 THEN NULL
                  ELSE round(100.0 * sum(heap_blks_hit) / sum(heap_blks_hit + heap_blks_read), 1)::float END AS pct
      FROM pg_statio_user_tables`,
    prisma.$queryRaw<{ tabla: string; indice: string; bytes: bigint }[]>`
      SELECT s.relname AS tabla, s.indexrelname AS indice, pg_relation_size(s.indexrelid) AS bytes
      FROM pg_stat_user_indexes s JOIN pg_index i ON i.indexrelid = s.indexrelid
      WHERE s.idx_scan = 0 AND NOT i.indisunique AND NOT i.indisprimary AND s.schemaname = 'public'
      ORDER BY bytes DESC LIMIT 15`,
    prisma.$queryRaw<{ nombre: string; fin: Date | null; ini: Date }[]>`
      SELECT migration_name AS nombre, finished_at AS fin, started_at AS ini FROM _prisma_migrations ORDER BY started_at DESC`.catch(() => []),
  ]);

  const tablas: TablaInfo[] = tablasRaw.map(t => ({
    tabla: t.tabla, bytes: num(t.total), tablaBytes: num(t.tbl), indiceBytes: num(t.idx),
    filas: num(t.filas), muertas: num(t.muertas), ultimaLimpieza: t.limpieza ? t.limpieza.toISOString() : null,
  }));
  const totalBytes = tablas.reduce((s, t) => s + t.bytes, 0);
  const limiteBytes = params.limiteMb * 1024 * 1024;
  const usoPct = Math.round((totalBytes / limiteBytes) * 1000) / 10;
  const c = conn[0];
  const conexiones = {
    total: num(c?.total), activas: num(c?.activas), inactivas: num(c?.inactivas), enTransaccionInactiva: num(c?.idle_tx),
    max: Math.min(num(c?.maxc) || params.maxConexiones, params.maxConexiones),
    consultaMasLargaSeg: c?.max_seg == null ? null : Math.round(Number(c.max_seg)),
  };
  const fallidas = mig.filter(m => !m.fin).map(m => ({ nombre: m.nombre, terminada: false, fecha: m.ini.toISOString() }));
  const ult = mig.find(m => m.fin);
  const migraciones = { total: mig.length, fallidas, ultima: ult ? { nombre: ult.nombre, terminada: true, fecha: ult.fin!.toISOString() } : null };

  const alertas: Alerta[] = [];
  const mb = (b: number) => `${(b / 1048576).toFixed(1)} MB`;
  if (usoPct >= params.criticoPct) alertas.push({ nivel: 'critica', titulo: `Base de datos al ${usoPct}% del límite`, detalle: `${mb(totalBytes)} de ${params.limiteMb} MB. Hay que depurar datos o ampliar el plan.` });
  else if (usoPct >= params.alertaPct) alertas.push({ nivel: 'aviso', titulo: `Base de datos al ${usoPct}% del límite`, detalle: `${mb(totalBytes)} de ${params.limiteMb} MB.` });
  if (fallidas.length) alertas.push({ nivel: 'critica', titulo: 'Migración fallida', detalle: `${fallidas.map(f => f.nombre).join(', ')}. Resolver antes de seguir desplegando.` });
  if (conexiones.enTransaccionInactiva > 0) alertas.push({ nivel: 'aviso', titulo: 'Conexiones en transacción inactiva', detalle: `${conexiones.enTransaccionInactiva} conexión(es) abiertas sin terminar su transacción.` });
  if (conexiones.max > 0 && conexiones.total / conexiones.max >= 0.8) alertas.push({ nivel: 'aviso', titulo: 'Muchas conexiones abiertas', detalle: `${conexiones.total} de ${conexiones.max}.` });
  if (conexiones.consultaMasLargaSeg != null && conexiones.consultaMasLargaSeg >= 30) alertas.push({ nivel: 'aviso', titulo: 'Consulta lenta en curso', detalle: `Una consulta lleva ${conexiones.consultaMasLargaSeg} s ejecutándose.` });
  const hinchadas = tablas.filter(t => t.muertas >= 1000 && t.muertas > t.filas * 0.5);
  if (hinchadas.length) alertas.push({ nivel: 'aviso', titulo: 'Tablas con muchas filas muertas', detalle: hinchadas.map(t => `${t.tabla} (${t.muertas})`).join(', ') + '. PostgreSQL las limpia solo; avisar si persiste.' });

  return { version: (ver[0]?.v ?? '').split(' ').slice(0, 2).join(' '), totalBytes, limiteBytes, usoPct, tablas, conexiones,
    cacheHitPct: cache[0]?.pct ?? null, indicesSinUso: idx.map(i => ({ tabla: i.tabla, indice: i.indice, bytes: num(i.bytes) })), migraciones, alertas, params };
}

/** Guarda el punto del día si todavía no existe. Atómico: varias aperturas simultáneas generan un solo registro. */
export async function registrarSnapshotDelDia(tablas: TablaInfo[], totalBytes: number): Promise<void> {
  const fecha = hoy();
  const data = JSON.stringify(tablas.map(t => ({ tabla: t.tabla, bytes: t.bytes, filas: t.filas })));
  await prisma.$executeRaw`
    INSERT INTO "DbSnapshot" (id, fecha, "totalBytes", tablas, "createdAt")
    VALUES (gen_random_uuid()::text, ${fecha}, ${BigInt(totalBytes)}, ${data}::jsonb, now())
    ON CONFLICT (fecha) DO NOTHING`;
}

export interface PuntoCrecimiento { fecha: string; bytes: number }
export async function leerCrecimiento(dias = 90): Promise<{ puntos: PuntoCrecimiento[]; bytesPorDia: number | null; diasHastaLimite: number | null }> {
  const rows = await prisma.dbSnapshot.findMany({ orderBy: { fecha: 'desc' }, take: dias, select: { fecha: true, totalBytes: true } });
  const puntos = rows.reverse().map(r => ({ fecha: r.fecha, bytes: Number(r.totalBytes) }));
  let bytesPorDia: number | null = null;
  if (puntos.length >= 2) {
    const a = puntos[0], b = puntos[puntos.length - 1];
    const d = (Date.parse(b.fecha) - Date.parse(a.fecha)) / 86_400_000;
    if (d >= 1) bytesPorDia = Math.round((b.bytes - a.bytes) / d);
  }
  return { puntos, bytesPorDia, diasHastaLimite: null };
}

export function proyectarDias(bytesPorDia: number | null, totalBytes: number, limiteBytes: number): number | null {
  if (!bytesPorDia || bytesPorDia <= 0) return null;
  return Math.max(0, Math.floor((limiteBytes - totalBytes) / bytesPorDia));
}
