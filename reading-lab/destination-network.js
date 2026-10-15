(function(root){
  'use strict';
  const D=root.ReadingLabData,checked='2026-10-16';
  const source={europe:{url:'https://www.china-airlines.com/at/en/about-china-airlines/media/news/20230314.html',published:'2023-03-14'},phoenix:{url:'https://www.china-airlines.com/nz/en/about-china-airlines/media/news/20251203-PHX.html',published:'2025-12-03'},mandarin:{url:'https://www.mandarin-airlines.com/Content/Ticket%20information-2017020012-96',published:'官網未列更新日期'},paris:{url:'https://www.china-airlines.com/at/de/about-china-airlines/media/news/20180418.html',published:'2018-04-17'}};
  const proofs=new Map();
  for(const en of ['London','Frankfurt','Amsterdam','Vienna','Rome','Prague'])proofs.set(en,{scope:'direct',...source.europe,origin:'Taipei',note:'官方開航資料確認華航自營；資料較舊，本次不是即時班表核驗，是否仍直飛請查實際出發日。'});
  proofs.set('Phoenix',{scope:'direct',...source.phoenix,origin:'Taipei',note:'官方確認台北出發往鳳凰城不經停；不可由此推定回程也不經停。實際出發日與回程安排須另查班表。'});
  proofs.set('Paris',{scope:'codeshare',...source.paris,origin:'Taipei',historical:true,note:'歷史聯營資料：2018 年由 Air France 執飛。未確認 2026 營運狀態，不能當作現行聯營或華航自營直飛。'});
  for(const [zh,en,codes]of [['金門','Kinmen',['KNH']],['澎湖','Penghu',['MZG']]]){
    D.places.push({id:'place-ci-'+en.toLowerCase(),en,zh,region:'台灣',group:'台灣',codes,category:'華航集團航點',categories:['華航集團航點'],hint:'待字典確認',example:`Travelers check the operating airline before booking a flight to ${en}.`,url:source.mandarin.url});
    proofs.set(en,{scope:'group',...source.mandarin,operator:'Mandarin Airlines',note:'華信官網國內票價表列有此地點，屬華航集團華信資料；非華航本體國際直飛清單，班表仍需依日期查詢。'});
  }
  for(const [en,zh]of [['United States','美國'],['Japan','日本'],['France','法國'],['Germany','德國'],['Netherlands','荷蘭'],['Austria','奧地利'],['Italy','義大利'],['New Zealand','紐西蘭'],['Thailand','泰國'],['Singapore','新加坡'],['Czech Republic','捷克']])if(!D.places.some(p=>p.en===en))D.places.push({id:'place-ci-country-'+en.toLowerCase().replace(/ /g,'-'),en,zh,region:zh,category:'國家及城市',categories:['國家及城市'],group:'國家／地區',codes:[],hint:'待字典確認',example:`The travel briefing introduces ${en}.`,url:'https://www.china-airlines.com/tw/en/itinerary-booking/flight-information/global-destinations'});
  if(!D.places.some(p=>p.en==='Cathay Pacific'))D.places.push({id:'place-ci-cathay-pacific',en:'Cathay Pacific',zh:'國泰航空',region:'香港',category:'航空公司與機型',categories:['航空公司與機型'],group:'航空公司',codes:[],hint:'待字典確認',example:'The practice briefing introduces Cathay Pacific.',url:'https://www.cathaypacific.com/'});
  const labels={direct:'華航自營（官方開航資料，非即時班表）',group:'華航集團／華信資料',codeshare:'聯營（歷史資料待複核）',tourism:'一般觀光景點',reference:'國家／航空專名',pending:'航點營運方式待核實'};
  for(const p of D.places){const proof=proofs.get(p.en);p.network=proof?{...proof,checked}:p.category==='世界知名旅遊景點'?{scope:'tourism',checked}:p.categories?.includes('華航航點與延伸地名')?{scope:'pending',checked,note:'保留原有練習地名，未將訂票選單或使用者拼讀表當作營運證明。'}:{scope:'reference',checked};}
  if(D.ciDestinationGroups)D.ciDestinationGroups=[...D.ciDestinationGroups,'台灣','國家／地區','航空公司'];
  root.ReadingDestinationNetwork={labels,sources:source,checked};
})(window);
