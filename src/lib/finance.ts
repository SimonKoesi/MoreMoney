export function cents(value: string): number {
  const text = value.trim().replace(/\s|€/g, '');
  if (!/^-?\d+(?:[.,]\d{1,2})?$/.test(text)) throw new Error('Betrag ohne Tausendertrennzeichen eingeben, z. B. 1299,95.');
  const negative = text.startsWith('-');
  const [whole, fraction = ''] = text.replace('-', '').split(/[.,]/);
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(result) || result > 2_000_000_000) throw new Error('Betrag zu groß.');
  return negative ? -result : result;
}
export const money = (value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value / 100);
export type Payment = { amountCents: number; kind: string; accountId: string; date: string; itemId?: string | null; budgetId?: string | null };
export function balance(opening: number, payments: Payment[]) {
  return payments.reduce((sum, p) => sum + (['income', 'transfer-in'].includes(p.kind) ? p.amountCents : -p.amountCents), opening);
}
export function budgetTotals(limit: number, items: {id: string; plannedCents: number; quantity: number; alternatives?: {active: boolean; priceCents: number; shippingCents: number}[]}[], payments: Payment[]) {
  const paid = payments.filter(p => p.kind === 'expense').reduce((sum, p) => sum + p.amountCents, 0);
  let planned = 0, open = 0;
  for (const item of items) {
    const alternative = item.alternatives?.find(a => a.active);
    const estimate = (alternative ? alternative.priceCents + alternative.shippingCents : item.plannedCents) * item.quantity;
    planned += estimate;
    const itemPaid = payments.filter(p => p.kind === 'expense' && p.itemId === item.id).reduce((s,p) => s + p.amountCents, 0);
    open += Math.max(0, estimate - itemPaid);
  }
  return { planned, paid, open, expected: paid + open, remaining: limit - paid, forecastRemaining: limit - paid - open };
}
export function monthlyEquivalent(amount: number, interval: string) {
  const ratios: Record<string, [number, number]> = { weekly: [52,12], monthly:[1,1], quarterly:[1,3], halfyearly:[1,6], yearly:[1,12] };
  const [n,d] = ratios[interval] || [1,1];
  return Math.round(amount * n / d);
}
export function forecast(balanceCents: number, income: number, expenses: number, reserve: number, purchase: number, months: number) {
  const available = balanceCents + (income - expenses) * months - reserve - purchase;
  return { available, gap: Math.max(0, -available) };
}
