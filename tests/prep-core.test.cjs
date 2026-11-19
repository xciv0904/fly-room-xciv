'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../prep-core.js');

const at = value => Date.parse(value);
const NOW = at('2026-11-20T12:00:00+08:00');
const GOOD = { startDelay: 'within5', completeness: 'full', fluency: 'smooth', problems: ['none'] };
const AVERAGE = { startDelay: '5to10', completeness: 'partial', fluency: 'occasional', problems: ['sentence'] };
const POOR = { startDelay: 'over10', completeness: 'incomplete', fluency: 'frequent', problems: ['sentence', 'incomplete'] };
function pool(size = 12) {
  return Array.from({ length: size }, (_, i) => ({ id: 'q' + String(i).padStart(2, '0'), languages: ['zh', 'en', 'ko'], type: ['生活經驗', 'How to 說明程序', '個人價值觀', '情境處理'][i % 4], tags: i % 2 ? ['how-to'] : [], source: i % 2 ? '本人實際作答' : '模擬題', company: '華航', stage: '複試', difficulty: '中等' }));
}
function save(state, item, when, assessment = GOOD, duration = 60000) {
  const entry = { questionId: item.id, language: 'en', type: item.type, reason: '測試', stage: 'english', status: 'pending' };
  const session = C.createSession([entry], 10, when);
  C.recordAssessment(session, entry, assessment, when + 10000);
  C.finish(session, 'completed', when + duration);
  state.sessions.push(session);
  return session;
}

test('Taipei date rolls before UTC date and weeks start on Monday', () => {
  assert.equal(C.dateKey(at('2026-11-22T16:00:00Z')), '2026-11-23');
  assert.equal(C.weekKey(at('2026-11-22T15:59:59Z')), '2026-11-16');
  assert.equal(C.weekKey(at('2026-11-22T16:00:00Z')), '2026-11-23');
  assert.equal(C.weekKey('2026-11-22'), '2026-11-16');
  assert.equal(C.monthKey(at('2026-11-30T16:00:00Z')), '2026-12');
  assert.equal(C.addDays('2028-02-28', 1), '2028-02-29');
  assert.throws(() => C.addDays('2026-02-30', 1));
});

test('default plan leaves actual workdays unset and optional long mode is not a requirement', () => {
  const plan = C.defaultPlan('2026-11-20');
  assert.equal(plan.goal, 185);
  assert.deepEqual(plan.days.map(day => day.mode), [35, 10, 35, 10, 35, 60, 0]);
  assert.ok(plan.days.every(day => day.kind === 'unset'));
  assert.equal(plan.days[5].optional, true);
  assert.equal(plan.days[6].date, '2026-11-22');
});

test('new weeks do not copy canceled days or interview debt', () => {
  const state = C.emptyState();
  C.ensurePlan(state, '2026-11-16').days[0] = { date: '2026-11-16', kind: 'rest', mode: 0, cancelled: true };
  const next = C.ensurePlan(state, '2026-11-23');
  assert.equal(next.days[0].kind, 'unset');
  assert.equal(next.days[0].mode, 35);
  assert.equal(C.weeklySummary(state, '2026-11-23').minutes, 0);
  assert.equal(C.validateState(state).plans['2026-11-23'].goal, 185);
});

test('all modes schedule unique questions with explicit stage assignments and explanations', () => {
  const state = C.emptyState();
  for (const [mode, count] of [[10, 1], [35, 3], [60, 8], ['monthly', 5]]) {
    const entries = C.schedule(pool(), state, { mode, now: NOW });
    assert.equal(entries.length, count);
    assert.equal(new Set(entries.map(entry => entry.questionId)).size, count);
    assert.ok(entries.every(entry => entry.reason.length > 0 && entry.status === 'pending'));
    if (mode === 60) assert.deepEqual(entries.map(entry => entry.stage), ['review', 'english', 'english', 'english', 'mock', 'mock', 'mock', 'mock']);
    else if (mode === 35) assert.deepEqual(entries.map(entry => entry.language), ['en', 'zh', 'en']);
    else assert.ok(entries.every(entry => entry.language === 'en'));
  }
  assert.throws(() => C.schedule(pool(), state, { mode: 80, now: NOW }));
});

