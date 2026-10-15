(function(root){
  "use strict";
  class LabRecorder{
    constructor(){this.active=false;this.urls=new Map();this.generation=0;}
    cancelPending(){this.generation++;}
    async start({recognition=false,onText=()=>{},onStatus=()=>{},onChunk=()=>{}}={}){
      if(this.active)throw Error("請先停止目前的錄音。");
      if(!navigator.mediaDevices?.getUserMedia||!root.MediaRecorder)throw Error("此瀏覽器不支援錄音。可匯入裝置錄音檔，或貼上逐字稿繼續練習。");
      const generation=++this.generation;
      clearTimeout(this.restart);this.speech=null;this.noRestart=false;
      try{this.stream=await navigator.mediaDevices.getUserMedia({audio:true});}
      catch(error){throw Error(error.name==="NotAllowedError"?"麥克風權限遭拒。請在網址列的網站權限允許麥克風；也可以匯入音檔及貼稿比對。":"無法取得麥克風，請檢查裝置是否連接或被其他程式占用。");}
      if(generation!==this.generation){this.stream.getTracks().forEach(t=>t.stop());throw Error("已離開朗讀頁，麥克風要求已取消。");}
      this.chunks=[];this.started=Date.now();this.active=true;
      try{
        this.recorder=new MediaRecorder(this.stream);
        this.recorder.ondataavailable=e=>{if(e.data.size){this.chunks.push(e.data);Promise.resolve(onChunk({blob:new Blob(this.chunks,{type:this.recorder.mimeType||"audio/webm"}),duration:Math.round((Date.now()-this.started)/1000)})).catch(()=>onStatus("錄音檢查點無法儲存，請保持此頁並按停止後匯出備份。"));}};
        this.finished=new Promise(resolve=>{this.recorder.onstop=()=>{this.stream.getTracks().forEach(t=>t.stop());resolve({blob:new Blob(this.chunks,{type:this.recorder.mimeType||"audio/webm"}),duration:Math.round((Date.now()-this.started)/1000)});};});
        this.recorder.start(1000);
      }catch(error){this.active=false;this.stream.getTracks().forEach(t=>t.stop());throw Error("無法啟動錄音，請改匯入音檔或使用另一個瀏覽器。");}
      const Speech=root.SpeechRecognition||root.webkitSpeechRecognition;
      if(recognition&&Speech){
        this.speech=new Speech();this.speech.lang="en-US";this.speech.continuous=true;this.speech.interimResults=false;
        this.speech.onresult=e=>{if(generation!==this.generation)return;let text="";for(let i=e.resultIndex;i<e.results.length;i++)if(e.results[i].isFinal)text+=e.results[i][0].transcript+" ";if(text)onText(text);};
        this.speech.onerror=e=>{onStatus(`語音辨識未完成（${e.error}）。錄音仍在繼續，可手動貼上逐字稿。`);if(["not-allowed","service-not-allowed","network"].includes(e.error))this.noRestart=true;};
        const speech=this.speech;
        this.speech.onend=()=>{if(this.active&&!this.noRestart&&generation===this.generation)this.restart=setTimeout(()=>{if(!this.active||generation!==this.generation)return;try{speech.start();}catch{}},500);};
        this.noRestart=false;try{this.speech.start();}catch{onStatus("辨識服務無法啟動；錄音仍可使用，請手動貼稿。");}
      }else if(recognition)onStatus("此瀏覽器沒有語音辨識服務；錄音仍可使用，請手動貼稿。");
    }
    async stop(){
      if(!this.active)return null;this.active=false;this.generation++;clearTimeout(this.restart);try{this.speech?.stop();}catch{}
      if(this.recorder.state!=="inactive")this.recorder.stop();return this.finished;
    }
    flush(){if(this.active&&this.recorder?.state==="recording")try{this.recorder.requestData();}catch{}}
    play(holder,blob){
      const old=this.urls.get(holder);if(old)URL.revokeObjectURL(old);
      const url=URL.createObjectURL(blob);this.urls.set(holder,url);
      const audio=document.createElement("audio");audio.controls=true;audio.src=url;audio.setAttribute("aria-label","朗讀錄音回聽");holder.replaceChildren(audio);
    }
    release(){for(const [holder,url]of this.urls){holder.querySelector("audio")?.pause();URL.revokeObjectURL(url);}this.urls.clear();}
  }
  root.LabRecorder=LabRecorder;
})(window);
