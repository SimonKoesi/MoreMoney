import {test,expect} from '@playwright/test';
const uuid=()=>crypto.randomUUID();
test('Bankdatei: Vorschau, Idempotenz, Vormerkung und Rücknahme',async({request})=>{
 const accountData=await (await request.post('/api/state',{data:{op:'account',name:'Importkonto synthetisch',type:'Girokonto',openingCents:100000}})).json();
 const account=accountData.accounts.find((a:{name:string})=>a.name==='Importkonto synthetisch');
 const mapping={date:'Datum',amount:'Betrag',payee:'Anbieter',externalId:'ID',status:'Status'};
 const content='Datum;Betrag;Anbieter;ID;Status\n01.01.2026;-10,00;Synthetischer Dienst;synthetic-1;gebucht\n01.02.2026;-11,00;Synthetischer Dienst;synthetic-2;gebucht\n01.03.2026;-12,00;Synthetischer Dienst;synthetic-3;vorgemerkt';
 const input={op:'preview',accountId:account.id,filename:'synthetisch.csv',format:'csv',content,mapping};
 const preview=await request.post('/api/bank',{data:input});expect(preview.ok()).toBe(true);const parsed=await preview.json();expect(parsed.rows).toHaveLength(3);
 const commit={...input,op:'commit',selected:[0,1,2]};expect((await request.post('/api/bank',{data:commit})).ok()).toBe(true);expect((await request.post('/api/bank',{data:commit})).ok()).toBe(true);
 let state=await (await request.get('/api/state')).json();expect(state.transactions.filter((t:{accountId:string})=>t.accountId===account.id)).toHaveLength(2);
 const booked={...commit,content:content.replace('vorgemerkt','gebucht')};const updated=await (await request.post('/api/bank',{data:booked})).json();expect(updated.ok).toBe(true);
 state=await (await request.get('/api/state')).json();expect(state.transactions.filter((t:{accountId:string})=>t.accountId===account.id)).toHaveLength(3);
 expect((await request.post('/api/bank',{data:{op:'undo',id:updated.batch.id}})).ok()).toBe(true);
 state=await (await request.get('/api/state')).json();expect(state.transactions.filter((t:{accountId:string})=>t.accountId===account.id)).toHaveLength(2);
});

test('Abo und Vermögen: echte Speicherung, Fremdwährungen und keine doppelte Kontobewertung',async({request,page})=>{
 const initial=await (await request.get('/api/finance')).json();expect(initial.bank.configured).toBe(false);
 const sub=await request.post('/api/finance',{data:{op:'subscription',data:{id:uuid(),name:'Synthetischer Vertrag',priceCents:1599,currency:'EUR',interval:'monthly',startDate:'2026-01-01',nextCharge:'2026-12-01',status:'active'}}});expect(sub.ok()).toBe(true);expect((await sub.json()).summary.monthlyCents).toBeGreaterThanOrEqual(1599);
 const asset=await request.post('/api/finance',{data:{op:'asset',data:{id:uuid(),name:'Synthetischer Wert',category:'Fahrzeuge',purchaseCents:100000,currentValueCents:100000,currency:'EUR',valueDate:'2026-11-25'}}});expect(asset.ok()).toBe(true);
 const before=await asset.json();const account=before.accounts[0];
 const linked=await request.post('/api/finance',{data:{op:'asset',data:{id:uuid(),name:'Verknüpftes Konto',category:'Konten',purchaseCents:0,currentValueCents:99999,currency:'EUR',accountId:account.id,valueDate:'2026-11-25'}}});expect(linked.ok()).toBe(true);expect((await linked.json()).worth.netCents).toBe(before.worth.netCents);
 const usd=await request.post('/api/finance',{data:{op:'asset',data:{name:'Synthetischer USD-Wert',category:'Sonstiges',purchaseCents:100,currentValueCents:100,currency:'USD',valueDate:'2026-11-25'}}});expect(usd.ok()).toBe(true);expect((await usd.json()).worth.excludedCurrencies).toContain('USD');
 await page.goto('/#/subscriptions');await expect(page.getByRole('tab',{name:'Verträge',exact:true})).toBeVisible();await page.getByRole('tab',{name:'Verträge',exact:true}).click();await expect(page.getByRole('button',{name:/Synthetischer Vertrag/})).toBeVisible();
 await page.getByRole('button',{name:'Privacy Mode einschalten'}).click();await expect(page.getByRole('heading',{name:'Diskreter Modus'})).toBeVisible();await expect(page.getByText('Synthetischer Vertrag')).toHaveCount(0);await expect(page.locator('.recharts-wrapper')).toHaveCount(0);await page.reload();await expect(page.getByRole('heading',{name:'Diskreter Modus'})).toBeVisible();await page.getByRole('button',{name:'Anzeigen',exact:true}).click();await expect(page.getByRole('heading',{name:'Abo-Manager',exact:true})).toBeVisible();
});

test('Financial Health zeigt Datenlücken und simuliert ohne Datenänderung',async({page,request})=>{
  const before=await (await request.get('/api/intelligence')).json();
  expect(before.health.score).toBeNull();
  await page.goto('/#/health');
  await expect(page.getByText('Noch keine belastbare Gesamtbewertung')).toBeVisible();
  await page.getByLabel('Änderung der Liquidität in EUR',{exact:true}).fill('1000');
  await page.getByRole('button',{name:'Berechnen',exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:'Modellwert'})).toContainText('nicht bewertbar');
  const after=await (await request.get('/api/intelligence')).json();
  expect(after.health.history.map((row:{id:string})=>row.id)).toEqual(before.health.history.map((row:{id:string})=>row.id));
  expect(after.accounts).toEqual(before.accounts);
});