test('scheduler is deterministic, filters excluded/duplicate IDs, and handles a small or empty pool', () => {
  const state = C.emptyState(), entries = pool(2);
  assert.deepEqual(C.schedule(entries, state, { mode: 60, now: NOW }), C.schedule(entries, state, { mode: 60, now: NOW }));
  assert.equal(C.schedule([...entries, entries[0]], state, { mode: 60, now: NOW }).length, 2);
  assert.equal(C.schedule(entries, state, { mode: 60, exclude: [entries[0].id], now: NOW }).length, 1);
  assert.deepEqual(C.schedule([], state, { mode: 60, now: NOW }), []);
});

test('recent good answers are avoided for seven days, while shortage remains usable', () => {
  const state = C.emptyState(), items = pool(3);
  save(state, items[0], NOW - 2 * 86400000, GOOD);
  const first = C.schedule(items, state, { mode: 10, now: NOW });
  assert.notEqual(first[0].questionId, items[0].id);
  const shortage = C.schedule([items[0]], state, { mode: 10, now: NOW });
  assert.equal(shortage.length, 1);
  assert.match(shortage[0].reason, /近期題目/);
  const daySeven = C.schedule([items[0]], state, { mode: 10, now: NOW + 5 * 86400000 });
  assert.doesNotMatch(daySeven[0].reason, /可用題目較少/);
});

test('poor or due answers may be reviewed inside seven days with a concrete reason', () => {
  const state = C.emptyState(), items = pool();
  save(state, items[3], NOW - 86400000, POOR);
  assert.equal(C.schedule(items, state, { mode: 10, now: NOW })[0].questionId, items[3].id);
  const due = C.schedule(items, state, { mode: 10, now: NOW + 86400000 });
  assert.equal(due[0].questionId, items[3].id);
  assert.match(due[0].reason, /已到複習日期/);
});

test('35-minute new-question slots prefer unseen items and retain an English majority', () => {
  const state = C.emptyState(), items = pool();
  [items[0], items[1], items[2]].forEach(item => save(state, item, NOW - 86400000, POOR));
  const entries = C.schedule(items, state, { mode: 35, now: NOW });
  assert.ok(entries[0].questionId <= 'q02');
  assert.ok(entries.slice(1).every(entry => Number(entry.questionId.slice(1)) >= 3));
  assert.deepEqual(entries.map(entry => entry.language), ['en', 'zh', 'en']);
});

test('a recent difficult answer takes priority over an otherwise good due answer', () => {
  const state = C.emptyState(), items = pool();
  save(state, items[0], NOW - 15 * 86400000, GOOD);
  save(state, items[1], NOW - 86400000, POOR);
  assert.equal(C.schedule(items, state, { mode: 10, now: NOW })[0].questionId, items[1].id);
});

test('monthly check prefers unfamiliar English questions over a recently weak answer', () => {
  const state = C.emptyState(), items = pool();
  save(state, items[0], NOW - 86400000, POOR);
  const entries = C.schedule(items, state, { mode: 'monthly', now: NOW });
  assert.equal(entries.length, 5);
  assert.ok(entries.every(entry => entry.questionId !== items[0].id && entry.language === 'en'));
});

test('mock language selection applies to mock stage, with no invented unavailable language', () => {
  const state = C.emptyState(), items = pool();
  const ko = C.schedule(items, state, { mode: 60, language: 'ko', now: NOW });
  assert.ok(ko.slice(0, 4).every(entry => entry.language === 'en'));
  assert.ok(ko.slice(4).every(entry => entry.language === 'ko'));
  assert.deepEqual(C.schedule([{ ...items[0], languages: ['zh'] }], state, { mode: 'monthly', now: NOW }), []);
  assert.ok(C.schedule(items, state, { mode: 60, language: 'mixed', now: NOW }).slice(4).some(entry => entry.language === 'zh'));
  assert.equal(C.schedule(items, state, { mode: 10, singleLanguage: 'ko', now: NOW })[0].language, 'ko');
  assert.equal(C.schedule(items, state, { mode: 10, singleLanguage: 'zh', now: NOW })[0].language, 'zh');
  assert.equal(C.schedule(items, state, { mode: 10, language: 'zh', now: NOW })[0].language, 'en');
});

