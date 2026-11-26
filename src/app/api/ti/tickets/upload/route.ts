import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { requireRole } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX = 4 * 1024 * 1024;
const MAX_SIN_BLOB = 1.5 * 1024 * 1024; // sin Vercel Blob (desarrollo) viaja como data URL dentro de la base
const FIRMAS: { mime: string; ext: string; offset: number; bytes: number[] }[] = [
  { mime: 'application/pdf', ext: 'pdf', offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] },
  { mime: 'image/jpeg', ext: 'jpg', offset: 0, bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', ext: 'png', offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/webp', ext: 'webp', offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
];

/** Adjunto de un ticket: captura (JPG/PNG/WEBP) o PDF de hasta 4 MB. El tipo se verifica por el contenido. */
export async function POST(request: NextRequest) {
  const a = await requireRole('canUseTickets');
  if (a instanceof NextResponse) return a;
  if (!rateLimit(`ticket-up:${a.userId ?? a.username}`, 30, 3_600_000).allowed) return NextResponse.json({ error: 'Demasiados archivos en poco tiempo' }, { status: 429 });
  try {
    const file = (await request.formData()).get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    if (file.size > MAX) return NextResponse.json({ error: 'El archivo no puede superar 4 MB' }, { status: 400 });
    const buf = new Uint8Array(await file.arrayBuffer());
    const tipo = FIRMAS.find(s => buf.length >= s.offset + s.bytes.length && s.bytes.every((b, i) => buf[s.offset + i] === b));
    if (!tipo) return NextResponse.json({ error: 'Formato no permitido (JPG, PNG, WEBP o PDF)' }, { status: 400 });
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      if (file.size > MAX_SIN_BLOB) return NextResponse.json({ error: 'Sin almacenamiento configurado el archivo no puede superar 1,5 MB' }, { status: 400 });
      return NextResponse.json({ url: `data:${tipo.mime};base64,${Buffer.from(buf).toString('base64')}` });
    }
    const blob = await put(`tickets/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${tipo.ext}`, Buffer.from(buf), { access: 'public', contentType: tipo.mime });
    return NextResponse.json({ url: blob.url });
  } catch (e) {
    console.error('POST /api/ti/tickets/upload:', e);
    return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 });
  }
}
