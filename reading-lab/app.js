(function(){
  "use strict";
  const D=window.ReadingLabData,C=window.ReadingLabCore,DB=window.ReadingLabDB;
  const root=document.getElementById("readingLabRoot"),recorder=new LabRecorder();
  if(!root)return;
  const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const el=id=>root.querySelector(`#${id}`);
  const button=(action,label,extra="")=>`<button type="button" class="btn sec" data-lab-action="${action}" ${extra}>${label}</button>`;
  const link=(url,label)=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
  const options=(values,current)=>values.map((v,i)=>{const [value,label]=Array.isArray(v)?v:[v,v];return `<option value="${esc(value)}"${String(value)===String(current)?" selected":""}>${esc(label)}</option>`;}).join("");
  const uid=()=>crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const initial=()=>({config:{airline:"華航",difficulty:"初級",band:0,preview:15},words:Object.fromEntries(D.words.filter(w=>w.seed).map(w=>[w.id,{status:"pending",confirmed:false,attempts:0,updated:0}])),favorites:[],places:{},daily:{},draft:null});
  let state=initial(),sessions=[],initialized=false,opening,view="home",phase="setup",blob=null,elapsed=0,clock,deadline=0,started=0,notice="",wordIndex=0,revealed=false,attempted=false,reviewOnly=false,placeCategory="全部",placeIndex=0,placeRevealed=false,sampleMode="",starting=false,saveQueue=Promise.resolve();
  const config=()=>state.config;
  const currentQuestion=()=>D.questions.find(q=>q.id===state.draft?.questionId);
  function notify(message){notice=message;const node=el("labStatus");if(node)node.textContent=message;}
  function persist(){const snapshot=structuredClone(state);saveQueue=saveQueue.catch(()=>{}).then(()=>DB.put("meta","state",snapshot));return saveQueue;}
  const active=()=>recorder.active||phase==="recording"||phase==="preparing"||starting;
  function draft(){if(!state.draft)throw Error("請先載入一道題目。");return state.draft;}
  function markTask(key){const day=C.dayKey();const tasks={...(state.daily[day]?.tasks||{}),[key]:true};state.daily[day]={tasks,complete:["words","places","reading","review"].every(k=>tasks[k])};return persist();}
  function filteredQuestions(){return D.questions.filter(q=>q.airline===config().airline&&q.difficulty===config().difficulty&&q.band===Number(config().band));}
  function freshQuestion(q){
    if(active())throw Error("請先停止目前的錄音或倒數。");
    if(state.draft&&!state.draft.savedId&&(state.draft.transcript||blob)&&!confirm("載入新題會取代目前草稿。要繼續嗎？可先取消並儲存這次練習。"))return;
    state.draft={questionId:q.id,title:q.title,difficulty:q.difficulty,original:q.text,transcript:"",duration:0,errors:[],notes:"",analyzed:false,savedId:null};
    blob=null;elapsed=0;phase="setup";notice="題目已載入；準備時間開始前不顯示內文。";
    return DB.remove("audio","draft-reading").then(persist).then(render);
  }
  function shell(content){
    const tabs=[["home","今日 20 分鐘"],["exam","即席朗讀"],["words","單字解碼"],["places","地名訓練"],["history","紀錄與弱點"]];
    root.innerHTML=`<div class="card lab-heading"><p class="ci-eyebrow">ENGLISH READING LAB</p><h2>英文朗讀實驗室</h2><p class="section-note">為空服員即席英文朗讀設計 · 個人訓練，不是官方面試評分</p><div class="lab-nav" role="navigation" aria-label="朗讀實驗室導覽">${tabs.map(([id,label])=>`<button class="chip ${view===id?"on":""}" data-lab-action="view" data-view="${id}"${active()?" disabled":""}${view===id?' aria-current="page"':""}>${label}</button>`).join("")}</div><p id="labStatus" class="lab-status" role="status" aria-live="polite">${esc(notice)}</p></div>${content}`;
  }
  function home(){
    const today=state.daily[C.dayKey()]||{tasks:{}},tasks=[["words",5,"陌生長單字","words"],["places",3,"地名與專有名詞","places"],["reading",7,"全新新聞稿朗讀","exam"],["review",5,"錯誤回聽與修正","history"]];
    shell(`<div class="card"><h3>今天練 20 分鐘</h3><p>連續完成 ${C.streak(state.daily)} 天 · 今天 ${Object.values(today.tasks).filter(Boolean).length}/4 項</p><p class="sub">分鐘數是時間分配建議，不要求刷滿題數。完成一輪實際練習後即可勾選該項。</p><div class="lab-task-list">${tasks.map(([id,min,label,target])=>`<div><span class="lab-minute">${min} 分</span><b>${label}</b><span>${today.tasks[id]?"✓ 已完成":"待完成"}</span>${button("view","開始／繼續",`data-view="${target}"`)}</div>`).join("")}</div>${today.complete?'<p class="lab-success">今天四項訓練已完成。</p>':""}</div><div class="card"><h3>你的起始待確認清單</h3><p>已放入 Pikachu Jet、2025 Calendar、Marathon Starlight Night Run 的 24 個詞。它們來自你提供的辨識落差，尚未被認定為發音錯誤。</p>${button("review-words","複習不確定與待確認字詞")}</div>${weekly()}`);
  }
  function weekly(){
    const rows=C.trends(sessions),max=Math.max(1,...rows.map(x=>x.sessions));
    return `<div class="card"><h3>最近七日練習趨勢</h3><p class="sub">顯示訓練量與人工確認問題的數量；題目難度不同，不能據此直接判定發音進步或退步。</p><table class="lab-trend"><caption class="visually-hidden">七日練習次數、時間及人工確認問題</caption><thead><tr><th>日期</th><th>練習次數</th><th>朗讀時間</th><th>已確認問題</th></tr></thead><tbody>${rows.map(r=>`<tr><th>${r.day.slice(5)}</th><td><span class="lab-bar" style="width:${Math.round(r.sessions/max*70)}%"></span>${r.sessions}</td><td>${Math.round(r.seconds/60)} 分</td><td>${r.confirmed}</td></tr>`).join("")}</tbody></table></div>`;
  }
  function exam(){
    const q=currentQuestion(),d=state.draft,items=filteredQuestions();
    const busy=active()?" disabled":"";
    shell(`<div class="card"><h3>選擇本輪練習</h3><p class="sub">288 個模擬訓練版本：8 類主題 × 3 家航空 × 4 個自訂難度 × 3 種篇幅。版本共用主題素材，不代表 288 篇獨立新聞。</p><div class="lab-fields"><label>航空公司<select id="labAirline"${busy}>${options(D.airlines,config().airline)}</select></label><label>難度<select id="labDifficulty"${busy}>${options(D.levels,config().difficulty)}</select></label><label>篇幅<select id="labBand"${busy}>${options(D.bands.map(([a,b],i)=>[i,`${a}–${b} 字`]),config().band)}</select></label><label>預覽模式<select id="labPreview"${busy}>${options([[0,"立即朗讀"],[15,"15 秒準備"],[30,"30 秒準備"]],config().preview)}</select></label></div><label>指定題目<select id="labQuestion"${busy}>${options(items.map(x=>[x.id,`${x.topic} · ${x.words} 字`]),q?.id)}</select></label><div class="lab-actions">${button("choose","載入選定題目",busy)}${button("random","隨機抽題",busy)}</div></div>${d?`<div class="card"><h3>${esc(d.title)}</h3><p class="lab-badge">模擬稿 · 非官方新聞或面試題</p><p class="sub">${esc(q?.topic||"已保存原稿")} · ${esc(d.difficulty)} · ${C.tokens(d.original).length} 個字詞 · 建立日期 ${D.date}</p><p class="sub">${esc(q?.source||"保存時的題目原稿")} ${link(q?.sourceUrl||"https://github.com/xciv0904/fly-room-xciv","資料來源")}</p><div class="lab-countdown"><strong id="labTimer" role="timer" aria-label="練習計時">${phase==="preparing"?Math.max(0,Math.ceil((deadline-Date.now())/1000))+" 秒準備":elapsed+" 秒"}</strong><progress id="labPrepProgress" max="${Number(config().preview)||1}" value="0"${phase!=="preparing"?" hidden":""}>準備倒數</progress></div>${phase==="setup"?`<p>內文將在開始準備時顯示。</p>${button("prepare",Number(config().preview)?"開始準備倒數":"顯示原稿，立即朗讀")}`:`<div class="readblock en lab-original" id="labOriginal">${esc(d.original)}</div>`}<div class="lab-actions">${button("record","🔴 開始錄音",(phase==="setup"||active())?" disabled":"")}${button("manual-start","開始計時（不錄音）",(phase==="setup"||active())?" disabled":"")}${button("stop",phase==="preparing"?"取消倒數":"停止朗讀",active()&&!starting?"":" disabled")}${button("retry","重新練這一題",busy)}</div><label class="lab-check"><input id="labRecognition" type="checkbox"${busy}>選擇啟用瀏覽器語音辨識（可能將音訊送交瀏覽器的辨識服務；預設關閉）</label><p class="sub">錄音不會因停頓自動結束；請自行按停止。本站沒有上傳音檔的伺服器，也沒有發音評估 API。</p><div id="labPlayback"></div><label>匯入裝置錄音（上限 50 MB）<input id="labAudioFile" type="file" accept="audio/*,.webm,.m4a,.mp3,.wav,.ogg"${busy}></label><label>朗讀時間（秒，可更正匯入音檔的時間）<input id="labDuration" type="number" min="0" max="86400" value="${d.duration||0}"${busy}></label></div><div class="card"><h3>原稿與逐字稿比對</h3><p class="section-note">貼上外部辨識結果或自行聽寫。不會自動上傳匯入的音檔；沒有辨識服務仍可完成練習。</p><label>我的英文逐字稿<textarea id="labTranscript" rows="6" maxlength="20000"${active()?" readonly":""}>${esc(d.transcript)}</textarea></label><div class="lab-actions">${button("analyze","比對原稿與逐字稿",busy)}</div><p class="sub">文字相似度不是發音品質，也不是航空公司面試分數。疑似差異需回聽後由你確認。重新比對會重設本輪尚未儲存的差異確認。</p><div id="labComparison">${d.analyzed?comparison():""}</div><label>個人練習筆記<textarea id="labNotes" rows="3" maxlength="5000">${esc(d.notes)}</textarea></label>${button("save-session",d.savedId?"更新這次練習紀錄":"儲存這次練習",busy)}</div>`:'<div class="card"><p>先載入指定題目或隨機抽題。原稿與作答草稿會保留到重新整理之後。</p></div>'}`);
    if(blob&&el("labPlayback"))recorder.play(el("labPlayback"),blob);
  }
  function comparison(){
    const d=draft(),result=C.compare(d.original,d.transcript);
    const labels={replace:"替換詞",missing:"疑似遺漏",extra:"多餘詞"};
    return `<p class="lab-badge">文字相似度 ${result.similarity}% · 僅供原稿辨識比對</p><div class="lab-diff" aria-label="逐詞差異">${result.ops.map(op=>op.type==="equal"?`<span>${esc(op.original)}</span>`:`<span class="lab-diff-${op.type}"><b>${labels[op.type]}</b> ${esc(op.original||"∅")} → ${esc(op.heard||"∅")}${op.ending?"（疑似字尾差異）":op.proper?"（疑似專有名詞錯辨）":""}</span>`).join(" ")}</div><h4>回聽後確認實際問題</h4><p class="sub">未勾選的辨識落差不會算作你的發音錯誤。重音、流暢度、語調只接受人工標記。</p>${d.errors.map((e,i)=>`<div class="lab-error-row"><label class="lab-check"><input type="checkbox" data-lab-error="${i}" data-field="confirmed"${e.confirmed?" checked":""}>確認這是我的實際問題：${esc(e.original||"∅")} → ${esc(e.heard||"∅")}</label><label>分類<select data-lab-error="${i}" data-field="category">${options(Object.entries(C.categories),e.category)}</select></label><label>更正或回聽備註<input data-lab-error="${i}" data-field="note" value="${esc(e.note||"")}" maxlength="1000"></label></div>`).join("")}<details><summary>人工加入重音、流暢度、語調或其他問題</summary><div class="body"><label>單字／要練的片段<input id="labManualWord" maxlength="150"></label><label>分類<select id="labManualCategory">${options(Object.entries(C.categories),"stress")}</select></label><label>自己的觀察<input id="labManualNote" maxlength="1000"></label>${button("add-error","加入已確認問題")}</div></details>`;
  }
  async function prepare(){
    if(active())return;
    draft();phase=Number(config().preview)?"preparing":"ready";
    deadline=Date.now()+Number(config().preview)*1000;
    render();
    if(phase==="preparing")clock=setInterval(()=>{
      const left=Math.max(0,Math.ceil((deadline-Date.now())/1000));
      if(el("labTimer"))el("labTimer").textContent=`${left} 秒準備`;
      if(el("labPrepProgress"))el("labPrepProgress").value=Number(config().preview)-left;
      if(!left){clearInterval(clock);phase="ready";notify("準備完成，按開始錄音或不錄音計時。");render();}
    },200);
  }
  async function beginReading(withAudio){
    if(active())return;draft();
    if((state.draft.transcript||blob||state.draft.duration)&&!confirm("開始新一輪會清除目前草稿的逐字稿與差異確認；已存入歷史的紀錄不變。要繼續嗎？"))return;
    starting=true;
    try{
      if(withAudio){
        const recognition=el("labRecognition")?.checked;
        await recorder.start({recognition,onText:text=>{state.draft.transcript+=text;if(el("labTranscript"))el("labTranscript").value=state.draft.transcript;persist().catch(e=>notify(e.message));},onStatus:notify});
      }
      await DB.remove("audio","draft-reading");
      started=Date.now();elapsed=0;phase="recording";blob=null;state.draft.savedId=null;state.draft.duration=0;state.draft.transcript="";state.draft.errors=[];state.draft.analyzed=false;starting=false;
      await persist();
      notice=withAudio?"錄音中；停頓不會自動停止。":"計時中（未錄音）。完成後可貼上逐字稿。";render();
      clock=setInterval(()=>{elapsed=Math.round((Date.now()-started)/1000);if(el("labTimer"))el("labTimer").textContent=`${elapsed} 秒${withAudio?" · 錄音中":" · 計時中"}`;},250);
    }catch(error){if(recorder.active)await recorder.stop();starting=false;phase="ready";render();throw error;}
  }
  async function stopReading(){
    clearInterval(clock);
    if(phase==="preparing"){phase="ready";notify("倒數已取消；可以直接開始朗讀。");render();return;}
    if(phase!=="recording")return;
    phase="review";
    const recording=await recorder.stop();
    elapsed=recording?.duration??Math.round((Date.now()-started)/1000);
    draft().duration=elapsed;blob=recording?.blob||null;
    try{
      if(blob)await DB.put("audio","draft-reading",blob);
      await persist();notice="本輪已停止。請回聽、貼上或修正逐字稿，再比對原稿。";
    }finally{render();}
  }
  function wordPool(){return reviewOnly?D.words.filter(w=>["pending","unsure","retry"].includes(state.words[w.id]?.status)):D.words;}
  function words(){
    const pool=wordPool();wordIndex=Math.min(wordIndex,Math.max(0,pool.length-1));const w=pool[wordIndex];
    shell(`<div class="card"><h3>陌生長單字解碼</h3><p>先試讀，再揭曉；不確定和需要重練的詞會留在複習清單。</p><div class="lab-actions">${button("word-mode",reviewOnly?"顯示全部字庫":"只看待確認／需複習")}</div>${w?`<p class="sub">${wordIndex+1}/${pool.length} · 來源：${esc(w.source)} · ${state.words[w.id]?.status==="pending"?"辨識落差待確認，並非已確定發音錯誤":({mastered:"已掌握",unsure:"不確定",retry:"需要重練"}[state.words[w.id]?.status]||"尚未練習")}</p><div class="lab-word" lang="en">${esc(w.word)}</div><div class="lab-actions">${button("sample-record","🔴 錄下我的嘗試",'data-mode="word"')}${button("sample-stop","停止錄音",sampleMode==="word"?"":" disabled")}${button("word-attempt","我已先猜讀一次")}</div><div id="labSamplePlayback"></div>${revealed?`<div class="lab-answer"><b>${esc(w.ipa||"此地名未設定標準英語 IPA，請參考下方近似提示")}</b><p>${esc(w.syllables)}</p><p>${esc(w.zh)}</p><p class="sub">${esc(w.note)}</p>${link(w.url,"詞典／地名參考")}${button("say","🔊 合成音示範",`data-text="${esc(w.word)}"`)}<p class="sub">瀏覽器合成音不是官方標準錄音；請配合詞典核對。</p></div><div class="lab-actions">${[["mastered","已掌握"],["unsure","不確定"],["retry","需要重練"]].map(([status,label])=>button("word-grade",label,`data-grade="${status}"`)).join("")}</div>`:button("word-reveal","揭曉發音",attempted?"":" disabled")}<div class="lab-actions">${button("word-prev","上一字",wordIndex?"":" disabled")}${button("word-next","下一字",wordIndex<pool.length-1?"":" disabled")}</div>`:"<p>目前沒有待複習的詞，可以切回全部字庫繼續練習。</p>"}</div><div class="card"><h3>字尾規則練習</h3><p class="sub">規則是解碼線索，不能只靠拼字保證正確發音。</p><label>選擇字尾<select id="labRule">${options(D.rules.map((x,i)=>[i,x.suffix]),0)}</select></label><div id="labRuleBody">${ruleBody(D.rules[0])}</div></div><div class="card">${button("done-words","完成今天的單字訓練")}</div>`);
  }
  function ruleBody(r){return `<p>先想一個這種字尾的單字，試讀並猜重音。</p><details><summary>揭曉規則、示例與例外</summary><div class="body"><p>${esc(r.rule)}</p><p lang="en">${esc(r.example)}</p><p class="lab-caution">${esc(r.exception)}</p>${button("say","聽示例中的單字",`data-text="${esc(r.example.split(' →')[0].split(' /')[0])}"`)}${link("https://dictionary.cambridge.org/help/phonetics.html","音標核對說明")}</div></details>`;}
  let placeGroup="全部地區",placeSearch="";
  function placePool(){
    const query=placeSearch.trim().toLowerCase();
    return D.places.filter(p=>(placeCategory==="全部"||(placeCategory==="我的收藏"?state.favorites.includes(p.id):(p.categories||[p.category]).includes(placeCategory)))&&(placeGroup==="全部地區"||p.group===placeGroup)&&(!query||[p.en,p.zh,p.region,p.group,...(p.codes||[])].join(" ").toLowerCase().includes(query)));
  }
  function destinationTables(pool){
    const present=new Set(pool.map(p=>p.group||"其他地名與航空用語"));
    const groups=[...(D.ciDestinationGroups||[]).filter(g=>present.has(g)),...[...present].filter(g=>!(D.ciDestinationGroups||[]).includes(g))];
    return `<div class="card"><h3>地名與唸法速查（${pool.length} 項）</h3><p class="sub">點地名可切換上方自測卡；表內拼讀沿用你提供的資料，是記憶輔助，不是 IPA 或官方錄音。</p>${groups.map(group=>{const rows=pool.filter(p=>(p.group||"其他地名與航空用語")===group);return `<details class="lab-destination-group"${placeSearch||placeGroup!=="全部地區"?" open":""}><summary>${esc(group)} · ${rows.length} 項</summary><table class="lab-destination-table"><caption class="visually-hidden">${esc(group)}地名、代碼與近似拼讀</caption><thead><tr><th>地名／自測</th><th>代碼</th><th>近似拼讀</th></tr></thead><tbody>${rows.map(p=>`<tr><td><button type="button" class="lab-place-pick" data-lab-action="place-pick" data-id="${esc(p.id)}"><b>${esc(p.zh)}</b><span lang="en">${esc(p.en)}</span></button></td><td>${esc(p.codes?.join(" / ")||"—")}</td><td lang="en">${esc(p.hint)}</td></tr>`).join("")}</tbody></table></details>`;}).join("")||"<p>找不到符合條件的地名，請更換分類、地區或搜尋字詞。</p>"}</div>`;
  }
  function places(){
    const pool=placePool();placeIndex=Math.min(placeIndex,Math.max(0,pool.length-1));const p=pool[placeIndex];
    shell(`<div class="card"><h3>航空地名與專有名詞</h3><div class="lab-fields"><label>分類<select id="labPlaceCategory">${options(["全部","我的收藏",...new Set(D.places.flatMap(p=>p.categories||[p.category]))],placeCategory)}</select></label><label>地區<select id="labPlaceGroup">${options(["全部地區",...(D.ciDestinationGroups||[])],placeGroup)}</select></label></div><label>搜尋中文、英文或機場代碼<input id="labPlaceSearch" type="search" value="${esc(placeSearch)}" placeholder="例如：西雅圖、Phnom Penh、DPS"></label>${button("place-reset","清除搜尋與篩選")}<p class="sub">已收錄你提供的七張發音表共 ${D.ciDestinations?.length||0} 項。清單含主要航點、集團／季節／歷史航點與延伸城市，不代表目前全部為華航自營直飛。拼讀為英語記憶提示，非 IPA。</p>${p?`<p class="sub">${placeIndex+1}/${pool.length} · ${esc((p.categories||[p.category]).join("／"))} · ${esc(p.region)}</p><div class="lab-word" lang="en">${esc(p.en)}</div><p class="lab-place-codes">${esc(p.codes?.join(" / ")||"城市／名稱，未列個別機場代碼")}</p><p>${esc(p.zh)}${p.group?` · ${esc(p.group)}`:""}</p>${p.routeStatus?`<p class="lab-badge">華航清單身分：${esc(p.routeStatus)}</p>`:""}<p class="readblock en">${esc(p.example)}</p>${placeRevealed?`<div class="lab-answer"><b>${esc(p.hint)}</b>${p.note?`<p class="lab-caution">${esc(p.note)}</p>`:""}${p.hintSource?`<p class="sub">${esc(p.hintSource)}</p>`:""}${p.local?`<p>${esc(p.local)}</p>`:""}<p>${link(p.url,"名稱／航點來源")} · ${link(p.pronunciationUrl,"英文拼讀核對入口")}${p.networkUrl?` · ${link(p.networkUrl,"華航全球航點")}`:""}</p>${button("say","🔊 英文合成音示範",`data-text="${esc(p.en)}"`)}<p class="sub">示範由裝置語音引擎合成，不代表當地語言或官方標準讀法。</p></div>`:button("place-reveal","我已自測，揭曉讀法")}<div class="lab-actions">${button("place-favorite",state.favorites.includes(p.id)?"★ 取消收藏":"☆ 收藏")}${button("place-grade","記錄這次自測",placeRevealed?"":" disabled")}${button("place-prev","上一個",pool.length>1?"":" disabled")}${button("place-next","下一個",pool.length>1?"":" disabled")}${button("place-random","隨機自測",pool.length>1?"":" disabled")}</div><p class="sub">已自測 ${state.places[p.id]?.attempts||0} 次；讀法是否正確請配合來源自行核對。</p>`:"<p>這個分類目前沒有項目。可先到其他分類收藏。</p>"}</div>${destinationTables(pool)}<div class="card">${button("done-places","完成今天的地名訓練")}</div>`);
  }
  function historyView(){
    const confirmed=sessions.flatMap(s=>s.errors.filter(e=>e.confirmed).map(e=>({...e,session:s}))),ranking={};
    for(const e of confirmed){const key=e.original||e.heard||"未指定單字";ranking[key]=(ranking[key]||0)+1;}
    shell(`${weekly()}<div class="card"><h3>個人弱點與錯誤複習</h3><p class="sub">排行只計入你人工確認的問題。重音、流暢度及語調沒有自動音訊評分。</p><div class="lab-category-counts">${Object.entries(C.categories).map(([key,label])=>`<span>${label}：${confirmed.filter(e=>e.category===key).length}</span>`).join("")}</div><h4>常見待修正字詞</h4><div class="chips">${Object.entries(ranking).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([word,n])=>`<span class="chip">${esc(word)} · ${n} 次</span>`).join("")||"尚無人工確認問題。"}</div>${button("review-words","進入待確認／重練單字")}${confirmed.slice(-20).reverse().map(e=>`<div class="lab-review-item"><b>${esc(e.original||e.heard||"本輪朗讀")}</b> · ${esc(C.categories[e.category])}<p>${esc(e.note||"回聽原錄音並確認修正方式。")}</p>${button("review-session","回看原稿並修正",`data-id="${esc(e.session.id)}"`)}</div>`).join("")}</div><div class="card"><h3>我的朗讀紀錄（${sessions.length} 筆）</h3>${sessions.length?sessions.slice().sort((a,b)=>b.ts-a.ts).map(s=>`<details class="lab-history"><summary>${esc(s.title)} · ${C.dayKey(s.ts)} · ${s.duration} 秒</summary><div class="body"><p>${esc(s.difficulty)} · ${s.errors.filter(e=>e.confirmed).length} 個已確認問題${s.reviewed?" · 已回聽複習":""}</p><div class="lab-columns"><div><h4>保存時的原稿</h4><p class="readblock en">${esc(s.original)}</p></div><div><h4>我的逐字稿</h4><p class="readblock en">${esc(s.transcript||"未提供")}</p></div></div><p>個人筆記：${esc(s.notes||"尚無")}</p><div class="lab-actions">${button("play-session","載入錄音回聽",`data-id="${esc(s.id)}"`)}${button("review-session","更正／確認問題",`data-id="${esc(s.id)}"`)}${button("reviewed-session","記錄已回聽修正",`data-id="${esc(s.id)}"`)}${button("delete-audio","只刪除這筆錄音",`data-id="${esc(s.id)}"`)}${button("delete-session","刪除整筆紀錄",`data-id="${esc(s.id)}"`)}</div><div data-lab-audio="${esc(s.id)}"></div></div></details>`).join(""):"<p>還沒有儲存的練習。完成朗讀後按「儲存這次練習」。</p>"}</div><div class="card"><h3>備份與個人資料</h3><p class="sub">這是獨立的朗讀實驗室備份；原站備份功能與資料保持原樣。備份包含已儲存紀錄，尚未儲存的草稿不包含。</p><label class="lab-check"><input id="labExportAudio" type="checkbox">匯出時包含已儲存的朗讀錄音（檔案可能較大）</label><div class="lab-actions">${button("export","匯出實驗室紀錄")}</div><label>匯入實驗室備份（上限 100 MB）<input type="file" id="labImport" accept="application/json,.json"></label><p class="sub">匯入會合併紀錄，不取代目前作答草稿或原站資料。</p>${button("clear-lab","刪除實驗室全部個人資料")}</div>`);
  }
  function render(){
    recorder.release();({home,exam,words,places,history:historyView}[view]||home)();
    if(view==="words"){
      const w=wordPool()[wordIndex],holder=el("labSamplePlayback");
      if(w&&holder)DB.get("audio",`word-${w.id}`).then(b=>{if(b&&holder.isConnected)recorder.play(holder,b);}).catch(error=>notify(error.message));
    }
  }
  async function changeView(next){
    if(active())throw Error("請先停止目前的錄音或倒數，再切換實驗室功能。");
    if(!["home","exam","words","places","history"].includes(next))return;
    view=next;notice="";render();
  }
  async function sampleStart(mode){
    if(active())throw Error("請先停止目前錄音。");
    starting=true;try{await recorder.start();sampleMode=mode;attempted=true;notify("嘗試錄音中，請完成後按停止錄音。");const stop=root.querySelector('[data-lab-action="sample-stop"]');if(stop)stop.disabled=false;}finally{starting=false;}
  }
  async function sampleStop(){
    const result=await recorder.stop();sampleMode="";
    if(result){const w=wordPool()[wordIndex];if(w)await DB.put("audio",`word-${w.id}`,result.blob);const holder=el("labSamplePlayback");if(holder)recorder.play(holder,result.blob);}
    attempted=true;const reveal=root.querySelector('[data-lab-action="word-reveal"]');if(reveal)reveal.disabled=false;notify("嘗試已錄下，可回聽後揭曉讀法。");
  }
  async function saveSession(){
    if(active())throw Error("請先停止錄音。");const d=draft();
    if(!d.analyzed)throw Error("請先貼上逐字稿並完成比對，再儲存本輪紀錄。");
    const old=sessions.find(s=>s.id===d.savedId),id=d.savedId||uid();
    const record={id,ts:old?.ts||Date.now(),questionId:d.questionId,title:d.title,difficulty:d.difficulty,original:d.original,transcript:d.transcript,duration:d.duration,errors:structuredClone(d.errors),notes:d.notes,reviewed:old?.reviewed||false};
    await DB.saveSession(record,blob);sessions=sessions.filter(s=>s.id!==id);sessions.push(record);d.savedId=id;
    await markTask("reading");notify("練習與原稿已儲存到此裝置。辨識差異僅計入你勾選確認的項目。");render();
  }
  async function loadSession(id){
    const s=sessions.find(s=>s.id===id);if(!s)return;
    state.draft={...structuredClone(s),savedId:id,analyzed:true};blob=await DB.get("audio",id)||null;elapsed=s.duration;phase="review";view="exam";await persist();render();
  }
  async function exportBackup(){
    const audio=[];
    if(el("labExportAudio").checked){let total=0;for(const s of sessions){const b=await DB.get("audio",s.id);if(!b)continue;total+=b.size;if(total>60*1024*1024)throw Error("音檔合計超過 60 MB，請取消包含錄音，或先刪除不需要的音檔。");const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(b);});audio.push({id:s.id,data});}}
    const file=new Blob([JSON.stringify({kind:"fly-room-reading-lab",version:1,exportedAt:new Date().toISOString(),state:{words:state.words,places:state.places,favorites:state.favorites,daily:state.daily},sessions,audio})],{type:"application/json"});
    const a=document.createElement("a"),url=URL.createObjectURL(file);a.href=url;a.download=`fly-room-reading-lab-${C.dayKey()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify("已產生備份檔；請確認瀏覽器下載完成。");
  }
  async function importBackup(file){
    if(!file)return;if(file.size>100*1024*1024)throw Error("備份超過 100 MB。");
    const data=C.validateBackup(JSON.parse(await file.text())),existing=new Set(sessions.map(s=>s.id));
    data.sessions=data.sessions.filter(s=>!existing.has(s.id));
    const ids=new Set(data.sessions.map(s=>s.id)),audio=[];let size=0;
    if(!Array.isArray(data.audio)||data.audio.length>2000)throw Error("備份錄音格式不正確。");
    for(const item of data.audio){
      if(!ids.has(item.id))continue;
      if(typeof item.data!=="string"||!/^data:audio\/[a-z0-9.+-]+(?:;codecs=[a-z0-9.,-]+)?;base64,/i.test(item.data))throw Error("備份含有無效音檔。");
      const [prefix,encoded]=item.data.split(","),bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));size+=bytes.length;if(size>60*1024*1024)throw Error("匯入音檔超過 60 MB。");audio.push([item.id,new Blob([bytes],{type:prefix.slice(5).split(";")[0]})]);
    }
    await saveQueue;
    const next=C.mergeState(state,data.state);await DB.importData(data,next,audio);state=next;sessions=await DB.list("sessions");notice=`已合併 ${data.sessions.length} 筆紀錄，保留既有紀錄與目前草稿；重複紀錄略過。`;render();
  }
  async function act(action,node){
    if(action==="view")return changeView(node.dataset.view);
    if(action==="choose"||action==="random"){
      const items=filteredQuestions(),q=action==="choose"?items.find(q=>q.id===el("labQuestion").value):items[Math.floor(Math.random()*items.length)];
      if(q)return freshQuestion(q);throw Error("沒有符合條件的題目。");
    }
    if(action==="prepare")return prepare();
    if(action==="record")return beginReading(true);
    if(action==="manual-start")return beginReading(false);
    if(action==="stop")return stopReading();
    if(action==="retry")return freshQuestion(currentQuestion()||{id:draft().questionId,title:draft().title,difficulty:draft().difficulty,text:draft().original});
    if(action==="analyze"){
      const d=draft();if(!d.transcript.trim())throw Error("請先貼上逐字稿；沒有語音辨識服務時也可自行聽寫。");
      const result=C.compare(d.original,d.transcript);d.errors=result.ops.filter(x=>x.type!=="equal").map(x=>({...x,confirmed:false,note:""}));d.analyzed=true;await persist();render();return;
    }
    if(action==="add-error"){
      const word=el("labManualWord").value.trim(),note=el("labManualNote").value.trim();if(!word&&!note)throw Error("請填入要練的字詞或回聽觀察。");
      draft().errors.push({original:word,heard:"",category:el("labManualCategory").value,confirmed:true,note});await persist();render();return;
    }
    if(action==="save-session")return saveSession();
    if(action==="say"){
      if(!window.speechSynthesis)throw Error("此瀏覽器沒有語音合成功能，請開啟詞典參考來源聆聽。");
      speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(node.dataset.text);utterance.lang="en-US";utterance.rate=.8;utterance.onerror=()=>notify("裝置無法播放合成音，請開啟詞典參考來源聆聽。");speechSynthesis.speak(utterance);return;
    }
    if(action==="review-words"){reviewOnly=true;wordIndex=0;revealed=false;attempted=false;return changeView("words");}
    if(action==="word-mode"){reviewOnly=!reviewOnly;wordIndex=0;revealed=false;attempted=false;render();return;}
    if(action==="word-attempt"){attempted=true;render();return;}
    if(action==="word-reveal"){if(!attempted)throw Error("請先自行猜讀一次。");revealed=true;render();return;}
    if(action==="word-next"||action==="word-prev"){wordIndex+=action==="word-next"?1:-1;revealed=false;attempted=false;render();return;}
    if(action==="word-grade"){
      if(!revealed)throw Error("請先試讀並揭曉發音。");const w=wordPool()[wordIndex],old=state.words[w.id];state.words[w.id]={status:node.dataset.grade,confirmed:old?.confirmed||false,attempts:(old?.attempts||0)+1,updated:Date.now()};await persist();revealed=false;attempted=false;render();notify("自評已儲存；不確定與需要重練的字會留在複習清單。");return;
    }
    if(action==="sample-record")return sampleStart(node.dataset.mode);
    if(action==="sample-stop")return sampleStop();
    if(action==="place-reveal"){placeRevealed=true;render();return;}
    if(action==="place-reset"){placeCategory="全部";placeGroup="全部地區";placeSearch="";placeIndex=0;placeRevealed=false;render();return;}
    if(action==="place-favorite"){
      const p=placePool()[placeIndex];state.favorites=state.favorites.includes(p.id)?state.favorites.filter(id=>id!==p.id):[...state.favorites,p.id];await persist();render();return;
    }
    if(action==="place-grade"){
      const p=placePool()[placeIndex];state.places[p.id]={attempts:(state.places[p.id]?.attempts||0)+1,updated:Date.now()};await persist();render();notify("自測次數已儲存。");return;
    }
    if(["place-prev","place-next","place-random","place-pick"].includes(action)){
      const pool=placePool();if(!pool.length)return;
      placeIndex=action==="place-pick"?pool.findIndex(p=>p.id===node.dataset.id):action==="place-random"?Math.floor(Math.random()*pool.length):(placeIndex+(action==="place-prev"?-1:1)+pool.length)%pool.length;
      placeIndex=Math.max(0,placeIndex);placeRevealed=false;render();root.querySelector(".lab-word")?.scrollIntoView({block:"center",behavior:"smooth"});return;
    }
    if(action==="done-words"){
      if(!Object.values(state.words).some(p=>p.attempts>0&&C.dayKey(p.updated)===C.dayKey()))throw Error("請先完成一字的試讀、揭曉與自評，再勾選今日訓練。");await markTask("words");return changeView("home");
    }
    if(action==="done-places"){
      if(!Object.values(state.places).some(p=>C.dayKey(p.updated)===C.dayKey()))throw Error("請先完成一個地名的自測並記錄。");await markTask("places");return changeView("home");
    }
    if(action==="review-session")return loadSession(node.dataset.id);
    if(action==="play-session"){
      const b=await DB.get("audio",node.dataset.id);if(!b)throw Error("這筆紀錄沒有錄音檔，或錄音已刪除；仍可查看原稿及逐字稿。");recorder.play(root.querySelector(`[data-lab-audio="${CSS.escape(node.dataset.id)}"]`),b);return;
    }
    if(action==="reviewed-session"){
      const s=sessions.find(s=>s.id===node.dataset.id);s.reviewed=true;await DB.put("sessions",s.id,s);await markTask("review");notice="已記錄本次回聽修正，今日複習完成。";render();return;
    }
    if(action==="delete-audio"){
      if(!confirm("只刪除這筆錄音？刪除後無法還原，原稿與筆記會保留。"))return;await DB.remove("audio",node.dataset.id);if(state.draft?.savedId===node.dataset.id){blob=null;await DB.remove("audio","draft-reading");}recorder.release();notify("已刪除此筆錄音，原稿及逐字稿仍保留。");return;
    }
    if(action==="delete-session"){
      if(!confirm("刪除這筆紀錄與錄音？此動作無法還原。"))return;await DB.removeSession(node.dataset.id);sessions=sessions.filter(s=>s.id!==node.dataset.id);if(state.draft?.savedId===node.dataset.id){state.draft=null;blob=null;phase="setup";await DB.remove("audio","draft-reading");await persist();}render();return;
    }
    if(action==="export")return exportBackup();
    if(action==="clear-lab"){
      if(!confirm("刪除朗讀實驗室的全部紀錄、錄音與設定？原網站資料不受影響。此動作無法還原，請先匯出備份。"))return;
      await saveQueue.catch(()=>{});await DB.clear();recorder.release();state=initial();sessions=[];blob=null;phase="setup";view="home";notice="實驗室個人資料已刪除；起始待確認清單已重設。";await persist();render();return;
    }
  }
  root.addEventListener("click",async event=>{
    const node=event.target.closest("[data-lab-action]");if(!node||node.disabled)return;
    if(starting){notify("正在取得麥克風權限，請先完成或拒絕權限要求。");return;}
    if(sampleMode&&!["sample-stop"].includes(node.dataset.labAction)){notify("請先停止單字錄音。");return;}
    node.disabled=true;try{await act(node.dataset.labAction,node);}catch(error){notify(error.message||"操作未完成，請重試。");}finally{if(node.isConnected)node.disabled=false;}
  });
  root.addEventListener("input",event=>{
    const node=event.target;
    if(node.id==="labPlaceSearch"){
      const caret=node.selectionStart;placeSearch=node.value;placeIndex=0;placeRevealed=false;render();el("labPlaceSearch").focus({preventScroll:true});el("labPlaceSearch").setSelectionRange(caret,caret);return;
    }
    if(node.id==="labTranscript"){draft().transcript=node.value;draft().analyzed=false;draft().errors=[];if(el("labComparison"))el("labComparison").replaceChildren();}
    else if(node.id==="labNotes")draft().notes=node.value;
    else if(node.dataset.labError!==undefined){const e=draft().errors[Number(node.dataset.labError)];e[node.dataset.field]=node.type==="checkbox"?node.checked:node.value;}
    else return;
    persist().catch(error=>notify(error.message));
  });
  root.addEventListener("change",async event=>{
    const node=event.target;
    try{
      const fields={labAirline:"airline",labDifficulty:"difficulty",labBand:"band",labPreview:"preview"};
      if(fields[node.id]){state.config[fields[node.id]]=["labBand","labPreview"].includes(node.id)?Number(node.value):node.value;await persist();render();}
      if(node.id==="labRule")el("labRuleBody").innerHTML=ruleBody(D.rules[Number(node.value)]);
      if(node.id==="labPlaceCategory"){placeCategory=node.value;placeIndex=0;placeRevealed=false;render();}
      if(node.id==="labPlaceGroup"){placeGroup=node.value;placeIndex=0;placeRevealed=false;render();}
      if(node.id==="labDuration"){const value=Number(node.value);if(!Number.isFinite(value)||value<0||value>86400)throw Error("秒數需介於 0 到 86400。");draft().duration=value;await persist();}
      if(node.id==="labImport")await importBackup(node.files[0]);
      if(node.id==="labAudioFile"){
        const file=node.files[0];if(!file)return;if(file.size>50*1024*1024)throw Error("音檔超過 50 MB。");
        if(!file.type.startsWith("audio/")&&!/\.(mp3|wav|m4a|webm|ogg)$/i.test(file.name))throw Error("請選擇支援的錄音檔。");
        blob=file;draft().savedId=null;phase="review";await DB.put("audio","draft-reading",blob);await persist();render();notify("已匯入音檔，可本機回聽；請填入朗讀時間與逐字稿。");
      }
    }catch(error){notify(error.message||"檔案讀取失敗。");}
  });
  async function open(){
    if(initialized){render();return;}
    if(opening)return opening;
    opening=(async()=>{
      try{
        const saved=await DB.get("meta","state");if(saved)state={...initial(),...saved};
        sessions=await DB.list("sessions");blob=await DB.get("audio","draft-reading")||null;
        if(state.draft){phase="review";elapsed=state.draft.duration||0;view="exam";if(!blob&&state.draft.savedId)blob=await DB.get("audio",state.draft.savedId)||null;}
        initialized=true;await persist();render();
      }catch(error){notice=error.message;render();}
    })();await opening;opening=null;
  }
  window.addEventListener("app:routechange",event=>{
    if(event.detail.route!=="readingLab"){
      if(starting)recorder.cancelPending();
      if(sampleMode)sampleStop().catch(error=>notify(error.message));
      else if(phase==="recording"||phase==="preparing")stopReading().catch(error=>notify(error.message));
      recorder.release();if(window.speechSynthesis)speechSynthesis.cancel();
    }
  });
  window.addEventListener("pagehide",()=>{clearInterval(clock);recorder.cancelPending();recorder.stop();recorder.release();});
  window.ReadingLab={open};
})();
