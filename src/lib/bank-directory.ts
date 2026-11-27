export const bundesbankPage =
  "https://www.bundesbank.de/de/aufgaben/unbarer-zahlungsverkehr/serviceangebot/bankleitzahlen/download-bankleitzahlen-602592";

export type DirectoryBank = {
  id: string;
  name: string;
  group: string;
  blz: string;
  bic: string;
  city: string;
  postCode: string;
  alias: string;
};

export function institutionKey(value: string) {
  return value
    .toLocaleLowerCase("de")
    .replaceAll("ß", "ss")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function bankGroup(value: string) {
  const name = institutionKey(value);
  if (/sparkasse/.test(name)) return "Sparkasse";
  if (/volksbank|raiffeisen|\bvr bank\b/.test(name)) return "VR-Bank";
  if (/sparda/.test(name)) return "Sparda-Bank";
  if (/\bpsd\b/.test(name)) return "PSD-Bank";
  return "";
}

export function parseBankDirectory(text: string): DirectoryBank[] {
  const banks = new Map<string, DirectoryBank>();
  for (const line of text.split(/\r?\n/)) {
    if (!line) continue;
    const blz = line.slice(0, 8),
      id = line.slice(152, 158);
    if (
      !/^\d{8}$/.test(blz) ||
      !/^\d{6}$/.test(id) ||
      ![168, 174].includes(line.length) ||
      !/^[12]$/.test(line[8])
    ) {
      throw new Error("Das Bundesbank-Dateiformat hat sich geändert.");
    }
    if (line[158] === "D") continue;
    const name = line.slice(9, 67).trim();
    banks.set(id, {
      id,
      blz,
      name,
      group: bankGroup(name),
      postCode: line.slice(67, 72),
      city: line.slice(72, 107).trim(),
      alias: line.slice(107, 134).trim(),
      bic: line.slice(139, 150).trim(),
    });
  }
  if (!banks.size) throw new Error("Das Bankenverzeichnis ist leer.");
  return [...banks.values()];
}

export function currentDirectoryUrl(html: string) {
  const path = html.match(
    /href="(\/resource\/blob\/[\w/-]+\/blz-aktuell-txt-data\.txt)"/i,
  )?.[1];
  if (!path) throw new Error("Aktuelle Bankleitzahlendatei nicht gefunden.");
  return new URL(path, bundesbankPage).href;
}

function almostMatches(a: string, b: string) {
  if (a.length < 5 || Math.abs(a.length - b.length) > 1) return false;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  let i = 0;
  while (i < short.length && short[i] === long[i]) i++;
  return (
    short.slice(i + (short.length === long.length ? 1 : 0)) ===
    long.slice(i + 1)
  );
}

export function searchBankDirectory(query: string, banks: DirectoryBank[]) {
  const normalized = institutionKey(query);
  if (normalized.length < 2) return [];
  const words = normalized.split(" ");
  return banks
    .flatMap((bank) => {
      const value = institutionKey(
        [
          bank.name,
          bank.alias,
          bank.city,
          bank.bic,
          bank.blz,
          bank.postCode,
          bank.group,
        ].join(" "),
      );
      const rank =
        normalized === bank.blz || normalized === bank.bic.toLowerCase()
          ? 0
          : words.every((word) => value.includes(word))
            ? 1
            : words.every(
                  (word) =>
                    value.includes(word) ||
                    value
                      .split(" ")
                      .some((candidate) => almostMatches(word, candidate)),
                )
              ? 2
              : -1;
      return rank < 0 ? [] : [{ bank, rank }];
    })
    .sort(
      (a, b) => a.rank - b.rank || a.bank.name.localeCompare(b.bank.name, "de"),
    )
    .slice(0, 40)
    .map(({ bank }) => bank);
}

export function providerMatch(
  bank: DirectoryBank,
  options: { name: string; bic?: string | null }[],
) {
  const exact = options.filter(
    (option) => institutionKey(option.name) === institutionKey(bank.name),
  );
  if (exact.length === 1) return exact[0].name;
  if (!bank.bic) return null;
  const byBic = options.filter(
    (option) =>
      option.bic?.replace(/XXX$/, "") === bank.bic.replace(/XXX$/, ""),
  );
  return byBic.length === 1 ? byBic[0].name : null;
}
