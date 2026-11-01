const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../reading-lab/core.js'),T=require('../reading-lab/training-core.js');
const origin=(extra={})=>({id:'first',ts:100,questionId:'article-a',original:'Sustainable aviation fuel reduces emissions.',transcript:'Sustainable aviation fuel reduces emissions.',duration:30,started:true,errors:[{id:'fault-a',original:'emissions',heard:'emission',category:'final',confirmed:true,note:'回聽後確認詞尾'}],...extra});
const follow=(extra={})=>({id:'second',ts:200,questionId:'article-a',original:'Sustainable aviation fuel reduces emissions.',transcript:'Sustainable aviation fuel reduces emissions.',duration:25,started:true,baselineId:'first',practiceType:'retry',targetIssueIds:['fault-a'],reviewResults:[{issueId:'fault-a',status:'resolved',note:'比較兩次錄音後確認'}],errors:[],...extra});
const backup=sessions=>({kind:'fly-room-reading-lab',version:1,state:{words:{},places:{},daily:{}},sessions});

test('legacy issue identity survives reload and human label edits; unconfirmed transcript differences remain excluded',()=>{
  const s=origin({errors:[{original:'emissions',confirmed:true},{original:'fuel',confirmed:false}]});
  const id=T.issueId(s,s.errors[0],0),copy=structuredClone(s);copy.errors[0].category='final';copy.errors[0].note='changed';
  assert.equal(T.issueId(copy,copy.errors[0],0),id);
  assert.equal(T.issueHistory([s]).length,1);assert.equal(T.activeIssues([s])[0].issueId,id);
  assert.equal(T.activeIssues([s])[0].status,'pending');
});

test('ASR re-analysis keeps saved issue identity and human decisions so existing review links remain effective',()=>{
  const first=origin({errors:[{...origin().errors[0],type:'replace'}]}),before=structuredClone(first.errors);
  const rows=C.reconcileErrors(first.errors,[{id:'new-candidate',type:'replace',original:'emissions',heard:'emission',category:'other',confirmed:false,note:''}]);
  assert.equal(rows.length,1);assert.equal(rows[0].id,'fault-a');assert.equal(rows[0].category,'final');assert.equal(rows[0].confirmed,true);assert.equal(rows[0].note,before[0].note);
  assert.deepEqual(first.errors,before,'reconciliation does not mutate stored source evidence');
  assert.equal(T.activeIssues([{...first,errors:rows},follow()]).length,0,'review target remains attached after re-analysis');
});

test('disappearing ASR differences and manual observations remain confirmed history, without retaining unconfirmed guesses',()=>{
  const previous=[{id:'asr-known',type:'missing',original:'fuel',heard:'',category:'skipped',confirmed:true,note:'已回聽'},{id:'manual-known',original:'aviation',heard:'',category:'stress',confirmed:true,note:'第二音節'},{id:'asr-guess',type:'replace',original:'annual',heard:'manual',category:'other',confirmed:false}];
  const rows=C.reconcileErrors(previous,[]);
  assert.deepEqual(rows.map(e=>e.id),['asr-known','manual-known']);assert.ok(rows.every(e=>e.historical===true&&e.confirmed===true));
  const restored=C.validateBackup(backup([origin({errors:rows})])).sessions[0].errors;
  assert.equal(restored[0].type,'missing');assert.equal(restored[0].historical,true);
  const reappeared=C.reconcileErrors(restored,[{type:'missing',original:'fuel',heard:'',confirmed:false}]);
  assert.equal(reappeared[0].id,'asr-known');assert.equal(reappeared[0].historical,undefined,'current difference no longer needs the historical-only marker');
});

test('repeated differences reconcile by occurrence and old backups without operation types do not duplicate saved issues',()=>{
  const previous=[{id:'first-mention',type:'replace',original:'fuel',heard:'full',confirmed:true},{id:'second-mention',type:'replace',original:'fuel',heard:'full',confirmed:false},{id:'legacy',original:'emissions',heard:'emission',confirmed:true,category:'final'}];
  const next=[{type:'replace',original:'fuel',heard:'full'},{type:'replace',original:'fuel',heard:'full'},{type:'replace',original:'emissions',heard:'emission'}];
  assert.deepEqual(C.reconcileErrors(previous,next).map(e=>e.id),['first-mention','second-mention','legacy']);
  const crowded=C.reconcileErrors([{id:'retain',original:'known',confirmed:true}],Array.from({length:1000},(_,i)=>({id:`candidate-${i}`,original:`guess-${i}`,confirmed:false})));
  assert.equal(crowded.length,1000);assert.equal(crowded.filter(e=>e.id==='retain').length,1,'a full candidate list cannot displace known confirmed evidence');
});

