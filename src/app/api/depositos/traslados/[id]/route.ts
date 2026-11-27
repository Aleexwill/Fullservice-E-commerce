import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { parseBody } from '@/lib/schemas';
import { AccionTrasladoSchema } from '@/lib/depositos';
import { cancelarTraslado, recibirTraslado, respuestaError } from '@/lib/depositos-mov';

/** `recibir`: el destino confirma y el stock entra. `cancelar`: se anula y el stock vuelve al origen. */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const a = await requireRole('canManageInventory');
  if (a instanceof NextResponse) return a;
  const p = await parseBody(request, AccionTrasladoSchema);
  if (p.error) return p.error;
  const usuario = a.displayName ?? a.username;
  try {
    if (p.data.accion === 'recibir') await recibirTraslado(params.id, p.data.nota, usuario);
    else await cancelarTraslado(params.id, p.data.nota, usuario);
    return NextResponse.json({ ok: true });
  } catch (e) { const x = respuestaError(e); return NextResponse.json({ error: x.error }, { status: x.status }); }
}
