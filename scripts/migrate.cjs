// The desktop runtime and this command use the same versioned migration ledger.
const fs=require('node:fs');const path=require('node:path');
const {createClient}=require('@libsql/client');
const directory=process.env.FINOVA_DATA_DIR||path.resolve('data');
fs.mkdirSync(directory,{recursive:true});
const client=createClient({url:process.env.DATABASE_URL||`file:${path.join(directory,'finova.db').replaceAll('\\','/')}`});
(async()=>{
  try{
    await client.execute('CREATE TABLE IF NOT EXISTS "_finova_migrations" ("id" TEXT PRIMARY KEY)');
    const existing=await client.execute("SELECT id FROM _finova_migrations WHERE id='001'");
    if(!existing.rows.length){
      const sql=fs.readFileSync(path.resolve('prisma/migrations/001_init/migration.sql'),'utf8');
      await client.executeMultiple('BEGIN IMMEDIATE;\n'+sql+"\nINSERT INTO _finova_migrations VALUES ('001');\nCOMMIT;");
    }
    console.log('FINOVA-Migration 001 bereit.');
  }finally{client.close();}
})().catch(()=>{console.error('Migration fehlgeschlagen; vorhandene Datenbank prüfen.');process.exitCode=1;});
