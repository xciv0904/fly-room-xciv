/* Personal preparation pages. Pure rendering; state and events stay in prep-ui.js. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PrepPages = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const languages = { zh: "中文", en: "英文", ko: "韓文" };
  const types = { life: "生活經驗", everyday: "生活經驗", personal: "個人問答", service: "服務經驗", scenario: "航空情境", aviation: "航空情境", "how-to": "How to 程序說明", howto: "How to 程序說明", spontaneous: "即席反應", impromptu: "即席反應", culture: "公司文化", teamwork: "團隊合作", news: "新聞與公司發展", introduction: "自我介紹", intro: "自我介紹" };
  const problems = { start: "不知道如何開始", sentence: "英文組句困難", grammar: "文法不自然", vocabulary: "單字想不起來", focus: "回答沒有重點", incomplete: "內容不完整", length: "回答太冗長", none: "沒有明顯問題" };
  const ratings = { poor: "需要再練", average: "普通", good: "表現良好" };
  const statuses = { completed: "已完成", early: "提前結束並保存", "early-ended": "提前結束並保存", interrupted: "中途保存", paused: "暫停中", active: "練習中", skipped: "已跳過", pending: "未作答" };
  const metricLabels = { start: "5 秒內開始回答", structure: "回答結構完整", ending: "自然結束回答", meaning: "清楚表達意思" };
  const modeLabels = { 10: "10 分鐘低能量", 35: "35 分鐘正常", 60: "60 分鐘集中", monthly: "每月英文自測" };
  const fallbackEscape = value => String(value == null ? "" : value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const minutes = value => number(value).toLocaleString("zh-TW", { maximumFractionDigits: 1 });
  const checked = value => value ? " checked" : "";
  const selected = (left, right) => String(left) === String(right) ? " selected" : "";
  const label = (map, key) => map[key] || key || "未分類";
  const list = value => Array.isArray(value) ? value : [];
  const entries = value => Object.entries(value || {}).filter(([, count]) => number(count) > 0).sort((a, b) => number(b[1]) - number(a[1]));

  function helpers(ctx) {
    const esc = ctx.esc || fallbackEscape;
    const question = id => list(ctx.pool).find(item => String(item.id) === String(id));
    const questionLabel = id => {
      const item = question(id);
      return item ? (item.label || item.q_zh || item.q_en || item.q_ko || id) : `題目 ${id}（原題紀錄仍保留）`;
    };
    return { esc, question, questionLabel };
  }

  function dateLabel(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value || "");
    const date = new Date(`${value}T12:00:00+08:00`);
    return new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", month: "numeric", day: "numeric", weekday: "short" }).format(date);
  }

  function timeLabel(value) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return String(value || "未記錄時間");
    return new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  }

  function periodHeader(title, ctx, kind) {
    const { esc } = helpers(ctx);
    const isMonth = kind === "month";
    const key = isMonth ? ctx.month : ctx.week;
    const end = isMonth ? "" : ` 至 ${ctx.core.addDays(key, 6)}`;
    return `<div class="card prep-page-head"><div><h2>${esc(title)}</h2><p class="sub">${esc(key)}${esc(end)} · ${isMonth ? "月度紀錄" : "星期一開始"} · Asia/Taipei</p></div><div class="prep-actions"><button type="button" class="btn ghost" data-prep-action="${isMonth ? "month" : "week"}" data-offset="-1" aria-label="前一${isMonth ? "月" : "週"}">← 前一${isMonth ? "月" : "週"}</button><button type="button" class="btn ghost" data-prep-action="${isMonth ? "month" : "week"}" data-offset="1" aria-label="下一${isMonth ? "月" : "週"}">下一${isMonth ? "月" : "週"} →</button></div></div>`;
  }

  function countsMarkup(counts, names, empty, esc) {
    const rows = entries(counts);
    if (!rows.length) return `<p class="sub">${esc(empty || "尚無足夠資料")}</p>`;
    const max = Math.max(1, ...rows.map(([, count]) => number(count)));
    return `<div class="prep-bars">${rows.map(([key, count]) => `<div class="prep-bar-row"><div><span>${esc(label(names, key))}</span><b>${esc(count)} 次</b></div><progress value="${number(count)}" max="${max}" aria-label="${esc(label(names, key))} ${esc(count)} 次"></progress></div>`).join("")}</div>`;
  }

  function planPage(ctx) {
    const { esc } = helpers(ctx);
    const plan = ctx.state.plans[ctx.week] || ctx.core.defaultPlan(ctx.week);
    const settings = ctx.state.settings || {};
    const selectedProblems = list(settings.weaknesses);
    const dayKinds = { unset: "尚未設定班表", working: "上班日", off: "休假日", plans: "已有其他安排", rest: "完全休息日" };
    return `${periodHeader("我的備考計畫", ctx, "week")}
      <div class="card"><p>依實際班表安排，不預設星期一至五都上班。每天可改成 10 分鐘，也可以直接休息；未做的練習不會累積到下週。</p>
      <form data-prep-form="plan"><div class="prep-field"><label for="prepWeeklyGoal">本週面試練習目標（分鐘）</label><input id="prepWeeklyGoal" type="number" name="goal" min="0" max="10080" step="1" inputmode="numeric" value="${number(plan.goal)}"><p class="sub">目標可獨立調整。設為 0 代表本週不設定時間目標；審核表內的其他學習不會加入這裡。</p></div>
      <div class="prep-calendar">${list(plan.days).map(day => `<fieldset class="prep-day" data-day="${esc(day.date)}"><legend>${esc(dateLabel(day.date))}</legend><label>當天安排<select name="kind-${esc(day.date)}">${Object.entries(dayKinds).map(([value, text]) => `<option value="${value}"${selected(day.kind, value)}>${text}</option>`).join("")}</select></label><label>練習安排<select name="mode-${esc(day.date)}"><option value="0"${selected(day.mode, 0)}>不安排練習／休息</option><option value="10"${selected(day.mode, 10)}>10 分鐘低能量</option><option value="35"${selected(day.mode, 35)}>35 分鐘正常</option><option value="60"${selected(day.mode, 60)}>60 分鐘集中（可選）</option></select></label><button type="button" class="btn ghost" data-prep-action="clear-day" data-date="${esc(day.date)}">移除這天任務</button></fieldset>`).join("")}</div>
      <p class="sub">參考安排為 35、10、35、10、35、60 分鐘及一天休息，共 185 分鐘。60 分鐘可自由取消；每天仍保留你自己的休息與生活時間。</p><button type="submit" class="btn">儲存本週計畫</button></form></div>
      <div class="card"><h3>調整排題方向</h3><p class="sub">這是你目前想練的方向，不是能力判定。排題仍會顧及題型多樣性。</p><form data-prep-form="settings"><fieldset class="prep-choices"><legend>想優先改善的項目</legend>${Object.entries(problems).filter(([key]) => key !== "none").map(([key, text]) => `<label class="prep-choice"><input type="checkbox" name="weaknesses" value="${key}"${checked(selectedProblems.includes(key))}>${esc(text)}</label>`).join("")}</fieldset><label class="prep-field">本次準備的航空公司<select name="company">${["all", "華航", "長榮", "星宇", "國泰"].map(company => `<option value="${company}"${selected(settings.company || "all", company)}>${company === "all" ? "所有航空公司" : company}</option>`).join("")}</select></label><button type="submit" class="btn">儲存排題方向</button></form></div>`;
  }

  function weekPage(ctx) {
    const { esc, questionLabel } = helpers(ctx);
    const summary = ctx.core.weeklySummary(ctx.state, ctx.week);
    const goal = number(summary.goal);
    const percent = number(summary.percent);
    const modeRows = summary.modeCounts || {};
    return `${periodHeader("每週進度", ctx, "week")}
      <div class="card"><div class="prep-stat-grid"><div><span>實際面試練習</span><b>${minutes(summary.minutes)} 分鐘</b></div><div><span>自己設定的目標</span><b>${minutes(goal)} 分鐘</b></div><div><span>本週完成比例</span><b>${goal > 0 ? `${minutes(percent)}%` : "本週不設目標"}</b></div></div>${goal > 0 ? `<progress class="prep-progress" value="${Math.min(100, percent)}" max="100" aria-label="本週練習 ${minutes(percent)}%"></progress>` : ""}<p class="prep-status">${esc(summary.status)}</p><p class="sub">只計算本機實際練習時間；暫停時間、計畫時間與生活審核紀錄不計入。達到 70% 即顯示「已達本週目標」。</p><button class="btn ghost" type="button" data-prep-view="plan">修改本週計畫</button></div>
      <div class="prep-two-col"><div class="card"><h3>各模式完成次數</h3>${countsMarkup(modeRows, modeLabels, "這週還沒有完成的模式，隨時可以從 10 分鐘開始。", esc)}</div><div class="card"><h3>語言練習題數</h3>${countsMarkup(summary.languageCounts, languages, "尚無已作答題目", esc)}</div><div class="card"><h3>本週練習的題型</h3>${countsMarkup(summary.typeCounts, types, "尚無足夠資料", esc)}</div><div class="card"><h3>自己選擇的改善項目</h3>${countsMarkup(summary.weaknessCounts, problems, "尚無自我評估資料", esc)}<p class="sub">來自你填寫的自評，不是系統自動評分。</p></div></div>
      <div class="card"><h3>本週回顧與下一步</h3><p>${esc(summary.summary || "尚無足夠資料")}</p></div><div class="card"><h3>下次建議複習</h3>${list(summary.nextReviews).length ? `<div class="prep-review-list">${list(summary.nextReviews).slice(0, 8).map(item => `<div class="prep-review-row"><div><b>${esc(questionLabel(item.questionId))}</b><p class="sub">${esc(item.reviewDate || item.date)} · ${esc(label(languages, item.language))} · 上次自評${esc(label(ratings, item.rating))}</p></div><button type="button" class="btn ghost" data-prep-action="retry" data-id="${esc(item.questionId)}">再練一次</button></div>`).join("")}</div>` : '<p class="sub">尚無待複習的題目。完成作答與自評後，會依 2／7／14 天安排複習。</p>'}</div>`;
  }

  function checkbox(name, text, audit, esc) {
    return `<label class="prep-choice"><input type="checkbox" name="${name}" value="1"${checked(audit[name])}>${esc(text)}</label>`;
  }

  function auditPage(ctx) {
    const { esc } = helpers(ctx);
    const audit = ctx.state.audits[ctx.week] || {};
    const toeicTypes = list(audit.toeicTypes);
    return `${periodHeader("生活與學習自我審核", ctx, "week")}
      <div class="card"><p>以下全部自願填寫，也可以只勾選一項。這張表不計分，不影響面試練習完成比例。</p><form data-prep-form="audit">
      <fieldset class="prep-choices"><legend>面試準備</legend>${checkbox("interviewEnglish", "本週有進行英文即席口說", audit, esc)}${checkbox("interviewChinese", "本週有練習中文面試回答", audit, esc)}${checkbox("reviewWeak", "本週有複習上次的弱點", audit, esc)}${checkbox("usedSite", "本週有使用網站進行面試練習", audit, esc)}</fieldset>
      <fieldset class="prep-choices"><legend>多益準備（其他教材，手動紀錄）</legend><p class="sub">這裡只記錄你在其他教材上的學習。多益分鐘不加入面試練習時間，也不會產生網站題目或排程。</p>${checkbox("toeicStudied", "本週有準備多益", audit, esc)}<label class="prep-field">多益學習分鐘數<input name="toeicMinutes" type="number" min="0" max="10080" step="1" inputmode="numeric" value="${audit.toeicMinutes == null ? "" : number(audit.toeicMinutes)}" placeholder="可留空"></label><div class="prep-choices" role="group" aria-label="本週多益準備內容">${Object.entries({ listening: "聽力", reading: "閱讀", mock: "模擬試題", errors: "錯題複習" }).map(([key, text]) => `<label class="prep-choice"><input type="checkbox" name="toeicTypes" value="${key}"${checked(toeicTypes.includes(key))}>${text}</label>`).join("")}</div><label class="prep-field">本週多益目標是否完成<select name="toeicGoal"><option value=""${selected(audit.toeicGoal || "", "")}>不填寫</option><option value="yes"${selected(audit.toeicGoal, "yes")}>已完成</option><option value="partial"${selected(audit.toeicGoal, "partial")}>完成一部分</option><option value="no"${selected(audit.toeicGoal, "no")}>這週沒有安排／尚未完成</option></select></label></fieldset>
      <fieldset class="prep-choices"><legend>生活與休息</legend>${checkbox("relax", "本週有安排足夠的放鬆時間", audit, esc)}${checkbox("exercise", "本週有運動或參加皮拉提斯", audit, esc)}${checkbox("social", "本週有與朋友、家人相處", audit, esc)}${checkbox("rest", "本週有保留完全休息的時間", audit, esc)}${checkbox("stressOkay", "本週整體壓力在可接受範圍", audit, esc)}</fieldset>
      <fieldset class="prep-choices"><legend>可選的簡短反思</legend><label class="prep-field">這週做得最好的一件事是什麼？<textarea name="best" rows="2" maxlength="2000" placeholder="可以跳過">${esc(audit.best || "")}</textarea></label><label class="prep-field">這週最大的困難是什麼？<textarea name="difficulty" rows="2" maxlength="2000" placeholder="可以跳過">${esc(audit.difficulty || "")}</textarea></label><label class="prep-field">下週想改善哪一件小事？<textarea name="change" rows="2" maxlength="2000" placeholder="例如：先用一句英文說出重點">${esc(audit.change || "")}</textarea></label><label class="prep-field">其他備註<textarea name="notes" rows="2" maxlength="4000" placeholder="可留空">${esc(audit.notes || "")}</textarea></label></fieldset><button type="submit" class="btn">儲存本週審核</button><p class="sub">未勾選的項目不代表失敗。這是留給自己的一份生活紀錄。</p></form></div>`;
  }

  function testMetrics(test) {
    if (!test) return null;
    const metrics = test.metrics || test.counts || test;
    if (!Object.keys(metricLabels).every(key => Number.isFinite(Number(metrics[key])))) return null;
    return metrics;
  }

  function progressPage(ctx) {
    const { esc } = helpers(ctx);
    const summary = ctx.core.monthlySummary(ctx.state, ctx.month);
    const metric = testMetrics(summary.test);
    const previous = summary.previous || {};
    const previousMetric = testMetrics(previous.test);
    const comparison = summary.comparison;
    const isCurrentMonth = ctx.month === ctx.core.monthKey();
    const monthlyRows = Object.keys(ctx.state.monthly || {}).sort().reverse().slice(0, 12).map(month => ({ month, test: ctx.state.monthly[month], metrics: testMetrics(ctx.state.monthly[month]) })).filter(item => item.metrics);
    const delta = value => `${number(value) > 0 ? "+" : ""}${minutes(value)}`;
    return `${periodHeader("我的進步", ctx, "month")}
      <div class="card"><div class="prep-stat-grid"><div><span>實際面試練習</span><b>${minutes(summary.minutes)} 分鐘</b></div><div><span>已作答題次</span><b>${number(summary.questionCount)} 題</b></div></div><p class="sub">時間、題次與語言來自練習紀錄。同一題跨次重練會各記一次；尚未作答與跳過不算已完成題次。</p>${countsMarkup(summary.languageCounts, languages, "本月尚無已作答題目", esc)}</div>
      <div class="card"><h3>每月五題英文自測</h3><p>抽取五道未練習或近期未出現的英文題目。四項指標由你自評，每項 0–5 題；系統只直接記錄時間、作答題次與所選題目。</p><p class="sub">沒有語音辨識或人工評分，這裡不會自動判定文法、發音或流暢度。這是每月一次的自我觀察，可以提前結束；未完成五題時不產生完整五題能力比較。</p>${metric ? `<p class="sub">此月已保存自評${summary.test.completedAt || summary.test.at ? ` · ${esc(timeLabel(summary.test.completedAt || summary.test.at))}` : ""}</p><div class="prep-metric-grid">${Object.entries(metricLabels).map(([key, text]) => `<div class="prep-metric"><span>${text}（自評）</span><b>${number(metric[key])} / 5</b><progress value="${number(metric[key])}" max="5" aria-label="${text}自評 ${number(metric[key])} 題"></progress>${previousMetric ? `<small>上月 ${number(previousMetric[key])} 題，本月變化 ${delta(number(metric[key]) - number(previousMetric[key]))} 題</small>` : '<small>上月尚無完整自評可比較</small>'}</div>`).join("")}</div>` : '<p class="sub">尚無足夠資料：此月還沒有完整五題自評。</p>'}${isCurrentMonth ? `<button type="button" class="btn" data-prep-action="monthly-start" ${metric ? "disabled" : ""}>${metric ? "本月自測已保存" : "開始本月五題英文自測"}</button>` : '<p class="sub">目前正在查看其他月份。切回本月後，才能開始本月的自測。</p><button type="button" class="btn ghost" data-prep-action="current-month">切回本月</button>'}</div>
      <div class="prep-two-col"><div class="card"><h3>與上個月相比</h3>${comparison ? `<p>實際練習時間變化：<b>${delta(comparison.minutesDelta)} 分鐘</b></p><p>已作答題次變化：<b>${delta(comparison.questionCountDelta)} 題</b></p><p class="sub">這些是練習量的變化，不能單憑時間或題數判定能力進步。</p>` : '<p class="sub">尚無足夠資料。兩個月都有練習紀錄後，再顯示練習量比較。</p>'}<p>${esc(summary.summary || "尚無足夠資料")}</p></div><div class="card"><h3>本月自評常見弱點</h3>${countsMarkup(summary.weaknessCounts, problems, "尚無自我評估資料", esc)}</div></div>
      <div class="card"><h3>每月能力自評趨勢</h3>${monthlyRows.length ? `<div class="prep-table-wrap"><table class="prep-table"><caption>每月五題自評，各項 0–5 題；不同月份題目不同，僅作自我觀察。</caption><thead><tr><th scope="col">月份</th>${Object.values(metricLabels).map(text => `<th scope="col">${text}</th>`).join("")}</tr></thead><tbody>${monthlyRows.map(row => `<tr><th scope="row">${esc(row.month)}</th>${Object.keys(metricLabels).map(key => `<td><span>${number(row.metrics[key])} / 5</span><progress value="${number(row.metrics[key])}" max="5" aria-label="${esc(row.month)} ${metricLabels[key]}自評 ${number(row.metrics[key])} 題"></progress></td>`).join("")}</tr>`).join("")}</tbody></table></div>` : '<p class="sub">尚無足夠資料。完成月度五題自測後，才會列出真實的自評紀錄。</p>'}</div>`;
  }

  function assessmentRows(state) {
    return list(state.sessions).flatMap(session => Object.entries(session.assessments || {}).map(([questionId, assessment]) => ({ ...assessment, questionId: assessment.questionId || questionId, sessionId: session.id, at: assessment.at || session.endedAt || session.startedAt || session.date }))).sort((left, right) => String(left.at).localeCompare(String(right.at)));
  }

  function assessmentText(assessment, esc) {
    const self = assessment.selfAssessment || {};
    const start = { within5: "5 秒內", "5to10": "5–10 秒", over10: "超過 10 秒" };
    const complete = { full: "完整", partial: "部分完整", incomplete: "不完整" };
    const fluency = { smooth: "流暢", occasional: "偶爾停頓", frequent: "頻繁卡住" };
    return `<span>開始：${esc(start[self.startDelay] || "未填")}</span> · <span>完整度：${esc(complete[self.completeness] || "未填")}</span> · <span>流暢度：${esc(fluency[self.fluency] || "未填")}</span>${list(self.problems).length ? `<br><span class="sub">${list(self.problems).map(key => esc(label(problems, key))).join("、")}</span>` : ""}`;
  }

  function historyPage(ctx) {
    const { esc, question, questionLabel } = helpers(ctx);
    const allAssessments = assessmentRows(ctx.state);
    const sessions = list(ctx.state.sessions).slice().sort((left, right) => String(right.startedAt || right.date).localeCompare(String(left.startedAt || left.date)));
    return `<div class="card"><h2>我的練習紀錄</h2><p class="sub">保留原有題目 ID 與每次自評。題庫日後更新，也不會刪除已保存的紀錄。回答比較是你的自我觀察，不是考官或 AI 評分。</p><button class="btn ghost" type="button" data-prep-view="data">匯出／匯入本機資料</button></div>${sessions.length ? sessions.map(session => {
      const rows = list(session.entries);
      const completedCount = rows.filter(entry => entry.status === "completed").length;
      return `<details class="card prep-session-history"><summary><span><b>${esc(timeLabel(session.startedAt || session.startTime || session.date))}</b><span class="sub">${esc(modeLabels[session.mode] || `${session.mode} 分鐘練習`)} · 實際 ${minutes(session.actualMinutes == null ? session.minutes : session.actualMinutes)} 分鐘 · ${esc(statuses[session.status] || session.status || "已保存")} · ${completedCount} 題作答</span></span></summary><div class="prep-history-body">${session.notes ? `<p>本次備註：${esc(session.notes)}</p>` : ""}${rows.length ? rows.map(entry => {
        const item = question(entry.questionId);
        const assessment = session.assessments && session.assessments[entry.questionId];
        const previous = allAssessments.filter(row => String(row.questionId) === String(entry.questionId) && row.sessionId !== session.id && String(row.at) < String(assessment && assessment.at || session.startedAt || session.date)).slice(-1)[0];
        return `<div class="prep-history-question"><h3>${esc(questionLabel(entry.questionId))}</h3><div class="chips"><span class="tag">${esc(label(languages, entry.language))}</span><span class="tag">${esc(label(types, entry.type))}</span><span class="tag">${esc(statuses[entry.status] || entry.status || "未作答")}</span>${item && item.sourceLabel ? `<span class="tag">${esc(item.sourceLabel)}</span>` : ""}</div>${entry.reason ? `<p class="sub">排題原因：${esc(entry.reason)}</p>` : ""}${assessment ? `<div class="prep-assessment-summary"><b>這次自評</b><p>${assessmentText(assessment, esc)}</p><p class="sub">${esc(label(ratings, assessment.rating))}${assessment.reviewDate ? ` · 下次建議複習 ${esc(assessment.reviewDate)}` : ""}</p>${assessment.notes || assessment.selfAssessment && assessment.selfAssessment.notes ? `<p>備註：${esc(assessment.notes || assessment.selfAssessment.notes)}</p>` : ""}${previous ? `<details><summary>比較上次自評（${esc(previous.date || timeLabel(previous.at))}）</summary><p>${assessmentText(previous, esc)}</p><p class="sub">同一題跨次自評供你比較，不推算客觀分數。</p></details>` : '<p class="sub">尚無這題的前次自評可比較。</p>'}</div>` : '<p class="sub">這題未填寫自評。</p>'}<button type="button" class="btn ghost" data-prep-action="retry" data-id="${esc(entry.questionId)}">再練一次</button></div>`;
      }).join("") : '<p class="sub">這次尚未開始作答。</p>'}</div></details>`;
    }).join("") : '<div class="card"><p>還沒有練習紀錄。可以先試一次 10 分鐘模式，提早完成也能保存。</p><button type="button" class="btn" data-prep-view="home">回到今天的練習</button></div>'}`;
  }

  function dataPage(ctx) {
    const { esc } = helpers(ctx);
    return `<div class="card"><h2>本機資料與備份</h2><p>備考計畫、自評、複習日期、生活審核與月度自測都保存在這個瀏覽器，不會自動跨裝置同步。換裝置前，可先匯出 JSON，再在新裝置匯入。</p><p class="sub">目前資料版本：${esc(ctx.state.version)} · 已保存 ${list(ctx.state.sessions).length} 次練習。既有題庫原文與原始面試回答不會被這份備份改寫。</p><div class="prep-actions"><button type="button" class="btn" data-prep-action="export">匯出備考 JSON</button><label class="btn ghost prep-import-label">選擇 JSON 匯入<input type="file" data-prep-import accept="application/json,.json" aria-label="選擇備考 JSON 備份檔"></label></div><p class="sub">匯入前會驗證版本與格式；不合格的檔案不會覆蓋現有資料。備份內容包括自訂備註，請存放在你信任的位置。</p><details><summary>保存內容與計算方式</summary><ul><li>每週以星期一開始，日期一律依 Asia/Taipei 計算。</li><li>每週目標只使用當週計畫；未完成任務不延至下週。</li><li>面試練習分鐘來自實際計時，暫停與離開後的閒置時間不計入。</li><li>生活審核與其他教材的手動紀錄分開保存，不加入面試練習進度。</li><li>錄音不會偷偷上傳，也不預設永久保存在這份 JSON 中。</li><li>原網站的收藏、朗讀與其他練習紀錄保留原本保存方式。</li></ul></details></div>`;
  }

  function render(view, ctx) {
    if (!ctx || !ctx.state || !ctx.core) return '<div class="card"><p>備考資料尚未準備好，請稍後再試。</p></div>';
    if (view === "plan") return planPage(ctx);
    if (view === "week") return weekPage(ctx);
    if (view === "audit") return auditPage(ctx);
    if (view === "progress") return progressPage(ctx);
    if (view === "history") return historyPage(ctx);
    if (view === "data") return dataPage(ctx);
    return '<div class="card"><p>請選擇要查看的備考頁面。</p></div>';
  }

  return { render, labels: { languages, types, problems, ratings, statuses, metricLabels, modeLabels } };
});
