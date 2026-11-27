import { z } from "zod";
import { db, ready } from "@/lib/db";
import { sameOrigin } from "@/lib/validation";

export async function GET(request: Request) {
  if (!sameOrigin(request)) return new Response(null, {status: 403});
  const id = z.string().uuid().safeParse(new URL(request.url).searchParams.get("id"));
  if (!id.success) return new Response(null, {status: 404});
  await ready();
  const settings = await db.userSettings.findUnique({where: {id: "local"}, select: {privacyMode: true}});
  if (settings?.privacyMode) return new Response(null, {status: 423});
  const logo = await db.subscriptionLogo.findUnique({where: {subscriptionId: id.data}});
  if (!logo) return new Response(null, {status: 404});
  return new Response(new Uint8Array(Buffer.from(logo.png, "base64")), {
    headers: {"Content-Type": "image/png", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"},
  });
}
