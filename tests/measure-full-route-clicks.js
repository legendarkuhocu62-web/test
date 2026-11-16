'use strict';
/* Reproducible S00–S08 successful route on a historic snapshot.
   Counts actual in-game action buttons, separately for dialogue pages,
   transitions and choices. Never edits the production game. */
const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const label=process.env.SNAPSHOT_LABEL||'snapshot';
const sha=process.env.SNAPSHOT_SHA||'unspecified';
const key='ceh404.rebuilt.qa50.20261108';
const navigation=new Set([
 's00next','next','introNext','replyClose','s02Conclude','s03Conclusion',
 'gromovNext','eduContinue','eduGoTask','startEdu','committeeStart',
 'orderStart','orderTask','orderToS07','orderToS08','catalog','finish',
 'review','saveFinal','confirmHyp','s02Open'
]);
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const report={version:label,commit:sha,paths:[],errors:[]};
 try{
  for(const [width,height] of [[375,667],[390,844],[1366,768]]){
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
   await page.evaluate(k=>localStorage.removeItem(k),key);await page.reload();
   await page.waitForFunction(()=>!!window.__CEH_TEST__);
   const counts={read:0,navigation:0,decision:0,actions:0};
   const events=[],reads=[];
   const state=()=>page.evaluate(()=>window.__CEH_TEST__.getState());
   async function click(act,id){
     const selector='[data-act="'+act+'"]'+(id==null?'':'[data-id="'+id+'"]');
     const btn=page.locator(selector).first();
     if(await btn.count()!==1)throw Error('Button missing '+act+' '+(id||'')+' scene='+JSON.stringify(await state()));
     if(await btn.isDisabled())throw Error('Button disabled '+act+' '+(id||''));
     // DOM click matches the delegated handler while avoiding page-scroll
     // differences in a fixed-size headless viewport.
     await btn.evaluate(el=>el.click());
     const type=act==='dlgMore'?'read':navigation.has(act)?'navigation':'decision';
     counts[type]++;counts.actions++;
     events.push({type,act,id:id||null});
     await page.waitForTimeout(55);
   }
   async function readDialogue(id){
     await page.waitForTimeout(120);
     const init=await page.evaluate(()=>window.CEH_DIALOGUE.getReadState());
     assert.ok(init&&init.key,'missing dialogue: '+id);
     const joined=init.joined;let presses=0;
     while(await page.locator('[data-act="dlgMore"]').count()){
       if(++presses>30)throw Error('Pagination loop '+id);
       await click('dlgMore');
     }
     const final=await page.evaluate(()=>window.CEH_DIALOGUE.getReadState());
     assert.equal(final.joined,joined,'dialogue content changed '+id);
     reads.push({id,key:init.key,presses,pages:presses+1});
   }
   function stage(s){return s.scene+ (s.scene==='S04'?'/'+s.s04Mode:'');}
   async function ensureScene(name){
     const s=await state();assert.equal(s.scene,name,'wrong scene '+stage(s));
   }
   // S00 · entry and employee badge.
   await click('s00next');await readDialogue('S00:gate:1');await click('s00next');
   await readDialogue('S00:gate:2');await click('s00next');
   await page.locator('#name').fill('Тест');
   await click('badge');await click('next','S01');await ensureScene('S01');
   // S01 · mentor opening, all three required questions.
   for(let n=0;n<4;n++){await readDialogue('S01:intro:'+n);await click('introNext');}
   for(const id of ['start','problems','offers']){
     await click('ask',id);await readDialogue('S01:reply:'+id);
     await click('replyClose');
   }
   await click('next','S02');await ensureScene('S02');
   // S02 · report and one reasoned conclusion.
   await readDialogue('S02:intro');await click('s02Open');await click('s02Conclude');
   await click('hypothesis','insufficient');await click('confirmHyp');
   await readDialogue('S02:feedback');await click('next','S03');await ensureScene('S03');
   // S03 · all three professional opinions and questions.
   for(const id of ['andrey','marina','irina']){
     await click('person',id);await readDialogue('S03:speech:'+id);
     await click('s03Ask',id);await readDialogue('S03:answer:'+id);
     await click('closePerson',id);
   }
   await click('s03Conclusion');await readDialogue('S03:conclusion');
   await click('next','S04');await ensureScene('S04');
   // S04 · a valid low-cost portfolio and full mandatory EDU-01.
   await click('priority','losses');await click('catalog');
   await click('catalogOpen','C');await click('catalogAdd','C');
   await click('review');await click('finish');
   await click('startEdu');await click('eduGoTask');
   await page.locator('#edu-low').fill('19.95');
   await page.locator('#edu-high').fill('20.05');
   await click('edu1');await click('eduContinue');
   await page.locator('input[name="edu-part"][value="2"]').check();
   await page.locator('#edu-excess').fill('0.03');
   await click('edu2');await click('eduContinue');
   await page.locator('input[name="edu-conclusion"][value="2"]').check();
   await click('edu3');await click('eduContinue');
   for(const id of ['1','2','3','4'])await page.locator('input[name="edu-info"][value="'+id+'"]').check();
   await click('edu4');await click('eduContinue');
   if(label==='v5'){
     for(let n=0;n<3;n++){await readDialogue('S04:gromov:'+n);await click('gromovNext');}
   }else{
     await readDialogue('S04:gromov:combined');await click('gromovNext');
   }
   await click('saveFinal');await click('committeeStart');await ensureScene('S05');
   // S05–S08 · committee, documents, task, operative decision, end.
   await click('committeeChoose','conditions');await click('orderStart');
   await ensureScene('S06');
   for(const id of ['shipping','route','grinding']){
     await click('orderDoc',id);await click('orderCloseDoc');
   }
   await click('orderTask');
   for(const [i,v] of ['confirmed','confirmed','check','check','confirmed'].entries())
     await page.locator('[data-order-answer="'+i+'"][value="'+v+'"]').check();
   await click('orderSubmit');await click('orderToS07');await ensureScene('S07');
   await click('orderChoose','priority');await click('orderToS08');await ensureScene('S08');
   assert.equal(errors.length,0,'browser errors: '+errors.join(', '));
   const totalRead=reads.reduce((n,x)=>n+x.presses,0);
   assert.equal(totalRead,counts.read);
   const entry={viewport:width+'x'+height,route:'S00–S08 / insufficient / losses / initiative C / conditions / priority',
     counts,dialogueCount:reads.length,reads,events};
   report.paths.push(entry);
   console.log('FULL_ROUTE_COUNT '+label+' '+entry.viewport+' '+JSON.stringify({
     ...counts,dialogues:reads.length,finalScene:(await state()).scene}));
   await page.close();
  }
 }catch(e){report.errors.push(String(e&&e.stack||e));throw e;}
 finally{
   await browser.close();
   fs.writeFileSync('full-route-clicks-'+label+'.json',JSON.stringify(report,null,2));
 }
})().catch(e=>{console.error(e);process.exitCode=1});
