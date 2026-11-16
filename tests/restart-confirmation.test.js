'use strict';
/* Browser restart confirmation must be an accessible industrial modal, not
   native confirm(), and must preserve or reset progress exactly on choice. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const key='ceh404.rebuilt.qa50.20261108';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try {
  for(const [width,height] of [[360,640],[390,844],[1366,768]]){
   const page=await browser.newPage({viewport:{width,height}});
   const browserDialogTypes=[],errors=[];
   page.on('dialog',async dialog=>{browserDialogTypes.push(dialog.type());await dialog.dismiss()});
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8765/');
   await page.evaluate(k=>{
     const state=window.CEH_LOGIC.initial();
     localStorage.setItem(k,JSON.stringify({...state,scene:'S04',s04Mode:'catalog',name:'Тест',selected:['D']}));
   },key);
   await page.reload();
   const read=()=>page.evaluate(()=>window.__CEH_TEST__.getState());
   const before=await read();
   assert.deepEqual(before.selected,['D']);
   const reset=page.locator('[data-act="reset"]');
   await reset.click();
   const modal=page.locator('.restart-confirm-dialog');
   await modal.waitFor({state:'visible'});
   assert.equal(await modal.getAttribute('aria-labelledby'),'restart-confirm-heading');
   assert.equal(await modal.locator('h2').innerText(),'Начать заново?');
   assert.match(await modal.innerText(),/прогресс.*будут сброшены/s);
   assert.equal(await page.locator('.budget-limit-dialog:visible').count(),1);
   assert.equal(browserDialogTypes.length,0,'native browser confirm() must not be used');
   const geometry=await modal.evaluate(el=>{
     const r=el.getBoundingClientRect(),b=el.querySelector('[data-restart-confirm]').getBoundingClientRect();
     return {x:r.x,right:r.right,y:r.y,bottom:r.bottom,buttonW:b.width,buttonH:b.height,
       css:getComputedStyle(el).backgroundColor,confirmGradient:getComputedStyle(el.querySelector('[data-restart-confirm]')).backgroundImage};
   });
   assert.ok(geometry.x>=-2&&geometry.right<=width+2,'restart modal overflows horizontally');
   assert.ok(geometry.y>=-2&&geometry.bottom<=height+2,'restart modal overflows vertically');
   assert.ok(geometry.buttonW>=100&&geometry.buttonH>=48,'restart confirmation tap target too small');
   assert.match(geometry.confirmGradient,/linear-gradient/,'restart must match budget-warning orange style');
   await modal.locator('[data-restart-cancel]').click();
   assert.equal(await modal.isVisible(),false,'cancel should close the modal');
   assert.deepEqual(await read(),before,'cancel must preserve the entire game state');
   await reset.click();
   await modal.waitFor({state:'visible'});
   await page.keyboard.press('Escape');
   assert.equal(await modal.isVisible(),false,'Escape should close without resetting');
   assert.deepEqual(await read(),before,'Escape must preserve game state');
   await reset.click();
   await modal.waitFor({state:'visible'});
   await modal.locator('[data-restart-confirm]').click();
   const after=await read();
   assert.equal(after.scene,'S00','confirm must restart from entry screen');
   assert.deepEqual(after.selected,[],'confirm must clear portfolio');
   assert.equal(await modal.isVisible(),false,'confirm must close the dialog');
   await page.reload();
   assert.equal((await read()).scene,'S00','restarted state must persist on reload');
   assert.deepEqual(errors,[],'JS browser errors');
   assert.deepEqual(browserDialogTypes,[],'no native browser dialogs');
   console.log('PASS restart confirmation '+width+'x'+height);
   await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
