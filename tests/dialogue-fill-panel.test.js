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
  // Regression for the user screenshot: on a 390px phone the committee
  // introduction must not finish its first screen with "...информацию и".
  if(width===390&&height===844){
   const snapshot=metrics[0];
   assert.doesNotMatch(snapshot.text.trim(),/\bи\s*$/u,
    'first page ends on a dangling conjunction');
   assert.match(snapshot.text,/куда разумнее направить средства\./,
    'first screen should finish at a meaningful sentence boundary');
  }
  // Screenshot regression: S02 feedback after the "insufficient" answer.
  // A split after "Но прежде чем" is not an acceptable reading boundary.
  if(width===390&&height===844){
   await page.evaluate(()=>{
    const s=window.CEH_LOGIC.initial();
    Object.assign(s,{name:'Тест',scene:'S02',s02Step:'feedback',
     hypothesis:'insufficient',hypothesisConfirmed:true});
    localStorage.setItem('ceh404.rebuilt.qa50.20261108',JSON.stringify(s));
   });
   await page.reload();
   await page.locator('.game-dialogue--scene .game-dialogue__panel').waitFor();
   await page.waitForTimeout(140);
   const first=await page.locator('.game-dialogue__text').innerText();
   assert.doesNotMatch(first.trim(),/Но прежде чем$/u,
     'S02 dialogue cuts after a dangling subordinating conjunction');
   assert.match(first,/У тебя есть первый вывод\./u,
     'S02 should keep the short complete sentence on the first page');
   const continues=await page.locator('[data-act="dlgMore"]').count()>0;
   if(continues){
     await page.locator('[data-act="dlgMore"]').click();
     await page.waitForTimeout(60);
     const second=await page.locator('.game-dialogue__text').innerText();
     assert.ok(
       first.includes('Но прежде чем составлять инвестиционный портфель')||
       second.trim().startsWith('Но прежде чем составлять инвестиционный портфель'),
       'S02 subordinate phrase must remain intact');
     assert.match(first.trim(),/[.!?…]$/u,'first page should end with a sentence');
   }else{
     assert.match(first,/Перейдём в переговорную/u,
       'single-page S02 feedback must show its entire approved conclusion');
   }
   const read=await page.evaluate(()=>window.CEH_DIALOGUE.getReadState());
   const expected=await page.evaluate(()=>{
     const d=window.CEH_DATA;
     return d.hypotheses.find(h=>h.id==='insufficient').reply+
       '\n\nУ тебя есть первый вывод. Но прежде чем составлять инвестиционный портфель, давай обсудим ситуацию с коллегами. Перейдём в переговорную — важно выслушать разные точки зрения.';
   });
   assert.equal(read.joined,expected,'S02 source text changed or lost');
  }
  await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
