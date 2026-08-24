'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Save, FileText, Loader2, Package, Wrench, Search } from 'lucide-react';

/* ─── Material search autocomplete ──────────────────── */
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
        const res = await fetch(`/api/materiales?q=${encodeURIComponent(q)}&limit=8`);
        if (res.ok) { const d = await res.json(); setResults(d.materials || []); setOpen(true); }
      } finally { setLoading(false); }
    }, 300);
  }, [q]);

  const pick = (m: MaterialSuggestion) => { onSelect(m); setQ(''); setResults([]); setOpen(false); };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-md border border-steel-900/40 bg-carbon px-3 py-2">
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-steel-500" /> : <Search className="h-3.5 w-3.5 text-steel-500" />}
        <input
          value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="flex-1 bg-transparent font-body text-body-sm text-arctic outline-none placeholder:text-steel-700"
          placeholder="Buscar material del inventario..."
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-steel-900/60 bg-carbon shadow-xl">
          {results.map((m) => (
            <button key={m.id} onMouseDown={() => pick(m)} className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-steel-900/60">
              <div>
                <p className="font-body text-body-sm text-arctic">{m.description}</p>
                <p className="font-mono text-caption text-steel-500">{m.provider} · {m.unit}</p>
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
export interface LineaCalculo {
  id: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precioUnitario: number;
  tipo: 'material' | 'mano_obra' | 'otro';
}

export interface ItemPresupuesto {
  id: string;
  orden: number;
  descripcionCliente: string;
  unidad: string;
  cantidad: number;
  precioVenta: number;
  lineas: LineaCalculo[];
  expandido: boolean;
}

export interface CalculationData {
  items: ItemPresupuesto[];
  iva: number;        // porcentaje, default 10
  descuento: number;  // monto fijo en Gs
  validez: string;
  ubicacion: string;
  observaciones: string;
}

const defaultCalc = (): CalculationData => ({
  items: [], iva: 10, descuento: 0, validez: '10 días', ubicacion: '', observaciones:
    'Precios sujetos a relevamiento final, disponibilidad de materiales y confirmación técnica. No incluye trabajos no detallados en el presente presupuesto.',
});

const newItem = (orden: number): ItemPresupuesto => ({
  id: crypto.randomUUID(), orden, descripcionCliente: '', unidad: 'Global', cantidad: 1,
  precioVenta: 0, lineas: [], expandido: true,
});

const newLinea = (tipo: LineaCalculo['tipo']): LineaCalculo => ({
  id: crypto.randomUUID(), descripcion: '', unidad: 'unid', cantidad: 1, precioUnitario: 0, tipo,
});

const gs = (n: number) => 'Gs. ' + Math.round(n).toLocaleString('es-PY');
const pct = (n: number) => (isNaN(n) || !isFinite(n) ? '—' : n.toFixed(1) + '%');

/* ─── Component ─────────────────────────────────────── */
interface Props {
  presupuestoId: string;
  serviceTitle: string;
  customerName: string;
  code: string;
  initial: CalculationData | null;
  onSaved: (data: CalculationData) => void;
}

export function PresupuestoCalculo({ presupuestoId, serviceTitle, customerName, code, initial, onSaved }: Props) {
  const [calc, setCalc] = useState<CalculationData>(initial && initial.items ? initial : defaultCalc());
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  /* ─── Calculations ─── */
  const costoItem = (item: ItemPresupuesto) =>
    item.lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0);

  const totalVentaItem = (item: ItemPresupuesto) => item.cantidad * item.precioVenta;

  const subtotal = calc.items.reduce((s, i) => s + totalVentaItem(i), 0);
  const ivaMonto = subtotal * (calc.iva / 100);
  const totalGeneral = subtotal + ivaMonto - calc.descuento;

  /* ─── Mutators ─── */
  const setItems = (items: ItemPresupuesto[]) => setCalc((c) => ({ ...c, items }));

  const addItem = () =>
    setItems([...calc.items, newItem(calc.items.length + 1)]);

  const removeItem = (id: string) =>
    setItems(calc.items.filter((i) => i.id !== id).map((i, idx) => ({ ...i, orden: idx + 1 })));

  const updateItem = (id: string, patch: Partial<ItemPresupuesto>) =>
    setItems(calc.items.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const toggleItem = (id: string) =>
    updateItem(id, { expandido: !calc.items.find((i) => i.id === id)?.expandido });

  const addLinea = (itemId: string, tipo: LineaCalculo['tipo']) =>
    updateItem(itemId, {
      lineas: [...(calc.items.find((i) => i.id === itemId)?.lineas ?? []), newLinea(tipo)],
    });

  const removeLinea = (itemId: string, lineaId: string) =>
    updateItem(itemId, {
      lineas: calc.items.find((i) => i.id === itemId)?.lineas.filter((l) => l.id !== lineaId) ?? [],
    });

  const updateLinea = (itemId: string, lineaId: string, patch: Partial<LineaCalculo>) =>
    updateItem(itemId, {
      lineas: calc.items.find((i) => i.id === itemId)?.lineas.map((l) =>
        l.id === lineaId ? { ...l, ...patch } : l
      ) ?? [],
    });

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

  /* ─── PDF generation ─── */
  const generatePdf = useCallback(() => {
    setGeneratingPdf(true);
    const html = buildPdfHtml({ calc, code, serviceTitle, customerName, subtotal, ivaMonto, totalGeneral });
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => { win.print(); setGeneratingPdf(false); }, 600);
    } else {
      setGeneratingPdf(false);
    }
  }, [calc, code, serviceTitle, customerName, subtotal, ivaMonto, totalGeneral]);

  /* ─── Render ─── */
  return (
    <div className="space-y-4">
      {/* Header info */}
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

      {/* Items */}
      <div className="space-y-3">
        {calc.items.map((item) => {
          const costo = costoItem(item);
          const venta = totalVentaItem(item);
          const margen = venta - costo;
          const margenPct = costo > 0 ? (margen / venta) * 100 : 0;
          return (
            <div key={item.id} className="rounded-lg border border-steel-900/60 bg-carbon overflow-hidden">
              {/* Item header */}
              <div className="flex items-center gap-3 bg-steel-900/40 px-4 py-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-blue/20 font-mono text-caption text-blue-bright">{item.orden}</span>
                <input
                  className="flex-1 bg-transparent font-body text-body-sm text-arctic outline-none placeholder:text-steel-700"
                  value={item.descripcionCliente}
                  onChange={(e) => updateItem(item.id, { descripcionCliente: e.target.value })}
                  placeholder="Descripción para el cliente..."
                />
                <div className="flex shrink-0 items-center gap-2">
                  {costo > 0 && (
                    <span className={`font-mono text-caption ${margen >= 0 ? 'text-[#48BB78]' : 'text-red-400'}`}>
                      {pct(margenPct)} margen
                    </span>
                  )}
                  <button onClick={() => toggleItem(item.id)} className="rounded p-1 text-steel-500 hover:text-arctic">
                    {item.expandido ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  <button onClick={() => removeItem(item.id)} className="rounded p-1 text-steel-700 hover:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {item.expandido && (
                <div className="p-4 space-y-4">
                  {/* Item pricing for client */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="label mb-1 block">Unidad</label>
                      <input className="input" value={item.unidad} onChange={(e) => updateItem(item.id, { unidad: e.target.value })} placeholder="Global, m², m, unid..." />
                    </div>
                    <div>
                      <label className="label mb-1 block">Cantidad</label>
                      <input type="number" className="input font-mono" value={item.cantidad} min={1} onChange={(e) => updateItem(item.id, { cantidad: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className="label mb-1 block">Precio unitario (cliente)</label>
                      <input type="number" className="input font-mono" value={item.precioVenta} onChange={(e) => updateItem(item.id, { precioVenta: Number(e.target.value) })} placeholder="Gs." />
                    </div>
                  </div>

                  {/* Internal cost lines */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-body text-caption font-semibold uppercase tracking-wider text-steel-500">Cálculo interno de costos</span>
                      <div className="flex gap-2">
                        <button onClick={() => addLinea(item.id, 'material')} className="flex items-center gap-1 rounded px-2 py-1 text-caption text-blue-bright hover:bg-blue/10">
                          <Package className="h-3 w-3" /> + Material
                        </button>
                        <button onClick={() => addLinea(item.id, 'mano_obra')} className="flex items-center gap-1 rounded px-2 py-1 text-caption text-[#48BB78] hover:bg-[#48BB78]/10">
                          <Wrench className="h-3 w-3" /> + M. obra/Otro
                        </button>
                      </div>
                    </div>
                    <div className="mb-3">
                      <MaterialSearch onSelect={(m) => updateItem(item.id, {
                        lineas: [...(calc.items.find(i => i.id === item.id)?.lineas ?? []), {
                          id: crypto.randomUUID(), descripcion: m.description, unidad: m.unit,
                          cantidad: 1, precioUnitario: Number(m.unitPrice), tipo: 'material',
                        }],
                      })} />
                    </div>

                    {item.lineas.length === 0 ? (
                      <p className="py-3 text-center font-body text-caption text-steel-700">Sin líneas — agregá materiales o mano de obra</p>
                    ) : (
                      <div className="divide-y divide-steel-900/30 rounded-lg border border-steel-900/40">
                        {/* Table header */}
                        <div className="grid grid-cols-[1fr_80px_100px_100px_32px] gap-2 bg-steel-900/30 px-3 py-1.5 font-body text-[0.6rem] uppercase tracking-wider text-steel-700">
                          <span>Descripción</span><span className="text-center">Cantidad</span><span className="text-right">P. Unit.</span><span className="text-right">Subtotal</span><span />
                        </div>
                        {item.lineas.map((l) => (
                          <div key={l.id} className={`grid grid-cols-[1fr_80px_100px_100px_32px] gap-2 px-3 py-2 items-center ${l.tipo === 'material' ? 'bg-blue/[0.03]' : 'bg-[#48BB78]/[0.03]'}`}>
                            <input className="bg-transparent font-body text-body-sm text-steel-300 outline-none placeholder:text-steel-800" value={l.descripcion} onChange={(e) => updateLinea(item.id, l.id, { descripcion: e.target.value })} placeholder={l.tipo === 'material' ? 'Material...' : 'Mano de obra / flete / otro...'} />
                            <input type="number" className="bg-transparent text-center font-mono text-body-sm text-arctic outline-none" value={l.cantidad} min={0} onChange={(e) => updateLinea(item.id, l.id, { cantidad: Number(e.target.value) })} />
                            <input type="number" className="bg-transparent text-right font-mono text-body-sm text-arctic outline-none" value={l.precioUnitario} min={0} onChange={(e) => updateLinea(item.id, l.id, { precioUnitario: Number(e.target.value) })} />
                            <span className="text-right font-mono text-body-sm text-steel-400">{gs(l.cantidad * l.precioUnitario)}</span>
                            <button onClick={() => removeLinea(item.id, l.id)} className="rounded p-1 text-steel-800 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Item summary */}
                  <div className="grid grid-cols-3 gap-3 rounded-lg bg-steel-900/20 px-4 py-3 font-mono text-body-sm">
                    <div><p className="text-steel-500 text-caption">Costo real</p><p className="text-arctic">{gs(costo)}</p></div>
                    <div><p className="text-steel-500 text-caption">Precio venta</p><p className="text-arctic">{gs(venta)}</p></div>
                    <div><p className="text-steel-500 text-caption">Margen</p><p className={margen >= 0 ? 'text-[#48BB78]' : 'text-red-400'}>{gs(margen)} ({pct(margenPct)})</p></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add item */}
      <button onClick={addItem} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-steel-900/60 py-3 font-body text-body-sm text-steel-500 hover:border-blue/40 hover:text-blue-bright transition-colors">
        <Plus className="h-4 w-4" /> Agregar ítem
      </button>

      {/* Totals */}
      {calc.items.length > 0 && (
        <div className="rounded-lg border border-steel-900/40 bg-carbon-light p-4 space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label mb-1 block">IVA (%)</label>
              <input type="number" className="input font-mono" value={calc.iva} min={0} max={100} onChange={(e) => setCalc((c) => ({ ...c, iva: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label mb-1 block">Descuento (Gs.)</label>
              <input type="number" className="input font-mono" value={calc.descuento} min={0} onChange={(e) => setCalc((c) => ({ ...c, descuento: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="divide-y divide-steel-900/30">
            <div className="flex justify-between py-2 font-body text-body-sm text-steel-300"><span>Subtotal</span><span className="font-mono">{gs(subtotal)}</span></div>
            <div className="flex justify-between py-2 font-body text-body-sm text-steel-300"><span>IVA ({calc.iva}%)</span><span className="font-mono">{gs(ivaMonto)}</span></div>
            {calc.descuento > 0 && <div className="flex justify-between py-2 font-body text-body-sm text-[#FC8181]"><span>Descuento</span><span className="font-mono">-{gs(calc.descuento)}</span></div>}
            <div className="flex justify-between py-2 font-display text-h3 text-arctic"><span>TOTAL GENERAL</span><span className="font-mono text-[#48BB78]">{gs(totalGeneral)}</span></div>
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
        {calc.items.length > 0 && (
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

  const rows = calc.items.map((item) => `
    <tr>
      <td style="text-align:center">${item.orden}</td>
      <td>${item.descripcionCliente}</td>
      <td style="text-align:center">${item.unidad}</td>
      <td style="text-align:center">${item.cantidad}</td>
      <td style="text-align:right">${gs(item.precioVenta)}</td>
      <td style="text-align:right">${gs(item.cantidad * item.precioVenta)}</td>
    </tr>`).join('');

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
    <div>
      <div class="brand"><span>Full Service</span> <em>&amp; Clean</em></div>
      <div style="color:#555;margin-top:4px;font-size:10px">Servicios profesionales de mantenimiento y construcción</div>
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
    <thead><tr><th style="width:40px">N°</th><th>Descripción</th><th style="width:70px;text-align:center">Unidad</th><th style="width:60px;text-align:center">Cant.</th><th style="width:110px;text-align:right">P. Unitario</th><th style="width:120px;text-align:right">Total</th></tr></thead>
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
</body></html>`;
}
