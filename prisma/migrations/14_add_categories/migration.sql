-- CreateTable: Category
CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Category_scope_slug_key" ON "Category"("scope", "slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Category_scope_isActive_order_idx" ON "Category"("scope", "isActive", "order");

-- Seed: default product categories
INSERT INTO "Category" ("id","name","slug","scope","order","updatedAt") VALUES
  ('cat-prod-01','Herramientas Manuales','herramientas-manuales','productos',1,NOW()),
  ('cat-prod-02','Herramientas Electricas','herramientas-electricas','productos',2,NOW()),
  ('cat-prod-03','Materiales de Construccion','materiales-de-construccion','productos',3,NOW()),
  ('cat-prod-04','Seguridad Industrial','seguridad-industrial','productos',4,NOW()),
  ('cat-prod-05','Plomeria','plomeria','productos',5,NOW()),
  ('cat-prod-06','Electricidad','electricidad','productos',6,NOW()),
  ('cat-prod-07','Pinturas y Acabados','pinturas-y-acabados','productos',7,NOW()),
  ('cat-prod-08','Soldadura','soldadura','productos',8,NOW()),
  ('cat-prod-09','Ferreteria General','ferreteria-general','productos',9,NOW()),
  ('cat-prod-10','EPP','epp','productos',10,NOW())
ON CONFLICT ("scope","slug") DO NOTHING;

-- Seed: default trabajos / servicios categories
INSERT INTO "Category" ("id","name","slug","scope","order","updatedAt") VALUES
  ('cat-trab-01','Civil','civil','trabajos',1,NOW()),
  ('cat-trab-02','Metalurgica','metalurgica','trabajos',2,NOW()),
  ('cat-trab-03','Mantenimiento','mantenimiento','trabajos',3,NOW()),
  ('cat-serv-01','Civil','civil','servicios',1,NOW()),
  ('cat-serv-02','Metalurgica','metalurgica','servicios',2,NOW()),
  ('cat-serv-03','Mantenimiento','mantenimiento','servicios',3,NOW())
ON CONFLICT ("scope","slug") DO NOTHING;

-- Seed: default inventario categories
INSERT INTO "Category" ("id","name","slug","scope","order","updatedAt") VALUES
  ('cat-inv-01','Metalúrgica','metalurgica','inventario',1,NOW()),
  ('cat-inv-02','Chapas','chapas','inventario',2,NOW()),
  ('cat-inv-03','Policarbonato','policarbonato','inventario',3,NOW()),
  ('cat-inv-04','Civil','civil','inventario',4,NOW()),
  ('cat-inv-05','Pinturas','pinturas','inventario',5,NOW()),
  ('cat-inv-06','Eléctrica','electrica','inventario',6,NOW()),
  ('cat-inv-07','Plomería','plomeria','inventario',7,NOW()),
  ('cat-inv-08','Carpintería','carpinteria','inventario',8,NOW()),
  ('cat-inv-09','Mano de obra','mano_obra','inventario',9,NOW()),
  ('cat-inv-10','Consumibles','consumibles','inventario',10,NOW()),
  ('cat-inv-11','General','general','inventario',11,NOW())
ON CONFLICT ("scope","slug") DO NOTHING;
