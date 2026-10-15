/* Run: npm ci && npx playwright install chromium && npm run test:browser */
const {chromium}=require("playwright"),assert=require("node:assert/strict"),http=require("node:http"),fs=require("node:fs"),path=require("node:path"),os=require("node:os");
const project=path.resolve(__dirname,".."),output=fs.mkdtempSync(path.join(os.tmpdir(),"fly-room-lab-browser-"));
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json"};
const server=http.createServer((request,response)=>{
  try{
    const pathname=decodeURIComponent(new URL(request.url,"http://localhost").pathname),file=path.resolve(project,"."+(pathname==="/"?"/index.html":pathname));
    if(!file.startsWith(project+path.sep)||!fs.statSync(file).isFile()){response.writeHead(404).end();return;}
    response.setHeader("Content-Type",mime[path.extname(file)]||"application/octet-stream");response.end(fs.readFileSync(file));
  }catch{response.writeHead(404).end();}
});
(async()=>{
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));const origin=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({headless:true,...(process.env.LAB_BROWSER_PATH?{executablePath:process.env.LAB_BROWSER_PATH}:{}),args:["--use-fake-ui-for-media-stream","--use-fake-device-for-media-stream"]});
  const errors=[],external=[];
  const context=await browser.newContext({permissions:["microphone"],serviceWorkers:"block",viewport:{width:1280,height:900}});
  await context.addInitScript(()=>{localStorage.setItem("fa_gate","vrpmjf");localStorage.setItem("fa_onboarded","true");if(!localStorage.getItem("fa_legacy_lab_test"))localStorage.setItem("fa_legacy_lab_test",JSON.stringify({keep:"existing settings"}));});
  await context.route("**/*",route=>{if(route.request().url().startsWith(origin))return route.continue();external.push(route.request().url());return route.abort();});
  const page=await context.newPage();page.on("pageerror",e=>errors.push(e.message));page.on("dialog",dialog=>dialog.accept());
  const click=action=>page.locator(`#readingLabRoot [data-lab-action="${action}"]`).first().click();
  const view=async name=>{await page.locator(`#readingLabRoot .lab-nav [data-view="${name}"]`).click();};
  const waitSave=()=>page.waitForFunction(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open("fly-room-reading-lab",1);r.onsuccess=()=>resolve(r.result);});return new Promise(resolve=>{const tx=db.transaction("sessions"),r=tx.objectStore("sessions").count();r.onsuccess=()=>resolve(r.result>0);tx.oncomplete=()=>db.close();});});
  try{
    await page.goto(origin+"/#readingLab");await page.getByRole("heading",{name:"英文朗讀實驗室",exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>CI_PDF_DRILLS.length),38);
    await view("exam");await click("random");await page.locator('#labPreview').selectOption("15");
    await page.clock.install();await click("prepare");await page.clock.fastForward(15000);await page.locator('#labTimer').filter({hasText:"秒"}).waitFor();
    assert.equal(await page.locator('#labOriginal').count(),1);assert.equal(await page.locator('[data-lab-action="record"]').isEnabled(),true);
    await page.clock.resume();
    await click("record");await page.waitForFunction(()=>document.querySelector('#labStatus')?.textContent.includes('錄音中'),{},{timeout:15000});
    await page.waitForTimeout(1200);assert.equal(await page.locator('[data-lab-action="stop"]').isEnabled(),true);
    await click("stop");await page.locator('#labPlayback audio').waitFor();
    const original=await page.locator('#labOriginal').textContent();
    const transcript=original.replace(/practice/i,"practices")+" extraunexpected";
    await page.locator('#labTranscript').fill(transcript);await click("analyze");
    await page.locator('.lab-diff').waitFor();assert.ok(await page.locator('.lab-diff-extra').count());
    assert.equal(await page.locator('[data-lab-error][data-field="confirmed"]:checked').count(),0);
    await page.locator('[data-lab-error][data-field="confirmed"]').first().check();
    await page.locator('#labNotes').fill("回聽確認後再修正；保留原稿。");await click("save-session");await waitSave();
    await page.reload();await page.locator('#labTranscript').waitFor();assert.equal(await page.locator('#labTranscript').inputValue(),transcript);assert.equal(await page.locator('#labOriginal').textContent(),original);
    await view("history");await page.locator('.lab-history summary').first().click();await click("play-session");await page.locator('.lab-history audio').waitFor();
    await click("reviewed-session");
    await page.locator('#labExportAudio').check();const downloadPromise=page.waitForEvent("download");await click("export");const download=await downloadPromise;const backup=JSON.parse(fs.readFileSync(await download.path(),"utf8"));assert.equal(backup.sessions.length,1);assert.equal(backup.audio.length,1);assert.equal(backup.sessions[0].original,original);
    await view("words");assert.equal(await page.locator('[data-lab-action="word-reveal"]').isDisabled(),true);
    await click("sample-record");await page.waitForFunction(()=>document.querySelector('#labStatus')?.textContent.includes('嘗試錄音中'));await page.waitForTimeout(350);await click("sample-stop");await page.locator('#labSamplePlayback audio').waitFor();
    await click("word-attempt");await click("word-reveal");await page.locator('#labSamplePlayback audio').waitFor();await page.locator('[data-lab-action="word-grade"][data-grade="unsure"]').click();await click("done-words");
    await view("words");
    const generatedCount=await page.evaluate(()=>ReadingLabVocabulary.index.report.vocabularyCount);
    assert.equal(await page.evaluate(()=>ReadingLabData.words.length),await page.evaluate(()=>ReadingLabVocabulary.index.report.cardCount));assert.ok(generatedCount>33);
    assert.equal(await page.locator('.lab-answer').count(),0);
    await page.locator('[data-vocab-filter="airline"]').selectOption('長榮');await page.locator('#labWordSearch').fill('sustainability');assert.match(await page.locator('.lab-word').textContent(),/sustainability/i);
    assert.equal(await page.locator('.lab-answer').count(),0);assert.equal(await page.locator('[data-lab-action="word-reveal"]').isDisabled(),true);
    await click('word-attempt');await click('word-reveal');assert.match(await page.locator('.lab-answer').textContent(),/音節.*重音/);
    await page.locator('.lab-word-sources summary').click();await click('word-source');await page.locator('.lab-source-article').waitFor();assert.match(await page.locator('.lab-source-article').textContent(),/sustainability/i);
    await click('word-reset');const articleId=await page.locator('[data-vocab-filter="article"] option').nth(1).getAttribute('value');await page.locator('[data-vocab-filter="article"]').selectOption(articleId);assert.ok(await page.locator('.lab-word').count());
    await click('word-attempt');await click('word-reveal');await page.locator('.lab-word-sources summary').click();await click('word-source');await page.locator('.lab-source-article').waitFor();
    await click('word-reset');await page.locator('[data-vocab-filter="type"]').selectOption('model');await click('word-random');assert.equal(await page.locator('.lab-answer').count(),0);
    await page.locator('#labWordSearch').fill('notawordinthiscorpus');assert.equal(await page.locator('.lab-word').count(),0);await click('word-reset');
    await page.locator('[data-vocab-filter="status"]').selectOption('review');assert.ok(await page.locator('.lab-word').count());await click('word-reset');
    await view("places");await click("place-reveal");await click("place-grade");await click("place-favorite");await click("done-places");
    await page.getByText("今天四項訓練已完成。",{exact:true}).waitFor();
    await view("places");await page.locator('#labPlaceCategory').selectOption("華航航點與延伸地名");await page.locator('#labPlaceGroup').selectOption("東南亞");await page.locator('#labPlaceSearch').fill("DPS");
    assert.equal(await page.locator('.lab-destination-table tbody tr').count(),2);
    await page.locator('[data-lab-action="place-pick"][data-id="place-ci-denpasar"]').click();assert.equal(await page.locator('.lab-word').textContent(),"Denpasar");await click("place-reveal");assert.match(await page.locator('.lab-answer').textContent(),/den-PAH-sar/);await click("place-grade");await click("place-favorite");
    await page.locator('#labPlaceSearch').fill("找不到的地點");assert.equal(await page.locator('.lab-place-pick').count(),0);await page.locator('#labPlaceSearch').fill("");
    await click("place-reset");assert.equal(await page.locator('#labPlaceGroup').inputValue(),"全部地區");assert.equal(await page.locator('.lab-place-pick').count(),95);await page.locator('#labPlaceGroup').selectOption("東南亞");
    await view("history");await click("clear-lab");await view("history");assert.equal(await page.locator('.lab-history').count(),0);
    await page.locator('#labImport').setInputFiles({name:"lab-backup.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(backup))});await page.locator('.lab-history summary').waitFor();
    await page.locator('.lab-history summary').click();await click("play-session");await page.locator('.lab-history audio').waitFor();
    await click("delete-audio");await click("play-session");await page.waitForFunction(()=>document.querySelector('#labStatus')?.textContent.includes('沒有錄音'));
    assert.equal(await page.evaluate(()=>localStorage.getItem("fa_legacy_lab_test")),JSON.stringify({keep:"existing settings"}));
    await click("review-session");await page.locator('#labOriginal').waitFor();
    for(const width of [390,768,1280]){
      await page.setViewportSize({width,height:900});await view('words');await page.screenshot({path:path.join(output,`vocabulary-${width}.png`),fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`vocabulary overflow at ${width}`);
      if(width===390){await click('sample-record');await page.waitForFunction(()=>document.querySelector('#labStatus')?.textContent.includes('嘗試錄音中'));await page.waitForTimeout(350);await click('sample-stop');await page.locator('#labSamplePlayback audio').waitFor();}
      await page.setViewportSize({width,height:900});await view("places");if(!await page.locator('.lab-destination-group').first().evaluate(node=>node.open))await page.locator('.lab-destination-group summary').first().click();await page.screenshot({path:path.join(output,`destinations-${width}.png`),fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`destination overflow at ${width}`);
      await page.setViewportSize({width,height:900});await view("exam");await page.screenshot({path:path.join(output,`lab-${width}.png`),fullPage:true});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`horizontal overflow at ${width}`);
    }
    await page.evaluate(()=>showTab("ciBroadcast"));await page.locator('[data-ci-kind="mag"]').first().waitFor();assert.equal(await page.locator('[data-ci-kind="mag"]').count(),38);
    assert.equal(await page.locator('[data-ci-kind="ext"][data-ci-index="0"] select').count(),0,"Welcome Speech stays intact");
    await page.evaluate(()=>showTab("tools"));await page.locator('#toolBody').waitFor();await page.evaluate(()=>pronunciationRender());assert.ok(await page.locator('#pronounceInput').count());
    const denied=await context.newPage();
    denied.on("dialog",dialog=>dialog.accept());
    await denied.addInitScript(()=>{navigator.mediaDevices.getUserMedia=async()=>{const error=new Error("denied");error.name="NotAllowedError";throw error;};});
    await denied.goto(origin+"/#readingLab");await denied.locator('[data-lab-action="record"]').waitFor();await denied.locator('[data-lab-action="record"]').click();await denied.waitForFunction(()=>document.querySelector('#labStatus')?.textContent.includes('權限遭拒'));await denied.close();
    const unsupported=await context.newPage();unsupported.on("dialog",dialog=>dialog.accept());await unsupported.addInitScript(()=>{window.MediaRecorder=undefined;window.SpeechRecognition=undefined;window.webkitSpeechRecognition=undefined;});
    await unsupported.goto(origin+"/#readingLab");await unsupported.locator('[data-lab-action="record"]').waitFor();await unsupported.locator('[data-lab-action="record"]').click();await unsupported.waitForFunction(()=>document.querySelector('#labStatus')?.textContent.includes('不支援錄音'));
    await unsupported.locator('#labAudioFile').setInputFiles({name:"imported-recording.webm",mimeType:"audio/webm",buffer:Buffer.from(backup.audio[0].data.split(',')[1],"base64")});await unsupported.locator('#labPlayback audio').waitFor();
    await unsupported.locator('#labTranscript').fill(original);await unsupported.locator('[data-lab-action="analyze"]').click();await unsupported.locator('.lab-diff').waitFor();assert.match(await unsupported.locator('#labComparison').textContent(),/100%/);await unsupported.close();
    assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
    console.log("PASS: desktop/tablet/mobile; countdown; actual fake-device MediaRecorder start/stop/playback; silence; transcript diff; manual confirmation; IndexedDB reload; daily tasks; audio backup/import/deletion; legacy data and broadcast/vocabulary; zero external requests.");
    console.log("Screenshots:",output);
  }catch(error){console.error("Browser status:",await page.locator('#labStatus').textContent().catch(()=>"unavailable"),"page errors:",errors);await page.screenshot({path:path.join(output,"failure.png"),fullPage:true});console.error("Failure screenshot:",output);throw error;}
  finally{await context.close();await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
