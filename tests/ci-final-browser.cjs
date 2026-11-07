const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const root=path.resolve(__dirname,'..'),out=fs.mkdtempSync(path.join(os.tmpdir(),'fly-room-ci-final-'));
const server=http.createServer((req,res)=>{try{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));if(!file.startsWith(root+path.sep))throw Error();res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{
  let browser;
  try{
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
    browser=await chromium.launch({headless:true,...(process.env.LAB_BROWSER_PATH?{executablePath:process.env.LAB_BROWSER_PATH}:{}),args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
    const context=await browser.newContext({permissions:['microphone'],serviceWorkers:'block',timezoneId:'Asia/Taipei',viewport:{width:1280,height:900}}),errors=[];
    await context.addInitScript(()=>{
      localStorage.setItem('fa_gate','vrpmjf');localStorage.setItem('fa_onboarded','true');
      if(!localStorage.getItem('ci-final-fixture')){localStorage.setItem('ci-final-fixture','1');localStorage.setItem('fa_stars','[0]');localStorage.setItem('fa_practiced','{"0":4}');}
      window.SpeechRecognition=class{start(){}stop(){this.onend?.()}abort(){this.onend?.()}};
    });
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/#ci/final');await page.locator('[data-ci-module="final-topics"]').click();
    await page.waitForFunction(()=>CIFinalPrep.registered?.length===39);await page.locator('.ci-final-question').nth(38).waitFor();
    assert.equal(await page.locator('.ci-final-question').count(),39);
    assert.equal(await page.evaluate(()=>CIFinalPrep.registered.find(x=>x.key==='intro').id),0);
    await page.locator('#ci-final-intro>summary').click();assert.match(await page.locator('#ci-final-intro').textContent(),/回顧已問過/);
    await page.locator('#ci-final-intro [data-final-reveal]').click();assert.equal(await page.locator('#ci-final-intro .ansbox').count(),2);
    await page.locator('#ciFinalFilter').selectOption('英文核心');assert.equal(await page.locator('.ci-final-question').count(),7);
    assert.equal(await page.locator('#ciFinalEnglish p').count(),6);
    await page.locator('#ciFinalFilter').selectOption('全部');await page.locator('#ciFinalSearch').fill('機上也可以嗎');assert.equal(await page.locator('.ci-final-question').count(),1);
    await page.locator('#ci-final-unfamiliar-equipment>summary').click();await page.locator('#ciFinalLang').selectOption('en');await page.locator('[data-final-reveal]').click();
    assert.equal(await page.locator('.ci-final-answers [lang="en"]').count(),1);assert.equal(await page.locator('.ci-final-answers [lang="zh-Hant"]').count(),0);
    await page.locator('#ciFinalLang').selectOption('both');assert.equal(await page.locator('.ci-final-answers .ansbox').count(),2);
    let pending=page.waitForEvent('download');await page.locator('[data-final-download]').click();let download=await pending;
    assert.equal(fs.readFileSync(await download.path(),'utf8'),require('../ci-final-data.js').markdown());
    await page.locator('#ciFinalSearch').fill('');await page.locator('#ci-final-runway-news>summary').click();
    assert.match(await page.locator('#ci-final-runway-news .ci-final-sources a').first().getAttribute('href'),/202610290323/);
    await page.locator('#ci-final-runway-news [data-final-jump="delay-pressure"]').click();assert.equal(await page.locator('#ci-final-delay-pressure').getAttribute('open'),'');
    await page.locator('#ci-final-power-bank>summary').click();await page.locator('#ci-final-power-bank [data-final-star]').click();
    const powerId=await page.evaluate(()=>CIFinalPrep.registered.find(x=>x.key==='power-bank').id);assert.ok(powerId<0);
    await page.locator('#ciFinalFilter').selectOption('弱點收藏');assert.equal(await page.locator('.ci-final-question').count(),2);
    await page.reload();await page.waitForFunction(()=>CIFinalPrep.registered?.length===39);
    assert.equal(await page.locator('#ciFinalFilter').inputValue(),'弱點收藏');assert.equal(await page.locator('.ci-final-question').count(),2);
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('fa_practiced'))[0]),4);
    await page.evaluate(()=>showTab('weak'));assert.equal(await page.locator('#starList .qa').count(),2);
    await page.evaluate(()=>showTab('stats'));assert.equal(await page.evaluate(()=>srsDueIds().length),2);
    await page.locator('#srsStart').click();await page.locator('#srsOk').click();assert.match(await page.locator('#srsBody').textContent(),/行動電源/);
    await page.locator('#srsShow').click();assert.match(await page.locator('#srsAns').textContent(),/power bank/);
    await page.evaluate(()=>CIFinalStudy.open('power-bank'));
    const record=async lang=>{
      await page.locator(`#ci-final-power-bank [data-final-record][data-lang="${lang}"]`).click();await page.locator('#mRec').waitFor();
      assert.equal(await page.locator('#mLang').inputValue(),lang);assert.equal(await page.evaluate(()=>M.q.key),'power-bank');
      await page.locator('#mRec').click();await page.waitForFunction(()=>M.recActive);await page.waitForTimeout(1400);
      await page.evaluate(l=>{M.finalT=l==='en'?CIFinalPrep.byKey['power-bank'].a_en:CIFinalPrep.byKey['power-bank'].a_zh;},lang);
      await page.locator('#mStop').click();await page.locator('#mResult audio').waitFor();
      pending=page.waitForEvent('download');await page.locator('#mResult a[download]').click();download=await pending;assert.ok(fs.statSync(await download.path()).size>100);
      await page.locator('#mSaveBtn').click();await page.waitForFunction(()=>document.getElementById('mSaveBtn').textContent.includes('已儲存'));
      const saved=await page.evaluate(async()=>{const r=(await mList())[0];return {key:r.questionKey,lang:r.lang,size:r.audio.size,transcript:r.transcript};});
      assert.equal(saved.key,'power-bank');assert.equal(saved.lang,lang);assert.ok(saved.size>100);assert.ok(saved.transcript.length>50);
      await page.locator('#mBody [data-open-final-study]').click();assert.match(page.url(),/#ci\/final-topics\/power-bank$/);
    };
    await record('en');await record('zh');await page.reload();await page.waitForFunction(()=>CIFinalPrep.registered?.length===39);
    assert.deepEqual(await page.evaluate(async()=>(await mList()).map(x=>x.lang)),['zh','en']);
    await page.evaluate(()=>showTab('stats'));pending=page.waitForEvent('download');await page.locator('#expBtn').click();download=await pending;
    const backup=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.ok(backup.stars.includes(0));assert.ok(backup.stars.includes(powerId));assert.equal(backup.practiced[0],4);assert.equal(backup.mockRecs[0].questionKey,'power-bank');assert.ok(backup.ciFinalStudy);
    await page.evaluate(()=>CIFinalStudy.open('runway-news'));await page.locator('#ciFinalSearch').fill('最近有沒有關注華航新聞');await page.locator('#ci-final-runway-news [data-final-reveal]').click();
    for(const width of [390,768,1280]){
      await page.setViewportSize({width,height:900});await page.evaluate(()=>scrollTo(0,0));
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`overflow at ${width}`);
      await page.screenshot({path:path.join(out,`ci-final-${width}.png`),fullPage:true});
    }
    assert.deepEqual(errors,[]);console.log(JSON.stringify({questions:39,recordingLanguages:['zh','en'],downloadedGuide:true,preservedLegacyState:true,consoleErrors:errors,output:out}));
    await context.close();
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
