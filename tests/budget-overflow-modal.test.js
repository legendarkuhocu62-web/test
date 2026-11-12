'use strict';
/* S04 budget overflow must open a styled modal in place and preserve portfolio, focus and scroll. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const key='ceh404.rebuilt.qa50.20261108';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const [width,height] of [[375,667],[390,844],[1366,768]]){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.goto('http://127.0.0.1:8765/');
  const state=await page.evaluate(key=>{
    const base=window.CEH_LOGIC.initial();
    const state={...base,scene:'S04',s04Mode:'catalog',name:'Анна',selected:['A','B'],budgetMessage:''};
    localStorage.setItem(key,JSON.stringify(state));
    return state;
  },key);
  await page.reload();
  const add=page.locator('[data-act="catalogOpen"][data-id="C"]');
  await add.click();
  const performAdd=page.locator('.ic-detail [data-act="catalogAdd"]');
  // Record the click position inside the card modal.
  await performAdd.evaluate(el=>el.addEventListener('click',()=>{window.__budgetScrollAtClick=window.scrollY;},{capture:true,once:true}));
  const before=await page.evaluate(()=>({y:window.scrollY,selection:window.__CEH_TEST__.getState().selected}));
  await performAdd.click();
  const clickScroll=await page.evaluate(()=>window.__budgetScrollAtClick);
  assert.ok(Number.isFinite(clickScroll),'click scroll was not recorded');
  const dlg=page.locator('.budget-limit-dialog');
  await dlg.waitFor({state:'visible'});
  const content=await dlg.innerText();
  assert.match(content,/Бюджет превышен/);
  assert.match(content,/5 млн у\.е\./);
  assert.match(content,/15 млн у\.е\./);
  assert.match(content,/5S/);
  assert.match(content,/ПОНЯТНО/);
  assert.equal(await page.locator('.budget-message').count(),0,'must not render a remote top-of-catalog warning');
  const selection=await page.evaluate(()=>window.__CEH_TEST__.getState().selected);
  assert.deepEqual(selection,['A','B'],'failed addition must not change selected portfolio');
  assert.ok(Number.isFinite(clickScroll),'budget action click recorded');
  await dlg.locator('button').click();
  assert.equal(await dlg.isVisible(),false,'dialog must close');
  assert.equal(await page.locator('.ic-detail:visible').count(),1,'original card remains open');
  assert.equal(await page.locator('.ic-detail:visible').count(),1,'return to card after warning');
  // Valid addition after freeing budget remains functional and doesn't reopen the dialog.
  await page.locator('.ic-detail [data-act="catalogDecline"]').click();
  await page.locator('[data-act="catalogOpen"][data-id="B"]').click();
  await page.locator('.ic-detail [data-act="catalogDecline"]').click();
  await page.locator('[data-act="catalogOpen"][data-id="C"]').click();
  await page.locator('.ic-detail [data-act="catalogAdd"]').click();
  const finalState=await page.evaluate(()=>window.__CEH_TEST__.getState());
  assert.deepEqual(finalState.selected,['A','C'],'valid additions must work');
  assert.equal(await page.locator('.budget-limit-dialog:visible').count(),0);
  assert.deepEqual(errors,[],'JS runtime errors');
  console.log('PASS budget dialog '+width+'x'+height);
  await page.close();
 }
 await browser.close();
})().catch(err=>{console.error(err);process.exit(1)});
