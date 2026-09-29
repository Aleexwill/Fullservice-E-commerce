-- CreateTable CustomerAccount
CREATE TABLE "CustomerAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "passwordHash" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "activationToken" TEXT,
    "activationExpiresAt" TIMESTAMP(3),
    "resetToken" TEXT,
    "resetExpiresAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerAccount_email_key" ON "CustomerAccount"("email");
CREATE UNIQUE INDEX "CustomerAccount_activationToken_key" ON "CustomerAccount"("activationToken");
CREATE UNIQUE INDEX "CustomerAccount_resetToken_key" ON "CustomerAccount"("resetToken");
CREATE INDEX "CustomerAccount_email_idx" ON "CustomerAccount"("email");
CREATE INDEX "CustomerAccount_activationToken_idx" ON "CustomerAccount"("activationToken");
CREATE INDEX "CustomerAccount_resetToken_idx" ON "CustomerAccount"("resetToken");

-- AlterTable Order — add customer account relation and receipt fields
ALTER TABLE "Order"
    ADD COLUMN "customerAccountId" TEXT,
    ADD COLUMN "transferReceiptUrl" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "transferReceiptAt" TIMESTAMP(3),
    ADD COLUMN "paymentConfirmedAt" TIMESTAMP(3),
    ADD COLUMN "paymentConfirmedBy" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "adminReceiptUrl" TEXT NOT NULL DEFAULT '';

-- CreateIndex on Order.customerAccountId
CREATE INDEX "Order_customerAccountId_idx" ON "Order"("customerAccountId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerAccountId_fkey"
    FOREIGN KEY ("customerAccountId") REFERENCES "CustomerAccount"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
