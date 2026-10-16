(function(root){
  'use strict';
  const D=root.ReadingLabData,V=root.ReadingLabVocabulary,T=root.ReadingTraining;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let dictionary,lookup,lastWord;
  const opts=(items,value)=>items.map(([v,l])=>`<option value="${esc(v)}"${v===value?' selected':''}>${esc(l)}</option>`).join('');
  const kinds=['雜誌','新聞稿','廣播詞'];
  function pool(config){const kind=kinds.includes(config.kind)?config.kind:'';return (V.index?.articles||[]).filter(a=>kinds.includes(a.kind)&&(!config.airline||a.airlines.includes(config.airline))&&(!kind||a.kind===kind));}
  function selected(config){const items=pool(config);return items.find(a=>a.id===config.articleId)||items[0];}
  function text(a){return a?.sentences.join('\n')||'';}
  function examPool(config={}){
    return pool({airline:'華航',kind:config.kind}).map(a=>{
      const original=text(a),words=root.ReadingLabCore.tokens(original).length;
      return {id:a.id,title:a.title,text:original,words,airline:'華航',kind:a.kind,source:a.source,sourceUrl:a.sourceUrl,difficulty:words<130?'初級':words<180?'中級':words<230?'高級':'挑戰級'};
    }).filter(q=>q.words>0&&q.words<=1000&&(!config.difficulty||q.difficulty===config.difficulty));
  }
  function markup(config){
    const items=pool(config),a=selected(config),hints=config.hints!==false;
    const known=new Map(D.words.map(w=>[w.normalized,w]));
    const renderText=t=>t.split(/([\p{L}]+(?:['’-][\p{L}]+)*)/u).map((s,i)=>{
      if(i%2===0)return esc(s);const w=known.get(s.toLowerCase().replace(/’/g,"'")),emphasis=hints&&(w?.syllableCount>=3||w?.type==='proper'||w?.reasons?.includes('aviation-terminology'));
      return `<button class="lab-inline-word${emphasis?' lab-focus-word':''}" data-lab-action="learn-word" data-word="${esc(s)}" aria-label="查詢 ${esc(s)}">${esc(s)}</button>`;
    }).join('');
    return `<div class="card"><h3>英文朗讀學習</h3><p>從原網站文章開始：先理解，再以意群練習，最後轉入沒有提示的正式考場。</p><div class="lab-fields"><label>航空公司<select id="labLearnAirline">${opts([['','全部'],...['華航','長榮','星宇','國泰','通用'].map(x=>[x,x])],config.airline||'')}</select></label><label>材料分類<select id="labLearnKind">${opts([['','全部'],...kinds.map(x=>[x,x])],kinds.includes(config.kind)?config.kind:'')}</select></label></div><label>指定文章（${items.length} 筆）<select id="labLearnArticle">${opts(items.map(a=>[a.id,a.title]),a?.id)}</select></label><div class="lab-actions"><button class="btn sec" data-lab-action="learn-random">隨機學習</button>${a?'<button class="btn sec" data-lab-action="learn-exam">用這篇進行正式模擬</button>':''}</div></div>${a?`<div class="card"><h3>${esc(a.title)}</h3><p class="lab-badge">${a.kind==='模擬朗讀'?'模擬稿，非官方新聞或面試題':esc(a.kind)+' · 沿用原站材料，非官方面試題'}</p><p class="sub">${esc(a.airlines.join('／'))} · ${esc(a.source)} · <a href="${esc(a.sourceUrl)}" target="_blank" rel="noopener">原始資料位置</a></p><label class="lab-check"><input id="labLearnHints" type="checkbox"${hints?' checked':''}>顯示意群／停頓及生字提示</label><p class="sub">斜線是依標點與連接詞產生的停頓建議，不是唯一正解；粗體代表值得先處理的詞，不代表每次都要重讀。句意重音由你判斷，個別字重音可點字核對。</p>${root.ReadingLabSpeech.controls(config)}<div class="lab-study-text" lang="en">${a.sentences.map((s,i)=>`<p data-speech-sentence="${i}">${(hints?T.phraseParts(s):[s]).map(renderText).join(' <span class="lab-pause" aria-label="建議停頓">／</span> ')} <button class="lab-sentence-play" data-lab-action="learn-sentence" data-index="${i}" data-text="${esc(s)}" aria-label="播放第 ${i+1} 句">▶ 聽這句</button></p>`).join('')}</div><div class="lab-actions"><button class="btn sec" data-lab-action="learn-say">播放全文合成語音</button><button class="btn sec" data-lab-action="learn-stop">停止播放</button></div><p class="lab-caution">文字轉語音不是標準字典錄音，外語地名與專名尤其可能唸錯；正式模式不顯示這些提示。</p><div id="labLearnWord" tabindex="-1" aria-live="polite"></div></div>`:'<div class="card"><p>此篩選沒有文章，請更換航空或分類。</p></div>'}`;
  }
  async function word(spelling,holder){
    const key=spelling.toLowerCase().replace(/’/g,"'");let w=D.words.find(w=>w.normalized===key);
    if(!w){
      if(!lookup)lookup=fetch('generated/vocabulary-lexicon.json').then(r=>{if(!r.ok)throw Error('字典資料暫時無法載入');return r.json();});
      dictionary=await lookup;const e=dictionary.entries[key];
      w={word:spelling,zh:e?.zh||'',pronunciations:(e?.ipa||[]).map(ipa=>({ipa})),phoneticEvidence:[],note:'此詞不在困難詞卡中；若有 IPA，取自鎖定版字典，沒有可靠音節資料時不推測。'};
    }
    lastWord={...w,word:spelling,normalized:key};holder.innerHTML=`<h4>${esc(spelling)}</h4>${V.answer(w)}<button class="btn sec" data-lab-action="learn-save-word" data-word="${esc(key)}">加入需要複習</button>`;holder.focus({preventScroll:true});
  }
  root.ReadingLabLearning={pool,selected,text,examPool,markup,word,get lastWord(){return lastWord;}};
})(window);
