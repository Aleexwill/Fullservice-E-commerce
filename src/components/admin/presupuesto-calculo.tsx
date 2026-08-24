'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, Trash2, Save, FileText, Loader2, Search, GripVertical } from 'lucide-react';

/* ─── Material search autocomplete ─────────────────── */
interface MaterialSuggestion {
  id: string; description: string; unit: string; unitPrice: number; provider: string; category: string;
}

function MaterialSearch({ onSelect }: { onSelect: (m: MaterialSuggestion) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<MaterialSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!q || q.length < 2) { setResults([]); setOpen(false); return; }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/materiales?q=${encodeURIComponent(q)}&limit=10`);
        if (res.ok) { const d = await res.json(); setResults(d.materials || []); setOpen(true); }
      } finally { setLoading(false); }
    }, 300);
  }, [q]);

  const pick = (m: MaterialSuggestion) => { onSelect(m); setQ(''); setResults([]); setOpen(false); };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-md border border-steel-900/40 bg-carbon px-3 py-2">
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-steel-500 shrink-0" /> : <Search className="h-3.5 w-3.5 text-steel-500 shrink-0" />}
        <input
          value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="flex-1 bg-transparent font-body text-body-sm text-arctic outline-none placeholder:text-steel-700"
          placeholder="Buscar en inventario para agregar fila..."
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-steel-900/60 bg-carbon shadow-xl">
          {results.map((m) => (
            <button key={m.id} onMouseDown={() => pick(m)} className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-steel-900/60">
              <div>
                <p className="font-body text-body-sm text-arctic">{m.description}</p>
                <p className="font-mono text-caption text-steel-500">{m.category} · {m.unit}</p>
              </div>
              <span className="shrink-0 font-mono text-caption text-[#48BB78]">Gs. {Math.round(m.unitPrice).toLocaleString('es-PY')}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Types ─────────────────────────────────────────── */
export type RowType = 'titulo' | 'material' | 'mano_obra' | 'otro';

export interface FilaCalculo {
  id: string;
  tipo: RowType;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precioUnitario: number;  // costo interno
  precioVenta: number;     // precio al cliente (por unidad)
}

export interface CalculationData {
  filas: FilaCalculo[];
  iva: number;
  descuento: number;
  validez: string;
  ubicacion: string;
  observaciones: string;
  // legacy fields kept for compatibility
  items?: any[];
}

const defaultCalc = (): CalculationData => ({
  filas: [], iva: 10, descuento: 0, validez: '10 días', ubicacion: '',
  observaciones: 'Precios sujetos a relevamiento final y disponibilidad de materiales. No incluye trabajos no detallados en el presente presupuesto.',
});

const newFila = (tipo: RowType): FilaCalculo => ({
  id: crypto.randomUUID(), tipo, descripcion: '', unidad: tipo === 'titulo' ? '' : 'unid',
  cantidad: tipo === 'titulo' ? 0 : 1, precioUnitario: 0, precioVenta: 0,
});

const gs = (n: number) => 'Gs. ' + Math.round(n).toLocaleString('es-PY');

const ROW_COLORS: Record<RowType, string> = {
  titulo: 'bg-steel-900/60',
  material: 'bg-blue/[0.04]',
  mano_obra: 'bg-[#48BB78]/[0.04]',
  otro: 'bg-carbon',
};

/* ─── Component ─────────────────────────────────────── */
export interface ItemPresupuesto { id: string; orden: number; descripcionCliente: string; unidad: string; cantidad: number; precioVenta: number; lineas: any[]; expandido: boolean; }
export interface LineaCalculo { id: string; descripcion: string; unidad: string; cantidad: number; precioUnitario: number; tipo: string; }

interface Props {
  presupuestoId: string;
  serviceTitle: string;
  customerName: string;
  code: string;
  initial: CalculationData | null;
  onSaved: (data: CalculationData) => void;
}

export function PresupuestoCalculo({ presupuestoId, serviceTitle, customerName, code, initial, onSaved }: Props) {
  const [calc, setCalc] = useState<CalculationData>(() => {
    if (!initial) return defaultCalc();
    // migrate from old format
    if (initial.filas) return initial;
    return { ...defaultCalc(), ubicacion: initial.ubicacion || '', validez: initial.validez || '10 días', observaciones: initial.observaciones || defaultCalc().observaciones };
  });
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  /* ─── Totals ─── */
  const filasTotalizables = calc.filas.filter((f) => f.tipo !== 'titulo');
  const subtotal = filasTotalizables.reduce((s, f) => s + f.cantidad * f.precioVenta, 0);
  const costoTotal = filasTotalizables.reduce((s, f) => s + f.cantidad * f.precioUnitario, 0);
  const ivaMonto = subtotal * (calc.iva / 100);
  const totalGeneral = subtotal + ivaMonto - calc.descuento;
  const margenTotal = subtotal > 0 ? ((subtotal - costoTotal) / subtotal) * 100 : 0;

  /* ─── Mutators ─── */
  const setFilas = (filas: FilaCalculo[]) => setCalc((c) => ({ ...c, filas }));

  const addFila = (tipo: RowType) => setFilas([...calc.filas, newFila(tipo)]);

  const removeFila = (id: string) => setFilas(calc.filas.filter((f) => f.id !== id));

  const updateFila = (id: string, patch: Partial<FilaCalculo>) =>
    setFilas(calc.filas.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const addFromInventario = (m: MaterialSuggestion) =>
    setFilas([...calc.filas, {
      id: crypto.randomUUID(), tipo: 'material', descripcion: m.description,
      unidad: m.unit, cantidad: 1, precioUnitario: Number(m.unitPrice), precioVenta: Number(m.unitPrice),
    }]);

  /* ─── Save ─── */
  const save = async () => {
    setSaving(true);
    const res = await fetch(`/api/presupuestos/${presupuestoId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ calculationData: calc, finalValue: Math.round(totalGeneral) }),
    });
    if (res.ok) { const u = await res.json(); onSaved(u.calculationData ?? calc); }
    setSaving(false);
  };

  /* ─── PDF ─── */
  const generatePdf = useCallback(() => {
    setGeneratingPdf(true);
    const html = buildPdfHtml({ calc, code, serviceTitle, customerName, subtotal, ivaMonto, totalGeneral });
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => { win.print(); setGeneratingPdf(false); }, 600); }
    else setGeneratingPdf(false);
  }, [calc, code, serviceTitle, customerName, subtotal, ivaMonto, totalGeneral]);

  /* ─── Render ─── */
  return (
    <div className="space-y-4">
      {/* Project info */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label mb-1 block">Ubicación / Proyecto</label>
          <input className="input" value={calc.ubicacion} onChange={(e) => setCalc((c) => ({ ...c, ubicacion: e.target.value }))} placeholder="ej: Limpio, Central" />
        </div>
        <div>
          <label className="label mb-1 block">Validez</label>
          <input className="input" value={calc.validez} onChange={(e) => setCalc((c) => ({ ...c, validez: e.target.value }))} placeholder="ej: 10 días" />
        </div>
      </div>

      {/* Inventory search */}
      <MaterialSearch onSelect={addFromInventario} />

      {/* Main table */}
      <div className="rounded-lg border border-steel-900/50 overflow-hidden">
        {/* Header */}
        <div className="grid bg-steel-900/60 px-2 py-2 font-body text-[0.6rem] uppercase tracking-wider text-steel-500"
          style={{ gridTemplateColumns: '32px 1fr 80px 70px 130px 130px 32px' }}>
          <span />
          <span>Descripción</span>
          <span className="text-center">Unidad</span>
          <span className="text-center">Cant.</span>
          <span className="text-right">Costo unit.</span>
          <span className="text-right">Precio cliente</span>
          <span />
        </div>

        {/* Rows */}
        {calc.filas.length === 0 ? (
          <div className="py-10 text-center font-body text-body-sm text-steel-700">
            Agregá ítems con los botones de abajo o buscá en el inventario
          </div>
        ) : (
          <div className="divide-y divide-steel-900/20">
            {calc.filas.map((fila) => (
              <div key={fila.id}
                className={`grid items-center px-2 py-1.5 gap-2 ${ROW_COLORS[fila.tipo]}`}
                style={{ gridTemplateColumns: '32px 1fr 80px 70px 130px 130px 32px' }}>

                {/* Type indicator */}
                <span className={`flex h-5 w-5 items-center justify-center rounded text-[0.5rem] font-bold uppercase ${
                  fila.tipo === 'titulo' ? 'bg-steel-700 text-arctic' :
                  fila.tipo === 'material' ? 'bg-blue/20 text-blue-bright' :
                  fila.tipo === 'mano_obra' ? 'bg-[#48BB78]/20 text-[#48BB78]' :
                  'bg-steel-900 text-steel-300'
                }`}>
                  {fila.tipo === 'titulo' ? 'T' : fila.tipo === 'material' ? 'M' : fila.tipo === 'mano_obra' ? 'MO' : 'O'}
                </span>

                {/* Descripcion */}
                <input
                  className={`bg-transparent outline-none font-body text-body-sm placeholder:text-steel-800 w-full ${fila.tipo === 'titulo' ? 'font-semibold text-arctic uppercase' : 'text-steel-300'}`}
                  value={fila.descripcion}
                  onChange={(e) => updateFila(fila.id, { descripcion: e.target.value })}
                  placeholder={fila.tipo === 'titulo' ? 'Título de sección...' : fila.tipo === 'material' ? 'Material...' : fila.tipo === 'mano_obra' ? 'Mano de obra...' : 'Otro...'}
                />

                {/* Unidad */}
                {fila.tipo === 'titulo' ? <span /> : (
                  <input
                    className="bg-transparent outline-none text-center font-mono text-body-sm text-steel-400 w-full"
                    value={fila.unidad}
                    onChange={(e) => updateFila(fila.id, { unidad: e.target.value })}
                    placeholder="unid"
                  />
                )}

                {/* Cantidad */}
                {fila.tipo === 'titulo' ? <span /> : (
                  <input
                    type="number" min={0} step="any"
                    className="bg-transparent outline-none text-center font-mono text-body-sm text-arctic w-full"
                    value={fila.cantidad}
                    onChange={(e) => updateFila(fila.id, { cantidad: Number(e.target.value) })}
                  />
                )}

                {/* Costo unitario */}
                {fila.tipo === 'titulo' ? <span /> : (
                  <input
                    type="number" min={0} step="any"
                    className="bg-transparent outline-none text-right font-mono text-body-sm text-steel-500 w-full"
                    value={fila.precioUnitario || ''}
                    onChange={(e) => updateFila(fila.id, { precioUnitario: Number(e.target.value) })}
                    placeholder="0"
                  />
                )}

                {/* Precio venta */}
                {fila.tipo === 'titulo' ? (
                  <span className="text-right font-mono text-caption text-steel-700">
                    {gs(calc.filas.filter(f => f.tipo !== 'titulo').reduce((s, f, _, arr) => {
                      // sum only filas after this titulo until next titulo
                      let inSection = false;
                      let total = 0;
                      for (const r of calc.filas) {
                        if (r.id === fila.id) { inSection = true; continue; }
                        if (inSection && r.tipo === 'titulo') break;
                        if (inSection && r.tipo !== 'titulo') total += r.cantidad * r.precioVenta;
                      }
                      return total;
                    }, 0))}
                  </span>
                ) : (
                  <div className="flex items-center gap-1">
                    <input
                      type="number" min={0} step="any"
                      className="bg-transparent outline-none text-right font-mono text-body-sm text-[#48BB78] w-full"
                      value={fila.precioVenta || ''}
                      onChange={(e) => updateFila(fila.id, { precioVenta: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                )}

                {/* Delete */}
                <button onClick={() => removeFila(fila.id)} className="rounded p-1 text-steel-800 hover:text-red-400 transition-colors">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Row total footer */}
        {calc.filas.length > 0 && (
          <div className="grid border-t border-steel-900/40 bg-steel-900/30 px-2 py-2 font-mono text-body-sm"
            style={{ gridTemplateColumns: '32px 1fr 80px 70px 130px 130px 32px' }}>
            <span /><span className="text-steel-500 font-body text-caption">SUBTOTAL</span>
            <span /><span />
            <span className="text-right text-steel-500">{gs(costoTotal)}</span>
            <span className="text-right text-[#48BB78] font-semibold">{gs(subtotal)}</span>
            <span />
          </div>
        )}
      </div>

      {/* Add row buttons */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => addFila('titulo')} className="flex items-center gap-1.5 rounded-md border border-steel-900/40 px-3 py-1.5 font-body text-caption text-steel-400 hover:bg-steel-900/40 hover:text-arctic transition-colors">
          <Plus className="h-3 w-3" /> Título
        </button>
        <button onClick={() => addFila('material')} className="flex items-center gap-1.5 rounded-md border border-blue/30 px-3 py-1.5 font-body text-caption text-blue-bright hover:bg-blue/10 transition-colors">
          <Plus className="h-3 w-3" /> Material
        </button>
        <button onClick={() => addFila('mano_obra')} className="flex items-center gap-1.5 rounded-md border border-[#48BB78]/30 px-3 py-1.5 font-body text-caption text-[#48BB78] hover:bg-[#48BB78]/10 transition-colors">
          <Plus className="h-3 w-3" /> Mano de obra
        </button>
        <button onClick={() => addFila('otro')} className="flex items-center gap-1.5 rounded-md border border-steel-900/40 px-3 py-1.5 font-body text-caption text-steel-400 hover:bg-steel-900/40 hover:text-arctic transition-colors">
          <Plus className="h-3 w-3" /> Otro
        </button>
      </div>

      {/* Margen summary */}
      {costoTotal > 0 && (
        <div className="flex items-center gap-4 rounded-lg border border-steel-900/30 bg-carbon px-4 py-3 font-mono text-caption">
          <span className="text-steel-500">Costo total: <span className="text-arctic">{gs(costoTotal)}</span></span>
          <span className="text-steel-500">Venta: <span className="text-[#48BB78]">{gs(subtotal)}</span></span>
          <span className="text-steel-500">Margen: <span className={margenTotal >= 20 ? 'text-[#48BB78]' : margenTotal >= 0 ? 'text-yellow-bright' : 'text-red-400'}>{margenTotal.toFixed(1)}%</span></span>
        </div>
      )}

      {/* Totals */}
      {calc.filas.length > 0 && (
        <div className="rounded-lg border border-steel-900/40 bg-carbon-light p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label mb-1 block">IVA (%)</label>
              <input type="number" className="input font-mono" value={calc.iva} min={0} max={100} onChange={(e) => setCalc((c) => ({ ...c, iva: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label mb-1 block">Descuento (Gs.)</label>
              <input type="number" className="input font-mono" value={calc.descuento} min={0} onChange={(e) => setCalc((c) => ({ ...c, descuento: Number(e.target.value) }))} />
            </div>
            <div className="flex flex-col justify-end">
              <div className="rounded-lg bg-steel-900/40 px-4 py-3 text-right">
                <p className="font-body text-caption text-steel-500">TOTAL</p>
                <p className="font-display text-h2 text-[#48BB78]">{gs(totalGeneral)}</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-steel-900/20 font-body text-body-sm">
            <div className="flex justify-between py-1.5 text-steel-400"><span>Subtotal</span><span className="font-mono">{gs(subtotal)}</span></div>
            <div className="flex justify-between py-1.5 text-steel-400"><span>IVA ({calc.iva}%)</span><span className="font-mono">{gs(ivaMonto)}</span></div>
            {calc.descuento > 0 && <div className="flex justify-between py-1.5 text-[#FC8181]"><span>Descuento</span><span className="font-mono">-{gs(calc.descuento)}</span></div>}
          </div>
          <div>
            <label className="label mb-1 block">Observaciones para el PDF</label>
            <textarea className="input" rows={2} value={calc.observaciones} onChange={(e) => setCalc((c) => ({ ...c, observaciones: e.target.value }))} />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={save} disabled={saving} className="btn-primary flex-1 justify-center gap-2">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando...</> : <><Save className="h-4 w-4" />Guardar cálculo</>}
        </button>
        {calc.filas.length > 0 && (
          <button onClick={generatePdf} disabled={generatingPdf} className="btn-secondary flex items-center gap-2 px-4">
            {generatingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            PDF cliente
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── PDF HTML builder ─────────────────────────────── */
function buildPdfHtml({ calc, code, serviceTitle, customerName, subtotal, ivaMonto, totalGeneral }: {
  calc: CalculationData; code: string; serviceTitle: string; customerName: string;
  subtotal: number; ivaMonto: number; totalGeneral: number;
}) {
  const gs = (n: number) => 'Gs. ' + Math.round(n).toLocaleString('es-PY');
  const today = new Date().toLocaleDateString('es-PY', { day: '2-digit', month: 'long', year: 'numeric' });

  const rows = calc.filas.map((fila) => {
    if (fila.tipo === 'titulo') {
      return `<tr><td colspan="5" style="background:#1a3a52;color:white;font-weight:bold;padding:7px 10px;font-size:11px;letter-spacing:0.5px">${fila.descripcion}</td></tr>`;
    }
    const total = fila.cantidad * fila.precioVenta;
    return `<tr>
      <td>${fila.descripcion}</td>
      <td style="text-align:center">${fila.unidad}</td>
      <td style="text-align:center">${fila.cantidad}</td>
      <td style="text-align:right">${gs(fila.precioVenta)}</td>
      <td style="text-align:right">${gs(total)}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Presupuesto ${code}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .brand { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
    .brand span { color: #2D8FCC; }
    .brand em { color: #E8631A; font-style: normal; }
    .meta table { border-collapse: collapse; }
    .meta td { padding: 2px 8px; }
    .meta td:first-child { font-weight: bold; color: #555; }
    h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #333; margin: 16px 0 8px; border-bottom: 2px solid #2D8FCC; padding-bottom: 4px; }
    table.items { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    table.items th { background: #1a3a52; color: white; padding: 6px 8px; text-align: left; font-size: 10px; text-transform: uppercase; }
    table.items td { padding: 7px 8px; border-bottom: 1px solid #e0e0e0; vertical-align: top; }
    table.items tr:nth-child(even) td { background: #f7f9fb; }
    .totals { margin-left: auto; width: 280px; }
    .totals table { width: 100%; border-collapse: collapse; }
    .totals td { padding: 5px 8px; }
    .totals .label { color: #555; }
    .totals .value { text-align: right; font-weight: bold; }
    .totals .total-row td { background: #1a3a52; color: white; font-size: 13px; font-weight: 900; padding: 8px; }
    .obs { margin-top: 24px; font-size: 10px; color: #777; border-top: 1px solid #ddd; padding-top: 8px; }
    @media print { body { padding: 16px; } }
  </style></head><body>
  <div class="header">
    <div style="display:flex;align-items:center;gap:12px">
      <img src="/logo.png" alt="Full Service & Clean" style="height:64px;width:auto;object-fit:contain" />
      <div>
        <div class="brand"><span>Full Service</span> <em>&amp; Clean</em></div>
        <div style="color:#555;margin-top:2px;font-size:10px">Servicios profesionales de mantenimiento y construcción</div>
      </div>
    </div>
    <div class="meta">
      <table>
        <tr><td>N° Presupuesto</td><td><strong>${code}</strong></td></tr>
        <tr><td>Fecha</td><td>${today}</td></tr>
        <tr><td>Validez</td><td>${calc.validez}</td></tr>
        <tr><td>Cliente</td><td>${customerName}</td></tr>
        ${calc.ubicacion ? `<tr><td>Ubicación</td><td>${calc.ubicacion}</td></tr>` : ''}
      </table>
    </div>
  </div>
  <h2>${serviceTitle}</h2>
  <table class="items">
    <thead><tr><th>Descripción</th><th style="width:70px;text-align:center">Unidad</th><th style="width:60px;text-align:center">Cant.</th><th style="width:120px;text-align:right">P. Unitario</th><th style="width:130px;text-align:right">Total</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <table>
      <tr><td class="label">Subtotal</td><td class="value">${gs(subtotal)}</td></tr>
      <tr><td class="label">IVA (${calc.iva}%)</td><td class="value">${gs(ivaMonto)}</td></tr>
      ${calc.descuento > 0 ? `<tr><td class="label">Descuento</td><td class="value" style="color:#c0392b">-${gs(calc.descuento)}</td></tr>` : ''}
      <tr class="total-row"><td colspan="2" style="text-align:right">TOTAL GENERAL: ${gs(totalGeneral)}</td></tr>
    </table>
  </div>
  ${calc.observaciones ? `<div class="obs">${calc.observaciones}</div>` : ''}
  <div style="margin-top:32px;border-top:1px solid #ddd;padding-top:10px;display:flex;justify-content:space-between;align-items:center">
    <img src="/logo.png" alt="" style="height:32px;width:auto;opacity:0.5" />
    <div style="font-size:9px;color:#aaa;text-align:right">
      Full Service &amp; Clean · Asunción, Paraguay<br/>
      Este presupuesto es válido por ${calc.validez} desde la fecha de emisión.
    </div>
  </div>
</body></html>`;
}
