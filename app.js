(()=>{'use strict';
const d=window.CEH_DATA,L=window.CEH_LOGIC,D=window.CEH_DIALOGUE,app=document.getElementById('app'),key='ceh404.rebuilt.qa50.20261108';
let s;try{s=L.validState(JSON.parse(localStorage.getItem(key)||'null'))}catch(_){s=L.initial()}
const materialsUI=window.CEH_MATERIALS.create({getState:()=>s,data:d,root:app});
 const A={title:'assets/backgrounds/CH1-IMG-001_Главный-экран.png',gate:'assets/backgrounds/CH1-IMG-006_Внешняя проходная.png',entry:'assets/backgrounds/CH1-IMG-002_Входная зона и турникеты.png?v=approved-20261109',office:'assets/backgrounds/CH1-IMG-005_Технологический отдел.png',engineer:'assets/backgrounds/CH1-IMG-014_Инженерный кабинет.png',group:'assets/backgrounds/CH1-IMG-020_S03_three_characters.jpeg',badge:'assets/icons/CH404-CH1-S00-001_employee_badge_technician.png',irina:'assets/characters/CH1-IMG-013_Женский персонаж с планшетом.png',irina_friendly:'assets/characters/CH1-IMG-015_irina_friendly.png',irina_focused:'assets/characters/CH1-IMG-016_irina_focused.png',meeting:'assets/backgrounds/CH1-IMG-019_S03_Переговорная_без_персонажей.jpeg',andrey:'assets/characters/CH1-IMG-012_Персонаж Андрей Громов.png',marina:'assets/characters/CH1-IMG-011_Персонаж Марина Власова.png'};
function e(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function btn(t,act,id='',cls=''){return `<button type="button" class="btn ${cls}" data-act="${e(act)}" data-id="${e(id)}">${e(t)}</button>`}
/* EDU-01 documents: view original image without resetting scene or inputs. */
let eduDocumentDialog=null,eduDocumentReturnFocus=null;
function showEduDocument(src,title){
  if(!eduDocumentDialog){
    const dlg=document.createElement('dialog');
    dlg.className='edu-document-dialog';
    dlg.setAttribute('aria-labelledby','edu-document-dialog-title');
    dlg.innerHTML='<div class="edu-document-dialog__header"><h2 id="edu-document-dialog-title"></h2><button type="button" class="edu-document-dialog__close" aria-label="Закрыть документ">Закрыть ✕</button></div><div class="edu-document-dialog__body"><img alt="" loading="eager"></div><a class="edu-document-dialog__original" target="_blank" rel="noopener">Открыть оригинал для увеличения</a>';
    dlg.querySelector('.edu-document-dialog__close').addEventListener('click',()=>dlg.close());
    dlg.addEventListener('close',()=>{if(eduDocumentReturnFocus&&eduDocumentReturnFocus.isConnected)eduDocumentReturnFocus.focus({preventScroll:true});});
    document.body.appendChild(dlg);
    eduDocumentDialog=dlg;
  }
  eduDocumentReturnFocus=document.activeElement;
  eduDocumentDialog.querySelector('#edu-document-dialog-title').textContent=title;
  const photo=eduDocumentDialog.querySelector('.edu-document-dialog__body img');
  photo.src=src;photo.alt=title;
  eduDocumentDialog.querySelector('.edu-document-dialog__original').href=src;
  if(!eduDocumentDialog.open)eduDocumentDialog.showModal();
  eduDocumentDialog.querySelector('.edu-document-dialog__close').focus({preventScroll:true});
}
app.addEventListener('click',ev=>{
  const link=ev.target.closest('a[data-edu-image]');
  if(!link||!app.contains(link)||typeof HTMLDialogElement==='undefined')return;
  ev.preventDefault();
  showEduDocument(link.getAttribute('href'),link.dataset.title||'Документ ОТК');
});
/* In-game EDU feedback. Native browser alert() has browser-owned styling and
   incorrectly appears as an external site confirmation on Android. */
let eduFeedbackDialog=null,eduFeedbackReturnFocus=null;
function showEduFeedback(message){
  if(!eduFeedbackDialog){
    const dlg=document.createElement('dialog');
    dlg.className='edu-feedback-dialog';
    dlg.setAttribute('aria-labelledby','edu-feedback-heading');
    dlg.setAttribute('aria-describedby','edu-feedback-message');
    dlg.innerHTML='<div class="edu-feedback-dialog__top"><span class="edu-feedback-dialog__tag">ЦЕХ 404 · EDU-01</span><h2 id="edu-feedback-heading">Проверь расчёт</h2></div><p id="edu-feedback-message"></p><div class="edu-feedback-dialog__actions"><button type="button" class="edu-feedback-dialog__button">ПОПРОБОВАТЬ ЕЩЁ РАЗ</button></div>';
    dlg.querySelector('.edu-feedback-dialog__button').addEventListener('click',()=>dlg.close());
    dlg.addEventListener('close',()=>{
      if(eduFeedbackReturnFocus&&eduFeedbackReturnFocus.isConnected){
        eduFeedbackReturnFocus.focus({preventScroll:true});
      }
    });
    document.body.appendChild(dlg);
    eduFeedbackDialog=dlg;
  }
  eduFeedbackReturnFocus=document.activeElement;
  eduFeedbackDialog.querySelector('#edu-feedback-heading').textContent=
    message.startsWith('Вы неправильно рассчитали')?'Проверь расчёт':'Проверь ответ';
  eduFeedbackDialog.querySelector('#edu-feedback-message').textContent=message;
  if(!eduFeedbackDialog.open)eduFeedbackDialog.showModal();
  eduFeedbackDialog.querySelector('.edu-feedback-dialog__button').focus({preventScroll:true});
}
function frame(bg,content,cls=''){return `<section class="stage-scene ${cls}" style="--bg:url('${bg}')"><div class="scene-content">${content}</div></section>`}
function chapterDialogue(key,speaker,role,text,portrait,finish,variant='scene'){return D.render({key,speaker,role,text,portrait,finish,variant})}
/* S00 desktop cover: keep the Start hitbox aligned with the 16:9 artwork
   when object-fit:contain preserves every edge of the artwork. */
function syncStartHitbox(){
 // The start text is baked into the approved image, so its exact coordinates
 // must not be guessed from percentages. Make the entire desktop cover clickable.
 const hit=app.querySelector('.desktop-start-hitbox');
 if(!hit)return;
 hit.style.inset='0';
 hit.style.left='0';
 hit.style.top='0';
 hit.style.width='100%';
 hit.style.height='100%';
}

function render(){document.body.classList.toggle('s00-mobile-cover-active',s.scene==='S00'&&s.s00===0);document.body.classList.toggle('s00-desktop-cover-active',s.scene==='S00'&&s.s00===0);document.body.classList.toggle('s00-mobile-badge-active',s.scene==='S00'&&s.s00===4);document.body.classList.toggle('dialogue-mode-active',s.scene==='S01'||(s.scene==='S03'&&!!s.s03Person)||(s.scene==='S02'&&['intro','feedback'].includes(s.s02Step)));document.body.classList.toggle('s02-view-active',s.scene==='S02');document.body.classList.toggle('s03-mobile-choice-active',s.scene==='S03'&&!s.s03Person);let html='';if(s.scene==='S00'){
 if(s.s00===0)html=frame(A.title,`<div class="desktop-start-visual"><img src="${A.title}" alt="ЦЕХ 404 — производственная игра-симулятор. Начало игры." fetchpriority="high"><button type="button" class="desktop-start-hitbox" data-act="s00next" aria-label="Начать игру"></button></div><div class="mobile-start-visual"><img src="assets/backgrounds/CH1-IMG-021_S00_start_mobile_composite.jpeg" alt="ЦЕХ 404 — производственная игра-симулятор, мобильная стартовая заставка" fetchpriority="high"><button type="button" class="mobile-start-hitbox" data-act="s00next" aria-label="Начать игру"></button></div>`,'cover mobile-cover-s00');
 if(s.s00===1)html=frame(A.gate,chapterDialogue('S00:gate:1','ЦЕХ 404','Первый день на предприятии','Сегодня твой первый день на машиностроительном предприятии «ЦЕХ 404». За проходной уже началась рабочая смена.', '',btn('Далее','s00next','','primary'),'inline'),'gate-scene');
 if(s.s00===2)html=frame(A.gate,chapterDialogue('S00:gate:2','ЦЕХ 404','Первый рабочий день','Тебе предстоит познакомиться с людьми, оборудованием и процессами, от которых зависит работа всего предприятия.', '',btn('Подойти к проходной','s00next','','primary'),'inline'),'gate-scene');
 if(s.s00===3)html=frame(A.entry,`<div class="glass"><h1>ДОПУСК НА ПРЕДПРИЯТИЕ</h1><p>Для входа на территорию необходимо оформить персональный пропуск.</p><label for="name">Как тебя зовут?</label><input id="name" maxlength="40" placeholder="Введите имя" value="${e(s.name)}">${btn('Получить пропуск','badge','','primary')}</div>`,'entrance-scene');
 if(s.s00===4)html=frame(A.entry,`<div class="glass badge-screen"><h1>Пропуск получен</h1><div class="badge-card"><img src="${A.badge}" alt="Пропуск техника-технолога"><div class="badge-overlay"><strong>${e(s.name)}</strong></div></div>${btn('Пройти через турникет','next','S01','primary')}</div>`,'entrance-scene entrance-scene--badge');
 }else if(s.scene==='S01'){
 const speaker=d.characters.irina;
 let text='';
 if(s.s01<4){
   const asset=s.s01===0?'irina_friendly':s.s01>=2?'irina_focused':'irina';
   text=chapterDialogue('S01:intro:'+s.s01,speaker.name,speaker.role,d.intro[s.s01].replace('[Имя]',s.name),A[asset],btn(s.s01===3?'Задать вопросы Ирине':'Далее','introNext','','primary'));
 }else if(s.reply){
   const q=d.questions.find(x=>x.id===s.reply);
   const asset=s.reply==='problems'?'irina_focused':'irina';
   text=chapterDialogue('S01:reply:'+s.reply,speaker.name,speaker.role,q.answer,A[asset],btn('Вернуться к вопросам','replyClose','','primary'));
 }else{
   text='<div class="glass s01-questions"><h2>О чём ты хочешь спросить?</h2><div class="choices">'+d.questions.map(q=>btn((s.asked.includes(q.id)?'✓ ':'')+q.label,'ask',q.id,s.asked.includes(q.id)?'seen':'')).join('')+'</div>'+(s.asked.length===3?btn('Изучить производственный отчёт','next','S02','primary'):'')+'</div>';
 }
 html=frame(A.office,text,'dialogue-stage dialogue-stage--office');
 }else if(s.scene==='S02'){html=window.CEH_S02.render(s,d,A,frame,btn,chapterDialogue,e);
 }else if(s.scene==='S03'){
 if(s.s03Person){
   const p=d.people.find(x=>x.id===s.s03Person);
   const message=p.speech+'\n\nВопрос: '+p.question+'\nОтвет: '+p.reply;
   const content=chapterDialogue('S03:person:'+p.id,p.name,p.role,message,A[p.id],btn('Вернуться к специалистам','closePerson','','primary'));
   html=frame(A.meeting,content,'dialogue-stage dialogue-stage--meeting');
 }else{
   const buttons=d.people.map(p=>`<button type="button" class="btn person-choice ${s.asked03.includes(p.id)?'seen':''}" data-act="person" data-id="${e(p.id)}"><span class="person-choice__name">${s.asked03.includes(p.id)?'✓ ':''}${e(p.name)}</span><span class="person-choice__role">${e(p.role)}</span></button>`).join('');
   const content='<div class="s03-chooser"><div class="s03-chooser__intro"><h1>Три профессиональные позиции</h1><p>Перед подготовкой рекомендаций выслушай специалистов.</p></div><div class="choices">'+buttons+'</div><div class="s03-chooser__next">'+btn('Перейти к инвестициям','next','S04','primary')+'</div></div>';
   html=frame(A.group,content,'s03-group-scene');
 }
 }else if(s.scene==='S04'){
 let h='<div class="glass document document--'+e(s.s04Mode)+'"><h1>Инвестиционное предложение</h1>';
 if(s.s04Mode==='priority'){
  h+='<p>Выбери основной приоритет инвестиционной программы. Это ориентир для анализа, а не условие допуска к формированию портфеля.</p><div class="choices">'+d.goals.map(x=>btn((s.priority===x.id?'✓ ':'')+x.label,'priority',x.id,s.priority===x.id?'selected':'')).join('')+'</div>'+btn('Перейти к выбору мероприятий','catalog','','primary');
 }else if(s.s04Mode==='catalog'){
  const spent=L.spent(s);
  h+=s.budgetMessage?'<p class="warning budget-message" role="alert">'+e(s.budgetMessage)+'</p>':'';
  h+='<div class="budget"><span>Бюджет <b>100 млн у.е.</b></span><span>Выбрано <b>'+spent+' млн у.е.</b></span><span>Осталось <b>'+(100-spent)+' млн у.е.</b></span></div><p>Все инициативы A–M доступны. Можно отменять выбор. Стоимость L и M в бюджете равна нулю, но это не означает отсутствия затрат и рисков.</p><div class="invest-grid">';
  h+=d.initiatives.map(x=>'<article class="investment"><div class="invest-head"><b>'+e(x.id)+'</b><strong>'+x.cost+' млн у.е.</strong></div><h3>'+e(x.title)+'</h3><p>'+e(x.focus)+'</p><details><summary>Условия и риски</summary><p><b>Условия:</b> '+e(x.conditions)+'</p><p><b>Риски:</b> '+e(x.risks)+'</p><p><b>Не гарантирует:</b> '+e(x.not)+'</p></details>'+btn(s.selected.includes(x.id)?'✓ Убрать из портфеля':'Добавить','toggle',x.id,s.selected.includes(x.id)?'selected':'')+'</article>').join('')+'</div>';
  h+='<div class="portfolio-actions">'+btn(s.returnToReview?'Подтвердить пересмотренный портфель':'Подтвердить предварительный портфель','review','','primary')+'</div>';
  if(s.showReview){h+='<div class="feedback"><h2>Подтверждение портфеля</h2><p>Выбрано: '+e(s.selected.join(', '))+'</p><p>Общая стоимость: <b>'+spent+' млн у.е.</b></p><p>Остаток бюджета: <b>'+(100-spent)+' млн у.е.</b></p><p>Приоритет: '+e(d.goals.find(x=>x.id===s.priority)?.label||'не выбран')+'</p><p>Вы действительно хотите сохранить этот предварительный портфель?</p>'+btn('Вернуться к редактору','catalog','','')+btn('Сохранить и продолжить','finish','','primary')+'</div>'}
 }else if(s.s04Mode==='eduIntro'){
  h+='<h2>Проверка документов ОТК</h2><p>Ты уже выбрал, куда предложить вложить средства. Перед отправкой открой документы ОТК. Они помогут проверить, какие выводы из отчёта действительно подтверждаются, а что пока остаётся предположением.</p><p><b>Документы:</b> схема контроля наружного диаметра ЭК-В20-01 и акт о несоответствии № НС-008/26.</p>'+btn('Проверить документы','startEdu','','primary');
 }else if(s.s04Mode==='edu'){
  h+='<h2>EDU-01 · Проверка технических документов</h2><p class="edu-instructions">Открой схему контроля и акт ОТК. Изучи данные документов, затем выполни задания.</p><div class="edu-layout"><div class="edu-doc edu-doc--scans" aria-label="Документы ОТК">'
      +'<article class="edu-document-card"><h3>Схема контроля ЭК-В20-01</h3><a class="edu-document-link" data-edu-image data-title="Схема контроля ЭК-В20-01" href="assets/edu01/schema-ek-v20-01.jpg" target="_blank" rel="noopener" aria-label="Открыть схему контроля ЭК-В20-01"><img src="assets/edu01/schema-ek-v20-01.jpg" alt="Технический чертёж вала В-20, размер Ø20,00 ±0,05 мм" loading="lazy"><span>Открыть чертёж</span></a></article>'
      +'<article class="edu-document-card"><h3>Акт о несоответствии № НС-008/26</h3><a class="edu-document-link" data-edu-image data-title="Акт о несоответствии № НС-008/26" href="assets/edu01/act-ns-008-26.jpg" target="_blank" rel="noopener" aria-label="Открыть акт о несоответствии № НС-008/26"><img src="assets/edu01/act-ns-008-26.jpg" alt="Акт ОТК с результатами измерений 20,02 и 20,08 мм" loading="lazy"><span>Открыть акт ОТК</span></a></article>'
      +'<p class="edu-doc-hint">Нажми на документ, чтобы рассмотреть его в большом размере. Ответы вводятся ниже.</p></div><section class="edu-task" aria-label="Профессиональное задание">';
  if(s.eduMessage)h+='<p class="warning" role="alert">'+e(s.eduMessage)+'</p>';
  if(s.eduStep===1)h+='<h3>Задание 1. Проверь размер</h3><p>Введи нижний и верхний предельные размеры в миллиметрах.</p><div class="edu-answer-fields"><label>Нижний предел, мм<input id="edu-low" inputmode="decimal" autocomplete="off" placeholder="Введите ответ"></label><label>Верхний предел, мм<input id="edu-high" inputmode="decimal" autocomplete="off" placeholder="Введите ответ"></label></div>'+btn('Проверить расчёт','edu1','','primary');
  if(s.eduStep===2)h+='<h3>Задание 2. Проверь результат контроля</h3><p>Какая деталь имеет записанный диаметр выше верхнего предела?</p><div class="choices"><label><input type="radio" name="edu-part" value="1"> 1 — В-20-01</label><label><input type="radio" name="edu-part" value="2"> 2 — В-20-02</label><label><input type="radio" name="edu-part" value="3"> 3 — ни одна</label></div><label>На сколько миллиметров превышен предел?<input id="edu-excess" inputmode="decimal" autocomplete="off" placeholder="Введите ответ"></label>'+btn('Проверить ответ','edu2','','primary');
  if(s.eduStep===3)h+='<h3>Задание 3. Какой вывод обоснован?</h3><div class="choices"><label><input type="radio" name="edu-conclusion" value="1"> 1. Вся партия бракованная, причина — неисправный станок.</label><label><input type="radio" name="edu-conclusion" value="2"> 2. В акте зарегистрировано несоответствие детали В-20-02; её изолировали. Партия задержана до дополнительных проверок, но причина отклонения не установлена.</label><label><input type="radio" name="edu-conclusion" value="3"> 3. Оба диаметра соответствуют заданному размеру.</label></div>'+btn('Проверить вывод','edu3','','primary');
  if(s.eduStep===4)h+='<h3>Задание 4. Чего не хватает для инвестиционного вывода?</h3><p>Отметь все полезные направления дополнительной проверки.</p><div class="choices"><label><input type="checkbox" name="edu-info" value="1"> 1. На какой операции размер мог выйти за пределы?</label><label><input type="checkbox" name="edu-info" value="2"> 2. Как часто детали возвращаются на доработку?</label><label><input type="checkbox" name="edu-info" value="3"> 3. Есть ли ожидание и перегрузка на финальном контроле?</label><label><input type="checkbox" name="edu-info" value="4"> 4. Где можно обнаружить отклонение раньше?</label><label><input type="checkbox" name="edu-info" value="5"> 5. Раз один вал не соответствует, нужно немедленно купить новый станок.</label></div>'+btn('Проверить заключение','edu4','','primary');
  h+='</section></div>';
 }else if(s.s04Mode==='gromov'){
  const lines=['Видишь, по этому акту одну деталь изолировали, а партию задержали до дополнительной проверки. Подобные случаи у нас бывают: после окончательного контроля часть деталей возвращается на доработку. Это время, которое производство теряет.','Где именно возникают отклонения, мы пока не установили.','Я по-прежнему считаю, что нам нужно обновлять оборудование. Но прежде чем защищать инвестиционные предложения, стоит учесть и эти потери.'];
  h+='<h2>Андрей Громов · Начальник производства</h2><p class="edu-gromov">'+lines[s.eduGromovIndex]+'</p>'+btn(s.eduGromovIndex===2?'Перейти к пересмотру портфеля':'Далее','gromovNext','','primary');
 }else if(s.s04Mode==='reviewFinal'){
  const initial=Array.isArray(s.initialSelected)?s.initialSelected:[];
  h+='<h2>Сохранить или пересмотреть?</h2><p>Теперь у тебя больше информации. Готов оставить первоначальный инвестиционный портфель или хочешь его пересмотреть?</p><p><b>Первоначальный портфель:</b> '+e(initial.join(', '))+' · '+initial.reduce((sum,id)=>sum+(d.initiatives.find(x=>x.id===id)?.cost||0),0)+' млн у.е.</p><p><b>Текущий портфель:</b> '+e(s.selected.join(', '))+' · '+L.spent(s)+' млн у.е.</p>'+btn('Сохранить и обосновать','saveFinal','','primary')+btn('Пересмотреть портфель','revisePortfolio','','');
 }else if(s.s04Mode==='savedFinal'){
  h+='<h2>Портфель сохранён</h2><p>Окончательный портфель: '+e((s.finalSelected||s.selected).join(', '))+' · '+L.spent({...s,selected:s.finalSelected||s.selected})+' млн у.е.</p><p>EDU-01 пройден. Следующий этап сценария — S05 «Инвесткомитет». Его сценарий пока не интегрирован в эту сборку.</p>';
 }
 html=frame(A.engineer,h+'</div>','investment-scene');
 }
 app.innerHTML=`<div class="statusline" aria-hidden="true"></div>${html}<div class="reset">${btn('Начать заново','reset')}</div>`;
  materialsUI.attach();
 try{localStorage.setItem(key,JSON.stringify(s))}catch(_){}
 requestAnimationFrame(()=>{D.fit();syncStartHitbox();if(s.scene==='S02'&&s.s02Step==='report')app.querySelector('.s02-report-close')?.focus({preventScroll:true});});
}
function act(action,id){if(['dlgMore','dlgBack','dlgStart'].includes(action)){const node=app.querySelector('.game-dialogue');if(node){node.outerHTML=D.move(action);requestAnimationFrame(()=>D.fit());}return;}if(action==='reset'){if(confirm('Начать заново?'))s=L.initial()}
 else if(action==='s02Open'&&s.scene==='S02'&&s.s02Step==='intro'){s.s02ReportSeen=true;s.s02Step='report'}
 else if(action==='s02Close'&&s.scene==='S02'&&s.s02Step==='report')s.s02Step='intro';
 else if(action==='s02Conclude'&&s.scene==='S02'&&s.s02ReportSeen&&['intro','report'].includes(s.s02Step))s.s02Step='conclusion';
 else if(action==='s00next')s.s00=Math.min(3,s.s00+1);
 else if(action==='badge'){const name=L.cleanName(document.getElementById('name')?.value);if(!name){alert('Введите имя');return}s.name=name;s.s00=4}
 else if(action==='next'){const next={S00:'S01',S01:'S02',S02:'S03',S03:'S04'};if(next[s.scene]===id){if(s.scene==='S01'&&s.asked.length!==3)return;if(s.scene==='S02'&&(!s.hypothesisConfirmed||s.s02Step!=='feedback'))return;s.scene=id}}
 else if(action==='introNext')s.s01=Math.min(4,s.s01+1);
 else if(action==='ask'){s.reply=id;if(!s.asked.includes(id))s.asked.push(id)}
 else if(action==='replyClose')s.reply=null;
 else if(action==='hypothesis'&&s.scene==='S02'&&s.s02Step==='conclusion'&&!s.hypothesisConfirmed&&d.hypotheses.some(x=>x.id===id))s.hypothesis=id;
 else if(action==='confirmHyp'&&s.scene==='S02'&&s.s02Step==='conclusion'&&s.hypothesis&&!s.hypothesisConfirmed){s.hypothesisConfirmed=true;s.s02Step='feedback'}
 else if(action==='person'){s.s03Person=id;if(!s.asked03.includes(id))s.asked03.push(id)}
 else if(action==='closePerson')s.s03Person=null;
 else if(action==='priority')s.priority=id;
 else if(action==='catalog'){s.s04Mode='catalog';s.showReview=false;s.finished=false;s.budgetMessage=''}
 else if(action==='toggle'){if(s.selected.includes(id)){s.selected=s.selected.filter(x=>x!==id);s.budgetMessage=''}else{const item=d.initiatives.find(x=>x.id===id);const remaining=100-L.spent(s);if(item&&L.spent(s)+item.cost>100){s.budgetMessage=`Нельзя добавить инициативу.\nДоступный бюджет — ${remaining} млн у.е.\nСтоимость инициативы — ${item.cost} млн у.е.`}else{s.selected=[...s.selected,id];s.budgetMessage=''}}s.showReview=false}
 else if(action==='review'&&s.selected.length&&L.spent(s)<=100)s.showReview=true;
 else if(action==='finish'&&L.spent(s)<=100&&s.selected.length){if(s.returnToReview){s.returnToReview=false;s.showReview=false;s.s04Mode='reviewFinal'}else{s.initialSelected=[...s.selected];s.eduStep=1;s.eduMessage='';s.s04Mode='eduIntro'}}
 else if(action==='startEdu')s.s04Mode='edu';
 else if(action==='edu1'){const low=Number((document.getElementById('edu-low')?.value||'').replace(',','.'));const high=Number((document.getElementById('edu-high')?.value||'').replace(',','.'));if(Math.abs(low-19.95)<0.00001&&Math.abs(high-20.05)<0.00001){s.eduStep=2;s.eduMessage=''}else{showEduFeedback('Вы неправильно рассчитали. Попробуйте ещё раз.');return}}
 else if(action==='edu2'){const part=app.querySelector('input[name="edu-part"]:checked')?.value;const excess=Number((document.getElementById('edu-excess')?.value||'').replace(',','.'));if(part==='2'&&Math.abs(excess-0.03)<0.00001){s.eduStep=3;s.eduMessage=''}else{showEduFeedback('Вы неправильно рассчитали. Попробуйте ещё раз.');return}}
 else if(action==='edu3'){const conclusion=app.querySelector('input[name="edu-conclusion"]:checked')?.value;if(conclusion==='2'){s.eduStep=4;s.eduMessage=''}else{showEduFeedback('Неверный ответ. Попробуйте ещё раз.');return}}
 else if(action==='edu4'){const chosen=[...app.querySelectorAll('input[name="edu-info"]:checked')].map(x=>x.value).sort();if(chosen.join(',')==='1,2,3,4'){s.s04Mode='gromov';s.eduGromovIndex=0;s.eduMessage=''}else{showEduFeedback('Неверный ответ. Попробуйте ещё раз.');return}}
 else if(action==='gromovNext'){if(s.eduGromovIndex<2)s.eduGromovIndex++;else s.s04Mode='reviewFinal'}
 else if(action==='revisePortfolio'){s.returnToReview=true;s.s04Mode='catalog';s.showReview=false;s.budgetMessage=''}
 else if(action==='saveFinal'){s.finalSelected=[...s.selected];s.s04Mode='savedFinal'}
 render()}
app.addEventListener('click',ev=>{const b=ev.target.closest('[data-act]');if(b)act(b.dataset.act,b.dataset.id)});
app.addEventListener('keydown',ev=>{
 if(s.scene==='S02'&&s.s02Step==='report'){
   if(ev.key==='Escape'){ev.preventDefault();act('s02Close','');return}
   if(ev.key==='Tab'){
     const focusables=[...app.querySelectorAll('.s02-report-layer summary,.s02-report-layer button')].filter(x=>!x.disabled);
     if(focusables.length){
       const first=focusables[0],last=focusables[focusables.length-1];
       if(ev.shiftKey&&document.activeElement===first){ev.preventDefault();last.focus()}
       else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first.focus()}
     }
   }
 }
 if(ev.key==='Enter'&&ev.target.id==='name'){ev.preventDefault();act('badge','')}
});
window.addEventListener('resize',()=>{syncStartHitbox();const node=app.querySelector('.game-dialogue');if(node){node.outerHTML=D.refresh();requestAnimationFrame(()=>D.fit());}});
render();window.__CEH_TEST__={getState:()=>structuredClone(s),act};
})();