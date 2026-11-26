export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { panelIA } from '@/lib/ia/estadisticas';

/** ?mes=YYYY-MM (por defecto el actual). */
export async function GET(request: NextRequest) {
  const a = await requireRole('canManageConfig');
  if (a instanceof NextResponse) return a;
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Asuncion' }).format(new Date());
  const mes = new URL(request.url).searchParams.get('mes') ?? hoy.slice(0, 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) return NextResponse.json({ error: 'Mes inválido (AAAA-MM)' }, { status: 400 });
  try { return NextResponse.json(await panelIA(mes)); }
  catch (e) { console.error('GET /api/ia/panel:', e); return NextResponse.json({ error: 'Error al cargar el uso de IA' }, { status: 500 }); }
}
