'use strict';
// Regression: mobile S04 confirmation buttons use deliberate line breaks, unchanged text and actions.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const KEY='ceh404.rebuilt.qa50.20261108';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const [width,height] of [[320,568],[320,700],[360,640],[375,667],[390,844],[430,932],[768,1024],[1366,768]]){
   const page=await browser.newPage({viewport:{width,height}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8765/');
   await page.evaluate(k=>{
    const s=window.CEH_LOGIC.initial();
    localStorage.setItem(k,JSON.stringify({...s,name:'Проверка',scene:'S04',s04Mode:'catalog',priority:'losses',selected:['C'],showReview:false}));
   },KEY);
   await page.reload();
   await page.locator('[data-act="review"]').click();
   const result=await page.evaluate(()=>{
    const panel=document.querySelector('.document--catalog .portfolio-review-actions');
    const buttons=['catalog','finish'].map(action=>{
     const node=panel.querySelector('[data-act="'+action+'"]');
     const spans=[...node.querySelectorAll('.s04-review-cta-line')];
     const rect=x=>{const r=x.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
     return {action,text:node.textContent.trim(),button:rect(node),parts:spans.map(x=>({text:x.textContent,rect:rect(x)}))};
    });
    return {buttons,scrollWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,viewportHeight:innerHeight,
     selected:window.__CEH_TEST__.getState().selected};
   });
   assert.deepEqual(result.buttons.map(b=>b.text),['Вернуться к редактору','Сохранить и продолжить'],'approved labels changed');
   assert.deepEqual(result.buttons.map(b=>b.parts.map(p=>p.text)),[['Вернуться к','редактору'],['Сохранить и','продолжить']]);
   assert.ok(result.scrollWidth<=width+3,'horizontal overflow '+width+'x'+height+' '+JSON.stringify(result));
   for(const button of result.buttons){
    const {left,right,top,bottom,height:buttonH}=button.button;
    assert.ok(left>=-2&&right<=width+2&&top>=-2&&bottom<=height+2,
      'S04 confirmation action not visible '+button.action+' '+width+'x'+height+' '+JSON.stringify(result));
    assert.ok(buttonH>=44,'touch target too short '+button.action);
    if(width<=720){
     const [first,second]=button.parts;
     assert.ok(second.rect.top>=first.rect.bottom-1,'S04 label is not 2 lines '+width+' '+button.action);
     assert.ok(first.rect.left>=left-2&&first.rect.right<=right+2&&second.rect.left>=left-2&&second.rect.right<=right+2,
      'S04 label clipped '+width+' '+button.action+' '+JSON.stringify(button));
    }
   }
   await page.locator('.portfolio-review-actions [data-act="catalog"]').click();
   const returned=await page.evaluate(()=>window.__CEH_TEST__.getState());
   assert.equal(returned.s04Mode,'catalog','return should keep catalog open');
   assert.equal(returned.showReview,false,'return should close confirmation');
   assert.equal(returned.priority,'losses');
   assert.deepEqual(returned.selected,['C'],'portfolio changed after return');
   await page.locator('[data-act="review"]').click();
   await page.locator('.portfolio-review-actions [data-act="finish"]').click();
   const saved=await page.evaluate(()=>window.__CEH_TEST__.getState());
   assert.equal(saved.s04Mode,'edu','save did not open approved EDU-01 scene');
   assert.deepEqual(saved.initialSelected,['C'],'initial portfolio not preserved');
   assert.deepEqual(errors,[],'browser errors '+width+'x'+height);
   console.log('PASS S04 confirmation CTA breaks '+width+'x'+height);
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
