import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// Extension is derived from the verified MIME type — never from the client filename.
const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

// Magic-byte signatures for each accepted MIME type.
// Checked against the first bytes of the actual file content.
const MAGIC_BYTES: { mime: string; offset: number; bytes: number[] }[] = [
  { mime: 'image/jpeg', offset: 0, bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png',  offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/gif',  offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: 'image/webp', offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }, // "WEBP" at offset 8 in RIFF container
];

function detectMime(buf: Uint8Array): string | null {
  for (const sig of MAGIC_BYTES) {
    const slice = sig.bytes;
    if (buf.length < sig.offset + slice.length) continue;
    if (slice.every((b, i) => buf[sig.offset + i] === b)) return sig.mime;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    // Validate declared MIME type against allowlist
    if (!(file.type in ALLOWED_MIME_TO_EXT)) {
      return NextResponse.json({ error: 'Formato no permitido (solo JPG, PNG, WEBP o GIF)' }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'La imagen no puede superar los 5MB' }, { status: 400 });
    }

    // Read first 16 bytes to verify magic bytes match declared MIME type
    const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const detectedMime = detectMime(header);
    if (detectedMime !== file.type) {
      return NextResponse.json({ error: 'El contenido del archivo no coincide con el tipo declarado' }, { status: 400 });
    }

    // Extension comes from the verified MIME type, never from the original filename
    const ext = ALLOWED_MIME_TO_EXT[file.type];
    const filename = `productos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const blob = await put(filename, file, { access: 'public' });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error('Error en /api/upload:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al subir la imagen: ${message}` }, { status: 500 });
  }
}
