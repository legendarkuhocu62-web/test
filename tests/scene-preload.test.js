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
      await page.waitForFunction(expected=>window.CEH_PRELOAD.stats().started.some(url=>decodeURI(url).includes(expected)),expectations[i],{timeout:10000});
      const result=await page.evaluate(()=>({stats:window.CEH_PRELOAD.stats(),state:window.__CEH_TEST__.getState()}));
      assert.ok(result.stats.started.some(x=>decodeURI(x).includes(expectations[i])),'missing future asset '+expectations[i]+' at '+width+'x'+height+' '+JSON.stringify(result.stats));
      assert.ok(result.stats.started.length<=8,'preloaded too many images');
      assert.ok(result.stats.started.every(x=>new URL(x).origin==='http://127.0.0.1:8765'),'external image prefetch forbidden');
      assert.equal(result.state.scene,state.scene,'preloader changed game state');
      assert.ok(result.stats.active<=2,'exceeded concurrent preloads');
   }
 
   // Full-resolution cards begin preloading while their catalog page is
   // visible; no 36 MB burst at the game's first screen.
   for(const [pageIndex,targetId] of [[0,'A'],[1,width<=720?'E':'G']]){
     await page.evaluate(([key,pageIndex])=>{
       const base=window.CEH_LOGIC.initial();
       localStorage.setItem(key,JSON.stringify({...base,scene:'S04',s04Mode:'catalog'}));
     },[KEY,pageIndex]);
     await page.reload({waitUntil:'load'});
     if(pageIndex===1)await page.locator('[data-act="catalogPage"][data-id="next"]').click();
     await page.waitForFunction(id=>window.CEH_PRELOAD.stats().started.some(url=>url.includes('CH1-VA-'+id+'-001.png')),targetId,{timeout:15000});
     const stats=await page.evaluate(()=>window.CEH_PRELOAD.stats());
     assert.ok(stats.started.every(url=>new URL(url).origin==='http://127.0.0.1:8765'),'poster preload must be same-origin');
     assert.ok(stats.active<=2,'poster preload must respect global concurrency');
     const posterIds=stats.started.map(url=>url.match(/CH1-VA-([A-M])-001\.png/)?.[1]).filter(Boolean);
     const allowed=pageIndex===0
       ? (width<=720?'ABCD':'ABCDEF')
       : (width<=720?'ABCDEFGH':'ABCDEFGHIJKL');
     assert.ok(posterIds.every(id=>allowed.includes(id)),
       'preloader started posters outside visited catalogue pages: '+posterIds.join(','));
     assert.ok(posterIds.length <= (width<=720?(pageIndex===0?4:8):(pageIndex===0?6:12)),
       'excess poster preloads: '+posterIds.join(','));
     assert.ok(!stats.started.some(url=>url.includes('CH1-VA-M-001.png')),'do not preload unrelated end-of-catalog images');
   }
   assert.deepEqual(errors,[],'preload JS errors '+width+'x'+height);
   console.log('PASS next-scene preload '+width+'x'+height);
   await page.close();
 }
 await browser.close();
})().catch(err=>{console.error(err);process.exit(1)});
