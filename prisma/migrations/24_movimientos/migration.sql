-- Historial de movimientos de inventario y traslados entre depósitos
-- CreateTable
CREATE TABLE "MovimientoInventario" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemNombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL DEFAULT '',
    "unidad" TEXT NOT NULL DEFAULT 'un',
    "depositoId" TEXT NOT NULL,
    "depositoNombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "delta" DECIMAL(14,3) NOT NULL,
    "saldo" DECIMAL(14,3) NOT NULL,
    "motivo" TEXT NOT NULL DEFAULT '',
    "referencia" TEXT NOT NULL DEFAULT '',
    "destinatario" TEXT NOT NULL DEFAULT '',
    "foto" TEXT NOT NULL DEFAULT '',
    "trasladoId" TEXT,
    "usuario" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoInventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Traslado" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemNombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL DEFAULT '',
    "unidad" TEXT NOT NULL DEFAULT 'un',
    "cantidad" DECIMAL(14,3) NOT NULL,
    "origenId" TEXT NOT NULL,
    "destinoId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'EN_TRANSITO',
    "motivo" TEXT NOT NULL DEFAULT '',
    "nota" TEXT NOT NULL DEFAULT '',
    "creadoPor" TEXT NOT NULL,
    "resueltoPor" TEXT NOT NULL DEFAULT '',
    "resueltoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Traslado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MovimientoInventario_itemId_createdAt_idx" ON "MovimientoInventario"("itemId", "createdAt");

-- CreateIndex
CREATE INDEX "MovimientoInventario_depositoId_createdAt_idx" ON "MovimientoInventario"("depositoId", "createdAt");

-- CreateIndex
CREATE INDEX "MovimientoInventario_createdAt_idx" ON "MovimientoInventario"("createdAt");

-- CreateIndex
CREATE INDEX "MovimientoInventario_trasladoId_idx" ON "MovimientoInventario"("trasladoId");

-- CreateIndex
CREATE UNIQUE INDEX "Traslado_numero_key" ON "Traslado"("numero");

-- CreateIndex
CREATE INDEX "Traslado_estado_createdAt_idx" ON "Traslado"("estado", "createdAt");

-- CreateIndex
CREATE INDEX "Traslado_origenId_idx" ON "Traslado"("origenId");

-- CreateIndex
CREATE INDEX "Traslado_destinoId_idx" ON "Traslado"("destinoId");

-- AddForeignKey
ALTER TABLE "Traslado" ADD CONSTRAINT "Traslado_origenId_fkey" FOREIGN KEY ("origenId") REFERENCES "Deposito"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Traslado" ADD CONSTRAINT "Traslado_destinoId_fkey" FOREIGN KEY ("destinoId") REFERENCES "Deposito"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

