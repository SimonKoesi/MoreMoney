import { expect, test } from '@playwright/test';

test('Bankkonten zeigen lokale Konten und Import ohne Online-Einrichtung', async ({page})=>{
 let openedBankApi=false;
 await page.route('**/api/open-banking', async route=>{
  openedBankApi=true;
  await route.abort();
 });
 await page.setViewportSize({width:390,height:844});
 await page.goto('/#/bank');
 await expect(page.getByRole('button',{name:'Konto hinzufügen'})).toBeVisible({timeout:20_000});
 await expect(page.getByRole('button',{name:'Bankanbindung einrichten'})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Bank verbinden',exact:true})).toHaveCount(0);
 await page.getByRole('tab',{name:'Import',exact:true}).click();
 await expect(page.getByLabel('Datei',{exact:true})).toBeVisible();
 expect(openedBankApi).toBe(false);
});

test('Eine vorhandene Onlinefreigabe bleibt im Datenschutz widerrufbar',async({page})=>{
 const link={id:'574180bf-1d0c-4b9d-aaac-5615509583bc',bank:'Sparkasse Teststadt',name:'Synthetisches Girokonto'};
 await page.route('**/api/finance',async route=>{
  const response=await route.fetch();
  const data=await response.json();
  await route.fulfill({response,json:{...data,bank:{...data.bank,configured:true}}});
 });
 await page.route('**/api/open-banking',async route=>{
  if(route.request().method()==='GET')return route.fulfill({json:{links:[link]}});
  expect(route.request().postDataJSON()).toEqual({op:'disconnect',id:link.id});
  await route.fulfill({json:{links:[]}});
 });
 await page.goto('/#/privacy');
 await page.getByText('Vorhandene Onlinefreigaben',{exact:true}).click();
 await page.getByRole('button',{name:'Freigabe widerrufen'}).click();
 await expect(page.getByRole('dialog')).toContainText('Importierte Buchungen bleiben erhalten.');
 await page.getByRole('dialog').getByRole('button',{name:'Widerrufen',exact:true}).click();
 await expect(page.getByText('Keine verbundenen Konten.')).toBeVisible();
});

test('dark mode, category templates, real icon choices and confirmed account deletion',async({page,request})=>{
 const response=await request.post('/api/state',{data:{op:'account',name:'Temporäres Löschkonto',type:'Girokonto',openingCents:0}});
 expect(response.ok()).toBe(true);
 await page.emulateMedia({colorScheme:'light'});
 await page.goto('/#/accounts');
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await expect(page.getByRole('button',{name:'Theme wechseln'})).toHaveCount(0);
 await page.locator('.account-card').filter({hasText:'Temporäres Löschkonto'}).getByRole('button',{name:'Konto löschen'}).click();
 await page.getByRole('dialog').getByRole('button',{name:'Endgültig löschen'}).click();
 await expect(page.getByRole('heading',{name:'Temporäres Löschkonto'})).toHaveCount(0);

 await page.goto('/#/subscriptions');
 await page.getByRole('button',{name:'Abo hinzufügen'}).click();
 const dialog=page.getByRole('dialog');
 await dialog.getByLabel('Anbieter',{exact:true}).fill('Synthetisches Lern-Abo');
 await dialog.getByLabel('Preis',{exact:true}).fill('9,99');
 await dialog.getByText('Zuordnung',{exact:true}).click();
 await expect(dialog.locator('datalist option[value="Streaming"]')).toHaveCount(1);
 await dialog.getByLabel('Kategorie',{exact:true}).fill('Eigene Lernprojekte');
 await dialog.getByLabel('Symbol auswählen',{exact:true}).click();
 const music=dialog.getByRole('button',{name:'Musik',exact:true});
 await expect(music.locator('svg')).toHaveCount(1);
 await music.click();
 await dialog.getByRole('button',{name:'Speichern',exact:true}).click();
 await expect(dialog).toHaveCount(0);
 const state=await (await request.get('/api/finance')).json();
 expect(state.subscriptions.find((row:{name:string})=>row.name==='Synthetisches Lern-Abo')).toMatchObject({category:'Eigene Lernprojekte',icon:'music'});
 expect(state.savedCategories).toContain('Eigene Lernprojekte');
});
