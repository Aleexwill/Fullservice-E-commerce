CREATE TABLE IF NOT EXISTS "PromoBanner" (
  "id"          TEXT NOT NULL,
  "title"       TEXT NOT NULL DEFAULT '',
  "subtitle"    TEXT NOT NULL DEFAULT '',
  "ctaLabel"    TEXT NOT NULL DEFAULT '',
  "ctaUrl"      TEXT NOT NULL DEFAULT '',
  "imageUrl"    TEXT NOT NULL DEFAULT '',
  "bgColor"     TEXT NOT NULL DEFAULT '#0a1628',
  "accentColor" TEXT NOT NULL DEFAULT '#2D8FCC',
  "badge"       TEXT NOT NULL DEFAULT '',
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "order"       INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PromoBanner_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PromoBanner_isActive_order_idx" ON "PromoBanner"("isActive", "order");

-- Seed with 2 example banners
INSERT INTO "PromoBanner" ("id","title","subtitle","ctaLabel","ctaUrl","bgColor","accentColor","badge","order","isActive","updatedAt") VALUES
  (gen_random_uuid()::text,'Hasta 30% OFF en herramientas','Ofertas válidas hasta fin de mes. Stock limitado.','Ver ofertas','/tienda','#0a1628','#E8862B','OFERTA',0,true,CURRENT_TIMESTAMP),
  (gen_random_uuid()::text,'Servicio completo garantizado','Presupuesto sin cargo. Respuesta en 24 horas.','Pedir presupuesto','/contacto?tipo=presupuesto','#0a1a0f','#48BB78','NUEVO',1,true,CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
