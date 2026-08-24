ALTER TABLE "Presupuesto" ADD COLUMN IF NOT EXISTS "calculationData" JSONB NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS "Material" (
  "id"          TEXT NOT NULL,
  "code"        TEXT NOT NULL DEFAULT '',
  "description" TEXT NOT NULL,
  "unit"        TEXT NOT NULL DEFAULT 'un',
  "unitPrice"   DECIMAL(14,2) NOT NULL,
  "provider"    TEXT NOT NULL DEFAULT '',
  "category"    TEXT NOT NULL DEFAULT 'general',
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "notes"       TEXT NOT NULL DEFAULT '',
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Material_description_idx" ON "Material"("description");
CREATE INDEX IF NOT EXISTS "Material_category_idx" ON "Material"("category");
