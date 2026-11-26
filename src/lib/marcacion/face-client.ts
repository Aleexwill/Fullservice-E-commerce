'use client';

// Reconocimiento facial en el teléfono (librería @vladmandic/face-api, modelos en /marcacion/models).
// De la cámara solo salen números (la huella de 128 valores): ninguna imagen se guarda ni se envía.
import type * as FaceApi from '@vladmandic/face-api';

type Api = typeof FaceApi;
let cargando: Promise<Api> | null = null;

export function cargarModelos(): Promise<Api> {
  if (!cargando) {
    cargando = (async () => {
      const api = await import('@vladmandic/face-api');
      const tf = api.tf as unknown as { setBackend(n: string): Promise<boolean>; ready(): Promise<void> };
      try { await tf.setBackend('webgl'); } catch { await tf.setBackend('cpu'); }
      await tf.ready();
      const base = '/marcacion/models';
      await Promise.all([api.nets.tinyFaceDetector.loadFromUri(base), api.nets.faceLandmark68TinyNet.loadFromUri(base), api.nets.faceRecognitionNet.loadFromUri(base)]);
      return api;
    })().catch(e => { cargando = null; throw e; });
  }
  return cargando;
}

export interface Lectura {
  caras: number;
  /** Ancho de la cara respecto del ancho del video (0-1). */
  tamano: number;
  /** Apertura de ojos (EAR): ~0.3 abiertos, <0.2 cerrados. */
  ojos: number;
  /** Posición de la nariz entre mandíbulas: ~0.5 de frente; se aleja de 0.5 al girar. */
  giro: number;
}

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
const ear = (p: { x: number; y: number }[]) => (dist(p[1], p[5]) + dist(p[2], p[4])) / (2 * dist(p[0], p[3]));

/** Lee el cuadro actual: cuántas caras hay, qué tan grande, ojos y giro. */
export async function leerCuadro(api: Api, video: HTMLVideoElement): Promise<Lectura> {
  const opts = new api.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
  const rs = await api.detectAllFaces(video, opts).withFaceLandmarks(true);
  if (rs.length !== 1) return { caras: rs.length, tamano: 0, ojos: 0, giro: 0.5 };
  const pts = rs[0].landmarks.positions;
  const jaw = rs[0].landmarks.getJawOutline();
  const giro = (pts[30].x - jaw[0].x) / (jaw[jaw.length - 1].x - jaw[0].x);
  const ojos = (ear(pts.slice(36, 42)) + ear(pts.slice(42, 48))) / 2;
  return { caras: 1, tamano: rs[0].detection.box.width / video.videoWidth, ojos, giro };
}

/** Calcula la huella (128 números) de la cara que se ve ahora. Devuelve null si no hay una sola cara. */
export async function calcularHuella(api: Api, video: HTMLVideoElement): Promise<number[] | null> {
  const opts = new api.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
  const rs = await api.detectAllFaces(video, opts).withFaceLandmarks(true).withFaceDescriptors();
  if (rs.length !== 1) return null;
  return Array.from(rs[0].descriptor);
}

// --- Prueba de vida: exige VER el movimiento, así una foto fija (aunque salga girada o con ojos cerrados) no pasa ---
export type TipoReto = 'parpadear' | 'girar';
export interface EstadoReto { tipo: TipoReto; visto: boolean; hecho: boolean; pasa: boolean }
export const nuevoReto = (tipo: TipoReto): EstadoReto => ({ tipo, visto: false, hecho: false, pasa: false });

/** Parpadear: ojos abiertos → cerrados → abiertos. Girar: de frente → girada. */
export function avanzarReto(e: EstadoReto, l: Lectura): EstadoReto {
  if (e.pasa || l.caras !== 1) return e;
  if (e.tipo === 'parpadear') {
    if (l.ojos > 0.25) return e.hecho ? { ...e, pasa: true } : { ...e, visto: true };
    if (e.visto && l.ojos < 0.2) return { ...e, hecho: true };
    return e;
  }
  const desvio = Math.abs(l.giro - 0.5);
  if (desvio < 0.09) return { ...e, visto: true };
  if (e.visto && desvio > 0.15) return { ...e, pasa: true };
  return e;
}

/** Cara de frente, ojos abiertos y suficientemente cerca para sacar la huella. */
export const esFrontal = (l: Lectura) => l.caras === 1 && Math.abs(l.giro - 0.5) < 0.12 && l.ojos > 0.2 && l.tamano > 0.28;
