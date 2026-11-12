'use strict';
/* Browser regression: prefetch only upcoming local assets, do not alter game state. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const KEY='ceh404.rebuilt.qa50.20261108';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const [width,height] of [[390,844],[1366,768]]){
   const page=await browser.newPage({viewport:{width,height}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8765/',{waitUntil:'load'});
   assert.equal(await page.evaluate(()=>typeof window.CEH_PRELOAD?.afterRender),'function');
   const scenarios=[
     {scene:'S00',s00:1,name:'Анна'},
     {scene:'S01',s01:0,name:'Анна'},
     {scene:'S02',s02Step:'intro',name:'Анна'},
     {scene:'S03',name:'Анна',s03Person:null,asked03:[]},
     {scene:'S04',s04Mode:'eduIntro',name:'Анна'}
   ];
   const expectations=[
     'Внешняя проходная.webp',
     'irina_focused.webp',
     'production-report-'+(width<=720?'mobile':'desktop')+'.webp',
     width<=720?'S03_meeting_three_characters_mobile.webp':'Переговорная_без_персонажей.jpeg',
     'act-ns-008-26.jpg'
   ];
   for(let i=0;i<scenarios.length;i++){
      const state=scenarios[i];
      await page.evaluate(([key,state])=>{
        const base=window.CEH_LOGIC.initial();
        localStorage.setItem(key,JSON.stringify({...base,...state}));
      },[KEY,state]);
      await page.reload({waitUntil:'load'});
      await page.waitForFunction(()=>window.CEH_PRELOAD.stats().started.length>0,{timeout:6000});
      const result=await page.evaluate(()=>({stats:window.CEH_PRELOAD.stats(),state:window.__CEH_TEST__.getState()}));
      assert.ok(result.stats.started.some(x=>decodeURI(x).includes(expectations[i])),'missing future asset '+expectations[i]+' at '+width+'x'+height+' '+JSON.stringify(result.stats));
      assert.ok(result.stats.started.length<=8,'preloaded too many images');
      assert.ok(result.stats.started.every(x=>new URL(x).origin===location.origin),'external image prefetch forbidden');
      assert.equal(result.state.scene,state.scene,'preloader changed game state');
      assert.ok(result.stats.active<=2,'exceeded concurrent preloads');
   }
   assert.deepEqual(errors,[],'preload JS errors '+width+'x'+height);
   console.log('PASS next-scene preload '+width+'x'+height);
   await page.close();
 }
 await browser.close();
})().catch(err=>{console.error(err);process.exit(1)});
