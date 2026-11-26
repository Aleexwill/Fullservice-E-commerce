// Pruebas de la medición y los límites de IA contra una base de datos real (usa DATABASE_URL).
// BORRA los registros de UsoIA y la configuración de IA: solo corre contra una base local. Uso: npm run test:ia
// Protección: estas pruebas borran datos; solo corren contra una base local salvo que se fuerce expresamente.
const url = process.env.DATABASE_URL ?? '';
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(url) && process.env.TEST_IA_FORZAR !== '1') {
  console.error('Se niega a correr: DATABASE_URL no es una base local. Estas pruebas BORRAN los registros de UsoIA y la configuración de IA. Usá una base de pruebas (o TEST_IA_FORZAR=1 si estás seguro).');
  process.exit(2);
}

import { prisma } from '../src/lib/prisma';
import { autorizarIA, medirIA } from '../src/lib/ia/uso';
import { depurarSiCorresponde } from '../src/lib/ia/depurar';
import { CONFIG_IA_DEFAULT, costoUsd, normalizarConfigIa } from '../src/lib/ia/config';
import type { IaConfig } from '../src/lib/ia/config';
import type { SessionPayload } from '../src/lib/auth';

let fallos = 0;
const eq = (nombre: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fallos++;
  console.log((ok ? 'OK    ' : 'FALLA ') + nombre + (ok ? '' : `  → obtuvo ${JSON.stringify(got)}, esperaba ${JSON.stringify(want)}`));
};
const sesion = (n: string): SessionPayload => ({ username: n, displayName: n, userId: `id-${n}`, role: 'admin' });
const guardar = (c: IaConfig) => prisma.iaConfig.upsert({ where: { id: 'default' }, create: { id: 'default', data: c as object }, update: { data: c as object } });
const conf = (f: (c: IaConfig) => void) => { const c = normalizarConfigIa(structuredClone(CONFIG_IA_DEFAULT)); f(c); return c; };
const estadoDe = async (r: Response | null) => (r ? { status: r.status, bloqueada: ((await r.json()) as { bloqueadaPorAdministracion?: boolean }).bloqueadaPorAdministracion === true } : null);
const limpiar = async () => { await prisma.usoIA.deleteMany({}); await prisma.iaConfig.deleteMany({}); };

