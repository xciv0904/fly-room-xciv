(function(root){
  'use strict';
  const C=root.PrepCore,host=document.getElementById('ciApp');
    if(!C||!host||typeof store==='undefined')return;
  const KEY='prepV2',esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const names={10:'低能量模式',35:'正常練習模式',60:'集中練習模式',monthly:'每月英文自我測驗'};
  const problems={start:'不知道如何開始',sentence:'英文組句困難',grammar:'文法不自然',vocabulary:'單字想不起來',focus:'回答沒有重點',incomplete:'內容不完整',length:'回答太冗長',none:'沒有明顯問題'};
  const labels={home:'今天要練什麼？',session:'練習中',plan:'我的備考計畫',week:'本週進度',audit:'生活與學習審核',progress:'我的進步',history:'練習紀錄',data:'資料與設定'};
  let state,view='home',week=C.weekKey(),month=C.monthKey(),message='',storageIssue='',blockedStorage=false,thinkUntil=0;
  let recorder=null,recordPending=false,recordingKey='',audio=new Map();
  function read(){
    try{const raw=localStorage.getItem('fa_'+KEY);state=raw===null?C.emptyState():C.validateState(JSON.parse(raw));blockedStorage=false;storageIssue='';}
    catch{state=C.emptyState();blockedStorage=true;storageIssue='這台裝置的備考資料格式無法讀取，原始資料已保留。請先匯出原始資料，再匯入有效備份。';}
    if(state.active){state.active.runningSince=null;state.active.paused=true;state.active.interrupted=true;}
  }
  read();
  function save(){if(blockedStorage)return false;const ok=store.set(KEY,state);if(!ok)storageIssue='本機空間不足或無法寫入。請先匯出備份；目前畫面仍保留資料。';else if(typeof checkDataBanner==='function')checkDataBanner();return ok;}
  const hash=s=>{let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return (n>>>0).toString(16);};
  function pool({all=false}={}){
    if(typeof DATA==='undefined'||!DATA.length||!root.CIFinalPrep?.registered)return [];
    const ci=root.CIFinalPrep.registered,seen=new Set(),legacySeen=new Set(),out=[];
    const add=(d,isCI=false)=>{
      const canonical=`${d.q_zh||''}\n${d.q_en||''}`;
      if(seen.has(canonical)||!isCI&&legacySeen.has(d.id))return;
      const a=isCI?d:(typeof ansFor==='function'?ansFor(d,state.settings.company==='all'?null:state.settings.company||'華航'):d);
      const text=[d.cat,d.group,d.trainingType,...(d.tags||[]),d.q_zh,d.q_en].join(' ');
      let type=/how.to|如何煮|怎麼煮/i.test(text)?'How to 說明程序':/生活|韓劇|電影|興趣|休閒|favorite|hobby/i.test(text)?'生活經驗':/客訴|服務|旅客|passenger|guest/i.test(text)?'服務與航空情境':/團隊|同事|team|colleague/i.test(text)?'團隊合作':/危機|突發|緊急|安全|emergency|safety/i.test(text)?'危機處理':/新聞|品牌|航空業|公司|why.*airline/i.test(text)?'公司與價值觀':'個人經驗與即席反應';
      const langs=[];if(d.q_zh&&a.a_zh)langs.push('zh');if(d.q_en&&a.a_en&&!/台語|Taiwanese/i.test(canonical))langs.push('en');if(a.a_ko&&(d.q_ko||d.key==='intro'||/自我介紹|介紹你自己|自介/.test(d.q_zh||'')))langs.push('ko');if(!langs.length)return;
      const companies=isCI?['華航']:(d.airlines||[d.airline||d.air||'通用']);
      if(!all&&state.settings.company&&state.settings.company!=='all'&&!companies.includes(state.settings.company)&&!companies.includes('通用'))return;
      seen.add(canonical);legacySeen.add(d.id);
      const kind=isCI?d.kind:'legacy';
      out.push({id:isCI?'ci:'+d.key:'bank:'+hash(canonical),legacyId:d.id,key:d.key||'',label:d.q_zh||d.q_en,languages:langs,type,company:companies.join('／'),stage:d.interviewRecord?'空服員複試':'面試練習',difficulty:d.difficulty||'未分級',source:kind==='asked'?'actual':kind==='peer-asked'?'peer':'practice',sourceLabel:kind==='asked'?'本人實際面試題':kind==='peer-asked'?'同組考生題目，非本人作答':isCI?'延伸練習擬題':'既有題庫練習（未確認實問）',tags:d.tags||d.interviewRecord?.tags||[d.cat||d.group||type],q_zh:d.q_zh,q_en:d.q_en,q_ko:d.q_ko||'한국어로 자기소개를 해 주세요.',answers:{zh:a.a_zh||d.a_zh,en:a.a_en||d.a_en,ko:a.a_ko||d.a_ko},tip:d.tip||d.core||'',record:d.interviewRecord||null,raw:d});
    };
    ci.forEach(d=>add(d,true));DATA.forEach(d=>add(d));return out;
  }
  const question=id=>pool({all:true}).find(q=>q.id===id);
  function nav(){return `<nav class="prep-nav" aria-label="備考系統">${['home','plan','week','audit','progress','history','data'].map(k=>`<button class="btn ${view===k?'':'ghost'}" data-prep-view="${k}" ${view===k?'aria-current="page"':''}>${labels[k]}</button>`).join('')}</nav>`;}
  const modes=()=>`<div class="prep-modes">${[10,35,60].map(m=>`<button class="prep-mode" data-prep-action="start" data-mode="${m}"><strong>${m}<small> 分鐘</small></strong><b>${names[m]}</b><span>${m===10?'一道英文，修正後就休息':m===35?'弱點複習、新題與重答':'英文即席與混合模擬，可選'}</span></button>`).join('')}</div>`;
  function home(){
    const p=C.ensurePlan(state,C.weekKey()),today=p.days.find(d=>d.date===C.dateKey()),s=C.weeklySummary(state,C.weekKey()),review=s.nextReviews?.[0],m=today?.mode??35;
    return `<div class="card prep-today"><span class="ci-phase-label">YOUR PACE · 保留每天的休息時間</span><h2>今天要練什麼？</h2><p>${m?`今天的參考安排是 <b>${m} 分鐘${names[m]}</b>。可以依精神與班表隨時更改。`:'今天安排休息。沒有需要補回的任務，想練習時再選一種模式。'}</p>${state.active?`<div class="tip">有一場已保存的練習，第 ${state.active.index+1} 題。<button class="btn" data-prep-action="resume">回到練習</button><button class="btn ghost" data-prep-action="finish">結束並保存這場</button></div>`:''}${m?`<button class="btn" data-prep-action="start" data-mode="${m}">開始今天的建議練習</button>`:''}${modes()}<label>35／60 分鐘的多語練習<select data-prep-language>${['mixed','en','zh','ko'].map(l=>`<option value="${l}" ${(state.settings.practiceLanguage||'mixed')===l?'selected':''}>${{mixed:'中英混合（英文優先）',en:'English',zh:'中文',ko:'한국어（依現有題庫）'}[l]}</option>`).join('')}</select></label><div class="chips"><button class="btn ghost" data-prep-action="rest">今天休息</button><button class="btn ghost" data-prep-action="ten">改成 10 分鐘</button><button class="btn ghost" data-prep-view="plan">修改本週計畫</button></div><p class="sub">時間都是建議配置，可以暫停、跳題或提前結束。先把意思說清楚，再修正一句。</p></div><div class="card"><h3>本週目前進度</h3><p>${Number(s.minutes.toFixed(1))} / ${esc(s.goal)} 分鐘 · ${esc(s.status)}</p><progress max="100" value="${Math.min(100,s.percent||0)}" aria-label="本週目標完成比例"></progress><p class="sub">${esc(s.summary)}</p><button class="btn ghost" data-prep-view="week">查看本週紀錄</button></div><div class="card"><h3>最近一次需要複習的題目</h3>${review?`<p>${esc(question(review.questionId)?.label||review.questionId)}</p><p class="sub">下次複習：${esc(review.reviewDate)}</p><button class="btn sec" data-prep-action="retry" data-id="${esc(review.questionId)}">再練一次</button>`:'<p class="sub">尚無足夠資料。完成一題自評後，就能安排個人複習。</p>'}</div><div class="card"><h3>原有面試準備與工具</h3><div class="chips"><button class="btn sec" data-ci-route="initial">華航初試準備</button><button class="btn sec" data-ci-route="final">華航複試題庫與真實紀錄</button><button class="btn ghost" data-ci-route="broadcast">華航廣播詞</button><button class="btn ghost" data-go="more">其他公司、題庫與工具</button></div></div>`;
  }
  function phases(s){return s.mode==='monthly'?[['test','五題英文自我測驗','以自己的感受記錄四項能力']]:s.mode===10?[['english','英文即席回答 · 建議 5 分鐘','一道英文，思考可略過，建議回答 30–45 秒'],['retry','修正與重答 · 建議 5 分鐘','比對架構，修正一句，再說一次']]:s.mode===35?[['review','弱點複習 · 建議 5 分鐘','先試著回答需要複習的題目'],['english','兩道新題 · 建議 10 分鐘','簡短回答，再補一個具體做法或例子'],['compare','比對與分析 · 建議 10 分鐘','看擬答與架構，找一個最想修正的地方'],['retry','重新作答 · 建議 10 分鐘','重新說一次，完成自評與保存']]:[['review','弱點複習 · 建議 10 分鐘','用短句重新回答'],['english','英文即席 · 建議 15 分鐘','約 3–4 題，完整表達就好'],['mock','混合模擬 · 建議 20 分鐘','約 4–5 題，可選作答語言'],['retry','回聽與重答 · 建議 10 分鐘','從本場選一題修正，無錄音也能口說'],['save','自評與保存 · 建議 5 分鐘','檢視本場紀錄，今天到這裡也可以']];}
  const options=(values,selected)=>`<option value="">請選擇</option>${values.map(([v,t])=>`<option value="${v}" ${v===selected?'selected':''}>${t}</option>`).join('')}`;
  function structure(q){return /How to/.test(q.type)?'First → Then → After that → Finally：交代每個必要步驟。':/生活/.test(q.type)?'直接回答 → 一個具體細節 → 為什麼對你重要。':/情境|危機/.test(q.type)?'先確認狀況 → 處理優先順序 → 溝通與後續確認。':'先說重點 → 情況與具體行動 → 結果或學到什麼。';}
  function reference(q,e){
    const lang=state.active.referenceLanguage||e.language,raw=q.record;
    let original=raw?.original?.raw||'';
    return `<div class="prep-reference"><div class="chips"><label>參考語言 <select data-prep-reference>${['zh','en','ko'].filter(l=>q.answers[l]).map(l=>`<option value="${l}" ${l===lang?'selected':''}>${{zh:'中文',en:'English',ko:'한국어'}[l]}</option>`).join('')}</select></label>${typeof sayBtn==='function'?sayBtn(q.answers[lang]||q.answers[e.language]||'',{zh:'zh-TW',en:'en-US',ko:'ko-KR'}[lang],'🔊 聽參考擬答'):''}</div><div class="ansbox" lang="${lang==='zh'?'zh-Hant':lang}">${esc(q.answers[lang]||q.answers[e.language]||'此題尚無這個語言的擬答。')}</div><p class="tip"><b>回答架構：</b>${esc(structure(q))}</p>${/How to/.test(q.type)?'<p lang="en">I think it’s pretty simple. First, you need to… Then, you can… After that, just… Finally, … and you’re done!</p>':''}${q.tip?`<p class="sub">${esc(q.tip)}</p>`:''}${original?`<details><summary>本人原始回答（完整保留）</summary><p class="ansbox">${esc(original)}</p>${raw.original.note?`<p class="sub">${esc(raw.original.note)}</p>`:''}</details>`:''}${q.key?`<button class="btn ghost" data-prep-action="source" data-key="${esc(q.key)}">查看原始紀錄與完整分析</button>`:''}</div>`;
  }
  function assessment(s,e){
    const a=s.drafts?.[e.questionId]||s.assessments[e.questionId]?.selfAssessment||{},ps=a.problems||[];
    return `<form data-prep-form="assessment" class="prep-assessment"><h3>快速自我評估</h3><p class="sub">約 30–60 秒，自評只反映你的感受。系統不判斷發音、文法或流暢度。</p><div class="prep-fields"><label>開始回答速度<select name="startDelay" required>${options([['within5','5 秒內'],['5to10','5–10 秒'],['over10','超過 10 秒']],a.startDelay)}</select></label><label>回答完整度<select name="completeness" required>${options([['full','完整'],['partial','部分完整'],['incomplete','不完整']],a.completeness)}</select></label><label>流暢度<select name="fluency" required>${options([['smooth','流暢'],['occasional','偶爾停頓'],['frequent','頻繁卡住']],a.fluency)}</select></label></div><fieldset><legend>主要問題（可複選）</legend><div class="prep-checks">${Object.entries(problems).map(([k,v])=>`<label><input type="checkbox" name="problems" value="${k}" ${ps.includes(k)?'checked':''}>${v}</label>`).join('')}</div></fieldset>${s.mode==='monthly'?`<fieldset><legend>每月能力自評（本題）</legend><label><input type="checkbox" name="naturalEnding" ${a.naturalEnding?'checked':''}>能自然結束回答</label><label><input type="checkbox" name="clearMeaning" ${a.clearMeaning?'checked':''}>能清楚表達意思</label></fieldset>`:''}<label>備註或這次想改善的一句話（可跳過）<textarea name="notes" rows="2" maxlength="2000">${esc(a.notes||'')}</textarea></label><button class="btn" type="submit">儲存這題自評</button><span class="sub"> ${s.assessments[e.questionId]?'已保存；重答後可再更新。':''}</span></form>`;
  }
  function session(){
    const s=state.active;if(!s)return '<div class="card"><h2>目前沒有進行中的練習</h2>'+modes()+'</div>';
    const p=phases(s),e=s.entries[s.index],q=e&&question(e.questionId),phase=p[s.phase||0]||p[0];
    if(!q)return `<div class="card"><p>這道舊題目目前不在題庫中，原紀錄已保留。可以跳過或結束保存。</p><button class="btn" data-prep-action="skip">跳過這題</button><button class="btn ghost" data-prep-action="finish">提前結束並保存</button></div>`;
    const show=s.answerVisible||['compare','retry'].includes(phase[0]);
    return `<div class="card prep-session"><div class="prep-session-top"><div><span class="ci-phase-label">${esc(names[s.mode])} · 第 ${s.index+1} / ${s.entries.length} 題</span><h2>${esc(phase[1])}</h2></div><b id="prepClock" aria-label="實際練習時間">${clock(s)}</b></div><p class="sub">${esc(phase[2])}。不必等計時結束。</p><div class="prep-stages">${p.map((x,i)=>`<button class="btn ${i===(s.phase||0)?'':'ghost'}" data-prep-action="phase" data-phase="${i}" ${i===(s.phase||0)?'aria-current="step"':''}>${i+1}. ${esc(x[1].split(' · ')[0])}</button>`).join('')}</div><div class="chips"><button class="btn sec" data-prep-action="pause">${s.paused?'繼續練習':'暫停'}</button><button class="btn ghost" data-prep-action="finish">提前結束並保存</button><label>切換模式<select data-prep-mode><option value="">選擇模式</option>${[10,35,60].filter(m=>m!==s.mode).map(m=>`<option value="${m}">${m} 分鐘</option>`).join('')}</select></label>${s.mode===60?`<label>模擬作答語言<select data-prep-mock-language>${['mixed','zh','en','ko'].map(l=>`<option value="${l}" ${s.mockLanguage===l?'selected':''}>${{mixed:'中英混合',zh:'中文',en:'English',ko:'한국어'}[l]}</option>`).join('')}</select></label>`:''}</div>${s.paused?'<p class="tip" role="status">已暫停，休息時間不會計入練習。按「繼續練習」即可接續。</p>':''}<p><span class="pill">${esc(q.sourceLabel)}</span> <span class="pill">${esc(q.company)}</span> <span class="pill">${esc(q.type)}</span> <span class="pill">${esc(e.language.toUpperCase())}</span></p><h3 class="qtext" lang="${e.language==='zh'?'zh-Hant':e.language}">${esc(q['q_'+e.language]||q.label)}</h3><p class="sub">排題原因：${esc(e.reason)} · 階段：${esc(q.stage)} · 難度：${esc(q.difficulty)}</p><div class="chips">${typeof sayBtn==='function'?sayBtn(q['q_'+e.language]||q.label,{en:'en-US',zh:'zh-TW',ko:'ko-KR'}[e.language],'🔊 聽題目'):''}<button class="btn ghost" data-prep-action="think">5 秒思考（可略過）</button><button class="btn ghost" data-prep-action="think-skip">略過思考</button><span id="prepThink" role="status"></span><button class="btn ghost" data-prep-action="star" data-id="${esc(q.id)}">${typeof stars!=='undefined'&&stars.includes(q.legacyId)?'★ 已收藏':'☆ 收藏'}</button></div><p class="sub">建議回答 30–45 秒；How to 題可練 15–30 秒。直接口說也能完成。</p><div class="chips"><button class="btn sec" data-prep-action="record" ${recordPending?'disabled':''}>${recorder?.active?'停止錄音':'開始錄音／重錄'}</button><button class="btn ghost" data-prep-action="retry-current">再回答一次</button><button class="btn ghost" data-prep-action="reveal">${show?'隱藏參考答案':'展開參考答案'}</button></div><p class="sub" id="prepMicStatus">錄音僅在本場暫存，可回聽或下載；結束本場或重新整理後會移除，請先下載需要的錄音。</p><div id="prepAudio"></div>${show?reference(q,e):''}${assessment(s,e)}<div class="prep-session-bottom"><button class="btn ghost" data-prep-action="swap">換一題</button><button class="btn ghost" data-prep-action="skip">跳過並換下一題</button><button class="btn" data-prep-action="next">${s.index<s.entries.length-1?'下一題':'完成作答，進入修正'}</button><button class="btn sec" data-prep-action="phase-next">下一階段</button><button class="btn" data-prep-action="complete">完成並保存本場</button></div><details><summary>選擇本場題目重答（不新增重複題）</summary><div class="chips">${s.entries.map((x,i)=>`<button class="btn ghost" data-prep-action="index" data-index="${i}">${i+1}. ${esc(question(x.questionId)?.label||x.questionId)} · ${x.status==='completed'?'已自評':x.status==='skipped'?'已跳過':'未完成'}</button>`).join('')}</div></details></div>`;
  }
  function clock(s){const ms=s.elapsedMs+(s.runningSince!==null?Math.max(0,Date.now()-s.runningSince):0),sec=Math.floor(ms/1000);return `${s.paused?'暫停 · ':''}${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;}
  function render(){
    if(!host)return;
    document.getElementById('ciSprintPlanWrap')?.classList.add('hidden');document.getElementById('ciSprintPanel')?.classList.remove('ci-final-active');document.getElementById('ciSprintPanel')?.classList.add('prep-active');
    root.setUXContext?.('備考練習 › '+(labels[view]||labels.home),true);
    const ctx={state,core:C,pool:pool({all:true}),esc,week,month};
    host.innerHTML=`<div class="prep-root">${nav()}${storageIssue?`<div class="warnbox" role="alert">${esc(storageIssue)}${blockedStorage?'<button class="btn ghost" data-prep-action="export-raw">匯出無法讀取的原始資料</button>':''}</div>`:''}<p id="prepMessage" class="prep-message" role="status">${esc(message)}</p>${view==='home'?home():view==='session'?session():root.PrepPages?.render(view,ctx)||home()}<p class="sub prep-local">資料僅保存在此瀏覽器，不會自動跨裝置同步。換裝置前請匯出 JSON 備份。</p></div>`;
    mountAudio();
  }
  function open(v='home',sync=true){
    view=labels[v]?v:'home';if(view!=='session'&&state.active&&!state.active.paused){C.pause(state.active);stopAudio();save();}
    if(sync){root.showTab?.('eva',{syncRoute:false,preserveSubroute:true});root.setAppRoute?.('ci/prep'+(view==='home'?'':'/'+view));}
    render();
  }
  async function stopAudio(){
    recorder?.cancelPending();recordPending=false;
    if(recorder?.active){const key=recordingKey,result=await recorder.stop();if(result)storeAudio(key,result);}
  }
  function storeAudio(key,result){if(!state.active||!key.startsWith(state.active.id+':'))return;const old=audio.get(key);if(old)URL.revokeObjectURL(old.url);audio.set(key,{...result,url:URL.createObjectURL(result.blob)});mountAudio();}
  function mountAudio(){const el=document.getElementById('prepAudio'),s=state.active,key=s&&`${s.id}:${s.entries[s.index]?.questionId}`,a=audio.get(key);if(el&&a)el.innerHTML=`<audio controls src="${a.url}" aria-label="本題錄音回聽"></audio><a class="btn ghost" download="面試練習-${esc(C.dateKey())}.${/mp4/.test(a.blob.type)?'m4a':'webm'}" href="${a.url}">下載本題錄音 · ${a.duration} 秒</a>`;}
  function start(mode,entries){
    if(blockedStorage){message='請先備份並修復本機資料，再開始保存新的練習。';render();return;}
    if(!pool().length){message='題庫仍在載入，請稍後再按開始。';render();return;}
    if(state.active)finish('early',false);
    const selected=entries||C.schedule(pool(),state,{mode,language:state.settings.practiceLanguage||'mixed',now:Date.now()});
    if(!selected.length){message='這個篩選條件目前沒有題目。可到資料與設定改為所有航空公司。';render();return;}
    state.active=C.createSession(selected,mode);state.active.mockLanguage=state.settings.practiceLanguage||'mixed';state.active.drafts={};state.active.monthlyRatings={};state.active.answerVisible=false;state.active.phase=0;save();message='';open('session');
  }
  function finish(status='early',show=true){
    const s=state.active;if(!s)return;stopAudio();thinkUntil=0;s.entries.forEach(e=>{if(e.status==='pending')e.status='skipped';});C.finish(s,status);
    if(s.mode==='monthly'&&status==='completed'&&s.entries.length===5&&s.entries.every(e=>s.assessments[e.questionId])){
      const rows=Object.values(s.assessments),extra=s.monthlyRatings||{};
      state.monthly[C.monthKey(s.startedAt)]={date:C.dateKey(s.startedAt),questionIds:s.entries.map(e=>e.questionId),sessionId:s.id,selfRated:true,metrics:{start:rows.filter(r=>r.selfAssessment.startDelay==='within5').length,structure:rows.filter(r=>r.selfAssessment.completeness==='full').length,ending:Object.values(extra).filter(r=>r.naturalEnding).length,meaning:Object.values(extra).filter(r=>r.clearMeaning).length}};
    }
    state.sessions.push(s);state.active=null;for(const a of audio.values())URL.revokeObjectURL(a.url);audio.clear();save();message='今天已經完成練習，可以安心休息了。';if(show)open('home');
  }
  function goIndex(i){stopAudio();const s=state.active;if(!s)return;s.index=Math.max(0,Math.min(s.entries.length-1,i));s.answerVisible=false;s.referenceLanguage=s.entries[s.index].language;thinkUntil=0;save();render();}
  function next(skip=false){const s=state.active;if(!s)return;const e=s.entries[s.index];if(!s.assessments[e.questionId])e.status='skipped';if(s.index<s.entries.length-1){goIndex(s.index+1);const type=s.entries[s.index].stage;const p=phases(s).findIndex(x=>x[0]===type);if(p>=0)s.phase=p;save();render();}else{s.phase=Math.max(0,phases(s).findIndex(x=>x[0]==='retry'));s.answerVisible=true;save();render();}}
  function assessmentData(form){const f=new FormData(form);return {startDelay:f.get('startDelay')||'',completeness:f.get('completeness')||'',fluency:f.get('fluency')||'',problems:f.getAll('problems'),notes:f.get('notes')||'',naturalEnding:f.has('naturalEnding'),clearMeaning:f.has('clearMeaning')};}
  function formSave(form,submit=false){
    const type=form.dataset.prepForm,f=new FormData(form);
    if(type==='assessment'&&state.active){const s=state.active,e=s.entries[s.index],a=assessmentData(form);s.drafts=s.drafts||{};s.drafts[e.questionId]=a;if(submit){if(!form.reportValidity())return;const old=s.assessments[e.questionId];if(old){s.attempts=s.attempts||[];s.attempts.push(JSON.parse(JSON.stringify(old)));}C.recordAssessment(s,e,a);s.monthlyRatings=s.monthlyRatings||{};s.monthlyRatings[e.questionId]={naturalEnding:a.naturalEnding,clearMeaning:a.clearMeaning};message='這題自評已保存。可以重答、換下一題，或結束今天的練習。';}}
    else if(type==='plan'){const p=C.ensurePlan(state,week);p.goal=Math.max(0,Math.min(10080,Number(f.get('goal'))||0));for(const d of p.days){d.kind=f.get('kind-'+d.date)||'unset';d.mode=Number(f.get('mode-'+d.date))||0;if(d.kind==='rest'){d.mode=0;form.elements.namedItem('mode-'+d.date).value='0';}d.cancelled=d.mode===0;}}
    else if(type==='audit'){const a={};for(const [k,v]of f){if(k==='toeicTypes')continue;a[k]=form.elements.namedItem(k)?.type==='checkbox'?true:v;}a.toeicMinutes=Math.max(0,Math.min(10080,Number(f.get('toeicMinutes'))||0));a.toeicTypes=f.getAll('toeicTypes');state.audits[week]=a;}
    else if(type==='settings'){state.settings.weaknesses=f.getAll('weaknesses');state.settings.company=f.get('company')||'all';}
    save();if(submit){if(type!=='assessment')message='已保存在此裝置。';render();}
  }
  function download(obj,name){const url=URL.createObjectURL(new Blob([typeof obj==='string'?obj:JSON.stringify(obj,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  async function importFile(file){
    if(!file)return;if(file.size>5*1024*1024){message='匯入失敗：檔案超過 5 MB，原始資料未變更。';render();return;}
    try{const input=JSON.parse(await file.text());const next=C.validateState(input.prepV2||input);if(next.active){next.active.runningSince=null;next.active.paused=true;}const ok=store.set(KEY,next);if(!ok)throw Error('無法寫入本機資料');await stopAudio();state=next;blockedStorage=false;storageIssue='';message='已匯入備考資料，原有題庫、收藏與錄音紀錄保留。';render();}catch{message='匯入失敗：格式、版本或數值不正確，原始資料未變更。';render();}
  }
  host.addEventListener('submit',e=>{const form=e.target.closest('[data-prep-form]');if(!form)return;e.preventDefault();formSave(form,true);});
  host.addEventListener('change',e=>{
    const el=e.target,form=el.closest('[data-prep-form]');if(form)formSave(form);
    if(el.matches('[data-prep-import]'))importFile(el.files?.[0]);
    if(el.matches('[data-prep-mode]')&&el.value)start(Number(el.value));
    if(el.matches('[data-prep-language]')){state.settings.practiceLanguage=el.value;save();}
    if(el.matches('[data-prep-reference]')&&state.active){state.active.referenceLanguage=el.value;save();render();}
    if(el.matches('[data-prep-mock-language]')&&state.active){const s=state.active;s.mockLanguage=el.value;s.entries.filter(e=>e.stage==='mock'&&e.status==='pending').forEach((e,i)=>{const q=question(e.questionId),wanted=el.value==='mixed'?(i%2?'en':'zh'):el.value;if(q&&q.languages.includes(wanted))e.language=wanted;});save();render();}
  });
  host.addEventListener('click',async ev=>{
    const b=ev.target.closest('[data-prep-view],[data-prep-action]');if(!b)return;
    if(b.dataset.prepView){message='';open(b.dataset.prepView);return;}
    const a=b.dataset.prepAction,s=state.active;
    if(a==='start')start(Number(b.dataset.mode));
    else if(a==='resume'){if(s){C.resume(s);save();open('session');}}
    else if(a==='pause'&&s){if(s.paused)C.resume(s);else{C.pause(s);await stopAudio();}save();render();}
    else if(a==='finish')finish('early');
    else if(a==='complete'&&s){if(s.mode==='monthly'&&(s.entries.length!==5||s.entries.some(e=>!s.assessments[e.questionId]))){message='每月測驗需要完整五題自評才會產生四項指標。題目不足或未完成時，可按「提前結束」只保存本次練習。';render();return;}finish('completed');}
    else if(a==='rest'||a==='ten'){if(s)finish('early',false);const p=C.ensurePlan(state,C.weekKey()),d=p.days.find(d=>d.date===C.dateKey());d.mode=a==='rest'?0:10;if(a==='rest')d.kind='rest';else if(d.kind==='rest')d.kind='unset';save();message=a==='rest'?'今天留給休息，不需要補課。':'今天改成 10 分鐘，有練到一題就很好。';open('home');}
    else if(a==='next'||a==='skip')next(a==='skip');
    else if(a==='phase'||a==='phase-next'){if(s){await stopAudio();s.phase=a==='phase'?Number(b.dataset.phase):Math.min(phases(s).length-1,(s.phase||0)+1);const stage=phases(s)[s.phase][0],idx=s.entries.findIndex(e=>e.stage===stage);if(idx>=0)s.index=idx;s.answerVisible=['compare','retry'].includes(stage);save();render();}}
    else if(a==='index')goIndex(Number(b.dataset.index));
    else if(a==='reveal'&&s){s.answerVisible=!s.answerVisible;if(!s.answerVisible&&['compare','retry'].includes(phases(s)[s.phase][0]))s.phase=0;save();render();}
    else if(a==='retry-current'&&s){await stopAudio();s.answerVisible=false;s.phase=0;save();message='同一題再說一次，先用一句話講重點，再補細節。';render();}
    else if(a==='swap'&&s){
      if(s.mode==='monthly'&&s.assessments[s.entries[s.index].questionId]){message='每月自測保留這五題的自評。這題可再回答一次，尚未作答的題目可以更換。';render();return;}
      const language=s.entries[s.index].language,available=pool().filter(q=>q.languages.includes(language)),entries=C.schedule(available,state,{mode:s.mode==='monthly'?'monthly':10,language,singleLanguage:language,exclude:s.entries.concat(s.swapped||[]).map(e=>e.questionId),now:Date.now()});
      if(entries.length){b.disabled=true;const prior=s.entries[s.index],replacement={...entries[0],language,stage:prior.stage};s.swapped=s.swapped||[];if(s.assessments[prior.questionId]){s.entries.splice(s.index+1,0,replacement);s.index++;}else{s.swapped.push({...prior,status:'skipped'});s.entries[s.index]=replacement;}await stopAudio();s.answerVisible=false;save();render();}else{message='目前沒有其他未出現的題目，可以重答、跳過或結束保存。';render();}}
    else if(a==='retry'){const q=question(b.dataset.id);if(q)start(10,[{questionId:q.id,language:q.languages.includes('en')?'en':q.languages[0],type:q.type,stage:'english',reason:'你主動選擇再練一次。',status:'pending'}]);else{message='這道題目目前不在所選航空公司的題庫中，舊紀錄仍保留。';render();}}
    else if(a==='monthly-start'){if(state.monthly[C.monthKey()]){message='本月已有五題自評紀錄，下個月再做一次即可。';render();}else start('monthly');}
    else if(a==='week'){week=C.addDays(week,Number(b.dataset.offset)*7);render();}
    else if(a==='month'){const d=new Date(month+'-01T00:00:00Z');d.setUTCMonth(d.getUTCMonth()+Number(b.dataset.offset));month=d.toISOString().slice(0,7);render();}
    else if(a==='current-month'){month=C.monthKey();render();}
    else if(a==='clear-day'){const d=C.ensurePlan(state,week).days.find(d=>d.date===b.dataset.date);if(d){d.mode=0;d.cancelled=true;save();render();}}
    else if(a==='think'){thinkUntil=Date.now()+5000;document.getElementById('prepThink').textContent='5 秒，可以直接開始。';}
    else if(a==='think-skip'){thinkUntil=0;document.getElementById('prepThink').textContent='可以開始回答。';}
    else if(a==='star'){const q=question(b.dataset.id);if(q&&typeof toggleStar==='function'){toggleStar(q.legacyId);render();}}
    else if(a==='source'){if(s)C.pause(s);await stopAudio();save();root.CIFinalStudy?.open(b.dataset.key);}
    else if(a==='export'){if(s)C.checkpoint(s);save();download(state,'備考系統V2-'+C.dateKey()+'.json');}
    else if(a==='export-raw')download(localStorage.getItem('fa_'+KEY)||'null','備考系統原始資料.json');
    else if(a==='record'&&s){
      if(recorder?.active){await stopAudio();render();return;}
      if(s.paused){C.resume(s);save();}
      if(!root.LabRecorder){message='此瀏覽器目前無法錄音，可以直接口說並完成自評。';render();return;}
      recorder=recorder||new root.LabRecorder();recordPending=true;b.disabled=true;recordingKey=`${s.id}:${s.entries[s.index].questionId}`;const key=recordingKey;
      try{await recorder.start({recognition:false,onStatus:t=>{const el=document.getElementById('prepMicStatus');if(el)el.textContent=t;},onEnded:r=>{storeAudio(key,r);render();}});recordPending=false;render();const el=document.getElementById('prepMicStatus');if(el)el.textContent='正在錄音，說完按「停止錄音」。音訊不會上傳。';}catch{recordPending=false;message='無法取得麥克風或錄音已取消。可以直接口說，照常保存練習與自評。';render();}
    }
  });
  function suspend(){if(state.active&&!state.active.paused){C.pause(state.active);save();}recorder?.cancelPending();stopAudio();}
  document.addEventListener('visibilitychange',()=>{if(document.hidden){suspend();if(view==='session'&&host.querySelector('.prep-root'))render();}});
  root.addEventListener('pagehide',suspend);root.addEventListener('beforeunload',suspend);
  root.addEventListener('app:routechange',e=>{if(!String(e.detail?.route||'').startsWith('ci/prep')&&state.active)suspend();});
  root.addEventListener('ci:final-ready',()=>{if(host.querySelector('.prep-root'))render();});
  setInterval(()=>{
    if(state.active&&!state.active.paused){C.checkpoint(state.active);save();const el=document.getElementById('prepClock');if(el)el.textContent=clock(state.active);}
    const el=document.getElementById('prepThink');if(el&&thinkUntil){const left=Math.max(0,Math.ceil((thinkUntil-Date.now())/1000));el.textContent=left?`${left} 秒，可以略過。`:'可以開始回答。';if(!left)thinkUntil=0;}
  },1000);
  root.PrepApp={open,start,render,pool,getState:()=>state,save,reload(){stopAudio();read();if(host.querySelector('.prep-root'))render();},validate:C.validateState,importFile,finish};
})(window);
