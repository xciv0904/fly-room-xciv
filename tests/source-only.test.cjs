const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const core=require('../reading-lab/core.js');
function learning(articles){const s={ReadingLabData:{words:[]},ReadingLabVocabulary:{index:{articles}},ReadingLabCore:core};s.window=s;vm.createContext(s);vm.runInContext(fs.readFileSync(require.resolve('../reading-lab/learning.js'),'utf8'),s);return s.ReadingLabLearning;}
test('formal exam uses only existing CI source material, never generated or other airlines',()=>{
 const data=JSON.parse(fs.readFileSync(require.resolve('../generated/vocabulary-index.json'),'utf8')),L=learning(data.articles),pool=L.examPool();assert.ok(pool.length>0);
 for(const q of pool){const source=data.articles.find(a=>a.id===q.id);assert.ok(source.airlines.includes('華航'));assert.ok(['雜誌','新聞稿','廣播詞'].includes(q.kind));assert.equal(q.text,source.sentences.join('\n'));assert.ok(!q.text.includes('The following practice report'));assert.equal(q.airline,'華航');assert.ok(q.words<=1000);}
 assert.ok(L.examPool({kind:'廣播詞'}).every(q=>q.kind==='廣播詞'));assert.ok(L.examPool({difficulty:'初級'}).every(q=>q.difficulty==='初級'));
 const mixed=learning([{id:'ci',title:'CI',kind:'新聞稿',airlines:['華航'],sentences:['Original source.']},{id:'eva',kind:'新聞稿',airlines:['長榮'],sentences:['Other airline.']},{id:'fake',kind:'模擬朗讀',airlines:['華航'],sentences:['Generated practice.']}]);assert.deepEqual(Array.from(mixed.examPool(),q=>q.id),['ci']);
});
