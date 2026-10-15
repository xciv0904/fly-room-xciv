const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),{build,candidateInfo}=require('../scripts/build-vocabulary.cjs'),{collect,tokens,hash}=require('../scripts/vocabulary/corpus.cjs');
const index=JSON.parse(fs.readFileSync(path.join(root,'generated/vocabulary-index.json'))),lexicon=JSON.parse(fs.readFileSync(path.join(root,'generated/vocabulary-lexicon.json')));
test('complete raw-source corpus is covered, including pushed news and unrendered airline materials',()=>{
  const corpus=collect(root);assert.deepEqual(corpus.failures,[]);assert.equal(index.articles.length,corpus.articles.length);
  const reported=new Map(index.articles.map(a=>[a.id,a]));
  for(const a of corpus.articles){assert.equal(reported.get(a.id)?.contentHash,a.contentHash,a.title);assert.ok(index.report.articles.find(r=>r.id===a.id)?.processed);}
  assert.equal(index.report.counts['華航']['新聞稿'],20);
  assert.ok(index.report.counts['長榮']['朗讀文章']>=9);assert.equal(index.report.counts['星宇']['模擬朗讀'],96);
  assert.equal(index.words.length,new Set(index.words.map(w=>w.id)).size);
  assert.equal(index.words.filter(w=>w.seed).length,24);
  const keys=new Set();for(const w of index.words.filter(w=>!w.archived)){const key=w.type+':'+w.normalized;assert.ok(!keys.has(key));keys.add(key);assert.equal(w.occurrences,w.sources.reduce((n,s)=>n+s.count,0));for(const s of w.sources){const a=reported.get(s.articleId);assert.ok(a);for(const i of s.sentenceIndices){assert.ok(a.sentences[i]);assert.ok(s.surfaces.some(t=>a.sentences[i].includes(t)));}}}
});
test('at least twenty sampled IPA and stress records match pinned dictionaries and original sentences',()=>{
  const audit=JSON.parse(fs.readFileSync(path.join(root,'generated/vocabulary-audit.json')));assert.equal(audit.length,20);
  for(const w of audit){assert.ok(w.checks.ipaExactDictionaryMatch);assert.ok(w.checks.cmuPhonemesExactMatch);assert.ok(w.checks.sourceExists);assert.ok(w.stress.flat().length);assert.ok(w.sentence);}
  const multiple=index.words.find(w=>w.normalized==='record');assert.ok(multiple.pronunciations.length>1);assert.match(multiple.pronunciationStatus,/unresolved/);
  for(const w of index.words)if(w.pronunciationStatus==='pending')assert.equal(w.ipa,'');
  const synthetic={phones:[['AH0','B','IH1','L','AH0','T','IY0']],ipa:['/əˈbɪləti/'],zh:'能力'};
  assert.ok(candidateInfo('ability','Some ability is essential.',{ability:synthetic},new Map()).reasons.includes('dictionary-3plus-syllables'));
  assert.deepEqual(tokens('A350-1000 777-8F 777X 2026 NASA'),['A350-1000','777-8F','777X','2026','NASA']);
  assert.equal(candidateInfo('777-8F','Boeing aircraft',{},new Map()).type,'model');
  const names={china:{headword:'China',zh:'中國；瓷器'}};
  assert.equal(candidateInfo('China','China operates flights.',names,new Map()).type,'proper');assert.equal(candidateInfo('china','Fine china is served.',names,new Map()).type,'word');
});
test('new, modified, and deleted articles regenerate only affected extraction and preserve existing IDs',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'fly-room-vocabulary-'));
  try{
    const files=new Set([...index.sourceFiles.map(f=>f.file),'ci-vocabulary.js','ci-source-vocabulary.js','reading-lab/ci-destinations.js','generated/vocabulary-lexicon.json']);
    for(const file of files){const dest=path.join(dir,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,file),dest);}
    const baseline=await build(dir),fixture=path.join(dir,'articles','update-test.json');fs.mkdirSync(path.dirname(fixture));
    const text='International collaboration supports sustainability initiatives and environmental responsibility. The airline offers operational connectivity and excellent passenger amenities across destinations.';
    fs.writeFileSync(fixture,JSON.stringify([{id:'test-auto',airline:'長榮',title:'Temporary extraction integration test',text}]));
    const added=await build(dir);assert.equal(added.report.articleCount,baseline.report.articleCount+1);assert.ok(added.reused>=baseline.report.articleCount);
    const article=added.index.articles.find(a=>a.sourceFile==='articles/update-test.json');assert.ok(article);
    const word=added.index.words.find(w=>w.normalized==='sustainability');assert.ok(word.sources.some(s=>s.articleId===article.id));
    assert.equal(word.id,baseline.index.words.find(w=>w.normalized==='sustainability').id);
    fs.writeFileSync(fixture,JSON.stringify([{airline:'長榮',title:'Temporary extraction integration test',text:text.replace('sustainability','tourism')}]));
    const changed=await build(dir);assert.equal(changed.index.articles.find(a=>a.id===article.id).contentHash,hash(text.replace('sustainability','tourism')));assert.ok(!changed.index.words.find(w=>w.normalized==='sustainability').sources.some(s=>s.articleId===article.id));
    fs.unlinkSync(fixture);const removed=await build(dir);assert.equal(removed.report.articleCount,baseline.report.articleCount);assert.deepEqual(removed.index.words.map(w=>w.id),baseline.index.words.map(w=>w.id));
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('previous word progress and archived card identities survive validated backups',()=>{
  const C=require('../reading-lab/core.js'),id='vocab-abcdef1234';
  const b=C.validateBackup({kind:'fly-room-reading-lab',version:1,sessions:[],state:{words:{[id]:{status:'retry',attempts:2,updated:5}},wordCards:{[id]:{word:'sustainability',zh:'永續性'}}}});
  const next=C.mergeState({words:{'word-0':{status:'mastered',updated:7}},favorites:[],places:{},daily:{}},b.state);
  assert.equal(next.words['word-0'].status,'mastered');assert.equal(next.words[id].attempts,2);assert.equal(next.wordCards[id].word,'sustainability');assert.equal(next.wordCards[id].ipa,'');
});
