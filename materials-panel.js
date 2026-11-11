/* ЦЕХ 404 · One read-only enterprise materials dialog.
   The game owns all state; viewing this dialog never changes progress. */
(function () {
  'use strict';
  const el=(tag,className,text)=>{
    const n=document.createElement(tag);
    if(className)n.className=className;
    if(text!==undefined)n.textContent=String(text);
    return n;
  };
  function create({getState,data,root}){
    if(typeof getState!=='function'||!data||!root)throw new Error('CEH_MATERIALS: missing dependencies');
    let dialog=null,opener=null,tab='materials';
    const eligible=s=>s.scene==='S04'||s.scene==='S03'||(s.scene==='S02'&&s.s02ReportSeen);
    const eduSeen=s=>Array.isArray(s.initialSelected)&&
      (s.returnToReview===true||!['priority','catalog','eduIntro'].includes(s.s04Mode));
    function add(box,title,detail){
      const section=el('section','ceh-materials-item');
      section.append(el('h3','',title),el('p','',detail));
      box.append(section);
    }
    function portfolio(ids){
      if(!Array.isArray(ids)||!ids.length)return 'Инициативы не выбраны.';
      const rows=ids.map(id=>(data.initiatives||[]).find(x=>x.id===id)).filter(Boolean);
      if(!rows.length)return 'Инициативы не выбраны.';
      const total=rows.reduce((n,x)=>n+x.cost,0);
      return rows.map(x=>x.title+' — '+x.cost+' млн у. е.').join('\n')+
        '\nВсего: '+total+' млн у. е.';
    }
    function materials(box,s){
      if(s.s02ReportSeen){
        add(box,'Производственный отчёт',
          (data.report||[]).map(x=>x.label+': '+x.value+'. '+x.note).join('\n'));
      }
      for(const id of s.asked03||[]){
        const p=(data.people||[]).find(x=>x.id===id);
        if(p)add(box,p.name+' · '+p.role,
          p.speech+'\n\nВопрос: '+p.question+'\nОтвет: '+p.reply);
      }
      if(eduSeen(s)){
        add(box,'Схема контроля наружного диаметра ЭК-В20-01',
          'Вал В-20. Контролируемый размер: Ø20,00 ±0,05 мм.');
        add(box,'Акт о несоответствии продукции № НС-008/26',
          'Изделие: Вал В-20. Партия П-0811-04. Место выявления: окончательный контроль.\n'+
          'Деталь В-20-01 — измеренный диаметр 20,02 мм.\n'+
          'Деталь В-20-02 — измеренный диаметр 20,08 мм.');
      }
      if(!box.children.length)add(box,'Материалы ещё не изучены',
        'Полученные по сюжету документы и позиции специалистов появятся здесь.');
    }
    function decisions(box,s){
      if(s.name)add(box,'Персональный пропуск','Имя: '+s.name);
      if(s.hypothesisConfirmed&&s.hypothesis){
        const h=(data.hypotheses||[]).find(x=>x.id===s.hypothesis);
        if(h)add(box,'Первоначальная производственная гипотеза',h.label);
      }
      if(s.priority){
        const g=(data.goals||[]).find(x=>x.id===s.priority);
        if(g)add(box,'Инвестиционный приоритет',g.label);
      }
      if(Array.isArray(s.initialSelected))
        add(box,'Первоначальный инвестиционный портфель',portfolio(s.initialSelected));
      if(eduSeen(s)&&(s.returnToReview===true||['gromov','reviewFinal','savedFinal'].includes(s.s04Mode)))
        add(box,'EDU-01','Проверка технических документов пройдена.');
      if(Array.isArray(s.finalSelected)){
        const before=Array.isArray(s.initialSelected)?s.initialSelected.slice().sort().join(','):'';
        const after=s.finalSelected.slice().sort().join(',');
        add(box,'Окончательный инвестиционный портфель',
          portfolio(s.finalSelected)+'\n'+(before===after?
          'Первоначальный портфель сохранён.':'Портфель пересмотрен.'));
      }
      if(!box.children.length)add(box,'Мои решения',
        'Здесь появятся решения, которые ты уже принял в игре.');
    }
    function ensureDialog(){
      if(dialog&&dialog.isConnected)return dialog;
      dialog=el('dialog','ceh-materials-dialog');
      dialog.setAttribute('aria-labelledby','ceh-materials-title');
      const header=el('div','ceh-materials-header');
      const title=el('h2','','Материалы предприятия');
      title.id='ceh-materials-title';
      const close=el('button','ceh-materials-close','Закрыть');
      close.type='button';
      close.addEventListener('click',()=>dialog.close());
      header.append(title,close);
      const nav=el('div','ceh-materials-tabs');
      nav.setAttribute('role','tablist');
      nav.setAttribute('aria-label','Разделы справки');
      const content=el('div','ceh-materials-content');
      content.id='ceh-materials-panel';
      content.setAttribute('role','tabpanel');
      content.tabIndex=0;
      for(const [value,label] of [['materials','Материалы предприятия'],['decisions','Мои решения']]){
        const b=el('button','ceh-materials-tab',label);
        b.type='button';
        b.dataset.tab=value;
        b.setAttribute('role','tab');
        b.setAttribute('aria-controls',content.id);
        b.addEventListener('click',()=>{tab=value;refresh();b.focus({preventScroll:true});});
        b.addEventListener('keydown',ev=>{
          if(!['ArrowRight','ArrowLeft','Home','End'].includes(ev.key))return;
          ev.preventDefault();
          tab=ev.key==='ArrowLeft'?'materials':ev.key==='ArrowRight'?'decisions':
            ev.key==='Home'?'materials':'decisions';
          refresh();
          dialog.querySelector('[data-tab="'+tab+'"]').focus({preventScroll:true});
        });
        nav.append(b);
      }
      dialog.append(header,nav,content);
      dialog.addEventListener('close',()=>{
        if(opener&&opener.isConnected)opener.focus({preventScroll:true});
      });
      dialog.addEventListener('keydown',ev=>{
        if(ev.key!=='Tab')return;
        const items=[...dialog.querySelectorAll('button,[tabindex="0"]')].filter(n=>
          !n.disabled&&n.getAttribute('tabindex')!=='-1');
        if(!items.length)return;
        const first=items[0],last=items[items.length-1];
        if(ev.shiftKey&&document.activeElement===first){ev.preventDefault();last.focus();}
        else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first.focus();}
      });
      document.body.append(dialog);
      return dialog;
    }
    function refresh(){
      const s=getState(),dlg=ensureDialog();
      for(const b of dlg.querySelectorAll('[role="tab"]')){
        const active=b.dataset.tab===tab;
        b.setAttribute('aria-selected',String(active));
        b.tabIndex=active?0:-1;
      }
      const content=dlg.querySelector('.ceh-materials-content');
      content.setAttribute('aria-label',tab==='materials'?'Материалы предприятия':'Мои решения');
      content.replaceChildren();
      (tab==='materials'?materials:decisions)(content,s);
      content.scrollTop=0;
    }
    function attach(){
      root.querySelector('.ceh-materials-trigger')?.remove();
      const s=getState();
      // The S02 production report is an immersive document view with its own
      // close control in the top-right corner. Do not cover that control.
      // Materials remain available as soon as the report is closed.
      if(!eligible(s)||(s.scene==='S02'&&s.s02Step==='report'))return;
      const trigger=el('button','ceh-materials-trigger','Материалы предприятия');
      trigger.type='button';
      trigger.setAttribute('aria-haspopup','dialog');
      trigger.addEventListener('click',()=>{
        opener=trigger;
        tab='materials';
        refresh();
        const dlg=ensureDialog();
        dlg.showModal();
        dlg.querySelector('.ceh-materials-close').focus({preventScroll:true});
      });
      root.append(trigger);
    }
    return {attach};
  }
  window.CEH_MATERIALS={create};
})();