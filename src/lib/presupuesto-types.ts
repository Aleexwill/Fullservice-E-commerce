// Legacy calculation format — used only by presupuesto-pdf.ts for printing old data.
// New costos are stored in costosData (see public/costos.html).

export type RowType = 'titulo' | 'material' | 'mano_de_obra' | 'subcontrato' | 'varios';

export interface FilaCalculo {
  id: string;
  tipo: RowType;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precioUnitario: number;
  precioVenta: number;
  alcance?: string;
  gastosGeneralesPct?: number;
  margenPct?: number;
  aprobado?: boolean;
}

export interface CalculationData {
  filas: FilaCalculo[];
  iva: number;
  descuento: number;
  validez: string;
  ubicacion: string;
  observaciones: string;
  items?: unknown[];
}
