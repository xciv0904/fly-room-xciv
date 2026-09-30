(function(){
  "use strict";
  const app=document.getElementById("ciApp");
  if(!app || typeof store==="undefined") return;
  const defaultProgress={modules:{initial:0,broadcast:0,final:0},sessions:0};
  const progress=()=>store.get("ciProgress",defaultProgress);
  const save=p=>store.set("ciProgress",p);
  const nav=t=>{const b=document.querySelector(`#nav button[data-t="${t}"]`);if(b)b.click()};
  const moduleCard=(key,icon,title,desc,action,label)=>`<button class="ci-module" data-ci-action="${action}" data-ci-key="${key}"><b>${icon} ${title}</b><span>${desc}</span><small>${label}</small></button>`;
  function render(){
    const p=progress(),m=p.modules||{};
    app.innerHTML=`<div class="ci-welcome">👋 Shelly，華航先把初試這一關練穩；完成錄音後，再用分析結果修正語速、結構與內容。</div>
      <div class="ci-module-grid">
        ${moduleCard("initial","🎬","華航初試訓練","摸高、ㄇ字型台步、中文自介與中英短文朗讀。","initial","進度 "+(m.initial||0)+" 次")}
        ${moduleCard("broadcast","📢","廣播原文與英翻中","直接練 Dynasty 原文、新聞稿與五段機上廣播。","broadcast","進入原文練習")}
        ${moduleCard("final","🎙","華航複試模擬","用錄音回答華航題目，取得逐字稿與表現分析。","final","開始錄音評估")}
        ${moduleCard("stats","📈","華航準備度","查看已完成的華航訓練、弱點與下一個優先項目。","stats","查看準備狀態")}
      </div>
      <div class="ci-eval-note"><b>本站怎麼評估你的表現？</b><span>華航模擬會沿用共用分析器：回答長度、語速、口頭禪、結構詞、故事細節與收束句。它是可操作的練習回饋，不是假裝成考官的錄取分數。</span></div>
      <div class="ci-progress"><h3>華航準備度</h3><div class="ci-progress-row"><b>初試關卡</b><span>${m.initial||0} 次</span></div><div class="ci-progress-row"><b>廣播與原文</b><span>${m.broadcast||0} 次</span></div><div class="ci-progress-row"><b>複試模擬</b><span>${m.final||0} 次</span></div><p class="sub" style="margin-top:8px">真正的口語表現，請以「模擬面試」中的逐字稿與分析建議為準。</p></div>`;
  }
  function mark(key){const p=progress();p.modules=p.modules||{};p.modules[key]=(p.modules[key]||0)+1;save(p);render()}
  function openMock(){
    nav("mock");
    const b=[...document.querySelectorAll("#mAirline button")].find(x=>x.textContent.includes("華航"));
    if(b)b.click();
    const lang=document.getElementById("mLang"),mode=document.getElementById("mMode");
    if(lang)lang.value="zh";
    if(mode)mode.value="single";
    const draw=document.getElementById("mDraw");
    if(draw)draw.scrollIntoView({behavior:"smooth",block:"center"});
  }
  app.addEventListener("click",e=>{
    const b=e.target.closest("button[data-ci-action]");if(!b)return;
    const action=b.dataset.ciAction;
    if(action==="broadcast"){mark("broadcast");nav("ciBroadcast");return}
    if(action==="initial"){mark("initial");nav("stage");return}
    if(action==="final"){mark("final");openMock();return}
    if(action==="stats"){render();const el=document.querySelector("#ciApp .ci-eval-note");if(el)el.scrollIntoView({behavior:"smooth",block:"center"});}
  });
  window.renderCI=render;
  render();
})();
