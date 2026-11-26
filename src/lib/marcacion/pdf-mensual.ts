import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { PDFFont, PDFPage } from 'pdf-lib';
import { LOGO_PNG_BASE64 } from './logo';
import { aMin, aniosAntiguedad, DIAS_NOMBRE, diaSemana, ESTADO_DIA_LABEL, horasTxt } from './reglas';
import type { EstadoDia, FilaDia, Parametros } from './reglas';
import type { ResumenPersona } from './reporte-server';

const W = 842, H = 595, M = 34; // A4 apaisado
const INK = rgb(0.043, 0.067, 0.125), MUT = rgb(0.33, 0.4, 0.44), LINE = rgb(0.86, 0.9, 0.92), CARD = rgb(0.957, 0.969, 0.984);
const BLUE = rgb(0.176, 0.561, 0.8), OR = rgb(0.91, 0.525, 0.169);
const COLOR: Partial<Record<EstadoDia, ReturnType<typeof rgb>>> = {
  AUSENTE: rgb(0.77, 0.19, 0.19), TARDE: rgb(0.75, 0.42, 0.09), INCOMPLETA: rgb(0.75, 0.42, 0.09), PRESENTE: rgb(0.18, 0.52, 0.35),
  VACACIONES: BLUE, PERMISO: BLUE, REPOSO_MEDICO: BLUE, LICENCIA: BLUE, FERIADO: MUT, DESCANSO: MUT, PENDIENTE: MUT,
};
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** Las fuentes estándar del PDF solo cubren Latin-1: se reemplaza lo que no entre para que nunca falle. */
const safe = (s: string) => s.replace(/[^ -~ -ÿ]/g, '?');
const fecha = (f: string) => f.split('-').reverse().join('/');

export interface PersonaPdf { resumen: ResumenPersona; filas: FilaDia[]; ingreso?: string | null }
export interface OpcionesPdf { mes: string; params: Parametros; generadoPor: string; generadoEn: string }

const JUSTIF: EstadoDia[] = ['VACACIONES', 'PERMISO', 'REPOSO_MEDICO', 'LICENCIA', 'FERIADO', 'DESCANSO', 'PENDIENTE'];

