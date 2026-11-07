(function(){
  "use strict";
  const data=window.CIFinalPrep,app=document.getElementById("ciApp");
  if(!data||!app)return;
  const h=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const labels={asked:"回顧已問過",news:"新聞延伸擬題",followup:"延伸追問",annual:"年度議題擬題","review-extension":"初試延伸擬題",derived:"履歷延伸擬題"};
  const filters=["全部","先練重點","實戰回顧","新聞延伸","年度議題","履歷與服務","英文核心","弱點收藏"];
  const saved=store.get("ciFinalStudy",{}),state={filter:filters.includes(saved.filter)?saved.filter:"全部",search:typeof saved.search==="string"?saved.search:"",lang:["both","zh","en"].includes(saved.lang)?saved.lang:"both",selected:saved.selected||""};
  const revealed=new Set();
  const items=()=>data.registered||data.items;
  const save=()=>store.set("ciFinalStudy",state);
  const starred=item=>stars.includes(item.id);
  function visible(item){
    const match=state.filter==="全部"||state.filter==="先練重點"&&item.priority===1||state.filter==="英文核心"&&item.englishCore||state.filter==="弱點收藏"&&starred(item)||item.group===state.filter;
    const text=[item.q_zh,item.q_en,item.a_zh,item.a_en,item.tip,item.fact||""].join(" ").toLowerCase();
    return match&&(!state.search||text.includes(state.search.toLowerCase().trim()));
  }
  function references(item){
    return `<div class="ci-final-sources">${item.sources.map(key=>{const s=data.sources[key];return `<a href="${h(s.url)}" ${s.url.startsWith("https:")?'target="_blank" rel="noopener noreferrer"':""}>${h(s.title)}</a>${s.date?` <span>發布 ${h(s.date)}</span>`:""}`;}).join("<br>")}</div>`;
  }
  function answer(item){
    const zh=state.lang!=="en",en=state.lang!=="zh";
    return `${item.personalCheck?`<p class="tip ci-final-check"><b>作答前確認：</b>${h(item.personalCheck)}</p>`:""}<div class="ci-final-answers">${zh?`<div class="ansbox" lang="zh-Hant"><b>中文擬答</b><p>${h(item.a_zh)}</p></div>`:""}${en?`<div class="ansbox en" lang="en"><b>English draft</b><p>${h(item.a_en)}</p></div>`:""}</div><div class="chips">${zh?sayBtn(item.a_zh,"zh-TW","🔊 聽中文"):""}${en?sayBtn(item.a_en,"en-US","🔊 Listen"):""}</div><p class="tip">${h(item.tip)}</p>`;
  }
  function card(item){
    const children=items().filter(row=>row.parentKey===item.key),parent=item.parentKey&&items().find(row=>row.key===item.parentKey),open=item.key===state.selected;
    return `<details class="card ci-final-question" id="ci-final-${h(item.key)}" data-final-key="${h(item.key)}" ${open?"open":""}><summary><span class="ci-final-number">${String(data.items.findIndex(row=>row.key===item.key)+1).padStart(2,"0")}</span><span><span class="ci-final-badges"><span class="tag cat">${labels[item.kind]}</span>${item.priority===1?'<span class="tag">先練</span>':""}${starred(item)?'<span class="tag">★ 弱點</span>':""}</span><span class="ci-final-q">${h(item.q_zh)}</span><span class="ci-final-q en" lang="en">${h(item.q_en)}</span></span></summary><div class="ci-final-body">${parent?`<p class="sub">接續問題：<button class="ci-final-link" data-final-jump="${h(parent.key)}">${h(parent.q_zh)}</button></p>`:""}${item.fact?`<p class="ci-final-fact"><b>新聞背景</b><br>${h(item.fact)}</p><p class="sub">事件日期 ${h(item.eventDate)} · 查核 ${data.checkedAt}；此處保留當時報導狀態。</p>`:""}${references(item)}<div class="ci-final-actions"><button class="btn" data-final-record="${h(item.key)}" data-lang="zh" ${!data.registered?"disabled":""}>🎙 中文錄音</button><button class="btn sec" data-final-record="${h(item.key)}" data-lang="en" ${!data.registered?"disabled":""}>🎙 English</button><button class="btn ghost" data-final-star="${h(item.key)}" aria-pressed="${starred(item)}" ${!data.registered?"disabled":""}>${starred(item)?"★ 已加入弱點":"☆ 加入弱點"}</button></div><div class="ci-final-answer" data-answer-for="${h(item.key)}">${revealed.has(item.key)?answer(item):`<p class="sub">先用自己的話答 30–45 秒，再對照擬答。</p><button class="btn ghost" data-final-reveal="${h(item.key)}">查看中英文擬答</button>`}</div>${children.length?`<div class="ci-final-follow"><b>接著練追問</b>${children.map(child=>`<button class="ci-final-link" data-final-jump="${h(child.key)}">${h(child.q_zh)} →</button>`).join("")}</div>`:""}</div></details>`;
  }
  function renderList(){
    const list=items().filter(visible),el=document.getElementById("ciFinalList");if(!el)return;
    el.innerHTML=list.map(card).join("")||'<div class="card"><p>目前沒有符合條件的題目。可換分類、清除搜尋，或先加入弱點。</p><button class="btn ghost" data-final-reset>顯示全部題目</button></div>';
    document.getElementById("ciFinalCount").textContent=`顯示 ${list.length} / ${items().length} 題${data.registered?"":" · 題庫連結載入中…"}`;
  }
  function route(key="",sync=true){
    const name=`ci/final-topics${key?`/${key}`:""}`;
    if(sync)window.setAppRoute?.(name);
    store.set("ciLastRoute","final-topics");
    window.setUXContext?.("🌸 華航 › 複試專題",true);
  }
  function render(key="",sync=true){
    document.getElementById("ciSprintPlanWrap")?.classList.add("hidden");
    document.getElementById("ciSprintPanel")?.classList.add("ci-final-active");
    if(key&&items().some(item=>item.key===key)){
      state.selected=key;
      if(!visible(items().find(item=>item.key===key))){state.filter="全部";state.search="";}
    }
    route(key,sync);save();
    app.innerHTML=`<div class="card ci-final-head"><button class="ci-eva-back" data-ci-route="final">← 複試準備</button><span class="ci-phase-label">FINAL INTERVIEW · 中文 / ENGLISH</span><h2>複試專題・39 題雙語擬答</h2><p>從面試回顧、近期新聞到履歷追問，先回答，再看擬答，最後錄音回聽。</p><p class="sub">整理 ${data.checkedAt} · 4 題回顧已問過，其餘為延伸練習；新聞保留發布日期。六組英文核心問法共用對應答案。</p><div class="ci-final-actions"><button class="btn ghost" data-final-download>下載完整雙語擬答</button><button class="btn ghost" data-go="review">查看原始面試回顧</button></div><details class="ci-final-guide"><summary>先修正這三件事</summary><p>延誤資訊要誠實，不因可能涉及人為因素就含糊；可靠包含關鍵資訊再核對；加拿大旅客是租車，哥倫比亞旅客是線上報到。</p><p>擬答採用現有故事。標示「作答前確認」的準備、近況與證照細節，請先核對本人事實。</p></details></div><div class="card ci-final-controls"><label for="ciFinalSearch">搜尋題目、新聞或擬答</label><input id="ciFinalSearch" type="search" value="${h(state.search)}" placeholder="例如：延誤、韓文、privacy"><div class="searchrow"><label>練習分類<select id="ciFinalFilter">${filters.map(f=>`<option ${f===state.filter?"selected":""}>${f}</option>`).join("")}</select></label><label>擬答顯示<select id="ciFinalLang"><option value="both" ${state.lang==="both"?"selected":""}>中英對照</option><option value="zh" ${state.lang==="zh"?"selected":""}>中文</option><option value="en" ${state.lang==="en"?"selected":""}>English</option></select></label></div><p id="ciFinalCount" class="sub" role="status"></p><p id="ciFinalStatus" class="sub" role="status"></p></div><div id="ciFinalEnglish"></div><div id="ciFinalList"></div>`;
    if(state.filter==="英文核心")document.getElementById("ciFinalEnglish").innerHTML=`<div class="card"><h3>六組英文核心問法</h3>${data.englishPrompts.map(p=>`<p lang="en">${h(p.en)}<br>${p.keys.map(k=>`<button class="ci-final-link" data-final-jump="${k}">${h(data.byKey[k].q_zh)} →</button>`).join(" ")}</p>`).join("")}</div>`;
    renderList();
  }
  function open(key=""){
    window.showTab?.("eva",{preserveSubroute:true,syncRoute:false});
    render(key);
    if(key)requestAnimationFrame(()=>document.getElementById(`ci-final-${key}`)?.scrollIntoView({block:"start"}));
  }
  function jump(key){state.filter="全部";state.search="";state.selected=key;open(key)}
  document.addEventListener("click",event=>{
    const trigger=event.target.closest("[data-open-final-study]");if(trigger){open(trigger.dataset.openFinalStudy);return;}
    if(!event.target.closest("#ciApp"))return;
    const summary=event.target.closest(".ci-final-question>summary");
    if(summary){const card=summary.parentElement;state.selected=card.open?"":card.dataset.finalKey;save();return;}
    const reveal=event.target.closest("[data-final-reveal]");if(reveal){const item=items().find(row=>row.key===reveal.dataset.finalReveal);if(!item)return;revealed.add(item.key);reveal.closest(".ci-final-answer").innerHTML=answer(item);return;}
    const star=event.target.closest("[data-final-star]");if(star){const item=items().find(row=>row.key===star.dataset.finalStar);if(!item||!data.registered)return;state.selected=item.key;save();toggleStar(item.id);renderList();return;}
    const record=event.target.closest("[data-final-record]");if(record){const item=items().find(row=>row.key===record.dataset.finalRecord);if(!item||!data.registered)return;state.selected=item.key;save();if(!window.startCIFinalMock?.(item,record.dataset.lang))document.getElementById("ciFinalStatus").textContent="請先完成目前的錄音，再開始另一題。";return;}
    const target=event.target.closest("[data-final-jump]");if(target){jump(target.dataset.finalJump);return;}
    if(event.target.closest("[data-final-reset]")){state.filter="全部";state.search="";render();return;}
    if(event.target.closest("[data-final-download]")){
      const url=URL.createObjectURL(new Blob([data.markdown()],{type:"text/markdown;charset=utf-8"})),a=document.createElement("a");a.href=url;a.download=`華航複試雙語擬答-${data.checkedAt}.md`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }
  });
  app.addEventListener("input",event=>{if(event.target.id!=="ciFinalSearch")return;state.search=event.target.value;save();renderList()});
  app.addEventListener("change",event=>{
    if(event.target.id==="ciFinalFilter"){state.filter=event.target.value;save();render();document.getElementById("ciFinalFilter").focus();}
    if(event.target.id==="ciFinalLang"){state.lang=event.target.value;save();renderList();}
  });
  app.addEventListener("toggle",event=>{
    const el=event.target;if(!el.isConnected||!el.matches?.("details[data-final-key]")||!el.open)return;
    state.selected=el.dataset.finalKey;save();
    const hash=`#ci/final-topics/${state.selected}`;if(location.hash!==hash)window.setAppRoute?.(`ci/final-topics/${state.selected}`,{replace:true});
  },true);
  window.addEventListener("ci:final-ready",()=>{if(document.getElementById("ciFinalList"))renderList()});
  window.CIFinalStudy={render,open};
})();
