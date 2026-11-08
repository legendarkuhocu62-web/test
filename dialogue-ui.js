/* ЦЕХ 404 — общий диалоговый компонент v2.1.
   Сначала показываем всю реплику; делим по предложениям только если текст
   действительно не помещается в доступную высоту панели.
   Изменение страниц не затрагивает сценарий и игровое состояние. */
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
   if(page>1)controls+=button('К началу','dlgStart');
 }
 controls+=final?finish:button('Читать далее','dlgMore',true);
 const avatar=variant==='inline'||!portrait?'':'<img class="game-dialogue__character" src="'+escapeHTML(portrait)+'" alt="'+escapeHTML(alt||speaker)+'">';
 return '<div class="game-dialogue '+(variant==='inline'?'game-dialogue--inline':'game-dialogue--scene')+'">'+avatar+
   '<section class="game-dialogue__panel" aria-label="Диалог">'+
   '<div class="game-dialogue__speaker"><span class="game-dialogue__name">'+escapeHTML(speaker)+'</span>'+
   (role?'<span class="game-dialogue__role">'+escapeHTML(role)+'</span>':'')+'</div>'+
   '<div class="game-dialogue__text" aria-live="polite"><p>'+escapeHTML(segments[page]).replace(/\n/g,'<br>')+'</p></div>'+
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
 const maxPanelHeight=Math.min(
   parseFloat(panelStyle.maxHeight)||Infinity,
   panel.parentElement?.getBoundingClientRect().height||Infinity
 );
 const room=Math.max(0,maxPanelHeight-panelVertical-headerHeight-footerHeight);
 function fits(value){
   measure.innerHTML=escapeHTML(value).replace(/\n/g,'<br>');
   return measure.getBoundingClientRect().height<=room+0.5;
 }
 let next=[];
 if(fits(raw))next=[raw];
 else{
   const units=semanticUnits(raw);let buffer='';
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
   if(buffer||!next.length)next.push(buffer);
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