import { test, expect } from "@playwright/test";
import { Secret, TOTP } from "otpauth";

test("Lokale Sperre schützt Finanzdaten und verschlüsseltes Backup lässt sich prüfen", async ({
  request,
  playwright,
  baseURL,
}) => {
  const password = "Synthetische Audit-Passphrase";
  const auth = (action: string, extra: Record<string, unknown> = {}) =>
    request.post("/api/privacy/session", {
      data: { action, password, ...extra },
    });
  expect((await auth("setup")).ok()).toBe(true);
  expect(
    (await request.get("/api/state")).headers()["cache-control"],
  ).toContain("no-store");
  const before = await (
    await request.post("/api/state", {
      data: {
        op: "account",
        name: "Audit Backupkonto",
        type: "Girokonto",
        openingCents: 1234,
      },
    })
  ).json();
  const account = before.accounts.find(
    (row: { name: string }) => row.name === "Audit Backupkonto",
  );
  expect(account).toBeDefined();
  const backup = await request.post("/api/privacy/data", {
    data: { op: "backup", password },
  });
  expect(backup.ok()).toBe(true);
  const content = (await backup.body()).toString("base64");
  const restore = await request.post("/api/privacy/data", {
    data: { op: "restorePreview", password, content },
  });
  expect(restore.ok(), await restore.text()).toBe(true);
  expect((await restore.json()).counts).toHaveProperty("Account");
  expect(
    (
      await request.post("/api/state", {
        data: { op: "archiveAccount", id: account.id, archived: true },
      })
    ).ok(),
  ).toBe(true);
  const restored = await request.post("/api/privacy/data", {
    data: {
      op: "restore",
      password,
      content,
      confirmation: "WIEDERHERSTELLEN",
    },
  });
  expect(restored.ok(), await restored.text()).toBe(true);
  const after = await (await request.get("/api/state")).json();
  expect(
    after.accounts.find((row: { id: string }) => row.id === account.id),
  ).toMatchObject({ archived: false, openingCents: 1234 });
  expect((await auth("lock")).ok()).toBe(true);
  const anonymous = await playwright.request.newContext({ baseURL });
  try {
    for (const endpoint of [
      "/api/state",
      "/api/export",
      "/api/bank",
      "/api/intelligence",
    ]) {
      const response = await anonymous.get(endpoint);
      expect(response.status()).toBe(401);
      expect(response.headers()["cache-control"]).toContain("no-store");
    }
  } finally {
    await anonymous.dispose();
  }
  expect((await auth("login")).ok()).toBe(true);
  expect((await request.get("/api/state")).ok()).toBe(true);
  const beginMfa = await auth("beginMfa");
  expect(beginMfa.ok()).toBe(true);
  const { secret } = await beginMfa.json();
  const totp = new TOTP({
    secret: Secret.fromBase32(secret),
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  });
  const confirmation = await auth("confirmMfa", { code: totp.generate() });
  expect(confirmation.ok()).toBe(true);
  expect((await auth("lock")).ok()).toBe(true);
  expect((await auth("login")).status()).toBe(400);
  expect((await auth("login", { code: totp.generate() })).ok()).toBe(true);
});
