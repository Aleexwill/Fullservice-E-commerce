// Constantes y utilidades compartidas entre cliente y servidor de /marcacion.

export const TIPOS_MARCA = ['INGRESO', 'TRASLADO_IDA', 'LLEGADA_LUGAR', 'SALIDA_LUGAR', 'LLEGADA_OFICINA', 'SALIDA'] as const;
export type TipoMarca = (typeof TIPOS_MARCA)[number];

export const ESTADOS = ['EN_OFICINA', 'EN_TRASLADO_IDA', 'EN_LUGAR', 'TRABAJANDO', 'EN_TRASLADO_VUELTA', 'EN_OFICINA_FIN', 'CERRADA'] as const;
export type Estado = (typeof ESTADOS)[number];

export const ESTADO_LABEL: Record<Estado | 'FUERA', string> = {
  FUERA: 'Fuera de turno',
  EN_OFICINA: 'En oficina',
  EN_TRASLADO_IDA: 'En traslado',
  EN_LUGAR: 'Verificando equipo',
  TRABAJANDO: 'En el lugar',
  EN_TRASLADO_VUELTA: 'Regresando',
  EN_OFICINA_FIN: 'En oficina',
  CERRADA: 'Turno cerrado',
};

export const TIPO_LABEL: Record<TipoMarca, string> = {
  INGRESO: 'Ingreso de jornada',
  TRASLADO_IDA: 'Salida hacia el lugar',
  LLEGADA_LUGAR: 'Llegada al lugar',
  SALIDA_LUGAR: 'Salida del lugar',
  LLEGADA_OFICINA: 'Llegada a oficina',
  SALIDA: 'Salida de jornada',
};

/** Marcas que exigen rostro (selfie) además de GPS. El resto es solo GPS. */
export const TIPOS_CON_ROSTRO: TipoMarca[] = ['INGRESO', 'SALIDA'];

export const EPP_ITEMS = [
  { key: 'casco', label: 'Casco' },
  { key: 'chaleco', label: 'Chaleco reflectivo' },
  { key: 'botas', label: 'Botas de seguridad' },
  { key: 'guantes', label: 'Guantes' },
  { key: 'lentes', label: 'Lentes de protección' },
] as const;
export type EppKey = (typeof EPP_ITEMS)[number]['key'];
export type EppMap = Partial<Record<EppKey, boolean>>;

export const MOTIVOS_RECHAZO = ['Foto borrosa', 'Foto incompleta', 'Equipo dañado'];

/** Marca "en curso" (0-5) del flujo según el estado, para el indicador de progreso. */
export const MARCA_ACTUAL: Record<Estado | 'FUERA', number> = {
  FUERA: 0, EN_OFICINA: 1, EN_TRASLADO_IDA: 2, EN_LUGAR: 2, TRABAJANDO: 3, EN_TRASLADO_VUELTA: 4, EN_OFICINA_FIN: 5, CERRADA: 6,
};
export const MARCAS_FLUJO = [
  { label: 'Ingreso', metodo: 'Rostro + GPS' },
  { label: 'Traslado', metodo: 'GPS' },
  { label: 'Llegada al lugar', metodo: 'GPS + foto EPP' },
  { label: 'Salida del lugar', metodo: 'GPS' },
  { label: 'Llegada a oficina', metodo: 'GPS' },
  { label: 'Salida', metodo: 'Rostro + GPS' },
];

export function haversineM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

export function formatDist(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1).replace('.', ',')} km` : `${m} m`;
}

export interface SitioDTO { id: string; nombre: string; tipo: string; lat: number; lng: number; radioM: number }
export interface MarcaDTO { id: string; tipo: TipoMarca; metodo: string; distanciaM: number | null; fueraDeRango: boolean; sitioNombre: string; createdAt: string }
export interface EppDTO { id: string; fotoUrl: string; declarado: EppMap; estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA'; motivo: string; revisorName: string; createdAt: string }
export interface JornadaDTO {
  id: string; fecha: string; estado: Estado; sitioId: string | null; sitioNombre: string; otRef: string;
  marcas: MarcaDTO[]; epp: EppDTO | null;
}
export interface EstadoResponse {
  jornada: JornadaDTO | null;
  oficina: SitioDTO | null;
  destino: SitioDTO | null;
  sitios: SitioDTO[];
  user: { name: string; aprueba: boolean; administra: boolean };
}
