'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, Trash2, Save, FileText, Loader2, Search, CheckCircle2, AlertCircle } from 'lucide-react';

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
  precioUnitario: number;
  precioVenta: number;
}

export interface CalculationData {
  filas: FilaCalculo[];
  iva: number;
  descuento: number;
  validez: string;
  ubicacion: string;
  observaciones: string;
  items?: any[];
}

const defaultCalc = (): CalculationData => ({
  filas: [], iva: 10, descuento: 0, validez: '10 días', ubicacion: '',
  observaciones: 'Precios sujetos a relevamiento final y disponibilidad de materiales. No incluye trabajos no detallados en el presente presupuesto.',
});

const newFila = (tipo: RowType): FilaCalculo => ({
  id: crypto.randomUUID(), tipo,
  descripcion: '', unidad: tipo === 'titulo' ? '' : 'unid',
  cantidad: tipo === 'titulo' ? 0 : 1,
  precioUnitario: 0, precioVenta: 0,
});

const gs = (n: number) => 'Gs. ' + Math.round(n).toLocaleString('es-PY');

/* ─── Row type styles ─── */
const TYPE_BADGE: Record<RowType, string> = {
  titulo: 'bg-steel-700 text-arctic',
  material: 'bg-blue/20 text-blue-bright',
  mano_obra: 'bg-[#48BB78]/20 text-[#48BB78]',
  otro: 'bg-steel-900 text-steel-300',
};
const TYPE_LABEL: Record<RowType, string> = { titulo: 'T', material: 'M', mano_obra: 'MO', otro: 'O' };
const ROW_BG: Record<RowType, string> = {
  titulo: 'bg-steel-900/50',
  material: 'bg-blue/[0.03]',
  mano_obra: 'bg-[#48BB78]/[0.03]',
  otro: 'bg-carbon',
};

/* ─── Exported legacy types (kept for compatibility) ─── */
export interface ItemPresupuesto { id: string; orden: number; descripcionCliente: string; unidad: string; cantidad: number; precioVenta: number; lineas: any[]; expandido: boolean; }
export interface LineaCalculo { id: string; descripcion: string; unidad: string; cantidad: number; precioUnitario: number; tipo: string; }

/* ─── Helpers ─── */
function sectionTotal(filas: FilaCalculo[], tituloId: string): number {
  let inside = false, total = 0;
  for (const r of filas) {
    if (r.id === tituloId) { inside = true; continue; }
    if (inside && r.tipo === 'titulo') break;
    if (inside) total += r.cantidad * r.precioVenta;
  }
  return total;
}

/* ─── Props ─────────────────────────────────────────── */
interface Props {
  presupuestoId: string;
  serviceTitle: string;
  customerName: string;
  code: string;
  initial: CalculationData | null;
  onSaved: (data: CalculationData) => void;
}

