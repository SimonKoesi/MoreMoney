import { expect, test } from "@playwright/test";

test("Depotvorschau und Wiederholimport auf iPhone-Viewport", async ({page, request}, testInfo) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto("/#/worth");
  await page.getByRole("tab",{name:"Depots"}).click();
  const csv = "ISIN;Name;Kategorie;Stückzahl;Einstandswert;Marktwert;Währung\nIE00B4L5Y983;Prüf-ETF;ETFs;1,25;80;100;EUR";
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.getByRole("button",{name:"Depot-CSV importieren"}).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Depotname").fill("Synthetisches Testdepot");
    await dialog.getByLabel("CSV-Datei").setInputFiles({name:"depot.csv",mimeType:"text/csv",buffer:Buffer.from(csv)});
    await dialog.getByRole("button",{name:"Vorschau",exact:true}).click();
    await expect(dialog.getByRole("list",{name:"Importvorschau"})).toContainText("Prüf-ETF");
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    if (!attempt) await page.screenshot({path:testInfo.outputPath("depot-iphone.png")});
    await dialog.getByRole("button",{name:"Bestand übernehmen"}).click();
    await expect(page.getByRole("status").filter({hasText:attempt ? "0 Positionen übernommen · 1 übersprungen" : "1 Positionen übernommen · 0 übersprungen"})).toBeVisible();
  }
  const state = await (await request.get("/api/finance")).json();
  expect(state.assets.filter((asset:{source:string})=>asset.source==="Depot-CSV · Synthetisches Testdepot")).toHaveLength(1);
});

test("Händlerdetails, lokale Korrektur und Datenqualitäts-Drilldown", async ({page, request}, testInfo) => {
  const seed = await request.post("/api/state",{data:{op:"account",name:"Prüfkonto Händler",type:"Girokonto",openingCents:1000}});
  expect(seed.ok()).toBeTruthy();
  const accounts = (await seed.json()).accounts as {name:string;id:string}[];
  const accountId = accounts.find(a=>a.name==="Prüfkonto Händler")!.id;
  const transaction = await request.post("/api/finance",{data:{
    op:"manualTransaction",id:crypto.randomUUID(),accountId,title:"PAYPAL *SPOTIFY",
    amountCents:900,date:"2026-01-25",kind:"expense",category:"Sonstiges",note:"Prüfbuchung",
  }});
  expect(transaction.ok()).toBeTruthy();
  await page.goto("/#/bank");
  await page.getByRole("tab",{name:"Buchungen",exact:true}).click();
  await page.getByRole("button",{name:"Buchungsdetails Spotify"}).click();
  const details = page.getByRole("dialog");
  await expect(details.getByText("PayPal",{exact:true})).toBeVisible();
  await details.getByText("Originalbuchung",{exact:true}).click();
  await expect(details.getByText("PAYPAL *SPOTIFY",{exact:true})).toBeVisible();
  await details.getByLabel("Händler",{exact:true}).fill("Musik Prüfanbieter");
  await details.getByRole("button",{name:"Nur diese Buchung"}).click();
  await expect(page.getByRole("button",{name:"Buchungsdetails Musik Prüfanbieter"})).toBeVisible();
  await page.goto("/#/bank/quality");
  await expect(page.getByRole("heading",{name:/Prüfhinweise/})).toBeVisible();
  await page.getByRole("button",{name:"Buchung öffnen"}).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("tab",{name:"Datenqualität"}).click();
  await expect(page.getByRole("heading",{name:"Teilbewertungen"})).toBeVisible();
  await page.screenshot({path:testInfo.outputPath("datenqualitaet-desktop.png")});
  const bank = await (await request.get("/api/bank")).json();
  expect(bank.transactions.find((row:{accountId:string})=>row.accountId===accountId)).toMatchObject({title:"PAYPAL *SPOTIFY",amountCents:900});
});
