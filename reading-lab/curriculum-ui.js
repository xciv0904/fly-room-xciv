(function(root){
  'use strict';
  const M=root.ReadingCurriculum,T=root.ReadingTraining,C=root.ReadingLabCore;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const btn=(action,label,attrs='')=>`<button type="button" class="btn sec" data-lab-action="${action}" ${attrs}>${label}</button>`;
  const link=(url,label)=>/^https:\/\//.test(url||'')?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`:'';
  const topicLabel=id=>M.TOPICS.find(t=>t.id===id)?.label||id;
  function topicSelect(id,value='',disabled=''){
    return `<label>練習主題<select id="${id}"${disabled}><option value="">全部主題</option>${M.TOPICS.map(t=>`<option value="${t.id}"${value===t.id?' selected':''}>${esc(t.label)}</option>`).join('')}</select></label>`;
  }
  function source(article){
    const a=M.enrich(article),s=a.sourceMeta||{};
    const publisher=a.publisher||s.publisher||'原站收錄材料';
    const date=a.dateLabel||s.dateLabel||a.publishedAt||s.publicationDate||'發布日期待核對';
    const scope=a.scope||s.scope||a.source||'沿用已收錄原稿；節錄範圍待原始刊物核對';
    const url=a.originalUrl||s.originalUrl||a.sourceUrl;
    const github=/github\.com\//.test(url||'');
    return `<div class="lab-source-meta"><div class="lab-topic-tags">${a.topics.map(t=>`<span>${esc(topicLabel(t))}</span>`)}<span>${a.studyOnly?'延伸原文閱讀':'朗讀練習材料'}</span></div><p>${esc(publisher)} · ${esc(date)}</p><p>${esc(scope)}</p><p>${link(url,github?'站內收錄位置':'查看原始文章／刊物')}${a.verifiedAt||a.originalUrlVerifiedAt?` · 來源連結核對 ${esc(a.verifiedAt||a.originalUrlVerifiedAt)}`:''}</p><p class="sub">${esc(a.verificationNote|| (github?'此連結指向站內保存的原稿，尚待核對原始刊物網址。':'原文用於主題與朗讀準備。'))} 非已確認官方面試題；考生回報不作題目來源證明。</p></div>`;
  }
  function burden(article,examples=true){
    const a=M.enrich(article,{lexicon:root.ReadingLabLearning?.lexicon}),b=a.burden;
    const signals=[{label:`長句（超過 ${b.longSentences.threshold} 字詞）`,...b.longSentences,examples:b.longSentences.examples.map(x=>x.text)}, {label:'候選專名',...b.properNames},{label:'數字',...b.numbers},{label:'縮寫',...b.acronyms}];
    if(b.lowFrequency.available)signals.push({label:'低頻詞（詞頻排名超過 5,000）',...b.lowFrequency});
    return `<details class="lab-burden"><summary>這篇有哪些朗讀負擔？</summary><p>${b.wordCount} 個字詞；篇幅標籤與以下線索分開看。</p>${signals.map(s=>`<p><b>${esc(s.label)}</b>：${esc(s.count)}${examples&&s.examples?.length?` · ${s.examples.map(esc).join('、')}`:''}</p>`).join('')}${!b.lowFrequency.available?`<p>低頻詞：詞頻資料尚未載入。</p>${btn('load-frequency','載入本機字典的詞頻線索')}`:`<p class="sub">另有 ${b.lowFrequency.unknownCount} 個字詞缺有效詞頻，不將它們直接算作低頻詞。</p>`}<p class="sub">這些是可檢查的文字線索，不是官方難度或發音評分；大寫詞只列作候選專名。</p></details>`;
  }
  function coverage(articles,sessions,sourceReadings={}){
    const formal=articles.filter(a=>!a.studyOnly),refs=articles.filter(a=>a.studyOnly);
    const rows=M.topicCoverage(formal,sessions);
    return `<section class="card lab-coverage"><h3>主題涵蓋</h3><p class="sub">${formal.length} 篇完整朗讀原稿 · ${refs.length} 篇延伸原文入口。各主題可能重疊；同題重錄不增加已練篇數。</p><div class="lab-topic-grid">${rows.map(t=>{const reading=refs.filter(a=>M.enrich(a).topics.includes(t.id));const done=reading.filter(a=>sourceReadings[a.id]?.completedAt).length;return `<div class="lab-topic-card"><h4>${esc(t.label||topicLabel(t.id))}</h4><p>原稿已練 ${t.practiced}/${t.total} 篇</p><progress max="${t.total||1}" value="${t.practiced}" aria-label="${esc(topicLabel(t.id))}原稿涵蓋"></progress>${reading.length?`<p class="sub">延伸閱讀 ${done}/${reading.length} 篇已自記完成</p>`:''}${btn('topic-study','查看此主題',`data-topic="${t.id}"`)}</div>`;}).join('')}</div></section>`;
  }
  function plan(articles,sessions,state){
    const recommended=M.recommend(articles.filter(a=>!a.studyOnly),sessions,{}, {draftId:state.draft?.questionId})[0];
    const issues=T.activeIssues(sessions),due=T.reviewItems(sessions,state),pendingTransfer=T.issueHistory(sessions).filter(i=>i.status==='resolved'&&i.transferStatus!=='resolved');
    const reference=articles.find(a=>a.studyOnly&&!state.sourceReadings?.[a.id]?.completedAt);
    return `<section class="card lab-daily-plan"><h3>今天的練習安排</h3><p class="sub">依未練原稿、主題涵蓋、已確認問題與到期複習安排；可自行更換。</p>${recommended?`<h4>${esc(recommended.article.title)}</h4><p class="lab-reason">${recommended.reasons.map(esc).join('；')}</p><div class="lab-actions">${btn('plan-words','先練這篇的詞',`data-id="${esc(recommended.article.id)}"`)}${btn('plan-reading','開始這篇原稿',`data-id="${esc(recommended.article.id)}"`)}</div>`:'<p>目前篩選沒有可用原稿。</p>'}<p>到期 ${due.length+(T.transferDueItems?.(sessions)||[]).length} 項 · ${issues.length} 個問題待修正 · ${pendingTransfer.length} 個同題改善待換文複驗</p>${issues.length||pendingTransfer.length?btn('plan-review','處理待複驗問題'):btn('view','查看到期複習','data-view="history"')}${reference?`<div class="lab-plan-reference"><h4>補一個主題：${esc(reference.title)}</h4>${btn('source-study','開啟延伸閱讀任務',`data-id="${esc(reference.id)}"`)}</div>`:''}</section>`;
  }
  function progress(articles,sessions){
    const formalIds=new Set(articles.filter(a=>!a.studyOnly).map(a=>a.id));
    const completed=sessions.filter(s=>T.hasPracticed(s)&&formalIds.has(s.questionId));
    const unique=new Set(completed.map(s=>M.passageKey(s)));
    const history=T.issueHistory(sessions),active=history.filter(i=>i.status!=='resolved');
    const transfer=history.filter(i=>i.status==='resolved'&&i.transferStatus==='resolved');
    const same=history.filter(i=>i.status==='resolved'&&i.sameArticleStatus==='resolved'&&i.transferStatus!=='resolved');
    return `<section class="card lab-progress"><h3>目前的準備狀態</h3><div class="lab-progress-grid"><div><strong>${unique.size}</strong><span>不同原稿已練</span></div><div><strong>${active.length}</strong><span>問題待複驗</span></div><div><strong>${same.length}</strong><span>同題已自評改善</span></div><div><strong>${transfer.length}</strong><span>換文已自評穩定</span></div></div><p class="sub">「改善／穩定」來自你完成新一輪練習後的回聽自評。${completed.length} 次完成練習中的重錄另計；歷史問題保留，已解決項目不再算待修正。</p></section>`;
  }
  function issueList(sessions,limit=20){
    const all=T.issueHistory(sessions),items=all.filter(i=>i.status!=='resolved'||i.transferStatus!=='resolved');
    return `<section class="card lab-issue-list"><h3>下一個要修正的問題</h3>${items.length?items.slice(0,limit).map(i=>`<div class="lab-review-item"><b>${esc(i.original||i.error?.original||'朗讀片段')}</b> · ${esc(C.categories[i.category||i.error?.category]||'其他')}<p>${esc(i.note||i.error?.note||'回聽後選定修正方法。')}</p><p class="sub">${i.status==='resolved'?'同題已自評改善，換文待複驗':'待修正／複驗'} · ${esc(i.session?.title||'已保存原稿')}</p><div class="lab-actions">${btn('issue-retry','原句練習與同題重錄',`data-issue="${esc(i.id)}"`)}${btn('issue-transfer','換篇文章複驗',`data-issue="${esc(i.id)}"`)}</div></div>`).join(''):'<p>尚無待修正問題。完成朗讀後，回聽並確認值得修正的地方。</p>'}${items.length>limit?btn('more-issues',`再顯示問題（還有 ${items.length-limit} 項）`):''}</section>`;
  }
  function workflow(d,sessions){
    const targets=(d.targetIssueIds||[]).map(id=>T.issueHistory(sessions).find(i=>i.id===id)).filter(Boolean);
    const confirmed=(d.errors||[]).map((e,i)=>({...e,id:T.issueId({id:d.savedId,questionId:d.questionId},e,i)})).filter(e=>e.confirmed);
    const focus=d.focusIssueIds||confirmed.slice(0,3).map(e=>e.id);
    const retry=targets.length?`<h4>${d.practiceType==='transfer'?'換文複驗':'同題重錄'}：回聽後記錄結果</h4><p class="sub">請確認這輪確實讀到目標詞／片段，再自評；逐字稿相同不會自動標為已改善。</p>${targets.map(i=>{const result=d.reviewResults?.find(r=>r.issueId===i.id);return `<label>${esc(i.original||i.error?.original||'朗讀片段')}<select data-lab-review-result="${esc(i.id)}"><option value="pending"${!result||result.status==='pending'?' selected':''}>待回聽確認</option><option value="retry"${result?.status==='retry'?' selected':''}>仍需重練</option><option value="resolved"${result?.status==='resolved'?' selected':''}>已讀到並自評穩定</option></select></label>`;}).join('')}${btn('save-review','儲存這次複驗結果')}`:'';
    const correction=confirmed.length?`<h4>選出這輪最值得修正的 1–3 項</h4>${confirmed.map(e=>`<label class="lab-check"><input type="checkbox" data-lab-focus="${esc(e.id)}"${focus.includes(e.id)?' checked':''}>${esc(e.original||e.heard||'朗讀片段')} · ${esc(C.categories[e.category]||'其他')}</label>`).join('')}<div class="lab-actions">${btn('practice-phrases','查看選定原句並練習')}${btn('retry','保留這次錄音，建立同題重錄')}</div><div id="labPhrasePractice"></div>`:`<p>在逐字稿比對區確認問題，或人工加入一個重音、停頓等問題，即可安排局部練習與複驗。</p>${btn('retry','保留這次錄音，建立同題重錄')}`;
    const baseline=sessions.find(s=>s.id===d.baselineId);
    return `<section class="card lab-workflow"><h3>修正、重錄與複驗</h3>${retry}${correction}${baseline?`<h4>同題錄音比較</h4><p class="sub">${d.practiceType==='transfer'?'這輪使用不同文章；可回聽前次目標，不能直接比較篇幅與語速。':'回聽前次與這次錄音，自行確認改變。'}</p><div class="lab-columns"><div><b>前次：${esc(baseline.title)}</b><p>${baseline.duration||0} 秒</p>${btn('play-comparison','載入前次錄音',`data-id="${esc(baseline.id)}" data-holder="labBaselineAudio"`)}<div id="labBaselineAudio"></div></div><div><b>這次：${esc(d.title)}</b><p>${d.duration||0} 秒</p>${d.savedId?btn('play-comparison','載入這次錄音',`data-id="${esc(d.savedId)}" data-holder="labCurrentAudio"`):'<p class="sub">完成這輪錄音後可比較。</p>'}<div id="labCurrentAudio"></div></div></div>`:''}</section>`;
  }
  function reference(article,reading={}){
    return `<section class="lab-reference-task"><p class="lab-badge">延伸原文閱讀 · 不加入正式抽題</p><p>${esc(article.summaryZh||'')}</p><p>${esc(article.readingTask||'前往來源閱讀全文，再完成下列自測。')}</p><p>${link(article.sourceUrl,'開啟原文全文')}</p><ol>${(article.readingPrompts||[]).map(p=>`<li>${esc(p)}</li>`).join('')}</ol>${article.vocabulary?.length?`<h4>原文值得先處理的詞</h4><div class="lab-reference-words">${article.vocabulary.map(w=>`<span><button class="lab-inline-word" data-lab-action="learn-word" data-word="${esc(w.word)}">${esc(w.word)}</button>：${esc(w.zh)}</span>`).join('')}</div>`:''}<p class="sub">${esc(article.rightsNote||article.studyOnlyReason||'此頁僅保留短節錄；全文請至來源閱讀。')}</p>${btn('source-complete',reading.completedAt?'已自記讀完，可重新記錄':'我已到來源讀完並完成自測',`data-id="${esc(article.id)}"`)}${reading.completedAt?`<p class="sub">完成日期 ${C.dayKey(reading.completedAt)}；這是閱讀自記，未算作錄音練習。</p>`:''}</section>`;
  }
  root.ReadingCurriculumUI={topicSelect,source,burden,coverage,plan,progress,issueList,workflow,reference,topicLabel};
})(window);