/* ─── Component ─────────────────────────────────────── */
export function PresupuestoCalculo({ presupuestoId, serviceTitle, customerName, code, initial, onSaved }: Props) {
  const [calc, setCalc] = useState<CalculationData>(() => {
    if (!initial) return defaultCalc();
    if (initial.filas) return initial;
    return { ...defaultCalc(), ubicacion: initial.ubicacion || '', validez: initial.validez || '10 días', observaciones: initial.observaciones || defaultCalc().observaciones };
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);   // tracks unsaved changes
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // mark dirty on any calc change
  const prevCalc = useRef(calc);
  useEffect(() => {
    if (prevCalc.current !== calc) { setSaved(false); prevCalc.current = calc; }
  }, [calc]);

  /* ─── Totals ─── */
  const filasTot = calc.filas.filter((f) => f.tipo !== 'titulo');
  const subtotal = filasTot.reduce((s, f) => s + f.cantidad * f.precioVenta, 0);
  const costoTotal = filasTot.reduce((s, f) => s + f.cantidad * f.precioUnitario, 0);
  const ivaMonto = subtotal * (calc.iva / 100);
  const totalGeneral = subtotal + ivaMonto - calc.descuento;
  const margenPct = subtotal > 0 ? ((subtotal - costoTotal) / subtotal) * 100 : 0;

  /* ─── Mutators ─── */
  const setFilas = (filas: FilaCalculo[]) => setCalc((c) => ({ ...c, filas }));
  const addFila = (tipo: RowType) => setFilas([...calc.filas, newFila(tipo)]);
  const removeFila = (id: string) => setFilas(calc.filas.filter((f) => f.id !== id));
  const updateFila = (id: string, patch: Partial<FilaCalculo>) =>
    setFilas(calc.filas.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const addFromInventario = (m: MaterialSuggestion) =>
    setFilas([...calc.filas, {
      id: crypto.randomUUID(), tipo: 'material', descripcion: m.description,
      unidad: m.unit, cantidad: 1,
      precioUnitario: Number(m.unitPrice), precioVenta: Number(m.unitPrice),
    }]);

  /* ─── Save ─── */
  const doSave = async (calcToSave: CalculationData) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/presupuestos/${presupuestoId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calculationData: calcToSave, finalValue: Math.round(totalGeneral) }),
      });
      if (res.ok) { const u = await res.json(); onSaved(u.calculationData ?? calcToSave); setSaved(true); }
    } finally { setSaving(false); }
  };
  const save = () => doSave(calc);

  /* ─── PDF — auto-save, then print ─── */
  const generatePdf = useCallback(async () => {
    setGeneratingPdf(true);
    await doSave(calc);
    const html = buildPdfHtml({ calc, code, serviceTitle, customerName, subtotal, ivaMonto, totalGeneral });
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => { win.print(); setGeneratingPdf(false); }, 600); }
    else setGeneratingPdf(false);
  }, [calc, code, serviceTitle, customerName, subtotal, ivaMonto, totalGeneral, presupuestoId]);

  /* ─── COLS layout ─── */
  // [badge 28px] [desc flex] [unidad 72px] [cant 60px] [costo 110px] [pventa 110px] [total 110px] [del 28px]
  const COLS = '28px 1fr 72px 60px 110px 110px 110px 28px';

  /* ─── Render ─── */
  return (
    <div className="flex flex-col gap-4">

      {/* ── Header info ── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label mb-1 block">Ubicación / Proyecto</label>
          <input className="input" value={calc.ubicacion} onChange={(e) => setCalc((c) => ({ ...c, ubicacion: e.target.value }))} placeholder="ej: Limpio, Central" />
        </div>
        <div>
          <label className="label mb-1 block">Validez de la oferta</label>
          <input className="input" value={calc.validez} onChange={(e) => setCalc((c) => ({ ...c, validez: e.target.value }))} placeholder="ej: 10 días" />
        </div>
      </div>

      {/* ── Inventory search ── */}
      <MaterialSearch onSelect={addFromInventario} />

      {/* ── Main spreadsheet table ── */}
      <div className="rounded-lg border border-steel-900/50 overflow-hidden">

        {/* Table header */}
        <div className="grid items-center bg-steel-900/70 px-2 py-2 font-body text-[0.58rem] font-semibold uppercase tracking-wider text-steel-500"
          style={{ gridTemplateColumns: COLS }}>
          <span />
          <span>Descripción</span>
          <span className="text-center">Unidad</span>
          <span className="text-center">Cant.</span>
          <span className="text-right">Costo unit.</span>
          <span className="text-right">P. Cliente unit.</span>
          <span className="text-right text-[#48BB78]">Total</span>
          <span />
        </div>

        {/* Empty state */}
        {calc.filas.length === 0 && (
          <div className="py-12 text-center font-body text-body-sm text-steel-700">
            Agregá ítems con los botones de abajo o buscá en el inventario
          </div>
        )}

        {/* Rows */}
        {calc.filas.length > 0 && (
          <div className="divide-y divide-steel-900/20">
            {calc.filas.map((fila) => {
              const rowTotal = fila.tipo !== 'titulo' ? fila.cantidad * fila.precioVenta : sectionTotal(calc.filas, fila.id);
              return (
                <div key={fila.id}
                  className={`grid items-center gap-2 px-2 py-1.5 ${ROW_BG[fila.tipo]}`}
                  style={{ gridTemplateColumns: COLS }}>

                  {/* Type badge */}
                  <span className={`flex h-5 w-5 items-center justify-center rounded text-[0.48rem] font-bold ${TYPE_BADGE[fila.tipo]}`}>
                    {TYPE_LABEL[fila.tipo]}
                  </span>

                  {/* Descripcion */}
                  <input
                    className={`bg-transparent outline-none font-body text-body-sm placeholder:text-steel-800 w-full min-w-0 ${fila.tipo === 'titulo' ? 'font-semibold text-arctic' : 'text-steel-300'}`}
                    value={fila.descripcion}
                    onChange={(e) => updateFila(fila.id, { descripcion: e.target.value })}
                    placeholder={fila.tipo === 'titulo' ? 'Título de sección...' : fila.tipo === 'material' ? 'Material...' : fila.tipo === 'mano_obra' ? 'Mano de obra / viático...' : 'Otro...'}
                  />

                  {/* Unidad */}
                  {fila.tipo === 'titulo' ? <span /> : (
                    <input className="bg-transparent outline-none text-center font-mono text-body-sm text-steel-400 w-full"
                      value={fila.unidad} onChange={(e) => updateFila(fila.id, { unidad: e.target.value })} placeholder="unid" />
                  )}

                  {/* Cantidad */}
                  {fila.tipo === 'titulo' ? <span /> : (
                    <input type="number" min={0} step="any"
                      className="bg-transparent outline-none text-center font-mono text-body-sm text-arctic w-full"
                      value={fila.cantidad || ''} onChange={(e) => updateFila(fila.id, { cantidad: Number(e.target.value) })} />
                  )}

                  {/* Costo unitario (internal) */}
                  {fila.tipo === 'titulo' ? <span /> : (
                    <input type="number" min={0} step="any"
                      className="bg-transparent outline-none text-right font-mono text-body-sm text-steel-600 w-full"
                      value={fila.precioUnitario || ''} onChange={(e) => updateFila(fila.id, { precioUnitario: Number(e.target.value) })} placeholder="0" />
                  )}

                  {/* Precio venta (client) */}
                  {fila.tipo === 'titulo' ? <span /> : (
                    <input type="number" min={0} step="any"
                      className="bg-transparent outline-none text-right font-mono text-body-sm text-steel-300 w-full"
                      value={fila.precioVenta || ''} onChange={(e) => updateFila(fila.id, { precioVenta: Number(e.target.value) })} placeholder="0" />
                  )}

                  {/* Total (qty × venta) */}
                  <span className={`text-right font-mono text-body-sm font-semibold ${fila.tipo === 'titulo' ? 'text-steel-500 text-caption' : 'text-[#48BB78]'}`}>
                    {rowTotal > 0 ? gs(rowTotal) : '—'}
                  </span>

                  {/* Delete */}
                  <button onClick={() => removeFila(fila.id)} className="rounded p-1 text-steel-800 hover:text-red-400 transition-colors">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Subtotal footer row */}
        {calc.filas.length > 0 && (
          <div className="grid items-center border-t-2 border-steel-900/60 bg-steel-900/40 px-2 py-2"
            style={{ gridTemplateColumns: COLS }}>
            <span />
            <span className="font-body text-caption font-semibold uppercase tracking-wider text-steel-500">Subtotal</span>
            <span /><span />
            <span className="text-right font-mono text-caption text-steel-600">{gs(costoTotal)}</span>
            <span className="text-right font-mono text-caption text-steel-400">{gs(subtotal)}</span>
            <span className="text-right font-mono text-body-sm font-bold text-[#48BB78]">{gs(subtotal)}</span>
            <span />
          </div>
        )}
      </div>

      {/* ── Add row buttons ── */}
      <div className="flex flex-wrap gap-2">
        <span className="font-body text-caption text-steel-700 self-center mr-1">Agregar:</span>
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

      {/* ── Margin summary bar ── */}
      {costoTotal > 0 && (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-steel-900/30 bg-carbon px-4 py-3 font-mono text-caption">
          <div className="flex items-center gap-1.5 text-steel-500">Costo: <span className="text-arctic">{gs(costoTotal)}</span></div>
          <div className="flex items-center gap-1.5 text-steel-500">Venta: <span className="text-[#48BB78]">{gs(subtotal)}</span></div>
          <div className="flex items-center gap-1.5 text-steel-500">Ganancia: <span className="text-[#48BB78]">{gs(subtotal - costoTotal)}</span></div>
          <div className="flex items-center gap-1.5 text-steel-500">Margen: <span className={margenPct >= 20 ? 'text-[#48BB78]' : margenPct >= 0 ? 'text-yellow-400' : 'text-red-400'}>{margenPct.toFixed(1)}%</span></div>
        </div>
      )}

      {/* ── Totals block ── */}
      {calc.filas.length > 0 && (
        <div className="rounded-lg border border-steel-900/40 bg-carbon-light p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3 items-end">
            <div>
              <label className="label mb-1 block">IVA (%)</label>
              <input type="number" className="input font-mono" value={calc.iva} min={0} max={100}
                onChange={(e) => setCalc((c) => ({ ...c, iva: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label mb-1 block">Descuento (Gs.)</label>
              <input type="number" className="input font-mono" value={calc.descuento} min={0}
                onChange={(e) => setCalc((c) => ({ ...c, descuento: Number(e.target.value) }))} />
            </div>
            <div className="rounded-lg bg-steel-900/50 px-4 py-3 text-right">
              <p className="font-body text-caption text-steel-500">TOTAL GENERAL</p>
              <p className="font-mono text-h2 font-bold text-[#48BB78]">{gs(totalGeneral)}</p>
            </div>
          </div>
          <div className="divide-y divide-steel-900/20 font-body text-body-sm">
            <div className="flex justify-between py-1.5 text-steel-400"><span>Subtotal</span><span className="font-mono">{gs(subtotal)}</span></div>
            <div className="flex justify-between py-1.5 text-steel-400"><span>IVA ({calc.iva}%)</span><span className="font-mono">{gs(ivaMonto)}</span></div>
            {calc.descuento > 0 && <div className="flex justify-between py-1.5 text-[#FC8181]"><span>Descuento</span><span className="font-mono">-{gs(calc.descuento)}</span></div>}
          </div>
          <div>
            <label className="label mb-1 block">Observaciones / condiciones</label>
            <textarea className="input" rows={3} value={calc.observaciones}
              onChange={(e) => setCalc((c) => ({ ...c, observaciones: e.target.value }))} />
          </div>
        </div>
      )}

      {/* ── Sticky action bar ── */}
      <div className="sticky bottom-0 -mx-6 flex items-center gap-3 border-t border-steel-900/40 bg-carbon-light px-6 py-3">
        {/* Saved status */}
        <div className="flex items-center gap-1.5 font-body text-caption">
          {saving ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin text-steel-500" /><span className="text-steel-500">Guardando...</span></>
          ) : saved ? (
            <><CheckCircle2 className="h-3.5 w-3.5 text-[#48BB78]" /><span className="text-[#48BB78]">Guardado</span></>
          ) : (
            <><AlertCircle className="h-3.5 w-3.5 text-yellow-400" /><span className="text-yellow-400">Cambios sin guardar</span></>
          )}
        </div>
        <div className="flex-1" />
        {calc.filas.length > 0 && (
          <button onClick={generatePdf} disabled={generatingPdf} className="btn-secondary flex items-center gap-2 px-4">
            {generatingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            PDF cliente
          </button>
        )}
        <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2 px-6">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar cálculo
        </button>
      </div>
    </div>
  );
}

/* ─── PDF HTML builder ─────────────────────────────── */
function buildPdfHtml({ calc, code, serviceTitle, customerName, subtotal, ivaMonto, totalGeneral }: {
  calc: CalculationData; code: string; serviceTitle: string; customerName: string;
  subtotal: number; ivaMonto: number; totalGeneral: number;
}) {
  const fmtGs = (n: number) => 'Gs. ' + Math.round(n).toLocaleString('es-PY');
  const today = new Date().toLocaleDateString('es-PY', { day: '2-digit', month: 'long', year: 'numeric' });

  // PDF shows only título rows (with their section total) — no internal cost detail exposed to client
  const titulos = calc.filas.filter((f) => f.tipo === 'titulo');
  const hasTitulos = titulos.length > 0;

  const secTotal = (tituloId: string): number => {
    let inside = false, total = 0;
    for (const r of calc.filas) {
      if (r.id === tituloId) { inside = true; continue; }
      if (inside && r.tipo === 'titulo') break;
      if (inside) total += r.cantidad * r.precioVenta;
    }
    return total;
  };

  const rows = hasTitulos
    ? titulos.map((t, i) => {
        const st = secTotal(t.id);
        return `<tr>
          <td>${t.descripcion || 'Ítem ' + (i + 1)}</td>
          <td class="center">Global</td>
          <td class="center">1</td>
          <td class="right">${fmtGs(st)}</td>
          <td class="right bold">${fmtGs(st)}</td>
        </tr>`;
      }).join('')
    : calc.filas.filter((f) => f.tipo !== 'titulo').map((fila) => {
        const total = fila.cantidad * fila.precioVenta;
        return `<tr>
          <td>${fila.descripcion}</td>
          <td class="center">${fila.unidad}</td>
          <td class="center">${fila.cantidad}</td>
          <td class="right">${fmtGs(fila.precioVenta)}</td>
          <td class="right bold">${fmtGs(total)}</td>
        </tr>`;
      }).join('');

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Presupuesto ${code}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,sans-serif;font-size:11px;color:#1a1a1a;padding:32px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px}
    .logo-block{display:flex;flex-direction:column;gap:4px}
    .logo-block img{height:72px;width:auto;object-fit:contain}
    .logo-block small{font-size:10px;color:#777}
    .meta table{border-collapse:collapse}
    .meta td{padding:3px 10px;font-size:11px}
    .meta td:first-child{font-weight:bold;color:#555;text-align:right}
    h2{font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#333;margin:0 0 10px;border-bottom:2px solid #2D8FCC;padding-bottom:4px}
    table.items{width:100%;border-collapse:collapse;margin-bottom:20px}
    table.items th{background:#1a3a52;color:#fff;padding:7px 8px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.5px}
    table.items td{padding:7px 8px;border-bottom:1px solid #e8e8e8;vertical-align:top}
    table.items tr:nth-child(even) td{background:#f7f9fb}
    .section-header{background:#2d5a7a!important;color:#fff!important;font-weight:bold;font-size:11px;letter-spacing:.5px;padding:6px 10px!important;text-transform:uppercase}
    .center{text-align:center}.right{text-align:right}.bold{font-weight:bold}
    .totals-wrap{display:flex;justify-content:flex-end;margin-bottom:20px}
    .totals{width:290px;border-collapse:collapse}
    .totals td{padding:5px 8px}
    .totals .lbl{color:#555}
    .totals .val{text-align:right;font-weight:bold}
    .total-row td{background:#1a3a52;color:#fff;font-size:13px;font-weight:900;padding:9px 10px}
    .obs{font-size:10px;color:#888;border-top:1px solid #ddd;padding-top:10px;margin-top:4px}
    .footer{margin-top:28px;border-top:1px solid #ddd;padding-top:10px;display:flex;justify-content:space-between;align-items:center}
    .footer img{height:30px;width:auto;opacity:.4}
    .footer small{font-size:9px;color:#bbb;text-align:right}
    @media print{body{padding:16px}}
  </style></head><body>
  <div class="header">
    <div class="logo-block">
      <img src="/logo.png" alt="Full Service &amp; Clean" />
      <small>Servicios profesionales de mantenimiento y construcción</small>
    </div>
    <div class="meta">
      <table>
        <tr><td>N° Presupuesto</td><td><strong>${code}</strong></td></tr>
        <tr><td>Fecha</td><td>${today}</td></tr>
        <tr><td>Validez</td><td>${calc.validez}</td></tr>
        <tr><td>Cliente</td><td><strong>${customerName}</strong></td></tr>
        ${calc.ubicacion ? `<tr><td>Ubicación</td><td>${calc.ubicacion}</td></tr>` : ''}
      </table>
    </div>
  </div>
  <h2>${serviceTitle}</h2>
  <table class="items">
    <thead><tr>
      <th>Descripción</th>
      <th style="width:70px;text-align:center">Unidad</th>
      <th style="width:55px;text-align:center">Cant.</th>
      <th style="width:120px;text-align:right">P. Unitario</th>
      <th style="width:130px;text-align:right">Total</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals-wrap"><table class="totals">
    <tr><td class="lbl">Subtotal</td><td class="val">${fmtGs(subtotal)}</td></tr>
    <tr><td class="lbl">IVA (${calc.iva}%)</td><td class="val">${fmtGs(ivaMonto)}</td></tr>
    ${calc.descuento > 0 ? `<tr><td class="lbl">Descuento</td><td class="val" style="color:#c0392b">-${fmtGs(calc.descuento)}</td></tr>` : ''}
    <tr class="total-row"><td>TOTAL GENERAL</td><td style="text-align:right">${fmtGs(totalGeneral)}</td></tr>
  </table></div>
  ${calc.observaciones ? `<div class="obs">${calc.observaciones}</div>` : ''}
  <div class="footer">
    <img src="/logo.png" alt="" />
    <small>Full Service &amp; Clean · Asunción, Paraguay<br/>Válido por ${calc.validez} desde la fecha de emisión.</small>
  </div>
</body></html>`;
}
