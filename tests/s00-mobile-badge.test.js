/* S00 mobile badge screen: CH1-IMG-023, isolated image/layer responsive checks. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const KEY='ceh404.rebuilt.qa50.20261108';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const [width,height] of [[320,568],[375,667],[390,600],[390,844],[430,932],[720,740],[1024,768]]){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'load'});
  await page.evaluate(key=>localStorage.setItem(key,JSON.stringify({scene:'S00',s00:4,name:'Анна'})),KEY);
  await page.reload({waitUntil:'load'});
  const scene=page.locator('.entrance-scene--badge');
  await scene.waitFor();
  const card=page.locator('.badge-screen');
  const image=page.locator('.badge-card img');
  const button=page.locator('.badge-screen [data-act="next"]');
  assert.equal(await page.locator('.badge-screen h1').innerText(),'Пропуск получен');
  assert.equal(await button.innerText(),'ПРОЙТИ ЧЕРЕЗ ТУРНИКЕТ');
  assert.equal(await page.locator('.badge-screen .btn').count(),1,'exactly one CTA');
  const x=await page.evaluate(async()=>{
    const scene=document.querySelector('.entrance-scene--badge');
    const style=getComputedStyle(scene);
    const b=scene.getBoundingClientRect();
    const card=document.querySelector('.badge-screen').getBoundingClientRect();
    const img=document.querySelector('.badge-card img');
    await img.decode();
    const imgr=img.getBoundingClientRect();
    const btn=document.querySelector('.badge-screen .btn');
    const btnr=btn.getBoundingClientRect();
    return {background:style.backgroundImage,sizing:style.backgroundSize,repeat:style.backgroundRepeat,
      w:innerWidth,h:innerHeight,scrollW:document.documentElement.scrollWidth,
      scrollH:document.documentElement.scrollHeight,headerBottom:document.querySelector('.masthead').getBoundingClientRect().bottom,
      scene:{top:b.top,bottom:b.bottom},card:{top:card.top,bottom:card.bottom,left:card.left,right:card.right},
      image:{naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,left:imgr.left,right:imgr.right,top:imgr.top,bottom:imgr.bottom},
      button:{top:btnr.top,bottom:btnr.bottom,left:btnr.left,right:btnr.right},arrow:getComputedStyle(btn,'::after').content};
  });
  assert.equal(x.image.naturalWidth,1536,'approved employee badge is unchanged');
  assert.equal(x.image.naturalHeight,1024,'approved employee badge is unchanged');
  assert.ok(x.button.left>=0&&x.button.right<=width+2,'CTA overflows horizontally '+JSON.stringify(x));
  assert.ok(x.image.left>=0&&x.image.right<=width+2,'badge clipped horizontally '+JSON.stringify(x));
  assert.ok(x.image.top>=0&&x.image.bottom<=height+2,'badge clipped vertically '+JSON.stringify(x));
  if(width<=720){
    assert.match(x.background,/CH1-IMG-023_S00_turnstiles_lobby_mobile\.png/,'wrong mobile lobby');
    assert.match(x.sizing,/cover/,'mobile background must not stretch');
    assert.match(x.repeat,/no-repeat/);
    assert.ok(x.card.top>=x.headerBottom-2,'card hides under header '+JSON.stringify(x));
    assert.ok(x.card.bottom<=height+2,'card hides under browser edge '+JSON.stringify(x));
    assert.ok(x.button.bottom<=height+2,'CTA under browser bar '+JSON.stringify(x));
    assert.ok(x.scrollW<=width+2,'horizontal page scroll '+JSON.stringify(x));
    assert.ok(x.scrollH<=height+2,'vertical page scroll '+JSON.stringify(x));
    assert.equal(x.arrow,'none','decorative arrow must not appear');
  }else{
    assert.doesNotMatch(x.background,/CH1-IMG-023/,'desktop layout must retain old background');
  }
  await page.screenshot({path:'tests/screenshot-s00-badge-'+width+'x'+height+'.png'});
  await button.click();
  assert.equal(await page.evaluate(()=>window.__CEH_TEST__.getState().scene),'S01',
    'turnstile action should open S01');
  assert.deepEqual(errors,[],'page error '+width+'x'+height);
  console.log('PASS S00 badge '+width+'x'+height);
  await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