test('pause and checkpoints exclude idle time and do not double count', () => {
  const entries = C.schedule(pool(), C.emptyState(), { mode: 10, now: NOW });
  const session = C.createSession(entries, 10, NOW);
  C.checkpoint(session, NOW + 10000);
  C.checkpoint(session, NOW + 10000);
  C.pause(session, NOW + 20000);
  C.checkpoint(session, NOW + 100000);
  assert.equal(session.elapsedMs, 20000);
  C.resume(session, NOW + 200000);
  C.finish(session, 'early', NOW + 220000);
  assert.equal(session.elapsedMs, 40000);
  assert.equal(session.actualMinutes, 2 / 3);
  assert.equal(session.status, 'early');
  C.checkpoint(session, NOW + 300000);
  assert.equal(session.elapsedMs, 40000);
  assert.equal(C.validateState({ ...C.emptyState(), sessions: [session] }).sessions[0].minutes, 2 / 3);
});

test('actual minutes are split at Taipei midnight rather than assigned to the host timezone', () => {
  const start = at('2026-11-22T23:59:30+08:00');
  const session = C.createSession([], 10, start);
  C.finish(session, 'early', start + 90000);
  assert.deepEqual(session.timeByDate, { '2026-11-22': 30000, '2026-11-23': 60000 });
  const state = { ...C.emptyState(), sessions: [session] };
  assert.equal(C.weeklySummary(state, '2026-11-16').minutes, 0.5);
  assert.equal(C.weeklySummary(state, '2026-11-23').minutes, 1);
});

test('self-assessments are subjective, mark completion, and set 2/7/14-day review dates', () => {
  for (const [assessment, days, expected] of [[POOR, 2, 'poor'], [AVERAGE, 7, 'average'], [GOOD, 14, 'good']]) {
    const entries = C.schedule(pool(), C.emptyState(), { mode: 10, now: NOW });
    const session = C.createSession(entries, 10, NOW);
    const record = C.recordAssessment(session, entries[0], assessment, NOW);
    assert.equal(record.rating, expected);
    assert.equal(record.reviewDate, C.addDays('2026-11-20', days));
    assert.equal(session.entries[0].status, 'completed');
    assert.deepEqual(record.selfAssessment, assessment);
    assert.equal(Object.keys(session.assessments).length, 1);
    C.recordAssessment(session, entries[0], assessment, NOW + 10000);
    assert.equal(Object.keys(session.assessments).length, 1);
  }
  assert.throws(() => C.recordAssessment(C.createSession([], 10, NOW), { questionId: 'bad' }, GOOD, NOW));
});

test('weekly progress uses actual saved interview minutes, configurable goal, and no TOEIC minutes', () => {
  const state = C.emptyState();
  const item = pool()[0];
  save(state, item, NOW, AVERAGE, 70 * 60000);
  state.audits['2026-11-16'] = { toeicMinutes: 500 };
  C.ensurePlan(state, '2026-11-16').goal = 100;
  let summary = C.weeklySummary(state, '2026-11-16');
  assert.equal(summary.minutes, 70);
  assert.equal(summary.percent, 70);
  assert.equal(summary.status, '已達本週目標');
  assert.equal(summary.languageCounts.en, 1);
  assert.equal(summary.weaknessCounts.sentence, 1);
  assert.equal(summary.modeCounts[10], 1);
  assert.equal(summary.nextReviews[0].date, '2026-11-27');
  C.ensurePlan(state, '2026-11-16').goal = 150;
  assert.equal(C.weeklySummary(state, '2026-11-16').status, '有持續累積');
  C.ensurePlan(state, '2026-11-16').goal = 200;
  assert.equal(C.weeklySummary(state, '2026-11-16').status, '可以依生活狀況調整');
  C.ensurePlan(state, '2026-11-16').goal = 0;
  summary = C.weeklySummary(state, '2026-11-16');
  assert.equal(summary.percent, 0);
  assert.equal(Number.isFinite(summary.percent), true);
  assert.match(summary.status, /自由練習/);
});

