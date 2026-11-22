'use strict';
/* S08 F4: approved narrative starts at the top, rather than floating in empty vertical space. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const KEY='ceh404.rebuilt.qa50.20261108';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try {
  for(const [width,height] of [[320,568],[375,667],[390,844],[430,932],[1366,768]]){
   const page=await browser.newPage({viewport:{width,height}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8765/');
   await page.evaluate(k=>{
    const s=window.CEH_LOGIC.initial();
    localStorage.setItem(k,JSON.stringify({...s,scene:'S08',s08View:'causes',name:'Тестовый игрок',
     hypothesis:'machine',priority:'losses',initialSelected:['A'],finalSelected:['D','J'],
     committeeDecision:'stage',eduStep:4,s08PageIndex:0,s08ReportOpen:false,
     s0608:{docsOpened:['route','grinding','shipping'],
      firstSubmitted:{answers:['confirmed','confirmed','check','check','confirmed']},
      finalConclusion:{answers:['confirmed','confirmed','check','check','confirmed']},
      s07Decision:'priority'}}));
   },KEY);
   await page.reload();
   const cause=await page.evaluate(()=>{
    const card=document.querySelector('.s08-paged-card');
    const title=card?.querySelector('.s08-page-stage');
    if(!card||!title)return null;
    const a=card.getBoundingClientRect(),b=title.getBoundingClientRect();
    return {justify:getComputedStyle(card).justifyContent,gap:b.top-a.top,
      overflow:card.scrollHeight-card.clientHeight,scroll:document.documentElement.scrollWidth};
   });
   assert.ok(cause,'S08 consequences card missing');
   assert.equal(cause.justify,'flex-start','short consequences text is still centred');
   assert.ok(cause.gap>=0&&cause.gap<=26,'consequences start too far from top '+width+' '+JSON.stringify(cause));
   assert.ok(cause.overflow<=3,'consequences clipped '+width);
   assert.ok(cause.scroll<=width+3,'horizontal overflow in S08 '+width);
   await page.locator('[data-act="s08ReportOpen"]').click();
   const report=await page.evaluate(()=>{
    const card=document.querySelector('.s08-report-page');
    const title=card?.querySelector('.s08-report-counter');
    if(!card||!title)return null;
    const a=card.getBoundingClientRect(),b=title.getBoundingClientRect();
    return {justify:getComputedStyle(card).justifyContent,gap:b.top-a.top,
      overflow:card.scrollHeight-card.clientHeight};
   });
   assert.ok(report,'S08 report missing');
   assert.equal(report.justify,'flex-start','report text is still centred');
   assert.ok(report.gap>=0&&report.gap<=27,'report starts too far from top '+width+' '+JSON.stringify(report));
   assert.ok(report.overflow<=3,'report clipped '+width);
   await page.locator('[data-act="s08ReportClose"]').click();
   assert.equal(await page.locator('.s08-report-overlay').count(),0,'report did not close');
   assert.equal((await page.evaluate(()=>window.__CEH_TEST__.getState())).s08PageIndex,0,'return changed current causes page');
   assert.deepEqual(errors,[],'JS errors at '+width+'x'+height);
   console.log('PASS S08 top-aligned narrative '+width+'x'+height);
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
