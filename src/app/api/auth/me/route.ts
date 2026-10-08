import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { ROLE_PERMISSIONS } from '@/lib/roles';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  let perms = ROLE_PERMISSIONS[session.role as keyof typeof ROLE_PERMISSIONS] ?? null;

  // Resolve custom roles from DB
  if (!perms) {
    try {
      const customRole = await prisma.customRole.findUnique({ where: { name: session.role } });
      if (customRole) {
        perms = customRole.permissions as typeof perms;
      }
    } catch { /* ignore */ }
  }

  return NextResponse.json({
    username: session.username,
    name: session.displayName ?? session.username,
    userId: session.userId ?? null,
    role: session.role,
    permissions: perms ?? null,
  });
}
