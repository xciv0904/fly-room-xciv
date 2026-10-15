const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const C=require("../reading-lab/core.js");
require("../reading-lab/data.js");
const D=global.ReadingLabData;
const load=(file,sandbox)=>{sandbox.window=sandbox;vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,"../reading-lab",file),"utf8"),sandbox);return sandbox;};
test("question matrix is complete, identifiable and within all requested length bands",()=>{
  assert.equal(D.questions.length,288);assert.equal(new Set(D.questions.map(q=>q.id)).size,288);
  for(const q of D.questions){const [min,max]=D.bands[q.band];assert.ok(q.words>=min&&q.words<=max,q.id);assert.equal(q.kind,"模擬稿");assert.ok(q.date&&q.source&&q.sourceUrl);}
  for(const air of D.airlines)for(const level of D.levels)for(let band=0;band<3;band++)assert.equal(D.questions.filter(q=>q.airline===air&&q.difficulty===level&&q.band===band).length,8);
  assert.equal(D.words.filter(w=>w.seed).length,24);assert.equal(D.rules.length,10);assert.ok(D.rules.every(r=>r.exception));
});
test("diff labels substitutions, omissions, additions and endings without inferring audio quality",()=>{
  const result=C.compare("the fuselage exemplifies the aesthetics","the Furious is spent 5 and aesthetic");
  assert.ok(result.ops.some(x=>x.type==="replace"));assert.ok(result.ops.some(x=>x.type==="extra"));
  assert.ok(C.compare("Please fasten your seat belt","Please your seat belt").ops.some(x=>x.type==="missing"&&x.original==="fasten"));
  assert.ok(C.compare("The travelers arrive","The traveler arrive").ops.some(x=>x.ending));
  assert.ok(C.compare("The practice is useful","The practices is useful").ops.some(x=>x.ending));
  assert.equal(C.compare("Hello, WORLD!","hello world").similarity,100);
  assert.ok(result.ops.every(x=>!["stress","fluency","intonation"].includes(x.category)));
  assert.throws(()=>C.compare("x ".repeat(1001),"x"));
});
test("daily completion and local calendar streaks depend on all four actual tasks",()=>{
  const daily={"2026-10-13":{complete:true},"2026-10-14":{complete:true},"2026-10-15":{complete:false}};
  assert.equal(C.streak(daily,new Date(2026,9,15,13)),2);
  assert.equal(C.dayKey(new Date(2026,9,15,23)),"2026-10-15");
  const current={words:{},favorites:[],places:{},daily:{"2026-10-15":{tasks:{words:true},complete:false}},draft:{original:"keep"}};
  const next=C.mergeState(current,{words:{},daily:{"2026-10-15":{tasks:{places:true,reading:true,review:true}}}});
  assert.equal(next.daily["2026-10-15"].complete,true);assert.equal(current.daily["2026-10-15"].complete,false);assert.equal(next.draft.original,"keep");
});
test("backup validation rejects invalid input and preserves only human-confirmed errors",()=>{
  const data={kind:"fly-room-reading-lab",version:1,state:{words:{"word-0":{status:"pending",confirmed:false}},places:{"place-0":{updated:10,attempts:2}},daily:{},favorites:["place-0"]},sessions:[{id:"one",ts:1,duration:40,title:"Test",original:"Original",transcript:"Heard",errors:[{category:"stress",confirmed:true,original:"example"},{category:"long",confirmed:false,original:"pending"}]}]};
  const clean=C.validateBackup(data);assert.equal(clean.sessions[0].errors.filter(e=>e.confirmed).length,1);assert.equal(clean.state.places["place-0"].attempts,2);
  assert.throws(()=>C.validateBackup({}));assert.throws(()=>C.validateBackup({...data,sessions:[...data.sessions,...data.sessions]}));
  assert.throws(()=>C.validateBackup({...data,sessions:[{...data.sessions[0],duration:Infinity}]}));
});
test("IndexedDB round trips audio and snapshots, imports atomically, and deletes only lab data",async()=>{
  const {IDBFactory}=require("fake-indexeddb");const factory=new IDBFactory();
  const s=load("db.js",{indexedDB:factory,Blob}),db=s.ReadingLabDB;
  const record={id:"one",original:"original snapshot",transcript:"heard",errors:[],duration:20};
  await db.put("meta","state",{words:{}});await db.saveSession(record,new Blob(["audio"],{type:"audio/webm"}));
  assert.equal((await db.get("sessions","one")).original,record.original);assert.equal(await (await db.get("audio","one")).text(),"audio");
  await db.remove("audio","one");assert.ok(await db.get("sessions","one"));assert.equal(await db.get("audio","one"),undefined);
  await db.importData({sessions:[{...record,id:"two"}]},{words:{test:true}},[["two",new Blob(["restored"])]]);
  assert.equal((await db.list("sessions")).length,2);assert.equal(await (await db.get("audio","two")).text(),"restored");
  await db.removeSession("two");assert.equal(await db.get("audio","two"),undefined);assert.equal((await db.list("sessions")).length,1);
  await db.clear();assert.equal((await db.list("sessions")).length,0);
});
test("recorder never ends on silence; recognition is opt-in and permission denial is actionable",async()=>{
  let stopped=0,speechStarts=0;
  class Recorder{constructor(){this.state="inactive";this.mimeType="audio/webm";}start(){this.state="recording";}stop(){this.state="inactive";this.ondataavailable({data:new Blob(["sample"])});queueMicrotask(()=>this.onstop());}}
  class Speech{start(){speechStarts++;}stop(){this.onend?.();}}
  const s=load("media.js",{Blob,Date,URL,setTimeout,clearTimeout,MediaRecorder:Recorder,SpeechRecognition:Speech,navigator:{mediaDevices:{getUserMedia:async()=>({getTracks:()=>[{stop(){stopped++;}}]})}}});
  const recorder=new s.LabRecorder();await recorder.start();assert.equal(speechStarts,0);assert.equal(recorder.active,true);
  const result=await recorder.stop();assert.ok(result.blob.size);assert.equal(stopped,1);
  await recorder.start({recognition:true});assert.equal(speechStarts,1);recorder.speech.onend();assert.equal(recorder.active,true);await recorder.stop();
  await new Promise(r=>setTimeout(r,550));assert.equal(speechStarts,1,"recognition must not restart after stopping");
  s.navigator.mediaDevices.getUserMedia=async()=>{throw {name:"NotAllowedError"};};
  await assert.rejects(recorder.start(),/權限遭拒/);
});
test("leaving during a pending permission request releases late microphone access",async()=>{
  let resolveStream,stopped=false;
  const s=load("media.js",{Blob,Date,URL,setTimeout,clearTimeout,MediaRecorder:class{},navigator:{mediaDevices:{getUserMedia:()=>new Promise(resolve=>{resolveStream=resolve;})}}});
  const recorder=new s.LabRecorder(),pending=recorder.start();recorder.cancelPending();resolveStream({getTracks:()=>[{stop(){stopped=true;}}]});
  await assert.rejects(pending,/已取消/);assert.equal(stopped,true);assert.equal(recorder.active,false);
});
