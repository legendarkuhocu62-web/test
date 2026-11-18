'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const key='ceh404.rebuilt.qa50.20261108';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const [width,height] of [[360,640],[390,844],[768,1024],[1366,768]]){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/');
  await page.evaluate(key=>{const s=window.CEH_LOGIC.initial();localStorage.setItem(key,JSON.stringify({...s,name:'Каталог QA',scene:'S04',s04Mode:'catalog'}));},key);
  await page.reload();
  await page.screenshot({path:'tests/screenshot-s04-catalog-'+width+'x'+height+'.png'});
  const firstView=await page.evaluate(()=>{
   const btn=document.querySelector('.catalog-workspace__summary [data-act="review"]');
   const rect=btn?.getBoundingClientRect();
   return {scrollHeight:document.scrollingElement.scrollHeight,viewport:innerHeight,
     cta:rect?{top:rect.top,bottom:rect.bottom,left:rect.left,right:rect.right}:null};
  });
  assert.ok(firstView.cta,'S04 portfolio confirmation must exist');
  assert.ok(firstView.cta.top>=-2&&firstView.cta.bottom<=height+2,
    'S04 confirmation must be visible without scrolling '+width+'x'+height+' '+JSON.stringify(firstView));
  const count=width<=720?4:6;
  assert.equal(await page.locator('.ic-grid .ic-card').count(),count);
  const buttonVisuals=await page.locator('.ic-grid .ic-card .ic-card__open.btn').evaluateAll(buttons=>
    buttons.map(button=>{
      const style=getComputedStyle(button);
      const r=button.getBoundingClientRect();
      return {background:style.backgroundImage,bgColor:style.backgroundColor,
        visible:r.width>120&&r.height>=44,color:style.color,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===button};
    })
  );
  assert.equal(buttonVisuals.length,count,'each catalog card needs an obvious action button');
  for(const [i,b] of buttonVisuals.entries()){
    assert.match(b.background,/linear-gradient/,'investment open CTA is not orange-filled '+i+' '+JSON.stringify(b));
    assert.ok(/(255, 1(4[0-9]|5[0-9]|6[0-9]|7[0-9]|8[0-9]))/.test(b.background)||b.background.includes('255, 183, 59'),
      'investment open CTA lacks expected warm orange stops '+i+' '+b.background);
    assert.ok(b.visible,'CTA action has inadequate size '+i);
  }

  assert.match(await page.locator('.ic-pager__counter').innerText(),width<=720?/1 \/ 4/:/1 \/ 3/);
  await page.locator('[data-act="catalogOpen"][data-id="A"]').click();
  const dlg=page.locator('.ic-detail');
  await dlg.waitFor({state:'visible'});
  assert.equal(await dlg.locator('img').getAttribute('src'),'assets/investments/CH1-VA-A-001.png');
  await dlg.locator('img').evaluate(img=>img.decode());
  assert.equal(await dlg.locator('img').evaluate(i=>i.naturalWidth>0),true);
  assert.equal(await dlg.locator('.ic-detail__actions').count(),0,'no duplicate bottom actions');
  // Phone and PC: the close control is a readable, generously-sized actual
  // orange button, not a tiny glyph floating in a distorted capsule.
  const closeStyle=await dlg.locator('.ic-detail__close').evaluate(el=>{
    const r=el.getBoundingClientRect(),s=getComputedStyle(el);
    const pseudo=getComputedStyle(el,'::before');
    const under=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
    return {w:r.width,h:r.height,size:parseFloat(s.fontSize),background:s.backgroundImage,
      transform:s.transform,centerAction:under?.closest('[data-act]')?.getAttribute('data-act'),
      hiddenPseudo:pseudo.content==='none',label:el.getAttribute('aria-label')};
  });
  assert.ok(closeStyle.w>=48&&closeStyle.h>=44&&closeStyle.size>=28,
    'close X must be large enough on '+width+'x'+height+': '+JSON.stringify(closeStyle));
  assert.match(closeStyle.background,/linear-gradient/,'close control should have same orange gradient');
  assert.equal(closeStyle.centerAction,'catalogClose','X center must actually be clickable');
  assert.equal(closeStyle.hiddenPseudo,true,'tiny skewed global button background must be absent');
  assert.equal(closeStyle.label,'Закрыть инвестиционное предложение');

  assert.equal(await dlg.getAttribute('data-ui-build'),'poster-v3','new poster code must be loaded');
  const ui=await dlg.evaluate(modal=>{
    const poster=modal.querySelector('.ic-poster').getBoundingClientRect();
    const body=modal.querySelector('.ic-detail__body').getBoundingClientRect();
    const outer=modal.getBoundingClientRect();
    const cs=getComputedStyle(modal);
    const head=modal.querySelector('.ic-detail__head').getBoundingClientRect();
    const hit=modal.querySelector('.ic-poster__hit--add').getBoundingClientRect();
    const topmost=document.elementFromPoint(hit.left+hit.width/2,hit.top+hit.height/2);
    return {gap:outer.bottom-body.bottom,portraitBottom:poster.bottom,modalBottom:outer.bottom,headHeight:head.height,outerHeight:outer.height,bodyHeight:body.height,cssHeight:cs.height,cssMinHeight:cs.minHeight,cssMaxHeight:cs.maxHeight,cssFlex:cs.flexDirection,
      build:getComputedStyle(modal).display,buttonCenterAction:topmost?.getAttribute('data-act')};
  });
  assert.ok(ui.gap<=12,'unwanted blank area at bottom of card '+width+': '+JSON.stringify(ui));
  assert.equal(ui.buttonCenterAction,'catalogAdd','printed Add must receive direct touch '+width);

  assert.equal(await dlg.locator('.ic-poster__hit').count(),2,'both printed buttons have native HTML hotspots');
  const geometry=await dlg.evaluate(modal=>{
    const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height}};
    return {modal:rect(modal),image:rect(modal.querySelector('.ic-poster img')),
      decline:rect(modal.querySelector('.ic-poster__hit--decline')),
      add:rect(modal.querySelector('.ic-poster__hit--add')),
      scrollWidth:document.documentElement.scrollWidth};
  });
  assert.ok(geometry.image.w>geometry.modal.w*.94,'poster must fill the frame width '+width);
  assert.ok(geometry.modal.right<=width+2&&geometry.modal.x>=-2,'modal beyond viewport width '+width);
  assert.ok(geometry.modal.y>=-2&&geometry.modal.bottom<=height+2,'modal beyond viewport height '+width);
  assert.ok(geometry.add.x>geometry.decline.right,'Add and Decline touch zones must not overlap');
  assert.ok(geometry.add.h>=36&&geometry.decline.h>=36,'printed button tap areas must be comfortable');
  assert.ok(geometry.scrollWidth<=width+3,'no horizontal document overflow');

  assert.equal(await dlg.locator('[data-act="catalogAdd"]').count(),1);
  assert.equal(await dlg.locator('[data-act="catalogDecline"]').count(),1);
  await dlg.locator('.ic-detail__close').click();
  assert.equal(await page.locator('.ic-detail').count(),0,'close button must dismiss the card');
  await page.locator('[data-act="catalogOpen"][data-id="A"]').click();
  assert.equal(await page.locator('.ic-detail').count(),1,'card should reopen with budget state intact');

  await dlg.locator('.ic-poster__hit--add').click();
  assert.deepEqual((await page.evaluate(()=>window.__CEH_TEST__.getState())).selected,['A']);
  assert.match(await page.locator('.budget').innerText(),/Выбрано\s+60\s+млн у.е./,'budget total must remain correct even when responsive labels wrap');
  await page.locator('[data-act="catalogOpen"][data-id="A"]').click();
  await page.locator('.ic-poster__hit--add').click();
  assert.deepEqual((await page.evaluate(()=>window.__CEH_TEST__.getState())).selected,['A'],'no double add');
  await page.locator('[data-act="catalogOpen"][data-id="B"]').click();
  await page.locator('[data-act="catalogAdd"]').click();
  assert.deepEqual((await page.evaluate(()=>window.__CEH_TEST__.getState())).selected,['A','B']);
  await page.locator('[data-act="catalogOpen"][data-id="C"]').click();
  await page.locator('[data-act="catalogAdd"]').click();
  assert.equal(await page.locator('.budget-limit-dialog:visible').count(),1,'budget limit');
  assert.deepEqual((await page.evaluate(()=>window.__CEH_TEST__.getState())).selected,['A','B']);
  await page.locator('.budget-limit-dialog .budget-limit-dialog__button').click();
  await page.locator('.ic-poster__hit--decline').click();
  assert.equal(await page.locator('.ic-detail').count(),0);
  await page.reload();
  assert.deepEqual((await page.evaluate(()=>window.__CEH_TEST__.getState())).selected,['A','B'],'persist after reload');
  await page.locator('[data-act="catalogOpen"][data-id="B"]').click();
  await page.locator('.ic-poster__hit--decline').click();
  assert.deepEqual((await page.evaluate(()=>window.__CEH_TEST__.getState())).selected,['A'],'printed Decline must remove selected initiative');
  await page.locator('[data-act="catalogOpen"][data-id="B"]').click();
  await page.locator('.ic-poster__hit--add').focus();
  await page.keyboard.press('Enter');
  assert.deepEqual((await page.evaluate(()=>window.__CEH_TEST__.getState())).selected,['A','B'],'printed Add accessible by keyboard');


  // Only confirmation accent changes; the four yellow-highlighted catalog
  // actions in the supplied phone screenshot remain exactly as approved.
  const protectedCTA=await page.locator('.ic-grid .ic-card .ic-card__open').first().evaluate(btn=>{
    const s=getComputedStyle(btn);
    return {bg:s.backgroundImage,height:btn.getBoundingClientRect().height};
  });
  assert.ok(protectedCTA.bg.includes('linear-gradient')&&protectedCTA.height>=44,
    'do not alter the approved orange catalog open buttons');
  await page.locator('[data-act="review"]').click();
  const feedback=page.locator('.document--catalog .feedback');
  assert.equal(await feedback.count(),1,'portfolio confirmation expected');
  await page.screenshot({path:'tests/screenshot-s04-review-'+width+'x'+height+'.png'});
  const save=await page.locator('[data-act="finish"]').boundingBox();
  assert.ok(save&&save.y>=-2&&save.y+save.height<=height+2,
    'save-continue must remain visible without outer scroll '+width+'x'+height+' '+JSON.stringify(save));
  const accent=await feedback.evaluate(el=>{
    const s=getComputedStyle(el),p=getComputedStyle(el,'::before');
    return {left:s.borderLeftWidth,content:p.content,gradient:p.backgroundImage,
      width:p.width,height:p.height,transform:p.transform,railLeft:p.left,headingLeft:el.querySelector('h2').getBoundingClientRect().left-el.getBoundingClientRect().left};
  });
  assert.equal(parseFloat(accent.left),0,'old plain orange stripe should be removed');
  assert.match(accent.gradient,/linear-gradient/,'stripe should share button gradient');
  assert.ok(parseFloat(accent.width)>=7&&parseFloat(accent.height)>30,'beveled confirmation stripe missing');
  assert.equal(accent.transform,'none','tall confirmation rail cannot use skewX');
  assert.ok(parseFloat(accent.railLeft)+parseFloat(accent.width)+7<=accent.headingLeft,
    'confirmation rail must not overlap heading or other text');
  await page.locator('[data-act="catalog"]').click();
  assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth))<=width+3,'no horizontal overflow');
  await page.locator('[data-act="catalogPage"][data-id="next"]').click();
  assert.match(await page.locator('.ic-pager__counter').innerText(),/2 \/ [34]/);
  assert.deepEqual(errors,[],'page errors');
  console.log('PASS investment full card '+width+'x'+height);
  await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
