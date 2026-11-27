import { createHash } from "node:crypto";
import { db } from "./db";
import { merchantSignature, recognizeMerchant, type MerchantInput } from "./merchant";

type Movement = MerchantInput & { id: string };
type Label = { transactionId: string | null; signature: string | null; name: string; logo: string };
export const merchantFields = { id: true, title: true, payee: true, originalPurpose: true, kind: true } as const;

export function signatureKey(row: MerchantInput) {
  const signature = merchantSignature(row);
  return signature ? createHash("sha256").update(signature).digest("hex") : "";
}

export function enrichMerchants(rows: Movement[], labels: Label[], includeLogos = false) {
  const byId = new Map(labels.filter(label => label.transactionId).map(label => [label.transactionId, label]));
  const bySignature = new Map(labels.filter(label => label.signature).map(label => [label.signature, label]));
  return Object.fromEntries(rows.map(row => {
    const automatic = recognizeMerchant(row);
    const manual = byId.get(row.id);
    const chosen = manual ?? bySignature.get(signatureKey(row));
    return [row.id, chosen
      ? { ...automatic, name: chosen.name, category: chosen.name === automatic.name ? automatic.category : "",
          score: 100, method: manual ? "manual" as const : "rule" as const, logo: includeLogos ? chosen.logo : "" }
      : automatic];
  }));
}

export async function labelsFor(rows: Movement[]) {
  if (!rows.length) return [];
  return db.merchantLabel.findMany({ where: { OR: [
    { transactionId: { in: rows.map(row => row.id) } },
    { signature: { in: [...new Set(rows.map(signatureKey).filter(Boolean))] } },
  ] } });
}
