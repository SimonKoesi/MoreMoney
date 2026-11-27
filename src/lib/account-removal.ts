import { db } from "./db";
import { managedBankAccount } from "./open-banking";

export async function removeAccount(
  accountId: string,
  deleteBookings: boolean,
) {
  if (managedBankAccount(accountId))
    throw new Error("Zuerst die Online-Bankverbindung trennen.");
  await db.$transaction(
    async (tx) => {
      const account = await tx.account.findUnique({ where: { id: accountId } });
      if (!account) return;
      const association = await Promise.all([
        tx.subscription.count({ where: { accountId } }),
        tx.savingsGoal.count({ where: { accountId } }),
        tx.recurringPayment.count({ where: { accountId } }),
        tx.asset.count({ where: { accountId } }),
      ]);
      if (association.some(Boolean))
        throw new Error(
          "Zuerst verknüpfte Abos, Sparziele, Fixkosten oder Vermögenswerte neu zuordnen.",
        );
      const count = await tx.transaction.count({ where: { accountId } });
      if (count && !deleteBookings)
        throw new Error(
          "Für dieses Konto müssen auch die Buchungen zur Löschung bestätigt werden.",
        );
      const linked = await tx.transaction.count({
        where: {
          accountId,
          OR: [
            { transferId: { not: null } },
            { budgetId: { not: null } },
            { itemId: { not: null } },
            { installmentId: { not: null } },
          ],
        },
      });
      if (linked)
        throw new Error(
          "Das Konto enthält Umbuchungen oder verknüpfte Zahlungen. Diese zuerst im jeweiligen Modul prüfen.",
        );
      const [saved, batches] = await Promise.all([
        tx.transaction.findMany({ where: { accountId }, select: { id: true } }),
        tx.importBatch.findMany({ where: { accountId }, select: { id: true } }),
      ]);
      for (let index = 0; index < saved.length; index += 200) {
        const ids = saved.slice(index, index + 200).map((row) => row.id);
        if (
          await tx.goalMovement.count({
            where: { fundingTransactionId: { in: ids } },
          })
        )
          throw new Error("Zuerst die zugeordneten Sparbewegungen auflösen.");
        await tx.transactionSplit.deleteMany({
          where: { transactionId: { in: ids } },
        });
      }
      for (let index = 0; index < batches.length; index += 200) {
        const ids = batches.slice(index, index + 200).map((row) => row.id);
        await tx.importChange.deleteMany({ where: { batchId: { in: ids } } });
      }
      await tx.importBatch.deleteMany({ where: { accountId } });
      await tx.transaction.deleteMany({ where: { accountId } });
      await tx.account.delete({ where: { id: accountId } });
    },
    { timeout: 30000 },
  );
}
