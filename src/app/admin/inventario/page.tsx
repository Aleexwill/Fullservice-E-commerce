'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Search, RefreshCw, Plus, Trash2, X, Loader2, Package, Save, Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

interface Material {
  id: string; code: string; description: string; unit: string; unitPrice: number;
  provider: string; category: string; isActive: boolean; notes: string;
}

const CATEGORIES: Record<string, string> = {
  metalurgica: 'Metalúrgica', chapas: 'Chapas', policarbonato: 'Policarbonato',
  civil: 'Civil', pinturas: 'Pinturas', electrica: 'Eléctrica', plomeria: 'Plomería',
  carpinteria: 'Carpintería', mano_obra: 'Mano de obra', consumibles: 'Consumibles', general: 'General',
};

const gs = (n: number) => 'Gs. ' + Math.round(n).toLocaleString('es-PY');

export default function AdminInventarioPage() {
  const [items, setItems] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [showImport, setShowImport] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search) p.set('q', search);
    if (filterCat) p.set('category', filterCat);
    p.set('limit', '200');
    fetch(`/api/materiales?${p}`).then(r => r.json()).then(d => { setItems(d.materials || []); setLoading(false); });
  }, [search, filterCat]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const del = async (id: string) => {
    if (!confirm('¿Eliminar este material?')) return;
    await fetch(`/api/materiales/${id}`, { method: 'DELETE' });
    fetchData();
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-h1 uppercase text-arctic">Inventario de Materiales</h1>
          <p className="mt-1 font-body text-body-sm text-steel-300">Lista interna de materiales y tarifas para presupuestos de servicios</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)} className="btn-secondary flex items-center gap-1.5"><Upload className="h-4 w-4" /> Importar Excel</button>
          <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus className="h-4 w-4" /> Agregar material</button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" /><input type="text" placeholder="Buscar material..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" /></div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="input max-w-[180px]">
          <option value="">Todas las categorías</option>
          {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button onClick={fetchData} className="btn-secondary"><RefreshCw className="h-4 w-4" /></button>
        <span className="font-mono text-caption text-steel-500">{items.length} materiales</span>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="card animate-pulse p-4"><div className="h-10 rounded bg-steel-900" /></div>)}</div>
      ) : (
        <div className="rounded-lg border border-steel-900/40 overflow-hidden">
          <div className="grid grid-cols-[40px_1fr_80px_80px_130px_120px_80px] gap-2 bg-steel-900/50 px-4 py-2.5 font-body text-[0.6rem] uppercase tracking-wider text-steel-500">
            <span>#</span><span>Descripción</span><span>Unidad</span><span>Categoría</span><span className="text-right">Precio Unit.</span><span>Proveedor</span><span />
          </div>
          {items.map((m) => (
            <div key={m.id} className={`grid grid-cols-[40px_1fr_80px_80px_130px_120px_80px] gap-2 border-t border-steel-900/30 px-4 py-3 items-center hover:bg-steel-900/20 ${!m.isActive ? 'opacity-40' : ''}`}>
              <span className="font-mono text-caption text-steel-700">{m.code}</span>
              <span className="font-body text-body-sm text-arctic">{m.description}</span>
              <span className="font-mono text-caption text-steel-400">{m.unit}</span>
              <span className="font-body text-caption text-steel-500">{CATEGORIES[m.category] || m.category}</span>
              <span className="text-right font-mono text-body-sm text-[#48BB78]">{gs(m.unitPrice)}</span>
              <span className="font-body text-caption text-steel-500 truncate">{m.provider}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditing(m)} className="rounded p-1 text-steel-500 hover:text-arctic"><Save className="h-3.5 w-3.5" /></button>
                <button onClick={() => del(m.id)} className="rounded p-1 text-steel-700 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showAdd || editing) && (
        <MaterialModal
          material={editing}
          onClose={() => { setShowAdd(false); setEditing(null); }}
          onSaved={() => { setShowAdd(false); setEditing(null); fetchData(); }}
        />
      )}

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={() => { setShowImport(false); fetchData(); }}
        />
      )}
    </div>
  );
}

// ── Import Modal ───────────────────────────────────────────────────

interface ImportRow {
  rowNum: number; description: string; unitPrice: number | null; unit: string;
  provider: string; category: string; notes: string;
  status: 'ok' | 'warning' | 'error'; errors: string[]; warnings: string[];
}

