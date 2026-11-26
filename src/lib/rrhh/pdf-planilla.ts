import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import type { PDFFont, PDFPage } from 'pdf-lib';
import { LOGO_PNG_BASE64 } from '@/lib/marcacion/logo';
import { horasTxt } from '@/lib/marcacion/reglas';
import { numeroALetras } from './numero-letras';
import { fmtFecha, fmtGs, periodoLabel } from './shared';
import type { LineaRecibo, ResumenAsistencia } from './planilla';

const INK = rgb(0.043, 0.067, 0.125), MUT = rgb(0.33, 0.4, 0.44), LINE = rgb(0.86, 0.9, 0.92), CARD = rgb(0.957, 0.969, 0.984);
const safe = (s: string) => s.replace(/[^ -~ -ÿ]/g, '?');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export interface ReciboPdf {
  nombre: string; documento: string; cargo: string; fechaIngreso: string; ipsNumero: string; banco: string; cuentaBancaria: string;
  lineas: LineaRecibo[]; asistencia: ResumenAsistencia; totalHaberes: number; totalDescuentos: number; neto: number; aportePatronal: number;
}
export interface PlanillaPdf { periodo: string; tipo: 'MENSUAL' | 'AGUINALDO'; estado: 'BORRADOR' | 'CERRADA'; generadoPor: string; generadoEn: string }

async function base() {
  const doc = await PDFDocument.create();
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const logo = await doc.embedPng(Buffer.from(LOGO_PNG_BASE64, 'base64'));
  const txt = (p: PDFPage, t: string, x: number, y: number, size: number, f: PDFFont = reg, color = INK, align: 'l' | 'r' | 'c' = 'l') => {
    const s = safe(t); const w = f.widthOfTextAtSize(s, size);
    p.drawText(s, { x: align === 'r' ? x - w : align === 'c' ? x - w / 2 : x, y, size, font: f, color });
  };
  const recorta = (t: string, w: number, size: number, f: PDFFont) => { let s = safe(t); if (f.widthOfTextAtSize(s, size) <= w) return s; while (s.length > 1 && f.widthOfTextAtSize(s + '...', size) > w) s = s.slice(0, -1); return s + '...'; };
  const marca = (p: PDFPage, W: number, H: number) => p.drawText('BORRADOR', { x: W * 0.16, y: H * 0.3, size: 110, font: bold, color: rgb(0.85, 0.2, 0.2), opacity: 0.12, rotate: degrees(40) });
  return { doc, reg, bold, logo, txt, recorta, marca };
}

