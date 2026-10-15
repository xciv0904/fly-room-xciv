const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {collect,tokens,hash}=require('./vocabulary/corpus.cjs');
const {prepare}=require('./vocabulary/resources.cjs');
const VERSION=1;
const normalize=t=>t.normalize('NFC').replace(/’/g,"'").toLowerCase();
const stop=new Set('a an the and or but if of to in on at for from with by as is are was were be been being have has had do does did will would can could should may might must not no yes it its this that these those i you he she we they me him her us them my your our their who what which where when why how some any each all only also very more most than then there here so such into over under about after before again just even one two three four five six seven eight nine ten first second next last new old good great people time day year way make made take use used get give going go come now today'.split(' '));
const aviation=new Set('fuselage cabin amenities aircraft airlines airline airport boarding turbulence baggage itinerary interline codeshare lavatory evacuation runway terminal terminals connectivity fleet cockpit passenger passengers aviation inflight aircrew departure arrival sustainability operational'.split(' '));
const months=new Set('january february march april may june july august september october november december monday tuesday wednesday thursday friday saturday sunday'.split(' '));
const IPA={AA:'ɑ',AE:'æ',AH:'ʌ',AO:'ɔ',AW:'aʊ',AY:'aɪ',B:'b',CH:'tʃ',D:'d',DH:'ð',EH:'ɛ',ER:'ɝ',EY:'eɪ',F:'f',G:'ɡ',HH:'h',IH:'ɪ',IY:'i',JH:'dʒ',K:'k',L:'l',M:'m',N:'n',NG:'ŋ',OW:'oʊ',OY:'ɔɪ',P:'p',R:'ɹ',S:'s',SH:'ʃ',T:'t',TH:'θ',UH:'ʊ',UW:'u',V:'v',W:'w',Y:'j',Z:'z',ZH:'ʒ'};
function evidence(phones){
  const list=phones.filter(x=>/^[A-Z]+[012]?$/.test(x));
  const nuclei=list.map((p,i)=>/[012]$/.test(p)?i:-1).filter(i=>i>=0);
  let start=0;const segments=nuclei.map((v,i)=>{const end=i===nuclei.length-1?list.length:v+1;const part=list.slice(start,end);start=end;return part.map(p=>p==='AH0'?'ə':p==='ER0'?'ɚ':IPA[p.replace(/[012]/g,'')]||p).join('');});
  return {arpabet:list.join(' '),syllableCount:nuclei.length,primaryStress:nuclei.map((v,i)=>list[v].endsWith('1')?i+1:0).filter(Boolean),phoneticSyllables:segments,segmentationStatus:'phoneme-grouping-assisted-not-orthographic-syllables'};
}
function splitVariants(entry){return (entry?.phones||[]).map(evidence).filter(v=>v.syllableCount);}
function loadExisting(root){
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),s={};s.window=s;vm.createContext(s);
  for(const f of ['reading-lab/data.js','reading-lab/ci-destinations.js','ci-vocabulary.js','ci-source-vocabulary.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),s);
  vm.runInContext(html.slice(html.indexOf('const PRONUNCIATION_ZH'),html.indexOf('let pronunciationWords')),s);
  return {words:s.ReadingLabData.words,places:s.ReadingLabData.places,meaning:word=>s.ciSourceMeaning(word)};
}
function candidateInfo(surface,context,lexicon,places){
  const key=normalize(surface),entry=lexicon[key]||{},variants=splitVariants(entry),syllables=Math.max(0,...variants.map(v=>v.syllableCount));
  const numeric=/^\d/.test(surface),model=/^(?:[AB]\d{3}(?:-\d+)?(?:neo|ceo|ER|LR|F|s)?|\d{3}(?:X|-\d+[A-Za-z]*))$/i.test(surface)||/^(777|787|747|737)$/.test(surface)&&/aircraft|boeing|fleet|model/i.test(context);
  const capital=/^\p{Lu}/u.test(surface),dictionaryName=/^\p{Lu}/u.test(entry.headword||'');
  const type=model?'model':numeric?'number':months.has(key)&&capital?'date':/^[A-Z][A-Z0-9-]{1,7}$/.test(surface)?'abbreviation':capital&&(places.has(key)||dictionaryName)?'proper':!entry.zh&&/^\p{Lu}\p{Ll}/u.test(surface)&&!context.trim().startsWith(surface)?'proper':'word';
  const reasons=[];if(type!=='word')reasons.push(type);if(syllables>=3)reasons.push('dictionary-3plus-syllables');
  if(variants.some(v=>v.primaryStress.some(n=>n>1)))reasons.push('dictionary-noninitial-stress');
  if(variants.length>1||entry.ipa?.length>1)reasons.push('multiple-pronunciations');
  if(aviation.has(key))reasons.push('aviation-terminology');
  if((entry.bnc>5000||entry.frq>5000)&&!stop.has(key))reasons.push('dictionary-low-frequency');
  if(!variants.length&&!stop.has(key))reasons.push('unlisted-pronunciation-needs-review');
  return {key,type,reasons,syllables,variants};
}
async function build(root=path.resolve(__dirname,'..'),{refresh=false}={}){
  const corpus=collect(root),existing=loadExisting(root),wanted=new Set();
  for(const a of corpus.articles)for(const t of tokens(a.text))wanted.add(normalize(t));
  for(const p of existing.places)wanted.add(normalize(p.en));for(const w of existing.words)wanted.add(normalize(w.word));
  const output=path.join(root,'generated');fs.mkdirSync(output,{recursive:true});
  const lexiconFile=path.join(output,'vocabulary-lexicon.json');
  const lexicon=refresh?await prepare(root,wanted):fs.existsSync(lexiconFile)?JSON.parse(fs.readFileSync(lexiconFile,'utf8')):null;
  if(!lexicon)throw Error('首次請執行 npm run build:vocabulary -- --refresh-lexicon，下載鎖定版本字典。');
  const placeMap=new Map([...existing.places.map(p=>[normalize(p.en),p]),...existing.words.filter(w=>/^[A-Z]/.test(w.word)).map(w=>[normalize(w.word),{...w,en:w.word}])]),seedMap=new Map(existing.words.map(w=>[normalize(w.word),w]));
  const phrases=[...new Set([...placeMap.keys(),...seedMap.keys()].filter(k=>k.includes(' ')))];
  const algorithmHash=hash(fs.readFileSync(__filename,'utf8')+fs.readFileSync(require.resolve('./vocabulary/corpus.cjs'),'utf8')+JSON.stringify([...placeMap.keys()]));
  const cachePath=path.join(root,'.cache/vocabulary/extractions.json');let cache={};try{cache=JSON.parse(fs.readFileSync(cachePath,'utf8'));}catch{}
  const nextCache={},records=new Map(),articleReport=[];let reused=0;
  const auditArticles=[];
  for(const article of corpus.articles){
    const usedKeys=[...new Set([...tokens(article.text).map(normalize),...phrases.filter(p=>article.text.toLowerCase().includes(p))])].sort();
    const articleDictionaryHash=hash(JSON.stringify(usedKeys.map(k=>[k,lexicon.entries[k]||null])));
    const cacheKey=hash([VERSION,algorithmHash,article.contentHash,articleDictionaryHash].join(':'));let hits=cache[cacheKey];
    if(hits)reused++;else{
      hits=[];
      article.sentences.forEach((sentence,index)=>{
        const surfaces=tokens(sentence);for(const phrase of phrases){const escaped=phrase.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const match=new RegExp(`(?<![\\p{L}])${escaped}(?![\\p{L}])`,'giu');for(const m of sentence.matchAll(match))surfaces.push(m[0]);}
        for(const surface of surfaces){const info=candidateInfo(surface,sentence,lexicon.entries,placeMap);hits.push({surface,index,...info});}
      });
    }
    nextCache[cacheKey]=hits;
    const unique=new Set();let occurrences=0;
    for(const hit of hits){
      if((!hit.reasons.length||stop.has(hit.key)&&hit.type==='word')&&!seedMap.has(hit.key))continue;
      const key=hit.type+':'+hit.key;unique.add(key);occurrences++;
      let word=records.get(key);
      if(!word){
        const entry=lexicon.entries[hit.key]||{},seed=seedMap.get(hit.key),place=placeMap.get(hit.key);
        const id=seed?.id||'vocab-'+hash(key).slice(0,16),status=entry.ipa?.length?(entry.ipa.length>1?'dictionary-multiple-readings-context-unresolved':hit.type==='proper'?'dictionary-name-local-reading-unconfirmed':'dictionary-listed'):'pending';
        word={id,word:seed?.word||hit.surface,normalized:hit.key,lemma:entry.exchange?.match(/(?:^|\/)0:([^/]+)/)?.[1]||hit.key,pos:entry.pos||'未判定',type:hit.type,difficulty:hit.type==='proper'||hit.type==='model'||hit.syllables>=5?'挑戰級':hit.syllables>=4?'高級':hit.syllables>=3?'中級':'初級',zh:place?.zh||existing.meaning(hit.key)||entry.zh||'',translationStatus:place||existing.meaning(hit.key)?'site-context-glossary':entry.zh?'ECDICT':'pending',ipa:entry.ipa?.join('；')||'',pronunciations:(entry.ipa||[]).map((ipa,i)=>({id:id+'-reading-'+i,ipa,source:lexicon.sources.ipa.url})),phoneticEvidence:hit.variants,pronunciationStatus:status,syllableCount:hit.syllables||null,primaryStress:hit.variants.map(v=>v.primaryStress),syllables:hit.variants.map(v=>v.phoneticSyllables.join(' · ')).join(' ／ '),reasons:hit.reasons,source:'全站文章自動擷取',sources:[],occurrences:0,seed:seed?.seed||false,url:'https://dictionary.cambridge.org/dictionary/english/'+encodeURIComponent(hit.key),note:'IPA 逐字取自鎖定版 ipa-dict；音節數與重音取自 CMUdict。發音音節分組為演算法輔助，不是字母拼字音節。多讀音保留全部選項，詞性與語境尚未自動判定。'};
        records.set(key,word);
      }
      let source=word.sources.find(s=>s.articleId===article.id);if(!source){source={articleId:article.id,sentenceIndices:[],count:0,surfaces:[]};word.sources.push(source);}
      if(!source.sentenceIndices.includes(hit.index))source.sentenceIndices.push(hit.index);
      if(!source.surfaces.includes(hit.surface))source.surfaces.push(hit.surface);source.count++;word.occurrences++;
    }
    const {text,...meta}=article;auditArticles.push(meta);
    articleReport.push({id:article.id,title:article.title,airlines:article.airlines,kind:article.kind,sourceFile:article.sourceFile,collection:article.collection,words:tokens(article.text).length,candidates:unique.size,occurrences,processed:true});
  }
  const words=[...records.values()].sort((a,b)=>a.normalized.localeCompare(b.normalized)||a.type.localeCompare(b.type));
  // Keep every original card ID, even when its source was removed or no longer qualifies.
  for(const w of existing.words)if(!words.some(x=>x.id===w.id))words.push({...w,normalized:normalize(w.word),type:placeMap.has(normalize(w.word))?'proper':'word',difficulty:'中級',sources:[],occurrences:0,pronunciationStatus:'pending',ipa:'',syllables:'',primaryStress:[],archived:true,note:'來源未在目前文章中找到；保留原有學習紀錄，讀音尚待確認。'});
  const counts={};for(const a of articleReport)for(const airline of a.airlines){counts[airline]||={};counts[airline][a.kind]=(counts[airline][a.kind]||0)+1;}
  const report={schema:VERSION,articleCount:articleReport.length,uniqueTextCount:new Set(corpus.articles.map(a=>a.contentHash)).size,processed:articleReport.length,withCandidates:articleReport.filter(a=>a.candidates>0).length,vocabularyCount:records.size,cardCount:words.length,pronunciationPending:words.filter(w=>w.pronunciationStatus==='pending').length,translationPending:words.filter(w=>!w.zh).length,counts,byType:Object.fromEntries([...new Set(words.map(w=>w.type))].sort().map(type=>[type,{total:words.filter(w=>w.type===type).length,pendingIPA:words.filter(w=>w.type===type&&w.pronunciationStatus==='pending').length,pendingChinese:words.filter(w=>w.type===type&&!w.zh).length}])),zeroCandidateArticles:articleReport.filter(a=>!a.candidates).map(a=>({id:a.id,title:a.title,reason:'已成功處理，但沒有符合目前規則的候選詞'})),failures:corpus.failures,excluded:{count:corpus.excluded.length,reason:'短問句、非英文、翻譯／UI 文案不作文章；程式、測試、字典與衍生檔案不重複掃描'},articles:articleReport};
  const index={schema:VERSION,sourceFiles:corpus.files,lexiconSources:lexicon.sources,report,articles:auditArticles,words};
  const eligible=words.filter(w=>w.ipa&&w.phoneticEvidence?.length&&w.sources.length);
  const sample=eligible.sort((a,b)=>hash(a.id+'audit-v1').localeCompare(hash(b.id+'audit-v1'))).slice(0,20).map(w=>({word:w.word,type:w.type,ipa:w.ipa,stress:w.primaryStress,phonemes:w.phoneticEvidence,source:articleReport.find(a=>a.id===w.sources[0].articleId),sentence:auditArticles.find(a=>a.id===w.sources[0].articleId).sentences[w.sources[0].sentenceIndices[0]],checks:{ipaExactDictionaryMatch:w.pronunciations.every(p=>lexicon.entries[w.normalized].ipa.includes(p.ipa)),cmuPhonemesExactMatch:w.phoneticEvidence.every(v=>lexicon.entries[w.normalized].phones.some(p=>p.join(' ')===v.arpabet)),sourceExists:true}}));
  fs.writeFileSync(lexiconFile,JSON.stringify(lexicon));fs.writeFileSync(path.join(output,'vocabulary-index.json'),JSON.stringify(index));fs.writeFileSync(path.join(output,'vocabulary-report.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(output,'vocabulary-audit.json'),JSON.stringify(sample,null,2));
  fs.mkdirSync(path.dirname(cachePath),{recursive:true});fs.writeFileSync(cachePath,JSON.stringify(nextCache));
  console.log(JSON.stringify({articles:report.articleCount,words:report.vocabularyCount,cards:report.cardCount,counts,failures:report.failures,reusedArticles:reused,reprocessedArticles:articleReport.length-reused,pendingIPA:report.pronunciationPending,pendingChinese:report.translationPending},null,2));
  if(corpus.failures.length)throw Error('有文章未成功解析，請查 generated/vocabulary-report.json');
  return {index,report,reused};
}
module.exports={build,candidateInfo,evidence,normalize};
if(require.main===module)build(process.cwd(),{refresh:process.argv.includes('--refresh-lexicon')}).catch(error=>{console.error(error);process.exitCode=1;});
