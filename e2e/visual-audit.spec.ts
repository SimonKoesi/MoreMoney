import { test, expect } from "@playwright/test";

const desktop = [
  [1280, 720],
  [1366, 768],
  [1440, 900],
  [1536, 864],
  [1920, 1080],
  [2560, 1440],
  [3440, 1440],
];
const phones = [
  [320, 568],
  [375, 667],
  [375, 812],
  [390, 844],
  [393, 852],
  [402, 874],
  [414, 896],
  [428, 926],
  [430, 932],
  [440, 956],
];
const tablets = [
  [768, 1024],
  [820, 1180],
  [1024, 1366],
];
const routes = [
  "dashboard",
  "accounts",
  "transactions",
  "recurring",
  "installments",
  "goals",
  "budgets",
  "projects",
  "simulator",
  "settings",
  "subscriptions",
  "worth",
  "bank",
  "privacy",
  "analysis",
  "health",
  "notifications",
  "assistant",
  "reports",
];

test("Audit: alle verfügbaren Routen, Dunkelmodus und 30 Viewports", async ({
  page,
  request,
}, info) => {
  test.setTimeout(180000);
  const accountResponse = await request.post("/api/state", {
    data: {
      op: "account",
      name: "Synthetisches Konto für besonders lange Finanzbezeichnungen",
      type: "Girokonto",
      openingCents: 1999999999,
    },
  });
  expect(accountResponse.ok()).toBe(true);
  const initial = await accountResponse.json();
  const account = initial.accounts.at(-1);
  const day = new Date().toISOString().slice(0, 10);
  for (const [kind, amountCents, category] of [
    ["income", 250000, "Gehalt"],
    ["expense", 92500, "Wohnen"],
    ["expense", 1299, "Abonnements"],
  ] as const) {
    expect(
      (
        await request.post("/api/state", {
          data: {
            op: "transaction",
            requestId: crypto.randomUUID(),
            title: "Audit " + category,
            amountCents,
            category,
            date: day,
            kind,
            accountId: account.id,
          },
        })
      ).ok(),
    ).toBe(true);
  }
  const failures: string[] = [];
  await page.emulateMedia({colorScheme:"light"});
  for (const theme of ["dark"]) {
    expect(
      (
        await request.post("/api/state", {
          data: {
            op: "settings",
            theme,
            reserveCents: 0,
            widgets: initial.settings.widgets,
          },
        })
      ).ok(),
    ).toBe(true);
    await page.goto("/#/dashboard");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    for (const route of routes) {
      const shot =
        route === "analysis" || route === "health" || route === "subscriptions";
      await page.goto("/#/" + route);
      await expect(page.locator("main h1")).toBeVisible();
      if (
        [
          "analysis",
          "health",
          "subscriptions",
          "worth",
          "bank",
          "privacy",
          "notifications",
          "assistant",
          "reports",
        ].includes(route)
      ) {
        await expect(page.locator("main .finance-module")).toBeVisible();
      }
      for (const [width, height] of [
        ...desktop,
        ...tablets,
        ...phones,
        ...phones.map(([w, h]) => [h, w]),
      ]) {
        await page.setViewportSize({ width, height });
        const overflow = await page.evaluate(async () => {
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          );
          if (document.documentElement.scrollWidth <= innerWidth + 1) return "";
          return (
            Array.from(document.querySelectorAll("body *"))
              .filter(
                (node) =>
                  node.getBoundingClientRect().right > innerWidth + 1 &&
                  (!node.closest(".table-scroll,.kanban") || node.matches(".table-scroll,.kanban")),
              )
              .slice(0, 8)
              .map((node) => node.tagName + " " + node.getAttribute("class") + " ("+Math.round(node.getBoundingClientRect().right)+")")
              .join("; ") || ("Dokument " + document.documentElement.scrollWidth + ", body " + document.body.scrollWidth)
          );
        });
        if (overflow)
          failures.push(
            theme + " " + route + " " + width + "×" + height + " " + overflow,
          );
        if (
          shot &&
          ((width === 1440 && height === 900) ||
            (width === 390 && height === 844) ||
            (width === 820 && height === 1180))
        ) {
          if (route === "analysis") {
            await expect(page.locator(".finance-chart .recharts-bar-rectangle").first()).toBeVisible();
          }
          await page.screenshot({
            path: info.outputPath(theme + "-" + route + "-" + width + ".png"),
            animations: "disabled",
          });
        }
      }
    }
  }
  expect(failures).toEqual([]);
});
