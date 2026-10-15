(function(root){
  'use strict';
  const DAY=86400000;
  const dimensions={tone:'Tone of Voice 語調',volume:'Volume 音量',fluency:'Fluency 流暢度',accuracy:'Accuracy 準確度',pausing:'Pausing 停頓與換氣',eye:'Eye Contact 眼神接觸'};
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
    for(const s of sessions)if(s.errors?.some(e=>e.confirmed)&&((s.reviewSchedule?.due??s.ts+DAY)<=now))list.push({kind:'session',id:s.id,title:s.title,due:s.reviewSchedule?.due??s.ts+DAY});
    return list.sort((a,b)=>a.due-b.due);
  }
  function textMetrics(original,transcript,duration,completedWords){
    const tokens=root.ReadingLabCore.tokens,total=tokens(original).length,heard=tokens(transcript).length;
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
  root.ReadingTraining={DAY,dimensions,schedule,due,reviewItems,textMetrics,phraseParts,waveformMetrics,safeSchedule,safeAssessment};
  if(typeof module!=='undefined')module.exports=root.ReadingTraining;
})(typeof window!=='undefined'?window:globalThis);
