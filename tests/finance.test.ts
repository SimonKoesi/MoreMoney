import { describe, expect, it } from 'vitest';
import { balance, budgetTotals, cents, forecast, monthlyEquivalent } from '../src/lib/finance';
import { command, sameOrigin } from '../src/lib/validation';
describe('Centgenaue Finanzlogik',()=>{
  it('parst deutsche Beträge ohne Float-Addition',()=>{expect(cents('0,10')+cents('0,20')).toBe(30);expect(cents('001,05')).toBe(105);expect(cents('-12.50')).toBe(-1250);expect(()=>cents('1.234,56')).toThrow();expect(()=>cents('1e6')).toThrow();expect(()=>cents('0,001')).toThrow();});
  it('zählt Teilzahlungen einmal und erhält den Planrest',()=>{const item={id:'i',plannedCents:100000,quantity:1};const p=[20000,80000].map(amountCents=>({itemId:'i',accountId:'a',date:'2026-11-22',amountCents,kind:'expense'}));expect(budgetTotals(120000,[item],p)).toEqual({planned:100000,paid:100000,open:0,expected:100000,remaining:20000,forecastRemaining:20000});expect(budgetTotals(120000,[item],p.slice(0,1)).open).toBe(80000);});
  it('nimmt nur die aktive Alternative und berücksichtigt Mehrkosten',()=>{const i={id:'i',plannedCents:100,quantity:2,alternatives:[{active:false,priceCents:1,shippingCents:0},{active:true,priceCents:500,shippingCents:50}]};expect(budgetTotals(1000,[i],[]).forecastRemaining).toBe(-100);});
  it('führt Transfers saldoneutral aus',()=>{const p=[{kind:'transfer-out',amountCents:500,accountId:'a',date:'2026-11-22'},{kind:'transfer-in',amountCents:500,accountId:'b',date:'2026-11-22'}];expect(balance(10000,p)).toBe(10000);});
  it('begrenzt offene Pläne bei Überzahlung auf null',()=>{expect(budgetTotals(50,[{id:'i',plannedCents:100,quantity:1}],[{itemId:'i',kind:'expense',amountCents:150,accountId:'a',date:'2026-11-22'}]).forecastRemaining).toBe(-100);});
  it('rechnet Intervalle nachvollziehbar in Monatswerte um',()=>{expect(monthlyEquivalent(12000,'yearly')).toBe(1000);expect(monthlyEquivalent(3000,'quarterly')).toBe(1000);expect(monthlyEquivalent(1200,'weekly')).toBe(5200);});
  it('zeigt Lücken ohne echte Buchung',()=>{expect(forecast(10000,1000,2000,5000,10000,3)).toEqual({available:-8000,gap:8000});});
});
describe('Eingaben und lokale Grenze',()=>{
  it('verweigert fremde Origins',()=>{expect(sameOrigin(new Request('http://127.0.0.1:3000/api/state',{headers:{origin:'https://fremd.example'}}))).toBe(false);expect(sameOrigin(new Request('http://127.0.0.1:3000/api/state',{headers:{origin:'http://127.0.0.1:3000'}}))).toBe(true);});
  it('verweigert Script-Links und negative Preise',()=>{expect(command.safeParse({op:'link',itemId:crypto.randomUUID(),label:'Test',url:'javascript:alert(1)'}).success).toBe(false);expect(command.safeParse({op:'budget',name:'A',limitCents:-1}).success).toBe(false);});
});
