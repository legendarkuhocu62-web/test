'use strict';
// F6: layout chosen from real rendered heights; desktop untouched and no summary content lost.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const KEY='ceh404.rebuilt.qa50.20261108';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const [width,height,longName,fullPortfolio] of [
   [320,568,false,false],[360,640,false,false],[375,667,false,false],
   [390,844,false,false],[430,932,false,false],[390,844,true,true],
   [320,568,true,true],[1366,768,false,false]
  ]){
   const page=await browser.newPage({viewport:{width,height}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8765/');
   await page.evaluate(([key,longName,fullPortfolio])=>{
    const s=window.CEH_LOGIC.initial();
    localStorage.setItem(key,JSON.stringify({...s,
     scene:'S08',s08View:'summary',s08SummaryPage:0,
     name:longName?'Виктория Александровна '+('ДлинноеИмя ').repeat(14):'Студент',
     hypothesis:'machine',priority:'losses',committeeDecision:'conditions',
     initialSelected:['B','J'],finalSelected:fullPortfolio?window.CEH_DATA.initiatives.map(x=>x.id):['D','F','J'],eduStep:5,
     s0608:{docsOpened:['route','grinding','shipping'],
      firstSubmitted:{answers:['confirmed','confirmed','confirmed','check','confirmed']},
      finalConclusion:{answers:['confirmed','confirmed','check','check','confirmed']},
      s07Decision:'priority'}
    }));
   },[KEY,longName,fullPortfolio]);
   await page.reload();
   if(width<=720)await page.waitForFunction(()=>['all','pair','single'].includes(document.querySelector('.s08-screen')?.dataset.s08SummaryLayout));
   const mode=width<=720?await page.locator('.s08-screen').getAttribute('data-s08-summary-layout'):'desktop';
   if(width===390&&!longName)assert.equal(mode,'all','normal 390px phone should show all three compact cards');
   if(width===1366){
    assert.equal(await page.locator('.s08-summary-card:visible').count(),3,'desktop three-card composition changed');
    assert.equal(await page.locator('.s08-summary-nav:visible').count(),0,'desktop navigation unexpectedly appeared');
   }
   const original=await page.locator('.s08-summary-card').allTextContents();
   assert.equal(original.length,3,'summary must retain three learning insights');
   const visited=new Set();
   for(let turn=0;turn<3;turn++){
    const info=await page.evaluate(()=>{
     const screen=document.querySelector('.s08-screen'),grid=screen.querySelector('.s08-summary-grid');
     const visible=[...grid.querySelectorAll('.s08-summary-card')].map((c,i)=>({c,i})).filter(x=>getComputedStyle(x.c).display!=='none');
     return {layout:screen.dataset.s08SummaryLayout||'desktop',visible:visible.map(x=>x.i),
      over:grid.scrollHeight-grid.clientHeight,
      clipped:visible.map(x=>x.c.scrollHeight-x.c.clientHeight),
      bodyOverflow:document.documentElement.scrollHeight-window.innerHeight,
      horizontal:document.documentElement.scrollWidth-window.innerWidth,
      footerBottom:screen.querySelector('.s08-footer').getBoundingClientRect().bottom,
      nextDisabled:screen.querySelector('.s08-summary-nav [data-act="s08SummaryGo"]:last-child')?.disabled
     };
    });
    info.visible.forEach(n=>visited.add(n));
    assert.ok(info.over<=3,'summary grid overflows '+width+' '+mode+' '+JSON.stringify(info));
    assert.ok(info.clipped.every(n=>n<=3),'summary card text clipped '+width+' '+mode+' '+JSON.stringify(info));
    assert.ok(info.bodyOverflow<=3&&info.horizontal<=3,'external scroll '+width+' '+JSON.stringify(info));
    assert.ok(info.footerBottom<=height+2,'consequences button out of screen '+width+' '+JSON.stringify(info));
    if(mode==='all'||mode==='desktop')break;
    if(info.nextDisabled)break;
    await page.locator('.s08-summary-nav [data-act="s08SummaryGo"]').last().click();
    await page.waitForFunction(()=>['all','pair','single'].includes(document.querySelector('.s08-screen')?.dataset.s08SummaryLayout));
   }
   assert.deepEqual([...visited].sort((a,b)=>a-b),[0,1,2],
    'all three summary conclusions must remain reachable '+width+' '+mode);
   const s=await page.evaluate(()=>window.__CEH_TEST__.getState());
   assert.equal(s.scene,'S08');assert.equal(s.s08View,'summary');
   assert.equal(s.finalSelected.length,fullPortfolio?13:3,'portfolio changed while reading');
   await page.reload();
   if(width<=720)await page.waitForFunction(()=>['all','pair','single'].includes(document.querySelector('.s08-screen')?.dataset.s08SummaryLayout));
   await page.locator('[data-act="s08ShowCauses"]').click();
   assert.equal(await page.locator('[data-s08-view="causes"]').count(),1,'consequences action broken');
   assert.deepEqual(errors,[],'JS errors '+width+'x'+height);
   console.log('PASS S08 compact summary '+width+'x'+height+' layout='+mode+' longName='+longName+' fullPortfolio='+fullPortfolio);
   await page.close();
  }
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exit(1)});
