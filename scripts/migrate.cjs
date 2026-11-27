// The desktop runtime and this command use the same versioned migration ledger.
const fs=require('node:fs');const path=require('node:path');
const {createClient}=require('@libsql/client');
const directory=process.env.MOREMONEY_DATA_DIR || process.env.FINOVA_DATA_DIR||path.resolve('data');
fs.mkdirSync(directory,{recursive:true});
const client=createClient({url:process.env.DATABASE_URL||`file:${path.join(directory,'finova.db').replaceAll('\\','/')}`});
(async()=>{
  try{
    await client.execute('CREATE TABLE IF NOT EXISTS "_finova_migrations" ("id" TEXT PRIMARY KEY)');
    for(const [id,folder] of [['001','001_init'],['002','002_watchlist'],['003','003_remove_demo'],['004','004_installments'],['005','005_loans'],['006','006_finance_os'],['007','007_analysis_intelligence'],['008','008_merchant_quality'],['009','009_subscription_logo']]){
      const existing=await client.execute({sql:'SELECT id FROM _finova_migrations WHERE id=?',args:[id]});
      if(!existing.rows.length){
        const backupDir = path.join(directory, 'migration-backups');
          fs.mkdirSync(backupDir, {recursive:true});
          const backupFile=path.join(backupDir, 'before-'+id+'-'+Date.now()+'.db');
          await client.execute({sql:'VACUUM INTO ?',args:[backupFile]});
          const sql=fs.readFileSync(path.resolve('prisma/migrations',folder,'migration.sql'),'utf8');
        await client.executeMultiple('BEGIN IMMEDIATE;\n'+sql+`\nINSERT INTO _finova_migrations VALUES ('${id}');\nCOMMIT;`);
      }
    }
    console.log('MoreMoney-Migrationen bereit.');
  }finally{client.close();}
})().catch(()=>{console.error('Migration fehlgeschlagen; vorhandene Datenbank prüfen.');process.exitCode=1;});
