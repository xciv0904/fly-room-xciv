'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../prep-core.js');
const Pages = require('../prep-pages.js');

const WEEK = '2026-11-16';
const MONTH = '2026-11';
const NOW = Date.parse('2026-11-20T12:00:00+08:00');
const GOOD = { startDelay: 'within5', completeness: 'full', fluency: 'smooth', problems: ['none'] };
const POOR = { startDelay: 'over10', completeness: 'partial', fluency: 'frequent', problems: ['sentence', 'incomplete'] };

function context(state = C.emptyState()) {
  return {
    state, core: { ...C, monthKey: () => MONTH }, week: WEEK, month: MONTH,
    pool: [{ id: 'ci:rice', label: '如何煮白飯？', q_zh: '如何煮白飯？', q_en: 'How to cook rice?', sourceLabel: '本人實際作答', type: 'how-to' }]
  };
}

function practice(state, options = {}) {
  const startedAt = options.startedAt || NOW;
  const entry = { questionId: options.questionId || 'ci:rice', language: options.language || 'en', type: 'how-to', reason: options.reason || '你主動選擇再練一次。', stage: 'english', status: 'pending' };
  const session = C.createSession([entry], 10, startedAt);
  C.recordAssessment(session, entry, options.selfAssessment || GOOD, startedAt + 5000);
  C.finish(session, options.status || 'completed', startedAt + (options.duration || 60000));
  state.sessions.push(session);
  return session;
}

