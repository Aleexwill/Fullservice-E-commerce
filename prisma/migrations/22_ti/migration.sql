-- TI: tickets de incidencias y mejoras, puntos diarios de tamaño de la base de datos y parámetros
-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "modulo" TEXT NOT NULL DEFAULT '',
    "pantalla" TEXT NOT NULL DEFAULT '',
    "pasos" TEXT NOT NULL DEFAULT '',
    "esperado" TEXT NOT NULL DEFAULT '',
    "prioridad" TEXT NOT NULL DEFAULT 'MEDIA',
    "estado" TEXT NOT NULL DEFAULT 'NUEVO',
    "solicitanteId" TEXT NOT NULL,
    "solicitante" TEXT NOT NULL,
    "asignadoId" TEXT,
    "asignado" TEXT NOT NULL DEFAULT '',
    "adjuntos" JSONB NOT NULL DEFAULT '[]',
    "navegador" TEXT NOT NULL DEFAULT '',
    "resolucion" TEXT NOT NULL DEFAULT '',
    "resueltoAt" TIMESTAMP(3),
    "cerradoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketComentario" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "interno" BOOLEAN NOT NULL DEFAULT false,
    "adjuntos" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketComentario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketEvento" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "detalle" TEXT NOT NULL DEFAULT '',
    "autorId" TEXT NOT NULL DEFAULT '',
    "autor" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketEvento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DbSnapshot" (
    "id" TEXT NOT NULL,
    "fecha" TEXT NOT NULL,
    "totalBytes" BIGINT NOT NULL,
    "tablas" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DbSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TiConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "data" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TiConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_numero_key" ON "Ticket"("numero");

-- CreateIndex
CREATE INDEX "Ticket_estado_prioridad_idx" ON "Ticket"("estado", "prioridad");

-- CreateIndex
CREATE INDEX "Ticket_solicitanteId_idx" ON "Ticket"("solicitanteId");

-- CreateIndex
CREATE INDEX "Ticket_createdAt_idx" ON "Ticket"("createdAt");

-- CreateIndex
CREATE INDEX "TicketComentario_ticketId_createdAt_idx" ON "TicketComentario"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "TicketEvento_ticketId_createdAt_idx" ON "TicketEvento"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "TicketEvento_createdAt_idx" ON "TicketEvento"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DbSnapshot_fecha_key" ON "DbSnapshot"("fecha");

-- AddForeignKey
ALTER TABLE "TicketComentario" ADD CONSTRAINT "TicketComentario_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketEvento" ADD CONSTRAINT "TicketEvento_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

