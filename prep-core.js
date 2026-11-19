(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PrepCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const VERSION = 1;
  const ZONE = 'Asia/Taipei';
  const DAY = 86400000;
  const MODES = [10, 35, 60, 'monthly'];
  const LANGUAGES = ['zh', 'en', 'ko'];
  const PROBLEMS = ['start', 'sentence', 'grammar', 'vocabulary', 'focus', 'incomplete', 'length', 'none'];
  const PROBLEM_LABELS = { start: '無法快速開口', sentence: '英文組句', grammar: '文法不自然', vocabulary: '單字提取', focus: '回答失焦', incomplete: '回答不完整', length: '回答過長', none: '沒有明顯問題' };
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });

  function fail(message) { throw new Error('備考資料格式不正確：' + message); }
  function object(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
  function finite(value, min, max, name) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) fail(name);
    return value;
  }
  function string(value, name, max) {
    if (typeof value !== 'string' || value.length > (max || 1000)) fail(name);
    return value;
  }
  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const time = Date.parse(value + 'T00:00:00Z');
    return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
  }
  function date(value, name) { if (!validDate(value)) fail(name || '日期'); return value; }
  function timestamp(value, name) { return finite(value, 0, 8640000000000000, name || '時間'); }
  function nowMs(value) {
    if (value === undefined) return Date.now();
    const parsed = value instanceof Date ? value.getTime() : typeof value === 'string' ? Date.parse(value) : value;
    return timestamp(parsed, '時間');
  }
  function dateKey(value) {
    if (validDate(value)) return value;
    const parts = formatter.formatToParts(new Date(nowMs(value)));
    const at = type => parts.find(part => part.type === type).value;
    return at('year') + '-' + at('month') + '-' + at('day');
  }
  function addDays(value, amount) {
    date(value); finite(amount, -1000000, 1000000, '日期位移');
    if (!Number.isInteger(amount)) fail('日期位移必須為整數');
    return new Date(Date.parse(value + 'T00:00:00Z') + amount * DAY).toISOString().slice(0, 10);
  }
  function weekKey(value) {
    const key = dateKey(value);
    const weekday = new Date(key + 'T00:00:00Z').getUTCDay();
    return addDays(key, -((weekday + 6) % 7));
  }
  function monthKey(value) { return dateKey(value).slice(0, 7); }
  function previousMonth(value) {
    const year = Number(value.slice(0, 4)), month = Number(value.slice(5));
    return month === 1 ? (year - 1) + '-12' : year + '-' + String(month - 1).padStart(2, '0');
  }
  function emptyState() {
    return { version: VERSION, settings: { weaknesses: ['sentence'], weeklyGoal: 185, company: 'all' }, plans: {}, sessions: [], active: null, audits: {}, monthly: {} };
  }
  function defaultPlan(value) {
    const week = weekKey(value);
    return { week, goal: 185, days: [35, 10, 35, 10, 35, 60, 0].map((mode, i) => ({ date: addDays(week, i), kind: 'unset', mode, optional: mode === 60, cancelled: false })) };
  }
  function ensurePlan(state, value) {
    const week = weekKey(value);
    if (!state.plans[week]) {
      state.plans[week] = defaultPlan(week);
      if (Number.isFinite(state.settings.weeklyGoal)) state.plans[week].goal = state.settings.weeklyGoal;
    }
    return state.plans[week];
  }

  function effectiveSessions(state) {
    const seen = new Set(), sessions = [];
    (state.sessions || []).concat(state.active ? [state.active] : []).forEach(session => {
      if (!seen.has(session.id)) { seen.add(session.id); sessions.push(session); }
    });
    return sessions;
  }
  function assessmentRecords(state) {
    const sessions = effectiveSessions(state);
    const records = [];
    const seen = new Set();
    sessions.forEach(session => {
      Object.values(session.assessments || {}).forEach(record => {
        const key = session.id + ':' + record.questionId;
        if (!seen.has(key) && record.status !== 'skipped') { seen.add(key); records.push(record); }
      });
    });
    return records;
  }
  function latestRecords(state) {
    const latest = new Map();
    assessmentRecords(state).forEach(record => {
      const old = latest.get(String(record.questionId));
      if (!old || Number(record.at || 0) >= Number(old.at || 0)) latest.set(String(record.questionId), record);
    });
    return latest;
  }
  function increment(map, key, amount) { map[key] = (map[key] || 0) + (amount === undefined ? 1 : amount); }
  function entryLanguage(item, preferred, index) {
    const available = item.languages || ['en'];
    if (preferred !== 'mixed' && available.includes(preferred)) return preferred;
    if (preferred === 'mixed' && index % 3 === 1 && available.includes('zh')) return 'zh';
    return available.includes('en') ? 'en' : available.includes('zh') ? 'zh' : available[0];
  }
  function weakMatch(item, weaknesses, language) {
    const haystack = [item.type, ...(item.tags || [])].join(' ').toLowerCase();
    return weaknesses.filter(key => key !== 'none' && PROBLEMS.includes(key) && (
      ['start', 'grammar', 'vocabulary'].includes(key) ? language === 'en' :
      key === 'sentence' ? language === 'en' :
      key === 'focus' ? /personal|value|news|經驗|價值|新聞|生活|影視/.test(haystack) : true
    ));
  }
  function schedule(pool, state, options) {
    const opts = options || {}, mode = opts.mode === 'monthly' ? 'monthly' : Number(opts.mode || 10);
    if (!MODES.includes(mode)) fail('練習模式');
    const today = dateKey(opts.now), week = weekKey(today);
    const latest = latestRecords(state), weeklyTypes = {};
    assessmentRecords(state).filter(record => weekKey(record.date || record.at) === week).forEach(record => increment(weeklyTypes, record.type || '未分類'));
    const excluded = new Set((opts.exclude || []).map(String));
    const unique = new Map();
    (pool || []).forEach(item => {
      if (!item || item.id === undefined || item.id === null) return;
      const id = String(item.id);
      const languages = [...new Set((item.languages || ['en']).filter(language => LANGUAGES.includes(language)))];
      if (id && languages.length && !excluded.has(id) && !unique.has(id)) unique.set(id, { ...item, id, languages });
    });
    const candidates = [...unique.values()];
    if (opts.singleLanguage !== undefined && !LANGUAGES.includes(opts.singleLanguage)) fail('單題練習語言');
    const stages = mode === 10 ? [{ stage: 'english', count: 1, language: opts.singleLanguage || 'en' }] :
      mode === 35 ? [{ stage: 'review', count: 1, language: 'en' }, { stage: 'english', count: 2, language: opts.language || 'mixed' }] :
      mode === 60 ? [{ stage: 'review', count: 1, language: 'en' }, { stage: 'english', count: 3, language: 'en' }, { stage: 'mock', count: 4, language: opts.language || 'mixed' }] :
      [{ stage: 'monthly', count: 5, language: 'en' }];
    const result = [], selected = new Set(), selectedTypes = {};
    stages.forEach(stage => {
      for (let i = 0; i < stage.count; i++) {
        let eligible = candidates.filter(item => !selected.has(item.id) && (stage.language === 'mixed' || item.languages.includes(stage.language)));
        if (!eligible.length && mode !== 'monthly' && stage.language !== 'en') eligible = candidates.filter(item => !selected.has(item.id));
        if (!eligible.length) break;
        const ranked = eligible.map(item => {
          const last = latest.get(item.id), language = entryLanguage(item, stage.language, result.length);
          const due = !!(last && last.reviewDate && last.reviewDate <= today);
          const poor = !!(last && last.rating === 'poor');
          const recent = !!(last && (last.date || dateKey(last.at)) > addDays(today, -7));
          const weaknesses = weakMatch(item, state.settings.weaknesses || [], language);
          const type = item.type || '未分類';
          let score = !last ? 700 : 0;
          if (due) score += 1200;
          if (poor) score += 2000;
          if (stage.stage === 'review' && last) score += 250;
          if (stage.stage !== 'review' && !last) score += 150;
          // The two new-question slots stay new when unseen English items exist.
          if (mode === 35 && stage.stage === 'english' && !last) score += 3000;
          // The monthly check uses unfamiliar material, rather than the weak-item review queue.
          if (mode === 'monthly') score = !last ? 4000 : recent ? -10000 : 2000;
          score += Math.max(0, 100 - (weeklyTypes[type] || 0) * 25) + weaknesses.length * 35;
          score -= (selectedTypes[type] || 0) * 130;
          if (mode === 10 && /how.?to|step|life|生活|程序|步驟|即席/.test([type, ...(item.tags || [])].join(' ').toLowerCase())) score += 100;
          if (mode !== 'monthly' && recent && !poor && !due) score -= 10000;
          return { item, last, language, due, poor, recent, weaknesses, type, score };
        }).sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id, 'en'));
        const chosen = ranked[0];
        const reasons = [];
        if (chosen.due) reasons.push('已到複習日期（' + chosen.last.reviewDate + '）');
        else if (chosen.poor) reasons.push('上次自評較吃力，安排較早複習');
        else if (!chosen.last) reasons.push('尚未練習過的題目');
        if (!(weeklyTypes[chosen.type] > 0)) reasons.push('本週尚未練習「' + chosen.type + '」類型');
        if (chosen.weaknesses.length) reasons.push('對應你選擇的弱項：' + chosen.weaknesses.map(key => PROBLEM_LABELS[key]).join('、'));
        if (chosen.recent && !chosen.poor && !chosen.due) reasons.push('可用題目較少，安排近期題目再練習');
        if (!reasons.length) reasons.push('維持不同題型的練習分配');
        result.push({ questionId: chosen.item.id, language: chosen.language, type: chosen.type, reason: reasons.join('；'), stage: stage.stage, status: 'pending' });
        selected.add(chosen.item.id); increment(selectedTypes, chosen.type);
      }
    });
    return result;
  }

  let sessionCounter = 0;
  function createSession(entries, mode, now) {
    if (!MODES.includes(mode)) fail('練習模式');
    const at = nowMs(now);
    return { id: 'prep-' + at.toString(36) + '-' + (++sessionCounter).toString(36), startedAt: at, date: dateKey(at), mode, elapsedMs: 0, runningSince: at, paused: false, status: 'active', entries: entries.map(entry => ({ ...entry, status: entry.status || 'pending' })), index: 0, phase: 0, assessments: {}, notes: '', timeByDate: {} };
  }
  function addTime(session, from, until) {
    session.timeByDate = session.timeByDate || {};
    let cursor = from;
    while (cursor < until) {
      const key = dateKey(cursor);
      const midnight = Date.parse(addDays(key, 1) + 'T00:00:00+08:00');
      const stop = Math.min(until, midnight);
      increment(session.timeByDate, key, stop - cursor);
      cursor = stop;
    }
  }
  function checkpoint(session, now) {
    const at = nowMs(now);
    if (session.status === 'active' && !session.paused && Number.isFinite(session.runningSince)) {
      const from = session.runningSince;
      if (at > from) { session.elapsedMs += at - from; addTime(session, from, at); session.runningSince = at; }
    }
    return session;
  }
  function pause(session, now) { checkpoint(session, now); session.paused = true; session.runningSince = null; return session; }
  function resume(session, now) {
    if (session.status === 'active' && (session.paused || session.runningSince === null)) { session.paused = false; session.runningSince = nowMs(now); }
    return session;
  }
  function finish(session, status, now) {
    if (!['completed', 'early', 'interrupted'].includes(status)) fail('結束狀態');
    checkpoint(session, now);
    session.status = status; session.paused = false; session.runningSince = null; session.endedAt = nowMs(now);
    session.actualMinutes = session.elapsedMs / 60000; session.minutes = session.actualMinutes;
    return session;
  }
  function rating(assessment) {
    if (['poor', 'average', 'good'].includes(assessment.rating)) return assessment.rating;
    if (assessment.startDelay === 'over10' || assessment.completeness === 'incomplete' || assessment.fluency === 'frequent') return 'poor';
    if (assessment.startDelay === 'within5' && assessment.completeness === 'full' && assessment.fluency === 'smooth') return 'good';
    return 'average';
  }
  function validateAssessment(assessment) {
    if (!object(assessment)) fail('自我評估');
    if (!['within5', '5to10', 'over10'].includes(assessment.startDelay)) fail('開口時間自評');
    if (!['full', 'partial', 'incomplete'].includes(assessment.completeness)) fail('完整度自評');
    if (!['smooth', 'occasional', 'frequent'].includes(assessment.fluency)) fail('流暢度自評');
    if (!Array.isArray(assessment.problems) || assessment.problems.length > PROBLEMS.length || assessment.problems.some(key => !PROBLEMS.includes(key))) fail('弱項自評');
    if (assessment.rating !== undefined && !['poor', 'average', 'good'].includes(assessment.rating)) fail('複習間隔自評');
    if (assessment.notes !== undefined) string(assessment.notes, '自評備註', 5000);
    ['naturalEnding', 'clearMeaning'].forEach(key => { if (assessment[key] !== undefined && typeof assessment[key] !== 'boolean') fail('每月能力勾選項目'); });
  }
  function recordAssessment(session, entry, assessment, now) {
    validateAssessment(assessment);
    const target = session.entries.find(item => String(item.questionId) === String(entry.questionId));
    if (!target) fail('不在本次練習中的題目');
    const at = nowMs(now), result = rating(assessment), today = dateKey(at);
    const record = { questionId: String(entry.questionId), language: entry.language, type: entry.type || '未分類', date: today, at, status: 'completed', selfAssessment: { ...assessment, problems: [...new Set(assessment.problems)] }, rating: result, reviewDate: addDays(today, result === 'poor' ? 2 : result === 'average' ? 7 : 14), notes: assessment.notes || '' };
    session.assessments[record.questionId] = record;
    target.status = 'completed';
    return record;
  }

  function sessionTime(session, matches) {
    if (object(session.timeByDate) && Object.keys(session.timeByDate).length) return Object.entries(session.timeByDate).reduce((sum, pair) => sum + (matches(pair[0]) ? pair[1] / 60000 : 0), 0);
    return matches(session.date) ? Number(session.elapsedMs || 0) / 60000 : 0;
  }
  function metricCounts(state, matches) {
    const records = assessmentRecords(state).filter(record => matches(record.date || dateKey(record.at)));
    const languageCounts = { zh: 0, en: 0, ko: 0 }, typeCounts = {}, weaknessCounts = {};
    records.forEach(record => {
      increment(languageCounts, record.language || 'en'); increment(typeCounts, record.type || '未分類');
      (record.selfAssessment && record.selfAssessment.problems || []).filter(key => key !== 'none').forEach(key => increment(weaknessCounts, key));
    });
    const minutes = effectiveSessions(state).reduce((sum, session) => sum + sessionTime(session, matches), 0);
    return { minutes, questionCount: records.length, languageCounts, typeCounts, weaknessCounts };
  }
  function weeklySummary(state, value, now) {
    const week = weekKey(value === undefined ? now : value), matches = key => !!key && weekKey(key) === week;
    const counts = metricCounts(state, matches), plan = state.plans[week], goal = plan ? plan.goal : Number.isFinite(state.settings.weeklyGoal) ? state.settings.weeklyGoal : 185;
    const percent = goal > 0 ? counts.minutes / goal * 100 : 0;
    const status = goal === 0 ? '本週依生活狀況自由練習' : percent >= 70 ? '已達本週目標' : percent >= 40 ? '有持續累積' : '可以依生活狀況調整';
    const modeCounts = { 10: 0, 35: 0, 60: 0, monthly: 0 }, savedModeCounts = { 10: 0, 35: 0, 60: 0, monthly: 0 };
    (state.sessions || []).filter(session => matches(session.date)).forEach(session => {
      increment(savedModeCounts, session.mode);
      if (session.status === 'completed') increment(modeCounts, session.mode);
    });
    const nextReviews = [...latestRecords(state).values()].filter(record => record.reviewDate).sort((a, b) => a.reviewDate.localeCompare(b.reviewDate) || a.questionId.localeCompare(b.questionId, 'en')).map(record => ({ questionId: record.questionId, date: record.reviewDate, reviewDate: record.reviewDate, rating: record.rating, language: record.language, type: record.type }));
    const weakness = Object.entries(counts.weaknessCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    const summary = counts.questionCount < 2 ? '尚無足夠資料；完成練習並留下自評後，這裡會整理實際累積。' : '本週已練習 ' + counts.questionCount + ' 題，其中英文 ' + counts.languageCounts.en + ' 題。' + (weakness ? '自評最常出現的項目是「' + (PROBLEM_LABELS[weakness[0]] || weakness[0]) + '」，下次可挑一題短答重練。' : '目前沒有足夠的弱項紀錄，依當天狀態選擇練習即可。');
    return { week, ...counts, goal, percent, status, modeCounts, savedModeCounts, nextReviews, summary };
  }
  function monthlySummary(state, value, now) {
    const month = value || monthKey(now);
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) fail('月份');
    const counts = metricCounts(state, key => !!key && key.slice(0, 7) === month), before = previousMonth(month);
    const previous = { month: before, ...metricCounts(state, key => !!key && key.slice(0, 7) === before), test: state.monthly[before] || null };
    const test = state.monthly[month] || null;
    let comparison = null;
    if ((counts.questionCount || counts.minutes || test) && (previous.questionCount || previous.minutes || previous.test)) {
      comparison = { minutesDelta: counts.minutes - previous.minutes, questionCountDelta: counts.questionCount - previous.questionCount, metrics: {} };
      if (test && previous.test && test.metrics && previous.test.metrics) ['start', 'structure', 'ending', 'meaning'].forEach(key => { comparison.metrics[key] = { current: test.metrics[key], previous: previous.test.metrics[key], delta: test.metrics[key] - previous.test.metrics[key] }; });
    }
    const summary = !counts.questionCount && !test ? '尚無足夠資料；先完成一次練習，再用自己的紀錄觀察變化。' : !comparison ? '本月已有練習紀錄；尚無足夠的前月資料，暫不判斷進步或退步。' : '月份差異來自實際練習紀錄；口說能力項目是你的自我評估，不能當作客觀能力分數。';
    return { month, ...counts, test, previous, comparison, summary };
  }

  function safeClone(input) {
    let nodes = 0;
    const seen = new Set();
    function visit(value, depth) {
      if (++nodes > 200000 || depth > 30) fail('資料過大或層級過深');
      if (value === null || typeof value === 'boolean') return value;
      if (typeof value === 'number') { if (!Number.isFinite(value)) fail('非有限數值'); return value; }
      if (typeof value === 'string') { if (value.length > 100000) fail('文字過長'); return value; }
      if (typeof value !== 'object' || seen.has(value)) fail('不支援的資料型態');
      const prototype = Object.getPrototypeOf(value);
      if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) fail('物件型態');
      seen.add(value);
      let result;
      if (Array.isArray(value)) result = value.map(item => visit(item, depth + 1));
      else {
        result = {};
        Object.keys(value).forEach(key => {
          if (['__proto__', 'constructor', 'prototype'].includes(key)) fail('不安全的欄位名稱');
          result[key] = visit(value[key], depth + 1);
        });
      }
      seen.delete(value);
      return result;
    }
    const cloned = visit(input, 0);
    if (JSON.stringify(cloned).length > 5000000) fail('資料超過 5 MB');
    return cloned;
  }
  function validateSession(session, active) {
    if (!object(session)) fail('練習紀錄');
    string(session.id, '練習識別碼', 200); if (!session.id) fail('練習識別碼');
    timestamp(session.startedAt, '開始時間'); date(session.date, '練習日期');
    if (dateKey(session.startedAt) !== session.date) fail('練習日期與開始時間不同');
    if (!MODES.includes(session.mode)) fail('練習模式');
    if (!(active ? ['active'] : ['completed', 'early', 'interrupted']).includes(session.status)) fail('練習狀態');
    finite(session.elapsedMs, 0, 366 * DAY, '實際練習時間');
    if (session.runningSince !== null) timestamp(session.runningSince, '計時起點');
    if (typeof session.paused !== 'boolean') fail('暫停狀態');
    if (active && (session.paused ? session.runningSince !== null : session.runningSince === null)) fail('暫停狀態與計時不符');
    if (!active && session.runningSince !== null) fail('已結束紀錄仍在計時');
    if (!Array.isArray(session.entries) || session.entries.length > 1000) fail('練習題目列表');
    if (active && !session.entries.length) fail('進行中練習缺少題目');
    const ids = new Set();
    session.entries.forEach(entry => {
      if (!object(entry)) fail('練習題目');
      string(entry.questionId, '題目識別碼', 300); if (!entry.questionId || ids.has(entry.questionId)) fail('題目識別碼重複'); ids.add(entry.questionId);
      if (!LANGUAGES.includes(entry.language)) fail('題目語言');
      string(entry.type, '題型', 300); string(entry.reason, '排程理由', 5000);
      if (!['review', 'english', 'mock', 'monthly'].includes(entry.stage)) fail('練習階段');
      if (session.mode === 'monthly' && (entry.stage !== 'monthly' || entry.language !== 'en')) fail('每月自測須為英文題目');
      if (!['pending', 'completed', 'skipped'].includes(entry.status)) fail('題目狀態');
    });
    if (!Number.isInteger(session.index) || session.index < 0 || session.index > session.entries.length || active && session.index >= session.entries.length) fail('題目進度');
    const phaseLimit = session.mode === 10 ? 1 : session.mode === 35 ? 3 : session.mode === 60 ? 4 : 0;
    if (!Number.isInteger(session.phase) || session.phase < 0 || session.phase > phaseLimit) fail('練習階段進度');
    string(session.notes, '練習備註', 10000);
    if (!object(session.assessments)) fail('題目自評紀錄');
    Object.entries(session.assessments).forEach(([id, record]) => {
      if (!object(record) || record.questionId !== id || !ids.has(id)) fail('自評題目識別碼');
      const entry = session.entries.find(item => item.questionId === id);
      if (record.language !== entry.language || record.type !== entry.type || record.status !== 'completed') fail('自評題目資料');
      date(record.date, '自評日期'); timestamp(record.at, '自評時間');
      if (dateKey(record.at) !== record.date) fail('自評日期與時間不同');
      validateAssessment(record.selfAssessment);
      if (!['poor', 'average', 'good'].includes(record.rating)) fail('複習級距');
      if (rating(record.selfAssessment) !== record.rating) fail('複習級距與自評不符');
      date(record.reviewDate, '下次複習日期');
      if (record.reviewDate !== addDays(record.date, record.rating === 'poor' ? 2 : record.rating === 'average' ? 7 : 14)) fail('複習間隔');
      string(record.notes, '題目備註', 5000);
    });
    if (session.timeByDate !== undefined) {
      if (!object(session.timeByDate)) fail('每日實際時間');
      let elapsed = 0;
      Object.entries(session.timeByDate).forEach(([key, ms]) => { date(key, '實際練習日期'); elapsed += finite(ms, 0, DAY, '每日實際時間'); });
      if (Object.keys(session.timeByDate).length && Math.abs(elapsed - session.elapsedMs) > 1) fail('實際時間總和');
    }
    ['actualMinutes', 'minutes'].forEach(key => {
      if (session[key] !== undefined) { finite(session[key], 0, 366 * 1440, '實際分鐘'); if (Math.abs(session[key] * 60000 - session.elapsedMs) > 1) fail('實際分鐘與計時不符'); }
    });
    if (session.endedAt !== undefined) { timestamp(session.endedAt, '結束時間'); if (session.endedAt < session.startedAt) fail('結束時間早於開始時間'); }
    ['answerVisible', 'interrupted'].forEach(key => { if (session[key] !== undefined && typeof session[key] !== 'boolean') fail('練習畫面開關'); });
    if (session.referenceLanguage !== undefined && !LANGUAGES.includes(session.referenceLanguage)) fail('參考答案語言');
    if (session.mockLanguage !== undefined && !['mixed', ...LANGUAGES].includes(session.mockLanguage)) fail('模擬作答語言');
    if (session.drafts !== undefined) {
      if (!object(session.drafts) || Object.keys(session.drafts).length > 1000) fail('未完成自評');
      Object.values(session.drafts).forEach(draft => {
        if (!object(draft)) fail('未完成自評');
        for (const [key, allowed] of Object.entries({ startDelay: ['', 'within5', '5to10', 'over10'], completeness: ['', 'full', 'partial', 'incomplete'], fluency: ['', 'smooth', 'occasional', 'frequent'] })) if (draft[key] !== undefined && !allowed.includes(draft[key])) fail('未完成自評選項');
        if (draft.problems !== undefined && (!Array.isArray(draft.problems) || draft.problems.length > PROBLEMS.length || draft.problems.some(key => !PROBLEMS.includes(key)))) fail('未完成弱項自評');
        if (draft.notes !== undefined) string(draft.notes, '未完成自評備註', 5000);
        ['naturalEnding', 'clearMeaning'].forEach(key => { if (draft[key] !== undefined && typeof draft[key] !== 'boolean') fail('未完成能力勾選項目'); });
      });
    }
    if (session.monthlyRatings !== undefined) {
      if (!object(session.monthlyRatings)) fail('本題能力自評');
      Object.entries(session.monthlyRatings).forEach(([id, item]) => {
        if (!ids.has(id) || !object(item) || typeof item.naturalEnding !== 'boolean' || typeof item.clearMeaning !== 'boolean') fail('本題能力自評');
      });
    }
    if (session.attempts !== undefined) {
      if (!Array.isArray(session.attempts) || session.attempts.length > 10000) fail('重答自評紀錄');
      session.attempts.forEach(record => {
        if (!object(record) || !ids.has(record.questionId)) fail('重答題目');
        validateAssessment(record.selfAssessment); timestamp(record.at, '重答自評時間');
        date(record.date, '重答自評日期'); date(record.reviewDate, '重答複習日期');
        if (rating(record.selfAssessment) !== record.rating) fail('重答複習級距');
      });
    }
  }
  function validateState(input) {
    const state = safeClone(input);
    if (!object(state) || state.version !== VERSION) fail('不支援的資料版本');
    if (!object(state.settings) || !Array.isArray(state.settings.weaknesses) || state.settings.weaknesses.length > PROBLEMS.length || state.settings.weaknesses.some(key => !PROBLEMS.includes(key))) fail('個人弱項設定');
    if (state.settings.weeklyGoal !== undefined) finite(state.settings.weeklyGoal, 0, 10080, '每週目標');
    if (state.settings.company !== undefined && !['all', '華航', '長榮', '星宇', '國泰'].includes(state.settings.company)) fail('航空公司設定');
    if (state.settings.practiceLanguage !== undefined && !['mixed', ...LANGUAGES].includes(state.settings.practiceLanguage)) fail('練習語言設定');
    if (!object(state.plans) || Object.keys(state.plans).length > 1000) fail('每週計畫');
    Object.entries(state.plans).forEach(([week, plan]) => {
      date(week, '週次'); if (weekKey(week) !== week || !object(plan) || plan.week !== week) fail('每週計畫週次');
      finite(plan.goal, 0, 10080, '每週目標');
      if (!Array.isArray(plan.days) || plan.days.length !== 7) fail('每週日期列表');
      const dates = new Set();
      plan.days.forEach(day => {
        if (!object(day)) fail('每日計畫'); date(day.date, '每日日期');
        if (weekKey(day.date) !== week || dates.has(day.date)) fail('每日計畫日期'); dates.add(day.date);
        if (!['unset', 'working', 'off', 'plans', 'rest'].includes(day.kind) || ![0, 10, 35, 60].includes(day.mode)) fail('每日計畫類型');
        ['optional', 'cancelled'].forEach(key => { if (day[key] !== undefined && typeof day[key] !== 'boolean') fail('每日計畫開關'); });
      });
    });
    if (!Array.isArray(state.sessions) || state.sessions.length > 10000) fail('練習紀錄列表');
    const sessions = new Set();
    state.sessions.forEach(session => { validateSession(session, false); if (sessions.has(session.id)) fail('重複練習識別碼'); sessions.add(session.id); });
    if (state.active !== null) { validateSession(state.active, true); if (sessions.has(state.active.id)) fail('進行中練習已存在歷史紀錄'); }
    if (!object(state.audits) || Object.keys(state.audits).length > 1000) fail('週自我檢核');
    Object.entries(state.audits).forEach(([week, audit]) => {
      date(week, '檢核週次'); if (weekKey(week) !== week || !object(audit)) fail('週檢核紀錄');
      if (audit.toeicMinutes !== undefined && audit.toeicMinutes !== '') finite(audit.toeicMinutes, 0, 10080, '多益手動分鐘');
      ['interviewEnglish', 'interviewChinese', 'reviewWeak', 'usedSite', 'toeicStudied', 'relax', 'exercise', 'social', 'rest', 'stressOkay'].forEach(key => { if (audit[key] !== undefined && typeof audit[key] !== 'boolean') fail('週檢核勾選項目'); });
      if (audit.toeicTypes !== undefined && (!Array.isArray(audit.toeicTypes) || audit.toeicTypes.length > 4 || audit.toeicTypes.some(type => !['listening', 'reading', 'mock', 'errors'].includes(type)) || new Set(audit.toeicTypes).size !== audit.toeicTypes.length)) fail('多益手動分類');
      if (audit.toeicGoal !== undefined && !['', 'yes', 'partial', 'no'].includes(audit.toeicGoal)) fail('多益自訂目標檢核');
      ['notes', 'best', 'difficulty', 'change'].forEach(key => { if (audit[key] !== undefined) string(audit[key], '檢核文字', 10000); });
    });
    if (!object(state.monthly) || Object.keys(state.monthly).length > 240) fail('每月自測');
    Object.entries(state.monthly).forEach(([month, test]) => {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || !object(test)) fail('自測月份');
      date(test.date, '自測日期'); if (test.date.slice(0, 7) !== month) fail('自測日期月份');
      if (!Array.isArray(test.questionIds) || test.questionIds.length !== 5 || test.questionIds.some(id => typeof id !== 'string' || id.length > 300) || new Set(test.questionIds).size !== test.questionIds.length) fail('自測題目');
      if (!object(test.metrics)) fail('自測項目');
      ['start', 'structure', 'ending', 'meaning'].forEach(key => { finite(test.metrics[key], 0, 5, '自測次數'); if (!Number.isInteger(test.metrics[key])) fail('自測次數必須為整數'); });
      string(test.sessionId, '自測練習識別碼', 200); if (test.selfRated !== true) fail('自測來源標籤');
      const session = state.sessions.find(item => item.id === test.sessionId);
      if (!session || session.mode !== 'monthly' || session.status !== 'completed' || session.date.slice(0, 7) !== month || session.entries.length !== 5 || test.questionIds.some(id => !session.assessments[id] || session.assessments[id].language !== 'en')) fail('自測須對應五題已完成的英文練習');
    });
    return state;
  }
  function migrateState(input) { return input === null || input === undefined ? emptyState() : validateState(input); }

  return { VERSION, ZONE, PROBLEMS, PROBLEM_LABELS, emptyState, dateKey, weekKey, monthKey, addDays, defaultPlan, ensurePlan, schedule, createSession, checkpoint, pause, resume, finish, rating, recordAssessment, weeklySummary, monthlySummary, validateState, migrateState, latestRecords };
});
