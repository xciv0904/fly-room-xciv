const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const prep=require('../ci-final-data.js');
function legacy(){const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../question-bank.js'),'utf8'),sandbox);return JSON.parse(JSON.stringify(sandbox.window.__QUESTION_BANK__)).map((row,id)=>({...row,id}));}
test('every requested main question, follow-up and English prompt has a complete bilingual draft',()=>{
  const expected=['R1','R2','R3','R4','N1.main','N1.follow','N2.main','N2.follow.ai','N2.follow.friend','N3.main','N3.follow','N4.main','N4.follow','N5.main','N5.follow','N6.main','N6.follow','A1','A2',...Array.from({length:18},(_,i)=>`P${i+1}`),'E1','E2.company','E2.now','E3','E4','E5','E6',...Array.from({length:12},(_,i)=>[`I${i+1}.main`,`I${i+1}.follow`]).flat()];
  expected.push(...Array.from({length:8},(_,i)=>`J${i+1}`),...Array.from({length:6},(_,i)=>`S${i+1}`));
  expected.push(...Array.from({length:10},(_,i)=>`IMP${i+1}.main`),...['1','2','3','5'].map(n=>`IMP${n}.follow`));
  expected.push(...Array.from({length:54},(_,i)=>[`NEWS54.${i+1}.main`,`NEWS54.${i+1}.follow`]).flat(),...Array.from({length:6},(_,i)=>`NEWS54.extra${i+1}.main`));
  assert.deepEqual(new Set(prep.items.flatMap(row=>row.coverage)),new Set(expected));
  assert.equal(prep.items.length,189);assert.equal(new Set(prep.items.map(row=>row.key)).size,prep.items.length);
  assert.equal(prep.items.filter(row=>row.kind==='asked').length,4);assert.equal(prep.englishPrompts.length,6);
  for(const row of prep.items){
    assert.match(row.q_zh,/\p{Script=Han}/u);assert.ok(row.q_en.length>15);assert.ok(row.a_zh.length>(row.kind==='followup'?50:70));assert.ok(row.a_en.split(/\s+/).length>=(row.kind==='followup'?(row.coverage.some(code=>code.startsWith('NEWS54.'))?30:35):45),row.key);
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
  assert.equal(joined.bank.length,before.length+prep.items.length-matched);
  assert.equal(new Set(joined.bank.map(row=>row.id)).size,joined.bank.length);
  const again=prep.attach(joined.bank);assert.equal(again.bank.length,joined.bank.length);
  assert.deepEqual(again.items.map(row=>row.id),joined.items.map(row=>row.id));
});
test('news qualifications and personal-story boundaries survive into the downloadable study guide',()=>{
  const md=prep.markdown();assert.equal((md.match(/^### \d+\./gm)||[]).length,50);
  assert.match(prep.byKey['sustainability'].tip,/Book & Claim/);assert.match(prep.byKey['fleet-news'].tip,/不要.*已交機/);
  assert.match(prep.byKey['exceed-expectations'].a_en,/Canadian guest/);assert.match(prep.byKey['digital-service'].a_en,/Colombian guest/);
  assert.match(prep.byKey['harassment'].tip,/碰觸是本題假設/);assert.match(prep.byKey['power-bank'].tip,/年度安全議題/);
  assert.ok(md.includes(prep.byKey.intro.a_ko));assert.equal(prep.byKey.intro.updatedAt,'2026-11-13');
  assert.equal(fs.readFileSync(require.resolve(`../docs/華航複試精選50題-${prep.checkedAt}.md`),'utf8'),md+'\n');
  assert.equal(fs.readFileSync(require.resolve(`../docs/華航複試雙語擬答-${prep.checkedAt}.md`),'utf8'),prep.markdown({scope:'all'})+'\n');
  assert.equal((prep.markdown({scope:'all'}).match(/^### \d+\./gm)||[]).length,prep.items.length);
});
test('exactly 50 distinct essentials cover six explicit topics and all extensions stay classified',()=>{
  assert.equal(prep.essentialItems.length,50);assert.equal(new Set(prep.essentialItems.map(row=>row.key)).size,50);
  assert.deepEqual(prep.topics.map(topic=>topic.keys.length),[8,8,8,8,10,8]);
  assert.deepEqual(prep.essentialItems.map(row=>row.essentialRank),Array.from({length:50},(_,i)=>i+1));
  for(const row of prep.items)assert.equal(prep.topics.filter(topic=>topic.key===row.topic).length,1);
  for(const topic of prep.topics)assert.deepEqual(prep.essentialItems.filter(row=>row.topic===topic.key).map(row=>row.key),topic.keys);
  const scenarios=prep.items.filter(row=>row.kind==='scenario');assert.equal(scenarios.length,14);
  assert.ok(scenarios.every(row=>row.essentialRank&&row.id<-11063));
  assert.equal(prep.essentialItems.filter(row=>row.kind==='asked').length,4);
  assert.match(prep.byKey['supervisor-false-explanation'].a_zh,/不會明知不實/);
  assert.match(prep.byKey['anonymous-passenger-story'].a_zh,/不寫姓名仍可能/);
  assert.match(prep.byKey['uniform-social-post'].tip,/實際規範/);
  assert.ok(prep.byKey['allergen-uncertainty'].sources.includes('mealAllergens'));
  assert.ok(!prep.byKey['western-sydney-opening'].essentialRank);assert.ok(prep.byKey['western-sydney-opening'].topic);
});
test('industry expansion retains original question IDs and each historical verification date',()=>{
  const originalKeys=['intro','preparation','delay-honesty','social-media','runway-news','delay-pressure','privacy-news','ai-translation','passenger-lookup','theme-flight','countdown-turbulence','fleet-news','learning-procedures','safety-role','senior-safety','sustainability','eco-objection','power-bank','digital-service','why-cabin-crew','why-china-airlines','growth','why-hire','reliability','service-mistake','unavailable-request','exceed-expectations','proactive-boundaries','korean','harassment','prioritisation','colleague-promise','filming','unfamiliar-equipment','fatigue','not-selected','life-learning','why-now','hotel-vs-cabin'];
  for(const [i,key] of originalKeys.entries()){
    assert.equal(prep.items[i].key,key);assert.equal(prep.byKey[key].id,-11001-i);
    assert.equal(prep.byKey[key].checkedAt,key==='intro'?'2026-11-13':['fleet-news','why-china-airlines','why-hire','hotel-vs-cabin'].includes(key)?'2026-11-11':'2026-11-08');
  }
  const industry=prep.items.filter(row=>row.group==='航空業時事');
  assert.equal(industry.length,24);assert.equal(industry.filter(row=>row.kind==='news').length,12);
  for(const row of industry){
    assert.equal(row.checkedAt,'2026-11-10');assert.ok(row.id<-11039);
    if(row.kind==='news'){
      assert.ok(row.fact_en.length>60);assert.ok(row.eventDate);assert.ok(row.newsStatus);
      const children=industry.filter(child=>child.parentKey===row.key);assert.equal(children.length,1);assert.equal(children[0].kind,'followup');
    }else assert.ok(industry.some(parent=>parent.key===row.parentKey&&parent.kind==='news'));
  }
  assert.match(prep.byKey['miami-cargo-accident'].newsStatus,/初步.*未有最終/);
  assert.match(prep.byKey['korean-asiana-integration'].fact,/未來日期/);
  assert.match(prep.byKey['middle-east-airspace'].fact,/不是全球/);
  assert.match(prep.byKey['ebola-travel-attestation'].fact,/豁免與期限/);
  assert.match(prep.markdown(),/查核：2026-11-08/);assert.match(prep.markdown(),/查核：2026-11-10/);
});
test('approved import merges duplicate prompts and keeps tea primary, Miffy, and original alternatives',()=>{
  const joined=prep.attach(legacy()),tea=prep.byKey['livery-design'],miffy=prep.byKey['ip-livery'],suggestions=prep.byKey['company-suggestions'];
  assert.equal(joined.items.find(row=>row.key==='livery-design').id,60);
  assert.equal(joined.items.find(row=>row.key==='why-not-other-airlines').id,268);
  assert.equal(joined.items.find(row=>row.key==='company-suggestions').id,270);
  assert.match(tea.answerLabel,/第一版.*茶文化/);assert.match(tea.a_zh,/茶杯.*蒸氣/);
  assert.ok(!tea.a_zh.includes('穿山甲'));assert.match(tea.answerAlternatives[0].label,/第二版.*穿山甲/);
  assert.match(tea.answerAlternatives[0].a_en,/endemic subspecies/);
  assert.match(tea.answerAlternatives[0].fu[0].a,/黑面琵鷺/);
  assert.deepEqual(joined.bank[60].variants['華航'].fu,[]);
  assert.match(joined.bank[60].variants['華航'].a_zh,/臺灣茶文化/);
  assert.match(miffy.a_zh,/跟著 Miffy 探索臺灣/);assert.match(miffy.a_en,/Exploring Taiwan with Miffy/);
  assert.equal(miffy.parentKey,'livery-design');assert.ok(!JSON.stringify(prep.items).includes('咖波'));
  assert.equal(prep.items.filter(row=>row.key==='why-not-other-airlines').length,1);
  assert.deepEqual(suggestions.coverage,['IMP8.main','IMP9.main','IMP10.main']);
  assert.match(suggestions.answerAlternatives[0].a_zh,/輕便外搭/);
  assert.match(suggestions.answerAlternatives[1].a_zh,/角色扮演/);
  assert.ok(suggestions.sources.includes('employeeWorkplace'));assert.ok(suggestions.sources.includes('communityEducation'));
  assert.match(prep.byKey.intro.a_ko,/프런트 데스크에서 일하고 있습니다/);
  assert.match(prep.byKey.intro.a_ko,/안전하고 편안한 비행을 만들고 싶습니다/);
  assert.match(prep.byKey.intro.answerAlternatives[1].a_ko,/프런트 데스크 직원으로/);
  assert.match(prep.byKey.intro.answerAlternatives[0].a_ko,/확장하여 해서/);
  assert.match(prep.byKey['other-airline-applications'].personalCheck,/實際申請情況/);
  const md=prep.markdown({scope:'all'});
  for(const text of [tea.a_zh,tea.a_en,tea.answerAlternatives[0].a_zh,miffy.a_zh,suggestions.answerAlternatives[0].a_en,prep.byKey.intro.answerAlternatives[0].a_ko])assert.ok(md.includes(text));
  assert.match(prep.byKey['fleet-news'].fact,/11\/6/);assert.equal(prep.byKey['fleet-news'].checkedAt,'2026-11-11');
});

test('reviewed workbook collection preserves history and supplies all 228 bilingual answers',()=>{
  const news=require('../ci-news54-data.js'),historical=require('./fixtures/ci-final-legacy-ids.json');
  for(const [key,id]of Object.entries(historical))assert.equal(prep.byKey[key].id,id,`Saved history for ${key}`);
  assert.equal(news.main.length,54);assert.equal(news.bonus.length,6);
  assert.equal(prep.news54.mainKeys.length,60);assert.equal(new Set(prep.news54.allKeys).size,114);
  for(const entry of [...news.main,...news.bonus]){
    const row=prep.byKey[entry.key];assert.equal(row.a_zh,entry.a_zh);assert.equal(row.a_en,entry.a_en);
    const words=entry.a_en.split(/\s+/).length,characters=[...entry.a_zh.matchAll(/\p{Script=Han}/gu)].length;
    assert.ok(words>=55&&words<=90,`${entry.key}: English must remain a short spoken answer`);
    assert.ok(characters>=90&&characters<=155,`${entry.key}: Chinese must remain a short spoken answer`);
    assert.doesNotMatch(entry.a_zh+entry.a_en,/文化藝術中心|cultural center|待本人確認|\[Add|［補/);
    if(entry.followKey){
      const follow=prep.byKey[entry.followKey];assert.equal(follow.parentKey,entry.key);
      assert.equal(follow.q_zh,entry.follow_zh);assert.equal(follow.q_en,entry.follow_en);
      assert.equal(follow.a_zh,entry.follow_a_zh);assert.equal(follow.a_en,entry.follow_a_en);
    }
  }
  assert.match(prep.byKey['ip-livery'].a_zh,/Miffy/);assert.match(prep.byKey['news54-18-follow'].a_en,/KLM.*KrisShop/);
  assert.match(prep.byKey['news54-13'].a_en,/Book & Claim/);
  assert.match(prep.byKey['news54-22'].a_en,/wheel pie.*duck and truffle/i);
  assert.match(prep.byKey['news54-25-follow'].a_en,/review/);
  assert.match(prep.byKey['news54-47-follow'].a_en,/Colombian.*late checkout/s);
  const md=prep.markdown({scope:'news54'});assert.equal((md.match(/^### \d+\./gm)||[]).length,114);
  assert.equal(fs.readFileSync(require.resolve(`../docs/華航新聞54題與加碼6題-${prep.checkedAt}.md`),'utf8'),md+'\n');
});
