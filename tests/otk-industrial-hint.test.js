'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const key='ceh404.rebuilt.qa50.20261108';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const [width,height] of [[375,667],[390,844],[430,932],[1366,768]]){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/');
  await page.evaluate(key=>{
    const s=window.CEH_LOGIC.initial();
    localStorage.setItem(key,JSON.stringify({...s,scene:'S04',s04Mode:'eduIntro',selected:['A'],name:'Анна'}));
  },key);await page.reload();
  const intro=page.locator('.otk-intro');await intro.waitFor();
  assert.match(await intro.locator('h2').innerText(),/Проверка документов ОТК/);
  assert.equal(await intro.locator('.otk-intro__doc').count(),2);
  assert.equal(await page.locator('.document--eduIntro>h1:visible').count(),0,'duplicate old title visible');
  assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth))<=width+3,'intro horizontal overflow');
  const icon=await page.locator('.ceh-materials-trigger').boundingBox();
  const badge=await intro.locator('.otk-intro__badge').boundingBox();
  if(icon&&badge)assert.ok(icon.y+icon.height<=badge.y||icon.x>=badge.x+badge.width||icon.x+icon.width<=badge.x,'materials covers badge');
  await page.locator('[data-act="startEdu"]').click();
  assert.equal(await page.locator('.edu-reference .edu-document-card--row').count(),2,'docs screen lost');
  await page.evaluate(key=>{
    const s=window.CEH_LOGIC.initial();
    localStorage.setItem(key,JSON.stringify({...s,scene:'S04',s04Mode:'edu',eduStep:4,eduPage:'task',selected:['A'],name:'Анна'}));
  },key);await page.reload();
  for(const n of ['1','2','3','5'])await page.locator('input[name="edu-info"][value="'+n+'"]').check();
  const previous=await page.evaluate(()=>JSON.stringify(window.__CEH_TEST__.getState()));
  await page.locator('[data-act="edu4"]').click();
  const dialog=page.locator('.edu-feedback-dialog');await dialog.waitFor({state:'visible'});
  const msg=await dialog.locator('#edu-feedback-message').innerText();
  assert.match(msg,/где возникло отклонение/);
  assert.match(msg,/регулярно оно повторяется/);
  assert.match(msg,/очередей и ожидания/);
  assert.match(msg,/покупки станка/);
  assert.doesNotMatch(msg,/1,2,3,4/,'answer combination must not be revealed');
  assert.equal(await page.evaluate(()=>JSON.stringify(window.__CEH_TEST__.getState())),previous,'wrong answer changed state');
  await dialog.locator('button').click();
  for(const n of ['1','2','3'])assert.ok(await page.locator('input[name="edu-info"][value="'+n+'"]').isChecked(),'selection lost');
  assert.ok(await page.locator('input[name="edu-info"][value="5"]').isChecked(),'wrong selection lost');
  await page.locator('input[name="edu-info"][value="5"]').uncheck();
  await page.locator('input[name="edu-info"][value="4"]').check();
  await page.locator('[data-act="edu4"]').click();
  assert.equal(await page.locator('.edu-reference--result').count(),1,'correct combination rejected');
  assert.deepEqual(errors,[]);
  console.log('PASS EDU-01 OTK reference and contextual wrong-answer hint '+width+'x'+height);
  await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
