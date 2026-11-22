CREATE TABLE "WatchStock" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "symbol" TEXT NOT NULL,
  "exchange" TEXT NOT NULL DEFAULT '',
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "group" TEXT NOT NULL DEFAULT '',
  "note" TEXT NOT NULL DEFAULT '',
  "favorite" BOOLEAN NOT NULL DEFAULT false,
  "targetMicros" TEXT,
  "targetDirection" TEXT NOT NULL DEFAULT 'below',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "WatchStock_symbol_exchange_currency_key" ON "WatchStock"("symbol", "exchange", "currency");
CREATE TABLE "StockQuote" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "stockId" TEXT NOT NULL,
  "priceMicros" TEXT NOT NULL,
  "asOf" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'manual',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "StockQuote_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "WatchStock"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "StockQuote_stockId_source_asOf_key" ON "StockQuote"("stockId", "source", "asOf");
CREATE INDEX "StockQuote_stockId_asOf_idx" ON "StockQuote"("stockId", "asOf");
