(()=>{'use strict';
const d=window.CEH_DATA,L=window.CEH_LOGIC,D=window.CEH_DIALOGUE,app=document.getElementById('app'),key='ceh404.rebuilt.qa50.20261108';
let s;try{s=L.validState(JSON.parse(localStorage.getItem(key)||'null'))}catch(_){s=L.initial()}
const A={title:'assets/backgrounds/CH1-IMG-001_Главный-экран.png',gate:'assets/backgrounds/CH1-IMG-006_Внешняя проходная.png',entry:'assets/backgrounds/CH1-IMG-002_Входная зона и турникеты.png?v=approved-20261109',office:'assets/backgrounds/CH1-IMG-005_Технологический отдел.png',engineer:'assets/backgrounds/CH1-IMG-014_Инженерный кабинет.png',group:'assets/backgrounds/CH1-IMG-020_S03_three_characters.jpeg',badge:'assets/icons/CH404-CH1-S00-001_employee_badge_technician.png',irina:'assets/characters/CH1-IMG-013_Женский персонаж с планшетом.png',irina_friendly:'assets/characters/CH1-IMG-015_irina_friendly.png',irina_focused:'assets/characters/CH1-IMG-016_irina_focused.png',meeting:'assets/backgrounds/CH1-IMG-019_S03_Переговорная_без_персонажей.jpeg',andrey:'assets/characters/CH1-IMG-012_Персонаж Андрей Громов.png',marina:'assets/characters/CH1-IMG-011_Персонаж Марина Власова.png'};
function e(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function btn(t,act,id='',cls=''){return `<button type="button" class="btn ${cls}" data-act="${e(act)}" data-id="${e(id)}">${e(t)}</button>`}
function frame(bg,content,cls=''){return `<section class="stage-scene ${cls}" style="--bg:url('${bg}')"><div class="scene-content">${content}</div></section>`}
function chapterDialogue(key,speaker,role,text,portrait,finish,variant='scene'){return D.render({key,speaker,role,text,portrait,finish,variant})}
/* S00 desktop cover: keep the Start hitbox aligned with the 16:9 artwork
   when object-fit:cover crops its edges on unusual screens. */
function syncStartHitbox(){
 const visual=app.querySelector('.desktop-start-visual'),img=visual?.querySelector('img'),hit=visual?.querySelector('.desktop-start-hitbox');
 if(!visual||!img||!hit||window.innerWidth<=720)return;
 if(!img.complete||!img.naturalWidth||!img.naturalHeight){img.addEventListener('load',syncStartHitbox,{once:true});return}
 const w=visual.clientWidth,h=visual.clientHeight,scale=Math.max(w/img.naturalWidth,h/img.naturalHeight);
 if(!w||!h||!Number.isFinite(scale))return;
 const iw=img.naturalWidth*scale,ih=img.naturalHeight*scale,dx=(w-iw)/2,dy=(h-ih)/2;
 hit.style.left=(dx+iw*.64)+'px';
 hit.style.top=(dy+ih*.76)+'px';
 hit.style.width=(iw*.32)+'px';
 hit.style.height=(ih*.17)+'px';
}
function render(){document.body.classList.toggle('s00-mobile-cover-active',s.scene==='S00'&&s.s00===0);document.body.classList.toggle('s00-desktop-cover-active',s.scene==='S00'&&s.s00===0);document.body.classList.toggle('dialogue-mode-active',s.scene==='S01'||(s.scene==='S03'&&!!s.s03Person)||(s.scene==='S02'&&['intro','feedback'].includes(s.s02Step)));document.body.classList.toggle('s02-view-active',s.scene==='S02');let html='';if(s.scene==='S00'){
 if(s.s00===0)html=frame(A.title,`<div class="desktop-start-visual"><img src="${A.title}" alt="ЦЕХ 404 — производственная игра-симулятор. Начало игры." fetchpriority="high"><button type="button" class="desktop-start-hitbox" data-act="s00next" aria-label="Начать игру"></button></div><div class="mobile-start-visual"><img src="assets/backgrounds/CH1-IMG-021_S00_start_mobile_composite.jpeg" alt="ЦЕХ 404 — производственная игра-симулятор, мобильная стартовая заставка" fetchpriority="high"><button type="button" class="mobile-start-hitbox" data-act="s00next" aria-label="Начать игру"></button></div>`,'cover mobile-cover-s00');
 if(s.s00===1)html=frame(A.gate,`<div class="glass"><h1>Первый день на предприятии</h1><p>Сегодня твой первый день на машиностроительном предприятии «ЦЕХ 404».<br>За проходной уже началась рабочая смена.<br>Тебе предстоит познакомиться с людьми, оборудованием и процессами, от которых зависит работа всего предприятия.</p>${btn('Подойти к проходной','s00next','','primary')}</div>`);
 if(s.s00===2)html=frame(A.entry,`<div class="glass"><h1>ДОПУСК НА ПРЕДПРИЯТИЕ</h1><p>Для входа на территорию необходимо оформить персональный пропуск.</p><label for="name">Как тебя зовут?</label><input id="name" maxlength="40" placeholder="Введите имя" value="${e(s.name)}">${btn('Получить пропуск','badge','','primary')}</div>`,'entrance-scene');
 if(s.s00===3)html=frame(A.entry,`<div class="glass"><h1>Пропуск получен</h1><div class="badge-card"><img src="${A.badge}" alt="Пропуск техника-технолога"><div class="badge-overlay"><strong>${e(s.name)}</strong></div></div>${btn('Пройти через турникет','next','S01','primary')}</div>`,'entrance-scene');
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
   const buttons=d.people.map(p=>btn((s.asked03.includes(p.id)?'✓ ':'')+p.name+' · '+p.role,'person',p.id,s.asked03.includes(p.id)?'seen':'')).join('');
   const content='<div class="glass s03-chooser"><h1>Три профессиональные позиции</h1><p>Перед подготовкой рекомендаций выслушай специалистов.</p><div class="choices">'+buttons+'</div>'+btn('Перейти к инвестициям','next','S04','primary')+'</div>';
   html=frame(A.group,content,'s03-group-scene');
 }
 }else if(s.scene==='S04'){
 let h='<div class="glass document"><h1>Инвестиционное предложение</h1>';
 if(s.s04Mode==='priority'){h+='<p>Сначала выбери основной приоритет инвестиционной программы.</p><div class="choices">'+d.goals.map(x=>btn((s.priority===x.id?'✓ ':'')+x.label,'priority',x.id,s.priority===x.id?'selected':'')).join('')+'</div>'+(s.priority?btn('Перейти к выбору мероприятий','catalog','','primary'):'')}
 else if(s.s04Mode==='catalog'){
 const spent=L.spent(s);h+=`<div class="budget"><span>Бюджет <b>100 млн у.е.</b></span><span>Выбрано <b>${spent} млн у.е.</b></span><span>Осталось <b>${100-spent} млн у.е.</b></span></div><p>Все инициативы A–M доступны. Можно отменять выбор. Стоимость L и M в бюджете равна нулю, но это не означает отсутствия затрат и рисков.</p><div class="invest-grid">`;
 h+=d.initiatives.map(x=>`<article class="investment"><div class="invest-head"><b>${x.id}</b><strong>${x.cost} млн у.е.</strong></div><h3>${e(x.title)}</h3><p>${e(x.focus)}</p><details><summary>Условия и риски</summary><p><b>Условия:</b> ${e(x.conditions)}</p><p><b>Риски:</b> ${e(x.risks)}</p><p><b>Не гарантирует:</b> ${e(x.not)}</p></details>${btn(s.selected.includes(x.id)?'✓ Убрать из портфеля':'Добавить','toggle',x.id,s.selected.includes(x.id)?'selected':'')}</article>`).join('')+'</div>';
 if(spent>100)h+='<p class="warning">Бюджет превышен. Убери одну или несколько инициатив.</p>';
 h+=btn('Проверить предложение','review','','primary');
 if(s.showReview){h+=`<div class="feedback"><h2>Проверка портфеля</h2><p>Выбрано: ${e(s.selected.join(', ')||'нет инициатив')}. Приоритет: ${e(d.goals.find(x=>x.id===s.priority)?.label)}.</p><p>Обоснование должно учитывать условия и риски. Оценка эффектов предварительная; профессиональная проверка ещё требуется.</p></div>`;
 if(spent<=100&&s.selected.length)h+=btn('Зафиксировать предварительное предложение','finish','','primary')}
 }else{h+='<h2>Предварительное предложение сохранено</h2><p>Портфель: '+e(s.selected.join(', '))+'</p><p>Сумма: '+L.spent(s)+' млн у.е. из 100 млн у.е.</p><p>Продолжение S04 (EDU-01 и пересмотр портфеля) пока не интегрировано. Следующие события не выдаются за утверждённые.</p>'+btn('Вернуться к редактору','catalog','','primary')}
 html=frame(A.engineer,h+'</div>');
 }
 app.innerHTML=`<div class="statusline"><span>Глава 1 · ${e(s.scene)}</span><span>Восстановленная тестовая сборка</span></div>${html}<div class="reset">${btn('Начать заново','reset')}</div>`;
 try{localStorage.setItem(key,JSON.stringify(s))}catch(_){}
 requestAnimationFrame(()=>{D.fit();syncStartHitbox();if(s.scene==='S02'&&s.s02Step==='report')app.querySelector('.s02-report-close')?.focus({preventScroll:true});});
}
function act(action,id){if(['dlgMore','dlgBack','dlgStart'].includes(action)){const node=app.querySelector('.game-dialogue');if(node){node.outerHTML=D.move(action);requestAnimationFrame(()=>D.fit());}return;}if(action==='reset'){if(confirm('Начать заново?'))s=L.initial()}
 else if(action==='s02Open'&&s.scene==='S02'&&s.s02Step==='intro'){s.s02ReportSeen=true;s.s02Step='report'}
 else if(action==='s02Close'&&s.scene==='S02'&&s.s02Step==='report')s.s02Step='intro';
 else if(action==='s02Conclude'&&s.scene==='S02'&&s.s02ReportSeen&&['intro','report'].includes(s.s02Step))s.s02Step='conclusion';
 else if(action==='s00next')s.s00=Math.min(2,s.s00+1);
 else if(action==='badge'){const name=L.cleanName(document.getElementById('name')?.value);if(!name){alert('Введите имя');return}s.name=name;s.s00=3}
 else if(action==='next'){const next={S00:'S01',S01:'S02',S02:'S03',S03:'S04'};if(next[s.scene]===id){if(s.scene==='S01'&&s.asked.length!==3)return;if(s.scene==='S02'&&(!s.hypothesisConfirmed||s.s02Step!=='feedback'))return;s.scene=id}}
 else if(action==='introNext')s.s01=Math.min(4,s.s01+1);
 else if(action==='ask'){s.reply=id;if(!s.asked.includes(id))s.asked.push(id)}
 else if(action==='replyClose')s.reply=null;
 else if(action==='hypothesis'&&s.scene==='S02'&&s.s02Step==='conclusion'&&!s.hypothesisConfirmed&&d.hypotheses.some(x=>x.id===id))s.hypothesis=id;
 else if(action==='confirmHyp'&&s.scene==='S02'&&s.s02Step==='conclusion'&&s.hypothesis&&!s.hypothesisConfirmed){s.hypothesisConfirmed=true;s.s02Step='feedback'}
 else if(action==='person'){s.s03Person=id;if(!s.asked03.includes(id))s.asked03.push(id)}
 else if(action==='closePerson')s.s03Person=null;
 else if(action==='priority')s.priority=id;
 else if(action==='catalog'){s.s04Mode='catalog';s.showReview=false;s.finished=false}
 else if(action==='toggle'){s.selected=s.selected.includes(id)?s.selected.filter(x=>x!==id):[...s.selected,id];s.showReview=false}
 else if(action==='review')s.showReview=true;
 else if(action==='finish'&&L.spent(s)<=100&&s.selected.length)s.s04Mode='finished';
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