test('every preparation page supports a first visit without inventing progress or mutating data', () => {
  const ctx = context();
  const before = JSON.stringify(ctx.state);
  for (const view of ['plan', 'week', 'audit', 'progress', 'history', 'data']) {
    const html = Pages.render(view, ctx);
    assert.match(html, /class="card/);
    assert.doesNotMatch(html, /undefined|NaN|onclick=|onchange=/);
  }
  assert.equal(JSON.stringify(ctx.state), before);
  assert.match(Pages.render('week', ctx), /尚無足夠資料/);
  assert.match(Pages.render('progress', ctx), /尚無足夠資料/);
  assert.match(Pages.render('history', ctx), /還沒有練習紀錄/);
});

test('weekly plan exposes actual shift choices, editable goals and only the three authorized durations', () => {
  const ctx = context();
  const plan = C.ensurePlan(ctx.state, WEEK);
  plan.goal = 90;
  plan.days[1].kind = 'rest';
  plan.days[1].mode = 0;
  const html = Pages.render('plan', ctx);
  assert.equal((html.match(/data-day="2026-11-/g) || []).length, 7);
  assert.match(html, /name="goal"[^>]*value="90"/);
  for (const kind of ['unset', 'working', 'off', 'plans', 'rest']) assert.match(html, new RegExp(`option value="${kind}"`));
  assert.equal((html.match(/data-prep-action="clear-day"/g) || []).length, 7);
  const durationSelects = [...html.matchAll(/<select name="mode-[^"]+">([\s\S]*?)<\/select>/g)];
  for (const [, select] of durationSelects) {
    assert.deepEqual([...select.matchAll(/option value="(\d+)"/g)].map(match => Number(match[1])), [0, 10, 35, 60]);
  }
  assert.match(html, /未做的練習不會累積到下週/);
  assert.match(html, /每天仍保留你自己的休息與生活時間/);
});

test('TOEIC stays optional in the audit and its minutes do not enter interview progress', () => {
  const ctx = context();
  ctx.state.audits[WEEK] = { toeicMinutes: 600, toeicStudied: true, toeicTypes: ['listening', 'errors'], toeicGoal: 'partial' };
  const html = Pages.render('audit', ctx);
  assert.match(html, /多益準備（其他教材，手動紀錄）/);
  assert.doesNotMatch(html, /\brequired(?:\s|=|>)/);
  for (const name of ['interviewEnglish', 'interviewChinese', 'reviewWeak', 'usedSite', 'toeicStudied', 'toeicMinutes', 'toeicTypes', 'toeicGoal', 'relax', 'exercise', 'social', 'rest', 'stressOkay', 'best', 'difficulty', 'change', 'notes']) {
    assert.match(html, new RegExp(`name="${name}"`));
  }
  assert.match(html, /name="toeicMinutes"[^>]*value="600"/);
  assert.match(html, /value="partial" selected/);
  assert.equal(C.weeklySummary(ctx.state, WEEK).minutes, 0);
  for (const view of ['plan', 'week', 'progress', 'history', 'data']) assert.doesNotMatch(Pages.render(view, ctx), /多益|TOEIC|toeicMinutes|toeicTypes/);
});

test('user text and retained question labels are escaped across pages and never become executable markup', () => {
  const ctx = context();
  const unsafe = '</textarea><script>alert("x")</script><img src=x onerror=alert(1)>';
  ctx.state.audits[WEEK] = { notes: unsafe, best: unsafe, difficulty: unsafe, change: unsafe };
  ctx.pool[0].label = unsafe;
  ctx.pool[0].sourceLabel = unsafe;
  practice(ctx.state, { selfAssessment: { ...POOR, notes: unsafe }, reason: unsafe });
  for (const view of ['audit', 'history', 'week']) {
    const html = Pages.render(view, ctx);
    assert.match(html, /&lt;script&gt;/);
    assert.doesNotMatch(html, /<script>|<img src=x|<\/textarea><script>/);
  }
});

test('weekly progress uses the user target and presents zero-goal weeks without a false percentage', () => {
  const ctx = context();
  C.ensurePlan(ctx.state, WEEK).goal = 100;
  practice(ctx.state, { duration: 75 * 60000 });
  const html = Pages.render('week', ctx);
  assert.match(html, /75%/);
  assert.match(html, /已達本週目標/);
  assert.match(html, /data-prep-action="retry" data-id="ci:rice"/);
  ctx.state.plans[WEEK].goal = 0;
  const rest = Pages.render('week', ctx);
  assert.match(rest, /本週不設目標/);
  assert.doesNotMatch(rest, /Infinity|NaN|class="prep-progress"/);
});

test('monthly tracking shows recorded quantities separately from four self-rated zero-to-five metrics', () => {
  const ctx = context();
  practice(ctx.state, { duration: 2 * 60000 });
  ctx.state.monthly[MONTH] = { date: '2026-11-20', questionIds: ['1', '2', '3', '4', '5'], sessionId: 'month-test', selfRated: true, metrics: { start: 0, structure: 2, ending: 4, meaning: 5 } };
  ctx.state.monthly['2026-10'] = { date: '2026-10-20', questionIds: ['6', '7', '8', '9', '10'], sessionId: 'old-test', selfRated: true, metrics: { start: 1, structure: 1, ending: 3, meaning: 4 } };
  const html = Pages.render('progress', ctx);
  assert.match(html, /2 分鐘/);
  assert.match(html, /已作答題次/);
  assert.match(html, /0 \/ 5/);
  assert.match(html, /5 \/ 5/);
  assert.match(html, /本月變化 -1 題/);
  assert.match(html, /本月變化 \+1 題/);
  assert.match(html, /不是|不會自動判定文法、發音或流暢度/);
  assert.match(html, /不同月份題目不同，僅作自我觀察/);
  assert.match(html, /2026-10 5 秒內開始回答自評 1 題/);
  assert.match(html, /data-prep-action="monthly-start" disabled/);
});

test('archived and future month views return to the current month instead of starting a misleading test', () => {
  const ctx = context();
  for (const month of ['2026-10', '2026-12']) {
    ctx.month = month;
    const html = Pages.render('progress', ctx);
    assert.match(html, /data-prep-action="current-month"/);
    assert.doesNotMatch(html, /data-prep-action="monthly-start"/);
  }
  ctx.month = MONTH;
  assert.match(Pages.render('progress', ctx), /data-prep-action="monthly-start"/);
});

test('history preserves source labels, previous self-assessments and missing-bank question records', () => {
  const ctx = context();
  practice(ctx.state, { startedAt: NOW - 86400000, selfAssessment: POOR });
  practice(ctx.state);
  practice(ctx.state, { questionId: 'retired-question', startedAt: NOW + 86400000 });
  const html = Pages.render('history', ctx);
  assert.match(html, /本人實際作答/);
  assert.match(html, /比較上次自評/);
  assert.match(html, /部分完整/);
  assert.match(html, /超過 10 秒/);
  assert.match(html, /5 秒內/);
  assert.match(html, /原題紀錄仍保留/);
  assert.match(html, /data-id="retired-question"/);
  assert.match(html, /不推算客觀分數/);
});

test('backup page exposes validated JSON controls and explains local persistence without promising sync', () => {
  const html = Pages.render('data', context());
  assert.match(html, /data-prep-action="export"/);
  assert.match(html, /type="file" data-prep-import accept="application\/json,.json"/);
  assert.match(html, /不會自動跨裝置同步/);
  assert.match(html, /不合格的檔案不會覆蓋現有資料/);
  assert.match(html, /Asia\/Taipei/);
});
