/* S06–S08 renderer. Uses the approved preparatory logic module and current game components. */
(function(){
'use strict';
const M=window.CEH_S06_S08_PREP;
function e(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));}
function button(text,act,id='',main=false,disabled=false){
 return '<button type="button" data-act="'+e(act)+'" data-id="'+e(id)+'" class="btn '+(main?'primary':'')+'" '+(disabled?'disabled':'')+'>'+e(text)+'</button>';
}
function docList(state){
 const st=M.clean(state.s0608);
 return '<div class="order-doc-list">'+M.DOCUMENTS.map((x,i)=>
 '<article class="order-doc-card '+(st.docsOpened.includes(x.id)?'order-doc-card--read':'order-doc-card--unread')+'"><span class="order-doc-icon" aria-hidden="true">'+['▤','⚙','▣'][i]+'</span><div><h3>'+e(x.title)+'</h3><small class="order-doc-status">'+(st.docsOpened.includes(x.id)?'✓ Изучено':'● Не изучено')+'</small></div>'+button('Открыть','orderDoc',x.id)+'</article>'
 ).join('')+'</div>';
}
function viewDocument(state){
 const doc=M.DOCUMENTS.find(x=>x.id===state.s06OpenDoc);
 if(!doc)return '';
 return '<section class="order-paper" aria-label="Открытый производственный документ" tabindex="0">'+
  '<div class="order-paper-top"><span>ЦЕХ 404 · Производственный документооборот</span>'+button('Закрыть документ','orderCloseDoc')+'</div><h2>'+e(doc.title)+'</h2>'+
  '<div class="order-paper__body">'+e(doc.body)+'</div></section>';
}
function renderS06(s){
 const z=M.clean(s.s0608),view=s.s06Page||'documents';

 let h='<div class="glass order-screen"><div class="order-kicker">ГЛАВА 01 · ПРОИЗВОДСТВЕННЫЙ ЗАКАЗ</div><h1>Заказ под угрозой · З-214</h1>';
 if(view==='documents'){
  h+='<p>Плановая отгрузка — 13.11.2026, 16:00. Прежде чем делать выводы, изучи три документа. Время ситуации: <strong>'+e(M.GAME_CLOCK)+'</strong>.</p>';
  h+='<p class="order-progress">Изучено документов: <b>'+z.docsOpened.length+' / 3</b></p>';
  h+='<div class="order-docs-layout"><div class="order-docs-layout__list">'+docList(s)+
   button('К анализу','orderTask','',true,z.docsOpened.length!==3)+'</div>';
  h+=s.s06OpenDoc?viewDocument(s):'<div class="order-paper-placeholder" aria-hidden="true">Выбери документ, чтобы открыть вертикальный лист А4.</div>';
  h+='</div>';
 }else if(view==='task'){
  h+='<h2>Проверка профессиональных выводов</h2><p>Отметь, подтверждается ли каждое утверждение документами. Если доказательств недостаточно, выбирай «Требует проверки».</p>';
  h+='<div class="order-statements">'+M.STATEMENTS.map((sentence,i)=>{
   const chosen=z.answers[i];
   return '<fieldset class="order-statement"><legend>'+(i+1)+'. '+e(sentence)+'</legend>'+
    ['confirmed','check'].map((value)=>'<label><input data-order-answer="'+i+'" type="radio" name="order-answer-'+i+'" value="'+value+'" '+(chosen===value?'checked':'')+' '+(z.finalConclusion?'disabled':'')+'><span>'+(value==='confirmed'?'Подтверждено':'Требует проверки')+'</span></label>').join('')+'</fieldset>';
  }).join('')+'</div>';
  if(s.s06Message)h+='<div class="order-feedback" role="status">'+e(s.s06Message)+'</div>';
  if(z.lastSubmission&&!z.lastSubmission.correct){
   h+='<div class="order-feedback order-feedback--error"><h3>Что стоит пересмотреть</h3><ul>'+z.lastSubmission.errors.map(x=>'<li>'+e(x)+'</li>').join('')+'</ul></div>';
  }
  h+=button('Посмотреть документы','orderDocs');
  h+=button('Проверить заключение','orderSubmit','',true,z.answers.some(x=>x===null));
 }else if(view==='result'){
  h+='<h2>Заключение принято</h2><p>Ты отличил подтверждённые факты от предположений. Причина задержки пока неизвестна — принимать решение следует с учётом ограничений и дополнительных проверок.</p>';
  h+='<p>Первую полностью отправленную попытку сохранили для итогового отчёта.</p>';
  h+=button('Оперативное решение','orderToS07','',true);
 }
 return h+'</div>';
}
function renderS07(s){
 const z=M.clean(s.s0608);
 let h='<div class="glass order-screen"><div class="order-kicker">ЗАКАЗ З-214 · ОПЕРАТИВНОЕ РЕШЕНИЕ</div><h1>Что делать с задержкой?</h1>';
 h+='<p>Приоритет — сократить риск задержки, не нарушая интересы других заказов, безопасность и требования к организации работ.</p>';
 if(s.s07Page!=='result'){
  h+='<div class="order-options">'+M.S07_OPTIONS.map(o=>'<article class="order-option"><h2>'+e(o.title)+'</h2><p><b>Потенциальная польза:</b> '+e(o.benefit)+'</p><p><b>Ограничения:</b> '+e(o.limitations)+'</p>'+button('Выбрать действие','orderChoose',o.id,true)+'</article>').join('')+'</div>';
 }else{
  const o=M.S07_OPTIONS.find(x=>x.id===z.s07Decision);
  if(o){h+='<section class="order-feedback"><h2>Твоё решение</h2><p>'+e(o.title)+'</p><p>'+e(o.benefit)+'</p><p>'+e(o.limitations)+'</p><p>Это предложение по проверке и организации работ. Изменение очереди и выполнение заказа ещё не подтверждены.</p></section>'+button('К итоговому отчёту','orderToS08','',true);}
 }
 return h+'</div>';
}
/* S08 F6: measure the three mobile summary cards before choosing a layout.
   Approved text, saved game state and desktop presentation are unchanged. */
