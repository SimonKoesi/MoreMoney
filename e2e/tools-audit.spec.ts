import { test, expect } from "@playwright/test";
import { berlinDay } from "../src/lib/calendar";

test("Bankdatei erkennt deutsche CSV-Spalten in der ersten Vorschau", async ({
  page,
  request,
}) => {
  const response = await request.post("/api/state", {
    data: {
      op: "account",
      name: "Synthetische CSV-Vorschau",
      type: "Girokonto",
      openingCents: 10000,
    },
  });
  expect(response.ok()).toBe(true);
  const account = (await response.json()).accounts.find(
    (item: { name: string }) => item.name === "Synthetische CSV-Vorschau",
  );
  await page.goto("/#/bank");
  await page.getByRole("tab", { name: "Import", exact: true }).click();
  await page.locator("#bank-panel select").first().selectOption(account.id);
  await page
    .locator('input[type="file"]')
    .setInputFiles({
      name: "synthetischer-kontoauszug.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        `Buchungstag;Betrag (EUR);Verwendungszweck;Referenz\n${berlinDay()};-12,34;Synthetischer CSV-Eintrag;Synthetic-A1`,
      ),
    });
  await page.getByRole("button", { name: "Vorschau prüfen" }).click();
  await expect(
    page.getByText("Synthetischer CSV-Eintrag", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Ausgewählte Buchungen importieren" })
    .click();
  await expect(
    page.getByText("1 Buchung übernommen.", { exact: true }),
  ).toBeVisible();
  const state = await (await request.get("/api/state")).json();
  expect(
    state.transactions.find(
      (item: { accountId: string }) => item.accountId === account.id,
    ).amountCents,
  ).toBe(1234);
});

test("Finanzassistent und Berichte verwenden lokale Daten und respektieren den diskreten Modus", async ({
  page,
  request,
}) => {
  const response = await request.post("/api/state", {
    data: {
      op: "account",
      name: "Synthetisches Berichtskonto",
      type: "Girokonto",
      openingCents: 0,
    },
  });
  expect(response.ok()).toBe(true);
  const account = (await response.json()).accounts.find(
    (row: { name: string }) => row.name === "Synthetisches Berichtskonto",
  );
  expect(
    (
      await request.post("/api/state", {
        data: {
          op: "transaction",
          requestId: crypto.randomUUID(),
          title: "Synthetischer Testaufwand",
          amountCents: 2999,
          kind: "expense",
          date: berlinDay(),
          category: "Testausgaben",
          accountId: account.id,
        },
      })
    ).ok(),
  ).toBe(true);
  await page.setViewportSize({ width: 320, height: 680 });
  await page.goto("/#/assistant");
  await page.getByRole("button", { name: "Ausgaben", exact: true }).click();
  await expect(page.getByText("Testausgaben · 29,99 €")).toBeVisible();
  expect(
    (await (await request.get("/api/tools")).json()).messages,
  ).toHaveLength(0);
  await page
    .getByLabel("Frage", { exact: true })
    .fill("Zeige meine Ausgaben diesen Monat");
  await page
    .getByRole("checkbox", { name: "Frage und Antwort lokal speichern" })
    .check();
  await page.getByRole("button", { name: "Senden", exact: true }).click();
  await expect(
    page.getByText("Zeige meine Ausgaben diesen Monat", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Zeige meine Ausgaben diesen Monat", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Verlauf löschen" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Löschen", exact: true })
    .click();
  await expect(
    page.getByText("Zeige meine Ausgaben diesen Monat", { exact: true }),
  ).toHaveCount(0);
  await page.goto("/#/reports");
  await page.getByRole("button", { name: "Bericht erstellen" }).click();
  await expect(
    page.getByRole("heading", { name: "Monatsüberblick" }),
  ).toBeVisible();
  await expect(page.getByText("Testausgaben · 29,99 €")).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportieren" }).click();
  expect((await download).suggestedFilename()).toBe(
    "MoreMoney-Finanzbericht.txt",
  );
  const id = (await (await request.get("/api/tools")).json()).reports[0].id;
  await page.reload();
  await page
    .getByLabel("Gespeicherte Berichte", { exact: true })
    .selectOption(id);
  await expect(
    page.getByRole("heading", { name: "Monatsüberblick" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Privacy Mode einschalten" }).click();
  await expect(
    page.getByRole("heading", { name: "Diskreter Modus" }),
  ).toBeVisible();
  expect((await request.get("/api/tools")).status()).toBe(423);
  await page.getByRole("button", { name: "Anzeigen", exact: true }).click();
});

test("Aktien-APIs und Kursdienst sind entfernt", async ({ page, request }) => {
  for (const operation of [
    request.post("/api/stocks",{ data:{op:"refresh"} }),
    request.get("/api/stocks/search?q=Test"),
    request.post("/api/stocks/provider",{ data:{key:"synthetic-key"} }),
  ]) expect((await operation).status()).toBe(404);
  const state = await (await request.get("/api/state")).json();
  expect(state).not.toHaveProperty("stocks");
  await page.goto("/#/privacy");
  await page.getByText("Drittanbieter und Einwilligungen",{exact:true}).click();
  await expect(page.getByText("Twelve Data",{exact:false})).toHaveCount(0);
});
