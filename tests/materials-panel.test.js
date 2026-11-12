/* Materials panel regression: scene gating, read-only history and live form preservation. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const KEY='ceh404.rebuilt.qa50.20261108';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const [width,height] of [[390,844],[1366,768]]){
  const page=await browser.newPage({viewport:{width,height}});
  const errs=[];
  page.on('pageerror',e=>errs.push(e.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'load'});
  await page.evaluate(key=>localStorage.setItem(key,JSON.stringify({
   scene:'S04',s04Mode:'priority',selected:['C'],name:'Миша',
   priority:'losses',s02ReportSeen:true,asked03:['andrey'],
   initialSelected:null,finalSelected:null
  })),KEY);
  await page.reload();
  assert.equal(await page.locator('.ceh-materials-trigger').count(),1,'only one entry');
  await page.locator('.ceh-materials-trigger').click();
  const dlg=page.locator('dialog.ceh-materials-dialog');
  await dlg.waitFor({state:'visible'});
  const body=page.locator('.ceh-materials-content');
  const m=await body.innerText();
  assert.match(m,/Производственный отчёт/);
  assert.match(m,/Андрей Громов/);
  assert.doesNotMatch(m,/Марина Власова/,'future speaker disclosed');
  assert.doesNotMatch(m,/ЭК-В20-01/,'EDU source disclosed prematurely');
  await page.locator('[data-tab="decisions"]').click();
  const history=await body.innerText();
  assert.match(history,/Миша/);
  assert.match(history,/Инвестиционный приоритет/);
  assert.doesNotMatch(history,/Окончательный инвестиционный портфель/);
  await page.keyboard.press('Escape');
  assert.equal(await dlg.evaluate(el=>el.open),false);
  assert.equal(await page.evaluate(()=>document.activeElement.classList.contains('ceh-materials-trigger')),true,'focus must return to trigger');
  await page.evaluate(key=>localStorage.setItem(key,JSON.stringify({
   scene:'S04',s04Mode:'edu',name:'Миша',eduStep:1,eduPage:'task',eduMessage:'',
   priority:'losses',selected:['C','F'],initialSelected:['C','F'],
   s02ReportSeen:true,asked03:['andrey']
  })),KEY);
  await page.reload();
  await page.locator('#edu-low').fill('19,9');
  await page.locator('#edu-high').fill('20,1');
  const stateBefore=await page.evaluate(()=>JSON.stringify(window.__CEH_TEST__.getState()));
  await page.locator('.ceh-materials-trigger').click();
  await dlg.waitFor({state:'visible'});
  assert.match(await body.innerText(),/ЭК-В20-01/,'EDU documents should be available after study');
  await page.locator('[data-tab="decisions"]').click();
  assert.match(await body.innerText(),/SMED/,'portfolio uses names not opaque codes');
  await page.locator('.ceh-materials-close').click();
  assert.equal(await page.locator('#edu-low').inputValue(),'19,9');
  assert.equal(await page.locator('#edu-high').inputValue(),'20,1');
  assert.equal(await page.evaluate(()=>JSON.stringify(window.__CEH_TEST__.getState())),stateBefore,
   'viewing reference must not mutate game state');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3);
  assert.equal(overflow,false,'horizontal overflow '+width);
  assert.deepEqual(errs,[],'no page errors '+width);
  console.log('PASS enterprise materials tabs '+width+'x'+height);
  await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});