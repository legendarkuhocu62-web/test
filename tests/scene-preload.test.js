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
     {scene:'S04',s04Mode:'eduIntro',name:'Анна'},
     {scene:'S05',s05Phase:'committee',name:'Анна'},
     {scene:'S05',s05Phase:'notice3',committeeDecision:'stage',name:'Анна'}
   ];
   const expectations=[
     'Внешняя проходная.webp',
     'irina_focused.webp',
     width<=720?'production-report-mobile.webp':'CH1-IMG-024_S02_production_report_desktop.png',
     width<=720?'S03_meeting_three_characters_mobile.webp':'Переговорная_без_персонажей.jpeg',
     'act-ns-008-26.jpg',
     'Производственный цех.png',
     'Производственный цех.png'
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
 
   // Heavy 2–3 MB posters must NEVER all preload when entering the catalog.
   // Request the one image that receives hover or keyboard focus.
   for(const [pageIndex,targetId] of [[0,'A'],[1,width<=720?'E':'G']]){
     await page.evaluate(key=>{
       const base=window.CEH_LOGIC.initial();
       localStorage.setItem(key,JSON.stringify({...base,scene:'S04',s04Mode:'catalog'}));
     },KEY);
     await page.reload({waitUntil:'load'});
     if(pageIndex===1)await page.locator('[data-act="catalogPage"][data-id="next"]').click();
     await page.waitForTimeout(350);
     const before=await page.evaluate(()=>window.CEH_PRELOAD.stats());
     assert.equal(before.started.filter(x=>x.includes('/assets/investments/CH1-VA-')).length,0,
       'unexpected 2–3 MB poster burst from catalog');
     await page.locator('[data-act="catalogOpen"][data-id="'+targetId+'"]').focus();
     await page.waitForFunction(id=>window.CEH_PRELOAD.stats().started.some(url=>url.includes('CH1-VA-'+id+'-001.png')),
      targetId,{timeout:10000});
     const stats=await page.evaluate(()=>window.CEH_PRELOAD.stats());
     const posters=stats.started.filter(url=>url.includes('/assets/investments/CH1-VA-'));
     assert.equal(posters.length,1,'only intent-targeted full poster may prewarm');
     assert.ok(posters[0].includes('CH1-VA-'+targetId+'-001.png'));
     assert.ok(stats.active<=2,'prefetch concurrency not controlled');
   }
   // Female employee badge is requested during the earlier arrival scenes,
   // before it appears on the official approved badge.
   await page.evaluate(key=>{
     const base=window.CEH_LOGIC.initial();
     localStorage.setItem(key,JSON.stringify({...base,scene:'S00',s00:3,name:'Анна'}));
   },KEY);
   await page.reload({waitUntil:'load'});
   await page.waitForFunction(()=>window.CEH_PRELOAD.stats().started.some(url=>
     url.includes('CH404-CH1-S00-002_employee_badge_female_blurred.png')),{timeout:15000});
   assert.equal((await page.evaluate(()=>window.__CEH_TEST__.getState())).scene,'S00');
   assert.deepEqual(errors,[],'preload JS errors '+width+'x'+height);
   console.log('PASS next-scene preload '+width+'x'+height);
   await page.close();
 }
 await browser.close();
})().catch(err=>{console.error(err);process.exit(1)});
