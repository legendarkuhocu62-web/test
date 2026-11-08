/* Visual browser regression for S01/S02/S03. Run with: node tests/dialogue-browser.test.js */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const sizes=[[375,667],[390,600],[390,844],[430,932],[1024,768],[1366,768],[1920,1080]];
 const base='http://127.0.0.1:8765/';
 const stateKey='ceh404.rebuilt.qa50.20261108';
 for(const [width,height] of sizes){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'load'});
  await page.evaluate(([key])=>localStorage.setItem(key,JSON.stringify({
   scene:'S01',s00:3,name:'Анна',s01:2,reply:null,asked:[],hypothesis:null,hypothesisConfirmed:false,s03Person:null,asked03:[],priority:null,s04Mode:'priority',selected:[],showReview:false,finished:false
  })),[stateKey]);
  await page.reload();
  await page.locator('.game-dialogue__panel').waitFor();
  const info=await page.evaluate(()=>{
   const r=sel=>{const x=document.querySelector(sel);if(!x)return null;const b=x.getBoundingClientRect();return {top:b.top,bottom:b.bottom,left:b.left,right:b.right,width:b.width,height:b.height}};
   return {screen:{width:innerWidth,height:innerHeight},panel:r('.game-dialogue__panel'),character:r('.game-dialogue__character'),header:r('.masthead'),status:r('.statusline'),buttons:[...document.querySelectorAll('.game-dialogue__actions button')].map(x=>{const b=x.getBoundingClientRect();return {text:x.textContent,left:b.left,right:b.right,top:b.top,bottom:b.bottom}}),bodyWidth:document.body.scrollWidth,clientWidth:document.documentElement.clientWidth};
  });
  const tolerance=3;
  assert.ok(info.panel.bottom<=height+tolerance,'S01 panel overflows bottom at '+width+'x'+height+' '+JSON.stringify(info));
  assert.ok(info.panel.top>=info.status.bottom-tolerance,'S01 panel overlaps header at '+width+'x'+height);
  assert.ok(info.character.top>=info.status.bottom-3,'S01 character overlaps header at '+width+'x'+height);
  assert.ok(info.bodyWidth<=info.clientWidth+tolerance,'horizontal overflow at '+width+'x'+height);
  for(const b of info.buttons)assert.ok(b.bottom<=height+tolerance&&b.left>=-tolerance&&b.right<=width+tolerance,'button overflow '+width+'x'+height+' '+JSON.stringify(b));
  assert.deepEqual(errors,[],'JS errors in S01 at '+width+'x'+height);
  await page.screenshot({path:'tests/screenshot-s01-'+width+'x'+height+'.png'});
  // Verify the final gameplay action is absent until the last fragment.
  const more=page.locator('[data-act="dlgMore"]');
  let guard=0;
  while(await more.count()){
    assert.equal(await page.locator('[data-act="introNext"]').count(),0,'premature S01 advance');
    await more.click();guard++;assert.ok(guard<40,'endless dialogue');
  }
  assert.equal(await page.locator('[data-act="introNext"]').count(),1);
  await page.evaluate(([key])=>{const s=JSON.parse(localStorage.getItem(key));s.scene='S03';s.s03Person='andrey';localStorage.setItem(key,JSON.stringify(s))},[stateKey]);
  await page.reload();
  await page.locator('.game-dialogue__panel').waitFor();
  const s03=await page.evaluate(()=>{const p=document.querySelector('.game-dialogue__panel').getBoundingClientRect();return {bottom:p.bottom,top:p.top}});
  assert.ok(s03.bottom<=height+tolerance,'S03 panel overflows at '+width+'x'+height);
  assert.deepEqual(errors,[],'JS errors S03 '+width+'x'+height);
  await page.screenshot({path:'tests/screenshot-s03-'+width+'x'+height+'.png'});
  await page.close();
  console.log('PASS browser '+width+'x'+height);
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});