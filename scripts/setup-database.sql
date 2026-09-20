-- =============================================================
-- Full Service & Clean — Script completo de base de datos
-- Ejecutar una sola vez en una base de datos vacía (PostgreSQL 14+)
-- Incluye: creación de tablas, índices y datos iniciales (seeds)
-- =============================================================

-- Habilitar extensión para gen_random_uuid() si no está activa
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================
-- TABLAS
-- =============================================================

-- ── Product ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Product" (
    "id"                   TEXT NOT NULL,
    "sku"                  TEXT NOT NULL,
    "name"                 TEXT NOT NULL,
    "slug"                 TEXT NOT NULL,
    "description"          TEXT NOT NULL DEFAULT '',
    "shortDescription"     TEXT NOT NULL DEFAULT '',
    "category"             TEXT NOT NULL,
    "brand"                TEXT NOT NULL,
    "price"                DECIMAL(10,2) NOT NULL,
    "compareAtPrice"       DECIMAL(10,2),
    "stock"                INTEGER NOT NULL DEFAULT 0,
    "images"               TEXT[],
    "specifications"       JSONB NOT NULL DEFAULT '{}',
    "tags"                 TEXT[],
    "isFeatured"           BOOLEAN NOT NULL DEFAULT false,
    "isActive"             BOOLEAN NOT NULL DEFAULT true,
    "rating"               DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount"          INTEGER NOT NULL DEFAULT 0,
    "salesCount"           INTEGER NOT NULL DEFAULT 0,
    "promoDiscountPercent" INTEGER,
    "promoStartsAt"        TIMESTAMP(3),
    "promoEndsAt"          TIMESTAMP(3),
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Product_sku_key"  ON "Product"("sku");
CREATE UNIQUE INDEX IF NOT EXISTS "Product_slug_key" ON "Product"("slug");
CREATE INDEX       IF NOT EXISTS "Product_slug_idx"               ON "Product"("slug");
CREATE INDEX       IF NOT EXISTS "Product_category_idx"           ON "Product"("category");
CREATE INDEX       IF NOT EXISTS "Product_isActive_isFeatured_idx" ON "Product"("isActive","isFeatured");
CREATE INDEX       IF NOT EXISTS "Product_salesCount_idx"         ON "Product"("salesCount");

-- ── Lead ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Lead" (
    "id"              TEXT NOT NULL,
    "status"          TEXT NOT NULL DEFAULT 'new',
    "priority"        TEXT NOT NULL DEFAULT 'medium',
    "source"          TEXT NOT NULL DEFAULT 'website',
    "customer"        JSONB NOT NULL,
    "subject"         TEXT NOT NULL DEFAULT '',
    "message"         TEXT NOT NULL DEFAULT '',
    "serviceInterest" TEXT NOT NULL DEFAULT '',
    "estimatedValue"  DECIMAL(10,2),
    "tags"            TEXT[],
    "activities"      JSONB NOT NULL DEFAULT '[]',
    "tasks"           JSONB NOT NULL DEFAULT '[]',
    "notes"           JSONB NOT NULL DEFAULT '[]',
    "assignedTo"      TEXT NOT NULL DEFAULT '',
    "lastContactedAt" TEXT NOT NULL DEFAULT '',
    "nextFollowUp"    TEXT NOT NULL DEFAULT '',
    "lostReason"      TEXT NOT NULL DEFAULT '',
    "leadType"        TEXT NOT NULL DEFAULT 'general',
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Lead_status_idx"    ON "Lead"("status");
CREATE INDEX IF NOT EXISTS "Lead_createdAt_idx" ON "Lead"("createdAt");

-- ── Order ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Order" (
    "id"            TEXT NOT NULL,
    "orderNumber"   TEXT NOT NULL,
    "status"        TEXT NOT NULL DEFAULT 'pending',
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "customer"      JSONB NOT NULL,
    "items"         JSONB NOT NULL,
    "subtotal"      DECIMAL(10,2) NOT NULL,
    "shipping"      DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount"      DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total"         DECIMAL(10,2) NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT '',
    "adminNotes"    TEXT NOT NULL DEFAULT '',
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE INDEX       IF NOT EXISTS "Order_status_idx"       ON "Order"("status");
CREATE INDEX       IF NOT EXISTS "Order_createdAt_idx"    ON "Order"("createdAt");

