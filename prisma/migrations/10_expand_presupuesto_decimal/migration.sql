-- AlterTable: expand estimatedValue and finalValue to Decimal(15,2) to support large Guaraní amounts
ALTER TABLE "Presupuesto" ALTER COLUMN "estimatedValue" TYPE DECIMAL(15,2);
ALTER TABLE "Presupuesto" ALTER COLUMN "finalValue" TYPE DECIMAL(15,2);
