(function(root){
  'use strict';
  const T=root.ReadingTraining,C=root.ReadingLabCore;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let videoUrl;
  async function analyze(blob){
    if(!blob)throw Error('請先錄音或匯入音檔。');
    if(blob.size>20*1024*1024)throw Error('本機音訊分析上限 20 MB，較大音檔仍可回聽與人工自評。');
    const Audio=root.AudioContext||root.webkitAudioContext;if(!Audio)throw Error('此瀏覽器不支援本機音訊解碼，請回聽並人工確認六項表現。');
    const context=new Audio();try{
      const buffer=await context.decodeAudioData(await blob.arrayBuffer());
      if(buffer.duration>600)throw Error('音訊超過 10 分鐘，請改以回聽／人工標記分析。');
      const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>T.waveformMetrics(buffer.getChannelData(i),buffer.sampleRate));
      const loudest=channels.sort((a,b)=>b.rmsDb-a.rmsDb)[0];if(!loudest)throw Error('音檔沒有可解碼聲道');return {...loudest,channels:buffer.numberOfChannels,ts:Date.now()};
    }catch(e){throw Error(e.message?.includes('分鐘')?e.message:'無法解碼此錄音格式；音檔仍可保留與播放，請人工自評或匯入 WAV。');}finally{await context.close();}
  }
  function panel(d,disabled=''){
    const m=T.textMetrics(d.original,d.transcript,d.duration,d.completedWords),a=d.audioAnalysis,assessment=T.safeAssessment(d.assessment);
    return `<div class="card" id="labAnalysis"><h3>六項朗讀分析</h3><p class="sub">免費、本機處理；沒有 AI 面試分數。下列六項只由你回聽／看影片後確認，未評的保持「待人工確認」。</p><p>朗讀時間 ${d.duration||0} 秒 · ${m.wordsPerMinute===null?'語速待確認':`字數／時間 ${m.wordsPerMinute} WPM（${esc(m.rateSource)}；不是自動語音流暢度）`} · ${m.completion===null?'完成度待人工填寫':`自填完成度 ${m.completion}%`}</p><label>實際讀完幾個原稿字詞（可留空，總數 ${m.total}）<input id="labCompletedWords" type="number" min="0" max="${m.total}" value="${Number.isFinite(d.completedWords)?d.completedWords:''}"${disabled}></label><div class="lab-actions"><button class="btn sec" data-lab-action="audio-analyze"${disabled}>分析本機音量與安靜區間</button></div>${a?`<div class="lab-audio-metrics"><p>RMS ${a.rmsDb.toFixed(1)} dBFS · 峰值 ${a.peakDb.toFixed(1)} dBFS · 接近滿刻度樣本 ${a.clippedPercent.toFixed(2)}%</p><p>偵測到 ${a.pauses.length} 個 ≥0.6 秒安靜區間，共 ${a.quietSeconds.toFixed(1)} 秒（門檻 ${a.thresholdDb} dBFS）。</p><p class="sub">這是數位波形相對值，不是實際聲壓或「音量適中」判定；降噪、背景聲與裝置增益會影響結果。安靜區間不等於漏讀、換氣錯誤或不流暢。</p><details><summary>逐段回聽檢查</summary>${a.pauses.slice(0,60).map(p=>`<p>${p.start.toFixed(1)}–${p.end.toFixed(1)} 秒 · ${p.duration.toFixed(1)} 秒 <button class="btn sec" data-lab-action="seek-pause" data-time="${Math.max(0,p.start-.5)}">回聽這段</button></p>`).join('')}</details></div>`:'<p class="sub">尚無波形資料：音量、停頓及流暢度待人工確認。文字差異只反映原稿與逐字稿，不證明發音有錯。</p>'}<div class="lab-fields">${Object.entries(T.dimensions).map(([key,label])=>`<label>${label}<select data-lab-assessment="${key}"${disabled}>${[['pending','待人工確認'],['good','自評穩定'],['retry','自評需要重練']].map(([v,l])=>`<option value="${v}"${assessment[key]===v?' selected':''}>${l}</option>`).join('')}</select></label>`).join('')}</div><details><summary>影片自評：眼神、表情與站姿</summary><p>只在此頁播放裝置影片，不上傳、不儲存影片本體。眼神項目不會從錄音推測。</p><label>選擇自己的練習影片<input id="labVideoFile" type="file" accept="video/*,.mov,.mp4,.webm"${disabled}></label><div id="labVideoPreview"></div>${[['eye','是否自然抬眼，與鏡頭／考官保持適度眼神接觸'],['expression','表情是否自然、親切'],['posture','站姿是否穩定，沒有持續低頭或晃動']].map(([key,label])=>`<label class="lab-check"><input type="checkbox" data-lab-visual="${key}"${d.visual?.[key]?' checked':''}${disabled}>已自行檢視：${label}</label>`).join('')}<p class="sub">勾選只代表你有檢視，不代表系統判定合格；在上方 Eye Contact 選擇自己的評估。</p></details></div>`;
  }
  function video(file,holder){release();if(!file)return;if(file.size>200*1024*1024)throw Error('影片上限 200 MB，請縮短後再選取。');if(!file.type.startsWith('video/')&&!/\.(mp4|mov|webm)$/i.test(file.name))throw Error('請選擇影片檔');videoUrl=URL.createObjectURL(file);const node=document.createElement('video');node.controls=true;node.playsInline=true;node.src=videoUrl;node.setAttribute('aria-label','本機影片自評');holder.replaceChildren(node);}
  function release(){if(videoUrl)URL.revokeObjectURL(videoUrl);videoUrl=null;}
  root.ReadingLabAnalysis={analyze,panel,video,release};
})(window);
