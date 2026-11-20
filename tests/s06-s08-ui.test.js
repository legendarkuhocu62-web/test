'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const key='ceh404.rebuilt.qa50.20261108';
async function assertS08NoScroll(page,where){
 const info=await page.evaluate(()=>{
  const screen=document.querySelector('.s08-screen');
  const pageCard=document.querySelector('.s08-paged-card')||
    document.querySelector('.s08-report-page')||
    document.querySelector('.s08-summary-card[data-s08-selected="yes"]');
  const nav=document.querySelector('.s08-report-nav')||document.querySelector('.s08-chain-nav')||document.querySelector('.s08-summary-nav');
  const control=nav?.querySelector('button:not(:disabled)');
  return {
   outer:document.documentElement.scrollHeight,
   inner:innerHeight,
   stageBottom:screen?.getBoundingClientRect().bottom,
   cardOverflow:pageCard?pageCard.scrollHeight-pageCard.clientHeight:0,
   navBottom:nav?.getBoundingClientRect().bottom,
   controlBottom:control?.getBoundingClientRect().bottom
  };
 });
 assert.ok(info.outer<=info.inner+3,'S08 must not scroll page '+where+' '+JSON.stringify(info));
 assert.ok(info.stageBottom<=info.inner+3,'S08 stage out of viewport '+where+' '+JSON.stringify(info));
 assert.ok(info.cardOverflow<=3,'S08 card content clipped '+where+' '+JSON.stringify(info));
 assert.ok(info.navBottom<=info.inner+3&&info.controlBottom<=info.inner+3,
  'S08 Back/Next not visible '+where+' '+JSON.stringify(info));
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const [width,height] of [[375,667],[390,844],[1366,768]]){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/');
  await page.evaluate(key=>{
   const s=window.CEH_LOGIC.initial();
   localStorage.setItem(key,JSON.stringify({...s,scene:'S04',s04Mode:'savedFinal',name:'Игрок QA',selected:['A','C'],initialSelected:['A'],finalSelected:['A','C'],priority:'losses',hypothesis:'machine',eduStep:4}));
  },key);
  await page.reload();
  assert.equal(await page.locator('[data-act="committeeStart"]').count(),1,'meeting after saved portfolio');
  await page.locator('[data-act="committeeStart"]').click();
  assert.equal((await page.evaluate(()=>window.__CEH_TEST__.getState())).scene,'S05');
  assert.equal(await page.locator('[data-act="committeeChoose"]').count(),3,'three S05 positions');
  assert.equal(await page.locator('[data-act="orderStart"]').count(),0,'no S06 bypass before committee response');
  await page.locator('[data-act="committeeChoose"][data-id="conditions"]').click();
  assert.equal((await page.evaluate(()=>window.__CEH_TEST__.getState())).committeeDecision,'conditions');
  assert.equal(await page.locator('[data-act="s05Continue"]').count(),1,'continue meeting after committee response');
  await page.reload();
  assert.equal((await page.evaluate(()=>window.__CEH_TEST__.getState())).scene,'S05','S05 resumes after reload');
  assert.equal((await page.evaluate(()=>window.__CEH_TEST__.getState())).committeeDecision,'conditions','committee response persists');
  await page.locator('[data-act="s05Continue"]').click();
  assert.equal(await page.locator('.s05-tablet-notice').count(),1,'tablet alert on first Gromov dialogue');
  assert.match(await page.locator('.s05-tablet-notice').innerText(),/З-214/);
  await page.screenshot({path:'tests/screenshot-s05-notice-'+width+'x'+height+'.png'});
  assert.equal((await page.evaluate(()=>window.__CEH_TEST__.getState())).s05Phase,'notice3',
   'current approved flow has one urgent Gromov notification without obsolete committee interludes');
  assert.equal(await page.locator('[data-act="s05Next"]').count(),0,
   'obsolete multi-dialogue route must not return');
  await page.reload();
  assert.equal((await page.evaluate(()=>window.__CEH_TEST__.getState())).s05Phase,'notice3','last dialogue resumes');
  while(await page.locator('[data-act="dlgMore"]').count())await page.locator('[data-act="dlgMore"]').click();
  await page.locator('[data-act="s05ToS06"]').click();
  assert.equal((await page.evaluate(()=>window.__CEH_TEST__.getState())).scene,'S06');
  assert.equal(await page.locator('[data-act="s06ReadDocs"]').count(),1,'Gromov briefing first');
  assert.equal(await page.locator('.dialogue-stage--shop').count(),1,'intro uses shared dialogue presentation');
  assert.match(await page.locator('.dialogue-stage--shop').getAttribute('style'),/CH1-IMG-009/,
    'intro background is approved S06 factory image');
  const imageResponse=await page.request.get('http://127.0.0.1:8765/assets/backgrounds/CH1-IMG-009_%D0%9F%D1%80%D0%BE%D0%B8%D0%B7%D0%B2%D0%BE%D0%B4%D1%81%D1%82%D0%B2%D0%B5%D0%BD%D0%BD%D1%8B%D0%B9%20%D1%86%D0%B5%D1%85.png');
  assert.equal(imageResponse.status(),200,'S06 must use actual approved factory image, not a placeholder');
  await page.screenshot({path:'tests/screenshot-s06-intro-'+width+'x'+height+'.png'});
  await page.locator('[data-act="s06ReadDocs"]').click();
  assert.equal(await page.locator('[data-act="orderTask"]:disabled').count(),1,'3/3 must lock analysis');
  assert.equal(await page.locator('.order-doc-card--unread').count(),3,'all three initially highlighted');
  assert.equal(await page.locator('.order-doc-card--read').count(),0,'nothing yet read');
  await page.screenshot({path:'tests/screenshot-s06-doc-list-'+width+'x'+height+'.png'});

  for(const [i,id] of ['shipping','route','grinding'].entries()){
   await page.locator('[data-act="orderDoc"][data-id="'+id+'"]').click();
   assert.equal(await page.locator('.order-paper').count(),1,'document opens');
   if(i===0){
    const sheet=await page.locator('.order-paper').evaluate(el=>({
     rect:el.getBoundingClientRect().toJSON(),
     aspect:getComputedStyle(el).aspectRatio,
     overflow:getComputedStyle(el).overflowY,
     pageHeight:innerHeight
    }));
    assert.match(sheet.aspect,/210\s*\/\s*297/,'S06 document must have A4 portrait aspect');
    assert.ok(sheet.rect.top>=-2&&sheet.rect.bottom<=height+2,
      'S06 paper viewer must stay within screen '+width+'x'+height+' '+JSON.stringify(sheet));
    await page.screenshot({path:'tests/screenshot-s06-a4-'+width+'x'+height+'.png'});
   }
   await page.locator('[data-act="orderCloseDoc"]').click();
   assert.equal(await page.locator('.order-doc-card--read').count(),i+1,'studied cards lose highlight');
   assert.equal(await page.locator('.order-doc-card--unread').count(),2-i,'unread cards stay highlighted');
   const readStyle=await page.locator('.order-doc-card--read').first().evaluate(el=>({
     border:getComputedStyle(el).borderColor,status:getComputedStyle(el.querySelector('.order-doc-status')).color
   }));
   const unreadCount=await page.locator('.order-doc-card--unread').count();
   if(unreadCount){
     const unreadStyle=await page.locator('.order-doc-card--unread').first().evaluate(el=>({
       border:getComputedStyle(el).borderColor,status:getComputedStyle(el.querySelector('.order-doc-status')).color
     }));
     assert.notEqual(readStyle.border,unreadStyle.border,'read and unread border colors must differ');
     assert.notEqual(readStyle.status,unreadStyle.status,'read and unread text colors must differ');
   }
  }
  await page.reload();
  assert.equal(await page.locator('.order-doc-card--read').count(),3,'all documents remain read after reload');
  assert.equal(await page.locator('.order-doc-card--unread').count(),0,'highlight must remain off after reload');
  assert.match(await page.locator('.order-progress').innerText(),/3 \/ 3/);
  await page.locator('[data-act="orderTask"]').click();
  assert.equal(await page.locator('.order-statement').count(),5);
  for(const [i,v] of ['confirmed','check','check','check','confirmed'].entries()){
   await page.locator('[data-order-answer="'+i+'"][value="'+v+'"]').check();
  }
  await page.locator('[data-act="orderSubmit"]').click();
  assert.match(await page.locator('.order-feedback--error').innerText(),/два других заказа/);
  const first=await page.evaluate(()=>window.__CEH_TEST__.getState().s0608.firstSubmitted);
  assert.equal(first.correct,false);
  await page.locator('[data-order-answer="1"][value="confirmed"]').check();
  await page.locator('[data-act="orderSubmit"]').click();
  assert.equal(await page.locator('[data-act="orderToS07"]').count(),1);
  await page.locator('[data-act="orderToS07"]').click();
  assert.equal((await page.evaluate(()=>window.__CEH_TEST__.getState())).scene,'S07');
  await page.locator('[data-act="orderChoose"][data-id="priority"]').click();
  await page.locator('[data-act="orderToS08"]').click();
  assert.equal((await page.evaluate(()=>window.__CEH_TEST__.getState())).scene,'S08');
  assert.equal(await page.locator('[data-s08-view="summary"]').count(),1);
  assert.equal(await page.locator('.s08-summary-card').count(),3);
  await assertS08NoScroll(page,'summary '+width+'x'+height);
  if(width<=720){
   assert.equal(await page.locator('.s08-summary-card:visible').count(),1);
   for(let k=1;k<3;k++){
    await page.locator('.s08-summary-nav [data-act="s08SummaryGo"]').nth(1).click();
    await assertS08NoScroll(page,'summary card '+(k+1)+' '+width+'x'+height);
   }
  }
  await page.screenshot({path:'tests/screenshot-s08-summary-'+width+'x'+height+'.png'});
  await page.reload();
  assert.equal(await page.locator('.s08-summary-card').count(),3,'S08 summary resumes after reload');
  await page.locator('[data-act="s08ShowCauses"]').click();
  assert.equal(await page.locator('[data-s08-view="causes"]').count(),1);
  const pageTotals=(await page.locator('.s08-page').innerText()).match(/(\d+)\s*\/\s*(\d+)/);
  assert.ok(pageTotals,'S08 should show page numbers');
  const total=Number(pageTotals[2]),seen=[];
  assert.ok(total>8,'S08 content should be split into readable pages');
  for(let k=0;k<total;k++){
   await assertS08NoScroll(page,'consequences '+(k+1)+'/'+total+' '+width+'x'+height);
   seen.push(await page.locator('.s08-paged-card').innerText());
   if(k<total-1)await page.locator('.s08-chain-nav [data-act="s08PageGo"]').nth(1).click();
  }
  assert.ok(seen.some(x=>x.includes('Когда может помочь')&&x.includes('Не решает автоматически')),
    'all selected initiative details must be accessible by Next');
  assert.ok(seen.some(x=>x.includes('Что ты проверял в EDU-01')),'EDU-01 must be accessible');
  assert.ok(seen.some(x=>x.includes('Главное, что стоит запомнить')),'learning takeaway must be accessible');
  await page.screenshot({path:'tests/screenshot-s08-causes-last-'+width+'x'+height+'.png'});
  await page.reload();
  assert.match(await page.locator('.s08-page').innerText(),new RegExp('^'+total+' \\/ '+total+'$'),
   'S08 current page survives reload');
  await page.locator('[data-act="s08ReportOpen"]').click();
  assert.equal(await page.locator('.s08-report-modal').count(),1);
  let reportPages=0,reportText=[];
  const m=(await page.locator('.s08-report-counter').innerText()).match(/Страница\s+\d+\s+из\s+(\d+)/);
  assert.ok(m,'report must show page count');
  reportPages=Number(m[1]);assert.ok(reportPages>=8);
  for(let j=0;j<reportPages;j++){
   await assertS08NoScroll(page,'report page '+(j+1)+'/'+reportPages+' '+width+'x'+height);
   reportText.push(await page.locator('.s08-report-page').innerText());
   if(j<reportPages-1)await page.locator('.s08-report-nav [data-act="s08ReportGo"]').nth(1).click();
  }
  const fullReport=reportText.join(' ');
  assert.match(fullReport,/Первоначальный: A/);
  assert.match(fullReport,/Итоговый: A/);
  assert.match(fullReport,/Комитет/);
  assert.match(fullReport,/З-214/);
  await page.screenshot({path:'tests/screenshot-s08-teacher-'+width+'x'+height+'.png'});
  await page.reload();
  assert.equal(await page.locator('.s08-report-modal').count(),1,'report survives refresh');
  await page.locator('[data-act="s08ReportClose"]').click();
  assert.equal(await page.locator('.s08-report-modal').count(),0,'close report');
  await page.locator('[data-act="s08Back"]').click();
  assert.equal(await page.locator('[data-s08-view="summary"]').count(),1);
  assert.equal((await page.evaluate(()=>window.__CEH_TEST__.getState().s0608.firstSubmitted)).correct,false);
  assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth))<=width+3,'no horizontal overflow '+width);
  assert.deepEqual(errors,[],'browser error '+width);
  console.log('PASS S06–S08 integration + personalized S08 '+width+'x'+height);
  await page.close();
 }

 // S08 direct old-save smoke on the smallest phone and on tablet: no S06/S07 mutation.
 for(const [width,height] of [[320,568],[1024,768]]){
  const page=await browser.newPage({viewport:{width,height}});
  await page.goto('http://127.0.0.1:8765/');
  await page.evaluate(key=>{
   const s=window.CEH_LOGIC.initial();
   localStorage.setItem(key,JSON.stringify({...s,name:'Сохранённый игрок',scene:'S08',
    hypothesis:'insufficient',priority:'capacity',
    initialSelected:['A','J'],finalSelected:['D','F','J'],
    committeeDecision:'stage',eduStep:4,
    s0608:{docsOpened:['route','grinding','shipping'],
      firstSubmitted:{answers:['confirmed','confirmed','check','check','confirmed']},
      finalConclusion:{answers:['confirmed','confirmed','check','check','confirmed']},s07Decision:'extra'}}));
  },key);
  await page.reload();
  assert.equal(await page.locator('.s08-summary-card').count(),3);
  await assertS08NoScroll(page,'direct save summary '+width+'x'+height);
  await page.locator('[data-act="s08ShowCauses"]').click();
  await assertS08NoScroll(page,'direct save first cause '+width+'x'+height);
  for(let k=0;k<3;k++){
   await page.locator('.s08-chain-nav [data-act="s08PageGo"]').nth(1).click();
   await assertS08NoScroll(page,'direct save cause '+(k+2)+' '+width+'x'+height);
  }
  await page.locator('[data-act="s08ReportOpen"]').click();
  await assertS08NoScroll(page,'direct save report '+width+'x'+height);
  await page.screenshot({path:'tests/screenshot-s08-paged-'+width+'x'+height+'.png'});
  await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
