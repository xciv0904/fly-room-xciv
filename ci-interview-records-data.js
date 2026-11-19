/* Personal recollections and reference drafts are intentionally stored separately. */
(function(root){
  "use strict";
  const session={
    id:"ci-final-20261114",title:"2026/11/14 華航空服員複試真實題目",
    airline:"華航",airlineName:"中華航空 China Airlines",date:"2026-11-14",stage:"空服員複試",
    candidates:3,includesSelf:true,interviewers:5,introduction:false,rounds:2,
    format:"沒有自我介紹，考官共提出兩輪問題，每位考生皆須作答。",
    source:"本人於2026-11-20提供的事後回憶；同組題目另標來源。",
    categories:["生活經驗","影視作品","個人價值觀","英文即席表達","步驟說明"]
  };
  const records=[
    {
      key:"real-20261114-drama",sessionId:session.id,round:1,provenance:"self",trainingType:"personal-values",
      tags:["生活經驗","影視作品","個人價值觀"],
      question:{language:"zh-TW",original:"最印象深刻的是哪一部韓劇？",zh:"最印象深刻的是哪一部韓劇？",en:"Which Korean drama impressed you the most, and why?"},
      original:{language:"zh-TW",raw:"我回答模範計程車，他主要是在講有一個替弱勢族群復仇的神秘組織，法律有時候沒辦法處罰受害者時這個組織就會幫助被害者，也讓弱勢的一方得以聲張正義。",
        note:"原始紀錄中的「法律沒辦法處罰受害者」應為口述或記錄筆誤，語意應是「法律無法懲罰加害者」。原文保留，優化擬答採正確語意。"},
      reference:{airlines:["華航"],zh:"我印象最深刻的是韓劇《模範計程車》。這部劇講述一個神秘組織，專門幫助那些受到傷害、卻無法透過法律獲得正義的人。我特別喜歡這部劇，是因為它不只是講述復仇，也讓我思考社會中那些容易被忽略的弱勢族群，以及同理心和公平正義的重要性。",
        en:"The Korean drama that impressed me the most is Taxi Driver. It's about a secret group that helps people who have been treated unfairly, especially when the legal system cannot give them justice. What impressed me most is that it reminds us to care about people who are often overlooked and to understand their struggles.",
        shortEn:"My favorite Korean drama is Taxi Driver. It's about a secret group that helps victims who cannot get justice. I like it because it reminds us to care about people in need.",
        timing:{zh:"約20–30秒",en:"約25–35秒"}},
      analysis:{
        strengths:["選擇的作品具有社會議題與人性深度。","可以清楚說明劇情核心。","能讓考官感受到對弱勢族群、正義議題的關注。"],
        improvements:["原始回答偏向劇情介紹，缺少「為什麼讓我印象深刻」的個人感受。","可以補上具體價值觀，例如同理心、關注弱勢和公平正義。","應避免將戲劇中的私刑或復仇行為直接表述為值得效法的做法。"],
        structure:["作品名稱","一句話介紹劇情","印象深刻的原因","個人感受或價值觀"],
        phrases:[{en:"The Korean drama that impressed me the most is…",zh:"讓我印象最深刻的韓劇是……"},{en:"What impressed me most is that…",zh:"最讓我印象深刻的是……"},{en:"It reminds us to care about…",zh:"它提醒我們關心……"}],
        corrections:[]
      }
    },
    {
      key:"real-20261114-rice",sessionId:session.id,round:2,provenance:"self",trainingType:"how-to",
      tags:["生活經驗","英文即席表達","步驟說明","How to 說明程序"],
      question:{language:"en-US",original:"How to cook rice?",zh:"如何煮白飯？",en:"How to cook rice?"},
      original:{language:"en-US",raw:"cook rice? well i'm not very good at cooking, but i thought it needs to wash rice at first, then put it in the pot and just waiting till it be nice",
        meaningZh:"煮飯嗎？嗯，我不太擅長煮飯，但我想應該要先把米洗乾淨，然後放進鍋子裡，等它煮好就可以了。"},
      reference:{airlines:["華航"],zh:"雖然我不是很擅長煮飯，但我覺得步驟其實不難。首先把米洗乾淨，接著放進電鍋並加入適量的水，然後按下開關，等待白飯煮熟。最後再稍微悶幾分鐘，就可以享用了。",
        en:"Well, I'm not very good at cooking, but I think it's pretty simple. First, wash the rice. Then, put it in a rice cooker and add the right amount of water. After that, press the start button and wait until it's ready. Finally, let it sit for a few minutes before serving.",
        shortEn:"First, wash the rice. Next, add some water and put it in the rice cooker. Press the start button and wait until it's done. That's it!",
        timing:{en:"約20–25秒"}},
      analysis:{
        strengths:["能理解英文問題。","即使不熟悉烹飪，仍願意嘗試回答。","有基本的步驟順序概念。","開頭具有生活化對話感。"],
        improvements:["不要在腦中先組織過長的中文句子再逐字翻譯。","優先使用簡單、完整、正確的短句。","說明步驟時，注意是否漏掉必要程序。","不需要過度強調自己不擅長這件事情。","讓 First / Then / After that / Finally 成為能自然使用的句型。"],
        structure:["簡短開場","First","Then","After that","Finally"],
        phrases:[{en:"First, wash the rice.",zh:"首先，把米洗乾淨。"},{en:"add the right amount of water",zh:"加入適量的水"},{en:"press the start button",zh:"按下啟動按鈕"},{en:"wait until it's ready",zh:"等它煮好"}],
        corrections:[
          {original:"I thought it needs to wash rice",issue:"主詞及句型結構不自然。",suggestion:"I think you need to wash the rice first."},
          {original:"at first",issue:"說明程序的第一步時，通常用 First 更自然。",suggestion:"First, wash the rice."},
          {original:"and just waiting",issue:"動詞形式與前面指令句不一致。",suggestion:"and just wait"},
          {original:"till it be nice",issue:"不符合自然英文用法，且完成狀態不具體。",suggestion:"until it's ready / until it's cooked"},
          {original:"漏掉必要步驟",issue:"原始回答漏掉「加入適量的水」和「啟動電鍋」兩個關鍵步驟。",suggestion:"Add the right amount of water. Then, press the start button."}
        ]
      }
    },
    {
      key:"real-20261114-noodles",sessionId:session.id,round:null,provenance:"peer",trainingType:"how-to",
      tags:["生活經驗","英文即席表達","步驟說明","How to 說明程序"],
      question:{language:"en-US",original:"How to cook instant noodles?",zh:"如何煮泡麵？",en:"How to cook instant noodles?"},
      original:null,
      reference:{airlines:["華航"],zh:"首先在鍋子裡把水煮滾，接著加入泡麵和調味料，再依照包裝上的指示煮大約三分鐘。最後把麵盛進碗裡，就可以享用了。",
        en:"First, boil some water in a pot. Then, add the noodles and the seasoning. Let them cook for about three minutes, or follow the instructions on the package. Finally, pour everything into a bowl, and it's ready to eat.",
        shortEn:"First, boil some water. Then, add the noodles and seasoning. Cook for a few minutes, and you're done!",
        timing:{en:"練習15–30秒"}},
      analysis:{
        strengths:[],
        improvements:["這是同組其他考生被問到的題目，沒有提供其原始回答；以下僅為程序表達的練習建議。","用簡單動詞說清楚必要步驟，烹煮時間以包裝指示為準。"],
        structure:["First","Then","Wait / Cook","Finally"],
        phrases:[{en:"boil some water",zh:"把水煮滾"},{en:"add the noodles and the seasoning",zh:"加入麵和調味料"},{en:"follow the instructions on the package",zh:"依照包裝上的指示"}],
        corrections:[]
      }
    }
  ];
  const howTo={
    title:"How to 說明程序",targetSeconds:[15,30],
    steps:[
      {label:"Opening",en:"I think it's pretty simple."},
      {label:"Step 1",en:"First, you need to..."},
      {label:"Step 2",en:"Then, you can..."},
      {label:"Step 3",en:"After that, just..."},
      {label:"Ending",en:"Finally, ... and you're done!"}
    ],
    focus:["能在短時間內開始回答。","運用簡單的動詞和句型。","完整交代必要步驟。","不追求複雜文法或艱深單字。","練習15–30秒的英文即興回答。"]
  };
  const api={checkedAt:"2026-11-20",session,records,howTo};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CIInterviewRecords=api;
})(typeof window!=="undefined"?window:globalThis);
