import { prisma } from '@/lib/prisma';

/**
 * Enlace entre la marcación y la ventana de funcionarios (/admin/funcionarios): `Funcionario.userId` = `User.id`
 * (el mismo `userKey` de jornadas y ausencias). Devuelve { userId → fecha de ingreso YYYY-MM-DD } de los funcionarios activos.
 * Es el único punto de lectura: si el modelo de funcionarios cambia (por ejemplo al unificarlo con otra versión),
 * adaptar solo esta función.
 */
export async function obtenerFechasIngreso(userKeys: string[]): Promise<Map<string, string>> {
  if (userKeys.length === 0) return new Map();
  const fs = await prisma.funcionario.findMany({
    where: { userId: { in: userKeys }, isActive: true },
    select: { userId: true, fechaIngreso: true },
  });
  return new Map(fs.flatMap(f => (f.userId ? [[f.userId, f.fechaIngreso] as [string, string]] : [])));
}

export async function obtenerFechaIngreso(userKey: string): Promise<string | null> {
  return (await obtenerFechasIngreso([userKey])).get(userKey) ?? null;
}
