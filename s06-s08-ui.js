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
 '<article class="order-doc-card"><span class="order-doc-icon" aria-hidden="true">'+['▤','⚙','▣'][i]+'</span><div><h3>'+e(x.title)+'</h3><small>'+(st.docsOpened.includes(x.id)?'✓ Изучено':'Нужно открыть')+'</small></div>'+button('Открыть','orderDoc',x.id)+'</article>'
 ).join('')+'</div>';
}
function viewDocument(state){
 const doc=M.DOCUMENTS.find(x=>x.id===state.s06OpenDoc);
 if(!doc)return '';
 return '<section class="order-paper" aria-label="Открытый производственный документ">'+
  '<div class="order-paper-top">ЦЕХ 404 · Производственный документооборот</div><h2>'+e(doc.title)+'</h2>'+
  '<p>'+e(doc.body)+'</p><p class="order-paper-note">Обучающий документ для игрового заказа З-214. Дата игровой ситуации: '+e(M.GAME_CLOCK)+'.</p>'+
  button('Закрыть документ','orderCloseDoc')+'</section>';
}
function renderS06(s){
 const z=M.clean(s.s0608),view=s.s06Page||'documents';
 let h='<div class="glass order-screen"><div class="order-kicker">ГЛАВА 01 · ПРОИЗВОДСТВЕННЫЙ ЗАКАЗ</div><h1>Заказ под угрозой · З-214</h1>';
 if(view==='documents'){
  h+='<p>Плановая отгрузка — 13.11.2026, 16:00. Прежде чем делать выводы, изучи три документа. Время ситуации: <strong>'+e(M.GAME_CLOCK)+'</strong>.</p>';
  h+='<p class="order-progress">Изучено документов: <b>'+z.docsOpened.length+' / 3</b></p>'+docList(s);
  if(s.s06OpenDoc)h+=viewDocument(s);
  h+=button(z.docsOpened.length===3?'Перейти к анализу':'Сначала изучи все документы','orderTask','',true,z.docsOpened.length!==3);
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
 const z=M.clean(s.s0608);
 const history={
  initialPriority:(data.goals||[]).find(x=>x.id===s.priority)?.label??null,
  initialSelected:s.initialSelected,
  finalSelected:s.finalSelected,
  finalCost:Array.isArray(s.finalSelected)?s.finalSelected.reduce((sum,id)=>sum+((data.initiatives||[]).find(x=>x.id===id)?.cost||0),0):null,
  edu01Result:Array.isArray(s.finalSelected)&&s.eduStep===4?'Задание EDU-01 пройдено, расчёт и выводы проверены.':null,
  s05:null
 };
 const sections=M.buildS08(z,history);
 let h='<div class="glass order-screen order-screen--report"><div class="order-kicker">ПЕРСОНАЛЬНЫЙ ИТОГ · ГЛАВА 01</div><h1>Твоё производственное заключение</h1>';
 h+='<p>Игрок: <b>'+e(s.name||'Без имени')+'</b>. Результат отражает твои решения и подтверждённые данные, а не гарантированное улучшение предприятия.</p>';
 if(!sections)h+='<p class="order-feedback">Не завершены предшествующие этапы. Вернись к заказу З-214.</p>';
 else h+='<div class="order-report-sections">'+sections.map(x=>'<section><h2>'+e(x.title)+'</h2><p>'+e(x.body)+'</p></section>').join('')+'</div>';
 return h+'</div>';
}
function render(s,data,bg,frame){
 const content=s.scene==='S06'?renderS06(s):s.scene==='S07'?renderS07(s):renderS08(s,data);
 return frame(bg,content,'order-stage');
}
window.CEH_ORDER_UI={render};
})();
