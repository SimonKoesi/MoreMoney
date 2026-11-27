CREATE TABLE "SubscriptionLogo" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "subscriptionId" TEXT NOT NULL,
  "png" TEXT NOT NULL,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "SubscriptionLogo_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "SubscriptionLogo_subscriptionId_key" ON "SubscriptionLogo"("subscriptionId");
