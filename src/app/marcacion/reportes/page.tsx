'use client';

import { useCallback, useEffect, useState } from 'react';
import { MarcacionHeader } from '@/components/marcacion/header';
import { api } from '@/lib/marcacion/client';
import { aCsv, descargarCsv } from '@/lib/marcacion/csv';
import { ESTADO_DIA_LABEL, horasTxt } from '@/lib/marcacion/reglas';
import type { EstadoDia, FilaDia } from '@/lib/marcacion/reglas';

interface Resumen { userKey: string; userName: string; diasTrabajados: number; trabajadoMin: number; tardanzas: number; tardanzaMin: number; ausencias: number; justificados: number; extraMin: number; anticipadas: number; trasladoMin: number; enSitioMin: number; sinSalida: number }
interface Rep { desde: string; hasta: string; filas: FilaDia[]; resumen: Resumen[]; personas: { userKey: string; nombre: string }[] }
interface Vivo { fecha: string; filas: { userKey: string; nombre: string; estado: string; sitio: string; entrada: string; tarde: boolean; eppPendiente: boolean; ausenciaTipo: string | null }[] }

const hoyIso = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Asuncion' }).format(new Date());
const fechaCorta = (f: string) => { const [y, m, d] = f.split('-'); return `${d}/${m}/${y}`; };
const TONO: Partial<Record<EstadoDia, string>> = { PRESENTE: 'g', TARDE: 'o', INCOMPLETA: 'o', AUSENTE: 'r', PENDIENTE: 'b' };

