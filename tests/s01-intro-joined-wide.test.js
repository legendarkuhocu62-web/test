'use strict';
// Original two Irina statements merge only for wide screens.
// On mobile and old saves, all four original source fragments remain in order.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const KEY='ceh404.rebuilt.qa50.20261108';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const [width,height,expectedNext] of [
   [320,568,1],[390,844,1],[720,740,1],[1024,768,2],[1366,768,2]
  ]){
   const page=await browser.newPage({viewport:{width,height}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8765/');
   await page.evaluate(key=>{
     const state=window.CEH_LOGIC.initial();
     localStorage.setItem(key,JSON.stringify({...state,scene:'S01',s01:0,name:'Анна'}));
   },KEY);
   await page.reload();
   await page.waitForTimeout(150);
   const expected=await page.evaluate(w=>{
     const [first,second]=window.CEH_DATA.intro;
     return (w>=1024?first+'\n'+second:first).replace('[Имя]','Анна');
   },width);
   assert.equal(await page.evaluate(()=>window.CEH_DIALOGUE.getReadState().joined),expected,
     'Irina source text mismatch '+width);
   let count=0;
   while(await page.locator('.game-dialogue [data-act="dlgMore"]').count()){
     const clipped=await page.evaluate(()=>{
       const p=document.querySelector('.game-dialogue__text p');
       const t=document.querySelector('.game-dialogue__text');
       return p.getBoundingClientRect().bottom-t.getBoundingClientRect().bottom;
     });
     assert.ok(clipped<=3,'intro text clipped at '+width+'x'+height);
     await page.locator('[data-act="dlgMore"]').click();
     assert.ok(++count<25,'intro navigation stuck');
   }
   await page.locator('[data-act="introNext"]').click();
   assert.equal((await page.evaluate(()=>window.__CEH_TEST__.getState())).s01,expectedNext,
     'Irina second intro must be skipped only when joined on desktop '+width);
   const next=await page.evaluate(()=>window.CEH_DIALOGUE.getReadState().joined);
   const source=await page.evaluate(index=>window.CEH_DATA.intro[index].replace('[Имя]','Анна'),expectedNext);
   assert.equal(next,source,'next Irina fragment missing '+width);
   // Old saves already on the second fragment must not lose their position.
   if(width>=1024){
     await page.evaluate(key=>{
       const state=window.CEH_LOGIC.initial();
       localStorage.setItem(key,JSON.stringify({...state,scene:'S01',s01:1,name:'Анна'}));
     },KEY);
     await page.reload();
     const old=await page.evaluate(()=>window.CEH_DIALOGUE.getReadState().joined);
     assert.equal(old,await page.evaluate(()=>window.CEH_DATA.intro[1]),
       'resumed legacy second intro must remain intact');
   }
   assert.deepEqual(errors,[],'browser errors '+width);
   console.log('PASS S01 first two intros '+width+'x'+height+' advance='+expectedNext);
   await page.close();
  }
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
