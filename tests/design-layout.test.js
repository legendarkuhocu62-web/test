/* Browser checks for the approved orange buttons, responsive S04 and EDU-01.
   Uses the same headless Playwright dependency as other project tests. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const key='ceh404.rebuilt.qa50.20261108';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const sizes=[[390,844],[768,1024],[1366,768]];
 const base='http://127.0.0.1:8765/';
 for(const [width,height] of sizes){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base,{waitUntil:'load'});
  await page.evaluate(k=>localStorage.setItem(k,JSON.stringify({
   scene:'S04',s04Mode:'catalog',selected:['C'],priority:'losses',
   name:'Тест',showReview:false,initialSelected:null
  })),key);
  await page.reload({waitUntil:'load'});
  await page.locator('.document--catalog .investment').first().waitFor();
  assert.equal(await page.locator('.ic-grid .ic-card').count(),width<=720?4:6,'catalog page count');
  const col=await page.locator('.ic-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
  assert.equal(col,width<=720?1:width<=1000?2:3,'catalog grid columns');
  assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth))<=width+3,'catalogue horizontal overflow');
  assert.equal(await page.locator('.portfolio-actions .btn').count(),1,'portfolio confirmation remains');
  await page.locator('[data-act="catalogOpen"]').first().click();
  assert.equal(await page.locator('dialog.ic-detail:visible').count(),1,'full card opens');
  await page.locator('dialog.ic-detail img').evaluate(img=>img.decode());
  assert.equal(await page.locator('dialog.ic-detail img').evaluate(el=>el.naturalWidth>0),true,'full local image loaded');
  await page.locator('[data-act="catalogClose"]').click();
  assert.equal(await page.locator('dialog.ic-detail').count(),0,'full card closes');
  await page.locator('[data-act="catalogPage"][data-id="next"]').click();
  assert.match(await page.locator('.ic-pager__counter').innerText(),/2 \/ [34]/);
  assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth))<=width+3,'catalogue horizontal overflow after paging');
  await page.evaluate(k=>localStorage.setItem(k,JSON.stringify({
   scene:'S04',s04Mode:'edu',selected:['C'],initialSelected:['C'],
   eduStep:1,eduPage:'documents',name:'Тест',eduMessage:''
  })),key);
  await page.reload({waitUntil:'load'});
  const docs=page.locator('.edu-reference .edu-document-card--row');
  await docs.first().waitFor();
  assert.equal(await docs.count(),2,'documents screen must contain both approved scans');
  assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth))<=width+3,'EDU-01 document screen horizontal overflow '+width);
  await page.locator('[data-act="eduGoTask"]').click();
  const low=page.locator('#edu-low'),high=page.locator('#edu-high');
  await low.waitFor();
  assert.equal(await low.getAttribute('placeholder'),'Введите значение');
  assert.equal(await high.getAttribute('placeholder'),'Введите значение');
  assert.equal(await page.locator('.edu-doc').count(),0,'task and scans should be on separate screens');
  assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth))<=width+3,'EDU-01 task horizontal overflow '+width);

  // A wrong value must open a branded game dialog instead of Android's native
  // site-confirmation alert. Closing it must preserve both form values.
  let nativeAlerts=0;
  page.on('dialog',dialog=>{nativeAlerts++;dialog.dismiss();});
  await low.fill('36');await high.fill('20,05');
  await page.locator('[data-act="edu1"]').click();
  const feedback=page.locator('dialog.edu-feedback-dialog');
  await feedback.waitFor({state:'visible'});
  assert.match(await feedback.innerText(),/Вы неправильно рассчитали\. Попробуйте ещё раз\./);
  assert.equal(await feedback.locator('#edu-feedback-heading').innerText(),'Проверь расчёт');
  const style=await feedback.evaluate(x=>({
    bg:getComputedStyle(x).backgroundImage,
    border:getComputedStyle(x).borderTopColor,
    button:getComputedStyle(x.querySelector('.edu-feedback-dialog__button'),'::before').backgroundImage,
    rect:x.getBoundingClientRect().toJSON()
  }));
  assert.match(style.bg,/linear-gradient/,'game modal background missing');
  assert.match(style.button,/linear-gradient/,'orange game CTA missing');
  assert.ok(style.rect.left>=0&&style.rect.right<=width+2,'mobile feedback exceeds viewport');
  await feedback.locator('.edu-feedback-dialog__button').click();
  assert.equal(await feedback.evaluate(x=>x.open),false,'feedback must close');
  assert.equal(await low.inputValue(),'36','lower input must be preserved');
  assert.equal(await high.inputValue(),'20,05','upper input must be preserved');
  assert.equal(nativeAlerts,0,'never call a native browser alert for EDU-01');
  await low.fill('19,95');await high.fill('20,05');
  await page.locator('[data-act="edu1"]').click();
  assert.equal(await page.evaluate(()=>window.__CEH_TEST__.getState().eduStep),2,
   'EDU-01 calculation failed');
  assert.equal(await page.locator('.edu-reference--result').count(),1,'success must show a separate result screen');
  await page.locator('[data-act="eduContinue"]').click();
  await page.locator('[data-act="eduGoTask"]').click();
  assert.equal(await page.locator('#edu-excess').getAttribute('placeholder'),'Введите ответ',
   'EDU-01 step 2 must not reveal numerical answer');
  assert.deepEqual(errors,[],'browser errors at '+width+'x'+height);
  await page.screenshot({path:'tests/screenshot-ui-edu-'+width+'x'+height+'.png',fullPage:true});
  console.log('PASS approved button/layout UX '+width+'x'+height);
  await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
