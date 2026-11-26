/**
 * PUNTO DE CONEXIÓN con la ventana de funcionarios (alta de usuarios que también son funcionarios, con su fecha de ingreso).
 *
 * Esa ventana se desarrolla aparte. Cuando exista su modelo, es el ÚNICO archivo que hay que tocar: devolver la fecha de
 * ingreso (YYYY-MM-DD) del usuario, o null si no está cargada. Mientras devuelva null, las vacaciones usan el valor
 * general de Parámetros ("Vacaciones por año") en vez de calcularse por antigüedad.
 *
 * Ejemplo cuando exista el modelo:
 *   const f = await prisma.funcionario.findUnique({ where: { userId: userKey }, select: { fechaIngreso: true } });
 *   return f?.fechaIngreso.toISOString().slice(0, 10) ?? null;
 */
export async function obtenerFechaIngreso(_userKey: string): Promise<string | null> {
  return null;
}
