/* Comprehensive real-browser audit of every portrait dialogue in chapter 01.
   Source content and panel geometry remain unchanged. */
'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const KEY='ceh404.rebuilt.qa50.20261108';
const cases=[];
for(let n=0;n<4;n++)cases.push({id:'S01 intro '+n,state:{scene:'S01',s01:n}});
for(const id of ['start','problems','offers'])cases.push({id:'S01 reply '+id,state:{scene:'S01',s01:4,reply:id}});
cases.push({id:'S02 intro',state:{scene:'S02',s02Step:'intro'}});
for(const id of ['machine','insufficient','quality'])cases.push({id:'S02 feedback '+id,state:{scene:'S02',s02Step:'feedback',hypothesis:id,hypothesisConfirmed:true}});
for(const id of ['andrey','marina','irina']){
 cases.push({id:'S03 speech '+id,state:{scene:'S03',s03Person:id,s03QuestionMode:'speech'}});
 cases.push({id:'S03 answer '+id,state:{scene:'S03',s03Person:id,s03QuestionMode:'answer'}});
}
cases.push({id:'S03 conclusion',state:{scene:'S03',s03Person:null,s03ConclusionSeen:true,s03Read:['andrey','marina','irina']}});
for(let n=0;n<3;n++)cases.push({id:'S04 Gromov '+n,state:{scene:'S04',s04Mode:'gromov',eduGromovIndex:n}});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 let checked=0,breaks=0;
 try{
  for(const [width,height] of [[320,700],[360,760],[360,800],[375,667],[375,812],[390,600],[390,844],[393,873],[430,932],[1024,768],[1366,768]]){
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
   await page.goto('http://127.0.0.1:8765/');
   for(const item of cases){
    await page.evaluate(([key,changes])=>{
     const s=window.CEH_LOGIC.initial();
     localStorage.setItem(key,JSON.stringify(Object.assign(s,{name:'Тест'},changes)));
    },[KEY,item.state]);
    await page.reload();
    await page.locator('.game-dialogue--scene .game-dialogue__panel').waitFor();
    await page.waitForTimeout(55);
    let source=null,fragments=[],seen=0,prevCount=0,layouts=[];
    while(true){
     const m=await page.evaluate(()=>{
      const panel=document.querySelector('.game-dialogue--scene .game-dialogue__panel');
      const body=panel.querySelector('.game-dialogue__text'),p=body.querySelector('p'),footer=panel.querySelector('.game-dialogue__footer');
      const rect=x=>x.getBoundingClientRect();
      return {read:window.CEH_DIALOGUE.getReadState(),text:p.textContent,
       paragraphBottom:rect(p).bottom,bodyBottom:rect(body).bottom,
       footerBottom:rect(footer).bottom,panelBottom:rect(panel).bottom,
       panelHeight:rect(panel).height,textHeight:rect(body).height,
       paragraphHeight:rect(p).height,
       footerHeight:rect(footer).height,
       lineHeight:parseFloat(getComputedStyle(p).lineHeight),
       continueAvailable:!!panel.querySelector('[data-act="dlgMore"]'),
       primary:!!panel.querySelector('.game-dialogue__actions button')};
     });
     if(source===null)source=m.read.joined;
     assert.equal(m.read.joined,source,'text loss '+item.id);
     assert.ok(m.read.total>=1&&m.read.total<=20,'page overflow '+item.id);
     assert.ok(m.paragraphBottom<=m.bodyBottom+3,'text clipping '+item.id+' '+width+'x'+height);
     assert.ok(m.footerBottom<=m.panelBottom+3,'button clipping '+item.id+' '+width+'x'+height);
     assert.ok(m.primary,'missing final/next button '+item.id);
     assert.equal(m.continueAvailable,m.read.page<m.read.total-1,'next button before text ends '+item.id);
     if(prevCount)assert.equal(m.read.total,prevCount,'unstable pagination '+item.id);
     prevCount=m.read.total;
     fragments.push(m.text.trim());layouts.push(m);
     if(m.continueAvailable){
      const ending=m.text.trim();
      if(/(?:^|\s)(?:и|а|но|или|что|чтобы|если|когда|прежде|чем|перед|в|на|с|со|к|по|из|у|от|до|для|при|без|под|над|между)$/iu.test(ending)){
       breaks++;
       console.log('DIALOGUE_AUDIT_BREAK '+JSON.stringify({viewport:width+'x'+height,id:item.id,ending:ending.slice(-95)}));
      }
      assert.ok(++seen<20,'paging loop '+item.id);
      await page.locator('[data-act="dlgMore"]').click();
      await page.waitForTimeout(40);
     }else break;
    }
    // The final action area can be taller than the Read More footer.
    // That space is RESERVED on all pages to prevent repagination when
    // the player advances. Only flag blank space that could actually
    // hold text while keeping the final buttons inside the fixed panel.
    const tallestFooter=Math.max(...layouts.map(m=>m.footerHeight));
    for(let i=0;i<layouts.length-1;i++){
     const m=layouts[i];
     const reserved=Math.max(0,tallestFooter-m.footerHeight);
     const unused=m.textHeight-reserved-m.paragraphHeight;
     assert.ok(unused<=m.lineHeight*2.1+2,
      'half-empty dialogue '+item.id+' '+width+'x'+height+
      ' usableBlankLines='+(unused/m.lineHeight).toFixed(1)+
      ' shown='+JSON.stringify(m.text.slice(-65)));
    }
    // The user-reported S01 intro line must share its first page with
    // the following sentence at the common tall-mobile viewport.
    if(item.id==='S01 intro 1'&&width===390&&height===844){
     assert.ok(fragments[0].includes('Они отлично знают своё дело'),
      'intro 1 is underfilled: only the first sentence is shown');
    }
    assert.ok(fragments.every(Boolean),'empty page '+item.id);
    checked++;
   }
   console.log('PASS dialogue audit '+width+'x'+height+' scenes='+cases.length);
   await page.close();
  }
  // No source text is mutated, and every viewport/scene is exercised.
  // If a dangling grammatical connector remains, fail with a precise scene log.
  assert.equal(breaks,0,'unnatural dialogue page boundaries detected');
  console.log('PASS comprehensive dialogue audit '+checked+' cases, no dangling connectors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
