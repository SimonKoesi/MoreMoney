import { PrismaClient } from '@/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const globalDb = globalThis as unknown as { finovaDb?: PrismaClient; finovaReady?: Promise<void> };
export const dataDir = process.env.FINOVA_DATA_DIR || path.join(process.cwd(), 'data');
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
      for(const [id,folder] of [['001','001_init'],['002','002_watchlist']]){
        const result = await client.execute({sql:'SELECT id FROM _finova_migrations WHERE id=?',args:[id]});
        if (!result.rows.length) {
          const sql = readFileSync(path.join(process.cwd(), 'prisma/migrations',folder,'migration.sql'), 'utf8');
          await client.executeMultiple('BEGIN IMMEDIATE;\n' + sql + `\nINSERT INTO _finova_migrations VALUES ('${id}');\nCOMMIT;`);
        }
      }
    } finally { client.close(); }
    await db.userSettings.upsert({ where: { id: 'local' }, create: {}, update: {} });
  })().catch(error => { globalDb.finovaReady = undefined; throw error; });
  return globalDb.finovaReady;
}

export async function state() {
  await ready();
  const [accounts, transactions, budgets, projects, goals, recurring, settings, stocks] = await Promise.all([
    db.account.findMany({ orderBy: {createdAt:'asc'} }),
    db.transaction.findMany({ orderBy: [{date:'desc'}, {createdAt:'desc'}] }),
    db.budget.findMany({ include: {items: {include: {links:true, images:true, alternatives:true}, orderBy:{createdAt:'asc'}}}, orderBy:{createdAt:'asc'} }),
    db.project.findMany({include:{tasks:true}}), db.savingsGoal.findMany(), db.recurringPayment.findMany(), db.userSettings.findUniqueOrThrow({where:{id:'local'}}),
    db.watchStock.findMany({orderBy:[{favorite:'desc'},{name:'asc'}],include:{quotes:{orderBy:[{asOf:'asc'},{updatedAt:'asc'}]}}})
  ]);
  return { accounts, transactions, budgets, projects, goals, recurring, settings, stocks, quoteProviderAvailable:Boolean(process.env.MOREMONEY_TWELVE_DATA_KEY) };
}
export type AppState = Awaited<ReturnType<typeof state>>;
