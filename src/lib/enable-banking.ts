import { createHash, createPrivateKey, sign } from "node:crypto";
import { z } from "zod";
import { validDay } from "./calendar";
import { cents } from "./finance";

const uuid = z.string().uuid();
const currency = z.string().regex(/^[A-Z]{3}$/);
const money = z.object({ amount: z.string(), currency });
export type BankingConfig = {
  applicationId: string;
  privateKey: string;
  redirect: string;
};
const institutionSchema = z.object({
  name: z.string().min(1).max(160),
  country: z.string().length(2),
  bic: z.string().max(11).nullish(),
  maximum_consent_validity: z.number().int().positive(),
  psu_types: z.array(z.string()).nullish(),
});
export type Institution = z.infer<typeof institutionSchema>;
const accountSchema = z.object({
  uid: uuid.nullish(),
  identification_hash: z.string().min(1).max(600).nullish(),
  account_id: z.object({ iban: z.string().nullish() }).nullish(),
  product: z.string().max(160).nullish(),
  cash_account_type: z.string(),
  currency,
});
export type RemoteAccount = {
  uid: string;
  identity: string;
  name: string;
  type: string;
  currency: string;
  maskedIban: string;
};
const rawTransaction = z.object({
  entry_reference: z.string().max(500).nullish(),
  transaction_amount: money,
  credit_debit_indicator: z.enum(["CRDT", "DBIT"]),
  status: z.string(),
  booking_date: z.string().nullish(),
  transaction_date: z.string().nullish(),
  value_date: z.string().nullish(),
  creditor: z.object({ name: z.string().nullish() }).nullish(),
  debtor: z.object({ name: z.string().nullish() }).nullish(),
  remittance_information: z.array(z.string()).nullish(),
});
export type RemoteMovement = {
  externalId: string;
  date: string;
  valueDate: string;
  amountCents: number;
  kind: "income" | "expense";
  title: string;
  payee: string;
  originalPurpose: string;
};
export class BankingError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}
export const digestBank = (input: string) =>
  createHash("sha256").update(input).digest("hex");
export function bankingId(input: string) {
  const h = digestBank(input);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

export function redirectUri(value: string) {
  try {
    const url = new URL(value.trim());
    if (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    )
      return url.href;
  } catch {
    /* validation reported below */
  }
  throw new BankingError(
    "Eine registrierte HTTPS-Rücksprungadresse ohne Parameter eingeben.",
  );
}

export function parseReturn(value: string, expected: string, nonce: string) {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new BankingError(
      "Vollständige Rücksprungadresse aus dem Browser einfügen.",
    );
  }
  if (
    url.origin + url.pathname !== expected ||
    url.username ||
    url.password ||
    url.hash ||
    url.searchParams.getAll("state").length !== 1 ||
    url.searchParams.get("state") !== nonce
  )
    throw new BankingError(
      "Diese Rücksprungadresse gehört zu keiner laufenden Bankfreigabe.",
    );
  if (url.searchParams.has("error"))
    throw new BankingError(
      "Die Bankfreigabe wurde abgebrochen oder abgelehnt.",
    );
  const code = url.searchParams.get("code");
  if (
    url.searchParams.getAll("code").length !== 1 ||
    !code ||
    code.length > 4000
  )
    throw new BankingError(
      "Die Bank hat keinen gültigen Freigabecode zurückgegeben.",
    );
  return code;
}

