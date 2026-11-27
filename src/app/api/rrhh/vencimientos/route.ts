export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { listarVencimientos } from '@/lib/rrhh/server';

export async function GET() {
  const a = await requireRole('canManageRRHH');
  if (a instanceof NextResponse) return a;
  try { return NextResponse.json(await listarVencimientos()); }
  catch (e) { console.error('GET /api/rrhh/vencimientos:', e); return NextResponse.json({ error: 'Error al cargar' }, { status: 500 }); }
}
