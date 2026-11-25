CREATE TABLE "InstallmentPurchase" (
  "id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "totalCents" INTEGER NOT NULL,
  "downPaymentCents" INTEGER NOT NULL DEFAULT 0, "rateCents" INTEGER NOT NULL, "firstDueDate" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL
);
ALTER TABLE "Transaction" ADD COLUMN "installmentId" TEXT REFERENCES "InstallmentPurchase"("id") ON DELETE RESTRICT;
ALTER TABLE "Transaction" ADD COLUMN "installmentIndex" INTEGER;
CREATE UNIQUE INDEX "Transaction_installmentId_installmentIndex_key" ON "Transaction"("installmentId", "installmentIndex");
