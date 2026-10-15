(function(root){
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const accentName=lang=>lang==='en-GB'?'英式':'美式';
  const normalized=lang=>String(lang||'').replace(/_/g,'-').toLowerCase();
  function englishVoices(synth){try{return (synth?.getVoices()||[]).filter(v=>/^en(?:-|$)/.test(normalized(v.lang))).sort((a,b)=>a.name.localeCompare(b.name)||a.voiceURI.localeCompare(b.voiceURI));}catch{return [];}}
  // Language tags describe accent, not intelligibility. Mac novelty and legacy
  // character voices must not enter the training pool, even if previously saved.
  const excludedNames=new Set(['albert','bad news','badnews','bahh','bells','boing','bubbles','cellos','deranged','good news','goodnews','hysterical','jester','organ','pipe organ','pipeorgan','superstar','trinoids','whisper','wobble','zarvox','agnes','bruce','fred','junior','kathy','princess','ralph','victoria','eddy','flo','grandma','grandpa','reed','rocko','sandy','shelley']);
  function voiceKind(v){
    const name=String(v.name||''),uri=String(v.voiceURI||'');
    const base=name.split(/[（(\[]/)[0].trim().replace(/\s+(?:enhanced|premium|natural|neural)$/i,'').toLowerCase();
    if(excludedNames.has(base)||uri.toLowerCase().split(/[./]/).some(part=>excludedNames.has(part)))return 'excluded';
    if(/natural|enhanced|premium|neural|siri|增強|增强|優質|优质/i.test(name+' '+uri)||/^(?:Samantha|Alex|Allison|Ava|Tom|Susan|Zoe|Nicky|Aaron|Daniel|Serena|Oliver|Arthur|Kate)\b/i.test(name)||/^Microsoft\b/i.test(name)||/^Google (?:US|UK) English\b/i.test(name))return 'general';
    return 'other';
  }
  // Web Speech has no standard gender field. Only explicitly identified ordinary
  // voice names are eligible; unknown voices never fill a missing slot.
  function voiceGender(v){
    const name=String(v.name||'')+' '+String(v.voiceURI||'');
    if(/\b(Samantha|Allison|Ava|Susan|Zoe|Nicky|Serena|Kate|Zira|Jenny|Aria|Michelle|Sonia|Libby)\b/i.test(name)||/Google UK English Female/i.test(name))return 'female';
    if(/\b(Alex|Tom|Aaron|Daniel|Oliver|Arthur|David|Guy|Christopher|Eric|Ryan|Thomas)\b/i.test(name)||/Google UK English Male/i.test(name))return 'male';
    return null;
  }
  const voiceScore=v=>(/natural|enhanced|premium|neural|增強|增强|優質|优质/i.test(v.name+' '+v.voiceURI)?100:0)+(/^Samantha\b/i.test(v.name)?65:/^Alex\b/i.test(v.name)?60:0)+(v.localService?2:0)+(v.default?1:0);
  function voicePool(voices,accent='en-US',allowOther=false,hidden=[]){
    const candidates=voices.filter(v=>normalized(v.lang)===normalized(accent)&&!hidden.includes(v.voiceURI)&&voiceKind(v)==='general');
    return ['female','male'].map(gender=>candidates.filter(v=>voiceGender(v)===gender).sort((a,b)=>voiceScore(b)-voiceScore(a)||a.name.localeCompare(b.name))[0]).filter(Boolean);
  }
  function chooseVoice(voices,accent='en-US',uri='',allowOther=false,hidden=[]){
    const pool=voicePool(voices,accent,allowOther,hidden),preferred=pool.find(v=>v.voiceURI===uri);
    return preferred||pool[0]||null;
  }
  function plan(text,pause='natural'){
    const clean=String(text||'').replace(/\r/g,'').trim();if(!clean)return [];
    const segments=typeof Intl.Segmenter==='function'?Array.from(new Intl.Segmenter('en',{granularity:'sentence'}).segment(clean),s=>s.segment.trim()):clean.split(/(?<=[.!?])\s+/);
    const sentences=[];for(let i=0;i<segments.length;i++){let text=segments[i];const sentenceIndex=i;while(i+1<segments.length&&/(?:\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|vs)|\b[A-Z])\.$/.test(text))text+=' '+segments[++i];sentences.push({text,sentenceIndex});}
    const gaps={brief:180,natural:420,practice:900},gap=gaps[pause]??420,result=[];
    sentences.forEach(({text:sentence,sentenceIndex})=>{
      // Preserve sentence prosody; only split unusually long sentences at punctuation.
      let pieces=sentence.length>240?sentence.split(/(?<=[,;:])\s+/):[sentence];
      const chunks=[];let current='';for(const part of pieces){if(current&&current.length+part.length>220){chunks.push(current);current=part;}else current+=(current?' ':'')+part;}if(current)chunks.push(current);
      const bounded=chunks.flatMap(chunk=>{if(chunk.length<=240)return [chunk];const parts=[];let part='';for(const word of chunk.split(/\s+/)){if(part&&part.length+word.length>190){parts.push(part);part=word;}else part+=(part?' ':'')+word;}if(part)parts.push(part);return parts;});
      for(const [i,part]of bounded.entries())result.push({text:part,sentenceIndex,pauseMs:i===bounded.length-1?gap:Math.round(gap*.5)});
    });return result;
  }
  class Speaker{
    constructor(env=root){this.env=env;this.generation=0;this.current=null;this.timer=null;this.watchdog=null;this.endWatchdog=null;this.active=false;}
    voices(){return englishVoices(this.env.speechSynthesis);}
    stop(){this.generation++;clearTimeout(this.timer);clearTimeout(this.watchdog);clearTimeout(this.endWatchdog);this.active=false;this.current=null;try{this.env.speechSynthesis?.cancel();}catch{}}
    speak(text,settings={},onStatus=()=>{},onSegment=()=>{}){
      this.stop();const synth=this.env.speechSynthesis,Utterance=this.env.SpeechSynthesisUtterance;
      if(!synth||!Utterance){const message='此瀏覽器無法使用合成語音；請開啟劍橋詞典的 UK／US 真人原音。';onStatus(message);throw Error(message);}
      const items=plan(text,settings.pause),generation=this.generation,accent=settings.accent==='en-GB'?'en-GB':'en-US';
      if(!items.length)throw Error('目前沒有可播放的英文。');
      const available=this.voices(),voice=chooseVoice(available,accent,settings.voiceURI);
      if(!voice){const message=`裝置尚未提供可用的一般${accentName(accent)}朗讀聲線；不會改用其他口音或特殊聲線。可重新讀取、選擇其他一般聲線試聽，或在系統安裝英文聲線；單字可用劍橋原音。`;onStatus(message);throw Error(message);}
      const voiceLabel=`${voice.name}（${voice.lang}）`;
      const old=available.find(v=>v.voiceURI===settings.voiceURI);
      const warning=old&&old!==voice?`先前聲線未通過目前篩選，已改用 ${voiceLabel}。 `:voiceKind(voice)==='other'?'此為自行開啟的未確認聲線，請先試聽。 ':'';
      this.active=true;let position=0;
      const fail=message=>{if(generation!==this.generation)return;this.stop();onSegment(-1);onStatus(message);};
      const next=()=>{
        if(generation!==this.generation)return;
        if(position>=items.length){this.active=false;this.current=null;onSegment(-1);onStatus('播放完成。合成音只供發音參考，不是劍橋原音或面試語調範本。');return;}
        const item=items[position],utterance=new Utterance(item.text);this.current=utterance;
        utterance.lang=voice?.lang||accent;if(voice)utterance.voice=voice;
        utterance.rate=Math.max(.6,Math.min(1.2,Number(settings.rate)||1));utterance.volume=1;utterance.pitch=1;
        let settled=false;
        utterance.onstart=()=>{if(generation!==this.generation)return;clearTimeout(this.watchdog);onSegment(item.sentenceIndex);onStatus(`${warning}播放中 ${position+1}/${items.length} 段 · ${voiceLabel} · ${utterance.rate} 倍`);};
        utterance.onend=()=>{if(generation!==this.generation||settled)return;settled=true;clearTimeout(this.watchdog);clearTimeout(this.endWatchdog);position++;onStatus(`句間停頓 · ${position}/${items.length} 段`);this.timer=setTimeout(next,item.pauseMs);};
        utterance.onerror=e=>{if(settled)return;settled=true;fail(`語音未能完成（${e.error||'裝置引擎錯誤'}）。請切換英文聲線或在 Safari／Chrome 開啟預覽；單字可到劍橋詞典聽 UK／US 原音。`);};
        this.watchdog=setTimeout(()=>fail('裝置尚未開始出聲。請切換英文聲線、確認系統輸出音量，或改用 Safari／Chrome；亦可開啟劍橋詞典原音。'),6000);
        this.endWatchdog=setTimeout(()=>fail('裝置朗讀逾時，已停止佇列。可改按逐句播放或切換聲線；不會繼續在背景排隊。'),Math.max(15000,item.text.length*220/utterance.rate));
        onStatus(`${warning}準備播放 ${position+1}/${items.length} 段 · ${voiceLabel}`);
        // Keep this synchronous with the user's tap (Safari activation requirement).
        try{synth.resume?.();synth.speak(utterance);if(synth.paused)synth.resume?.();}catch{fail('無法啟動裝置語音；請切換瀏覽器或使用劍橋詞典原音入口。');}
      };next();
    }
  }
  const speaker=new Speaker(root);
  function controls(settings={}){
    const accent=settings.accent==='en-GB'?'en-GB':'en-US',all=speaker.voices(),general=voicePool(all,accent),selected=chooseVoice(all,accent,settings.voiceURI);
    const option=(value,label,current)=>`<option value="${esc(value)}"${String(current)===String(value)?' selected':''}>${esc(label)}</option>`;
    const entries=list=>list.map(v=>option(v.voiceURI,`${voiceGender(v)==='male'?'男聲':'女聲'} · ${v.name}`,selected?.voiceURI)).join('');
    const missing=['female','male'].filter(g=>!general.some(v=>voiceGender(v)===g)).map(g=>g==='male'?'男聲':'女聲');
    const availability=missing.length?`此裝置缺少可辨識的一般${accentName(accent)}${missing.join('、')}；不以特殊聲線或其他口音補上。`:'只保留一個女聲、一個男聲。';
    return `<div class="lab-speech-controls"><h4>英文聲線與停頓</h4><div class="lab-fields"><label>英語口音<select id="labSpeechAccent">${option('en-US','美式 English (US)',accent)}${option('en-GB','英式 English (UK)',accent)}</select></label><label>朗讀聲音<select id="labSpeechVoice">${general.length?entries(general):'<option value="">尚無可用聲線</option>'}</select></label><label>語速<select id="labLearnRate">${[.7,.85,1,1.1].map(n=>option(n,n===1?'1 倍（自然速度）':`${n} 倍`,settings.rate||1)).join('')}</select></label><label>句間停頓<select id="labSpeechPause">${[['brief','短停頓（0.18 秒）'],['natural','自然留白（0.42 秒）'],['practice','跟讀留白（0.9 秒）']].map(([v,l])=>option(v,l,settings.pause||'natural')).join('')}</select></label></div><p class="sub" id="labVoiceAvailability">${esc(availability)}</p><div class="lab-actions"><button class="btn sec" data-lab-action="voice-refresh">重新讀取聲線</button><button class="btn sec" data-lab-action="voice-preview">試聽目前聲線</button><button class="btn sec" data-lab-action="learn-stop">停止播放</button></div><p id="labSpeechStatus" class="lab-status" role="status" aria-live="polite"></p><p class="lab-caution">聲線依裝置提供；不以調整音高假裝男聲或女聲。合成語音不是字典真人原音。<a href="https://support.apple.com/guide/mac-help/mchlp2290/mac" target="_blank" rel="noopener">Mac 英文聲線設定 ↗</a></p></div>`;
  }
  function dictionaryLink(word){const url='https://dictionary.cambridge.org/pronunciation/english/'+encodeURIComponent(String(word).trim().toLowerCase().replace(/’/g,"'").replace(/\s+/g,'-'));return `<a class="lab-cambridge-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">劍橋詞典：UK／US 真人原音 ↗</a><p class="sub">另開詞典後按 UK 或 US 喇叭；不是本站內播放。詞典若未收錄此專名，請用官方名稱／當地資料核對。本站 IPA 沿用既有美式字典資料，不冒稱來自劍橋。</p>`;}
  if(root.speechSynthesis?.addEventListener)root.speechSynthesis.addEventListener('voiceschanged',()=>root.dispatchEvent?.(new root.Event('lab:voiceschanged')));
  root.ReadingLabSpeech={Speaker,englishVoices,voiceKind,voiceGender,voicePool,chooseVoice,plan,speaker,controls,dictionaryLink};
  if(typeof module!=='undefined')module.exports=root.ReadingLabSpeech;
})(typeof window!=='undefined'?window:globalThis);