/** Un recibo de sueldo por página (A4 vertical). En borrador lleva marca de agua. */
export async function generarPdfRecibos(recibos: ReciboPdf[], pl: PlanillaPdf): Promise<Uint8Array> {
  const { doc, reg, bold, logo, txt, recorta, marca } = await base();
  doc.setTitle(`Recibos de sueldo ${pl.periodo}`); doc.setCreator('Full Service & Clean');
  const W = 595, H = 842, M = 40;
  const titulo = pl.tipo === 'AGUINALDO' ? `Aguinaldo ${pl.periodo.slice(0, 4)}` : `Recibo de sueldo · ${cap(periodoLabel(pl.periodo))}`;

  for (const r of recibos) {
    const p = doc.addPage([W, H]);
    p.drawRectangle({ x: 0, y: H - 70, width: W, height: 70, color: INK });
    const lh = 36 * (logo.height / logo.width);
    p.drawImage(logo, { x: M, y: H - 35 - lh / 2, width: 36, height: lh });
    txt(p, 'Full Service & Clean', M + 48, H - 32, 15, bold, rgb(1, 1, 1));
    txt(p, titulo, M + 48, H - 50, 10, reg, rgb(0.75, 0.8, 0.88));
    txt(p, pl.tipo === 'AGUINALDO' ? 'AGUINALDO' : 'RECIBO', W - M, H - 38, 14, bold, rgb(1, 1, 1), 'r');

    let y = H - 100;
    p.drawRectangle({ x: M, y: y - 88, width: W - 2 * M, height: 94, color: CARD, borderColor: LINE, borderWidth: 0.7 });
    txt(p, r.nombre, M + 10, y - 14, 13, bold);
    const dato = (l: string, v: string, x: number, yy: number) => { txt(p, l, x, yy, 7.5, reg, MUT); txt(p, recorta(v || '-', 170, 9.5, reg), x, yy - 11, 9.5); };
    dato('Cédula de identidad', r.documento, M + 10, y - 34); dato('Cargo', r.cargo, M + 190, y - 34); dato('Fecha de ingreso', fmtFecha(r.fechaIngreso), M + 380, y - 34);
    dato('Nº de IPS', r.ipsNumero, M + 10, y - 66); dato('Banco', r.banco, M + 190, y - 66); dato('Cuenta', r.cuentaBancaria, M + 380, y - 66);

    y -= 120;
    const cx = { c: M + 6, d: M + 170, h: W - M - 90, s: W - M - 6 };
    p.drawRectangle({ x: M, y: y - 4, width: W - 2 * M, height: 16, color: INK });
    txt(p, 'Concepto', cx.c, y, 8.5, bold, rgb(1, 1, 1)); txt(p, 'Detalle', cx.d, y, 8.5, bold, rgb(1, 1, 1));
    txt(p, 'Haberes', cx.h, y, 8.5, bold, rgb(1, 1, 1), 'r'); txt(p, 'Descuentos', cx.s, y, 8.5, bold, rgb(1, 1, 1), 'r');
    y -= 18;
    const ordenadas = [...r.lineas.filter(l => l.tipo === 'HABER'), ...r.lineas.filter(l => l.tipo === 'DESCUENTO')];
    ordenadas.forEach((l, i) => {
      if (i % 2 === 1) p.drawRectangle({ x: M, y: y - 4, width: W - 2 * M, height: 15, color: rgb(0.985, 0.989, 0.994) });
      txt(p, recorta(l.concepto, 150, 9, reg), cx.c, y, 9);
      txt(p, recorta(l.detalle, 190, 7.5, reg), cx.d, y + 0.5, 7.5, reg, MUT);
      if (l.tipo === 'HABER') txt(p, fmtGs(l.monto), cx.h, y, 9, reg, INK, 'r'); else txt(p, fmtGs(l.monto), cx.s, y, 9, reg, INK, 'r');
      y -= 15;
    });
    p.drawLine({ start: { x: M, y: y + 6 }, end: { x: W - M, y: y + 6 }, thickness: 0.8, color: INK });
    y -= 6;
    txt(p, 'Totales', cx.c, y, 9.5, bold); txt(p, fmtGs(r.totalHaberes), cx.h, y, 9.5, bold, INK, 'r'); txt(p, fmtGs(r.totalDescuentos), cx.s, y, 9.5, bold, INK, 'r');
    y -= 56;
    p.drawRectangle({ x: M, y: y - 8, width: W - 2 * M, height: 48, color: CARD, borderColor: LINE, borderWidth: 0.7 });
    txt(p, 'NETO A COBRAR', M + 12, y + 28, 8.5, bold, MUT);
    txt(p, fmtGs(r.neto), M + 12, y + 5, 20, bold);
    txt(p, recorta(`Son guaraníes ${numeroALetras(r.neto)}.`, 300, 8.5, reg), W - M - 10, y + 8, 8.5, reg, MUT, 'r');

    // Resumen de asistencia (solo mensuales)
    if (pl.tipo === 'MENSUAL' && r.asistencia.diasVinculo > 0) {
      y -= 34;
      const a = r.asistencia;
      txt(p, `Asistencia del período: ${a.diasTrabajados} días trabajados · ${a.ausenciasSinAviso} ausencias sin aviso · ${a.justificadosPagados + a.justificadosNoPagados} justificadas · extra ${horasTxt(a.extraDiurnaMin + a.extraNocturnaMin)} h · feriado/domingo ${horasTxt(a.feriadoDomingoMin)} h`, M, y, 7.5, reg, MUT);
    }
    // Firmas
    const fy = 150;
    p.drawLine({ start: { x: M + 10, y: fy }, end: { x: M + 220, y: fy }, thickness: 0.7, color: MUT });
    p.drawLine({ start: { x: W - M - 220, y: fy }, end: { x: W - M - 10, y: fy }, thickness: 0.7, color: MUT });
    txt(p, 'Por la empresa', M + 115, fy - 12, 8.5, reg, MUT, 'c'); txt(p, 'Recibí conforme (firma y aclaración)', W - M - 115, fy - 12, 8.5, reg, MUT, 'c');
    txt(p, 'Fecha de pago: ____ / ____ / ________', W / 2, fy - 40, 8.5, reg, MUT, 'c');
    p.drawLine({ start: { x: M, y: 50 }, end: { x: W - M, y: 50 }, thickness: 0.5, color: LINE });
    txt(p, `Generado por ${pl.generadoPor} · ${pl.generadoEn}${pl.estado === 'BORRADOR' ? ' · BORRADOR: no válido hasta cerrar la planilla' : ''}`, M, 38, 7, reg, MUT);
    if (pl.estado === 'BORRADOR') marca(p, W, H);
  }
  if (recibos.length === 0) { const p = doc.addPage([W, H]); txt(p, 'La planilla no tiene recibos.', M, H - 100, 12, reg, MUT); }
  return doc.save();
}

