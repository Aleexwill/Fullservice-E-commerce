/**
 * PUNTO DE CONEXIÓN con la ventana de funcionarios (usuarios del sistema que además son funcionarios, con fecha de ingreso).
 *
 * El enlace es por el `id` del usuario del sistema (`User.id`, el mismo `userKey` de las jornadas y ausencias):
 * el modelo de funcionarios debe guardar `userId` apuntando a `User.id` (único; opcional, porque un usuario puede no ser
 * funcionario y viceversa). Un funcionario sin usuario vinculado no marca asistencia.
 *
 * Cuando exista ese modelo, este es el ÚNICO archivo a tocar: devolver { userId → fecha de ingreso YYYY-MM-DD }.
 * Mientras devuelva vacío, las vacaciones usan el valor general de Parámetros y no se muestra antigüedad.
 *
 * Ejemplo:
 *   const fs = await prisma.funcionario.findMany({ where: { userId: { in: userKeys } }, select: { userId: true, fechaIngreso: true } });
 *   return new Map(fs.map(f => [f.userId!, f.fechaIngreso.toISOString().slice(0, 10)]));
 */
export async function obtenerFechasIngreso(_userKeys: string[]): Promise<Map<string, string>> {
  return new Map();
}

export async function obtenerFechaIngreso(userKey: string): Promise<string | null> {
  return (await obtenerFechasIngreso([userKey])).get(userKey) ?? null;
}
