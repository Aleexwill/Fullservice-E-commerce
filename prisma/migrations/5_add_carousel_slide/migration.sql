CREATE TABLE IF NOT EXISTS "CarouselSlide" (
  "id"          TEXT NOT NULL DEFAULT '',
  "label"       TEXT NOT NULL,
  "tag"         TEXT NOT NULL DEFAULT '',
  "description" TEXT NOT NULL DEFAULT '',
  "photoUrl"    TEXT NOT NULL DEFAULT '',
  "accent"      TEXT NOT NULL DEFAULT '#2D8FCC',
  "gradient"    TEXT NOT NULL DEFAULT 'from-[#0a1628] via-[#1a3a5c] to-[#0d2340]',
  "order"       INTEGER NOT NULL DEFAULT 0,
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CarouselSlide_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CarouselSlide_isActive_order_idx" ON "CarouselSlide"("isActive", "order");

-- Seed with the 5 default slides
INSERT INTO "CarouselSlide" ("id","label","tag","description","accent","gradient","order","isActive","updatedAt") VALUES
  (gen_random_uuid()::text,'Soldadura & Estructuras','Metalurgica','Fabricación de rejas, portones, estructuras metálicas y trabajos de soldadura en general.','#2D8FCC','from-[#0a1628] via-[#1a3a5c] to-[#0d2340]',0,true,CURRENT_TIMESTAMP),
  (gen_random_uuid()::text,'Obra civil & Remodelación','Construcción','Construcción, ampliación y remodelación de locales comerciales e industriales.','#E8862B','from-[#1a1200] via-[#2d2000] to-[#1a1200]',1,true,CURRENT_TIMESTAMP),
  (gen_random_uuid()::text,'Mantenimiento general','Preventivo & Correctivo','Mantenimiento integral de instalaciones, equipos y espacios industriales.','#48BB78','from-[#0a1a0f] via-[#0f2d1a] to-[#0a1a0f]',2,true,CURRENT_TIMESTAMP),
  (gen_random_uuid()::text,'Limpieza industrial','Limpieza profesional','Limpieza profunda de plantas, depósitos, oficinas y espacios comerciales.','#9F7AEA','from-[#1a0a28] via-[#2d1a40] to-[#1a0a28]',3,true,CURRENT_TIMESTAMP),
  (gen_random_uuid()::text,'Eléctrica & Plomería','Instalaciones','Instalaciones eléctricas, sanitarias y de gas para todo tipo de obras.','#F6E05E','from-[#1a1200] via-[#2d2000] to-[#0a1628]',4,true,CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
