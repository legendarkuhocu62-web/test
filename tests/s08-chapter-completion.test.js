'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const KEY='ceh404.rebuilt.qa50.20261108';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const [width,height] of [[320,568],[390,844],[430,932],[1024,768],[1366,768]]){
   const page=await browser.newPage({viewport:{width,height}});
   const errors=[];page.on('pageerror',err=>errors.push(err.message));
   await page.goto('http://127.0.0.1:8765/');
   await page.evaluate(key=>{
    const s=window.CEH_LOGIC.initial();
    localStorage.setItem(key,JSON.stringify({...s,
     scene:'S08',s08View:'causes',s08PageIndex:0,s08ReportOpen:false,
     name:'Студент СПО',hypothesis:'machine',priority:'losses',
     initialSelected:['B','J'],finalSelected:['D','F','J'],eduStep:5,
     committeeDecision:'conditions',
     s0608:{docsOpened:['route','grinding','shipping'],
      firstSubmitted:{answers:['confirmed','confirmed','confirmed','check','confirmed']},
      finalConclusion:{answers:['confirmed','confirmed','check','check','confirmed']},
      s07Decision:'priority'}
    }));
   },KEY);
   await page.reload();
   assert.equal(await page.locator('[data-act="s08Complete"]').count(),0,
    'completion must not appear before the last consequences page');
   const label=await page.locator('.s08-page').innerText();
   const total=Number(label.split('/').pop().trim());
   assert.ok(Number.isInteger(total)&&total>1,'consequences pagination missing');
   for(let i=1;i<total;i++){
    await page.locator('.s08-chain-nav [data-act="s08PageGo"]').last().click();
    if(i<total-1)assert.equal(await page.locator('[data-act="s08Complete"]').count(),0,
      'completion offered before last card '+i+'/'+total);
   }
   assert.equal(await page.locator('[data-act="s08Complete"]').count(),1,
    'last causes page must lead to chapter completion');
   const before=await page.evaluate(()=>window.__CEH_TEST__.getState());
   await page.locator('[data-act="s08Complete"]').click();
   const completed=page.locator('.s08-complete');
   assert.equal(await completed.count(),1,'closing screen missing');
   assert.equal(await completed.locator('h1').innerText(),'ГЛАВА 01 ПРОЙДЕНА');
   assert.ok((await completed.innerText()).includes('Первое решение принято. Эффект запущен.'));
   assert.ok((await completed.innerText()).includes('заказом З-214'));
   assert.equal(await completed.locator('.s08-complete__card').count(),2,'future chapter cards');
   assert.equal(await completed.locator('.s08-complete__status').count(),2,'future status labels');
   assert.equal(await completed.locator('.s08-complete__card button, .s08-complete__card a').count(),0,
    'future chapters must not be clickable');
   assert.equal(await completed.locator('[data-act="s08ReturnToSummary"]').count(),1);
   assert.equal(await page.locator('[data-act="reset"]').count(),1,
    'must not duplicate the global restart button');
   assert.equal(await page.locator('[data-act="s08ReportOpen"]').count(),0,
    'teacher report is in S08, not repeated on closing screen');
   const metrics=await page.evaluate(()=>{
    const el=document.querySelector('.s08-complete');
    const r=el.getBoundingClientRect();
    const cards=[...el.querySelectorAll('.s08-complete__card')].map(x=>x.getBoundingClientRect().toJSON());
    return {left:r.left,right:r.right,horizontal:document.documentElement.scrollWidth-innerWidth,cards};
   });
   assert.ok(metrics.left>=-2&&metrics.right<=width+2&&metrics.horizontal<=3,
    'closing screen horizontally clipped '+width+'x'+height+' '+JSON.stringify(metrics));
   if(width>720){
    assert.ok(Math.abs(metrics.cards[0].top-metrics.cards[1].top)<3,
     'desktop future chapters must sit side by side');
   }else{
    assert.ok(metrics.cards[1].top>metrics.cards[0].top+30,
     'mobile future chapters must stack vertically');
   }
   await page.screenshot({path:'tests/screenshot-chapter-complete-'+width+'x'+height+'.png',fullPage:true});
   await page.reload();
   assert.equal(await page.locator('.s08-complete').count(),1,'completion must persist after reload');
   const now=await page.evaluate(()=>window.__CEH_TEST__.getState());
   assert.deepEqual(now.finalSelected,before.finalSelected,'portfolio changed on completion');
   assert.deepEqual(now.s0608,before.s0608,'Z-214 results changed on completion');
   await page.locator('[data-act="s08ReturnToSummary"]').click();
   assert.equal(await page.locator('.s08-screen[data-s08-view="summary"]').count(),1,
    'return must use original S08 summary');
   assert.equal(await page.locator('.s08-summary-card').count(),3,'old results not preserved');
   await page.locator('[data-act="s08ShowCauses"]').click();
   assert.equal(await page.locator('[data-act="s08Complete"]').count(),1,
    'last consequences page remains accessible on return');
   await page.locator('[data-act="s08Complete"]').click();
   const snapshot=await page.evaluate(()=>window.__CEH_TEST__.getState());
   await page.locator('.s08-complete__actions [data-act="reset"]').click();
   const modal=page.locator('.restart-confirm-dialog');
   await modal.waitFor({state:'visible'});
   await modal.locator('[data-restart-cancel]').click();
   assert.deepEqual(await page.evaluate(()=>window.__CEH_TEST__.getState()),snapshot,
    'cancel restart must retain completed game');
   await page.locator('.s08-complete__actions [data-act="reset"]').click();
   await modal.locator('[data-restart-confirm]').click();
   assert.equal((await page.evaluate(()=>window.__CEH_TEST__.getState())).scene,'S00');
   await page.reload();
   assert.equal((await page.evaluate(()=>window.__CEH_TEST__.getState())).scene,'S00',
    'new run must survive reload');
   assert.deepEqual(errors,[],'browser JS errors '+width+'x'+height);
   console.log('PASS Chapter 01 completion '+width+'x'+height+' pages='+total);
   await page.close();
  }
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
