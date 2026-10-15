const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const C=require('../reading-lab/core.js'),T=require('../reading-lab/training-core.js');
test('spaced review schedules tomorrow and weekly without treating recognition as a confirmed fault',()=>{
  const now=new Date('2026-10-16T04:00:00Z').getTime(),retry=T.schedule(null,'retry',now),mastered=T.schedule(retry,'mastered',now);
  assert.equal(retry.due,now+T.DAY);assert.equal(mastered.due,now+7*T.DAY);assert.equal(T.schedule(mastered,'mastered',now).days,14);
  assert.equal(T.due({status:'retry',schedule:retry},now),false);assert.equal(T.due({status:'retry',schedule:retry},now+T.DAY),true);
  const s=[{id:'confirmed',ts:now,errors:[{confirmed:true}]},{id:'unconfirmed',ts:now,errors:[{confirmed:false}]}];
  assert.deepEqual(T.reviewItems(s,{words:{},places:{}},now+T.DAY).map(i=>i.id),['confirmed']);
});
test('audio descriptors report silence and relative level, not a fabricated quality score',()=>{
  const rate=1000,pcm=new Float32Array(4000);for(let i=0;i<1000;i++)pcm[i]=.2;for(let i=2000;i<4000;i++)pcm[i]=.1;
  const result=T.waveformMetrics(pcm,rate);assert.equal(result.pauses.length,1);assert.ok(Math.abs(result.pauses[0].duration-1)<.03);assert.equal(result.duration,4);assert.ok(result.rmsDb<0);assert.equal(result.clippedPercent,0);assert.equal(result.score,undefined);
  assert.deepEqual(T.safeAssessment({eye:'ai-perfect',tone:'good'}),{tone:'good',volume:'pending',fluency:'pending',accuracy:'pending',pausing:'pending',eye:'pending'});
});
test('rate and completion distinguish transcription from manually confirmed read words',()=>{
  const m=T.textMetrics('One two three four.','one two',30);assert.equal(m.wordsPerMinute,4);assert.equal(m.completion,null);
  const manual=T.textMetrics('One two three four.','one two',30,3);assert.equal(manual.completion,75);assert.equal(manual.wordsPerMinute,6);assert.match(m.rateSource,/逐字稿/);
  assert.equal(T.textMetrics('One two.','',0).wordsPerMinute,null);assert.ok(T.phraseParts('Read slowly, while keeping clear pauses.').length>1);
});
test('backups preserve human assessments, visual checks, measured audio and review dates; old backups still work',()=>{
  const audio=T.waveformMetrics(new Float32Array(1000),1000),schedule=T.schedule(null,'retry',100);
  const b=C.validateBackup({kind:'fly-room-reading-lab',version:1,state:{words:{'word-0':{status:'retry',attempts:1,updated:100,schedule}},places:{'place-ci-kinmen':{status:'unsure',attempts:1,updated:100,schedule}}},sessions:[{id:'s',ts:100,duration:1,original:'One word.',transcript:'one',errors:[],assessment:{eye:'retry'},visual:{eye:true},completedWords:1,audioAnalysis:audio,reviewSchedule:schedule}]});
  assert.equal(b.state.words['word-0'].schedule.due,schedule.due);assert.equal(b.state.places['place-ci-kinmen'].status,'unsure');assert.equal(b.sessions[0].assessment.eye,'retry');assert.equal(b.sessions[0].visual.eye,true);assert.equal(b.sessions[0].completedWords,1);assert.equal(b.sessions[0].audioAnalysis.imported,true);assert.equal(b.sessions[0].reviewSchedule.due,schedule.due);
});
test('destination metadata preserves legacy identities and marks old or unverified route evidence explicitly',()=>{
  const s={};s.window=s;vm.createContext(s);for(const f of ['data.js','ci-destinations.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../reading-lab',f),'utf8'),s);
  const before=s.ReadingLabData.places.map(p=>p.id);vm.runInContext(fs.readFileSync(path.join(__dirname,'../reading-lab/destination-network.js'),'utf8'),s);
  const data=s.ReadingLabData.places;for(const id of before)assert.ok(data.some(p=>p.id===id));assert.equal(data.length,new Set(data.map(p=>p.id)).size);
  assert.equal(data.find(p=>p.en==='Phoenix').network.scope,'direct');assert.match(data.find(p=>p.en==='Phoenix').network.note,/回程/);
  assert.equal(data.find(p=>p.en==='Paris').network.historical,true);assert.equal(data.find(p=>p.en==='Kinmen').network.scope,'group');assert.equal(data.find(p=>p.en==='Narita').network.scope,'pending');
});
