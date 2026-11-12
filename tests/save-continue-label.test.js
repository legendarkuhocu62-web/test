'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const key='ceh404.rebuilt.qa50.20261108';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const [width,height] of [[390,844],[1366,768]]){
  const page=await browser.newPage({viewport:{width,height}});
  await page.goto('http://127.0.0.1:8765/');
  await page.evaluate(k=>{
    const s=window.CEH_LOGIC.initial();
    localStorage.setItem(k,JSON.stringify({...s,scene:'S04',s04Mode:'reviewFinal',name:'Тест',selected:['A'],initialSelected:['A']}));
  },key);
  await page.reload();
  const button=page.locator('[data-act="saveFinal"]');
  assert.equal(await button.count(),1);
  assert.equal((await button.textContent()).trim(),'Сохранить и продолжить');
  assert.equal(await page.getByText('Сохранить и обосновать').count(),0);
  await button.click();
  const s=await page.evaluate(()=>window.__CEH_TEST__.getState());
  assert.equal(s.s04Mode,'savedFinal');
  assert.deepEqual(s.finalSelected,['A']);
  console.log('PASS save portfolio wording '+width+'x'+height);
  await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
