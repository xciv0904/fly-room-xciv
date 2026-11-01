const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const C=require('../reading-lab/curriculum.js');
const T=require('../reading-lab/training-core.js');
const article=(id,topics,text='An original passage about a distinct subject.')=>({id,title:id,topics,text,kind:'新聞稿',airline:'華航'});
const attempt=(id,a,extra={})=>({id,ts:1000,duration:60,questionId:a.id,title:a.title,original:a.text,errors:[],...extra});

test('cold start recommendations are deterministic, explain unseen selection, and preserve source data',()=>{
  const rows=[article('b',['food'],'The chef prepares rice.'),article('a',['service'],'The cabin offers seats.')];
  const before=JSON.stringify(rows),ranked=C.recommend(rows,[],{}, {now:10000});
  assert.deepEqual(ranked.map(x=>x.article.id),['a','b']);
  assert.equal(ranked[0].unseen,true);assert.match(ranked[0].reasons.join(' '),/尚未練習/);
  assert.equal(JSON.stringify(rows),before);
  assert.equal(C.TOPICS.length,6);
});

test('editorial topics take precedence and deterministic fallback exposes its evidence',()=>{
  assert.deepEqual(C.enrich(article('food',['food'],'Sustainable aviation fuel reduces carbon.')).topics,['food']);
  const fallback=C.enrich({title:'台積電 ESG',text:'The semiconductor company conserves water and uses renewable energy.'});
  assert.ok(fallback.topics.includes('business'));assert.ok(fallback.topics.includes('sustainability'));
  assert.equal(fallback.topicEvidence.find(x=>x.id==='business').method,'keyword');
  assert.ok(fallback.topicEvidence.find(x=>x.id==='business').examples.includes('台積電'));
  assert.deepEqual(C.enrich({title:'Unclassified',text:'A short excerpt.'}).topics,[]);
});

test('source metadata preserves supplied provenance and never invents an exam attribution or date',()=>{
  const a=C.enrich({title:'Official release',sourceUrl:'https://www.china-airlines.com/us/en/about/media/news/20240402.html',sourceScope:'Paragraphs 2–3',publicationDate:'2024-04-02'});
  assert.equal(a.sourceMeta.publisher,'China Airlines');assert.equal(a.sourceMeta.publisherInferred,true);
  assert.equal(a.sourceMeta.scope,'Paragraphs 2–3');assert.equal(a.sourceMeta.publicationDate,'2024-04-02');
  assert.equal(a.sourceMeta.examStatus,'practice-material');assert.equal(a.sourceMeta.provenance,'practice-source');
  assert.equal(C.enrich(a).sourceMeta.publisherInferred,true);
  assert.equal(C.enrich({sourceUrl:'https://example.org'}).sourceMeta.publicationDate,'');
});

test('burden reports transparent independent signals and treats missing frequency as unknown',()=>{
  const text='China Airlines uses SAF in 2025 to reduce emissions and emissions.';
  const b=C.burden(text,{longSentenceWords:6,lexicon:{entries:{emissions:{bnc:10000,frq:9000},airlines:{bnc:10000,frq:100}}}});
  assert.equal(b.wordCount,11);assert.equal(b.longSentences.count,1);
  assert.deepEqual(b.longSentences.examples[0],{text,wordCount:11});
  assert.ok(b.properNames.examples.includes('China'));assert.ok(b.properNames.examples.includes('Airlines'));
  assert.deepEqual(b.acronyms.examples,['SAF']);assert.deepEqual(b.numbers.examples,['2025']);
  assert.equal(b.lowFrequency.count,2);assert.deepEqual(b.lowFrequency.examples,['emissions']);
  assert.ok(b.lowFrequency.unknownCount>0);assert.equal(C.burden(text).lowFrequency.count,null);
  assert.match(b.note,/不是/);
});

test('topic coverage counts distinct passages, and another attempt on the same passage adds no coverage',()=>{
  const a=article('service',['service'],'The cabin has new seats.'),b=article('food',['food'],'The menu includes rice.');
  const duplicate={...a,id:'same-content-another-id'},sessions=[attempt('one',a),attempt('two',a,{ts:2000})];
  const coverage=C.topicCoverage([a,b,duplicate],sessions);
  assert.deepEqual(coverage.find(x=>x.id==='service'),{id:'service',label:'航空服務',total:1,practiced:1,remaining:0,ratio:1});
  assert.equal(coverage.find(x=>x.id==='food').practiced,0);
  const progress=C.assessProgress(sessions);
  assert.equal(progress.passagesPracticed,1);assert.equal(progress.newPassageSessions,1);assert.equal(progress.sameTextAttempts,1);
});

test('loaded or interrupted attempts do not turn an unfamiliar article into practiced coverage',()=>{
  const a=article('a',['service']);
  const sessions=[attempt('loaded',a,{duration:0,transcript:a.text}),attempt('interrupted',a,{interrupted:true})];
  assert.equal(C.topicCoverage([a],sessions).find(x=>x.id==='service').practiced,0);
  assert.equal(C.recommend([a],sessions)[0].unseen,true);
});