-- ── Presupuesto ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Presupuesto" (
    "id"                TEXT NOT NULL,
    "code"              TEXT NOT NULL,
    "status"            TEXT NOT NULL DEFAULT 'nuevo',
    "serviceType"       TEXT NOT NULL,
    "serviceTitle"      TEXT NOT NULL DEFAULT '',
    "customer"          JSONB NOT NULL,
    "description"       TEXT NOT NULL DEFAULT '',
    "details"           TEXT NOT NULL DEFAULT '',
    "estimatedValue"    DECIMAL(15,2),
    "finalValue"        DECIMAL(15,2),
    "estimatedDuration" TEXT NOT NULL DEFAULT '',
    "priority"          TEXT NOT NULL DEFAULT 'media',
    "source"            TEXT NOT NULL DEFAULT '',
    "notes"             JSONB NOT NULL DEFAULT '[]',
    "attachments"       TEXT[],
    "assignedTo"        TEXT NOT NULL DEFAULT '',
    "scheduledDate"     TEXT NOT NULL DEFAULT '',
    "calculationData"   JSONB NOT NULL DEFAULT '{}',
    "createdBy"         TEXT NOT NULL DEFAULT '',
    "seguimientoData"   JSONB NOT NULL DEFAULT '{}',
    "costosData"        JSONB NOT NULL DEFAULT '{}',
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Presupuesto_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Presupuesto_code_key"       ON "Presupuesto"("code");
CREATE INDEX       IF NOT EXISTS "Presupuesto_status_idx"      ON "Presupuesto"("status");
CREATE INDEX       IF NOT EXISTS "Presupuesto_createdAt_idx"   ON "Presupuesto"("createdAt");

-- ── Portfolio ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Portfolio" (
    "id"               TEXT NOT NULL,
    "title"            TEXT NOT NULL,
    "description"      TEXT NOT NULL DEFAULT '',
    "category"         TEXT NOT NULL,
    "location"         TEXT NOT NULL DEFAULT '',
    "duration"         TEXT NOT NULL DEFAULT '',
    "year"             TEXT NOT NULL DEFAULT '',
    "client"           TEXT NOT NULL DEFAULT '',
    "image"            TEXT NOT NULL DEFAULT '',
    "gallery"          TEXT[],
    "technicalDetails" JSONB NOT NULL DEFAULT '{}',
    "badge"            TEXT NOT NULL DEFAULT 'neutral',
    "size"             TEXT NOT NULL DEFAULT 'small',
    "isActive"         BOOLEAN NOT NULL DEFAULT true,
    "isFeatured"       BOOLEAN NOT NULL DEFAULT false,
    "order"            INTEGER NOT NULL DEFAULT 0,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Portfolio_isActive_idx"  ON "Portfolio"("isActive");
CREATE INDEX IF NOT EXISTS "Portfolio_category_idx"  ON "Portfolio"("category");

-- ── Service ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Service" (
    "id"          TEXT NOT NULL,
    "title"       TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category"    TEXT NOT NULL,
    "icon"        TEXT NOT NULL DEFAULT '',
    "features"    TEXT[],
    "image"       TEXT NOT NULL DEFAULT '',
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "isFeatured"  BOOLEAN NOT NULL DEFAULT false,
    "order"       INTEGER NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Service_isActive_idx"  ON "Service"("isActive");
CREATE INDEX IF NOT EXISTS "Service_category_idx"  ON "Service"("category");