(async () => {
  await limpiar();
  const ana = sesion('Ana'), beto = sesion('Beto');

  // --- configuración ---
  eq('config: valores inválidos se normalizan', normalizarConfigIa({ global: { limiteMensualLlamadas: -5, limiteMensualUsd: 'x' }, retencionDias: 2 }).global, { activo: true, limiteMensualLlamadas: null, limiteMensualUsd: null });
  eq('config: retención mínima de 7 días', normalizarConfigIa({ retencionDias: 2 }).retencionDias, 180);
  eq('costo: sin tarifa → null', costoUsd({}, 'm', 1000, 1000), null);
  eq('costo: 1M entrada a US$3 + 1M salida a US$15', costoUsd({ m: { entradaUsdPorMillon: 3, salidaUsdPorMillon: 15 } }, 'm', 1_000_000, 1_000_000), 18);

  // --- medición ---
  const v = await medirIA({ funcion: 'corregir-texto', proveedor: 'gemini', modelo: 'gem-x', session: ana }, async () => ({ valor: 'hola', tokensEntrada: 120, tokensSalida: 30 }));
  eq('medir: devuelve el valor', v, 'hola');
  const fila = await prisma.usoIA.findFirst({ orderBy: { createdAt: 'desc' } });
  eq('medir: registra tokens, usuario y estado', [fila?.tokensEntrada, fila?.tokensSalida, fila?.userName, fila?.estado, fila?.proveedor], [120, 30, 'Ana', 'OK', 'gemini']);

  let lanzo = false;
  try { await medirIA({ funcion: 'mejorar-titulo', proveedor: 'gemini', modelo: 'gem-x', session: ana }, async () => { throw new Error('fallo https://x/v1:generate?key=AIzaSyDUMMYDUMMYDUMMY123456&alt=json'); }); } catch { lanzo = true; }
  const err = await prisma.usoIA.findFirst({ where: { estado: 'ERROR' } });
  eq('medir: el error se vuelve a lanzar y se registra', [lanzo, err?.estado], [true, 'ERROR']);
  eq('medir: la clave NO queda guardada en el error', /AIza|DUMMY/.test(err?.error ?? ''), false);

  // --- autorización ---
  eq('sin configuración: permite', await autorizarIA('corregir-texto', ana), null);

  await guardar(conf(c => { c.global.activo = false; }));
  eq('interruptor global apagado → 503', await estadoDe(await autorizarIA('corregir-texto', ana)), { status: 503, bloqueada: true });
  eq('queda registrado como BLOQUEADA', await prisma.usoIA.count({ where: { estado: 'BLOQUEADA' } }), 1);

  await guardar(conf(c => { c.funciones['mejorar-titulo'].activo = false; }));
  eq('función apagada → bloquea esa función', await estadoDe(await autorizarIA('mejorar-titulo', ana)), { status: 503, bloqueada: true });
  eq('función apagada → las otras siguen', await autorizarIA('corregir-texto', ana), null);

  await prisma.usoIA.deleteMany({});
  const ok1 = (u: SessionPayload, funcion: 'corregir-texto' | 'presupuesto-ajustar' = 'corregir-texto', modelo = 'm1', ti = 1_000_000, to = 0) =>
    medirIA({ funcion, proveedor: 'gemini', modelo, session: u }, async () => ({ valor: 1, tokensEntrada: ti, tokensSalida: to }));

  await guardar(conf(c => { c.global.limiteMensualLlamadas = 2; }));
  await ok1(ana); await ok1(beto);
  eq('límite mensual global de llamadas (2) alcanzado → 429', await estadoDe(await autorizarIA('corregir-texto', ana)), { status: 429, bloqueada: true });

  await prisma.usoIA.deleteMany({});
  await guardar(conf(c => { c.global.limiteMensualUsd = 5; c.tarifas.m1 = { entradaUsdPorMillon: 3, salidaUsdPorMillon: 0 }; }));
  await ok1(ana);                                  // 1M tokens × US$3 = US$3
  eq('gasto US$3 de US$5: permite', await autorizarIA('corregir-texto', ana), null);
  await ok1(ana);                                  // US$6
  eq('gasto US$6 de US$5: bloquea', await estadoDe(await autorizarIA('corregir-texto', ana)), { status: 429, bloqueada: true });
  await prisma.usoIA.deleteMany({});
  await ok1(ana, 'corregir-texto', 'sin-tarifa', 9_000_000);
  eq('un modelo sin tarifa no suma al gasto', await autorizarIA('corregir-texto', ana), null);

  await prisma.usoIA.deleteMany({});
  await guardar(conf(c => { c.funciones['presupuesto-ajustar'].limiteMensualLlamadas = 1; }));
  await ok1(ana, 'presupuesto-ajustar');
  eq('límite mensual de la función (1) → bloquea la función', await estadoDe(await autorizarIA('presupuesto-ajustar', beto)), { status: 429, bloqueada: true });
  eq('…pero no las otras funciones', await autorizarIA('corregir-texto', beto), null);

  await prisma.usoIA.deleteMany({});
  await guardar(conf(c => { c.funciones['corregir-texto'].limiteDiarioPorUsuario = 2; }));
  await ok1(ana); await ok1(ana);
  eq('límite diario por usuario (2): Ana bloqueada', await estadoDe(await autorizarIA('corregir-texto', ana)), { status: 429, bloqueada: true });
  eq('límite diario por usuario: Beto no', await autorizarIA('corregir-texto', beto), null);

  // las llamadas con error o bloqueadas no cuentan contra el límite
  await prisma.usoIA.deleteMany({});
  await guardar(conf(c => { c.global.limiteMensualLlamadas = 1; }));
  try { await medirIA({ funcion: 'corregir-texto', proveedor: 'gemini', modelo: 'm1', session: ana }, async () => { throw new Error('x'); }); } catch { /* esperado */ }
  eq('una llamada con error no consume el límite', await autorizarIA('corregir-texto', ana), null);


  // --- depuración automática ---
  await limpiar();
  const hace = (d: number) => new Date(Date.now() - d * 86_400_000);
  const viejo = (d: number) => prisma.usoIA.create({ data: { funcion: 'corregir-texto', proveedor: 'gemini', modelo: 'm', userName: 'x', estado: 'OK', createdAt: hace(d) } });
  const ultimaHace = (h: number) => prisma.$executeRaw`UPDATE "IaConfig" SET data = jsonb_set(data, '{depuracion,ultima}', to_jsonb((now() - make_interval(hours => ${h}::int))::text)) WHERE id = 'default'`;
  await viejo(400); await viejo(200); await viejo(10);
  const d1 = await depurarSiCorresponde();
  eq('depuración: borra solo lo anterior a 180 días', [d1.ejecutada, d1.borrados, await prisma.usoIA.count()], [true, 2, 1]);
  const cfgD = await prisma.iaConfig.findUnique({ where: { id: 'default' } });
  const dep = (cfgD?.data as { depuracion?: { ultima?: string; borrados?: number } })?.depuracion;
  eq('depuración: queda registrada la fecha y la cantidad', [typeof dep?.ultima, dep?.borrados], ['string', 2]);
  eq('depuración: no se repite dentro de las 24 h', (await depurarSiCorresponde()).ejecutada, false);
  await ultimaHace(25); await viejo(300);
  const d3 = await depurarSiCorresponde();
  eq('depuración: a las 25 h vuelve a correr', [d3.ejecutada, d3.borrados], [true, 1]);
  await guardar(conf(c => { c.retencionDias = 30; }));
  await viejo(40); await viejo(5);
  const d4 = await depurarSiCorresponde();
  eq('depuración: respeta la retención configurada (30 días)', [d4.ejecutada, d4.borrados, await prisma.usoIA.count()], [true, 1, 2]);
  await ultimaHace(48); await viejo(90);
  const simultaneas = await Promise.all([1, 2, 3, 4, 5].map(() => depurarSiCorresponde()));
  eq('depuración: con 5 intentos simultáneos solo uno la ejecuta', simultaneas.filter(x => x.ejecutada).length, 1);
  await ultimaHace(30); await viejo(500);
  await medirIA({ funcion: 'corregir-texto', proveedor: 'gemini', modelo: 'm', session: ana }, async () => ({ valor: 1, tokensEntrada: 1, tokensSalida: 1 }));
  eq('depuración: se dispara sola al registrar una llamada de IA', await prisma.usoIA.count({ where: { createdAt: { lt: hace(30) } } }), 0);

  await limpiar();
  console.log(fallos === 0 ? '\nTodo OK' : `\n${fallos} FALLO(S)`);
  await prisma.$disconnect();
  process.exit(fallos === 0 ? 0 : 1);
})().catch(async e => { console.error(e); await prisma.$disconnect(); process.exit(1); });
