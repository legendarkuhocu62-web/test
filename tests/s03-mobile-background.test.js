const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const key='ceh404.rebuilt.qa50.20261108';
(async()=>{
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
for(const [width,height] of [[360,640],[375,667],[390,844],[430,932],[768,1024],[1280,800]]){
const page=await browser.newPage({viewport:{width,height}});
await page.goto('http://127.0.0.1:8765/');
await page.evaluate(k=>localStorage.setItem(k,JSON.stringify({scene:'S03',name:'Тест',s03Person:null,asked03:[]})),key);
await page.reload();
await page.locator('.s03-group-scene').waitFor();
const buttons=page.locator('.s03-group-scene button[data-act="person"]');
assert.equal(await buttons.count(),3);
const view=await page.evaluate(()=>{
const scene=document.querySelector('.s03-group-scene');
const choices=[...scene.querySelectorAll('[data-act="person"]')];
return {background:getComputedStyle(scene).backgroundImage,
scrollW:document.documentElement.scrollWidth,scrollH:document.documentElement.scrollHeight,
boxes:choices.map(x=>{const r=x.getBoundingClientRect();return {left:r.left,right:r.right,bottom:r.bottom,scrollW:x.scrollWidth,clientW:x.clientWidth,scrollH:x.scrollHeight,clientH:x.clientHeight,wordBreak:getComputedStyle(x).wordBreak}})};
});
assert.ok(view.background.includes(width<=430?'CH1-IMG-022_S03_meeting_three_characters_mobile.png':'CH1-IMG-020_S03_three_characters.jpeg'));
if(width<=430){
assert.ok(view.scrollW<=width+2&&view.scrollH<=height+2,'S03 overflow at '+width);
assert.ok(view.boxes.every(b=>b.left>=-2&&b.right<=width+2&&b.bottom<=height+2&&b.scrollW<=b.clientW+2&&b.scrollH<=b.clientH+2&&b.wordBreak==='normal'),'S03 clipped buttons at '+width);
const sequence=await page.locator('.s03-group-scene button[data-act="person"]').evaluateAll(nodes=>nodes.map(n=>({id:n.dataset.id,left:n.getBoundingClientRect().left})).sort((a,b)=>a.left-b.left).map(x=>x.id));
assert.deepEqual(sequence,['andrey','irina','marina'],'mobile captions do not align with seated people');
}
await page.screenshot({path:'tests/screenshot-s03-'+width+'x'+height+'.png'});
for(let i=0;i<3;i++){
await buttons.nth(i).click();
let fragments=0;
while(await page.locator('[data-act="dlgMore"]').count()){
  assert.equal(await page.locator('[data-act="closePerson"]').count(),0,'must read all text before closing');
  await page.locator('[data-act="dlgMore"]').click();
  assert.ok(++fragments<40,'S03 dialogue pagination loop');
}
assert.ok(await page.locator('[data-act="closePerson"]').count(),'S03 final action is missing');
// The handler synchronously re-renders the whole scene and detaches its own button.
await page.locator('[data-act="closePerson"]').dispatchEvent('click');
await page.locator('.s03-chooser').waitFor();
}
assert.equal(await page.evaluate(()=>window.__CEH_TEST__.getState().asked03.length),3);
await page.locator('[data-act="next"][data-id="S04"]').click();
assert.equal(await page.evaluate(()=>window.__CEH_TEST__.getState().scene),'S04');
console.log('PASS S03 '+width+'x'+height);
await page.close();
}
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
