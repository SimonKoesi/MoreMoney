import { randomBytes } from "node:crypto";
import { readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { addDays, berlinDay } from "./calendar";
import { db, dataDir } from "./db";
import {
  BankingError,
  bankingId,
  enableBanking,
  parseReturn,
  redirectUri,
  type BankingConfig,
  type RemoteAccount,
  type RemoteMovement,
} from "./enable-banking";
import { decrypt, encrypt } from "./local-security";

type Config = BankingConfig & { environment: "PRODUCTION" | "SANDBOX" };
type Pending = {
  nonce: string;
  bank: string;
  country: string;
  expires: number;
  url: string;
};
type Grant = {
  sessionId: string;
  expires: string;
  bank: string;
  country: string;
};
type Candidate = Grant & { accounts: RemoteAccount[] };
type Link = Grant & {
  id: string;
  account: RemoteAccount;
  lastSync: string;
  balanceCents: number;
  transactionCount: number;
  failures?: number;
  retryAt?: number;
  history?: { at: string; success: boolean }[];
};
type Store = {
  config?: Config;
  pending?: Pending;
  candidate?: Candidate;
  links: Link[];
  automaticSync?: boolean;
};
const filename = () => path.join(dataDir, "open-banking.enc");
const serialization = globalThis as typeof globalThis & {
  moreMoneyBankQueue?: Promise<unknown>;
};
const minutes = 60_000;
const automaticInterval = 6 * 60 * minutes;

function read(): Store {
  try {
    return JSON.parse(
      decrypt(readFileSync(filename())).toString("utf8"),
    ) as Store;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      return { links: [] };
    throw new BankingError(
      "Die verschlüsselte Bankkonfiguration konnte nicht geöffnet werden.",
      503,
    );
  }
}

function write(state: Store) {
  const target = filename(),
    temp = target + "." + crypto.randomUUID();
  try {
    writeFileSync(temp, encrypt(Buffer.from(JSON.stringify(state))), {
      flag: "wx",
      mode: 0o600,
    });
    renameSync(temp, target);
  } finally {
    rmSync(temp, { force: true });
  }
}

export function bankingLock<T>(action: () => Promise<T>): Promise<T> {
  const run = (serialization.moreMoneyBankQueue || Promise.resolve()).then(
    action,
  );
  serialization.moreMoneyBankQueue = run.catch(() => undefined);
  return run;
}

export function managedBankAccount(accountId: string) {
  const state = read();
  return (
    state.config?.environment === "PRODUCTION" &&
    state.links.some((link) => link.id === accountId)
  );
}
export function assertManualBankAccount(id: string) {
  if (managedBankAccount(id))
    throw new Error(
      "Dieses Onlinekonto wird von der Bank synchronisiert. Für manuelle Buchungen ein lokales Konto wählen.",
    );
}

export function openBankingState() {
  const state = read();
  const { config, candidate, pending } = state;
  return {
    configured: Boolean(config),
    automaticSync: state.automaticSync === true,
    environment: config?.environment || null,
    pending:
      pending && pending.expires > Date.now()
        ? { bank: pending.bank, url: pending.url }
        : null,
    candidate: candidate
      ? {
          bank: candidate.bank,
          expired: Date.parse(candidate.expires) <= Date.now(),
          accounts: candidate.accounts.map(
            ({ uid, name, type, currency, maskedIban }) => ({
              uid,
              name,
              type,
              currency,
              maskedIban,
            }),
          ),
        }
      : null,
    links: state.links.map(
      ({
        id,
        bank,
        account,
        expires,
        lastSync,
        balanceCents,
        transactionCount,
        failures,
        history,
      }) => ({
        id,
        bank,
        name: account.name,
        maskedIban: account.maskedIban,
        currency: account.currency,
        expires,
        lastSync,
        balanceCents,
        transactionCount,
        expired: Date.parse(expires) <= Date.now(),
        stale:
          Boolean(failures) ||
          Date.now() - Date.parse(lastSync) > 24 * 60 * minutes,
        history: history ?? [],
      }),
    ),
  };
}

export function setAutomaticBankSync(enabled: boolean) {
  const state = read();
  configured(state);
  write({ ...state, automaticSync: enabled });
}

export async function configureBanking(input: BankingConfig) {
  const state = read();
  if (state.links.length || state.candidate)
    throw new BankingError(
      "Vor einem Anbieterwechsel bestehende Bankfreigaben trennen.",
    );
  const config = {
    ...input,
    redirect: redirectUri(input.redirect),
    privateKey: input.privateKey.trim(),
  };
  let adapter;
  try {
    adapter = enableBanking(config);
  } catch {
    throw new BankingError(
      "Private RSA-PEM-Datei der Anbieteranwendung wählen.",
    );
  }
  const environment = await adapter.verify();
  write({ links: [], config: { ...config, environment } });
}

function configured(state: Store) {
  if (!state.config)
    throw new BankingError("Zuerst Enable Banking einrichten.", 409);
  return state.config;
}

export async function listBanks(country: string) {
  return enableBanking(configured(read())).institutions(country);
}

export async function startBanking(country: string, name: string) {
  const state = read(),
    provider = enableBanking(configured(state));
  if (state.candidate)
    throw new BankingError(
      "Offene Kontoauswahl zuerst abschließen oder abbrechen.",
      409,
    );
  if (state.pending && state.pending.expires > Date.now())
    throw new BankingError(
      "Laufende Bankfreigabe zuerst abschließen oder abbrechen.",
      409,
    );
  const banks = await provider.institutions(country);
  const bank = banks.find(
    (item) => item.country === country && item.name === name,
  );
  if (!bank)
    throw new BankingError(
      "Diese Bank ist für die Anbieteranwendung nicht verfügbar.",
    );
  const nonce = randomBytes(32).toString("base64url");
  const url = await provider.start(bank, nonce);
  write({
    ...state,
    pending: {
      nonce,
      bank: name,
      country,
      expires: Date.now() + 15 * minutes,
      url,
    },
  });
}

export async function finishBanking(callback: string) {
  const state = read(),
    config = configured(state),
    pending = state.pending;
  if (!pending || pending.expires <= Date.now())
    throw new BankingError("Bankfreigabe ist abgelaufen. Bitte neu starten.");
  const code = parseReturn(callback, config.redirect, pending.nonce);
  const provider = enableBanking(config);
  const session = await provider.authorize(code, pending.bank);
  write({
    ...state,
    pending: undefined,
    candidate: { ...session, bank: pending.bank, country: pending.country },
  });
}

export async function cancelBanking() {
  const state = read();
  if (state.candidate)
    await enableBanking(configured(state)).revoke(state.candidate.sessionId);
  write({ ...state, pending: undefined, candidate: undefined });
}

export async function removeBankingConfig() {
  const state = read();
  if (state.links.length || state.candidate)
    throw new BankingError("Bankfreigaben zuerst trennen.");
  rmSync(filename(), { force: true });
}

type DatabaseMovement = RemoteMovement & {
  accountId: string;
  currency: string;
};
const source = "enable-banking";

export function startingBankBalance(
  balanceCents: number,
  rows: { kind: string; amountCents: number }[],
) {
  const movement = rows.reduce(
    (sum, row) =>
      sum +
      (["income", "transfer-in"].includes(row.kind)
        ? row.amountCents
        : -row.amountCents),
    0,
  );
  const opening = balanceCents - movement;
  if (!Number.isSafeInteger(opening) || Math.abs(opening) > 2_000_000_000)
    throw new BankingError(
      "Der Kontostand liegt außerhalb des unterstützten Betragsbereichs.",
    );
  return opening;
}

async function saveBankRows(
  id: string,
  account: RemoteAccount,
  balanceCents: number,
  rows: RemoteMovement[],
  includeInWorth: boolean,
) {
  await db.$transaction(
    async (tx) => {
      const existing = await tx.account.findUnique({ where: { id } });
      if (existing && existing.currency !== account.currency)
        throw new BankingError(
          "Die Währung des verknüpften Kontos hat sich geändert.",
        );
      if (
        existing &&
        (await tx.transaction.count({
          where: { accountId: id, source: { not: source } },
        }))
      )
        throw new BankingError(
          "Das frühere Onlinekonto enthält lokale Buchungen. Zur Vermeidung von Doppelbuchungen kann es nicht erneut verbunden werden.",
        );
      if (!existing)
        await tx.account.create({
          data: {
            id,
            name: account.name,
            type: account.type,
            currency: account.currency,
            maskedIban: account.maskedIban,
            includeInWorth,
          },
        });
      for (let index = 0; index < rows.length; index += 100) {
        const chunk = rows.slice(index, index + 100);
        const saved = await tx.transaction.findMany({
          where: {
            accountId: id,
            bankExternalId: { in: chunk.map((row) => row.externalId) },
          },
          select: { bankExternalId: true },
        });
        const ids = new Set(saved.map((row) => row.bankExternalId));
        const additions = chunk
          .filter((row) => !ids.has(row.externalId))
          .map((row) => {
            const { externalId, ...rest }: DatabaseMovement = {
              ...row,
              accountId: id,
              currency: account.currency,
            };
            return {
              ...rest,
              requestId: crypto.randomUUID(),
              bankExternalId: externalId,
              source,
            };
          });
        if (additions.length)
          await tx.transaction.createMany({ data: additions });
      }
      const grouped = await tx.transaction.groupBy({
        by: ["kind"],
        where: { accountId: id, bookingStatus: "booked" },
        _sum: { amountCents: true },
      });
      const openingCents = startingBankBalance(
        balanceCents,
        grouped.map((row) => ({
          kind: row.kind,
          amountCents: row._sum.amountCents || 0,
        })),
      );
      await tx.account.update({
        where: { id },
        data: { openingCents, maskedIban: account.maskedIban },
      });
    },
    { timeout: 60_000 },
  );
}

async function syncAccount(
  config: Config,
  grant: Grant,
  account: RemoteAccount,
  previous?: Link,
  includeInWorth = false,
) {
  if (Date.parse(grant.expires) <= Date.now())
    throw new BankingError(
      "Bankfreigabe abgelaufen. Konto erneut verbinden.",
      409,
    );
  const today = berlinDay(),
    dayOfLastSync = previous ? berlinDay(new Date(previous.lastSync)) : today;
  const from = previous
    ? [addDays(today, -89), addDays(dayOfLastSync, -7)].sort().at(-1)!
    : addDays(today, -89);
  const result = await enableBanking(config).movements(account, from, today);
  const id = bankingId(
    "moremoney:enable:" +
      config.environment +
      ":" +
      account.identity +
      ":" +
      account.currency,
  );
  if (config.environment === "PRODUCTION")
    await saveBankRows(
      id,
      account,
      result.balanceCents,
      result.entries,
      includeInWorth,
    );
  return {
    ...grant,
    id,
    account,
    lastSync: new Date().toISOString(),
    balanceCents: result.balanceCents,
    transactionCount: result.entries.length,
    history: [
      { at: new Date().toISOString(), success: true },
      ...(previous?.history ?? []),
    ].slice(0, 5),
  };
}

export async function selectBankAccount(uid: string, includeInWorth: boolean) {
  const state = read(),
    config = configured(state),
    candidate = state.candidate;
  const account = candidate?.accounts.find((item) => item.uid === uid);
  if (!candidate || !account)
    throw new BankingError("Ein freigegebenes Konto auswählen.");
  const old = state.links.find(
    (item) =>
      item.account.identity === account.identity &&
      item.account.currency === account.currency,
  );
  if (old && Date.parse(old.expires) > Date.now())
    throw new BankingError(
      "Dieses Konto ist bereits verbunden. Die neue Freigabe abbrechen oder die bisherige Verbindung zuerst trennen.",
    );
  const { sessionId, expires, bank, country } = candidate;
  const link = await syncAccount(
    config,
    { sessionId, expires, bank, country },
    account,
    old,
    includeInWorth,
  );
  write({
    ...state,
    candidate: undefined,
    links: [...state.links.filter((item) => item.id !== link.id), link],
  });
}

export async function updateBankAccount(id: string) {
  const state = read(),
    config = configured(state),
    stored = state.links.find((link) => link.id === id);
  if (!stored) throw new BankingError("Bankverbindung nicht gefunden.");
  if (
    Date.now() < (stored.retryAt ?? 0) ||
    Date.now() - Date.parse(stored.lastSync) < minutes
  )
    throw new BankingError(
      "Abrufpause aktiv. Bitte später erneut versuchen.",
      429,
    );
  if (Date.parse(stored.expires) <= Date.now())
    throw new BankingError(
      "Bankfreigabe abgelaufen. Konto erneut verbinden.",
      409,
    );
  const { sessionId, expires, bank, country, account } = stored;
  let next: Link;
  try {
    next = await syncAccount(
      config,
      { sessionId, expires, bank, country },
      account,
      stored,
    );
  } catch (error) {
    const failures = (stored.failures ?? 0) + 1;
    const failed: Link = {
      ...stored,
      failures,
      retryAt: Date.now() + Math.min(60, 2 ** Math.min(6, failures)) * minutes,
      history: [
        { at: new Date().toISOString(), success: false },
        ...(stored.history ?? []),
      ].slice(0, 5),
    };
    write({
      ...state,
      links: state.links.map((link) => (link.id === id ? failed : link)),
    });
    throw error;
  }
  write({
    ...state,
    links: state.links.map((link) => (link.id === id ? next : link)),
  });
}

export async function syncDueBankAccount() {
  const state = read();
  if (!state.config || !state.automaticSync) return false;
  const now = Date.now();
  const due = state.links
    .filter(
      (link) =>
        Date.parse(link.expires) > now &&
        (link.retryAt ?? 0) <= now &&
        now - Date.parse(link.lastSync) >= automaticInterval,
    )
    .sort((a, b) =>
      (a.history?.[0]?.at ?? a.lastSync).localeCompare(
        b.history?.[0]?.at ?? b.lastSync,
      ),
    )[0];
  if (!due) return false;
  try {
    await updateBankAccount(due.id);
  } catch {
    // The link keeps its last valid balance and records an unsuccessful attempt.
  }
  return true;
}

export async function disconnectBankAccount(id: string) {
  const state = read(),
    link = state.links.find((item) => item.id === id);
  if (!link) return;
  await enableBanking(configured(state)).revoke(link.sessionId);
  write({ ...state, links: state.links.filter((item) => item.id !== id) });
}

export async function eraseBankCredentials() {
  await bankingLock(async () => {
    const state = read();
    if (state.config) {
      const provider = enableBanking(state.config);
      for (const session of [
        ...state.links,
        ...(state.candidate ? [state.candidate] : []),
      ])
        await provider.revoke(session.sessionId).catch(() => undefined);
    }
    rmSync(filename(), { force: true });
  });
}
