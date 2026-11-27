import { sameOrigin } from "./lib/validation";
import { allowed } from "./lib/local-security";
import { NextRequest, NextResponse } from "next/server";
export async function proxy(request: NextRequest) {
  const expected = process.env.MOREMONEY_SESSION_TOKEN || process.env.FINOVA_SESSION_TOKEN;
  const token = request.headers.get("x-moremoney-token") || request.headers.get("x-finova-token");
  if (expected && token !== expected)
    return new NextResponse("Nicht erlaubt", { status: 403 });
  const isApi = request.nextUrl.pathname.startsWith("/api/");
  const apiHeaders = { "Cache-Control": "no-store" };
  if (isApi && !sameOrigin(request))
    return NextResponse.json(
      { error: "Nicht erlaubt." },
      { status: 403, headers: apiHeaders },
    );
  if (
    isApi &&
    request.nextUrl.pathname.replace(/\/$/, "") !== "/api/privacy/session"
  ) {
    try {
      if (!(await allowed(request)))
        return NextResponse.json(
          { error: "Bitte entsperren." },
          { status: 401, headers: apiHeaders },
        );
    } catch {
      return NextResponse.json(
        { error: "Sicherheitsstatus nicht verfügbar." },
        { status: 503, headers: apiHeaders },
      );
    }
  }
  const response = NextResponse.next();
  if (isApi) response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set(
    "Content-Security-Policy",
    `default-src 'self'; script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'`,
  );
  return response;
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
