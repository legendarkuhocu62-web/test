'use strict';
// Mobile restart footer must be reachable and clear of Safari bottom UI on each screen.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const KEY='ceh404.rebuilt.qa50.20261108';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const [width,height] of [[320,568],[360,640],[375,667],[390,844],[430,932],[1366,768]]){
   const page=await browser.newPage({viewport:{width,height}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8765/');
   for(const scene of ['S04','S07','S08']){
    await page.evaluate(([key,scene])=>{
     const state=window.CEH_LOGIC.initial();
     localStorage.setItem(key,JSON.stringify({...state,scene,name:'Тест',
      s04Mode:'priority',priority:'losses',selected:['C'],
      finalSelected:['C'],initialSelected:['A'],
      s0608:{docsOpened:['route','grinding','shipping'],
       finalConclusion:{answers:['confirmed','confirmed','check','check','confirmed']},
       firstSubmitted:{answers:['confirmed','confirmed','check','check','confirmed']},
       s07Decision:'extra'}
     }));
    },[KEY,scene]);
    await page.reload();
    const btn=page.locator('#app>.reset [data-act="reset"]');
    assert.equal(await btn.count(),1,'restart action missing '+scene);
    if(scene!=='S08')await btn.scrollIntoViewIfNeeded();
    const g=await page.evaluate(()=>{
     const reset=document.querySelector('#app>.reset'),b=reset.querySelector('[data-act="reset"]'),
      scene=document.querySelector('.stage-scene'),r=reset.getBoundingClientRect(),x=b.getBoundingClientRect(),
      s=scene.getBoundingClientRect();
     return {button:{left:x.left,right:x.right,top:x.top,bottom:x.bottom,height:x.height},
      reset:{top:r.top,bottom:r.bottom},stage:{bottom:s.bottom},
      scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,
      viewport:innerHeight,footBottom:parseFloat(getComputedStyle(reset).paddingBottom)};
    });
    assert.ok(g.button.height>=44,'restart tap target too small '+scene+' '+width+' '+JSON.stringify(g));
    assert.ok(g.button.left>=-2&&g.button.right<=width+2,
      'restart outside horizontal bounds '+scene+' '+width+' '+JSON.stringify(g));
    assert.ok(g.button.bottom<=height-8,
      'restart too close to browser bottom edge '+scene+' '+width+'x'+height+' '+JSON.stringify(g));
    assert.ok(g.reset.top>=g.stage.bottom-2,
      'restart overlaps scene content '+scene+' '+width+' '+JSON.stringify(g));
    assert.ok(g.scrollWidth<=width+3,'horizontal scroll '+scene+' '+width);
    if(scene==='S08'){
     assert.ok(g.scrollHeight<=height+3,'final screen must stay in viewport '+width+' '+JSON.stringify(g));
     assert.ok(g.footBottom>=10,'final safe padding too small '+width);
    }
    await btn.click();
    const dialog=page.locator('.restart-confirm-dialog');
    await dialog.waitFor({state:'visible'});
    await dialog.locator('[data-restart-cancel]').click();
    const state=await page.evaluate(()=>window.__CEH_TEST__.getState());
    assert.equal(state.scene,scene,'cancelling restart must preserve scene');
   }
   assert.deepEqual(errors,[],'JS errors on '+width+'x'+height);
   console.log('PASS mobile restart safe footer '+width+'x'+height);
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
