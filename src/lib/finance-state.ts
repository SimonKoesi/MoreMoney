import {bankConfiguration} from './bank-provider';
import {balance} from './finance';
import {db,ready} from './db';
import {berlinDay,addMonths,addDays,cancellation,charges,inEuro,monthlySub,netWorth,recurringSuggestions,digest} from './finance-os';
export async function financeState(reason='daily',persist=true){
 await ready();
 const [accounts,transactions,subscriptionRows,history,assets,liabilities,rates,stocks,installments,rejected,documents,rules,batches,goals,consents,settings,categoriesSaved]=await Promise.all([
  db.account.findMany(),db.transaction.findMany({where:{bookingStatus:'booked'},orderBy:{date:'asc'}}),db.subscription.findMany({orderBy:{name:'asc'},include:{logo:{select:{updatedAt:true}}}}),db.subscriptionHistory.findMany({orderBy:{effectiveDate:'asc'}}),db.asset.findMany({orderBy:{name:'asc'}}),db.liability.findMany({orderBy:{name:'asc'}}),db.fxRate.findMany(),db.watchStock.findMany({include:{quotes:{orderBy:[{asOf:'asc'},{updatedAt:'asc'}]}}}),db.installmentPurchase.findMany(),db.rejectedSuggestion.findMany(),db.document.findMany(),db.categoryRule.findMany(),db.importBatch.findMany({orderBy:{createdAt:'desc'},take:100}),db.financeGoal.findMany(),db.privacyConsent.findMany(),db.userSettings.findUniqueOrThrow({where:{id:'local'}}),db.categoryConfig.findMany({select:{name:true},orderBy:{name:'asc'}})
 ]);
 const subscriptions=subscriptionRows.map(({logo,...row})=>({...row,logoVersion:logo?.updatedAt.toISOString()??null}));
 const day=berlinDay();const worth=netWorth({accounts,transactions,assets,liabilities,rates,stocks,installments,payments:transactions});
 const snapshot={day,assetsCents:String(worth.assetsCents),liabilitiesCents:String(worth.liabilitiesCents),liquidCents:String(worth.liquidCents),netCents:String(worth.netCents),allocations:JSON.stringify(worth.allocation),excludedCurrencies:JSON.stringify(worth.excludedCurrencies),reason};
 if(persist)await db.worthSnapshot.upsert({where:{eventKey:'daily:'+day},create:{...snapshot,eventKey:'daily:'+day},update:{}});
 if(persist&&reason!=='daily'){
  const last=await db.worthSnapshot.findFirst({orderBy:{createdAt:'desc'}});
  if(!last||last.netCents!==snapshot.netCents||last.assetsCents!==snapshot.assetsCents||last.liabilitiesCents!==snapshot.liabilitiesCents)await db.worthSnapshot.create({data:{...snapshot,eventKey:'change:'+crypto.randomUUID()}});
 }
 const snapshots=await db.worthSnapshot.findMany({orderBy:{createdAt:'asc'},take:5000});
 const calendar=subscriptions.flatMap(s=>[
  ...charges(s,day,addDays(day,366)).map(date=>({id:s.id+':charge:'+date,subscriptionId:s.id,name:s.name,date,type:'charge' as const,amountCents:s.priceCents,currency:s.currency})),
  ...(s.endDate||s.earliestEnd?[{id:s.id+':cancel',subscriptionId:s.id,name:s.name,date:cancellation(s).deadline,type:'deadline' as const,amountCents:0,currency:s.currency}]:[]),
  ...(s.trialEnd?[{id:s.id+':trial',subscriptionId:s.id,name:s.name,date:s.trialEnd,type:'trial' as const,amountCents:0,currency:s.currency}]:[])
 ]).sort((a,b)=>a.date.localeCompare(b.date));
 const monthly=subscriptions.reduce((sum,s)=>sum+(!['paused','expired'].includes(s.status)&&(!s.endDate||s.endDate>=day)?inEuro(monthlySub(s),s.currency,rates)||0:0),0);
 const potential=subscriptions.filter(s=>s.status==='active'&&s.usage==='never').reduce((sum,s)=>sum+(inEuro(monthlySub(s),s.currency,rates)||0),0);
 const realized=subscriptions.filter(s=>s.status==='cancelled'&&s.endDate&&s.endDate<day).reduce((sum,s)=>sum+(inEuro(monthlySub(s),s.currency,rates)||0),0);
 const month=day.slice(0,7),income=transactions.filter(t=>t.kind==='income'&&t.date.startsWith(month)).reduce((sum,t)=>sum+(inEuro(t.amountCents,t.currency,rates)||0),0);
 const trend=Array.from({length:12},(_,index)=>{const month=addMonths(day.slice(0,7)+'-01',index-11).slice(0,7);let known=false;const value=subscriptions.reduce((sum,s)=>{const entry=history.filter(h=>h.subscriptionId===s.id&&h.effectiveDate<=month+'-31').at(-1);if(!entry)return sum;known=true;return ['active','trial'].includes(entry.status)?sum+(inEuro(monthlySub({...s,priceCents:entry.priceCents}),entry.currency,rates)||0):sum;},0);return {month,value:known?value:null};});
 const suggestions=recurringSuggestions(transactions,subscriptions,rejected.map(v=>v.key)).filter(v=>!subscriptions.some(s=>s.suggestionKey===v.key));
 const categories=subscriptions.filter(s=>s.status==='active').reduce<Record<string,number>>((sum,s)=>{sum[s.category]=(sum[s.category]||0)+(inEuro(monthlySub(s),s.currency,rates)||0);return sum;},{});
 return {savedCategories:categoriesSaved.map(row=>row.name),transactionCategories:[...new Set(transactions.map(t=>t.category))],accounts:accounts.map(a=>({...a,balanceCents:balance(a.openingCents,transactions.filter(t=>t.accountId===a.id)),lastBookingDate:transactions.filter(t=>t.accountId===a.id).at(-1)?.date||null})),subscriptions,history,assets,liabilities,rates,documents,rules,batches,goals,consents,settings,worth,snapshots,stocks:stocks.map(s=>({id:s.id,name:s.name,symbol:s.symbol,currency:s.currency})),installments,suggestions,calendar,summary:{monthlyCents:monthly,annualCents:monthly*12,potentialCents:potential,realizedCents:realized,incomeShare:income?Math.round(monthly/income*10000)/100:null,active:subscriptions.filter(s=>s.status==='active').length,paused:subscriptions.filter(s=>s.status==='paused').length,cancelled:subscriptions.filter(s=>s.status==='cancelled').length,trend,categories},bank:bankConfiguration(),stateHash:digest([worth.netCents,monthly])};
}
export type FinanceState=Awaited<ReturnType<typeof financeState>>;
