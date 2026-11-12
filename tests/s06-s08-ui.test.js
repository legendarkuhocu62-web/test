'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const key='ceh404.rebuilt.qa50.20261108';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const [width,height] of [[375,667],[390,844],[1366,768]]){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/');
  await page.evaluate(key=>{
   const s=window.CEH_LOGIC.initial();
   localStorage.setItem(key,JSON.stringify({...s,scene:'S04',s04Mode:'savedFinal',name:'Игрок QA',selected:['A','C'],initialSelected:['A'],finalSelected:['A','C'],priority:'losses',eduStep:4}));
  },key);
  await page.reload();
  assert.equal(await page.locator('[data-act="orderStart"]').count(),1,'entry after saved portfolio');
  await page.locator('[data-act="orderStart"]').click();
  assert.equal((await page.evaluate(()=>window.__CEH_TEST__.getState())).scene,'S06');
  assert.equal(await page.locator('[data-act="orderTask"]:disabled').count(),1,'3/3 must lock analysis');
  for(const id of ['shipping','route','grinding']){
   await page.locator('[data-act="orderDoc"][data-id="'+id+'"]').click();
   assert.equal(await page.locator('.order-paper').count(),1,'document opens');
   await page.locator('[data-act="orderCloseDoc"]').click();
  }
  assert.match(await page.locator('.order-progress').innerText(),/3 \/ 3/);
  await page.locator('[data-act="orderTask"]').click();
  assert.equal(await page.locator('.order-statement').count(),5);
  for(const [i,v] of ['confirmed','check','check','check','confirmed'].entries()){
   await page.locator('[data-order-answer="'+i+'"][value="'+v+'"]').check();
  }
  await page.locator('[data-act="orderSubmit"]').click();
  assert.match(await page.locator('.order-feedback--error').innerText(),/два других заказа/);
  const first=await page.evaluate(()=>window.__CEH_TEST__.getState().s0608.firstSubmitted);
  assert.equal(first.correct,false);
  await page.locator('[data-order-answer="1"][value="confirmed"]').check();
  await page.locator('[data-act="orderSubmit"]').click();
  assert.equal(await page.locator('[data-act="orderToS07"]').count(),1);
  await page.locator('[data-act="orderToS07"]').click();
  assert.equal((await page.evaluate(()=>window.__CEH_TEST__.getState())).scene,'S07');
  await page.locator('[data-act="orderChoose"][data-id="priority"]').click();
  await page.locator('[data-act="orderToS08"]').click();
  assert.equal((await page.evaluate(()=>window.__CEH_TEST__.getState())).scene,'S08');
  assert.equal(await page.locator('.order-report-sections section').count(),8);
  assert.match(await page.locator('.order-report-sections').innerText(),/Первоначальный: A/);
  assert.match(await page.locator('.order-report-sections').innerText(),/Итоговый: A, C/);
  await page.reload();
  assert.equal(await page.locator('.order-report-sections section').count(),8,'resume S08');
  assert.equal((await page.evaluate(()=>window.__CEH_TEST__.getState().s0608.firstSubmitted)).correct,false);
  assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth))<=width+3,'no horizontal overflow '+width);
  assert.deepEqual(errors,[],'browser error '+width);
  console.log('PASS S06–S08 integration '+width+'x'+height);
  await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
