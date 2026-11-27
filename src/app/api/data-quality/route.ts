import { db, ready } from "@/lib/db";
import { berlinDay } from "@/lib/calendar";
import { assessData } from "@/lib/data-quality";
import { enrichMerchants, labelsFor } from "@/lib/merchant-service";
import { openBankingState } from "@/lib/open-banking";
import { portfolioSource } from "@/lib/investment-import";
import { sameOrigin } from "@/lib/validation";

export async function GET(request: Request) {
  if (!sameOrigin(request)) return Response.json({error: "Zugriff verweigert."}, {status: 403});
  try {
    await ready();
    if ((await db.userSettings.findUnique({where: {id: "local"}}))?.privacyMode)
      return Response.json({error: "Diskreter Modus aktiv."}, {status: 423});
    const [rows, accounts, assets, liabilities, rates, config] = await Promise.all([
      db.transaction.findMany({orderBy: [{date: "desc"}, {id: "asc"}], take: 5001}),
      db.account.findMany(), db.asset.findMany({where: {archived: false, accountId: null}}),
      db.liability.findMany({where: {archived: false}}),
      db.fxRate.findMany({select: {currency: true}}), db.dataQualityConfig.findUnique({where: {id: "local"}}),
    ]);
    const day = berlinDay();
    const transactions = rows.slice(0, 5000);
    const labels = (await Promise.all(Array.from({length: Math.ceil(transactions.length / 400)}, (_, index) =>
      labelsFor(transactions.slice(index * 400, index * 400 + 400))))).flat();
    const merchants = enrichMerchants(transactions, labels);
    const links = openBankingState();
    const currencySet = new Set([...rows, ...accounts, ...assets, ...liabilities].map(row => row.currency));
    const knownCurrencies = new Set(["EUR", ...rates.map(rate => rate.currency)]);
    const result = assessData({
      day, transactions, accounts, currencies: [...currencySet].filter(currency => !knownCurrencies.has(currency)),
      merchants, limited: rows.length > transactions.length,
      accountsComplete: config?.accountsComplete === true, debtsComplete: config?.debtsComplete === true,
      sources: [
        ...(links.environment === "PRODUCTION" ? links.links : []).map(link => ({
          name: link.name, day: berlinDay(new Date(link.lastSync)), freshnessDays: 1,
          failed: link.expired || link.history[0]?.success === false,
          route: "#/bank", weight: Math.min(10, Math.max(1, Math.abs(link.balanceCents) / 100_000)),
        })),
        ...assets.map(asset => ({
          name: asset.name, day: asset.valueDate, freshnessDays: asset.source.startsWith(portfolioSource) ? 30 : 90,
          route: "#/worth", weight: Math.min(10, Math.max(1, asset.currentValueCents / 100_000)),
        })),
      ],
    });
    const snapshot = {score: result.score, coverage: result.coverage, version: result.version};
    if (result.coverage) await db.dataQualitySnapshot.upsert({where: {day}, create: {day, ...snapshot}, update: snapshot});
    const history = await db.dataQualitySnapshot.findMany({orderBy: {day: "desc"}, take: 90, select: {day: true, score: true, coverage: true}});
    return Response.json({...result, issueCount: result.issues.length, issues: result.issues.slice(0, 100), history: history.reverse()});
  } catch {
    return Response.json({error: "Datenprüfung konnte nicht abgeschlossen werden."}, {status: 503});
  }
}
