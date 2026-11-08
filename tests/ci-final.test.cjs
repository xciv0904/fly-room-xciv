const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const prep=require('../ci-final-data.js');
function legacy(){const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../question-bank.js'),'utf8'),sandbox);return JSON.parse(JSON.stringify(sandbox.window.__QUESTION_BANK__)).map((row,id)=>({...row,id}));}
test('every requested main question, follow-up and English prompt has a complete bilingual draft',()=>{
  const expected=['R1','R2','R3','R4','N1.main','N1.follow','N2.main','N2.follow.ai','N2.follow.friend','N3.main','N3.follow','N4.main','N4.follow','N5.main','N5.follow','N6.main','N6.follow','A1','A2',...Array.from({length:18},(_,i)=>`P${i+1}`),'E1','E2.company','E2.now','E3','E4','E5','E6'];
  assert.deepEqual(new Set(prep.items.flatMap(row=>row.coverage)),new Set(expected));
  assert.equal(prep.items.length,39);assert.equal(new Set(prep.items.map(row=>row.key)).size,39);
  assert.equal(prep.items.filter(row=>row.kind==='asked').length,4);assert.equal(prep.englishPrompts.length,6);
  for(const row of prep.items){
    assert.match(row.q_zh,/\p{Script=Han}/u);assert.ok(row.q_en.length>15);assert.ok(row.a_zh.length>70);assert.ok(row.a_en.split(/\s+/).length>=45);
    if(row.parentKey)assert.ok(prep.byKey[row.parentKey]);
    for(const key of row.sources)assert.ok(prep.sources[key],`${row.key}: ${key}`);
    if(row.fact)assert.ok(row.sources.some(key=>prep.sources[key].date));
  }
  for(const prompt of prep.englishPrompts)for(const key of prompt.keys)assert.ok(prep.byKey[key].englishCore);
});
test('integrating drafts reuses existing IDs, preserves other-airline answers, and is idempotent',()=>{
  const bank=legacy(),before=structuredClone(bank),joined=prep.attach(bank);
  for(let i=0;i<before.length;i++){
    assert.equal(joined.bank[i].id,before[i].id);assert.equal(joined.bank[i].q_zh,before[i].q_zh);
    assert.equal(joined.bank[i].a_zh,before[i].a_zh);assert.equal(joined.bank[i].a_en,before[i].a_en);
    for(const [air,answer] of Object.entries(before[i].variants||{}))if(air!=='華航')assert.deepEqual(joined.bank[i].variants[air],answer);
  }
  assert.equal(joined.items.find(row=>row.key==='intro').id,0);
  for(const id of [0,48,49,81]){
    assert.equal(joined.bank[id].variants['華航'].a_zh,prep.byKey.intro.a_zh);
    assert.equal(joined.bank[id].variants['華航'].a_en,prep.byKey.intro.a_en);
    assert.equal(joined.bank[id].variants['華航'].a_ko,prep.byKey.intro.a_ko);
  }
  assert.equal(joined.items.find(row=>row.key==='hotel-vs-cabin').id,46);
  const matched=prep.items.filter(row=>row.match?.length).length;
  assert.equal(joined.bank.length,before.length+39-matched);
  assert.equal(new Set(joined.bank.map(row=>row.id)).size,joined.bank.length);
  const again=prep.attach(joined.bank);assert.equal(again.bank.length,joined.bank.length);
  assert.deepEqual(again.items.map(row=>row.id),joined.items.map(row=>row.id));
});
test('news qualifications and personal-story boundaries survive into the downloadable study guide',()=>{
  const md=prep.markdown();assert.equal((md.match(/^## \d+\./gm)||[]).length,39);
  assert.match(prep.byKey['sustainability'].tip,/Book & Claim/);assert.match(prep.byKey['fleet-news'].tip,/不要.*已交機/);
  assert.match(prep.byKey['exceed-expectations'].a_en,/Canadian guest/);assert.match(prep.byKey['digital-service'].a_en,/Colombian guest/);
  assert.match(prep.byKey['harassment'].tip,/碰觸是本題假設/);assert.match(prep.byKey['power-bank'].tip,/年度安全議題/);
  assert.ok(md.includes(prep.byKey.intro.a_ko));assert.equal(prep.byKey.intro.updatedAt,'2026-11-09');
  assert.equal(fs.readFileSync(require.resolve('../docs/華航複試雙語擬答-2026-11-08.md'),'utf8'),md+'\n');
});
