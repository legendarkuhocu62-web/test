/* S08 presentation-only pagination. No game state or scenario rules are changed. */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.CEH_S08_PAGES=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function limit(width,height,report){
    const w=Number(width)||390,h=Number(height)||844;
    if(w<=360&&h<=650)return report?170:180;
    if(w<=720)return report?240:250;
    return report?670:550;
  }
  function chunks(source,maxChars){
    const words=String(source??'').trim().match(/\S+\s*/g)||[];
    if(!words.length)return ['Нет данных для отображения.'];
    const pages=[];let current='';
    for(const token of words){
      const word=token.trimEnd();
      if(current&&current.length+word.length+1>maxChars){
        pages.push(current.trim());current='';
      }
      // A single unusually long unbroken token is kept whole: never silently cut content.
      current+=(current?' ':'')+word;
    }
    if(current)pages.push(current.trim());
    return pages;
  }
  const stages=[
    ['С чего началось','Что ты изменил','К чему это может привести'],
    ['Твоя позиция','Реакция комитета','Что важно проверить'],
    ['Что говорят документы','Как ты разобрался','Какое решение предложил']
  ];
  function causes(model,width,height){
    const result=[],textLimit=limit(width,height,false);
    const chains=Array.isArray(model?.chains)?model.chains:[];
    chains.forEach((chain,i)=>{
      (Array.isArray(chain.parts)?chain.parts:[]).forEach((part,j)=>{
        const pieces=chunks(part,textLimit);
        pieces.forEach((text,k)=>result.push({
          type:'statement',title:chain.title,section:i+1,stage:stages[i]?.[j]||'Что произошло',
          label:pieces.length>1?'Часть '+(k+1)+' из '+pieces.length:'',text
        }));
      });
      if(i===0){
        const selected=Array.isArray(model.initiativeDetails)?model.initiativeDetails:[];
        if(!selected.length)result.push({type:'statement',section:1,title:chain.title,stage:'Выбранные мероприятия',text:'Нет сохранённых данных об итоговом наборе инвестиций.',label:''});
        selected.forEach((item,k)=>{
          result.push({type:'initiative',section:1,title:'Твоё инвестиционное предложение',stage:'Мероприятие '+(k+1)+' из '+selected.length,item});
        });
      }
      if(i===2){
        const details=Array.isArray(model.eduDetails)?model.eduDetails:[];
        details.forEach((line,k)=>chunks(line,textLimit).forEach((text,j,arr)=>result.push({
          type:'edu',section:3,title:'Что ты проверял в EDU-01',stage:'Задание '+(k+1)+' из '+details.length,
          label:arr.length>1?'Часть '+(j+1)+' из '+arr.length:'',text
        })));
      }
    });
    result.push({type:'takeaway',section:3,title:'Главное, что стоит запомнить',stage:'Твой профессиональный вывод',
      items:Array.isArray(model?.takeaway)?model.takeaway:[]});
    return result;
  }
  function report(sections,width,height){
    const max=limit(width,height,true),pages=[];
    for(const [i,section] of (Array.isArray(sections)?sections:[]).entries()){
      const segments=chunks(section.body,max);
      segments.forEach((text,j)=>pages.push({
        title:section.title,section:i+1,part:j+1,partTotal:segments.length,text
      }));
    }
    return pages;
  }
  return Object.freeze({chunks,limit,causes,report});
});
