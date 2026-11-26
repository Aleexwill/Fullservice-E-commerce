-- Marcación en terreno: sitios, jornadas, marcas y verificación de EPP

CREATE TABLE IF NOT EXISTS "Sitio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'OBRA',
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "radioM" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sitio_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Sitio_tipo_isActive_idx" ON "Sitio"("tipo", "isActive");

CREATE TABLE IF NOT EXISTS "Jornada" (
    "id" TEXT NOT NULL,
    "userKey" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "fecha" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'EN_OFICINA',
    "sitioId" TEXT,
    "sitioNombre" TEXT NOT NULL DEFAULT '',
    "otRef" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Jornada_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Jornada_userKey_fecha_key" ON "Jornada"("userKey", "fecha");
CREATE INDEX IF NOT EXISTS "Jornada_fecha_idx" ON "Jornada"("fecha");
CREATE INDEX IF NOT EXISTS "Jornada_estado_idx" ON "Jornada"("estado");

CREATE TABLE IF NOT EXISTS "Marca" (
    "id" TEXT NOT NULL,
    "jornadaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "metodo" TEXT NOT NULL DEFAULT 'GPS',
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "precisionM" DOUBLE PRECISION,
    "distanciaM" INTEGER,
    "fueraDeRango" BOOLEAN NOT NULL DEFAULT false,
    "sitioNombre" TEXT NOT NULL DEFAULT '',
    "fotoUrl" TEXT,
    "rostroScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Marca_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Marca_jornadaId_createdAt_idx" ON "Marca"("jornadaId", "createdAt");
ALTER TABLE "Marca" ADD CONSTRAINT "Marca_jornadaId_fkey" FOREIGN KEY ("jornadaId") REFERENCES "Jornada"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "VerificacionEpp" (
    "id" TEXT NOT NULL,
    "jornadaId" TEXT NOT NULL,
    "fotoUrl" TEXT NOT NULL,
    "declarado" JSONB NOT NULL DEFAULT '{}',
    "revisado" JSONB NOT NULL DEFAULT '{}',
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "motivo" TEXT NOT NULL DEFAULT '',
    "revisorId" TEXT,
    "revisorName" TEXT NOT NULL DEFAULT '',
    "revisadoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VerificacionEpp_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "VerificacionEpp_estado_createdAt_idx" ON "VerificacionEpp"("estado", "createdAt");
CREATE INDEX IF NOT EXISTS "VerificacionEpp_jornadaId_idx" ON "VerificacionEpp"("jornadaId");
ALTER TABLE "VerificacionEpp" ADD CONSTRAINT "VerificacionEpp_jornadaId_fkey" FOREIGN KEY ("jornadaId") REFERENCES "Jornada"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Oficina por defecto (Lambaré). Ajustar coordenadas y radio desde /marcacion/sitios.
INSERT INTO "Sitio" ("id","nombre","tipo","lat","lng","radioM","updatedAt")
SELECT 'sitio-oficina-lambare','Oficina Lambaré','OFICINA',-25.3467,-57.6068,150,NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Sitio" WHERE "tipo" = 'OFICINA');