test('recommendations favor a less covered topic among unfamiliar passages',()=>{
  const old=article('old',['service'],'Passengers board the cabin.'),extra=article('extra',['service'],'New seats are available.'),food=article('food',['food'],'A seasonal menu is available.');
  const ranked=C.recommend([old,extra,food],[attempt('practice',old)]);
  assert.deepEqual(ranked.map(x=>x.article.id),['food','extra','old']);
  assert.ok(ranked[0].reasons.some(x=>x.includes('餐飲設備已練 0／1')));
});

test('unseen remains a hard priority even if a practiced text contains confirmed weaknesses',()=>{
  const a=article('old',['sustainability'],'Carbon emissions require attention.'),b=article('new',['food'],'The menu includes rice.');
  const s=attempt('old-session',a,{errors:[{original:'emissions',confirmed:true,category:'stress'}]});
  const ranked=C.recommend([a,b],[s]);
  assert.equal(ranked[0].article.id,'new');assert.equal(ranked[1].weaknessMatches.length,1);
});

test('only human-confirmed unresolved issues affect weakness matching',()=>{
  const a=article('base',['sustainability'],'Carbon emissions matter.'),b=article('match',['sustainability'],'The new emissions policy applies.'),c=article('other',['sustainability'],'Water conservation matters.');
  const unconfirmed=attempt('unconfirmed',a,{errors:[{original:'emissions',confirmed:false}]});
  assert.equal(C.assessProgress([unconfirmed]).historicalConfirmed,0);
  assert.equal(C.recommend([b,c],[unconfirmed]).find(x=>x.article.id==='match').weaknessMatches.length,0);
  const confirmed={...unconfirmed,errors:[{original:'emissions',confirmed:true,category:'stress'}]};
  const ranked=C.recommend([b,c],[confirmed]);
  assert.equal(ranked[0].article.id,'match');assert.equal(ranked[0].weaknessMatches.length,1);
  assert.ok(ranked[0].reasons.some(x=>x.includes('人工確認')));
});

test('a verified later practice resolves an issue without erasing historical confirmed evidence',()=>{
  const a=article('base',['sustainability'],'Carbon emissions matter.'),s=attempt('origin',a,{errors:[{original:'emissions',confirmed:true,category:'stress',status:'resolved'}]});
  const issueId=T.issueId(s,s.errors[0],0);
  assert.equal(C.assessProgress([s]).unresolvedCount,1,'editing baseline status is not verification');
  const retry=attempt('retry',a,{ts:2000,baselineId:s.id,practiceType:'retry',targetIssueIds:[issueId],reviewResults:[{issueId,status:'resolved'}]});
  const progress=C.assessProgress([s,retry]);
  assert.equal(progress.historicalConfirmed,1);assert.equal(progress.unresolvedCount,0);assert.equal(progress.resolvedCount,1);
  assert.equal(progress.transferVerifiedCount,0);assert.equal(progress.sameTextAttempts,1);
  assert.equal(C.recommend([a],[s,retry])[0].weaknessMatches.length,0);
});

test('cross-text verification requires a distinct passage and repeated text is never counted as transfer',()=>{
  const a=article('base',['sustainability'],'Carbon emissions matter.'),s=attempt('origin',a,{errors:[{original:'emissions',confirmed:true,category:'stress'}]});
  const issueId=T.issueId(s,s.errors[0],0),clone={...a,id:'duplicate-source-id',text:'Carbon emissions matter!'};
  const verification={ts:2000,baselineId:s.id,practiceType:'transfer',targetIssueIds:[issueId],reviewResults:[{issueId,status:'resolved'}]};
  const fake=attempt('fake-transfer',clone,verification);
  assert.equal(C.assessProgress([s,fake]).transferVerifiedCount,0);
  assert.equal(C.assessProgress([s,fake]).passagesPracticed,1);
  const b=article('new',['sustainability'],'The emissions policy applies to new factories.'),transfer=attempt('transfer',b,verification);
  assert.equal(C.assessProgress([s,transfer]).transferVerifiedCount,1);
  const recurrence=attempt('recurrence',b,{ts:3000,errors:[{original:'emissions',confirmed:true,category:'stress'}]});
  const progress=C.assessProgress([s,recurrence]);
  assert.equal(progress.crossTextRepetitions.length,1);assert.equal(progress.crossTextRepetitions[0].passages,2);
});

test('current draft is excluded when alternatives exist, filters apply, and ties can use injected randomness',()=>{
  const a=article('a',['service'],'First cabin.'),b=article('b',['service'],'Second cabin.');
  assert.equal(C.recommend([a,b],[],{}, {draftId:'a'})[0].article.id,'b');
  assert.equal(C.recommend([a],[],{}, {draftId:'a'})[0].article.id,'a');
  assert.equal(C.recommend([a,b],[],{topic:'food'}).length,0);
  assert.equal(C.recommend([a,b],[],{}, {random:()=>0})[0].article.id,'b');
});

test('browser global exports work without a module loader and legacy confirmed issues remain pending',()=>{
  const root={};root.window=root;vm.createContext(root);
  vm.runInContext(fs.readFileSync(require.resolve('../reading-lab/curriculum.js'),'utf8'),root);
  const progress=root.ReadingCurriculum.assessProgress([{id:'legacy',questionId:'old',ts:1,duration:5,original:'Old source.',errors:[{original:'source',confirmed:true,status:'resolved'}]}]);
  assert.equal(progress.historicalConfirmed,1);assert.equal(progress.unresolvedCount,1);
});
