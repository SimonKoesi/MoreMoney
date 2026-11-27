import { test, expect } from "@playwright/test";
import { berlinDay } from "../src/lib/calendar";

test("Lokale Meldungen bleiben lesbar, filterbar und wiederherstellbar", async ({
  page,
  request,
}, info) => {
  const day = berlinDay();
  expect(
    (
      await request.post("/api/state", {
        data: {
          op: "account",
          name: "Synthetisches Konto mit negativem Saldo",
          type: "Girokonto",
          openingCents: -12000,
        },
      })
    ).ok(),
  ).toBe(true);
  expect(
    (
      await request.post("/api/finance", {
        data: {
          op: "subscription",
          data: {
            name: "Synthetischer Testvertrag",
            priceCents: 0,
            interval: "monthly",
            startDate: day,
            nextCharge: day,
            trialEnd: day,
            status: "trial",
          },
        },
      })
    ).ok(),
  ).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/notifications");
  const liquidity = page
    .getByRole("listitem")
    .filter({ hasText: "Synthetisches Konto mit negativem Saldo" });
  const trial = page
    .getByRole("listitem")
    .filter({ hasText: "Synthetischer Testvertrag" });
  await expect(liquidity.getByText("Wichtig")).toBeVisible();
  await expect(trial.getByText("Testphase endet")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("benachrichtigungen-390.png"),
    animations: "disabled",
  });
  await trial.getByRole("button", { name: "Als gelesen markieren" }).click();
  await expect(
    trial.getByRole("button", { name: "Als ungelesen markieren" }),
  ).toBeVisible();
  await page.getByLabel("Ansicht", { exact: true }).selectOption("unread");
  await expect(trial).toHaveCount(0);
  await page.getByLabel("Ansicht", { exact: true }).selectOption("all");
  await trial.getByRole("button", { name: "Archivieren" }).click();
  await expect(trial).toHaveCount(0);
  await page.getByLabel("Ansicht", { exact: true }).selectOption("archive");
  await trial.getByRole("button", { name: "Wiederherstellen" }).click();
  await expect(trial).toHaveCount(0);
  await page.getByLabel("Ansicht", { exact: true }).selectOption("all");
  await expect(trial).toBeVisible();
  await page.getByText("Meldungskategorien", { exact: true }).click();
  await page.getByRole("checkbox", { name: "Abonnements" }).uncheck();
  await expect(trial).toHaveCount(0);
  await page.reload();
  await expect(liquidity).toBeVisible();
  await expect(trial).toHaveCount(0);
  await page.getByRole("button", { name: "Privacy Mode einschalten" }).click();
  await expect(
    page.getByRole("heading", { name: "Diskreter Modus" }),
  ).toBeVisible();
  await expect(liquidity).toHaveCount(0);
  await page.getByRole("button", { name: "Anzeigen", exact: true }).click();
  await liquidity.getByRole("button", { name: "Öffnen" }).click();
  await expect(page).toHaveURL(/#\/bank$/);
});
