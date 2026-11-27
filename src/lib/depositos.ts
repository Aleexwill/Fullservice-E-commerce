// Depósitos e inventario: validación y conversión a DTO.
import { z } from 'zod';

export const MAX_FOTOS = 5;
const foto = z.string().max(3_000_000).refine(u => /^https:\/\//.test(u) || /^data:image\/(jpeg|png|webp);base64,/.test(u), 'Foto inválida');
const num = (max = 1_000_000_000) => z.number().finite().min(0).max(max);

export const DepositoSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre es muy corto').max(80),
  direccion: z.string().trim().max(200).optional(),
  responsableId: z.string().max(60).nullable().optional(), // usuario encargado (recibe los avisos)
  notas: z.string().trim().max(1000).optional(),
  activo: z.boolean().optional(),
});

export const ItemSchema = z.object({
  depositoId: z.string().min(1, 'Elegí el depósito').max(60),
  nombre: z.string().trim().min(2, 'El nombre es muy corto').max(140),
  codigo: z.string().trim().max(60).optional(),
  descripcion: z.string().trim().max(2000).optional(),
  categoria: z.string().trim().max(60).optional(),
  unidad: z.string().trim().min(1).max(20).optional(),
  cantidad: num().optional(),
  stockMinimo: num().optional(),
  ubicacion: z.string().trim().max(80).optional(),
  fotos: z.array(foto).max(MAX_FOTOS).optional(),
  notas: z.string().trim().max(1000).optional(),
  activo: z.boolean().optional(),
});
// La cantidad y el depósito ya no se editan directo: cambian solo con movimientos y traslados (queda historial).
export const ItemPatchSchema = ItemSchema.omit({ cantidad: true, depositoId: true }).partial().strict();

const cant = z.number().finite().positive('La cantidad debe ser mayor que 0').max(1_000_000_000).transform(n => Math.round(n * 1000) / 1000);
export const MovimientoSchema = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('ENTRADA'), itemId: z.string().min(1), cantidad: cant, motivo: z.string().trim().max(200).optional(), referencia: z.string().trim().max(80).optional(), foto: foto.optional() }),
  z.object({ tipo: z.literal('SALIDA'), itemId: z.string().min(1), cantidad: cant, motivo: z.string().trim().min(3, 'Indicá el motivo de la salida').max(200), referencia: z.string().trim().max(80).optional(), destinatario: z.string().trim().max(120).optional(), foto: foto.optional() }),
  // Ajuste: se informa el conteo real y el sistema calcula la diferencia.
  z.object({ tipo: z.literal('AJUSTE'), itemId: z.string().min(1), conteo: z.number().finite().min(0).max(1_000_000_000).transform(n => Math.round(n * 1000) / 1000), motivo: z.string().trim().min(3, 'Indicá el motivo del ajuste').max(200), foto: foto.optional() }),
]);
export const TrasladoSchema = z.object({ itemId: z.string().min(1), destinoId: z.string().min(1, 'Elegí el depósito de destino'), cantidad: cant, motivo: z.string().trim().max(200).optional() });
export const AccionTrasladoSchema = z.object({ accion: z.enum(['recibir', 'cancelar', 'designar']), nota: z.string().trim().max(300).optional(), receptorId: z.string().max(60).nullable().optional() });

interface ItemRow { id: string; depositoId: string; codigo: string; nombre: string; descripcion: string; categoria: string; unidad: string; cantidad: unknown; stockMinimo: unknown; ubicacion: string; fotos: unknown; notas: string; activo: boolean; updatedAt: Date; deposito?: { nombre: string } }

export function toItemDTO(i: ItemRow) {
  const cantidad = Number(i.cantidad), stockMinimo = Number(i.stockMinimo);
  return {
    id: i.id, depositoId: i.depositoId, deposito: i.deposito?.nombre ?? '', codigo: i.codigo, nombre: i.nombre, descripcion: i.descripcion, categoria: i.categoria,
    unidad: i.unidad, cantidad, stockMinimo, bajoStock: stockMinimo > 0 && cantidad <= stockMinimo, ubicacion: i.ubicacion,
    fotos: Array.isArray(i.fotos) ? (i.fotos as string[]) : [], notas: i.notas, activo: i.activo, updatedAt: i.updatedAt.toISOString(),
  };
}
