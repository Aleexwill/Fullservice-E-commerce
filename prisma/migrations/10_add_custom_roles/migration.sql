CREATE TABLE IF NOT EXISTS "CustomRole" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "name"        TEXT NOT NULL UNIQUE,
  "label"       TEXT NOT NULL,
  "permissions" JSONB NOT NULL DEFAULT '{}',
  "isSystem"    BOOLEAN NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed the 3 built-in roles so they appear in the UI
INSERT INTO "CustomRole" ("id","name","label","permissions","isSystem") VALUES
  ('role_admin',   'admin',    'Administrador', '{"canManageUsers":true,"canManageConfig":true,"canManageContent":true,"canManageProducts":true,"canManageOrders":true,"canManagePresupuestos":true,"canManageLeads":true,"canManageClients":true,"canManageInventory":true,"canViewReports":true,"canViewAnalytics":true}', true),
  ('role_vendedor','vendedor', 'Vendedor',      '{"canManageUsers":false,"canManageConfig":false,"canManageContent":false,"canManageProducts":false,"canManageOrders":true,"canManagePresupuestos":true,"canManageLeads":true,"canManageClients":true,"canManageInventory":false,"canViewReports":true,"canViewAnalytics":false}', true),
  ('role_tecnico', 'tecnico',  'Técnico',       '{"canManageUsers":false,"canManageConfig":false,"canManageContent":false,"canManageProducts":false,"canManageOrders":false,"canManagePresupuestos":true,"canManageLeads":false,"canManageClients":false,"canManageInventory":true,"canViewReports":false,"canViewAnalytics":false}', true)
ON CONFLICT ("name") DO NOTHING;
