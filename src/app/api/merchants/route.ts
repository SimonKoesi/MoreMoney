import sharp from "sharp";
import { z } from "zod";
import { db, ready } from "@/lib/db";
import { merchantFields, signatureKey } from "@/lib/merchant-service";
import { readTextBounded } from "@/lib/request-body";
import { sameOrigin } from "@/lib/validation";

const id = z.string().uuid();
const commands = z.discriminatedUnion("op", [
  z.object({op: z.literal("preview"), id}),
  z.object({op: z.literal("remove"), id, rule: z.boolean()}),
  z.object({
    op: z.literal("save"), id, name: z.string().trim().min(1).max(100).regex(/^[^\p{C}]+$/u),
    rule: z.boolean(), logo: z.string().max(350_000).regex(/^[A-Za-z0-9+/]*={0,2}$/).optional(),
  }),
]);

async function canShow(request: Request) {
  return sameOrigin(request) && !(await db.userSettings.findUnique({where: {id: "local"}}))?.privacyMode;
}

export async function GET(request: Request) {
  await ready();
  if (!await canShow(request)) return Response.json({error: "Zugriff gesperrt."}, {status: 403});
  return Response.json({rules: await db.merchantLabel.findMany({
    where: {signature: {not: null}}, select: {id: true, name: true, updatedAt: true}, orderBy: {updatedAt: "desc"}, take: 250,
  })});
}

export async function POST(request: Request) {
  await ready();
  if (!await canShow(request)) return Response.json({error: "Zugriff gesperrt."}, {status: 403});
  const result = commands.safeParse(await readTextBounded(request, 370_000).then(JSON.parse).catch(() => null));
  if (!result.success) return Response.json({error: "Händlerangaben prüfen."}, {status: 400});
  const command = result.data;
  try {
    if (command.op === "remove") {
      const scope = command.rule ? { id: command.id, signature: {not: null} } : { transactionId: command.id };
      await db.merchantLabel.deleteMany({where: scope});
      return Response.json({saved: true});
    }
    const transaction = await db.transaction.findUnique({where: {id: command.id}, select: merchantFields});
    if (!transaction) return Response.json({error: "Buchung fehlt."}, {status: 404});
    const signature = signatureKey(transaction);
    if (command.op === "preview") {
      if (!signature) return Response.json({count: 0, limited: false});
      const rows = await db.transaction.findMany({select: merchantFields, orderBy: {date: "desc"}, take: 5001});
      const manual = new Set((await db.merchantLabel.findMany({where: {transactionId: {not: null}}, select: {transactionId: true}})).map(row => row.transactionId));
      const count = rows.slice(0, 5000).filter(row => signatureKey(row) === signature && !manual.has(row.id)).length;
      return Response.json({ count, limited: rows.length > 5000 });
    }
    if (command.rule && !signature)
      return Response.json({error: "Für diesen Buchungstext ist keine eindeutige Regel möglich."}, {status: 400});
    let logo: string | undefined;
    if (command.logo) {
      const decoded = Buffer.from(command.logo, "base64");
      const image = sharp(decoded, {limitInputPixels: 1_000_000, failOn: "warning"});
      if (!["png", "jpeg", "webp"].includes((await image.metadata()).format ?? ""))
        return Response.json({error: "PNG, JPEG oder WebP verwenden."}, {status: 400});
      logo = (await image.resize(72, 72, {fit: "inside", withoutEnlargement: true}).png().toBuffer()).toString("base64");
    }
    const key = command.rule ? { signature } : { transactionId: command.id };
    await db.merchantLabel.upsert({
      where: key, create: {...key, name: command.name, logo: logo ?? ""},
      update: {name: command.name, ...(logo && {logo})},
    });
    return Response.json({saved: true});
  } catch {
    return Response.json({error: "Händler konnte nicht gespeichert werden. Bild und Eingaben prüfen."}, {status: 400});
  }
}
