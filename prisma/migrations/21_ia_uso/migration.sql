-- Uso de IA: registro de llamadas (solo metadatos) y configuración de límites
-- CreateTable
CREATE TABLE "UsoIA" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "funcion" TEXT NOT NULL,
    "proveedor" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT NOT NULL DEFAULT '',
    "tokensEntrada" INTEGER NOT NULL DEFAULT 0,
    "tokensSalida" INTEGER NOT NULL DEFAULT 0,
    "ms" INTEGER NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'OK',
    "error" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "UsoIA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IaConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "data" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IaConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UsoIA_createdAt_idx" ON "UsoIA"("createdAt");

-- CreateIndex
CREATE INDEX "UsoIA_funcion_createdAt_idx" ON "UsoIA"("funcion", "createdAt");

-- CreateIndex
CREATE INDEX "UsoIA_userName_createdAt_idx" ON "UsoIA"("userName", "createdAt");

-- CreateIndex
CREATE INDEX "UsoIA_estado_createdAt_idx" ON "UsoIA"("estado", "createdAt");

