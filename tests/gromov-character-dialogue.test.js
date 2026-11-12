'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const key='ceh404.rebuilt.qa50.20261108';
const lines=[
 'Видишь, по этому акту одну деталь изолировали, а партию задержали до дополнительной проверки. Подобные случаи у нас бывают: после окончательного контроля часть деталей возвращается на доработку. Это время, которое производство теряет.',
 'Где именно возникают отклонения, мы пока не установили.',
 'Я по-прежнему считаю, что нам нужно обновлять оборудование. Но прежде чем защищать инвестиционные предложения, стоит учесть и эти потери.'
];
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const [width,height] of [[360,640],[375,667],[390,844],[430,932],[1366,768]]){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/');
  await page.evaluate(k=>{
    const state=window.CEH_LOGIC.initial();
    localStorage.setItem(k,JSON.stringify({...state,scene:'S04',s04Mode:'gromov',eduGromovIndex:0,selected:['C'],name:'Тест'}));
  },key);
  await page.reload();
  for(let i=0;i<3;i++){
   await page.locator('.game-dialogue--scene .game-dialogue__text').waitFor();
   await page.waitForTimeout(80);
   assert.equal(await page.locator('.document--gromov').count(),0,'Gromov cannot appear as document card');
   assert.equal(await page.locator('.game-dialogue__speaker').count()>0,true,'speaker label missing');
   assert.match(await page.locator('.game-dialogue').innerText(),/Андрей Громов/);
   assert.equal(await page.locator('.dialogue-stage--meeting').count(),1,'character scene not used');
   const portrait=await page.locator('img').evaluateAll(nodes=>nodes.filter(n=>n.src.includes('Персонаж Андрей Громов')).map(n=>n.getBoundingClientRect().width));
   assert.ok(portrait.some(w=>w>80),'Andrey portrait should be visible on character scene');
   let count=0;
   while(await page.locator('[data-act="dlgMore"]').count()){
     assert.ok(++count<30,'Gromov pagination loop');
     await page.locator('[data-act="dlgMore"]').dispatchEvent('click');await page.waitForTimeout(55);
   }
   const read=await page.evaluate(()=>window.CEH_DIALOGUE.getReadState());
   assert.equal(read.joined,lines[i],'approved Gromov text must remain unchanged');
   assert.equal(await page.locator('[data-act="gromovNext"]').count(),1,'next dialogue action missing');
   await page.locator('[data-act="gromovNext"]').dispatchEvent('click');
  }
  const result=await page.evaluate(()=>window.__CEH_TEST__.getState());
  assert.equal(result.s04Mode,'reviewFinal','Gromov should lead to portfolio review');
  assert.deepEqual(result.selected,['C'],'investment selection changed');
  assert.deepEqual(errors,[],'browser errors');
  console.log('PASS Gromov character dialogue '+width+'x'+height);
  await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
