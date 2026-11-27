import { validDay } from "./calendar";
import type { Merchant } from "./merchant";
import { merchantText } from "./merchant";

export const qualityVersion = "1";
export const qualityAreas = [
  ["completeness", "Vollständigkeit", 30],
  ["freshness", "Aktualität", 25],
  ["consistency", "Konsistenz", 25],
  ["classification", "Kategorisierung", 10],
  ["duplicates", "Duplikatprüfung", 10],
] as const;

type Area = typeof qualityAreas[number][0];
type Booking = {
  id: string; date: string; accountId: string; currency: string; category: string;
  title: string; payee: string; kind: string; amountCents: number; bookingStatus: string;
};
type Source = { name: string; day: string; freshnessDays: number; failed?: boolean; weight?: number; route: string };
type Issue = { id: string; title: string; detail: string; level: "Prüfen" | "Abweichung"; transactionId?: string; route?: string };

export function assessData(input: {
  day: string; transactions: Booking[]; accounts: { id: string; currency: string }[];
  currencies: string[]; merchants: Record<string, Merchant>; sources: Source[]; limited: boolean;
  accountsComplete: boolean; debtsComplete: boolean;
}) {
  const { day, transactions, accounts, currencies, merchants, sources, limited, accountsComplete, debtsComplete } = input;
  const issues: Issue[] = [];
  const tallies = Object.fromEntries(qualityAreas.map(([area]) => [area, { valid: 0, checked: 0 }])) as Record<Area, { valid: number; checked: number }>;
  const add = (area: Area, ratio: number, weight = 1) => {
    tallies[area].valid += ratio * weight;
    tallies[area].checked += weight;
  };
  const accountMap = new Map(accounts.map(account => [account.id, account]));
  const fingerprints = new Map<string, Booking[]>();
  const transferGroups = new Map<string, { incoming: Booking[]; outgoing: Booking[] }>();
  const booked = transactions.filter(row => row.bookingStatus === "booked");
  for (const row of booked) {
    const complete = Boolean(row.title.trim() && validDay(row.date) && /^[A-Z]{3}$/.test(row.currency));
    const account = accountMap.get(row.accountId);
    const consistent = account?.currency === row.currency && row.amountCents > 0 && row.date <= day;
    add("completeness", Number(complete));
    add("consistency", Number(consistent), 2);
    if (!complete || !consistent) issues.push({
      id: "movement:" + row.id, title: "Buchungsdaten prüfen", detail: row.date, level: "Abweichung", transactionId: row.id,
    });
    if (row.kind === "expense" || row.kind === "income") {
      const categorized = Boolean(row.category.trim() && row.category !== "Sonstiges");
      const merchant = merchants[row.id];
      add("classification", Number(categorized), row.kind === "expense" ? 2 : 1);
      if (row.kind === "expense") add("classification", Number(Boolean(merchant?.name) && merchant?.method !== "suggestion"));
      if (!categorized || (row.kind === "expense" && (!merchant?.name || merchant.method === "suggestion")))
        issues.push({id: "classify:" + row.id, title: !categorized ? "Kategorie prüfen" : "Händler prüfen", detail: row.date, level: "Prüfen", transactionId: row.id});
      const key = JSON.stringify([row.date, row.amountCents, row.currency]);
      const group = transferGroups.get(key) ?? { incoming: [], outgoing: [] };
      (row.kind === "income" ? group.incoming : group.outgoing).push(row);
      transferGroups.set(key, group);
    }
    const payee = merchantText(row.payee || row.title);
    if (payee && payee !== "bankbuchung") {
      const key = JSON.stringify([row.accountId, row.date, row.kind, row.currency, row.amountCents, payee]);
      const group = fingerprints.get(key) ?? [];
      group.push(row);
      fingerprints.set(key, group);
    }
  }
  for (const group of fingerprints.values()) {
    const row = group[0];
    add("duplicates", 1 / group.length, group.length);
    add("duplicates", 1 / group.length, Math.min(10, Math.abs(row.amountCents) / 10_000) * group.length);
    if (group.length > 1) issues.push({
      id: "duplicate:" + row.id, title: "Mögliche Doppelbuchung", detail: `${row.date} · ${group.length} gleichartige Buchungen`,
      level: "Prüfen", transactionId: row.id,
    });
  }
  for (const { incoming, outgoing } of transferGroups.values()) {
    if (incoming.length !== 1 || outgoing.length !== 1 || incoming[0].accountId === outgoing[0].accountId) continue;
    const row = outgoing[0];
    issues.push({id: "transfer:" + row.id, title: "Möglicher Kontoübertrag", detail: row.date, level: "Prüfen", transactionId: row.id});
  }
  for (const source of sources) {
    const age = validDay(source.day) ? Math.max(0, (+new Date(day) - +new Date(source.day)) / 86400000) : Infinity;
    const ratio = source.failed ? 0 : Math.max(0, Math.min(1, 2 - age / source.freshnessDays));
    add("freshness", ratio, source.weight ?? 1);
    if (ratio < 1) issues.push({
      id: "source:" + source.name + source.day + issues.length, title: source.failed ? "Bankabruf prüfen" : "Datenstand prüfen",
      detail: source.name + (source.day ? " · " + source.day : ""), level: "Prüfen", route: source.route,
    });
  }
  for (const currency of currencies) {
    add("completeness", 0, 2);
    issues.push({id: "currency:" + currency, title: "Wechselkurs fehlt", detail: currency, level: "Abweichung", route: "#/worth"});
  }
  const areas = qualityAreas.map(([id, label, weight]) => {
    const { valid, checked } = tallies[id];
    return {id, label, weight, score: checked ? Math.round(valid / checked * 100) : null};
  });
  const supported = areas.reduce((sum, area) => sum + (area.score === null ? 0 : area.weight), 0);
  // The remaining 20% requires independent evidence of external account and debt coverage.
  const coverage = Math.round(supported * 0.8 + (accountsComplete ? 10 : 0) + (debtsComplete ? 10 : 0));
  const effectiveCoverage = limited ? Math.min(79, coverage) : coverage;
  const score = effectiveCoverage >= 50 && supported ? Math.round(
    areas.reduce((sum, area) => sum + (area.score ?? 0) * area.weight, 0) / supported,
  ) : null;
  return {
    version: qualityVersion, score, coverage: effectiveCoverage, areas, limited, day,
    issues: issues.sort((a,b) => (a.level === "Abweichung" ? 0 : 1) - (b.level === "Abweichung" ? 0 : 1)),
  };
}
