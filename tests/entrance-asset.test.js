/* CH1-IMG-002 regression. Run with local server on port 8765 and Playwright installed. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const sizes=[[375,667],[390,600],[390,844],[430,932],[1024,768],[1366,768],[1920,1080]];
const expectedName='CH1-IMG-002_Входная зона и турникеты.png';
const storageKey='ceh404.rebuilt.qa50.20261108';
for(const [width,height] of sizes){
 const page=await browser.newPage({viewport:{width,height}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'load'});
 await page.evaluate(key=>localStorage.setItem(key,JSON.stringify({
  scene:'S00',s00:2,name:'',s01:0,questionMode:false,reply:null,asked:[],
  hypothesis:null,hypothesisConfirmed:false,s03Person:null,asked03:[],priority:null,
  s04Mode:'priority',selected:[],showReview:false,finished:false
 })),storageKey);
 await page.reload({waitUntil:'load'});
 // S00 has two short gate screens; step 2 is the second gate message.
 await page.locator('.gate-scene').waitFor();
 await page.locator('[data-act="s00next"]').click();
 await page.locator('.entrance-scene').waitFor();
 const image=await page.evaluate(async()=>{
  const scene=document.querySelector('.entrance-scene'),glass=scene.querySelector('.glass');
  const style=getComputedStyle(scene),bg=style.getPropertyValue('--bg').trim();
  const match=/url\(["']?(.+?)["']?\)/.exec(bg);
  if(!match)throw Error('missing image URL in scene variable: '+bg);
  const pic=new Image();pic.src=match[1];
  await pic.decode();
  const sc=scene.getBoundingClientRect(),gr=glass.getBoundingClientRect();
  return {src:pic.src,complete:pic.complete,width:pic.naturalWidth,height:pic.naturalHeight,
   sizes:style.backgroundSize,position:style.backgroundPosition,
   sceneTop:sc.top,glassTop:gr.top,glassLeft:gr.left,glassRight:gr.right,glassWidth:gr.width,viewportWidth:innerWidth};
 });
 assert.ok(decodeURI(image.src).includes(expectedName),'wrong scene asset: '+image.src);
 assert.ok(image.complete&&image.width===1671&&image.height===941,'wrong dimensions or image failed to load '+JSON.stringify(image));
 // The current single-viewport layout places the form over a part of the
 // background, unlike the retired below-image layout. Preserve its usability.
 assert.ok(image.glassLeft>=-3&&image.glassRight<=width+3,
  'pass panel overflows horizontally: '+JSON.stringify(image));
 if(width>720){
  assert.ok(image.glassWidth<=Math.min(520,width*.6)+3,
   'desktop pass panel is too wide: '+JSON.stringify(image));
 }
 if(width<=720){
  assert.match(image.sizes,/100% 100%,\s*cover$/,
   'mobile background must fill viewport without dark bands '+JSON.stringify(image));
  const aligned=await page.evaluate(()=>{const s=document.querySelector('.entrance-scene').getBoundingClientRect(),g=document.querySelector('.entrance-scene .glass').getBoundingClientRect();return {sceneTop:s.top,sceneBottom:s.bottom,glassTop:g.top,glassBottom:g.bottom,centerDiff:Math.abs((s.top+s.bottom-g.top-g.bottom)/2),glassHeight:g.height,screenHeight:innerHeight,docWidth:document.documentElement.scrollWidth};});
  assert.ok(aligned.centerDiff<=36,'entrance form should be centered vertically '+JSON.stringify(aligned));
  assert.ok(aligned.docWidth<=width+3,'mobile entry has horizontal overflow '+JSON.stringify(aligned));
 }
 await page.screenshot({path:'tests/screenshot-entrance-'+width+'x'+height+'.png',fullPage:true});
 await page.locator('#name').fill('Анна');
 await page.locator('[data-act="badge"]').click();
 assert.equal(await page.locator('.entrance-scene').count(),1,'registration-to-pass image lost');
 assert.equal(await page.locator('.badge-card').count(),1,'badge stage missing');
 if(width<=720){
  const badge=await page.evaluate(()=>{const s=document.querySelector('.entrance-scene').getBoundingClientRect(),g=document.querySelector('.entrance-scene .badge-screen').getBoundingClientRect(),btn=document.querySelector('.badge-screen .btn').getBoundingClientRect();return {delta:Math.abs((s.top+s.bottom-g.top-g.bottom)/2),buttonBottom:btn.bottom,screenHeight:innerHeight,docWidth:document.documentElement.scrollWidth};});
  assert.ok(badge.delta<=36,'badge panel must stay centered '+JSON.stringify(badge));
  assert.ok(badge.buttonBottom<=height+3,'badge action must remain visible '+JSON.stringify(badge));
  assert.ok(badge.docWidth<=width+3,'badge page overflows horizontally '+JSON.stringify(badge));
 }
 await page.locator('[data-act="next"]').click();
 assert.equal(await page.locator('.dialogue-stage--office').count(),1,'transition to S01 failed');
 assert.deepEqual(errors,[],'JavaScript error '+width+'x'+height);
 console.log('PASS entrance '+width+'x'+height);
 await page.close();
}
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});