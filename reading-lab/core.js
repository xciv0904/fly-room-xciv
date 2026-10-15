(function(root){
  "use strict";
  const categories={long:"Long Words 多音節單字",stress:"Word Stress 重音",final:"Final Consonants 詞尾子音",proper:"Proper Nouns 專有名詞",skipped:"Skipped Words 漏讀",fluency:"Fluency 流暢度",intonation:"Intonation 語調",other:"其他文字差異（待人工分類）"};
  const tokens=text=>String(text||"").match(/[\p{L}\p{N}]+(?:['’/-][\p{L}\p{N}]+)*/gu)||[];
  const normalize=t=>t.toLowerCase().replace(/’/g,"'");
  const forms=t=>{
    const word=normalize(t),set=new Set([word]);
    for(const [suffix,replacement]of [["ies","y"],["es",""],["s",""],["ed",""],["ed","e"],["ing",""],["ing","e"]])if(word.endsWith(suffix))set.add(word.slice(0,-suffix.length)+replacement);
    return set;
  };
  function compare(original,transcript){
    const a=tokens(original),b=tokens(transcript);
    if(a.length>1000||b.length>1000)throw Error("一次最多比對 1,000 個字詞，請縮短貼上的內容。");
    const dp=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
    for(let i=0;i<=a.length;i++)dp[i][0]=i;
    for(let j=0;j<=b.length;j++)dp[0][j]=j;
    for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(normalize(a[i-1])===normalize(b[j-1])?0:1));
    const ops=[];let i=a.length,j=b.length;
    while(i||j){
      let op;
      if(i&&j&&normalize(a[i-1])===normalize(b[j-1])){op={type:"equal",original:a[--i],heard:b[--j]};}
      else if(i&&j&&dp[i][j]===dp[i-1][j-1]+1){op={type:"replace",original:a[--i],heard:b[--j]};}
      else if(i&&dp[i][j]===dp[i-1][j]+1){op={type:"missing",original:a[--i],heard:""};}
      else{op={type:"extra",original:"",heard:b[--j]};}
      if(op.type!=="equal"){
        op.ending=op.type==="replace"&&[...forms(op.original)].some(stem=>stem.length>2&&forms(op.heard).has(stem));
        op.proper=/^[A-Z][a-z]|^[A-Z]{2,}/.test(op.original)&&i>0;
        op.category=op.ending?"final":op.proper?"proper":op.type==="missing"?"skipped":"other";
      }
      ops.push(op);
    }
    ops.reverse();
    return {ops,similarity:a.length?Math.max(0,Math.round((1-dp[a.length][b.length]/Math.max(a.length,b.length))*100)):0,originalWords:a.length,transcriptWords:b.length};
  }
  function dayKey(date=new Date()){
    const d=new Date(date);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  function streak(daily,now=new Date()){
    const date=new Date(now);let count=0;
    if(!daily[dayKey(date)]?.complete)date.setDate(date.getDate()-1);
    while(daily[dayKey(date)]?.complete){count++;date.setDate(date.getDate()-1);}
    return count;
  }
  function trends(sessions,now=new Date()){
    return Array.from({length:7},(_,i)=>{
      const d=new Date(now);d.setDate(d.getDate()-6+i);const day=dayKey(d),rows=sessions.filter(s=>dayKey(s.ts)===day);
      return {day,sessions:rows.length,confirmed:rows.reduce((n,s)=>n+s.errors.filter(e=>e.confirmed).length,0),seconds:rows.reduce((n,s)=>n+s.duration,0)};
    });
  }
  function mergeState(current,incoming){
    const next=structuredClone(current);
    for(const [id,p]of Object.entries(incoming.words||{}))if(!next.words[id]||(p.updated||0)>(next.words[id].updated||0))next.words[id]=p;
    next.favorites=[...new Set([...(current.favorites||[]),...(incoming.favorites||[])])];
    next.places={...(current.places||{})};
    for(const [id,p]of Object.entries(incoming.places||{}))if(!next.places[id]||p.updated>next.places[id].updated)next.places[id]=p;
    for(const [date,value]of Object.entries(incoming.daily||{})){
      const tasks={...(next.daily[date]?.tasks||{})};
      for(const [key,done]of Object.entries(value.tasks||{}))if(done)tasks[key]=true;
      next.daily[date]={tasks,complete:["words","places","reading","review"].every(k=>tasks[k])};
    }
    return next;
  }
  function validateBackup(input){
    if(input?.kind!=="fly-room-reading-lab"||input.version!==1||!Array.isArray(input.sessions)||input.sessions.length>2000)throw Error("不是有效的朗讀實驗室備份，或紀錄超過 2,000 筆。");
    if(!input.state||typeof input.state!=="object")throw Error("備份缺少設定。");
    const safeString=(x,max=20000)=>typeof x==="string"?x.slice(0,max):"";
    const words={};
    for(const [id,p]of Object.entries(input.state.words||{}).slice(0,5000)){
      if(!/^[a-z0-9-]+$/i.test(id)||!p||!["pending","unsure","retry","mastered"].includes(p.status))continue;
      words[id]={status:p.status,confirmed:p.confirmed===true,updated:Number(p.updated)||0,attempts:Math.max(0,Number(p.attempts)||0)};
    }
    const places={};for(const [id,p]of Object.entries(input.state.places||{}))if(/^place-\d+$/.test(id)&&p&&Number.isFinite(p.updated)&&Number.isFinite(p.attempts))places[id]={updated:p.updated,attempts:Math.max(0,p.attempts)};
    const daily={};for(const [date,v]of Object.entries(input.state.daily||{}))if(/^\d{4}-\d{2}-\d{2}$/.test(date)&&v?.tasks){const tasks={};for(const k of ["words","places","reading","review"])tasks[k]=v.tasks[k]===true;daily[date]={tasks,complete:Object.values(tasks).every(Boolean)};}
    const sessions=input.sessions.map(s=>{
      if(!s||!Number.isFinite(s.ts)||!Number.isFinite(s.duration)||s.duration<0||s.duration>86400)throw Error("備份含有無效的練習時間。");
      return {id:safeString(s.id,100),ts:s.ts,title:safeString(s.title,300),questionId:safeString(s.questionId,100),difficulty:safeString(s.difficulty,30),original:safeString(s.original),transcript:safeString(s.transcript),duration:s.duration,notes:safeString(s.notes,5000),errors:(Array.isArray(s.errors)?s.errors:[]).slice(0,1000).map(e=>({original:safeString(e.original,150),heard:safeString(e.heard,150),category:categories[e.category]?e.category:"long",confirmed:e.confirmed===true,note:safeString(e.note,1000)})),reviewed:s.reviewed===true};
    });
    if(sessions.some(s=>!s.id||!s.original)||new Set(sessions.map(s=>s.id)).size!==sessions.length)throw Error("備份紀錄缺少原稿或有重複識別碼。");
    if(sessions.some(s=>tokens(s.original).length>1000||tokens(s.transcript).length>1000))throw Error("備份包含超過比對上限的原稿或逐字稿。");
    return {sessions,state:{words,places,daily,favorites:(Array.isArray(input.state.favorites)?input.state.favorites:[]).filter(x=>typeof x==="string").slice(0,1000)},audio:input.audio||[]};
  }
  root.ReadingLabCore={categories,tokens,compare,dayKey,streak,trends,mergeState,validateBackup};
  if(typeof module!=="undefined")module.exports=root.ReadingLabCore;
})(typeof window!=="undefined"?window:globalThis);
