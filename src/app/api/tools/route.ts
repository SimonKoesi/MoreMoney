import { z } from "zod";
import { createHash } from "node:crypto";
import { db, ready } from "@/lib/db";
import { intelligenceState } from "@/lib/intelligence-state";
import { assistantConfigured, openAIProvider } from "@/lib/assistant-provider";
import {
  compileReport,
  financialSections,
  localTopic,
  questionPeriod,
  reportKinds,
  reportQuery,
  topics,
} from "@/lib/financial-tools";
import { readTextBounded } from "@/lib/request-body";
import { sameOrigin } from "@/lib/validation";

export const runtime = "nodejs";
const id = z.string().uuid();
const input = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("ask"),
    id,
    question: z.string().trim().min(1).max(500),
    topic: z.enum(topics).optional(),
    external: z.boolean().default(false),
    save: z.boolean().default(false),
  }),
  z.object({ op: z.literal("clearChat") }),
  z.object({ op: z.literal("report"), id, kind: z.enum(reportKinds) }),
  z.object({ op: z.literal("deleteReport"), id }),
]);
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
async function privateMode() {
  await ready();
  return (
    await db.userSettings.findUnique({
      where: { id: "local" },
      select: { privacyMode: true },
    })
  )?.privacyMode;
}

export async function GET(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Zugriff verweigert." }, 403);
  try {
    if (await privateMode())
      return json({ error: "Diskreter Modus aktiv." }, 423);
    const [messages, reports] = await Promise.all([
      db.chatMessage.findMany({
        orderBy: [{ createdAt: "desc" }, { role: "asc" }],
        take: 100,
      }),
      db.financeReport.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    ]);
    return json({ configured: assistantConfigured(), messages, reports });
  } catch {
    return json({ error: "Daten konnten nicht geladen werden." }, 500);
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Zugriff verweigert." }, 403);
  try {
    if (await privateMode())
      return json({ error: "Diskreter Modus aktiv." }, 423);
    const command = input.safeParse(
      JSON.parse(await readTextBounded(request, 8192)),
    );
    if (!command.success) return json({ error: "Eingaben prüfen." }, 400);
    const action = command.data;
    if (action.op === "clearChat") {
      await db.chatMessage.deleteMany();
      return json({ ok: true });
    }
    if (action.op === "deleteReport") {
      await db.financeReport.deleteMany({ where: { id: action.id } });
      return json({ ok: true });
    }
    if (action.op === "report") {
      const existing = await db.financeReport.findUnique({
        where: { id: action.id },
      });
      if (existing) return json({ report: existing });
      const state = await intelligenceState(reportQuery(action.kind));
      const report = await db.financeReport.upsert({
        where: { id: action.id },
        update: {},
        create: {
          id: action.id,
          kind: action.kind,
          periodStart: state.range.from,
          periodEnd: state.range.to,
          content: JSON.stringify(compileReport(action.kind, state)),
        },
      });
      return json({ report });
    }
    const hash = createHash("sha256")
      .update("moremoney:answer:" + action.id)
      .digest("hex");
    const answerId = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
    if (action.save) {
      const previous = await db.chatMessage.findUnique({
        where: { id: answerId },
      });
      if (previous) return json({ answer: JSON.parse(previous.components) });
    }
    let topic = action.topic || localTopic(action.question);
    let origin = "Lokal";
    let notice = "";
    if (action.external && !action.topic) {
      if (!assistantConfigured())
        return json({ error: "Sprachmodell nicht konfiguriert." }, 409);
      try {
        topic = await openAIProvider().selectTopic(action.question);
        origin = "OpenAI · Themenwahl";
      } catch {
        notice =
          "Sprachmodell vorübergehend nicht erreichbar. Lokale Auswertung verwendet.";
      }
    }
    const state = await intelligenceState({
      period: questionPeriod(action.question),
    });
    const answer = { ...financialSections(state)[topic], origin, notice };
    if (action.save)
      await db.$transaction([
        db.chatMessage.upsert({
          where: { id: action.id },
          update: {},
          create: {
            id: action.id,
            threadId: action.id,
            role: "user",
            content: action.question,
            components: "{}",
            sourceIds: "[]",
          },
        }),
        db.chatMessage.upsert({
          where: { id: answerId },
          update: {},
          create: {
            id: answerId,
            threadId: action.id,
            role: "assistant",
            content: answer.title,
            components: JSON.stringify(answer),
            sourceIds: "[]",
          },
        }),
      ]);
    return json({ answer });
  } catch {
    return json(
      { error: "Vorgang fehlgeschlagen. Bitte erneut versuchen." },
      400,
    );
  }
}
