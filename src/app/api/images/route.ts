import { db, ready, dataDir } from '@/lib/db';
import { sameOrigin } from '@/lib/validation';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import sharp from 'sharp';
export const runtime='nodejs';
export async function POST(request:Request) {
  if(!sameOrigin(request)) return new Response('Nicht erlaubt',{status:403});
  try {
    if(Number(request.headers.get('content-length')||0)>5_500_000) throw new Error('Maximal 5 MB.');
    const form=await request.formData();
    const itemId=z.string().uuid().parse(form.get('itemId'));
    const file=form.get('image');
    if(!(file instanceof File) || file.size>5_000_000) throw new Error('Bild bis 5 MB wählen.');
    const bytes=Buffer.from(await file.arrayBuffer());
    const mime=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'image/png' :
      bytes[0]===255 && bytes[1]===216 && bytes[2]===255 ? 'image/jpeg' :
      bytes.toString('ascii',0,4)==='RIFF' && bytes.toString('ascii',8,12)==='WEBP' ? 'image/webp' : '';
    if(!mime || mime!==file.type) throw new Error('Nur echte PNG-, JPG- oder WebP-Dateien.');
    const clean=await sharp(bytes,{limitInputPixels:40_000_000}).rotate().toBuffer();
    await ready(); await db.budgetItem.findUniqueOrThrow({where:{id:itemId}});
    const id=crypto.randomUUID(), dir=path.join(dataDir,'images');
    await mkdir(dir,{recursive:true});
    await writeFile(path.join(dir,id),clean,{flag:'wx'});
    try { await db.productImage.create({data:{id,itemId,mime}}); }
    catch(error) { await unlink(path.join(dir,id)); throw error; }
    return NextResponse.json({id});
  } catch { return NextResponse.json({error:'Upload fehlgeschlagen. JPG, PNG oder WebP bis 5 MB verwenden.'},{status:400}); }
}
