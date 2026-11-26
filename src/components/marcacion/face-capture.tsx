'use client';

import { useEffect, useRef, useState } from 'react';
import { comprimirImagen } from '@/lib/marcacion/client';

interface Props { titulo: string; onCapture: (fotoDataUrl: string) => void; onCancel: () => void }

// FaceDetector (Shape Detection API) existe solo en algunos navegadores; si no está, se omite el aviso.
type FaceDetectorLike = { detect(v: HTMLVideoElement): Promise<unknown[]> };

/** Cámara frontal a pantalla completa: guía en óvalo, detecta rostro si el navegador lo permite y captura la selfie. */
export function FaceCapture({ titulo, onCapture, onCancel }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const [msg, setMsg] = useState('Iniciando cámara…');
  const [listo, setListo] = useState(false);
  const [rostro, setRostro] = useState<boolean | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;
    let vivo = true;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 1280 } }, audio: false });
        if (!vivo || !video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        setListo(true);
        setMsg('Centrá tu rostro en el óvalo');
        const FD = (window as unknown as { FaceDetector?: new (o?: object) => FaceDetectorLike }).FaceDetector;
        if (FD) {
          const det = new FD({ fastMode: true, maxDetectedFaces: 1 });
          timer = setInterval(async () => {
            if (!video.current) return;
            try { setRostro((await det.detect(video.current)).length > 0); } catch { /* ignorar */ }
          }, 500);
        }
      } catch {
        setErr('No pudimos abrir la cámara. Permití el acceso a la cámara en los ajustes del navegador.');
      }
    })();
    return () => { vivo = false; if (timer) clearInterval(timer); stream?.getTracks().forEach(t => t.stop()); };
  }, []);

  async function capturar() {
    if (!video.current) return;
    setBusy(true);
    try { onCapture(await comprimirImagen(video.current, 720, 0.8)); }
    catch { setErr('No se pudo tomar la foto. Intentá de nuevo.'); setBusy(false); }
  }

  const ok = rostro === true;
  return (
    <div className="mc-face" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="mc-face-title">{titulo}</div>
      <div className={`mc-oval ${ok ? 'ok' : ''}`}>
        <video ref={video} playsInline muted />
      </div>
      <p className="mc-face-msg" aria-live="polite">
        {err || (rostro === false ? 'No veo tu rostro. Acercate y buscá luz.' : ok ? 'Rostro detectado' : msg)}
      </p>
      <div className="mc-face-actions">
        <button className="mc-btn" onClick={capturar} disabled={!listo || busy || rostro === false}>{busy ? 'Procesando…' : 'Tomar foto y marcar'}</button>
        <button className="mc-link" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}
