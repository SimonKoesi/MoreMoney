ALTER TABLE "Transaction" ADD COLUMN "originalPurpose" TEXT NOT NULL DEFAULT '';

CREATE TABLE "MerchantLabel" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "transactionId" TEXT,
  "signature" TEXT,
  "name" TEXT NOT NULL,
  "logo" TEXT NOT NULL DEFAULT '',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "MerchantLabel_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MerchantLabel_transactionId_key" ON "MerchantLabel"("transactionId");
CREATE UNIQUE INDEX "MerchantLabel_signature_key" ON "MerchantLabel"("signature");

CREATE TABLE "DataQualitySnapshot" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "day" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "score" INTEGER,
  "coverage" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "DataQualitySnapshot_day_key" ON "DataQualitySnapshot"("day");
