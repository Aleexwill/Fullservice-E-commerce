import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { requireAuth } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_SIZE_BYTES = 200 * 1024 * 1024; // 200MB

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  'video/mp4':  'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

// Minimal magic-byte check for video formats
const MAGIC_BYTES: { mime: string; offset: number; bytes: number[] }[] = [
  { mime: 'video/webm',     offset: 0, bytes: [0x1a, 0x45, 0xdf, 0xa3] },
  { mime: 'video/mp4',      offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }, // 'ftyp'
  { mime: 'video/quicktime',offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }, // 'ftyp' (same container)
];

function detectMime(buf: Uint8Array): string | null {
  for (const sig of MAGIC_BYTES) {
    if (buf.length < sig.offset + sig.bytes.length) continue;
    if (sig.bytes.every((b, i) => buf[sig.offset + i] === b)) return sig.mime;
  }
  return null;
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    if (!(file.type in ALLOWED_MIME_TO_EXT)) {
      return NextResponse.json({ error: 'Formato no permitido (solo MP4, WEBM o MOV)' }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'El video no puede superar los 200MB' }, { status: 400 });
    }

    const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const detected = detectMime(header);
    // mp4 and mov share the same container signature — treat them as equivalent
    const declaredBase = file.type === 'video/quicktime' ? 'video/mp4' : file.type;
    const detectedBase = detected === 'video/quicktime' ? 'video/mp4' : detected;
    if (detectedBase !== null && detectedBase !== declaredBase) {
      return NextResponse.json({ error: 'El contenido del archivo no coincide con el tipo declarado' }, { status: 400 });
    }

    const ext = ALLOWED_MIME_TO_EXT[file.type];
    const filename = `innovacion/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const blob = await put(filename, file, { access: 'public', multipart: true });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error en /api/upload-video:', message);
    return NextResponse.json({ error: `Error al subir: ${message}` }, { status: 500 });
  }
}
