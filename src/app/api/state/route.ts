import {readTextBounded} from '@/lib/request-body';
import { installmentSchedule, loanSchedule } from '@/lib/installments';
import { db, ready, state } from '@/lib/db';
import { command, sameOrigin } from '@/lib/validation';
import { NextResponse } from 'next/server';
import { moveGoal } from '@/lib/savings-service';
import { berlinDay } from '@/lib/calendar';
import { assertManualBankAccount, bankingLock } from '@/lib/open-banking';
import { removeAccount } from '@/lib/account-removal';
import { rememberCategory } from '@/lib/remember-category';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() { return NextResponse.json(await state(), {headers:{'Cache-Control':'no-store'}}); }
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({error:'Anfrage nicht erlaubt.'},{status:403});
  try {
    if (Number(request.headers.get('content-length') || 0) > 100_000) throw new Error('Anfrage zu groß.');
    const input = await readTextBounded(request,100000);
    if (input.length > 100_000) throw new Error('Anfrage zu groß.');
    const result = command.safeParse(JSON.parse(input));
    if (!result.success) return NextResponse.json({error:result.error.issues[0]?.message || 'Eingaben prüfen.'},{status:400});
    const c = result.data;
    await ready();
    switch(c.op) {
      case 'account': await db.account.create({data:{name:c.name,type:c.type,openingCents:c.openingCents}}); break;
      case 'archiveAccount': await db.account.update({where:{id:c.id},data:{archived:c.archived}}); break;
      case 'deleteAccount': await bankingLock(()=>removeAccount(c.id,c.deleteBookings)); break;
      case 'transaction': await db.$transaction(async tx => {
        const previous = await tx.transaction.findUnique({where:{requestId:c.requestId}});
        if (previous) return;
        const account = await tx.account.findUniqueOrThrow({where:{id:c.accountId}});
        assertManualBankAccount(account.id);
        if (account.archived) throw new Error('Archiviertes Konto.');
        if(account.currency!=='EUR')throw new Error('Fremdwährungsbuchungen unter Bankkonten in Kontowährung erfassen.');
        if(c.itemId) {
          const item = await tx.budgetItem.findUniqueOrThrow({where:{id:c.itemId}});
          if(item.budgetId !== c.budgetId || c.kind !== 'expense') throw new Error('Ungültige Positionsverknüpfung.');
        }
        const {op:_,...data}=c; void _;
        await tx.transaction.create({data});
        await rememberCategory(tx,c.category);
      }); break;
      case 'deleteTransaction': await db.$transaction(async tx => {
        const p=await tx.transaction.findUniqueOrThrow({where:{id:c.id}});
        assertManualBankAccount(p.accountId);
        const assignment=await tx.goalMovement.aggregate({where:{fundingTransactionId:p.id,kind:{in:['deposit','correction']}},_sum:{amountCents:true}});
        if((assignment._sum.amountCents||0)>0)throw new Error('Zuerst die verknüpfte Sparbewegung korrigieren.');
        if(p.transferId) await tx.transaction.deleteMany({where:{transferId:p.transferId}});
        else await tx.transaction.delete({where:{id:c.id}});
      }); break;
      case 'transfer': await db.$transaction(async tx => {
        if(await tx.transaction.findUnique({where:{requestId:c.requestId}})) return;
        const accounts=await tx.account.findMany({where:{id:{in:[c.from,c.to]},archived:false}});
        if(accounts.length!==2) throw new Error('Zwei aktive Konten erforderlich.');
        for(const account of accounts)assertManualBankAccount(account.id);
        if(accounts[0].currency!==accounts[1].currency)throw new Error('Für Fremdwährungswechsel ist eine dokumentierte Umrechnung erforderlich.');
        const common={currency:accounts[0].currency,title:'Umbuchung',amountCents:c.amountCents,date:c.date,transferId:c.requestId};
        await tx.transaction.create({data:{...common,accountId:c.from,kind:'transfer-out',requestId:c.requestId}});
        await tx.transaction.create({data:{...common,accountId:c.to,kind:'transfer-in',requestId:crypto.randomUUID()}});
      }); break;
      case 'budget': await db.budget.create({data:{name:c.name,description:c.description,limitCents:c.limitCents}}); break;
      case 'archiveBudget': await db.budget.update({where:{id:c.id},data:{archived:c.archived}}); break;
      case 'duplicateBudget': {
        const b=await db.budget.findUniqueOrThrow({where:{id:c.id},include:{items:true}});
        await db.budget.create({data:{name:b.name+' (Kopie)',description:b.description,limitCents:b.limitCents,items:{create:b.items.map(i=>({name:i.name,plannedCents:i.plannedCents,quantity:i.quantity,category:i.category,note:i.note}))}}}); break;
      }
      case 'item': { const {op:_,...data}=c; void _; if(!Number.isSafeInteger(c.plannedCents*c.quantity) || c.plannedCents*c.quantity>2_000_000_000) throw new Error('Positionsbetrag zu groß.'); await db.budgetItem.create({data}); break; }
      case 'updateItem': { const {op:_,id,...data}=c; void _; if(c.plannedCents*c.quantity>2_000_000_000) throw new Error('Positionsbetrag zu groß.'); await db.budgetItem.update({where:{id},data}); break; }
      case 'toggleItem': await db.budgetItem.update({where:{id:c.id},data:{done:c.done}}); break;
      case 'statusItem': await db.budgetItem.update({where:{id:c.id},data:{status:c.status}}); break;
      case 'deleteItem': await db.$transaction(async tx=>{
        await tx.transaction.updateMany({where:{itemId:c.id},data:{itemId:null}});
        await tx.budgetItem.deleteMany({where:{id:c.id}});
      }); break;
      case 'link': await db.productLink.create({data:{itemId:c.itemId,label:c.label,url:c.url}}); break;
      case 'deleteLink': await db.productLink.delete({where:{id:c.id}}); break;
      case 'alternative': await db.alternative.create({data:{itemId:c.itemId,name:c.name,priceCents:c.priceCents,shippingCents:c.shippingCents}}); break;
      case 'activateAlternative': await db.$transaction(async tx=> { const a=await tx.alternative.findUniqueOrThrow({where:{id:c.id}}); await tx.alternative.updateMany({where:{itemId:a.itemId},data:{active:false}}); await tx.alternative.update({where:{id:c.id},data:{active:true}}); }); break;
      case 'project': await db.project.create({data:{name:c.name,description:c.description}}); break;
      case 'task': await db.projectTask.create({data:{projectId:c.projectId,name:c.name}}); break;
      case 'toggleTask': await db.projectTask.update({where:{id:c.id},data:{done:c.done}}); break;
      case 'deleteTask': await db.projectTask.delete({where:{id:c.id}}); break;
      case 'goal': await db.savingsGoal.create({data:{name:c.name,targetCents:c.targetCents}}); break;
      case 'contribute': await moveGoal({id:c.id,requestId:c.requestId||crypto.randomUUID(),amountCents:c.amountCents,kind:'deposit',day:berlinDay(),note:''}); break;
      case 'recurring': await db.recurringPayment.create({data:{name:c.name,amountCents:c.amountCents,interval:c.interval,dueDate:c.dueDate}}); break;
      case 'deleteRecurring': await db.recurringPayment.delete({where:{id:c.id}}); break;
      case 'loan': {
        const rows=loanSchedule(c.principalCents,c.interestBps,c.termMonths,c.firstDueDate);
        const {op:_,...data}=c;void _;
        await db.installmentPurchase.upsert({where:{id:c.id},create:{...data,totalCents:rows.reduce((s,r)=>s+r.amountCents,0),rateCents:rows[0].amountCents,downPaymentCents:0},update:{}});break;
      }
      case 'installment': {
        installmentSchedule(c);
        const {op:_,...data}=c;void _;
        await db.installmentPurchase.upsert({where:{id:c.id},create:data,update:{}});break;
      }
      case 'payInstallment': await db.$transaction(async tx=>{
        const purchase=await tx.installmentPurchase.findUniqueOrThrow({where:{id:c.id}});
        const due=installmentSchedule(purchase).find(row=>row.index===c.index);
        if(!due)throw new Error('Rate nicht gefunden.');
        if(c.date>new Date().toLocaleDateString('sv-SE'))throw new Error('Nur bereits erfolgte Zahlungen buchen.');
        if(await tx.transaction.findUnique({where:{installmentId_installmentIndex:{installmentId:c.id,installmentIndex:c.index}}}))return;
        const account=await tx.account.findUniqueOrThrow({where:{id:c.accountId}});
        assertManualBankAccount(account.id);
        if(account.archived)throw new Error('Aktives Konto wählen.');
        await tx.transaction.create({data:{requestId:'installment-'+c.id+'-'+c.index,title:purchase.name+' · '+(c.index===0?'Anzahlung':'Rate '+c.index),amountCents:due.amountCents,kind:'expense',date:c.date,accountId:c.accountId,installmentId:c.id,installmentIndex:c.index}});
      });break;
      case 'deleteInstallment':
        if(await db.transaction.count({where:{installmentId:c.id}}))throw new Error('Ratenkauf hat Zahlungen und bleibt erhalten.');
        await db.installmentPurchase.delete({where:{id:c.id}});break;
      case 'privacy': await db.userSettings.update({where:{id:'local'},data:{privacyMode:c.enabled}});break;
      case 'settings': await db.userSettings.update({where:{id:'local'},data:{theme:'dark',reserveCents:c.reserveCents,widgets:c.widgets}}); break;

    }
    return NextResponse.json(await state());
  } catch(error) {
    const known=error instanceof Error && !error.message.includes('prisma') && !error.message.includes('Invalid `');
    return NextResponse.json({error:known && error.message.length<150 ? error.message : 'Änderung konnte nicht gespeichert werden. Eingaben bleiben erhalten.'},{status:400});
  }
}
