(function(){
  "use strict";
  const app = document.getElementById("evaApp");
  if(!app || typeof EVA_FINAL_QUESTIONS === "undefined") return;

  const EVA = {view:"home", core:null, corePool:[], coreIndex:0, corePriority:"must", coreCategory:"", tw:null, sjt:null, ethics:null, math:null, mathKind:"time", mathLevel:1, session:null, sessionSubflow:false, chain:null, chainIndex:0};
  const priorityName = {must:"🔥 必練",familiar:"⭐ 熟悉即可",improv:"🎲 臨場題"};
  const practice = ()=>store.get("evaProgress", {modules:{},math:{},core:[],english:[],followups:0,sjt:{ok:0,total:0},sessions:[],weak:[]});
  const savePractice = p=>store.set("evaProgress",p);
  function markModule(k,n){ const p=practice(); p.modules[k]=(p.modules[k]||0)+(n||1); savePractice(p); }
  function addUnique(k,v){ const p=practice(); p[k]=Array.isArray(p[k])?p[k]:[]; if(!p[k].includes(v)) p[k].push(v); savePractice(p); }
  function paintStatsMini(){ const el=document.getElementById("evaStatsMini");if(!el)return;const p=practice(),math=Object.values(p.math||{}).reduce((a,s)=>({ok:a.ok+(s.ok||0),total:a.total+(s.total||0)}),{ok:0,total:0});el.textContent=`初試練習 ${Object.values(p.modules||{}).reduce((a,b)=>a+b,0)} 次${math.total?`・筆試 ${math.ok}/${math.total}`:""}｜複試核心 ${(p.core||[]).length} 題・追問 ${p.followups||0} 層`; }
  const viewNames={home:"招考首頁",initial:"初試準備",final:"複試準備",reading:"英文無預讀",taiwanese:"台語廣播",sjt:"適職測驗",ethics:"職業倫理",paper:"筆試訓練",physical:"儀態提醒",core:"核心題",followup:"追問",picture:"看圖說故事",current:"時事",notice841:"84-1 注意事項",mock:"全真模擬",stats:"準備度"};
  function setViewContext(view){if(typeof window.setUXContext==="function")window.setUXContext(`🌍 長榮 › ${viewNames[view]||"訓練"}`,view!=="home")}
  function go(view,sync=true){ EVA.view=view; render(); setViewContext(view); const routeView=Object.prototype.hasOwnProperty.call(viewNames,view)?view:"mock"; if(sync&&typeof window.setAppRoute==="function")window.setAppRoute(`eva/${routeView}`); if(view==="home")paintEvaCountdown(); window.scrollTo({top:0,behavior:"smooth"}); }
  function navButton(view,label,cls){ return `<button class="btn ${cls||""}" data-eva-go="${view}">${label}</button>`; }
  function screenHead(title,sub){ const inSession=EVA.sessionSubflow&&EVA.session&&EVA.session.i<EVA.session.steps.length; return `<div class="card"><div class="eva-screen-head"><button class="eva-back" data-eva-go="${inSession?"session":"home"}">← ${inSession?"返回本次訓練":"長榮首頁"}</button><div style="flex:1"><div class="eva-eyebrow" style="color:var(--eva)">EVA AIR</div><h2>${esc(title)}</h2><p class="section-note">${esc(sub||"")}</p></div></div></div>`; }
  function moduleCard(view,icon,title,desc){ return `<button class="eva-module" data-eva-go="${view}"><b>${icon} ${title}</b><span>${desc}</span></button>`; }

  function renderHome(){
    const p=practice(), done=(p.sessions||[]).filter(x=>x.date===todayStr()).length;
    app.innerHTML=`<div class="eva-welcome">👋 Shelly，今天只做下一個最需要的練習，不必把整個題庫讀完。</div>
      <div class="card eva-hero">
        <div class="eva-eyebrow">NEXT TARGET · INITIAL SCREENING</div><h2>🌍 長榮航空招考衝刺</h2>
        <p class="section-note">下一關：初試｜針對目前備考流程集中準備</p>
        <div class="eva-hero-grid">
          ${navButton("initial","初試準備")}${navButton("final","複試準備")}
          ${navButton("today","⚡ 今日長榮訓練","sec")}${navButton("mock","🎙 長榮全真模擬","sec")}
        </div>
        <div class="air-date-row">
          <label>初試日期：<input type="date" id="evaInitialDate" value="2026-10-17"></label>
          <label>複試日期：<input type="date" id="evaFinalDate" value="2026-11-21"></label>
        </div>
        <div class="air-countdown" id="evaSprintCountdown"></div>
      </div>
      <div class="card"><h2>今日建議</h2><p class="section-note">${done?"今天已完成一套長榮訓練；若還有精神，只補弱點即可。":"先做 20–25 分鐘今日訓練，完成後再決定是否加練。"}</p>
        <div class="eva-actions">${navButton("today",done?"查看今天紀錄":"開始今日訓練")}${navButton("stats","查看長榮準備度","ghost")}</div></div>
      <div class="eva-stage-grid">
        <div class="eva-stage-card"><div class="eva-stage-label">① INITIAL SCREENING</div><h2>初試</h2><p class="sub">不是背大量面試題。先練陌生輸入、判斷與筆試技能。</p><div class="eva-feature-list">${["🇬🇧 英文無預讀","🗣 台語廣播","🧠 適職測驗","✍️ 職業倫理","🌍 時差計算","➗ 航空數學","📏 儀態提醒"].map(x=>`<div class="eva-feature">${x}</div>`).join("")}</div>${navButton("initial","進入初試訓練")}</div>
        <div class="eva-stage-card final"><div class="eva-stage-label">② FINAL INTERVIEW</div><h2>複試</h2><p class="sub">口試與追問集中在這裡，不與初試筆試混在一起。</p><div class="eva-feature-list">${["🖼 看圖說故事","🇬🇧 英文抽問題","👤 履歷個人題","✈️ Why EVA","👥 行為面試","⚠️ 壓力追問","📰 本週時事","📚 84-1 注意事項"].map(x=>`<div class="eva-feature">${x}</div>`).join("")}</div>${navButton("final","進入複試訓練")}</div>
      </div>
      <details class="card"><summary>其他練習工具</summary><div class="body"><p class="sub">精選50、模板、抽題、每日十分鐘、原模擬面試、題庫、朗讀、回顧、弱點、安全知識與其他航空公司資料都保留在上方導覽列。</p></div></details>`;
  }
  function paintEvaCountdown(){
    const init=document.getElementById("evaInitialDate"),fin=document.getElementById("evaFinalDate"),out=document.getElementById("evaSprintCountdown");
    if(!init||!fin||!out)return;
    const dates=store.get("evaSprintDates",{});if(dates.initial)init.value=dates.initial;if(dates.final)fin.value=dates.final;
    const di=dayDiff(init.value),df=dayDiff(fin.value);
    out.innerHTML=di>0?`<span>🛫 距離初試 <b>${di}</b> 天</span><em>→</em><span>複試 ${df>0?`還有 <b>${df}</b> 天`:"已到"}</span>`:di===0?`<span>🌟 今天初試</span><em>→</em><span>複試 ${df>0?`還有 <b>${df}</b> 天`:""}</span>`:`<span>✅ 初試完成</span><em>→</em><span>${df>0?`距離複試 <b>${df}</b> 天`:(df===0?"今天複試":"請更新日期")}</span>`;
  }

  function renderInitial(){ app.innerHTML=screenHead("長榮初試訓練","初試專注陌生文章、台語、判斷與筆試技能，不大量抽 Why EVA。")+
    `<div class="eva-module-grid">
      ${moduleCard("reading","🇬🇧","英文無預讀朗讀","按下開始後 3、2、1，文章才出現並直接錄音。")}
      ${moduleCard("taiwanese","🗣","台語廣播","12 個核心句型＋陌生替換，不背 50 題。")}
      ${moduleCard("sjt","🧠","適職性 SJT","每題選最適當與最不適當，解析程序與安全。")}
      ${moduleCard("ethics","✍️","職業倫理申論","立場 → 原則 → 理由 → 實際做法。")}
      ${moduleCard("paper","🧮","長榮筆試訓練","動態時差與航空數學，依技能看正確率。")}
      ${moduleCard("physical","📏","儀態／體格提醒","沿用既有儀態資料，面試前逐項確認。")}
    </div>`; }

  function renderFinal(){ app.innerHTML=screenHead("長榮複試訓練","大量口試集中在複試；核心控制在 45 題，分級練習，不一次平鋪。")+
    `<div class="eva-module-grid">
      ${moduleCard("core","🔥","長榮複試核心","18 必練、17 熟悉、10 臨場；一次只看一題。")}
      ${moduleCard("followup","🎯","考官追問模式","同一主題連追 2–4 層，不答完第一題就換題。")}
      ${moduleCard("picture","🖼","Picture Challenge","文字情境卡：準備 20–30 秒，英文回答 45–60 秒。")}
      ${moduleCard("current","📰","本週時事練習","7 個手動更新題位，不假裝即時新聞。")}
      ${moduleCard("notice841","📚","84-1 注意事項","只整理應試清單；日期與規則以當次招募公告為準。")}
      ${moduleCard("today","⚡","今日長榮訓練","中英核心、追問與情境混合，完成一題才下一題。")}
      ${moduleCard("mock","🎙","複試全真模擬","8 題即可，全部完成後再回顧。")}
    </div>`; }

  function recorderQuestion(d,lang,auto){
    document.querySelector('#nav button[data-t="mock"]').click();
    mStopAll();
    document.getElementById("mLang").value=lang;
    M.air="長榮"; M.queue=null; M.q=d; mRenderQ();
    const back=`<button class="btn ghost" id="evaRecorderBack" style="margin-top:10px">← 回長榮衝刺</button>`;
    document.getElementById("mBody").insertAdjacentHTML("beforeend",back);
    document.getElementById("evaRecorderBack").addEventListener("click",()=>{document.querySelector('#nav button[data-t="eva"]').click();if(EVA.sessionSubflow&&EVA.session){EVA.view="session";renderSession()}});
    if(auto) document.getElementById("mRec").click();
  }
  function readingChecklist(){ return `<div class="eva-checks">${["是否停頓過久","遇到生字是否卡住","是否重新唸很多次","音量是否穩定","語速是否過快","是否有自然語調","是否能維持表情"].map(x=>`<label><input type="checkbox">${x}</label>`).join("")}</div><p class="sub" style="margin-top:8px">本站不做假發音分數。完成後請回聽錄音並自行勾選。</p>`; }
  function renderReading(){ app.innerHTML=screenHead("英文無預讀朗讀","文章題材刻意分散，不用背答案。按下開始前不顯示文章。")+
    `<div class="card"><div class="eva-countdown" id="evaReadGate"><div><div style="font-size:34px">🇬🇧</div><h2>長榮無預讀模式</h2><p class="sub">文章出現時會立即進入錄音頁，建議朗讀 30–45 秒。</p><button class="btn" id="evaReadStart">準備好了，開始</button></div></div></div>
    <div class="card"><h2>完成後自我檢核</h2>${readingChecklist()}</div>`; }
  function startReading(){
    const passage=EVA_READING_PASSAGES[Math.floor(Math.random()*EVA_READING_PASSAGES.length)], gate=document.getElementById("evaReadGate"); let n=3;
    gate.innerHTML=`<div><p>文章即將出現</p><strong>${n}</strong></div>`;
    const tm=setInterval(()=>{n--; if(n>0){gate.querySelector("strong").textContent=n;return} clearInterval(tm); markModule("reading");
      addUnique("english",passage.type+":"+passage.text.slice(0,20));
      recorderQuestion({id:-201,cat:"長榮初試・英文無預讀",airlines:["長榮"],q_zh:"",q_en:passage.text,a_zh:"",a_en:"",tip:"陌生文章訓練：不停下查單字，維持節奏讀完。"},"en",true);
      document.getElementById("mBody").insertAdjacentHTML("beforeend",readingChecklist());
    },1000);
  }

  function pickTw(stranger){
    if(!stranger) return EVA_TAIWANESE[Math.floor(Math.random()*EVA_TAIWANESE.length)];
    const places=["桃園國際機場","高雄國際機場","東京成田機場"], objects=["護照佮登機證","隨身行李","你的物件"], actions=["確認予清楚","收予好","提予好勢"];
    const place=places[Math.floor(Math.random()*places.length)], obj=objects[Math.floor(Math.random()*objects.length)], act=actions[Math.floor(Math.random()*actions.length)];
    return {topic:"陌生台語",zh:`抵達${place}前，請確認您的隨身物品。`,tw:`欲到${place}進前，請共${obj}${act}。`,hard:"地點、物品與動作會替換；先抓句型，不背固定字串。"};
  }
  function renderTaiwanese(stranger){ EVA.tw=pickTw(stranger); const x=EVA.tw; app.innerHTML=screenHead("台語廣播","12 個核心句型；建議讀法僅作練習提示，可再請熟悉台語者確認口音。")+
    `<div class="card"><span class="tag br">${esc(x.topic)}</span><div class="eva-tw-source">${esc(x.zh)}</div><div class="sub">↓ 台語建議讀法</div><div class="eva-tw-reading">${esc(x.tw)}</div><div class="tip">困難詞：${esc(x.hard)}</div><div class="eva-actions" style="margin-top:12px"><button class="btn" id="evaTwRecord">開始錄音</button><button class="btn sec" data-eva-tw="normal">換核心句型</button><button class="btn ghost" data-eva-tw="stranger">陌生台語模式</button></div></div>`; }

  function renderSjt(){ EVA.sjt=EVA_SJT[Math.floor(Math.random()*EVA_SJT.length)]; const x=EVA.sjt; app.innerHTML=screenHead("適職性測驗 SJT","不是人格報告。先選最適當，再選最不適當。")+
    `<div class="card"><span class="tag br">${esc(x.tag)}</span><h2 style="margin-top:8px">${esc(x.q)}</h2><div class="eva-options">${x.o.map((o,i)=>`<div class="eva-option"><b>${String.fromCharCode(65+i)}.</b> ${esc(o)}<div style="margin-top:5px"><label><input type="radio" name="evaBest" value="${i}"> 最適當</label>　<label><input type="radio" name="evaWorst" value="${i}"> 最不適當</label></div></div>`).join("")}</div><button class="btn" id="evaSjtCheck">送出判斷</button><div id="evaSjtResult"></div></div>`; }
  function checkSjt(){ const best=document.querySelector('input[name="evaBest"]:checked'),worst=document.querySelector('input[name="evaWorst"]:checked'),r=document.getElementById("evaSjtResult"); if(!best||!worst){r.innerHTML='<div class="warnbox">請各選一個選項。</div>';return} if(best.value===worst.value){r.innerHTML='<div class="warnbox">最適當與最不適當不能是同一個選項。</div>';return} const ok=+best.value===EVA.sjt.best&&+worst.value===EVA.sjt.worst,p=practice();p.sjt=p.sjt||{ok:0,total:0};p.sjt.total++;if(ok)p.sjt.ok++;savePractice(p);markModule("sjt");r.innerHTML=`<div class="${ok?"fb good":"fb warn"}">${ok?"判斷一致":"再看一次優先順序"}</div><div class="eva-solution"><b>這題主要測：${esc(EVA.sjt.tag)}</b><p>${esc(EVA.sjt.why)}</p><p class="sub">較佳：${String.fromCharCode(65+EVA.sjt.best)}｜較不適當：${String.fromCharCode(65+EVA.sjt.worst)}</p></div><button class="btn" data-eva-go="sjt" style="margin-top:10px">下一題</button>`; }

  function renderEthics(){ EVA.ethics=EVA_ETHICS[Math.floor(Math.random()*EVA_ETHICS.length)]; const x=EVA.ethics; app.innerHTML=screenHead("職業倫理申論","用 30–60 秒或短文回答，不背逐字標準答案。")+
    `<div class="card"><h2>${esc(x.q)}</h2><div class="flow"><span>立場</span><em>→</em><span>原則</span><em>→</em><span>理由</span><em>→</em><span>實際做法</span></div><textarea id="evaEthicsText" placeholder="先用自己的話寫 4 句，或直接錄音回答…"></textarea><div class="eva-actions" style="margin-top:10px"><button class="btn" id="evaEthicsRecord">錄音回答</button><button class="btn sec" id="evaEthicsHint">看答題重點</button><button class="btn ghost" data-eva-go="ethics">換一題</button></div><div id="evaEthicsResult"></div></div>`; }

  function pad(n){return String(n).padStart(2,"0")}
  function fmtDay(min){ const day=12+Math.floor(min/1440),m=((min%1440)+1440)%1440;return `${day}日 ${pad(Math.floor(m/60))}:${pad(m%60)}`; }
  function makeTime(level){
    const diffs=[-13,-11,-8,-6,-3,1,2], diff=diffs[Math.floor(Math.random()*diffs.length)], h=6+Math.floor(Math.random()*16), m=[0,15,30,45][Math.floor(Math.random()*4)], flight=2+Math.floor(Math.random()*12), start=h*60+m;
    let q,ans,steps,key="time"+level;
    if(level===1){ans=start+diff*60;q=`台北是 12 日 ${pad(h)}:${pad(m)}。目的地比台北${diff<0?"慢":"快"} ${Math.abs(diff)} 小時，當地是幾日幾點？`;steps=["先以台北時間為基準","依題目給定時差換算目的地時間","確認日期是否改變"]}
    else if(level===4){const arrival=start+flight*60+diff*60;ans=start;q=`班機飛行 ${flight} 小時，目的地比台北${diff<0?"慢":"快"} ${Math.abs(diff)} 小時，並在目的地時間 ${fmtDay(arrival)} 抵達。台北起飛時間是？`;steps=["先把抵達時間換回台北時間","再減去飛行時間","確認起飛日期"]}
    else if(level===5){const from=[-5,0,2,8][Math.floor(Math.random()*4)],to=[-8,0,1,9][Math.floor(Math.random()*4)];ans=start+(to-from)*60;q=`出發地為 UTC${from>=0?"+":""}${from}，當地 12 日 ${pad(h)}:${pad(m)}。目的地為 UTC${to>=0?"+":""}${to}，同一時刻目的地是？`;steps=["先把出發地換成 UTC","再從 UTC 換到目的地","確認日期"]}
    else {ans=start+flight*60+diff*60;q=`台北時間 12 日 ${pad(h)}:${pad(m)} 起飛，飛行 ${flight} 小時。目的地比台北${diff<0?"慢":"快"} ${Math.abs(diff)} 小時，抵達當地是？`;steps=["先加飛行時間","再換目的地時間","最後確認日期"]}
    if(level===3 && fmtDay(ans).startsWith("12日")){ return makeTime(level); }
    return {kind:"time",level,key,q,answer:fmtDay(ans),solution:steps};
  }
  function makeMath(level){ const a=10+Math.floor(Math.random()*90),b=2+Math.floor(Math.random()*18);let q,answer,steps,key="math"+level;
    if(level===1){answer=a+b*3;q=`機上有 ${a} 份餐點，又補上 3 箱、每箱 ${b} 份，共有幾份？`;steps=[`先算 3 × ${b}`,`再加 ${a}`]}
    else if(level===2){const rate=[10,15,20,25][Math.floor(Math.random()*4)],base=(5+Math.floor(Math.random()*16))*20;answer=base*rate/100;q=`${base} 位旅客中有 ${rate}% 選擇特別餐，共幾位？`;steps=[`把 ${rate}% 寫成 ${rate}/100`,`用 ${base} × ${rate}/100`]}
    else if(level===3){const bags=5+Math.floor(Math.random()*15),kg=12+Math.floor(Math.random()*15);answer=bags*kg;q=`${bags} 件行李，每件平均 ${kg} 公斤，總重量多少公斤？`;steps=["件數 × 每件重量","保留公斤單位"]}
    else if(level===4){const limit=1200,loaded=(30+Math.floor(Math.random()*15))*20;answer=limit-loaded;q=`載重上限 ${limit} 公斤，目前已裝載 ${loaded} 公斤，還可裝多少公斤？`;steps=["上限 − 已裝載","確認答案不可為負"]}
    else if(level===5){const rows=8+Math.floor(Math.random()*12),each=[4,6,8][Math.floor(Math.random()*3)],used=Math.floor(rows*each*.7);answer=rows*each-used;q=`客艙有 ${rows} 排、每排 ${each} 席，已坐 ${used} 人，還有幾個空位？`;steps=["先算總座位","再減已坐人數"]}
    else {const old=(20+Math.floor(Math.random()*20))*100,newP=old+500+Math.floor(Math.random()*10)*100,qty=2+Math.floor(Math.random()*7);answer=(newP-old)*qty;q=`每件用品原價 ${old} 元，改為 ${newP} 元，共採購 ${qty} 件，成本增加多少元？`;steps=["先算單件價差","再乘採購數量"]}
    return {kind:"math",level,key,q,answer:String(answer),solution:steps}; }
  function makeProblem(){ return EVA.mathKind==="time"?makeTime(EVA.mathLevel):makeMath(EVA.mathLevel); }
  function renderPaper(){ EVA.math=makeProblem(); const x=EVA.math, names=x.kind==="time"?["基礎時差","飛行時間＋時差","跨日","反向計算","UTC / GMT","綜合題"]:["四則運算","百分比","重量","載重","人數／容量","成本差異"]; app.innerHTML=screenHead("🧮 長榮筆試訓練","題目即時生成；城市與夏令時間不作推測，一律以題目提供的時差為準。")+
    `<div class="card"><div class="chips"><button class="chip ${EVA.mathKind==="time"?"on":""}" data-math-kind="time">🌍 時差</button><button class="chip ${EVA.mathKind==="math"?"on":""}" data-math-kind="math">➗ 航空數學</button></div><div class="eva-math-levels">${names.map((n,i)=>`<button class="chip ${EVA.mathLevel===i+1?"on":""}" data-math-level="${i+1}">Lv.${i+1} ${n}</button>`).join("")}</div></div>
    <div class="card"><span class="tag br">Lv.${x.level}</span><h2 style="margin-top:8px">${esc(x.q)}</h2><input id="evaMathAnswer" type="text" placeholder="${x.kind==="time"?"例如：13日 08:30":"只輸入數字"}" style="width:100%;margin:8px 0"><button class="btn" id="evaMathCheck">送出答案</button><div id="evaMathResult"></div></div>`; }
  function checkMath(){ const input=document.getElementById("evaMathAnswer").value.replace(/\s/g,""),ans=String(EVA.math.answer).replace(/\s/g,""),ok=input===ans,p=practice();p.math=p.math||{};const s=p.math[EVA.math.key]||{ok:0,total:0};s.total++;if(ok)s.ok++;p.math[EVA.math.key]=s;savePractice(p);markModule(EVA.math.kind);document.getElementById("evaMathResult").innerHTML=`<div class="${ok?"fb good":"fb warn"}">${ok?"✅ 答對":"答案是 "+esc(EVA.math.answer)}</div><div class="eva-solution"><h3>解法</h3><ol>${EVA.math.solution.map(y=>`<li>${esc(y)}</li>`).join("")}</ol></div><div class="eva-actions" style="margin-top:10px"><button class="btn" data-eva-go="paper">再做同類型</button><button class="btn sec" data-math-harder="1">提高難度</button><button class="btn ghost" data-math-weak="${EVA.math.key}">加入弱點</button></div>`; }

  function renderPhysical(){ app.innerHTML=screenHead("儀態／體格提醒","沿用既有關卡資料；長榮實際標準請以當次招募簡章為準。")+PHYSICAL.map(p=>`<div class="card"><h2>${esc(p.t)}</h2><ul class="tight">${p.items.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`).join(""); }

  function corePool(priority,category){ return EVA_FINAL_QUESTIONS.filter(q=>(!priority||q.priority===priority)&&(!category||q.category===category)); }
  function renderCore(){ const cats=[...new Set(EVA_FINAL_QUESTIONS.map(x=>x.category))]; if(!EVA.core){EVA.corePool=corePool(EVA.corePriority,EVA.coreCategory);EVA.coreIndex=0;EVA.core=EVA.corePool[0]} const q=EVA.core; app.innerHTML=screenHead("長榮複試核心","45 題分級管理；臨場題只練架構，不要求寫完整答案。")+
    `<div class="card"><div class="chips">${Object.entries(priorityName).map(([k,v])=>`<button class="chip ${EVA.corePriority===k?"on":""}" data-core-priority="${k}">${v}（${corePool(k,"").length}）</button>`).join("")}</div><select id="evaCoreCat"><option value="">全部類別</option>${cats.map(c=>`<option ${c===EVA.coreCategory?"selected":""}>${c}</option>`).join("")}</select><button class="btn sec" id="evaCoreDraw" style="margin-left:8px">抽一題</button></div>${coreCard(q)}`; }
  function coreCard(q){ const hasAnswer=!!(q.a_zh||q.a_en),isStar=stars.includes(q.id);return `<div class="card eva-question-card"><span class="eva-priority ${q.priority}">${priorityName[q.priority]}</span><span class="tag br">${esc(q.category)}</span><h2>${esc(q.q_zh)}</h2>${q.q_en?`<div class="qtext en">${esc(q.q_en)}</div>`:""}<div class="eva-actions" style="margin:12px 0"><button class="btn" data-core-record="${q.id}">30秒計時＋錄音</button>${hasAnswer?`<button class="btn sec" id="evaCoreReveal">看擬答</button>`:""}<button class="btn ghost" data-core-star="${q.id}">${isStar?"★ 已在弱點":"☆ 加入弱點"}</button><button class="btn ghost" id="evaCoreNext">換下一題</button></div><div id="evaCoreAnswer"></div></div>`; }
  function revealCore(){ const q=EVA.core,answer=q.a_zh||q.a_en?`<h3>30秒擬答</h3><div class="eva-answer">${esc(q.a_zh||q.a_en)}</div>`:`<div class="tip">這是臨場題，不必寫完整答案。只用關鍵字開口。</div>`;document.getElementById("evaCoreAnswer").innerHTML=answer+`<div class="eva-note-grid"><div class="eva-note"><b>🧠 記住這些詞就好</b><div class="eva-keywords">${(q.keywords||[]).map(k=>`<span>${esc(k)}</span>`).join("")}</div></div><div class="eva-note"><b>🎯 這題真正要回答什麼？</b>${esc(q.answerIntent)}</div><div class="eva-note warn"><b>⚠️ 不要這樣答</b><ul class="tight">${(q.pitfalls||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div><div class="eva-note"><b>👩‍✈️ 考官可能追問</b>${q.fu&&q.fu.length?q.fu.map(f=>`<details><summary>${esc(f.q)}</summary><div class="body">${esc(f.a)}</div></details>`).join(""):"用『為什麼／怎麼證明／如果相反呢』自行追問一層。"}</div></div>`;addUnique("core",q.id);if(q.q_en)addUnique("english",q.id);markModule("core"); }

  function renderFollowup(){ if(!EVA.chain){EVA.chain=EVA_FOLLOWUP_CHAINS[0];EVA.chainIndex=0} const step=EVA.chain.steps[EVA.chainIndex];app.innerHTML=screenHead("🎯 考官追問模式","同一主題連續追問。先回答現在這一層，再按下一層。")+
    `<div class="card"><div class="chips">${EVA_FOLLOWUP_CHAINS.map((c,i)=>`<button class="chip ${c===EVA.chain?"on":""}" data-chain="${i}">${esc(c.title)}</button>`).join("")}</div><div class="eva-session-list">${EVA.chain.steps.map((s,i)=>`<div class="eva-session-step ${i<EVA.chainIndex?"done":i===EVA.chainIndex?"on":""}">${i<EVA.chainIndex?"✓":i+1} ${esc(s)}</div>`).join("")}</div><div class="card" style="box-shadow:none"><span class="tag br">第 ${EVA.chainIndex+1} / ${EVA.chain.steps.length} 層</span><h2>${esc(step)}</h2><div class="eva-actions"><button class="btn" id="evaChainRecord">錄音回答</button><button class="btn sec" id="evaChainNext">回答完成，下一層</button></div></div></div>`; }

  function renderPicture(){ const p=EVA_PICTURES[Math.floor(Math.random()*EVA_PICTURES.length)];EVA.picture=p;app.innerHTML=screenHead("🖼 Picture Challenge","文字情境卡版本：準備 20–30 秒，英文回答 45–60 秒。")+
    `<div class="card"><span class="tag br">${esc(p.title)}</span><div class="eva-reading" style="margin-top:10px">${esc(p.scene)}</div><div class="flow"><span>1. What I see</span><em>→</em><span>2. What may be happening</span><em>→</em><span>3. What happens next</span></div><div class="eva-actions"><button class="btn" id="evaPicPrep">開始 20 秒準備</button><button class="btn sec" id="evaPicRecord">直接錄音</button><button class="btn ghost" data-eva-go="picture">換情境</button></div><p id="evaPicClock" class="tstate"></p></div>`; }

  function renderCurrent(){ app.innerHTML=screenHead("📰 本週時事練習","手動更新題庫：本站沒有新聞 API，不會假裝即時更新。")+`<div class="card"><span class="eva-manual">手動更新題庫</span><p class="section-note" style="margin-top:7px">每週只選 1–2 題，先確認新聞事實，再說自己的觀點。</p></div>`+EVA_CURRENT_TOPICS.map((x,i)=>`<details><summary>${i+1}. ${esc(x)}</summary><div class="body"><div class="flow"><span>一句話事實</span><em>→</em><span>為何重要</span><em>→</em><span>對旅客／組員影響</span><em>→</em><span>我的立場</span></div><button class="btn sec" data-current-record="${i}">錄音回答</button></div></details>`).join(""); }

  function renderNotice841(){ const groups=[
    ["報到資料",["身分證件與招募公告要求的文件已備妥","履歷與證明文件版本、姓名及日期一致","只帶公告允許的物品，不自行猜測額外要求"]],
    ["服裝儀容",["服裝整潔、活動方便，鞋子已實際走動測試","頭髮、指甲與妝容以乾淨俐落為主","前一晚正常睡眠，不在當天嘗試新保養品或新鞋"]],
    ["流程與作答",["提早確認交通、報到地點與預留時間","手機依現場規定關機或收妥，不拍攝、不轉傳考題","聽完指示再動作；不確定時禮貌詢問工作人員"]],
    ["最後確認",["實際日期、地點、攜帶文件與測驗規則，一律回看當次招募公告","本站不把歷屆經驗寫成現行規定","出發前只看這張清單，不再臨時大量背題"]]
  ];app.innerHTML=screenHead("📚 84-1 注意事項","應試前的低負擔檢查表；不把未確認資訊當成現行規定。")+groups.map(([t,items])=>`<div class="card"><h2>${t}</h2><div class="eva-checks">${items.map(x=>`<label><input type="checkbox">${x}</label>`).join("")}</div></div>`).join(""); }

  function sessionSteps(mode){
    if(mode==="today")return ["英文無預讀 1","英文無預讀 2","台語 1","台語 2","適職 1","適職 2","適職 3","時差／數學 1","時差／數學 2","中文核心 1","中文核心 2","英文核心","追問","情境題"];
    if(mode==="initialMock")return ["英文無預讀","台語","適職題","職業倫理","時差","航空數學"];
    return ["英文任務","個人題","履歷題","行為題","追問 1","追問 2","情境題","時事題"];
  }
  function mockReview(s){if(!s.answers.length)return "";return `<div class="card"><h2>完成後回顧</h2>${s.answers.map((x,i)=>`<details><summary>${i+1}. ${esc(x.label)}</summary><div class="body"><p>${esc(x.q)}</p>${x.answer?`<p><b>你的作答：</b>${esc(x.answer)}</p>`:"<p class=\"sub\">未留下文字作答</p>"}${x.standard?`<div class="tip"><b>核對：</b>${esc(x.standard)}</div>`:""}</div></details>`).join("")}</div>`}
  function renderSession(){ EVA.sessionSubflow=false; const s=EVA.session,steps=s.steps,done=s.i>=steps.length;if(done){const p=practice();p.sessions=p.sessions||[];if(!p.sessions.some(x=>x.id===s.id))p.sessions.push({id:s.id,date:todayStr(),mode:s.mode});savePractice(p);app.innerHTML=screenHead(s.title,"完成後才看回顧，不顯示『還剩幾十題』。")+`<div class="card" style="text-align:center"><div style="font-size:42px">✅</div><h2>今日完成</h2><div class="eva-session-list">${steps.map(x=>`<div class="eva-session-step done">✓ ${esc(x)}</div>`).join("")}</div><p class="section-note">需要再加強的項目會依你的錯題與弱點紀錄顯示在長榮準備度；資料不足時不假造百分比。</p>${navButton("stats","查看長榮準備度")}</div>${mockReview(s)}`;return} const current=steps[s.i];app.innerHTML=screenHead(s.title,"一次只顯示目前任務，完成後才進下一題。")+`<div class="card"><div class="eva-session-list">${steps.map((x,i)=>`<div class="eva-session-step ${i<s.i?"done":i===s.i?"on":""}">${i<s.i?"✓":i+1} ${esc(x)}</div>`).join("")}</div></div><div class="card"><span class="tag br">第 ${s.i+1} 個任務</span><h2>${esc(current)}</h2><p class="section-note">先實際開口或作答，再按完成。模擬模式不會中途顯示標準答案。</p><div class="eva-actions"><button class="btn" id="evaSessionDo">開始這一題</button><button class="btn sec" id="evaSessionNext">完成，下一題</button></div></div>`; }
  function startSession(mode){EVA.session={id:Date.now(),mode,title:mode==="today"?"⚡ 今日長榮訓練":mode==="initialMock"?"初試全真模擬":"複試全真模擬",steps:sessionSteps(mode),i:0,answers:[],current:null};EVA.sessionSubflow=false;EVA.view="session";render()}
  function renderInitialMockTask(label){const s=EVA.session;let q="",standard="",body="";if(label.includes("英文")){const x=EVA_READING_PASSAGES[Math.floor(Math.random()*EVA_READING_PASSAGES.length)];q=x.text;body=`<div class="eva-reading">${esc(q)}</div><p class="sub">直接朗讀一次；不中途查字或重來。</p>`}else if(label.includes("台語")){const x=pickTw(false);q=x.zh;body=`<div class="eva-tw-source">${esc(x.zh)}</div><div class="eva-tw-reading">${esc(x.tw)}</div><textarea id="evaMockAnswer" placeholder="可記錄卡住的詞；不顯示額外提示"></textarea>`}else if(label.includes("適職")){const x=EVA_SJT[Math.floor(Math.random()*EVA_SJT.length)];q=x.q;standard=`較佳 ${String.fromCharCode(65+x.best)}；較不適當 ${String.fromCharCode(65+x.worst)}。${x.why}`;body=`<h2>${esc(q)}</h2><div class="eva-options">${x.o.map((o,i)=>`<div class="eva-option"><b>${String.fromCharCode(65+i)}.</b> ${esc(o)}<div><label><input type="radio" name="mockBest" value="${i}"> 最適當</label>　<label><input type="radio" name="mockWorst" value="${i}"> 最不適當</label></div></div>`).join("")}</div>`}else if(label.includes("倫理")){const x=EVA_ETHICS[Math.floor(Math.random()*EVA_ETHICS.length)];q=x.q;standard=`回顧方向：${x.points.join("、")}`;body=`<h2>${esc(q)}</h2><textarea id="evaMockAnswer" placeholder="立場 → 原則 → 理由 → 實際做法"></textarea>`}else{const x=label.includes("時差")?makeTime(3):makeMath(3);q=x.q;standard=`答案：${x.answer}；${x.solution.join(" → ")}`;body=`<h2>${esc(q)}</h2><input id="evaMockAnswer" type="text" placeholder="輸入答案；完成整套後才核對">`}s.current={label,q,standard};app.innerHTML=screenHead(`${label}｜模擬作答`,"本頁不提供送出、對錯或解析；作答後回到進度頁。")+`<div class="card">${body}<div class="eva-actions" style="margin-top:12px"><button class="btn" id="evaMockSave">儲存作答，返回進度</button></div></div>`}
  function saveMockTask(){const s=EVA.session,c=s.current;if(!c)return;let answer=(document.getElementById("evaMockAnswer")||{}).value||"";const best=document.querySelector('input[name="mockBest"]:checked'),worst=document.querySelector('input[name="mockWorst"]:checked');if(best||worst)answer=`最適當 ${best?String.fromCharCode(65+(+best.value)):"未選"}；最不適當 ${worst?String.fromCharCode(65+(+worst.value)):"未選"}`;s.answers=s.answers.filter(x=>x.label!==c.label);s.answers.push({...c,answer});s.current=null;EVA.view="session";renderSession()}
  function doSessionStep(){EVA.sessionSubflow=true;const label=EVA.session.steps[EVA.session.i];if(EVA.session.mode==="initialMock"){renderInitialMockTask(label);return}if(label.includes("英文無預讀")){renderReading();return}if(label==="英文任務"){const pool=EVA_FINAL_QUESTIONS.filter(x=>x.q_en),q=pool[Math.floor(Math.random()*pool.length)];recorderQuestion(q,"en",false);return}if(label.includes("台語")){renderTaiwanese(false);return}if(label.includes("適職")){renderSjt();return}if(label.includes("倫理")){renderEthics();return}if(label.includes("時差")){EVA.mathKind="time";EVA.mathLevel=label.includes("／")?1:3;renderPaper();return}if(label.includes("數學")){EVA.mathKind="math";renderPaper();return}if(label.includes("追問")){renderFollowup();return}if(label.includes("時事")){renderCurrent();return}const pool=label.includes("英文")?EVA_FINAL_QUESTIONS.filter(x=>x.q_en):EVA_FINAL_QUESTIONS.filter(x=>x.priority!=="improv"),q=pool[Math.floor(Math.random()*pool.length)];recorderQuestion(q,label.includes("英文")?"en":"zh",false)}

  function renderMock(){app.innerHTML=screenHead("長榮全真模擬","初試依考試路徑完成 6 模組；複試約 8 題。中途不顯示答案。")+`<div class="eva-stage-grid"><div class="eva-stage-card"><div class="eva-stage-label">INITIAL</div><h2>初試模擬</h2><p class="sub">英文無預讀 → 台語 → 適職 → 倫理 → 時差 → 數學</p><button class="btn" data-session-start="initialMock">開始初試模擬</button></div><div class="eva-stage-card final"><div class="eva-stage-label">FINAL</div><h2>複試模擬</h2><p class="sub">英文、個人、履歷、行為、追問、情境、時事，共 8 題。</p><button class="btn" data-session-start="finalMock">開始複試模擬</button></div></div>`; }

  function renderStats(){const p=practice(),math=p.math||{},skillNames={time1:"時差基礎",time2:"飛行＋時差",time3:"跨日",time4:"反向計算",time5:"UTC / GMT",time6:"時差綜合",math1:"四則運算",math2:"百分比",math3:"重量",math4:"載重",math5:"人數／容量",math6:"成本差異"};const skillRows=Object.keys(skillNames).map(k=>{const s=math[k];return `<div class="eva-skill-row"><div class="eva-skill-head"><b>${skillNames[k]}</b><span>${s&&s.total?`${s.ok} / ${s.total}・${Math.round(s.ok/s.total*100)}%` : "尚無作答資料"}</span></div>${s&&s.total?`<div class="eva-progress"><span style="width:${Math.round(s.ok/s.total*100)}%"></span></div>`:""}</div>`}).join("");const tried=Object.entries(math).filter(([,s])=>s.total),weakest=tried.sort((a,b)=>a[1].ok/a[1].total-b[1].ok/b[1].total)[0];const priority=[];if(weakest)priority.push(skillNames[weakest[0]]);if((p.weak||[]).length)priority.push(...p.weak.slice(0,2));if(!priority.length)priority.push("先完成一組跨日時差，建立第一筆資料");app.innerHTML=screenHead("長榮準備度","只顯示練習次數、已練題數與有作答依據的正確率，不預測錄取率。")+`<div class="eva-stat-block"><div class="eva-stat-card"><h3>初試</h3><p>英文朗讀　練習 ${p.modules.reading||0} 次</p><p>台語　　　練習 ${p.modules.taiwanese||0} 次</p><p>適職　　　作答 ${(p.sjt||{}).total||0} 題</p><p>倫理　　　練習 ${p.modules.ethics||0} 次</p></div><div class="eva-stat-card"><h3>複試</h3><p>核心題　　${(p.core||[]).length} / ${EVA_FINAL_QUESTIONS.filter(x=>x.priority!=="improv").length} 已練</p><p>英文　　　${(p.english||[]).length} 次／題</p><p>追問　　　${p.followups||0} 層</p><p>弱點　　　${stars.filter(id=>DATA[id]&&DATA[id].stage==="eva_final").length+(p.weak||[]).length} 項</p></div></div><div class="card"><h2>動態筆試技能</h2>${skillRows}</div><div class="card"><h2>目前優先</h2><ol class="tight">${priority.map(x=>`<li>${esc(x)}</li>`).join("")}</ol></div>`; }

  function render(){ if(EVA.view==="home")renderHome();else if(EVA.view==="initial")renderInitial();else if(EVA.view==="final")renderFinal();else if(EVA.view==="reading")renderReading();else if(EVA.view==="taiwanese")renderTaiwanese(false);else if(EVA.view==="sjt")renderSjt();else if(EVA.view==="ethics")renderEthics();else if(EVA.view==="paper")renderPaper();else if(EVA.view==="physical")renderPhysical();else if(EVA.view==="core")renderCore();else if(EVA.view==="followup")renderFollowup();else if(EVA.view==="picture")renderPicture();else if(EVA.view==="current")renderCurrent();else if(EVA.view==="notice841")renderNotice841();else if(EVA.view==="today")startSession("today");else if(EVA.view==="mock")renderMock();else if(EVA.view==="session")renderSession();else if(EVA.view==="stats")renderStats(); }

  app.addEventListener("change",e=>{
    if(e.target.id!=="evaInitialDate"&&e.target.id!=="evaFinalDate")return;
    const d=store.get("evaSprintDates",{});d[e.target.id==="evaInitialDate"?"initial":"final"]=e.target.value;store.set("evaSprintDates",d);paintEvaCountdown();
  });
  app.addEventListener("click",e=>{
    const goBtn=e.target.closest("[data-eva-go]");if(goBtn){EVA.core=null;go(goBtn.dataset.evaGo);return}
    if(e.target.id==="evaReadStart"){startReading();return}
    const tw=e.target.closest("[data-eva-tw]");if(tw){renderTaiwanese(tw.dataset.evaTw==="stranger");return}
    if(e.target.id==="evaTwRecord"){markModule("taiwanese");recorderQuestion({id:-202,cat:"長榮初試・台語",airlines:["長榮"],q_zh:EVA.tw.zh+"\n\n建議讀法："+EVA.tw.tw,q_en:"",a_zh:"",a_en:"",tip:EVA.tw.hard},"zh",false);return}
    if(e.target.id==="evaSjtCheck"){checkSjt();return}
    if(e.target.id==="evaEthicsHint"){markModule("ethics");document.getElementById("evaEthicsResult").innerHTML=`<div class="eva-solution"><b>回答重點</b><div class="eva-keywords" style="margin-top:8px">${EVA.ethics.points.map(x=>`<span>${esc(x)}</span>`).join("")}</div></div>`;return}
    if(e.target.id==="evaEthicsRecord"){markModule("ethics");recorderQuestion({id:-203,cat:"長榮初試・職業倫理",airlines:["長榮"],q_zh:EVA.ethics.q,q_en:"",a_zh:"",a_en:"",tip:"立場 → 原則 → 理由 → 實際做法"},"zh",false);return}
    const kind=e.target.closest("[data-math-kind]");if(kind){EVA.mathKind=kind.dataset.mathKind;EVA.mathLevel=1;renderPaper();return}
    const level=e.target.closest("[data-math-level]");if(level){EVA.mathLevel=+level.dataset.mathLevel;renderPaper();return}
    if(e.target.id==="evaMathCheck"){checkMath();return}
    if(e.target.closest("[data-math-harder]")){EVA.mathLevel=Math.min(6,EVA.mathLevel+1);renderPaper();return}
    const mw=e.target.closest("[data-math-weak]");if(mw){const p=practice();p.weak=p.weak||[];if(!p.weak.includes(mw.dataset.mathWeak))p.weak.push(mw.dataset.mathWeak);savePractice(p);mw.textContent="已加入弱點";return}
    const pri=e.target.closest("[data-core-priority]");if(pri){EVA.corePriority=pri.dataset.corePriority;EVA.coreCategory="";EVA.corePool=corePool(EVA.corePriority,"");EVA.coreIndex=0;EVA.core=EVA.corePool[0];renderCore();return}
    if(e.target.id==="evaCoreDraw"){EVA.coreCategory=document.getElementById("evaCoreCat").value;EVA.corePool=corePool(EVA.corePriority,EVA.coreCategory);EVA.coreIndex=Math.floor(Math.random()*EVA.corePool.length);EVA.core=EVA.corePool[EVA.coreIndex];renderCore();return}
    if(e.target.id==="evaCoreNext"){EVA.coreCategory=document.getElementById("evaCoreCat").value;EVA.corePool=corePool(EVA.corePriority,EVA.coreCategory);EVA.coreIndex=(EVA.coreIndex+1)%EVA.corePool.length;EVA.core=EVA.corePool[EVA.coreIndex];renderCore();return}
    if(e.target.id==="evaCoreReveal"){revealCore();return}
    const cr=e.target.closest("[data-core-record]");if(cr){const q=DATA[+cr.dataset.coreRecord];addUnique("core",q.id);if(q.q_en)addUnique("english",q.id);markModule("core");recorderQuestion(q,q.q_en?"en":"zh",false);return}
    const cs=e.target.closest("[data-core-star]");if(cs){toggleStar(+cs.dataset.coreStar);renderCore();return}
    const chain=e.target.closest("[data-chain]");if(chain){EVA.chain=EVA_FOLLOWUP_CHAINS[+chain.dataset.chain];EVA.chainIndex=0;renderFollowup();return}
    if(e.target.id==="evaChainNext"){const p=practice();p.followups=(p.followups||0)+1;savePractice(p);EVA.chainIndex=Math.min(EVA.chain.steps.length-1,EVA.chainIndex+1);renderFollowup();return}
    if(e.target.id==="evaChainRecord"){recorderQuestion({id:-204,cat:"長榮複試・追問",airlines:["長榮"],q_zh:EVA.chain.steps[EVA.chainIndex],q_en:"",a_zh:"",a_en:""},"zh",false);return}
    if(e.target.id==="evaPicPrep"){let n=20;const el=document.getElementById("evaPicClock");el.textContent=`準備 ${n} 秒`;const t=setInterval(()=>{n--;el.textContent=n?`準備 ${n} 秒`:"時間到，開始回答";if(!n)clearInterval(t)},1000);return}
    if(e.target.id==="evaPicRecord"){recorderQuestion({id:-205,cat:"長榮複試・Picture Challenge",airlines:["長榮"],q_zh:"",q_en:EVA.picture.scene,a_zh:"",a_en:"",tip:"What I see → What may be happening → What happens next"},"en",false);return}
    const cur=e.target.closest("[data-current-record]");if(cur){recorderQuestion({id:-206,cat:"長榮複試・本週時事",airlines:["長榮"],q_zh:EVA_CURRENT_TOPICS[+cur.dataset.currentRecord],q_en:"",a_zh:"",a_en:""},"zh",false);return}
    const ss=e.target.closest("[data-session-start]");if(ss){startSession(ss.dataset.sessionStart);return}
    if(e.target.id==="evaSessionNext"){EVA.session.i++;renderSession();return}
    if(e.target.id==="evaSessionDo"){doSessionStep();return}
    if(e.target.id==="evaMockSave"){saveMockTask();return}
  });

  window.addEventListener("eva-home",()=>{EVA.view="home";render();setViewContext("home");paintEvaCountdown()});
  document.addEventListener("click",e=>{
    if(e.target.closest('#nav button[data-t="stats"]')) setTimeout(paintStatsMini,0);
    if(e.target.closest("#evaStatsOpen")){document.querySelector('#nav button[data-t="eva"]').click();go("stats");}
  });
  window.renderEVARoute=view=>{
    const safe=Object.prototype.hasOwnProperty.call(viewNames,view)?view:"home";
    go(safe,false);
  };
  paintStatsMini();
  render();
  paintEvaCountdown();
})();
