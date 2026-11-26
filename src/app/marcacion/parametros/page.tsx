'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { MarcacionHeader } from '@/components/marcacion/header';
import { api } from '@/lib/marcacion/client';
import { DIAS_NOMBRE, PARAMETROS_DEFAULT, aniosAntiguedad, diasVacaciones } from '@/lib/marcacion/reglas';
import type { Dias, Parametros } from '@/lib/marcacion/reglas';
import { ROLE_LABELS } from '@/lib/roles';
import type { Role } from '@/lib/roles';

interface UsuarioMarca { userKey: string; nombre: string; email: string; rol: string; marca: boolean; marcaOverride: boolean | null; dias: Dias | null; ingreso: string | null }
interface Feriado { id: string; fecha: string; nombre: string }
const ORDEN = ['1', '2', '3', '4', '5', '6', '0']; // lunes a domingo
const hoyIso = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Asuncion' }).format(new Date());
const fmt = (x: string) => x.split('-').reverse().join('/');

function EditorDias({ dias, onChange }: { dias: Dias; onChange: (d: Dias) => void }) {
  const set = (k: string, patch: Partial<Dias[string]>) => onChange({ ...dias, [k]: { ...dias[k], ...patch } });
  return (
    <div className="mc-dias" role="group" aria-label="Horario por día">
      {ORDEN.map(k => (
        <div key={k} style={{ display: 'contents' }}>
          <label className="mc-chk" style={{ minHeight: 44 }}><input type="checkbox" checked={dias[k].laboral} onChange={e => set(k, { laboral: e.target.checked })} />{DIAS_NOMBRE[Number(k)]}</label>
          <input type="time" aria-label={`${DIAS_NOMBRE[Number(k)]} entrada`} value={dias[k].entrada} disabled={!dias[k].laboral} onChange={e => set(k, { entrada: e.target.value })} />
          <span className="mc-mut">a</span>
          <input type="time" aria-label={`${DIAS_NOMBRE[Number(k)]} salida`} value={dias[k].salida} disabled={!dias[k].laboral} onChange={e => set(k, { salida: e.target.value })} />
        </div>
      ))}
    </div>
  );
}

