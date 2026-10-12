import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { requireCustomerAuth } from '@/lib/customer-auth';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const MAGIC_BYTES: { mime: string; offset: number; bytes: number[] }[] = [
  { mime: 'image/jpeg', offset: 0, bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png',  offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/webp', offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
];

function detectMime(buf: Uint8Array): string | null {
  for (const sig of MAGIC_BYTES) {
    if (buf.length < sig.offset + sig.bytes.length) continue;
    if (sig.bytes.every((b, i) => buf[sig.offset + i] === b)) return sig.mime;
  }
  return null;
}

export async function POST(request: NextRequest) {
  const session = await requireCustomerAuth();
  if (session instanceof NextResponse) return session;

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    if (!(file.type in ALLOWED_MIME_TO_EXT)) {
      return NextResponse.json({ error: 'Solo se permiten imágenes JPG, PNG o WEBP' }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'La imagen no puede superar los 8MB' }, { status: 400 });
    }

    const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const detectedMime = detectMime(header);
    if (detectedMime !== file.type) {
      return NextResponse.json({ error: 'El archivo no es una imagen válida' }, { status: 400 });
    }

    const ext = ALLOWED_MIME_TO_EXT[file.type];
    const filename = `comprobantes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const blob = await put(filename, file, { access: 'public' });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error en /api/customer/upload:', message);
    return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 });
  }
}