test('opening a past attempt, saving an empty retry, or unrelated review results cannot resolve a confirmed issue',()=>{
  const first=origin();
  for(const row of [follow({id:'first'}),follow({ts:100}),follow({duration:0}),follow({started:false}),follow({interrupted:true}),follow({targetIssueIds:[]}),follow({baselineId:'unrelated'}),follow({practiceType:'initial'}),follow({questionId:'renamed'}),follow({original:'Different text.'})]){
    assert.equal(T.activeIssues([first,row]).length,1,JSON.stringify(row));
  }
  assert.equal(T.activeIssues([{...first,reviewed:true}]).length,1,'historical review flag is not explicit correction evidence');
});

test('a practiced linked retry resolves only selected confirmed issues and preserves source history',()=>{
  const first=origin({errors:[...origin().errors,{id:'fault-b',original:'aviation',category:'stress',confirmed:true}]}),second=follow();
  const history=T.issueHistory([second,first]);
  assert.equal(history.find(i=>i.id==='fault-a').status,'resolved');
  assert.equal(history.find(i=>i.id==='fault-a').sameArticleStatus,'resolved');
  assert.equal(history.find(i=>i.id==='fault-a').transferStatus,'pending');
  assert.deepEqual(T.activeIssues([first,second]).map(i=>i.id),['fault-b']);
  assert.equal(first.errors.length,2);assert.equal(first.errors[0].confirmed,true);
});

test('transfer verification uses a distinct passage and later manual recurrence reopens the issue',()=>{
  const first=origin(),second=follow(),transfer=follow({id:'third',ts:300,questionId:'article-b',original:'The company measures its annual emissions.',practiceType:'transfer'});
  assert.equal(T.issueHistory([first,second,transfer])[0].transferStatus,'resolved');
  assert.equal(T.activeIssues([first,second,transfer]).length,0);
  const duplicate=follow({id:'duplicate',ts:300,questionId:'article-b',practiceType:'transfer',original:'SUSTAINABLE aviation fuel reduces emissions!'});
  assert.equal(T.issueHistory([first,duplicate])[0].transferStatus,'pending','a second source ID does not make the same text unfamiliar');
  const recur={...transfer,id:'fourth',ts:400,reviewResults:[{issueId:'fault-a',status:'retry',note:'新文章再次出現詞尾問題'}]};
  assert.equal(T.activeIssues([first,second,transfer,recur])[0].transferStatus,'retry');
  assert.equal(T.activeIssues([first,second,transfer,recur])[0].lastReview.sessionId,'fourth');
});

test('transfer evidence must contain the complete target segment at token boundaries',()=>{
  const first=origin(),transfer=follow({id:'transfer',questionId:'article-b',practiceType:'transfer'});
  for(const original of ['The airline flies daily.','The emissionsreport was published.','The annual emission totals decreased.']){
    assert.equal(T.issueHistory([first,{...transfer,original}])[0].transferStatus,'pending',original);
  }
  assert.equal(T.issueHistory([first,{...transfer,original:'We track EMISSIONS, annually.'}])[0].transferStatus,'resolved');
  const phrase=origin({errors:[{...first.errors[0],original:'sustainable aviation fuel'}]});
  assert.equal(T.issueHistory([phrase,{...transfer,original:'More sustainable—AVIATION, fuel was used this year.'}])[0].transferStatus,'resolved');
  assert.equal(T.issueHistory([phrase,{...transfer,original:'Sustainable fuel is common in aviation.'}])[0].transferStatus,'pending');
  for(const original of ['', '...', '  ']){
    const noteOnly=origin({errors:[{...first.errors[0],original,note:'本輪流暢度待改善'}]});
    assert.equal(T.issueHistory([noteOnly,{...transfer,original:'We track emissions annually.'}])[0].transferStatus,'pending');
  }
});

test('issue history is ordered by saved practice time and deleting evidence only changes its dependent issue state',()=>{
  const first=origin(),retry=follow(),transfer=follow({id:'third',ts:300,questionId:'article-b',original:'We measure emissions annually.',practiceType:'transfer',reviewResults:[{issueId:'fault-a',status:'retry'}]});
  const chronological=T.issueHistory([first,retry,transfer]),shuffled=T.issueHistory([transfer,first,retry]);
  assert.deepEqual(shuffled,chronological);assert.equal(shuffled[0].status,'retry');
  assert.equal(T.activeIssues([first,transfer])[0].status,'retry','removing same-text evidence retains later transfer recurrence');
  assert.equal(T.activeIssues([first,retry]).length,0,'removing the failed transfer exposes the prior valid correction');
  assert.equal(T.activeIssues([first])[0].status,'pending','removing all correction evidence returns the source issue to pending');
  assert.deepEqual(T.issueHistory([retry,transfer]),[],'dangling review references do not manufacture source issues');
  const other=origin({id:'unrelated',errors:[]});
  assert.deepEqual(T.issueHistory([first,retry,transfer,other]),chronological);
});

