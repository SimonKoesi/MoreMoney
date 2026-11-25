import {describe,it,expect} from 'vitest';
import {installmentSchedule,loanSchedule} from '@/lib/installments';
import {parseSuggestions} from '@/lib/stocks';
describe('Ratenkäufe',()=>{
 it('erhält Centbeträge und Monatsletzte ohne Datumsdrift',()=>{
  const rows=installmentSchedule({totalCents:100001,downPaymentCents:10000,rateCents:30000,firstDueDate:'2026-01-31'});
  expect(rows.map(r=>r.amountCents)).toEqual([10000,30000,30000,30000,1]);
  expect(rows.map(r=>r.date)).toEqual(['2026-01-31','2026-01-31','2026-02-28','2026-03-31','2026-04-30']);
  expect(rows.reduce((s,r)=>s+r.amountCents,0)).toBe(100001);
 });
 it('verhindert ungültige oder endlose Pläne',()=>{
  const base={totalCents:100000,downPaymentCents:0,rateCents:10000,firstDueDate:'2026-01-31'};
  for(const change of [{rateCents:0},{downPaymentCents:100000},{downPaymentCents:-1},{rateCents:1},{firstDueDate:'2026-02-30'},{totalCents:0}])expect(()=>installmentSchedule({...base,...change})).toThrow();
 });
});
it('erkennt Aktien und ETFs und entfernt Duplikate und unpassende Währungen',()=>{
 const item={symbol:'OWN',instrument_name:'Eigener ETF',exchange:'XETRA',currency:'EUR',instrument_type:'ETF'};
 const results=parseSuggestions({data:[item,item,{...item,symbol:'STOCK',instrument_type:'Common Stock'},{...item,symbol:'FX',instrument_type:'Forex'},{...item,currency:'JPY'}]});
 expect(results).toHaveLength(2);expect(results[0].type).toBe('ETF');expect(results[0].name).toBe('Eigener ETF');
 expect(()=>parseSuggestions({status:'error'})).toThrow();
});

it('berechnet Zinsen und Tilgung centgenau bis zur vollständigen Rückzahlung',()=>{
 const rows=loanSchedule(100000,1200,2,'2026-01-31');
 expect(rows.map(r=>r.amountCents)).toEqual([50751,50751]);
 expect(rows.map(r=>r.interestCents)).toEqual([1000,502]);
 expect(rows.map(r=>r.principalCents)).toEqual([49751,50249]);
 expect(rows.at(-1)?.balanceCents).toBe(0);
 expect(loanSchedule(100001,0,3,'2026-01-31').map(r=>r.amountCents)).toEqual([33334,33334,33333]);
 for(const apr of [-1,10001,1.5])expect(()=>loanSchedule(100000,apr,12,'2026-01-01')).toThrow();
 for(const months of [0,601,1.5])expect(()=>loanSchedule(100000,500,months,'2026-01-01')).toThrow();
 expect(()=>loanSchedule(2_000_000_000,10000,600,'2026-01-01')).toThrow();
});
