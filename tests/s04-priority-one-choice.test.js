'use strict';
// S04: choose exactly one priority; three S03 specialists and three S06 documents are unrelated gates.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const KEY='ceh404.rebuilt.qa50.20261108';

(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const [width,height] of [[390,844],[1024,768],[1366,768]]){
   const page=await browser.newPage({viewport:{width,height}});
   const errors=[];page.on('pageerror',err=>errors.push(err.message));
   await page.goto('http://127.0.0.1:8765/');
   const goals=await page.evaluate(()=>window.CEH_DATA.goals.map(g=>g.id));
   assert.equal(goals.length,3,'S04 must have three investment priorities');

   const setup=async(state={})=>{
    await page.evaluate(([key,state])=>{
     const initial=window.CEH_LOGIC.initial();
     localStorage.setItem(key,JSON.stringify({...initial,name:'Тест',scene:'S04',s04Mode:'priority',...state}));
    },[KEY,state]);
    await page.reload();
   };

   await setup();
   let cta=page.locator('.document--priority [data-act="catalog"]');
   assert.equal(await cta.count(),1,'catalog CTA must remain visible');
   assert.equal(await cta.isVisible(),true,'catalog CTA should not disappear');
   assert.equal(await cta.isDisabled(),true,'catalog CTA must be disabled before priority');
   await page.evaluate(()=>window.__CEH_TEST__.act('catalog',''));
   assert.equal((await page.evaluate(()=>window.__CEH_TEST__.getState())).s04Mode,'priority',
    'no-priority transition must be guarded in code');
   await page.evaluate(()=>window.__CEH_TEST__.act('priority','not-a-goal'));
   assert.equal((await page.evaluate(()=>window.__CEH_TEST__.getState())).priority,null,
    'invalid priority ID should not be stored');

   for(const goal of goals){
    await setup();
    cta=page.locator('.document--priority [data-act="catalog"]');
    await page.locator('[data-act="priority"][data-id="'+goal+'"]').click();
    assert.equal(await cta.isEnabled(),true,'one priority should unlock catalog: '+goal);
    assert.equal((await page.evaluate(()=>window.__CEH_TEST__.getState())).priority,goal,
     'saved priority mismatch: '+goal);
    assert.equal(await page.locator('.document--priority [data-act="priority"].selected').count(),1,
     'only one priority should be selected');
    await cta.click();
    const result=await page.evaluate(()=>window.__CEH_TEST__.getState());
    assert.equal(result.s04Mode,'catalog','cannot enter catalog after one priority: '+goal);
    assert.equal(result.priority,goal,'priority was lost on catalog transition: '+goal);
    assert.equal(await page.locator('.document--catalog').count(),1,'catalog did not render');
   }

   await setup();
   await page.locator('[data-act="priority"][data-id="'+goals[0]+'"]').click();
   await page.locator('[data-act="priority"][data-id="'+goals[1]+'"]').click();
   assert.equal(await page.locator('[data-act="priority"].selected').count(),1,
    'changing a priority must replace—not accumulate—the previous one');
   assert.equal((await page.evaluate(()=>window.__CEH_TEST__.getState())).priority,goals[1]);

   // Returning from portfolio confirmation to its catalog must still work.
   await setup({s04Mode:'catalog',priority:goals[1],selected:['C'],showReview:true});
   assert.equal(await page.locator('.document--catalog [data-act="catalog"]').count(),1);
   await page.locator('.document--catalog [data-act="catalog"]').click();
   const back=await page.evaluate(()=>window.__CEH_TEST__.getState());
   assert.equal(back.s04Mode,'catalog','return to editor was broken');
   assert.equal(back.showReview,false,'confirmation must close when returning');
   assert.deepEqual(back.selected,['C'],'investment selection changed on return');
   assert.equal(back.priority,goals[1],'priority changed on return');

   assert.deepEqual(errors,[],'browser errors at '+width+'x'+height);
   console.log('PASS S04 single-priority gate '+width+'x'+height);
   await page.close();
  }
 } finally { await browser.close(); }
})().catch(err=>{console.error(err);process.exit(1)});
