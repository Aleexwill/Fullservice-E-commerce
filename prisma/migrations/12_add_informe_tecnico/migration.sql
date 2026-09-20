-- CreateTable: InformeTecnico (singleton — almacena todos los informes técnicos)
CREATE TABLE IF NOT EXISTS "InformeTecnico" (
    "id"        TEXT NOT NULL DEFAULT 'v1',
    "data"      JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InformeTecnico_pkey" PRIMARY KEY ("id")
);
