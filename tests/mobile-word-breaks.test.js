'use strict';
// Only mobile labels: exact words, intentional 2-line breaks, real hit targets.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const KEY='ceh404.rebuilt.qa50.20261108';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const [width,height] of [[320,568],[360,640],[390,844],[430,932]]){
   const page=await browser.newPage({viewport:{width,height}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8765/');
   await page.evaluate(key=>{
    const s=window.CEH_LOGIC.initial();
    localStorage.setItem(key,JSON.stringify({...s,scene:'S04',s04Mode:'priority',name:'Анна'}));
   },KEY);
   await page.reload();
   const quality=page.locator('[data-act="priority"][data-id="quality"]');
   assert.equal(await quality.count(),1);
   assert.equal((await quality.textContent()).replace(/\s+/g,' ').trim(),'Повышение качества и устойчивости');
   const q=await quality.evaluate(el=>{
    const span=el.querySelector('.priority-quality-break'),
      a=el.getBoundingClientRect(),r=span.getBoundingClientRect(),c=getComputedStyle(el),cs=getComputedStyle(span);
    return {breakDisplay:cs.display,hyphens:c.hyphens,wordBreak:c.wordBreak,
      button:{left:a.left,right:a.right,width:a.width,height:a.height},
      spacer:{width:r.width,height:r.height},
      docWide:document.documentElement.scrollWidth-innerWidth};
   });
   assert.equal(q.breakDisplay,'block','S04 quality must break only between approved phrases '+width);
   assert.equal(q.hyphens,'none','S04 quality contains broken words '+width);
   assert.ok(q.button.left>=-2&&q.button.right<=width+2&&q.docWide<=3);
   await quality.click();
   assert.equal((await page.evaluate(()=>window.__CEH_TEST__.getState())).priority,'quality');
   for(const specialist of [
    ['andrey','Что вы думаете','об оборудовании?'],
    ['irina','Что важно проверить','в потерях?'],
    ['marina','Что важно для','бюджета?']
   ]){
    await page.evaluate(([key,id])=>{
     const s=window.CEH_LOGIC.initial();
     localStorage.setItem(key,JSON.stringify({...s,scene:'S03',name:'Анна',
      s03Person:id,s03QuestionMode:'speech'}));
    },[KEY,specialist[0]]);
    await page.reload();
    // The real dialogue remeasures after first paint and after navigation.
    // Wait for its settled layout before looking for the FINAL-page action.
    await page.waitForTimeout(90);
    for(let guard=0;!(await page.locator('[data-act="s03Ask"]').count());guard++){
     assert.ok(guard<25,'S03 dialogue stuck before question');
     const more=page.locator('[data-act="dlgMore"]');
     await more.waitFor({state:'visible',timeout:1500});
     await more.click();
     await page.waitForTimeout(70);
    }
    const ask=page.locator('[data-act="s03Ask"]');
    assert.equal(await ask.count(),1);
    assert.equal(await ask.locator('.s03-question-first').textContent(),specialist[1]);
    assert.equal(await ask.locator('.s03-question-second').textContent(),specialist[2]);
    assert.equal(await page.locator('[data-act="closePerson"]').count(),1);
    const geometry=await ask.evaluate(el=>{
     const rect=el.getBoundingClientRect(),parent=el.closest('.game-dialogue__actions');
     const parentRect=parent.getBoundingClientRect();
     const first=el.querySelector('.s03-question-first').getBoundingClientRect();
     const second=el.querySelector('.s03-question-second').getBoundingClientRect();
     return {x:rect.x,right:rect.right,firstRight:first.right,secondRight:second.right,
      max:Math.max(first.right,second.right),parentRight:parentRect.right,
      hyphens:getComputedStyle(el).hyphens,wordBreak:getComputedStyle(el).wordBreak};
    });
    assert.ok(geometry.x>=-2&&geometry.right<=width+2,'question overflows phone '+width);
    assert.ok(geometry.max<=geometry.right+2,'specialist phrase is clipped '+width+' '+specialist[0]+' '+JSON.stringify(geometry));
    assert.equal(geometry.hyphens,'none');
    await page.screenshot({path:'tests/screenshot-specialist-words-'+specialist[0]+'-'+width+'x'+height+'.png'});
   }
   assert.deepEqual(errors,[],'JS errors '+width);
   console.log('PASS mobile S03/S04 deliberate label breaks '+width+'x'+height);
   await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
