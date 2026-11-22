import { db, ready, state } from '@/lib/db';
import { sameOrigin } from '@/lib/validation';
import { parseProviderQuote, priceMicros, stockCommand } from '@/lib/stocks';
export const runtime='nodejs';
const pending=new Set<string>();
const lastAttempt=new Map<string,number>();
export async function POST(request:Request){
  if(!sameOrigin(request))return Response.json({error:'Anfrage nicht erlaubt.'},{status:403});
  try{
    if(Number(request.headers.get('content-length')||0)>20_000)throw new Error('Anfrage zu groß.');
    const text=await request.text();if(text.length>20_000)throw new Error('Anfrage zu groß.');
    const result=stockCommand.safeParse(JSON.parse(text));
    if(!result.success)return Response.json({error:result.error.issues[0]?.message||'Eingaben prüfen.'},{status:400});
    const c=result.data;await ready();
    if(c.op==='add'||c.op==='edit'){
      const {op:_,target,...rest}=c;void _;
      const values={...rest,targetMicros:target?priceMicros(target):null};
      if(c.op==='add')await db.watchStock.create({data:values});
      else {
        const {id,...data}=values as typeof values&{id:string};
        await db.$transaction(async tx=>{
          const current=await tx.watchStock.findUniqueOrThrow({where:{id},include:{_count:{select:{quotes:true}}}});
          if(current._count.quotes&&(current.symbol!==data.symbol||current.exchange!==data.exchange||current.currency!==data.currency))throw new Error('Mit Kursverlauf bleiben Symbol, Börse und Währung unverändert. Dafür eine neue Aktie anlegen.');
          await tx.watchStock.update({where:{id},data});
        });
      }
    }else if(c.op==='favorite')await db.watchStock.update({where:{id:c.id},data:{favorite:c.favorite}});
    else if(c.op==='delete')await db.watchStock.delete({where:{id:c.id}});
    else if(c.op==='deleteQuote')await db.stockQuote.delete({where:{id:c.id}});
    else if(c.op==='quote'){
      const identity={stockId:c.id,source:'manual',asOf:c.asOf};
      await db.stockQuote.upsert({where:{stockId_source_asOf:identity},create:{...identity,priceMicros:priceMicros(c.price)},update:{priceMicros:priceMicros(c.price)}});
    }else if(c.op==='refresh'){
      const key=process.env.MOREMONEY_TWELVE_DATA_KEY;
      if(!key)throw new Error('Online-Kursdienst ist nicht eingerichtet. Kurse können manuell erfasst werden.');
      if(pending.has(c.id)||Date.now()-(lastAttempt.get(c.id)||0)<60_000)throw new Error('Bitte vor dem nächsten Abruf eine Minute warten.');
      const stock=await db.watchStock.findUniqueOrThrow({where:{id:c.id}});
      pending.add(c.id);lastAttempt.set(c.id,Date.now());
      try{
        const url=new URL('https://api.twelvedata.com/quote');url.searchParams.set('symbol',stock.symbol);url.searchParams.set('apikey',key);if(stock.exchange)url.searchParams.set('exchange',stock.exchange);
        const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(12_000),redirect:'error'});
        if(!response.ok)throw new Error('Kursdienst momentan nicht verfügbar.');
        const body=await response.json();
        if(body?.status==='error')throw new Error(body.code===429?'Kurslimit erreicht. Später erneut versuchen.':'Kurs nicht verfügbar. Symbol und Börsenabdeckung prüfen.');
        const quote=parseProviderQuote(body,stock);
        // Deletion or edits while fetching must never attach stale data to a changed instrument.
        await db.$transaction(async tx=>{
          const current=await tx.watchStock.findUnique({where:{id:c.id}});
          if(!current||current.symbol!==stock.symbol||current.exchange!==stock.exchange||current.currency!==stock.currency)throw new Error('Aktie wurde während des Abrufs geändert. Bitte erneut abrufen.');
          const identity={stockId:c.id,source:'twelve-data',asOf:quote.asOf};
          await tx.stockQuote.upsert({where:{stockId_source_asOf:identity},create:{...identity,priceMicros:quote.priceMicros},update:{priceMicros:quote.priceMicros}});
        });
      }finally{pending.delete(c.id);}
    }
    return Response.json(await state());
  }catch(error){
    const message=error instanceof Error?error.message:'';
    const safe=message.length<160&&!/prisma|https?:|apikey|constraint|Invalid|ZodError|JSON/i.test(message);
    return Response.json({error:safe?message:'Änderung fehlgeschlagen. Eine Aktie mit dieser Kombination könnte bereits vorhanden sein.'},{status:400});
  }
}
