/* Browser acceptance for the integrated, local-only interview preparation flow. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');

const root = path.resolve(__dirname, '..');
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'fly-room-prep-v2-'));
const server = http.createServer((req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/\/$/, '/index.html');
    const file = path.resolve(root, `.${pathname}`);
    if (!file.startsWith(`${root}${path.sep}`)) throw Error('outside project');
    res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json' })[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  } catch {
    res.writeHead(404).end();
  }
});

async function open(page, origin, view = 'home') {
  await page.goto(`${origin}/#ci/prep${view === 'home' ? '' : `/${view}`}`);
  await page.waitForFunction(() => window.PrepApp && window.CIFinalPrep?.registered?.length);
  await page.locator('#ciApp .prep-root').waitFor();
}

async function assertNoOverflow(page, width, name) {
  await page.setViewportSize({ width, height: 900 });
  await page.screenshot({ path: path.join(output, `${name}-${width}.png`), fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1), false, `${name}: viewport ${width} must not overflow`);
  assert.notEqual(await page.locator('.prep-nav').evaluate(element => getComputedStyle(element).position), 'fixed', `${name}: preparation navigation must not become a second bottom overlay`);
}

const area = page => page.locator('#ciApp .prep-root');
const action = (page, name) => area(page).locator(`[data-prep-action="${name}"]`);
async function view(page, name) {
  await area(page).locator(`[data-prep-view="${name}"]`).first().click();
}
async function start(page, mode) {
  await view(page, 'home');
  await area(page).locator(`.prep-mode[data-mode="${mode}"]`).click();
  await area(page).locator('.prep-session').waitFor();
}
async function chooseIndex(page, index) {
  const button = area(page).locator(`[data-prep-action="index"][data-index="${index}"]`);
  if (!await button.isVisible()) await area(page).locator('.prep-session > details > summary').click();
  await button.click();
}
async function state(page) { return page.evaluate(() => JSON.parse(JSON.stringify(PrepApp.getState()))); }
async function assess(page, { poor = false, monthly = false, notes = '' } = {}) {
  const form = area(page).locator('[data-prep-form="assessment"]');
  await form.locator('[name="startDelay"]').selectOption(poor ? 'over10' : 'within5');
  await form.locator('[name="completeness"]').selectOption(poor ? 'partial' : 'full');
  await form.locator('[name="fluency"]').selectOption(poor ? 'frequent' : 'smooth');
  await form.locator(`[name="problems"][value="${poor ? 'sentence' : 'none'}"]`).check();
  if (monthly) {
    await form.locator('[name="naturalEnding"]').check();
    await form.locator('[name="clearMeaning"]').check();
  }
  if (notes) await form.locator('[name="notes"]').fill(notes);
  await form.locator('[type="submit"]').click();
}
async function importData(page, value, name = 'prep-backup.json') {
  await view(page, 'data');
  await area(page).locator('[data-prep-import]').setInputFiles({ name, mimeType: 'application/json', buffer: Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)) });
}
async function assertValidState(page) {
  await page.evaluate(() => PrepCore.validateState(PrepApp.getState()));
}

(async () => {
  let browser;
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({
      headless: true,
      ...(process.env.LAB_BROWSER_PATH ? { executablePath: process.env.LAB_BROWSER_PATH } : {}),
      args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
    });
    const context = await browser.newContext({ permissions: ['microphone'], serviceWorkers: 'block', timezoneId: 'Asia/Taipei', viewport: { width: 1280, height: 900 } });
    await context.addInitScript(() => {
      localStorage.setItem('fa_gate', 'vrpmjf');
      localStorage.setItem('fa_onboarded', 'true');
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install({ time: new Date('2026-11-20T12:00:00+08:00') });
    await page.goto(`${origin}/#ci/home`);
    await page.waitForFunction(() => window.PrepApp && window.CIFinalPrep?.registered?.length);
    await area(page).waitFor();
    assert.match(await area(page).textContent(), /今天要練什麼/);
    assert.deepEqual(await area(page).locator('.prep-mode').evaluateAll(nodes => nodes.map(node => Number(node.dataset.mode))), [10, 35, 60]);
    assert.equal((await state(page)).sessions.length, 0);
    assert.match(await area(page).textContent(), /尚無足夠資料/);
    const initialPool = await page.evaluate(() => PrepApp.pool());
    assert.ok(initialPool.length > 192, 'reuse both the curated and multi-airline legacy banks');
    for (const company of ['華航', '長榮', '星宇', '國泰']) assert.ok(initialPool.some(question => question.company.includes(company)), company);
    assert.ok(initialPool.some(question => question.languages.includes('ko')), 'preserve Korean introduction support');
    assert.equal(initialPool.find(question => question.key === 'real-20261114-noodles').source, 'peer');
    assert.equal(initialPool.find(question => question.key === 'real-20261114-rice').source, 'actual');
    assert.equal(initialPool.some(question => /TOEIC|多益/.test(question.type)), false, 'no TOEIC practice category');

    await start(page, 10);
    let active = (await state(page)).active;
    assert.equal(active.mode, 10);
    assert.equal(active.entries.length, 1);
    assert.equal(active.entries[0].language, 'en');
    assert.equal(await area(page).locator('.prep-reference').count(), 0, 'answers start hidden');
    await action(page, 'think').click();
    await action(page, 'think-skip').click();
    assert.match(await area(page).locator('#prepThink').textContent(), /開始/);
    await page.clock.fastForward(32000);
    await action(page, 'pause').click();
    const pausedMs = (await state(page)).active.elapsedMs;
    await page.clock.fastForward(120000);
    assert.equal((await state(page)).active.elapsedMs, pausedMs, 'pause excludes elapsed wall time');
    await action(page, 'pause').click();
    await page.clock.fastForward(15000);
    await action(page, 'reveal').click();
    await area(page).locator('.prep-reference').waitFor();
    await area(page).locator('[data-prep-reference]').selectOption('zh');
    assert.equal(await area(page).locator('.prep-reference .ansbox').first().getAttribute('lang'), 'zh-Hant');
    await area(page).locator('[data-prep-reference]').selectOption('en');
    assert.equal(await area(page).locator('.prep-reference .ansbox').first().getAttribute('lang'), 'en');
    await action(page, 'reveal').click();
    assert.equal(await area(page).locator('.prep-reference').count(), 0);
    await assess(page, { poor: true, notes: '先用短句說重點。' });
    active = (await state(page)).active;
    const firstId = active.entries[0].questionId;
    assert.equal(active.assessments[firstId].reviewDate, '2026-11-22');
    await action(page, 'phase-next').click();
    assert.match(await area(page).locator('.prep-session h2').textContent(), /修正與重答/);
    await action(page, 'retry-current').click();
    assert.equal((await state(page)).active.entries.length, 1, 'retry does not add another scheduled question');
    await action(page, 'complete').click();
    assert.match(await area(page).textContent(), /今天已經完成練習，可以安心休息了。/);
    let current = await state(page);
    assert.equal(current.sessions.length, 1);
    assert.equal(current.sessions[0].status, 'completed');
    assert.ok(current.sessions[0].elapsedMs >= 47000 && current.sessions[0].elapsedMs < 50000, 'count active practice only');
    await assertValidState(page);

    await start(page, 35);
    active = (await state(page)).active;
    assert.equal(active.entries.length, 3);
    assert.equal(new Set(active.entries.map(entry => entry.questionId)).size, active.entries.length);
    assert.deepEqual(active.entries.map(entry => entry.stage), ['review', 'english', 'english']);
    assert.ok(active.entries.some(entry => entry.language === 'zh'), 'normal mixed practice includes Chinese');
    assert.ok(active.entries.filter(entry => entry.language === 'en').length > active.entries.filter(entry => entry.language === 'zh').length, 'normal mixed practice still prioritizes English');
    for (const phase of ['0', '1', '2', '3']) {
      await area(page).locator(`[data-prep-action="phase"][data-phase="${phase}"]`).click();
      assert.equal((await state(page)).active.phase, Number(phase));
    }
    await chooseIndex(page, 0);
    await assess(page);
    await action(page, 'next').click();
    await action(page, 'skip').click();
    assert.ok((await state(page)).active.entries.some(entry => entry.status === 'skipped'));
    await assess(page);
    await page.clock.fastForward(20000);
    await action(page, 'finish').click();
    current = await state(page);
    assert.equal(current.sessions.at(-1).mode, 35);
    assert.equal(current.sessions.at(-1).status, 'early');
    assert.ok(current.sessions.at(-1).elapsedMs >= 20000);
    await assertValidState(page);

    await start(page, 10);
    await assess(page);
    const answeredId = (await state(page)).active.entries[0].questionId;
    const seenSwapIds = new Set([answeredId]);
    for (let swap = 0; swap < 3; swap++) {
      await action(page, 'swap').click();
      active = (await state(page)).active;
      const replacementId = active.entries[active.index].questionId;
      assert.equal(seenSwapIds.has(replacementId), false, 'successive swaps cannot bring back a question from this session');
      seenSwapIds.add(replacementId);
      assert.ok(active.assessments[answeredId], 'swap preserves an already answered question');
      assert.ok(active.entries.some(entry => entry.questionId === answeredId));
      await assertValidState(page);
    }
    await action(page, 'finish').click();

    await start(page, 60);
    active = (await state(page)).active;
    assert.equal(active.entries.length, 8);
    assert.equal(new Set(active.entries.map(entry => entry.questionId)).size, 8);
    assert.deepEqual(active.entries.reduce((counts, entry) => (counts[entry.stage] = (counts[entry.stage] || 0) + 1, counts), {}), { review: 1, english: 3, mock: 4 });
    for (const phase of ['0', '1', '2', '3', '4']) {
      await area(page).locator(`[data-prep-action="phase"][data-phase="${phase}"]`).click();
      assert.equal((await state(page)).active.phase, Number(phase));
    }
    await area(page).locator('[data-prep-mock-language]').selectOption('zh');
    assert.ok((await state(page)).active.entries.filter(entry => entry.stage === 'mock').every(entry => entry.language === 'zh'));
    await area(page).locator('[data-prep-mock-language]').selectOption('en');
    assert.ok((await state(page)).active.entries.filter(entry => entry.stage === 'mock').every(entry => entry.language === 'en'));
    await area(page).locator('[data-prep-mock-language]').selectOption('mixed');
    const mockLanguages = (await state(page)).active.entries.filter(entry => entry.stage === 'mock').map(entry => entry.language);
    assert.ok(mockLanguages.includes('zh') && mockLanguages.includes('en'), 'switching back to mixed restores both languages');
    await page.clock.fastForward(12000);
    const beforeReload = (await state(page)).active.elapsedMs;
    await page.reload();
    await area(page).locator('.prep-session').waitFor();
    assert.equal((await state(page)).active.paused, true, 'reload resumes as paused');
    await page.clock.fastForward(90000);
    assert.ok((await state(page)).active.elapsedMs - beforeReload < 2000, 'closed-page interval excluded');
    await action(page, 'pause').click();
    await area(page).locator('[data-prep-mode]').selectOption('10');
    current = await state(page);
    assert.equal(current.active.mode, 10);
    assert.equal(current.sessions.at(-1).mode, 60);
    assert.equal(current.sessions.at(-1).status, 'early');
    await action(page, 'finish').click();
    await assertValidState(page);

    await area(page).locator('[data-prep-language]').selectOption('ko');
    await start(page, 35);
    active = (await state(page)).active;
    const koreanIndex = active.entries.findIndex(entry => entry.language === 'ko');
    assert.ok(koreanIndex >= 0, 'Korean preference uses existing Korean material');
    await chooseIndex(page, koreanIndex);
    await action(page, 'reveal').click();
    assert.match(await area(page).locator('.prep-reference .ansbox').first().textContent(), /안녕하십니까/);
    await action(page, 'finish').click();
    await area(page).locator('[data-prep-language]').selectOption('mixed');

    await view(page, 'plan');
    const planForm = area(page).locator('[data-prep-form="plan"]');
    const week = await page.evaluate(() => PrepCore.weekKey());
    assert.ok(Object.values((await state(page)).plans)[0].days.every(day => day.kind === 'unset'), 'never infer workdays from weekdays');
    await planForm.locator('[name="goal"]').fill('100');
    const days = (await state(page)).plans[week].days.map(day => day.date);
    await planForm.locator(`[name="kind-${days[0]}"]`).selectOption('working');
    await planForm.locator(`[name="mode-${days[0]}"]`).selectOption('10');
    await planForm.locator(`[name="kind-${days[1]}"]`).selectOption('off');
    await planForm.locator(`[name="kind-${days[2]}"]`).selectOption('rest');
    await planForm.locator('[type="submit"]').click();
    current = await state(page);
    assert.equal(current.plans[week].goal, 100);
    assert.equal(current.plans[week].days[0].kind, 'working');
    assert.equal(current.plans[week].days[0].mode, 10);
    assert.equal(current.plans[week].days[1].kind, 'off');
    assert.equal(current.plans[week].days[2].mode, 0);
    await area(page).locator(`[data-prep-action="clear-day"][data-date="${days[5]}"]`).click();
    assert.equal((await state(page)).plans[week].days[5].mode, 0, 'concentrated mode is optional');
    await action(page, 'week').filter({ hasText: '下一週' }).click();
    assert.equal(await area(page).locator('[data-prep-form="plan"] [name="goal"]').inputValue(), '185');
    assert.match(await area(page).textContent(), /未做的練習不會累積到下週/);
    await action(page, 'week').filter({ hasText: '前一週' }).click();
    await view(page, 'home');
    await action(page, 'rest').click();
    assert.match(await area(page).textContent(), /今天安排休息/);
    await action(page, 'ten').click();
    assert.match(await area(page).textContent(), /10 分鐘/);

    await view(page, 'week');
    const beforeAudit = await page.evaluate(() => PrepCore.weeklySummary(PrepApp.getState(), PrepCore.weekKey()));
    await view(page, 'audit');
    const auditForm = area(page).locator('[data-prep-form="audit"]');
    await auditForm.locator('[name="toeicStudied"]').check();
    await auditForm.locator('[name="toeicMinutes"]').fill('300');
    await auditForm.locator('[name="toeicTypes"][value="listening"]').check();
    await auditForm.locator('[name="toeicGoal"]').selectOption('partial');
    await auditForm.locator('[name="exercise"]').check();
    await auditForm.locator('[name="best"]').fill('有練習，也有休息。');
    await auditForm.locator('[type="submit"]').click();
    await view(page, 'week');
    const afterAudit = await page.evaluate(() => PrepCore.weeklySummary(PrepApp.getState(), PrepCore.weekKey()));
    assert.equal(afterAudit.minutes, beforeAudit.minutes, 'TOEIC manual minutes never enter interview totals');
    assert.equal(afterAudit.goal, 100);
    assert.equal(afterAudit.percent, afterAudit.minutes, 'use edited 100-minute denominator');
    await view(page, 'audit');
    assert.equal(await area(page).locator('[name="toeicMinutes"]').inputValue(), '300');

    await view(page, 'progress');
    assert.match(await area(page).textContent(), /尚無足夠資料/);
    await action(page, 'monthly-start').click();
    active = (await state(page)).active;
    assert.equal(active.entries.length, 5);
    assert.equal(new Set(active.entries.map(entry => entry.questionId)).size, 5);
    for (let index = 0; index < 5; index++) {
      if (index) await chooseIndex(page, index);
      await assess(page, { monthly: true });
    }
    await action(page, 'complete').click();
    await view(page, 'progress');
    const month = await page.evaluate(() => PrepCore.monthKey());
    current = await state(page);
    assert.deepEqual(current.monthly[month].metrics, { start: 5, structure: 5, ending: 5, meaning: 5 });
    assert.equal(current.monthly[month].selfRated, true);
    assert.equal(await action(page, 'monthly-start').isDisabled(), true);
    assert.match(await area(page).textContent(), /自評/);
    assert.equal(await area(page).locator('.prep-table tbody tr').count(), 1);
    await assertValidState(page);

    await view(page, 'data');
    const downloadPromise = page.waitForEvent('download');
    await action(page, 'export').click();
    const download = await downloadPromise;
    const exported = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    assert.equal(exported.sessions.length, current.sessions.length);
    const beforeInvalid = JSON.stringify(await state(page));
    await importData(page, { ...exported, version: 999 });
    await page.waitForFunction(() => document.getElementById('prepMessage')?.textContent.includes('匯入失敗'));
    assert.equal(JSON.stringify(await state(page)), beforeInvalid, 'invalid schema must not overwrite');
    await importData(page, '{broken JSON');
    await page.waitForFunction(() => document.getElementById('prepMessage')?.textContent.includes('匯入失敗'));
    assert.equal(JSON.stringify(await state(page)), beforeInvalid, 'malformed JSON must not overwrite');
    exported.settings.weaknesses = ['start', 'sentence'];
    await importData(page, exported);
    await page.waitForFunction(() => document.getElementById('prepMessage')?.textContent.includes('已匯入'));
    assert.deepEqual((await state(page)).settings.weaknesses, ['start', 'sentence']);
    await page.reload();
    await area(page).waitFor();
    assert.equal(await page.locator('#dataBanner').isVisible(), false, 'a saved preparation history is not advertised as empty');
    assert.deepEqual((await state(page)).settings.weaknesses, ['start', 'sentence']);
    assert.equal((await state(page)).audits[week].toeicMinutes, 300);
    await assertValidState(page);

    const beforeGlobalInvalid = JSON.stringify(await state(page));
    const legacyStars = await page.evaluate(() => localStorage.getItem('fa_stars'));
    await page.evaluate(() => showTab('stats'));
    await page.locator('#impFile').setInputFiles({ name: 'invalid-whole-site-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ _v: 2, stars: [999], prepV2: { ...exported, version: 999 } })) });
    await page.waitForFunction(() => document.getElementById('bkMsg')?.textContent.includes('格式'));
    assert.equal(await page.evaluate(() => localStorage.getItem('fa_stars')), legacyStars, 'reject whole-site import before overwriting any old keys');
    assert.equal(JSON.stringify(await state(page)), beforeGlobalInvalid);
    await page.evaluate(() => PrepApp.open('data'));

    await start(page, 10);
    await action(page, 'record').click();
    await page.waitForFunction(() => document.querySelector('[data-prep-action="record"]')?.textContent.includes('停止錄音'));
    await page.clock.fastForward(2000);
    await action(page, 'record').click();
    await area(page).locator('#prepAudio audio').waitFor();
    assert.equal(await area(page).locator('#prepAudio a[download]').count(), 1);
    await action(page, 'record').click();
    await page.waitForFunction(() => document.querySelector('[data-prep-action="record"]')?.textContent.includes('停止錄音'));
    await action(page, 'record').click();
    await area(page).locator('#prepAudio audio').waitFor();
    assert.equal(await area(page).locator('#prepAudio audio').count(), 1, 'rerecord replaces the local preview');
    await action(page, 'finish').click();

    for (const screen of ['home', 'plan', 'week', 'audit', 'progress', 'history', 'data']) {
      await view(page, screen);
      for (const width of [390, 768, 1280]) await assertNoOverflow(page, width, screen);
    }
    await start(page, 60);
    await action(page, 'reveal').click();
    for (const width of [390, 768, 1280]) await assertNoOverflow(page, width, 'session');
    await action(page, 'finish').click();

    await page.goto(`${origin}/#ci/final-topics/real-20261114`);
    await page.locator('#ciFinalList').waitFor();
    assert.equal(await page.locator('.ci-final-question').count(), 3);
    await page.evaluate(() => CIFinalStudy.open('intro'));
    await page.locator('#ci-final-intro [data-final-reveal]').click();
    assert.match(await page.locator('#ci-final-intro').textContent(), /안녕하십니까/);
    await page.evaluate(() => showTab('bank'));
    await page.locator('#bankList').waitFor();
    assert.ok(await page.evaluate(() => DATA.length > 500));
    await page.goto(`${origin}/#ci/broadcast`);
    await page.locator('#tab-ciBroadcast').waitFor();
    await page.locator('#tab-ciBroadcast .say').first().waitFor({ state: 'attached' });
    assert.ok(await page.locator('#tab-ciBroadcast .say').count(), 'broadcast TTS remains available');

    const deniedContext = await browser.newContext({ serviceWorkers: 'block', timezoneId: 'Asia/Taipei' });
    await deniedContext.addInitScript(() => {
      localStorage.setItem('fa_gate', 'vrpmjf');
      localStorage.setItem('fa_onboarded', 'true');
      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: () => Promise.reject(new DOMException('Denied for acceptance test', 'NotAllowedError')) });
    });
    const denied = await deniedContext.newPage();
    denied.on('pageerror', error => errors.push(error.message));
    await open(denied, origin);
    await start(denied, 10);
    await action(denied, 'record').click();
    await denied.waitForFunction(() => document.getElementById('prepMessage')?.textContent.includes('可以直接口說'));
    await assess(denied);
    await action(denied, 'complete').click();
    assert.equal((await state(denied)).sessions.length, 1, 'denied microphone still permits manual completion');
    await assertValidState(denied);
    await deniedContext.close();
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log(JSON.stringify({ ok: true, scenarios: ['cold start', '10/35/60 stages', 'pause and real duration', 'skip and retry and repeated swap', 'mode switch', 'reload checkpoint', 'weekly plan and rest', 'TOEIC audit isolation', 'monthly self-test', 'validated JSON', 'record and replay and rerecord', 'denied microphone manual fallback', '390/768/1280 layout', 'legacy bank and introductions and broadcasts'], screenshots: output }, null, 2));
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
})();
