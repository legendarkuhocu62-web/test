/* Regression tests for the three visual defects reported 09.11.2026.
   Run locally with a server on port 8765 and playwright installed. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const base='http://127.0.0.1:8765/';
const key='ceh404.rebuilt.qa50.20261108';
const sizes=[[390,844],[1024,768],[1366,768],[1920,1080]];
for(const [width,height] of sizes){
 const page=await browser.newPage({viewport:{width,height}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.evaluate(k=>localStorage.removeItem(k),key);
 await page.reload();
 if(width>720){
  const image=page.locator('.desktop-start-visual img');
  await image.waitFor();
  const cover=await page.evaluate(()=>{
   const el=document.querySelector('.desktop-start-visual'),img=el.querySelector('img'),b=el.querySelector('.desktop-start-hitbox');
   const r=el.getBoundingClientRect(),h=b.getBoundingClientRect();
   return {w:r.width,h:r.height,fit:getComputedStyle(img).objectFit,
     iw:img.naturalWidth,ih:img.naturalHeight,cx:(h.left+h.right)/2,cy:(h.top+h.bottom)/2,
     scrollWidth:document.documentElement.scrollWidth};
  });
  assert.equal(cover.fit,'cover','desktop cover must not stretch or letterbox the artwork');
  assert.ok(cover.w>=width-3&&cover.h>=height-3,'S00 does not fill available desktop');
  assert.ok(cover.iw>0&&cover.ih>0,'S00 image did not load');
  assert.ok(cover.cx>=0&&cover.cx<=width&&cover.cy>=0&&cover.cy<=height,'Start hitbox invisible at '+width+'x'+height);
  assert.ok(cover.scrollWidth<=width+3,'S00 horizontal scroll at '+width+'x'+height);
  await page.screenshot({path:'tests/screenshot-fix-s00-'+width+'x'+height+'.png'});
  await page.locator('.desktop-start-hitbox').click();
  assert.ok(await page.getByText('Первый день на предприятии').count()>0,'Start button does not work');
 }
 await page.evaluate(k=>localStorage.setItem(k,JSON.stringify({
  scene:'S02',s00:3,name:'Тест',s01:4,s02Step:'report',s02ReportSeen:true,
  reply:null,asked:[],hypothesis:null,hypothesisConfirmed:false,
  s03Person:null,asked03:[],priority:null,s04Mode:'priority',selected:[],showReview:false,finished:false
 })),key);
 await page.reload();
 const report=page.locator('.s02-report-sheet img');
 await report.waitFor();
 const state=await report.evaluate(img=>({src:img.currentSrc||img.src,loaded:img.complete&&img.naturalWidth>0,
  w:img.naturalWidth,h:img.naturalHeight}));
 assert.ok(state.loaded,'S02 report image failed to load');
 assert.ok(state.src.includes('production-report-'+(width<=720?'mobile':'desktop')+'.png'),
   'S02 report is not a PNG at '+width+'x'+height+': '+state.src);
 assert.ok(!state.src.includes('.jpeg'),'S02 still uses JPEG');
 const scene=await page.evaluate(()=>{
  const x=document.querySelector('.s02-report-sheet'),r=x.getBoundingClientRect();
  return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,
   scrollW:document.documentElement.scrollWidth,scrollH:document.documentElement.scrollHeight};
 });
 assert.ok(scene.left>=-3&&scene.right<=width+3&&scene.top>=-3&&scene.bottom<=height+3,
   'S02 report box out of viewport '+JSON.stringify(scene));
 assert.ok(scene.scrollW<=width+3&&scene.scrollH<=height+3,'S02 outer page scroll '+JSON.stringify(scene));
 await page.screenshot({path:'tests/screenshot-fix-s02-'+width+'x'+height+'.png'});
 await page.locator('.s02-report-close').click();
 assert.equal(await page.locator('.s02-report-layer').count(),0,'Report did not close');
 await page.locator('[data-act="s02Open"]').click();
 assert.equal(await page.locator('.s02-report-sheet img').count(),1,'Report did not reopen');
 await page.locator('[data-act="s02Conclude"]').click();
 assert.equal(await page.locator('.s02-answer').count(),3,'S02 conclusions not available');
 await page.locator('.s02-answer').first().click();
 assert.equal(await page.locator('.s02-answer.is-selected').count(),1,'More than one conclusion selected');
 await page.locator('[data-act="confirmHyp"]').click();
 assert.equal(await page.locator('.s02-feedback').count(),1,'Feedback did not open as separate scene');
 assert.deepEqual(errors,[],'JS errors at '+width+'x'+height);
 console.log('PASS visual fixes '+width+'x'+height);
 await page.close();
}
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
