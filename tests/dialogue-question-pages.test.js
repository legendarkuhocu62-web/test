'use strict';
/* S03: no specialist question may share a frame with narrative or answer. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const key='ceh404.rebuilt.qa50.20261108';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const [width,height] of [[375,667],[390,600],[390,844],[430,932],[1366,768]]){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:8765/');
  for(const id of ['andrey','marina','irina']){
   await page.evaluate(([key,id])=>{
    const state=window.CEH_LOGIC.initial();
    localStorage.setItem(key,JSON.stringify({...state,scene:'S03',s03Person:id,name:'Анна'}));
   },[key,id]);
   await page.reload();
   await page.locator('.game-dialogue--scene .game-dialogue__text').waitFor();
   await page.waitForTimeout(80);
   const data=await page.evaluate(id=>{
    const p=window.CEH_DATA.people.find(x=>x.id===id);
    return {raw:p.speech+'\n\nВопрос: '+p.question+'\nОтвет: '+p.reply};
   },id);
   const state=await page.evaluate(()=>window.CEH_DIALOGUE.getReadState());
   assert.equal(state.joined,data.raw,'Original dialogue was changed');
   assert.ok(state.total>=3,'Expected speech, question and answer frames: '+id);
   let questionCount=0,answerCount=0,speechCount=0;
   for(let i=0;i<state.total;i++){
    const info=await page.evaluate(()=>{
     const p=document.querySelector('.game-dialogue__text p');
     const text=p.textContent.trim();
     const box=p.getBoundingClientRect();
     const parent=p.parentNode.getBoundingClientRect();
     const panel=document.querySelector('.game-dialogue__panel').getBoundingClientRect();
     const b=document.querySelector('.game-dialogue__text');
     return {text,cls:b.className,bottom:box.bottom,limit:parent.bottom,panelHeight:panel.height,
       next:!!document.querySelector('[data-act="dlgMore"]'),
       done:!!document.querySelector('[data-act="closePerson"]')};
    });
    assert.ok(info.bottom<=info.limit+3,'Text is clipped '+id+' '+width+'x'+height);
    assert.ok(info.panelHeight>170,'dialogue frame collapsed');
    if(info.text.startsWith('Вопрос:')){
      questionCount++;
      assert.match(info.cls,/game-dialogue__text--question/);
      assert.ok(!info.text.includes('Ответ:'),'Question and answer merged');
      assert.ok(!info.text.includes('Без новых мощностей')&&!info.text.includes('нерешённые проблемы')&&!info.text.includes('подтвердить данными'),'Question mixed with speech');
    }else if(info.text.startsWith('Ответ:')){
      answerCount++;
      assert.match(info.cls,/game-dialogue__text--answer/);
      assert.ok(!info.text.includes('Вопрос:'),'Answer and question merged');
    }else{
      speechCount++;
      assert.ok(!info.text.includes('Вопрос:')&&!info.text.includes('Ответ:'),'Speech contains question or answer');
    }
    if(i<state.total-1){
      assert.ok(info.next&&!info.done,'Premature final action');
      await page.locator('[data-act="dlgMore"]').dispatchEvent('click');
      await page.waitForTimeout(60);
    }else assert.ok(info.done&&!info.next,'Missing final action');
   }
   assert.equal(questionCount,1,'Question must appear on exactly one frame: '+id);
   assert.ok(speechCount>=1&&answerCount>=1);
  }
  assert.deepEqual(errors,[],'Browser errors');
  console.log('PASS S03 distinct speech/question/answer '+width+'x'+height);
  await page.close();
 }
 await browser.close();
})().catch(err=>{console.error(err);process.exit(1)});
