(function(){
  'use strict';
  const D=window.ReadingLabData,base=D.words.slice();
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const types={word:'一般詞彙',proper:'地名／專有名詞',model:'機型',abbreviation:'英文縮寫',number:'數字',date:'日期'};
  let index=null,error='',loading;
  const articles=new Map(),files=new Map();
  function personal(state){
    const saved=Object.values(state.wordCards||{});
    try{for(const w of JSON.parse(localStorage.getItem('fa_pronunciationWords')||'[]')){
      if(!w.word)continue;
      const existing=D.words.find(x=>x.normalized===w.word.toLowerCase());if(existing){existing.personal=true;continue;}
      const id='personal-'+Array.from(w.word.toLowerCase()).map(c=>c.codePointAt(0).toString(16)).join('-');
      saved.push({id,word:w.word,normalized:w.word.toLowerCase(),zh:w.zh||'',sources:[],type:'word',difficulty:'待確認',personal:true,context:w.context||'',ipa:'',syllables:'',note:'你曾標記不熟悉的字；讀音資料待確認。'});
    }}catch{}
    for(const w of saved)if(w?.id&&w.word&&!D.words.some(x=>x.id===w.id))D.words.push(w);
  }
  async function load(state){
    if(!loading)loading=(async()=>{
      try{
        const r=await fetch('generated/vocabulary-index.json',{cache:'no-cache'});if(!r.ok)throw Error('HTTP '+r.status);
        const data=await r.json();if(data.schema!==1||!Array.isArray(data.words)||!Array.isArray(data.articles))throw Error('格式不符');
        index=data;data.articles.forEach(a=>articles.set(a.id,a));
        const ids=new Map(data.words.map(w=>[w.id,w]));
        D.words=[...base.map(w=>ids.get(w.id)||w),...data.words.filter(w=>!base.some(b=>b.id===w.id))];
      }catch(e){error='全站題庫暫時無法載入，保留原有 33 字。請檢查連線後重試。';}
    })();
    await loading;
    if(index){index.words.forEach(w=>{delete w.personal;});const ids=new Map(index.words.map(w=>[w.id,w]));D.words=[...base.map(w=>ids.get(w.id)||w),...index.words.filter(w=>!base.some(b=>b.id===w.id))];}
    personal(state);
    if(error&&!index)loading=null;
  }
  function pool(filters,state,review){
    const q=(filters.search||'').trim().toLowerCase();
    return D.words.filter(w=>{
      const status=state.words[w.id]?.status||'unpracticed',sources=(w.sources||[]).map(s=>articles.get(s.articleId)).filter(Boolean);
      return (!review||['pending','unsure','retry'].includes(status)||w.personal)&&
        (!filters.airline||sources.some(a=>a.airlines.includes(filters.airline)))&&
        (!filters.article||sources.some(a=>a.id===filters.article))&&
        (!filters.kind||sources.some(a=>a.kind===filters.kind))&&
        (!filters.difficulty||w.difficulty===filters.difficulty)&&
        (!filters.type||w.type===filters.type)&&
        (!filters.status||(filters.status==='review'?['pending','unsure','retry'].includes(status)||w.personal:filters.status===status))&&
        (!q||[w.word,w.zh,w.normalized,w.lemma].join(' ').toLowerCase().includes(q));
    });
  }
  function controls(f,count){
    const select=(key,label,items)=>`<label>${label}<select data-vocab-filter="${key}"><option value="">全部</option>${items.map(([value,label])=>`<option value="${esc(value)}"${f[key]===value?' selected':''}>${esc(label)}</option>`).join('')}</select></label>`;
    const list=(key)=>[...new Set([...articles.values()].flatMap(a=>a[key]))].sort().map(x=>[x,x]);
    const available=[...articles.values()].filter(a=>(!f.airline||a.airlines.includes(f.airline))&&(!f.kind||a.kind===f.kind));
    return `<p class="lab-status">${error?esc(error):index?`文章 ${index.report.processed}/${index.report.articleCount} 已處理（${index.report.withCandidates} 篇有候選詞） · 去重 ${index.report.vocabularyCount} 詞 · 本次篩選 ${count} 字`:'正在使用原有字庫'}</p><details class="lab-filter-panel"${innerWidth>=700||Object.values(f).some(Boolean)?" open":""}><summary>篩選航空公司、文章與難度</summary><div class="lab-fields lab-vocab-filters">${select('airline','航空公司',list('airlines'))}${select('kind','材料分類',list('kind'))}${select('article','指定文章',available.map(a=>[a.id,a.title]))}${select('difficulty','難度',['初級','中級','高級','挑戰級','待確認'].map(x=>[x,x]))}${select('type','字詞類型',Object.entries(types))}${select('status','練習狀態',[['unpracticed','未練習'],['mastered','已學會'],['review','需要複習／待確認']])}</div></details><label>單字搜尋<input id="labWordSearch" type="search" value="${esc(f.search||'')}" autocomplete="off"></label><div class="lab-actions"><button class="btn sec" data-lab-action="word-random">隨機出題</button><button class="btn sec" data-lab-action="word-reset">清除篩選</button></div><details><summary>題庫覆蓋與資料限制</summary><p>直接從原站全文在建置時產生，不受目前畫面影響。一般詞、專名、機型、縮寫、數字與日期分開，同拼字多讀音保留選項，不擅自指定詞性。短問句、中文與 UI 文案不作文章；288 個模擬版本不是 288 篇獨立新聞。</p><p>難度由字典音節、重音、頻率與航空領域等訊號篩選，並非官方考試難度。${index?`尚待確認 IPA ${index.report.pronunciationPending} 字、中文 ${index.report.translationPending} 字。`:''}</p><p><a href="generated/vocabulary-report.json" target="_blank" rel="noopener">逐篇擷取報告</a> · <a href="generated/vocabulary-audit.json" target="_blank" rel="noopener">20 字來源與讀音抽查</a></p></details>`;
  }
  function answer(w){
    const variants=w.pronunciations||[],phonemes=w.phoneticEvidence||[];
    return `<div class="lab-answer"><h4>讀音核對</h4>${variants.length?variants.map(p=>`<p lang="en"><b>${esc(p.ipa)}</b></p>`).join(''):'<p>IPA 待確認；未根據拼字虛構音標。</p>'}<p>${esc(w.zh||'中文意思待人工確認；可開啟原文來源核對語境。')}</p>${phonemes.length?`<p>字典音節數／主要重音（依不同讀法）：${phonemes.map(p=>`${p.syllableCount} 音節，第 ${p.primaryStress.join('、')||'未標示'} 音節`).join(' ／ ')}</p><p lang="en">音素分組：${esc(w.syllables)}</p><p class="sub">分組為演算法輔助，不是字典確認的字母音節切分；CMU 音素讀法與 IPA 選項不強制一對一配對。</p>`:'<p>音節與重音待確認。</p>'}<p class="sub">${esc(w.note)}</p>${w.type==='proper'?'<p class="lab-caution">專名若有詞典英文讀法，也不代表當地語言或官方唯一讀法。</p>':''}${variants.length?`<a href="${esc(index.lexiconSources.ipa.url)}" target="_blank" rel="noopener">IPA 原始資料</a> · <a href="${esc(index.lexiconSources.cmu.url)}" target="_blank" rel="noopener">CMU 重音資料</a> · `:''}${window.ReadingLabSpeech.dictionaryLink(w.word)}<div class="lab-actions"><button class="btn sec" data-lab-action="say" data-accent="en-US" data-text="${esc(w.word)}">裝置美式合成音</button><button class="btn sec" data-lab-action="say" data-accent="en-GB" data-text="${esc(w.word)}">裝置英式合成音</button><button class="btn sec" data-lab-action="learn-stop">停止播放</button></div><p class="sub">裝置合成音並非字典錄音或官方標準；錄音只供自我比較，不評定發音分數。</p></div>`;
  }
  function sources(w){
    const refs=w.sources||[];
    return `<details class="lab-word-sources"><summary>查看原文例句與來源（${refs.length} 篇／${w.occurrences||0} 次）</summary>${w.context?`<blockquote lang="en">${esc(w.context)}</blockquote>`:''}${refs.map(s=>{
      const a=articles.get(s.articleId);if(!a)return '';
      return `<section><h4>${esc(a.title)}</h4><p class="sub">${esc(a.airlines.join('／'))} · ${esc(a.kind)} · ${esc(a.source)}</p>${s.sentenceIndices.map(i=>`<blockquote lang="en">${esc(a.sentences[i])}</blockquote>`).join('')}<button class="btn sec" data-lab-action="word-source" data-id="${a.id}">查看完整來源文章</button> <a href="${esc(a.sourceUrl)}" target="_blank" rel="noopener">原始資料位置</a></section>`;
    }).join('')||'<p>此字保留自先前或個人字庫，目前未找到文章來源。</p>'}</details><div id="labWordSource" tabindex="-1"></div>`;
  }
  // Decode a string literal only. Never eval source files fetched for reading.
  function decode(literal){
    if(literal[0]==='"')return JSON.parse(literal);
    return literal.slice(1,-1).replace(/\\(u\{[0-9a-f]+\}|u[0-9a-f]{4}|x[0-9a-f]{2}|\r?\n|.)/gi,(_,v)=>{
      if(v[0]==='u')return String.fromCodePoint(parseInt(v.replace(/^u\{?|\}$/g,''),16));
      if(v[0]==='x')return String.fromCharCode(parseInt(v.slice(1),16));
      return ({n:'\n',r:'\r',t:'\t',b:'\b',f:'\f',v:'\v','0':'\0','\n':'','\r\n':''})[v]??v;
    });
  }
  async function source(id,holder){
    const a=articles.get(id);if(!a)throw Error('來源不存在');
    let text;
    if(a.locator.format==='lab-question')text=D.questions.find(q=>q.id===a.locator.id)?.text;
    else{
      if(!files.has(a.sourceFile))files.set(a.sourceFile,fetch(a.sourceFile,{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('來源下載失敗');return r.text();}));
      const raw=await files.get(a.sourceFile),loc=a.locator;
      if(loc.format==='json'){text=loc.path.reduce((v,k)=>v?.[k],JSON.parse(raw));}
      else{text=raw.slice(loc.start,loc.end);if(loc.format==='js-string')text=decode(text);}
    }
    if(typeof text!=='string')throw Error('來源文章格式已變更，請重新建置題庫');
    if(crypto.subtle){const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');if(digest!==a.originalHash)throw Error('來源與題庫版本不同，請重新整理；可先開啟原始資料位置。');}
    holder.innerHTML=`<article class="lab-source-article"><h4>${esc(a.title)}</h4><p>${esc(a.kind)} · ${esc(a.source)}</p><div class="lab-original" lang="en">${esc(text)}</div></article>`;holder.focus();
  }
  window.ReadingLabVocabulary={load,pool,controls,answer,sources,source,personal,get index(){return index;}};
})();
