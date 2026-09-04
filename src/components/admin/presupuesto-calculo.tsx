'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, Trash2, Save, FileText, Loader2, Search, CheckCircle2, AlertCircle, Printer, X } from 'lucide-react';

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
  // Solo aplica a filas tipo 'titulo'
  gastosGeneralesPct?: number;
  margenPct?: number;
  aprobado?: boolean;
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
function sectionSubtotal(filas: FilaCalculo[], tituloId: string): number {
  let inside = false, total = 0;
  for (const r of filas) {
    if (r.id === tituloId) { inside = true; continue; }
    if (inside && r.tipo === 'titulo') break;
    if (inside) total += r.cantidad * r.precioVenta;
  }
  return total;
}

function sectionTotal(filas: FilaCalculo[], titulo: FilaCalculo): number {
  const sub = sectionSubtotal(filas, titulo.id);
  const gg = titulo.gastosGeneralesPct ?? 0;
  const mg = titulo.margenPct ?? 0;
  // gastos generales se aplican sobre subtotal, luego margen sobre (subtotal + gg)
  const conGG = sub * (1 + gg / 100);
  const conMg = conGG * (1 + mg / 100);
  return conMg;
}

/* ─── PDF Options ───────────────────────────────────── */
interface PdfOpts {
  soloAprobados: boolean;
  incluirDetalle: boolean;
  mostrarTotalSeccion: boolean;
  mostrarObservaciones: boolean;
}

