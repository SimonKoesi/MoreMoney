import { describe, expect, it } from "vitest";
import { currentDirectoryUrl, parseBankDirectory, providerMatch, searchBankDirectory } from "../src/lib/bank-directory";
import { parsePortfolio, portfolioTemplate } from "../src/lib/investment-import";
import { recognizeMerchant } from "../src/lib/merchant";
import { assessData } from "../src/lib/data-quality";

describe("Bundesbankverzeichnis", () => {
  const fixed = (id: string, name: string, action = "U") =>
    "123456781" + name.padEnd(58) + "01234" + "Prüfstadt".padEnd(35) + "VR Prüfstadt".padEnd(27) +
    "00000" + "TESTDEX1001" + "09" + id + action + "0" + "00000000";
  it("sucht nach BLZ, BIC, Gruppe, Ort und Tippfehlern und lässt gelöschte Banken aus", () => {
    const banks = parseBankDirectory(fixed("100001", "Raiffeisenbank Prüfstadt") + "\r\n" + fixed("100002", "Bank Alt", "D"));
    for (const query of ["12345678", "TESTDEX1001", "VR-Bank Prufstadt", "01234", "Prufstads"]) {
      expect(searchBankDirectory(query, banks)).toHaveLength(1);
    }
    expect(searchBankDirectory("Bank Alt", banks)).toHaveLength(0);
    expect(providerMatch(banks[0], [{name:"Bankname im Anbieter",bic:"TESTDEX1001"}])).toBe("Bankname im Anbieter");
    expect(providerMatch(banks[0], [{name:"Ähnliche Bank"},{name:"Andere Bank"}])).toBeNull();
  });
  it("akzeptiert nur den offiziellen, aktuell gültigen Dateipfad", () => {
    expect(currentDirectoryUrl('<a href="/resource/blob/1/a/b/blz-aktuell-txt-data.txt">TXT</a>')).toContain("https://www.bundesbank.de/");
    expect(() => currentDirectoryUrl('<a href="https://example.test/blz-aktuell-txt-data.txt">TXT</a>')).toThrow();
  });
});

describe("Depotimport", () => {
  const row = "IE00B4L5Y983;World ETF;ETFs;0,000001;24,00;25,12;EUR";
  it("liest Cent und Bruchstücke exakt und meldet doppelte ISIN", () => {
    const preview = parsePortfolio([portfolioTemplate, row, row].join("\n"));
    expect(preview.positions).toMatchObject([{quantityMicros:"1", currentValueCents:2512, purchaseCents:2400}]);
    expect(preview.errors[0]).toContain("doppelt");
  });
  it("weist ungültige Prüfziffern und Beträge zurück", () => {
    const input = [portfolioTemplate, row.replace("Y983","Y984"), row.replace("25,12","-25,12")].join("\n");
    expect(parsePortfolio(input)).toMatchObject({positions:[], errors:[expect.any(String),expect.any(String)]});
  });
});

describe("Lokale Händlererkennung", () => {
  it.each([
    ["AMZN Mktp DE*8K29W2","Amazon",""],
    ["REWE MARKT GMBH POS 48192 ELV","REWE",""],
    ["PAYPAL *SPOTIFY","Spotify","PayPal"],
    ["NETFLIX.COM 29384","Netflix",""],
    ["APPLE.COM/BILL","Apple",""],
    ["LIDL DIENSTLEISTUNG GMBH","Lidl",""],
    ["DB VERTRIEB GMBH","Deutsche Bahn",""],
    ["ALDI SUED FIL 0832","ALDI Süd",""],
    ["1&1 TELECOM GMBH","1&1",""],
    ["PAYPAL","","PayPal"],
    ["Bäckerei Prüfstadt","",""],
  ])("liest %s", (title, name, processor) => {
    expect(recognizeMerchant({title, payee:"",kind:"expense"})).toMatchObject({name,processor});
  });
  it("übernimmt widersprüchliche und unscharfe Treffer nicht als bestätigten Händler", () => {
    expect(recognizeMerchant({title:"Spotify",payee:"Netflix",kind:"expense"})).toMatchObject({name:"",method:"suggestion"});
    expect(recognizeMerchant({title:"Spotifu",payee:"",kind:"expense"})).toMatchObject({name:"Spotify",method:"suggestion"});
  });
});

it("liefert ohne Daten keinen Qualitätsindex und kennzeichnet Duplikate und überfällige Daten", () => {
  const base = {day:"2026-11-25", transactions:[], accounts:[], currencies:[], merchants:{}, sources:[], limited:false, accountsComplete:false, debtsComplete:false};
  expect(assessData(base)).toMatchObject({score:null,coverage:0});
  const movement = {id:"1", date:base.day, accountId:"a", currency:"EUR", category:"Sonstiges", title:"Test", payee:"Test", kind:"expense", amountCents:10000, bookingStatus:"booked"};
  const report = assessData({...base,accounts:[{id:"a",currency:"EUR"}],transactions:[movement,{...movement,id:"2"}],
    sources:[{day:"2026-11-19",name:"Prüfkonto",freshnessDays:1,route:"#/bank"}]});
  expect(report.areas.find(area=>area.id==="duplicates")?.score).toBe(50);
  expect(report.areas.find(area=>area.id==="freshness")?.score).toBe(0);
  expect(report.issues.map(issue=>issue.title)).toContain("Mögliche Doppelbuchung");
  expect(report.score).toBeGreaterThanOrEqual(0);
  expect(report.score).toBeLessThanOrEqual(100);
});
