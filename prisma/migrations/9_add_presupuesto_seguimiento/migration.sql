-- AlterTable
ALTER TABLE "Presupuesto" ADD COLUMN "createdBy" TEXT NOT NULL DEFAULT '',
ADD COLUMN "seguimientoData" JSONB NOT NULL DEFAULT '{}';
