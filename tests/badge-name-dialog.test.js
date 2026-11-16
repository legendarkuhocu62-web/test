'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const key='ceh404.rebuilt.qa50.20261108';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const [width,height] of [[360,640],[390,844],[1366,768]]){
   const page=await browser.newPage({viewport:{width,height}});
   const nativeDialogs=[],jsErrors=[];
   page.on('dialog',async d=>{nativeDialogs.push(d.type());await d.dismiss()});
   page.on('pageerror',e=>jsErrors.push(e.message));
   await page.goto('http://127.0.0.1:8765/');
   await page.evaluate(key=>{
     const state=window.CEH_LOGIC.initial();
     localStorage.setItem(key,JSON.stringify({...state,scene:'S00',s00:3,name:''}));
   },key);
   await page.reload();
   const name=page.locator('#name');
   await name.waitFor({state:'visible'});
   await name.fill('   ');
   await page.locator('[data-act="badge"]').click();
   const dialog=page.locator('dialog.badge-name-dialog');
   await dialog.waitFor({state:'visible'});
   assert.equal(await dialog.locator('h2').innerText(),'Введите имя');
   assert.match(await dialog.innerText(),/персональный пропуск/);
   assert.equal(await dialog.getAttribute('aria-labelledby'),'badge-name-heading');
   assert.equal(nativeDialogs.length,0,'native alert must not appear');
   const geometry=await dialog.evaluate(node=>{
     const r=node.getBoundingClientRect(),btn=node.querySelector('button');
     const b=btn.getBoundingClientRect(),cs=getComputedStyle(btn);
     return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,
       buttonWidth:b.width,buttonHeight:b.height,background:getComputedStyle(node).backgroundImage,
       buttonGradient:getComputedStyle(btn,'::before').backgroundImage};
   });
   assert.ok(geometry.left>=-2&&geometry.right<=width+2,'dialog horizontally clipped '+width);
   assert.ok(geometry.top>=-2&&geometry.bottom<=height+2,'dialog vertically clipped '+height);
   assert.ok(geometry.buttonHeight>=44&&geometry.buttonWidth>=100,'acknowledge control too small');
   assert.match(geometry.buttonGradient,/linear-gradient/,'CTA must use orange game style');
   await dialog.locator('[data-name-dialog-ok]').click();
   assert.equal(await dialog.isVisible(),false);
   assert.equal(await name.evaluate(el=>document.activeElement===el),true,'focus should return to name');
   assert.equal((await page.evaluate(()=>window.__CEH_TEST__.getState())).s00,3,'empty name must not advance');
   await name.fill('');
   await name.press('Enter');
   await dialog.waitFor({state:'visible'});
   await page.keyboard.press('Escape');
   assert.equal(await dialog.isVisible(),false,'Escape should dismiss warning');
   assert.equal(await name.evaluate(el=>document.activeElement===el),true,'Escape should restore focus');
   await name.fill('Анна');
   await page.locator('[data-act="badge"]').click();
   const state=await page.evaluate(()=>window.__CEH_TEST__.getState());
   assert.equal(state.s00,4,'valid name must issue pass');
   assert.equal(state.name,'Анна');
   assert.equal(nativeDialogs.length,0);
   assert.deepEqual(jsErrors,[],'browser JS errors');
   console.log('PASS branded missing-name dialog '+width+'x'+height);
   await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
