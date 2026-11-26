-- Marcación: almuerzo, parámetros de asistencia, feriados y ausencias

ALTER TABLE "Jornada" ADD COLUMN IF NOT EXISTS "enAlmuerzo" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "MarcacionConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "data" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MarcacionConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "HorarioUsuario" (
    "id" TEXT NOT NULL,
    "userKey" TEXT NOT NULL,
    "marca" BOOLEAN,
    "dias" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HorarioUsuario_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "HorarioUsuario_userKey_key" ON "HorarioUsuario"("userKey");

CREATE TABLE IF NOT EXISTS "Feriado" (
    "id" TEXT NOT NULL,
    "fecha" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Feriado_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Feriado_fecha_key" ON "Feriado"("fecha");

CREATE TABLE IF NOT EXISTS "Ausencia" (
    "id" TEXT NOT NULL,
    "userKey" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "desde" TEXT NOT NULL,
    "hasta" TEXT NOT NULL,
    "motivo" TEXT NOT NULL DEFAULT '',
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "creadaPor" TEXT NOT NULL DEFAULT '',
    "revisorName" TEXT NOT NULL DEFAULT '',
    "revisorMotivo" TEXT NOT NULL DEFAULT '',
    "revisadoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Ausencia_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Ausencia_userKey_desde_idx" ON "Ausencia"("userKey", "desde");
CREATE INDEX IF NOT EXISTS "Ausencia_estado_desde_idx" ON "Ausencia"("estado", "desde");

-- Feriados nacionales de Paraguay 2026-2027 (editables desde /marcacion/parametros)
INSERT INTO "Feriado" ("id","fecha","nombre") VALUES
 ('fer-2026-01-01','2026-01-01','Año Nuevo'),
 ('fer-2026-03-01','2026-03-01','Día de los Héroes'),
 ('fer-2026-04-02','2026-04-02','Jueves Santo'),
 ('fer-2026-04-03','2026-04-03','Viernes Santo'),
 ('fer-2026-05-01','2026-05-01','Día del Trabajador'),
 ('fer-2026-05-14','2026-05-14','Independencia Nacional'),
 ('fer-2026-05-15','2026-05-15','Independencia Nacional'),
 ('fer-2026-06-12','2026-06-12','Paz del Chaco'),
 ('fer-2026-08-15','2026-08-15','Fundación de Asunción'),
 ('fer-2026-09-29','2026-09-29','Victoria de Boquerón'),
 ('fer-2026-12-08','2026-12-08','Virgen de Caacupé'),
 ('fer-2026-12-25','2026-12-25','Navidad'),
 ('fer-2027-01-01','2027-01-01','Año Nuevo'),
 ('fer-2027-03-01','2027-03-01','Día de los Héroes'),
 ('fer-2027-03-25','2027-03-25','Jueves Santo'),
 ('fer-2027-03-26','2027-03-26','Viernes Santo'),
 ('fer-2027-05-01','2027-05-01','Día del Trabajador'),
 ('fer-2027-05-14','2027-05-14','Independencia Nacional'),
 ('fer-2027-05-15','2027-05-15','Independencia Nacional'),
 ('fer-2027-06-12','2027-06-12','Paz del Chaco'),
 ('fer-2027-08-15','2027-08-15','Fundación de Asunción'),
 ('fer-2027-09-29','2027-09-29','Victoria de Boquerón'),
 ('fer-2027-12-08','2027-12-08','Virgen de Caacupé'),
 ('fer-2027-12-25','2027-12-25','Navidad')
ON CONFLICT ("fecha") DO NOTHING;
