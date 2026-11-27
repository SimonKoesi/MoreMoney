ALTER TABLE "SavingsGoal" ADD COLUMN "description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SavingsGoal" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'Individuell';
ALTER TABLE "SavingsGoal" ADD COLUMN "monthlyRateCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SavingsGoal" ADD COLUMN "startDate" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SavingsGoal" ADD COLUMN "targetDate" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SavingsGoal" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "SavingsGoal" ADD COLUMN "accountId" TEXT;
ALTER TABLE "SavingsGoal" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'EUR';
ALTER TABLE "SavingsGoal" ADD COLUMN "color" TEXT NOT NULL DEFAULT '#58d6bc';
ALTER TABLE "SavingsGoal" ADD COLUMN "icon" TEXT NOT NULL DEFAULT 'target';
ALTER TABLE "SavingsGoal" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "SavingsGoal" ADD COLUMN "savingMode" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "SavingsGoal" ADD COLUMN "interestBps" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SavingsGoal" ADD COLUMN "interval" TEXT NOT NULL DEFAULT 'monthly';
ALTER TABLE "Budget" ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'purchase';
ALTER TABLE "Budget" ADD COLUMN "categoryScope" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Budget" ADD COLUMN "period" TEXT NOT NULL DEFAULT 'monthly';
ALTER TABLE "Budget" ADD COLUMN "startDate" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Budget" ADD COLUMN "periodDays" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "Budget" ADD COLUMN "repeating" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Budget" ADD COLUMN "rollover" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Budget" ADD COLUMN "warningThresholds" TEXT NOT NULL DEFAULT '75,90,100';
ALTER TABLE "Transaction" ADD COLUMN "financialRole" TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE "UserSettings" ADD COLUMN "navigation" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE "UserSettings" ADD COLUMN "financePreferences" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE "CategoryRule" ADD COLUMN "financialRole" TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE "RecurringPayment" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'expense';
ALTER TABLE "RecurringPayment" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "RecurringPayment" ADD COLUMN "accountId" TEXT;
CREATE TABLE "GoalMovement" ("id" TEXT NOT NULL PRIMARY KEY,
"goalId" TEXT NOT NULL,
"amountCents" INTEGER NOT NULL,
"day" TEXT NOT NULL,
"kind" TEXT NOT NULL,
"note" TEXT NOT NULL DEFAULT '',
"requestId" TEXT NOT NULL,
"fundingTransactionId" TEXT,
"previous" TEXT NOT NULL DEFAULT '',
"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" DATETIME NOT NULL);
CREATE UNIQUE INDEX "GoalMovement_requestId_key" ON "GoalMovement"("requestId");
CREATE INDEX "GoalMovement_goalId_idx" ON "GoalMovement"("goalId");
CREATE TABLE "TransactionSplit" ("id" TEXT NOT NULL PRIMARY KEY,
"transactionId" TEXT NOT NULL,
"category" TEXT NOT NULL,
"amountCents" INTEGER NOT NULL,
"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" DATETIME NOT NULL);
CREATE INDEX "TransactionSplit_transactionId_idx" ON "TransactionSplit"("transactionId");
CREATE TABLE "MonthCoverage" ("id" TEXT NOT NULL PRIMARY KEY,
"month" TEXT NOT NULL,
"incomeComplete" BOOLEAN NOT NULL DEFAULT false,
"expensesComplete" BOOLEAN NOT NULL DEFAULT false,
"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" DATETIME NOT NULL);
CREATE UNIQUE INDEX "MonthCoverage_month_key" ON "MonthCoverage"("month");
CREATE TABLE "DataQualityConfig" ("id" TEXT NOT NULL PRIMARY KEY,
"accountsComplete" BOOLEAN NOT NULL DEFAULT false,
"debtsComplete" BOOLEAN NOT NULL DEFAULT false,
"obligationsComplete" BOOLEAN NOT NULL DEFAULT false,
"incomeReviewed" BOOLEAN NOT NULL DEFAULT false,
"savingsReviewed" BOOLEAN NOT NULL DEFAULT false,
"longTermReviewed" BOOLEAN NOT NULL DEFAULT false,
"essentialCategories" TEXT NOT NULL DEFAULT '[]',
"highInterestBps" INTEGER NOT NULL DEFAULT 1000,
"targetReserveMonths" INTEGER NOT NULL DEFAULT 6,
"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" DATETIME NOT NULL);
CREATE TABLE "HealthSnapshot" ("id" TEXT NOT NULL PRIMARY KEY,
"eventKey" TEXT NOT NULL,
"day" TEXT NOT NULL,
"version" TEXT NOT NULL,
"score" INTEGER,
"exactScore" TEXT NOT NULL,
"coverage" TEXT NOT NULL,
"inputs" TEXT NOT NULL,
"details" TEXT NOT NULL,
"reason" TEXT NOT NULL,
"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" DATETIME NOT NULL);
CREATE UNIQUE INDEX "HealthSnapshot_eventKey_key" ON "HealthSnapshot"("eventKey");
CREATE TABLE "FinanceInsight" ("id" TEXT NOT NULL PRIMARY KEY,
"key" TEXT NOT NULL,
"category" TEXT NOT NULL,
"title" TEXT NOT NULL,
"description" TEXT NOT NULL,
"impactCents" INTEGER NOT NULL DEFAULT 0,
"priority" INTEGER NOT NULL,
"quality" TEXT NOT NULL,
"sourceIds" TEXT NOT NULL,
"periodStart" TEXT NOT NULL,
"periodEnd" TEXT NOT NULL,
"route" TEXT NOT NULL,
"read" BOOLEAN NOT NULL DEFAULT false,
"archived" BOOLEAN NOT NULL DEFAULT false,
"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" DATETIME NOT NULL);
CREATE UNIQUE INDEX "FinanceInsight_key_key" ON "FinanceInsight"("key");
CREATE TABLE "SavedFilter" ("id" TEXT NOT NULL PRIMARY KEY,
"name" TEXT NOT NULL,
"filters" TEXT NOT NULL,
"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" DATETIME NOT NULL);
CREATE TABLE "ChatMessage" ("id" TEXT NOT NULL PRIMARY KEY,
"threadId" TEXT NOT NULL,
"role" TEXT NOT NULL,
"content" TEXT NOT NULL,
"components" TEXT NOT NULL,
"sourceIds" TEXT NOT NULL,
"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" DATETIME NOT NULL);
CREATE INDEX "ChatMessage_threadId_idx" ON "ChatMessage"("threadId");
CREATE TABLE "FinanceReport" ("id" TEXT NOT NULL PRIMARY KEY,
"kind" TEXT NOT NULL,
"periodStart" TEXT NOT NULL,
"periodEnd" TEXT NOT NULL,
"content" TEXT NOT NULL,
"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" DATETIME NOT NULL);
CREATE TABLE "CategoryConfig" ("id" TEXT NOT NULL PRIMARY KEY,
"name" TEXT NOT NULL,
"color" TEXT NOT NULL DEFAULT '#58d6bc',
"icon" TEXT NOT NULL DEFAULT 'tag',
"necessary" BOOLEAN NOT NULL DEFAULT false,
"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" DATETIME NOT NULL);
CREATE UNIQUE INDEX "CategoryConfig_name_key" ON "CategoryConfig"("name");
