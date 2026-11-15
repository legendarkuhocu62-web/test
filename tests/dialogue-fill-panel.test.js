'use strict';
/* Regression: available dialogue text area must be used before showing Next. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const [width,height] of [[390,844],[375,667],[430,932],[1366,768]]){
  const page=await browser.newPage({viewport:{width,height}});
  await page.goto('http://127.0.0.1:8765/');
  await page.evaluate(()=>{
   const s=window.CEH_LOGIC.initial();s.name='Тест';s.scene='S01';s.s01=3;
   localStorage.setItem('ceh404.rebuilt.qa50.20261108',JSON.stringify(s));
  });
  await page.reload();
  await page.locator('.game-dialogue--scene .game-dialogue__panel').waitFor();
  await page.waitForTimeout(140);
  let metrics=[],guard=0;
  while(true){
   const m=await page.evaluate(()=>{
    const panel=document.querySelector('.game-dialogue__panel');
    const body=panel.querySelector('.game-dialogue__text');
    const p=body.querySelector('p');
    const footer=panel.querySelector('.game-dialogue__footer');
    const header=panel.querySelector('.game-dialogue__speaker');
    const rect=x=>x.getBoundingClientRect();
    return {read:window.CEH_DIALOGUE.getReadState(),
     text:p.textContent, panelH:rect(panel).height,textBoxH:rect(body).height,pH:rect(p).height,
     headerH:rect(header).height,footerH:rect(footer).height,
     footerTop:rect(footer).top,paragraphBottom:rect(p).bottom,footerMargin:getComputedStyle(footer).marginTop,
     styleMax:getComputedStyle(panel).maxHeight,
     paragraphWidth:rect(p).width,
     lineHeight:parseFloat(getComputedStyle(p).lineHeight),
     freePx:Math.round(rect(footer).top-rect(p).bottom)
    };
   });
   metrics.push(m);
   if(!await page.locator('[data-act="dlgMore"]').count())break;
   assert.ok(++guard<15,'dialogue loop');
   await page.locator('[data-act="dlgMore"]').click();
   await page.waitForTimeout(70);
  }
  console.log('DIALOGUE_FILL_METRICS '+width+'x'+height+' '+JSON.stringify(metrics));
  assert.ok(metrics.every(m=>m.read.joined===metrics[0].read.joined),'text lost during paging');
  assert.ok(metrics.every(m=>m.pH<=m.textBoxH+2),'text clipped');
  assert.ok(metrics.length<=2,'intro 3 must use available frame height: '+width+'x'+height+' pages='+metrics.length);
  for(let i=0;i<metrics.length-1;i++){
   const m=metrics[i];
   assert.ok(m.textBoxH-m.pH<=m.lineHeight+10,
    'non-final dialogue page wastes more than a line: '+width+'x'+height+' '+JSON.stringify(m));
  }
  await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