/** Un PDF A4 apaisado con una sección (una o más páginas) por persona. */
export async function generarPdfMensual(personas: PersonaPdf[], o: OpcionesPdf): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Reporte mensual de asistencia ${o.mes}`);
  doc.setCreator('Full Service & Clean');
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const logo = await doc.embedPng(Buffer.from(LOGO_PNG_BASE64, 'base64'));
  const [anio, mm] = o.mes.split('-').map(Number);
  const periodo = `${MESES[mm - 1]} de ${anio}`;
  const paginas: PDFPage[] = [];

  const txt = (p: PDFPage, t: string, x: number, y: number, size: number, f: PDFFont = reg, color = INK, align: 'l' | 'r' | 'c' = 'l') => {
    const s = safe(t);
    const w = f.widthOfTextAtSize(s, size);
    p.drawText(s, { x: align === 'r' ? x - w : align === 'c' ? x - w / 2 : x, y, size, font: f, color });
  };
  const recorta = (t: string, w: number, size: number, f: PDFFont) => {
    let s = safe(t);
    if (f.widthOfTextAtSize(s, size) <= w) return s;
    while (s.length > 1 && f.widthOfTextAtSize(s + '…', size) > w) s = s.slice(0, -1);
    return s + '...';
  };

  const cols: { k: string; t: string; w: number; r?: boolean }[] = [
    { k: 'fecha', t: 'Fecha', w: 62 }, { k: 'dia', t: 'Día', w: 62 }, { k: 'estado', t: 'Estado', w: 74 }, { k: 'prev', t: 'Previsto', w: 74 },
    { k: 'ent', t: 'Entrada', w: 44, r: true }, { k: 'sal', t: 'Salida', w: 44, r: true }, { k: 'alm', t: 'Almuerzo', w: 50, r: true }, { k: 'hrs', t: 'Horas', w: 44, r: true },
    { k: 'tar', t: 'Tarde', w: 40, r: true }, { k: 'ant', t: 'Salió antes', w: 52, r: true }, { k: 'ext', t: 'Extra', w: 40, r: true }, { k: 'tra', t: 'Traslado', w: 48, r: true },
  ];
  const usado = cols.reduce((a, c) => a + c.w, 0);
  const obsW = W - 2 * M - usado - 8;
  const RH = 10.8; // 31 días entran en una sola hoja apaisada

  function cabecera(p: PDFPage, nombre: string, primera: boolean) {
    p.drawRectangle({ x: 0, y: H - (primera ? 48 : 36), width: W, height: primera ? 48 : 36, color: INK });
    const lw = primera ? 32 : 22, lh = lw * (logo.height / logo.width);
    p.drawImage(logo, { x: M, y: H - (primera ? 48 : 36) / 2 - lh / 2, width: lw, height: lh });
    txt(p, 'Full Service & Clean', M + lw + 10, H - (primera ? 21 : 20), primera ? 14 : 11.5, bold, rgb(1, 1, 1));
    txt(p, primera ? 'Reporte mensual de asistencia' : `${nombre} · ${periodo}`, M + lw + 10, H - (primera ? 36 : 30), primera ? 9 : 8, reg, rgb(0.75, 0.8, 0.88));
    txt(p, periodo.charAt(0).toUpperCase() + periodo.slice(1), W - M, H - (primera ? 30 : 24), primera ? 14 : 11, bold, rgb(1, 1, 1), 'r');
  }

  function filaHeader(p: PDFPage, y: number) {
    p.drawRectangle({ x: M, y: y - 4, width: W - 2 * M, height: RH + 1, color: CARD });
    let x = M + 4;
    for (const c of cols) { txt(p, c.t, c.r ? x + c.w - 6 : x, y, 7, bold, MUT, c.r ? 'r' : 'l'); x += c.w; }
    txt(p, 'Lugar / nota', x, y, 7, bold, MUT);
  }

  for (const { resumen: r, filas, ingreso } of personas) {
    let p = doc.addPage([W, H]); paginas.push(p);
    cabecera(p, r.userName, true);
    let y = H - 48 - 22;
    txt(p, r.userName, M, y, 16, bold);
    const fin = filas.length ? filas[filas.length - 1].fecha : `${o.mes}-28`;
    const ant = ingreso ? `   ·   Ingreso: ${fecha(ingreso)} (${aniosAntiguedad(ingreso, fin)} años de antigüedad)` : '';
    txt(p, `Período: ${fecha(`${o.mes}-01`)} al ${fecha(fin)}${ant}`, M, y - 13, 8.5, reg, MUT);

    // Horas previstas: días que exigían trabajar (incluye faltas), con el almuerzo previsto descontado
    const previstoMin = filas.reduce((a, f) => (f.esperadaEntrada && !JUSTIF.includes(f.estado) ? a + Math.max(0, aMin(f.esperadaSalida) - aMin(f.esperadaEntrada) - o.params.almuerzoMin) : a), 0);
    const dif = r.trabajadoMin - previstoMin;
    const kpis: [string, string][] = [
      [String(r.diasTrabajados), 'Días trabajados'], [horasTxt(r.trabajadoMin), 'Horas trabajadas'], [horasTxt(previstoMin), 'Horas previstas'],
      [`${dif < 0 ? '-' : '+'}${horasTxt(Math.abs(dif))}`, 'Diferencia'], [horasTxt(r.extraMin), 'Horas extra'],
      [`${r.tardanzas} (${r.tardanzaMin} min)`, 'Tardanzas'], [String(r.ausencias), 'Ausencias sin aviso'], [String(r.justificados), 'Días justificados'],
    ];
    const bw = (W - 2 * M - 7 * 6) / 8, by = y - 26 - 36;
    kpis.forEach(([v, l], i) => {
      const x = M + i * (bw + 6);
      p.drawRectangle({ x, y: by, width: bw, height: 36, color: CARD, borderColor: LINE, borderWidth: 0.7 });
      txt(p, v, x + 8, by + 19, 12, bold, l === 'Ausencias sin aviso' && r.ausencias > 0 ? COLOR.AUSENTE : INK);
      txt(p, l, x + 8, by + 7, 7, reg, MUT);
    });
    txt(p, `Traslado: ${horasTxt(r.trasladoMin)}   ·   En el lugar de trabajo: ${horasTxt(r.enSitioMin)}   ·   Salidas anticipadas: ${r.anticipadas}   ·   Jornadas sin salida: ${r.sinSalida}`, M, by - 12, 7.5, reg, MUT);

    y = by - 28;
    filaHeader(p, y); y -= RH + 2;

    filas.forEach((f, i) => {
      if (y < M + 14) { // nueva página de continuación
        p = doc.addPage([W, H]); paginas.push(p); cabecera(p, r.userName, false);
        y = H - 36 - 20; filaHeader(p, y); y -= RH + 2;
      }
      if (i % 2 === 1) p.drawRectangle({ x: M, y: y - 2.8, width: W - 2 * M, height: RH, color: rgb(0.985, 0.989, 0.994) });
      const fin = f.estado === 'DESCANSO' || f.estado === 'FERIADO';
      const v: Record<string, string> = {
        fecha: fecha(f.fecha), dia: DIAS_NOMBRE[diaSemana(f.fecha)], estado: ESTADO_DIA_LABEL[f.estado],
        prev: f.esperadaEntrada ? `${f.esperadaEntrada}-${f.esperadaSalida}` : '', ent: f.entrada, sal: f.salida,
        alm: f.almuerzoMin ? `${f.almuerzoMin}'` : '', hrs: f.trabajadoMin ? horasTxt(f.trabajadoMin) : '',
        tar: f.tardanzaMin ? `${f.tardanzaMin}'` : '', ant: f.anticipadaMin ? `${f.anticipadaMin}'` : '', ext: f.extraMin ? horasTxt(f.extraMin) : '', tra: f.trasladoMin ? horasTxt(f.trasladoMin) : '',
      };
      let x = M + 4;
      for (const c of cols) {
        const color = c.k === 'estado' ? (COLOR[f.estado] ?? INK) : fin ? MUT : INK;
        txt(p, v[c.k] || '', c.r ? x + c.w - 6 : x, y, 7.5, c.k === 'estado' ? bold : reg, color, c.r ? 'r' : 'l');
        x += c.w;
      }
      txt(p, recorta([f.sitio, f.nota].filter(Boolean).join(' · '), obsW, 7, reg), x, y, 7, reg, MUT);
      y -= RH;
    });

    // Firmas al final de la sección
    if (y < M + 52) { p = doc.addPage([W, H]); paginas.push(p); cabecera(p, r.userName, false); y = H - 36 - 40; }
    y -= 28;
    const fw = 220;
    for (const [i, l] of ['Firma del trabajador', 'Firma del encargado'].entries()) {
      const x = M + 40 + i * (fw + 120);
      p.drawLine({ start: { x, y }, end: { x: x + fw, y }, thickness: 0.7, color: MUT });
      txt(p, l, x + fw / 2, y - 11, 8, reg, MUT, 'c');
    }
  }

  if (personas.length === 0) {
    const p = doc.addPage([W, H]); paginas.push(p); cabecera(p, '', true);
    txt(p, 'No hay datos de asistencia para el período.', M, H - 120, 12, reg, MUT);
  }

  paginas.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: 26 }, end: { x: W - M, y: 26 }, thickness: 0.5, color: LINE });
    txt(p, `Generado por ${o.generadoPor} · ${o.generadoEn} · Horas según los parámetros vigentes (tolerancia ${o.params.toleranciaMin} min, almuerzo ${o.params.almuerzoMin} min)`, M, 14, 7, reg, MUT);
    txt(p, `Página ${i + 1} de ${paginas.length}`, W - M, 14, 7, reg, MUT, 'r');
  });
  void OR;
  return doc.save();
}
