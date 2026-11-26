-- Huella facial de referencia (solo números, sin imágenes) para verificar ingreso y salida
CREATE TABLE IF NOT EXISTS "RostroPlantilla" (
    "id" TEXT NOT NULL,
    "userKey" TEXT NOT NULL,
    "vectores" JSONB NOT NULL,
    "enroladoPor" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RostroPlantilla_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "RostroPlantilla_userKey_key" ON "RostroPlantilla"("userKey");
