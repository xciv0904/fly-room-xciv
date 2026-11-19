const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const records=require('../ci-interview-records-data.js'),prep=require('../ci-final-data.js');
test('November 14 session preserves actual format and distinguishes self and peer provenance',()=>{
  assert.equal(records.session.date,'2026-11-14');assert.equal(records.session.stage,'空服員複試');
  assert.equal(records.session.candidates,3);assert.equal(records.session.interviewers,5);
  assert.equal(records.session.introduction,false);assert.equal(records.session.rounds,2);
  assert.equal(records.records.length,3);assert.deepEqual(records.records.map(r=>r.provenance),['self','self','peer']);
  assert.deepEqual(records.records.map(r=>r.question.language),['zh-TW','en-US','en-US']);
  assert.equal(records.records[2].original,null);assert.equal(records.records[2].round,null,'do not invent a precise round for the other candidate');
  for(const row of records.records){assert.ok(row.reference.zh);assert.ok(row.reference.en);assert.ok(row.reference.shortEn);assert.ok(row.analysis.structure.length);assert.ok(row.analysis.phrases.length);assert.equal(row.score,undefined);assert.equal(row.interviewerReaction,undefined);assert.equal(row.result,undefined);}
});
test('raw answers remain exact including the victim typo, lowercase, and grammatical errors',()=>{
  const [drama,rice]=records.records;
  assert.equal(drama.original.raw,'我回答模範計程車，他主要是在講有一個替弱勢族群復仇的神秘組織，法律有時候沒辦法處罰受害者時這個組織就會幫助被害者，也讓弱勢的一方得以聲張正義。');
  assert.match(drama.original.note,/法律無法懲罰加害者/);
  assert.equal(rice.original.raw,"cook rice? well i'm not very good at cooking, but i thought it needs to wash rice at first, then put it in the pot and just waiting till it be nice");
  assert.notEqual(rice.original.raw,rice.reference.en);assert.match(rice.original.meaningZh,/等它煮好/);
  assert.equal(rice.analysis.corrections.length,5);assert.match(rice.reference.en,/add the right amount of water/);assert.match(rice.reference.en,/press the start button/);
  assert.ok(rice.original.raw.includes('just waiting till it be nice'));
});
test('records append to existing IDs and use reference drafts without replacing originals',()=>{
  const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../question-bank.js'),'utf8'),sandbox);
  const bank=JSON.parse(JSON.stringify(sandbox.window.__QUESTION_BANK__)).map((row,id)=>({...row,id})),before=structuredClone(bank),joined=prep.attach(bank);
  for(let i=0;i<before.length;i++){assert.equal(joined.bank[i].id,before[i].id);assert.equal(joined.bank[i].a_en,before[i].a_en);assert.equal(joined.bank[i].a_zh,before[i].a_zh);}
  assert.equal(prep.items.length,192);assert.equal(prep.essentialItems.length,50);assert.equal(prep.news54.allKeys.length,114);
  for(let i=0;i<189;i++)assert.equal(prep.items[i].id,-11001-i);
  for(const [i,record] of records.records.entries()){
    const row=prep.byKey[record.key];assert.equal(row.id,-11190-i);assert.equal(row.kind,record.provenance==='self'?'asked':'peer-asked');
    assert.equal(row.a_en,record.reference.en);assert.equal(row.a_zh,record.reference.zh);assert.deepEqual(row.interviewRecord.original,record.original);
    assert.equal(row.group,'真實面試紀錄');assert.equal(row.topic,'everyday');assert.equal(row.essentialRank,undefined);assert.equal(row.parentKey,undefined);assert.equal(row.fu,undefined);
    assert.deepEqual(joined.items.find(x=>x.key===record.key).interviewRecord,record);
  }
  assert.deepEqual(prep.attach(joined.bank).items.map(x=>x.id),joined.items.map(x=>x.id));
});
test('export includes exact originals, bilingual/short references, corrections, metadata and procedural frame',()=>{
  const md=prep.markdown({scope:'records'});assert.equal((md.match(/^### \d+\./gm)||[]).length,3);
  assert.ok(md.includes(records.session.format));assert.match(md,/同組考生3人（包含本人）；考官5人/);
  for(const r of records.records){for(const s of [r.reference.zh,r.reference.en,r.reference.shortEn])assert.ok(md.includes(s));if(r.original)assert.ok(md.includes(r.original.raw));}
  assert.match(md,/同組考生被問，非本人作答/);assert.match(md,/非考官官方評分/);assert.match(md,/法律無法懲罰加害者/);
  for(const step of records.howTo.steps)assert.ok(md.includes(step.en));assert.deepEqual(records.howTo.targetSeconds,[15,30]);
  assert.deepEqual(records.records.filter(r=>r.trainingType==='how-to').map(r=>r.key),['real-20261114-rice','real-20261114-noodles']);
  assert.equal(fs.readFileSync(require.resolve('../docs/華航複試真實題目-2026-11-14.md'),'utf8'),md+'\n');
});
test('vocabulary extraction uses the three reference drafts and excludes error-preserving originals',()=>{
  const {collect}=require('../scripts/vocabulary/corpus.cjs'),path=require('node:path');
  const corpus=collect(path.resolve(__dirname,'..')),added=corpus.articles.filter(row=>row.sourceFile==='ci-interview-records-data.js');
  assert.equal(added.length,3);assert.deepEqual(new Set(added.map(row=>row.text)),new Set(records.records.map(row=>row.reference.en)));
  assert.ok(!corpus.articles.some(row=>row.text===records.records[1].original.raw));
});
