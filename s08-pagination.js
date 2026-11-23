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
  return value.replace(/([.!?])\s+(?=(?:[А-ЯЁ«]|[A-M] «))/gu,'$1\n')
   .replace(/([,;])\s+(?=[A-M] «)/gu,'$1\n')
   .split('\n').filter(Boolean);
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
  const shortPhone=w>350&&w<=430&&h<=700;
  return Math.max(report?148:128,h-(report?(w<=720?345:265):(w<=720?(shortPhone?420:364):393)));
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
  const budget=heightBudget(width,height,report)-(report&&width>720?35:0);
  const output=[];let current=[];
  const flush=()=>{if(current.length)output.push(current);current=[];};
  function add(item,sentence){
   const last=current[current.length-1];
   const combine=last&&last.section===item.section&&last.stage===item.stage;
   const candidate=current.map(x=>({...x}));
   if(combine)candidate[candidate.length-1].text+=' '+sentence;
   else candidate.push({...item,text:sentence});
   const sections=new Set(candidate.map(x=>x.section)).size;
   // A long portfolio is a semantic list: do not crowd all A–M labels onto one card.
   const markers=(candidate.map(x=>x.text).join(' ').match(/\b[A-M] «/g)||[]).length;
   const stagesCount=new Set(candidate.map(x=>x.stage)).size;
   if(current.length&&(pageCost(candidate,width,report)+(report&&markers>1?28:0)>budget||sections>maxSections||markers>(report?3:4)||(!report&&width>720&&stagesCount>3))){
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
 // The approved condition / risk / limitation triplet must remain intact.
 // Pair compact initiatives only where the actual viewport has enough room.
 function initiativePages(selected,width,height){
  const w=Number(width)||390,h=Number(height)||844;
  const desktop=w>=960&&h>=720;
  const tallPhone=w>=390&&w<=720&&h>=800;
  const pairAllowed=desktop||tallPhone;
  const length=x=>[x.title,x.conditions,x.risks,x.not].reduce((n,v)=>n+clean(v).length,0);
  const pages=[];
  for(let k=0;k<selected.length;k++){
   const item=selected[k],next=selected[k+1];
   const combined=next&&length(item)+length(next);
   const bothFit=pairAllowed&&next&&
    length(item)<=(desktop?320:215)&&length(next)<=(desktop?320:215)&&
    combined<=(desktop?600:405);
   if(bothFit){
    pages.push({type:'initiativeGroup',section:1,title:'Твоё инвестиционное предложение',
     stage:'Мероприятия '+(k+1)+'–'+(k+2)+' из '+selected.length,
     items:[item,next]});
    k++;
   }else{
    pages.push({type:'initiative',section:1,title:'Твоё инвестиционное предложение',
     stage:'Мероприятие '+(k+1)+' из '+selected.length,item});
   }
  }
  return pages;
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
    result.push(...initiativePages(selected,width,height));
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
  // The detailed report has eight immutable semantic sections, but a section
  // is NOT a page. On spacious viewports group 3–4 short related sections,
  // preserving every sentence and letting the measured browser tests guard fit.
  const maxSections=width>720?3:(width>=390&&height>=760?3:2);
  const pages=pack(items,width,height,true,maxSections).map(entries=>({
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
