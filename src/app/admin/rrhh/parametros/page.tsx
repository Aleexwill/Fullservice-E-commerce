'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import type { RrhhConfig } from '@/lib/rrhh/shared';
import { AUSENCIA_LABEL, TIPOS_AUSENCIA } from '@/lib/marcacion/reglas';

const L = 'mb-1 block font-body text-caption text-steel-400';

export default function ParametrosRrhhPage() {
  const [c, setC] = useState<RrhhConfig | null>(null);
  const [def, setDef] = useState<RrhhConfig | null>(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [nuevo, setNuevo] = useState({ key: '', label: '', vidaUtilMeses: 12 });

  useEffect(() => { fetch('/api/rrhh/config', { cache: 'no-store' }).then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error ?? 'Error'); setC(j.config); setDef(j.porDefecto); }).catch(e => setError(e.message)); }, []);
  if (!c) return <div className="p-6 text-steel-400">{error || 'Cargando…'}</div>;

  const pl = c.planilla;
  const setPl = (k: keyof typeof pl, v: unknown) => setC({ ...c, planilla: { ...pl, [k]: v } });
  const num = (k: keyof typeof pl, label: string, hint: string, step = 1) => (
    <div><label htmlFor={`p-${k}`} className={L}>{label}</label><input id={`p-${k}`} type="number" step={step} value={pl[k] as number} onChange={e => setPl(k, Number(e.target.value))} className="input w-full" /><p className="mt-1 text-caption text-steel-500">{hint}</p></div>
  );
  const chk = (k: 'aplicarIps' | 'ipsSobreAguinaldo' | 'descontarAusencias' | 'descontarTardanza', label: string) => (
    <label className="flex min-h-11 items-start gap-2 text-body-sm text-steel-300"><input type="checkbox" checked={pl[k]} onChange={e => setPl(k, e.target.checked)} className="mt-1 h-4 w-4" />{label}</label>
  );
  const guardar = async () => {
    setBusy(true); setError(''); setOk('');
    try { const r = await fetch('/api/rrhh/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(c) }); const j = await r.json(); if (!r.ok) throw new Error(j.error ?? 'Error'); setC(j.config); setOk('Parámetros guardados'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Error'); } finally { setBusy(false); }
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="font-display text-h1 text-arctic">Parámetros de RRHH</h1>
      <div className="my-4 flex gap-3 rounded-lg border border-orange/40 bg-orange-muted/40 p-4 text-body-sm text-orange-bright">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-none" />
        <p><b>Valores de referencia.</b> Los porcentajes y reglas de la planilla (aporte a IPS, recargos de horas extra, divisor del jornal, descuentos) son un punto de partida. <b>Validalos con contabilidad o un asesor laboral antes de liquidar sueldos reales.</b> Cada planilla guarda las reglas con que se calculó.</p>
      </div>
      {error && <p role="alert" className="mb-3 rounded-md bg-danger-light/10 px-3 py-2 text-caption text-danger-bright">{error}</p>}
      {ok && <p role="status" className="mb-3 rounded-md bg-success-light/10 px-3 py-2 text-caption text-success-bright">{ok}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card space-y-4 p-5">
          <h2 className="font-display text-h3 text-arctic">Aportes y base de cálculo</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {num('ipsEmpleado', 'Aporte del trabajador a IPS (%)', 'Se descuenta de la remuneración imponible.', 0.5)}
            {num('ipsPatronal', 'Aporte patronal a IPS (%)', 'Costo para la empresa; solo informativo en la planilla.', 0.5)}
            {num('divisorJornal', 'Divisor del jornal (días)', 'Jornal = sueldo mensual ÷ este número.')}
            {num('horasJornada', 'Horas de la jornada', 'Valor hora = jornal ÷ este número.')}
          </div>
          {chk('aplicarIps', 'Descontar el aporte a IPS')}
          {chk('ipsSobreAguinaldo', 'Aplicar aporte a IPS también sobre el aguinaldo')}
        </section>
        <section className="card space-y-4 p-5">
          <h2 className="font-display text-h3 text-arctic">Horas extra y trabajo en feriado</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {num('recargoExtraDiurno', 'Recargo extra diurna (%)', 'Sobre el valor hora.')}
            {num('recargoExtraNocturno', 'Recargo extra nocturna (%)', 'Sobre el valor hora.')}
            {num('recargoFeriadoDomingo', 'Recargo domingo y feriado (%)', 'Las horas trabajadas en esos días se pagan con este recargo.')}
            <div><label htmlFor="p-noct" className={L}>Nocturno desde las</label><input id="p-noct" type="time" value={pl.nocturnoDesde} onChange={e => setPl('nocturnoDesde', e.target.value)} className="input w-full" /><p className="mt-1 text-caption text-steel-500">Las horas extra después de esta hora se consideran nocturnas.</p></div>
          </div>
        </section>
        <section className="card space-y-3 p-5">
          <h2 className="font-display text-h3 text-arctic">Ausencias y tardanzas</h2>
          {chk('descontarAusencias', 'Descontar un jornal por cada ausencia sin aviso')}
          {chk('descontarTardanza', 'Descontar los minutos de tardanza y de salida anticipada (valor hora ÷ 60 por minuto)')}
          <p className="pt-2 font-body text-body-sm text-steel-300">Ausencias aprobadas que paga la empresa:</p>
          {TIPOS_AUSENCIA.map(t => <label key={t} className="flex min-h-10 items-center gap-2 text-body-sm text-steel-300"><input type="checkbox" checked={pl.ausenciaPagada[t]} onChange={e => setPl('ausenciaPagada', { ...pl.ausenciaPagada, [t]: e.target.checked })} className="h-4 w-4" />{AUSENCIA_LABEL[t]}</label>)}
          <p className="text-caption text-steel-500">Las no pagadas se descuentan como un jornal por día (por ejemplo, un reposo médico que cubre el seguro).</p>
        </section>
        <section className="card space-y-4 p-5">
          <h2 className="font-display text-h3 text-arctic">Alertas y catálogo de EPP</h2>
          <div><label htmlFor="p-alerta" className={L}>Avisar vencimientos con (días de anticipación)</label><input id="p-alerta" type="number" min={1} max={365} value={c.alertaDias} onChange={e => setC({ ...c, alertaDias: Number(e.target.value) })} className="input w-full max-w-[160px]" /></div>
          <div className="space-y-2">
            {c.eppCatalogo.map((i, ix) => (
              <div key={i.key} className="flex items-center gap-2">
                <input aria-label={`Nombre de ${i.key}`} value={i.label} onChange={e => setC({ ...c, eppCatalogo: c.eppCatalogo.map((x, j) => j === ix ? { ...x, label: e.target.value } : x) })} className="input flex-1" />
                <input aria-label={`Vida útil en meses de ${i.label}`} type="number" min={0} max={240} value={i.vidaUtilMeses} onChange={e => setC({ ...c, eppCatalogo: c.eppCatalogo.map((x, j) => j === ix ? { ...x, vidaUtilMeses: Number(e.target.value) } : x) })} className="input w-20" />
                <span className="text-caption text-steel-500">meses</span>
                <button aria-label={`Quitar ${i.label}`} onClick={() => setC({ ...c, eppCatalogo: c.eppCatalogo.filter((_, j) => j !== ix) })} className="rounded p-2 text-steel-400 hover:text-danger-bright"><Trash2 className="h-4 w-4" /></button>
              </div>))}
            <div className="flex items-center gap-2 pt-1">
              <input aria-label="Nuevo ítem de EPP" placeholder="Nuevo ítem (ej: Arnés)" value={nuevo.label} onChange={e => setNuevo({ ...nuevo, label: e.target.value, key: e.target.value.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 30) })} className="input flex-1" />
              <input aria-label="Vida útil en meses" type="number" min={0} max={240} value={nuevo.vidaUtilMeses} onChange={e => setNuevo({ ...nuevo, vidaUtilMeses: Number(e.target.value) })} className="input w-20" />
              <button disabled={!nuevo.key || c.eppCatalogo.some(i => i.key === nuevo.key)} onClick={() => { setC({ ...c, eppCatalogo: [...c.eppCatalogo, nuevo] }); setNuevo({ key: '', label: '', vidaUtilMeses: 12 }); }} className="btn-secondary px-3 disabled:opacity-50" aria-label="Agregar ítem"><Plus className="h-4 w-4" /></button>
            </div>
            <p className="text-caption text-steel-500">La vida útil define cuándo se avisa la reposición (0 = no vence).</p>
          </div>
        </section>
      </div>
      <div className="mt-6 flex gap-3">
        <button onClick={guardar} disabled={busy} className="btn-primary disabled:opacity-50">{busy ? 'Guardando…' : 'Guardar parámetros'}</button>
        <button onClick={() => def && setC(def)} className="btn-ghost">Restablecer valores de referencia</button>
      </div>
    </div>
  );
}