test('mode completion counts exclude early/interrupted logs while their actual time stays included', () => {
  const state = C.emptyState();
  for (const status of ['completed', 'early', 'interrupted']) {
    const session = C.createSession([], 10, NOW);
    C.finish(session, status, NOW + 60000);
    state.sessions.push(session);
  }
  const summary = C.weeklySummary(state, '2026-11-16');
  assert.equal(summary.minutes, 3);
  assert.equal(summary.modeCounts[10], 1);
  assert.equal(summary.savedModeCounts[10], 3);
});

test('a paused saved active session contributes actual time and answers without claiming a completed mode', () => {
  const state = C.emptyState(), entries = C.schedule(pool(), state, { mode: 10, now: NOW });
  const session = C.createSession(entries, 10, NOW);
  state.active = session;
  C.recordAssessment(session, entries[0], AVERAGE, NOW + 10000);
  C.pause(session, NOW + 300000);
  let summary = C.weeklySummary(state, '2026-11-16');
  assert.equal(summary.minutes, 5);
  assert.equal(summary.questionCount, 1);
  assert.equal(summary.modeCounts[10], 0);
  assert.equal(C.monthlySummary(state, '2026-11').minutes, 5);
  C.finish(session, 'completed', NOW + 600000);
  state.sessions.push(session);
  state.active = null;
  summary = C.weeklySummary(state, '2026-11-16');
  assert.equal(summary.minutes, 5);
  assert.equal(summary.questionCount, 1);
  assert.equal(summary.modeCounts[10], 1);
  // Defensive aggregation also avoids duplication before the UI clears active.
  state.active = session;
  assert.equal(C.weeklySummary(state, '2026-11-16').minutes, 5);
  assert.equal(C.weeklySummary(state, '2026-11-16').questionCount, 1);
});

test('monthly summaries distinguish self-rated metrics and refuse to invent a trend without prior data', () => {
  const state = C.emptyState();
  assert.match(C.monthlySummary(state, '2026-11').summary, /尚無足夠資料/);
  save(state, pool()[0], NOW, GOOD, 2 * 60000);
  const monthly = (date, values) => ({ date, questionIds: pool(5).map(item => item.id), metrics: values, sessionId: 'monthly-' + date, selfRated: true });
  state.monthly['2026-11'] = monthly('2026-11-20', { start: 3, structure: 3, ending: 4, meaning: 5 });
  assert.equal(C.monthlySummary(state, '2026-11').comparison, null);
  state.monthly['2026-10'] = monthly('2026-10-20', { start: 2, structure: 4, ending: 3, meaning: 5 });
  const summary = C.monthlySummary(state, '2026-11');
  assert.equal(summary.minutes, 2);
  assert.equal(summary.questionCount, 1);
  assert.equal(summary.comparison.metrics.start.delta, 1);
  assert.equal(summary.comparison.metrics.structure.delta, -1);
  assert.equal(summary.comparison.metrics.meaning.delta, 0);
  assert.match(summary.summary, /自我評估/);
});

