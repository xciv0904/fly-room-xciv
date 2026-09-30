(function(){
  "use strict";
  const app=document.getElementById("ciApp");
  if(!app || typeof store==="undefined") return;
  const panel=document.getElementById("ciSprintPanel");
  const defaultProgress={modules:{initial:0,broadcast:0,final:0},sessions:0};
  const progress=()=>store.get("ciProgress",defaultProgress);
  const save=p=>store.set("ciProgress",p);
  const nav=t=>{const b=document.querySelector(`#nav button[data-t="${t}"]`);if(b)b.click()};
  const moduleCard=(key,icon,title,desc,action,label)=>`<button class="ci-module" data-ci-action="${action}" data-ci-key="${key}"><b>${icon} ${title}</b><span>${desc}</span><small>${label}</small></button>`;
  function render(){
    const p=progress(),m=p.modules||{};
    const total=(m.initial||0)+(m.broadcast||0)+(m.final||0), percent=Math.min(100,Math.round(total/9*100));
    const next=!m.initial?{title:"先完成初試三關",desc:"先把繳資料、摸高與廣播詞走過一輪，建立華航專屬的第一筆練習紀錄。",action:"initial",label:"開始初試訓練"}:!m.broadcast?{title:"接著練廣播原文",desc:"把 Dynasty、新聞稿與機上廣播練到能穩定開口，再進入口試模擬。",action:"broadcast",label:"進入廣播練習"}:{title:"開始一輪複試模擬",desc:"中文面試與服務專業職能放在複試，從逐字稿檢查語速、結構、細節與收束句。",action:"final",label:"開始錄音評估"};
    const tasks=[
      ["initial","完成華航初試三關：繳資料、摸高、廣播詞"],
      ["broadcast","熟悉 Dynasty 原文、新聞稿與五段廣播"],
      ["final","完成至少一輪複試錄音並查看分析"]
    ];
    app.innerHTML=`<div class="ci-welcome">👋 Shelly，這裡是華航專屬準備區。按照目前階段往下走，每次練習都會留下進度。</div>
      <div class="ci-dashboard">
        <div class="ci-phase-card ${percent<100?"active":""}">
          <div class="ci-phase-top"><span class="ci-phase-label">CURRENT PHASE</span><span class="ci-phase-status">${percent<100?"進行中":"已完成一輪"}</span></div>
          <h2>${percent<34?"初試打底期":percent<67?"廣播與表達期":"複試整合期"}</h2>
          <p class="sub">華航的準備要先把能被直接淘汰的基本功練穩，再把時間放到回答品質。</p>
          <div class="ci-task-list">${tasks.map(([key,label])=>`<div class="ci-task ${m[key]?"done":""}">${label}${m[key]?` <span class="sub" style="margin-left:auto">${m[key]} 次</span>`:""}</div>`).join("")}</div>
        </div>
        <div class="ci-next-card"><h3>🎯 下一步建議</h3><p>${next.desc}</p><button class="btn" data-ci-action="${next.action}">${next.label} →</button></div>
      </div>
      <div class="ci-module-grid">
        ${moduleCard("initial","🎬","華航初試訓練","繳資料、摸高、ㄇ字型台步與廣播詞朗讀。","initial","進度 "+(m.initial||0)+" 次")}
        ${moduleCard("broadcast","📢","廣播原文與英翻中","直接練 Dynasty 原文、新聞稿與五段機上廣播。","broadcast","進入原文練習")}
        ${moduleCard("final","🎙","華航複試模擬","用錄音回答華航題目，取得逐字稿與表現分析。","final","開始錄音評估")}
        ${moduleCard("stats","📈","華航準備度","查看已完成的華航訓練、弱點與下一個優先項目。","stats","查看準備狀態")}
      </div>
      <div class="ci-eval-note"><b>本站怎麼評估你的表現？</b><span>華航模擬會沿用共用分析器：回答長度、語速、口頭禪、結構詞、故事細節與收束句。它是可操作的練習回饋，不是假裝成考官的錄取分數。</span></div>
      <div class="ci-progress"><div class="ci-progress-head"><h3>華航準備度</h3><span>${percent}% · ${total} 次練習</span></div><div class="ci-progress-track"><span style="width:${percent}%"></span></div><div class="ci-progress-row"><b>初試關卡</b><span>${m.initial||0} 次</span></div><div class="ci-progress-row"><b>廣播與原文</b><span>${m.broadcast||0} 次</span></div><div class="ci-progress-row"><b>複試模擬</b><span>${m.final||0} 次</span></div><p class="sub" style="margin-top:8px">真正的口語表現，請以「模擬面試」中的逐字稿與分析建議為準。</p></div>`;
  }
  function mark(key){const p=progress();p.modules=p.modules||{};p.modules[key]=(p.modules[key]||0)+1;save(p);render()}
  function renderRoute(action){
    const routes={
      initial:{eyebrow:"INITIAL · 01",title:"華航初試訓練",desc:"依你的實際初試經驗，這一頁只保留三件事：繳資料、摸高與唸廣播詞，不放中文問答。",steps:[["01","繳交資料","文件依通知函準備，確認學歷、成績與英檢資料一致"],["02","摸高與ㄇ字型台步","練習高度、站姿、轉身與整體儀態"],["03","廣播詞朗讀","練習英文原文、數字、機型與句尾穩定度"]],label:"進入初試關卡"},
      broadcast:{eyebrow:"INITIAL · 02",title:"廣播原文與英翻中",desc:"這是華航初試的獨立訓練線。先從原文理解內容，再練朗讀、停頓與現場翻譯，不和一般題庫混在一起。",steps:[["01","讀懂原文","Dynasty、新聞稿與廣播情境"],["02","分段朗讀","練習重音、停頓與機上語氣"],["03","英翻中","先抓主旨，再完整說成自然中文"]],label:"進入廣播練習"},
      final:{eyebrow:"FINAL · 01",title:"華航複試模擬",desc:"複試不是隨機跳題。這裡先確認語言與模式，再開始一輪完整錄音，完成後回到華航準備度查看結果。",steps:[["01","選擇模式","中文單題，先從最熟悉的模式開始"],["02","錄音作答","回答華航題目，保留實際表現"],["03","查看分析","檢查長度、語速、結構與收束句"]],label:"開始錄音評估"},
      today:{eyebrow:"TODAY · 01",title:"今日華航訓練",desc:"今天只做一小組，不把所有資料攤開。完成初試三關，再決定是否進入複試。",steps:[["01","資料確認","把今天要帶的文件與報到事項核對一次"],["02","摸高與廣播詞","摸高／台步一輪，再朗讀一段華航原文"],["03","今日收束","記下最需要修正的一個地方，例如語速或數字"]],label:"完成今日訓練"}
    };
    const r=routes[action];
    app.innerHTML=`<div class="ci-route"><div class="ci-route-head"><span class="ci-phase-label">${r.eyebrow}</span><h2>${r.title}</h2><p>${r.desc}</p></div><div class="ci-route-body"><h3 style="margin:0">這一段會怎麼走？</h3><div class="ci-route-steps">${r.steps.map(x=>`<div class="ci-route-step"><b>${x[0]} · ${x[1]}</b><span>${x[2]}</span></div>`).join("")}</div><div class="ci-route-actions"><button class="btn" data-ci-open="${action}">${r.label} →</button><button class="btn ghost" data-ci-back="1">← 回到華航準備度</button></div></div></div>`;
  }
  function renderInitialModule(){
    app.innerHTML=`<div class="ci-route"><div class="ci-route-head"><span class="ci-phase-label">INITIAL · 01</span><h2>華航初試訓練</h2><p>依你的實際經驗，初試只練三件事：繳資料、摸高與唸廣播詞。這裡不放中文問答。</p></div><div class="ci-route-body"><h3 style="margin:0 0 8px">華航初試三個項目</h3><div class="ci-initial-list"><div><b>01　繳交資料</b><span>依通知函準備文件，提早確認正本、影本與資料版本。</span></div><div><b>02　摸高與ㄇ字型台步</b><span>練習高度、站姿、轉身、視線與回到定位點的節奏。</span></div><div><b>03　唸廣播詞</b><span>練習英文原文、數字、機型、航點與句尾穩定度。</span></div></div><div class="ci-route-actions"><button class="btn" data-ci-initial-done="1">完成一輪初試訓練 ✓</button><button class="btn ghost" data-ci-back="1">← 回到華航準備度</button></div></div></div>`;
  }
  function renderTodayModule(){
    app.innerHTML=`<div class="ci-route"><div class="ci-route-head"><span class="ci-phase-label">TODAY · 01</span><h2>今日華航訓練</h2><p>今天只完成三件事：資料確認、摸高／台步、廣播詞。做完就收，不需要把整個華航題庫讀完。</p></div><div class="ci-route-body"><h3 style="margin:0 0 8px">今日三步</h3><div class="ci-initial-list"><div><b>01　資料確認</b><span>把今天要帶的文件與報到事項核對一次。</span></div><div><b>02　摸高與廣播詞</b><span>摸高／台步一輪，再朗讀一段華航原文，注意數字與機型。</span></div><div><b>03　留下弱點</b><span>只寫一個明天要修正的地方，例如語速、數字、機型或句尾。</span></div></div><div class="ci-route-actions"><button class="btn" data-ci-today-done="1">完成今日訓練 ✓</button><button class="btn ghost" data-ci-back="1">← 回到華航準備度</button></div></div></div>`;
  }
  function renderCiInfo(title,desc,items){
    app.innerHTML=`<div class="ci-route"><div class="ci-route-head"><span class="ci-phase-label">CHINA AIRLINES · PREP</span><h2>${title}</h2><p>${desc}</p></div><div class="ci-route-body"><div class="ci-initial-list">${items.map((x,i)=>`<div><b>${String(i+1).padStart(2,"0")}　${x[0]}</b><span>${x[1]}</span></div>`).join("")}</div><div class="ci-route-actions"><button class="btn ghost" data-ci-back="1">← 回到華航準備度</button></div></div></div>`;
  }
  function renderCiStage(stage){
    const initial=stage==="initial";
    const data=initial?{
      eyebrow:"INITIAL SCREENING · 01",title:"華航初試準備",desc:"依你的實際經驗，初試就是繳資料、摸高與唸廣播詞。公開招募流程寫明初試包含書面資料審核與面試；現場細節仍以初試通知函為準。",
      items:[
        ["書面資料與報到","確認畢業證書、各學期成績單、英檢成績與身分文件版本一致；報到攜帶內容以通知函為準。","info"],
        ["儀態與基本動作","摸高、ㄇ字型台步、站姿、轉身、眼神與表情。這是面試前要反覆練的基本功。","initial"],
        ["廣播詞朗讀","練習陌生英文朗讀、數字／機型／航點與句尾穩定度。","broadcast"]
      ]
    }:{
      eyebrow:"FINAL INTERVIEW · 02",title:"華航複試準備",desc:"依你的面試回顧，複試是一對多面談。準備重點不是團討，而是英文自我介紹、情境判斷、時事應對與個人特質。",
      items:[
        ["一對多面談流程","同時面對多位考官，先聽完題目再回答；控制眼神、音量、節奏與回答長度。","mock"],
        ["英文自我介紹","準備 30 秒版本：姓名、服務背景、國際經驗、適合華航的原因與收束句。","mock"],
        ["情境判斷","處理旅客需求、客訴、延誤或安全情境；回答要有判斷順序與實際做法。","mock"],
        ["時事應對與個人特質","能說出自己的觀點，也能用凱悅經驗證明細心、穩定、可靠等特質。","mock"]
      ]
    };
    app.innerHTML=`<div class="ci-route"><div class="ci-route-head"><span class="ci-phase-label">${data.eyebrow}</span><h2>${data.title}</h2><p>${data.desc}</p></div><div class="ci-route-body"><div class="ci-stage-list">${data.items.map((x,i)=>`<button class="ci-stage-item" data-ci-module="${x[2]}"><span class="ci-stage-num">${String(i+1).padStart(2,"0")}</span><span><b>${x[0]}</b><small>${x[1]}</small></span><strong>→</strong></button>`).join("")}</div><div class="ci-route-actions"><button class="btn ghost" data-ci-back="1">← 回到華航準備度</button></div></div></div>`;
  }
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
    if(e.target.closest("[data-ci-back]")){render();return}
    if(e.target.closest("[data-ci-initial-done]")){mark("initial");return}
    if(e.target.closest("[data-ci-today-done]")){mark("initial");mark("broadcast");return}
    const module=e.target.closest("[data-ci-module]");if(module){const action=module.dataset.ciModule;if(action==="info"){renderCiInfo("書面資料與報到","先把文件與當天流程整理好，避免把注意力浪費在臨時找資料。",[["學歷文件","準備中文畢業證書、各學期成績單；有交換、轉學或肄業經歷時，確認是否需要完整證明。"],["英文能力","目前招募資料列 TOEIC 聽讀 600 或同等英語成績，實際認定以華航公告為準。"],["報到檢查","身分證、通知函要求文件、服裝鞋子與交通時間，前一天逐項確認。"]]);return}if(action==="initial"){renderInitialModule();return}if(action==="broadcast"){mark("broadcast");nav("ciBroadcast");return}openMock();return}
    const open=e.target.closest("[data-ci-open]");if(open){const action=open.dataset.ciOpen;if(action==="broadcast"){mark("broadcast");nav("ciBroadcast");return}if(action==="initial"){renderCiStage("initial");return}if(action==="today"){renderTodayModule();return}if(action==="final"){renderCiStage("final");return}}
    const b=e.target.closest("button[data-ci-action]");if(!b)return;
    const action=b.dataset.ciAction;
    if(action==="broadcast"||action==="today"){renderRoute(action);return}
    if(action==="initial"){renderCiStage("initial");return}
    if(action==="final"){renderCiStage("final");return}
    if(action==="stats"){render();const el=document.querySelector("#ciApp .ci-eval-note");if(el)el.scrollIntoView({behavior:"smooth",block:"center"});}
  });
  panel.addEventListener("click",e=>{
    const route=e.target.closest("[data-ci-route]");if(!route)return;
    const action=route.dataset.ciRoute;
    if(action==="stats"){render();const el=document.querySelector("#ciApp .ci-progress");if(el)el.scrollIntoView({behavior:"smooth",block:"center"});return}
    if(action==="initial"){renderCiStage("initial")}else if(action==="final"){renderCiStage("final")}else if(action==="today"){renderRoute("today")}else{renderRoute(action)}
    const el=document.querySelector("#ciApp .ci-route");if(el)el.scrollIntoView({behavior:"smooth",block:"start"});
  });
  window.renderCI=render;
  render();
})();
