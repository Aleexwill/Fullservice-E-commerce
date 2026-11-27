'use client';

import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Modal } from './comun';

/** Lee el QR de una etiqueta con la cámara trasera. Devuelve el id del artículo (QR de la app) o el texto leído (código). */
export function Escaner({ onClose, onResult }: { onClose: () => void; onResult: (r: { id?: string; texto: string }) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState('');
  const [manual, setManual] = useState('');

  useEffect(() => {
    let stop = false; let stream: MediaStream | null = null; let timer = 0;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        const v = video.current; if (!v) return; v.srcObject = stream; await v.play();
        const c = document.createElement('canvas'); const ctx = c.getContext('2d', { willReadFrequently: true })!;
        const leer = () => {
          if (stop) return;
          if (v.videoWidth) {
            const k = Math.min(1, 640 / v.videoWidth); c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k);
            ctx.drawImage(v, 0, 0, c.width, c.height);
            const q = jsQR(ctx.getImageData(0, 0, c.width, c.height).data, c.width, c.height);
            if (q?.data) { stop = true; const m = q.data.match(/[?&]item=([\w-]+)/); onResult({ id: m?.[1], texto: q.data.trim() }); return; }
          }
          timer = window.setTimeout(leer, 150);
        };
        leer();
      } catch { setErr('No se pudo abrir la cámara. Revisá el permiso del navegador (la cámara solo funciona con https) o escribí el código.'); }
    })();
    return () => { stop = true; clearTimeout(timer); stream?.getTracks().forEach(t => t.stop()); };
  }, [onResult]);

  return (
    <Modal titulo="Escanear etiqueta QR" onClose={onClose}>
      {!err && <div className="relative overflow-hidden rounded-lg bg-black"><video ref={video} playsInline muted className="h-64 w-full object-cover sm:h-72" aria-label="Vista de la cámara" /><div className="pointer-events-none absolute inset-8 rounded-lg border-2 border-blue-bright/80" /></div>}
      {err && <p role="alert" className="mb-2 text-body-sm text-orange-bright">{err}</p>}
      {!err && <p className="mt-2 text-caption text-steel-400">Apuntá la cámara al código QR de la etiqueta del artículo.</p>}
      <form className="mt-3 flex gap-2" onSubmit={e => { e.preventDefault(); if (manual.trim()) onResult({ texto: manual.trim() }); }}>
        <label htmlFor="esc-m" className="sr-only">Código del artículo</label>
        <input id="esc-m" value={manual} onChange={e => setManual(e.target.value)} placeholder="O escribí el código del artículo" className="input w-full text-base sm:text-sm" />
        <button className="btn-secondary flex-none">Buscar</button>
      </form>
    </Modal>
  );
}
