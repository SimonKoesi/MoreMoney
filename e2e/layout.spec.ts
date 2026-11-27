import { test, expect, type Page } from '@playwright/test';

async function noTextOverflow(page:Page){
  const failures=await page.evaluate(()=>{
    const viewport=document.documentElement.clientWidth;
    const problems:string[]=[];
    for(const element of document.querySelectorAll<HTMLElement>('h1,h2,label,button,input,select,textarea,.metric,.stock-card,.item-card,.dialog-content,.panel-heading')){
      const style=getComputedStyle(element),box=element.getBoundingClientRect();
      if(style.display==='none'||style.visibility==='hidden'||box.width===0||box.height===0||element.closest('.sr-only'))continue;
      if(element.closest('.table-scroll,.kanban,.sidebar:not(.mobile-open)'))continue;
      if(box.left < -1 || box.right > viewport+1)problems.push(element.tagName+': '+(element.textContent||element.getAttribute('aria-label')||'').slice(0,70));
      if(['H1','H2','LABEL','BUTTON'].includes(element.tagName)&&element.scrollWidth>element.clientWidth+2&&style.overflowX==='visible')problems.push('Textbreite: '+(element.textContent||'').slice(0,70));
    }
    for(const group of document.querySelectorAll<HTMLElement>('.page-heading,.section-bar,.item-top,.panel-heading,.dialog-actions,.stock-form-row,.metrics,.stocks-grid,.item-grid')){
      const children=[...group.children].filter((e):e is HTMLElement=>e instanceof HTMLElement&&getComputedStyle(e).display!=='none');
      for(let i=0;i<children.length;i++)for(let j=i+1;j<children.length;j++){
        const a=children[i].getBoundingClientRect(),b=children[j].getBoundingClientRect();
        if(a.width&&a.height&&b.width&&b.height&&Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)problems.push('Überlappung in '+group.className);
      }
    }
    if(document.body.scrollWidth>viewport+1){problems.push(`Seite ${location.hash} ist breiter als ${viewport}px bei Schrift ${getComputedStyle(document.documentElement).fontSize}`);for(const el of document.querySelectorAll<HTMLElement>('main *')){const r=el.getBoundingClientRect();if(r.right>viewport+1&&r.width>0&&!el.closest('.table-scroll,.kanban'))problems.push(el.tagName+'.'+el.className+': '+r.right);if(problems.length>12)break;}}
    return problems;
  });
  expect(failures).toEqual([]);
}

test('kleine Displays, lange Namen, große Schrift und flache Dialoge',async({page,request})=>{
  test.setTimeout(120000);
  expect((await request.post('/api/state',{data:{op:'demo'}})).status()).toBe(400);
  const long='LangfristigeLebensplanungOhneLeerzeichen'.repeat(3);
  const budgetResponse=await request.post('/api/state',{data:{op:'budget',name:long,description:'',limitCents:1999999999}});
  expect(budgetResponse.ok()).toBe(true);const data=await budgetResponse.json();
  const budget=data.budgets.find((b:{name:string})=>b.name===long);
  await request.post('/api/state',{data:{op:'item',budgetId:budget.id,name:long,plannedCents:1999999,quantity:10,category:long.slice(0,90)}});
  for(const width of [320,375,390,430,768]){
    await page.setViewportSize({width,height:844});
    for(const scale of ['100%','150%','200%']){
      await page.goto('/#/dashboard');await expect(page.locator('h1')).toHaveText('Dashboard');
      await page.evaluate(value=>document.documentElement.style.fontSize=value,scale);
      for(const route of ['dashboard','accounts','transactions','budgets','projects','goals','worth','recurring','installments','simulator','settings','budgets/'+budget.id]){
        await page.evaluate(value=>{location.hash='#/'+value;},route);
        await expect(page.locator('main h1')).toBeVisible();
        await page.waitForTimeout(40);
        await noTextOverflow(page);
      }
    }
  }
  await page.setViewportSize({width:320,height:430});await page.goto('/#/accounts');
  await page.getByRole('button',{name:'Konto hinzufügen',exact:true}).click();
  await page.getByLabel('Name',{exact:true}).fill(long);await noTextOverflow(page);
  await page.getByRole('button',{name:'Speichern',exact:true}).scrollIntoViewIfNeeded();
  await expect(page.getByRole('button',{name:'Speichern',exact:true})).toBeInViewport();
  await page.getByRole('button',{name:'Abbrechen',exact:true}).click();
  await page.setViewportSize({width:844,height:390});await page.goto('/#/worth');await noTextOverflow(page);
  await page.screenshot({path:'test-results/layout-landscape.png',fullPage:true});
});
