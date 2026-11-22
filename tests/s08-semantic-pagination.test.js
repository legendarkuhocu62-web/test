'use strict';
// Complete S08 viewports after semantic regrouping: no hidden sentence, clipping or dead controls.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const key='ceh404.rebuilt.qa50.20261108';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const cases=[
   [320,568,['A','J']],
   [375,667,['A','J']],
   [390,844,['D','F','J']],
   [430,932,['A','B','C','D','E','F','G','H','I','J','K','L','M']],
   [1366,768,['D','F','J']]
  ];
  for(const [width,height,selected] of cases){
   const page=await browser.newPage({viewport:{width,height}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8765/');
   await page.evaluate(([key,selected])=>{
    const s=window.CEH_LOGIC.initial();
    localStorage.setItem(key,JSON.stringify({...s,name:'Студент',
     scene:'S08',s08View:'causes',s08PageIndex:0,s08ReportOpen:false,s08ReportPage:0,
     hypothesis:'insufficient',priority:'losses',initialSelected:['B','J'],
     finalSelected:selected,committeeDecision:'conditions',eduStep:5,
     s0608:{docsOpened:['route','grinding','shipping'],
      firstSubmitted:{answers:['confirmed','confirmed','confirmed','check','confirmed']},
      finalConclusion:{answers:['confirmed','confirmed','check','check','confirmed']},
      s07Decision:'priority'}}));
   },[key,selected]);
   await page.reload();
   const n=Number((await page.locator('.s08-page').innerText()).split('/')[1].trim());
   assert.ok(n>=5,'missing causes pages '+width);
   if(width===390)assert.ok(n<=13,'too many largely empty pages on typical phone: '+n);
   for(let i=0;i<n;i++){
    const info=await page.evaluate(()=>{
     const card=document.querySelector('.s08-paged-card'),nav=document.querySelector('.s08-chain-nav');
     return {over:card.scrollHeight-card.clientHeight,
      doc:document.documentElement.scrollHeight-innerHeight,
      wide:document.documentElement.scrollWidth-innerWidth,
      navBottom:nav.getBoundingClientRect().bottom};
    });
    assert.ok(info.over<=3,'causes text clipped '+width+' step '+(i+1)+'/'+n+' '+JSON.stringify(info));
    assert.ok(info.doc<=3&&info.wide<=3,'unwanted page scroll at '+width+' '+JSON.stringify(info));
    assert.ok(info.navBottom<=height+2,'hidden navigation '+width);
    if(i<n-1)await page.locator('.s08-chain-nav [data-act="s08PageGo"]').nth(1).click();
   }
   const snapshot=await page.evaluate(()=>window.__CEH_TEST__.getState());
   assert.equal(snapshot.s08PageIndex,n-1);
   await page.locator('[data-act="s08ReportOpen"]').click();
   const titleCount=new Set(),reportText=[];
   const m=(await page.locator('.s08-report-counter').innerText()).match(/Страница\s+\d+\s+из\s+(\d+)/);
   assert.ok(m,'report pagination missing '+width);
   const num=Number(m[1]);assert.ok(num>=4);
   for(let k=0;k<num;k++){
    const info=await page.evaluate(()=>{
     const card=document.querySelector('.s08-report-page');
     const titles=[...card.querySelectorAll('.s08-report-section h3')].map(x=>x.innerText);
     const p=[...card.querySelectorAll('.s08-report-section p')].map(x=>x.innerText);
     return {over:card.scrollHeight-card.clientHeight,titles,p,
      wide:document.documentElement.scrollWidth-innerWidth,
      doc:document.documentElement.scrollHeight-innerHeight};
    });
    assert.ok(info.over<=3,'report text clipped '+width+' page '+(k+1)+'/'+num+' '+JSON.stringify(info));
    assert.ok(info.wide<=3&&info.doc<=3,'report outside viewport '+width+' page '+k);
    info.titles.forEach(x=>titleCount.add(x));reportText.push(...info.p);
    if(k<num-1)await page.locator('.s08-report-nav [data-act="s08ReportGo"]').nth(1).click();
   }
   assert.equal(titleCount.size,8,'one of the eight report sections disappeared at '+width);
   assert.ok(reportText.join(' ').includes('З-214'),'production context absent '+width);
   await page.locator('[data-act="s08ReportClose"]').click();
   const after=await page.evaluate(()=>window.__CEH_TEST__.getState());
   assert.equal(after.s08PageIndex,n-1,'closing report lost causes position '+width);
   assert.deepEqual(after.finalSelected,selected,'report mutated portfolio');
   assert.deepEqual(errors,[],'browser JS error '+width);
   console.log('PASS S08 semantic pagination '+width+'x'+height+' causes='+n+' report='+num+' initiatives='+selected.length);
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
