-- Receptor designado de un traslado (cuando el encargado no puede recibirlo)
-- AlterTable
ALTER TABLE "Traslado" ADD COLUMN     "designadoPor" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "receptor" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "receptorId" TEXT;