-- ── SiteSettings / SiteContent (singletons) ──────────────────
CREATE TABLE IF NOT EXISTS "SiteSettings" (
    "id"        TEXT NOT NULL DEFAULT 'singleton',
    "data"      JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "SiteContent" (
    "id"        TEXT NOT NULL DEFAULT 'singleton',
    "data"      JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("id")
);

-- ── PageView ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "PageView" (
    "id"        TEXT NOT NULL,
    "path"      TEXT NOT NULL,
    "referrer"  TEXT NOT NULL DEFAULT '',
    "userAgent" TEXT NOT NULL DEFAULT '',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PageView_path_idx"      ON "PageView"("path");
CREATE INDEX IF NOT EXISTS "PageView_timestamp_idx" ON "PageView"("timestamp");

-- ── Material ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Material" (
    "id"          TEXT NOT NULL,
    "code"        TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL,
    "unit"        TEXT NOT NULL DEFAULT 'un',
    "unitPrice"   DECIMAL(14,2) NOT NULL,
    "provider"    TEXT NOT NULL DEFAULT '',
    "category"    TEXT NOT NULL DEFAULT 'general',
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "notes"       TEXT NOT NULL DEFAULT '',
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Material_description_idx" ON "Material"("description");
CREATE INDEX IF NOT EXISTS "Material_category_idx"    ON "Material"("category");

-- ── PromoBanner ──────────────────────────────────────────────
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
CREATE INDEX IF NOT EXISTS "PromoBanner_isActive_order_idx" ON "PromoBanner"("isActive","order");

-- ── CarouselSlide ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "CarouselSlide" (
    "id"             TEXT NOT NULL,
    "label"          TEXT NOT NULL,
    "tag"            TEXT NOT NULL DEFAULT '',
    "description"    TEXT NOT NULL DEFAULT '',
    "photoUrl"       TEXT NOT NULL DEFAULT '',
    "accent"         TEXT NOT NULL DEFAULT '#2D8FCC',
    "gradient"       TEXT NOT NULL DEFAULT 'from-[#0a1628] via-[#1a3a5c] to-[#0d2340]',
    "overlayOpacity" INTEGER NOT NULL DEFAULT 55,
    "order"          INTEGER NOT NULL DEFAULT 0,
    "isActive"       BOOLEAN NOT NULL DEFAULT true,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CarouselSlide_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CarouselSlide_isActive_order_idx" ON "CarouselSlide"("isActive","order");

-- ── ClienteLogo ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ClienteLogo" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "logoUrl"   TEXT NOT NULL DEFAULT '',
    "website"   TEXT NOT NULL DEFAULT '',
    "parentId"  TEXT,
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "order"     INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClienteLogo_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ClienteLogo_parentId_fkey"
        FOREIGN KEY ("parentId") REFERENCES "ClienteLogo"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ClienteLogo_isActive_order_idx" ON "ClienteLogo"("isActive","order");
CREATE INDEX IF NOT EXISTS "ClienteLogo_parentId_idx"       ON "ClienteLogo"("parentId");

-- ── Cliente ──────────────────────────────────────────────────
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
CREATE INDEX IF NOT EXISTS "Cliente_name_idx"     ON "Cliente"("name");
CREATE INDEX IF NOT EXISTS "Cliente_email_idx"    ON "Cliente"("email");
CREATE INDEX IF NOT EXISTS "Cliente_isActive_idx" ON "Cliente"("isActive");

-- ── User ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "User" (
    "id"           TEXT NOT NULL,
    "email"        TEXT NOT NULL,
    "name"         TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role"         TEXT NOT NULL DEFAULT 'vendedor',
    "isActive"     BOOLEAN NOT NULL DEFAULT true,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE INDEX       IF NOT EXISTS "User_email_idx"  ON "User"("email");
CREATE INDEX       IF NOT EXISTS "User_role_idx"   ON "User"("role");

-- ── CustomRole ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "CustomRole" (
    "id"          TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "label"       TEXT NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "isSystem"    BOOLEAN NOT NULL DEFAULT false,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomRole_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CustomRole_name_key" ON "CustomRole"("name");

-- ── Invitation ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Invitation" (
    "id"        TEXT NOT NULL,
    "email"     TEXT NOT NULL,
    "name"      TEXT NOT NULL DEFAULT '',
    "role"      TEXT NOT NULL DEFAULT 'vendedor',
    "token"     TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt"    TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Invitation_token_key" ON "Invitation"("token");
CREATE INDEX       IF NOT EXISTS "Invitation_token_idx"  ON "Invitation"("token");
CREATE INDEX       IF NOT EXISTS "Invitation_email_idx"  ON "Invitation"("email");


-- =============================================================
-- DATOS INICIALES (SEEDS)
-- Sólo se insertan si la tabla está vacía (ON CONFLICT DO NOTHING)
-- =============================================================

-- ── Roles del sistema ────────────────────────────────────────
INSERT INTO "CustomRole" ("id","name","label","permissions","isSystem","updatedAt") VALUES
  ('role_admin',
   'admin',
   'Administrador',
   '{"canManageUsers":true,"canManageConfig":true,"canManageContent":true,"canManageProducts":true,"canManageOrders":true,"canManagePresupuestos":true,"canManageLeads":true,"canManageClients":true,"canManageInventory":true,"canViewReports":true,"canViewAnalytics":true}',
   true, CURRENT_TIMESTAMP),
  ('role_vendedor',
   'vendedor',
   'Vendedor',
   '{"canManageUsers":false,"canManageConfig":false,"canManageContent":false,"canManageProducts":false,"canManageOrders":true,"canManagePresupuestos":true,"canManageLeads":true,"canManageClients":true,"canManageInventory":false,"canViewReports":true,"canViewAnalytics":false}',
   true, CURRENT_TIMESTAMP),
  ('role_tecnico',
   'tecnico',
   'Técnico',
   '{"canManageUsers":false,"canManageConfig":false,"canManageContent":false,"canManageProducts":false,"canManageOrders":false,"canManagePresupuestos":true,"canManageLeads":false,"canManageClients":false,"canManageInventory":true,"canViewReports":false,"canViewAnalytics":false}',
   true, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

-- ── Slides del carrusel inicial ──────────────────────────────
INSERT INTO "CarouselSlide" ("id","label","tag","description","accent","gradient","overlayOpacity","order","isActive","updatedAt") VALUES
  (gen_random_uuid()::text,
   'Soldadura & Estructuras','Metalurgica',
   'Fabricación de rejas, portones, estructuras metálicas y trabajos de soldadura en general.',
   '#2D8FCC','from-[#0a1628] via-[#1a3a5c] to-[#0d2340]',55,0,true,CURRENT_TIMESTAMP),
  (gen_random_uuid()::text,
   'Obra civil & Remodelación','Construcción',
   'Construcción, ampliación y remodelación de locales comerciales e industriales.',
   '#E8862B','from-[#1a1200] via-[#2d2000] to-[#1a1200]',55,1,true,CURRENT_TIMESTAMP),
  (gen_random_uuid()::text,
   'Mantenimiento general','Preventivo & Correctivo',
   'Mantenimiento integral de instalaciones, equipos y espacios industriales.',
   '#48BB78','from-[#0a1a0f] via-[#0f2d1a] to-[#0a1a0f]',55,2,true,CURRENT_TIMESTAMP),
  (gen_random_uuid()::text,
   'Limpieza industrial','Limpieza profesional',
   'Limpieza profunda de plantas, depósitos, oficinas y espacios comerciales.',
   '#9F7AEA','from-[#1a0a28] via-[#2d1a40] to-[#1a0a28]',55,3,true,CURRENT_TIMESTAMP),
  (gen_random_uuid()::text,
   'Eléctrica & Plomería','Instalaciones',
   'Instalaciones eléctricas, sanitarias y de gas para todo tipo de obras.',
   '#F6E05E','from-[#1a1200] via-[#2d2000] to-[#0a1628]',55,4,true,CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- ── Banners promocionales iniciales ─────────────────────────
INSERT INTO "PromoBanner" ("id","title","subtitle","ctaLabel","ctaUrl","bgColor","accentColor","badge","order","isActive","updatedAt") VALUES
  (gen_random_uuid()::text,
   'Hasta 30% OFF en herramientas',
   'Ofertas válidas hasta fin de mes. Stock limitado.',
   'Ver ofertas','/tienda','#0a1628','#E8862B','OFERTA',0,true,CURRENT_TIMESTAMP),
  (gen_random_uuid()::text,
   'Servicio completo garantizado',
   'Presupuesto sin cargo. Respuesta en 24 horas.',
   'Pedir presupuesto','/contacto?tipo=presupuesto','#0a1a0f','#48BB78','NUEVO',1,true,CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- =============================================================
-- FIN — base de datos lista
-- =============================================================
