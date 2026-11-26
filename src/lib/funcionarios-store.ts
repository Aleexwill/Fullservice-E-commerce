import { prisma } from '@/lib/prisma';
import { aniosAntiguedad, antiguedadDetalle, diasVacaciones } from '@/lib/marcacion/reglas';
import { getParametros } from '@/lib/marcacion/config-server';
import { hoy } from '@/lib/marcacion/server';

export interface FuncionarioDTO {
  id: string; userId: string | null; usuario: { email: string; name: string; role: string } | null;
  nombre: string; documento: string | null; cargo: string; telefono: string; email: string; fechaIngreso: string; fechaEgreso: string | null;
  isActive: boolean; notas: string;
  antiguedad: { anios: number; meses: number; proximoTramo: string | null }; diasVacaciones: number;
  rostro: { enrolado: boolean; fecha: string | null };
}

/** Lista funcionarios con su usuario enlazado, antigüedad y días de vacaciones que les corresponden hoy. */
export async function listarFuncionarios(): Promise<{ funcionarios: FuncionarioDTO[]; usuariosLibres: { id: string; email: string; name: string; role: string }[] }> {
  const [fs, users, params, plantillas] = await Promise.all([
    prisma.funcionario.findMany({ orderBy: [{ isActive: 'desc' }, { nombre: 'asc' }] }),
    prisma.user.findMany({ where: { isActive: true }, select: { id: true, email: true, name: true, role: true }, orderBy: { name: 'asc' } }),
    getParametros(),
    prisma.rostroPlantilla.findMany({ select: { userKey: true, updatedAt: true } }),
  ]);
  const pBy = new Map(plantillas.map(p => [p.userKey, p.updatedAt.toISOString().slice(0, 10)]));
  const h = hoy();
  const uById = new Map(users.map(u => [u.id, u]));
  const enlazados = new Set(fs.map(f => f.userId).filter(Boolean));
  const funcionarios = fs.map(f => {
    const ref = f.fechaEgreso && f.fechaEgreso < h ? f.fechaEgreso : h;
    const u = f.userId ? uById.get(f.userId) ?? null : null;
    return {
      id: f.id, userId: f.userId, usuario: u ? { email: u.email, name: u.name, role: u.role } : null,
      nombre: f.nombre, documento: f.documento, cargo: f.cargo, telefono: f.telefono, email: f.email,
      fechaIngreso: f.fechaIngreso, fechaEgreso: f.fechaEgreso, isActive: f.isActive, notas: f.notas,
      antiguedad: antiguedadDetalle(f.fechaIngreso, ref), diasVacaciones: diasVacaciones(f.fechaIngreso, h, params.vacacionesDias),
      rostro: { enrolado: !!(f.userId && pBy.has(f.userId)), fecha: f.userId ? pBy.get(f.userId) ?? null : null },
    };
  });
  void aniosAntiguedad;
  return { funcionarios, usuariosLibres: users.filter(u => !enlazados.has(u.id)) };
}
