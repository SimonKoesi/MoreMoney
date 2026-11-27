import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  scrypt as nodeScrypt,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
} from "node:fs";
import path from "node:path";
import { sealData, unsealData } from "iron-session";
import { Secret, TOTP } from "otpauth";
const root = process.env.MOREMONEY_DATA_DIR || process.env.FINOVA_DATA_DIR || path.join(process.cwd(), "data");
const file = () => path.join(root, "security.enc");
export function masterKey() {
  mkdirSync(root, { recursive: true });
  const environment = process.env.MOREMONEY_MASTER_KEY || process.env.FINOVA_MASTER_KEY;
  if (environment) {
    if (!/^[a-f0-9]{64}$/i.test(environment))
      throw new Error("Ungültiger Geräteschlüssel.");
    return Buffer.from(environment, "hex");
  }
  const local = path.join(root, "development.key");
  if (!existsSync(local))
    writeFileSync(local, randomBytes(32), { flag: "wx", mode: 0o600 });
  const key = readFileSync(local);
  if (key.length !== 32) throw new Error("Geräteschlüssel beschädigt.");
  return key;
}
export function encrypt(data: Buffer, key: Buffer = masterKey()) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key, iv);
  const content = Buffer.concat([cipher.update(data), cipher.final()]);
  return Buffer.concat([Buffer.from("MME1"), iv, cipher.getAuthTag(), content]);
}
export function decrypt(data: Buffer, key: Buffer = masterKey()) {
  if (data.subarray(0, 4).toString() !== "MME1" || data.length < 32)
    throw new Error("Verschlüsseltes Format ungültig.");
  const cipher = createDecipheriv("aes-256-gcm", key, data.subarray(4, 16));
  cipher.setAuthTag(data.subarray(16, 32));
  return Buffer.concat([cipher.update(data.subarray(32)), cipher.final()]);
}
export type LocalSession = {
  id: string;
  created: number;
  lastSeen: number;
  expires: number;
};
type Security = {
  salt: string;
  hash: string;
  inactivityMinutes: number;
  sessions: LocalSession[];
  totp?: string;
  pendingTotp?: string;
  lastCounter?: number;
  recovery: string[];
  failures: number[];
  events: { event: string; outcome: string; at: number }[];
};
export function security(): Security | null {
  if (!existsSync(file())) return null;
  return JSON.parse(decrypt(readFileSync(file())).toString("utf8")) as Security;
}
function save(s: Security) {
  const temp = file() + "." + randomBytes(8).toString("hex");
  writeFileSync(temp, encrypt(Buffer.from(JSON.stringify(s))), { mode: 0o600 });
  renameSync(temp, file());
}
function event(s: Security, name: string, outcome: string) {
  s.events = [...s.events, { event: name, outcome, at: Date.now() }].slice(
    -200,
  );
  save(s);
}
const hashCode = (code: string) =>
  createHash("sha256")
    .update(code.replace(/\s|-/g, "").toUpperCase())
    .digest("hex");
