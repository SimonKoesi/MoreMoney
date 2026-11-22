import { db, ready, dataDir } from '@/lib/db';
import { sameOrigin } from '@/lib/validation';
import { readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
type Context={params:Promise<{id:string}>};
export async function GET(request:Request, context:Context) {
  try {
    const id=z.string().uuid().parse((await context.params).id); await ready();
    const image=await db.productImage.findUniqueOrThrow({where:{id}});
    return new Response(await readFile(path.join(dataDir,'images',id)),{headers:{'Content-Type':image.mime,'X-Content-Type-Options':'nosniff','Cache-Control':'private, max-age=3600'}});
  } catch {return new Response('Nicht gefunden',{status:404});}
}
export async function DELETE(request:Request, context:Context) {
  if(!sameOrigin(request)) return new Response('Nicht erlaubt',{status:403});
  try {const id=z.string().uuid().parse((await context.params).id); await ready(); await db.productImage.delete({where:{id}}); await unlink(path.join(dataDir,'images',id)).catch(()=>{}); return Response.json({ok:true});}
  catch {return new Response('Nicht gefunden',{status:404});}
}