export function enableBanking(
  config: BankingConfig,
  transport: typeof fetch = fetch,
) {
  const key = createPrivateKey(config.privateKey);
  if (
    key.asymmetricKeyType !== "rsa" ||
    (key.asymmetricKeyDetails?.modulusLength || 0) < 2048
  )
    throw new BankingError(
      "Private RSA-PEM-Datei der Anbieteranwendung wählen.",
    );
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  let token = "",
    expires = 0;
  function authorization() {
    const now = Math.floor(Date.now() / 1000);
    if (now < expires - 30) return token;
    expires = now + 300;
    const unsigned =
      encode({ typ: "JWT", alg: "RS256", kid: config.applicationId }) +
      "." +
      encode({
        iss: "enablebanking.com",
        aud: "api.enablebanking.com",
        iat: now,
        exp: expires,
      });
    token =
      "Bearer " +
      unsigned +
      "." +
      sign("RSA-SHA256", Buffer.from(unsigned), key).toString("base64url");
    return token;
  }
  async function request(path: string, method = "GET", body?: unknown) {
    let response: Response;
    try {
      response = await transport("https://api.enablebanking.com" + path, {
        method,
        headers: {
          Authorization: authorization(),
          Accept: "application/json",
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
        redirect: "error",
      });
    } catch {
      throw new BankingError(
        "Enable Banking ist momentan nicht erreichbar.",
        503,
      );
    }
    if (method === "DELETE" && (response.ok || response.status === 404))
      return null;
    if (response.status === 429)
      throw new BankingError(
        "Der Anbieter begrenzt Abrufe. Bitte später erneut versuchen.",
        429,
      );
    if ([401, 403].includes(response.status))
      throw new BankingError("Anbieterzugang oder Bankfreigabe prüfen.", 403);
    if (!response.ok)
      throw new BankingError(
        "Der Anbieter konnte den Vorgang nicht abschließen. Bankfreigabe und Rücksprungadresse prüfen.",
        502,
      );
    return response.json();
  }
  return {
    async verify() {
      const app = z
        .object({
          kid: uuid,
          active: z.boolean(),
          environment: z.enum(["PRODUCTION", "SANDBOX"]),
          redirect_urls: z.array(z.string()),
          services: z.array(z.string()),
        })
        .parse(await request("/application"));
      if (
        app.kid.toLowerCase() !== config.applicationId.toLowerCase() ||
        !app.active ||
        !app.services.includes("AIS")
      )
        throw new BankingError(
          "Die Anbieteranwendung muss aktiv sein und Kontoinformationen unterstützen.",
        );
      if (
        !app.redirect_urls.some((url) => {
          try {
            return redirectUri(url) === config.redirect;
          } catch {
            return false;
          }
        })
      )
        throw new BankingError(
          "Die HTTPS-Rücksprungadresse ist im Anbieterportal noch nicht hinterlegt.",
        );
      return app.environment;
    },
    async institutions(country: string) {
      const query = new URLSearchParams({
        country,
        psu_type: "personal",
        service: "AIS",
      });
      const result = z
        .object({ aspsps: z.array(z.unknown()) })
        .parse(await request("/aspsps?" + query));
      return result.aspsps.flatMap((row) => {
        const parsed = institutionSchema.safeParse(row);
        return parsed.success &&
          (!parsed.data.psu_types?.length ||
            parsed.data.psu_types.includes("personal"))
          ? [parsed.data]
          : [];
      });
    },
    async start(bank: Institution, state: string) {
      const validUntil = new Date(
        Date.now() +
          Math.min(bank.maximum_consent_validity, 90 * 86400) * 1000 -
          3000,
      ).toISOString();
      const response = z
        .object({ url: z.string().url() })
        .parse(
          await request("/auth", "POST", {
            access: {
              balances: true,
              transactions: true,
              transactions_extended_history: false,
              valid_until: validUntil,
            },
            aspsp: { name: bank.name, country: bank.country },
            psu_type: "personal",
            redirect_url: config.redirect,
            state,
            language: "de",
          }),
        );
      const url = new URL(response.url);
      if (
        url.protocol !== "https:" ||
        !url.hostname.endsWith(".enablebanking.com") ||
        url.username ||
        url.password ||
        url.port
      )
        throw new BankingError(
          "Die Freigabeadresse des Anbieters konnte nicht verifiziert werden.",
          502,
        );
      return url.href;
    },
    async authorize(code: string, bank: string) {
      const session = z
        .object({
          session_id: uuid,
          access: z.object({
            valid_until: z
              .string()
              .refine((v) => Number.isFinite(Date.parse(v))),
          }),
          accounts: z.array(z.unknown()),
        })
        .parse(await request("/sessions", "POST", { code }));
      const accounts: RemoteAccount[] = session.accounts.flatMap((row) => {
        const result = accountSchema.safeParse(row);
        if (!result.success) return [];
        const a = result.data,
          iban = a.account_id?.iban?.replace(/\s/g, "").toUpperCase();
        const source = iban || a.identification_hash;
        if (!a.uid || !source) return [];
        return [
          {
            uid: a.uid,
            identity: digestBank(source),
            name: a.product || bank,
            type: a.cash_account_type === "SVGS" ? "Sparkonto" : "Girokonto",
            currency: a.currency,
            maskedIban: iban
              ? iban.slice(0, 2) + " •••• " + iban.slice(-4)
              : "",
          },
        ];
      });
      return {
        sessionId: session.session_id,
        expires: session.access.valid_until,
        accounts,
      };
    },
    async revoke(sessionId: string) {
      await request("/sessions/" + encodeURIComponent(sessionId), "DELETE");
    },
    async movements(account: RemoteAccount, from: string, to: string) {
      const base = "/accounts/" + encodeURIComponent(account.uid);
      const entries: RemoteMovement[] = [];
      const seen = new Map<string, number>();
      const usableReferences = new Set<string>(),
        pages = new Set<string>();
      let cursor = "";
      do {
        if (pages.size >= 30 || pages.has(cursor))
          throw new BankingError(
            "Die Bank liefert zu viele oder wiederholte Ergebnisseiten.",
          );
        pages.add(cursor);
        const query = new URLSearchParams({
          date_from: from,
          date_to: to,
          transaction_status: "BOOK",
        });
        if (cursor) query.set("continuation_key", cursor);
        const response = z
          .object({
            transactions: z.array(rawTransaction),
            continuation_key: z.string().max(6000).nullish(),
          })
          .parse(await request(base + "/transactions?" + query));
        for (const t of response.transactions) {
          if (t.status !== "BOOK") continue;
          const date = t.booking_date || t.transaction_date || "";
          if (
            !validDay(date) ||
            t.transaction_amount.currency !== account.currency
          )
            throw new BankingError(
              "Die Bank liefert eine Buchung mit unbekanntem Datum oder abweichender Währung.",
            );
          if (date < from || date > to) continue;
          const amountCents = Math.abs(cents(t.transaction_amount.amount));
          if (!amountCents) continue;
          const kind =
            t.credit_debit_indicator === "CRDT" ? "income" : "expense";
          const payee = (
            (kind === "income" ? t.debtor?.name : t.creditor?.name) || ""
          )
            .trim()
            .slice(0, 160);
          const title = (
            t.remittance_information?.join(" ").trim() ||
            payee ||
            "Bankbuchung"
          ).slice(0, 160);
          const valueDate =
            t.value_date && validDay(t.value_date) ? t.value_date : "";
          const reference = t.entry_reference?.trim();
          const stable =
            reference && !/^(NONREF|NOTPROVIDED|NOTAVAILABLE)$/i.test(reference)
              ? digestBank(reference)
              : null;
          const fingerprint = digestBank(
            JSON.stringify([date, kind, amountCents, payee, title]),
          );
          if (stable) {
            if (usableReferences.has(stable)) continue;
            usableReferences.add(stable);
          }
          const occurrence = (seen.get(fingerprint) || 0) + 1;
          seen.set(fingerprint, occurrence);
          entries.push({
            externalId: stable
              ? "enable:ref:" + stable
              : "enable:row:" + fingerprint + ":" + occurrence,
            date,
            valueDate,
            amountCents,
            kind,
            title,
            payee,
            originalPurpose: (t.remittance_information?.join(" ").trim() || "").slice(0, 4000),
          });
          if (entries.length > 5000)
            throw new BankingError(
              "Die Bank liefert mehr als 5.000 Buchungen im Abruf.",
            );
        }
        cursor = response.continuation_key || "";
      } while (cursor);
      const balance = z
        .object({
          balances: z.array(
            z.object({
              balance_type: z.string(),
              balance_amount: money,
              reference_date: z.string().nullish(),
            }),
          ),
        })
        .parse(await request(base + "/balances"));
      const booked = balance.balances
        .filter(
          (row) =>
            ["ITBD", "CLBD"].includes(row.balance_type) &&
            row.balance_amount.currency === account.currency,
        )
        .sort(
          (a, b) =>
            (b.reference_date || "").localeCompare(a.reference_date || "") ||
            Number(b.balance_type === "ITBD") -
              Number(a.balance_type === "ITBD"),
        )[0];
      if (!booked)
        throw new BankingError(
          "Die Bank hat keinen gebuchten Kontostand in der Kontowährung geliefert.",
        );
      if (
        booked.reference_date &&
        entries.some((row) => row.date > booked.reference_date!)
      )
        throw new BankingError(
          "Saldo und Buchungen haben unterschiedliche Stände. Bitte später erneut synchronisieren.",
        );
      return { balanceCents: cents(booked.balance_amount.amount), entries };
    },
  };
}
