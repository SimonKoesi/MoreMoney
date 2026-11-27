import {readTextBounded} from '@/lib/request-body';
import {validFinancialRole} from '@/lib/transaction-role';
import {db,ready} from '@/lib/db';
import {sameOrigin} from '@/lib/validation';
import {intelligenceState,type AnalysisQuery} from '@/lib/intelligence-state';
import {intelligenceCommand} from '@/lib/intelligence-validation';
import {saveGoal,moveGoal,transferGoal,updateGoalPlan} from '@/lib/savings-service';
import {distributeSavings} from '@/lib/savings-math';
import {berlinDay} from '@/lib/calendar';
import {monthlyEquivalent} from '@/lib/finance';
import {inEuro} from '@/lib/finance-os';
import {parseFinancePreferences} from '@/lib/notification-preferences';
export const runtime='nodejs';
function viewQuery(request:Request):AnalysisQuery{const p=new URL(request.url).searchParams;return {period:p.get('period')||'month',from:p.get('from')||'',to:p.get('to')||'',group:['day','week','month','year'].includes(p.get('group')||'')?p.get('group') as AnalysisQuery['group']:'month',category:(p.get('category')||'').slice(0,100),accountId:p.get('account')||'',kind:p.get('kind')||'',search:(p.get('q')||'').slice(0,160),...(p.has('min')?{minimumCents:Math.max(0,Math.min(2_000_000_000,Number(p.get('min'))||0))}:{}),...(p.has('max')?{maximumCents:Math.max(0,Math.min(2_000_000_000,Number(p.get('max'))||0))}:{})};}
export async function GET(request:Request){try{const params=new URL(request.url).searchParams;const query:AnalysisQuery={period:params.get('period')||'month',from:params.get('from')||'',to:params.get('to')||'',group:['day','week','month','year'].includes(params.get('group')||'')?params.get('group') as AnalysisQuery['group']:'month',category:(params.get('category')||'').slice(0,100),accountId:params.get('account')||'',kind:params.get('kind')||'',search:(params.get('q')||'').slice(0,160)};if(params.has('min'))query.minimumCents=Math.max(0,Math.min(2_000_000_000,Number(params.get('min'))||0));if(params.has('max'))query.maximumCents=Math.max(0,Math.min(2_000_000_000,Number(params.get('max'))||0));return Response.json(await intelligenceState(query),{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Finanzauswertung konnte nicht berechnet werden. Datumsbereich, Kursangaben und Daten prüfen.'},{status:400});}}
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Nicht erlaubt.'},{status:403});
 try{const text=await readTextBounded(request,100000);if(text.length>100000)throw new Error('Anfrage zu groß.');const result=intelligenceCommand.safeParse(JSON.parse(text));if(!result.success)return Response.json({error:result.error.issues[0]?.message||'Eingaben prüfen.'},{status:400});const c=result.data;await ready();
 if(c.op==='scoreSimulation'){const simulated=await intelligenceState({},c);return Response.json({health:simulated.health,assumptions:c});}
 if(c.op==='goal')await saveGoal(c.data);
 else if(c.op==='updateGoalPlan')await updateGoalPlan(c.id,c.plan);
 else if(c.op==='goalMovement')await moveGoal(c);
 else if(c.op==='goalTransfer'){if(c.day>berlinDay())throw new Error('Vergangenes oder heutiges Datum wählen.');await transferGoal(c);}
 else if(c.op==='reverseMovement'){const original=await db.goalMovement.findUniqueOrThrow({where:{id:c.id}});if(!['deposit','withdraw'].includes(original.kind)||!original.amountCents)throw new Error('Nur einzelne Einzahlungen oder Entnahmen sind korrigierbar.');await moveGoal({id:original.goalId,requestId:'reverse-'+original.id,amountCents:Math.abs(original.amountCents),kind:original.amountCents>0?'withdraw':'deposit',day:berlinDay(),note:'Korrektur eines früheren Eintrags',fundingTransactionId:original.fundingTransactionId,correctionOf:original.id});}
 else if(c.op==='deleteGoal')await db.$transaction(async tx=>{await tx.goalMovement.deleteMany({where:{goalId:c.id}});await tx.savingsGoal.delete({where:{id:c.id}});});
 else if(c.op==='distribution'){
  if(c.apply&&await db.goalMovement.findUnique({where:{requestId:c.requestId+':plan'}}))return Response.json(await intelligenceState(viewQuery(request)));
  const state=await intelligenceState();
  const selected=state.savingsGoals.filter(g=>c.goalIds.includes(g.id)&&g.status==='active'&&g.currency==='EUR'&&g.projection.remainingCents>0).sort((a,b)=>a.priority-b.priority||a.id.localeCompare(b.id));
  if(selected.length!==new Set(c.goalIds).size)throw new Error('Aktive, noch offene Sparziele in EUR wählen.');
  const plan=distributeSavings(c.totalCents,selected.map(g=>({id:g.id,remainingCents:g.projection.remainingCents,priority:g.priority,percent:c.percentages[g.id],targetDate:g.targetDate})),c.mode);
  const otherRates=state.savingsGoals.filter(g=>!c.goalIds.includes(g.id)&&g.status==='active'&&g.projection.remainingCents>0).map(g=>inEuro(monthlyEquivalent(g.monthlyRateCents,g.interval),g.currency,state.rates));
  const monthlySurplus=state.monthlyConfirmed.length&&otherRates.every(rate=>rate!==null)?Math.max(0,Math.round(state.monthlyConfirmed.reduce((sum,m)=>sum+m.surplusCents,0)/state.monthlyConfirmed.length)-otherRates.reduce((sum,rate)=>sum+(rate||0),0)):null;
  const overBudget=monthlySurplus===null||c.totalCents-plan.unallocatedCents>monthlySurplus;
  if(!c.apply)return Response.json({...plan,monthlySurplusCents:monthlySurplus,overBudget});
  if(c.expected&&JSON.stringify(c.expected)!==JSON.stringify(plan.allocations))throw new Error('Sparplan wurde geändert. Vorschau erneut berechnen.');
  if(overBudget&&!c.allowOverBudget)throw new Error('Budgetdeckung prüfen und die Abweichung ausdrücklich bestätigen.');
  await db.$transaction(async tx=>{if(await tx.goalMovement.findUnique({where:{requestId:c.requestId+':plan'}}))return;
   for(const row of plan.allocations){const old=await tx.savingsGoal.findUniqueOrThrow({where:{id:row.id}});await tx.savingsGoal.update({where:{id:row.id},data:{monthlyRateCents:row.amountCents,interval:'monthly'}});await tx.goalMovement.create({data:{goalId:row.id,amountCents:0,day:berlinDay(),kind:'plan-change',note:'Monatliche Verteilung ausdrücklich übernommen',requestId:c.requestId+':'+row.id,previous:JSON.stringify({monthlyRateCents:old.monthlyRateCents,interval:old.interval})}});}
   if(plan.allocations[0])await tx.goalMovement.create({data:{goalId:plan.allocations[0].id,amountCents:0,day:berlinDay(),kind:'plan-confirmed',note:'Verteilungsplan bestätigt',requestId:c.requestId+':plan'}});
  });
 }
 else if(c.op==='spendingBudget'){const {id,...data}=c.data;const values={...data,mode:'spending',description:''};if(id){const existing=await db.budget.findUnique({where:{id}});if(existing&&existing.mode!=='spending')throw new Error('Ausgabenbudget wählen.');await db.budget.upsert({where:{id},create:{...values,id},update:values});}else await db.budget.create({data:values});}
 else if(c.op==='deleteSpendingBudget'){const existing=await db.budget.findUniqueOrThrow({where:{id:c.id}});if(existing.mode!=='spending')throw new Error('Ausgabenbudget wählen.');await db.budget.delete({where:{id:c.id}});}
 else if(c.op==='coverage'){if(c.month>berlinDay().slice(0,7))throw new Error('Zukünftige Monate sind noch nicht vollständig erfasst.');await db.monthCoverage.upsert({where:{month:c.month},create:{month:c.month,incomeComplete:c.incomeComplete,expensesComplete:c.expensesComplete},update:{incomeComplete:c.incomeComplete,expensesComplete:c.expensesComplete}});}
 else if(c.op==='quality'){const {essentialCategories,...rest}=c.data;await db.dataQualityConfig.upsert({where:{id:'local'},create:{id:'local',...rest,essentialCategories:JSON.stringify(essentialCategories)},update:{...rest,essentialCategories:JSON.stringify(essentialCategories)}});}
 else if(c.op==='navigation'){await db.userSettings.update({where:{id:'local'},data:{navigation:JSON.stringify(c.data)}});}
 else if(c.op==='split')await db.$transaction(async tx=>{const t=await tx.transaction.findUniqueOrThrow({where:{id:c.id}});if(!['income','expense'].includes(t.kind)||c.parts.reduce((sum,p)=>sum+p.amountCents,0)!==t.amountCents)throw new Error('Aufteilungen müssen exakt den Buchungsbetrag ergeben.');await tx.transactionSplit.deleteMany({where:{transactionId:t.id}});await tx.transactionSplit.createMany({data:c.parts.map(p=>({...p,transactionId:t.id}))});});
 else if(c.op==='classify')await db.$transaction(async tx=>{const rows=await tx.transaction.findMany({where:{id:{in:c.ids}}});if(rows.length!==new Set(c.ids).size||rows.some(row=>!validFinancialRole(row.kind,c.financialRole)))throw new Error('Buchungen und passende finanzielle Bedeutung prüfen.');await tx.transaction.updateMany({where:{id:{in:c.ids}},data:{category:c.category,financialRole:c.financialRole}});if(c.learn&&rows.length===1){const match=(rows[0].payee||rows[0].title).trim();if(match.length<2)throw new Error('Für eine Regel fehlt ein Empfänger.');const rule=await tx.categoryRule.findFirst({where:{match}});if(rule)await tx.categoryRule.update({where:{id:rule.id},data:{category:c.category,financialRole:c.financialRole}});else await tx.categoryRule.create({data:{name:'Bestätigte Zuordnung',match,category:c.category,financialRole:c.financialRole}});}});
 else if(c.op==='category')await db.categoryConfig.upsert({where:{name:c.name},create:{name:c.name,color:c.color,icon:c.icon,necessary:c.necessary},update:{color:c.color,icon:c.icon,necessary:c.necessary}});
 else if(c.op==='savedFilter'){if(c.id)await db.savedFilter.upsert({where:{id:c.id},create:{id:c.id,name:c.name,filters:JSON.stringify(c.filters)},update:{name:c.name,filters:JSON.stringify(c.filters)}});else await db.savedFilter.create({data:{name:c.name,filters:JSON.stringify(c.filters)}});}
 else if(c.op==='deleteFilter')await db.savedFilter.delete({where:{id:c.id}});
 else if(c.op==='insight')await db.financeInsight.update({where:{id:c.id},data:{...(c.read===undefined?{}:{read:c.read}),...(c.archived===undefined?{}:{archived:c.archived})}});
 else if(c.op==='notificationPreferences')await db.$transaction(async tx=>{const settings=await tx.userSettings.findUniqueOrThrow({where:{id:'local'}});const preferences=parseFinancePreferences(settings.financePreferences);await tx.userSettings.update({where:{id:'local'},data:{financePreferences:JSON.stringify({...preferences,mutedNotifications:[...new Set(c.muted)]})}});});
 else if(c.op==='recurring'){const {op:_,id,...data}=c;void _;if(data.accountId&&!await db.account.findUnique({where:{id:data.accountId}}))throw new Error('Konto nicht gefunden.');if(id)await db.recurringPayment.upsert({where:{id},create:{...data,id},update:data});else await db.recurringPayment.create({data});}
 try{return Response.json(await intelligenceState(viewQuery(request)));}catch{return Response.json({saved:true,error:'Gespeichert. Auswertung bitte erneut laden.'},{status:202});}
 }catch(e){const message=e instanceof Error?e.message:'';return Response.json({error:/^(Betrag|Guthaben|Kontoguthaben|Dieser|Einnahme|Entnahme|Aktives|Aktive|Bestätigte|Währung|Verschiedene|Vergangenes|Sparplan|Budgetdeckung|Verteilungsbetrag|Prozentanteile|Aufteilungen|Buchungen|Für eine|Zukünftige|Konto|Nur einzelne|Höchstens|Ziel)/.test(message)?message:'Änderung fehlgeschlagen. Eingaben bleiben erhalten.'},{status:400});}
}
