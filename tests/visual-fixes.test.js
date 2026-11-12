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
  assert.equal(cover.fit,'contain','desktop start must preserve the full approved 16:9 artwork');
  assert.ok(cover.w>=width-3&&cover.h>=height-3,'S00 does not fill available desktop');
  assert.ok(cover.iw>0&&cover.ih>0,'S00 image did not load');
  const foreground=await page.evaluate(()=>{
    const img=document.querySelector('.desktop-start-visual img');
    const b=img.getBoundingClientRect(),ratio=img.naturalWidth/img.naturalHeight;
    const w=Math.min(b.width,b.height*ratio),h=w/ratio;
    return {left:b.left+(b.width-w)/2,right:b.left+(b.width+w)/2,top:b.top+(b.height-h)/2,bottom:b.top+(b.height+h)/2};
  });
  assert.ok(foreground.left>=-3&&foreground.top>=-3&&foreground.right<=width+3&&foreground.bottom<=height+3,
    'S00 approved artwork was cropped');
  assert.ok(cover.cx>=0&&cover.cx<=width&&cover.cy>=0&&cover.cy<=height,'Start hitbox invisible at '+width+'x'+height);
  assert.ok(cover.scrollWidth<=width+3,'S00 horizontal scroll at '+width+'x'+height);
  await page.screenshot({path:'tests/screenshot-fix-s00-'+width+'x'+height+'.png'});
  // Click the visible painted Start area, not the centre of an invisible hitbox.
  const visualBox=await page.locator('.desktop-start-visual').boundingBox();
  await page.mouse.click(visualBox.x+visualBox.width*0.79,visualBox.y+visualBox.height*0.84);
  assert.ok(await page.getByText('Первый день на предприятии').count()>0,'Start button does not work from the visible painted area');
  assert.equal(await page.evaluate(()=>window.__CEH_TEST__.getState().s00),1,'S00 did not advance after real mouse click');
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
 assert.ok(state.src.includes('production-report-'+(width<=720?'mobile':'desktop')+'.webp'),
   'S02 report is not a lossless WebP at '+width+'x'+height+': '+state.src);
 assert.ok(state.src.includes('/assets/optimized/objects/'),'S02 report must use the lossless local copy');
 const scene=await page.evaluate(()=>{
  const x=document.querySelector('.s02-report-sheet'),r=x.getBoundingClientRect();
  return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,
   scrollW:document.documentElement.scrollWidth,scrollH:document.documentElement.scrollHeight};
 });
 assert.ok(scene.left>=-3&&scene.right<=width+3&&scene.top>=-3&&scene.bottom<=height+3,
   'S02 report box out of viewport '+JSON.stringify(scene));
 assert.ok(scene.scrollW<=width+3&&scene.scrollH<=height+3,'S02 outer page scroll '+JSON.stringify(scene));
 await page.screenshot({path:'tests/screenshot-fix-s02-'+width+'x'+height+'.png'});
 assert.equal(await page.locator('.ceh-materials-trigger').count(),0,
  'S02 document must not have materials shortcut covering report close button');
 await page.locator('.s02-report-close').click();
 assert.equal(await page.locator('.s02-report-layer').count(),0,'Report did not close');
 assert.equal(await page.locator('.ceh-materials-trigger').count(),1,
  'Materials shortcut must return immediately after closing report');
 await page.locator('[data-act="s02Open"]').click();
 assert.equal(await page.locator('.ceh-materials-trigger').count(),0,
  'Materials shortcut must be hidden when report is reopened');
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
