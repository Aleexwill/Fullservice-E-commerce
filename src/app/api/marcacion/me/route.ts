export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { ROLE_LABELS } from '@/lib/roles';
import type { Role } from '@/lib/roles';
import { puedeAprobar, puedeAdministrar, puedeVerReportes, userNameOf } from '@/lib/marcacion/server';
import type { MeDTO } from '@/lib/marcacion/shared';

export async function GET() {
  const s = await requireAuth();
  if (s instanceof NextResponse) return s;
  const me: MeDTO = {
    name: userNameOf(s), rol: ROLE_LABELS[s.role as Role] ?? s.role,
    aprueba: puedeAprobar(s.role), administra: puedeAdministrar(s.role), reportes: puedeVerReportes(s.role),
  };
  return NextResponse.json(me);
}
