import { addDays, addMonths } from "./calendar";

type Movement = { id: string; date: string; kind: string; category: string };
type Amounts = Record<string, number | null>;
type ExpenseParts = Record<string, { name: string; value: number }[]>;

function allocations(payment: Movement, amount: number, parts: ExpenseParts) {
  return parts[payment.id] ?? [{ name: payment.category.trim() || "Sonstiges", value: amount }];
}

export function dashboardExpenseDetails<T extends Movement>(
  payments: T[],
  amounts: Amounts,
  expenseParts: ExpenseParts,
  category: string,
) {
  return payments.flatMap(payment => {
    const amount = amounts[payment.id];
    if (payment.kind !== "expense" || !amount) return [];
    const categoryCents = allocations(payment, amount, expenseParts)
      .reduce((sum, part) => part.name === category && part.value > 0 ? sum + part.value : sum, 0);
    return categoryCents ? [{ payment, categoryCents, amountCents: amount }] : [];
  }).sort((a, b) => b.payment.date.localeCompare(a.payment.date));
}

export function dashboardCashflow({
  payments, amounts, expenseParts, start, end, monthly,
}: {
  payments: Movement[];
  amounts: Amounts;
  expenseParts: ExpenseParts;
  start: string;
  end: string;
  monthly: boolean;
}) {
  const totals = new Map<string, number>();
  const buckets = [];
  let income = 0;
  for (let from = start; from <= end; from = monthly ? addMonths(from, 1) : addDays(from, 7)) {
    const next = monthly ? addMonths(from, 1) : addDays(from, 7);
    let inflow = 0, outflow = 0;
    for (const payment of payments) {
      if (payment.date < from || payment.date >= next || payment.date > end) continue;
      const amount = amounts[payment.id];
      if (!amount) continue;
      if (payment.kind === "income") {
        inflow += amount;
        continue;
      }
      if (payment.kind !== "expense") continue;
      outflow += amount;
      for (const part of allocations(payment, amount, expenseParts))
        if (part.value > 0) totals.set(part.name, (totals.get(part.name) ?? 0) + part.value);
    }
    income += inflow;
    buckets.push({
      month: monthly ? from.slice(5, 7) + "/" + from.slice(2, 4) : from.slice(8) + "." + from.slice(5, 7) + ".",
      Einnahmen: inflow / 100,
      Ausgaben: outflow / 100,
    });
  }
  return {
    income, buckets,
    expenses: [...totals].map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "de")),
    hasTransactions: income > 0 || totals.size > 0,
  };
}