test('review reminders stop for resolved issues without changing the existing legacy review interval',()=>{
  const first=origin();
  assert.deepEqual(T.reviewItems([first],{words:{},places:{}},100+T.DAY).map(i=>i.id),['first']);
  assert.deepEqual(T.reviewItems([first,follow()],{words:{},places:{}},100+T.DAY),[]);
  assert.equal(T.schedule(null,'mastered',100).days,7);
  const pending=follow({reviewResults:[{issueId:'fault-a',status:'pending'}]});
  assert.equal(T.reviewItems([first,pending],{words:{},places:{}},100+T.DAY).length,1);
});

test('a separate next-day reminder offers transfer only after same-text correction and ends after transfer evidence',()=>{
  const first=origin(),retry=follow(),due=retry.ts+T.DAY;
  assert.deepEqual(T.transferDueItems([first,retry],due-1),[]);
  assert.deepEqual(T.transferDueItems([first,retry],due).map(i=>({issueId:i.issueId,due:i.due,title:i.title})),[{issueId:'fault-a',due,title:'emissions'}]);
  assert.deepEqual(T.reviewItems([first,retry],{words:{},places:{}},due),[],'existing unresolved-review API remains separate');
  const transfer=follow({id:'third',ts:300,practiceType:'transfer',questionId:'article-b',original:'We measure annual emissions.'});
  assert.deepEqual(T.transferDueItems([first,retry,transfer],due),[]);
  assert.deepEqual(T.transferDueItems([first,retry,{...transfer,reviewResults:[{issueId:'fault-a',status:'retry'}]}],due),[],'failed transfer belongs to active correction instead');
  assert.deepEqual(T.transferDueItems([origin({errors:[{...first.errors[0],original:''}]}),retry],due),[],'note-only observations cannot claim exact-phrase transfer');
  assert.deepEqual(T.transferDueItems([first,origin({id:'ambiguous'}),retry],due),[],'ambiguous imported identities cannot gain evidence');
});

test('same-text recurrence invalidates current transfer stability while retaining its historical evidence',()=>{
  const first=origin(),retry=follow(),transfer=follow({id:'third',ts:300,practiceType:'transfer',questionId:'article-b',original:'We measure annual emissions.'});
  for(const status of ['retry','pending']){
    const recurrence=follow({id:'fourth',ts:400,reviewResults:[{issueId:'fault-a',status}]}),rows=[first,retry,transfer,recurrence],issue=T.issueHistory(rows)[0];
    assert.equal(issue.status,status);assert.equal(issue.transferStatus,'pending');assert.equal(issue.reviews[1].practiceType,'transfer');assert.equal(issue.reviews[1].status,'resolved','old evidence remains visible in review history');
    assert.deepEqual(T.transferDueItems(rows,1000+T.DAY),[],'unresolved recurrence stays in correction rather than transfer scheduling');
    const corrected=follow({id:'fifth',ts:500});
    assert.equal(T.issueHistory([...rows,corrected])[0].transferStatus,'pending');
    assert.deepEqual(T.transferDueItems([...rows,corrected],500+T.DAY-1),[]);
    assert.equal(T.transferDueItems([...rows,corrected],500+T.DAY)[0].due,500+T.DAY,'new correction starts a fresh next-day transfer reminder');
  }
});

test('a failed transfer followed by a same-text correction schedules another transfer check',()=>{
  const first=origin(),retry=follow(),failed=follow({id:'third',ts:300,practiceType:'transfer',questionId:'article-b',original:'We measure annual emissions.',reviewResults:[{issueId:'fault-a',status:'retry'}]}),corrected=follow({id:'fourth',ts:400});
  const issue=T.issueHistory([first,retry,failed,corrected])[0];
  assert.equal(issue.status,'resolved');assert.equal(issue.transferStatus,'retry');
  assert.deepEqual(T.transferDueItems([first,retry,failed,corrected],400+T.DAY-1),[]);
  assert.equal(T.transferDueItems([first,retry,failed,corrected],400+T.DAY)[0].issueId,'fault-a');
});