export default function ParametrosPage() {
  const [p, setP] = useState<Parametros | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioMarca[]>([]);
  const [fer, setFer] = useState<Feriado[]>([]);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [nf, setNf] = useState({ fecha: '', nombre: '' });
  const [abierto, setAbierto] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const cargarU = useCallback(async () => setUsuarios(await api<UsuarioMarca[]>('/api/marcacion/usuarios')), []);
  const cargarF = useCallback(async () => setFer(await api<Feriado[]>(`/api/marcacion/feriados?anio=${anio}`)), [anio]);
  useEffect(() => {
    api<{ parametros: Parametros; roles: string[] }>('/api/marcacion/config').then(d => { setP(d.parametros); setRoles(d.roles); }).catch(e => setError(e.message));
    cargarU().catch(e => setError(e.message));
  }, [cargarU]);
  useEffect(() => { cargarF().catch(e => setError(e.message)); }, [cargarF]);

  const run = async (fn: () => Promise<unknown>, msg = '') => {
    setError(''); setOk('');
    try { await fn(); if (msg) setOk(msg); } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
  };
  const guardar = () => run(async () => { await api('/api/marcacion/config', { method: 'PUT', body: JSON.stringify(p) }); await cargarU(); }, 'Parámetros guardados');
  const num = (k: keyof Parametros, label: string, hint: string, max = 240) => p && (
    <div className="mc-field"><label htmlFor={k}>{label}</label>
      <input id={k} type="number" min={0} max={max} className="mc-input" value={p[k] as number} onChange={e => setP({ ...p, [k]: Number(e.target.value) })} />
      <span className="mc-mut">{hint}</span></div>
  );
  const setU = (u: UsuarioMarca, marca: boolean | null, dias: Dias | null) =>
    run(async () => { await api('/api/marcacion/usuarios', { method: 'PUT', body: JSON.stringify({ userKey: u.userKey, marca, dias }) }); await cargarU(); }, `Guardado: ${u.nombre}`);

  return (
    <div className="mc-app mc-wide">
      <MarcacionHeader titulo="Parámetros de asistencia" />
      <div className="mc-main">
        <h1 className="mc-h">Parámetros</h1>
        {error && <div className="mc-err" role="alert">{error}</div>}
        {ok && <div className="mc-card" role="status" style={{ borderColor: 'var(--ok)' }}>{ok}</div>}
        {p && (<>
          <div className="mc-grid2" style={{ gap: 24 }}>
            <section>
              <h2 className="mc-h4">Horario general</h2>
              <p className="mc-mut">Marcá los días laborales y su hora de entrada y salida.</p>
              <EditorDias dias={p.dias} onChange={dias => setP({ ...p, dias })} />
            </section>
            <section>
              <h2 className="mc-h4">Reglas</h2>
              {num('toleranciaMin', 'Tolerancia (minutos)', 'Margen antes de contar tardanza o salida anticipada.', 120)}
              {num('almuerzoMin', 'Duración del almuerzo (minutos)', 'Se usa para calcular las horas esperadas.')}
              <label className="mc-chk"><input type="checkbox" checked={p.almuerzoAuto} onChange={e => setP({ ...p, almuerzoAuto: e.target.checked })} />Descontar el almuerzo si no lo marcaron (jornadas de 5 h o más)</label>
              {num('extraDesdeMin', 'Horas extra desde (minutos)', 'Mínimo de exceso para contarlo como extra.')}
              {num('vacacionesDias', 'Vacaciones por año (días hábiles)', 'Referencia para el saldo de cada persona.', 60)}
              <h2 className="mc-h4">Roles que marcan asistencia</h2>
              {roles.map(r => (
                <label key={r} className="mc-chk"><input type="checkbox" checked={p.rolesMarcan.includes(r)} onChange={e => setP({ ...p, rolesMarcan: e.target.checked ? [...p.rolesMarcan, r] : p.rolesMarcan.filter(x => x !== r) })} />{ROLE_LABELS[r as Role] ?? r}</label>
              ))}
            </section>
          </div>
          <div className="mc-two" style={{ maxWidth: 420 }}>
            <button className="mc-btn" onClick={guardar}>Guardar parámetros</button>
            <button className="mc-btn bad" onClick={() => setP(PARAMETROS_DEFAULT)}>Restablecer</button>
          </div>
        </>)}

        <h2 className="mc-h4">Personas</h2>
        <p className="mc-mut">Por defecto marcan los roles elegidos arriba. Acá podés incluir o excluir a alguien y darle un horario propio.</p>
        <div className="mc-scroll"><table className="mc-table">
          <thead><tr><th>Persona</th><th>Rol</th><th>Funcionario</th><th>Marca asistencia</th><th>Horario</th></tr></thead>
          <tbody>{usuarios.map(u => (<Fragment key={u.userKey}>
            <tr>
              <td>{u.nombre}<div className="mc-mut">{u.email}</div></td><td>{ROLE_LABELS[u.rol as Role] ?? u.rol}</td>
              <td>{u.ingreso ? <>Ingreso {fmt(u.ingreso)}<div className="mc-mut">{aniosAntiguedad(u.ingreso, hoyIso())} años · {diasVacaciones(u.ingreso, hoyIso(), p?.vacacionesDias ?? 12)} días de vacaciones</div></> : <span className="mc-mut">Sin funcionario vinculado</span>}</td>
              <td><select className="mc-input" aria-label={`Marca asistencia: ${u.nombre}`} style={{ minHeight: 40 }} value={u.marcaOverride === null ? 'rol' : u.marcaOverride ? 'si' : 'no'}
                onChange={e => setU(u, e.target.value === 'rol' ? null : e.target.value === 'si', u.dias)}>
                <option value="rol">Según su rol ({u.marca && u.marcaOverride === null ? 'sí' : u.marcaOverride === null ? 'no' : '—'})</option><option value="si">Sí</option><option value="no">No</option></select></td>
              <td><button className="mc-link" style={{ width: 'auto' }} onClick={() => setAbierto(abierto === u.userKey ? null : u.userKey)}>{u.dias ? 'Horario propio' : 'Horario general'} · editar</button></td>
            </tr>
            {abierto === u.userKey && (
              <tr><td colSpan={5}>
                <EditorDias dias={u.dias ?? p?.dias ?? PARAMETROS_DEFAULT.dias} onChange={d => setUsuarios(us => us.map(x => x.userKey === u.userKey ? { ...x, dias: d } : x))} />
                <div className="mc-two" style={{ maxWidth: 420 }}>
                  <button className="mc-btn sm" onClick={() => setU(u, u.marcaOverride, u.dias ?? p?.dias ?? PARAMETROS_DEFAULT.dias)}>Guardar horario propio</button>
                  <button className="mc-btn bad sm" onClick={() => setU(u, u.marcaOverride, null)}>Usar el general</button>
                </div>
              </td></tr>
            )}
          </Fragment>))}</tbody>
        </table></div>

        <h2 className="mc-h4">Feriados</h2>
        <div className="mc-filters">
          <div className="mc-field"><label htmlFor="an">Año</label><input id="an" type="number" className="mc-input" min={2024} max={2100} value={anio} onChange={e => setAnio(Number(e.target.value))} /></div>
          <div className="mc-field"><label htmlFor="ff">Fecha</label><input id="ff" type="date" className="mc-input" value={nf.fecha} onChange={e => setNf({ ...nf, fecha: e.target.value })} /></div>
          <div className="mc-field"><label htmlFor="fn">Nombre</label><input id="fn" className="mc-input" maxLength={80} value={nf.nombre} onChange={e => setNf({ ...nf, nombre: e.target.value })} /></div>
          <button className="mc-btn sm" disabled={!nf.fecha || !nf.nombre} onClick={() => run(async () => { await api('/api/marcacion/feriados', { method: 'POST', body: JSON.stringify(nf) }); setNf({ fecha: '', nombre: '' }); await cargarF(); })}>Agregar feriado</button>
        </div>
        <ul className="mc-log">
          {fer.map(x => (
            <li key={x.id} style={{ gridTemplateColumns: '90px 1fr auto' }}><span className="mc-mono">{fmt(x.fecha)}</span><div>{x.nombre}</div>
              <button className="mc-link" style={{ width: 'auto' }} onClick={() => run(async () => { await api(`/api/marcacion/feriados?id=${x.id}`, { method: 'DELETE' }); await cargarF(); })}>Quitar</button></li>
          ))}
          {fer.length === 0 && <li style={{ gridTemplateColumns: '1fr' }}><span className="mc-mut">No hay feriados cargados para {anio}.</span></li>}
        </ul>
      </div>
    </div>
  );
}
