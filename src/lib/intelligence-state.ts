import {openBankingState} from './open-banking';
import {db,ready} from './db';
import {financeState} from './finance-state';
import {analysisPeriod,bucketKey} from './analysis-periods';
import {berlinDay,addDays} from './calendar';
import {inEuro,digest} from './finance-os';
import {installmentSchedule} from './installments';
import {monthlyEquivalent} from './finance';
import {savingsProjection} from './savings-math';
import {spendingBudget} from './spending-budgets';
import {calculateHealth,emptyHealthInput,HEALTH_MODEL,type HealthInput} from './health-score';
import {frac,plus,minus,times,divide,compare,bound,round,exactJSON,interpolate} from './exact';
import {mutedNotificationCategories} from './notification-preferences';
export type AnalysisQuery={period?:string;from?:string;to?:string;group?:'day'|'week'|'month'|'year';category?:string;accountId?:string;kind?:string;search?:string;minimumCents?:number;maximumCents?:number};
export async function intelligenceState(query:AnalysisQuery={},simulation?:{incomeDeltaCents?:number;cashDeltaCents?:number;fixedReductionCents?:number;debtRateDeltaCents?:number}){
 await ready();const base=await financeState('daily',!simulation);
 const [transactions,splits,goals,movements,budgets,coverage,quality,recurring,categoryConfigs]=await Promise.all([
  db.transaction.findMany({where:{bookingStatus:'booked',date:{lte:berlinDay()}},orderBy:[{date:'asc'},{createdAt:'asc'}]}),db.transactionSplit.findMany(),db.savingsGoal.findMany({orderBy:{priority:'asc'}}),db.goalMovement.findMany({orderBy:[{day:'asc'},{createdAt:'asc'}]}),db.budget.findMany({where:{mode:'spending',archived:false}}),db.monthCoverage.findMany({orderBy:{month:'asc'}}),db.dataQualityConfig.findUnique({where:{id:'local'}}),db.recurringPayment.findMany(),db.categoryConfig.findMany()
 ]);
 const today=berlinDay(),currentMonth=today.slice(0,7),range=analysisPeriod(query.period||'month',query.from,query.to,today);const currencies=new Set<string>();
 const converted=transactions.map(t=>{const eurCents=inEuro(t.amountCents,t.currency,base.rates,t.date);if(eurCents===null)currencies.add(t.currency);return {...t,eurCents};});
 const splitByTransaction=new Map<string,typeof splits>();
 for(const split of splits){const rows=splitByTransaction.get(split.transactionId)||[];rows.push(split);splitByTransaction.set(split.transactionId,rows);}
 const parts=converted.flatMap(t=>{
  const rows=splitByTransaction.get(t.id)||[];
  const kind=t.financialRole==='refund'?'expense':t.kind;
  const values=rows.length?rows.map(s=>({category:s.category,amount:s.amountCents})):[{category:t.category||'Sonstiges',amount:t.amountCents}];
  let subtotal=0,previousValue=0;
  return values.map(value=>{
   subtotal+=value.amount;
   const total=inEuro(subtotal,t.currency,base.rates,t.date);
   const eurCents=total===null?null:(total-previousValue)*(t.financialRole==='refund'?-1:1);
   previousValue=total??0;
   return {id:t.id,date:t.date,kind,category:value.category,eurCents,financialRole:t.financialRole,accountId:t.accountId,payee:t.payee||t.title};
  });
 });
 const regular=(role:string)=>['ordinary','salary'].includes(role);
 const ordinaryIncome=(role:string)=>!['loan','asset-sale','refund','investment'].includes(role);
 const matches=(t:typeof converted[number])=>
  (!query.accountId||t.accountId===query.accountId)&&(!query.kind||t.kind===query.kind)&&
  (!query.search||(t.title+' '+t.payee+' '+t.note+' '+t.tags).toLocaleLowerCase('de').includes(query.search.toLocaleLowerCase('de')))&&
  (query.minimumCents===undefined||t.amountCents>=query.minimumCents)&&(query.maximumCents===undefined||t.amountCents<=query.maximumCents);
 const matchesCategory=(part:typeof parts[number])=>!query.category||part.category===query.category||part.category.startsWith(query.category+' / ');
 const selected=converted.filter(t=>t.date>=range.from&&t.date<=range.to&&matches(t));
 const selectedIds=new Set(selected.map(t=>t.id));
 const filteredParts=parts.filter(t=>selectedIds.has(t.id)&&matchesCategory(t));
 const income=filteredParts.filter(t=>t.kind==='income'&&ordinaryIncome(t.financialRole)).reduce((s,t)=>s+(t.eurCents||0),0),expenses=filteredParts.filter(t=>t.kind==='expense').reduce((s,t)=>s+(t.eurCents||0),0);
 const previousIds=new Set(converted.filter(t=>t.date>=range.previousFrom&&t.date<=range.previousTo&&matches(t)).map(t=>t.id));
 const previousParts=parts.filter(t=>previousIds.has(t.id)&&matchesCategory(t));
 const previousIncome=previousParts.filter(t=>t.kind==='income'&&ordinaryIncome(t.financialRole)).reduce((s,t)=>s+(t.eurCents||0),0),previousExpenses=previousParts.filter(t=>t.kind==='expense').reduce((s,t)=>s+(t.eurCents||0),0);
 const categories=Object.entries(filteredParts.filter(t=>t.kind==='expense').reduce<Record<string,number>>((s,t)=>{s[t.category]=(s[t.category]||0)+(t.eurCents||0);return s;},{})).map(([name,value])=>({name,value,color:categoryConfigs.find(c=>c.name===name)?.color||null,icon:categoryConfigs.find(c=>c.name===name)?.icon||null}));
 const groups=new Map<string,{period:string;incomeCents:number;expenseCents:number;surplusCents:number}>();
 for(const t of filteredParts){const key=bucketKey(t.date,query.group||'month');const group=groups.get(key)||{period:key,incomeCents:0,expenseCents:0,surplusCents:0};if(t.kind==='income'&&ordinaryIncome(t.financialRole))group.incomeCents+=t.eurCents||0;else if(t.kind==='expense')group.expenseCents+=t.eurCents||0;group.surplusCents=group.incomeCents-group.expenseCents;groups.set(key,group);}
 const budgetReports=budgets.map(b=>spendingBudget(b,parts.filter((p):p is typeof p&{eurCents:number}=>p.eurCents!==null),today));
 const movementsByGoal=new Map<string,typeof movements>();
 const assignedIncome=new Map<string,number>();
 for(const movement of movements){
  const history=movementsByGoal.get(movement.goalId)||[];
  history.push(movement);movementsByGoal.set(movement.goalId,history);
  if(movement.fundingTransactionId&&['deposit','correction'].includes(movement.kind))assignedIncome.set(movement.fundingTransactionId,(assignedIncome.get(movement.fundingTransactionId)||0)+movement.amountCents);
 }
 const goalReports=goals.map(goal=>{const normalized={...goal,startDate:goal.startDate||berlinDay(goal.createdAt)};return {...goal,projection:savingsProjection(normalized,today),movements:movementsByGoal.get(goal.id)||[],reservedCents:goal.accountId?goal.savedCents:0};});
 const savingsAccounts=new Set(goals.flatMap(goal=>goal.accountId?[goal.accountId]:[]));
 const goalFunding=transactions.filter(t=>savingsAccounts.has(t.accountId)&&t.kind==='income'&&['ordinary','salary'].includes(t.financialRole)).map(t=>({id:t.id,accountId:t.accountId,currency:t.currency,date:t.date,title:t.title,remainingCents:t.amountCents-(assignedIncome.get(t.id)||0)})).filter(t=>t.remainingCents>0).slice(-150).reverse();
 const reserved=goals.filter(g=>g.accountId&&g.category!=='Notgroschen').reduce((sum,g)=>sum+(inEuro(g.savedCents,g.currency,base.rates)||0),0);
 const events=base.calendar.filter(e=>e.type==='charge').map(e=>({...e,id:e.id,eurCents:inEuro(e.amountCents,e.currency,base.rates),booked:converted.some(t=>t.kind==='expense'&&t.date===e.date&&(t.payee||t.title).toLocaleLowerCase('de').includes(e.name.toLocaleLowerCase('de'))&&t.amountCents===e.amountCents&&t.currency===e.currency)}));
 const loanEvents=base.installments.flatMap(p=>installmentSchedule(p).filter(row=>!transactions.some(t=>t.installmentId===p.id&&t.installmentIndex===row.index)).map(row=>({id:p.id+':'+row.index,subscriptionId:p.id,name:p.name,date:row.date,type:'charge' as const,amountCents:row.amountCents,currency:'EUR',eurCents:row.amountCents,booked:false})));
 const upcoming=[...events,...loanEvents].filter(e=>!e.booked&&e.date>=today&&e.date<=addDays(today,90)).sort((a,b)=>a.date.localeCompare(b.date));
 const due14=upcoming.filter(e=>e.date<=addDays(today,14)).reduce((sum,e)=>sum+(e.eurCents||0),0);
 const expenseMonths=coverage.filter(c=>c.expensesComplete&&c.month<currentMonth).slice(-6).filter(c=>!converted.some(t=>t.date.startsWith(c.month)&&t.kind==='expense'&&t.eurCents===null));
 const knownMonths=coverage.filter(c=>c.incomeComplete&&c.expensesComplete&&c.month<currentMonth).slice(-6).filter(c=>!converted.some(t=>t.date.startsWith(c.month)&&(t.eurCents===null||t.kind==='income'&&t.financialRole==='unknown')));
 const monthly=knownMonths.map(month=>{const rows=converted.filter(t=>t.date.startsWith(month.month));const income=rows.filter(t=>t.kind==='income'&&regular(t.financialRole)).reduce((sum,t)=>sum+(t.eurCents||0),0),expense=rows.filter(t=>t.kind==='expense'&&!['investment','savings'].includes(t.financialRole)).reduce((sum,t)=>sum+(t.eurCents||0),0),refund=rows.filter(t=>t.financialRole==='refund').reduce((sum,t)=>sum+(t.eurCents||0),0);return {month:month.month,incomeCents:income,expenseCents:expense-refund,surplusCents:income-expense+refund,sourceIds:rows.map(t=>t.id)};});
 const months=monthly.length,incomeAverage=months?frac(monthly.reduce((s,m)=>s+m.incomeCents,0),months):null,expenseAverage=months?frac(monthly.reduce((s,m)=>s+m.expenseCents,0),months):null;
 const cashAverage=incomeAverage&&expenseAverage?minus(incomeAverage,expenseAverage):null;
 const essential=quality?JSON.parse(quality.essentialCategories) as string[]:[];
 const necessarySum=parts.filter(t=>expenseMonths.some(m=>t.date.startsWith(m.month))&&t.kind==='expense'&&essential.some(category=>t.category===category||t.category.startsWith(category+' / '))).reduce((sum,t)=>sum+(t.eurCents||0),0);
 const necessaryAverage=expenseMonths.length&&essential.length?frac(necessarySum,expenseMonths.length):null;
 const liveLinks=openBankingState();
 const includedAccounts=new Set(base.accounts.filter(a=>a.includeInWorth&&!a.archived).map(a=>a.id));
 const staleBanks=liveLinks.environment==='PRODUCTION'&&liveLinks.links.some(link=>includedAccounts.has(link.id)&&(link.expired||link.stale));
 const lastQuality=await db.dataQualitySnapshot.findFirst({orderBy:{day:'desc'},select:{day:true,score:true,coverage:true}});
 const fresh=quality?Date.now()-Number(quality.updatedAt)<30*86400000:false;
 const input=emptyHealthInput();const put=(key:keyof HealthInput,value:ReturnType<typeof frac>,reason:string,evidence:string[]=[])=>{input[key]={value,reason,evidence:evidence.slice(0,100)};};
 const bankDebt=base.accounts.filter(a=>a.balanceCents<0).reduce((sum,a)=>sum+(inEuro(-a.balanceCents,a.currency,base.rates)||0),0);
 const allCashValued=!staleBanks&&base.accounts.filter(a=>a.includeInWorth&&!a.archived).every(a=>inEuro(a.balanceCents,a.currency,base.rates)!==null);
 const cash=base.worth.liquidCents-bankDebt+(simulation?.cashDeltaCents||0)-reserved-due14;
 if(fresh&&quality?.accountsComplete&&allCashValued&&necessaryAverage&&necessaryAverage.n>0n)put('liquidityMonths',times(divide(frac(Math.max(0,cash)),necessaryAverage),frac(600,quality.targetReserveMonths)),'Frei verfügbare liquide Mittel nach Zweckbindungen und bekannten 14-Tage-Verpflichtungen; Reichweite auf individuelles Reserveziel normiert.',base.accounts.filter(a=>a.includeInWorth&&!a.archived).map(a=>a.id));
 const monthlyIncome=incomeAverage?plus(incomeAverage,frac(simulation?.incomeDeltaCents||0)):null;
 const monthlySurplus=cashAverage?plus(cashAverage,frac((simulation?.incomeDeltaCents||0)+(simulation?.fixedReductionCents||0)-(simulation?.debtRateDeltaCents||0))):null;
 if(fresh&&quality?.incomeReviewed&&monthlyIncome&&monthlyIncome.n>0n&&monthlySurplus)put('surplusBps',times(divide(monthlySurplus,monthlyIncome),frac(10000)),'Bereinigte laufende Einnahmen minus tatsächliche Ausgaben aus bestätigten abgeschlossenen Monaten.',monthly.flatMap(m=>m.sourceIds));
 if(months>=3)put('cashflowStability',frac(monthly.filter(m=>m.surplusCents>=0).length*100,months),'Anteil nichtnegativer Cashflow-Monate; außergewöhnliche Ausgaben werden nicht ausgeblendet.',monthly.flatMap(m=>m.sourceIds));
 if(fresh&&quality?.savingsReviewed&&quality.accountsComplete&&allCashValued&&monthlyIncome&&monthlyIncome.n>0n&&monthlySurplus){const accumulated=compare(monthlySurplus,frac(0))>0?monthlySurplus:frac(0);put('savingsBps',times(divide(accumulated,monthlyIncome),frac(10000)),'Nachweislich verbleibender bereinigter Überschuss bei bestätigter vollständiger Konto-, Einnahmen- und Ausgabenerfassung. Investitionsauszahlungen sind Vermögensumschichtung; virtuelle Spartöpfe werden nicht addiert.',monthly.flatMap(m=>m.sourceIds));}
 const standalone=base.liabilities.filter(l=>!l.archived&&!l.installmentId),hasUnknownRate=standalone.some(l=>l.currentCents>0&&!l.rateCents);
 const service=standalone.reduce((sum,l)=>sum+(inEuro(l.rateCents,l.currency,base.rates)||0),0)+base.installments.filter(p=>loanEvents.some(e=>e.subscriptionId===p.id)).reduce((sum,p)=>sum+p.rateCents,0)+(simulation?.debtRateDeltaCents||0);
 const highService=standalone.filter(l=>l.interestBps>=(quality?.highInterestBps||1000)).reduce((sum,l)=>sum+(inEuro(l.rateCents,l.currency,base.rates)||0),0)+base.installments.filter(p=>(p.interestBps||0)>=(quality?.highInterestBps||1000)&&loanEvents.some(e=>e.subscriptionId===p.id)).reduce((sum,p)=>sum+p.rateCents,0);
 const debtKnown=fresh&&quality?.debtsComplete&&!hasUnknownRate&&!standalone.some(l=>inEuro(l.currentCents,l.currency,base.rates)===null||inEuro(l.rateCents,l.currency,base.rates)===null)&&!base.accounts.some(a=>a.balanceCents<0&&(a.archived||!a.includeInWorth));
 if(debtKnown){if(service<=0){put('debtServiceBps',frac(0),'Keine bestätigten laufenden Kreditraten.');put('highInterestBurden',frac(100),'Keine bestätigten hochverzinsten Raten.');}else if(monthlyIncome&&monthlyIncome.n>0n){put('debtServiceBps',times(divide(frac(service),monthlyIncome),frac(10000)),'Bestätigte Monatsraten im Verhältnis zu laufenden Nettoeinnahmen.',standalone.map(l=>l.id));put('highInterestBurden',interpolate(times(divide(frac(highService),monthlyIncome),frac(10000)),[[0,100],[1000,80],[2000,50],[4000,0]]),'Belastung durch Raten oberhalb der gewählten Hochzinsgrenze.');}}
 const overdue=loanEvents.filter(e=>e.date<today);
 if(debtKnown&&quality?.obligationsComplete)put('arrears',overdue.length?frac(0):frac(100),'Nur bei bestätigter Vollständigkeit der Zahlungsverpflichtungen und tatsächlichen Zahlungen; offene vergangene Planraten zählen als Rückstand.',overdue.map(e=>e.id));
 const fixed=base.summary.monthlyCents+recurring.filter(r=>r.kind==='expense'&&r.status==='active').reduce((sum,r)=>sum+monthlyEquivalent(r.amountCents,r.interval),0)-(simulation?.fixedReductionCents||0);
 if(fresh&&quality?.incomeReviewed&&quality.obligationsComplete&&monthlyIncome&&monthlyIncome.n>0n)put('fixedBps',times(divide(frac(Math.max(0,fixed)),monthlyIncome),frac(10000)),'Bestätigte Abonnements und wiederkehrende Planwerte gegenüber regelmäßigen Einnahmen.');
 const activeBudgets=budgetReports.filter(b=>b.active&&b.limitCents>0),totalBudget=activeBudgets.find(b=>!b.category),disjoint=totalBudget?[totalBudget]:activeBudgets.filter(b=>!activeBudgets.some(other=>other.id!==b.id&&other.category&&b.category.startsWith(other.category+' / ')));
 if(disjoint.length&&coverage.some(c=>c.month===currentMonth&&c.expensesComplete)&&!parts.some(t=>t.kind==='expense'&&t.eurCents===null&&disjoint.some(b=>t.date>=b.from&&t.date<=b.to))){const budgetTotal=disjoint.reduce((sum,b)=>sum+b.limitCents,0),exceeded=disjoint.reduce((sum,b)=>sum+Math.max(0,b.spentCents-b.limitCents),0);put('budgetAdherence',bound(minus(frac(100),frac(BigInt(exceeded)*100n,budgetTotal))),'Betragsgewichtet. Gesamtbudget hat Vorrang; sonst werden überlappende Unterbudgets ausgeschlossen.',disjoint.map(b=>b.id));}
 if(expenseMonths.length>=3&&necessaryAverage&&necessaryAverage.n>0n){const values=expenseMonths.map(m=>parts.filter(t=>t.date.startsWith(m.month)&&t.kind==='expense'&&essential.some(c=>t.category===c||t.category.startsWith(c+' / '))).reduce((sum,t)=>sum+(t.eurCents||0),0));const deviation=values.reduce((sum,value)=>plus(sum,compare(frac(value),necessaryAverage)>=0?minus(frac(value),necessaryAverage):minus(necessaryAverage,frac(value))),frac(0));put('expenseStability',bound(minus(frac(100),times(divide(divide(deviation,frac(expenseMonths.length)),necessaryAverage),frac(100)))),'Mittlere absolute relative Abweichung notwendiger Ausgaben in bestätigten Monaten.');}
 const activeGoals=goalReports.filter(g=>g.status==='active'&&g.projection.remainingCents>0),planned=activeGoals.reduce((sum,g)=>sum+(inEuro(monthlyEquivalent(Math.max(g.monthlyRateCents,g.projection.requiredRateCents||0),g.interval),g.currency,base.rates)||0),0);
 if(fresh&&monthlySurplus&&monthlyIncome&&monthlyIncome.n>0n&&activeGoals.length&&planned>0){const floor=times(monthlyIncome,frac(5,100)),required=compare(frac(planned),floor)<0?floor:frac(planned);put('goalCoverage',bound(times(divide(compare(monthlySurplus,frac(0))<0?frac(0):monthlySurplus,required),frac(100))),'Nachhaltiger Überschuss geteilt durch erforderliche Sparrate, mindestens 5 % des regelmäßigen Einkommens als Modelluntergrenze. Die Zahl der Ziele ist kein Bewertungskriterium.',activeGoals.map(g=>g.id));}
 if(fresh&&quality?.longTermReviewed&&necessaryAverage&&necessaryAverage.n>0n)put('longTermPlanning',bound(times(divide(frac(Math.max(0,cash)),times(necessaryAverage,frac(6))),frac(100))),'Dokumentiertes Modell: verfügbare Rücklagen im Verhältnis zu sechs Monaten notwendiger Ausgaben. Keine bestimmte Anlageform vorausgesetzt.');
 if(fresh&&quality?.savingsReviewed&&planned>0&&months&&monthlyIncome&&compare(frac(planned),times(monthlyIncome,frac(5,100)))>=0){const knownStart=movements.filter(m=>m.kind==='initial').map(m=>m.day).sort()[0];const measured=knownStart?knownMonths.filter(m=>m.month+'-01'>=knownStart):[];if(measured.length){const actual=movements.filter(m=>m.kind==='deposit'&&measured.some(c=>m.day.startsWith(c.month))).reduce((sum,m)=>sum+m.amountCents,0);put('goalExecution',bound(frac(BigInt(actual)*100n,BigInt(planned)*BigInt(measured.length))),'Tatsächliche neue Zuordnungen gegenüber Planraten, nur vollständig erfasste Monate seit Beginn der Sparhistorie.',movements.map(m=>m.id));}}
 if(fresh&&quality?.obligationsComplete&&quality.accountsComplete&&allCashValued){const due=due14+overdue.reduce((sum,e)=>sum+e.amountCents,0);put('obligationCoverage',due?bound(frac(BigInt(Math.max(0,base.worth.liquidCents-reserved))*100n,due)):frac(100),'Deckung bestätigter offener Raten und kommender 14-Tage-Verpflichtungen. Fehlende Fristdaten werden nicht als Pünktlichkeit interpretiert.',upcoming.slice(0,100).map(e=>e.id));}
 const health=calculateHealth(input),serializedInputs=Object.fromEntries(Object.entries(input).map(([key,m])=>[key,{...m,value:m.value?exactJSON(m.value):null}]));
 const scoreVersion=HEALTH_MODEL.version+';reserve='+String(quality?.targetReserveMonths||6)+';high='+String(quality?.highInterestBps||1000),scoreHash=digest([serializedInputs,scoreVersion]);
 if(!simulation)await db.healthSnapshot.upsert({where:{eventKey:scoreVersion+':'+today+':'+scoreHash},create:{eventKey:scoreVersion+':'+today+':'+scoreHash,day:today,version:scoreVersion,score:health.score,exactScore:JSON.stringify(health.exact),coverage:JSON.stringify(health.exactCoverage),inputs:JSON.stringify(serializedInputs),details:JSON.stringify(health.details),reason:'financial-data'},update:{}});
 const warnings:{key:string;title:string;description:string;priority:number;category:string;impactCents:number;route:string;sourceIds:string[]}[]=[];
 for(const a of base.accounts.filter(a=>a.balanceCents<0))warnings.push({key:'negative:'+a.id,title:'Negativer erfasster Kontostand',description:a.name+' hat nach den gespeicherten Buchungen einen negativen Bestand.',priority:100,category:'liquidity',impactCents:Math.abs(a.balanceCents),route:'#/bank',sourceIds:[a.id]});
 if(staleBanks)warnings.push({key:'stale-bank',title:'Bankdaten prüfen',description:'Mindestens ein berücksichtigtes Onlinekonto ist veraltet oder benötigt eine neue Freigabe.',priority:80,category:'quality',impactCents:0,route:'#/bank',sourceIds:[]});
 if(quality?.accountsComplete&&due14>Math.max(0,base.worth.liquidCents-reserved))warnings.push({key:'cash-gap:'+today,title:'Bekannte Zahlungen übersteigen freie Liquidität',description:'Die bekannten offenen Zahlungen der nächsten 14 Tage sind durch den erfassten freien Bestand nicht vollständig gedeckt.',priority:95,category:'liquidity',impactCents:due14-Math.max(0,base.worth.liquidCents-reserved),route:'#/subscriptions',sourceIds:upcoming.slice(0,100).map(e=>e.id)});
 for(const b of budgetReports.filter(b=>b.active&&b.usedBps>=b.thresholds[0]*100))warnings.push({key:'budget:'+b.id+':'+b.from,title:b.status==='exceeded'?'Ausgabenbudget überschritten':'Budgetgrenze erreicht',description:b.name+' liegt bei '+Math.round(b.usedBps/100)+' % des verfügbaren Budgets.',priority:b.status==='exceeded'?80:60,category:'budget',impactCents:Math.max(0,-b.remainingCents),route:'#/analysis',sourceIds:[b.id,...b.sourceIds.slice(0,20)]});
 if(monthly.length>=3&&monthly.slice(-3).filter(m=>m.surplusCents<0).length>=2)warnings.push({key:'cashflow:'+monthly.at(-1)!.month,title:'Mehrfach negativer bereinigter Cashflow',description:'Mindestens zwei der letzten drei bestätigten Monate weisen ein Defizit auf. Außergewöhnliche Ausgaben bleiben enthalten.',priority:85,category:'cashflow',impactCents:Math.max(0,-round(cashAverage!)),route:'#/analysis',sourceIds:monthly.slice(-3).flatMap(m=>m.sourceIds).slice(0,100)});
 for(const g of activeGoals.filter(g=>g.projection.status==='behind'))warnings.push({key:'goal:'+g.id+':'+currentMonth,title:'Sparziel liegt hinter dem Modellplan',description:g.name+' erreicht das Wunschdatum mit der eingetragenen Rate voraussichtlich nicht.',priority:40,category:'savings',impactCents:Math.max(0,(g.projection.requiredRateCents||0)-g.monthlyRateCents),route:'#/goals/'+g.id,sourceIds:[g.id]});
 const subscriptionStatus=new Map(base.subscriptions.map(subscription=>[subscription.id,subscription.status]));
 for(const event of base.calendar.filter(e=>e.type!=='charge'&&e.date>=today&&e.date<=addDays(today,7)&&['active','trial'].includes(subscriptionStatus.get(e.subscriptionId)||''))){
  const title=event.type==='trial'?'Testphase endet':'Kündigungsfrist läuft ab';
  const dueDate=new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin'}).format(new Date(event.date+'T12:00:00Z'));
  warnings.push({key:'subscription:'+event.id+':'+event.date,title,description:`${event.name} · ${dueDate}`,priority:55,category:'subscriptions',impactCents:0,route:'#/subscriptions',sourceIds:[event.subscriptionId]});
 }
 if(!simulation)for(const warning of warnings){const key=digest(['insight-1',warning.key]);await db.financeInsight.upsert({where:{key},create:{key,category:warning.category,title:warning.title,description:warning.description,impactCents:Math.min(2_000_000_000,warning.impactCents),priority:warning.priority,quality:quality?'Bestätigungen und lokale Buchungen':'Lokale Buchungen',sourceIds:JSON.stringify(warning.sourceIds),periodStart:range.from,periodEnd:range.to,route:warning.route},update:{title:warning.title,description:warning.description,impactCents:Math.min(2_000_000_000,warning.impactCents),priority:warning.priority}});}
 const [healthHistory,insights,savedFilters]=await Promise.all([db.healthSnapshot.findMany({orderBy:{createdAt:'asc'},take:2000}),db.financeInsight.findMany({where:{archived:false},orderBy:[{priority:'desc'},{createdAt:'desc'}],take:200}),db.savedFilter.findMany()]);
 const archivedInsights=await db.financeInsight.findMany({where:{archived:true},orderBy:{createdAt:'desc'},take:200});
 const mutedNotifications=mutedNotificationCategories(base.settings.financePreferences);
 const year=today.slice(0,4),heatmap=Array.from({length:Math.round((+new Date(String(Number(year)+1)+'-01-01')-+new Date(year+'-01-01'))/86400000)},(_,index)=>{const date=addDays(year+'-01-01',index),rows=filteredParts.filter(t=>t.date===date&&t.kind==='expense'),known=coverage.some(c=>c.month===date.slice(0,7)&&c.expensesComplete);return {date,expenseCents:rows.reduce((sum,t)=>sum+(t.eurCents||0),0),count:new Set(rows.map(t=>t.id)).size,known:known||rows.length>0};});
 const delta=(current:number,previous:number)=>range.comparable&&previous!==0?round(frac(BigInt(current-previous)*10000n,Math.abs(previous)))/100:null;
 return {asOf:today,range,worth:base.worth,worthHistory:base.snapshots.map(row=>({day:row.day,netCents:row.netCents})),subscriptionMonthlyCents:base.summary.monthlyCents,analysis:{incomeCents:income,expenseCents:expenses,surplusCents:income-expenses,savingsRateBps:income>0?round(frac(BigInt(income-expenses)*10000n,income)):null,dailyExpenseCents:round(frac(expenses,range.days)),incomeChangePercent:delta(income,previousIncome),expenseChangePercent:delta(expenses,previousExpenses),fixedMonthlyCents:fixed,grouped:[...groups.values()].sort((a,b)=>a.period.localeCompare(b.period)),categories,transactions:selected.filter(t=>!query.category||filteredParts.some(p=>p.id===t.id)).slice(-500).reverse(),totalTransactions:selected.length,excludedCurrencies:[...currencies],heatmap},budgets:budgetReports,savingsGoals:goalReports,goalFunding,goalMovements:movements,reservedCents:reserved,unassignedLiquidCents:base.worth.liquidCents-reserved,spendableCents:fresh&&quality?.accountsComplete&&quality.obligationsComplete&&allCashValued&&upcoming.every(e=>e.date>addDays(today,14)||e.eurCents!==null)?Math.max(0,cash-base.settings.reserveCents):null,lastQuality,staleBanks,quality:{configuration:quality,coverage,completeMonths:knownMonths.map(m=>m.month),expenseMonths:expenseMonths.map(m=>m.month),monthsUsed:months,missingCurrencies:[...currencies],fresh,notice:'Datenabdeckung ist keine statistische Konfidenz. Finanzwerte ohne Währungsbewertung bleiben ausgeschlossen.'},health:{...health,scoreVersion,inputs:serializedInputs,history:healthHistory,model:HEALTH_MODEL,monthsUsed:months},warnings,insights,archivedInsights,mutedNotifications,savedFilters,accounts:base.accounts,subscriptions:base.subscriptions,upcoming,rates:base.rates,categoryConfigs,monthlyConfirmed:monthly,sourceCount:transactions.length,sourceHash:scoreHash};
}
export type IntelligenceState=Awaited<ReturnType<typeof intelligenceState>>;
