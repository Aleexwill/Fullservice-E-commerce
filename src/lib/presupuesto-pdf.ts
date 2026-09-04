import type { CalculationData, FilaCalculo } from '@/components/admin/presupuesto-calculo';

interface PresupuestoData {
  code: string;
  serviceTitle: string;
  serviceType: string;
  description: string;
  scheduledDate: string;
  estimatedDuration: string;
  assignedTo: string;
  customer: { name: string; email: string; phone: string; company: string; address: string };
  calculationData: CalculationData | null;
  createdAt: string;
}

const gs = (n: number) => 'Gs. ' + Math.round(n).toLocaleString('es-PY');

function seccionTotal(titFila: FilaCalculo, todasFilas: FilaCalculo[]) {
  let inside = false, sub = 0;
  for (const r of todasFilas) {
    if (r.id === titFila.id) { inside = true; continue; }
    if (inside && r.tipo === 'titulo') break;
    if (inside) sub += r.cantidad * r.precioVenta;
  }
  const conGG = sub * (1 + (titFila.gastosGeneralesPct ?? 0) / 100);
  return conGG * (1 + (titFila.margenPct ?? 0) / 100);
}

function filasDeSeccion(titFila: FilaCalculo, todasFilas: FilaCalculo[]) {
  const out: FilaCalculo[] = [];
  let inside = false;
  for (const r of todasFilas) {
    if (r.id === titFila.id) { inside = true; continue; }
    if (inside && r.tipo === 'titulo') break;
    if (inside) out.push(r);
  }
  return out;
}