function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [parsing, setParsing] = useState(false);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [filter, setFilter] = useState<'all' | 'ok' | 'warning' | 'error'>('all');
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');

  const parseFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) { alert('Solo se admiten archivos .xlsx'); return; }
    setFileName(file.name);
    setParsing(true);
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/materiales/import', { method: 'POST', body: form });
    const data = await res.json();
    setParsing(false);
    if (!res.ok) { alert(data.error || 'Error al leer el archivo'); return; }
    setRows(data.rows || []);
    setStep('preview');
  };

  const doImport = async () => {
    setImporting(true);
    const res = await fetch('/api/materiales/import?confirm=1', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: rows.filter(r => r.status !== 'error') }),
    });
    const data = await res.json();
    setImporting(false);
    if (!res.ok) { alert(data.error || 'Error al importar'); return; }
    setImported(data.inserted);
    setStep('done');
  };

  const visible = rows.filter(r => filter === 'all' || r.status === filter);
  const okCount   = rows.filter(r => r.status === 'ok').length;
  const warnCount = rows.filter(r => r.status === 'warning').length;
  const errCount  = rows.filter(r => r.status === 'error').length;
  const importable = okCount + warnCount;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-carbon/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex w-full max-w-4xl flex-col rounded-lg border border-steel-900/60 bg-carbon-light shadow-2xl" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-steel-900/40 px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-[#48BB78]" />
            <h2 className="font-display text-h3 text-arctic">Importar desde Excel</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-steel-500 hover:bg-steel-900"><X className="h-5 w-5" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">

          {/* ── Step: upload ── */}
          {step === 'upload' && (
            <div>
              <p className="mb-4 font-body text-body-sm text-steel-300">
                Subí tu archivo <span className="font-mono text-arctic">.xlsx</span> con el formato de precios.
                La hoja debe tener columnas: <span className="font-mono text-steel-300">DESCRIPCION, P.U, UN/MED, PROVEEDOR</span>.
              </p>
              <div
                className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${dragOver ? 'border-[#2D8FCC] bg-[#2D8FCC]/5' : 'border-steel-900 hover:border-steel-700'}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) parseFile(f); }}
              >
                {parsing ? (
                  <><Loader2 className="mb-3 h-8 w-8 animate-spin text-[#2D8FCC]" /><p className="font-body text-body-sm text-steel-300">Analizando archivo…</p></>
                ) : (
                  <><Upload className="mb-3 h-8 w-8 text-steel-500" /><p className="font-body text-body-sm text-arctic mb-1">Arrastrá el archivo acá</p><p className="font-body text-caption text-steel-500">o hacé clic para seleccionar — .xlsx, máx 5 MB</p></>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) parseFile(f); }} />
            </div>
          )}

          {/* ── Step: preview ── */}
          {step === 'preview' && (
            <div>
              <p className="mb-3 font-mono text-caption text-steel-500">{fileName}</p>

              {/* Summary tiles */}
              <div className="mb-4 grid grid-cols-4 gap-3">
                {[
                  { label: 'Total filas', value: rows.length, color: 'text-arctic' },
                  { label: 'Sin problemas', value: okCount, color: 'text-[#48BB78]' },
                  { label: 'Con advertencias', value: warnCount, color: 'text-[#F6C90E]' },
                  { label: 'Con errores', value: errCount, color: 'text-[#FC8181]' },
                ].map(t => (
                  <div key={t.label} className="rounded-lg border border-steel-900/40 bg-steel-900/30 px-4 py-3">
                    <div className={`font-mono text-2xl font-semibold ${t.color}`}>{t.value}</div>
                    <div className="mt-1 font-body text-caption text-steel-500">{t.label}</div>
                  </div>
                ))}
              </div>

              {/* Filter chips */}
              <div className="mb-3 flex gap-2">
                {(['all', 'ok', 'warning', 'error'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`rounded-full border px-3 py-1 font-body text-caption transition-colors ${filter === f
                      ? f === 'all' ? 'border-[#2D8FCC] bg-[#2D8FCC] text-white'
                      : f === 'ok' ? 'border-[#48BB78] bg-[#48BB78] text-white'
                      : f === 'warning' ? 'border-[#F6C90E] bg-[#F6C90E] text-carbon'
                      : 'border-[#FC8181] bg-[#FC8181] text-white'
                      : 'border-steel-900 bg-steel-900/30 text-steel-400 hover:border-steel-700'}`}>
                    {f === 'all' ? 'Todas' : f === 'ok' ? '✓ OK' : f === 'warning' ? '⚠ Advertencias' : '✕ Errores'}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div className="rounded-lg border border-steel-900/40 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-steel-900/50">
                        <th className="px-3 py-2 text-left font-mono text-[0.6rem] uppercase tracking-wider text-steel-500 w-8">#</th>
                        <th className="px-3 py-2 text-left font-mono text-[0.6rem] uppercase tracking-wider text-steel-500">Descripción</th>
                        <th className="px-3 py-2 text-left font-mono text-[0.6rem] uppercase tracking-wider text-steel-500 w-16">Unidad</th>
                        <th className="px-3 py-2 text-right font-mono text-[0.6rem] uppercase tracking-wider text-steel-500 w-28">Precio unit.</th>
                        <th className="px-3 py-2 text-left font-mono text-[0.6rem] uppercase tracking-wider text-steel-500 w-28">Proveedor</th>
                        <th className="px-3 py-2 text-left font-mono text-[0.6rem] uppercase tracking-wider text-steel-500 w-20">Categoría</th>
                        <th className="px-3 py-2 w-6"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((r, i) => (
                        <tr key={i} className={`border-t border-steel-900/30 hover:bg-steel-900/20 ${r.status === 'error' ? 'border-l-2 border-l-[#FC8181]' : r.status === 'warning' ? 'border-l-2 border-l-[#F6C90E]' : 'border-l-2 border-l-[#48BB78]'}`}>
                          <td className="px-3 py-2 font-mono text-steel-600">{r.rowNum}</td>
                          <td className="px-3 py-2">
                            <div className="font-body text-arctic">{r.description || <span className="italic text-[#FC8181]">vacío</span>}</div>
                            {r.errors.map((e, j) => <div key={j} className="text-[#FC8181] mt-0.5">✕ {e}</div>)}
                            {r.warnings.map((w, j) => <div key={j} className="text-[#F6C90E] mt-0.5">⚠ {w}</div>)}
                          </td>
                          <td className="px-3 py-2 font-mono text-steel-400">{r.unit || '—'}</td>
                          <td className="px-3 py-2 text-right font-mono text-[#48BB78]">{r.unitPrice != null ? 'Gs. ' + Math.round(r.unitPrice).toLocaleString('es-PY') : <span className="text-[#FC8181]">—</span>}</td>
                          <td className="px-3 py-2 font-body text-steel-400 truncate max-w-[100px]">{r.provider || '—'}</td>
                          <td className="px-3 py-2 font-mono text-steel-500">{r.category}</td>
                          <td className="px-3 py-2">
                            {r.status === 'ok' && <CheckCircle2 className="h-3.5 w-3.5 text-[#48BB78]" />}
                            {r.status === 'warning' && <AlertTriangle className="h-3.5 w-3.5 text-[#F6C90E]" />}
                            {r.status === 'error' && <AlertCircle className="h-3.5 w-3.5 text-[#FC8181]" />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {errCount > 0 && (
                <p className="mt-2 font-body text-caption text-steel-500">
                  Las filas con error no se importarán. Las {warnCount > 0 ? `${warnCount} con advertencias` : ''} sí se importan.
                </p>
              )}
            </div>
          )}

          {/* ── Step: done ── */}
          {step === 'done' && (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle2 className="mb-4 h-12 w-12 text-[#48BB78]" />
              <h3 className="font-display text-h2 text-arctic mb-2">{imported} materiales importados</h3>
              <p className="font-body text-body-sm text-steel-400">Ya están disponibles en el inventario.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-steel-900/40 px-6 py-4 flex-shrink-0">
          {step === 'upload' && <button onClick={onClose} className="btn-secondary">Cancelar</button>}
          {step === 'preview' && (
            <>
              <button onClick={() => setStep('upload')} className="btn-secondary">← Cambiar archivo</button>
              <button onClick={doImport} disabled={importing || importable === 0} className="btn-primary">
                {importing ? <><Loader2 className="h-4 w-4 animate-spin" /> Importando…</> : `Importar ${importable} ítems`}
              </button>
            </>
          )}
          {step === 'done' && (
            <>
              <button onClick={() => setStep('upload')} className="btn-secondary">Nueva importación</button>
              <button onClick={onImported} className="btn-primary">Ir al inventario</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Material Modal ─────────────────────────────────────────────────

function MaterialModal({ material, onClose, onSaved }: { material: Material | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    description: material?.description || '', unit: material?.unit || 'un',
    unitPrice: material?.unitPrice ? String(material.unitPrice) : '', provider: material?.provider || '',
    category: material?.category || 'general', notes: material?.notes || '', isActive: material?.isActive ?? true,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const body = { ...f, unitPrice: Number(f.unitPrice) };
    if (material) {
      await fetch(`/api/materiales/${material.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      await fetch('/api/materiales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    setSaving(false); onSaved();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-carbon/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-lg border border-steel-900/60 bg-carbon-light shadow-2xl">
        <div className="flex items-center justify-between border-b border-steel-900/40 px-6 py-4">
          <h2 className="font-display text-h3 text-arctic">{material ? 'Editar material' : 'Nuevo material'}</h2>
          <button onClick={onClose} className="rounded-md p-1.5 text-steel-500 hover:bg-steel-900"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-6">
          <div><label className="label mb-1 block">Descripción *</label><input className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label mb-1 block">Unidad</label><input className="input" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} placeholder="un, ml, m², kg, gl..." /></div>
            <div><label className="label mb-1 block">Precio unitario (Gs.) *</label><input type="number" className="input font-mono" value={f.unitPrice} onChange={(e) => setF({ ...f, unitPrice: e.target.value })} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label mb-1 block">Categoría</label>
              <select className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
                {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label className="label mb-1 block">Proveedor</label><input className="input" value={f.provider} onChange={(e) => setF({ ...f, provider: e.target.value })} /></div>
          </div>
          <div><label className="label mb-1 block">Notas</label><input className="input" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} className="h-4 w-4" />
            <label htmlFor="isActive" className="font-body text-body-sm text-steel-300">Activo (aparece en búsquedas)</label>
          </div>
          <button type="submit" disabled={saving || !f.description || !f.unitPrice} className="btn-primary w-full justify-center">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando...</> : material ? 'Guardar cambios' : 'Crear material'}
          </button>
        </form>
      </div>
    </div>
  );
}
