/* ЦЕХ 404 — общий диалоговый компонент v2.3.
   Фиксированная рамка персонажа; текст переносится на следующую страницу,
   только когда не помещается. Сценарный текст и состояние не меняются. */
(()=>{
'use strict';
let activeKey='',activeText='',page=0,segments=[''],lastOptions=null;
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function semanticUnits(value){
 const s=String(value??''),out=[];let start=0;
 for(let i=0;i<s.length;i++){
   let end=i+1;
   if(s[i]==='\n'&&s[i+1]==='\n'){
     while(end<s.length&&s[end]==='\n')end++;
   }else if(/[.!?…]/.test(s[i])){
     while(end<s.length&&/[.!?…]/.test(s[end]))end++;
     while(end<s.length&&/["»”’)]/.test(s[end]))end++;
     if(end<s.length&&!/\s/.test(s[end]))continue;
     while(end<s.length&&/\s/.test(s[end]))end++;
   }else continue;
   if(end>start){out.push(s.slice(start,end));start=end;i=end-1}
 }
 if(start<s.length)out.push(s.slice(start));
 return out.length?out:[''];
}
/* Keep the specialist's speech, question and answer on separate screens.
   The delimiters remain part of the segments for lossless navigation/state. */
function semanticBlocks(value){
 const raw=String(value??'');
 const question=raw.indexOf('\n\nВопрос: ');
 if(question<0)return [raw];
 const answer=raw.indexOf('\nОтвет: ',question+2);
 if(answer<0)return [raw];
 return [raw.slice(0,question),raw.slice(question,answer),raw.slice(answer)].filter(Boolean);
}
function visibleText(value){
 return /^\n+(?:Вопрос|Ответ):\s/.test(value)?value.replace(/^\n+/,''):value;
}
/* Совместимость с прежним API: лимит используется только как ориентир;
   предпочтение всегда отдаётся границам предложений. */
function splitExact(value,limit){
 const raw=String(value??''),cap=Math.max(35,Number(limit)||300);
 if(raw.length<=cap)return [raw];
 const units=semanticUnits(raw),out=[];let buffer='';
 for(const unit of units){
   if(buffer&&buffer.length+unit.length>cap){out.push(buffer);buffer=''}
   if(unit.length>cap){
     const parts=unit.match(/\S+\s*|\s+/g)||[unit];
     for(const part of parts){if(buffer&&buffer.length+part.length>cap){out.push(buffer);buffer=''}buffer+=part}
   }else buffer+=unit;
 }
 if(buffer)out.push(buffer);
 return out.length?out:[''];
}
function button(label,act,primary=false){
 return '<button type="button" class="dialogue-control'+(primary?' dialogue-control--primary':'')+'" data-act="'+act+'">'+escapeHTML(label)+'</button>';
}
function render(options){
 lastOptions=options;
 const {key,speaker,role,text,portrait='',finish='',variant='scene',alt=''}=options;
 const raw=String(text??''),keyString=String(key);
 if(activeKey!==keyString||activeText!==raw){
   activeKey=keyString;activeText=raw;page=0;segments=[raw];
 }
 if(page>=segments.length)page=Math.max(segments.length-1,0);
 const final=page===segments.length-1;
 let controls='';
 if(segments.length>1&&page>0){
   controls+=button('Назад','dlgBack');
   // Only Back + Continue; a third button wrapped onto a second row
   // on short phones and squeezed the text out of the fixed frame.
 }
 controls+=final?finish:button('Читать далее','dlgMore',true);
 const segment=segments[page],visible=visibleText(segment);
 const tone=/^Вопрос:\s/.test(visible)?' game-dialogue__text--question':(/^Ответ:\s/.test(visible)?' game-dialogue__text--answer':'');
 const avatar=variant==='inline'||!portrait?'':'<img class="game-dialogue__character" src="'+escapeHTML(portrait)+'" alt="'+escapeHTML(alt||speaker)+'">';
 return '<div class="game-dialogue '+(variant==='inline'?'game-dialogue--inline':'game-dialogue--scene')+'">'+avatar+
   '<section class="game-dialogue__panel" aria-label="Диалог">'+
   '<div class="game-dialogue__speaker"><span class="game-dialogue__name">'+escapeHTML(speaker)+'</span>'+
   (role?'<span class="game-dialogue__role">'+escapeHTML(role)+'</span>':'')+'</div>'+
   '<div class="game-dialogue__text'+tone+'" aria-live="polite"><p>'+escapeHTML(visible).replace(/\n/g,'<br>')+'</p></div>'+
   '<div class="game-dialogue__footer">'+(segments.length>1?'<span class="dialogue-counter">'+(page+1)+' / '+segments.length+'</span>':'')+
   '<div class="game-dialogue__actions">'+controls+'</div></div></section></div>';
}
function fit(){
 if(!lastOptions)return;
 const node=document.querySelector('#app .game-dialogue--scene');
 if(!node)return;
 const textBox=node.querySelector('.game-dialogue__text');
 const paragraph=textBox?.querySelector('p');
 const panel=node.querySelector('.game-dialogue__panel');
 if(!paragraph||!textBox||!panel)return;
 const raw=activeText;
 const oldSegments=segments.slice();
 const absoluteOffset=oldSegments.slice(0,page).reduce((n,x)=>n+x.length,0);
 const oldHTML=paragraph.innerHTML;
 const measure=document.createElement('p');
 measure.className=paragraph.className;
 measure.style.cssText='position:absolute;visibility:hidden;pointer-events:none;height:auto;min-height:0;max-height:none;overflow:visible;margin:0;';
 measure.style.width=paragraph.getBoundingClientRect().width+'px';
 textBox.appendChild(measure);
 const panelStyle=getComputedStyle(panel);
 const panelVertical=(parseFloat(panelStyle.paddingTop)||0)+(parseFloat(panelStyle.paddingBottom)||0)
   +(parseFloat(panelStyle.borderTopWidth)||0)+(parseFloat(panelStyle.borderBottomWidth)||0);
 const header=panel.querySelector('.game-dialogue__speaker');
 const footer=panel.querySelector('.game-dialogue__footer');
 const headerStyle=header?getComputedStyle(header):null;
 const footerStyle=footer?getComputedStyle(footer):null;
 const headerHeight=header?(header.getBoundingClientRect().height+(parseFloat(headerStyle.marginBottom)||0)):0;
 const footerHeight=footer?(footer.getBoundingClientRect().height+(parseFloat(footerStyle.marginTop)||0)):0;
 const parentHeight=panel.parentElement?.getBoundingClientRect().height||Infinity;
 const rawMax=panelStyle.maxHeight.trim();
 const numericMax=parseFloat(rawMax);
 const resolvedMax=rawMax.endsWith('%')
   ?(Number.isFinite(parentHeight)?parentHeight*(numericMax/100):Infinity)
   :(Number.isFinite(numericMax)?numericMax:Infinity);
 // The panel has a fixed visual height in all portrait scenes.
 // Use its *actual* height (not an unrelated max-height) when splitting text.
 const actualPanelHeight=panel.getBoundingClientRect().height;
 const maxPanelHeight=Math.min(resolvedMax,parentHeight,actualPanelHeight);
 const room=Math.max(0,maxPanelHeight-panelVertical-headerHeight-footerHeight-3);
 function fits(value){
   measure.innerHTML=escapeHTML(visibleText(value)).replace(/\n/g,'<br>');
   return measure.getBoundingClientRect().height<=room+0.5;
 }
 let next=[];
 for(const block of semanticBlocks(raw)){
   // A question/answer boundary is mandatory even when all three fit.
   if(fits(block)){next.push(block);continue}
   const units=semanticUnits(block);let buffer='';
   for(const unit of units){
     if(fits(buffer+unit)){buffer+=unit;continue}
     if(buffer){next.push(buffer);buffer=''}
     if(fits(unit)){buffer=unit;continue}
     const words=unit.match(/\S+\s*|\s+/g)||[unit];
     for(const word of words){
       if(buffer&&!fits(buffer+word)){next.push(buffer);buffer=''}
       buffer+=word;
     }
   }
   if(buffer)next.push(buffer);
 }
 measure.remove();
 paragraph.innerHTML=oldHTML;
 if(next.join('')!==raw)next=[raw];
 let nextPage=0,cursor=0;
 for(let i=0;i<next.length;i++){if(cursor<=absoluteOffset)nextPage=i;cursor+=next[i].length}
 nextPage=Math.min(nextPage,next.length-1);
 if(next.length!==segments.length||next.some((x,i)=>x!==segments[i])||page!==nextPage){
   segments=next;page=nextPage;node.outerHTML=render(lastOptions);
 }
}
function move(action){
 if(action==='dlgMore'&&page<segments.length-1)page++;
 else if(action==='dlgBack'&&page>0)page--;
 else if(action==='dlgStart')page=0;
 return lastOptions?render(lastOptions):'';
}
window.CEH_DIALOGUE={render,move,refresh:()=>lastOptions?render(lastOptions):'',fit,splitExact,getReadState:()=>({key:activeKey,page,total:segments.length,joined:segments.join('')})};
})();