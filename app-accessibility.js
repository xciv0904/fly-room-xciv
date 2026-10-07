(function(){
  "use strict";

  const labels={
    p50Grp:"精選題分組",p50Sec:"精選題區段",fCat:"題庫類別",fLang:"題庫語言",
    prepSec:"準備時間",ansSec:"回答時間",mCat:"模擬類別",mLang:"模擬語言",
    mMode:"模擬模式",bSearch:"搜尋完整題庫",spDate:"面試日期",
    pronounceInput:"英文單字或片語",pronounceMeaning:"中文意思"
  };

  function enhance(root=document){
    root.querySelectorAll("button:not([type])").forEach(button=>button.type="button");
    Object.entries(labels).forEach(([id,label])=>{
      const element=document.getElementById(id);
      if(element&&!element.getAttribute("aria-label")&&!element.labels?.length) element.setAttribute("aria-label",label);
    });
    root.querySelectorAll("input[placeholder]:not([aria-label]):not([id]), textarea[placeholder]:not([aria-label]):not([id])")
      .forEach(element=>element.setAttribute("aria-label",element.getAttribute("placeholder")));
  }

  const live=document.createElement("div");
  live.className="visually-hidden";
  live.setAttribute("role","status");
  live.setAttribute("aria-live","polite");
  document.body.appendChild(live);

  window.addEventListener("app:routechange",event=>{
    const path=document.getElementById("contextPath")?.textContent?.trim();
    live.textContent=path?`已前往${path}`:`已切換頁面：${event.detail.route}`;
  });

  const observer=new MutationObserver(records=>{
    records.forEach(record=>record.addedNodes.forEach(node=>{
      if(node.nodeType===1) enhance(node.matches?.("button,input,select,textarea")?node.parentElement||document:node);
    }));
  });
  observer.observe(document.body,{childList:true,subtree:true});
  enhance();

  const onboard=document.getElementById("onboard");
  if(onboard){
    const syncOnboard=()=>{
      const hidden=onboard.classList.contains("hidden");
      onboard.setAttribute("aria-hidden",String(hidden));
      if(!hidden) requestAnimationFrame(()=>document.getElementById("onboardOk")?.focus());
    };
    new MutationObserver(syncOnboard).observe(onboard,{attributes:true,attributeFilter:["class"]});
    syncOnboard();
    document.addEventListener("keydown",event=>{
      if(onboard.classList.contains("hidden"))return;
      if(event.key==="Escape"){document.getElementById("onboardOk")?.click();return}
      if(event.key!=="Tab")return;
      const focusable=[...onboard.querySelectorAll("button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])")];
      if(!focusable.length)return;
      const first=focusable[0],last=focusable[focusable.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
    });
  }
})();
