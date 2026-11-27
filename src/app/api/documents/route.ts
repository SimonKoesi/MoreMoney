import {readBytesBounded} from '@/lib/request-body';
import {db,ready,dataDir} from '@/lib/db';
import {sameOrigin} from '@/lib/validation';
import {encrypt,decrypt} from '@/lib/local-security';
import {createHash} from 'node:crypto';
import {mkdir,writeFile,readFile,unlink} from 'node:fs/promises';
import path from 'node:path';
export const runtime='nodejs';
async function owner(type:string,id:string){if(!/^[a-f0-9-]{36}$/i.test(id))return false;return type==='subscription'?Boolean(await db.subscription.findUnique({where:{id}})):type==='asset'?Boolean(await db.asset.findUnique({where:{id}})):type==='liability'?Boolean(await db.liability.findUnique({where:{id}})):false;}
export async function GET(request:Request){try{await ready();const id=new URL(request.url).searchParams.get('id')||'';if(!/^[a-f0-9-]{36}$/i.test(id))throw new Error();const doc=await db.document.findUniqueOrThrow({where:{id}});const content=decrypt(await readFile(path.join(dataDir,'documents',id)));return new Response(new Uint8Array(content),{headers:{'Content-Type':doc.mime,'Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(doc.name),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}catch{return Response.json({error:'Dokument nicht verfügbar.'},{status:404});}}
export async function POST(request:Request){if(!sameOrigin(request))return Response.json({error:'Nicht erlaubt.'},{status:403});try{
 const bytes=await readBytesBounded(request,11000000);const bounded=new Request(request.url,{method:request.method,headers:request.headers,body:new Blob([bytes])});const form=await bounded.formData(),file=form.get('file'),ownerType=String(form.get('ownerType')||''),ownerId=String(form.get('ownerId')||'');
 await ready();if(!(file instanceof File)||file.size>10_000_000||!await owner(ownerType,ownerId))throw new Error();
 const data=Buffer.from(await file.arrayBuffer());const pdf=data.subarray(0,5).toString()==='%PDF-',png=data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),jpeg=data[0]===255&&data[1]===216&&data[2]===255;
 if(!pdf&&!png&&!jpeg)throw new Error();const id=crypto.randomUUID();const folder=path.join(dataDir,'documents');await mkdir(folder,{recursive:true});await writeFile(path.join(folder,id),encrypt(data),{flag:'wx',mode:0o600});
 try{await db.document.create({data:{id,ownerType,ownerId,name:file.name.replace(/[\r\n]/g,'').slice(0,160)||'Dokument',mime:pdf?'application/pdf':png?'image/png':'image/jpeg',size:file.size,sha256:createHash('sha256').update(data).digest('hex')}});}catch(e){await unlink(path.join(folder,id));throw e;}return Response.json({ok:true});
 }catch{return Response.json({error:'PDF, PNG oder JPEG bis 10 MB wählen. Der Eintrag muss bereits gespeichert sein.'},{status:400});}}
export async function DELETE(request:Request){if(!sameOrigin(request))return Response.json({error:'Nicht erlaubt.'},{status:403});try{const {id}=await request.json();if(!/^[a-f0-9-]{36}$/i.test(id))throw new Error();const doc=await db.document.findUniqueOrThrow({where:{id}});await unlink(path.join(dataDir,'documents',doc.id));await db.document.delete({where:{id}});return Response.json({ok:true});}catch{return Response.json({error:'Dokument konnte nicht gelöscht werden.'},{status:400});}}
