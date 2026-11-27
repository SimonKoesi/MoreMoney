import {inEuro,monthlySub,berlinDay} from './finance-os';
import {balance} from './finance';
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const globalDb = globalThis as unknown as { finovaDb?: PrismaClient; finovaReady?: Promise<void> };
export const dataDir = process.env.MOREMONEY_DATA_DIR || process.env.FINOVA_DATA_DIR || path.join(process.cwd(), 'data');
mkdirSync(dataDir, { recursive: true });
const url = process.env.DATABASE_URL || `file:${path.join(dataDir, 'finova.db').replaceAll('\\', '/')}`;
const adapter = new PrismaLibSql({ url });
export const db = globalDb.finovaDb || new PrismaClient({ adapter });
globalDb.finovaDb = db;

export function ready() {
  if (!globalDb.finovaReady) globalDb.finovaReady = (async () => {
    const client = createClient({ url });
    try {
      await client.execute('PRAGMA foreign_keys=ON');
      await client.execute('CREATE TABLE IF NOT EXISTS "_finova_migrations" ("id" TEXT PRIMARY KEY)');
      for(const [id,folder] of [['001','001_init'],['002','002_watchlist'],['003','003_remove_demo'],['004','004_installments'],['005','005_loans'],['006','006_finance_os'],['007','007_analysis_intelligence'],['008','008_merchant_quality'],['009','009_subscription_logo']]){
        const result = await client.execute({sql:'SELECT id FROM _finova_migrations WHERE id=?',args:[id]});
        if (!result.rows.length) {
          const backupDir = path.join(dataDir, 'migration-backups');
          mkdirSync(backupDir, {recursive:true});
          const backupFile=path.join(backupDir, 'before-'+id+'-'+Date.now()+'.db');
          await client.execute({sql:'VACUUM INTO ?',args:[backupFile]});
          const sql = readFileSync(path.join(process.cwd(), 'prisma/migrations',folder,'migration.sql'), 'utf8');
          await client.executeMultiple('BEGIN IMMEDIATE;\n' + sql + `\nINSERT INTO _finova_migrations VALUES ('${id}');\nCOMMIT;`);
        }
      }
    } finally { client.close(); }
    await db.userSettings.upsert({ where: { id: 'local' }, create: {}, update: {} });
    for(const purpose of ['notifications'])await db.privacyConsent.upsert({where:{purpose},create:{purpose,granted:false},update:{}});
  })().catch(error => { globalDb.finovaReady = undefined; throw error; });
  return globalDb.finovaReady;
}

export async function state() {
  await ready();
  const [accounts, transactions, budgets, projects, goals, recurring, settings, installments, subscriptions, rates, categoriesSaved, transactionSplits] = await Promise.all([
    db.account.findMany({ orderBy: {createdAt:'asc'} }),
    db.transaction.findMany({ where:{bookingStatus:'booked'}, orderBy: [{date:'desc'}, {createdAt:'desc'}] }),
    db.budget.findMany({ where:{mode:'purchase'}, include: {items: {include: {links:true, images:true, alternatives:true}, orderBy:{createdAt:'asc'}}}, orderBy:{createdAt:'asc'} }),
    db.project.findMany({include:{tasks:true}}), db.savingsGoal.findMany(), db.recurringPayment.findMany(), db.userSettings.findUniqueOrThrow({where:{id:'local'}}),
    db.installmentPurchase.findMany({orderBy:{createdAt:'asc'}}), db.subscription.findMany(), db.fxRate.findMany(), db.categoryConfig.findMany({select:{name:true},orderBy:{name:'asc'}}), db.transactionSplit.findMany({orderBy:{id:'asc'}})
  ]);
  const expenseParts:Record<string,{name:string;value:number}[]>={};
  const splitsById=new Map<string,typeof transactionSplits>();
  for(const split of transactionSplits){
    const group=splitsById.get(split.transactionId)??[];
    group.push(split);
    splitsById.set(split.transactionId,group);
  }
  for(const booking of transactions){
    const group=splitsById.get(booking.id);
    if(booking.kind!=='expense'||!group||group.reduce((sum,part)=>sum+part.amountCents,0)!==booking.amountCents)continue;
    let subtotal=0,previous=0;
    expenseParts[booking.id]=group.map(part=>{
      subtotal+=part.amountCents;
      const converted=inEuro(subtotal,booking.currency,rates,booking.date)??0;
      const value=converted-previous;
      previous=converted;
      return {name:part.category.trim()||'Sonstiges',value};
    });
  }
  const currencies=[...new Set([...accounts.map(a=>a.currency),...subscriptions.map(s=>s.currency)])];
  const day=berlinDay();const reporting={expenseParts,accountEUR:Object.fromEntries(accounts.map(a=>[a.id,inEuro(balance(a.openingCents,transactions.filter(t=>t.accountId===a.id)),a.currency,rates)])),transactionEUR:Object.fromEntries(transactions.map(t=>[t.id,inEuro(t.amountCents,t.currency,rates,t.date)])),unpricedCurrencies:currencies.filter(currency=>currency!=='EUR'&&!rates.some(r=>r.currency===currency)),subscriptionMonthlyCents:subscriptions.reduce((sum,s)=>sum+(!['paused','expired'].includes(s.status)&&(!s.endDate||s.endDate>=day)?inEuro(monthlySub(s),s.currency,rates)||0:0),0)};
  return { reporting, savedCategories:categoriesSaved.map(row=>row.name), subscriptions, accounts, transactions, budgets, projects, goals, recurring, settings:{...settings,theme:'dark'}, installments };
}
export type AppState = Awaited<ReturnType<typeof state>>;
