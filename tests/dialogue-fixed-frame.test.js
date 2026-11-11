/* Verify shared portrait/dialogue anchor across S01, S02 and S03.
   No production state is changed: tests inject isolated localStorage. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const base='http://127.0.0.1:8765/';
 const key='ceh404.rebuilt.qa50.20261108';
 const variants=[
  {scene:'S01',s01:0}, {scene:'S01',s01:2},
  {scene:'S02',s02Step:'intro'},
  {scene:'S02',s02Step:'feedback',hypothesis:'queue',hypothesisConfirmed:true},
  {scene:'S03',s03Person:'andrey'}, {scene:'S03',s03Person:'marina'}
 ];
 for(const [width,height] of [[375,667],[390,600],[390,844],[430,932],[1024,768],[1366,768]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.goto(base);
  let baseline=null,checked=0;
  for(const state of variants){
   await page.evaluate(([key,s])=>{
    const seed=window.CEH_LOGIC.initial();
    localStorage.setItem(key,JSON.stringify({...seed,name:'Анна',...s}));
   },[key,state]);
   await page.reload();
   await page.locator('.game-dialogue--scene .game-dialogue__panel').waitFor();
   // The real browser must finish text pagination before measurements.
   await page.waitForTimeout(80);
   const check=async()=>{
    const m=await page.evaluate(()=>{
     const box=s=>{const node=document.querySelector(s);if(!node)return null;const b=node.getBoundingClientRect();return {top:b.top,bottom:b.bottom,left:b.left,right:b.right,height:b.height,width:b.width}};
     const text=box('.game-dialogue--scene .game-dialogue__text');
     const paragraph=box('.game-dialogue--scene .game-dialogue__text p');
     return {panel:box('.game-dialogue--scene .game-dialogue__panel'),portrait:box('.game-dialogue--scene .game-dialogue__character'),text,paragraph,header:box('.masthead'),footer:box('.game-dialogue--scene .game-dialogue__footer'),docWidth:document.documentElement.scrollWidth,screenWidth:innerWidth,read:window.CEH_DIALOGUE.getReadState()};
    });
    assert.ok(m.panel&&m.portrait,'missing dialogue or portrait at '+width+'x'+height);
    assert.ok(m.panel.bottom<=height+3,'panel beyond screen: '+JSON.stringify(m));
    assert.ok(m.panel.top>=m.header.bottom-4,'panel covers header: '+JSON.stringify(m));
    assert.ok(m.portrait.top>=m.header.bottom-5,'portrait overlaps header: '+JSON.stringify(m));
    assert.ok(m.paragraph.bottom<=m.text.bottom+3,'text clipped instead of paginated: '+JSON.stringify(m));
    assert.ok(m.docWidth<=m.screenWidth+3,'horizontal overflow: '+JSON.stringify(m));
    assert.ok(m.footer.bottom<=m.panel.bottom+2,'button below panel: '+JSON.stringify(m));
    if(!baseline)baseline=m.panel;
    else {
     assert.ok(Math.abs(m.panel.height-baseline.height)<=2,'panel height changes between speakers or pages: '+JSON.stringify({baseline,now:m.panel}));
     assert.ok(Math.abs(m.panel.top-baseline.top)<=2,'panel vertical anchor changes: '+JSON.stringify({baseline,now:m.panel}));
    }
    checked++;
    return m;
   };
   await check();
   let pages=0;
   while(await page.locator('[data-act="dlgMore"]').count()){
    await page.locator('[data-act="dlgMore"]').click();
    await page.waitForTimeout(40);
    await check();
    pages++;
    assert.ok(pages<40,'pagination loop');
   }
  }
  assert.deepEqual(errors,[],'JS runtime errors '+width+'x'+height);
  await page.screenshot({path:'tests/screenshot-dialogue-fixed-'+width+'x'+height+'.png'});
  console.log('PASS shared fixed dialogue '+width+'x'+height+' checks='+checked);
  await page.close();
 }
 await browser.close();
})().catch(err=>{console.error(err);process.exit(1)});
