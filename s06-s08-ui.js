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
function renderS08(s,data){
 // All decisions are read from existing game state; S06/S07 renderers are unchanged.
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
 const viewing=s.s08View==='causes'?'causes':'summary';
 const index=Number.isInteger(s.s08ChainIndex)?Math.max(0,Math.min(2,s.s08ChainIndex)):0;
 let h='<div class="glass order-screen s08-screen" data-s08-view="'+e(viewing)+'">';
 if(!model){
  return h+'<div class="order-kicker">ЭФФЕКТ ДОМИНО</div><h1>Итог пока недоступен</h1>'+
   '<p>Сначала заверши заключение по заказу З-214 и выбери оперативное решение.</p></div>';
 }
 if(viewing==='summary'){
  h+='<div class="order-kicker">ЭФФЕКТ ДОМИНО · ТВОЙ ИТОГ</div><h1>Твой итог</h1>';
  h+='<p class="s08-intro">'+(s.name?'Игрок: '+e(s.name)+'. ':'')+'Что ты предложил и какие выводы проверил по документам.</p>';
  h+='<div class="s08-summary-grid">'+model.summary.map((x,i)=>
   '<section class="s08-summary-card" aria-label="'+e(x.title)+'"><span class="s08-step">'+(i+1)+'</span><div><h2>'+e(x.title)+'</h2><p>'+e(x.text)+'</p></div></section>'
  ).join('')+'</div>';
  h+='<div class="s08-footer">'+button('Посмотреть последствия решений','s08ShowCauses','',true)+'</div>';
 }else{
  const chain=model.chains[index];
  h+='<div class="order-kicker">ЭФФЕКТ ДОМИНО · ПОСЛЕДСТВИЯ РЕШЕНИЙ</div><h1>Последствия твоих решений</h1>';
  h+='<div class="s08-chain"><div class="s08-chain-head"><h2>'+e(chain.title)+'</h2><span class="s08-page">'+(index+1)+' / 3</span></div>';
  h+='<div class="s08-chain-parts" tabindex="0" aria-label="Данные и последствия выбранного решения">'+chain.parts.map((p,i)=>
   '<p><span class="s08-chain-marker" aria-hidden="true">'+['1','2','3'][i]+'</span>'+e(p)+'</p>'
  ).join('');
  if(index===0){
   h+='<section class="s08-initiative-details" aria-label="Условия и риски всех выбранных инициатив"><h3>Все мероприятия твоего портфеля</h3>';
   if(!model.initiativeDetails.length)h+='<p>Данные о выбранных мероприятиях не сохранились.</p>';
   else h+='<div class="s08-initiative-list">'+model.initiativeDetails.map(x=>
    '<article class="s08-initiative-item"><h4>'+e(x.id)+' · '+e(x.title)+' <span>'+e(x.cost)+' млн у.е.</span></h4>'+
    '<p><b>Когда может помочь:</b> '+e(x.conditions)+'</p>'+
    '<p><b>Риск:</b> '+e(x.risks)+'</p>'+
    '<p><b>Не решает автоматически:</b> '+e(x.not)+'</p></article>'
   ).join('')+'</div>';
  h+='</section>';
  }
  if(index===2){
   h+='<section class="s08-edu-details" aria-label="Какие задания EDU-01 пройдены"><h3>Что ты проверял в EDU-01</h3><ol>'+
     model.eduDetails.map(x=>'<li>'+e(x)+'</li>').join('')+'</ol></section>';
  }
  h+='</div></div>';
  h+='<div class="s08-chain-nav" aria-label="Переключение причинных цепочек">'+
   button('Назад','s08ChainPrev','',false,index===0)+
   button('Далее','s08ChainNext','',false,index===2)+'</div>';
  h+='<section class="s08-takeaway"><h2>Главное, что стоит запомнить</h2><ul>'+model.takeaway.map(x=>'<li>'+e(x)+'</li>').join('')+'</ul></section>';
  h+='<div class="s08-footer s08-footer--two">'+button('К твоему итогу','s08Back')+
   button('Подробный отчёт','s08ReportOpen')+'</div>';
  if(s.s08ReportOpen&&report){
   h+='<div class="s08-report-overlay"><section class="s08-report-modal" role="dialog" aria-modal="true" aria-label="Подробный отчёт" tabindex="-1">'+
    '<div class="s08-report-head"><h2>Подробный отчёт для преподавателя</h2>'+
    button('Закрыть','s08ReportClose')+'</div>'+
    '<div class="s08-report-scroll" tabindex="0"><div class="order-report-sections">'+
    report.map(x=>'<section><h2>'+e(x.title)+'</h2><p>'+e(x.body)+'</p></section>').join('')+
    '</div></div></section></div>';
  }
 }
 return h+'</div>';
}
function render(s,data,bg,frame,chapterDialogue,portrait){
 if(s.scene==='S06'&&!s.s06IntroSeen){
  const message=(s.name?s.name+', ':'')+'вот данные по заказу З-214. Нам нужно разобраться, насколько серьёзно отклонение от графика и что действительно известно о ситуации. Изучи документы и подготовь оперативное заключение.';
  const content=chapterDialogue('S06:intro:gromov','Андрей Громов','Участник инвесткомитета',message,portrait,button('Изучить документы заказа','s06ReadDocs','',true));
  return frame(bg,content,'dialogue-stage dialogue-stage--shop');
 }
 const content=s.scene==='S06'?renderS06(s):s.scene==='S07'?renderS07(s):renderS08(s,data);
 return frame(bg,content,'order-stage');
}
window.CEH_ORDER_UI={render};
})();
