'use strict';
// Local browser test: no blank A–M proposal modal while poster request is slow,
// and S02 preloads the same approved asset it displays.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const KEY='ceh404.rebuilt.qa50.20261108';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const [width,height] of [[390,844],[1366,768]]){
   const page=await browser.newPage({viewport:{width,height}});
   const errors=[];page.on('pageerror',err=>errors.push(err.message));
   await page.goto('http://127.0.0.1:8765/');
   await page.evaluate(key=>{
     const s=window.CEH_LOGIC.initial();
     localStorage.setItem(key,JSON.stringify({...s,scene:'S04',s04Mode:'catalog',name:'QA'}));
   },KEY);
   let unblock;
   const held=new Promise(resolve=>{unblock=resolve;});
   await page.route('**/CH1-VA-C-001.png',async route=>{await held;await route.continue();});
   await page.reload();
   await page.locator('[data-act="catalogOpen"][data-id="C"]').click();
   const modal=page.locator('dialog.ic-detail');
   await modal.waitFor({state:'visible'});
   assert.equal(await modal.locator('.ic-poster img').getAttribute('src'),'assets/investments/CH1-VA-C-001.png',
    'approved poster path was replaced');
   assert.equal(await modal.locator('.ic-poster__loading').isVisible(),true,
    'slow full poster should have readable status instead of empty dialogue');
   assert.equal(await modal.locator('.ic-detail__close').isVisible(),true,
    'poster close button should remain visible while loading');
   assert.equal(await modal.locator('.ic-poster__hit--add').evaluate(btn=>getComputedStyle(btn).pointerEvents),'none',
    'do not allow invisible action before approved poster has loaded');
   await page.screenshot({path:'tests/screenshot-poster-loading-'+width+'x'+height+'.png'});
   unblock();
   await modal.locator('.ic-poster img').evaluate(image=>image.decode());
   await page.waitForFunction(()=>document.querySelector('.ic-detail')?.classList.contains('ic-detail--loading')===false);
   assert.equal(await modal.locator('.ic-poster__loading').isVisible(),false,
    'loading label must disappear once approved original renders');
   assert.equal(await modal.locator('.ic-poster img').evaluate(image=>image.naturalWidth>0),true,
    'poster content missing');
   assert.notEqual(await modal.locator('.ic-poster__hit--add').evaluate(btn=>getComputedStyle(btn).pointerEvents),'none',
    'original investment action should become available after image loads');
   await modal.locator('.ic-detail__close').click();
   await page.evaluate(key=>{
     const s=window.CEH_LOGIC.initial();
     localStorage.setItem(key,JSON.stringify({...s,scene:'S02',s02Step:'intro',name:'QA'}));
   },KEY);
   await page.reload();
   const expected=width<=720?'CH1-S02-production-report-mobile.webp':'CH1-IMG-024_S02_production_report_desktop.png';
   await page.waitForFunction(name=>window.CEH_PRELOAD.stats().started.some(url=>decodeURIComponent(url).includes(name)),
     expected,{timeout:15000});
   await page.locator('[data-act="s02Open"]').click();
   const actual=await page.locator('.s02-report-sheet img').evaluate(el=>decodeURIComponent(el.currentSrc));
   assert.ok(actual.includes(expected),'the prefetched report is NOT the displayed approved report '+actual);
   await page.locator('.s02-report-sheet img').evaluate(el=>el.decode());
   assert.deepEqual(errors,[],'browser JavaScript errors at '+width+'x'+height);
   console.log('PASS poster loading and S02 exact report '+width+'x'+height);
   await page.close();
  }
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
