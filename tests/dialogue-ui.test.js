/* Run from repository root: node tests/dialogue-ui.test.js */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
new vm.Script(read('app.js'),{filename:'app.js'});
const html=read('index.html');
const appSource=read('app.js');
const appVer=html.match(/app\.js\?v=([^"']+)/)?.[1];
const styleVer=html.match(/style\.css\?v=([^"']+)/)?.[1];
assert.ok(appVer&&styleVer,'app and style files must have cache-busting versions');
assert.equal(appVer,styleVer,'app/CSS versions must be synchronised to prevent stale mobile cache');
assert.notEqual(appVer,'20261111-mat1','must not use the old pre-modal app');
assert.match(appSource,/showEduFeedback\('Вы неправильно рассчитали\. Попробуйте ещё раз\.'\)/,
  'EDU-01 wrong calculation must open in-game dialog');
assert.doesNotMatch(appSource,/window\.alert\('Вы неправильно рассчитали/,
  'EDU-01 must never use native browser alert');
new vm.Script(read('logic.js'),{filename:'logic.js'});
const window={innerWidth:390,innerHeight:844,visualViewport:{width:390,height:844}};
const ctx={window};
vm.runInNewContext(read('data.js'),ctx,{filename:'data.js'});
vm.runInNewContext(read('dialogue-ui.js'),ctx,{filename:'dialogue-ui.js'});
const D=window.CEH_DIALOGUE,data=window.CEH_DATA;
assert.ok(D&&data);
const cases=[
 ...data.intro.map((t,i)=>['intro'+i,t.replace('[Имя]','Анна')]),
 ...data.questions.map(q=>['question-'+q.id,q.answer]),
 ...data.hypotheses.map(h=>['hypothesis-'+h.id,h.reply]),
 ...data.people.map(p=>['specialist-'+p.id,p.speech+'\n\nВопрос: '+p.question+'\nОтвет: '+p.reply])
];
for(const [width,height] of [[1920,1080],[1366,768],[1024,768],[390,844],[375,667],[390,600]]){
 window.innerWidth=width;window.innerHeight=height;window.visualViewport.width=width;window.visualViewport.height=height;
 for(const [key,text] of cases){
   let html=D.render({key:key+':'+width+'x'+height,speaker:'Ирина Соколова',role:'Главный технолог',text,finish:'<button data-act="next">Далее</button>'});
   const total=D.getReadState().total;
   assert.equal(D.getReadState().joined,text,'lost content: '+key+' at '+width+'x'+height);
   assert.ok(total>=1&&total<100);
   for(let i=0;i<total-1;i++){
     assert.match(html,/data-act="dlgMore"/,'missing Read More for '+key);
     assert.doesNotMatch(html,/data-act="next"/,'premature Next for '+key);
     html=D.move('dlgMore');
     assert.equal(D.getReadState().page,i+1);
   }
   assert.match(html,/data-act="next"/,'missing final Next for '+key);
   if(total>1){
     D.move('dlgBack');assert.equal(D.getReadState().page,total-2);
     D.move('dlgStart');assert.equal(D.getReadState().page,0);
     assert.equal(D.getReadState().joined,text);
   }
 }
}
console.log('PASS: 6 viewport profiles x '+cases.length+' dialogue paths; no text loss or early scenario advance.');