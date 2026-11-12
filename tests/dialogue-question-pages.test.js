'use strict';
/* S03 has exactly one question per specialist: speech → question button → answer → specialist list. */
const {chromium}=require('playwright'), assert=require('node:assert/strict');
const key='ceh404.rebuilt.qa50.20261108';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const [width,height] of [[375,667],[390,600],[390,844],[430,932],[1366,768]]){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:8765/');
  for(const id of ['andrey','marina','irina']){
   await page.evaluate(([key,id])=>{
    const state=window.CEH_LOGIC.initial();
    localStorage.setItem(key,JSON.stringify({...state,scene:'S03',s03Person:id,s03QuestionMode:'speech',name:'Анна'}));
   },[key,id]);
   await page.reload();
   await page.locator('.game-dialogue--scene .game-dialogue__text').waitFor();
   await page.waitForTimeout(80);
   const expected=await page.evaluate(id=>window.CEH_DATA.people.find(p=>p.id===id),id);
   let guard=0;
   while(await page.locator('[data-act="dlgMore"]').count()){
    assert.ok(++guard<20,'speech pagination loop');
    await page.locator('[data-act="dlgMore"]').dispatchEvent('click');
    await page.waitForTimeout(50);
   }
   const question=page.locator('[data-act="s03Ask"]');
   assert.equal(await question.count(),1,'one question button should be offered directly');
   assert.equal((await question.textContent()).trim(),expected.question,'approved question text changed');
   assert.equal(await page.locator('.s03-questions').count(),0,'redundant one-question screen remains');
   const spoken=await page.evaluate(()=>window.CEH_DIALOGUE.getReadState());
   assert.equal(spoken.joined,expected.speech,'specialist speech changed');
   const before=await page.evaluate(()=>window.__CEH_TEST__.getState());
   assert.ok(!before.asked03.includes(id),'question not yet asked');
   await question.dispatchEvent('click');
   await page.locator('.game-dialogue--scene .game-dialogue__text').waitFor();
   await page.waitForTimeout(80);
   const after=await page.evaluate(()=>window.__CEH_TEST__.getState());
   assert.ok(after.asked03.includes(id),'asked marker missing after asking');
   guard=0;
   while(await page.locator('[data-act="dlgMore"]').count()){
     assert.ok(++guard<20,'answer pagination loop');
     await page.locator('[data-act="dlgMore"]').dispatchEvent('click');
     await page.waitForTimeout(50);
   }
   const answered=await page.evaluate(()=>window.CEH_DIALOGUE.getReadState());
   assert.equal(answered.joined,expected.reply,'specialist answer changed');
   assert.equal(await page.locator('[data-act="closePerson"]').count(),1,'answer must return directly to specialists');
   await page.locator('[data-act="closePerson"]').dispatchEvent('click');
   const final=await page.evaluate(()=>window.__CEH_TEST__.getState());
   assert.equal(final.s03Person,null);
   assert.ok(final.asked03.includes(id));
   assert.equal(await page.locator('.s03-chooser').count(),1,'return to three specialists failed');
  }
  assert.deepEqual(errors,[],'Browser errors '+width+'x'+height);
  console.log('PASS S03 choose question then answer '+width+'x'+height);
  await page.close();
 }
 await browser.close();
})().catch(err=>{console.error(err);process.exit(1)});
