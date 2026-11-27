import { z } from "zod";
import { csvRows } from "./csv";
import { validDay } from "./calendar";
import { cents } from "./finance";

export const portfolioSource = "Depot-CSV · ";
export const portfolioCategories = [
  "Aktien",
  "ETFs",
  "Fonds",
  "Anleihen",
  "Sonstiges",
] as const;
export const portfolioTemplate =
  "ISIN;Name;Kategorie;Stückzahl;Einstandswert;Marktwert;Währung";

function validIsin(isin: string) {
  if (!/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(isin)) return false;
  const digits = isin.replace(/[A-Z]/g, (character) =>
    String(character.charCodeAt(0) - 55),
  );
  return (
    [...digits].reverse().reduce((sum, digit, i) => {
      const value = Number(digit) * (i % 2 ? 2 : 1);
      return sum + (value > 9 ? value - 9 : value);
    }, 0) %
      10 ===
    0
  );
}

export const positionSchema = z.object({
  isin: z.string().refine(validIsin, "ISIN oder Prüfziffer ungültig."),
  name: z.string().trim().min(1).max(160),
  category: z.enum(portfolioCategories),
  quantityMicros: z.string().regex(/^[1-9]\d{0,15}$/),
  purchaseCents: z.number().int().min(0).max(2_000_000_000),
  currentValueCents: z.number().int().min(0).max(2_000_000_000),
  currency: z.string().regex(/^[A-Z]{3}$/),
});

export const portfolioSchema = z
  .object({
    portfolio: z.string().trim().min(1).max(60),
    day: z.string().refine(validDay),
    positions: z.array(positionSchema).min(1).max(150),
  })
  .superRefine((input, ctx) => {
    if (
      new Set(input.positions.map((position) => position.isin)).size !==
      input.positions.length
    )
      ctx.addIssue({
        code: "custom",
        message: "Jede ISIN darf pro Depotdatei einmal vorkommen.",
      });
  });

export type PortfolioImport = z.infer<typeof portfolioSchema>;

export function parsePortfolio(content: string): {
  positions: PortfolioImport["positions"];
  errors: string[];
} {
  const { headers, rows } = csvRows(content);
  const expected = portfolioTemplate.split(";");
  const indices = expected.map((header) =>
    headers.findIndex(
      (value) =>
        value.toLocaleLowerCase("de") === header.toLocaleLowerCase("de"),
    ),
  );
  if (headers.length !== expected.length || indices.includes(-1))
    throw new Error("Die Spalten müssen der MoreMoney-Vorlage entsprechen.");
  if (!rows.length || rows.length > 150)
    throw new Error("Die Datei muss 1 bis 150 Depotpositionen enthalten.");
  const positions: PortfolioImport["positions"] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  rows.forEach((row, index) => {
    try {
      if (row.length !== headers.length)
        throw new Error("Anzahl der Spalten stimmt nicht.");
      const [isin, name, category, quantity, purchase, value, currency] =
        indices.map((i) => row[i].trim());
      if (!/^\d{1,10}([.,]\d{1,6})?$/.test(quantity))
        throw new Error(
          "Stückzahl mit höchstens sechs Nachkommastellen eingeben.",
        );
      const [whole, decimal = ""] = quantity.split(/[.,]/);
      const quantityMicros = String(
        BigInt(whole) * 1_000_000n + BigInt(decimal.padEnd(6, "0")),
      );
      const position = positionSchema.parse({
        isin: isin.toUpperCase(),
        name,
        category,
        quantityMicros,
        purchaseCents: cents(purchase),
        currentValueCents: cents(value),
        currency: currency.toUpperCase(),
      });
      if (seen.has(position.isin))
        throw new Error("ISIN ist doppelt enthalten.");
      seen.add(position.isin);
      positions.push(position);
    } catch (error) {
      errors.push(
        `Datenzeile ${index + 1} · ${error instanceof z.ZodError ? error.issues[0]?.message : error instanceof Error ? error.message : "Ungültige Angaben."}`,
      );
    }
  });
  return { positions, errors };
}
