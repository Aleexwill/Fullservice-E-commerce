import { prisma } from '@/lib/prisma';
import { normalizarParametros, PARAMETROS_DEFAULT, validarDias } from './reglas';
import type { Dias, Parametros } from './reglas';
import { ROLE_PERMISSIONS } from '@/lib/roles';
import { obtenerFechasIngreso } from './funcionarios';

export async function getParametros(): Promise<Parametros> {
  const row = await prisma.marcacionConfig.findUnique({ where: { id: 'default' } }).catch(() => null);
  return normalizarParametros(row?.data ?? PARAMETROS_DEFAULT);
}

export interface UsuarioMarca { userKey: string; nombre: string; email: string; rol: string; marca: boolean; marcaOverride: boolean | null; dias: Dias | null; ingreso: string | null }

/** Usuarios activos con su regla de asistencia: el override personal gana; si no, depende de su rol. */
export async function getUsuariosMarca(params: Parametros): Promise<UsuarioMarca[]> {
  const [users, over] = await Promise.all([
    prisma.user.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    prisma.horarioUsuario.findMany(),
  ]);
  const byKey = new Map(over.map(o => [o.userKey, o]));
  const ingresos = await obtenerFechasIngreso(users.map(u => u.id)); // funcionario vinculado por User.id
  return users.map(u => {
    const o = byKey.get(u.id);
    return {
      userKey: u.id, nombre: u.name, email: u.email, rol: u.role,
      marca: o?.marca ?? params.rolesMarcan.includes(u.role),
      marcaOverride: o?.marca ?? null,
      dias: o?.dias ? validarDias(o.dias) : null,
      ingreso: ingresos.get(u.id) ?? null,
    };
  });
}

export const ROLES_DISPONIBLES = Object.keys(ROLE_PERMISSIONS);
