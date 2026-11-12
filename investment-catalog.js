/* ЦЕХ 404 · Адаптивный каталог A–M. Только UI: бюджет и выбор — в app.js/logic.js.
   Источник каждой карточки: утверждённый локальный оригинал CH1-VA-*-001.
   Компактная иллюстрация — производное кадрирование фото без текста/перегенерации. */
window.CEH_INVESTMENT_CATALOG = (() => {
  "use strict";
  const IDS = "ABCDEFGHIJKLM".split("");
  const ids = new Set(IDS);
  let page = 0;
  let opened = null;

  function isMobile() { return window.matchMedia("(max-width: 720px)").matches; }
  function pageSize() { return isMobile() ? 4 : 6; }
  function poster(id) { return "assets/investments/CH1-VA-" + id + "-001.png"; }
  function thumb(id) { return "assets/investments/thumbs/CH1-VA-" + id + "-001.webp"; }
  function reset() { page = 0; opened = null; }
  function close() { opened = null; }
  function open(id) { if (ids.has(id)) opened = id; }
  function changePage(delta, count=13) {
    const total = Math.max(1,Math.ceil(count/pageSize()));
    page = Math.max(0,Math.min(total-1,page+delta));
    opened=null;
  }
  function getOpen() { return opened; }
  function render(state,data,esc,button) {
    const entries=data.initiatives.filter(x=>ids.has(x.id));
    const size=pageSize(), count=Math.max(1,Math.ceil(entries.length/size));
    page=Math.max(0,Math.min(page,count-1));
    const visible=entries.slice(page*size,(page+1)*size);
    let html='<div class="ic-catalog" aria-label="Каталог инвестиционных предложений A–M">'+
      '<div class="ic-catalog__head"><p>Открой карту инициативы, чтобы изучить условия и принять решение.</p></div>'+
      '<div class="ic-grid invest-grid" aria-label="Карточки, страница '+(page+1)+' из '+count+'">';
    for(const x of visible){
      const chosen=state.selected.includes(x.id);
      html+='<article class="investment ic-card'+(chosen?' ic-card--selected':'')+'" data-initiative="'+esc(x.id)+'">'+
        '<span class="ic-card__photo"><img alt="" src="'+thumb(x.id)+'" loading="lazy" decoding="async" width="360" height="240"></span>'+
        '<div class="ic-card__body"><div class="invest-head"><b class="ic-card__letter">'+esc(x.id)+'</b></div>'+
        '<strong class="ic-card__title">'+esc(x.title)+'</strong>'+
        '<span class="ic-card__price"><span aria-hidden="true" class="ic-coins">▰</span>'+esc(x.cost)+' млн у.е.</span>'+
        button('Открыть карту инвестиционного предложения','catalogOpen',x.id,'ic-card__open')+
        (chosen?'<span class="ic-card__chosen">✓ В портфеле</span>':'')+
        '</div></article>';
    }
    html+='</div><nav class="ic-pager" aria-label="Страницы каталога">'+
      button('←','catalogPage','prev','ic-pager__button'+(page===0?' is-disabled':''))+
      '<span class="ic-pager__counter" aria-live="polite">'+(page+1)+' / '+count+'</span>'+
      button('→','catalogPage','next','ic-pager__button'+(page===count-1?' is-disabled':''))+
      '</nav></div>';
    const entry=entries.find(x=>x.id===opened);
    if(entry){
      const selected=state.selected.includes(entry.id);
      html+='<dialog class="ic-detail" aria-label="Инвестиционное предложение '+esc(entry.id)+' — '+esc(entry.title)+'">'+
        '<div class="ic-detail__head"><span>ИНВЕСТИЦИОННОЕ ПРЕДЛОЖЕНИЕ '+esc(entry.id)+'</span>'+
        button('×','catalogClose','','ic-detail__close')+'</div>'+
        '<div class="ic-detail__body"><div class="ic-poster">'+
        '<img alt="Полное инвестиционное предложение '+esc(entry.id)+': '+esc(entry.title)+
        '. Условия и ограничения приведены на изображении." src="'+poster(entry.id)+
        '" width="1024" height="1536" fetchpriority="high">'+
        '</div></div>'+
        '<div class="ic-detail__actions">'+
        button(selected?'Убрать из портфеля':'Отклонить','catalogDecline',entry.id,'ic-detail__decline')+
        button(selected?'В портфеле ✓':'Добавить','catalogAdd',entry.id,'ic-detail__add')+
        '</div></dialog>';
    }
    return html;
  }
  function attach(root,onDismiss){
    const dlg=root.querySelector('.ic-detail');
    if(!dlg)return;
    dlg.addEventListener('cancel',event=>{event.preventDefault();close();onDismiss();});
    if(!dlg.open)dlg.showModal();
    dlg.querySelector('.ic-detail__close')?.focus({preventScroll:true});
  }
  return Object.freeze({IDS,render,open,close,reset,changePage,getOpen,attach,pageSize});
})();