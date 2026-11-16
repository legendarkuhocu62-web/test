'use strict';
/* Compare historic vs current dialogue page counts without editing game files.
   Checkout determined by the workflow matrix. */
const {chromium}=require('playwright');
const fs=require('node:fs');
const KEY='ceh404.rebuilt.qa50.20261108';
const label=process.env.SNAPSHOT_LABEL||'unknown';
const cases=[];
for(let n=0;n<4;n++)cases.push({id:'S01 intro '+n,state:{scene:'S01',s01:n}});
for(const id of ['start','problems','offers'])cases.push({id:'S01 reply '+id,state:{scene:'S01',s01:4,reply:id}});
cases.push({id:'S02 intro',state:{scene:'S02',s02Step:'intro'}});
for(const id of ['machine','insufficient','quality'])cases.push({id:'S02 feedback '+id,state:{scene:'S02',s02Step:'feedback',hypothesis:id,hypothesisConfirmed:true}});
for(const id of ['andrey','marina','irina']){
 cases.push({id:'S03 speech '+id,state:{scene:'S03',s03Person:id,s03QuestionMode:'speech'}});
 cases.push({id:'S03 answer '+id,state:{scene:'S03',s03Person:id,s03QuestionMode:'answer'}});
}
cases.push({id:'S03 conclusion',state:{scene:'S03',s03Person:null,s03ConclusionSeen:true,s03Read:['andrey','marina','irina']}});
for(let n=0;n<3;n++)cases.push({id:'S04 Gromov '+n,state:{scene:'S04',s04Mode:'gromov',eduGromovIndex:n}});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const report={version:label,commit:process.env.SNAPSHOT_SHA,viewports:[],results:[]};
 try{
  for(const [width,height] of [[375,667],[390,844],[1366,768]]){
   let total=0;
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
   await page.goto('http://127.0.0.1:8765/');
   for(const item of cases){
    await page.evaluate(([key,changes])=>{
     const s=window.CEH_LOGIC.initial();
     localStorage.setItem(key,JSON.stringify(Object.assign(s,{name:'Тест'},changes)));
    },[KEY,item.state]);
    await page.reload();
    const panel=page.locator('.game-dialogue--scene .game-dialogue__panel');
    await panel.waitFor({timeout:15000});
    await page.waitForTimeout(100);
    const read=await page.evaluate(()=>window.CEH_DIALOGUE.getReadState());
    if(!read||!read.key)throw Error('No dialogue: '+item.id);
    let pages=1;
    while(await page.locator('.game-dialogue--scene [data-act="dlgMore"]').count()){
     if(pages>20)throw Error('Pagination loop '+item.id);
     await page.locator('.game-dialogue--scene [data-act="dlgMore"]').click();
     pages++;
     await page.waitForTimeout(25);
    }
    const presses=pages-1;
    total+=presses;
    report.results.push({viewport:width+'x'+height,id:item.id,presses,pages,dialogueKey:read.key});
   }
   report.viewports.push({viewport:width+'x'+height,dialogues:cases.length,presses:total});
   console.log('COUNT '+label+' '+width+'x'+height+' '+total);
   await page.close();
  }
 }finally{await browser.close();}
 fs.writeFileSync('dialogue-clicks-'+label+'.json',JSON.stringify(report,null,2));
 console.log('COUNT_REPORT '+JSON.stringify(report.viewports));
})().catch(e=>{console.error(e);process.exitCode=1});
