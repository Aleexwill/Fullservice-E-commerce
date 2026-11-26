// Constantes y etiquetas de tickets, sin dependencias de servidor (se usan también en el navegador).
export const TIPOS = ['ERROR', 'CORRECCION', 'MEJORA'] as const;
export const PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'] as const;
export const ESTADOS = ['NUEVO', 'EN_ANALISIS', 'ESPERANDO_INFO', 'EN_CURSO', 'EN_PRUEBA', 'RESUELTO', 'CERRADO', 'RECHAZADO'] as const;
export const ESTADOS_ABIERTOS = ['NUEVO', 'EN_ANALISIS', 'ESPERANDO_INFO', 'EN_CURSO', 'EN_PRUEBA'] as const;
export type Tipo = (typeof TIPOS)[number];
export type Prioridad = (typeof PRIORIDADES)[number];
export type Estado = (typeof ESTADOS)[number];

export const TIPO_LABEL: Record<string, string> = { ERROR: 'Error', CORRECCION: 'Corrección', MEJORA: 'Mejora' };
export const PRIORIDAD_LABEL: Record<string, string> = { BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta', CRITICA: 'Crítica' };
export const ESTADO_LABEL: Record<string, string> = {
  NUEVO: 'Nuevo', EN_ANALISIS: 'En análisis', ESPERANDO_INFO: 'Esperando información', EN_CURSO: 'En curso',
  EN_PRUEBA: 'En prueba', RESUELTO: 'Resuelto', CERRADO: 'Cerrado', RECHAZADO: 'Rechazado',
};
export const MODULOS = ['Presupuestos', 'Pedidos', 'Productos', 'Clientes y leads', 'Sitio web', 'RRHH', 'Marcación', 'Usuarios y permisos', 'Reportes', 'Base de datos / TI', 'Otro'] as const;

export const MAX_ADJUNTOS = 3;
export const esAbierto = (estado: string) => (ESTADOS_ABIERTOS as readonly string[]).includes(estado);
