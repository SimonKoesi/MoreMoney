import {enrichMerchants,labelsFor} from '@/lib/merchant-service';
import {managedBankAccount} from '@/lib/open-banking';
import {readTextBounded} from '@/lib/request-body';
import {validFinancialRole} from '@/lib/transaction-role';
import {db,ready} from '@/lib/db';
import {sameOrigin} from '@/lib/validation';
import {parseBankFile,type Mapping} from '@/lib/bank-import';
import {bankConfiguration} from '@/lib/bank-provider';
import {digest} from '@/lib/finance-os';
import {z} from 'zod';
export const runtime='nodejs';
const schema=z.discriminatedUnion('op',[
 z.object({op:z.enum(['preview','commit']),accountId:z.string().uuid(),filename:z.string().max(200),format:z.enum(['csv','camt','mt940','ofx']),content:z.string().max(2_000_000),mapping:z.record(z.string(),z.string()).optional(),selected:z.array(z.number().int().min(0).max(5000)).max(5000).optional()}),
 z.object({op:z.literal('undo'),id:z.string().uuid()})
]);
const meaningful=(t:{title:string;amountCents:number;kind:string;date:string;category:string;note:string;accountId:string;bankExternalId:string|null;bookingStatus:string;currency:string;valueDate:string;payee:string;originalPurpose:string;tags:string;source:string;importBatchId:string|null;financialRole:string})=>({title:t.title,amountCents:t.amountCents,kind:t.kind,date:t.date,category:t.category,note:t.note,accountId:t.accountId,bankExternalId:t.bankExternalId,bookingStatus:t.bookingStatus,currency:t.currency,valueDate:t.valueDate,payee:t.payee,...(t.originalPurpose&&{originalPurpose:t.originalPurpose}),tags:t.tags,source:t.source,importBatchId:t.importBatchId,financialRole:t.financialRole});
function matchesImportRevision(current: Parameters<typeof meaningful>[0], expected: string){
 const snapshot=meaningful(current);
 if(digest(snapshot)===expected)return true;
 if(snapshot.financialRole!=='unknown')return false;
 const {financialRole,...legacy}=snapshot;
 void financialRole;
 return digest(legacy)===expected;
}
export async function GET(request:Request) {
 await ready();
 if ((await db.userSettings.findUnique({where:{id:'local'}}))?.privacyMode)
  return Response.json({error:'Diskreter Modus aktiv.'},{status:423});
 const url=new URL(request.url);
 const page=Math.max(0,Math.min(10000,Math.trunc(Number(url.searchParams.get('page'))||0)));
 const query=(url.searchParams.get('q')||'').slice(0,160);
 const id=url.searchParams.get('id');
 const labels=query?await db.merchantLabel.findMany({where:{name:{contains:query},transactionId:{not:null}},select:{transactionId:true},take:500}):[];
 const where=id?{id}:query?{OR:[{title:{contains:query}},{payee:{contains:query}},{category:{contains:query}},{id:{in:labels.flatMap(row=>row.transactionId?[row.transactionId]:[])}}]}:{};
 const [transactions,total,batches,pending]=await Promise.all([
  db.transaction.findMany({where,orderBy:[{date:'desc'},{createdAt:'desc'}],skip:page*50,take:50}),db.transaction.count({where}),
  db.importBatch.findMany({orderBy:{createdAt:'desc'},take:100}),db.transaction.findMany({where:{bookingStatus:'pending'},take:5000}),
 ]);
 const merchants=enrichMerchants(transactions,await labelsFor(transactions),true);
 return Response.json({transactions,total,page,configuration:bankConfiguration(),batches,pending,merchants},{headers:{'Cache-Control':'no-store'}});
}
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Nicht erlaubt.'},{status:403});
 try{
  const text=await readTextBounded(request,2500000);if(text.length>2_500_000)throw new Error('Importdatei zu groß.');const parsed=schema.safeParse(JSON.parse(text));if(!parsed.success)return Response.json({error:'Importangaben prüfen.'},{status:400});const c=parsed.data;await ready();
  if(c.op==='undo'){
   await db.$transaction(async tx=>{
    const batch=await tx.importBatch.findUniqueOrThrow({where:{id:c.id}});if(batch.status==='undone')return;
    const changes=await tx.importChange.findMany({where:{batchId:c.id}});
    for(const change of changes){const current=await tx.transaction.findUnique({where:{id:change.transactionId}});if(!current||!matchesImportRevision(current,change.afterHash)||await tx.transactionSplit.count({where:{transactionId:current.id}})||await tx.goalMovement.count({where:{fundingTransactionId:current.id}})||current.budgetId||current.itemId||current.installmentId||current.transferId)throw new Error('Import wurde inzwischen bearbeitet oder verknüpft. Einzelne Buchungen prüfen.');}
    for(const change of changes){if(change.action==='create')await tx.transaction.delete({where:{id:change.transactionId}});else await tx.transaction.update({where:{id:change.transactionId},data:{originalPurpose:"",...JSON.parse(change.before)}});}
    await tx.importBatch.update({where:{id:c.id},data:{status:'undone'}});
   });return Response.json({ok:true});
  }
  const account=await db.account.findUniqueOrThrow({where:{id:c.accountId}});if(account.archived)throw new Error('Aktives Konto wählen.');if(managedBankAccount(account.id))return Response.json({error:'Dieses Onlinekonto wird von der Bank synchronisiert. Für Dateiimporte ein lokales Konto wählen.'},{status:400});
  const imported=parseBankFile(c.content,c.format,c.mapping as Mapping|undefined,account.currency);
  const rows=await Promise.all(imported.rows.map(async(row,index)=>{const existing=await db.transaction.findUnique({where:{accountId_bankExternalId:{accountId:account.id,bankExternalId:row.externalId}}});return {...row,index,duplicate:Boolean(existing),updatesPending:existing?.bookingStatus==='pending'&&row.status==='booked',wrongCurrency:row.currency!==account.currency};}));
  if(c.op==='preview')return Response.json({...imported,rows});
  if(!c.selected?.length)throw new Error('Mindestens eine fehlerfreie Buchung auswählen.');
  const selected=new Set(c.selected);if(selected.size!==c.selected.length)throw new Error('Doppelte Zeilenauswahl.');
  if([...selected].some(index=>index>=rows.length)||rows.some(row=>selected.has(row.index)&&row.wrongCurrency))throw new Error('Auswahl und Kontowährung prüfen.');
  const rules=await db.categoryRule.findMany({orderBy:{createdAt:'asc'}});
  const fileHash=digest([account.id,c.content,c.mapping||{},[...selected].sort((a,b)=>a-b)]);
  const batch=await db.$transaction(async tx=>{
   const previous=await tx.importBatch.findFirst({where:{accountId:account.id,fileHash,status:'applied'}});if(previous)return previous;
   const batch=await tx.importBatch.create({data:{accountId:account.id,filename:c.filename,fileHash}});let count=0;
   for(const row of rows){if(!selected.has(row.index))continue;
    const existing=await tx.transaction.findUnique({where:{accountId_bankExternalId:{accountId:account.id,bankExternalId:row.externalId}}});
    if(existing&&!(existing.bookingStatus==='pending'&&row.status==='booked'))continue;
    const signed=row.amountCents;const match=rules.find(rule=>(row.payee+' '+row.title+' '+row.note).toLocaleLowerCase('de').includes(rule.match.toLocaleLowerCase('de'))&&(rule.minimumCents===null||Math.abs(signed)>=rule.minimumCents)&&(rule.maximumCents===null||Math.abs(signed)<=rule.maximumCents));
    const kind=row.transfer?(signed<0?'transfer-out':'transfer-in'):(signed<0?'expense':'income');
    const payload={financialRole:match&&validFinancialRole(kind,match.financialRole)?match.financialRole:'unknown',title:row.title,originalPurpose:row.note,date:row.date,valueDate:row.valueDate,amountCents:Math.abs(signed),kind:row.transfer?(signed<0?'transfer-out':'transfer-in'):(signed<0?'expense':'income'),currency:row.currency,payee:row.payee,note:row.note,category:match?match.category+(match.subcategory?' / '+match.subcategory:''):'Sonstiges',tags:'',accountId:account.id,bankExternalId:row.externalId,bookingStatus:row.status,source:'file:'+c.format,importBatchId:batch.id};
    const current=existing?await tx.transaction.update({where:{id:existing.id},data:payload}):await tx.transaction.create({data:{...payload,requestId:crypto.randomUUID()}});
    await tx.importChange.create({data:{batchId:batch.id,transactionId:current.id,action:existing?'update':'create',before:existing?JSON.stringify(meaningful(existing)):'{}',afterHash:digest(meaningful(current))}});count++;
   }
   return tx.importBatch.update({where:{id:batch.id},data:{rowCount:count}});
  });return Response.json({ok:true,batch});
 }catch(e){const message=e instanceof Error?e.message:'';return Response.json({error:/^(Import|Aktives|Mindestens|Doppelte|Auswahl|Keine|Ungültige|Betrag|Datei|Nicht|Höchstens|CSV|Datum|Sammelbuchung)/.test(message)?message:'Import fehlgeschlagen. Eingaben und Dateiformat prüfen; bestehende Daten bleiben erhalten.'},{status:400});}
}
