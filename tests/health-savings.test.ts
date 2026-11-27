import {describe,it,expect} from 'vitest';
import {frac,float,interpolate} from '@/lib/exact';
import {HEALTH_MODEL,calculateHealth,emptyHealthInput} from '@/lib/health-score';
import {savingsProjection,distributeSavings,wealthProjection} from '@/lib/savings-math';
import {analysisPeriod,bucketKey} from '@/lib/analysis-periods';
describe('Versionierter Financial Health Score',()=>{
 it('verwendet exakt 100 Prozent Modellgewicht und unbekannte Daten ohne positive oder negative Wertung',()=>{
  expect(Object.values(HEALTH_MODEL.weights).reduce((a,b)=>a+b,0)).toBe(100);
  const result=calculateHealth(emptyHealthInput());expect(result.score).toBeNull();expect(result.coverage).toBe(0);
  const input=emptyHealthInput();input.liquidityMonths={value:frac(600),reason:'synthetisch',evidence:[]};const partial=calculateHealth(input);expect(partial.score).toBeNull();expect(partial.coverage).toBe(25);expect(partial.details[0].displayScore).toBe(100);
 });
 it('interpoliert ohne Spr?nge und normiert ausschlie?lich bekannte Einzelgewichte',()=>{
  expect(float(interpolate(frac(150),HEALTH_MODEL.curves.liquidity))).toBe(40);
  const input=emptyHealthInput();input.liquidityMonths={value:frac(600),reason:'synthetisch',evidence:[]};input.surplusBps={value:frac(3000),reason:'synthetisch',evidence:[]};input.cashflowStability={value:frac(100),reason:'synthetisch',evidence:[]};input.debtServiceBps={value:frac(0),reason:'synthetisch',evidence:[]};
  const result=calculateHealth(input);expect(result.coverage).toBe(57);expect(result.status).toBe('provisional');expect(result.score).toBe(100);
 });
 it('bleibt deterministisch in Grenzen und ist bei mehr Reserve bzw. h?herer Kreditlast monoton',()=>{
  const input=emptyHealthInput();for(const key of Object.keys(input) as (keyof typeof input)[])input[key]={value:frac(100),reason:'synthetisch',evidence:[]};
  let previous=-1;for(let months=0;months<=700;months+=7){const result=calculateHealth({...input,liquidityMonths:{...input.liquidityMonths,value:frac(months)}});expect(result.score).toBeGreaterThanOrEqual(previous);previous=result.score!;expect(result.score).toBeLessThanOrEqual(100);expect(result).toEqual(calculateHealth({...input,liquidityMonths:{...input.liquidityMonths,value:frac(months)}}));}
  previous=101;for(let bps=0;bps<=8000;bps+=100){const result=calculateHealth({...input,debtServiceBps:{...input.debtServiceBps,value:frac(bps)}});expect(result.score).toBeLessThanOrEqual(previous);previous=result.score!;expect(result.score).toBeGreaterThanOrEqual(0);}
 });
});
describe('Sparplan und Cent-Verteilung',()=>{
 const plan={savedCents:10000,targetCents:40000,monthlyRateCents:10000,startDate:'2026-01-31',targetDate:'2026-04-30',interval:'monthly',interestBps:0,status:'active'};
 it('berechnet echte zuk?nftige Einzahlungstermine mit Monatsende und fehlender Rate',()=>{
  const result=savingsProjection(plan,'2026-01-31');expect(result.reachedAt).toBe('2026-04-30');expect(result.requiredRateCents).toBe(10000);expect(result.contributionCents).toBe(30000);
  expect(savingsProjection({...plan,monthlyRateCents:0},'2026-01-31').reachedAt).toBeNull();expect(savingsProjection({...plan,status:'paused'},'2026-01-31').status).toBe('paused');
  expect(savingsProjection({...plan,savedCents:50000},'2026-01-31').status).toBe('reached');expect(savingsProjection({...plan,targetDate:'2026-01-30'},'2026-01-31').requiredRateCents).toBeNull();
 });
 it('erh?lt jeden Cent und teilt kein Kapital mehrfach zu',()=>{
  const goals=[{id:'a',remainingCents:1000,priority:1},{id:'b',remainingCents:1000,priority:3},{id:'c',remainingCents:1000,priority:5}];
  const result=distributeSavings(100,goals,'equal');expect(result.allocations.map(v=>v.amountCents)).toEqual([34,33,33]);expect(result.allocations.reduce((sum,g)=>sum+g.amountCents,0)+result.unallocatedCents).toBe(100);
  expect(()=>distributeSavings(100,goals.map(g=>({...g,percent:30})),'percent')).toThrow();
  const capped=distributeSavings(1000,[{id:'a',remainingCents:10,priority:1}],'equal');expect(capped.allocations[0].amountCents).toBe(10);expect(capped.unallocatedCents).toBe(990);
  const capacity=[{id:'a',remainingCents:10,priority:1,percent:50},{id:'b',remainingCents:1000,priority:3,percent:50}];
  expect(distributeSavings(100,capacity,'equal').allocations.map(v=>v.amountCents)).toEqual([10,90]);
  expect(distributeSavings(100,capacity,'percent').unallocatedCents).toBe(40);
  expect(wealthProjection(10000,1000,1,0,0)).toEqual({nominalCents:22000,realCents:22000});
 });
});
it('beachtet Schaltjahre, abgeschlossene Monate und ISO-Wochenjahre',()=>{
 const leap=analysisPeriod('lastMonth','','','2024-03-31');expect(leap.from).toBe('2024-02-01');expect(leap.to).toBe('2024-02-29');
 expect(analysisPeriod('month','','','2026-03-31').comparable).toBe(false);expect(bucketKey('2021-01-01','week')).toBe('2020-W53');expect(()=>analysisPeriod('custom','2026-02-30','2026-03-01')).toThrow();
});
