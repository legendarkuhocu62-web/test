(()=>{'use strict';
const d=window.CEH_DATA,L=window.CEH_LOGIC,app=document.getElementById('app'),key='ceh404.rebuilt.qa50.20261108';
let s;try{s=L.validState(JSON.parse(localStorage.getItem(key)||'null'))}catch(_){s=L.initial()}
const A={title:'assets/backgrounds/CH1-IMG-001_Главный-экран.png',gate:'assets/backgrounds/CH1-IMG-006_Внешняя проходная.png',entry:'assets/backgrounds/CH1-IMG-002_Входная зона и турникеты.png',office:'assets/backgrounds/CH1-IMG-005_Технологический отдел.png',engineer:'assets/backgrounds/CH1-IMG-014_Инженерный кабинет.png',group:'assets/backgrounds/CH1-IMG-020_S03_three_characters.jpeg',badge:'assets/icons/CH404-CH1-S00-001_employee_badge_technician.png',irina:'assets/characters/CH1-IMG-013_Женский персонаж с планшетом.png',irina_friendly:'assets/characters/CH1-IMG-015_irina_friendly.png',andrey:'assets/characters/CH1-IMG-012_Персонаж Андрей Громов.png',marina:'assets/characters/CH1-IMG-011_Персонаж Марина Власова.png'};
function e(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function btn(t,act,id='',cls=''){return `<button type="button" class="btn ${cls}" data-act="${e(act)}" data-id="${e(id)}">${e(t)}</button>`}
function frame(bg,content,cls=''){return `<section class="stage-scene ${cls}" style="--bg:url('${bg}')"><div class="scene-content">${content}</div></section>`}
function dialogue(who,txt,asset='irina'){const role=Object.values(d.characters).find(x=>x.name===who)?.role;return `<div class="dialogue"><img class="portrait" src="${A[asset]}" alt="${e(who)}"><div class="dialogue-text"><div class="speaker-id"><b>${e(who)}</b>${role?`<small>${e(role)}</small>`:''}</div><p>${e(txt).replace(/\n/g,'<br>')}</p></div></div>`}
function s01Dialogue(txt,asset='irina',control=''){return `<div class="s01-dialogue"><img class="s01-figure" src="${A[asset]}" alt="Ирина Соколова"><div class="s01-panel"><div class="speaker-id"><b>${e(d.characters.irina.name)}</b><small>${e(d.characters.irina.role)}</small></div><div class="s01-panel-copy"><p>${e(txt).replace(/\n/g,'<br>')}</p></div><div class="s01-panel-action">${control}</div></div></div>`}
function render(){document.body.classList.toggle('s00-mobile-cover-active',s.scene==='S00'&&s.s00===0);document.body.classList.toggle('s00-desktop-cover-active',s.scene==='S00'&&s.s00===0);document.body.classList.toggle('s01-immersive-active',s.scene==='S01');let html='';if(s.scene==='S00'){
 if(s.s00===0)html=frame(A.title,`<div class="desktop-start-visual"><img src="${A.title}" alt="ЦЕХ 404 — производственная игра-симулятор. Начало игры." fetchpriority="high"><button type="button" class="desktop-start-hitbox" data-act="s00next" aria-label="Начать игру"></button></div><div class="mobile-start-visual"><img src="assets/backgrounds/CH1-IMG-021_S00_start_mobile_composite.jpeg" alt="ЦЕХ 404 — производственная игра-симулятор, мобильная стартовая заставка" fetchpriority="high"><button type="button" class="mobile-start-hitbox" data-act="s00next" aria-label="Начать игру"></button></div>`,'cover mobile-cover-s00');
 if(s.s00===1)html=frame(A.gate,`<div class="glass"><h1>Первый день на предприятии</h1><p>Сегодня твой первый день на машиностроительном предприятии «ЦЕХ 404».<br>За проходной уже началась рабочая смена.<br>Тебе предстоит познакомиться с людьми, оборудованием и процессами, от которых зависит работа всего предприятия.</p>${btn('Подойти к проходной','s00next','','primary')}</div>`);
 if(s.s00===2)html=frame(A.entry,`<div class="glass"><h1>ДОПУСК НА ПРЕДПРИЯТИЕ</h1><p>Для входа на территорию необходимо оформить персональный пропуск.</p><label for="name">Как тебя зовут?</label><input id="name" maxlength="40" placeholder="Введите имя" value="${e(s.name)}">${btn('Получить пропуск','badge','','primary')}</div>`);
 if(s.s00===3)html=frame(A.entry,`<div class="glass"><h1>Пропуск получен</h1><div class="badge-card"><img src="${A.badge}" alt="Пропуск техника-технолога"><div class="badge-overlay"><strong>${e(s.name)}</strong></div></div>${btn('Пройти через турникет','next','S01','primary')}</div>`);
 }else if(s.scene==='S01'){
 let text='';if(s.s01<4){text=s01Dialogue(d.intro[s.s01].replace('[Имя]',s.name),s.s01===0?'irina_friendly':'irina',btn(s.s01===3?'Задать вопросы Ирине':'Далее','introNext','','primary'))}
 else if(s.reply){const q=d.questions.find(x=>x.id===s.reply);text=s01Dialogue(q.answer,'irina',btn('Вернуться к вопросам','replyClose','','primary'))}
 else {text='<div class="glass"><h2>О чём ты хочешь спросить?</h2><div class="choices">'+d.questions.map(q=>btn((s.asked.includes(q.id)?'✓ ':'')+q.label,'ask',q.id,s.asked.includes(q.id)?'seen':'')).join('')+'</div>'+ (s.asked.length===3?btn('Изучить производственный отчёт','next','S02','primary'):'')+'</div>'}
 html=frame(A.office,`<div class="s01-build" aria-label="Версия S01">S01 · v5</div>`+text,'character-scene s01-scene');

 }else if(s.scene==='S02'){
 let h=`<div class="report-content">
 <div class="report-stage-layout">
   <div class="report-mentor"><img src="${A.irina}" alt="Ирина Соколова, главный технолог"><div class="report-mentor-name"><b>Ирина Соколова</b><small>Главный технолог · наставник</small></div></div>
   <div class="report-document">
     <picture><source media="(max-width:720px)" srcset="assets/objects/CH1-S02-production-report-mobile.jpeg"><img data-act="reportZoom" title="Нажмите, чтобы увеличить отчёт" src="assets/objects/CH1-S02-production-report-desktop.png" alt="Производственный отчёт ЦЕХ 404: производственный цикл 9–16 дней, загрузка оборудования 68%, простои 9%, переналадка 70 минут, поиск инструмента 12 минут за смену, ожидание деталей 2,5 дня, дефекты на финальном контроле 60%, поставки еженедельные, отсутствие материалов 2 случая за прошлый месяц." loading="eager"></picture>
     ${btn('Увеличить отчёт','reportZoom')}
   </div>
 </div>
 <div class="glass report-questions">
   <h2>Какой вывод можно сделать?</h2>
   <details class="report-text-access"><summary>Посмотреть показатели отчёта текстом</summary><div class="report-data-text">${d.report.map(x=>`<p><b>${e(x.label)} — ${e(x.value)}</b><br><span>${e(x.note)}</span></p>`).join('')}</div></details>
   <div class="choices">${d.hypotheses.map(x=>btn((s.hypothesis===x.id?'✓ ':'')+x.label,'hypothesis',x.id,s.hypothesis===x.id?'selected':'')).join('')}</div>`;
 if(s.hypothesis&&!s.hypothesisConfirmed)h+=btn('Подтвердить гипотезу','confirmHyp','','primary');
 if(s.hypothesisConfirmed){h+=`<div class="feedback">${dialogue('Ирина Соколова',d.hypotheses.find(x=>x.id===s.hypothesis).reply)}</div>`+btn('Продолжить','next','S03','primary')}
 h+=`</div><dialog id="report-preview" class="report-preview"><button type="button" class="btn" data-act="reportClose">Закрыть увеличенный отчёт</button><picture><source media="(max-width:720px)" srcset="assets/objects/CH1-S02-production-report-mobile.jpeg"><img src="assets/objects/CH1-S02-production-report-desktop.png" alt="Увеличенный производственный отчёт"></picture></dialog></div>`;
 html=frame(A.office,h,'report-scene');
 }else if(s.scene==='S03'){
 let h=`<div class="glass document"><h1>Три профессиональные позиции</h1><p>Перед подготовкой рекомендаций выслушай специалистов.</p>`;
 if(s.s03Person){const p=d.people.find(x=>x.id===s.s03Person);h+=dialogue(p.name,p.speech,p.id)+`<p><b>Вопрос:</b> ${e(p.question)}</p><p><b>Ответ:</b> ${e(p.reply)}</p>`+btn('Вернуться к специалистам','closePerson','','primary')}
 else h+=`<div class="people">${d.people.map(p=>`<div class="person"><img src="${A[p.id]}" alt="${e(p.name)}"><h3>${e(p.name)}</h3><p>${e(p.role)}</p>${btn((s.asked03.includes(p.id)?'✓ ':'')+'Выслушать','person',p.id)}</div>`).join('')}</div>`+btn('Перейти к инвестициям','next','S04','primary');
 html=frame(A.group,h+'</div>');
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
}
function act(action,id){if(action==='reportZoom'){document.getElementById('report-preview')?.showModal();return;}if(action==='reportClose'){document.getElementById('report-preview')?.close();return;}if(action==='reset'){if(confirm('Начать заново?'))s=L.initial()}
 else if(action==='s00next')s.s00=Math.min(2,s.s00+1);
 else if(action==='badge'){const name=L.cleanName(document.getElementById('name')?.value);if(!name){alert('Введите имя');return}s.name=name;s.s00=3}
 else if(action==='next'){const next={S00:'S01',S01:'S02',S02:'S03',S03:'S04'};if(next[s.scene]===id){if(s.scene==='S01'&&s.asked.length!==3)return;if(s.scene==='S02'&&!s.hypothesisConfirmed)return;s.scene=id}}
 else if(action==='introNext')s.s01=Math.min(4,s.s01+1);
 else if(action==='ask'){s.reply=id;if(!s.asked.includes(id))s.asked.push(id)}
 else if(action==='replyClose')s.reply=null;
 else if(action==='hypothesis'&&!s.hypothesisConfirmed)s.hypothesis=id;
 else if(action==='confirmHyp'&&s.hypothesis)s.hypothesisConfirmed=true;
 else if(action==='person'){s.s03Person=id;if(!s.asked03.includes(id))s.asked03.push(id)}
 else if(action==='closePerson')s.s03Person=null;
 else if(action==='priority')s.priority=id;
 else if(action==='catalog'){s.s04Mode='catalog';s.showReview=false;s.finished=false}
 else if(action==='toggle'){s.selected=s.selected.includes(id)?s.selected.filter(x=>x!==id):[...s.selected,id];s.showReview=false}
 else if(action==='review')s.showReview=true;
 else if(action==='finish'&&L.spent(s)<=100&&s.selected.length)s.s04Mode='finished';
 render()}
app.addEventListener('click',ev=>{const b=ev.target.closest('[data-act]');if(b)act(b.dataset.act,b.dataset.id)});
app.addEventListener('keydown',ev=>{if(ev.key==='Enter'&&ev.target.id==='name'){ev.preventDefault();act('badge','')}});
render();window.__CEH_TEST__={getState:()=>structuredClone(s),act};
})();