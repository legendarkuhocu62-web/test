'use strict';
/* S08 audit regression — run with: node --test tests/s08-audit-regression-20261120.cjs */
const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('../integration/s06-s08/s06_s08_module.js');
global.window={CEH_S06_S08_PREP:M};
require('../data.js');
require('../s06-s08-ui.js');
const data=window.CEH_DATA;
const good=['confirmed','confirmed','check','check','confirmed'];
const wrong=['confirmed','confirmed','confirmed','check','confirmed'];
const make=(committee='conditions',order='priority',first=wrong,ids=['D','F','J'])=>({
 scene:'S08',name:'Студент',hypothesis:'machine',priority:'losses',
 initialSelected:['A','J'],finalSelected:ids,eduStep:5,
 committeeDecision:committee,s08View:'causes',s08ChainIndex:0,
 s0608:{docsOpened:['route','grinding','shipping'],answers:good,
 firstSubmitted:{answers:first},finalConclusion:{answers:good},s07Decision:order}
});
const history=s=>({initiatives:data.initiatives,goals:data.goals,hypothesis:s.hypothesis,
 priority:s.priority,initialSelected:s.initialSelected,finalSelected:s.finalSelected,
 edu01Complete:s.eduStep>=4,committeeDecision:s.committeeDecision});
const display=s=>window.CEH_ORDER_UI.render(s,data,'',(_bg,html)=>html);
test('All 13 initiatives are explained in the S08 first chain',()=>{
 const s=make('conditions','priority',good,data.initiatives.map(x=>x.id));
 const vm=M.buildS08ViewModel(s.s0608,history(s));
 const html=display(s);
 assert.equal(vm.initiativeDetails.length,13);
 assert.equal((html.match(/class="s08-initiative-item"/g)||[]).length,13);
 for(const x of vm.initiativeDetails){
  assert.ok(x.conditions&&x.risks&&x.not);
  assert.ok(html.includes(x.title));
 }
});
test('Portfolios show all added and removed initiatives and retain budget math',()=>{
 const s=make(); const vm=M.buildS08ViewModel(s.s0608,history(s));
 assert.deepEqual(vm.added,['D','F']);
 assert.deepEqual(vm.removed,['A']);
 assert.match(vm.changeText,/Контроль качества в процессе/);
 assert.match(vm.changeText,/SMED/);
 const report=M.buildS08(s.s0608,history(s));
 assert.equal(report.length,8);
 assert.match(report[3].body,/SMED/);
 assert.match(report[1].body,/75 млн/);
 assert.match(report[1].body,/55 млн/);
});
test('EDU-01 is four tasks, without inventing answers before the saved progress',()=>{
 const s=make(); const vm=M.buildS08ViewModel(s.s0608,history(s));
 assert.equal(vm.eduDetails.length,4);
 assert.match(vm.eduDetails.join(' '),/19,95/);
 assert.match(vm.eduDetails.join(' '),/0,03/);
 assert.match(display({...s,s08ChainIndex:2}),/Что ты проверял в EDU-01/);
});
test('The first incorrect S06 conclusion is explained from evidence, not guessed',()=>{
 const s=make();
 const vm=M.buildS08ViewModel(s.s0608,history(s));
 assert.equal(vm.firstErrors.length,1);
 assert.match(vm.firstErrors[0],/неисправность станка/);
 assert.match(M.buildS08(s.s0608,history(s))[5].body,/неисправность станка/);
});
test('Three committee choices, three S07 choices, two first S06 attempts',()=>{
 let count=0;
 for(const committee of ['conditions','confidence','stage'])
 for(const order of ['diagnose','priority','extra'])
 for(const first of [good,wrong]){
  const s=make(committee,order,first);
  const vm=M.buildS08ViewModel(s.s0608,history(s));
  assert.equal(vm.chains.length,3);
  assert.equal(M.buildS08(s.s0608,history(s)).length,8);
  assert.match(display(s),/Все мероприятия твоего портфеля/);
  assert.ok(vm.committeeDecision===committee);
  count++;
 }
 assert.equal(count,18);
});
test('Older saves: missing committee choice is reported, not invented',()=>{
 const s=make();s.committeeDecision=null;
 const vm=M.buildS08ViewModel(s.s0608,history(s));
 assert.match(vm.chains[1].parts.join(' '),/не сохранился/);
});
test('S08 renders exactly two top-level views and escapes user-controlled text',()=>{
 const s=make(); s.name='<script>alert(1)</script>';
 const html=display({...s,s08View:'summary'});
 assert.doesNotMatch(html,/<script>alert/);
 assert.match(html,/&lt;script&gt;/);
 assert.match(display(s),/Главное, что стоит запомнить/);
 assert.doesNotMatch(display(s),/Какое решение ты хотел бы перепроверить/);
});
test('Only internal causes panel scrolls; no global CSS changes in this patch',()=>{
 const fs=require('node:fs');
 const css=fs.readFileSync(require('node:path').join(__dirname,'../s06-s08-ui.css'),'utf8');
 assert.match(css,/#app \.s08-screen\[data-s08-view="causes"\] \.s08-chain-parts\s*\{[\s\S]*?overflow-y:auto/);
});
