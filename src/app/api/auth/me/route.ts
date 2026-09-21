import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { ROLE_PERMISSIONS } from '@/lib/roles';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  const perms = ROLE_PERMISSIONS[session.role as keyof typeof ROLE_PERMISSIONS] ?? null;

  return NextResponse.json({
    username: session.username,
    userId: session.userId ?? null,
    role: session.role,
    canAprobarPresupuestos: perms?.canAprobarPresupuestos ?? false,
  });
}
