'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Printer, ChevronDown, Plus, Trash2, Search,
  Loader2, CheckCircle2, AlertCircle, X, FileText, Calculator,
  Package, Hammer, Truck, Wrench, Building2, Edit3, Check
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MaterialSuggestion {
  id: string; description: string; unit: string; unitPrice: number;
  provider: string; category: string;
}

interface MatRow {
  id: string; desc: string; unidad: string; cant: number;
  costo: number; desp: number; marg: number;
}

interface MoRow {
  id: string; desc: string; pers: number; horas: number; vh: number; marg: number;
}

interface Rubro {
  id: string; nombre: string;
  mats: MatRow[]; mos: MoRow[];
  flete: number; equipos: number; subcontratos: number; varios: number;
  overhead: number; margen: number; descMat: string; descMo: string;
  enPropuesta: boolean;
}

interface DatosObra {
  cliente: string; obra: string; domicilio: string; contacto: string;
  plazo: string; validez: string; pago: string; alcance: string;
  condiciones: string;
  firmaNombre: string; firmaCargo: string;
  descuento: number; iva: number; empresa: string;
}

interface PresupuestoData {
  id: string; code: string; status: string; serviceType: string; serviceTitle: string;
  customer: { name: string; email: string; phone: string; company: string; address: string };
  estimatedValue: number | null; finalValue: number | null;
  calculationData: { rubros?: Rubro[]; datosObra?: DatosObra } | null;
  createdAt: string; updatedAt: string;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  borrador:    { label: 'Borrador',    cls: 'bg-steel-900 text-steel-300' },
  nuevo:       { label: 'Nuevo',       cls: 'bg-blue-muted text-blue-bright' },
  en_revision: { label: 'En revisión', cls: 'bg-yellow-muted text-yellow-bright' },
  cotizado:    { label: 'Cotizado',    cls: 'bg-yellow-muted text-yellow-bright' },
  aprobado:    { label: 'Aprobado',    cls: 'bg-success-light text-[#48BB78]' },
  en_ejecucion:{ label: 'En ejecución',cls: 'bg-success-light text-[#48BB78]' },
  completado:  { label: 'Completado',  cls: 'bg-steel-900 text-steel-300' },
  rechazado:   { label: 'Rechazado',   cls: 'bg-danger-light text-red-400' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const gs = (n: number) => `Gs. ${Math.round(n).toLocaleString('es-PY')}`;
const uid = () => crypto.randomUUID();
const newMat = (): MatRow => ({ id: uid(), desc: '', unidad: 'un', cant: 1, costo: 0, desp: 0, marg: 20 });
const newMo  = (): MoRow  => ({ id: uid(), desc: '', pers: 1, horas: 1, vh: 0, marg: 20 });
const newRubro = (n = 1): Rubro => ({
  id: uid(), nombre: `Rubro ${n}`,
  mats: [newMat()], mos: [newMo()],
  flete: 0, equipos: 0, subcontratos: 0, varios: 0,
  overhead: 10, margen: 20, descMat: '', descMo: '',
  enPropuesta: true,
});

function calcMat(r: MatRow) {
  const base = r.cant * r.costo;
  const costo = base * (1 + r.desp / 100);
  const precio = costo * (1 + r.marg / 100);
  return { costo, precio };
}

function calcMo(r: MoRow) {
  const costo = r.pers * r.horas * r.vh;
  const precio = costo * (1 + r.marg / 100);
  return { costo, precio };
}

function calcRubro(rb: Rubro) {
  const matCosto  = rb.mats.reduce((s, r) => s + calcMat(r).costo, 0);
  const matPrecio = rb.mats.reduce((s, r) => s + calcMat(r).precio, 0);
  const moCosto   = rb.mos.reduce((s, r) => s + calcMo(r).costo, 0);
  const moPrecio  = rb.mos.reduce((s, r) => s + calcMo(r).precio, 0);
  const otrosCosto = rb.flete + rb.equipos + rb.subcontratos + rb.varios;
  const otrosPrecio = otrosCosto * (1 + rb.margen / 100);
  const subCosto  = (matCosto + moCosto + otrosCosto) * (1 + rb.overhead / 100);
  const subPrecio = (matPrecio + moPrecio + otrosPrecio) * (1 + rb.overhead / 100);
  return { matCosto, matPrecio, moCosto, moPrecio, otrosCosto, otrosPrecio, subCosto, subPrecio };
}

const CONDICIONES_DEFAULT = 'Los precios se mantienen dentro del plazo de validez indicado y están sujetos a la disponibilidad de materiales al momento de la aceptación. No se incluyen trabajos, materiales ni gestiones que no figuren en el alcance. Cualquier adicional se cotiza por separado y por escrito antes de ejecutarse.';

const defaultDatos = (p: PresupuestoData): DatosObra => ({
  empresa: 'Full Service & Clean',
  cliente: p.customer.name || '',
  obra: p.serviceTitle || '',
  domicilio: p.customer.address || '',
  contacto: p.customer.phone || '',
  plazo: '', validez: '30 días', pago: 'A convenir', alcance: '',
  condiciones: CONDICIONES_DEFAULT,
  firmaNombre: '', firmaCargo: 'Gerente de Proyecto',
  descuento: 0, iva: 10,
});

// ─── Material Search ──────────────────────────────────────────────────────────

function MatSearch({ onSelect }: { onSelect: (m: MaterialSuggestion) => void }) {
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

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded border border-steel-700 bg-steel-900/40 px-3 py-2">
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-steel-500 shrink-0" /> : <Search className="h-3.5 w-3.5 text-steel-500 shrink-0" />}
        <input
          value={q} onChange={e => setQ(e.target.value)} onFocus={() => results.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="flex-1 bg-transparent font-mono text-xs text-arctic outline-none placeholder:text-steel-500"
          placeholder="Buscar en inventario…"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded border border-steel-700 bg-carbon shadow-xl">
          {results.map(m => (
            <button key={m.id} onMouseDown={() => { onSelect(m); setQ(''); setResults([]); setOpen(false); }}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-steel-900">
              <div>
                <p className="font-body text-xs text-arctic">{m.description}</p>
                <p className="font-mono text-[10px] text-steel-500">{m.category} · {m.unit}</p>
              </div>
              <span className="shrink-0 font-mono text-xs text-[#48BB78]">{gs(m.unitPrice)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Inline number input ──────────────────────────────────────────────────────

function NumInput({ value, onChange, className = '' }: { value: number; onChange: (v: number) => void; className?: string }) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => setLocal(String(value)), [value]);
  return (
    <input
      type="text" inputMode="decimal" value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={() => { const n = parseFloat(local.replace(/,/g, '.')); onChange(isNaN(n) ? 0 : n); }}
      className={`w-full bg-transparent text-right font-mono text-xs text-arctic outline-none ${className}`}
    />
  );
}

// ─── Tabla Materiales ─────────────────────────────────────────────────────────

function TablaMateriales({ mats, onChange }: { mats: MatRow[]; onChange: (m: MatRow[]) => void }) {
  const update = (id: string, patch: Partial<MatRow>) => onChange(mats.map(r => r.id === id ? { ...r, ...patch } : r));
  const remove = (id: string) => onChange(mats.filter(r => r.id !== id));
  const add = () => onChange([...mats, newMat()]);
  const fromInv = (m: MaterialSuggestion) => onChange([...mats, { ...newMat(), desc: m.description, unidad: m.unit, costo: m.unitPrice }]);

  return (
    <div className="rounded-xl border border-steel-700 overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-steel-700 bg-steel-900/30">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-blue-bright" />
          <span className="font-body text-sm font-semibold text-arctic">Materiales e insumos</span>
          <span className="font-mono text-[10px] text-steel-500 uppercase tracking-widest">cantidad × costo + desperdicio</span>
        </div>
        <button onClick={add} className="flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium text-blue-bright hover:bg-blue-muted transition-colors">
          <Plus className="h-3.5 w-3.5" /> Agregar fila
        </button>
      </div>

      {/* col headers */}
      <div className="grid px-4 py-2 bg-steel-900/20 border-b border-steel-700 font-mono text-[9px] uppercase tracking-widest text-steel-500"
        style={{ gridTemplateColumns: '1fr 50px 60px 100px 52px 110px 54px 110px 28px' }}>
        <div>Descripción</div>
        <div className="text-center">Unidad</div>
        <div className="text-right">Cant.</div>
        <div className="text-right">Costo unit.</div>
        <div className="text-right">Desp.%</div>
        <div className="text-right">Subtotal costo</div>
        <div className="text-right text-blue-bright">Marg.%</div>
        <div className="text-right">Precio venta</div>
        <div />
      </div>

      {/* rows */}
      {mats.map(r => {
        const { costo, precio } = calcMat(r);
        return (
          <div key={r.id} className="grid items-center px-4 border-b border-steel-900/60 hover:bg-steel-900/20"
            style={{ gridTemplateColumns: '1fr 50px 60px 100px 52px 110px 54px 110px 28px' }}>
            <input value={r.desc} onChange={e => update(r.id, { desc: e.target.value })}
              placeholder="Descripción" className="py-2.5 pr-2 bg-transparent font-body text-xs text-arctic outline-none placeholder:text-steel-600 w-full" />
            <input value={r.unidad} onChange={e => update(r.id, { unidad: e.target.value })}
              className="py-2.5 px-1 bg-transparent font-mono text-xs text-steel-300 text-center outline-none w-full" />
            <div className="py-2.5 px-2"><NumInput value={r.cant} onChange={v => update(r.id, { cant: v })} /></div>
            <div className="py-2.5 px-2"><NumInput value={r.costo} onChange={v => update(r.id, { costo: v })} /></div>
            <div className="py-2.5 px-2"><NumInput value={r.desp} onChange={v => update(r.id, { desp: v })} className="text-steel-400" /></div>
            <div className="py-2.5 px-2 font-mono text-xs text-steel-400 text-right whitespace-nowrap">{gs(costo)}</div>
            <div className="py-2.5 px-1"><NumInput value={r.marg} onChange={v => update(r.id, { marg: v })} className="text-blue-bright font-semibold" /></div>
            <div className="py-2.5 pl-2 font-mono text-xs font-semibold text-arctic text-right whitespace-nowrap">{gs(precio)}</div>
            <button onClick={() => remove(r.id)} className="justify-self-center rounded p-1 text-steel-700 hover:text-red-400 hover:bg-red-500/10 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}

      {/* footer: totales + buscador */}
      <div className="px-4 pt-3 pb-2 border-b border-steel-700">
        <MatSearch onSelect={fromInv} />
      </div>
      <div className="flex items-baseline justify-end gap-4 px-4 py-2.5 bg-steel-900/20 font-mono text-xs">
        <span className="text-steel-500">Costo materiales</span>
        <span className="text-steel-300">{gs(mats.reduce((s, r) => s + calcMat(r).costo, 0))}</span>
        <span className="text-steel-500 ml-3">Precio de venta</span>
        <span className="text-arctic font-semibold text-sm">{gs(mats.reduce((s, r) => s + calcMat(r).precio, 0))}</span>
      </div>
    </div>
  );
}

// ─── Tabla Mano de Obra ───────────────────────────────────────────────────────

function TablaMO({ mos, onChange }: { mos: MoRow[]; onChange: (m: MoRow[]) => void }) {
  const update = (id: string, patch: Partial<MoRow>) => onChange(mos.map(r => r.id === id ? { ...r, ...patch } : r));
  const remove = (id: string) => onChange(mos.filter(r => r.id !== id));
  const add = () => onChange([...mos, newMo()]);

  return (
    <div className="rounded-xl border border-steel-700 overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-steel-700 bg-steel-900/30">
        <div className="flex items-center gap-2">
          <Hammer className="h-4 w-4 text-orange-bright" />
          <span className="font-body text-sm font-semibold text-arctic">Mano de obra y servicios</span>
          <span className="font-mono text-[10px] text-steel-500 uppercase tracking-widest">personas × horas × valor hora</span>
        </div>
        <button onClick={add} className="flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium text-orange-bright hover:bg-orange-muted transition-colors">
          <Plus className="h-3.5 w-3.5" /> Agregar tarea
        </button>
      </div>

      <div className="grid px-4 py-2 bg-steel-900/20 border-b border-steel-700 font-mono text-[9px] uppercase tracking-widest text-steel-500"
        style={{ gridTemplateColumns: '1fr 60px 60px 100px 110px 54px 110px 28px' }}>
        <div>Tarea / gremio</div>
        <div className="text-center">Personas</div>
        <div className="text-right">Horas</div>
        <div className="text-right">Valor/hora</div>
        <div className="text-right">Subtotal costo</div>
        <div className="text-right text-blue-bright">Marg.%</div>
        <div className="text-right">Precio venta</div>
        <div />
      </div>

      {mos.map(r => {
        const { costo, precio } = calcMo(r);
        return (
          <div key={r.id} className="grid items-center px-4 border-b border-steel-900/60 hover:bg-steel-900/20"
            style={{ gridTemplateColumns: '1fr 60px 60px 100px 110px 54px 110px 28px' }}>
            <input value={r.desc} onChange={e => update(r.id, { desc: e.target.value })}
              placeholder="Tarea o gremio" className="py-2.5 pr-2 bg-transparent font-body text-xs text-arctic outline-none placeholder:text-steel-600 w-full" />
            <div className="py-2.5 px-2"><NumInput value={r.pers} onChange={v => update(r.id, { pers: v })} className="text-center" /></div>
            <div className="py-2.5 px-2"><NumInput value={r.horas} onChange={v => update(r.id, { horas: v })} /></div>
            <div className="py-2.5 px-2"><NumInput value={r.vh} onChange={v => update(r.id, { vh: v })} /></div>
            <div className="py-2.5 px-2 font-mono text-xs text-steel-400 text-right whitespace-nowrap">{gs(costo)}</div>
            <div className="py-2.5 px-1"><NumInput value={r.marg} onChange={v => update(r.id, { marg: v })} className="text-blue-bright font-semibold" /></div>
            <div className="py-2.5 pl-2 font-mono text-xs font-semibold text-arctic text-right whitespace-nowrap">{gs(precio)}</div>
            <button onClick={() => remove(r.id)} className="justify-self-center rounded p-1 text-steel-700 hover:text-red-400 hover:bg-red-500/10 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}

      <div className="flex items-baseline justify-end gap-4 px-4 py-2.5 bg-steel-900/20 font-mono text-xs">
        <span className="text-steel-500">Costo mano de obra</span>
        <span className="text-steel-300">{gs(mos.reduce((s, r) => s + calcMo(r).costo, 0))}</span>
        <span className="text-steel-500 ml-3">Precio de venta</span>
        <span className="text-arctic font-semibold text-sm">{gs(mos.reduce((s, r) => s + calcMo(r).precio, 0))}</span>
      </div>
    </div>
  );
}

// ─── Vista Planilla ───────────────────────────────────────────────────────────

function VistaPlanilla({ rubros, datos, onChange, onDatosChange }: {
  rubros: Rubro[]; datos: DatosObra;
  onChange: (r: Rubro[]) => void;
  onDatosChange: (d: DatosObra) => void;
}) {
  const [activeRubro, setActiveRubro] = useState(0);

  const updateRubro = (id: string, patch: Partial<Rubro>) =>
    onChange(rubros.map(r => r.id === id ? { ...r, ...patch } : r));
  const addRubro = () => { onChange([...rubros, newRubro(rubros.length + 1)]); setActiveRubro(rubros.length); };
  const delRubro = (id: string) => {
    const next = rubros.filter(r => r.id !== id);
    onChange(next); setActiveRubro(Math.max(0, activeRubro - 1));
  };
  const dupRubro = (rb: Rubro) => {
    const copy = { ...rb, id: uid(), nombre: rb.nombre + ' (copia)', mats: rb.mats.map(m => ({ ...m, id: uid() })), mos: rb.mos.map(m => ({ ...m, id: uid() })) };
    const next = [...rubros]; next.splice(activeRubro + 1, 0, copy);
    onChange(next); setActiveRubro(activeRubro + 1);
  };

  const rb = rubros[activeRubro] ?? rubros[0];
  if (!rb) return null;

  const totales = rubros.filter(r => r.enPropuesta).reduce((acc, r) => {
    const c = calcRubro(r);
    return { costo: acc.costo + c.subCosto, precio: acc.precio + c.subPrecio };
  }, { costo: 0, precio: 0 });

  const conDescuento = totales.precio * (1 - datos.descuento / 100);
  const totalFinal = conDescuento * (1 + datos.iva / 100);

  const { matCosto, matPrecio, moCosto, moPrecio, otrosCosto, otrosPrecio, subCosto, subPrecio } = calcRubro(rb);

  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: 'minmax(0,1fr) 300px' }}>
      {/* ── Columna principal ── */}
      <div className="flex flex-col gap-5 min-w-0">

        {/* Rubros tabs */}
        <div className="rounded-xl border border-steel-700 bg-carbon-light p-4">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="font-mono text-[9px] uppercase tracking-widest text-steel-500 mr-1">Rubros del presupuesto</span>
            {rubros.map((r, i) => (
              <button key={r.id} onClick={() => setActiveRubro(i)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${i === activeRubro ? 'bg-blue text-white' : 'bg-steel-900 text-steel-300 hover:bg-steel-700'}`}>
                {r.nombre}
              </button>
            ))}
            <button onClick={addRubro} className="px-3 py-1.5 rounded text-xs font-medium text-blue-bright bg-blue-muted hover:bg-steel-900 transition-colors">
              + Nuevo rubro
            </button>
          </div>

          {/* Incluir en propuesta */}
          <div className="flex items-center gap-2 flex-wrap py-2.5 border-t border-b border-steel-900 mb-3">
            <span className="font-mono text-[9px] uppercase tracking-widest text-steel-500 mr-1">Incluir en propuesta</span>
            {rubros.map((r, i) => (
              <button key={r.id} onClick={() => updateRubro(r.id, { enPropuesta: !r.enPropuesta })}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${r.enPropuesta ? 'bg-success-light text-[#48BB78]' : 'bg-steel-900 text-steel-500'}`}>
                {r.enPropuesta && <Check className="h-3 w-3" />} {r.nombre}
              </button>
            ))}
          </div>

          {/* Nombre + acciones del rubro activo */}
          <div className="flex items-end gap-3">
            <label className="flex-1 flex flex-col gap-1.5">
              <span className="font-mono text-[9px] uppercase tracking-widest text-steel-500">Nombre del rubro</span>
              <input value={rb.nombre} onChange={e => updateRubro(rb.id, { nombre: e.target.value })}
                className="rounded border border-steel-700 bg-steel-900/40 px-3 py-2 font-body text-sm font-semibold text-arctic outline-none focus:border-blue transition-colors" />
            </label>
            <button onClick={() => dupRubro(rb)} className="px-3 py-2 rounded border border-steel-700 text-xs font-medium text-steel-300 hover:bg-steel-900 transition-colors">Duplicar</button>
            <button onClick={() => delRubro(rb.id)} disabled={rubros.length <= 1}
              className="px-3 py-2 rounded border border-steel-700 text-xs font-medium text-red-400 hover:bg-danger-light disabled:opacity-30 transition-colors">
              Eliminar rubro
            </button>
          </div>
        </div>

        {/* Materiales */}
        <TablaMateriales mats={rb.mats} onChange={mats => updateRubro(rb.id, { mats })} />

        {/* Mano de obra */}
        <TablaMO mos={rb.mos} onChange={mos => updateRubro(rb.id, { mos })} />

        {/* Otros costos + Márgenes */}
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))' }}>
          {/* Otros costos directos */}
          <div className="rounded-xl border border-steel-700 bg-carbon-light p-4">
            <div className="flex items-center gap-2 mb-1">
              <Truck className="h-4 w-4 text-steel-400" />
              <span className="font-body text-sm font-semibold text-arctic">Otros costos directos</span>
            </div>
            <p className="font-mono text-[10px] text-steel-500 mb-4">Se imputan a este rubro.</p>
            {([['flete','Flete y traslados'],['equipos','Equipos y alquileres'],['subcontratos','Subcontratos'],['varios','Permisos y varios']] as [keyof Rubro, string][]).map(([k,label]) => (
              <label key={k} className="flex items-center justify-between gap-3 mb-3 font-body text-xs text-arctic">
                <span>{label}</span>
                <NumInput value={rb[k] as number} onChange={v => updateRubro(rb.id, { [k]: v })}
                  className="w-32 rounded border border-steel-700 bg-steel-900/40 px-2.5 py-1.5 text-right" />
              </label>
            ))}
            <div className="pt-2 border-t border-steel-700 flex justify-between font-mono text-xs">
              <span className="text-steel-500">Precio otros</span>
              <span className="text-arctic font-semibold">{gs(otrosPrecio)}</span>
            </div>
          </div>

          {/* Márgenes y ajustes */}
          <div className="rounded-xl border border-steel-700 bg-carbon-light p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calculator className="h-4 w-4 text-blue-bright" />
              <span className="font-body text-sm font-semibold text-arctic">Márgenes y ajustes</span>
            </div>
            <p className="font-mono text-[10px] text-steel-500 mb-4">Indirectos y margen son de este rubro. Descuento e IVA al total.</p>
            {([
              ['overhead','Costos indirectos % (rubro)','text-steel-300'],
              ['margen','Margen % (default nuevos ítems)','text-blue-bright'],
            ] as [keyof Rubro,string,string][]).map(([k,label,cls]) => (
              <label key={k} className="flex items-center justify-between gap-3 mb-3 font-body text-xs text-arctic">
                <span>{label}</span>
                <NumInput value={rb[k] as number} onChange={v => updateRubro(rb.id, { [k]: v })}
                  className={`w-24 rounded border border-steel-700 bg-steel-900/40 px-2.5 py-1.5 ${cls}`} />
              </label>
            ))}
            <div className="border-t border-steel-700 mt-1 pt-3 flex flex-col gap-3">
              <label className="flex items-center justify-between gap-3 font-body text-xs text-arctic">
                <span>Descuento % <span className="text-steel-500">(total ppto.)</span></span>
                <NumInput value={datos.descuento} onChange={v => onDatosChange({ ...datos, descuento: v })}
                  className="w-24 rounded border border-steel-700 bg-steel-900/40 px-2.5 py-1.5 text-steel-300" />
              </label>
              <label className="flex items-center justify-between gap-3 font-body text-xs text-arctic">
                <span>IVA % <span className="text-steel-500">(total ppto.)</span></span>
                <NumInput value={datos.iva} onChange={v => onDatosChange({ ...datos, iva: v })}
                  className="w-24 rounded border border-steel-700 bg-steel-900/40 px-2.5 py-1.5 text-steel-300" />
              </label>
            </div>
          </div>
        </div>

        {/* Datos de la obra */}
        <div className="rounded-xl border border-steel-700 bg-carbon-light p-4">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-4 w-4 text-steel-400" />
            <span className="font-body text-sm font-semibold text-arctic">Datos de la obra</span>
          </div>
          <p className="font-mono text-[10px] text-steel-500 mb-4">Se copian tal cual a la hoja de propuesta.</p>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(2, minmax(0,1fr))' }}>
            {([
              ['cliente','Cliente'],['obra','Obra / trabajo'],
              ['domicilio','Domicilio'],['contacto','Contacto del cliente'],
              ['plazo','Plazo de entrega'],['validez','Validez de la oferta'],
              ['pago','Forma de pago'],['empresa','Empresa (encabezado)'],
            ] as [keyof DatosObra,string][]).map(([k,label]) => (
              <label key={k} className="flex flex-col gap-1.5">
                <span className="font-mono text-[9px] uppercase tracking-widest text-steel-500">{label}</span>
                <input value={datos[k] as string} onChange={e => onDatosChange({ ...datos, [k]: e.target.value })}
                  className="rounded border border-steel-700 bg-steel-900/40 px-3 py-2 font-body text-xs text-arctic outline-none focus:border-blue transition-colors" />
              </label>
            ))}
            <label className="flex flex-col gap-1.5 col-span-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-steel-500">Alcance del trabajo</span>
              <textarea value={datos.alcance} onChange={e => onDatosChange({ ...datos, alcance: e.target.value })} rows={3}
                className="rounded border border-steel-700 bg-steel-900/40 px-3 py-2 font-body text-xs text-arctic outline-none focus:border-blue transition-colors resize-y" />
            </label>
            <label className="flex flex-col gap-1.5 col-span-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-steel-500">Condiciones generales</span>
              <textarea value={datos.condiciones} onChange={e => onDatosChange({ ...datos, condiciones: e.target.value })} rows={3}
                className="rounded border border-steel-700 bg-steel-900/40 px-3 py-2 font-body text-xs text-arctic outline-none focus:border-blue transition-colors resize-y" />
            </label>
            {([['firmaNombre','Firma — nombre'],['firmaCargo','Firma — cargo']] as [keyof DatosObra,string][]).map(([k,label]) => (
              <label key={k} className="flex flex-col gap-1.5">
                <span className="font-mono text-[9px] uppercase tracking-widest text-steel-500">{label}</span>
                <input value={datos[k] as string} onChange={e => onDatosChange({ ...datos, [k]: e.target.value })}
                  className="rounded border border-steel-700 bg-steel-900/40 px-3 py-2 font-body text-xs text-arctic outline-none focus:border-blue transition-colors" />
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sidebar de totales ── */}
      <div className="sticky top-[73px] flex flex-col gap-4 self-start">
        {/* Rubro activo */}
        <div className="rounded-xl border border-steel-700 bg-carbon-light p-4">
          <div className="font-mono text-[9px] uppercase tracking-widest text-steel-500 mb-3">Rubro: {rb.nombre}</div>
          {[
            ['Materiales (costo)', matCosto, 'text-steel-400'],
            ['Materiales (precio)', matPrecio, 'text-arctic'],
            ['Mano de obra (costo)', moCosto, 'text-steel-400'],
            ['Mano de obra (precio)', moPrecio, 'text-arctic'],
            ['Otros (precio)', otrosPrecio, 'text-arctic'],
          ].map(([l,v,c]) => (
            <div key={l as string} className="flex justify-between items-baseline gap-2 py-1.5 border-b border-steel-900">
              <span className="font-body text-xs text-steel-500">{l as string}</span>
              <span className={`font-mono text-xs ${c as string}`}>{gs(v as number)}</span>
            </div>
          ))}
          <div className="flex justify-between items-baseline gap-2 pt-3">
            <span className="font-body text-xs font-semibold text-arctic">Total rubro</span>
            <span className="font-mono text-sm font-bold text-blue-bright">{gs(subPrecio)}</span>
          </div>
        </div>

        {/* Total presupuesto */}
        <div className="rounded-xl border border-blue/30 bg-blue-muted p-4">
          <div className="font-mono text-[9px] uppercase tracking-widest text-blue-bright mb-3">Presupuesto total</div>
          {rubros.map(r => {
            const c = calcRubro(r);
            return (
              <div key={r.id} className={`flex justify-between items-baseline gap-2 py-1.5 border-b border-steel-900/60 ${!r.enPropuesta ? 'opacity-40' : ''}`}>
                <span className="font-body text-xs text-steel-400">{r.nombre}{!r.enPropuesta && ' (excluido)'}</span>
                <span className="font-mono text-xs text-arctic">{gs(c.subPrecio)}</span>
              </div>
            );
          })}
          {datos.descuento > 0 && (
            <div className="flex justify-between items-baseline gap-2 py-1.5 border-b border-steel-900/60">
              <span className="font-body text-xs text-steel-400">Descuento {datos.descuento}%</span>
              <span className="font-mono text-xs text-red-400">- {gs(totales.precio * datos.descuento / 100)}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline gap-2 py-1.5 border-b border-steel-900/60">
            <span className="font-body text-xs text-steel-400">IVA {datos.iva}%</span>
            <span className="font-mono text-xs text-steel-300">{gs(conDescuento * datos.iva / 100)}</span>
          </div>
          <div className="flex justify-between items-baseline gap-2 pt-3">
            <span className="font-body text-sm font-bold text-arctic">TOTAL AL CLIENTE</span>
            <span className="font-mono text-lg font-black text-blue-bright">{gs(totalFinal)}</span>
          </div>
        </div>

        {/* Breakdown costo vs precio */}
        <div className="rounded-xl border border-steel-700 bg-carbon-light p-4">
          <div className="font-mono text-[9px] uppercase tracking-widest text-steel-500 mb-3">Análisis de margen</div>
          <div className="flex justify-between py-1.5 border-b border-steel-900">
            <span className="font-body text-xs text-steel-500">Costo total</span>
            <span className="font-mono text-xs text-steel-300">{gs(totales.costo)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-steel-900">
            <span className="font-body text-xs text-steel-500">Precio total</span>
            <span className="font-mono text-xs text-arctic">{gs(totales.precio)}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="font-body text-xs text-steel-500">Ganancia bruta</span>
            <span className="font-mono text-xs text-[#48BB78] font-semibold">
              {gs(totales.precio - totales.costo)} ({totales.precio > 0 ? Math.round((totales.precio - totales.costo) / totales.precio * 100) : 0}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Vista Propuesta (imprimible A4) ─────────────────────────────────────────

function VistaPropuesta({ rubros, datos, ppto }: { rubros: Rubro[]; datos: DatosObra; ppto: PresupuestoData }) {
  const mono = { fontFamily: "'IBM Plex Mono', monospace" };
  const incluidos = rubros.filter(r => r.enPropuesta);
  const subtotalGeneral = incluidos.reduce((s, r) => s + calcRubro(r).subPrecio, 0);
  const montoDescuento = subtotalGeneral * datos.descuento / 100;
  const neto = subtotalGeneral - montoDescuento;
  const montoIva = neto * datos.iva / 100;
  const totalFinal = neto + montoIva;
  const fechaHoy = new Date().toLocaleDateString('es-PY', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Toolbar no-print */}
      <div className="mb-4 flex items-center gap-3 text-steel-500 no-print">
        <Printer className="h-4 w-4" />
        <span className="font-mono text-xs">Vista de propuesta — tal como se imprime al cliente</span>
        <button onClick={() => window.print()} className="ml-auto flex items-center gap-2 rounded px-3 py-1.5 text-xs font-medium bg-steel-900 text-arctic hover:bg-steel-700 transition-colors">
          <Printer className="h-3.5 w-3.5" /> Imprimir / PDF
        </button>
      </div>

      {/* ── Hoja A4 ── */}
      <div id="propuesta-print" data-sheet="1" style={{
        width: 820, maxWidth: '100%', margin: '0 auto', padding: '56px 60px 48px',
        background: '#ffffff', border: '1px solid #dedbd5', borderRadius: 4,
        boxShadow: '0 2px 20px rgba(0,0,0,0.05)', color: '#1b1a18',
        fontFamily: "'IBM Plex Sans', Helvetica, Arial, sans-serif",
      }}>

        {/* Encabezado empresa + N° presupuesto */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 30, paddingBottom: 22, borderBottom: '2px solid #1b1a18' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, paddingTop: 4 }}>
            <div style={{ fontSize: 25, fontWeight: 700, letterSpacing: '-0.02em' }}>{datos.empresa}</div>
            <div style={{ fontSize: 11.5, lineHeight: 1.6, color: '#6f6b64' }}>Servicios de Limpieza y Mantenimiento</div>
            <div style={{ ...mono, fontSize: 10.5, lineHeight: 1.6, color: '#6f6b64' }}>Full Service & Clean S.A.</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'right' }}>
            <div style={{ ...mono, fontSize: 10, letterSpacing: '0.11em', textTransform: 'uppercase', color: '#86817b' }}>Presupuesto</div>
            <div style={{ ...mono, fontSize: 19, fontWeight: 600, color: '#1b1a18' }}>{ppto.code}</div>
            <div style={{ ...mono, fontSize: 10.5, color: '#6f6b64', whiteSpace: 'nowrap' }}>{fechaHoy}</div>
          </div>
        </div>

        {/* Cliente + Obra */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '22px 34px', padding: '24px 0', borderBottom: '1px solid #e6e2da' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ ...mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#86817b' }}>Cliente</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{datos.cliente || '—'}</div>
            <div style={{ fontSize: 12, color: '#6f6b64' }}>{datos.contacto || ''}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ ...mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#86817b' }}>Obra / Trabajo</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{datos.obra || '—'}</div>
            <div style={{ fontSize: 12, color: '#6f6b64' }}>{datos.domicilio || ''}</div>
          </div>
        </div>

        {/* Alcance del trabajo */}
        {datos.alcance && (
          <div style={{ padding: '24px 0 4px' }}>
            <div style={{ ...mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#86817b', marginBottom: 8 }}>Alcance del trabajo</div>
            <div style={{ fontSize: 13, lineHeight: 1.65, color: '#33312e', whiteSpace: 'pre-wrap' }}>{datos.alcance}</div>
          </div>
        )}

        {/* Rubros */}
        <div style={{ paddingTop: 26 }}>
          {incluidos.map((rb, idx) => {
            const { subPrecio } = calcRubro(rb);
            const itemsMats = rb.mats.filter(m => m.desc);
            const itemsMos = rb.mos.filter(m => m.desc);
            const hayTabla = itemsMats.length > 0 || itemsMos.length > 0;
            return (
              <div key={rb.id} style={{ paddingBottom: 22 }}>
                {/* Rubro header */}
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 20, padding: '0 0 8px', borderBottom: '1px solid #1b1a18' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span style={{ ...mono, fontSize: 10, letterSpacing: '0.1em', color: '#86817b' }}>{String(idx + 1).padStart(2, '0')}</span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{rb.nombre}</span>
                  </div>
                  <span style={{ ...mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#86817b' }}>Importe</span>
                </div>

                {/* Tabla de ítems */}
                {hayTabla && (
                  <>
                    {/* Col headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 44px 62px 108px 132px', padding: '4px 0 3px', borderBottom: '1px solid #efedea', ...mono, fontSize: 8.5, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#86817b' }}>
                      <div style={{ padding: '3px 8px 3px 0' }}>Descripción del trabajo</div>
                      <div style={{ padding: '3px 4px', textAlign: 'center' }}>Un.</div>
                      <div style={{ padding: '3px 4px', textAlign: 'right' }}>Cant.</div>
                      <div style={{ padding: '3px 4px', textAlign: 'right' }}>P. unitario</div>
                      <div style={{ padding: '3px 0 3px 4px', textAlign: 'right' }}>Importe</div>
                    </div>

                    {/* Descripción de materiales */}
                    {rb.descMat && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 44px 62px 108px 132px', alignItems: 'baseline', borderBottom: '1px solid #f4f2ee' }}>
                        <div style={{ padding: '8px 8px 8px 0', fontSize: 12, lineHeight: 1.55, color: '#33312e', whiteSpace: 'pre-wrap' }}>{rb.descMat}</div>
                        <div /><div /><div /><div />
                      </div>
                    )}

                    {/* Items materiales */}
                    {itemsMats.map(m => {
                      const { precio } = calcMat(m);
                      return (
                        <div key={m.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 44px 62px 108px 132px', alignItems: 'center', borderBottom: '1px solid #f4f2ee' }}>
                          <div style={{ padding: '7px 8px 7px 0', fontSize: 12, lineHeight: 1.5, color: '#33312e' }}>{m.desc}</div>
                          <div style={{ ...mono, fontSize: 11, textAlign: 'center', color: '#6f6b64', padding: '7px 2px' }}>{m.unidad}</div>
                          <div style={{ ...mono, fontSize: 11.5, textAlign: 'right', color: '#33312e', padding: '7px 4px' }}>{m.cant}</div>
                          <div style={{ ...mono, fontSize: 11.5, textAlign: 'right', color: '#33312e', padding: '7px 4px' }}>{gs(m.costo)}</div>
                          <div style={{ ...mono, fontSize: 12, fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap', padding: '7px 0 7px 4px' }}>{gs(precio)}</div>
                        </div>
                      );
                    })}

                    {/* Descripción de mano de obra */}
                    {rb.descMo && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 44px 62px 108px 132px', alignItems: 'baseline', borderBottom: '1px solid #f4f2ee' }}>
                        <div style={{ padding: '8px 8px 8px 0', fontSize: 12, lineHeight: 1.55, color: '#33312e', whiteSpace: 'pre-wrap' }}>{rb.descMo}</div>
                        <div /><div /><div /><div />
                      </div>
                    )}

                    {/* Items mano de obra */}
                    {itemsMos.map(m => {
                      const { precio } = calcMo(m);
                      return (
                        <div key={m.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 44px 62px 108px 132px', alignItems: 'center', borderBottom: '1px solid #f4f2ee' }}>
                          <div style={{ padding: '7px 8px 7px 0', fontSize: 12, lineHeight: 1.5, color: '#33312e' }}>{m.desc}</div>
                          <div style={{ ...mono, fontSize: 11, textAlign: 'center', color: '#6f6b64', padding: '7px 2px' }}>hs</div>
                          <div style={{ ...mono, fontSize: 11.5, textAlign: 'right', color: '#33312e', padding: '7px 4px' }}>{m.pers * m.horas}</div>
                          <div style={{ ...mono, fontSize: 11.5, textAlign: 'right', color: '#33312e', padding: '7px 4px' }}>{gs(m.vh)}</div>
                          <div style={{ ...mono, fontSize: 12, fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap', padding: '7px 0 7px 4px' }}>{gs(precio)}</div>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Subtotal rubro */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 150px', alignItems: 'baseline', paddingTop: 11, borderTop: hayTabla ? '1px solid #efedea' : undefined }}>
                  <div />
                  <div style={{ ...mono, fontSize: 14, fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>{gs(subPrecio)}</div>
                </div>
              </div>
            );
          })}

          {/* Totales */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10 }}>
            <div style={{ width: 320, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '6px 0', fontSize: 12.5, borderTop: '1px solid #e6e2da' }}>
                <span style={{ color: '#6f6b64' }}>Subtotal general</span>
                <span style={{ ...mono, whiteSpace: 'nowrap' }}>{gs(subtotalGeneral)}</span>
              </div>
              {datos.descuento > 0 && (
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '6px 0', fontSize: 12.5 }}>
                  <span style={{ color: '#6f6b64' }}>Descuento {datos.descuento}%</span>
                  <span style={{ ...mono, whiteSpace: 'nowrap' }}>− {gs(montoDescuento)}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '6px 0', fontSize: 12.5, borderTop: '1px solid #e6e2da' }}>
                <span style={{ color: '#6f6b64' }}>Neto</span>
                <span style={{ ...mono, whiteSpace: 'nowrap' }}>{gs(neto)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '6px 0', fontSize: 12.5 }}>
                <span style={{ color: '#6f6b64' }}>IVA {datos.iva}%</span>
                <span style={{ ...mono, whiteSpace: 'nowrap' }}>{gs(montoIva)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '14px 0 4px', marginTop: 6, borderTop: '2px solid #1b1a18' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Total</span>
                <span style={{ ...mono, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>{gs(totalFinal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Plazo / Pago / Validez */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 22, padding: '28px 0', marginTop: 24, borderTop: '1px solid #e6e2da', borderBottom: '1px solid #e6e2da' }}>
          {[['Plazo de entrega', datos.plazo], ['Forma de pago', datos.pago], ['Validez de la oferta', datos.validez]].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ ...mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#86817b' }}>{l}</div>
              <div style={{ fontSize: 12.5 }}>{v || '—'}</div>
            </div>
          ))}
        </div>

        {/* Condiciones */}
        {datos.condiciones && (
          <div style={{ padding: '22px 0 0' }}>
            <div style={{ ...mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#86817b', marginBottom: 8 }}>Condiciones</div>
            <div style={{ fontSize: 11.5, lineHeight: 1.7, color: '#6f6b64', whiteSpace: 'pre-wrap' }}>{datos.condiciones}</div>
          </div>
        )}

        {/* Firma */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 60, paddingTop: 62 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ borderTop: '1px solid #1b1a18' }} />
            <div style={{ fontSize: 12.5, fontWeight: 600, paddingTop: 2 }}>{datos.firmaNombre || '___________________________'}</div>
            <div style={{ fontSize: 11.5, color: '#6f6b64' }}>{datos.firmaCargo}</div>
            <div style={{ ...mono, fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#86817b', paddingTop: 2 }}>Por {datos.empresa}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ borderTop: '1px solid #1b1a18' }} />
            <div style={{ ...mono, fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#86817b' }}>Conformidad del cliente</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function PresupuestoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ppto, setPpto] = useState<PresupuestoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [tab, setTab] = useState<'planilla' | 'propuesta'>('planilla');

  const [rubros, setRubros] = useState<Rubro[]>([newRubro(1)]);
  const [datos, setDatos] = useState<DatosObra>({
    empresa: 'Full Service & Clean', cliente: '', obra: '', domicilio: '',
    contacto: '', plazo: '', validez: '30 días', pago: 'A convenir', alcance: '',
    condiciones: CONDICIONES_DEFAULT,
    firmaNombre: '', firmaCargo: 'Gerente de Proyecto', descuento: 0, iva: 10,
  });

  useEffect(() => {
    fetch(`/api/presupuestos/${id}`)
      .then(r => r.json())
      .then(p => {
        setPpto(p);
        if (p.calculationData?.rubros?.length) {
          setRubros(p.calculationData.rubros);
        } else {
          setRubros([newRubro(1)]);
        }
        const d = defaultDatos(p);
        setDatos(p.calculationData?.datosObra ? { ...d, ...p.calculationData.datosObra } : d);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const markDirty = useCallback(() => setSaved(false), []);

  const handleRubrosChange = useCallback((r: Rubro[]) => { setRubros(r); markDirty(); }, [markDirty]);
  const handleDatosChange = useCallback((d: DatosObra) => { setDatos(d); markDirty(); }, [markDirty]);

  const save = async () => {
    if (!ppto) return;
    setSaving(true);
    try {
      const totalFinal = (() => {
        const inc = rubros.filter(r => r.enPropuesta);
        const tot = inc.reduce((s, r) => s + calcRubro(r).subPrecio, 0);
        const cd = tot * (1 - datos.descuento / 100);
        return cd * (1 + datos.iva / 100);
      })();
      await fetch(`/api/presupuestos/${ppto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calculationData: { rubros, datosObra: datos }, finalValue: totalFinal }),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-blue-bright" />
    </div>
  );

  if (!ppto) return (
    <div className="flex h-screen flex-col items-center justify-center gap-3">
      <AlertCircle className="h-8 w-8 text-red-400" />
      <p className="text-steel-400">Presupuesto no encontrado</p>
      <button onClick={() => router.back()} className="text-sm text-blue-bright hover:underline">Volver</button>
    </div>
  );

  const statusInfo = STATUS_MAP[ppto.status] ?? { label: ppto.status, cls: 'bg-steel-900 text-steel-300' };

  return (
    <div className="min-h-screen bg-carbon">
      {/* ── Header sticky ── */}
      <header className="sticky top-0 z-30 border-b border-steel-700 bg-carbon/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-5 py-3 flex-wrap">
          <button onClick={() => router.push('/admin/presupuestos')}
            className="flex items-center gap-1.5 rounded px-2 py-1.5 text-xs text-steel-400 hover:text-arctic hover:bg-steel-900 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Presupuestos
          </button>

          <div className="h-4 w-px bg-steel-700" />

          <div>
            <span className="font-mono text-xs text-steel-500">{ppto.code}</span>
            <span className="mx-2 text-steel-700">·</span>
            <span className="font-body text-sm font-semibold text-arctic">{ppto.customer.name}</span>
          </div>

          <span className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${statusInfo.cls}`}>
            {statusInfo.label}
          </span>

          <div className="flex-1" />

          {/* Tabs */}
          <div className="flex rounded-lg p-0.5 bg-steel-900 gap-0.5">
            {(['planilla', 'propuesta'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${tab === t ? 'bg-carbon text-arctic shadow-sm' : 'text-steel-400 hover:text-arctic'}`}>
                {t === 'planilla' ? <><Calculator className="h-3.5 w-3.5" /> Planilla de costos</> : <><FileText className="h-3.5 w-3.5" /> Hoja de propuesta</>}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!saved && <span className="font-mono text-[10px] text-yellow-bright">Sin guardar</span>}
            <button onClick={save} disabled={saving || saved}
              className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold bg-blue text-white hover:bg-blue-deep disabled:opacity-50 transition-colors">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? 'Guardando…' : saved ? 'Guardado' : 'Guardar'}
            </button>
          </div>
        </div>
      </header>

      {/* ── Contenido ── */}
      <main className="px-5 py-6 max-w-[1600px] mx-auto">
        {tab === 'planilla' ? (
          <VistaPlanilla rubros={rubros} datos={datos} onChange={handleRubrosChange} onDatosChange={handleDatosChange} />
        ) : (
          <VistaPropuesta rubros={rubros} datos={datos} ppto={ppto} />
        )}
      </main>

      {/* Print styles */}
      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          header, .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; }
          main { margin: 0 !important; padding: 0 !important; }
          #propuesta-print { border: none !important; box-shadow: none !important; width: 100% !important; padding: 0 !important; }
          @page { size: A4 portrait; margin: 9mm 10mm 13mm; }
        }
      `}</style>
    </div>
  );
}
