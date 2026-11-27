import { db, ready } from "@/lib/db";
import { bankingId } from "@/lib/enable-banking";
import { berlinDay } from "@/lib/finance-os";
import { financeState } from "@/lib/finance-state";
import { portfolioSchema, portfolioSource } from "@/lib/investment-import";
import { readTextBounded } from "@/lib/request-body";
import { sameOrigin } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "Zugriff verweigert." }, { status: 403 });
  const parsed = portfolioSchema.safeParse(
    await readTextBounded(request, 160_000)
      .then(JSON.parse)
      .catch(() => null),
  );
  if (!parsed.success || parsed.data.day > berlinDay())
    return Response.json(
      { error: "Depotname, Bewertungsdatum und Positionen prüfen." },
      { status: 400 },
    );
  const { portfolio, day, positions } = parsed.data;
  const source = portfolioSource + portfolio;
  const rows = positions.map(({ isin, ...position }) => ({
    ...position,
    isin,
    id: bankingId(
      JSON.stringify([
        "moremoney-portfolio",
        portfolio.normalize("NFC").toLocaleLowerCase("de"),
        isin,
      ]),
    ),
  }));
  try {
    await ready();
    const counts = await db.$transaction(async (tx) => {
      const settings = await tx.userSettings.findUnique({
        where: { id: "local" },
        select: { privacyMode: true },
      });
      if (settings?.privacyMode) return null;
      const existing = new Map(
        (
          await tx.asset.findMany({
            where: { id: { in: rows.map((row) => row.id) } },
          })
        ).map((row) => [row.id, row]),
      );
      let saved = 0,
        skipped = 0;
      for (const { id, isin, ...position } of rows) {
        const prior = existing.get(id);
        if (
          prior &&
          (prior.valueDate > day ||
            prior.accountId ||
            (prior.valueDate === day &&
              prior.name === position.name &&
              prior.category === position.category &&
              prior.quantityMicros === position.quantityMicros &&
              prior.currency === position.currency &&
              prior.currentValueCents === position.currentValueCents &&
              prior.purchaseCents === position.purchaseCents))
        ) {
          skipped++;
          continue;
        }
        const fields = {
          ...position,
          source,
          valueDate: day,
          estimated: false,
        };
        if (prior) {
          await tx.asset.update({
            where: { id },
            data: {
              ...fields,
              ...(prior.currency !== position.currency && {
                watchStockId: null,
              }),
            },
          });
        } else {
          await tx.asset.create({ data: { id, ...fields, note: isin } });
        }
        saved++;
      }
      return { saved, skipped };
    });
    if (!counts)
      return Response.json(
        { error: "Diskreter Modus aktiv." },
        { status: 423 },
      );
    if (counts.saved) await financeState("Depotimport").catch(() => undefined);
    return Response.json(counts);
  } catch {
    return Response.json(
      { error: "Depotimport fehlgeschlagen. Die Vorschau bleibt erhalten." },
      { status: 500 },
    );
  }
}
