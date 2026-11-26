'use client';

import { useEffect, useRef, useState } from 'react';
import { avanzarReto, calcularHuella, cargarModelos, esFrontal, leerCuadro, nuevoReto } from '@/lib/marcacion/face-client';
import type { TipoReto } from '@/lib/marcacion/face-client';
import '@/styles/marcacion.css';

interface Props {
  titulo: string;
  /** 'verificar': prueba de vida + 1 huella. 'enrolar': 3 huellas de frente. */
  modo: 'verificar' | 'enrolar';
  onHuellas: (huellas: number[][]) => void;
  onCancel: () => void;
}

type Fase = 'cargando' | 'buscar' | 'reto' | 'frente' | 'guardando';
const RETOS: TipoReto[] = ['parpadear', 'girar'];
const PASO_MS = 220;

/** Cámara frontal con guía en óvalo. Todo ocurre en el teléfono: del video solo salen números (la huella facial). */
export function FaceCapture({ titulo, modo, onHuellas, onCancel }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const [fase, setFase] = useState<Fase>('cargando');
  const [msg, setMsg] = useState('Preparando reconocimiento…');
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');
  const [intento, setIntento] = useState(0);
  const [progreso, setProgreso] = useState(0);

  useEffect(() => {
    let vivo = true;
    let stream: MediaStream | null = null;
    const esperar = (ms: number) => new Promise(r => setTimeout(r, ms));
    (async () => {
      try {
        setErr(''); setOk(false); setFase('cargando'); setMsg('Preparando reconocimiento…'); setProgreso(0);
        const [api, s] = await Promise.all([
          cargarModelos(),
          navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false }),
        ]);
        stream = s;
        if (!vivo || !video.current) return;
        video.current.srcObject = s;
        await video.current.play();
        const v = video.current;

        const huellas: number[][] = [];
        let reto = nuevoReto(RETOS[Math.floor(Math.random() * RETOS.length)]);
        const inicio = Date.now();
        let paso: Fase = 'buscar';
        let frentes = 0;
        setFase('buscar'); setMsg('Centrá tu rostro en el óvalo');

        while (vivo) {
          if (Date.now() - inicio > 30000) throw new Error('Tiempo agotado. Intentá de nuevo con buena luz.');
          const t0 = Date.now();
          const l = await leerCuadro(api, v);
          const frontal = esFrontal(l);

          if (l.caras === 0) { setMsg('No veo tu rostro. Buscá luz y acercate.'); }
          else if (l.caras > 1) { setMsg('Hay más de una cara en la imagen.'); }
          else if (l.tamano < 0.28) { setMsg('Acercate un poco más.'); }
          else if (paso === 'buscar' && modo === 'verificar') {
            paso = 'reto'; setFase('reto');
          } else if (paso === 'buscar') { paso = 'frente'; setFase('frente'); }

          if (l.caras === 1 && l.tamano >= 0.28) {
            if (paso === 'reto') {
              // Prueba de vida: un gesto al azar que una foto fija no puede hacer
              setMsg(reto.tipo === 'parpadear' ? 'Mirá al frente y parpadeá una vez' : 'Mirá al frente y después girá la cabeza hacia un lado');
              reto = avanzarReto(reto, l);
              if (reto.pasa) { paso = 'frente'; setFase('frente'); }
            } else if (paso === 'frente') {
              setMsg(modo === 'enrolar' ? `Mirá al frente, sin moverte (${huellas.length + 1} de 3)` : 'Mirá al frente');
              frentes = frontal ? frentes + 1 : 0;
              if (frentes >= 2) {
                const h = await calcularHuella(api, v);
                frentes = 0;
                if (h) {
                  huellas.push(h); setProgreso(huellas.length);
                  if (modo === 'verificar') break;
                  if (huellas.length >= 3) break;
                  setMsg('Muy bien. Mové un poco la cabeza y volvé a mirar al frente.'); await esperar(900);
                }
              }
            }
          }
          const resto = PASO_MS - (Date.now() - t0);
          if (resto > 0) await esperar(resto);
        }
        if (!vivo) return;
        setOk(true); setFase('guardando'); setMsg(modo === 'verificar' ? 'Verificando…' : 'Guardando…');
        onHuellas(huellas);
      } catch (e) {
        if (!vivo) return;
        const m = e instanceof Error ? e.message : '';
        setErr(/Permission|NotAllowed|denied/i.test(m) ? 'Permití el acceso a la cámara en los ajustes del navegador.' : m || 'No se pudo iniciar la cámara.');
      }
    })();
    return () => { vivo = false; stream?.getTracks().forEach(t => t.stop()); };
  }, [modo, intento]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mc-face" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="mc-face-title">{titulo}</div>
      <div className={`mc-oval ${ok ? 'ok' : ''}`}><video ref={video} playsInline muted /></div>
      <p className="mc-face-msg" aria-live="polite">{err || msg}</p>
      {modo === 'enrolar' && !err && <p className="mc-face-msg" style={{ fontSize: 14, opacity: 0.8 }}>{progreso} de 3 capturas</p>}
      <p className="mc-face-msg" style={{ fontSize: 13, opacity: 0.7 }}>No se guarda ninguna imagen: solo una huella numérica de tu rostro.</p>
      <div className="mc-face-actions">
        {err && <button className="mc-btn" onClick={() => setIntento(n => n + 1)}>Reintentar</button>}
        <button className="mc-link" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}
