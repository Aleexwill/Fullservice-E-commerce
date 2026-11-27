import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { parseBody } from '@/lib/schemas';
import { AccionTrasladoSchema } from '@/lib/depositos';
import { cancelarTraslado, designarReceptor, recibirTraslado, respuestaError } from '@/lib/depositos-mov';
import { esTI } from '@/lib/ti/tickets';

/** `recibir`: el encargado del destino (o el designado) confirma y el stock entra. `designar`: se elige quién recibe en lugar del encargado. `cancelar`: se anula y el stock vuelve al origen. */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const a = await requireRole('canManageInventory');
  if (a instanceof NextResponse) return a;
  const p = await parseBody(request, AccionTrasladoSchema);
  if (p.error) return p.error;
  const actor = { id: a.userId ?? a.username, nombre: a.displayName ?? a.username, admin: await esTI(a) };
  try {
    if (p.data.accion === 'recibir') await recibirTraslado(params.id, p.data.nota, actor);
    else if (p.data.accion === 'designar') await designarReceptor(params.id, p.data.receptorId, actor);
    else await cancelarTraslado(params.id, p.data.nota, actor);
    return NextResponse.json({ ok: true });
  } catch (e) { const x = respuestaError(e); return NextResponse.json({ error: x.error }, { status: x.status }); }
}
