import {db,dataDir} from './db';
import {eraseBankCredentials} from './open-banking';
import {readFile,writeFile,mkdir,rename,unlink,readdir,rm} from 'node:fs/promises';
import path from 'node:path';
import {encrypt,decrypt} from './local-security';
import {installmentSchedule} from './installments';
export const tables=['Account','Budget','BudgetItem','ProductLink','ProductImage','Alternative','Project','ProjectTask','SavingsGoal','RecurringPayment','UserSettings','WatchStock','StockQuote','InstallmentPurchase','Transaction','Subscription','SubscriptionHistory','RejectedSuggestion','Asset','Liability','FxRate','WorthSnapshot','ImportBatch','ImportChange','CategoryRule','Document','FinanceGoal','PrivacyConsent','AuditEvent','GoalMovement','TransactionSplit','MonthCoverage','DataQualityConfig','HealthSnapshot','FinanceInsight','SavedFilter','ChatMessage','FinanceReport','CategoryConfig','MerchantLabel','DataQualitySnapshot','SubscriptionLogo'] as const;
export type Backup={version:3;createdAt:string;tables:Record<string,Record<string,unknown>[]>;files:{kind:'images'|'documents';id:string;data:string}[]};
export async function backupData():Promise<Backup>{
 const rows:Record<string,Record<string,unknown>[]>={};await db.$transaction(async tx=>{for(const table of tables)rows[table]=await tx.$queryRawUnsafe<Record<string,unknown>[]>('SELECT * FROM "'+table+'"');});
 const files:Backup['files']=[];for(const image of rows.ProductImage)files.push({kind:'images',id:String(image.id),data:(await readFile(path.join(dataDir,'images',String(image.id)))).toString('base64')});
 for(const doc of rows.Document)files.push({kind:'documents',id:String(doc.id),data:decrypt(await readFile(path.join(dataDir,'documents',String(doc.id)))).toString('base64')});
 return {version:3,createdAt:new Date().toISOString(),tables:rows,files};
}
export function backupJSON(value:unknown){return JSON.stringify(value,(_,v)=>typeof v==='bigint'?v.toString():v);}
export async function validateBackup(value:unknown){
 if(!value||typeof value!=='object')throw new Error('Backupformat ungültig.');const data=value as Backup;
 if(data.version!==3||!data.tables||!Array.isArray(data.files)||data.files.length>2000)throw new Error('Nur vollständige MoreMoney-Backups der Version 3 können hier wiederhergestellt werden.');
 for(const table of Object.keys(data.tables)){
  if(!tables.includes(table as typeof tables[number]))throw new Error('Unbekannte Tabelle im Backup.');const rows=data.tables[table];if(!Array.isArray(rows)||rows.length>100000)throw new Error('Zu viele Datensätze.');
  const info=await db.$queryRawUnsafe<{name:string;type:string}[]>('PRAGMA table_info("'+table+'")');const columns=new Map(info.map(c=>[c.name,c.type]));
  for(const row of rows){if(!row||typeof row!=='object'||typeof row.id!=='string'||!(row.id==='local'||/^[a-f0-9-]{36}$/i.test(row.id)))throw new Error('Ungültige Datensatz-ID.');
   for(const [key,value] of Object.entries(row)){
    if(!columns.has(key)||value!==null&&!['string','number','boolean'].includes(typeof value)&&!(value instanceof Date))throw new Error('Ungültiges Datenfeld.');
    if(typeof value==='string'&&value.length>200000)throw new Error('Datenfeld zu groß.');
    if(columns.get(key)==='INTEGER'&&(typeof value==='number'&&!Number.isSafeInteger(value)))throw new Error('Ungültiger Ganzzahlbetrag.');
    if(key.endsWith('Cents')&&table!=='WorthSnapshot'&&(!Number.isSafeInteger(Number(value))||Math.abs(Number(value))>2_000_000_000))throw new Error('Betragsbereich überschritten.');
    if(key==='currency'&&typeof value==='string'&&!/^[A-Z]{3}$/.test(value))throw new Error('Ungültige Währung.');
   }
   if(table==='BudgetItem'&&(!Number.isInteger(Number(row.quantity))||Number(row.quantity)<1||Number(row.quantity)>1000))throw new Error('Ungültige Menge.');
   if(table==='InstallmentPurchase')installmentSchedule(row as unknown as Parameters<typeof installmentSchedule>[0]);
  }
 }
 for(const file of data.files){if(!['images','documents'].includes(file.kind)||!/^[a-f0-9-]{36}$/i.test(file.id)||typeof file.data!=='string'||file.data.length>14000000)throw new Error('Ungültige Backup-Datei.');}
 return data;
}
export async function restoreBackup(data:Backup){
 const staged:{kind:string;id:string;temp:string}[]=[];
 try{
  // Existing file IDs may only carry identical content, preserving other open views on failure.
  for(const file of data.files){const folder=path.join(dataDir,file.kind);await mkdir(folder,{recursive:true});const target=path.join(folder,file.id);const content=Buffer.from(file.data,'base64');
   try{const existing=await readFile(target);const plain=file.kind==='documents'?decrypt(existing):existing;if(!plain.equals(content))throw new Error('Vorhandene Datei mit anderer Version.');continue;}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
   const temp=target+'.restore-'+crypto.randomUUID();await writeFile(temp,file.kind==='documents'?encrypt(content):content,{flag:'wx',mode:0o600});staged.push({kind:file.kind,id:file.id,temp});
  }
  for(const file of staged)await rename(file.temp,path.join(dataDir,file.kind,file.id));
  await db.$transaction(async tx=>{
   for(const table of tables){const rows=data.tables[table]||[];const info=await tx.$queryRawUnsafe<{name:string;type:string}[]>('PRAGMA table_info("'+table+'")');
    for(const row of rows){const entries=Object.entries(row);const values=entries.map(([key,value])=>{if(value===null)return null;if(info.find(c=>c.name===key)?.type==='DATETIME'){const date=value instanceof Date?value:new Date(typeof value==='number'?value:String(value));if(isNaN(+date))throw new Error('Ungültiger Zeitstempel.');return +date;}return typeof value==='boolean'?Number(value):value;});
     if(table==='PrivacyConsent'){const index=entries.findIndex(([key])=>key==='granted');if(index>=0)values[index]=0;}
     const names=entries.map(([key])=>'"'+key+'"');await tx.$executeRawUnsafe('INSERT INTO "'+table+'" ('+names.join(',')+') VALUES ('+names.map(()=>'?').join(',')+') ON CONFLICT("id") DO UPDATE SET '+entries.filter(([key])=>key!=='id').map(([key])=>'"'+key+'"=excluded."'+key+'"').join(','),...values);
    }
   }
  });
 }catch(error){for(const file of staged){await unlink(file.temp).catch(()=>{});await unlink(path.join(dataDir,file.kind,file.id)).catch(()=>{});}throw error;}
}
export async function deleteLocalData(includeBackups:boolean){
 await rm(path.join(dataDir,'market-key.enc'),{force:true});
 await eraseBankCredentials();
 await db.$executeRawUnsafe('PRAGMA secure_delete=ON');
 await db.$transaction(async tx=>{for(const table of [...tables].reverse())await tx.$executeRawUnsafe('DELETE FROM "'+table+'"');await tx.userSettings.create({data:{id:'local'}});});
 const folders=['images','documents',...(includeBackups?['migration-backups']:[])];
 for(const folder of folders){const location=path.resolve(dataDir,folder);if(!location.startsWith(path.resolve(dataDir)+path.sep))throw new Error('Löschpfad ungültig.');
  const names=await readdir(location).catch((e:NodeJS.ErrnoException)=>{if(e.code==='ENOENT')return [];throw e;});for(const name of names){if(folder==='migration-backups'?!/^before-[0-9]+-[0-9]+\.db$/.test(name):!/^[a-f0-9-]{36}$/i.test(name))continue;await unlink(path.join(location,name));}
 }
 await db.$executeRawUnsafe('VACUUM');
}
