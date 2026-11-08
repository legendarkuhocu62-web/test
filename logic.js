window.CEH_LOGIC={
 initial(){return {scene:'S00',s00:0,name:'',s01:0,questionMode:false,reply:null,asked:[],hypothesis:null,hypothesisConfirmed:false,s03Person:null,asked03:[],priority:null,s04Mode:'priority',selected:[],showReview:false,finished:false}},
 cleanName(v){return String(v||'').trim().replace(/\s+/g,' ').slice(0,40)},
 spent(s){return s.selected.reduce((sum,id)=>sum+(window.CEH_DATA.initiatives.find(x=>x.id===id)?.cost||0),0)},
 validState(v){if(!v||typeof v!=='object')return this.initial();const base=this.initial();const s={...base,...v};if(!['S00','S01','S02','S03','S04','S05'].includes(s.scene))s.scene='S00';s.selected=Array.isArray(s.selected)?s.selected.filter(id=>window.CEH_DATA.initiatives.some(x=>x.id===id)):[];s.asked=Array.isArray(s.asked)?s.asked:[];s.asked03=Array.isArray(s.asked03)?s.asked03:[];return s;}
};