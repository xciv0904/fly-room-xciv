(function(root){
  'use strict';
  const TOPICS=Object.freeze([
    {id:'service',label:'航空服務'},{id:'food',label:'餐飲設備'},
    {id:'sustainability',label:'永續環境'},{id:'business',label:'企業科技'},
    {id:'culture',label:'文化人物'},{id:'travel',label:'生活旅遊'}
  ].map(Object.freeze));
  const rules={
    service:/\b(?:cabin|passengers?|onboard|on-board|crew|seats?|headphones?|amenities|boarding|lounge|hospitality|customer service)\b|客艙|旅客|艙等|耳機|機上服務/giu,
    food:/\b(?:food|meals?|dining|cuisine|culinary|chefs?|rice|desserts?|beverages?|tea|coffee|snacks?|menu|menus|catering)\b|餐飲|餐點|米香|美食|飲品|五桐/giu,
    sustainability:/\b(?:sustainab\w*|SAF|ESG|carbon|emissions?|renewable|recycl\w*|biodiversity|conservation|environment\w*|decarbon\w*|water stewardship)\b|永續|減碳|環境|再生能源|水資源|循環/giu,
    business:/\b(?:TSMC|semiconductors?|technology|technologies|corporate|industry|industries|manufactur\w*|innovation|supply chain|companies|company|business)\b|台積電|科技|企業|半導體|供應鏈/giu,
    culture:/\b(?:culture|cultural|artists?|artwork|arts|documentary|documentaries|filmmaker|cinema|films?|festivals?|heritage|indigenous|music|musicians?|Chi Po-lin|Chi Po Lin|Lantern|traditions?)\b|文化|人物|齊柏林|紀錄片|藝術|節慶|原住民|音樂/giu,
    travel:/\b(?:travel\w*|tourism|tourists?|destinations?|routes?|cities|city|landscape|scenery|sightseeing|vacation|holidays?|visitors?|transportation|direct flights?)\b|旅遊|航點|航線|地景|城市|交通|生活/giu
  };
  const tokenPattern=/[\p{L}\p{N}]+(?:['’/-][\p{L}\p{N}]+)*/gu;
  const tokens=value=>String(value||'').match(tokenPattern)||[];
  const normalized=value=>tokens(value).map(x=>x.toLocaleLowerCase('en').replace(/’/g,"'")).join(' ');
  const original=article=>String(article?.text??article?.original??(Array.isArray(article?.sentences)?article.sentences.join('\n'):''));
  const unique=values=>[...new Set(values)];
  const topicIds=new Set(TOPICS.map(t=>t.id));
  const stableHash=value=>{let h=2166136261;for(const c of String(value)){h^=c.codePointAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(16);};
  const passageKey=article=>{const text=original(article).normalize('NFKC').toLocaleLowerCase('en').replace(/[’‘]/g,"'").replace(/[^\p{L}\p{N}]+/gu,' ').trim();return text?'text:'+text:'id:'+String(article?.questionId||article?.id||'');};
  function training(){
    if(root.ReadingTraining)return root.ReadingTraining;
    if(typeof module!=='undefined'&&typeof require==='function')return require('./training-core.js');
    return null;
  }
  function inferTopics(article){
    const explicit=unique((Array.isArray(article?.topics)?article.topics:[article?.topic]).filter(x=>topicIds.has(x)));
    if(explicit.length)return {topics:explicit,evidence:explicit.map(id=>({id,method:'editorial',examples:[]}))};
    const title=String(article?.title||''),body=original(article),evidence=[];
    for(const topic of TOPICS){
      const titleHits=title.match(rules[topic.id])||[],textHits=body.match(rules[topic.id])||[];
      if(titleHits.length||textHits.length)evidence.push({id:topic.id,method:'keyword',examples:unique([...titleHits,...textHits]).slice(0,5)});
    }
    return {topics:evidence.map(x=>x.id),evidence};
  }
  function sourceMetadata(article){
    const supplied=article?.sourceMeta||{},url=String(article?.originalUrl||article?.publisherUrl||article?.canonicalUrl||supplied.originalUrl||article?.sourceUrl||'');
    let publisher=article?.publisher||supplied.publisher||'',inferred=supplied.publisherInferred===true;
    if(!publisher){
      if(/(?:^|[./])china-airlines\.com\b|Dynasty|CAL NEWS/i.test(url+' '+(article?.source||''))){publisher='China Airlines';inferred=true;}
      else if(/(?:^|\.)tsmc\.com\b/i.test(url)){publisher='TSMC';inferred=true;}
    }
    const publicationDate=article?.publicationDate||article?.publishedAt||article?.publishedDate||supplied.publicationDate||'';
    const scope=article?.sourceScope||article?.excerptScope||supplied.scope||'';
    const provenance=article?.provenance||supplied.provenance||'practice-source';
    return {...supplied,publisher,publisherInferred:inferred,publicationDate,scope,originalUrl:url,provenance,
      examStatus:article?.examStatus||supplied.examStatus||'practice-material',
      note:article?.sourceNote||supplied.note||'來源練習材料；未據此認定為已確認考題。'};
  }
  function burden(article,options={}){
    const text=typeof article==='string'?article:original(article),all=tokens(text);
    const sentences=(typeof article!=='string'&&Array.isArray(article?.sentences)?article.sentences:String(text).split(/(?<=[.!?])(?:["”’']?\s+)|\n+/u)).map(x=>String(x).trim()).filter(Boolean);
    const longThreshold=Number.isFinite(options.longSentenceWords)?Math.max(1,options.longSentenceWords):25;
    const long=sentences.map(text=>({text,wordCount:tokens(text).length})).filter(x=>x.wordCount>longThreshold);
    const numberWords=all.filter(x=>/\d/u.test(x)),acronymWords=all.filter(x=>/^[A-Z][A-Z\d]*(?:[-/][A-Z\d]+)*$/.test(x)&&/[A-Z].*[A-Z]/.test(x));
    const names=[],skipStart=new Set(['The','A','An','In','On','At','As','For','From','To','With','This','That','These','Those','It','Its','We','Our','They','Their','After','Before','During','While','When','By','There','Each','Passengers']);
    for(const sentence of sentences){
      const words=tokens(sentence);
      words.forEach((word,i)=>{if(/^[A-Z][\p{Ll}][\p{L}'’-]*$/u.test(word)&&((i>0&&!skipStart.has(word))||(i===0&&!skipStart.has(word)&&/^[A-Z][\p{Ll}]/u.test(words[1]||''))))names.push(word);});
    }
    const lexicon=options.lexicon?.entries||options.lexicon,available=!!lexicon&&typeof lexicon==='object';
    const frequencyThreshold=Number.isFinite(options.frequencyRank)?options.frequencyRank:5000;
    const rare=[],unknown=[];
    if(available)for(const word of all){
      if(!/^[\p{L}]+(?:['’-][\p{L}]+)*$/u.test(word))continue;
      const key=normalized(word),entry=lexicon instanceof Map?lexicon.get(key):lexicon[key];
      const ranks=[entry?.bnc,entry?.frq,entry?.frequencyRank,entry?.rank].map(Number).filter(x=>Number.isFinite(x)&&x>0);
      if(!ranks.length)unknown.push(word);else if(Math.min(...ranks)>frequencyThreshold)rare.push(word);
    }
    const signal=(values,method)=>({count:values.length,examples:unique(values).slice(0,8),method});
    return {wordCount:all.length,sentenceCount:sentences.length,
      longSentences:{count:long.length,threshold:longThreshold,examples:long.slice(0,3),method:`超過 ${longThreshold} 個字詞的句子`},
      properNames:signal(names,'大寫字形候選；可能包含普通詞，需人工核對'),
      numbers:signal(numberWords,'含數字的字詞次數'),acronyms:signal(acronymWords,'含至少兩個大寫字母的全大寫字詞次數'),
      lowFrequency:{available,count:available?rare.length:null,examples:unique(rare).slice(0,8),unknownCount:available?unknown.length:null,threshold:frequencyThreshold,method:'僅計有有效詞頻排名且所有可用排名均超過門檻的字詞；缺資料不推定低頻'},
      note:'描述原文的閱讀負擔，不是航空公司難度、發音診斷或評分。'};
  }
  function enrich(article,options={}){
    const inferred=inferTopics(article);
    return {...article,topics:inferred.topics,topicEvidence:article?.topicEvidence||inferred.evidence,sourceMeta:sourceMetadata(article),burden:burden(article,options)};
  }
  function practiced(article,sessions){
    const key=passageKey(article),id=article?.id||article?.questionId;
    return (sessions||[]).some(s=>((id&&s.questionId===id)||passageKey(s)===key)&&isPracticed(s));
  }
  function isPracticed(session){
    const T=training();
    if(typeof T?.hasPracticed==='function')return T.hasPracticed(session);
    // A loaded text or transcript alone is not evidence of a completed attempt.
    return !!session&&!!session.id&&Number.isFinite(session.ts)&&Number(session.duration)>0&&session.started!==false&&session.interrupted!==true;
  }
  function topicCoverage(articles,sessions=[]){
    const rows=(articles||[]).map(a=>enrich(a));
    return TOPICS.map(topic=>{
      const seen=new Set(),done=new Set();
      for(const a of rows)if(a.topics.includes(topic.id)){const key=passageKey(a);seen.add(key);if(practiced(a,sessions))done.add(key);}
      return {...topic,total:seen.size,practiced:done.size,remaining:seen.size-done.size,ratio:seen.size?done.size/seen.size:0};
    });
  }
  function issueHistory(sessions=[]){
    const T=training();
    if(typeof T?.issueHistory==='function')return T.issueHistory(sessions);
    // Without the lifecycle module, preserve old confirmed issues as pending.
    // A checkbox on an old error must never silently mark an issue resolved.
    return sessions.flatMap(s=>(Array.isArray(s.errors)?s.errors:[]).flatMap((e,index)=>e?.confirmed===true?[{...e,id:e.id||'issue-'+stableHash([s.id,index,e.original,e.category].join('|')),issueId:e.id||'issue-'+stableHash([s.id,index,e.original,e.category].join('|')),sessionId:s.id,questionId:s.questionId,session:s,error:e,status:'pending',sameArticleStatus:'pending',transferStatus:'pending'}]:[]));
  }
  const unresolvedIssues=sessions=>issueHistory(sessions).filter(issue=>issue.status!=='resolved');
  function assessProgress(sessions=[]){
    const rows=sessions.filter(isPracticed).slice().sort((a,b)=>(Number(a.ts)||0)-(Number(b.ts)||0)||String(a.id).localeCompare(String(b.id)));
    const issues=issueHistory(sessions),unresolved=issues.filter(x=>x.status!=='resolved'),seen=new Set(),first=[],repeated=[];
    for(const s of rows){const key=passageKey(s);(seen.has(key)?repeated:first).push(s);seen.add(key);}
    const groups=new Map();
    for(const issue of issues){
      const key=normalized(issue.original||issue.error?.original);
      if(!key)continue;
      if(!groups.has(key))groups.set(key,{word:issue.original||issue.error.original,passages:new Set(),issueIds:[]});
      const item=groups.get(key);item.passages.add(passageKey(issue.session||sessions.find(s=>s.id===issue.sessionId)||{}));item.issueIds.push(issue.issueId||issue.id);
    }
    const crossTextRepetitions=[...groups.values()].filter(x=>x.passages.size>1).map(x=>({word:x.word,passages:x.passages.size,issueIds:x.issueIds}));
    return {historicalConfirmed:issues.length,unresolvedCount:unresolved.length,resolvedCount:issues.filter(x=>x.status==='resolved').length,
      transferVerifiedCount:issues.filter(x=>x.status==='resolved'&&x.transferStatus==='resolved').length,issues,unresolved,
      passagesPracticed:seen.size,newPassageSessions:first.length,sameTextAttempts:repeated.length,crossTextRepetitions};
  }
  function recommend(articles,sessions=[],config={},options={}){
    const now=Number(options.now??Date.now()),history=sessions.filter(isPracticed),coverage=new Map(topicCoverage(articles,history).map(x=>[x.id,x])),weaknesses=unresolvedIssues(sessions);
    let rows=(articles||[]).map(a=>enrich(a,options));
    rows=rows.filter(a=>(!config.kind||a.kind===config.kind)&&(!config.difficulty||a.difficulty===config.difficulty)&&(!config.topic||a.topics.includes(config.topic))&&(!Array.isArray(config.topics)||!config.topics.length||config.topics.some(t=>a.topics.includes(t)))&&(!config.airline||a.airline===config.airline||a.airlines?.includes(config.airline)));
    const other=rows.filter(a=>a.id!==options.draftId&&a.questionId!==options.draftId);
    if(other.length)rows=other;
    const ranking=rows.map(article=>{
      const unseen=!practiced(article,history),text=' '+normalized(original(article))+' ';
      const weaknessMatches=weaknesses.filter(issue=>{const word=normalized(issue.original||issue.error?.original);return word&&text.includes(' '+word+' ');});
      const needs=article.topics.map(id=>coverage.get(id)).filter(Boolean),topicNeed=needs.length?Math.max(...needs.map(t=>1-t.ratio)):0;
      const mostNeeded=needs.slice().sort((a,b)=>a.ratio-b.ratio||a.practiced-b.practiced||a.id.localeCompare(b.id))[0];
      const related=history.filter(s=>s.questionId===article.id||passageKey(s)===passageKey(article)),lastPracticedAt=Math.max(0,...related.map(s=>Number(s.ts)||0));
      const reasons=[],reasonDetails=[];
      if(unseen){reasons.push('尚未練習這篇原文');reasonDetails.push({code:'unseen'});}
      if(mostNeeded){reasons.push(`${mostNeeded.label}已練 ${mostNeeded.practiced}／${mostNeeded.total} 篇，補足主題涵蓋`);reasonDetails.push({code:'topic-coverage',topic:mostNeeded.id,practiced:mostNeeded.practiced,total:mostNeeded.total});}
      if(weaknessMatches.length){const examples=unique(weaknessMatches.map(x=>x.original||x.error?.original)).slice(0,3);reasons.push(`含人工確認且待修正的片段：${examples.join('、')}`);reasonDetails.push({code:'confirmed-weakness',issueIds:weaknessMatches.map(x=>x.issueId||x.id),examples});}
      if(!unseen&&lastPracticedAt){const days=Math.max(0,Math.floor((now-lastPracticedAt)/86400000));reasons.push(`上次練習距今 ${days} 天`);reasonDetails.push({code:'last-practiced',days});}
      const score=(unseen?10000:0)+topicNeed*100+Math.min(3,weaknessMatches.length)*20;
      return {article,score,reasons,reasonDetails,unseen,topicNeed,weaknessMatches,lastPracticedAt};
    });
    // Unseen is a hard priority; remaining ties are explainable and reproducible.
    ranking.sort((a,b)=>Number(b.unseen)-Number(a.unseen)||b.score-a.score||a.lastPracticedAt-b.lastPracticedAt||String(a.article.id||passageKey(a.article)).localeCompare(String(b.article.id||passageKey(b.article))));
    if(typeof options.random==='function'){
      for(let start=0;start<ranking.length;){let end=start+1;while(end<ranking.length&&ranking[end].unseen===ranking[start].unseen&&ranking[end].score===ranking[start].score&&ranking[end].lastPracticedAt===ranking[start].lastPracticedAt)end++;
        for(let i=end-1;i>start;i--){const draw=Number(options.random()),j=start+Math.floor(Math.max(0,Math.min(.999999999,Number.isFinite(draw)?draw:0))*(i-start+1));[ranking[i],ranking[j]]=[ranking[j],ranking[i]];}start=end;}
    }
    return ranking;
  }
  root.ReadingCurriculum={TOPICS,tokens,original,passageKey,inferTopics,sourceMetadata,burden,enrich,isPracticed,topicCoverage,issueHistory,unresolvedIssues,assessProgress,recommend};
  if(typeof module!=='undefined')module.exports=root.ReadingCurriculum;
})(typeof window!=='undefined'?window:globalThis);
