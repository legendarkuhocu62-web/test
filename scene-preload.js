/* ЦЕХ 404 — preload only assets reachable from the current scene.
   One future scene window, small concurrency, transparent fallback on errors.
   Does not alter story, game state or navigation. */
(()=>{'use strict';
const MAX_ACTIVE=2, MAX_CACHED=14;
const cache=new Map(), queue=[], queued=new Set();
let active=0, generation=0, scheduled=null;
const started=[], finished=[];
function resource(url){
 if(!url||typeof url!=='string'||/^(?:https?:|data:|\/\/)/i.test(url))return null;
 try{const parsed=new URL(url,document.baseURI);
   if(parsed.origin!==location.origin)return null;
   return parsed.href;
 }catch(_){return null}
}
function load(url,token){
 if(cache.has(url)){cache.get(url).last=Date.now();return}
 const img=new Image();
 const state={img,last:Date.now(),status:'loading'};
 cache.set(url,state);
 started.push(url);
 const settle=(ok)=>{
   state.status=ok?'ready':'failed';
   finished.push({url,ok});
   active=Math.max(0,active-1);
   if(cache.size>MAX_CACHED){
     for(const [key,entry] of cache){
       if(cache.size<=MAX_CACHED)break;
       if(entry.status!=='loading')cache.delete(key);
     }
   }
   pump();
 };
 img.onload=()=>{if(typeof img.decode==='function')img.decode().then(()=>settle(true),()=>settle(true));else settle(true)};
 img.onerror=()=>settle(false);
 img.src=url;
}
function pump(){
 while(active<MAX_ACTIVE&&queue.length){
   const {url,token}=queue.shift();queued.delete(url);
   if(token!==generation||cache.has(url))continue;
   active++;
   load(url,token);
 }
}
function enqueue(paths){
 generation++;
 queue.length=0;queued.clear();
 const token=generation;
 for(const raw of paths){
   const url=resource(raw);
   if(!url||cache.has(url)||queued.has(url))continue;
   queue.push({url,token});queued.add(url);
 }
 pump();
}
function plan(s,A){
 const mode=s.scene, mobile=matchMedia('(max-width:720px)').matches;
 const files=[];
 const add=(...x)=>files.push(...x);
 if(mode==='S00'){
   if(s.s00<=2)add(A.gate,A.entry);
   if(s.s00>=2)add(A.entry,A.badge,A.office,A.irina_friendly);
 }else if(mode==='S01'){
   add(A.office,A.irina,A.irina_friendly,A.irina_focused);
   if(s.s01>=3||s.asked?.length>=2)add(A.office,A.irina);
 }else if(mode==='S02'){
   add(A.office,A.irina,A.irina_focused);
   if(s.s02Step==='intro'||s.s02Step==='report'){
     add(mobile?'assets/optimized/objects/CH1-S02-production-report-mobile.webp?v=webp-lossless-20261112':'assets/optimized/objects/CH1-S02-production-report-desktop.webp?v=webp-lossless-20261112');
   }
   if(s.s02Step==='feedback')add(A.group,mobile?'assets/optimized/backgrounds/CH1-IMG-022_S03_meeting_three_characters_mobile.webp':A.group);
 }else if(mode==='S03'){
   add(A.meeting,A.andrey,A.irina,A.marina);
   if(!s.s03Person)add(mobile?'assets/optimized/backgrounds/CH1-IMG-022_S03_meeting_three_characters_mobile.webp':A.group);
   if(s.asked03?.length>=2)add(A.engineer);
 }else if(mode==='S04'){
   add(A.engineer);
   if(s.s04Mode==='eduIntro'||s.s04Mode==='edu')add('assets/edu01/schema-ek-v20-01.jpg','assets/edu01/act-ns-008-26.jpg');
 }
 return [...new Set(files)];
}
function afterRender(state,assets){
 // Avoid preloading before the current scene has rendered; yield browser time
 // to decode and paint the current visible scene first.
 if(scheduled!==null){
   if(typeof cancelIdleCallback==='function')cancelIdleCallback(scheduled);
   else clearTimeout(scheduled);
 }
 const snapshot=plan(state,assets);
 const schedule=()=>{
   scheduled=null;
   if(navigator.connection?.saveData)return;
   enqueue(snapshot);
 };
 scheduled=typeof requestIdleCallback==='function'
   ?requestIdleCallback(schedule,{timeout:1200})
   :setTimeout(schedule,180);
}
window.CEH_PRELOAD={afterRender,stats:()=>({cached:cache.size,active,queued:queue.length,started:[...started],finished:[...finished]})};
})();