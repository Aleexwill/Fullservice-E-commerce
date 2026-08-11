-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "shortDescription" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "compareAtPrice" DECIMAL(10,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "images" TEXT[],
    "specifications" JSONB NOT NULL DEFAULT '{}',
    "tags" TEXT[],
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "source" TEXT NOT NULL DEFAULT 'website',
    "customer" JSONB NOT NULL,
    "subject" TEXT NOT NULL DEFAULT '',
    "message" TEXT NOT NULL DEFAULT '',
    "serviceInterest" TEXT NOT NULL DEFAULT '',
    "estimatedValue" DECIMAL(10,2),
    "tags" TEXT[],
    "activities" JSONB NOT NULL DEFAULT '[]',
    "tasks" JSONB NOT NULL DEFAULT '[]',
    "notes" JSONB NOT NULL DEFAULT '[]',
    "assignedTo" TEXT NOT NULL DEFAULT '',
    "lastContactedAt" TEXT NOT NULL DEFAULT '',
    "nextFollowUp" TEXT NOT NULL DEFAULT '',
    "lostReason" TEXT NOT NULL DEFAULT '',
    "leadType" TEXT NOT NULL DEFAULT 'general',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "customer" JSONB NOT NULL,
    "items" JSONB NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "shipping" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT '',
    "adminNotes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Presupuesto" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'nuevo',
    "serviceType" TEXT NOT NULL,
    "serviceTitle" TEXT NOT NULL DEFAULT '',
    "customer" JSONB NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "details" TEXT NOT NULL DEFAULT '',
    "estimatedValue" DECIMAL(10,2),
    "finalValue" DECIMAL(10,2),
    "estimatedDuration" TEXT NOT NULL DEFAULT '',
    "priority" TEXT NOT NULL DEFAULT 'media',
    "source" TEXT NOT NULL DEFAULT '',
    "notes" JSONB NOT NULL DEFAULT '[]',
    "attachments" TEXT[],
    "assignedTo" TEXT NOT NULL DEFAULT '',
    "scheduledDate" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Presupuesto_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
-- CreateIndex
CREATE INDEX "Product_slug_idx" ON "Product"("slug");
-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");
-- CreateIndex
CREATE INDEX "Product_isActive_isFeatured_idx" ON "Product"("isActive", "isFeatured");
-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");
-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");
-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");
-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
-- CreateIndex
CREATE UNIQUE INDEX "Presupuesto_code_key" ON "Presupuesto"("code");
-- CreateIndex
CREATE INDEX "Presupuesto_status_idx" ON "Presupuesto"("status");
-- CreateIndex
CREATE INDEX "Presupuesto_createdAt_idx" ON "Presupuesto"("createdAt");
