-- AlterTable: add technicalDetails to Portfolio
ALTER TABLE "Portfolio" ADD COLUMN IF NOT EXISTS "technicalDetails" JSONB NOT NULL DEFAULT '{}';

-- CreateTable: ClienteLogo with self-referential parent/children
CREATE TABLE IF NOT EXISTS "ClienteLogo" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "website" TEXT NOT NULL DEFAULT '',
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteLogo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ClienteLogo_isActive_order_idx" ON "ClienteLogo"("isActive", "order");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ClienteLogo_parentId_idx" ON "ClienteLogo"("parentId");

-- AddForeignKey
ALTER TABLE "ClienteLogo" ADD CONSTRAINT "ClienteLogo_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ClienteLogo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
