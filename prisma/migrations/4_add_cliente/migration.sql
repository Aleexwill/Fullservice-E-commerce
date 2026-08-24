CREATE TABLE IF NOT EXISTS "Cliente" (
  "id"            TEXT NOT NULL,
  "name"          TEXT NOT NULL,
  "company"       TEXT NOT NULL DEFAULT '',
  "email"         TEXT NOT NULL DEFAULT '',
  "phone"         TEXT NOT NULL DEFAULT '',
  "address"       TEXT NOT NULL DEFAULT '',
  "ruc"           TEXT NOT NULL DEFAULT '',
  "category"      TEXT NOT NULL DEFAULT 'servicios',
  "notes"         TEXT NOT NULL DEFAULT '',
  "tags"          TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "totalSpent"    DECIMAL(14,2) NOT NULL DEFAULT 0,
  "jobsCount"     INTEGER NOT NULL DEFAULT 0,
  "lastServiceAt" TEXT NOT NULL DEFAULT '',
  "leadId"        TEXT DEFAULT '',
  "isActive"      BOOLEAN NOT NULL DEFAULT true,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Cliente_name_idx" ON "Cliente"("name");
CREATE INDEX IF NOT EXISTS "Cliente_email_idx" ON "Cliente"("email");
CREATE INDEX IF NOT EXISTS "Cliente_isActive_idx" ON "Cliente"("isActive");
