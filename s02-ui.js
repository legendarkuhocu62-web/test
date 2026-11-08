window.CEH_S02={render:function renderS02(s,d,A,frame,btn,chapterDialogue,e){
 const phase=s.s02Step||'intro', who=d.characters.irina;
 const desktopReport='assets/objects/CH1-S02-production-report-desktop.png?v=approved-20261109';
 const mobileReport='assets/objects/CH1-S02-production-report-mobile.jpeg';
 if(phase==='intro'){
   const buttons=btn('Открыть отчёт','s02Open','','primary')+(s.s02ReportSeen?btn('Перейти к выводам','s02Conclude','','primary'):'');
   return frame(A.office,chapterDialogue('S02:intro',who.name,who.role,d.s02Prompt,A.irina,buttons),'dialogue-stage dialogue-stage--office s02-scene s02-intro');
 }
 if(phase==='report'){
   const facts=d.report.map(x=>`<div class="s02-fact"><b>${e(x.label)}</b><strong>${e(x.value)}</strong><span>${e(x.note)}</span></div>`).join('');
   const html=`<div class="s02-report-layer" role="dialog" aria-modal="true" aria-labelledby="s02-report-heading">
     <h2 id="s02-report-heading" class="s02-sr-only">Производственный отчёт</h2>
     <img class="s02-report-irina" src="${A.irina}" alt="" aria-hidden="true">
     <div class="s02-report-sheet"><picture><source media="(max-width:720px)" srcset="${mobileReport}">
       <img src="${desktopReport}" alt="Отчёт: производственный цикл 9–16 дней, загрузка 68%, простои 9%, переналадка 70 минут, поиск инструмента 12 минут за смену, ожидание между операциями 2,5 дня, доля выявленных дефектов на финальном контроле 60%, поставки еженедельно, отсутствие материалов — два случая за месяц."></picture></div>
     <details class="s02-report-access"><summary>Показатели текстом</summary><div class="s02-report-access-body">${facts}</div></details>
     <button type="button" class="s02-report-close" data-act="s02Close" aria-label="Закрыть отчёт">×</button>
     <div class="s02-report-bottom">${btn('Перейти к выводам','s02Conclude','','primary')}</div>
   </div>`;
   return frame(A.office,html,'s02-scene s02-report-stage');
 }
 if(phase==='conclusion'){
   const options=d.hypotheses.map(x=>`<button type="button" class="s02-answer${s.hypothesis===x.id?' is-selected':''}" data-act="hypothesis" data-id="${e(x.id)}" aria-pressed="${s.hypothesis===x.id}"><span class="s02-answer-mark" aria-hidden="true"></span><span>${e(x.label)}</span></button>`).join('');
   const html=`<div class="s02-choice-layout"><img class="s02-choice-irina" src="${A.irina}" alt="Ирина Соколова">
     <section class="s02-choice-panel" aria-labelledby="s02-choice-title"><h1 id="s02-choice-title">Какой вывод можно сделать?</h1>
     <div class="s02-choice-options" role="group" aria-label="Выберите один вывод">${options}</div>
     <div class="s02-choice-actions"><button type="button" class="btn primary" data-act="confirmHyp"${s.hypothesis?'':' disabled'}>Продолжить</button></div>
     </section></div>`;
   return frame(A.office,html,'s02-scene s02-choice-stage');
 }
 const selected=d.hypotheses.find(x=>x.id===s.hypothesis);
 if(selected)return frame(A.office,chapterDialogue('S02:feedback:'+selected.id,who.name,who.role,selected.reply,A.irina_focused,btn('Продолжить','next','S03','primary')),'dialogue-stage dialogue-stage--office s02-scene s02-feedback');
 return frame(A.office,chapterDialogue('S02:intro',who.name,who.role,d.s02Prompt,A.irina,btn('Открыть отчёт','s02Open','','primary')),'dialogue-stage dialogue-stage--office s02-scene s02-intro');
}};