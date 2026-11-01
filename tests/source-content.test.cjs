const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const sandbox={};sandbox.window=sandbox;vm.createContext(sandbox);vm.runInContext(fs.readFileSync(require.resolve('../reading-lab/source-articles.js'),'utf8'),sandbox);
const S=sandbox.ReadingLabSources;
test('gap topics have traceable original reading tasks and explicit study-only provenance',()=>{
  assert.equal(S.articles.length,5);
  assert.equal(new Set(S.articles.map(a=>a.id)).size,5);
  for(const a of S.articles){
    assert.equal(a.studyOnly,true);assert.equal(a.provenance,'practice-source');
    assert.ok(a.studyOnlyReason.includes('不納入正式'));assert.ok(a.rightsNote.includes('全文請至原文閱讀'));
    assert.ok(a.publisher);assert.match(a.publishedAt,/^20\d{2}-\d{2}-\d{2}$/);assert.equal(a.verifiedAt,'2026-11-02');
    assert.ok(['www.china-airlines.com','esg.tsmc.com.tw'].includes(new URL(a.sourceUrl).hostname));
    assert.ok(a.scope);assert.ok(a.readingTask);assert.equal(a.readingPrompts.length,3);assert.ok(a.vocabulary.length>=4);
    const quoted=[...a.sentences,...a.vocabulary.map(v=>v.word)].join(' ');
    assert.ok(quoted.split(/\s+/).length<=25,`${a.id}: quotation and term budget`);
    assert.ok(a.vocabulary.every(v=>v.zh&&!v.ipa),'do not invent source-word IPA');
    assert.ok(a.topics.every(t=>['service','food','sustainability','business','culture','travel'].includes(t)));
  }
  assert.ok(S.articles.some(a=>a.title.includes('降噪')));assert.ok(S.articles.some(a=>a.title.includes('米香')));
  assert.ok(S.articles.some(a=>a.title.includes('SAF')));assert.ok(S.articles.some(a=>a.title.includes('齊柏林')));assert.ok(S.articles.some(a=>a.title.includes('台積電')));
});
test('legacy issue dates preserve trace URLs and distinguish original-link verification from excerpt verification',()=>{
  const a={id:'old',source:'Dynasty-2025-Spring.pdf｜雜誌第 02 頁',sourceUrl:'https://example.com/local-copy',sentences:['Original source sentence.']};
  const result=S.enrich(a);assert.equal(result.sourceUrl,a.sourceUrl);assert.equal(result.publishedAt,'2025-Spring');assert.equal(result.datePrecision,'issue');
  assert.equal(result.publicationYear,2025);assert.equal(result.publisher,'中華航空《Dynasty》');assert.equal(result.verifiedAt,undefined);
  assert.equal(result.verificationStatus,'original-link-verified');assert.equal(result.sentences,a.sentences);assert.equal(S.metadataById.old.publishedAt,'2025-Spring');
  assert.equal(result.originalUrlVerifiedAt,'2026-11-02');assert.equal(result.excerptVerified,false);assert.equal(result.printedPage,2);
  assert.ok(result.originalUrl.endsWith('/Dynasty-2025-Spring.pdf'));assert.ok(result.sourceScope.includes('雜誌第 02 頁'));
  const undated=S.enrich({id:'undated',source:'使用者提供的原稿'});assert.equal(undated.publishedAt,undefined);assert.equal(undated.verifiedAt,undefined);
});
test('all known Dynasty formal passages link the exact issue without inventing broadcast or supplied-example originals',()=>{
  const index=JSON.parse(fs.readFileSync(require.resolve('../generated/vocabulary-index.json'),'utf8'));
  const formal=index.articles.filter(a=>a.airlines.includes('華航')&&['雜誌','新聞稿','廣播詞'].includes(a.kind)).map(a=>S.enrich(a));
  assert.equal(formal.length,64);assert.equal(formal.filter(a=>a.originalUrl).length,58);
  for(const a of formal){
    if(a.kind==='廣播詞'||a.title.startsWith('State Library')){assert.equal(a.originalUrl,undefined);continue;}
    const issue=S.dynastyIssues[a.publishedAt];assert.ok(issue,a.title);assert.equal(a.originalUrl,issue.originalUrl);assert.ok(a.printedPage>0,a.title);
    assert.equal(a.sourceTraceUrl,a.sourceUrl);assert.equal(a.datePrecision,'issue');assert.equal(a.excerptVerified,false);
  }
  assert.equal(Object.keys(S.dynastyIssues).length,9);
});