test('duplicate imported issue identifiers never allow one review to close unrelated source issues',()=>{
  const first=origin(),other=origin({id:'other',ts:50});
  assert.equal(T.activeIssues([other,first,follow()]).length,2);
});

test('backup round trips links, human review evidence and imported recording state, while old records remain valid',()=>{
  const data=backup([origin(),follow({interrupted:false})]);
  data.state.sourceReadings={'official-esg':{openedAt:50,completedAt:100}};
  const clean=C.validateBackup(data),again=C.validateBackup(backup(clean.sessions));
  assert.equal(clean.sessions[0].errors[0].id,'fault-a');assert.equal(clean.sessions[1].baselineId,'first');
  assert.deepEqual(clean.sessions[1].targetIssueIds,['fault-a']);assert.equal(clean.sessions[1].reviewResults[0].note,'比較兩次錄音後確認');
  assert.equal(clean.sessions[1].started,true);assert.equal(clean.sessions[1].interrupted,false);
  assert.equal(T.activeIssues(again.sessions).length,0);
  assert.deepEqual(clean.state.sourceReadings,{'official-esg':{openedAt:50,completedAt:100}});
  const old=C.validateBackup(backup([{id:'legacy',ts:1,duration:5,original:'Old saved passage.',errors:[]}]));
  assert.equal(old.sessions[0].practiceType,'initial');assert.deepEqual(old.sessions[0].reviewResults,[]);
});

test('backup workflow limits and safe references reject malformed or untargeted evidence without losing historical errors',()=>{
  const row=follow({baselineId:'<script>',targetIssueIds:['fault-a','fault-a','fault-b','fault-c','fault-d','<script>'],reviewResults:[{issueId:'fault-a',status:'resolved',note:'x'.repeat(2000)},{issueId:'fault-b',status:'automatic-perfect'},{issueId:'fault-d',status:'resolved'},{issueId:'fault-c',status:'retry'}]});
  const clean=C.validateBackup(backup([origin({errors:[...origin().errors,null]}),row]));
  assert.equal(clean.sessions[1].baselineId,'');assert.deepEqual(clean.sessions[1].targetIssueIds,['fault-a','fault-b','fault-c']);
  assert.equal(clean.sessions[1].reviewResults.length,2);assert.equal(clean.sessions[1].reviewResults[0].note.length,1000);
  assert.equal(clean.sessions[0].errors.length,1);assert.equal(T.activeIssues(clean.sessions).length,1);
});

test('source reading merge preserves the latest independent timestamps and rejects unsafe or excessive input',()=>{
  const current={words:{},places:{},daily:{},favorites:[],sourceReadings:{'official-esg':{openedAt:100,completedAt:90}},draft:{original:'keep'}};
  const merged=C.mergeState(current,{sourceReadings:{'official-esg':{openedAt:80,completedAt:120},'official-film':{openedAt:110},'<script>':{completedAt:120}}});
  assert.deepEqual(merged.sourceReadings['official-esg'],{openedAt:100,completedAt:120});assert.equal(merged.sourceReadings['official-film'].openedAt,110);
  assert.equal(merged.sourceReadings['<script>'],undefined);assert.equal(merged.draft.original,'keep');assert.equal(current.sourceReadings['official-esg'].completedAt,90);
  assert.equal(Object.keys(C.sourceReadingsValue(Object.fromEntries(Array.from({length:1005},(_,i)=>[`source-${i}`,{completedAt:i}])))).length,1000);
  assert.deepEqual(C.sourceReadingsValue({'source-bad':{openedAt:Infinity,completedAt:-1}}),{});
});

test('attempt comparison describes two practiced readings without treating faster speech or recognition as improvement',()=>{
  const first=origin({completedWords:5,assessment:{fluency:'retry'}}),second=follow({completedWords:5,assessment:{fluency:'good'}}),result=T.comparison(first,second);
  assert.equal(result.comparable,true);assert.equal(result.changes.duration,-5);assert.equal(result.baseline.assessment.fluency,'retry');
  assert.equal(result.current.assessment.fluency,'good');assert.equal(result.score,undefined);assert.equal(result.improved,undefined);
  assert.equal(T.comparison(first,follow({completedWords:null})).changes.wordsPerMinute,null,'manual words and transcript words are not interchangeable rate measures');
  assert.equal(T.comparison(first,follow({original:'Other passage.'})).comparable,false);
  assert.equal(T.comparison(first,follow({duration:0})).comparable,false);
  assert.deepEqual(T.attemptsFor([second,first,follow({id:'empty',duration:0})],'article-a').map(s=>s.id),['first','second']);
});
