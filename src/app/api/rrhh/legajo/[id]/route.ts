export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { listarFuncionarios } from '@/lib/funcionarios-store';
import { getRrhhConfig } from '@/lib/rrhh/config';

/** Legajo completo: datos, historial de cargos y salarios, documentos, entregas de EPP y capacitaciones. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const a = await requireRole('canManageRRHH');
  if (a instanceof NextResponse) return a;
  try {
    const [{ funcionarios, usuariosLibres }, cargos, salarios, documentos, epp, capacitaciones, config] = await Promise.all([
      listarFuncionarios(),
      prisma.cargoHistorial.findMany({ where: { funcionarioId: params.id }, orderBy: { desde: 'desc' } }),
      prisma.salarioFuncionario.findMany({ where: { funcionarioId: params.id }, orderBy: { vigenteDesde: 'desc' } }),
      prisma.documentoFuncionario.findMany({ where: { funcionarioId: params.id }, orderBy: { createdAt: 'desc' } }),
      prisma.entregaEpp.findMany({ where: { funcionarioId: params.id }, orderBy: { fechaEntrega: 'desc' } }),
      prisma.capacitacion.findMany({ where: { funcionarioId: params.id }, orderBy: { fecha: 'desc' } }),
      getRrhhConfig(),
    ]);
    const funcionario = funcionarios.find(f => f.id === params.id);
    if (!funcionario) return NextResponse.json({ error: 'Funcionario no encontrado' }, { status: 404 });
    const libres = funcionario.userId ? usuariosLibres.concat(funcionario.usuario ? [{ id: funcionario.userId, ...funcionario.usuario }] : []) : usuariosLibres;
    return NextResponse.json({ funcionario, usuariosLibres: libres, cargos, salarios, documentos, epp, capacitaciones, config: { eppCatalogo: config.eppCatalogo, alertaDias: config.alertaDias } });
  } catch (e) {
    console.error('GET /api/rrhh/legajo:', e);
    return NextResponse.json({ error: 'Error al cargar el legajo' }, { status: 500 });
  }
}
