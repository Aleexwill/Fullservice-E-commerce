-- Funcionarios: fecha de ingreso (antigüedad) con enlace opcional al usuario del sistema (User.id)
CREATE TABLE IF NOT EXISTS "Funcionario" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "nombre" TEXT NOT NULL,
    "documento" TEXT,
    "cargo" TEXT NOT NULL DEFAULT '',
    "telefono" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "fechaIngreso" TEXT NOT NULL,
    "fechaEgreso" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Funcionario_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Funcionario_userId_key" ON "Funcionario"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Funcionario_documento_key" ON "Funcionario"("documento");
CREATE INDEX IF NOT EXISTS "Funcionario_isActive_idx" ON "Funcionario"("isActive");