test('JSON validation safely preserves complete state, unknown existing IDs and UI extras', () => {
  const state = C.emptyState();
  const entries = C.schedule([{ id: 'external:obsolete-bank/unknown', languages: ['en'], type: '舊題' }], state, { mode: 10, now: NOW });
  state.active = C.createSession(entries, 10, NOW);
  state.active.answerVisible = false;
  state.active.referenceLanguage = 'en';
  C.recordAssessment(state.active, entries[0], GOOD, NOW);
  C.pause(state.active, NOW + 12345);
  const restored = C.validateState(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(restored, state);
  restored.active.notes = 'changed';
  assert.equal(state.active.notes, '');
  assert.deepEqual(C.migrateState(null), C.emptyState());
});

test('invalid imports fail atomically for versions, numbers, dates, sessions and unsafe object keys', () => {
  const original = C.emptyState();
  const invalid = [
    { ...original, version: 2 },
    { ...original, settings: { weaknesses: ['made-up'] } },
    { ...original, settings: { weaknesses: [], weeklyGoal: NaN } },
    { ...original, plans: { '2026-11-17': { week: '2026-11-17', goal: 185, days: [] } } },
    { ...original, audits: { '2026-11-16': { toeicMinutes: -20 } } },
    { ...original, monthly: { '2026-11': { date: '2026-11-20', questionIds: [], metrics: { start: 6, structure: 1, ending: 1, meaning: 1 }, sessionId: 'x', selfRated: true } } },
    JSON.parse('{"version":1,"__proto__":{"polluted":true}}'),
    { ...original, active: {} }
  ];
  invalid.forEach(value => assert.throws(() => C.validateState(value)));
  assert.deepEqual(original, C.emptyState());
  assert.equal({}.polluted, undefined);
});

test('tampered timing totals or review dates cannot overwrite imported logs', () => {
  const state = C.emptyState();
  save(state, pool()[0], NOW, GOOD);
  const invalidMinutes = JSON.parse(JSON.stringify(state));
  invalidMinutes.sessions[0].minutes = 999;
  assert.throws(() => C.validateState(invalidMinutes));
  const invalidReview = JSON.parse(JSON.stringify(state));
  invalidReview.sessions[0].assessments.q00.reviewDate = '2026-11-21';
  assert.throws(() => C.validateState(invalidReview));
  const invalidDay = JSON.parse(JSON.stringify(state));
  invalidDay.sessions[0].timeByDate['2026-11-20'] = 120000;
  assert.throws(() => C.validateState(invalidDay));
  assert.doesNotThrow(() => C.validateState(state));
});

test('a monthly check imports only with its five saved English responses and explicit self-rating', () => {
  const state = C.emptyState();
  const entries = C.schedule(pool(), state, { mode: 'monthly', now: NOW });
  const session = C.createSession(entries, 'monthly', NOW);
  entries.forEach(entry => C.recordAssessment(session, entry, GOOD, NOW + 10000));
  C.finish(session, 'completed', NOW + 300000);
  state.sessions.push(session);
  state.monthly['2026-11'] = { date: '2026-11-20', questionIds: entries.map(entry => entry.questionId), sessionId: session.id, selfRated: true, metrics: { start: 3, structure: 4, ending: 5, meaning: 5 } };
  assert.doesNotThrow(() => C.validateState(state));
  const truncated = JSON.parse(JSON.stringify(state));
  truncated.monthly['2026-11'].questionIds.pop();
  assert.throws(() => C.validateState(truncated));
  const missing = JSON.parse(JSON.stringify(state));
  delete missing.sessions[0].assessments[entries[0].questionId];
  assert.throws(() => C.validateState(missing));
});

test('weekly audits accept optional blanks and reject ambiguous or malformed checkboxes', () => {
  const state = C.emptyState();
  state.audits['2026-11-16'] = { interviewEnglish: true, rest: false, toeicMinutes: '', toeicTypes: [], toeicGoal: '', best: '', difficulty: '', change: '' };
  assert.doesNotThrow(() => C.validateState(state));
  for (const patch of [{ rest: '1' }, { toeicTypes: 'reading' }, { toeicGoal: 'bad' }, { toeicMinutes: Infinity }]) {
    const invalid = JSON.parse(JSON.stringify(state));
    Object.assign(invalid.audits['2026-11-16'], patch);
    assert.throws(() => C.validateState(invalid));
  }
});

test('UI drafts and monthly flags remain editable yet malformed truthy imports are rejected', () => {
  const state = C.emptyState(), entries = C.schedule(pool(), state, { mode: 10, now: NOW });
  const session = C.createSession(entries, 10, NOW), id = entries[0].questionId;
  state.active = session;
  session.drafts = { [id]: { startDelay: '', completeness: '', fluency: '', problems: [], notes: '', naturalEnding: false, clearMeaning: false } };
  session.monthlyRatings = { [id]: { naturalEnding: false, clearMeaning: true } };
  assert.doesNotThrow(() => C.validateState(state));
  for (const patch of [
    value => { value.active.monthlyRatings[id].naturalEnding = 'false'; },
    value => { value.active.drafts[id].clearMeaning = 'false'; },
    value => { value.settings.practiceLanguage = 'unknown'; },
    value => { value.active.paused = true; },
    value => { value.active.index = value.active.entries.length; },
    value => { value.active.phase = 99; },
    value => { value.active.entries = []; }
  ]) {
    const invalid = JSON.parse(JSON.stringify(state)); patch(invalid);
    assert.throws(() => C.validateState(invalid));
  }
});
