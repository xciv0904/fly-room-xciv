/* Run after the curriculum UI is integrated: node tests/curriculum-browser.cjs */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'..'),output=fs.mkdtempSync(path.join(os.tmpdir(),'fly-room-curriculum-'));
const mime={'.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.html':'text/html; charset=utf-8','.json':'application/json'};
const server=http.createServer((req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(root+path.sep)||!fs.statSync(file).isFile())throw Error('Not a project file');
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
  }catch{res.writeHead(404).end();}
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true,...(process.env.LAB_BROWSER_PATH?{executablePath:process.env.LAB_BROWSER_PATH}:{}),args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
  const context=await browser.newContext({permissions:['microphone'],serviceWorkers:'block',viewport:{width:1280,height:900}}),errors=[],external=[];
  await context.addInitScript(()=>{localStorage.setItem('fa_gate','vrpmjf');localStorage.setItem('fa_onboarded','true');});
  await context.route('**/*',route=>{if(route.request().url().startsWith(origin))return route.continue();external.push(route.request().url());return route.abort();});
  const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
  page.on('console',message=>{if(message.type()==='error'&&!message.text().includes('favicon.ico'))errors.push('console: '+message.text());});
  const act=action=>page.locator(`#readingLabRoot [data-lab-action="${action}"]`).first().click();
  const view=name=>page.locator(`#readingLabRoot .lab-nav [data-view="${name}"]`).click();
  const savedState=()=>page.evaluate(()=>ReadingLabDB.get('meta','state'));
  const issues=()=>page.evaluate(async()=>ReadingTraining.issueHistory(await ReadingLabDB.list('sessions')).map(i=>({id:i.id,sessionId:i.sessionId,questionId:i.questionId,original:i.original,status:i.status,sameArticleStatus:i.sameArticleStatus,transferStatus:i.transferStatus})));
  const completePractice=async(audio=false)=>{
    await page.locator('#labPreview').selectOption('0');await page.locator('#labLimit').selectOption('0');
    if(await page.locator('#labRecognition').isChecked())await page.locator('#labRecognition').uncheck();
    await act('prepare');await page.locator('#labOriginal').waitFor();await act(audio?'record':'manual-start');
    await page.waitForFunction(()=>document.querySelector('#readingLabRoot').dataset.phase==='recording');
    await page.waitForTimeout(1150);await act('stop');await page.locator('#labAnalysis').waitFor();
    await page.waitForFunction(async()=>{const state=await ReadingLabDB.get('meta','state'),s=await ReadingLabDB.get('sessions',state.draft.savedId);return ReadingTraining.hasPracticed(s);});
    if(audio){await page.locator('#labPlayback audio').waitFor();await page.waitForFunction(async()=>{const state=await ReadingLabDB.get('meta','state');return (await ReadingLabDB.get('audio',state.draft.savedId))?.size>0;});}
  };
  const saveResult=async(issueId,status='resolved')=>{
    await page.locator(`[data-lab-review-result="${issueId}"]`).selectOption(status);await act('save-review');
    await page.waitForFunction(async({id,status})=>{const state=await ReadingLabDB.get('meta','state'),s=await ReadingLabDB.get('sessions',state.draft.savedId);return s?.reviewResults?.some(r=>r.issueId===id&&r.status===status);},{id:issueId,status});
  };
  try{
    await page.goto(origin+'/#readingLab');await page.getByRole('heading',{name:'英文朗讀訓練中心',exact:true}).waitFor();await view('home');
    await page.locator('.lab-daily-plan').waitFor();await page.locator('.lab-topic-grid').waitFor();await page.locator('.lab-progress').waitFor();
    assert.equal(await page.locator('.lab-topic-card').count(),6);assert.equal(await page.evaluate(()=>ReadingLabLearning.examPool().length),64,'the authentic formal pool stays at 64 passages');
    assert.ok((await page.locator('.lab-daily-plan .lab-reason').textContent()).includes('尚未練習'));
    assert.deepEqual(await page.evaluate(()=>{const s={id:'pagination-example',ts:1,duration:1,questionId:'sample',original:'China Airlines.',errors:Array.from({length:21},(_,i)=>({original:'China Airlines',category:'proper',note:String(i),confirmed:true}))};const parse=limit=>new DOMParser().parseFromString(ReadingCurriculumUI.issueList([s],limit),'text/html');const first=parse(20),all=parse(40);return {initial:first.querySelectorAll('[data-lab-action="issue-transfer"]').length,more:first.querySelectorAll('[data-lab-action="more-issues"]').length,expanded:all.querySelectorAll('[data-lab-action="issue-transfer"]').length,remaining:all.querySelectorAll('[data-lab-action="more-issues"]').length};}),{initial:20,more:1,expanded:21,remaining:0},'issue pagination provides access beyond the first twenty');

    const referenceId=await page.locator('[data-lab-action="source-study"]').first().getAttribute('data-id');
    await act('source-study');await page.locator('.lab-reference-task').waitFor();
    assert.equal(await page.evaluate(()=>ReadingLabLearning.selected((document.querySelector('#labLearnArticle')?{airline:document.querySelector('#labLearnAirline').value,kind:document.querySelector('#labLearnKind').value,topic:document.querySelector('#labLearnTopic').value,articleId:document.querySelector('#labLearnArticle').value}:{})).studyOnly),true);
    assert.equal(await page.locator('[data-lab-action="learn-exam"]').count(),0,'short source excerpts never become a formal exam');
    const sourceLink=page.locator('.lab-reference-task a[target="_blank"]').first();
    assert.match(await sourceLink.getAttribute('href'),/^https:\/\//);assert.ok(!(await sourceLink.getAttribute('href')).includes('github.com'));
    await act('source-complete');await page.waitForFunction(async id=>!!(await ReadingLabDB.get('meta','state')).sourceReadings?.[id]?.completedAt,referenceId);

    await page.locator('#labLearnTopic').selectOption('sustainability');
    await page.waitForFunction(()=>{const ids=[...document.querySelector('#labLearnArticle').options].map(o=>o.value);return ids.length>0&&ids.every(id=>ReadingLabLearning.allArticles().find(a=>a.id===id)?.topics.includes('sustainability'));});
    assert.equal(await page.locator('#labLearnTopic').inputValue(),'sustainability');
    assert.equal(await page.evaluate(()=>{const ids=[...document.querySelector('#labLearnArticle').options].map(o=>o.value);return ids.length>0&&ids.every(id=>ReadingLabLearning.allArticles().find(a=>a.id===id)?.topics.includes('sustainability'));}),true);
    await view('exam');await page.locator('#labExamTopic').selectOption('food');
    await page.waitForFunction(()=>{const ids=[...document.querySelector('#labQuestion').options].map(o=>o.value);return ids.length>0&&ids.every(id=>ReadingLabLearning.examPool().find(a=>a.id===id)?.topics.includes('food'));});
    assert.equal(await page.evaluate(()=>{const ids=[...document.querySelector('#labQuestion').options].map(o=>o.value);return ids.length>0&&ids.every(id=>ReadingLabLearning.examPool().find(a=>a.id===id)?.topics.includes('food'));}),true);
    await page.locator('#labExamTopic').selectOption('');await page.locator('#labDifficulty').selectOption('');await page.locator('#labExamKind').selectOption('');
    await page.waitForFunction(()=>document.querySelector('#labQuestion').options.length===64);
    const candidates=await page.evaluate(()=>ReadingLabLearning.examPool().filter(a=>a.text.toLowerCase().includes('china airlines')).map(a=>({id:a.id,text:a.text})));
    assert.ok(candidates.length>=2,'the review phrase exists in at least two source passages');
    assert.ok(new Set(candidates.map(a=>a.text)).size>=2);
    await page.locator('#labQuestion').selectOption(candidates[0].id);await act('choose');
    await page.waitForFunction(async id=>(await ReadingLabDB.get('meta','state')).draft?.questionId===id,candidates[0].id);await completePractice();
    const original=await page.locator('#labOriginal').textContent();
    await page.locator('#labTranscript').fill(original);await act('analyze');await page.locator('.lab-diff').waitFor();
    assert.equal(await page.locator('[data-lab-error][data-field="confirmed"]:checked').count(),0,'identical transcripts do not create human-confirmed issues');
    await page.locator('#labComparison details summary').click();await page.locator('#labManualWord').fill('China Airlines');await page.locator('#labManualCategory').selectOption('proper');
    await page.locator('#labManualNote').fill('回聽確認專名需要更穩定；以另一篇原文複驗。');await act('add-error');await act('save-session');
    await page.waitForFunction(async()=>ReadingTraining.activeIssues(await ReadingLabDB.list('sessions')).length===1);
    const first=(await issues())[0],baseline=(await savedState()).draft.savedId;
    assert.ok(first.id);assert.equal(first.sessionId,baseline);assert.equal(first.status,'pending');
    await act('analyze');await page.waitForFunction(async id=>{const d=(await ReadingLabDB.get('meta','state')).draft;return d?.analyzed&&d.errors.some(e=>e.id===id&&e.confirmed);},first.id);
    await act('save-session');assert.equal((await issues()).length,1);assert.equal((await issues())[0].id,first.id,'reanalyzing an identical transcript preserves the confirmed manual issue identity');
    await act('practice-phrases');await page.waitForFunction(()=>document.querySelector('#labPhrasePractice')?.textContent.includes('China Airlines'));
    assert.ok((await page.locator('#labPhrasePractice').textContent()).includes('China Airlines'));
    await act('sample-record');await page.waitForFunction(()=>document.querySelector('#labStatus').textContent.includes('嘗試錄音中'));
    assert.equal(await page.locator('#labExamTopic').isDisabled(),true,'phrase recording locks settings that could replace its stop control');
    assert.equal(await page.locator('#labNotes').isDisabled(),true);assert.equal(await page.locator('[data-lab-action="sample-stop"]').isEnabled(),true);
    await page.waitForTimeout(300);await act('sample-stop');await page.locator('#labSamplePlayback audio').waitFor();
    assert.equal(await page.locator('#labExamTopic').isEnabled(),true);assert.equal(await page.locator('#labNotes').isEnabled(),true);

    await act('retry');await page.waitForFunction(async id=>{const draft=(await ReadingLabDB.get('meta','state')).draft;return draft?.baselineId===id&&draft.practiceType==='retry'&&draft.savedId===null;},baseline);let state=await savedState();
    assert.equal(state.draft.baselineId,baseline);assert.equal(state.draft.practiceType,'retry');assert.deepEqual(state.draft.targetIssueIds,[first.id]);assert.equal(state.draft.savedId,null);
    await completePractice();await saveResult(first.id);
    const afterRetry=(await issues()).find(i=>i.id===first.id);
    assert.equal(afterRetry.status,'resolved');assert.equal(afterRetry.sameArticleStatus,'resolved');assert.equal(afterRetry.transferStatus,'pending');
    assert.equal(await page.evaluate(async()=>ReadingTraining.activeIssues(await ReadingLabDB.list('sessions')).length),0);
    assert.equal(await page.evaluate(async()=>ReadingCurriculum.assessProgress(await ReadingLabDB.list('sessions')).passagesPracticed),1,'same-text retry is not a new passage');
    assert.deepEqual(await page.evaluate(async id=>{const sessions=await ReadingLabDB.list('sessions'),issue=ReadingTraining.issueHistory(sessions).find(i=>i.id===id),due=issue.lastReview.ts+ReadingTraining.DAY;return {before:ReadingTraining.transferDueItems(sessions,due-1).length,after:ReadingTraining.transferDueItems(sessions,due).map(i=>i.issueId)};},first.id),{before:0,after:[first.id]},'same-text improvement creates a distinct next-day transfer reminder');

    await view('history');await page.locator('.lab-issue-list').waitFor();
    await page.locator(`.lab-issue-list [data-lab-action="issue-transfer"][data-issue="${first.id}"]`).click();
    await page.waitForFunction(async id=>{const draft=(await ReadingLabDB.get('meta','state')).draft;return draft?.baselineId===id&&draft.practiceType==='transfer'&&draft.savedId===null;},baseline);
    state=await savedState();assert.equal(state.draft.baselineId,baseline);assert.equal(state.draft.practiceType,'transfer');
    assert.notEqual(state.draft.questionId,candidates[0].id);assert.notEqual(state.draft.original,original);assert.ok(state.draft.original.toLowerCase().includes('china airlines'));
    const transferQuestionId=state.draft.questionId;
    await completePractice();await saveResult(first.id,'retry');
    assert.equal((await issues()).find(i=>i.id===first.id).transferStatus,'retry');
    await act('retry');
    await page.waitForFunction(async({baseline,questionId})=>{const d=(await ReadingLabDB.get('meta','state')).draft;return d?.baselineId===baseline&&d.practiceType==='transfer'&&d.questionId===questionId&&d.savedId===null;},{baseline,questionId:transferQuestionId});
    assert.deepEqual((await savedState()).draft.targetIssueIds,[first.id],'retrying the transfer keeps the original issue target');
    await completePractice();await saveResult(first.id);
    const afterTransfer=(await issues()).find(i=>i.id===first.id);
    assert.equal(afterTransfer.status,'resolved');assert.equal(afterTransfer.transferStatus,'resolved');
    assert.equal(await page.evaluate(async()=>{const sessions=await ReadingLabDB.list('sessions');return ReadingTraining.transferDueItems(sessions,Date.now()+2*ReadingTraining.DAY).length;}),0,'successful transfer clears its future reminder');
    assert.equal(await page.evaluate(async()=>ReadingCurriculum.assessProgress(await ReadingLabDB.list('sessions')).passagesPracticed),2);
    assert.equal(await page.evaluate(async()=>ReadingCurriculum.assessProgress(await ReadingLabDB.list('sessions')).historicalConfirmed),1,'verified issues retain historical evidence');

    await page.reload();await page.locator('#labQuestion').waitFor();
    assert.equal((await savedState()).sourceReadings[referenceId].completedAt>0,true);assert.equal((await issues()).find(i=>i.id===first.id).transferStatus,'resolved');
    assert.equal((await savedState()).draft.baselineId,baseline);
    await page.locator('#labQuestion').selectOption(candidates[0].id);await act('choose');
    await page.waitForFunction(async id=>{const d=(await ReadingLabDB.get('meta','state')).draft;return d?.questionId===id&&d.practiceType==='initial'&&d.savedId===null;},candidates[0].id);
    await completePractice(true);const audioBaseline=(await savedState()).draft.savedId;
    await act('retry');await page.waitForFunction(async id=>{const d=(await ReadingLabDB.get('meta','state')).draft;return d?.baselineId===id&&d.practiceType==='retry'&&d.savedId===null;},audioBaseline);
    await completePractice(true);const audioCurrent=(await savedState()).draft.savedId;
    assert.notEqual(audioBaseline,audioCurrent);
    await page.locator('[data-lab-action="play-comparison"][data-holder="labBaselineAudio"]').click();await page.locator('#labBaselineAudio audio').waitFor();
    await page.locator('[data-lab-action="play-comparison"][data-holder="labCurrentAudio"]').click();await page.locator('#labCurrentAudio audio').waitFor();
    assert.equal(await page.locator('#labBaselineAudio .lab-audio-download').count(),1);assert.equal(await page.locator('#labCurrentAudio .lab-audio-download').count(),1);
    assert.deepEqual(await page.evaluate(async ids=>Promise.all(ids.map(async id=>(await ReadingLabDB.get('audio',id))?.size>0)),[audioBaseline,audioCurrent]),[true,true],'both original audio blobs remain available');
    await page.screenshot({path:path.join(output,'recording-comparison-desktop.png'),fullPage:true});
    await page.setViewportSize({width:390,height:844});
    for(const name of ['home','learn','exam','history']){
      await view(name);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${name} must not overflow at 390 px`);
      await page.screenshot({path:path.join(output,`${name}-390.png`),fullPage:true});
    }
    await page.locator('#labExportAudio').check();const downloadPromise=page.waitForEvent('download');await act('export');const download=await downloadPromise;
    const backup=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
    assert.equal(backup.sessions.length,6);assert.equal(backup.audio.length,2);assert.equal(backup.state.sourceReadings[referenceId].completedAt>0,true);
    assert.ok(backup.sessions.some(s=>s.practiceType==='retry'&&s.baselineId===baseline&&s.reviewResults.some(r=>r.issueId===first.id&&r.status==='resolved')));
    assert.ok(backup.sessions.some(s=>s.practiceType==='transfer'&&s.baselineId===baseline&&s.reviewResults.some(r=>r.issueId===first.id&&r.status==='resolved')));
    await act('clear-lab');await view('history');assert.equal(await page.locator('.lab-history').count(),0);
    await page.locator('#labImport').setInputFiles({name:'curriculum-workflow-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
    await page.waitForFunction(async()=>{const sessions=await ReadingLabDB.list('sessions');return sessions.length===6&&ReadingTraining.issueHistory(sessions).some(i=>i.transferStatus==='resolved');});
    assert.equal((await savedState()).sourceReadings[referenceId].completedAt,backup.state.sourceReadings[referenceId].completedAt);
    assert.deepEqual(await page.evaluate(async ids=>Promise.all(ids.map(async id=>(await ReadingLabDB.get('audio',id))?.size>0)),[audioBaseline,audioCurrent]),[true,true],'both comparison recordings survive backup import');
    assert.equal(await page.evaluate(()=>ReadingLabLearning.examPool().length),64);
    assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
    console.log('PASS: curriculum plan and six-topic coverage; source-only reading task and persistent completion; topic filters; authentic 64-passage formal pool; issue pagination and preserved confirmed IDs; locked phrase recording controls; next-day transfer reminders; same-text retry and transfer retry retaining its original target; two preserved fake-device recordings in A/B players; audio/workflow backup/reload/import; 390 px layouts; zero page/console errors or external requests.');
    console.log('Screenshots:',output);
  }catch(error){
    console.error('Status:',await page.locator('#labStatus').textContent().catch(()=>''),'Errors:',errors);
    const state=await savedState().catch(()=>null);console.error('State:',JSON.stringify(state?{view:state.view,config:state.config,draft:state.draft,sourceReadings:state.sourceReadings}:null,null,2));
    await page.screenshot({path:path.join(output,'failure.png'),fullPage:true}).catch(()=>{});console.error('Screenshots:',output);throw error;
  }finally{await context.close();await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