/** Resumen de la planilla (A4 apaisado): una fila por funcionario, con totales y costo para la empresa. */
export async function generarPdfResumen(recibos: ReciboPdf[], pl: PlanillaPdf): Promise<Uint8Array> {
  const { doc, reg, bold, logo, txt, recorta, marca } = await base();
  doc.setTitle(`Resumen de planilla ${pl.periodo}`); doc.setCreator('Full Service & Clean');
  const W = 842, H = 595, M = 34, RH = 15;
  const titulo = pl.tipo === 'AGUINALDO' ? `Planilla de aguinaldo ${pl.periodo.slice(0, 4)}` : `Planilla de sueldos · ${cap(periodoLabel(pl.periodo))}`;
  const cols = [{ t: 'Funcionario', x: M + 6, w: 210, r: false }, { t: 'Cargo', x: M + 222, w: 130, r: false }, { t: 'Haberes', x: 470, w: 0, r: true }, { t: 'Aporte IPS', x: 545, w: 0, r: true }, { t: 'Otros desc.', x: 625, w: 0, r: true }, { t: 'Neto', x: 710, w: 0, r: true }, { t: 'Aporte patronal', x: W - M - 6, w: 0, r: true }];
  const ips = (r: ReciboPdf) => r.lineas.filter(l => l.concepto.startsWith('Aporte IPS')).reduce((s, l) => s + l.monto, 0);

  let p: PDFPage; let y = 0; let pag = 0;
  const nueva = () => {
    p = doc.addPage([W, H]); pag++;
    p.drawRectangle({ x: 0, y: H - 46, width: W, height: 46, color: INK });
    const lh = 28 * (logo.height / logo.width);
    p.drawImage(logo, { x: M, y: H - 23 - lh / 2, width: 28, height: lh });
    txt(p, 'Full Service & Clean', M + 38, H - 21, 13, bold, rgb(1, 1, 1));
    txt(p, titulo, M + 38, H - 36, 9, reg, rgb(0.75, 0.8, 0.88));
    txt(p, pl.estado === 'CERRADA' ? 'CERRADA' : 'BORRADOR', W - M, H - 28, 11, bold, rgb(1, 1, 1), 'r');
    y = H - 70;
    p.drawRectangle({ x: M, y: y - 4, width: W - 2 * M, height: RH + 1, color: CARD });
    for (const c of cols) txt(p, c.t, c.x, y, 8, bold, MUT, c.r ? 'r' : 'l');
    y -= RH + 3;
    if (pl.estado === 'BORRADOR') marca(p, W, H);
  };
  nueva();
  const tot = { h: 0, i: 0, o: 0, n: 0, pat: 0 };
  recibos.forEach((r, i) => {
    if (y < M + 70) nueva();
    if (i % 2 === 1) p.drawRectangle({ x: M, y: y - 4, width: W - 2 * M, height: RH, color: rgb(0.985, 0.989, 0.994) });
    const iv = ips(r), otros = r.totalDescuentos - iv;
    txt(p, recorta(r.nombre, 205, 8.5, reg), cols[0].x, y, 8.5); txt(p, recorta(r.cargo || '-', 125, 8, reg), cols[1].x, y, 8, reg, MUT);
    txt(p, fmtGs(r.totalHaberes), cols[2].x, y, 8.5, reg, INK, 'r'); txt(p, fmtGs(iv), cols[3].x, y, 8.5, reg, INK, 'r'); txt(p, fmtGs(otros), cols[4].x, y, 8.5, reg, INK, 'r');
    txt(p, fmtGs(r.neto), cols[5].x, y, 8.5, bold, INK, 'r'); txt(p, fmtGs(r.aportePatronal), cols[6].x, y, 8.5, reg, MUT, 'r');
    tot.h += r.totalHaberes; tot.i += iv; tot.o += otros; tot.n += r.neto; tot.pat += r.aportePatronal;
    y -= RH;
  });
  if (y < M + 80) nueva();
  p!.drawLine({ start: { x: M, y: y + 8 }, end: { x: W - M, y: y + 8 }, thickness: 0.8, color: INK });
  y -= 4;
  txt(p!, `Totales (${recibos.length} recibos)`, cols[0].x, y, 9, bold);
  txt(p!, fmtGs(tot.h), cols[2].x, y, 9, bold, INK, 'r'); txt(p!, fmtGs(tot.i), cols[3].x, y, 9, bold, INK, 'r'); txt(p!, fmtGs(tot.o), cols[4].x, y, 9, bold, INK, 'r'); txt(p!, fmtGs(tot.n), cols[5].x, y, 9, bold, INK, 'r'); txt(p!, fmtGs(tot.pat), cols[6].x, y, 9, bold, MUT, 'r');
  y -= 46;
  p!.drawRectangle({ x: M, y: y - 10, width: 330, height: 40, color: CARD, borderColor: LINE, borderWidth: 0.7 });
  txt(p!, 'COSTO TOTAL PARA LA EMPRESA', M + 10, y + 18, 7.5, bold, MUT);
  txt(p!, fmtGs(tot.h + tot.pat), M + 10, y, 15, bold);
  txt(p!, 'Haberes + aporte patronal (informativo)', M + 175, y + 1, 7.5, reg, MUT);
  txt(p!, `Generado por ${pl.generadoPor} · ${pl.generadoEn}${pl.estado === 'BORRADOR' ? ' · BORRADOR' : ''}`, M, 18, 7, reg, MUT);
  doc.getPages().forEach((pg, i) => txt(pg, `Página ${i + 1} de ${pag}`, W - M, 18, 7, reg, MUT, 'r'));
  return doc.save();
}
