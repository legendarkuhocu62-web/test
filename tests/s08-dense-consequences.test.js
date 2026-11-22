'use strict';
// F1–F4 / L6.3: no missing text, no clipped card, fewer empty clicks on both layouts.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const KEY='ceh404.rebuilt.qa50.20261108';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const [width,height,largePortfolio] of [
   [320,568,false],[360,640,false],[375,667,false],
   [390,844,false],[430,932,false],[1024,768,false],[1366,768,false],
   [430,932,true],[1366,768,true]
  ]){
   const page=await browser.newPage({viewport:{width,height}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8765/');
   const ids=await page.evaluate(full=>full?window.CEH_DATA.initiatives.map(x=>x.id):['D','F','J'],largePortfolio);
   await page.evaluate(([k,ids])=>{
    const s=window.CEH_LOGIC.initial();
    localStorage.setItem(k,JSON.stringify({...s,scene:'S08',s08View:'causes',
     s08PageIndex:0,s08ReportOpen:false,name:'Игрок СПО',
     hypothesis:'machine',priority:'losses',committeeDecision:'conditions',eduStep:5,
     initialSelected:['B','J'],finalSelected:ids,
     s0608:{docsOpened:['route','grinding','shipping'],
      firstSubmitted:{answers:['confirmed','confirmed','confirmed','check','confirmed']},
      finalConclusion:{answers:['confirmed','confirmed','check','check','confirmed']},
      s07Decision:'priority'}
    }));
   },[KEY,ids]);
   await page.reload();
   const pageCount=Number((await page.locator('.s08-page').innerText()).split('/')[1]);
   assert.ok(pageCount>=4,'missing consequences pages '+width);
   if(width===1366&&!largePortfolio)assert.ok(pageCount<=9,
    'desktop still has mostly empty pages: '+pageCount);
   if(width===390)assert.ok(pageCount<=8,'mobile has too many pages: '+pageCount);
   const fragments=[];
   for(let i=0;i<pageCount;i++){
    const info=await page.evaluate(()=>{
     const c=document.querySelector('.s08-paged-card');
     const nav=document.querySelector('.s08-chain-nav');
     const footer=document.querySelector('.s08-footer');
     return {text:c.innerText,clipped:c.scrollHeight-c.clientHeight,
      navBottom:nav.getBoundingClientRect().bottom,
      footerBottom:footer.getBoundingClientRect().bottom,
      outerScroll:document.documentElement.scrollHeight-innerHeight,
      horizontal:document.documentElement.scrollWidth-innerWidth};
    });
    assert.ok(info.clipped<=3,'clipped causes page '+(i+1)+'/'+pageCount+' at '+width+'x'+height+' '+JSON.stringify(info).slice(0,550));
    assert.ok(info.outerScroll<=3&&info.horizontal<=3,'page scroll '+width+'x'+height+' page '+(i+1));
    assert.ok(info.navBottom<=height+2&&info.footerBottom<=height+2,
     'nav or report button hidden '+width+'x'+height+' page '+(i+1));
    fragments.push(info.text);
    if(i<pageCount-1)await page.locator('.s08-chain-nav [data-act="s08PageGo"]').nth(1).click();
   }
   const allText=fragments.join('\n');
   const itemData=await page.evaluate(ids=>ids.map(id=>{
    const x=window.CEH_DATA.initiatives.find(x=>x.id===id);
    return {id,title:x.title,conditions:x.conditions,risks:x.risks,not:x.not};
   }),ids);
   for(const item of itemData){
    assert.ok(allText.includes(item.id+' · '+item.title),'missing title '+item.id+' at '+width);
    for(const name of ['conditions','risks','not'])
     assert.ok(allText.includes(item[name]),'missing '+name+' for '+item.id+' at '+width);
   }
   assert.ok(allText.includes('Твой профессиональный вывод'),'professional takeaway missing');
   const last=await page.evaluate(()=>window.__CEH_TEST__.getState());
   assert.equal(last.s08PageIndex,pageCount-1);
   await page.locator('[data-act="s08ReportOpen"]').click();
   await page.locator('[data-act="s08ReportClose"]').click();
   const after=await page.evaluate(()=>window.__CEH_TEST__.getState());
   assert.equal(after.s08PageIndex,pageCount-1,'closing report lost place '+width);
   assert.deepEqual(after.finalSelected,ids,'reading changed investment portfolio');
   assert.deepEqual(errors,[],'JS errors '+width+'x'+height);
   console.log('PASS dense S08 consequences '+width+'x'+height+' pages='+pageCount+' selected='+ids.length);
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
