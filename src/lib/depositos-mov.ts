// Movimientos de stock y traslados. Todo ocurre dentro de una transacción con el artículo bloqueado (FOR UPDATE),
// así dos personas moviendo el mismo artículo a la vez no pueden dejar el stock negativo ni perder cambios.
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type Tx = Prisma.TransactionClient;
export class ErrorNegocio extends Error { constructor(msg: string, public status = 400) { super(msg); } }

interface FilaItem { id: string; depositoId: string; codigo: string; nombre: string; unidad: string; cantidad: number; activo: boolean }
const r3 = (n: number) => Math.round(n * 1000) / 1000;

async function bloquearItem(tx: Tx, id: string): Promise<FilaItem> {
  const f = await tx.$queryRaw<FilaItem[]>`SELECT id, "depositoId", codigo, nombre, unidad, cantidad::float8 AS cantidad, activo FROM "ItemInventario" WHERE id = ${id} FOR UPDATE`;
  if (!f[0]) throw new ErrorNegocio('Artículo no encontrado', 404);
  return f[0];
}
async function nombreDeposito(tx: Tx, id: string): Promise<string> {
  return (await tx.deposito.findUnique({ where: { id }, select: { nombre: true } }))?.nombre ?? '';
}
async function setCantidad(tx: Tx, id: string, nueva: number) {
  await tx.$executeRaw`UPDATE "ItemInventario" SET cantidad = ${nueva}::numeric, "updatedAt" = now() WHERE id = ${id}`;
}
interface DatosMov { tipo: string; delta: number; motivo?: string; referencia?: string; destinatario?: string; foto?: string; trasladoId?: string; usuario: string }
async function registrar(tx: Tx, it: FilaItem, saldo: number, m: DatosMov) {
  await tx.movimientoInventario.create({ data: {
    itemId: it.id, itemNombre: it.nombre, codigo: it.codigo, unidad: it.unidad, depositoId: it.depositoId, depositoNombre: await nombreDeposito(tx, it.depositoId),
    tipo: m.tipo, delta: m.delta, saldo, motivo: m.motivo ?? '', referencia: m.referencia ?? '', destinatario: m.destinatario ?? '', foto: m.foto ?? '', trasladoId: m.trasladoId ?? null, usuario: m.usuario,
  } });
}

export type EntradaMov =
  | { tipo: 'ENTRADA'; itemId: string; cantidad: number; motivo?: string; referencia?: string; foto?: string }
  | { tipo: 'SALIDA'; itemId: string; cantidad: number; motivo: string; referencia?: string; destinatario?: string; foto?: string }
  | { tipo: 'AJUSTE'; itemId: string; conteo: number; motivo: string; foto?: string };

export async function moverStock(m: EntradaMov, usuario: string): Promise<{ saldo: number }> {
  return prisma.$transaction(async tx => {
    const it = await bloquearItem(tx, m.itemId);
    if (!it.activo) throw new ErrorNegocio('El artículo está desactivado');
    const delta = m.tipo === 'ENTRADA' ? m.cantidad : m.tipo === 'SALIDA' ? -m.cantidad : r3(m.conteo - it.cantidad);
    if (delta === 0) throw new ErrorNegocio('El conteo es igual a la cantidad actual: no hay nada que ajustar');
    const saldo = r3(it.cantidad + delta);
    if (saldo < 0) throw new ErrorNegocio(`Stock insuficiente: hay ${it.cantidad} ${it.unidad} y se quieren sacar ${-delta}`, 409);
    await setCantidad(tx, it.id, saldo);
    await registrar(tx, it, saldo, { tipo: m.tipo, delta, motivo: m.motivo, referencia: 'referencia' in m ? m.referencia : undefined, destinatario: 'destinatario' in m ? m.destinatario : undefined, foto: m.foto, usuario });
    return { saldo };
  });
}

export async function crearTraslado(d: { itemId: string; destinoId: string; cantidad: number; motivo?: string }, usuario: string, usuarioId = ''): Promise<{ id: string; numero: number }> {
  return prisma.$transaction(async tx => {
    const it = await bloquearItem(tx, d.itemId);
    if (!it.activo) throw new ErrorNegocio('El artículo está desactivado');
    if (d.destinoId === it.depositoId) throw new ErrorNegocio('El destino debe ser otro depósito');
    const dest = await tx.deposito.findUnique({ where: { id: d.destinoId }, select: { activo: true } });
    if (!dest?.activo) throw new ErrorNegocio('El depósito de destino no existe o está desactivado');
    const saldo = r3(it.cantidad - d.cantidad);
    if (saldo < 0) throw new ErrorNegocio(`Stock insuficiente: hay ${it.cantidad} ${it.unidad} y se quieren trasladar ${d.cantidad}`, 409);
    const t = await tx.traslado.create({ data: { itemId: it.id, itemNombre: it.nombre, codigo: it.codigo, unidad: it.unidad, cantidad: d.cantidad, origenId: it.depositoId, destinoId: d.destinoId, motivo: d.motivo ?? '', creadoPor: usuario, creadoPorId: usuarioId }, select: { id: true, numero: true } });
    await setCantidad(tx, it.id, saldo);
    await registrar(tx, it, saldo, { tipo: 'TRASLADO_SALIDA', delta: -d.cantidad, motivo: d.motivo, trasladoId: t.id, referencia: `Traslado #${t.numero}`, usuario });
    return t;
  });
}

