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
 assert.ok(!blocks.some(x=>/гарантирован[оа] успеш|внедрены|заказ выполнен/i.test(x.body)));
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