async function hashPassword(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) =>
    nodeScrypt(
      password,
      salt,
      64,
      { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 },
      (error, key) => (error ? reject(error) : resolve(key)),
    ),
  );
}
function passwordValid(value: unknown): asserts value is string {
  if (typeof value !== "string" || value.length < 12 || value.length > 256)
    throw new Error("Passphrase mit 12–256 Zeichen wählen.");
}
function rateLimit(s: Security) {
  s.failures = s.failures.filter((t) => Date.now() - t < 15 * 60000);
  if (s.failures.length >= 5)
    throw new Error("Zu viele Versuche. In 15 Minuten erneut versuchen.");
}
function totp(secret: string) {
  return new TOTP({
    issuer: "MoreMoney",
    label: "Lokaler Zugang",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secret),
  });
}
function verifySecond(s: Security, code: string) {
  if (!s.totp) return true;
  const delta = totp(s.totp).validate({ token: code, window: 1 });
  if (delta !== null) {
    const counter = Math.floor(Date.now() / 30000) + delta;
    if (counter <= (s.lastCounter || 0)) return false;
    s.lastCounter = counter;
    return true;
  }
  const index = s.recovery.indexOf(hashCode(code));
  if (index >= 0) {
    s.recovery.splice(index, 1);
    return true;
  }
  return false;
}
function recovery(s: Security) {
  const values = Array.from({ length: 10 }, () =>
    randomBytes(12).toString("hex").toUpperCase(),
  );
  s.recovery = values.map(hashCode);
  return values;
}
export function cookieToken(request: Request) {
  return (
    request.headers
      .get("cookie")
      ?.split(";")
      .map((v) => v.trim())
      .find((v) => v.startsWith("moremoney-session="))
      ?.slice(18) || ""
  );
}
export async function currentSession(request: Request) {
  const s = security();
  if (!s) return { configured: false, session: null, security: null };
  const token = cookieToken(request);
  const data = token
    ? await unsealData<{ id?: string }>(token, {
        password: masterKey().toString("hex"),
      })
    : {};
  const session = s.sessions.find((v) => v.id === data.id);
  const now = Date.now();
  if (
    !session ||
    session.expires <= now ||
    now - session.lastSeen > s.inactivityMinutes * 60000
  )
    return { configured: true, session: null, security: s };
  return { configured: true, session, security: s };
}
export async function allowed(request: Request) {
  const state = await currentSession(request);
  return !state.configured || Boolean(state.session);
}
export async function securityStatus(request: Request) {
  const { session, security: s } = await currentSession(request);
  return {
    configured: Boolean(s),
    locked: Boolean(s && !session),
    inactivityMinutes: s?.inactivityMinutes || 10,
    mfa: Boolean(s?.totp),
    keyProtection:
      (process.env.MOREMONEY_KEY_PROTECTED || process.env.FINOVA_KEY_PROTECTED) === "1"
        ? "Betriebssystem-Schlüsselbund"
        : "Entwicklungsmodus: lokaler Schlüssel",
    sessions: session
      ? s!.sessions
          .filter((v) => v.expires > Date.now())
          .map((v) => ({ ...v, current: v.id === session.id }))
      : [],
    events: session ? s!.events : [],
  };
}
// All security mutations in the single local service share one queue.
const queue = globalThis as typeof globalThis & {
  moreMoneySecurityQueue?: Promise<unknown>;
};
function serializeSecurity<T>(operation: () => Promise<T>): Promise<T> {
  const result = (queue.moreMoneySecurityQueue ?? Promise.resolve()).then(
    operation,
  );
  queue.moreMoneySecurityQueue = result.catch(() => undefined);
  return result;
}
export function securityAction(
  request: Request,
  input: Record<string, unknown>,
) {
  return serializeSecurity(() => applySecurityAction(request, input));
}
async function applySecurityAction(
  request: Request,
  input: Record<string, unknown>,
) {
  const action = String(input.action || "");
  let s = security();
  let codes: string[] | undefined;
  if (action === "setup") {
    if (s) throw new Error("Lokaler Zugang bereits eingerichtet.");
    passwordValid(input.password);
    const salt = randomBytes(24).toString("hex");
    const hash = await hashPassword(input.password, salt);
    if (security()) throw new Error("Zugang wurde bereits eingerichtet.");
    s = {
      salt,
      hash: hash.toString("hex"),
      inactivityMinutes: 10,
      sessions: [],
      recovery: [],
      failures: [],
      events: [],
    };
    codes = recovery(s);
    event(s, "setup", "success");
  } else if (action === "login") {
    if (!s) throw new Error("Zugang noch nicht eingerichtet.");
    rateLimit(s);
    const hash = await hashPassword(
      typeof input.password === "string" ? input.password.slice(0, 256) : "",
      s.salt,
    );
    if (
      !timingSafeEqual(hash, Buffer.from(s.hash, "hex")) ||
      !verifySecond(s, String(input.code || ""))
    ) {
      s.failures.push(Date.now());
      event(s, "login", "denied");
      throw new Error(
        "Anmeldung fehlgeschlagen. Passphrase und gegebenenfalls zweiten Faktor prüfen.",
      );
    }
    s.failures = [];
  } else if (action === "recover") {
    if (!s) throw new Error("Zugang nicht eingerichtet.");
    rateLimit(s);
    const index = s.recovery.indexOf(hashCode(String(input.code || "")));
    if (index < 0) {
      s.failures.push(Date.now());
      event(s, "recovery", "denied");
      throw new Error("Wiederherstellung fehlgeschlagen.");
    }
    passwordValid(input.password);
    s.salt = randomBytes(24).toString("hex");
    s.hash = (await hashPassword(input.password, s.salt)).toString("hex");
    s.totp = undefined;
    s.sessions = [];
    s.failures = [];
    codes = recovery(s);
    event(s, "recovery", "success");
  } else {
    const state = await currentSession(request);
    s = state.security;
    if (!s || !state.session) throw new Error("Bitte entsperren.");
    if (action === "heartbeat") {
      state.session.lastSeen = Date.now();
      s.sessions = s.sessions.map((v) =>
        v.id === state.session!.id ? state.session! : v,
      );
      save(s);
      return {};
    }
    if (action === "lock" || action === "logoutAll") {
      s.sessions =
        action === "logoutAll"
          ? []
          : s.sessions.filter((v) => v.id !== state.session!.id);
      event(s, "logout", "success");
      return { clearCookie: true };
    }
    if (action === "revoke") {
      s.sessions = s.sessions.filter((v) => v.id !== input.id);
      event(s, "session-revoke", "success");
      return {};
    }
    if (action === "inactivity") {
      const minutes = Number(input.minutes);
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > 60)
        throw new Error("Sperrzeit zwischen 1 und 60 Minuten wählen.");
      s.inactivityMinutes = minutes;
      save(s);
      return {};
    }
    if (action === "beginMfa") {
      s.pendingTotp = new Secret({ size: 20 }).base32;
      save(s);
      return { secret: s.pendingTotp, uri: totp(s.pendingTotp).toString() };
    }
    if (action === "confirmMfa") {
      rateLimit(s);
      if (
        !s.pendingTotp ||
        totp(s.pendingTotp).validate({
          token: String(input.code || ""),
          window: 1,
        }) === null
      ) {
        s.failures.push(Date.now());
        event(s, "mfa-enable", "denied");
        throw new Error("Gültigen Authenticator-Code eingeben.");
      }
      s.failures = [];
      s.totp = s.pendingTotp;
      s.pendingTotp = undefined;
      codes = recovery(s);
      event(s, "mfa-enable", "success");
      return { codes };
    }
    if (action === "disableMfa") {
      rateLimit(s);
      const hash = await hashPassword(
        String(input.password || "").slice(0, 256),
        s.salt,
      );
      if (
        !timingSafeEqual(hash, Buffer.from(s.hash, "hex")) ||
        !verifySecond(s, String(input.code || ""))
      ) {
        s.failures.push(Date.now());
        event(s, "mfa-disable", "denied");
        throw new Error("Bestätigung fehlgeschlagen.");
      }
      s.failures = [];
      s.totp = undefined;
      s.pendingTotp = undefined;
      codes = recovery(s);
      event(s, "mfa-disable", "success");
      return { codes };
    }
    throw new Error("Aktion nicht verfügbar.");
  }
  const now = Date.now(),
    session = {
      id: randomBytes(24).toString("hex"),
      created: now,
      lastSeen: now,
      expires: now + 24 * 3600000,
    };
  s.sessions = [
    ...s.sessions.filter((v) => v.expires > now).slice(-9),
    session,
  ];
  event(s, action, "success");
  const token = await sealData(
    { id: session.id },
    { password: masterKey().toString("hex"), ttl: 86400 },
  );
  return { token, codes };
}
export function encryptedBackup(data: Buffer, password: string) {
  passwordValid(password);
  const salt = randomBytes(24),
    keySalt = salt.toString("hex");
  return hashPassword(password, keySalt).then((key) =>
    Buffer.concat([
      Buffer.from("MMBACKUP1"),
      salt,
      encrypt(data, key.subarray(0, 32)),
    ]),
  );
}
export async function openBackup(data: Buffer, password: string) {
  passwordValid(password);
  if (data.subarray(0, 9).toString() !== "MMBACKUP1")
    throw new Error("Backupformat nicht erkannt.");
  const key = await hashPassword(
    password,
    data.subarray(9, 33).toString("hex"),
  );
  return decrypt(data.subarray(33), key.subarray(0, 32));
}

export function confirmSensitive(
  request: Request,
  password: string,
  code: string,
) {
  return serializeSecurity(() => verifySensitive(request, password, code));
}
async function verifySensitive(
  request: Request,
  password: string,
  code: string,
) {
  const state = await currentSession(request);
  if (!state.configured) return;
  if (!state.session || !state.security) throw new Error("Bitte entsperren.");
  const s = state.security;
  rateLimit(s);
  const hash = await hashPassword(password.slice(0, 256), s.salt);
  if (
    !timingSafeEqual(hash, Buffer.from(s.hash, "hex")) ||
    !verifySecond(s, code)
  ) {
    s.failures.push(Date.now());
    event(s, "confirmation", "denied");
    throw new Error("Bestätigung fehlgeschlagen.");
  }
  event(s, "confirmation", "success");
}
