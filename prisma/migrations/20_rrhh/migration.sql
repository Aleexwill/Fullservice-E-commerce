-- RRHH: legajo del funcionario, historial de cargos y sueldos, documentos, EPP, capacitaciones, parámetros y planilla de sueldos
-- AlterTable
ALTER TABLE "Funcionario" ADD COLUMN     "area" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "banco" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "ciudad" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "cuentaBancaria" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "direccion" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "emergenciaNombre" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "emergenciaParentesco" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "emergenciaTelefono" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "estadoCivil" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "fechaNacimiento" TEXT,
ADD COLUMN     "hijosMenores" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ipsNumero" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "tipoContrato" TEXT NOT NULL DEFAULT 'INDEFINIDO';

-- CreateTable
CREATE TABLE "CargoHistorial" (
    "id" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "area" TEXT NOT NULL DEFAULT '',
    "desde" TEXT NOT NULL,
    "hasta" TEXT,
    "notas" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CargoHistorial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalarioFuncionario" (
    "id" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "vigenteDesde" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'MENSUAL',
    "monto" INTEGER NOT NULL,
    "notas" TEXT NOT NULL DEFAULT '',
    "creadoPor" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalarioFuncionario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentoFuncionario" (
    "id" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "vence" TEXT,
    "notas" TEXT NOT NULL DEFAULT '',
    "subidoPor" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentoFuncionario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntregaEpp" (
    "id" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "talle" TEXT NOT NULL DEFAULT '',
    "fechaEntrega" TEXT NOT NULL,
    "vence" TEXT,
    "observacion" TEXT NOT NULL DEFAULT '',
    "entregadoPor" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntregaEpp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Capacitacion" (
    "id" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fecha" TEXT NOT NULL,
    "horas" INTEGER NOT NULL DEFAULT 0,
    "entidad" TEXT NOT NULL DEFAULT '',
    "vence" TEXT,
    "certificadoUrl" TEXT,
    "notas" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Capacitacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RrhhConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "data" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RrhhConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Planilla" (
    "id" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'MENSUAL',
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "reglas" JSONB NOT NULL DEFAULT '{}',
    "cerradaPor" TEXT NOT NULL DEFAULT '',
    "cerradaAt" TIMESTAMP(3),
    "creadaPor" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Planilla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recibo" (
    "id" TEXT NOT NULL,
    "planillaId" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "documento" TEXT NOT NULL DEFAULT '',
    "cargo" TEXT NOT NULL DEFAULT '',
    "detalle" JSONB NOT NULL DEFAULT '[]',
    "asistencia" JSONB NOT NULL DEFAULT '{}',
    "totalHaberes" INTEGER NOT NULL DEFAULT 0,
    "totalDescuentos" INTEGER NOT NULL DEFAULT 0,
    "neto" INTEGER NOT NULL DEFAULT 0,
    "aporteIpsPatronal" INTEGER NOT NULL DEFAULT 0,
    "advertencias" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recibo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConceptoPlanilla" (
    "id" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "planilla" TEXT NOT NULL DEFAULT 'MENSUAL',
    "tipo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "monto" INTEGER NOT NULL,
    "imponible" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT NOT NULL DEFAULT '',
    "creadoPor" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConceptoPlanilla_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CargoHistorial_funcionarioId_desde_idx" ON "CargoHistorial"("funcionarioId", "desde");

-- CreateIndex
CREATE INDEX "SalarioFuncionario_funcionarioId_vigenteDesde_idx" ON "SalarioFuncionario"("funcionarioId", "vigenteDesde");

-- CreateIndex
CREATE INDEX "DocumentoFuncionario_funcionarioId_idx" ON "DocumentoFuncionario"("funcionarioId");

-- CreateIndex
CREATE INDEX "DocumentoFuncionario_vence_idx" ON "DocumentoFuncionario"("vence");

-- CreateIndex
CREATE INDEX "EntregaEpp_funcionarioId_fechaEntrega_idx" ON "EntregaEpp"("funcionarioId", "fechaEntrega");

-- CreateIndex
CREATE INDEX "EntregaEpp_vence_idx" ON "EntregaEpp"("vence");

-- CreateIndex
CREATE INDEX "Capacitacion_funcionarioId_fecha_idx" ON "Capacitacion"("funcionarioId", "fecha");

-- CreateIndex
CREATE INDEX "Capacitacion_vence_idx" ON "Capacitacion"("vence");

-- CreateIndex
CREATE UNIQUE INDEX "Planilla_periodo_tipo_key" ON "Planilla"("periodo", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "Recibo_planillaId_funcionarioId_key" ON "Recibo"("planillaId", "funcionarioId");

-- CreateIndex
CREATE INDEX "ConceptoPlanilla_periodo_funcionarioId_idx" ON "ConceptoPlanilla"("periodo", "funcionarioId");

-- AddForeignKey
ALTER TABLE "CargoHistorial" ADD CONSTRAINT "CargoHistorial_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalarioFuncionario" ADD CONSTRAINT "SalarioFuncionario_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoFuncionario" ADD CONSTRAINT "DocumentoFuncionario_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaEpp" ADD CONSTRAINT "EntregaEpp_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Capacitacion" ADD CONSTRAINT "Capacitacion_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recibo" ADD CONSTRAINT "Recibo_planillaId_fkey" FOREIGN KEY ("planillaId") REFERENCES "Planilla"("id") ON DELETE CASCADE ON UPDATE CASCADE;

