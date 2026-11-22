'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const [w,h] of [[320,700],[375,667],[390,844],[430,932]]){
  const page=await browser.newPage({viewport:{width:w,height:h}});
  await page.goto('http://127.0.0.1:8765/');
  for(const [id,parts] of Object.entries({andrey:['Что вы думаете','об оборудовании?'],irina:['Что важно проверить','в потерях?'],marina:['Что важно для','бюджета?']})){
   await page.evaluate(id=>{
    const k='ceh404.rebuilt.qa50.20261108',s=window.CEH_LOGIC.initial();
    localStorage.setItem(k,JSON.stringify({...s,scene:'S03',s03Person:id,s03QuestionMode:'speech',name:'Тест'}));
   },id);
   await page.reload();
   while(await page.locator('[data-act="dlgMore"]').count())await page.locator('[data-act="dlgMore"]').click();
   const q=page.locator('[data-act="s03Ask"]');
   assert.equal((await q.textContent()).trim(),parts.join(' '));
   const g=await page.evaluate(()=>{
    const q=document.querySelector('[data-act="s03Ask"]'),b=document.querySelector('[data-act="closePerson"]');
    const a=q.querySelector('.s03-question-first').getBoundingClientRect(),z=q.querySelector('.s03-question-second').getBoundingClientRect();
    const r=q.getBoundingClientRect(),s=b.getBoundingClientRect();
    return {a:{top:a.top,bottom:a.bottom,left:a.left,right:a.right},z:{top:z.top,left:z.left,right:z.right},r:{left:r.left,right:r.right,bottom:r.bottom},s:{left:s.left,right:s.right,top:s.top},scroll:document.documentElement.scrollWidth};
   });
   assert.ok(g.z.top>=g.a.bottom-1,'not two lines '+id+' '+w);
   assert.ok(g.a.left>=g.r.left-1&&g.a.right<=g.r.right+1,'first line clipped');
   assert.ok(g.z.left>=g.r.left-1&&g.z.right<=g.r.right+1,'second line clipped');
   assert.ok((g.r.right<=g.s.left+1||g.r.bottom<=g.s.top+1)&&g.s.right<=w+2,'button overflow '+id+' '+w+' '+JSON.stringify(g));
   assert.ok(g.scroll<=w+3,'horizontal scroll '+id+' '+w);
  }
  console.log('PASS mobile S03 buttons '+w+'x'+h);
  await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
