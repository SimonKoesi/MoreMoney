import type { Prisma } from "@/generated/prisma/client";

export async function rememberCategory(
  db: Pick<Prisma.TransactionClient, "categoryConfig">,
  value: string,
) {
  const name = value.trim();
  if (name)
    await db.categoryConfig.upsert({
      where: { name },
      create: { name },
      update: {},
    });
}
