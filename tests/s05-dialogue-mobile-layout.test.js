'use strict';
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
    localStorage.setItem(key,JSON.stringify({...s,scene:'S05',s05Phase:'notice0',committeeDecision:'conditions',finalSelected:['C'],name:'Тест'}));
   },key);
   await page.reload();await page.waitForTimeout(160);
   for(let i=0;i<4;i++){
    const info=await page.evaluate(()=>{
     const q=s=>document.querySelector(s),rect=s=>{const r=q(s)?.getBoundingClientRect();return r&&{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
     return {scene:q('.s05-notice-scene')!=null,body:document.body.classList.contains('dialogue-mode-active'),
       panel:rect('.game-dialogue__panel'),text:rect('.game-dialogue__text'),portrait:rect('.game-dialogue__character'),
       stage:rect('.s05-notice-scene'),notice:rect('.s05-tablet-notice'),scroll:document.documentElement.scrollWidth,
       read:window.CEH_DIALOGUE.getReadState(),buttonMore:q('[data-act="dlgMore"]')!=null};
    });
    assert.ok(info.scene&&info.body,'S05 must use full-viewport dialogue stage at '+width+' / '+i);
    assert.ok(info.panel?.width>width*.75,'dialogue panel narrow at '+width+' / '+i+' '+JSON.stringify(info.panel));
    assert.ok(info.panel?.bottom<=height+2&&info.panel?.top>height*.3,'dialogue panel should be near bottom '+width+' / '+i);
    assert.ok(info.portrait?.bottom<=info.panel.top+36,'portrait must not cover dialogue '+width+' / '+i);
    assert.ok(info.text?.height>0,'text area missing');
    assert.ok(info.scroll<=width+3,'horizontal scroll '+width);
    if(i===0){
     assert.ok(info.notice,'notification missing');
     assert.ok(info.notice.bottom<info.panel.top,'notification overlaps bottom dialogue');
    }else assert.ok(!info.notice,'notification should only appear on first frame');
    const expected=[
      'Коллеги, на мой планшет только что пришло сообщение с производства.',
      'Прежде чем принимать срочные меры',
      'По одному сообщению нельзя установить причину задержки.',
      'твоя инвестиционная рекомендация зафиксирована'
    ][i];
    assert.ok(info.read.joined.includes(expected),'wrong or lost dialogue text at '+width+' / '+i);
    let pages=0;
    while(await page.locator('[data-act="dlgMore"]').count()){
      assert.ok(++pages<20,'dialogue pagination loop');
      await page.locator('[data-act="dlgMore"]').dispatchEvent('click');await page.waitForTimeout(70);
    }
    const last=await page.evaluate(()=>window.CEH_DIALOGUE.getReadState());
    assert.equal(last.joined,info.read.joined,'source altered when reading');
    const action=i===3?'s05ToS06':'s05Next';
    assert.equal(await page.locator('[data-act="'+action+'"]').count(),1,'final action unavailable');
    await page.locator('[data-act="'+action+'"]').dispatchEvent('click');
    await page.waitForTimeout(80);
   }
   const s=await page.evaluate(()=>window.__CEH_TEST__.getState());
   assert.equal(s.scene,'S06');
   assert.ok(await page.locator('[data-act="s06ReadDocs"]').count(),'production order briefing missing');
   assert.deepEqual(errors,[], 'page errors');
   console.log('PASS S05 full-width dialogue/notification '+width+'x'+height);
   await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
