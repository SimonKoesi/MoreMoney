import { z } from "zod";
import { db, ready } from "@/lib/db";
import { BankingError } from "@/lib/enable-banking";
import { bankDirectory, importBankDirectory } from "@/lib/bank-directory-store";
import {
  bankingLock,
  cancelBanking,
  configureBanking,
  disconnectBankAccount,
  finishBanking,
  listBanks,
  openBankingState,
  removeBankingConfig,
  selectBankAccount,
  setAutomaticBankSync,
  startBanking,
  syncDueBankAccount,
  updateBankAccount,
} from "@/lib/open-banking";
import { readBytesBounded, readTextBounded } from "@/lib/request-body";
import { sameOrigin } from "@/lib/validation";

export const runtime = "nodejs";
const id = z.string().uuid(),
  country = z.string().regex(/^[A-Z]{2}$/);
const commands = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("configure"),
    applicationId: id,
    privateKey: z.string().min(100).max(16000),
    redirect: z.string().min(8).max(2000),
  }),
  z.object({ op: z.literal("removeConfig") }),
  z.object({ op: z.literal("list"), country }),
  z.object({
    op: z.literal("directory"),
    query: z.string().max(120),
    refresh: z.boolean(),
  }),
  z.object({
    op: z.literal("start"),
    country,
    bank: z.string().min(1).max(160),
  }),
  z.object({ op: z.literal("finish"), callback: z.string().min(8).max(8192) }),
  z.object({ op: z.literal("cancel") }),
  z.object({ op: z.literal("select"), uid: id, includeInWorth: z.boolean() }),
  z.object({ op: z.literal("sync"), id }),
  z.object({ op: z.literal("syncDue") }),
  z.object({ op: z.literal("automaticSync"), enabled: z.boolean() }),
  z.object({ op: z.literal("disconnect"), id }),
]);
const json = (payload: unknown, status = 200) =>
  Response.json(payload, { status, headers: { "Cache-Control": "no-store" } });
async function assertAccess(request: Request) {
  if (!sameOrigin(request)) throw new BankingError("Zugriff verweigert.", 403);
  await ready();
  if (
    (
      await db.userSettings.findUnique({
        where: { id: "local" },
        select: { privacyMode: true },
      })
    )?.privacyMode
  )
    throw new BankingError("Diskreter Modus aktiv.", 423);
}
function failure(error: unknown) {
  return error instanceof BankingError
    ? json({ error: error.message }, error.status)
    : json(
        {
          error:
            "Bankvorgang fehlgeschlagen. Anbieter-Einrichtung und Netzwerk prüfen.",
        },
        502,
      );
}

export async function GET(request: Request) {
  try {
    await assertAccess(request);
    return json(openBankingState());
  } catch (error) {
    return failure(error);
  }
}

export async function PUT(request: Request) {
  try {
    await assertAccess(request);
    await importBankDirectory(await readBytesBounded(request, 6_000_000));
    return json({ saved: true });
  } catch (error) {
    return error instanceof BankingError ? failure(error)
      : json({ error: "Aktuelle TXT-Bankleitzahlendatei der Bundesbank auswählen." }, 400);
  }
}
export async function POST(request: Request) {
  try {
    await assertAccess(request);
    const command = commands.safeParse(
      JSON.parse(await readTextBounded(request, 25000)),
    );
    if (!command.success)
      return json({ error: "Eingaben zur Bankverbindung prüfen." }, 400);
    const c = command.data;
    if (c.op === "list") return json({ banks: await listBanks(c.country) });
    if (c.op === "directory") {
      try {
        return json(await bankDirectory(c.query, c.refresh));
      } catch {
        return json(
          { error: "Bundesbankverzeichnis konnte nicht aktualisiert werden." },
          502,
        );
      }
    }
    return await bankingLock(async () => {
      await assertAccess(request);
      if (c.op === "configure")
        await configureBanking({
          applicationId: c.applicationId,
          privateKey: c.privateKey,
          redirect: c.redirect,
        });
      if (c.op === "removeConfig") await removeBankingConfig();
      if (c.op === "start") await startBanking(c.country, c.bank);
      if (c.op === "finish") await finishBanking(c.callback);
      if (c.op === "cancel") await cancelBanking();
      if (c.op === "select") await selectBankAccount(c.uid, c.includeInWorth);
      if (c.op === "sync") await updateBankAccount(c.id);
      if (c.op === "syncDue")
        return json({
          attempted: await syncDueBankAccount(),
          ...openBankingState(),
        });
      if (c.op === "automaticSync") setAutomaticBankSync(c.enabled);
      if (c.op === "disconnect") await disconnectBankAccount(c.id);
      return json(openBankingState());
    });
  } catch (error) {
    return failure(error);
  }
}
