import {addDays,addMonths,berlinDay,validDay} from './calendar';
import {round,frac} from './exact';
export type ExpenseBudget={id:string;name:string;limitCents:number;categoryScope:string;period:string;startDate:string;periodDays:number;repeating:boolean;rollover:boolean;warningThresholds:string};
export function budgetWindow(b:ExpenseBudget,today=berlinDay()){
 if(!validDay(b.startDate)||b.periodDays<1||b.periodDays>3660)throw new Error('Budgetzeitraum prüfen.');
 const next=(n:number)=>b.period==='monthly'?addMonths(b.startDate,n):b.period==='yearly'?addMonths(b.startDate,n*12):addDays(b.startDate,n*(b.period==='weekly'?7:b.periodDays));
 let index=0;while(b.repeating&&next(index+1)<=today&&index<10000)index++;
 const from=next(index),to=addDays(next(index+1),-1);return {from,to,index,next};
}
export function spendingBudget(b:ExpenseBudget,parts:{id:string;date:string;category:string;eurCents:number;kind:string}[],today=berlinDay()){
 const window=budgetWindow(b,today);const matching=(from:string,to:string)=>parts.filter(t=>t.kind==='expense'&&t.date>=from&&t.date<=to&&(!b.categoryScope||t.category===b.categoryScope||t.category.startsWith(b.categoryScope+' / ')));
 let carry=0;if(b.rollover&&b.repeating){for(let n=0;n<Math.min(window.index,600);n++){const from=window.next(n),to=addDays(window.next(n+1),-1),spent=matching(from,to).reduce((s,t)=>s+t.eurCents,0);carry=Math.max(0,carry+b.limitCents-spent);}}
 const rows=matching(window.from,window.to),spent=rows.reduce((s,t)=>s+t.eurCents,0),limit=b.limitCents+carry,remaining=limit-spent,daysRemaining=Math.max(0,Math.round((+new Date(window.to)-+new Date(today))/86400000)+1),elapsed=Math.max(1,Math.round((+new Date(today)-+new Date(window.from))/86400000)+1),periodDays=Math.round((+new Date(window.to)-+new Date(window.from))/86400000)+1;
 const usedBps=limit?round(frac(BigInt(spent)*10000n,limit)):spent?10001:0;const status=usedBps<7000?'normal':usedBps<9000?'watch':usedBps<=10000?'near-limit':'exceeded';
 return {id:b.id,name:b.name,category:b.categoryScope,from:window.from,to:window.to,active:today>=window.from&&today<=window.to,limitCents:limit,baseCents:b.limitCents,carryCents:carry,spentCents:spent,remainingCents:remaining,usedBps,status,daysRemaining,dailyAvailableCents:daysRemaining?Math.max(0,Math.floor(remaining/daysRemaining)):0,forecastCents:today>window.to?spent:round(frac(BigInt(spent)*BigInt(periodDays),elapsed)),sourceIds:[...new Set(rows.map(t=>t.id))],thresholds:b.warningThresholds.split(',').map(Number).filter(v=>Number.isInteger(v)&&v>0&&v<=100).sort((a,b)=>a-b)};
}
