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
  assert.equal(await page.locator('.document--catalog .investment').count(),13,
   'catalogue must preserve all 13 initiatives');
  const catalog=await page.evaluate(()=>{
   const button=document.querySelector('.investment .btn');
   const pseudo=getComputedStyle(button,'::before');
   return {
    bodyWidth:document.documentElement.scrollWidth,
    viewWidth:innerWidth,
    columns:getComputedStyle(document.querySelector('.invest-grid')).gridTemplateColumns.split(' ').length,
    buttonColor:getComputedStyle(button).color,
    skew:pseudo.transform,
    gradient:pseudo.backgroundImage,
    action:!!document.querySelector('.portfolio-actions .btn')
   };
  });
  assert.ok(catalog.bodyWidth<=catalog.viewWidth+3,'catalogue horizontal overflow '+width);
  assert.match(catalog.gradient,/linear-gradient/,'slanted button fill missing');
  assert.notEqual(catalog.skew,'none','button skew missing');
  assert.equal(catalog.buttonColor,'rgb(255, 255, 255)','button lettering not white');
  assert.equal(catalog.columns,width<=590?1:width<=930?2:4,'wrong catalogue columns '+width);
  assert.ok(catalog.action,'portfolio confirmation absent');

  await page.evaluate(k=>localStorage.setItem(k,JSON.stringify({
   scene:'S04',s04Mode:'edu',selected:['C'],initialSelected:['C'],
   eduStep:1,name:'Тест',eduMessage:''
  })),key);
  await page.reload({waitUntil:'load'});
  const low=page.locator('#edu-low'),high=page.locator('#edu-high');
  await low.waitFor();
  assert.equal(await low.getAttribute('placeholder'),'Введите ответ');
  assert.equal(await high.getAttribute('placeholder'),'Введите ответ');
  const layout=await page.evaluate(()=>{
   const doc=document.querySelector('.edu-doc').getBoundingClientRect();
   const task=document.querySelector('.edu-task').getBoundingClientRect();
   return {horizontal:doc.right<=task.left+3,vertical:doc.bottom<=task.top+3,
    pageWidth:document.documentElement.scrollWidth,viewport:innerWidth};
  });
  assert.ok(layout.pageWidth<=layout.viewport+3,'EDU-01 horizontal overflow '+width);
  if(width>930)assert.ok(layout.horizontal,'EDU-01 source and task should be side by side at '+width);
  else assert.ok(layout.vertical,'EDU-01 source should be above task at '+width);

  await low.fill('19,95');await high.fill('20,05');
  await page.locator('[data-act="edu1"]').click();
  assert.equal(await page.evaluate(()=>window.__CEH_TEST__.getState().eduStep),2,
   'EDU-01 calculation failed');
  assert.equal(await page.locator('#edu-excess').getAttribute('placeholder'),'Введите ответ',
   'EDU-01 step 2 must not reveal numerical answer');
  assert.deepEqual(errors,[],'browser errors at '+width+'x'+height);
  await page.screenshot({path:'tests/screenshot-ui-edu-'+width+'x'+height+'.png',fullPage:true});
  console.log('PASS approved button/layout UX '+width+'x'+height);
  await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
