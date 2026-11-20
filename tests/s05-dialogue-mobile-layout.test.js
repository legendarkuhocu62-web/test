'use strict';
/* Regression for the current approved S05 transition: one production alert,
 * Gromov's dialogue, then "Перейти на производственный участок".
 * Legacy notice1..3 saves must remain navigable without repeating obsolete speeches.
 */
const { chromium }=require('playwright');
const assert=require('node:assert/strict');
const key='ceh404.rebuilt.qa50.20261108';

(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const [width,height] of [[375,667],[390,844],[1024,768],[1366,768]]){
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8765/');
   await page.evaluate(key=>{
    const s=window.CEH_LOGIC.initial();
    localStorage.setItem(key,JSON.stringify({...s,scene:'S05',s05Phase:'notice0',
      committeeDecision:'conditions',finalSelected:['C'],name:'Тест'}));
   },key);
   await page.reload();await page.waitForTimeout(170);
   const info=await page.evaluate(()=>{
     const q=s=>document.querySelector(s),rect=s=>{const r=q(s)?.getBoundingClientRect();
       return r&&{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
     return {
       noticeScene:!!q('.s05-notice-scene'),
       dialogueMode:document.body.classList.contains('dialogue-mode-active'),
       panel:rect('.game-dialogue__panel'),text:rect('.game-dialogue__text'),
       portrait:rect('.game-dialogue__character'),notice:rect('.s05-tablet-notice'),
       viewportScroll:document.documentElement.scrollWidth,
       joined:window.CEH_DIALOGUE.getReadState().joined
     };
   });
   assert.ok(info.noticeScene&&info.dialogueMode,'expected S05 dialogue '+width);
   assert.ok(info.panel?.width>width*.75,'dialogue panel too narrow at '+width);
   assert.ok(info.panel?.bottom<=height+2&&info.panel?.top>height*.3,'dialogue panel displaced at '+width);
   assert.ok(info.text?.height>0,'dialogue text missing '+width);
   if(width<=720)assert.ok(info.portrait?.bottom<=info.panel.top+36,'portrait hidden by dialogue '+width);
   else assert.ok(info.portrait?.width>100&&info.portrait?.height>100,'portrait not visible '+width);
   assert.ok(info.notice,'production notification missing '+width);
   assert.ok(info.notice.bottom<info.panel.top,'production notification overlaps dialogue '+width);
   assert.ok(info.viewportScroll<=width+3,'horizontal scroll '+width);
   assert.ok(info.joined.includes('Коллеги, на мой планшет только что пришло сообщение с производства.'),
     'Gromov dialogue changed '+width);
   let pages=0;
   while(await page.locator('[data-act="dlgMore"]').count()){
     assert.ok(++pages<20,'dialogue pagination loop');
     await page.locator('[data-act="dlgMore"]').dispatchEvent('click');
     await page.waitForTimeout(70);
   }
   assert.equal(await page.locator('[data-act="s05ToS06"]').count(),1,'production transition absent at '+width);
   assert.equal(await page.locator('[data-act="s05Next"]').count(),0,'old multi-step interlude unexpectedly restored');
   assert.match(await page.locator('[data-act="s05ToS06"]').innerText(),/Перейти на производственный участок/);
   await page.locator('[data-act="s05ToS06"]').dispatchEvent('click');
   await page.waitForTimeout(90);
   const state=await page.evaluate(()=>window.__CEH_TEST__.getState());
   assert.equal(state.scene,'S06');
   assert.ok(await page.locator('[data-act="s06ReadDocs"]').count(),'S06 briefing missing '+width);
   assert.deepEqual(errors,[],'JavaScript errors at '+width);
   console.log('PASS S05 current single-alert dialogue '+width+'x'+height);
   await page.close();
  }
  /* Saved sessions created by historical S05 notice1–3 still go to S06. */
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto('http://127.0.0.1:8765/');
  for(const phase of ['notice1','notice2','notice3']){
    await page.evaluate(({key,phase})=>{
      const s=window.CEH_LOGIC.initial();
      localStorage.setItem(key,JSON.stringify({...s,scene:'S05',s05Phase:phase,
        committeeDecision:'stage',finalSelected:['D'],name:'Тест'}));
    },{key,phase});
    await page.reload();await page.waitForTimeout(60);
    let pages=0;
    while(await page.locator('[data-act="dlgMore"]').count()){
      assert.ok(++pages<20,'legacy dialogue pagination loop');
      await page.locator('[data-act="dlgMore"]').dispatchEvent('click');
    }
    assert.equal(await page.locator('[data-act="s05ToS06"]').count(),1,'legacy phase '+phase+' blocked');
  }
  await page.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
