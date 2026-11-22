import { test, expect } from '@playwright/test';
import sharp from 'sharp';
test('persistenter Finanzablauf, Bilder, Teilzahlungen und unabhängige Checkliste',async({page,request})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Konto anlegen',exact:true}).first().click();
  await page.getByLabel('Name',{exact:true}).fill('Testkonto');
  await page.getByLabel('Anfangsbestand in EUR').fill('2000');
  await page.getByRole('button',{name:'Speichern',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button',{name:'Meine Budgets'}).click();
  await page.getByRole('button',{name:'Budget erstellen'}).click();
  await page.getByLabel('Name',{exact:true}).fill('Wohnung');await page.getByLabel('Gesamtbudget in EUR').fill('1200');
  await page.getByRole('button',{name:'Speichern',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button',{name:/Wohnung.*Positionen/}).click();
  await page.getByRole('button',{name:'Position hinzufügen',exact:true}).click();
  await page.getByLabel('Name',{exact:true}).fill('Sofa');await page.getByLabel('Geplanter Einzelpreis in EUR').fill('1000');
  await page.getByRole('button',{name:'Speichern',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('Sofa',{exact:true}).check();
  await expect.poll(async()=>{const d=await(await request.get('/api/state')).json();return d.budgets[0].items[0].done;}).toBe(true);
  let data=await(await request.get('/api/state')).json();expect(data.transactions).toHaveLength(0);
  for(const amount of ['200','800']){
    await page.getByRole('button',{name:'Zahlung erfassen',exact:true}).click();await page.getByLabel('Betrag in EUR',{exact:true}).fill(amount);
    await page.getByRole('button',{name:'Speichern',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  data=await(await request.get('/api/state')).json();expect(data.transactions).toHaveLength(2);expect(data.transactions.reduce((s:number,t:{amountCents:number})=>s+t.amountCents,0)).toBe(100000);
  await page.getByRole('tab',{name:'Galerie',exact:true}).click();
  await page.locator('.item-actions summary').click();
  await page.locator('input[type=file]').setInputFiles({name:'test.png',mimeType:'image/png',buffer:await sharp({create:{width:100,height:80,channels:3,background:'#68ddc1'}}).png().toBuffer()});
  await expect(page.locator('.product-images img')).toHaveCount(1);
  await page.reload();await page.getByRole('button',{name:/Wohnung.*Positionen/}).click();
  await expect(page.getByLabel('Sofa',{exact:true})).toBeChecked();
  await page.setViewportSize({width:390,height:844});await expect(page.locator('h1')).toHaveText('Wohnung');
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth',390);
  await page.screenshot({path:'test-results/mobile.png',fullPage:true});
  await page.setViewportSize({width:1440,height:1050});
  await page.getByRole('button',{name:'Dashboard',exact:true}).click();
  await page.screenshot({path:'test-results/dashboard.png',fullPage:true});
});

test('API: Idempotenz, Transfers, Zugriffsschutz und vollständiges Bildbackup',async({request})=>{
  let d=await(await request.get('/api/state')).json();const accountId=d.accounts[0].id;
  const payload={op:'transaction',requestId:crypto.randomUUID(),title:'Wiederholungstest',amountCents:123,kind:'expense',date:'2026-11-22',accountId};
  expect((await request.post('/api/state',{data:payload})).ok()).toBeTruthy();
  expect((await request.post('/api/state',{data:payload})).ok()).toBeTruthy();
  d=await(await request.get('/api/state')).json();expect(d.transactions.filter((t:{requestId:string})=>t.requestId===payload.requestId)).toHaveLength(1);
  await request.post('/api/state',{data:{op:'account',name:'Sparkonto',type:'Sparkonto',openingCents:0}});
  d=await(await request.get('/api/state')).json();
  const transfer={op:'transfer',requestId:crypto.randomUUID(),from:accountId,to:d.accounts[1].id,amountCents:500,date:'2026-11-22'};
  expect((await request.post('/api/state',{data:transfer})).ok()).toBeTruthy();await request.post('/api/state',{data:transfer});
  d=await(await request.get('/api/state')).json();const sides=d.transactions.filter((t:{transferId:string})=>t.transferId===transfer.requestId);expect(sides).toHaveLength(2);expect(sides.map((s:{kind:string})=>s.kind).sort()).toEqual(['transfer-in','transfer-out']);
  expect((await request.post('/api/state',{headers:{origin:'https://fremd.example'},data:payload})).status()).toBe(403);
  const item=d.budgets[0].items[0];
  expect((await request.post('/api/state',{data:{op:'deleteItem',id:item.id}})).ok()).toBe(false);
  expect((await request.post('/api/images',{multipart:{itemId:item.id,image:{name:'fake.png',mimeType:'image/png',buffer:Buffer.from('kein Bild')}}})).ok()).toBe(false);
  const backup=await(await request.get('/api/export')).json();expect(backup.version).toBe(1);expect(Object.keys(backup.images)).toHaveLength(1);
});
