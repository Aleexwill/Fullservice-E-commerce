// Pruebas del motor de planilla (cálculos verificados a mano). Ejecutar: npm run test:rrhh
// Si cambian las reglas por defecto o el motor, estos resultados deben revisarse a conciencia.
import { calcularRecibo, calcularAguinaldo } from '../src/lib/rrhh/planilla';
import { REGLAS_PLANILLA_DEFAULT as R } from '../src/lib/rrhh/config';
import type { FilaDia } from '../src/lib/marcacion/reglas';

let fallos = 0;
const eq = (nombre: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fallos++;
  console.log((ok ? 'OK    ' : 'FALLA ') + nombre + (ok ? '' : `  → obtuvo ${JSON.stringify(got)}, esperaba ${JSON.stringify(want)}`));
};

const fila = (fecha: string, o: Partial<FilaDia> = {}): FilaDia => ({
  fecha, userKey: 'u', userName: 'X', estado: 'PRESENTE', nota: '', esperadaEntrada: '08:00', esperadaSalida: '17:00', entrada: '08:00', salida: '17:00',
  almuerzoMin: 60, trabajadoMin: 480, tardanzaMin: 0, anticipadaMin: 0, extraMin: 0, trasladoMin: 0, enSitioMin: 0, sitio: '', rostro: '', laboral: true, feriado: '', ...o,
});
const base = { periodo: '2026-11', reglas: R, funcionario: { fechaIngreso: '2019-03-04', fechaEgreso: null }, conceptos: [] };
const linea = (rc: ReturnType<typeof calcularRecibo>, c: string) => rc.lineas.find(l => l.concepto.startsWith(c))?.monto;

// 1) Mes completo, sin incidencias: 3.000.000, IPS 9% = 270.000, neto 2.730.000
let rc = calcularRecibo({ ...base, salario: { tipo: 'MENSUAL', monto: 3_000_000 }, filas: [fila('2026-11-03')] });
eq('1 sueldo básico', linea(rc, 'Sueldo básico'), 3_000_000);
eq('1 aporte IPS 9%', linea(rc, 'Aporte IPS'), 270_000);
eq('1 neto', rc.neto, 2_730_000);
eq('1 aporte patronal 16,5%', rc.aportePatronal, 495_000);

// 2) 2 ausencias sin aviso: jornal = 100.000 → descuento 200.000; base IPS 2.800.000 → IPS 252.000; neto 2.548.000
rc = calcularRecibo({ ...base, salario: { tipo: 'MENSUAL', monto: 3_000_000 }, filas: [fila('2026-11-03', { estado: 'AUSENTE', entrada: '', salida: '', trabajadoMin: 0 }), fila('2026-11-04', { estado: 'AUSENTE', entrada: '', salida: '', trabajadoMin: 0 })] });
eq('2 descuento ausencias', linea(rc, 'Ausencias sin aviso'), 200_000);
eq('2 IPS sobre base reducida', linea(rc, 'Aporte IPS'), 252_000);
eq('2 neto', rc.neto, 2_548_000);

// 3) 4 h extra diurnas: valor hora 12.500 × 1,5 = 18.750/h → 75.000
rc = calcularRecibo({ ...base, salario: { tipo: 'MENSUAL', monto: 3_000_000 }, filas: [fila('2026-11-05', { salida: '21:00', trabajadoMin: 720, extraMin: 240 })] });
const noct = rc.asistencia.extraNocturnaMin;
// 17:00→21:00: lo posterior a las 20:00 (60 min) es nocturno
eq('3 extra nocturna min', noct, 60);
eq('3 extra diurna min', rc.asistencia.extraDiurnaMin, 180);
eq('3 pago diurnas (3 h)', linea(rc, 'Horas extra diurnas'), 56_250);
eq('3 pago nocturnas (1 h ×2)', linea(rc, 'Horas extra nocturnas'), 25_000);

// 4) Feriado trabajado 8 h: 12.500 × 2 × 8 = 200.000
rc = calcularRecibo({ ...base, salario: { tipo: 'MENSUAL', monto: 3_000_000 }, filas: [fila('2026-11-06', { feriado: 'Prueba', trabajadoMin: 480 })] });
eq('4 trabajo en feriado', linea(rc, 'Trabajo en domingo o feriado'), 200_000);
// domingo (día no laboral)
rc = calcularRecibo({ ...base, salario: { tipo: 'MENSUAL', monto: 3_000_000 }, filas: [fila('2026-11-08', { laboral: false, esperadaEntrada: '', esperadaSalida: '', trabajadoMin: 240 })] });
eq('4b domingo 4 h', linea(rc, 'Trabajo en domingo o feriado'), 100_000);

// 5) Ingreso el 16 en un mes de 30 días: 15 días → 1.500.000
rc = calcularRecibo({ ...base, funcionario: { fechaIngreso: '2026-11-16', fechaEgreso: null }, salario: { tipo: 'MENSUAL', monto: 3_000_000 }, filas: [] });
eq('5 proporcional por ingreso', linea(rc, 'Sueldo básico'), 1_500_000);
eq('5 aviso de ingreso', rc.advertencias.some(a => a.includes('Ingreso en el período')), true);
// mes de 31 días completo → 30/30
rc = calcularRecibo({ ...base, periodo: '2026-12', salario: { tipo: 'MENSUAL', monto: 3_000_000 }, filas: [] });
eq('5b mes de 31 días paga completo', linea(rc, 'Sueldo básico'), 3_000_000);
// febrero completo → 30/30
rc = calcularRecibo({ ...base, periodo: '2026-02', salario: { tipo: 'MENSUAL', monto: 3_000_000 }, filas: [] });
eq('5c febrero paga completo', linea(rc, 'Sueldo básico'), 3_000_000);

