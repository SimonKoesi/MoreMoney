ALTER TABLE "Account" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'EUR';
ALTER TABLE "Account" ADD COLUMN "includeInWorth" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Account" ADD COLUMN "maskedIban" TEXT NOT NULL DEFAULT '';
ALTER TABLE "UserSettings" ADD COLUMN "privacyMode" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "UserSettings" ADD COLUMN "inactivityMinutes" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "Transaction" ADD COLUMN "bankExternalId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "importBatchId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "Transaction" ADD COLUMN "bookingStatus" TEXT NOT NULL DEFAULT 'booked';
ALTER TABLE "Transaction" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'EUR';
ALTER TABLE "Transaction" ADD COLUMN "valueDate" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Transaction" ADD COLUMN "payee" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Transaction" ADD COLUMN "tags" TEXT NOT NULL DEFAULT '';
CREATE UNIQUE INDEX "Transaction_accountId_bankExternalId_key" ON "Transaction"("accountId","bankExternalId");
CREATE TABLE "Subscription" ("id" TEXT NOT NULL PRIMARY KEY,
"name" TEXT NOT NULL,
"description" TEXT NOT NULL DEFAULT '',
"icon" TEXT NOT NULL DEFAULT 'repeat',
"category" TEXT NOT NULL DEFAULT 'Sonstiges',
"priceCents" INTEGER NOT NULL,
"currency" TEXT NOT NULL DEFAULT 'EUR',
"interval" TEXT NOT NULL DEFAULT 'monthly',
"customDays" INTEGER NOT NULL DEFAULT 30,
"startDate" TEXT NOT NULL,
"minimumMonths" INTEGER NOT NULL DEFAULT 0,
"nextCharge" TEXT NOT NULL,
"noticeDays" INTEGER NOT NULL DEFAULT 0,
"earliestEnd" TEXT NOT NULL DEFAULT '',
"endDate" TEXT NOT NULL DEFAULT '',
"trialEnd" TEXT NOT NULL DEFAULT '',
"autoRenew" BOOLEAN NOT NULL DEFAULT true,
"paymentMethod" TEXT NOT NULL DEFAULT '',
"accountId" TEXT,
"customerNumber" TEXT NOT NULL DEFAULT '',
"contractNumber" TEXT NOT NULL DEFAULT '',
"website" TEXT NOT NULL DEFAULT '',
"cancelUrl" TEXT NOT NULL DEFAULT '',
"note" TEXT NOT NULL DEFAULT '',
"usage" TEXT NOT NULL DEFAULT 'regular',
"status" TEXT NOT NULL DEFAULT 'active',
"cancelledAt" TEXT NOT NULL DEFAULT '',
"suggestionKey" TEXT,
"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" DATETIME NOT NULL);
CREATE UNIQUE INDEX "Subscription_suggestionKey_key" ON "Subscription"("suggestionKey");
CREATE TABLE "SubscriptionHistory" ("id" TEXT NOT NULL PRIMARY KEY,
"subscriptionId" TEXT NOT NULL,
"priceCents" INTEGER NOT NULL,
"currency" TEXT NOT NULL,
"status" TEXT NOT NULL,
"effectiveDate" TEXT NOT NULL,
"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" DATETIME NOT NULL);
CREATE TABLE "RejectedSuggestion" ("id" TEXT NOT NULL PRIMARY KEY,
"key" TEXT NOT NULL,
"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" DATETIME NOT NULL);
CREATE UNIQUE INDEX "RejectedSuggestion_key_key" ON "RejectedSuggestion"("key");
CREATE TABLE "Asset" ("id" TEXT NOT NULL PRIMARY KEY,
"name" TEXT NOT NULL,
"category" TEXT NOT NULL,
"purchaseCents" INTEGER NOT NULL DEFAULT 0,
"currentValueCents" INTEGER NOT NULL,
"currency" TEXT NOT NULL DEFAULT 'EUR',
"purchaseDate" TEXT NOT NULL DEFAULT '',
"quantityMicros" TEXT NOT NULL DEFAULT '1000000',
"accountId" TEXT,
"watchStockId" TEXT,
"valueDate" TEXT NOT NULL,
"source" TEXT NOT NULL DEFAULT 'manual',
"estimated" BOOLEAN NOT NULL DEFAULT false,
"archived" BOOLEAN NOT NULL DEFAULT false,
"note" TEXT NOT NULL DEFAULT '',
"icon" TEXT NOT NULL DEFAULT 'gem',
"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" DATETIME NOT NULL);
CREATE UNIQUE INDEX "Asset_accountId_key" ON "Asset"("accountId");
CREATE TABLE "Liability" ("id" TEXT NOT NULL PRIMARY KEY,
"name" TEXT NOT NULL,
"category" TEXT NOT NULL,
"originalCents" INTEGER NOT NULL,
"currentCents" INTEGER NOT NULL,
"currency" TEXT NOT NULL DEFAULT 'EUR',
"interestBps" INTEGER NOT NULL DEFAULT 0,
"rateCents" INTEGER NOT NULL DEFAULT 0,
"termMonths" INTEGER NOT NULL DEFAULT 0,
"startDate" TEXT NOT NULL,
"creditor" TEXT NOT NULL DEFAULT '',
"assetId" TEXT,
"installmentId" TEXT,
"note" TEXT NOT NULL DEFAULT '',
"archived" BOOLEAN NOT NULL DEFAULT false,
"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" DATETIME NOT NULL);
CREATE UNIQUE INDEX "Liability_installmentId_key" ON "Liability"("installmentId");
CREATE TABLE "FxRate" ("id" TEXT NOT NULL PRIMARY KEY,
"currency" TEXT NOT NULL,
"rateMicros" TEXT NOT NULL,
"asOf" TEXT NOT NULL,
"source" TEXT NOT NULL DEFAULT 'manual',
"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" DATETIME NOT NULL);
CREATE UNIQUE INDEX "FxRate_currency_asOf_key" ON "FxRate"("currency","asOf");
CREATE TABLE "WorthSnapshot" ("id" TEXT NOT NULL PRIMARY KEY,
"eventKey" TEXT NOT NULL,
"day" TEXT NOT NULL,
"assetsCents" TEXT NOT NULL,
"liabilitiesCents" TEXT NOT NULL,
"liquidCents" TEXT NOT NULL,
"netCents" TEXT NOT NULL,
"allocations" TEXT NOT NULL,
"excludedCurrencies" TEXT NOT NULL,
"reason" TEXT NOT NULL,
"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" DATETIME NOT NULL);
CREATE UNIQUE INDEX "WorthSnapshot_eventKey_key" ON "WorthSnapshot"("eventKey");
CREATE TABLE "ImportBatch" ("id" TEXT NOT NULL PRIMARY KEY,
"accountId" TEXT NOT NULL,
"filename" TEXT NOT NULL,
"fileHash" TEXT NOT NULL,
"status" TEXT NOT NULL DEFAULT 'applied',
"rowCount" INTEGER NOT NULL DEFAULT 0,
"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" DATETIME NOT NULL);
CREATE TABLE "ImportChange" ("id" TEXT NOT NULL PRIMARY KEY,
"batchId" TEXT NOT NULL,
"transactionId" TEXT NOT NULL,
"action" TEXT NOT NULL,
"before" TEXT NOT NULL,
"afterHash" TEXT NOT NULL,
"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" DATETIME NOT NULL);
CREATE TABLE "CategoryRule" ("id" TEXT NOT NULL PRIMARY KEY,
"name" TEXT NOT NULL,
"match" TEXT NOT NULL,
"category" TEXT NOT NULL,
"subcategory" TEXT NOT NULL DEFAULT '',
"minimumCents" INTEGER,
"maximumCents" INTEGER,
"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" DATETIME NOT NULL);
CREATE TABLE "Document" ("id" TEXT NOT NULL PRIMARY KEY,
"ownerType" TEXT NOT NULL,
"ownerId" TEXT NOT NULL,
"name" TEXT NOT NULL,
"mime" TEXT NOT NULL,
"size" INTEGER NOT NULL,
"sha256" TEXT NOT NULL,
"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" DATETIME NOT NULL);
CREATE TABLE "FinanceGoal" ("id" TEXT NOT NULL PRIMARY KEY,
"name" TEXT NOT NULL,
"targetCents" INTEGER NOT NULL,
"targetDate" TEXT NOT NULL DEFAULT '',
"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" DATETIME NOT NULL);
CREATE TABLE "PrivacyConsent" ("id" TEXT NOT NULL PRIMARY KEY,
"purpose" TEXT NOT NULL,
"granted" BOOLEAN NOT NULL DEFAULT false,
"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" DATETIME NOT NULL);
CREATE UNIQUE INDEX "PrivacyConsent_purpose_key" ON "PrivacyConsent"("purpose");
CREATE TABLE "AuditEvent" ("id" TEXT NOT NULL PRIMARY KEY,
"event" TEXT NOT NULL,
"outcome" TEXT NOT NULL,
"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" DATETIME NOT NULL);
