(function(){
  "use strict";
  const app=document.getElementById("ciApp");
  if(!app || typeof store==="undefined") return;
  const panel=document.getElementById("ciSprintPanel");
  const plan=document.getElementById("ciSprintPlan");
  const defaultProgress={modules:{initial:0,broadcast:0,final:0},sessions:0,checklists:{}};
  const progress=()=>store.get("ciProgress",defaultProgress);
  const save=p=>store.set("ciProgress",p);
  const routeNames={initial:"初試準備",broadcast:"廣播詞",final:"複試模擬",today:"今日訓練"};
  const infoItems=[["學歷文件","準備中文畢業證書、各學期成績單；有交換、轉學或肄業經歷時，確認是否需要完整證明。"],["英文能力","目前招募資料列 TOEIC 聽讀 600 或同等英語成績，實際認定以華航公告為準。"],["報到檢查","身分證、通知函要求文件、服裝鞋子與交通時間，前一天逐項確認。"]];
  const initialChecks=[["documents","繳交資料","已依通知函核對正本、影本與英檢資料。"],["walk","摸高與ㄇ字型台步","已實際完成摸高、站姿、轉身與回到定位一輪。"],["broadcast","廣播詞朗讀","已朗讀並回聽一段華航英文原文。"]];
  const todayChecks=[["documents","資料確認","已核對今天要帶的文件與報到事項。"],["practice","摸高、台步與廣播詞","已完成動作一輪，並朗讀一段華航原文。"],["weakness","留下明日弱點","已寫下一個明天要修正的具體項目。"]];
  const context=label=>{if(typeof window.setUXContext==="function")window.setUXContext(`🌸 華航 › ${label}`,label!=="招考首頁")};
  const setRoute=(route,sync=true)=>{if(sync&&typeof window.setAppRoute==="function")window.setAppRoute(route)};
  const stateFor=count=>count>=3?["已練穩","ready"]:count>0?["練習中","learning"]:["未開始",""];
  const lastLabel=ts=>ts?`最近練習：${new Date(ts).toLocaleDateString("zh-TW",{month:"numeric",day:"numeric"})}`:"尚無紀錄";
  const skillRow=(name,count,last)=>{const s=stateFor(count);return `<div class="ci-skill"><div><b>${name}</b><small>${count||0} 次練習 · ${lastLabel(last)}</small></div><span class="ci-state ${s[1]}">${s[0]}</span></div>`};
  const hidePlan=()=>{if(plan)plan.classList.add("hidden")};
  const showPlan=()=>{if(plan)plan.classList.remove("hidden")};
  const nav=t=>{if(typeof window.showTab==="function"){window.showTab(t);return}document.querySelector(`#nav button[data-t="${t}"]`)?.click()};
  const localDay=()=>{const d=new Date(),pad=n=>String(n).padStart(2,"0");return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};

  function checklistRecord(kind){
    const p=progress();p.checklists=p.checklists||{};
    const id=`${kind}:${localDay()}`,state=p.checklists[id]||{items:{},done:false};
    p.checklists[id]=state;
    return {p,state};
  }
  function checklistMarkup(kind,items,label){
    const {state}=checklistRecord(kind),complete=items.every(([key])=>state.items?.[key]),checked=items.filter(([key])=>state.items?.[key]).length;
    return `<div class="ci-checklist" role="group" aria-label="${label}">${items.map(([key,title,desc])=>`<label class="ci-check-item"><input type="checkbox" data-ci-check="${kind}" data-ci-check-key="${key}" ${state.items?.[key]?"checked":""} ${state.done?"disabled":""}><span><b>${title}</b><span>${desc}</span></span></label>`).join("")}</div><p class="ci-check-status ${state.done?"done":""}" role="status">${state.done?"✅ 今天這一輪已完成並記錄。":`已完成 ${checked} / ${items.length} 項；全部勾選後才能記錄完成。`}</p><div class="ci-route-actions"><button class="btn" data-ci-checklist-done="${kind}" ${!complete||state.done?"disabled":""}>${state.done?"今日已記錄 ✓":"確認全部完成"}</button>${checked&&!state.done?`<button class="btn ghost" data-ci-checklist-reset="${kind}">清除勾選</button>`:""}<button class="btn ghost" data-ci-back="1">← 回到華航準備度</button></div>`;
  }
  function updateChecklist(kind,key,checked){const {p,state}=checklistRecord(kind);state.items=state.items||{};state.items[key]=checked;save(p)}
  function resetChecklist(kind){const {p,state}=checklistRecord(kind);if(state.done)return;state.items={};save(p)}
  function completeChecklist(kind){
    const items=kind==="initial"?initialChecks:todayChecks,{p,state}=checklistRecord(kind);
    if(state.done||!items.every(([key])=>state.items?.[key]))return false;
    state.done=true;state.completedAt=Date.now();p.modules=p.modules||{};p.last=p.last||{};
    (kind==="initial"?["initial"]:["initial","broadcast"]).forEach(key=>{p.modules[key]=(p.modules[key]||0)+1;p.last[key]=state.completedAt});
    save(p);return true;
  }

  function render(sync=true){
    showPlan();context("招考首頁");setRoute("ci/home",sync);
    const p=progress(),m=p.modules||{},last=p.last||{};
    let task={route:"initial",title:"先完成初試基本功",desc:"核對資料、摸高與台步，再完成一段廣播詞。",label:"開始初試準備"};
    if((m.initial||0)>0&&(m.broadcast||0)<3)task={route:"broadcast",title:"今天練一段華航廣播詞",desc:"完成一次原文朗讀與逐句檢查，只修正最明顯的 1–2 個問題。",label:"繼續廣播練習"};
    else if((m.broadcast||0)>=3&&(m.final||0)<3)task={route:"final",title:"開始一輪華航複試回答",desc:"練英文自介、情境判斷或個人特質，完成後查看核心觀念缺口。",label:"開始複試模擬"};
    else if((m.final||0)>=3)task={route:"today",title:"只補目前最弱的一項",desc:"今天不必把全部內容重做；完成一小組並留下下一個修正點即可。",label:"開始今日複習"};
    const previous=store.get("ciLastRoute","");
    app.innerHTML=`<div class="card ux-focus"><div class="ux-focus-label">TODAY · 下一個最值得做的練習</div><h2>${task.title}</h2><p class="section-note">${task.desc}</p><div class="ux-focus-actions"><button class="btn" data-ci-route="${task.route}">${task.label} →</button>${previous&&previous!==task.route?`<button class="btn ghost" data-ci-route="${previous}">回到上次：${routeNames[previous]||"練習"}</button>`:""}</div></div><div class="eva-stage-grid ci-home-stages"><div class="eva-stage-card ci-home-stage"><div class="eva-stage-label">① INITIAL SCREENING</div><h2>初試</h2><p class="sub">只練實際遇到的三關：繳資料、摸高／台步、唸廣播詞。</p><div class="eva-feature-list"><div class="eva-feature">📄 書面資料</div><div class="eva-feature">📏 摸高與台步</div><div class="eva-feature">📢 廣播詞朗讀</div></div><button class="btn ci-primary" data-ci-route="initial">進入初試準備</button></div><div class="eva-stage-card ci-home-stage final"><div class="eva-stage-label">② FINAL INTERVIEW</div><h2>複試</h2><p class="sub">一對多面談，集中練英文自介、情境、時事與個人特質。</p><div class="eva-feature-list"><div class="eva-feature">👥 一對多面談</div><div class="eva-feature">🇬🇧 英文自介</div><div class="eva-feature">🧩 情境判斷</div><div class="eva-feature">📰 時事與特質</div></div><button class="btn ci-primary" data-ci-route="final">進入複試準備</button></div></div><div class="ci-progress"><div class="ci-progress-head"><h3>華航能力狀態</h3><span>依實際練習顯示，不預測錄取率</span></div><div class="ci-skill-list">${skillRow("初試資料、摸高與台步",m.initial,last.initial)}${skillRow("廣播原文、英翻中與逐句修正",m.broadcast,last.broadcast)}${skillRow("複試面談與錄音回答",m.final,last.final)}</div></div>`;
  }
  function mark(key,rerender=true){const p=progress();p.modules=p.modules||{};p.last=p.last||{};p.modules[key]=(p.modules[key]||0)+1;p.last[key]=Date.now();save(p);if(rerender)render()}
  window.markCIProgress=(key)=>mark(key,false);

  function renderRoute(action,sync=true){
    hidePlan();context(routeNames[action]||"準備");store.set("ciLastRoute",action);setRoute(`ci/${action}`,sync);
    const routes={initial:{eyebrow:"INITIAL · 01",title:"華航初試訓練",desc:"依你的實際初試經驗，這一頁只保留三件事：繳資料、摸高與唸廣播詞，不放中文問答。",steps:[["01","繳交資料","文件依通知函準備，確認學歷、成績與英檢資料一致"],["02","摸高與ㄇ字型台步","練習高度、站姿、轉身與整體儀態"],["03","廣播詞朗讀","練習英文原文、數字、機型與句尾穩定度"]],label:"進入初試關卡"},broadcast:{eyebrow:"INITIAL · 02",title:"廣播原文與英翻中",desc:"這是華航初試的獨立訓練線。先從原文理解內容，再練朗讀、停頓與現場翻譯，不和一般題庫混在一起。",steps:[["01","讀懂原文","Dynasty、新聞稿與廣播情境"],["02","分段朗讀","練習重音、停頓與機上語氣"],["03","英翻中","先抓主旨，再完整說成自然中文"]],label:"進入廣播練習"},final:{eyebrow:"FINAL · 01",title:"華航複試模擬",desc:"複試不是隨機跳題。這裡先確認語言與模式，再開始一輪完整錄音，完成後回到華航準備度查看結果。",steps:[["01","選擇模式","中文單題，先從最熟悉的模式開始"],["02","錄音作答","回答華航題目，保留實際表現"],["03","查看分析","檢查長度、語速、結構與收束句"]],label:"開始錄音評估"},today:{eyebrow:"TODAY · 01",title:"今日華航訓練",desc:"今天只做一小組，不把所有資料攤開。完成初試三關，再決定是否進入複試。",steps:[["01","資料確認","把今天要帶的文件與報到事項核對一次"],["02","摸高與廣播詞","摸高／台步一輪，再朗讀一段華航原文"],["03","今日收束","記下最需要修正的一個地方，例如語速或數字"]],label:"進入今日清單"}};
    const r=routes[action]||routes.initial;
    app.innerHTML=`<div class="ci-route"><div class="ci-route-head"><span class="ci-phase-label">${r.eyebrow}</span><h2>${r.title}</h2><p>${r.desc}</p></div><div class="ci-route-body"><h3 style="margin:0">這一段會怎麼走？</h3><div class="ci-route-steps">${r.steps.map(x=>`<div class="ci-route-step"><b>${x[0]} · ${x[1]}</b><span>${x[2]}</span></div>`).join("")}</div><div class="ci-route-actions"><button class="btn" data-ci-open="${action}">${r.label} →</button><button class="btn ghost" data-ci-back="1">← 回到華航準備度</button></div></div></div>`;
  }
  function renderInitialModule(sync=true){hidePlan();context("初試 › 逐項完成");store.set("ciLastRoute","initial");setRoute("ci/initial-training",sync);app.innerHTML=`<div class="ci-route"><div class="ci-route-head"><span class="ci-phase-label">INITIAL · CHECKLIST</span><h2>華航初試訓練</h2><p>每一項都要實際做完再勾選；勾選會立即保留，重新整理後仍會回到這張清單。</p></div><div class="ci-route-body"><h3 style="margin:0 0 8px">今天的初試三項</h3>${checklistMarkup("initial",initialChecks,"華航初試逐項完成")}</div></div>`}
  function renderTodayModule(sync=true){hidePlan();context("今日訓練 › 逐項完成");store.set("ciLastRoute","today");setRoute("ci/today-training",sync);app.innerHTML=`<div class="ci-route"><div class="ci-route-head"><span class="ci-phase-label">TODAY · CHECKLIST</span><h2>今日華航訓練</h2><p>今天只完成三件事。每項各自勾選，三項都完成後才會寫入今日進度。</p></div><div class="ci-route-body"><h3 style="margin:0 0 8px">今日三步</h3>${checklistMarkup("today",todayChecks,"今日華航逐項完成")}</div></div>`}
  function renderCiInfo(title="書面資料與報到",desc="先把文件與當天流程整理好，避免把注意力浪費在臨時找資料。",items=infoItems,sync=true){hidePlan();context(`初試 › ${title}`);setRoute("ci/info",sync);app.innerHTML=`<div class="ci-route"><div class="ci-route-head"><span class="ci-phase-label">CHINA AIRLINES · PREP</span><h2>${title}</h2><p>${desc}</p></div><div class="ci-route-body"><div class="ci-initial-list">${items.map((x,i)=>`<div><b>${String(i+1).padStart(2,"0")}　${x[0]}</b><span>${x[1]}</span></div>`).join("")}</div><div class="ci-route-actions"><button class="btn ghost" data-ci-back="1">← 回到華航準備度</button></div></div></div>`}
  function renderCiStage(stage,sync=true){
    hidePlan();const initial=stage==="initial";
    const data=initial?{eyebrow:"INITIAL SCREENING · 01",title:"華航初試準備",desc:"依你的實際經驗，初試就是繳資料、摸高與唸廣播詞。公開招募流程寫明初試包含書面資料審核與面試；現場細節仍以初試通知函為準。",items:[["📄 書面資料與報到","確認畢業證書、各學期成績單、英檢成績與身分文件版本一致；報到攜帶內容以通知函為準。","info"],["📏 儀態與基本動作","摸高、ㄇ字型台步、站姿、轉身、眼神與表情。這是面試前要反覆練的基本功。","initial"],["📢 廣播詞朗讀","練習陌生英文朗讀、數字／機型／航點與句尾穩定度。","broadcast"]]}:{eyebrow:"FINAL INTERVIEW · 02",title:"華航複試準備",desc:"依你的面試回顧，複試是一對多面談。準備重點不是團討，而是英文自我介紹、情境判斷、時事應對與個人特質。",items:[["👥 一對多面談流程","同時面對多位考官，先聽完題目再回答；控制眼神、音量、節奏與回答長度。","mock"],["🇬🇧 英文自我介紹","準備 30 秒版本：姓名、服務背景、國際經驗、適合華航的原因與收束句。","mock"],["🧩 情境判斷","處理旅客需求、客訴、延誤或安全情境；回答要有判斷順序與實際做法。","mock"],["📰 時事應對與個人特質","能說出自己的觀點，也能用凱悅經驗證明細心、穩定、可靠等特質。","mock"]]};
    context(initial?"初試準備":"複試準備");store.set("ciLastRoute",initial?"initial":"final");setRoute(`ci/${initial?"initial":"final"}`,sync);
    app.innerHTML=`<div class="ci-route ci-eva-shell"><div class="ci-route-head"><button class="ci-eva-back" data-ci-back="1">← 華航首頁</button><span class="ci-phase-label">${data.eyebrow}</span><h2>${data.title}</h2><p>${data.desc}</p></div><div class="ci-route-body"><div class="ci-stage-list">${data.items.map((x,i)=>`<button class="ci-stage-item" data-ci-module="${x[2]}"><span class="ci-stage-num">${String(i+1).padStart(2,"0")}</span><span><b>${x[0]}</b><small>${x[1]}</small></span><strong>→</strong></button>`).join("")}</div><div class="ci-route-actions"><button class="btn ghost" data-ci-back="1">← 回到華航準備度</button></div></div></div>`;
  }
  function openMock(){nav("mock");const b=[...document.querySelectorAll("#mAirline button")].find(x=>x.textContent.includes("華航"));if(b)b.click();const lang=document.getElementById("mLang"),mode=document.getElementById("mMode");if(lang)lang.value="zh";if(mode)mode.value="single";document.getElementById("mDraw")?.scrollIntoView({behavior:"smooth",block:"center"})}

  app.addEventListener("change",e=>{const checkbox=e.target.closest("[data-ci-check]");if(!checkbox)return;const kind=checkbox.dataset.ciCheck,key=checkbox.dataset.ciCheckKey;updateChecklist(kind,key,checkbox.checked);if(kind==="initial")renderInitialModule(false);else renderTodayModule(false);requestAnimationFrame(()=>app.querySelector(`[data-ci-check="${kind}"][data-ci-check-key="${key}"]`)?.focus())});
  app.addEventListener("click",e=>{
    if(e.target.closest("[data-ci-back]")){render();return}
    const done=e.target.closest("[data-ci-checklist-done]");if(done){const kind=done.dataset.ciChecklistDone;if(completeChecklist(kind)){if(kind==="initial")renderInitialModule(false);else renderTodayModule(false)}return}
    const reset=e.target.closest("[data-ci-checklist-reset]");if(reset){const kind=reset.dataset.ciChecklistReset;resetChecklist(kind);if(kind==="initial")renderInitialModule(false);else renderTodayModule(false);return}
    const module=e.target.closest("[data-ci-module]");if(module){const action=module.dataset.ciModule;if(action==="info"){renderCiInfo();return}if(action==="initial"){renderInitialModule();return}if(action==="broadcast"){store.set("ciLastRoute","broadcast");nav("ciBroadcast");return}openMock();return}
    const open=e.target.closest("[data-ci-open]");if(open){const action=open.dataset.ciOpen;if(action==="broadcast"){store.set("ciLastRoute","broadcast");nav("ciBroadcast");return}if(action==="initial"){renderCiStage("initial");return}if(action==="today"){renderTodayModule();return}if(action==="final"){renderCiStage("final");return}}
    const button=e.target.closest("button[data-ci-action]");if(!button)return;const action=button.dataset.ciAction;if(action==="broadcast"||action==="today"){renderRoute(action);return}if(action==="initial"){renderCiStage("initial");return}if(action==="final"){renderCiStage("final");return}if(action==="stats"){render();document.querySelector("#ciApp .ci-progress")?.scrollIntoView({behavior:"smooth",block:"center"})}
  });
  panel.addEventListener("click",e=>{const route=e.target.closest("[data-ci-route]");if(!route)return;const action=route.dataset.ciRoute;if(action==="stats"){render();document.querySelector("#ciApp .ci-progress")?.scrollIntoView({behavior:"smooth",block:"center"});return}if(action==="initial")renderCiStage("initial");else if(action==="final")renderCiStage("final");else renderRoute(action);document.querySelector("#ciApp .ci-route")?.scrollIntoView({behavior:"smooth",block:"start"})});

  window.renderCI=render;
  window.renderCIRoute=view=>{if(view==="initial")renderCiStage("initial",false);else if(view==="final")renderCiStage("final",false);else if(view==="initial-training")renderInitialModule(false);else if(view==="today")renderRoute("today",false);else if(view==="today-training")renderTodayModule(false);else if(view==="info")renderCiInfo(undefined,undefined,undefined,false);else render(false)};
  render(false);
})();
