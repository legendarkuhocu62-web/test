'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const KEY='ceh404.rebuilt.qa50.20261108';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const [width,height] of [[320,568],[360,640],[390,844],[430,932],[720,740],[1024,768]]){
   const page=await browser.newPage({viewport:{width,height}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8765/');
   await page.evaluate(key=>{
    const s=window.CEH_LOGIC.initial();
    localStorage.setItem(key,JSON.stringify({...s,scene:'S05',s05Phase:'notice3',
     committeeDecision:'conditions',finalSelected:['A'],name:'Игрок'}));
   },KEY);
   await page.reload();
   const metrics=await page.evaluate(()=>{
    const root=document.querySelector('.s05-notice-scene'),
     note=root?.querySelector('.s05-tablet-notice'),
     portrait=root?.querySelector('.game-dialogue__character'),
     panel=root?.querySelector('.game-dialogue__panel');
    const r=x=>x.getBoundingClientRect();
    const n=r(note),c=r(portrait),p=r(panel);
    return {notice:{left:n.left,right:n.right,top:n.top,bottom:n.bottom,width:n.width,height:n.height,
      client:note.clientHeight,scroll:note.scrollHeight,overflow:getComputedStyle(note).overflowY},
      portrait:{top:c.top,bottom:c.bottom,left:c.left,right:c.right},panel:{top:p.top,bottom:p.bottom},
      viewportWidth:innerWidth,viewportHeight:innerHeight,
      scrollX:document.documentElement.scrollWidth-innerWidth,
      text:note.innerText};
   });
   assert.ok(metrics.text.includes('Производственное уведомление'));
   assert.ok(metrics.text.includes('З-214'));
   if(width<=720){
    assert.ok(metrics.notice.width>=width*.9,
     'mobile alert should use full screen width '+width+'x'+height+' '+JSON.stringify(metrics));
    assert.ok(metrics.notice.scroll<=metrics.notice.client+2,
     'mobile alert should show complete text with NO inner scrolling '+width+'x'+height+' '+JSON.stringify(metrics));
    assert.equal(metrics.notice.overflow,'visible','mobile alert must not scroll internally');
    assert.ok(metrics.notice.bottom<=metrics.portrait.top+2,
     'alert overlaps Gromov portrait '+width+'x'+height+' '+JSON.stringify(metrics));
    assert.ok(metrics.notice.bottom<metrics.panel.top,
     'alert overlaps dialogue '+width+'x'+height+' '+JSON.stringify(metrics));
   }
   assert.ok(metrics.scrollX<=3,'horizontal scrolling at '+width+'x'+height);
   assert.deepEqual(errors,[],'script errors '+width+'x'+height);
   await page.screenshot({path:'tests/screenshot-s05-alert-wide-'+width+'x'+height+'.png'});
   console.log('PASS wide mobile S05 notice '+width+'x'+height);
   await page.close();
  }
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exit(1)});