export default function ReportesPage() {
  const h = hoyIso();
  const [tab, setTab] = useState<'vivo' | 'dias' | 'personas'>('vivo');
  const [desde, setDesde] = useState(`${h.slice(0, 7)}-01`);
  const [hasta, setHasta] = useState(h);
  const [userKey, setUserKey] = useState('');
  const [rep, setRep] = useState<Rep | null>(null);
  const [vivo, setVivo] = useState<Vivo | null>(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const cargarRep = useCallback(async () => {
    setCargando(true); setError('');
    try { setRep(await api<Rep>(`/api/marcacion/reportes?desde=${desde}&hasta=${hasta}${userKey ? `&userKey=${encodeURIComponent(userKey)}` : ''}`)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
    finally { setCargando(false); }
  }, [desde, hasta, userKey]);
  const cargarVivo = useCallback(async () => {
    try { setVivo(await api<Vivo>('/api/marcacion/reportes/hoy')); } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
  }, []);

  useEffect(() => { cargarRep(); }, [cargarRep]);
  useEffect(() => { cargarVivo(); const t = setInterval(cargarVivo, 20000); return () => clearInterval(t); }, [cargarVivo]);

  const tot = rep?.resumen.reduce((a, r) => ({ dias: a.dias + r.diasTrabajados, min: a.min + r.trabajadoMin, tard: a.tard + r.tardanzas, aus: a.aus + r.ausencias, ext: a.ext + r.extraMin }), { dias: 0, min: 0, tard: 0, aus: 0, ext: 0 });

  function exportar() {
    if (!rep) return;
    if (tab === 'personas') {
      descargarCsv(`resumen-asistencia-${rep.desde}_${rep.hasta}.csv`, aCsv(
        ['Persona', 'Días trabajados', 'Horas trabajadas', 'Tardanzas', 'Min. tarde', 'Salidas anticipadas', 'Ausencias', 'Días justificados', 'Horas extra', 'Traslado', 'En el lugar', 'Sin salida'],
        rep.resumen.map(r => [r.userName, r.diasTrabajados, horasTxt(r.trabajadoMin), r.tardanzas, r.tardanzaMin, r.anticipadas, r.ausencias, r.justificados, horasTxt(r.extraMin), horasTxt(r.trasladoMin), horasTxt(r.enSitioMin), r.sinSalida])));
    } else {
      descargarCsv(`asistencia-${rep.desde}_${rep.hasta}.csv`, aCsv(
        ['Fecha', 'Persona', 'Estado', 'Horario previsto', 'Entrada', 'Salida', 'Almuerzo (min)', 'Horas trabajadas', 'Min. tarde', 'Min. salida anticipada', 'Horas extra', 'Traslado', 'En el lugar', 'Lugar', 'Nota'],
        rep.filas.map(f => [fechaCorta(f.fecha), f.userName, ESTADO_DIA_LABEL[f.estado], f.esperadaEntrada ? `${f.esperadaEntrada}-${f.esperadaSalida}` : '', f.entrada, f.salida, f.almuerzoMin, horasTxt(f.trabajadoMin), f.tardanzaMin, f.anticipadaMin, horasTxt(f.extraMin), horasTxt(f.trasladoMin), horasTxt(f.enSitioMin), f.sitio, f.nota])));
    }
  }

  return (
    <div className="mc-app mc-wide">
      <MarcacionHeader titulo="Reportes de asistencia" />
      <div className="mc-main">
        <div className="mc-tabs" role="group" aria-label="Vista">
          <button aria-pressed={tab === 'vivo'} onClick={() => setTab('vivo')}>Hoy en vivo</button>
          <button aria-pressed={tab === 'personas'} onClick={() => setTab('personas')}>Resumen por persona</button>
          <button aria-pressed={tab === 'dias'} onClick={() => setTab('dias')}>Detalle por día</button>
        </div>
        {error && <div className="mc-err" role="alert">{error}</div>}

        {tab === 'vivo' ? (<>
          <h1 className="mc-h">Hoy, {vivo ? fechaCorta(vivo.fecha) : ''}</h1>
          <div className="mc-scroll"><table className="mc-table">
            <thead><tr><th>Persona</th><th>Estado</th><th>Entrada</th><th>Lugar</th><th>Aviso</th></tr></thead>
            <tbody>
              {vivo?.filas.map(f => (
                <tr key={f.userKey}><td>{f.nombre}</td><td>{f.estado}</td><td>{f.entrada || '—'}</td><td>{f.sitio || '—'}</td>
                  <td>{f.tarde && <span className="mc-chip o">Llegó tarde</span>} {f.eppPendiente && <span className="mc-chip o">Equipo por aprobar</span>}</td></tr>
              ))}
              {vivo && vivo.filas.length === 0 && <tr><td colSpan={5} className="mc-mut">No hay personas configuradas para marcar. Definilas en Parámetros.</td></tr>}
            </tbody>
          </table></div>
        </>) : (<>
          <h1 className="mc-h">{tab === 'personas' ? 'Resumen por persona' : 'Detalle por día'}</h1>
          <div className="mc-filters">
            <div className="mc-field"><label htmlFor="d">Desde</label><input id="d" type="date" className="mc-input" value={desde} max={hasta} onChange={e => setDesde(e.target.value)} /></div>
            <div className="mc-field"><label htmlFor="h">Hasta</label><input id="h" type="date" className="mc-input" value={hasta} min={desde} onChange={e => setHasta(e.target.value)} /></div>
            <div className="mc-field"><label htmlFor="p">Persona</label>
              <select id="p" className="mc-input" value={userKey} onChange={e => setUserKey(e.target.value)}><option value="">Todas</option>{rep?.personas.map(p => <option key={p.userKey} value={p.userKey}>{p.nombre}</option>)}</select></div>
            <button className="mc-btn sm" disabled={!rep || rep.filas.length === 0} onClick={exportar}>Exportar CSV</button>
          </div>
          {tot && (
            <div className="mc-kpis">
              <div><b>{tot.dias}</b><span>Días trabajados</span></div><div><b>{horasTxt(tot.min)}</b><span>Horas trabajadas</span></div>
              <div><b>{tot.tard}</b><span>Tardanzas</span></div><div><b>{tot.aus}</b><span>Ausencias</span></div><div><b>{horasTxt(tot.ext)}</b><span>Horas extra</span></div>
            </div>
          )}
          {cargando && <p className="mc-mut">Calculando…</p>}
          {rep && tab === 'personas' && (
            <div className="mc-scroll"><table className="mc-table">
              <thead><tr><th>Persona</th><th className="n">Días</th><th className="n">Horas</th><th className="n">Tardanzas</th><th className="n">Min. tarde</th><th className="n">Salida antic.</th><th className="n">Ausencias</th><th className="n">Justificados</th><th className="n">Extra</th><th className="n">Traslado</th><th className="n">En el lugar</th><th className="n">Sin salida</th></tr></thead>
              <tbody>{rep.resumen.map(r => (
                <tr key={r.userKey}><td>{r.userName}</td><td className="n">{r.diasTrabajados}</td><td className="n">{horasTxt(r.trabajadoMin)}</td><td className="n">{r.tardanzas}</td><td className="n">{r.tardanzaMin}</td><td className="n">{r.anticipadas}</td><td className="n">{r.ausencias}</td><td className="n">{r.justificados}</td><td className="n">{horasTxt(r.extraMin)}</td><td className="n">{horasTxt(r.trasladoMin)}</td><td className="n">{horasTxt(r.enSitioMin)}</td><td className="n">{r.sinSalida}</td></tr>
              ))}{rep.resumen.length === 0 && <tr><td colSpan={12} className="mc-mut">Sin datos en el período.</td></tr>}</tbody>
            </table></div>
          )}
          {rep && tab === 'dias' && (
            <div className="mc-scroll"><table className="mc-table">
              <thead><tr><th>Fecha</th><th>Persona</th><th>Estado</th><th>Previsto</th><th>Entrada</th><th>Salida</th><th className="n">Almuerzo</th><th className="n">Horas</th><th className="n">Tarde</th><th className="n">Salió antes</th><th className="n">Extra</th><th className="n">Traslado</th><th>Lugar / nota</th></tr></thead>
              <tbody>{rep.filas.map(f => (
                <tr key={f.userKey + f.fecha}><td>{fechaCorta(f.fecha)}</td><td>{f.userName}</td><td><span className={`mc-chip ${TONO[f.estado] ?? ''}`}>{ESTADO_DIA_LABEL[f.estado]}</span></td>
                  <td>{f.esperadaEntrada ? `${f.esperadaEntrada}-${f.esperadaSalida}` : '—'}</td><td>{f.entrada || '—'}</td><td>{f.salida || '—'}</td>
                  <td className="n">{f.almuerzoMin ? `${f.almuerzoMin} min` : '—'}</td><td className="n">{f.trabajadoMin ? horasTxt(f.trabajadoMin) : '—'}</td>
                  <td className="n">{f.tardanzaMin ? `${f.tardanzaMin} min` : '—'}</td><td className="n">{f.anticipadaMin ? `${f.anticipadaMin} min` : '—'}</td><td className="n">{f.extraMin ? horasTxt(f.extraMin) : '—'}</td><td className="n">{f.trasladoMin ? horasTxt(f.trasladoMin) : '—'}</td>
                  <td>{[f.sitio, f.nota].filter(Boolean).join(' · ') || '—'}</td></tr>
              ))}{rep.filas.length === 0 && <tr><td colSpan={13} className="mc-mut">Sin datos en el período.</td></tr>}</tbody>
            </table></div>
          )}
          <p className="mc-mut">Las ausencias sin aviso se detectan solas: día laboral, sin feriado, sin marca y sin vacaciones, permiso o reposo aprobado. Reglas y horarios se cambian en Parámetros.</p>
        </>)}
      </div>
    </div>
  );
}
