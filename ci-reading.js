/* Preserve source sentences while keeping each practice excerpt short. */
function ciReadingSegments(text){
  const sentences=String(text||"").trim().split(/(?<=[.!?])\s+/).filter(Boolean);
  const count=t=>(t.match(/\S+/g)||[]).length;
  const parts=[];let current=[];
  for(const sentence of sentences){
    const clean=sentence.trim();
    if(current.length&&count(current.join(" ")+" "+clean)>110){parts.push(current.join(" "));current=[];}
    current.push(clean);
  }
  if(current.length)parts.push(current.join(" "));
  if(parts.length>1&&count(parts.at(-1))<60){
    const before=parts.at(-2).split(/(?<=[.!?])\s+/);
    while(before.length>1&&count(parts.at(-1))<60){
      const moved=before.at(-1);
      if(count(before.slice(0,-1).join(" "))<60||count(moved+" "+parts.at(-1))>120)break;
      parts[parts.length-1]=before.pop()+" "+parts.at(-1);
      parts[parts.length-2]=before.join(" ");
    }
    if(count(parts.at(-2)+" "+parts.at(-1))<=120){
      const last=parts.pop();parts[parts.length-1]+=" "+last;
    }
  }
  return parts.length?parts:[String(text||"")];
}
function ciMagazineHtml(d,i){return ciArticleHtml(d,i,"mag");}
function ciNewsHtml(d,i){return ciArticleHtml(d,i,"news");}
function ciExternalHtml(d,i){return ciArticleHtml(d,i,"ext");}
function ciArticleHtml(d,i,kind){
  const parts=kind==="ext"&&d.title==="Welcome Speech 歡迎詞"?[d.text]:ciReadingSegments(d.text);
  const source=kind==="mag"?(d.trace||CI_SOURCE_TRACE[i]||d.source||"Dynasty 機上雜誌"):(d.source||CI_EXTERNAL_SOURCE);
  const year=kind==="ext"?"":` data-ci-year-value="${ciYearOf(d)}"`;
  const tag=kind==="ext"?"":`<span class="tag cat">${ciYearOf(d)}</span>`;
  const key=`${kind}-${i}`;
  const followup=d.q?`<details><summary>新聞理解題（全文）</summary><div class="body"><p><b>問題：</b>${esc(d.q)}</p><div class="ansbox"><b>核對答案：</b>${esc(d.a)}</div></div></details>`:"";
  return `<details${kind==="mag"&&i===0?" open":""} data-ci-kind="${kind}" data-ci-index="${i}"${year}><summary>${i+1}. ${tag}${esc(d.title)}</summary><div class="body"><p class="sub">來源：${esc(source)}</p><p class="section-note">每次選一段朗讀，目標約 30–60 秒；時間按每分鐘 120 字估算，依實際語速調整。保留原文完整句子。</p>${parts.length>1?`<label>選擇練習段落 <select data-ci-excerpt="${i}" data-ci-excerpt-kind="${kind}" aria-label="選擇練習段落">${parts.map((p,j)=>`<option value="${j}">第 ${j+1} / ${parts.length} 段 · 約 ${Math.round(p.split(/\s+/).length/2)} 秒</option>`).join("")}</select></label>`:""}<div data-ci-excerpt-body="${key}">${ciExcerptHtml(d,i,0,parts,kind)}</div><details><summary>完整原文與中文參考（全文）</summary><div class="body"><div class="readblock en">${esc(d.text)}</div><h4>全文中文參考</h4><div class="readblock">${esc(d.translation)}</div></div></details>${followup}<div class="tip">💡 ${esc(d.focus)}</div></div></details>`;
}
function ciExcerptHtml(d,i,j,parts=ciReadingSegments(d.text),kind="mag"){
  const text=parts[j],words=text.split(/\s+/).length;
  const title=parts.length>1?`${d.title}｜第 ${j+1}/${parts.length} 段`:d.title;
  return `<p class="sub">${words} 字 · 約 ${Math.round(words/2)} 秒${words<60?" · 短篇暖身":""}</p><div class="readblock en">${esc(text)}</div><div class="chips">${sayBtn(text,"en-US","🔊 聽本段示範")}</div>${ciRecordingBtn(`ci-${kind==="mag"?"pdf":kind}-${i}-${j}`,text,title)}`;
}
document.addEventListener("change",e=>{
  const select=e.target.closest("[data-ci-excerpt]");if(!select)return;
  const i=Number(select.dataset.ciExcerpt),j=Number(select.value);
  const kind=select.dataset.ciExcerptKind||"mag";
  const items=kind==="news"?CI_NEWS_RELEASES:kind==="ext"?CI_EXTERNAL_BROADCASTS:CI_PDF_DRILLS;
  document.querySelector(`[data-ci-excerpt-body="${kind}-${i}"]`).innerHTML=ciExcerptHtml(items[i],i,j,undefined,kind);
});
