import { prisma } from '@/lib/prisma';
import { getConfigIa } from './config';

/**
 * Depuración automática de los registros de uso de IA más viejos que `retencionDias`.
 * Corre como máximo una vez cada 24 horas: un reclamo atómico en la base de datos garantiza que, aunque varias
 * instancias lo intenten a la vez, solo una depure. No depende de un cron externo ni de la plataforma de despliegue.
 * Nunca lanza: si falla, deja el error en el log del servidor y la IA sigue funcionando.
 */
export async function depurarSiCorresponde(): Promise<{ ejecutada: boolean; borrados: number }> {
  try {
    const reclamado = await prisma.$executeRaw`
      INSERT INTO "IaConfig" (id, data, "updatedAt")
      VALUES ('default', jsonb_build_object('depuracion', jsonb_build_object('ultima', now()::text, 'borrados', 0)), now())
      ON CONFLICT (id) DO UPDATE SET
        data = jsonb_set(COALESCE("IaConfig".data, '{}'::jsonb), '{depuracion}',
               jsonb_build_object('ultima', now()::text, 'borrados', COALESCE(("IaConfig".data->'depuracion'->>'borrados')::int, 0))),
        "updatedAt" = now()
      WHERE ("IaConfig".data->'depuracion'->>'ultima') IS NULL
         OR (("IaConfig".data->'depuracion'->>'ultima')::timestamptz < now() - interval '24 hours')`;
    if (!reclamado) return { ejecutada: false, borrados: 0 };

    const cfg = await getConfigIa();
    const limite = new Date(Date.now() - cfg.retencionDias * 86_400_000);
    const r = await prisma.usoIA.deleteMany({ where: { createdAt: { lt: limite } } });
    await prisma.$executeRaw`UPDATE "IaConfig" SET data = jsonb_set(data, '{depuracion,borrados}', to_jsonb(${r.count}::int)) WHERE id = 'default'`;
    return { ejecutada: true, borrados: r.count };
  } catch (e) {
    console.error('[ia] no se pudo depurar los registros:', e instanceof Error ? e.message : e);
    return { ejecutada: false, borrados: 0 };
  }
}
