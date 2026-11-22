import { describe, expect, it } from 'vitest';
import { createClient } from '@libsql/client';
import { readFileSync } from 'node:fs';
import path from 'node:path';
const migration=(name:string)=>readFileSync(path.resolve('prisma/migrations',name,'migration.sql'),'utf8');
describe('Entfernung der klar markierten Beispieldaten',()=>{
  for(const custom of [false,true])it(custom?'erhält eigene Daten und Referenzen':'entfernt den ursprünglichen Beispieldatensatz',async()=>{
    const client=createClient({url:'file::memory:'});
    try{
      await client.executeMultiple(migration('001_init')+'\n'+migration('002_watchlist'));
      await client.executeMultiple(`
        INSERT INTO Account(id,name,openingCents,updatedAt) VALUES('a','Demo · Girokonto',245000,CURRENT_TIMESTAMP);
        INSERT INTO Budget(id,name,description,limitCents,updatedAt) VALUES('b','Demo · Zuhause','Ein guter Platz für neue Ideen.',250000,CURRENT_TIMESTAMP);
        INSERT INTO BudgetItem(id,budgetId,name,plannedCents,updatedAt) VALUES('i','b','Sofa',89900,CURRENT_TIMESTAMP);
        INSERT INTO "Transaction"(id,requestId,title,amountCents,kind,date,accountId,budgetId,itemId,updatedAt) VALUES('t','r','Demo · Sofa-Anzahlung',20000,'expense','2026-11-22','a','b','i',CURRENT_TIMESTAMP);
        INSERT INTO SavingsGoal(id,name,targetCents,savedCents,updatedAt) VALUES('g','Demo · Kleine Auszeit',180000,62000,CURRENT_TIMESTAMP);
        INSERT INTO Project(id,name,updatedAt) VALUES('p','Demo · Zuhause gestalten',CURRENT_TIMESTAMP);
        INSERT INTO ProjectTask(id,projectId,name,updatedAt) VALUES('task','p','Maße nehmen',CURRENT_TIMESTAMP);
      `);
      if(custom)await client.executeMultiple(`
        INSERT INTO BudgetItem(id,budgetId,name,plannedCents,updatedAt) VALUES('own-item','b','Eigene Position',12345,CURRENT_TIMESTAMP);
        INSERT INTO "Transaction"(id,requestId,title,amountCents,kind,date,accountId,updatedAt) VALUES('own-t','own-r','Eigene Buchung',1234,'expense','2026-11-22','a',CURRENT_TIMESTAMP);
        INSERT INTO ProjectTask(id,projectId,name,updatedAt) VALUES('own-task','p','Eigene Aufgabe',CURRENT_TIMESTAMP);
      `);
      await client.executeMultiple('BEGIN IMMEDIATE;\n'+migration('003_remove_demo')+'\nCOMMIT;');
      expect((await client.execute('SELECT * FROM "Transaction" WHERE id=\'t\'')).rows).toHaveLength(0);
      expect((await client.execute('SELECT * FROM SavingsGoal')).rows).toHaveLength(0);
      expect((await client.execute('SELECT * FROM BudgetItem WHERE id=\'i\'')).rows).toHaveLength(0);
      const accounts=(await client.execute('SELECT * FROM Account')).rows;
      expect(accounts).toHaveLength(custom?1:0);
      if(custom){
        expect(accounts[0].openingCents).toBe(0);expect(accounts[0].name).toBe('Girokonto');
        expect((await client.execute('SELECT amountCents FROM "Transaction"')).rows[0].amountCents).toBe(1234);
        expect((await client.execute('SELECT name FROM BudgetItem')).rows[0].name).toBe('Eigene Position');
        expect((await client.execute('SELECT name FROM ProjectTask')).rows[0].name).toBe('Eigene Aufgabe');
      }
    }finally{client.close();}
  });
});
