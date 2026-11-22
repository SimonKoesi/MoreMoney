import { state, dataDir } from '@/lib/db';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
export const dynamic='force-dynamic';
export async function GET(request:Request) {
  const data=await state();
  if(new URL(request.url).searchParams.get('format')==='csv') {
    const quote=(v:unknown)=>'"'+String(v??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';
    const lines=[['Titel','Datum','Art','Betrag in Cent','Konto'],...data.transactions.map(t=>[t.title,t.date,t.kind,t.amountCents,data.accounts.find(a=>a.id===t.accountId)?.name])];
    return new Response('\uFEFF'+lines.map(row=>row.map(quote).join(';')).join('\r\n'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="moremoney-transaktionen.csv"'}});
  }
  const images:Record<string,string>={};
  for(const budget of data.budgets) for(const item of budget.items) for(const image of item.images) images[image.id]=(await readFile(path.join(dataDir,'images',image.id))).toString('base64');
  return Response.json({version:1,exportedAt:new Date().toISOString(),data,images},{headers:{'Content-Disposition':'attachment; filename="moremoney-backup.json"','Cache-Control':'no-store'}});
}
