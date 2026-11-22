-- Remove only the explicitly marked built-in sample records. Keep real entries
-- added to their accounts/budgets and keep their IDs and relations intact.
DELETE FROM "Transaction" WHERE "title" IN ('Demo · Nettogehalt', 'Demo · Sofa-Anzahlung');
DELETE FROM "BudgetItem" WHERE "budgetId" IN (SELECT "id" FROM "Budget" WHERE "name" = 'Demo · Zuhause')
  AND (("name" = 'Sofa' AND "plannedCents" = 89900) OR ("name" = 'Leselampe' AND "plannedCents" = 12900))
  AND NOT EXISTS (SELECT 1 FROM "Transaction" t WHERE t."itemId" = "BudgetItem"."id")
  AND NOT EXISTS (SELECT 1 FROM "ProductLink" l WHERE l."itemId" = "BudgetItem"."id")
  AND NOT EXISTS (SELECT 1 FROM "ProductImage" i WHERE i."itemId" = "BudgetItem"."id")
  AND NOT EXISTS (SELECT 1 FROM "Alternative" a WHERE a."itemId" = "BudgetItem"."id");
DELETE FROM "Budget" WHERE "name" = 'Demo · Zuhause'
  AND NOT EXISTS (SELECT 1 FROM "BudgetItem" i WHERE i."budgetId" = "Budget"."id")
  AND NOT EXISTS (SELECT 1 FROM "Transaction" t WHERE t."budgetId" = "Budget"."id");
UPDATE "Budget" SET "name" = 'Zuhause', "limitCents" = CASE WHEN "limitCents" = 250000 THEN 0 ELSE "limitCents" END, "description" = CASE WHEN "description" = 'Ein guter Platz für neue Ideen.' THEN '' ELSE "description" END WHERE "name" = 'Demo · Zuhause';
DELETE FROM "Account" WHERE "name" = 'Demo · Girokonto' AND NOT EXISTS (SELECT 1 FROM "Transaction" t WHERE t."accountId" = "Account"."id");
UPDATE "Account" SET "name" = 'Girokonto', "openingCents" = CASE WHEN "openingCents" = 245000 THEN 0 ELSE "openingCents" END WHERE "name" = 'Demo · Girokonto';
DELETE FROM "SavingsGoal" WHERE "name" = 'Demo · Kleine Auszeit' AND "targetCents" = 180000 AND "savedCents" = 62000;
UPDATE "SavingsGoal" SET "name" = 'Kleine Auszeit', "savedCents" = MAX(0, "savedCents" - 62000) WHERE "name" = 'Demo · Kleine Auszeit';
DELETE FROM "ProjectTask" WHERE "projectId" IN (SELECT "id" FROM "Project" WHERE "name" = 'Demo · Zuhause gestalten') AND "name" IN ('Maße nehmen', 'Liefertermine abstimmen');
DELETE FROM "Project" WHERE "name" = 'Demo · Zuhause gestalten' AND NOT EXISTS (SELECT 1 FROM "ProjectTask" t WHERE t."projectId" = "Project"."id");
UPDATE "Project" SET "name" = 'Zuhause gestalten' WHERE "name" = 'Demo · Zuhause gestalten';
