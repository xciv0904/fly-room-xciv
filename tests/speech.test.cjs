const test=require('node:test'),assert=require('node:assert/strict');
const {Speaker,englishVoices,voiceKind,voicePool,chooseVoice,plan,dictionaryLink}=require('../reading-lab/speech.js');
const voices=[{name:'中文',lang:'zh-TW',voiceURI:'zh'},{name:'Samantha',lang:'en-US',voiceURI:'us'},{name:'Serena Natural',lang:'en-GB',voiceURI:'uk-natural',localService:true},{name:'Daniel',lang:'en-GB',voiceURI:'uk'}];
function setup(){const calls=[],env={SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},speechSynthesis:{getVoices:()=>voices,cancel(){calls.push('cancel');},resume(){calls.push('resume');},speak(u){calls.push(u);}}};return {calls,player:new Speaker(env),env};}
test('English-only voices, matching UK/US and explicit preference, never Chinese fallback',()=>{
 const list=englishVoices({getVoices:()=>voices});assert.equal(list.length,3);assert.equal(chooseVoice(list,'en-GB').voiceURI,'uk-natural');assert.equal(chooseVoice(list,'en-GB','uk').voiceURI,'uk');assert.equal(chooseVoice(list,'en-US','uk').voiceURI,'us');assert.equal(chooseVoice([]),null);
});
test('sentence planning preserves all text and abbreviations, separates pause profiles and bounds long utterances',()=>{
 const text='Mr. Smith welcomes you. Please take a seat! Enjoy your journey.',items=plan(text);assert.equal(items.map(i=>i.text).join(' '),text);assert.ok(items[0].text.includes('Mr. Smith'));assert.equal(items.length,3);assert.equal(plan('Hello. Next.','practice')[0].pauseMs,900);
 const long=('international collaboration '.repeat(40))+'ends here.';assert.ok(plan(long).every(x=>x.text.length<=240));assert.equal(plan(long).map(x=>x.text).join(' '),long.trim());
});
test('speaker holds utterance, uses matching voice and normal pitch; stop cancels delayed next sentence',async()=>{
 const {calls,player}=setup(),status=[];player.speak('First sentence. Second sentence.',{accent:'en-GB',voiceURI:'uk',rate:1,pause:'brief'},m=>status.push(m));
 const first=calls.find(c=>typeof c==='object');assert.equal(first.lang,'en-GB');assert.equal(first.voice.voiceURI,'uk');assert.equal(first.pitch,1);assert.equal(first.volume,1);assert.equal(player.current,first);first.onstart();first.onend();player.stop();await new Promise(r=>setTimeout(r,220));assert.equal(calls.filter(c=>typeof c==='object').length,1);assert.match(status.join(' '),/停頓/);
});
test('sentence queue waits for end then a gap; switching prevents late callbacks from restarting',async()=>{
 const {calls,player}=setup();player.speak('First. Second.',{pause:'brief'});const a=calls.find(c=>typeof c==='object');a.onstart();a.onend();assert.equal(calls.filter(c=>typeof c==='object').length,1);await new Promise(r=>setTimeout(r,220));assert.equal(calls.filter(c=>typeof c==='object').length,2);
 const old=calls.filter(c=>typeof c==='object')[1];player.speak('New word.',{});old.onend();old.onerror({error:'canceled'});assert.equal(player.active,true);player.stop();
});
test('unsupported engine, missing accent and synthesis errors are explicit without claiming Cambridge audio',()=>{
 assert.throws(()=>new Speaker({}).speak('test'),/無法使用/);const {calls,player,env}=setup(),status=[];env.speechSynthesis.getVoices=()=>[voices[1]];assert.throws(()=>player.speak('Test.',{accent:'en-GB'}),/不會改用其他口音/);assert.equal(calls.filter(c=>typeof c==='object').length,0);player.speak('Test.',{accent:'en-US'},m=>status.push(m));const u=calls.find(c=>typeof c==='object');u.onerror({error:'not-allowed'});assert.equal(player.active,false);assert.match(status.at(-1),/not-allowed/);
 const link=dictionaryLink('exquisite');assert.match(link,/dictionary\.cambridge\.org\/pronunciation\/english\/exquisite/);assert.match(link,/另開詞典/);assert.ok(!link.includes('.mp3'));assert.match(link,/不冒稱來自劍橋/);
});
test('novelty, legacy and saved special voices cannot enter either training pool',()=>{
 const bad=['Bad News','Bells','Boing','Whisper','Zarvox','Fred','Eddy (英文（美國）)','Bad News (Enhanced)'].map((name,i)=>({name,lang:'en-US',voiceURI:'bad-'+i}));
 for(const v of bad)assert.equal(voiceKind(v),'excluded',v.name);
 assert.equal(voiceKind({name:'Unknown display',lang:'en-US',voiceURI:'com.apple.speech.synthesis.voice.Zarvox'}),'excluded');
 const all=[...bad,voices[1],{name:'Unverified vendor voice',lang:'en-US',voiceURI:'unknown'}];
 assert.deepEqual(voicePool(all).map(v=>v.voiceURI),['us']);assert.deepEqual(voicePool(all,'en-US',true).map(v=>v.voiceURI),['us']);assert.equal(chooseVoice(all,'en-US','bad-0',true).voiceURI,'us');assert.equal(chooseVoice(bad,'en-US','bad-0',true),null);assert.equal(chooseVoice([voices[1]],'en-GB'),null);
 assert.equal(chooseVoice(all,'en-US','us',false,['us']),null);assert.equal(chooseVoice(all,'en-US','unknown',true,['us']),null);
 const pair=voicePool([...all,{name:'Alex',lang:'en-US',voiceURI:'alex'},{name:'Ava Natural',lang:'en-US',voiceURI:'ava'},{name:'Tom',lang:'en-US',voiceURI:'tom'}]);assert.equal(pair.length,2);assert.equal(pair[0].voiceURI,'ava');assert.equal(pair[1].voiceURI,'alex');assert.equal(chooseVoice(pair,'en-US','alex').voiceURI,'alex');
});
test('a silent engine that never starts produces a visible timeout and clears its queue',t=>{
 t.mock.timers.enable({apis:['setTimeout']});const {player}=setup(),status=[];player.speak('Waiting for audio.',{},m=>status.push(m));t.mock.timers.tick(6001);assert.equal(player.active,false);assert.match(status.at(-1),/尚未開始出聲/);player.stop();
});
