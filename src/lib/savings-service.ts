import {db} from './db';
import {balance} from './finance';
import {berlinDay} from './calendar';
import {savingsProjection} from './savings-math';
import {z} from 'zod';
import type { Prisma } from '@/generated/prisma/client';
const money=z.number().int().min(0).max(2_000_000_000),id=z.string().uuid();
export const goalSchema=z.object({id:id.optional(),name:z.string().trim().min(1).max(160),description:z.string().max(2000).default(''),category:z.string().max(100).default('Individuell'),targetCents:money.positive(),savedCents:money,monthlyRateCents:money,startDate:z.string(),targetDate:z.string().default(''),priority:z.number().int().min(1).max(5),accountId:id.nullable(),currency:z.string().regex(/^[A-Z]{3}$/).default('EUR'),color:z.string().regex(/^#[a-f0-9]{6}$/i),icon:z.string().max(40),status:z.enum(['active','paused','completed','archived']),savingMode:z.enum(['manual','planned']),interestBps:z.number().int().min(0).max(10000),interval:z.enum(['weekly','monthly','quarterly','halfyearly','yearly'])});
export const goalPlanSchema=goalSchema.pick({targetCents:true,monthlyRateCents:true,targetDate:true,interestBps:true});
export async function saveGoal(input:z.infer<typeof goalSchema>){
 await db.$transaction(tx=>putGoal(tx,input));
}
export async function updateGoalPlan(id:string,plan:z.infer<typeof goalPlanSchema>){
 await db.$transaction(async tx=>{
  const old=await tx.savingsGoal.findUniqueOrThrow({where:{id}});
  if(old.status==='archived')throw new Error('Aktives oder pausiertes Sparziel wählen.');
  await putGoal(tx,goalSchema.parse({...old,startDate:old.startDate||berlinDay(old.createdAt),...plan}));
 });
}
async function putGoal(tx:Prisma.TransactionClient,input:z.infer<typeof goalSchema>){
 savingsProjection(input);
  const {id,...data}=input;const old=id?await tx.savingsGoal.findUnique({where:{id}}):null;
  if(old&&old.currency!==data.currency&&(old.savedCents>0||await tx.goalMovement.count({where:{goalId:old.id,amountCents:{not:0}}})))throw new Error('Währung bei vorhandener Sparhistorie unverändert lassen.');
  if(old&&old.savedCents!==data.savedCents)throw new Error('Guthaben über Einzahlung, Entnahme oder Umbuchung ändern.');
  if(data.status==='completed'&&data.savedCents<data.targetCents&&old?.status!=='completed')throw new Error('Zielbetrag vor dem Abschließen vollständig ansparen.');
  if(data.accountId&&(old?.accountId!==data.accountId||old.currency!==data.currency)){const account=await tx.account.findUniqueOrThrow({where:{id:data.accountId}});if(account.archived||account.currency!==data.currency)throw new Error('Aktives Konto in Zielwährung wählen.');const payments=await tx.transaction.findMany({where:{accountId:account.id,bookingStatus:'booked'}});const other=await tx.savingsGoal.aggregate({where:{accountId:account.id,...(id?{id:{not:id}}:{})},_sum:{savedCents:true}});if(data.savedCents+(other._sum.savedCents||0)>Math.max(0,balance(account.openingCents,payments)))throw new Error('Kontoguthaben ist bereits zugeordnet oder nicht verfügbar.');}
  const goal=old&&id?await tx.savingsGoal.update({where:{id},data}):await tx.savingsGoal.create({data:{...data,...(id?{id}:{})}});
  if(old){const changed=old.targetCents!==goal.targetCents||old.monthlyRateCents!==goal.monthlyRateCents||old.status!==goal.status||old.interval!==goal.interval||old.interestBps!==goal.interestBps||old.targetDate!==goal.targetDate||old.startDate!==goal.startDate||old.accountId!==goal.accountId;if(changed)await tx.goalMovement.create({data:{goalId:goal.id,amountCents:0,day:berlinDay(),kind:'plan-change',note:'Sparplan geändert',requestId:crypto.randomUUID(),previous:JSON.stringify({targetCents:old.targetCents,monthlyRateCents:old.monthlyRateCents,status:old.status,interval:old.interval,interestBps:old.interestBps,targetDate:old.targetDate,startDate:old.startDate,accountId:old.accountId})}});}
  else await tx.goalMovement.create({data:{goalId:goal.id,amountCents:goal.savedCents,day:berlinDay(),kind:'initial',note:'Vorhandenes Kapital zugeordnet',requestId:crypto.randomUUID()}});
}
export async function moveGoal(c:{id:string;requestId:string;amountCents:number;kind:'deposit'|'withdraw';day:string;note:string;fundingTransactionId?:string|null;correctionOf?:string}){
 if(!Number.isSafeInteger(c.amountCents)||c.amountCents<=0||c.amountCents>2_000_000_000||c.day>berlinDay())throw new Error('Betrag und Buchungsdatum prüfen.');
 await db.$transaction(async tx=>{
  if(await tx.goalMovement.findUnique({where:{requestId:c.requestId}}))return;
  const goal=await tx.savingsGoal.findUniqueOrThrow({where:{id:c.id}});const amount=c.amountCents*(c.kind==='withdraw'?-1:1),next=goal.savedCents+amount;if(next<0||next>2_000_000_000)throw new Error('Entnahme oder Zielguthaben prüfen.');
  if(goal.status==='archived'&&amount>0&&!c.correctionOf)throw new Error('Aktives oder pausiertes Sparziel wählen.');
  if(c.kind==='deposit'&&goal.accountId){const account=await tx.account.findUniqueOrThrow({where:{id:goal.accountId}});if(account.archived||account.currency!==goal.currency)throw new Error('Kontozuordnung prüfen.');const payments=await tx.transaction.findMany({where:{accountId:account.id,bookingStatus:'booked'}});const assigned=await tx.savingsGoal.aggregate({where:{accountId:account.id},_sum:{savedCents:true}});if((assigned._sum.savedCents||0)+amount>balance(account.openingCents,payments))throw new Error('Dieser Betrag ist auf dem Konto nicht frei verfügbar.');}
  if(c.fundingTransactionId&&!c.correctionOf){const source=await tx.transaction.findUniqueOrThrow({where:{id:c.fundingTransactionId}});if(c.kind!=='deposit'||source.kind!=='income'||source.bookingStatus!=='booked'||source.date>c.day||source.currency!==goal.currency||source.accountId!==goal.accountId||!['ordinary','salary'].includes(source.financialRole))throw new Error('Bestätigte laufende Einnahme desselben Kontos wählen.');const assigned=await tx.goalMovement.aggregate({where:{fundingTransactionId:source.id,kind:{in:['deposit','correction']}},_sum:{amountCents:true}});if((assigned._sum.amountCents||0)+c.amountCents>source.amountCents)throw new Error('Einnahme wurde bereits vollständig zugeordnet.');}
  await tx.savingsGoal.update({where:{id:goal.id},data:{savedCents:next}});await tx.goalMovement.create({data:{goalId:goal.id,amountCents:amount,day:c.day,kind:c.correctionOf?'correction':c.kind,note:c.note,requestId:c.requestId,fundingTransactionId:c.fundingTransactionId||null,previous:c.correctionOf||''}});
 });
}
export async function transferGoal(c:{from:string;to:string;amountCents:number;requestId:string;day:string}){
 if(c.from===c.to||c.amountCents<=0||!Number.isSafeInteger(c.amountCents))throw new Error('Verschiedene Ziele und positiven Betrag wählen.');
 await db.$transaction(async tx=>{if(await tx.goalMovement.findUnique({where:{requestId:c.requestId+':from'}}))return;
 const from=await tx.savingsGoal.findUniqueOrThrow({where:{id:c.from}}),to=await tx.savingsGoal.findUniqueOrThrow({where:{id:c.to}});if(from.currency!==to.currency||from.savedCents<c.amountCents||to.savedCents+c.amountCents>2_000_000_000)throw new Error('Guthaben und gleiche Währung prüfen.');
 if(to.status==='archived')throw new Error('Aktives oder pausiertes Sparziel wählen.');
 if(to.accountId&&to.accountId!==from.accountId){const a=await tx.account.findUniqueOrThrow({where:{id:to.accountId}}),payments=await tx.transaction.findMany({where:{accountId:a.id,bookingStatus:'booked'}}),assigned=await tx.savingsGoal.aggregate({where:{accountId:a.id},_sum:{savedCents:true}});if(a.archived||a.currency!==to.currency||(assigned._sum.savedCents||0)+c.amountCents>balance(a.openingCents,payments))throw new Error('Zielkonto hat nicht genügend frei zuordenbares Guthaben.');}
 await tx.savingsGoal.update({where:{id:from.id},data:{savedCents:{decrement:c.amountCents}}});await tx.savingsGoal.update({where:{id:to.id},data:{savedCents:{increment:c.amountCents}}});
 await tx.goalMovement.create({data:{goalId:from.id,amountCents:-c.amountCents,day:c.day,kind:'transfer',note:'Virtuell umgeordnet',requestId:c.requestId+':from'}});await tx.goalMovement.create({data:{goalId:to.id,amountCents:c.amountCents,day:c.day,kind:'transfer',note:'Virtuell umgeordnet',requestId:c.requestId+':to'}});
 });
}
