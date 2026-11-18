/* ЦЕХ 404 · автономный реестр имён для РЕКОМЕНДАЦИИ изображения на пропуске.
   Основа: https://ru.wikipedia.org/wiki/Русское_личное_имя (разделы «Мужские и женские имена»,
   «Частотность использования имён»); дата обращения 18.11.2026.
   Имена из справочной таблицы перечислены выборочно; это НЕ полный словарь Википедии.
   Эвристики фамилий/отчеств — правила приложения, а НЕ утверждения Википедии.
   Имя и фамилия не доказывают пол человека. Результат — рекомендация аватара;
   для сомнительных или противоречивых случаев всегда возвращаем null.
   Файл не загружает информацию о пользователях в интернет. */
(function(root,factory){
  const registry=factory();
  if(typeof module==='object'&&module.exports)module.exports=registry;
  if(root)root.CEH_NAME_REGISTRY=registry;
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  const wiki='https://ru.wikipedia.org/wiki/Русское_личное_имя';
  // Выборка из таблицы имен статьи «Русское личное имя»; варианты ё/е нормализуются.
  const maleNames=`Александр Алексей Дмитрий Сергей Андрей Антон Артём Артемий Виталий Владимир Денис Евгений Иван Игорь Константин Максим Михаил Николай Павел Роман Станислав Август Адам Адриан Аким Анатолий Аполлон Аркадий Арсений Богдан Борис Бронислав Вадим Валентин Валерий Василий Вениамин Виктор Владислав Владлен Всеволод Вячеслав Геннадий Георгий Герман Глеб Гордей Григорий Давид Даниил Данила Добрыня Егор Ефим Захар Игнат Игнатий Илья Иннокентий Иосиф Кирилл Клим Кузьма Лев Леонид Макар Марк Матвей Милан Мирослав Назар Никита Олег Пётр Платон Прохор Рафаил Родион Ростислав Руслан Савва Святослав Семён Степан Стефан Тарас Тимофей Фёдор Филипп Юлий Юрий Яков Ян Ярослав`.toLowerCase().replace(/ё/g,'е').split(/\s+/);
  const femaleNames=`Анастасия Анна Екатерина Мария Наталья Ольга Юлия Александра Виктория Дарья Елена Ирина Ксения Светлана Августа Ада Алевтина Алёна Алина Алиса Алла Альбина Ангелина Антонина Анфиса Арина Валентина Валерия Варвара Василиса Василина Вера Вероника Влада Владислава Галина Дана Дарина Дина Ева Евгения Евдокия Елизавета Зарина Зинаида Злата Зоя Иванна Инна Катерина Кира Клавдия Кристина Лада Лариса Лидия Лилиана Лилия Лия Любовь Людмила Майя Маргарита Марианна Марина Марьяна Милада Милана Милена Надежда Настасья Ника Нина Нинель Нонна Оксана Олеся Полина Раиса Регина Римма Руслана Серафима Симона Снежана Софья Станислава Сусанна Таисия Тамара Ульяна Фаина Эльмира Эмилия Юлиана Яна Янина Ярослава`.toLowerCase().replace(/ё/g,'е').split(/\s+/);
  const male=new Set(maleNames),female=new Set(femaleNames);
  // Сокращения не включаем в гендерные группы — многие используются для разных имён.
  const ambiguous=new Set(['саша','женя','валя','шура','саня','слава','алекс','аля','кима']);
  const normalize=text=>String(text||'').normalize('NFC').trim().toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/\s+/g,' ');
  const words=text=>normalize(text).split(/[\s\-]+/u).filter(Boolean).filter(x=>/^[а-я]+$/u.test(x));
  const surnameHint=word=>{
    // Не считать знакомую форму имени вроде «Константин» фамилией.
    if(/(ова|ева|ина|ына|ская|цкая)$/u.test(word))return 'female';
    if(/(ов|ев|ин|ын|ский|цкий)$/u.test(word))return 'male';
    return null; // Ким, Шевченко, Сидоренко и т. п.
  };
  const patronymicHint=word=>{
    if(/(овна|евна|ична)$/u.test(word))return 'female';
    if(/(ович|евич|ич)$/u.test(word))return 'male';
    return null;
  };
  function detect(text){
    const tokens=words(text);
    if(!tokens.length)return {recommendedAvatar:null,reason:'empty',matchedName:null,source:wiki};
    const named=tokens.filter(t=>male.has(t)||female.has(t));
    const votes=new Set(named.map(t=>male.has(t)&&female.has(t)?'ambiguous':male.has(t)?'male':'female'));
    if(votes.has('ambiguous')||votes.size>1)return {recommendedAvatar:null,reason:'conflicting-names',matchedName:named[0]||null,source:wiki};
    const byName=votes.size===1?[...votes][0]:null;
    const rest=tokens.filter(t=>!named.includes(t));
    const patronymic=rest.map(patronymicHint).filter(Boolean);
    const surname=rest.filter(t=>!ambiguous.has(t)).map(surnameHint).filter(Boolean);
    const hints=[...new Set([...patronymic,...surname])];
    if(hints.length>1 || (byName&&hints.length&&hints[0]!==byName)){
      return {recommendedAvatar:null,reason:'conflict',matchedName:named[0]||null,source:wiki};
    }
    if(byName)return {recommendedAvatar:byName,reason:'name',matchedName:named[0],source:wiki};
    // Сведения только по фамилии не гарантируют нужный аватар.
    // При одном слове без известного имени никогда не делаем предположения.
    if(tokens.length>=2&&hints.length===1)return {recommendedAvatar:hints[0],reason:patronymic.includes(hints[0])?'patronymic':'surname-hint',matchedName:null,source:wiki};
    return {recommendedAvatar:null,reason:'unknown-or-ambiguous',matchedName:null,source:wiki};
  }
  return Object.freeze({detect,source:wiki,counts:Object.freeze({male:male.size,female:female.size})});
});
