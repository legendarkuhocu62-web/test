'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const KEY='ceh404.rebuilt.qa50.20261108';
const ID=['BG-D','BG-M','CARD-02','CARD-03','ICON-COMPLETE','DECOR-DOMINO','DECOR-LAUREL'];
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const [width,height] of [[360,640],[390,844],[430,932],[1366,768]]){
   const page=await browser.newPage({viewport:{width,height}});
   const errors=[],bad=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.url().includes('/assets/final/')&&r.status()>=400)bad.push(r.url()+':'+r.status());});
   await page.goto('http://127.0.0.1:8765/');
   const before=await page.evaluate(()=>performance.getEntriesByType('resource').some(r=>r.name.includes('/assets/final/')));
   assert.equal(before,false,'initial screen preloads final-screen art');
   await page.evaluate(key=>{
    const s=window.CEH_LOGIC.initial();
    localStorage.setItem(key,JSON.stringify({...s,scene:'S08',s08View:'complete',
      s08ReportOpen:false,s08PageIndex:0,name:'Студент СПО',
      hypothesis:'machine',priority:'losses',initialSelected:['B'],finalSelected:['D'],
      eduStep:5,committeeDecision:'conditions',
      s0608:{docsOpened:['route','grinding','shipping'],firstSubmitted:{answers:['confirmed','confirmed','confirmed','check','confirmed']},finalConclusion:{answers:['confirmed','confirmed','check','check','confirmed']},s07Decision:'priority'}
    }));
   },KEY);
   await page.reload();
   await page.locator('.s08-complete').waitFor();
   const sources=await page.evaluate(()=>{
     const stage=document.querySelector('.order-stage--complete');
     const cards=[...document.querySelectorAll('.s08-complete__card')];
     const heading=document.querySelector('.s08-complete__chapter');
     return {stage:getComputedStyle(stage).backgroundImage,
      cards:cards.map(c=>getComputedStyle(c).backgroundImage),
      heading:getComputedStyle(heading).backgroundImage,
      overflow:document.documentElement.scrollWidth-innerWidth,
      positions:cards.map(c=>c.getBoundingClientRect().top)};
   });
   const bg=width<=720?'BG-M':'BG-D';
   assert.ok(sources.stage.includes('CH1-FINAL-'+bg+'-001.webp'),'wrong responsive background '+width);
   assert.ok(sources.cards[0].includes('CARD-02-001.webp'),'chapter 02 image missing');
   assert.ok(sources.cards[1].includes('CARD-03-001.webp'),'chapter 03 image missing');
   assert.ok(sources.heading.includes('ICON-COMPLETE-001.webp'),'completion icon missing');
   assert.ok(sources.overflow<=3,'horizontal overflow '+width);
   if(width<=720)assert.ok(sources.positions[1]>sources.positions[0]+30,'mobile chapters not stacked');
   else assert.ok(Math.abs(sources.positions[0]-sources.positions[1])<3,'desktop chapters not side by side');
   const loaded=await page.evaluate(async ids=>Promise.all(ids.map(async part=>{
     const src='assets/final/CH1-FINAL-'+part+'-001.webp';
     const img=new Image();img.src=src;
     try{await img.decode();return {src,ok:img.naturalWidth>0&&img.naturalHeight>0};}
     catch{return {src,ok:false};}
   })),ID);
   assert.ok(loaded.every(x=>x.ok),'broken webp '+JSON.stringify(loaded));
   assert.deepEqual(bad,[],'failed asset responses');
   assert.deepEqual(errors,[],'JS errors');
   console.log('PASS final art '+width+'x'+height+' 7/7 loaded');
   await page.screenshot({path:'tests/screenshot-final-art-'+width+'.png',fullPage:true});
   await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