// 6) Jornalero 100.000: 20 trabajados + 1 feriado laboral no trabajado = 21 jornales → 2.100.000
const dias20 = Array.from({ length: 20 }, (_, i) => fila(`2026-11-${String(i + 1).padStart(2, '0')}`));
rc = calcularRecibo({ ...base, salario: { tipo: 'JORNAL', monto: 100_000 }, filas: [...dias20, fila('2026-11-25', { feriado: 'X', estado: 'FERIADO', entrada: '', salida: '', trabajadoMin: 0 })] });
eq('6 jornales', linea(rc, 'Jornales'), 2_100_000);
eq('6 IPS jornalero', linea(rc, 'Aporte IPS'), 189_000);

// 7) Reglas: tardanza descuenta solo si está activo
const tard = [fila('2026-11-09', { tardanzaMin: 30 })];
rc = calcularRecibo({ ...base, salario: { tipo: 'MENSUAL', monto: 3_000_000 }, filas: tard });
eq('7 tardanza apagada: sin descuento', linea(rc, 'Tardanzas'), undefined);
rc = calcularRecibo({ ...base, reglas: { ...R, descontarTardanza: true }, salario: { tipo: 'MENSUAL', monto: 3_000_000 }, filas: tard });
eq('7 tardanza encendida: 30 min × 208,33 = 6.250', linea(rc, 'Tardanzas'), 6_250);

// 8) Ausencias justificadas: vacaciones se pagan, permiso no (por defecto)
const just = [fila('2026-11-10', { estado: 'VACACIONES', entrada: '', salida: '', trabajadoMin: 0 }), fila('2026-11-11', { estado: 'PERMISO', entrada: '', salida: '', trabajadoMin: 0 })];
rc = calcularRecibo({ ...base, salario: { tipo: 'MENSUAL', monto: 3_000_000 }, filas: just });
eq('8 solo el permiso se descuenta', linea(rc, 'Ausencias justificadas no pagadas'), 100_000);
// fin de semana dentro de unas vacaciones no cuenta
rc = calcularRecibo({ ...base, salario: { tipo: 'MENSUAL', monto: 3_000_000 }, filas: [fila('2026-11-14', { estado: 'PERMISO', laboral: false, esperadaEntrada: '', entrada: '', salida: '', trabajadoMin: 0 })] });
eq('8b día no laboral no se descuenta', linea(rc, 'Ausencias justificadas no pagadas'), undefined);

// 9) Conceptos manuales: bonificación imponible suma a la base; anticipo descuenta
rc = calcularRecibo({ ...base, salario: { tipo: 'MENSUAL', monto: 3_000_000 }, filas: [], conceptos: [{ tipo: 'HABER', nombre: 'Bonificación', monto: 500_000, imponible: true }, { tipo: 'DESCUENTO', nombre: 'Anticipo', monto: 300_000, imponible: false }] });
eq('9 IPS sobre 3.500.000', linea(rc, 'Aporte IPS'), 315_000);
eq('9 neto', rc.neto, 3_500_000 - 315_000 - 300_000);

// 10) Sin salario, sin vínculo, sin usuario
rc = calcularRecibo({ ...base, salario: null, filas: [] });
eq('10 sin salario: neto 0 y aviso', [rc.neto, rc.advertencias.length > 0], [0, true]);
rc = calcularRecibo({ ...base, funcionario: { fechaIngreso: '2019-01-01', fechaEgreso: '2026-10-31' }, salario: { tipo: 'MENSUAL', monto: 3_000_000 }, filas: [] });
eq('10b dado de baja antes del período', rc.neto, 0);
rc = calcularRecibo({ ...base, salario: { tipo: 'MENSUAL', monto: 3_000_000 }, filas: null });
eq('10c sin asistencia: paga y avisa', [linea(rc, 'Sueldo básico'), rc.advertencias.some(a => a.includes('Sin usuario'))], [3_000_000, true]);
rc = calcularRecibo({ ...base, funcionario: { fechaIngreso: '2019-01-01', fechaEgreso: '2026-11-15' }, salario: { tipo: 'MENSUAL', monto: 3_000_000 }, filas: [] });
eq('10d baja a mitad de mes: 15 días', [linea(rc, 'Sueldo básico'), rc.advertencias.some(a => a.includes('Baja en el período'))], [1_500_000, true]);

// 11) Aguinaldo: 12 meses de 3.000.000 → 3.000.000; sin IPS por defecto
const meses: Record<string, number> = {};
for (let m = 1; m <= 12; m++) meses[`2026-${String(m).padStart(2, '0')}`] = 3_000_000;
let ag = calcularAguinaldo({ anio: 2026, haberesPorMes: meses, reglas: R, conceptos: [] });
eq('11 aguinaldo completo', [ag.neto, ag.aporteIps, ag.advertencias.length], [3_000_000, 0, 0]);
ag = calcularAguinaldo({ anio: 2026, haberesPorMes: { '2026-07': 3_000_000, '2026-08': 3_000_000 }, reglas: R, conceptos: [] });
eq('11b aguinaldo proporcional (2 meses)', [ag.neto, ag.advertencias.length], [500_000, 1]);
ag = calcularAguinaldo({ anio: 2026, haberesPorMes: meses, reglas: { ...R, ipsSobreAguinaldo: true }, conceptos: [] });
eq('11c aguinaldo con IPS', [ag.aporteIps, ag.neto], [270_000, 2_730_000]);

// 12) Coherencia: neto = haberes - descuentos en todos los casos
const coherente = [rc, ag].every(x => x.neto === x.totalHaberes - x.totalDescuentos);
eq('12 neto = haberes − descuentos', coherente, true);
console.log(fallos === 0 ? '\nTodo OK' : `\n${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
