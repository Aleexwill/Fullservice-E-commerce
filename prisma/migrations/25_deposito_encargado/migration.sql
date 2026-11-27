-- Encargado (usuario) del depósito y autor del traslado, para los avisos
-- AlterTable
ALTER TABLE "Deposito" ADD COLUMN     "responsableId" TEXT;

-- AlterTable
ALTER TABLE "Traslado" ADD COLUMN     "creadoPorId" TEXT NOT NULL DEFAULT '';

