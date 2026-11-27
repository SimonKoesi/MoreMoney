import { expect, it } from "vitest";
import { dashboardCashflow, dashboardExpenseDetails } from "../src/lib/dashboard-cashflow";

it("aggregiert nur bewertete Buchungen des Zeitraums und erhält ihre Aufteilung", () => {
  const payment = (id: string, date: string, kind: string) => ({id, date, kind, category: "Alt"});
  const input = {
    start:"2026-11-01", end:"2026-11-25", monthly:false,
    payments:[
      payment("salary","2026-11-02","income"),
      payment("split","2026-11-21","expense"),
      payment("transfer","2026-11-09","transfer-out"),
      payment("unknown","2026-11-12","expense"),
      payment("older","2026-10-22","expense"),
    ],
    amounts:{salary:200000,split:8750,transfer:15000,unknown:null,older:12345},
    expenseParts:{split:[{name:"Lebensmittel",value:3100},{name:"Wohnen",value:5650}]},
  };
  const month = dashboardCashflow(input);
  expect(month.income).toBe(200000);
  expect(month.expenses).toEqual([{name:"Wohnen",value:5650},{name:"Lebensmittel",value:3100}]);
  expect(month.buckets.map(bucket=>bucket.Ausgaben)).toEqual([0,0,87.5,0]);
  const extended = dashboardCashflow({...input,start:"2026-10-01",monthly:true});
  expect(extended.buckets.map(bucket=>bucket.Ausgaben)).toEqual([123.45,87.5]);
});

it("weist einer geteilten Buchung in der Detailansicht nur den zugehörigen Anteil zu", () => {
  const payment = {id:"split", date:"2026-11-21", kind:"expense", category:"Alt"};
  const parts = {split:[{name:"Wohnen",value:4000},{name:"Wohnen",value:1650},{name:"Lebensmittel",value:3100}]};
  const details = dashboardExpenseDetails(
    [payment, {...payment,id:"non-eur"}, {...payment,id:"transfer",kind:"transfer-out",category:"Wohnen"}],
    {split:8750,"non-eur":null,transfer:500}, parts, "Wohnen",
  );
  expect(details).toEqual([{payment,categoryCents:5650,amountCents:8750}]);
  expect(dashboardExpenseDetails([payment],{split:8750},parts,"Alt")).toEqual([]);
});