export function imprimirPresupuesto(p: PresupuestoData) {
  const cd = p.calculationData;
  const filas = cd?.filas ?? [];
  const titulos = filas.filter(f => f.tipo === 'titulo');
  const filasItems = filas.filter(f => f.tipo !== 'titulo');

  // Totales
  const subtotalBruto = filasItems.reduce((s, f) => s + f.cantidad * f.precioVenta, 0);
  let subtotalFinal = subtotalBruto;
  if (titulos.length > 0) {
    subtotalFinal = titulos.reduce((s, t) => s + seccionTotal(t, filas), 0);
  }
  const iva = subtotalFinal * ((cd?.iva ?? 10) / 100);
  const total = subtotalFinal + iva - (cd?.descuento ?? 0);

  const fechaEmision = new Date().toLocaleDateString('es-PY', { day: '2-digit', month: 'long', year: 'numeric' });
  const fechaProg = p.scheduledDate
    ? (() => { const [y, m, d] = p.scheduledDate.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('es-PY', { day: '2-digit', month: 'long', year: 'numeric' }); })()
    : '—';

  const seccionesHTML = titulos.length > 0
    ? titulos.map(t => {
        const items = filasDeSeccion(t, filas);
        const stTotal = seccionTotal(t, filas);
        const rowsHTML = items.map(f => `
          <tr>
            <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${f.descripcion || '—'}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:center;">${f.unidad}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">${f.cantidad}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-family:monospace;">${gs(f.precioVenta)}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-family:monospace;">${gs(f.cantidad * f.precioVenta)}</td>
          </tr>`).join('');
        return `
          <div style="margin-bottom:20px;">
            <div style="background:#1e2d3d;color:#e2e8f0;padding:8px 12px;font-weight:700;font-size:13px;border-radius:4px 4px 0 0;display:flex;justify-content:space-between;">
              <span>${t.descripcion || 'Sección sin título'}</span>
              <span style="color:#90cdf4;font-family:monospace;">${gs(stTotal)}</span>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:12px;">
              <thead>
                <tr style="background:#f7fafc;">
                  <th style="padding:6px 8px;text-align:left;color:#718096;font-weight:600;border-bottom:2px solid #e2e8f0;">Descripción</th>
                  <th style="padding:6px 8px;text-align:center;color:#718096;font-weight:600;border-bottom:2px solid #e2e8f0;">Unidad</th>
                  <th style="padding:6px 8px;text-align:right;color:#718096;font-weight:600;border-bottom:2px solid #e2e8f0;">Cant.</th>
                  <th style="padding:6px 8px;text-align:right;color:#718096;font-weight:600;border-bottom:2px solid #e2e8f0;">P. Unitario</th>
                  <th style="padding:6px 8px;text-align:right;color:#718096;font-weight:600;border-bottom:2px solid #e2e8f0;">Total</th>
                </tr>
              </thead>
              <tbody>${rowsHTML}</tbody>
            </table>
          </div>`;
      }).join('')
    : (() => {
        const rowsHTML = filasItems.map(f => `
          <tr>
            <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${f.descripcion || '—'}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:center;">${f.unidad}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">${f.cantidad}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-family:monospace;">${gs(f.precioVenta)}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-family:monospace;">${gs(f.cantidad * f.precioVenta)}</td>
          </tr>`).join('');
        return `
          <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:20px;">
            <thead>
              <tr style="background:#f7fafc;">
                <th style="padding:6px 8px;text-align:left;color:#718096;font-weight:600;border-bottom:2px solid #e2e8f0;">Descripción</th>
                <th style="padding:6px 8px;text-align:center;color:#718096;font-weight:600;border-bottom:2px solid #e2e8f0;">Unidad</th>
                <th style="padding:6px 8px;text-align:right;color:#718096;font-weight:600;border-bottom:2px solid #e2e8f0;">Cant.</th>
                <th style="padding:6px 8px;text-align:right;color:#718096;font-weight:600;border-bottom:2px solid #e2e8f0;">P. Unitario</th>
                <th style="padding:6px 8px;text-align:right;color:#718096;font-weight:600;border-bottom:2px solid #e2e8f0;">Total</th>
              </tr>
            </thead>
            <tbody>${rowsHTML}</tbody>
          </table>`;
      })();

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <base href="${baseUrl}" />
  <title>Presupuesto ${p.code}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a202c; background: #fff; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      @page { margin: 18mm 15mm; }
    }
    .page { max-width: 860px; margin: 0 auto; padding: 32px 24px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 3px solid #1e2d3d; }
    .brand { display: flex; flex-direction: column; gap: 4px; }
    .brand img { height: 56px; width: auto; object-fit: contain; }
    .brand-sub { font-size: 11px; color: #718096; letter-spacing: 0.04em; }
    .doc-info { text-align: right; }
    .doc-code { font-size: 22px; font-weight: 700; color: #2d8fcc; font-family: monospace; }
    .doc-date { font-size: 11px; color: #718096; margin-top: 2px; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #718096; margin-bottom: 6px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .info-box { background: #f7fafc; border-radius: 6px; padding: 12px 14px; }
    .client-name { font-size: 15px; font-weight: 700; color: #1a202c; margin-bottom: 4px; }
    .client-detail { font-size: 12px; color: #4a5568; line-height: 1.6; }
    .service-box { background: #ebf8ff; border-left: 4px solid #2d8fcc; border-radius: 0 6px 6px 0; padding: 12px 14px; }
    .service-title { font-size: 14px; font-weight: 700; color: #1a202c; margin-bottom: 4px; }
    .service-desc { font-size: 12px; color: #4a5568; line-height: 1.6; }
    .totals-box { background: #f7fafc; border-radius: 6px; padding: 14px 16px; min-width: 220px; }
    .total-row { display: flex; justify-content: space-between; font-size: 12px; color: #4a5568; padding: 3px 0; }
    .total-row.final { font-size: 15px; font-weight: 800; color: #1a202c; border-top: 2px solid #1e2d3d; margin-top: 6px; padding-top: 8px; }
    .total-row.final span:last-child { color: #2d8fcc; font-family: monospace; }
    .footer-info { margin-top: 28px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; }
    .validity { font-size: 11px; color: #718096; }
    .obs { font-size: 10px; color: #a0aec0; max-width: 460px; line-height: 1.5; }
    .print-btn { position: fixed; top: 16px; right: 16px; background: #2d8fcc; color: #fff; border: none; border-radius: 6px; padding: 10px 20px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; }
    .print-btn:hover { background: #2178ad; }
  </style>
</head>
<body>
<div class="page">
  <button class="print-btn no-print" onclick="window.print()">🖨 Imprimir / Guardar PDF</button>

  <!-- HEADER -->
  <div class="header">
    <div class="brand">
      <img src="/logo.png" alt="Full Service &amp; Clean" />
      <div class="brand-sub">Servicios industriales y construcción</div>
    </div>
    <div class="doc-info">
      <div class="doc-code">${p.code}</div>
      <div class="doc-date">Emitido el ${fechaEmision}</div>
      ${p.scheduledDate ? `<div class="doc-date">Fecha programada: ${fechaProg}</div>` : ''}
      ${p.estimatedDuration ? `<div class="doc-date">Duración estimada: ${p.estimatedDuration}</div>` : ''}
    </div>
  </div>

  <!-- CLIENTE + SERVICIO -->
  <div class="two-col">
    <div>
      <div class="section-title">Cliente</div>
      <div class="info-box">
        <div class="client-name">${p.customer.name || 'Sin nombre'}</div>
        <div class="client-detail">
          ${p.customer.company ? `<div>${p.customer.company}</div>` : ''}
          ${p.customer.address ? `<div>${p.customer.address}</div>` : ''}
          ${p.customer.phone ? `<div>Tel: ${p.customer.phone}</div>` : ''}
          ${p.customer.email ? `<div>${p.customer.email}</div>` : ''}
        </div>
      </div>
    </div>
    <div>
      <div class="section-title">Servicio solicitado</div>
      <div class="service-box">
        <div class="service-title">${p.serviceTitle}</div>
        ${p.description ? `<div class="service-desc">${p.description.replace(/\n/g, '<br>')}</div>` : ''}
      </div>
    </div>
  </div>

  <!-- DETALLE DEL PRESUPUESTO -->
  <div class="section-title" style="margin-bottom:12px;">Detalle del presupuesto</div>
  ${seccionesHTML || '<p style="color:#718096;font-size:12px;margin-bottom:20px;">Sin items de cálculo cargados.</p>'}

  <!-- TOTALES -->
  <div style="display:flex;justify-content:flex-end;margin-bottom:24px;">
    <div class="totals-box">
      <div class="total-row"><span>Subtotal</span><span style="font-family:monospace;">${gs(subtotalFinal)}</span></div>
      <div class="total-row"><span>IVA (${cd?.iva ?? 10}%)</span><span style="font-family:monospace;">${gs(iva)}</span></div>
      ${(cd?.descuento ?? 0) > 0 ? `<div class="total-row" style="color:#e53e3e;"><span>Descuento</span><span style="font-family:monospace;">-${gs(cd!.descuento)}</span></div>` : ''}
      <div class="total-row final"><span>TOTAL</span><span>${gs(total)}</span></div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer-info">
    <div class="obs">${cd?.observaciones ? cd.observaciones : ''}</div>
    <div class="validity">Validez de la oferta: <strong>${cd?.validez ?? '10 días'}</strong></div>
  </div>
</div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
