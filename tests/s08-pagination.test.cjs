'use strict';
/* S08 no-scroll pagination regression: node --test tests/s08-pagination.test.cjs */
const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../integration/s06-s08/s06_s08_module.js');
const P=require('../s08-pagination.js');
global.window={CEH_S06_S08_PREP:M,CEH_S08_PAGES:P,innerWidth:320,innerHeight:568};
require('../data.js');
require('../s06-s08-ui.js');
const data=window.CEH_DATA;
const good=['confirmed','confirmed','check','check','confirmed'];
function state(ids=['A','J']){
 return {scene:'S08',name:'Игрок СПО',hypothesis:'machine',priority:'losses',initialSelected:['B','J'],
  finalSelected:ids,eduStep:5,committeeDecision:'conditions',s08View:'causes',s08PageIndex:0,
  s0608:{docsOpened:['route','grinding','shipping'],answers:good,
   firstSubmitted:{answers:['confirmed','confirmed','confirmed','check','confirmed']},
   finalConclusion:{answers:good},s07Decision:'priority'}};
}
function history(s){return {
  hypothesis:s.hypothesis,priority:s.priority,goals:data.goals,initiatives:data.initiatives,
  initialSelected:s.initialSelected,finalSelected:s.finalSelected,committeeDecision:s.committeeDecision,edu01Complete:true
};}
const display=s=>window.CEH_ORDER_UI.render(s,data,'',(_bg,html)=>html);
test('Exactly two main views, with Back/Next inside both',()=>{
 const s=state();
 assert.match(display({...s,s08View:'summary'}),/data-act="s08SummaryGo"/);
 assert.match(display(s),/data-act="s08PageGo"/);
 assert.doesNotMatch(display(s),/s08-chain-parts|s08-report-scroll/);
 assert.match(display(s),/data-act="s08ReportOpen"/);
});
test('Every selected initiative is a separate readable step (all A–M)',()=>{
 const ids=data.initiatives.map(x=>x.id),s=state(ids);
 const vm=M.buildS08ViewModel(s.s0608,history(s)),pages=P.causes(vm,320,568);
 const initiativePages=pages.filter(x=>x.type==='initiative');
 assert.equal(initiativePages.length,13);
 for(const [i,x] of initiativePages.entries()){
  const html=display({...s,s08PageIndex:pages.indexOf(x)});
  assert.match(html,new RegExp('Мероприятие '+(i+1)+' из 13'));
  assert.ok(html.includes(x.item.title));
  assert.ok(html.includes(x.item.conditions));
  assert.ok(html.includes(x.item.risks));
  assert.ok(html.includes(x.item.not));
 }
});
test('Three causal chains + four EDU-01 explanations + final takeaway are complete',()=>{
 const s=state(['D','F','J']), vm=M.buildS08ViewModel(s.s0608,history(s));
 const pages=P.causes(vm,320,568);
 assert.deepEqual([...new Set(pages.filter(x=>x.type==='statement').map(x=>x.section))],[1,2,3]);
 assert.equal(new Set(pages.filter(x=>x.type==='edu').flatMap(x=>x.blocks.map(b=>b.stage))).size,4);
 assert.equal(pages.filter(x=>x.type==='takeaway').length,1);
 const final=display({...s,s08PageIndex:pages.length-1});
 assert.match(final,/Главное, что стоит запомнить/);
 assert.equal((final.match(/class="s08-takeaway-list"/g)||[]).length,1);
 for(const [i,chain] of vm.chains.entries()){
  const text=pages.filter(x=>x.type==='statement'&&x.section===i+1).map(x=>x.text).join(' ');
  for(const part of chain.parts)assert.ok(text.includes(part),'Lost chain text '+i);
 }
});
test('Teacher report keeps all 8 sections, paginates rather than scrolling',()=>{
 const s=state(data.initiatives.map(x=>x.id)),vm=M.buildS08ViewModel(s.s0608,history(s));
 const sections=M.buildS08(s.s0608,history(s)),pages=P.report(sections,320,568);
 assert.equal(sections.length,8);assert.ok(pages.length>8);
 for(const [i,section] of sections.entries()){
  const text=pages.flatMap(x=>x.entries).filter(x=>x.section===i+1).map(x=>x.text).join(' ');
  assert.equal(text,section.body.replace(/\s+/g,' ').trim(),'Section '+(i+1)+' text lost');
 }
 const html=display({...s,s08ReportOpen:true,s08ReportPage:pages.length-1});
 assert.match(html,/s08-report-page/);
 assert.match(html,/data-act="s08ReportGo"/);
 assert.doesNotMatch(html,/s08-report-scroll/);
});
test('Part lengths keep small screen readable and do not silently cut words',()=>{
 const text='проверить сроки, документы и загрузку оборудования '.repeat(18).trim();
 for(const limit of [170,240,670]){
  const parts=P.chunks(text,limit);
  assert.ok(parts.every(x=>x.length<=limit));
  assert.equal(parts.join(' '),text);
 }
});
test('Old saved UI indices safely clamp instead of crashing',()=>{
 const s=state();
 assert.match(display({...s,s08PageIndex:999}),/s08-paged-card/);
 assert.match(display({...s,s08PageIndex:undefined,s08ReportPage:undefined,s08ReportOpen:true}),/s08-report-page/);
});
test('No pagination CSS scroll traps or accidental global overflow',()=>{
 const css=require('node:fs').readFileSync(require('node:path').join(__dirname,'../s06-s08-ui.css'),'utf8');
 assert.match(css,/S08 · Page-by-page reading/);
 assert.match(css,/body:has\(#app \.s08-screen\)\{height:100dvh;overflow:hidden\}/);
 assert.match(css,/#app \.s08-report-page\{[\s\S]*?overflow:hidden/);
});


test('Semantic pages keep the original chain paragraphs and EDU-01 task text exactly',()=>{
 const s=state(['D','F','J']);
 const vm=M.buildS08ViewModel(s.s0608,history(s));
 for(const [i,chain] of vm.chains.entries()){
  const blocks=P.causes(vm,390,844).filter(x=>x.type==='statement'&&x.section===i+1)
   .flatMap(x=>x.blocks||[{text:x.text}]);
  assert.equal(blocks.map(x=>x.text).join(' '),chain.parts.join(' ').replace(/\s+/g,' ').trim(),
   'chain '+(i+1)+' must not lose text');
 }
 const edu=P.causes(vm,390,844).filter(x=>x.type==='edu').flatMap(x=>x.blocks);
 assert.equal(edu.map(x=>x.text).join(' '),vm.eduDetails.join(' ').replace(/\s+/g,' ').trim());
});
test('Sentence boundary semantics do not split compound initiative markers',()=>{
 const sentence='Нестабильные поставки действительно прерывают операции. Прежде чем менять график, проверь причины.';
 assert.deepEqual(P.semanticSentences(sentence),[
  'Нестабильные поставки действительно прерывают операции.',
  'Прежде чем менять график, проверь причины.'
 ]);
 const measure='A «SMED»: условие — устойчивый процесс; риск — срыв; не решает автоматически — нехватку мощности.';
 assert.deepEqual(P.semanticSentences(measure),[measure]);
});
test('Semantic pages reduce clicks for a typical two-measure portfolio',()=>{
 const s=state(['A','J']), vm=M.buildS08ViewModel(s.s0608,history(s));
 const pages=P.causes(vm,390,844);
 assert.ok(pages.length>=5&&pages.length<=12,'Expected compact but readable narrative; got '+pages.length);
 assert.equal(pages.filter(x=>x.type==='initiative').length,2);
 const sections=M.buildS08(s.s0608,history(s)),report=P.report(sections,390,844);
 assert.ok(report.length>=4&&report.length<=13,'Report must be grouped; got '+report.length);
 assert.equal(new Set(report.flatMap(x=>x.entries.map(e=>e.section))).size,8);
});
