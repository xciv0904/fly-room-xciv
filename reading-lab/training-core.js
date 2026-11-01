(function(root){
  'use strict';
  const DAY=86400000;
  const core=root.ReadingLabCore||(typeof module!=='undefined'?require('./core.js'):null);
  const dimensions={tone:'Tone of Voice 語調',volume:'Volume 音量',fluency:'Fluency 流暢度',accuracy:'Accuracy 準確度',pausing:'Pausing 停頓與換氣',eye:'Eye Contact 眼神接觸'};
  const passageKey=text=>String(text||'').normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  function containsPhrase(text,phrase){
    const segment=passageKey(phrase);
    return !!segment&&` ${passageKey(text)} `.includes(` ${segment} `);
  }
  function hasPracticed(session){
    return !!session?.id&&Number.isFinite(session.ts)&&Number.isFinite(session.duration)&&session.duration>0&&session.started!==false&&session.interrupted!==true;
  }
  function issueId(session,error,index=0){
    if(core.referenceValue(error?.id))return error.id;
    // The index is preserved in legacy saved errors. Editable labels and notes
    // deliberately do not participate in identity.
    const identity=session?.id||session?.savedId||`${session?.questionId||''}:${session?.ts||0}`;
    if(core.referenceValue(identity)&&identity.length<=120)return `issue-${identity}-${index}`;
    const key=JSON.stringify([identity,index]);
    let hash=2166136261,second=5381;for(let i=0;i<key.length;i++){hash^=key.charCodeAt(i);hash=Math.imul(hash,16777619);second=Math.imul(second,33)^key.charCodeAt(i);}
    return `issue-${(hash>>>0).toString(36)}-${(second>>>0).toString(36)}-${index}`;
  }
  function issueHistory(sessions=[]){
    const ordered=sessions.filter(Boolean).slice().sort((a,b)=>(a.ts||0)-(b.ts||0)||String(a.id).localeCompare(String(b.id))),issues=[];
    for(const session of ordered)for(const [index,error]of (Array.isArray(session.errors)?session.errors:[]).entries())if(error?.confirmed===true){
      const id=issueId(session,error,index);
      issues.push({id,issueId:id,sessionId:session.id,questionId:session.questionId,original:error.original||'',heard:error.heard||'',category:error.category||'other',note:error.note||'',session,error,index,status:'pending',sameArticleStatus:'pending',transferStatus:'pending',lastReview:null,reviews:[]});
    }
    const duplicateIds=new Set(),byId=new Map();for(const issue of issues){if(byId.has(issue.id))duplicateIds.add(issue.id);else byId.set(issue.id,issue);}
    for(const session of ordered){
      if(!hasPracticed(session))continue;
      const workflow=core.workflowValue(session);
      if(workflow.practiceType==='initial'||!workflow.baselineId)continue;
      for(const result of workflow.reviewResults){
        const issue=byId.get(result.issueId);
        if(!issue||duplicateIds.has(issue.id)||session.id===issue.sessionId||session.ts<=issue.session.ts||workflow.baselineId!==issue.sessionId)continue;
        const sameQuestion=!!session.questionId&&session.questionId===issue.questionId,sameText=!!passageKey(session.original)&&passageKey(session.original)===passageKey(issue.session.original);
        if(workflow.practiceType==='retry'&&(!sameQuestion||!sameText))continue;
        if(workflow.practiceType==='transfer'&&(sameQuestion||sameText||!session.questionId||!issue.questionId||!containsPhrase(session.original,issue.original)))continue;
        const review={...result,sessionId:session.id,ts:session.ts,practiceType:workflow.practiceType};
        issue.reviews.push(review);issue.lastReview=review;
        if(workflow.practiceType==='retry'){
          issue.sameArticleStatus=result.status;
          if(result.status!=='resolved'&&issue.transferStatus==='resolved')issue.transferStatus='pending';
        }
        else issue.transferStatus=result.status;
        issue.status=result.status;
      }
    }
    return issues;
  }
  const activeIssues=(sessions=[])=>issueHistory(sessions).filter(issue=>issue.status!=='resolved');
  function transferDueItems(sessions=[],now=Date.now()){
    return issueHistory(sessions).filter(issue=>issue.status==='resolved'&&issue.sameArticleStatus==='resolved'&&['pending','retry'].includes(issue.transferStatus)&&passageKey(issue.original)&&Number.isFinite(issue.lastReview?.ts)&&issue.lastReview.ts+DAY<=now).map(issue=>({kind:'transfer',id:issue.id,issueId:issue.id,sessionId:issue.sessionId,questionId:issue.questionId,title:issue.original,due:issue.lastReview.ts+DAY})).sort((a,b)=>a.due-b.due||a.issueId.localeCompare(b.issueId));
  }
  function attemptsFor(sessions=[],questionId){
    return sessions.filter(session=>session?.questionId===questionId&&hasPracticed(session)).slice().sort((a,b)=>a.ts-b.ts||String(a.id).localeCompare(String(b.id)));
  }
  function comparison(baseline,current){
    const describe=session=>session?{id:session.id,ts:session.ts,title:session.title||'',duration:session.duration||0,metrics:textMetrics(session.original,session.transcript,session.duration,session.completedWords),assessment:safeAssessment(session.assessment),confirmedCount:(session.errors||[]).filter(error=>error?.confirmed===true).length}:null;
    const first=describe(baseline),latest=describe(current),sameArticle=!!passageKey(baseline?.original)&&passageKey(baseline.original)===passageKey(current?.original),comparable=!!(sameArticle&&baseline?.id!==current?.id&&hasPracticed(baseline)&&hasPracticed(current));
    const comparableRate=comparable&&first.metrics.rateSource===latest.metrics.rateSource&&Number.isFinite(first.metrics.wordsPerMinute)&&Number.isFinite(latest.metrics.wordsPerMinute);
    return {sameArticle,comparable,baselineId:baseline?.id||'',currentId:current?.id||'',baseline:first,current:latest,changes:{duration:comparable?latest.duration-first.duration:null,wordsPerMinute:comparableRate?latest.metrics.wordsPerMinute-first.metrics.wordsPerMinute:null,completion:comparable&&first.metrics.completion!==null&&latest.metrics.completion!==null?latest.metrics.completion-first.metrics.completion:null},notice:'秒數、字數、人工自評與問題標記僅描述兩次練習；速度或問題數差異不能單獨證明發音進步。'};
  }
  function schedule(previous,grade,now=Date.now()){
    const stage=grade==='mastered'?Math.min(4,(previous?.stage||0)+1):0;
    const days=grade==='mastered'?[1,7,14,30,60][stage]:1;
    return {stage,days,due:now+days*DAY,reviewedAt:now};
  }
  function due(progress,now=Date.now()){
    if(!progress)return false;
    if(progress.schedule)return progress.schedule.due<=now;
    return ['retry','unsure','pending'].includes(progress.status)&&(!progress.updated||progress.updated+DAY<=now);
  }
  function reviewItems(sessions,state,now=Date.now()){
    const list=[];
    for(const [id,p]of Object.entries(state.words||{}))if(due(p,now))list.push({kind:'word',id,due:p.schedule?.due||p.updated||0});
    for(const [id,p]of Object.entries(state.places||{}))if(due(p,now))list.push({kind:'place',id,due:p.schedule?.due||p.updated||0});
    const activeSessionIds=new Set(activeIssues(sessions).map(issue=>issue.sessionId));
    for(const s of sessions)if(activeSessionIds.has(s.id)&&((s.reviewSchedule?.due??s.ts+DAY)<=now))list.push({kind:'session',id:s.id,title:s.title,due:s.reviewSchedule?.due??s.ts+DAY});
    return list.sort((a,b)=>a.due-b.due);
  }
  function textMetrics(original,transcript,duration,completedWords){
    const tokens=core.tokens,total=tokens(original).length,heard=tokens(transcript).length;
    const manual=Number.isFinite(completedWords)?Math.max(0,Math.min(total,completedWords)):null;
    return {total,transcriptWords:heard,wordsPerMinute:duration>0?(manual!==null?manual:heard)>0?Math.round((manual??heard)/duration*60):null:null,rateSource:manual!==null?'使用者填寫的朗讀字數':'逐字稿字數（受辨識／編輯影響）',completion:manual!==null&&total?Math.round(manual/total*100):null};
  }
  function phraseParts(text){
    // Punctuation/conjunction heuristics, not a syntactic or prosody model.
    return String(text).split(/(?<=[,;:.!?])\s+|\s+(?=(?:while|although|because|which|whereas)\b)/i).filter(Boolean);
  }
  function waveformMetrics(channel,sampleRate,thresholdDb=-40){
    const size=Math.max(1,Math.round(sampleRate*.02)),frames=[];let squares=0,peak=0,clipped=0;
    for(let i=0;i<channel.length;i+=size){let sum=0;const end=Math.min(channel.length,i+size);for(let j=i;j<end;j++){const v=channel[j];sum+=v*v;peak=Math.max(peak,Math.abs(v));if(Math.abs(v)>=.99)clipped++;}squares+=sum;frames.push({start:i/sampleRate,end:end/sampleRate,quiet:10*Math.log10(sum/(end-i)||1e-12)<thresholdDb});}
    const pauses=[];let start=null;
    for(const frame of frames){if(frame.quiet&&start===null)start=frame.start;if(!frame.quiet&&start!==null){if(frame.start-start>=.6)pauses.push({start,end:frame.start,duration:frame.start-start});start=null;}}
    if(start!==null&&channel.length/sampleRate-start>=.6)pauses.push({start,end:channel.length/sampleRate,duration:channel.length/sampleRate-start});
    return {duration:channel.length/sampleRate,rmsDb:10*Math.log10(squares/channel.length||1e-12),peakDb:20*Math.log10(peak||1e-6),clippedPercent:channel.length?clipped/channel.length*100:0,pauses,quietSeconds:pauses.reduce((n,p)=>n+p.duration,0),thresholdDb,method:'local-rms-20ms-min600ms-v1'};
  }
  function safeSchedule(s){return s&&Number.isFinite(s.due)&&Number.isFinite(s.reviewedAt)?{due:s.due,reviewedAt:s.reviewedAt,days:Math.max(1,Math.min(60,Number(s.days)||1)),stage:Math.max(0,Math.min(4,Number(s.stage)||0))}:undefined;}
  function safeAssessment(value){
    const result={};for(const key of Object.keys(dimensions))result[key]=['pending','good','retry'].includes(value?.[key])?value[key]:'pending';
    return result;
  }
  root.ReadingTraining={DAY,dimensions,schedule,due,reviewItems,textMetrics,phraseParts,waveformMetrics,safeSchedule,safeAssessment,passageKey,containsPhrase,hasPracticed,issueId,issueHistory,activeIssues,transferDueItems,attemptsFor,comparison};
  if(typeof module!=='undefined')module.exports=root.ReadingTraining;
})(typeof window!=='undefined'?window:globalThis);