async function bloquearTraslado(tx: Tx, id: string) {
  const f = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "Traslado" WHERE id = ${id} FOR UPDATE`;
  if (!f[0]) throw new ErrorNegocio('Traslado no encontrado', 404);
  const t = await tx.traslado.findUniqueOrThrow({ where: { id } });
  if (t.estado !== 'EN_TRANSITO') throw new ErrorNegocio(`El traslado ya está ${t.estado === 'RECIBIDO' ? 'recibido' : 'cancelado'}`, 409);
  return t;
}

/** El destino confirma que llegó: el stock entra al depósito de destino (si el artículo no existe allí, se crea con sus datos y fotos). */
export async function recibirTraslado(id: string, nota: string | undefined, usuario: string) {
  return prisma.$transaction(async tx => {
    const t = await bloquearTraslado(tx, id);
    const orig = await tx.itemInventario.findUnique({ where: { id: t.itemId } });
    const cantidad = Number(t.cantidad);
    const cand = await tx.itemInventario.findMany({ where: { depositoId: t.destinoId, OR: [...(t.codigo ? [{ codigo: { equals: t.codigo, mode: 'insensitive' as const } }] : []), { nombre: { equals: t.itemNombre, mode: 'insensitive' as const } }] }, select: { id: true } });
    let destId = cand[0]?.id;
    if (!destId) {
      const n = await tx.itemInventario.create({ data: { depositoId: t.destinoId, codigo: t.codigo, nombre: t.itemNombre, unidad: t.unidad, cantidad: 0, descripcion: orig?.descripcion ?? '', categoria: orig?.categoria ?? '', stockMinimo: 0, fotos: orig?.fotos ?? [], notas: orig?.notas ?? '', creadoPor: usuario }, select: { id: true } });
      destId = n.id;
    }
    const it = await bloquearItem(tx, destId);
    const saldo = r3(it.cantidad + cantidad);
    await tx.$executeRaw`UPDATE "ItemInventario" SET cantidad = ${saldo}::numeric, activo = true, "updatedAt" = now() WHERE id = ${destId}`;
    await registrar(tx, it, saldo, { tipo: 'TRASLADO_ENTRADA', delta: cantidad, motivo: t.motivo, trasladoId: t.id, referencia: `Traslado #${t.numero}`, usuario });
    await tx.traslado.update({ where: { id }, data: { estado: 'RECIBIDO', nota: nota ?? '', resueltoPor: usuario, resueltoAt: new Date() } });
  });
}

/** Se anula el traslado (lo cancela el origen o lo rechaza el destino): el stock vuelve al depósito de origen. */
export async function cancelarTraslado(id: string, nota: string | undefined, usuario: string) {
  return prisma.$transaction(async tx => {
    const t = await bloquearTraslado(tx, id);
    const it = await bloquearItem(tx, t.itemId); // no se puede borrar un artículo con traslados en tránsito
    const saldo = r3(it.cantidad + Number(t.cantidad));
    await setCantidad(tx, it.id, saldo);
    await registrar(tx, it, saldo, { tipo: 'TRASLADO_ANULADO', delta: Number(t.cantidad), motivo: nota || 'Traslado cancelado', trasladoId: t.id, referencia: `Traslado #${t.numero}`, usuario });
    await tx.traslado.update({ where: { id }, data: { estado: 'CANCELADO', nota: nota ?? '', resueltoPor: usuario, resueltoAt: new Date() } });
  });
}

export function respuestaError(e: unknown): { error: string; status: number } {
  if (e instanceof ErrorNegocio) return { error: e.message, status: e.status };
  console.error('inventario:', e);
  return { error: 'Error al registrar el movimiento', status: 500 };
}

/** Resuelve el encargado de un depósito a partir del id de usuario (null/'' = sin encargado). */
export async function resolverEncargado(id: string | null | undefined): Promise<{ responsableId: string | null; responsable: string } | { error: string }> {
  if (!id) return { responsableId: null, responsable: '' };
  const u = await prisma.user.findFirst({ where: { id, isActive: true }, select: { id: true, name: true } });
  return u ? { responsableId: u.id, responsable: u.name } : { error: 'El usuario encargado no existe o está inactivo' };
}
