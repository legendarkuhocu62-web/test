'use strict';
// Screenshot-specific mobile regression: S01 "серьёзные" not hyphenated;
// S04 quality label is two full-width lines, not two side-by-side columns.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const KEY='ceh404.rebuilt.qa50.20261108';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const [width,height] of [[320,568],[360,640],[390,844],[430,932]]){
   const page=await browser.newPage({viewport:{width,height}});
   const errors=[];page.on('pageerror',err=>errors.push(err.message));
   await page.goto('http://127.0.0.1:8765/');
   await page.evaluate(key=>{
     const s=window.CEH_LOGIC.initial();
     localStorage.setItem(key,JSON.stringify({...s,scene:'S01',s01:4,name:'Анна',asked:['start']}));
   },KEY);
   await page.reload();
   const problems=page.locator('.s01-questions [data-act="ask"][data-id="problems"]');
   assert.equal(await problems.count(),1,'S01 problem question missing');
   const question=await problems.evaluate(el=>{
     const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
     return {text:el.textContent,hyphens:cs.hyphens,webkit:cs.webkitHyphens,wordBreak:cs.wordBreak,
       overflowWrap:cs.overflowWrap,rect:{left:r.left,right:r.right},
       scrollX:document.documentElement.scrollWidth-innerWidth};
   });
   assert.equal(question.hyphens,'none','S01 question must never hyphenate serious words '+width);
   assert.equal(question.wordBreak,'normal');
   assert.equal(question.overflowWrap,'normal');
   assert.ok(question.rect.left>=-2&&question.rect.right<=width+2&&question.scrollX<=3);
   assert.ok(question.text.includes('Какие проблемы сейчас самые серьёзные?'));
   await page.screenshot({path:'tests/screenshot-s01-questions-wrap-'+width+'x'+height+'.png'});
   await page.evaluate(key=>{
     const s=window.CEH_LOGIC.initial();
     localStorage.setItem(key,JSON.stringify({...s,scene:'S04',s04Mode:'priority',name:'Анна'}));
   },KEY);
   await page.reload();
   const quality=page.locator('[data-act="priority"][data-id="quality"]');
   const layout=await quality.evaluate(el=>{
     const parts=[...el.childNodes].filter(x=>x.nodeType===Node.TEXT_NODE&&x.textContent.trim());
     const bounds=parts.map(node=>{const rg=document.createRange();rg.selectNodeContents(node);const rect=rg.getBoundingClientRect();
       return {x:rect.x,right:rect.right,y:rect.y,bottom:rect.bottom,width:rect.width,height:rect.height,text:node.textContent.trim()};});
     const r=el.getBoundingClientRect();
     return {display:getComputedStyle(el).display,bounds,button:{left:r.left,right:r.right},
       wrap:getComputedStyle(el).overflowWrap,hyphens:getComputedStyle(el).hyphens,
       scrollX:document.documentElement.scrollWidth-innerWidth};
   });
   assert.equal(layout.display,'block','S04 label must be block text, not anonymous flex columns '+width);
   assert.equal(layout.hyphens,'none');
   assert.equal(layout.bounds.length,2,'expected two exact phrase fragments '+JSON.stringify(layout));
   assert.ok(layout.bounds[1].y>=layout.bounds[0].bottom-2,
     'S04 approved phrase fragments are in columns instead of lines '+width+' '+JSON.stringify(layout));
   assert.ok(layout.bounds.every(x=>x.x>=layout.button.left-2&&x.right<=layout.button.right+2),
     'S04 label escapes approved button '+width);
   assert.ok(layout.scrollX<=3);
   await page.screenshot({path:'tests/screenshot-s04-quality-wrap-'+width+'x'+height+'.png'});
   await quality.click();
   assert.equal((await page.evaluate(()=>window.__CEH_TEST__.getState())).priority,'quality');
   assert.deepEqual(errors,[],'JS errors '+width);
   console.log('PASS exact S01/S04 iPhone screenshots '+width+'x'+height);
   await page.close();
  }
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
