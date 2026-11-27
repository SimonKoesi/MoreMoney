import { test, expect } from "@playwright/test";

test("Sparziele: Kontodeckung, Umbuchung, Historie, Simulation und Verteilung", async ({
  page,
  request,
}, info) => {
  test.setTimeout(90000);
  const accountResponse = await request.post("/api/state", {
    data: {
      op: "account",
      name: "Spar-Konto",
      type: "Sparkonto",
      openingCents: 10000,
    },
  });
  expect(accountResponse.ok()).toBe(true);
  const account = (await accountResponse.json()).accounts.find(
    (item: { name: string }) => item.name === "Spar-Konto",
  );
  await page.setViewportSize({ width: 320, height: 650 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/goals");
  const name = "Synthetisches langfristiges Sparziel mit ausführlichem Namen";
  const dialog = page.getByRole("dialog");
  async function newGoal(label: string, saved: string) {
    await page.getByRole("button", { name: "Sparziel erstellen" }).click();
    await dialog.getByLabel("Name", { exact: true }).fill(label);
    await dialog.getByLabel("Zielbetrag", { exact: true }).fill("250");
    await dialog.getByLabel("Startguthaben").fill(saved);
    await dialog.getByLabel("Konto", { exact: true }).selectOption(account.id);
    await dialog
      .getByRole("button", { name: "Speichern", exact: true })
      .click();
  }
  await newGoal(name, "65");
  await expect(dialog).toHaveCount(0);
  await newGoal("Reserve", "50");
  await expect(dialog.getByRole("alert")).toContainText("bereits zugeordnet");
  await expect(dialog.getByLabel("Name", { exact: true })).toHaveValue(
    "Reserve",
  );
  await dialog.getByLabel("Startguthaben").fill("25");
  await dialog.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole("button", { name: `${name} öffnen` }).click();
  await expect(page).toHaveURL(/#\/goals\/[a-f0-9-]+$/);
  await page.reload();
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await expect(
    page.locator(".savings-values").filter({ hasText: "Kontostand" }),
  ).toContainText("Frei 10,00");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "150%";
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("sparziel-320-grosse-schrift.png"),
    animations: "disabled",
  });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "";
  });

  await page.getByRole("button", { name: "Einzahlen", exact: true }).click();
  await dialog.getByLabel("Betrag in EUR").fill("15");
  await dialog.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("nicht frei verfügbar");
  await dialog.getByLabel("Betrag in EUR").fill("10");
  await dialog.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".account-balance")).toContainText("75,00");

  await page.getByRole("button", { name: "Umbuchen", exact: true }).click();
  await dialog.getByLabel("Betrag in EUR").fill("5");
  await dialog.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(page.locator(".account-balance")).toContainText("70,00");
  await expect(
    page.getByRole("row").filter({ hasText: "Virtuell umgeordnet" }),
  ).toContainText(/[-−]5,00/);
  await page.getByRole("button", { name: "Korrigieren", exact: true }).click();
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(page.locator(".account-balance")).toContainText("60,00");
  await expect(
    page
      .getByRole("row")
      .filter({ hasText: "Korrektur eines früheren Eintrags" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Simulieren" }).click();
  await dialog.getByLabel("Rate je Intervall in EUR").fill("50");
  await dialog.getByLabel("Sonderzahlung (Simulation)").fill("25");
  await expect(dialog.getByText("Modellzinsen", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Abbrechen" }).click();
  await expect(
    page.locator(".savings-values").filter({ hasText: "Rate" }),
  ).toContainText("0,00");
  await page.getByRole("button", { name: "Simulieren" }).click();
  await dialog.getByLabel("Rate je Intervall in EUR").fill("30");
  await dialog.getByLabel("Startguthaben (Simulation)").fill("100");
  await dialog.getByRole("button", { name: "Sparplan übernehmen" }).click();
  await expect(
    page.locator(".savings-values").filter({ hasText: "Rate" }),
  ).toContainText("30,00");
  await expect(page.locator(".account-balance")).toContainText("60,00");

  await page
    .getByRole("button", { name: "Sparziele", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: "Rate verteilen" }).click();
  await dialog.getByLabel("Monatsbetrag in EUR").fill("50");
  await dialog.getByRole("button", { name: "Vorschau", exact: true }).click();
  await expect(
    dialog.getByRole("button", { name: "Raten übernehmen" }),
  ).toBeDisabled();
  await dialog.getByRole("checkbox", { name: "Abweichung bestätigen" }).check();
  await dialog.getByRole("button", { name: "Raten übernehmen" }).click();
  await expect(dialog).toHaveCount(0);

  const state = await (await request.get("/api/intelligence")).json();
  const goals = state.savingsGoals.filter((goal: { name: string }) =>
    [name, "Reserve"].includes(goal.name),
  );
  expect(
    goals.map((goal: { monthlyRateCents: number }) => goal.monthlyRateCents),
  ).toEqual([2500, 2500]);
  expect(
    state.accounts.find((item: { id: string }) => item.id === account.id)
      .balanceCents,
  ).toBe(10000);

  const reserve = goals.find(
    (goal: { name: string }) => goal.name === "Reserve",
  );
  const retry = {
    op: "goalMovement",
    id: reserve.id,
    requestId: crypto.randomUUID(),
    amountCents: 100,
    kind: "withdraw",
    day: state.asOf,
    note: "Synthetische Wiederholung",
  };
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await request.post("/api/intelligence", { data: retry });
    expect(response.ok()).toBe(true);
    const edited = (await response.json()).savingsGoals.find(
      (goal: { id: string }) => goal.id === reserve.id,
    );
    expect(edited.savedCents).toBe(reserve.savedCents - 100);
    expect(
      edited.movements.filter(
        (movement: { requestId: string }) =>
          movement.requestId === retry.requestId,
      ),
    ).toHaveLength(1);
  }
});
