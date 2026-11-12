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
  function portfolioText(ids) {
    return Array.isArray(ids) ? (ids.length?ids.join(', '):'Не выбраны') : 'Нет подтверждённой записи';
  }
  function buildS08(st,history={}){
    const s=clean(st);
    if(!canMoveToS08(s))return null;
    const chosen=S07_OPTIONS.find(o=>o.id===s.s07Decision);
    const initial=history.initialPortfolio??history.initialSelected??null;
    const final=history.finalPortfolio??history.finalSelected??null;
    const first=s.firstSubmitted;
    const firstErrors=first?.errors?.length||0;
    const edu=history.edu01Result;
    const committee=history.s05;
    const revised=Array.isArray(initial)&&Array.isArray(final) ? JSON.stringify([...initial].sort())!==JSON.stringify([...final].sort()) : null;
    return [
      {title:'1. Инвестиционный приоритет',body:history.initialPriority??'Нет подтверждённой записи о первоначальном приоритете.'},
      {title:'2. Инвестиционный портфель',body:'Первоначальный: '+portfolioText(initial)+'. Итоговый: '+portfolioText(final)+'. Расходы: '+(history.finalCost==null?'не переданы из действующей игры':history.finalCost+' млн у.е.')+'.'},
      {title:'3. Результат EDU-01',body:edu??'Результат EDU-01 не передан из действующей игры. Не считать задание непройденным без проверки сохранения.'},
      {title:'4. Пересмотр решения',body:revised===null?'Нет проверенной записи о сравнении двух портфелей.':revised?'Портфель изменён. Сам факт пересмотра не является правильным или неправильным решением.':'Первоначальный портфель сохранён. Сам факт сохранения не является правильным или неправильным решением.'},
      {title:'5. Инвестиционный комитет',body:committee??'Не переданы утверждённые данные действующей S05; её сценарий не подменять.'},
      {title:'6. Производственная ситуация З-214',body:'Изучено документов: '+s.docsOpened.length+' из 3. Шлифование не началось по плану, впереди два заказа. Причина неизвестна. Оперативное заключение принято; первая полная попытка: '+(first?.correct?'без ошибок':firstErrors+' ошибочных выводов, затем исправлены')+'.'},
      {title:'7. Оперативное решение',body:'Выбрано: '+chosen.title+'. Возможная польза: '+chosen.benefit+' Ограничения: '+chosen.limitations},
      {title:'8. Профессиональный вывод',body:'Подтверждены только установленные данные документов. Причина задержки, готовность ресурсов и возможность изменить очередь требуют дополнительной проверки. Принятое решение не означает внедрения инвестиций или гарантированной отгрузки заказа.'}
    ];
  }
  return Object.freeze({GAME_CLOCK,DOCUMENTS,STATEMENTS,S07_OPTIONS,initial,clean,openDocument,canStart,setAnswer,submit,canMoveToS07,selectS07,canMoveToS08,materialsForExistingPanel,buildS08});
});