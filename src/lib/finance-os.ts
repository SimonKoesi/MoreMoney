import {createHash} from 'node:crypto';
import {balance,monthlyEquivalent} from './finance';
import {installmentSchedule} from './installments';
import {berlinDay,addDays,addMonths} from './calendar';
export {berlinDay,validDay,addDays,addMonths} from './calendar';
export type Sub={id:string;name:string;priceCents:number;currency:string;interval:string;customDays:number;startDate:string;minimumMonths:number;nextCharge:string;noticeDays:number;earliestEnd:string;endDate:string;trialEnd:string;autoRenew:boolean;usage:string;status:string;accountId:string|null;category:string};
export function monthlySub(s:Pick<Sub,'priceCents'|'interval'|'customDays'>){return s.interval==='custom'?Math.round(s.priceCents*365/(12*s.customDays)):monthlyEquivalent(s.priceCents,s.interval);}
export function charges(s:Sub,from:string,to:string){
 if(['paused','expired'].includes(s.status)||s.status==='trial'&&!s.trialEnd)return [];
 const end=s.endDate&&s.endDate<to?s.endDate:to;
 const origin=s.nextCharge;let date=origin,step=0;const result:string[]=[];
 while(date<=end&&step<10000){if(date>=from&&date>=s.startDate)result.push(date);step++;
  const months:Record<string,number>={monthly:1,quarterly:3,halfyearly:6,yearly:12};
  date=months[s.interval]?addMonths(origin,step*months[s.interval]):addDays(origin,step*(s.interval==='weekly'?7:s.customDays));
 }
 return result;
}
export function cancellation(s:Sub,now=berlinDay()){
 let end=s.endDate||s.earliestEnd||addMonths(s.startDate,s.minimumMonths);
 if(s.earliestEnd&&s.earliestEnd>end)end=s.earliestEnd;
 const minimum=addMonths(s.startDate,s.minimumMonths);if(end<minimum)end=minimum;
 // Auto-renewal beyond an unknown contract end cannot be inferred safely.
 const deadline=addDays(end,-s.noticeDays);
 return {end,deadline,overdue:deadline<now};
}
export type Rate={currency:string;rateMicros:string;asOf:string};
export function inEuro(amount:number,currency:string,rates:Rate[],day=berlinDay()){
 if(currency==='EUR')return amount;
 const rate=rates.filter(r=>r.currency===currency&&r.asOf<=day).sort((a,b)=>b.asOf.localeCompare(a.asOf))[0];if(!rate)return null;
 const sign=amount<0?-1n:1n,n=BigInt(Math.abs(amount))*BigInt(rate.rateMicros);
 const result=Number((n+500000n)/1000000n*sign);if(!Number.isSafeInteger(result))throw new Error('Summenbereich überschritten.');return result;
}
export const digest=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function recurringSuggestions(transactions:{id:string;payee?:string;title:string;date:string;amountCents:number;kind:string;accountId:string;currency?:string}[],existing:Sub[],rejected:string[]){
 const groups=new Map<string,typeof transactions>();
 for(const t of transactions){if(t.kind!=='expense')continue;const name=(t.payee||t.title).toLocaleLowerCase('de').replace(/\d{5,}/g,'').replace(/\s+/g,' ').trim();if(name.length<3)continue;const key=digest([t.accountId,name,t.currency||'EUR']);groups.set(key,[...(groups.get(key)||[]),t]);}
 const result=[];
 for(const [key,rows] of groups){if(rows.length<3||rejected.includes(key))continue;rows.sort((a,b)=>a.date.localeCompare(b.date));
  const gaps=rows.slice(1).map((r,i)=>(+new Date(r.date)-+new Date(rows[i].date))/86400000);
  const median=[...gaps].sort((a,b)=>a-b)[Math.floor(gaps.length/2)];
  const interval=median>=6&&median<=8?'weekly':median>=26&&median<=35?'monthly':median>=80&&median<=100?'quarterly':median>=170&&median<=195?'halfyearly':median>=350&&median<=380?'yearly':null;
  if(!interval||gaps.some(g=>Math.abs(g-median)>Math.max(3,median*.12)))continue;
  const last=rows.at(-1)!;if(existing.some(s=>s.accountId===last.accountId&&s.name.toLocaleLowerCase('de')===(last.payee||last.title).toLocaleLowerCase('de')))continue;
  const prices=rows.map(r=>r.amountCents);const previous=prices.at(-2)!;
  const nextCharge=interval==='weekly'?addDays(last.date,7):addMonths(last.date,{monthly:1,quarterly:3,halfyearly:6,yearly:12}[interval]);
  result.push({key,name:last.payee||last.title,accountId:last.accountId,currency:last.currency||'EUR',priceCents:last.amountCents,interval,nextCharge,firstDate:rows[0].date,priceIncreaseCents:Math.max(0,last.amountCents-previous),variable:Math.max(...prices)!==Math.min(...prices),count:rows.length});
 }
 return result;
}
export type WorthInput={accounts:{id:string;name:string;openingCents:number;currency:string;includeInWorth:boolean;archived:boolean}[];transactions:Parameters<typeof balance>[1];assets:{id:string;name:string;category:string;currentValueCents:number;currency:string;accountId:string|null;watchStockId:string|null;quantityMicros:string;archived:boolean;source:string;valueDate:string;estimated:boolean}[];liabilities:{id:string;name:string;currentCents:number;currency:string;installmentId:string|null;archived:boolean}[];stocks:{id:string;currency:string;quotes:{priceMicros:string;asOf:string}[]}[];installments:({id:string;name:string;principalCents:number|null}&Parameters<typeof installmentSchedule>[0])[];payments:{installmentId:string|null;installmentIndex:number|null;amountCents:number}[];rates:Rate[]};
export function netWorth(d:WorthInput){
 let assetsCents=0,liabilitiesCents=0,liquidCents=0;const excluded=new Set<string>();const allocation:Record<string,number>={};const values:{id:string;name:string;category:string;value:number|null;currency:string;source:string;stale:boolean;estimated:boolean}[]=[];
 const add=(id:string,name:string,category:string,value:number,currency:string,source:string,date:string,estimated=false)=>{const eur=inEuro(value,currency,d.rates);if(eur===null)excluded.add(currency);else{assetsCents+=eur;allocation[category]=(allocation[category]||0)+eur;}values.push({id,name,category,value:eur,currency,source,stale:date<addDays(berlinDay(),-7),estimated});return eur||0;};
 for(const a of d.accounts){if(a.archived||!a.includeInWorth)continue;const value=balance(a.openingCents,d.transactions.filter(t=>t.accountId===a.id));const eur=inEuro(value,a.currency,d.rates);if(eur===null){excluded.add(a.currency);continue;}if(value<0)liabilitiesCents-=eur;else liquidCents+=add(a.id,a.name,'Konten',value,a.currency,'Kontobuchungen',berlinDay());}
 for(const a of d.assets){if(a.archived||a.accountId)continue;let value=a.currentValueCents,currency=a.currency,source=a.source,date=a.valueDate;const stock=d.stocks.find(s=>s.id===a.watchStockId),quote=stock?.quotes.at(-1);if(stock&&quote){value=Number((BigInt(quote.priceMicros)*BigInt(a.quantityMicros)+5000000000n)/10000000000n);currency=stock.currency;source='Historischer Kurs';date=quote.asOf;}add(a.id,a.name,a.category,value,currency,source,date,a.estimated);}
 for(const l of d.liabilities){if(l.archived||l.installmentId)continue;const eur=inEuro(l.currentCents,l.currency,d.rates);if(eur===null)excluded.add(l.currency);else liabilitiesCents+=eur;}
 for(const p of d.installments){const paid=d.payments.filter(t=>t.installmentId===p.id);const principalPaid=installmentSchedule(p).filter(r=>paid.some(t=>t.installmentIndex===r.index)).reduce((sum,r)=>sum+(r.principalCents||0),0);liabilitiesCents+=p.principalCents!=null?p.principalCents-principalPaid:p.totalCents-paid.reduce((sum,t)=>sum+t.amountCents,0);}
 return {assetsCents,liabilitiesCents,liquidCents,netCents:assetsCents-liabilitiesCents,allocation,values,excludedCurrencies:[...excluded]};
}
