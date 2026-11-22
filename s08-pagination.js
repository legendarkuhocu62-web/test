/* S08: semantic, viewport-aware presentation pagination.
   Game state, scenario text and professional conclusions are never modified. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.CEH_S08_PAGES=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
 // Retained as a compatibility utility; S08 screens now use semanticSentenceParts.
 function limit(width,height,report){
  const w=Number(width)||390,h=Number(height)||844;
  if(w<=360&&h<=650)return report?170:180;
  if(w<=720)return report?240:250;
  return report?670:550;
 }
 function chunks(source,maxChars){
  const words=clean(source).match(/\S+\s*/g)||[];
  if(!words.length)return ['Нет данных для отображения.'];
  const pages=[];let current='';
  for(const token of words){
   const word=token.trimEnd();
   if(current&&current.length+word.length+1>maxChars){pages.push(current.trim());current='';}
   current+=(current?' ':'')+word;
  }
  if(current)pages.push(current.trim());
  return pages;
 }
 // A period is a safe break only before the start of another sentence.
 // No break on arbitrary characters, in the middle of a word, or on semicolons
 // separating an initiative's condition / risk / limitation.
 function semanticSentences(source){
  const value=clean(source);
  if(!value)return [];
  return value.replace(/([.!?])\s+(?=[А-ЯЁ«])/gu,'$1\n').split('\n').filter(Boolean);
 }
 const stages=[
  ['С чего началось','Что ты изменил','К чему это может привести'],
  ['Твоя позиция','Реакция комитета','Что важно проверить'],
  ['Что говорят документы','Как ты разобрался','Какое решение предложил']
 ];
 // Conservative viewport estimate; browser tests validate actual DOM overflow.
 // The footer, navigation, heading and safe-area padding are reserved before packing.
 function heightBudget(width,height,report){
  const w=Number(width)||390,h=Number(height)||844;
  return Math.max(report?148:128,h-(report?(w<=720?280:205):(w<=720?364:288)));
 }
 function estimate(text,width,report){
  const w=Number(width)||390;
  const usable=w<=720?Math.max(190,w-(report?87:98)):Math.min(830,w-200);
  const chars=Math.max(23,Math.floor(usable/(w<=720?(report?7.3:7.9):9.3)));
  const words=clean(text).split(' ');
  let lines=1,used=0;
  for(const word of words){
   const len=word.length+(used?1:0);
   if(used&&used+len>chars){lines++;used=word.length;}
   else used+=len;
   if(used>chars){
    lines+=Math.floor((used-1)/chars);
    used=(used-1)%chars+1;
   }
  }
  return lines*(w<=720?(report?19:22):(report?23:27));
 }
 function pageCost(blocks,width,report){
  return blocks.reduce((sum,b)=>sum+estimate(b.text,width,report)+
   (width<=720?(report?28:29):(report?36:38)),0);
 }
 function pack(items,width,height,report,maxSections=1){
  const budget=heightBudget(width,height,report);
  const output=[];let current=[];
  const flush=()=>{if(current.length)output.push(current);current=[];};
  function add(item,sentence){
   const last=current[current.length-1];
   const combine=last&&last.section===item.section&&last.stage===item.stage;
   const candidate=current.map(x=>({...x}));
   if(combine)candidate[candidate.length-1].text+=' '+sentence;
   else candidate.push({...item,text:sentence});
   const sections=new Set(candidate.map(x=>x.section)).size;
   if(current.length&&(pageCost(candidate,width,report)>budget||sections>maxSections)){
    flush();
    current.push({...item,text:sentence});
   }else{
    current=candidate;
   }
  }
  for(const item of items){
   const pieces=semanticSentences(item.text);
   for(const sentence of pieces)add(item,sentence);
  }
  flush();
  return output;
 }
 function narrative(items,width,height,type,section,title){
  return pack(items,width,height,false).map(blocks=>({
   type,section,title,stage:blocks[0].stage,
   text:blocks.map(x=>x.text).join(' '),blocks,label:''
  }));
 }
 function causes(model,width,height){
  const result=[],chains=Array.isArray(model?.chains)?model.chains:[];
  chains.forEach((chain,i)=>{
   const parts=Array.isArray(chain.parts)?chain.parts:[];
   const blocks=parts.map((text,j)=>({
    stage:stages[i]?.[j]||'Что произошло',section:i+1,text:clean(text)
   }));
   result.push(...narrative(blocks,width,height,'statement',i+1,chain.title));
   if(i===0){
    const selected=Array.isArray(model.initiativeDetails)?model.initiativeDetails:[];
    if(!selected.length)result.push({
     type:'statement',section:1,title:chain.title,stage:'Выбранные мероприятия',
     text:'Нет сохранённых данных об итоговом наборе инвестиций.',label:''
    });
    selected.forEach((item,k)=>result.push({
     type:'initiative',section:1,title:'Твоё инвестиционное предложение',
     stage:'Мероприятие '+(k+1)+' из '+selected.length,item
    }));
   }
   if(i===2){
    const details=Array.isArray(model.eduDetails)?model.eduDetails:[];
    const eduItems=details.map((text,k)=>({
     stage:'Задание '+(k+1)+' из '+details.length,section:3,text:clean(text)
    }));
    result.push(...narrative(eduItems,width,height,'edu',3,'Что ты проверял в EDU-01'));
   }
  });
  result.push({type:'takeaway',section:3,title:'Главное, что стоит запомнить',
   stage:'Твой профессиональный вывод',
   items:Array.isArray(model?.takeaway)?model.takeaway:[]});
  return result;
 }
 function report(sections,width,height){
  const items=(Array.isArray(sections)?sections:[]).map((section,i)=>({
   section:i+1,stage:section.title,title:section.title,text:clean(section.body)
  }));
  const pages=pack(items,width,height,true,2).map(entries=>({
   title:entries[0].title,section:entries[0].section,
   text:entries.map(x=>x.text).join(' '),entries
  }));
  const counts=new Map(),seen=new Map();
  for(const page of pages)for(const entry of page.entries)
   counts.set(entry.section,(counts.get(entry.section)||0)+1);
  for(const page of pages)for(const entry of page.entries){
   const count=(seen.get(entry.section)||0)+1;seen.set(entry.section,count);
   entry.part=count;entry.partTotal=counts.get(entry.section);
  }
  return pages;
 }
 return Object.freeze({chunks,limit,semanticSentences,heightBudget,causes,report});
});
