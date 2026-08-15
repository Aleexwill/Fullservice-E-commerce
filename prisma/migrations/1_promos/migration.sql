-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "promoDiscountPercent" INTEGER,
ADD COLUMN     "promoEndsAt" TIMESTAMP(3),
ADD COLUMN     "promoStartsAt" TIMESTAMP(3),
ADD COLUMN     "salesCount" INTEGER NOT NULL DEFAULT 0;
-- CreateIndex
CREATE INDEX "Product_salesCount_idx" ON "Product"("salesCount");
