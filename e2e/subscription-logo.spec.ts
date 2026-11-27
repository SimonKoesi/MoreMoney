import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { addMonths, berlinDay } from "../src/lib/calendar";

test("Der Zeitraum ändert Cashflow und Sankey auch im schmalen Fenster", async ({ page, request }, testInfo) => {
  const create = await request.post("/api/state", {
    data: { op: "account", name: "Geldfluss-Prüfkonto", type: "Girokonto", openingCents: 0 },
  });
  expect(create.ok()).toBeTruthy();
  const accountId = (await create.json()).accounts.find((account: {name:string;id:string}) => account.name === "Geldfluss-Prüfkonto").id;
  const month = berlinDay().slice(0, 7) + "-01";
  for (const [date, kind, category, amountCents] of [
    [month, "income", "Gehalt", 60000],
    [month, "expense", "Miete Test", 40000],
    [addMonths(month, -2), "expense", "Ältere Testausgabe", 30000],
  ] as const) {
    const requestId = crypto.randomUUID();
    const booking = await request.post("/api/state", {
      data: { op: "transaction", requestId, title: category, amountCents, kind, category, date, accountId },
    });
    expect(booking.ok()).toBeTruthy();
    if (category === "Miete Test") {
      const state = await booking.json();
      const id = state.transactions.find((row: {requestId:string}) => row.requestId === requestId).id;
      const split = await request.post("/api/intelligence", {
        data: { op: "split", id, parts: [{category, amountCents:35000}, {category:"Nebenkosten Test", amountCents:5000}] },
      });
      expect(split.ok()).toBeTruthy();
    }
  }
  await page.route("**/api/state", async route => {
    const response = await route.fetch();
    const state = await response.json();
    await route.fulfill({ response, json: {
      ...state, transactions: state.transactions.filter((row: {accountId:string}) => row.accountId === accountId),
    }});
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/dashboard");
  const chart = page.getByRole("region", { name: "Dein Cashflow" });
  const flow = page.getByRole("region", { name: "Wohin fließt dein Geld?" });
  await expect(flow.getByText("Miete Test")).toBeVisible();
  await expect(flow.getByText("Ältere Testausgabe")).toHaveCount(0);
  await expect(flow.getByText("Überschuss")).toBeVisible();
  const category = flow.getByRole("button", { name: /Miete Test/ });
  await category.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Miete Test" });
  await expect(dialog.getByText("1 Buchung", {exact:false})).toBeVisible();
  await expect(dialog.getByText(/Gesamtbuchung 400,00/)).toBeVisible();
  await expect(dialog.getByText(/350,00/).first()).toBeVisible();
  await expect(dialog.getByText(/Geldfluss-Prüfkonto/)).toBeVisible();
  await expect(dialog.getByText(/Ältere Testausgabe/)).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(category).toBeFocused();
  await expect(chart.getByRole("img", { name: "Einnahmen und Ausgaben · Dieser Monat" })).toBeVisible();
  await page.getByRole("radio", { name: "6 Monate" }).check();
  await expect(chart.getByRole("img", { name: "Einnahmen und Ausgaben · 6 Monate" })).toBeVisible();
  await expect(flow.getByText("Ältere Testausgabe")).toBeVisible();
  await flow.getByRole("button", {name:/Ältere Testausgabe/}).click();
  await expect(page.getByRole("dialog", {name:"Ältere Testausgabe"}).getByText(/300,00/).first()).toBeVisible();
  await page.getByRole("button", {name:"Schließen"}).click();
  await expect(flow.getByText("Fehlbetrag")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await flow.evaluate(element => element.scrollIntoView({ block: "center" }));
  await flow.screenshot({ path: testInfo.outputPath("geldfluss-390.png") });
  const worth = page.getByRole("link", { name: /Nettovermögen/ });
  await expect(worth).toBeVisible();
  const chartBox = await chart.boundingBox();
  const worthBox = await worth.boundingBox();
  expect(chartBox!.y).toBeLessThan(worthBox!.y);
});

test("eigenes Abo-Logo bleibt sichtbar und lässt sich entfernen", async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/subscriptions");
  await page.getByRole("button", { name: "Abo hinzufügen" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Anbieter", { exact: true }).fill("Synthetisches Logo-Abo");
  await dialog.getByLabel("Preis", { exact: true }).fill("7,50");
  const upload = dialog.getByLabel("Eigenes Abo-Logo");
  await upload.setInputFiles({ name: "logo.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg/>") });
  await expect(dialog.getByRole("alert")).toContainText("PNG, JPEG oder WebP");
  await expect(dialog.getByLabel("Anbieter", { exact: true })).toHaveValue("Synthetisches Logo-Abo");
  await upload.setInputFiles({
    name: "logo.png", mimeType: "image/png",
    buffer: await sharp({ create: { width: 50, height: 30, channels: 3, background: "#6fdac3" } }).png().toBuffer(),
  });
  await expect(dialog.locator(".subscription-mark img")).toHaveJSProperty("naturalWidth", 50);
  await dialog.getByRole("button", { name: "Speichern" }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole("tab", { name: "Verträge" }).click();
  const card = page.getByRole("button", { name: /Synthetisches Logo-Abo/ });
  await expect(card.locator("img")).toHaveJSProperty("naturalWidth", 50);
  const logoUrl = await card.locator("img").getAttribute("src");

  await page.reload();
  await page.getByRole("tab", { name: "Verträge" }).click();
  await card.click();
  await expect(page.locator("h2.subscription-name img")).toHaveJSProperty("naturalWidth", 50);
  await page.getByRole("button", { name: "Bearbeiten", exact: true }).click();
  await dialog.getByRole("button", { name: "Logo entfernen" }).click();
  await dialog.getByRole("button", { name: "Abbrechen" }).click();
  await expect(page.locator("h2.subscription-name img")).toBeVisible();

  await page.getByRole("button", { name: "Bearbeiten", exact: true }).click();
  await dialog.getByRole("button", { name: "Logo entfernen" }).click();
  await dialog.getByRole("button", { name: "Speichern" }).click();
  await expect(page.locator("h2.subscription-name img")).toHaveCount(0);
  await expect(page.locator("h2.subscription-name .subscription-mark svg")).toHaveCount(1);
  expect((await request.get(logoUrl!)).status()).toBe(404);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await expect(page.getByRole("button", { name: "Theme wechseln" })).toHaveCount(0);
});
