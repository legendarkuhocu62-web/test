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
 // Page separators and trailing blanks are part of the saved source text,
 // but must not consume display lines at the edges of a dialogue page.
 return String(value??'').replace(/^\s+|\s+$/g,'');
}

/* The saved dialogue preserves its original newlines exactly.
   A single newline between ordinary sentences is not an intentional
   paragraph break and should not force a wasted line in the fixed panel.
   Blank-line paragraphs retain ONE visual break. */
function displayText(value){
 return visibleText(value)
   .replace(/\n{2,}/g,'\uE000')
   .replace(/\n/g,' ')
   .replace(/\uE000/g,'\n');
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
   '<div class="game-dialogue__text'+tone+'" aria-live="polite"><p>'+escapeHTML(displayText(segment)).replace(/\n/g,'<br>')+'</p></div>'+
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
 // Keep the measuring paragraph OUTSIDE the flex panel: inserting it into
 // the text flex child changes its height and falsely reduces available space.
 // Measure within the real dialogue text box, as in the early v5
 // renderer. This uses its own CSS typography and the actual current
 // footer instead of reserving hypothetical extra footer height.
 textBox.appendChild(measure);
 const panelStyle=getComputedStyle(panel);
 const textStyle=getComputedStyle(textBox);
 const header=node.querySelector('.game-dialogue__speaker');
 const footer=node.querySelector('.game-dialogue__footer');
 const heightOf=el=>el?el.getBoundingClientRect().height:0;
 const px=(style,key)=>parseFloat(style[key])||0;
 const panelRoom=heightOf(panel)
   -px(panelStyle,'paddingTop')-px(panelStyle,'paddingBottom')
   -heightOf(header)-heightOf(footer)
   -px(getComputedStyle(header),'marginTop')-px(getComputedStyle(header),'marginBottom')
   -px(getComputedStyle(footer),'marginTop')-px(getComputedStyle(footer),'marginBottom');
  const room=Math.max(0,panelRoom-px(textStyle,'paddingTop')-px(textStyle,'paddingBottom')-2);
 function fits(value){
   measure.innerHTML=escapeHTML(displayText(value)).replace(/\n/g,'<br>');
   return measure.getBoundingClientRect().height<=room+0.5;
 }
 let next=[];
 const measuredHeight=value=>{
   measure.innerHTML=escapeHTML(displayText(value)).replace(/\n/g,'<br>');
   return measure.getBoundingClientRect().height;
 };
 const lh=parseFloat(getComputedStyle(paragraph).lineHeight)||22;
 const endsPoorly=s=>/(?:^|\s)(?:и|а|но|или|что|чтобы|если|когда|прежде|чем|перед|в|на|с|со|к|по|из|у|от|до|для|при|без|под|над|между)$/iu.test(visibleText(s));
 for(const block of semanticBlocks(raw)){
   const words=block.match(/\S+\s*|\s+/g)||[block];
   // Greedy packing gives the minimum page count for this text area.
   const pages=[];
   let buffer='';
   for(const word of words){
     if(buffer&&!fits(buffer+word)){pages.push(buffer);buffer=''}
     buffer+=word;
   }
   if(buffer)pages.push(buffer);
   // Keep non-final pages packed. Only correct an awkward boundary if
   // it costs at most ONE visual line compared with greedy packing.
   // A short final page is preferable to breaking the already-full page.
   for(let i=0;i<pages.length-1;i++){
     const originalHeight=measuredHeight(pages[i]);
     const combined=pages[i]+pages[i+1];
     const parts=combined.match(/\S+\s*|\s+/g)||[combined];
     let offset=0,best=null;
     for(let j=0;j<parts.length-1;j++){
       offset+=parts[j].length;
       const left=combined.slice(0,offset),right=combined.slice(offset);
       if(!left||!right||!fits(left)||!fits(right))continue;
       const h1=measuredHeight(left);
       if(originalHeight-h1>lh*1.05)continue;
       const h2=measuredHeight(right),ending=visibleText(left);
       const complete=/[.!?…]["»”’)]?$/.test(ending);
       const score=h1+(complete?lh*2.5:0)
         -(endsPoorly(left)?lh*100:0)
         +Math.min(h2,lh*2)*0.02;
       if(!best||score>best.score)best={left,right,score};
     }
     if(best){pages[i]=best.left;pages[i+1]=best.right}
   }
   next.push(...pages);
 }
 measure.remove();
 paragraph.innerHTML=oldHTML;
 if(next.join('')!==raw)next=[raw];
 let nextPage=0,cursor=0;
 for(let i=0;i<next.length;i++){if(cursor<=absoluteOffset)nextPage=i;cursor+=next[i].length}
 nextPage=Math.min(nextPage,next.length-1);
 if(next.length!==segments.length||next.some((x,i)=>x!==segments[i])||page!==nextPage){
   const previousPage=page,previousSegment=segments[page];
   segments=next;page=nextPage;
   // Do not detach the complete dialogue when the visible page is unchanged.
   // Replacing the footer during an in-progress click makes the final S03
   // action unstable in mobile browsers (Playwright: element detached).
   if(previousPage!==page||previousSegment!==segments[page]){
     node.outerHTML=render(lastOptions);
   }else{
     const counter=node.querySelector('.dialogue-counter');
     if(counter)counter.textContent=(page+1)+' / '+segments.length;
   }
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