function PdfOptsModal({ haySecciones, hayAprobados, onConfirm, onClose }: {
  haySecciones: boolean;
  hayAprobados: boolean;
  onConfirm: (opts: PdfOpts) => void;
  onClose: () => void;
}) {
  const [opts, setOpts] = useState<PdfOpts>({
    soloAprobados: hayAprobados,
    incluirDetalle: false,
    mostrarTotalSeccion: true,
    mostrarObservaciones: true,
  });
  const toggle = (k: keyof PdfOpts) => setOpts((o) => ({ ...o, [k]: !o[k] }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-steel-900/60 bg-carbon shadow-2xl">
        <div className="flex items-center justify-between border-b border-steel-900/40 px-5 py-4">
          <div className="flex items-center gap-2">
            <Printer className="h-4 w-4 text-blue-bright" />
            <span className="font-body text-body-sm font-semibold text-arctic">Opciones de PDF</span>
          </div>
          <button onClick={onClose} className="rounded p-1 text-steel-600 hover:text-arctic transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-1 px-5 py-4">
          {/* Sección: contenido */}
          <p className="font-body text-[0.6rem] font-semibold uppercase tracking-wider text-steel-600 mb-2">Contenido</p>
          {hayAprobados && (
            <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-steel-900/30">
              <input type="checkbox" checked={opts.soloAprobados} onChange={() => toggle('soloAprobados')}
                className="h-4 w-4 rounded border-steel-700 accent-[#48BB78]" />
              <div>
                <p className="font-body text-body-sm text-arctic">Solo secciones aprobadas</p>
                <p className="font-body text-[0.65rem] text-steel-500">Imprime únicamente lo que el cliente aprobó</p>
              </div>
            </label>
          )}
          {haySecciones && (
            <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-steel-900/30">
              <input type="checkbox" checked={opts.incluirDetalle} onChange={() => toggle('incluirDetalle')}
                className="h-4 w-4 rounded border-steel-700 accent-blue" />
              <div>
                <p className="font-body text-body-sm text-arctic">Incluir detalle de ítems</p>
                <p className="font-body text-[0.65rem] text-steel-500">Muestra materiales y mano de obra bajo cada título</p>
              </div>
            </label>
          )}
          {/* Sección: columnas */}
          <p className="font-body text-[0.6rem] font-semibold uppercase tracking-wider text-steel-600 mb-2 mt-3">Columnas visibles</p>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-steel-900/30">
            <input type="checkbox" checked={opts.mostrarTotalSeccion} onChange={() => toggle('mostrarTotalSeccion')}
              className="h-4 w-4 rounded border-steel-700 accent-blue" />
            <p className="font-body text-body-sm text-arctic">Total por sección</p>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-steel-900/30">
            <input type="checkbox" checked={opts.mostrarObservaciones} onChange={() => toggle('mostrarObservaciones')}
              className="h-4 w-4 rounded border-steel-700 accent-blue" />
            <p className="font-body text-body-sm text-arctic">Observaciones y condiciones</p>
          </label>
        </div>
        <div className="flex gap-2 border-t border-steel-900/40 px-5 py-4">
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={() => onConfirm(opts)} className="btn-primary flex flex-1 items-center justify-center gap-2">
            <Printer className="h-4 w-4" /> Generar PDF
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Props ─────────────────────────────────────────── */
interface Props {
  presupuestoId: string;
  serviceTitle: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCompany?: string;
  customerAddress?: string;
  description?: string;
  scheduledDate?: string;
  code: string;
  initial: CalculationData | null;
  onSaved: (data: CalculationData) => void;
}

/* ─── Component ─────────────────────────────────────── */
export function PresupuestoCalculo({ presupuestoId, serviceTitle, customerName, customerEmail, customerPhone, customerCompany, customerAddress, description, scheduledDate, code, initial, onSaved }: Props) {
  const [calc, setCalc] = useState<CalculationData>(() => {
    if (!initial) return defaultCalc();
    if (initial.filas) return initial;
    return { ...defaultCalc(), ubicacion: initial.ubicacion || '', validez: initial.validez || '10 días', observaciones: initial.observaciones || defaultCalc().observaciones };
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);   // tracks unsaved changes
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<{ id: string; original: string; corregido: string; titulo: string; alcance: string } | null>(null);

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

  /* ─── Approved totals (item-level) ─── */
  const titulos = calc.filas.filter((f) => f.tipo === 'titulo');
  const hayAprobados = calc.filas.some((f) => f.tipo !== 'titulo' && f.aprobado);

  const sectionAprobadoTotal = (t: FilaCalculo): number => {
    let inside = false, sub = 0;
    for (const r of calc.filas) {
      if (r.id === t.id) { inside = true; continue; }
      if (inside && r.tipo === 'titulo') break;
      if (inside && r.aprobado) sub += r.cantidad * r.precioVenta;
    }
    const conGG = sub * (1 + (t.gastosGeneralesPct ?? 0) / 100);
    return conGG * (1 + (t.margenPct ?? 0) / 100);
  };

  const subtotalAprobado = titulos.reduce((s, t) => s + sectionAprobadoTotal(t), 0);
  const ivaAprobado = subtotalAprobado * (calc.iva / 100);
  const totalAprobado = subtotalAprobado + ivaAprobado - calc.descuento;

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

  const mejorarConIA = async (fila: FilaCalculo) => {
    if (!fila.descripcion.trim() || aiLoadingId) return;
    setAiLoadingId(fila.id);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/mejorar-titulo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: fila.descripcion, contexto: serviceTitle }),
      });
      const data = await res.json();
      if (res.ok && (data.titulo || data.corregido)) {
        setAiSuggestion({ id: fila.id, original: fila.descripcion, corregido: data.corregido ?? data.titulo, titulo: data.titulo ?? data.corregido, alcance: data.alcance ?? '' });
      } else {
        setAiError(data.error || 'Error al procesar');
        setTimeout(() => setAiError(null), 4000);
      }
    } catch {
      setAiError('Sin conexión con el servidor AI');
      setTimeout(() => setAiError(null), 4000);
    } finally {
      setAiLoadingId(null);
    }
  };

  /* ─── PDF — auto-save, then print ─── */
  const generatePdf = useCallback(async (opts: PdfOpts) => {
    setShowPdfModal(false);
    setGeneratingPdf(true);
    await doSave(calc);
    const html = buildPdfHtml({ calc, code, serviceTitle, customerName, customerEmail, customerPhone, customerCompany, customerAddress, description, scheduledDate, subtotal, ivaMonto, totalGeneral, opts });
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => { win.print(); setGeneratingPdf(false); }, 600); }
    else setGeneratingPdf(false);
  }, [calc, code, serviceTitle, customerName, subtotal, ivaMonto, totalGeneral, presupuestoId]);

  /* ─── COLS layout ─── */
  // [check 22px] [badge 28px] [desc flex] [unidad 72px] [cant 60px] [costo 110px] [pventa 110px] [total 110px] [del 28px]
  const COLS = '22px 28px 1fr 72px 60px 110px 110px 110px 28px';

  const haySecciones = titulos.length > 0;

  /* ─── Render ─── */
  return (
    <div className="flex flex-col gap-4">
      {aiError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 font-body text-body-sm text-red-400">
          IA: {aiError}
        </div>
      )}
      {showPdfModal && (
        <PdfOptsModal
          haySecciones={haySecciones}
          hayAprobados={hayAprobados}
          onConfirm={generatePdf}
          onClose={() => setShowPdfModal(false)}
        />
      )}

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

      {/* ── Version history banner ── */}
      {(() => {
        const versions: { v: number; filas: FilaCalculo[] }[] | undefined = (calc as any).versions;
        if (!versions || versions.length === 0) return null;
        const lastV = versions[versions.length - 1];
        return (
          <div className="flex items-center gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-2.5">
            <span className="font-mono text-[0.6rem] font-bold text-yellow-400">v{lastV.v + 1}</span>
            <p className="font-body text-caption text-steel-400">
              Mostrando cambios respecto a <span className="text-yellow-400 font-semibold">v{lastV.v}</span> — los valores modificados aparecen tachados en rojo.
            </p>
            <span className="ml-auto font-mono text-[0.55rem] text-steel-600">{versions.length} versión{versions.length > 1 ? 'es' : ''} guardada{versions.length > 1 ? 's' : ''}</span>
          </div>
        );
      })()}

      {/* ── Main spreadsheet table ── */}
      <div className="rounded-lg border border-steel-900/50 overflow-hidden">

        {/* Table header */}
        <div className="grid items-center bg-steel-900/70 px-2 py-2 font-body text-[0.58rem] font-semibold uppercase tracking-wider text-steel-500"
          style={{ gridTemplateColumns: COLS }}>
          <span title="Aprobado por cliente" className="text-center text-[#48BB78]">✓</span>
          <span />
          <span>Descripción</span>
          <span className="text-center">Unidad</span>
          <span className="text-center">Cant.</span>
          <span className="text-right">Costo / %GG</span>
          <span className="text-right">P.Venta / %Mg</span>
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
              const rowTotal = fila.tipo !== 'titulo' ? fila.cantidad * fila.precioVenta : sectionTotal(calc.filas, fila);
              // Use versions history: compare against last saved version
              const versions: { v: number; filas: FilaCalculo[] }[] | undefined = (calc as any).versions;
              const lastVersion = versions && versions.length > 0 ? versions[versions.length - 1] : undefined;
              const prevFilas: FilaCalculo[] | undefined = lastVersion?.filas ?? (calc as any).previousFilas;
              const prev = prevFilas?.find((p) => p.id === fila.id);
              const cantChanged = prev && prev.cantidad !== fila.cantidad;
              const ventaChanged = prev && prev.precioVenta !== fila.precioVenta;
              // find parent titulo for non-titulo rows to determine if section is approved
              let parentAprobado = true;
              if (fila.tipo !== 'titulo' && hayAprobados) {
                let lastTitulo: FilaCalculo | null = null;
                for (const r of calc.filas) {
                  if (r.id === fila.id) break;
                  if (r.tipo === 'titulo') lastTitulo = r;
                }
                parentAprobado = lastTitulo ? !!lastTitulo.aprobado : false;
              }
              const dimmed = hayAprobados && !parentAprobado && fila.tipo !== 'titulo';
              return (
                <React.Fragment key={fila.id}>
                <div
                  className={`grid items-center gap-2 px-2 py-1.5 transition-opacity ${ROW_BG[fila.tipo]} ${dimmed ? 'opacity-40' : ''}`}
                  style={{ gridTemplateColumns: COLS }}>

                  {/* Aprobado checkbox — solo titulo */}
                  {fila.tipo === 'titulo' ? (
                    <button
                      onClick={() => updateFila(fila.id, { aprobado: !fila.aprobado })}
                      aria-label={fila.aprobado ? 'Desmarcar aprobación' : 'Marcar como aprobado por cliente'}
                      title={fila.aprobado ? 'Desmarcar aprobación' : 'Marcar como aprobado por cliente'}
                      className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${fila.aprobado ? 'border-[#48BB78] bg-[#48BB78]/20 text-[#48BB78]' : 'border-steel-700 text-transparent hover:border-[#48BB78]/50'}`}>
                      <span className="text-[0.6rem] font-bold leading-none">✓</span>
                    </button>
                  ) : <span />}

                  {/* Type badge */}
                  <span className={`flex h-5 w-5 items-center justify-center rounded text-[0.55rem] font-bold ${TYPE_BADGE[fila.tipo]}`}>
                    {TYPE_LABEL[fila.tipo]}
                  </span>

                  {/* Descripcion + botón IA en la misma celda */}
                  <div className="flex items-center gap-1 min-w-0 w-full">
                    {fila.tipo === 'titulo' ? (
                      <textarea
                        rows={1}
                        className="bg-transparent outline-none font-body text-body-sm placeholder:text-steel-800 w-full min-w-0 font-semibold text-arctic resize-none overflow-hidden leading-snug"
                        style={{ fieldSizing: 'content' } as React.CSSProperties}
                        value={fila.descripcion}
                        onChange={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; updateFila(fila.id, { descripcion: e.target.value }); }}
                        onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }}
                        placeholder="Título de sección..."
                      />
                    ) : (
                      <input
                        className="bg-transparent outline-none font-body text-body-sm placeholder:text-steel-800 w-full min-w-0 text-steel-300"
                        value={fila.descripcion}
                        onChange={(e) => updateFila(fila.id, { descripcion: e.target.value })}
                        placeholder={fila.tipo === 'material' ? 'Material...' : fila.tipo === 'mano_obra' ? 'Mano de obra / viático...' : 'Otro...'}
                      />
                    )}
                    {fila.tipo === 'titulo' && fila.descripcion.trim() && (
                      <button
                        onClick={() => mejorarConIA(fila)}
                        disabled={!!aiLoadingId}
                        title="Mejorar con IA"
                        className="ml-2 shrink-0 rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-wide border border-blue-bright/50 text-blue-bright hover:bg-blue-bright/20 disabled:opacity-40 transition-colors"
                      >
                        {aiLoadingId === fila.id ? '···' : '✦ IA'}
                      </button>
                    )}
                  </div>

                  {/* Unidad */}
                  {fila.tipo === 'titulo' ? <span /> : (
                    <input className="bg-transparent outline-none text-center font-mono text-body-sm text-steel-400 w-full"
                      value={fila.unidad} onChange={(e) => updateFila(fila.id, { unidad: e.target.value })} placeholder="unid" />
                  )}

                  {/* Cantidad */}
                  {fila.tipo === 'titulo' ? <span /> : (
                    <div className="flex flex-col items-center">
                      {cantChanged && (
                        <span className="font-mono text-[0.55rem] text-red-400/70 line-through leading-none mb-0.5">{prev!.cantidad}</span>
                      )}
                      <input type="number" min={0} step="any"
                        className="bg-transparent outline-none text-center font-mono text-body-sm text-arctic w-full"
                        value={fila.cantidad || ''} onChange={(e) => updateFila(fila.id, { cantidad: Number(e.target.value) })} />
                    </div>
                  )}

                  {/* Gastos generales % — solo titulo */}
                  {fila.tipo === 'titulo' ? (
                    <input type="number" min={0} max={100} step="0.5"
                      className="bg-steel-900/60 border border-steel-800/60 rounded px-1.5 py-1 outline-none text-right font-mono text-body-sm text-steel-300 w-full focus:border-blue-bright/40 focus:text-arctic transition-colors"
                      value={fila.gastosGeneralesPct ?? ''} placeholder="0"
                      onChange={(e) => updateFila(fila.id, { gastosGeneralesPct: e.target.value === '' ? undefined : Number(e.target.value) })} />
                  ) : (
                    <input type="number" min={0} step="any"
                      className="bg-transparent outline-none text-right font-mono text-body-sm text-steel-600 w-full"
                      value={fila.precioUnitario || ''} onChange={(e) => updateFila(fila.id, { precioUnitario: Number(e.target.value) })} placeholder="0" />
                  )}

                  {/* Margen % — solo titulo | P.Venta para otros */}
                  {fila.tipo === 'titulo' ? (
                    <input type="number" min={0} max={100} step="0.5"
                      className="bg-steel-900/60 border border-steel-800/60 rounded px-1.5 py-1 outline-none text-right font-mono text-body-sm text-steel-300 w-full focus:border-blue-bright/40 focus:text-arctic transition-colors"
                      value={fila.margenPct ?? ''} placeholder="0"
                      onChange={(e) => updateFila(fila.id, { margenPct: e.target.value === '' ? undefined : Number(e.target.value) })} />
                  ) : (
                    <div className="flex flex-col items-end">
                      {ventaChanged && (
                        <span className="font-mono text-[0.55rem] text-red-400/70 line-through leading-none mb-0.5">{prev!.precioVenta.toLocaleString('es-PY')}</span>
                      )}
                      <input type="number" min={0} step="any"
                        className="bg-transparent outline-none text-right font-mono text-body-sm text-steel-300 w-full"
                        value={fila.precioVenta || ''} onChange={(e) => updateFila(fila.id, { precioVenta: Number(e.target.value) })} placeholder="0" />
                    </div>
                  )}

                  {/* Total (qty × venta) */}
                  <span className={`text-right font-mono font-semibold ${fila.tipo === 'titulo' ? 'text-body-sm text-[#48BB78]' : 'text-body-sm text-[#48BB78]'}`}>
                    {rowTotal > 0 ? gs(rowTotal) : '—'}
                  </span>

                  {/* Delete */}
                  <button onClick={() => removeFila(fila.id)} aria-label="Eliminar fila" className="rounded p-1.5 text-steel-700 hover:text-red-400 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* AI suggestion panel */}
                {aiSuggestion?.id === fila.id && (
                  <div className="mx-2 mb-2 rounded-lg border border-blue-bright/20 bg-blue-bright/5 px-3 py-2 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <p className="font-body text-[0.6rem] font-semibold uppercase tracking-wider text-blue-bright/70">Sugerencias IA</p>
                      <button onClick={() => setAiSuggestion(null)} aria-label="Cerrar sugerencias" className="rounded p-1 text-steel-600 hover:text-steel-300 hover:bg-steel-800/50 transition-colors"><X className="h-3.5 w-3.5" /></button>
                    </div>

                    {/* Corregido vs Técnico, lado a lado */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Texto corregido ortográficamente */}
                      <div className="flex flex-col gap-1 rounded-md border border-steel-800/60 bg-steel-900/40 px-2 py-1.5">
                        <p className="font-body text-[0.55rem] font-semibold uppercase tracking-wider text-steel-400">Corregido</p>
                        <p className="font-body text-body-sm text-steel-200 leading-snug flex-1">{aiSuggestion.corregido}</p>
                        <button
                          onClick={() => { updateFila(aiSuggestion.id, { descripcion: aiSuggestion.corregido }); setAiSuggestion(null); }}
                          className="self-start rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-wide border border-steel-700 text-steel-400 hover:text-arctic hover:border-steel-500 transition-colors"
                        >
                          Usar
                        </button>
                      </div>
                      {/* Versión técnica profesional */}
                      <div className="flex flex-col gap-1 rounded-md border border-blue-bright/25 bg-blue-bright/5 px-2 py-1.5">
                        <p className="font-body text-[0.55rem] font-semibold uppercase tracking-wider text-blue-bright/70">Técnico</p>
                        <p className="font-body text-body-sm text-arctic font-semibold leading-snug flex-1">{aiSuggestion.titulo}</p>
                        <button
                          onClick={() => { updateFila(aiSuggestion.id, { descripcion: aiSuggestion.titulo }); setAiSuggestion(null); }}
                          className="self-start rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-wide border border-blue-bright/30 text-blue-bright hover:bg-blue-bright/10 transition-colors"
                        >
                          Usar
                        </button>
                      </div>
                    </div>

                    {/* Alcance sugerido */}
                    {aiSuggestion.alcance && (
                      <div className="flex items-start gap-2 border-t border-steel-800/40 pt-2">
                        <div className="flex-1">
                          <p className="font-body text-[0.58rem] text-steel-500 mb-0.5">Alcance de trabajos</p>
                          <p className="font-body text-body-sm text-steel-300 leading-relaxed">{aiSuggestion.alcance}</p>
                        </div>
                        <button
                          onClick={() => { updateFila(aiSuggestion.id, { descripcion: aiSuggestion.alcance }); setAiSuggestion(null); }}
                          className="shrink-0 rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-wide border border-blue-bright/30 text-blue-bright hover:bg-blue-bright/10 transition-colors"
                        >
                          Usar
                        </button>
                      </div>
                    )}
                  </div>
                )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Subtotal footer row */}
        {calc.filas.length > 0 && (
          <div className="grid items-center border-t-2 border-steel-900/60 bg-steel-900/40 px-2 py-2"
            style={{ gridTemplateColumns: COLS }}>
            <span /><span />
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

      {/* ── Total aprobado por cliente ── */}
      {hayAprobados && (
        <div className="rounded-lg border border-[#48BB78]/30 bg-[#48BB78]/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#48BB78]/20 text-[#48BB78] text-[0.6rem] font-bold">✓</span>
              <span className="font-body text-body-sm font-semibold text-[#48BB78]">Total aprobado por cliente</span>
            </div>
            <span className="font-mono text-caption text-steel-500">
              {titulos.filter((t) => t.aprobado).length} de {titulos.length} secciones aprobadas
            </span>
          </div>
          <div className="divide-y divide-[#48BB78]/10 font-body text-body-sm">
            {titulos.filter((t) => t.aprobado).map((t) => (
              <div key={t.id} className="flex justify-between py-1.5 text-steel-300">
                <span>{t.descripcion || 'Sin título'}</span>
                <span className="font-mono text-[#48BB78]">{gs(sectionTotal(calc.filas, t))}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[#48BB78]/20 pt-3">
            <span className="font-body text-caption text-steel-400">Subtotal aprobado + IVA ({calc.iva}%)</span>
            <span className="font-mono text-h3 font-bold text-[#48BB78]">{gs(totalAprobado)}</span>
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
          <button onClick={() => setShowPdfModal(true)} disabled={generatingPdf} className="btn-secondary flex items-center gap-2 px-4">
            {generatingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
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
function buildPdfHtml({ calc, code, serviceTitle, customerName, customerEmail, customerPhone, customerCompany, customerAddress, description, scheduledDate, subtotal, ivaMonto, totalGeneral, opts }: {
  calc: CalculationData; code: string; serviceTitle: string;
  customerName: string; customerEmail?: string; customerPhone?: string;
  customerCompany?: string; customerAddress?: string;
  description?: string; scheduledDate?: string;
  subtotal: number; ivaMonto: number; totalGeneral: number; opts: PdfOpts;
}) {
  const fmtGs = (n: number) => 'Gs. ' + Math.round(n).toLocaleString('es-PY');
  const today = new Date().toLocaleDateString('es-PY', { day: '2-digit', month: 'long', year: 'numeric' });
  const fmtScheduled = (d: string) => {
    const [y, m, day] = d.split('-').map(Number);
    if (!y) return d;
    return new Date(y, m - 1, day).toLocaleDateString('es-PY', { day: '2-digit', month: 'long', year: 'numeric' });
  };
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const secTotal = (t: FilaCalculo): number => {
    let inside = false, sub = 0;
    for (const r of calc.filas) {
      if (r.id === t.id) { inside = true; continue; }
      if (inside && r.tipo === 'titulo') break;
      if (inside) sub += r.cantidad * r.precioVenta;
    }
    const conGG = sub * (1 + (t.gastosGeneralesPct ?? 0) / 100);
    return conGG * (1 + (t.margenPct ?? 0) / 100);
  };

  // Item-level approval helpers for PDF
  const getItemsDeTitulo = (t: FilaCalculo): FilaCalculo[] => {
    let inside = false;
    const result: FilaCalculo[] = [];
    for (const r of calc.filas) {
      if (r.id === t.id) { inside = true; continue; }
      if (inside && r.tipo === 'titulo') break;
      if (inside) result.push(r);
    }
    return result;
  };
  const secAprobadoTotal = (t: FilaCalculo): number => {
    const items = getItemsDeTitulo(t).filter((r) => r.aprobado);
    const sub = items.reduce((s, r) => s + r.cantidad * r.precioVenta, 0);
    const conGG = sub * (1 + (t.gastosGeneralesPct ?? 0) / 100);
    return conGG * (1 + (t.margenPct ?? 0) / 100);
  };

  // Filter sections by approval option (item-level)
  let allTitulos = calc.filas.filter((f) => f.tipo === 'titulo');
  const titulosToShow = opts.soloAprobados
    ? allTitulos.filter((t) => getItemsDeTitulo(t).some((r) => r.aprobado))
    : allTitulos;
  const hasTitulos = titulosToShow.length > 0;

  // Recalculate totals for what's shown
  const shownSubtotal = opts.soloAprobados
    ? titulosToShow.reduce((s, t) => s + secAprobadoTotal(t), 0)
    : subtotal;
  const shownIva = shownSubtotal * (calc.iva / 100);
  const shownTotal = shownSubtotal + shownIva - calc.descuento;

  const totalCol = opts.mostrarTotalSeccion;

  // Build section HTML blocks (same design as detail PDF)
  const seccionesHTML = hasTitulos
    ? titulosToShow.map((t) => {
        const st = opts.soloAprobados ? secAprobadoTotal(t) : secTotal(t);
        const items = getItemsDeTitulo(t);
        const filteredItems = opts.soloAprobados ? items.filter((r) => r.aprobado) : items;
        const rowsHTML = opts.incluirDetalle
          ? filteredItems.map((r) => `
            <tr>
              <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;padding-left:20px;color:#4a5568;">${r.descripcion || '—'}</td>
              <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:center;color:#718096;">${r.unidad}</td>
              <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;color:#718096;">${r.cantidad}</td>
              ${totalCol ? `<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-family:monospace;color:#4a5568;">${fmtGs(r.cantidad * r.precioVenta)}</td>` : ''}
            </tr>`).join('')
          : '';
        return `
          <div style="margin-bottom:20px;">
            <div style="background:#1e2d3d;color:#e2e8f0;padding:8px 12px;font-weight:700;font-size:13px;border-radius:4px 4px 0 0;display:flex;justify-content:space-between;align-items:center;">
              <span>${t.descripcion || 'Sección sin título'}</span>
              ${totalCol ? `<span style="color:#90cdf4;font-family:monospace;">${fmtGs(st)}</span>` : ''}
            </div>
            ${opts.incluirDetalle && filteredItems.length > 0 ? `
            <table style="width:100%;border-collapse:collapse;font-size:12px;">
              <thead>
                <tr style="background:#f7fafc;">
                  <th style="padding:5px 8px 5px 20px;text-align:left;color:#718096;font-weight:600;border-bottom:2px solid #e2e8f0;font-size:11px;">Descripción</th>
                  <th style="padding:5px 8px;text-align:center;color:#718096;font-weight:600;border-bottom:2px solid #e2e8f0;font-size:11px;">Unidad</th>
                  <th style="padding:5px 8px;text-align:right;color:#718096;font-weight:600;border-bottom:2px solid #e2e8f0;font-size:11px;">Cant.</th>
                  ${totalCol ? '<th style="padding:5px 8px;text-align:right;color:#718096;font-weight:600;border-bottom:2px solid #e2e8f0;font-size:11px;">Total</th>' : ''}
                </tr>
              </thead>
              <tbody>${rowsHTML}</tbody>
            </table>` : ''}
          </div>`;
      }).join('')
    : (() => {
        const filasItems2 = calc.filas.filter((f) => f.tipo !== 'titulo');
        const rowsHTML = filasItems2.map((f) => `
          <tr>
            <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${f.descripcion || '—'}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:center;">${f.unidad}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">${f.cantidad}</td>
            ${totalCol ? `<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-family:monospace;">${fmtGs(f.cantidad * f.precioVenta)}</td>` : ''}
          </tr>`).join('');
        return `
          <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:20px;">
            <thead>
              <tr style="background:#f7fafc;">
                <th style="padding:6px 8px;text-align:left;color:#718096;font-weight:600;border-bottom:2px solid #e2e8f0;">Descripción</th>
                <th style="padding:6px 8px;text-align:center;color:#718096;font-weight:600;border-bottom:2px solid #e2e8f0;">Unidad</th>
                <th style="padding:6px 8px;text-align:right;color:#718096;font-weight:600;border-bottom:2px solid #e2e8f0;">Cant.</th>
                ${totalCol ? '<th style="padding:6px 8px;text-align:right;color:#718096;font-weight:600;border-bottom:2px solid #e2e8f0;">Total</th>' : ''}
              </tr>
            </thead>
            <tbody>${rowsHTML}</tbody>
          </table>`;
      })();

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><base href="${baseUrl}"><title>Presupuesto ${code}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#1a202c;background:#fff}
    @media print{
      body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .no-print{display:none!important}
      @page{margin:18mm 15mm}
    }
    .page{max-width:860px;margin:0 auto;padding:32px 24px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:3px solid #1e2d3d}
    .brand{display:flex;flex-direction:column;gap:4px}
    .brand img{height:56px;width:auto;object-fit:contain}
    .brand-sub{font-size:11px;color:#718096;letter-spacing:.04em}
    .doc-info{text-align:right}
    .doc-code{font-size:22px;font-weight:700;color:#2d8fcc;font-family:monospace}
    .doc-date{font-size:11px;color:#718096;margin-top:2px}
    .section-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#718096;margin-bottom:6px}
    .two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px}
    .info-box{background:#f7fafc;border-radius:6px;padding:12px 14px}
    .client-name{font-size:15px;font-weight:700;color:#1a202c;margin-bottom:4px}
    .client-detail{font-size:12px;color:#4a5568;line-height:1.6}
    .service-box{background:#ebf8ff;border-left:4px solid #2d8fcc;border-radius:0 6px 6px 0;padding:12px 14px}
    .service-title{font-size:14px;font-weight:700;color:#1a202c;margin-bottom:4px}
    .service-desc{font-size:12px;color:#4a5568;line-height:1.6}
    .totals-box{background:#f7fafc;border-radius:6px;padding:14px 16px;min-width:220px}
    .total-row{display:flex;justify-content:space-between;font-size:12px;color:#4a5568;padding:3px 0}
    .total-row.final{font-size:15px;font-weight:800;color:#1a202c;border-top:2px solid #1e2d3d;margin-top:6px;padding-top:8px}
    .total-row.final span:last-child{color:#2d8fcc;font-family:monospace}
    .footer-info{margin-top:28px;padding-top:16px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:flex-end}
    .validity{font-size:11px;color:#718096}
    .obs{font-size:10px;color:#a0aec0;max-width:460px;line-height:1.5}
    .print-btn{position:fixed;top:16px;right:16px;background:#2d8fcc;color:#fff;border:none;border-radius:6px;padding:10px 20px;font-size:13px;font-weight:600;cursor:pointer}
  </style></head><body>
  <div class="page">
    <button class="print-btn no-print" onclick="window.print()">🖨 Imprimir / Guardar PDF</button>

    <div class="header">
      <div class="brand">
        <img src="/logo.png" alt="Full Service &amp; Clean" />
        <div class="brand-sub">Servicios industriales y construcción</div>
      </div>
      <div class="doc-info">
        <div class="doc-code">${code}</div>
        <div class="doc-date">Emitido el ${today}</div>
        ${scheduledDate ? `<div class="doc-date">Fecha programada: ${fmtScheduled(scheduledDate)}</div>` : ''}
        ${calc.validez ? `<div class="doc-date">Validez: ${calc.validez}</div>` : ''}
        ${calc.ubicacion ? `<div class="doc-date">Ubicación: ${calc.ubicacion}</div>` : ''}
        ${opts.soloAprobados ? '<div class="doc-date" style="color:#2a6a3a;font-weight:600;">★ Secciones aprobadas</div>' : ''}
      </div>
    </div>

    <div class="two-col">
      <div>
        <div class="section-label">Cliente</div>
        <div class="info-box">
          <div class="client-name">${customerName || 'Sin nombre'}</div>
          <div class="client-detail">
            ${customerCompany ? `<div>${customerCompany}</div>` : ''}
            ${customerAddress ? `<div>${customerAddress}</div>` : ''}
            ${customerPhone ? `<div>Tel: ${customerPhone}</div>` : ''}
            ${customerEmail ? `<div>${customerEmail}</div>` : ''}
          </div>
        </div>
      </div>
      <div>
        <div class="section-label">Servicio solicitado</div>
        <div class="service-box">
          <div class="service-title">${serviceTitle}</div>
          ${description ? `<div class="service-desc">${description.replace(/\n/g, '<br>')}</div>` : ''}
        </div>
      </div>
    </div>

    <div class="section-label" style="margin-bottom:12px;">Detalle del presupuesto</div>
    ${seccionesHTML || '<p style="color:#718096;font-size:12px;margin-bottom:20px;">Sin ítems de cálculo cargados.</p>'}

    <div style="display:flex;justify-content:flex-end;margin-bottom:24px;">
      <div class="totals-box">
        <div class="total-row"><span>Subtotal</span><span style="font-family:monospace;">${fmtGs(shownSubtotal)}</span></div>
        <div class="total-row"><span>IVA (${calc.iva}%)</span><span style="font-family:monospace;">${fmtGs(shownIva)}</span></div>
        ${calc.descuento > 0 ? `<div class="total-row" style="color:#e53e3e;"><span>Descuento</span><span style="font-family:monospace;">-${fmtGs(calc.descuento)}</span></div>` : ''}
        <div class="total-row final"><span>TOTAL${opts.soloAprobados ? ' APROBADO' : ''}</span><span>${fmtGs(shownTotal)}</span></div>
      </div>
    </div>

    <div class="footer-info">
      <div class="obs">${opts.mostrarObservaciones && calc.observaciones ? calc.observaciones : ''}</div>
      <div class="validity">Validez de la oferta: <strong>${calc.validez}</strong></div>
    </div>
  </div>
</body></html>`;
}
