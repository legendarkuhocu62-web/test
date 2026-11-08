/* ЦЕХ 404 — shared dialogue renderer v2.0. Purely visual paging: gameplay state is untouched. */
(()=>{
'use strict';
let activeKey='',page=0,segments=[''],lastOptions=null;
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function splitExact(value,limit){
 const str=String(value??''),out=[];let at=0;
 while(at<str.length){
   let end=Math.min(at+limit,str.length);
   if(end<str.length){
     const strongMin=at+Math.floor(limit*.18);
     let selected=0;
     for(let i=end;i>strongMin;i--){const ch=str[i-1],next=str[i]||'';if(ch==='\n'||(/[.!?]/.test(ch)&&/\s/.test(next))){selected=i;break}}
     if(!selected){const weakMin=at+Math.floor(limit*.57);for(let i=end;i>weakMin;i--){if(/[\s,;]/.test(str[i-1])){selected=i;break}}}
     if(selected)end=selected;
   }
   if(end<=at)end=Math.min(str.length,at+limit);
   out.push(str.slice(at,end));at=end;
 }
 return out.length?out:[''];
}
function limitForViewport(){
 const w=window.visualViewport?.width||window.innerWidth||1200;
 const h=window.visualViewport?.height||window.innerHeight||800;
 if(w<=720)return h<600?72:h<750?103:135;
 if(w<=1024)return 220;
 return h<780?290:390;
}
function button(label,act,primary=false){
 return '<button type="button" class="dialogue-control'+(primary?' dialogue-control--primary':'')+'" data-act="'+act+'">'+escapeHTML(label)+'</button>';
}
function render(options){
 lastOptions=options;
 const {key,speaker,role,text,portrait='',finish='',variant='scene',alt=''}=options;
 const raw=String(text??''),keyString=String(key);
 if(activeKey!==keyString){activeKey=keyString;page=0}
 segments=splitExact(raw,limitForViewport());
 if(page>=segments.length)page=Math.max(segments.length-1,0);
 const final=page===segments.length-1;
 let controls='';
 if(segments.length>1 && page>0){
   controls+=button('Назад','dlgBack');
   if(page>1)controls+=button('К началу','dlgStart');
 }
 if(final)controls+=finish;
 else controls+=button('Читать далее','dlgMore',true);
 const avatar=variant==='inline'||!portrait?'':'<img class="game-dialogue__character" src="'+escapeHTML(portrait)+'" alt="'+escapeHTML(alt||speaker)+'">';
 return '<div class="game-dialogue '+(variant==='inline'?'game-dialogue--inline':'game-dialogue--scene')+'">'+avatar+
   '<section class="game-dialogue__panel" aria-label="Диалог">'+
   '<div class="game-dialogue__speaker"><span class="game-dialogue__name">'+escapeHTML(speaker)+'</span>'+
   (role?'<span class="game-dialogue__role">'+escapeHTML(role)+'</span>':'')+'</div>'+
   '<div class="game-dialogue__text" aria-live="polite"><p>'+escapeHTML(segments[page]).replace(/\n/g,'<br>')+'</p></div>'+
   '<div class="game-dialogue__footer">'+(segments.length>1?'<span class="dialogue-counter">'+(page+1)+' / '+segments.length+'</span>':'')+
   '<div class="game-dialogue__actions">'+controls+'</div></div></section></div>';
}
function move(action){
 if(action==='dlgMore'&&page<segments.length-1)page++;
 else if(action==='dlgBack'&&page>0)page--;
 else if(action==='dlgStart')page=0;
 return lastOptions?render(lastOptions):'';
}
window.CEH_DIALOGUE={render,move,refresh:()=>lastOptions?render(lastOptions):'',splitExact,getReadState:()=>({key:activeKey,page,total:segments.length,joined:segments.join('')})};
})();