import sharp from 'sharp';
import {rememberCategory} from '@/lib/remember-category';
import {assertManualBankAccount,managedBankAccount} from '@/lib/open-banking';
import {readTextBounded} from '@/lib/request-body';
import {validFinancialRole} from '@/lib/transaction-role';
import {db,ready} from '@/lib/db';
import {sameOrigin} from '@/lib/validation';
import {financeCommand} from '@/lib/finance-validation';
import {financeState} from '@/lib/finance-state';
import {berlinDay} from '@/lib/finance-os';
export const runtime='nodejs';
export async function GET(){try{return Response.json(await financeState(),{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Finanzmodule konnten nicht geladen werden.'},{status:500});}}
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Nicht erlaubt.'},{status:403});
 try{const text=await readTextBounded(request,380000);const result=financeCommand.safeParse(JSON.parse(text));if(!result.success)return Response.json({error:result.error.issues[0]?.message||'Eingaben prüfen.'},{status:400});const c=result.data;if(c.op!=='subscription'&&text.length>30000)return Response.json({error:'Anfrage zu groß.'},{status:413});await ready();
 if(c.op==='subscription'){
  if(c.data.accountId&&!await db.account.findUnique({where:{id:c.data.accountId}}))throw new Error('Konto nicht gefunden.');
  const {id,logoUpload,...data}=c.data;
  let png:string|null|undefined=logoUpload===null?null:undefined;
  if(logoUpload){
   try {
    const image=sharp(Buffer.from(logoUpload,'base64'),{limitInputPixels:16_000_000,failOn:'warning'});
    if(!['png','jpeg','webp'].includes((await image.metadata()).format??''))throw new Error();
    png=(await image.rotate().resize(96,96,{fit:'inside',withoutEnlargement:true}).png().toBuffer()).toString('base64');
   }catch{return Response.json({error:'Logo konnte nicht gelesen werden. Eine PNG-, JPEG- oder WebP-Datei wählen.'},{status:400});}
  }
  await db.$transaction(async tx=>{
   const old=id?await tx.subscription.findUnique({where:{id}}):null;
   const s=old&&id?await tx.subscription.update({where:{id},data}):await tx.subscription.create({data:{...data,...(id?{id}:{})}});
   if(png===null)await tx.subscriptionLogo.deleteMany({where:{subscriptionId:s.id}});
   if(png)await tx.subscriptionLogo.upsert({where:{subscriptionId:s.id},create:{subscriptionId:s.id,png},update:{png}});
   await rememberCategory(tx,data.category);
   if(!old||old.priceCents!==s.priceCents||old.status!==s.status||old.currency!==s.currency)
    await tx.subscriptionHistory.create({data:{subscriptionId:s.id,priceCents:s.priceCents,currency:s.currency,status:s.status,effectiveDate:berlinDay()}});
  });
 }else if(c.op==='asset'){
  const {id,...data}=c.data;if(data.accountId&&!await db.account.findUnique({where:{id:data.accountId}}))throw new Error('Konto nicht gefunden.');if(data.watchStockId&&!await db.watchStock.findUnique({where:{id:data.watchStockId}}))throw new Error('Wertpapier nicht gefunden.');
  if(id)await db.asset.upsert({where:{id},create:{...data,id},update:data});else await db.asset.create({data});
 }else if(c.op==='liability'){
  const {id,...data}=c.data;if(data.assetId&&!await db.asset.findUnique({where:{id:data.assetId}}))throw new Error('Vermögenswert nicht gefunden.');if(data.installmentId&&!await db.installmentPurchase.findUnique({where:{id:data.installmentId}}))throw new Error('Finanzierung nicht gefunden.');if(id)await db.liability.upsert({where:{id},create:{...data,id},update:data});else await db.liability.create({data});
 }else if(c.op==='rule'){const {id,...data}=c.data;if(id)await db.categoryRule.update({where:{id},data});else await db.categoryRule.create({data});
 }else if(c.op==='delete'){
  if(c.entity==='subscription'){await db.subscription.delete({where:{id:c.id}});await db.subscriptionHistory.deleteMany({where:{subscriptionId:c.id}});}
  if(c.entity==='asset'){if(await db.liability.count({where:{assetId:c.id}}))throw new Error('Verknüpfte Verbindlichkeit zuerst lösen.');await db.asset.delete({where:{id:c.id}});}
  if(c.entity==='liability')await db.liability.delete({where:{id:c.id}});if(c.entity==='rule')await db.categoryRule.delete({where:{id:c.id}});if(c.entity==='goal')await db.financeGoal.delete({where:{id:c.id}});
 }else if(c.op==='rejectSuggestion')await db.rejectedSuggestion.upsert({where:{key:c.key},create:{key:c.key},update:{}});
 else if(c.op==='fx')await db.fxRate.upsert({where:{currency_asOf:{currency:c.currency,asOf:c.asOf}},create:{currency:c.currency,rateMicros:c.rateMicros,asOf:c.asOf},update:{rateMicros:c.rateMicros,asOf:c.asOf}});
 else if(c.op==='goal'){const {op:_,id,...data}=c;void _;if(id)await db.financeGoal.upsert({where:{id},create:{...data,id},update:data});else await db.financeGoal.create({data});}
 else if(c.op==='privacy')await db.userSettings.update({where:{id:'local'},data:{privacyMode:c.enabled}});
 else if(c.op==='consent')await db.privacyConsent.upsert({where:{purpose:c.purpose},create:{purpose:c.purpose,granted:c.granted},update:{granted:c.granted}});
 else if(c.op==='account'){const {op:_,id,...data}=c;void _;if(id){const old=await db.account.findUnique({where:{id}});if(old&&managedBankAccount(id)&&(old.currency!==data.currency||old.openingCents!==data.openingCents||old.maskedIban!==data.maskedIban))throw new Error('Saldo, Währung und IBAN werden vom Onlinekonto übernommen.');if(old&&old.currency!==data.currency&&await db.transaction.count({where:{accountId:id}}))throw new Error('Währung bei Konten mit Buchungen unverändert lassen.');await db.account.upsert({where:{id},create:{...data,id},update:data});}else await db.account.create({data});}
 else if(c.op==='manualTransaction'){const account=await db.account.findUniqueOrThrow({where:{id:c.accountId}});assertManualBankAccount(account.id);if(account.archived||c.date>berlinDay())throw new Error('Aktives Konto und vergangenes/heutiges Datum wählen.');await db.transaction.upsert({where:{requestId:c.id},create:{requestId:c.id,accountId:c.accountId,title:c.title,amountCents:c.amountCents,kind:c.kind,date:c.date,category:c.category,note:c.note,currency:account.currency},update:{}});await rememberCategory(db,c.category);}
 else if(c.op==='categorize'){const existing=await db.transaction.findUniqueOrThrow({where:{id:c.id}});if(c.financialRole&&!validFinancialRole(existing.kind,c.financialRole))throw new Error('Finanzielle Bedeutung passt nicht zur Buchungsart.');await db.transaction.update({where:{id:c.id},data:{category:c.category,tags:c.tags,note:c.note,...(c.financialRole?{financialRole:c.financialRole}:{})}});await rememberCategory(db,c.category);}
 else if(c.op==='transferPair')await db.$transaction(async tx=>{
  const a=await tx.transaction.findUniqueOrThrow({where:{id:c.debit}}),b=await tx.transaction.findUniqueOrThrow({where:{id:c.credit}});
  if(a.kind==='transfer-out'&&b.kind==='transfer-in'&&a.transferId===b.transferId)return;
  if(a.kind!=='expense'||b.kind!=='income'||a.amountCents!==b.amountCents||a.currency!==b.currency||a.accountId===b.accountId||Math.abs(+new Date(a.date)-+new Date(b.date))>3*86400000)throw new Error('Passendes Paar aus Ausgabe und Einnahme wählen.');
  const group=crypto.randomUUID();await tx.transaction.update({where:{id:a.id},data:{kind:'transfer-out',transferId:group}});await tx.transaction.update({where:{id:b.id},data:{kind:'transfer-in',transferId:group}});
 });
 try{return Response.json(await financeState(c.op));}catch{return Response.json({saved:true,error:'Gespeichert. Die aktualisierte Ansicht konnte nicht geladen werden. Bitte erneut laden.'},{status:202});}
 }catch{return Response.json({error:'Änderung fehlgeschlagen. Verknüpfungen, eindeutige Konten und Eingaben prüfen. Eingaben bleiben erhalten.'},{status:400});}
}
