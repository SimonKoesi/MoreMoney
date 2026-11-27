export type MerchantInput = { title: string; payee: string; originalPurpose?: string; kind: string };
const catalog = [
  ["REWE", "Lebensmittel", "rewe|rewe markt"],
  ["EDEKA", "Lebensmittel", "edeka"],
  ["Lidl", "Lebensmittel", "lidl"],
  ["ALDI Nord", "Lebensmittel", "aldi nord"],
  ["ALDI Süd", "Lebensmittel", "aldi sued|aldi sud"],
  ["Kaufland", "Lebensmittel", "kaufland"],
  ["Netto", "Lebensmittel", "netto marken discount|netto supermarkt"],
  ["Penny", "Lebensmittel", "penny markt"],
  ["tegut", "Lebensmittel", "tegut"],
  ["dm", "Drogerie", "dm drogerie markt|dm drogeriemarkt"],
  ["Rossmann", "Drogerie", "rossmann"],
  ["Müller", "Drogerie", "muller drogerie|mueller drogerie"],
  ["Amazon Prime", "Abonnements", "amazon prime|amzn prime"],
  ["Amazon", "Shopping", "amazon|amzn mktp|amzn marketplace"],
  ["eBay", "Shopping", "ebay"],
  ["Zalando", "Shopping", "zalando"],
  ["OTTO", "Shopping", "otto versand|otto de"],
  ["Temu", "Shopping", "temu"],
  ["IKEA", "Shopping", "ikea"],
  ["MediaMarkt", "Shopping", "mediamarkt|media markt"],
  ["Saturn", "Shopping", "saturn electro|saturn markt|saturn de"],
  ["Shell", "Mobilität", "shell"],
  ["Aral", "Mobilität", "aral"],
  ["Esso", "Mobilität", "esso"],
  ["TotalEnergies", "Mobilität", "totalenergies|total energies"],
  ["Deutsche Bahn", "Mobilität", "deutsche bahn|db vertrieb|db fernverkehr"],
  ["FlixBus", "Mobilität", "flixbus"],
  ["Uber", "Mobilität", "uber trip|uber bv|uber payments"],
  ["Bolt", "Mobilität", "bolt eu|bolt rides"],
  ["ADAC", "Mobilität", "adac"],
  ["Netflix", "Abonnements", "netflix com|netflix"],
  ["Spotify", "Abonnements", "spotify"],
  ["Apple", "Digitale Dienste", "apple com bill|apple services|apple store"],
  ["Google", "Digitale Dienste", "google play|google storage|google workspace"],
  ["Microsoft", "Digitale Dienste", "microsoft"],
  ["Disney+", "Abonnements", "disney plus|disneyplus|disney+"],
  ["YouTube", "Abonnements", "youtube premium|youtube"],
  ["OpenAI", "Abonnements", "openai|chatgpt subscription"],
  ["Adobe", "Abonnements", "adobe"],
  ["McDonald's", "Gastronomie", "mcdonalds|mc donalds|mc donald s"],
  ["Burger King", "Gastronomie", "burger king"],
  ["Subway", "Gastronomie", "subway"],
  ["Starbucks", "Gastronomie", "starbucks"],
  ["Lieferando", "Gastronomie", "lieferando"],
  ["Wolt", "Gastronomie", "wolt"],
  ["Telekom", "Telekommunikation", "deutsche telekom|telekom deutschland"],
  ["Vodafone", "Telekommunikation", "vodafone"],
  ["O2", "Telekommunikation", "o2 germany|telefonica germany|o2 mobilfunk"],
  ["1&1", "Telekommunikation", "1&1|1und1|1 und 1"],
  ["congstar", "Telekommunikation", "congstar"],
  ["freenet", "Telekommunikation", "freenet"],
  ["Trade Republic", "Investitionen", "trade republic"],
  ["Scalable Capital", "Investitionen", "scalable capital"],
] as const;

const processors = [
  ["paypal", "PayPal"], ["klarna", "Klarna"], ["stripe", "Stripe"],
  ["sumup", "SumUp"], ["adyen", "Adyen"], ["mollie", "Mollie"],
  ["worldline", "Worldline"], ["unzer", "Unzer"], ["apple pay", "Apple Pay"], ["google pay", "Google Pay"],
] as const;

export function merchantText(value: string) {
  return value.toLowerCase().replaceAll("ß", "ss").normalize("NFKD").replace(/\p{M}/gu, "")
    .replace(/['’]/g, "").replace(/[^\p{L}\p{N}&+]+/gu, " ").trim()
    .replace(/\b(?:pos|terminal|filiale?|mandatsreferenz|kartenreferenz)\s+\d+\b/g, "")
    .replace(/\b(?:gmbh|mbh|ag|kg|ltd)\b/g, "").replace(/\s+/g, " ").trim();
}

function merchantParts(input: MerchantInput) {
  const fields = [input.payee, input.title, input.originalPurpose ?? ""].map(merchantText).filter(Boolean);
  const processor = processors.find(([prefix]) => fields.some(value => starts(value, prefix)));
  return {
    processor: processor?.[1] ?? "",
    fields: [...new Set(fields.map(value => processor && starts(value, processor[0]) ? value.slice(processor[0].length).trim() : value).filter(Boolean))],
  };
}

function starts(value: string, prefix: string) {
  return value === prefix || value.startsWith(prefix + " ");
}

export function merchantSignature(input: MerchantInput) {
  const { fields, processor } = merchantParts(input);
  const name = fields[0];
  if (!name || name.length < 3 || name.length > 160 || /^(?:bankbuchung|kartenzahlung|zahlung|beleg|überweisung|uberweisung)(?: |$)/.test(name)) return "";
  return [processor, name].join("|");
}

export type Merchant = { name: string; category: string; processor: string; score: number; method: "alias" | "suggestion" | "manual" | "rule" | "unknown"; logo?: string };

const aliases = catalog.flatMap(([name, category, values]) => values.split("|").map(alias => ({ name, category, alias })));

export function recognizeMerchant(input: MerchantInput): Merchant {
  const { processor, fields } = merchantParts(input);
  const unknown: Merchant = {name: "", category: "", processor, score: 0, method: "unknown"};
  if (input.kind !== "expense" || !fields.length) return unknown;
  const matches = new Map<string, {name: string; category: string; score: number}>();
  for (const field of fields) {
    const possible = aliases.filter(({ alias }) => starts(field, alias));
    const maxLength = Math.max(0, ...possible.map(({alias}) => alias.length));
    for (const { name, category, alias } of possible) {
      if (alias.length !== maxLength) continue;
      const score = field === alias ? 100 : 95;
      if (score > (matches.get(name)?.score ?? 0)) matches.set(name, { name, category, score });
    }
  }
  // A generic Amazon field may accompany a more specific Amazon Prime purpose.
  if (matches.has("Amazon Prime")) matches.delete("Amazon");
  if (matches.size > 1) return { ...unknown, score: 65, method: "suggestion" };
  const match = [...matches.values()][0];
  if (match) return { ...match, processor, method: "alias" };
  const firstWord = fields[0].split(" ")[0];
  const near = aliases.filter(({alias}) => alias.length >= 6 && alias.length === firstWord.length &&
    [...alias].filter((char, index) => char !== firstWord[index]).length === 1);
  if (new Set(near.map(candidate => candidate.name)).size !== 1) return unknown;
  return { name: near[0].name, category: near[0].category, processor, score: 70, method: "suggestion" };
}
