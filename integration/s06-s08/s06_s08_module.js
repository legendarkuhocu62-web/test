/* ЦЕХ 404 · Подготовительный модуль S06–S08 от 12.11.2026.
 * Без изменений S00–S05, бюджета, DOM и основного localStorage.
 * Пока НЕ подключён к опубликованной игре.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CEH_S06_S08_PREP = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const DOCUMENTS = Object.freeze([
    {
      id: 'route',
      title: 'Маршрутный лист заказа З-214. Выписка',
      body: 'Заказ З-214. Операции: токарная обработка — завершена 10.11.2026, 16:00; шлифование — запланировано начало 11.11.2026, 08:00; факт начала по состоянию на 11.11.2026, 12:00 — отсутствует. Дальнейшая операция: контроль качества по производственному плану 13.11.2026, 09:00–12:00.'
    },
    {
      id: 'grinding',
      title: 'Оперативная сводка шлифовального участка. 11.11.2026, 12:00',
      body: 'Заказ З-214 шлифование не начал; перед ним в очереди два других заказа. Предварительный прогноз завершения шлифования при текущей последовательности — 12.11.2026, 16:00. Причина отсутствия старта и возможность изменения очередности не установлены. Нужна проверка фактического графика, сроков других заказов, загрузки и ресурсов.'
    },
    {
      id: 'shipping',
      title: 'План последующих операций и отгрузки заказа З-214',
      body: 'Резерв контроля качества 13.11.2026, 09:00–12:00. План отгрузки 13.11.2026, 16:00. Сведения о подтверждённой готовности упаковки, документов и транспорта отсутствуют. План — не гарантия срока.'
    }
  ]);
  const STATEMENTS = Object.freeze([
    'Шлифование заказа З-214 не началось в запланированное время',
    'Перед заказом З-214 на шлифовальном участке находятся два других заказа',
    'Задержка вызвана неисправностью шлифовального станка',
    'Отгрузка З-214 13 ноября уже невозможна',
    'В плане между окончанием контроля качества и отгрузкой предусмотрено четыре часа'
  ]);
  const ANSWER = Object.freeze(['confirmed','confirmed','check','check','confirmed']);
  const EXPLANATIONS = Object.freeze([
    'Маршрутный лист фиксирует отсутствие начала шлифования к 12:00 при запланированном старте в 08:00.',
    'Оперативная сводка подтверждает два других заказа перед З-214.',
    'Из очереди не следует неисправность станка: причина задержки не установлена.',
    'Риск не равен установленному срыву: прогноз и готовность ресурсов необходимо проверить.',
    'Четыре часа — интервал плана, а не подтверждение готовности упаковки и документов.'
  ]);
  const S07_OPTIONS = Object.freeze([
    {
      id:'diagnose',
      title:'Уточнить причины задержки и скорректировать график по подтверждённым данным',
      benefit:'Снижает риск действий на основе неподтверждённых причин.',
      limitations:'Нужно время, участие мастера и диспетчера, проверка фактических сроков и ресурсов.'
    },
    {
      id:'priority',
      title:'Проверить возможность повысить приоритет З-214 с учётом двух других заказов',
      benefit:'Заказ потенциально может раньше поступить на шлифование.',
      limitations:'До перестановки нужно проверить сроки других заказов, последовательность операций, ресурсы и полномочия. Нельзя автоматически перемещать заказ.'
    },
    {
      id:'extra',
      title:'Проверить возможность организовать дополнительную смену',
      benefit:'При подтверждении условий может добавиться доступное рабочее время.',
      limitations:'Нужно проверить персонал, оборудование, материалы, расходы, режим труда, отдых и безопасность.'
    }
  ]);
  const GAME_CLOCK = '11.11.2026, 12:00';

  function initial() {
    return {
      docsOpened: [], answers: [null,null,null,null,null],
      firstSubmitted: null, lastSubmission: null, finalConclusion: null,
      s07Decision: null
    };
  }
  function clean(v) {
    const base=initial(), raw=v && typeof v==='object' ? v : {};
    const ids=DOCUMENTS.map(d=>d.id);
    base.docsOpened=Array.isArray(raw.docsOpened)?[...new Set(raw.docsOpened.filter(id=>ids.includes(id)))]:[];
    base.answers=Array.from({length:5}, (_,i)=>['confirmed','check'].includes(raw.answers?.[i])?raw.answers[i]:null);
    const validSubmission=x=>x&&typeof x==='object'&&Array.isArray(x.answers)&&x.answers.length===5&&x.answers.every(a=>['confirmed','check'].includes(a));
    const normalizeSubmission=x=>validSubmission(x)?{answers:x.answers.slice(),correct:x.answers.every((a,i)=>a===ANSWER[i]),errors:x.answers.map((a,i)=>a===ANSWER[i]?null:EXPLANATIONS[i]).filter(Boolean)}:null;
    base.firstSubmitted=normalizeSubmission(raw.firstSubmitted);
    base.lastSubmission=normalizeSubmission(raw.lastSubmission);
    base.finalConclusion=normalizeSubmission(raw.finalConclusion);
    base.s07Decision=S07_OPTIONS.some(o=>o.id===raw.s07Decision)?raw.s07Decision:null;
    return base;
  }
  function canStart(st) { return clean(st).docsOpened.length===DOCUMENTS.length; }
  function openDocument(st,id) {
    if (!DOCUMENTS.some(d=>d.id===id)) return clean(st);
    const next=clean(st);
    if(!next.docsOpened.includes(id)) next.docsOpened.push(id);
    return next;
  }
  function setAnswer(st,index,value) {
    const next=clean(st);
    if (!canStart(next) || !Number.isInteger(index) || index<0 || index>=5 || !['confirmed','check'].includes(value) || next.finalConclusion) return next;
    next.answers[index]=value;
    return next;
  }
  function submit(st) {
    const next=clean(st);
    if(!canStart(next)) return {state:next,accepted:false,reason:'Не изучены все три документа'};
    if(next.finalConclusion) return {state:next,accepted:true,reason:'Заключение уже принято'};
    if(next.answers.some(a=>a===null))return {state:next,accepted:false,reason:'Заполни все пять утверждений перед отправкой'};
    const attempt={answers:next.answers.slice(),correct:next.answers.every((a,i)=>a===ANSWER[i]),errors:next.answers.map((a,i)=>a===ANSWER[i]?null:EXPLANATIONS[i]).filter(Boolean)};
    if(!next.firstSubmitted)next.firstSubmitted=attempt;
    next.lastSubmission=attempt;
    if(attempt.correct)next.finalConclusion=attempt;
    return {state:next,accepted:attempt.correct,reason:attempt.correct?'Заключение принято':'Есть выводы, требующие исправления',feedback:attempt.errors};
  }
  function canMoveToS07(st){return Boolean(clean(st).finalConclusion?.correct);}
  function selectS07(st,id) {
    const next=clean(st);
    if(canMoveToS07(next)&&S07_OPTIONS.some(x=>x.id===id))next.s07Decision=id;
    return next;
  }
  function canMoveToS08(st){const s=clean(st);return canMoveToS07(s)&&Boolean(s.s07Decision);}
  function materialsForExistingPanel(st) {
    const s=clean(st);
    return DOCUMENTS.filter(d=>s.docsOpened.includes(d.id));
  }

  // S08 is an interpretation of saved choices, NOT a simulated factory outcome.
  // This module neither modifies the game state nor changes S06/S07 gating.
  const HYPOTHESIS = Object.freeze({
    machine:'что производству срочно нужен новый станок',
    insufficient:'что данных пока недостаточно для определения главной причины',
    quality:'что главная проблема связана с качеством'
  });
  const COMMITTEE = Object.freeze({
    conditions:'Ты предложил проверить исходные условия. Комитет принял аргументацию к рассмотрению, но не утвердил вложения.',
    confidence:'Ты гарантировал эффект без проверки условий. Комитет напомнил, что такой результат нельзя обещать без обоснования.',
    stage:'Ты предложил поэтапный запуск. Комитет отметил возможность оценивать результаты перед следующими вложениями.'
  });
  const DECISION = Object.freeze({
    diagnose:'Ты предложил сначала уточнить причины задержки. Это снижает риск поспешного решения, но потребует времени и данных от участка.',
    priority:'Ты предложил проверить повышение приоритета З-214. Это может помочь ему, но задержать два других заказа. Проверь сроки и полномочия.',
    extra:'Ты предложил проверить дополнительную смену. Проверь персонал, материалы, расходы, режим труда, отдых и безопасность.'
  });
  function validPortfolio(ids, items) {
    const allowed=new Set(items.map(x=>x.id));
    return Array.isArray(ids)?[...new Set(ids.filter(id=>allowed.has(id)))]:null;
  }
  function buildS08ViewModel(st,history={}) {
    const s=clean(st);
    if(!canMoveToS08(s))return null;
    const items=Array.isArray(history.initiatives)?history.initiatives:[];
    const names=new Map(items.map(x=>[x.id,x]));
    const initial=validPortfolio(history.initialSelected??history.initialPortfolio,items);
    const final=validPortfolio(history.finalSelected??history.finalPortfolio,items);
    const goal=Array.isArray(history.goals)?history.goals.find(x=>x.id===history.priority):null;
    const hypothesis=Object.prototype.hasOwnProperty.call(HYPOTHESIS,history.hypothesis)?HYPOTHESIS[history.hypothesis]:null;
    const committee=Object.prototype.hasOwnProperty.call(COMMITTEE,history.committeeDecision)?COMMITTEE[history.committeeDecision]:null;
    const chosen=S07_OPTIONS.find(x=>x.id===s.s07Decision);
    const first=s.firstSubmitted;
    const list=(ids)=>ids===null?'данные не сохранились':ids.length?ids.map(id=>id+' «'+names.get(id).title+'»').join(', '):'мероприятия не выбраны';
    const cost=(ids)=>ids===null?null:ids.reduce((v,id)=>v+(Number(names.get(id).cost)||0),0);
    const shortList=(ids)=>ids===null?'не сохранился':ids.length?ids.slice(0,2).map(id=>id+' «'+names.get(id).title+'»').join(', ')+(ids.length>2?' и ещё '+(ids.length-2):''):'не выбраны';
    const shortPriced=(ids)=>shortList(ids)+(ids===null?'':' — '+cost(ids)+' млн у.е.');
    const priced=(ids)=>list(ids)+(ids===null?'':' — '+cost(ids)+' млн у.е.');
    const tiny=(ids)=>ids===null?'нет данных':ids.length?ids[0]+' «'+names.get(ids[0]).title+'»'+(ids.length>1?' и ещё '+(ids.length-1):'')+' — '+cost(ids)+' млн':'не выбраны';
    const shortHypothesis={machine:'нужен новый станок',insufficient:'данных недостаточно для вывода',quality:'основная проблема — качество'};
    const shortGoal={capacity:'мощности',losses:'сокращение потерь',quality:'качество и устойчивость'};
    const changed=initial!==null&&final!==null?initial.length!==final.length||initial.some(x=>!final.includes(x)):null;
    const added=changed?final.filter(id=>!initial.includes(id)):[];
    const removed=changed?initial.filter(id=>!final.includes(id)):[];
    const labelled=id=>id+' «'+names.get(id).title+'»';
    const labelledList=ids=>ids.length?ids.map(labelled).join(', '):'нет';
    const changeText=changed===null?'Данные для сравнения двух портфелей сохранились не полностью.':
      !changed?'После проверки документов ты оставил прежний портфель. Это не доказывает его эффективность.':
      'После документов ты добавил: '+labelledList(added)+'; исключил: '+labelledList(removed)+'. Никакая инвестиция ещё не внедрена.';
    const firstErrors=first&&!first.correct?first.errors.slice():[];
    const docText=!first?'Заключение принято, но запись первой попытки отсутствует.':
      first.correct?'Ты с первого раза отличил факты от предположений по документам З-214.':
      'В первой попытке были неподтверждённые выводы: '+firstErrors.join(' ')+' После проверки документов ты исправил заключение.';
    const edu=history.edu01Complete===true?'Ты проверил документы ОТК, но причина отклонения одной детали не доказана.':'Подтверждение прохождения EDU-01 не сохранилось.';
    const eduDetails=history.edu01Complete===true?[
      'По схеме ЭК-В20-01 ты вычислил предельные размеры: от 19,95 до 20,05 мм.',
      'По акту ОТК ты определил: у детали В-20-02 размер 20,08 мм — превышение верхнего предела на 0,03 мм.',
      'Ты отделил подтверждённое несоответствие одной детали от догадок о всей партии и причинах дефекта.',
      'Ты выбрал дополнительные сведения для обоснования инвестиций. Отдельные ошибочные ответы в EDU-01 не записывались.'
    ]:['Подтверждение выполнения EDU-01 в сохранении отсутствует.'];

    const initiativeDetails=(final||[]).map(id=>{const x=names.get(id);return {id,title:x.title,cost:Number(x.cost)||0,
        conditions:x.conditions||'Условие не указано',risks:x.risks||'Риски не указаны',not:x.not||'Ограничения не указаны'};});
    const investmentMeaning=initiativeDetails.length?
      'Итоговый портфель: '+initiativeDetails.length+' мероприятий. Условия, риски и ограничения каждой меры перечислены ниже. Эти меры пока не внедрены.':
      'Инвестиции не внедрены. Возможную пользу нужно проверять на реальных производственных причинах.';
    const investmentTip=final?.includes('A')?'Перед покупкой станка проверь нехватку мощности.':
      final?.includes('J')?'Электронная доска не ускоряет станок.':
      final?.includes('D')?'Контроль не устраняет причину брака.':
      final?.includes('L')||final?.includes('M')?'Нулевые капитальные затраты не означают отсутствия других расходов.':
      initiativeDetails.length?'У каждой инвестиции есть условия и риски.':
      'Перед инвестициями проверь причины потерь.';
    const option=chosen?DECISION[chosen.id]:'Оперативный выбор не сохранился.';
    const evidenceTip=first&&!first.correct?'После проверки данных можно исправлять вывод.':
      'Задержка есть, но её причина неизвестна.';
    const orderTip=chosen?.id==='priority'?'Помогая З-214, проверь сроки двух других заказов.':
      chosen?.id==='extra'?'Дополнительная смена не гарантирует срок.':
      'Прежде чем менять график, проверь причины.';
    const committeeText=committee||'Выбор аргумента для комитета не сохранился; результат заседания не предполагаем.';
    const before=priced(initial),after=priced(final),shortBefore=shortPriced(initial),shortAfter=shortPriced(final);
    return {
      initial,final,changed,added,removed,first,firstErrors,eduDetails,initiativeDetails,changeText,committeeDecision:committee?history.committeeDecision:null,
      summary:[
        {title:'С чего всё началось',text:'Гипотеза: '+(shortHypothesis[history.hypothesis]||'не сохранилась')+'. Приоритет: '+(shortGoal[history.priority]||'не сохранился')+'.'},
        {title:'Твои инвестиции',text:'Первый: '+tiny(initial)+'. Итог: '+tiny(final)+'. '+(changed===null?'Сравнение недоступно.':changed?'Состав изменён.':'Состав сохранён.')},
        {title:'По заказу З-214',text:(first?first.correct?'Заключение принято с первого раза.':'Заключение исправлено после проверки.':'Заключение принято.')+' '+(chosen?.id==='priority'?'Ты предложил проверить приоритет заказа.':chosen?.id==='extra'?'Ты предложил проверить дополнительную смену.':'Ты предложил уточнить причину задержки.')}
      ],
      chains:[
        {title:'От предположения к инвестициям',parts:[
          'Твоя гипотеза: '+(shortHypothesis[history.hypothesis]||'не сохранилась')+'. Она не доказана.',
          changeText,
          investmentMeaning
        ]},
        {title:'От портфеля к разговору с комитетом',parts:[
          'Твой приоритет: '+(shortGoal[history.priority]||'не сохранился')+'. Итоговый портфель: '+shortAfter+'.',
          committeeText,
          'Выбранные инициативы не внедрены. Проверка условий и рисков необходима до вложений.'
        ]},
        {title:'От документов З-214 к оперативному решению',parts:[
          edu,
          docText+' З-214: шлифование не началось, впереди два заказа. Причина неизвестна.',
          option+' Отгрузка пока не подтверждена.'
        ]}
      ],
      takeaway:[investmentTip,evidenceTip,orderTip]
    };
  }
  function portfolioText(ids,history) {
    if(!Array.isArray(ids))return 'Данные не сохранились';
    const items=Array.isArray(history.initiatives)?history.initiatives:[];
    return ids.length?ids.map(id=>{
      const x=items.find(o=>o.id===id);
      return x?id+' «'+x.title+'»':'Неизвестная инициатива';
    }).join(', '):'Не выбраны';
  }
  function buildS08(st,history={}){
    const s=clean(st);
    if(!canMoveToS08(s))return null;
    const vm=buildS08ViewModel(st,history);
    const first=s.firstSubmitted,option=S07_OPTIONS.find(x=>x.id===s.s07Decision);
    const initial=history.initialSelected??history.initialPortfolio;
    const final=history.finalSelected??history.finalPortfolio;
    const validCommittee=Object.prototype.hasOwnProperty.call(COMMITTEE,history.committeeDecision);
    const committee=validCommittee?COMMITTEE[history.committeeDecision]:(history.s05||'Аргументация комитета не сохранилась.');
    const firstText=!first?'сведения о первой попытке не сохранились':
      first.correct?'с первой попытки без ошибок':
      first.errors.length+' ошибочных выводов, затем исправлены';
    const finalCost=history.finalCost??vm.final?.reduce((sum,id)=>sum+(Number(history.initiatives?.find(x=>x.id===id)?.cost)||0),0);
    return [
      {title:'1. Инвестиционный приоритет',body:history.initialPriority||'Не сохранился.'},
      {title:'2. Инвестиционный портфель',body:'Первоначальный: '+portfolioText(initial,history)+
        '. Итоговый: '+portfolioText(final,history)+'. Расходы по итоговому портфелю: '+(finalCost==null?'данные не сохранились':finalCost+' млн у.е.')+'.'},
      {title:'3. Результат EDU-01',body:vm.eduDetails.join(' ')+' '+(history.edu01Result||(
        history.edu01Complete?'Проверка документов ОТК пройдена; первая ошибочная попытка не фиксировалась.':'Подтверждение завершения EDU-01 не сохранилось.'))},
      {title:'4. Пересмотр решения',body:vm.changed===null?'Первый или итоговый портфель не сохранился.':
        vm.changed?vm.changeText+'. Добавлены: '+(vm.added.map(id=>id+' «'+(history.initiatives||[]).find(x=>x.id===id)?.title+'»').join(', ')||'нет')+'. Исключены: '+(vm.removed.map(id=>id+' «'+(history.initiatives||[]).find(x=>x.id===id)?.title+'»').join(', ')||'нет')+
        '. Сам факт пересмотра не является оценкой правильности.':'Первоначальный портфель сохранён; это не оценка правильности.'},
      {title:'5. Инвестиционный комитет',body:committee},
      {title:'6. Производственная ситуация З-214',body:'Изучено документов: '+s.docsOpened.length+' из 3. Шлифование не началось по плану, впереди два заказа. Причина неизвестна. Оперативное заключение принято; первая полная попытка: '+firstText+'. '+(vm.firstErrors.length?'Почему пришлось исправлять: '+vm.firstErrors.join(' '):'')},
      {title:'7. Оперативное решение',body:'Выбрано: '+option.title+'. Возможная польза: '+option.benefit+' Ограничения: '+option.limitations},
      {title:'8. Профессиональный вывод',body:vm.takeaway.join(' ')+' Выбранные меры не внедрены, отгрузка З-214 не подтверждена. '+vm.initiativeDetails.map(x=>x.id+' «'+x.title+'»: условие — '+x.conditions+'; риск — '+x.risks+'; не решает автоматически — '+x.not+'.').join(' ')}
    ];
  }
  return Object.freeze({GAME_CLOCK,DOCUMENTS,STATEMENTS,S07_OPTIONS,initial,clean,openDocument,canStart,setAnswer,submit,canMoveToS07,selectS07,canMoveToS08,materialsForExistingPanel,buildS08,buildS08ViewModel});
});