/**
 * Verificación de rostro en ingreso/salida.
 *
 * Hoy el sistema guarda la selfie como EVIDENCIA (modo 'evidencia'): confirma que se envió una foto,
 * no que la persona sea quien dice ser. Para verificación real, reemplazar el cuerpo de
 * `verificarRostro` por una llamada a un proveedor (AWS Rekognition, Azure Face, etc.) comparando
 * contra la foto de referencia del trabajador, y devolver { ok, score }.
 */
export interface ResultadoRostro { ok: boolean; score: number | null; modo: 'evidencia' | 'proveedor' }

export async function verificarRostro(_userKey: string, _fotoUrl: string): Promise<ResultadoRostro> {
  return { ok: true, score: null, modo: 'evidencia' };
}
