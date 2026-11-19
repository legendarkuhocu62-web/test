'use strict';
const assert=require('node:assert/strict');
const m=require('./s06_s08_module.js');
const ids=m.DOCUMENTS.map(x=>x.id);
for(const perm of [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]]){
 let s=m.initial();
 assert.equal(m.canStart(s),false);
 for(let i=0;i<3;i++){
  s=m.openDocument(s,ids[perm[i]]);
  assert.equal(m.canStart(s),i===2);
 }
 assert.deepEqual(m.materialsForExistingPanel(s).length,3);
 assert.equal(m.submit(s).accepted,false,'blank submission should be blocked');
 assert.equal(m.submit(s).state.firstSubmitted,null,'blank submission must not be first attempt');
 s=m.setAnswer(s,0,'confirmed');
 assert.equal(m.submit(s).state.firstSubmitted,null,'1/5 incomplete cannot be first attempt');
 ['confirmed','confirmed','check','check','check'].forEach((v,i)=>s=m.setAnswer(s,i,v));
 const wrong=m.submit(s);
 assert.equal(wrong.accepted,false);
 assert.equal(wrong.state.firstSubmitted.correct,false);
 assert.equal(wrong.feedback.length,1);
 s=m.setAnswer(wrong.state,4,'confirmed');
 const right=m.submit(s);
 assert.equal(right.accepted,true);
 assert.equal(right.state.firstSubmitted.correct,false,'first full attempt must survive correction');
 assert.equal(right.state.finalConclusion.correct,true);
 assert.equal(m.canMoveToS07(right.state),true);
 assert.equal(m.canMoveToS08(right.state),false);
 s=m.selectS07(right.state,'priority');
 assert.equal(m.canMoveToS08(s),true);
 const blocks=m.buildS08(s,{initialPriority:'Потери',initialSelected:['A'],finalSelected:['A','C'],edu01Result:'Расчёт выполнен',s05:'Отвечал на вопрос об обосновании',finalCost:75});
 assert.equal(blocks.length,8);
 assert.match(blocks[5].body,/исправлены/);
 assert.match(blocks[4].body,/обосновании/);
 assert.match(blocks[6].body,/приоритет/);
 assert.ok(!blocks.some(x=>/гарантирован[оа] успеш|заказ выполнен|заказ спасён/i.test(x.body)));
 const restored=m.clean(JSON.parse(JSON.stringify(s)));
 assert.deepEqual(restored,s);
 assert.equal(m.setAnswer(restored,0,'check').answers[0],'confirmed','final answers immutable');
}
{
 let s=m.initial();
 s=m.openDocument(s,'route');s=m.openDocument(s,'grinding');
 assert.equal(m.canStart(s),false);
 assert.deepEqual(m.setAnswer(s,0,'confirmed').answers,[null,null,null,null,null],'cannot skip doc gate');
 assert.equal(m.selectS07(s,'extra').s07Decision,null,'cannot skip S06 conclusion');
 assert.equal(m.buildS08(s),null,'cannot skip S07');
}
console.log('PASS: six document orders, 0/1/2/3 gating, incomplete form, failed first attempt, correction, S07 and S08, persistence');

// S08 content and persistence matrix

{
 const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
 const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../data.js'),'utf8'),ctx);
 const data=ctx.window.CEH_DATA;
 assert.equal(data.initiatives.length,13);
 const correct=['confirmed','confirmed','check','check','confirmed'];
 const wrong=['confirmed','check','check','check','check'];
 const scenarios=[];
 for(const committeeDecision of ['conditions','confidence','stage']){
  for(const s07Decision of ['diagnose','priority','extra']){
   for(const mistake of [false,true]){
    for(const revised of [false,true]){
     const st={
      ...m.initial(),docsOpened:['route','grinding','shipping'],
      firstSubmitted:{answers:mistake?wrong:correct},
      finalConclusion:{answers:correct},s07Decision
     };
     const history={hypothesis:revised?'machine':'insufficient',priority:'losses',
      goals:data.goals,initiatives:data.initiatives,
      initialSelected:['A','J'],
      finalSelected:revised?['D','F','J']:['A','J'],
      committeeDecision,edu01Complete:true};
     const model=m.buildS08ViewModel(st,history);
     assert.ok(model,'complete state must render');
     assert.equal(model.summary.length,3);
     assert.equal(model.chains.length,3);
     assert.equal(model.takeaway.length,3);
     assert.equal(model.changed,revised);
     assert.deepEqual(model.added,revised?['D','F']:[]);
     assert.deepEqual(model.removed,revised?['A']:[]);
     assert.match(model.chains[1].parts.join(' '),/Комитет/);
     assert.match(model.chains[2].parts.join(' '),/З-214/);
     const all=JSON.stringify(model);
     assert.ok(!/ты спас|ты переставил|ты внедрил|заказ выполнен|срок отгрузки подтверждён/i.test(all),
      'No fictitious shop-floor outcomes allowed');
     assert.match(all,mistake?/исправил/:/С первого раза/);
     const detailed=m.buildS08(st,history);
     assert.equal(detailed.length,8);
     assert.match(detailed[4].body,/Комитет/);
     assert.match(detailed[1].body,/«/);
     scenarios.push(all);
    }
   }
  }
 }
 assert.equal(scenarios.length,36);
 for(const item of data.initiatives){
  const st={...m.initial(),docsOpened:['route','grinding','shipping'],
   firstSubmitted:{answers:correct},finalConclusion:{answers:correct},s07Decision:'diagnose'};
  const history={hypothesis:'quality',priority:'quality',goals:data.goals,
   initiatives:data.initiatives,initialSelected:[item.id],finalSelected:[item.id],
   committeeDecision:'conditions',edu01Complete:true};
  const model=m.buildS08ViewModel(st,history);
  assert.ok(JSON.stringify(model).includes('«'+item.title+'»'));
  assert.ok(model.chains[0].parts.some(x=>x.includes(item.conditions.toLowerCase())));
  assert.ok(model.chains[0].parts.some(x=>x.includes(item.risks)));
 }
 const old={...m.initial(),docsOpened:['route','grinding','shipping'],
  finalConclusion:{answers:correct},s07Decision:'extra'};
 const missing=m.buildS08ViewModel(old,{initiatives:data.initiatives,goals:data.goals});
 assert.ok(missing);
 assert.match(JSON.stringify(missing),/первой попытке нет/);
 assert.match(JSON.stringify(missing),/не сохранил/);
 const legacy=m.buildS08(old,{initiatives:data.initiatives,goals:data.goals});
 assert.equal(legacy.length,8);
 assert.ok(!legacy.some(x=>/Не переданы утверждённые данные|действующей S05/i.test(x.body)));
 console.log('PASS S08: 36 decision combinations, A–M conditions/risks, 8 teacher sections, legacy fallbacks');
}