function fitS08Summary(){
 const screen=document.querySelector('#app .s08-screen[data-s08-view="summary"]');
 if(!screen)return;
 const grid=screen.querySelector('.s08-summary-grid'),nav=screen.querySelector('.s08-summary-nav');
 const cards=grid?[...grid.querySelectorAll('.s08-summary-card')]:[];
 if(!grid||!nav||cards.length!==3)return;
 if(window.innerWidth>720){
  delete screen.dataset.s08SummaryLayout;
  delete screen.dataset.s08SummaryPage;
  return;
 }
 screen.dataset.s08SummaryLayout='probe';
 const gap=Number.parseFloat(getComputedStyle(grid).rowGap)||8;
 const heights=cards.map(card=>Math.max(card.scrollHeight,card.getBoundingClientRect().height));
 const available=grid.clientHeight;
 const navHeight=nav.getBoundingClientRect().height;
 let layout='single';
 if(heights.reduce((sum,v)=>sum+v,0)+2*gap<=available+navHeight-10){
  layout='all';
 }else if(Math.max(heights[0]+heights[1]+gap,heights[2])<=available-8){
  layout='pair';
 }
 screen.dataset.s08SummaryLayout=layout;
 const selected=Number(grid.dataset.summaryIndex)||0;
 const page=layout==='pair'&&selected>=2?1:0;
 screen.dataset.s08SummaryPage=String(page);
 const buttons=[...nav.querySelectorAll('[data-act="s08SummaryGo"]')];
 const status=nav.querySelector('span');
 if(layout==='pair'&&buttons.length===2){
  buttons[0].dataset.id='0';buttons[0].disabled=page===0;
  buttons[1].dataset.id='2';buttons[1].disabled=page===1;
  if(status)status.textContent=page===0?'Карточки 1–2 из 3':'Карточка 3 из 3';
 }
}
function renderS08(s,data){
 // Two approved final screens. Each screen has self-contained pages instead of scrolling.
 const history={
  hypothesis:s.hypothesis,priority:s.priority,
  initialPriority:(data.goals||[]).find(x=>x.id===s.priority)?.label??null,
  goals:data.goals||[],initiatives:data.initiatives||[],
  initialSelected:s.initialSelected,finalSelected:s.finalSelected,
  finalCost:Array.isArray(s.finalSelected)?s.finalSelected.reduce((sum,id)=>sum+((data.initiatives||[]).find(x=>x.id===id)?.cost||0),0):null,
  edu01Complete:Array.isArray(s.finalSelected)&&s.eduStep>=4,
  edu01Result:Array.isArray(s.finalSelected)&&s.eduStep>=4?'Проверка документов ОТК пройдена; причина отклонения одной детали не подтверждена.':null,
  committeeDecision:s.committeeDecision
 };
 const model=M.buildS08ViewModel(s.s0608,history);
 const report=M.buildS08(s.s0608,history);
 const P=window.CEH_S08_PAGES;
 const viewing=s.s08View==='causes'?'causes':'summary';
 let h='<div class="glass order-screen s08-screen" data-s08-view="'+e(viewing)+'">';
 if(!model||!P){
  return h+'<div class="order-kicker">ЭФФЕКТ ДОМИНО</div><h1>Итог пока недоступен</h1>'+
   '<p>Не удалось загрузить итог. Обнови страницу и проверь, что заключение по З-214 принято.</p></div>';
 }
 if(viewing==='summary'){
  const index=Number.isInteger(s.s08SummaryPage)?Math.max(0,Math.min(model.summary.length-1,s.s08SummaryPage)):0;
  h+='<div class="order-kicker">ЭФФЕКТ ДОМИНО · ТВОЙ ИТОГ</div><h1>Твой итог</h1>';
  h+='<p class="s08-intro">'+(s.name?'Игрок: '+e(s.name)+'. ':'')+'Что ты предложил и какие выводы проверил по документам.</p>';
  h+='<div class="s08-summary-grid" data-summary-index="'+index+'">'+model.summary.map((x,i)=>
   '<section class="s08-summary-card" data-s08-selected="'+(i===index?'yes':'no')+'" aria-label="'+e(x.title)+'"><span class="s08-step">'+(i+1)+'</span><div><h2>'+e(x.title)+'</h2><p>'+e(x.text)+'</p></div></section>'
  ).join('')+'</div>';
  h+='<nav class="s08-summary-nav" aria-label="Карточки твоего итога">'+
   button('Назад','s08SummaryGo',String(index-1),false,index===0)+
   '<span>Карточка '+(index+1)+' из '+model.summary.length+'</span>'+
   button('Далее','s08SummaryGo',String(index+1),false,index===model.summary.length-1)+'</nav>';
  h+='<div class="s08-footer">'+button('Посмотреть последствия решений','s08ShowCauses','',true)+'</div>';
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(fitS08Summary);
 }else{
  const width=window.innerWidth||390,height=window.innerHeight||844;
  const pages=P.causes(model,width,height);
  const index=Number.isInteger(s.s08PageIndex)?Math.max(0,Math.min(pages.length-1,s.s08PageIndex)):0;
  const page=pages[index];
  h+='<div class="order-kicker">ЭФФЕКТ ДОМИНО · ПОСЛЕДСТВИЯ РЕШЕНИЙ</div><h1>Последствия твоих решений</h1>';
  h+='<div class="s08-chain"><div class="s08-chain-head"><h2>'+e(page.title)+'</h2><span class="s08-page">'+(index+1)+' / '+pages.length+'</span></div>';
  const multiNarrative=(page.type==='statement'||page.type==='edu')&&Array.isArray(page.blocks)&&page.blocks.length>1;
  h+='<article class="s08-paged-card" aria-label="'+e(page.stage)+'"><span class="s08-page-stage">'+e(multiNarrative?'Этапы решения':page.stage)+'</span>';
  if(page.label)h+='<small class="s08-page-part">'+e(page.label)+'</small>';
  if(page.type==='statement'||page.type==='edu'){
   if(multiNarrative){
    h+='<div class="s08-narrative-list">'+page.blocks.map(b=>
     '<section class="s08-narrative-entry"><h3>'+e(b.stage)+'</h3><p class="s08-story-text">'+e(b.text)+'</p></section>'
    ).join('')+'</div>';
   }else h+='<p class="s08-story-text">'+e(page.text)+'</p>';
  }else if(page.type==='initiative'){
   const x=page.item;
   h+='<h3>'+e(x.id)+' · '+e(x.title)+' <small>'+e(x.cost)+' млн у.е.</small></h3>'+
    '<div class="s08-initiative-fields">'+
    '<div><strong>Когда может помочь</strong><p>'+e(x.conditions)+'</p></div>'+
    '<div><strong>Какой риск</strong><p>'+e(x.risks)+'</p></div>'+
    '<div><strong>Не решает автоматически</strong><p>'+e(x.not)+'</p></div>'+
    '</div>';
  }else if(page.type==='initiativeGroup'){
   h+='<div class="s08-initiative-group">'+page.items.map(x=>
    '<section class="s08-initiative-compact" aria-label="Мероприятие '+e(x.id)+'">'+
    '<h3>'+e(x.id)+' · '+e(x.title)+' <small>'+e(x.cost)+' млн у.е.</small></h3>'+
    '<div class="s08-initiative-fields">'+
    '<div><strong>Когда может помочь</strong><p>'+e(x.conditions)+'</p></div>'+
    '<div><strong>Какой риск</strong><p>'+e(x.risks)+'</p></div>'+
    '<div><strong>Не решает автоматически</strong><p>'+e(x.not)+'</p></div>'+
    '</div></section>'
   ).join('')+'</div>';
  }else if(page.type==='takeaway'){
   h+='<ul class="s08-takeaway-list">'+page.items.map(x=>'<li>'+e(x)+'</li>').join('')+'</ul>';
  }
  h+='</article></div>';
  h+='<nav class="s08-chain-nav" aria-label="Переключение карточек последствий">'+
   button('Назад','s08PageGo',String(index-1),false,index===0)+
   button('Далее','s08PageGo',String(index+1),false,index===pages.length-1)+'</nav>';
  h+='<div class="s08-footer s08-footer--two">'+button('К твоему итогу','s08Back')+
   button('Подробный отчёт','s08ReportOpen')+'</div>';
  if(s.s08ReportOpen&&report){
   const reportPages=P.report(report,width,height);
   const reportIndex=Number.isInteger(s.s08ReportPage)?Math.max(0,Math.min(reportPages.length-1,s.s08ReportPage)):0;
   const item=reportPages[reportIndex];
   h+='<div class="s08-report-overlay"><section class="s08-report-modal" role="dialog" aria-modal="true" aria-label="Подробный отчёт" tabindex="-1">'+
    '<div class="s08-report-head"><h2>Подробный отчёт</h2>'+button('Закрыть','s08ReportClose')+'</div>'+
    '<article class="s08-report-page" aria-label="'+e(item.title)+'"><span class="s08-report-counter">'+
    (item.entries.length>1?'Разделы '+item.entries[0].section+'–'+item.entries[item.entries.length-1].section+' из '+report.length:'Раздел '+item.section+' из '+report.length)+
    ' · Страница '+(reportIndex+1)+' из '+reportPages.length+'</span>'+
    '<div class="s08-report-sections">'+item.entries.map(part=>
     '<section class="s08-report-section"><h3>'+e(part.title)+'</h3>'+
     (part.partTotal>1?'<small>Часть '+part.part+' из '+part.partTotal+'</small>':'')+
     '<p>'+e(part.text)+'</p></section>'
    ).join('')+'</div></article>'+
    '<nav class="s08-report-nav" aria-label="Страницы подробного отчёта">'+
    button('Назад','s08ReportGo',String(reportIndex-1),false,reportIndex===0)+
    button('Далее','s08ReportGo',String(reportIndex+1),false,reportIndex===reportPages.length-1)+
    '</nav></section></div>';
  }
 }
 return h+'</div>';
}
function render(s,data,bg,frame,chapterDialogue,portrait){
 if(s.scene==='S06'&&!s.s06IntroSeen){
  const message=(s.name?s.name+', ':'')+'вот данные по заказу З-214. Нам нужно разобраться, насколько серьёзно отклонение от графика и что действительно известно о ситуации. Изучи документы и подготовь оперативное заключение.';
  const content=chapterDialogue('S06:intro:gromov','Андрей Громов','Начальник производства',message,portrait,button('Изучить документы заказа','s06ReadDocs','',true));
  return frame(bg,content,'dialogue-stage dialogue-stage--shop');
 }
 const content=s.scene==='S06'?renderS06(s):s.scene==='S07'?renderS07(s):renderS08(s,data);
 return frame(bg,content,'order-stage');
}
window.CEH_ORDER_UI={render,fitS08Summary};
if(typeof window.addEventListener==='function'&&typeof requestAnimationFrame==='function')window.addEventListener('resize',()=>requestAnimationFrame(fitS08Summary));
})();
