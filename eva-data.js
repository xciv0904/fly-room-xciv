/* EVA 招考衝刺資料層：沿用主題庫 schema，追加於 DATA 尾端以保持既有 numeric id。 */
function evaFinal(priority, category, question, answer, meta){
  meta = meta || {};
  return {
    cat:"長榮複試・"+category,
    airlines:["長榮"],
    stage:"eva_final",
    priority:priority,
    category:category,
    q_zh:question,
    q_en:meta.enQ||"",
    a_zh:answer||"",
    a_en:meta.enA||"",
    keywords:meta.keywords||[],
    answerIntent:meta.intent||"",
    pitfalls:meta.pitfalls||[],
    fu:meta.followUps||[],
    storyId:meta.storyId||"",
    practiceMode:priority==="improv"?"improv":"prepared",
    tip:meta.tip||"以自己的經驗回答，再說學到什麼，以及和空服工作的關聯。",
    src:"Shelly 現有故事庫・長榮複試核心"
  };
}

var EVA_FINAL_QUESTIONS = [
  evaFinal("must","動機","請用 30 秒自我介紹。","考官好，我是張萱利，目前在 Hyatt Place 凱悅嘉軒飯店櫃檯工作一年。每天面對各國旅客，讓我練到在忙碌中保持穩定，也更敢用英文和韓文溝通。同事叫我「學姊」，因為交給我的事不需要再確認第二次。我希望把這份可靠和第一線服務經驗帶進客艙。",{enQ:"Tell me about yourself.",enA:"Good morning. I'm Shelly Chang. I've worked at the front desk of Hyatt Place for one year, serving international guests in a fast-paced environment. I speak Mandarin, English and Korean, and my coworkers see me as someone they can rely on. I hope to bring that calm and reliability into the cabin.",keywords:["Hyatt Place","國際旅客","中英韓","可靠"],intent:"讓考官在 30 秒內記住你的工作、語言與可靠特質。",pitfalls:["塞入太多履歷細節","超過 45 秒","把學姊解釋成職稱"],storyId:"學姊",followUps:[{q:"一年的工作經驗會不會太短？",qe:"Is one year of experience enough?",a:"年資不長，但工作密度很高。我每天處理入住、客訴、電話和跨語言需求，已經反覆驗證自己能在第一線穩定工作。",ae:"It is not a long time, but it has been intensive. Every day I handle check-ins, complaints, calls and language barriers, so the experience has tested me repeatedly."}]}),
  evaFinal("must","動機","為什麼想當空服員？","在飯店工作時，我曾協助一位哥倫比亞旅客處理中文介面的線上流程。那不完全是我的職責，但我陪他完成，隔天他特地回來道謝。那次讓我發現，我最有成就感的時候，是在旅客陌生又著急時讓事情重新順起來。空服工作除了服務，還多了安全責任，這是我想承擔的下一步。",{enQ:"Why do you want to become a flight attendant?",enA:"At the hotel, I once helped a Colombian guest through an online process that was only available in Chinese. He came back the next day to thank me. That showed me how much I value helping people when travel feels unfamiliar. Cabin crew also carry responsibility for safety, and that is the next level I want to take on.",keywords:["哥倫比亞旅客","陌生旅程","安全責任","下一步"],intent:"用真實服務時刻證明動機，不只說喜歡旅行。",pitfalls:["只說喜歡服務或旅遊","把空服浪漫化","沒有提安全責任"],storyId:"哥倫比亞旅客",followUps:[{q:"飯店也能服務人，為什麼一定要當空服員？",qe:"You can serve people at a hotel. Why cabin crew?",a:"飯店以住宿體驗為主，客艙則同時承擔安全與服務。旅客在機上能依靠的就是組員，我想把服務能力放到責任更高的場域。",ae:"A hotel focuses on the stay, while cabin crew are responsible for both safety and service. On board, passengers depend directly on the crew, and I want to work at that higher level of responsibility."},{q:"如果空服工作比你想像中更辛苦呢？",qe:"What if the job is harder than you expect?",a:"我不會把辛苦當成意外。飯店輪班讓我知道，第一線工作包含體力、情緒管理和規律準備；我會先把基本責任做好，再談成就感。",ae:"I do not see difficulty as a surprise. Shift work at the hotel taught me that frontline service requires stamina, emotional control and preparation. I would focus on doing the fundamentals well."}]}),
  evaFinal("must","動機","為什麼想加入長榮航空？","我想加入長榮，不是因為背了多少航點，而是我喜歡在清楚程序裡把服務做好。飯店尖峰時，我會先確認房況與權限，再給旅客可落地的選項；發現錯誤後，也用檢查表避免再發生。這種先守住流程、再在範圍內照顧人的工作方式，和我想成為的空服員一致。",{enQ:"Why EVA Air?",enA:"I want to join EVA Air because I work best in a clear, disciplined system. At the hotel, I check the facts and my authority before offering a solution, and after a mistake I created a checklist to prevent it from happening again. I want to bring that same process-minded and caring approach into the cabin.",keywords:["程序","權限","檢查表","範圍內服務"],intent:"回答你的工作方式為何適合長榮，而不是背公司歷史。",pitfalls:["狂背航點與獎項","替公司宣稱要什麼人","攻擊其他航空公司"],storyId:"房型登打錯誤",followUps:[{q:"華航也很重視安全，為什麼不是華航？",qe:"China Airlines also values safety. Why not China Airlines?",a:"我尊重每家公司的安全標準。我的選擇不是比較誰比較好，而是這次招考我希望把準備集中在長榮，並用自己的程序意識和穩定服務接受檢驗。",ae:"I respect every airline's safety standards. This is not about saying one is better. For this recruitment, I am focusing on EVA Air and showing how my process-minded, steady way of working fits the role."}]}),
  evaFinal("must","動機","飯店也能服務人，為什麼一定要當空服員？","我不是因為不喜歡飯店才離開。飯店讓我確定自己適合第一線服務，但客艙多了安全、團隊同步與受限環境下的責任。旅客在飛行中不能換一個櫃檯，我想學會在更嚴格的程序下，成為他能安心依靠的人。",{keywords:["不是逃離飯店","安全","受限環境","更高責任"],intent:"說清楚轉職是深化服務責任，不是否定飯店。",pitfalls:["嫌飯店沒發展","只談薪資福利","說想環遊世界"],storyId:"哥倫比亞旅客"}),
  evaFinal("must","動機","為什麼想離開目前的工作？","這一年我很喜歡飯店工作，也確認自己能適應輪班、客訴和國際旅客。現在想轉職，是因為我希望把已經累積的服務底子帶到更重視安全與團隊程序的環境。對我來說不是離開服務業，而是從住宿場景走向旅程本身。",{keywords:["喜歡飯店","已驗證能力","安全與團隊","自然下一步"],intent:"展現感謝現職並說明清楚的職涯方向。",pitfalls:["抱怨主管或客人","把空服當升級版飯店","只談待遇"],storyId:"連假房務延遲"}),
  evaFinal("must","動機","公共行政與政策的訓練，和空服工作有什麼關係？","公共行政讓我習慣先確認規則、權限和利害關係人，再處理問題。在飯店遇到連假房務延遲時，我也是先掌握房況，和房務協調，再在權限內給替代方案。空服工作更需要依 SOP、清楚通報和團隊協作，這是我的科系能帶來的思考習慣。",{keywords:["規則","權限","協調","SOP"],intent:"把科系轉成可觀察的工作方法。",pitfalls:["硬說科系等同航空專業","只列課名","沒有工作例子"],storyId:"連假房務延遲"}),
  evaFinal("must","個人","你最適合長榮的特質是什麼？","我會選可靠。忙碌時，同事叫我「學姊」，不是因為年資，而是知道把旅客交給我後，我會持續處理到有結果，也會留下完整交接。客艙工作需要每個人把自己的區域做完並同步資訊，我希望讓組員知道我是一個可以放心合作的人。",{keywords:["可靠","做到底","完整交接","團隊信任"],intent:"用同事看得到的行為證明特質。",pitfalls:["一次講五個特質","空泛說細心負責","替長榮定義人才"],storyId:"學姊"}),
  evaFinal("must","個人","為什麼要錄取你？","我已經在 Hyatt Place 的第一線驗證三件事：忙的時候能穩定處理、遇到語言差異願意想辦法、犯錯後會把改善做成流程。我知道飯店經驗不能取代航空訓練，所以我會以新人姿態把安全和 SOP 學好；但在服務現場需要的穩定與可靠，我可以從第一天開始帶進團隊。",{enQ:"Why should EVA Air choose you?",enA:"At Hyatt Place, I have already tested three things: staying calm under pressure, finding ways through language barriers, and turning mistakes into better processes. I know hotel experience cannot replace airline training, so I would learn safety and SOP with a beginner's attitude. But I can bring steadiness and reliability to the team from day one.",keywords:["已驗證","高壓穩定","改善流程","新人姿態"],intent:"說出已具備的底子和仍需受訓的界線。",pitfalls:["說自己比別人優秀","保證不犯錯","把服務經驗當航空資歷"],storyId:"房型登打錯誤"}),
  evaFinal("must","個人","同事會怎麼形容你？","同事常說我是「不用盯的那一個」，也叫我學姊。連假房務延遲時，他們把等待中的旅客交給我安撫，自己去追房況，因為知道我會清楚更新並完成交接。這份信任提醒我，可靠不是一句形容詞，而是每一次都把事情做完。",{enQ:"What would your coworkers say about you?",enA:"My coworkers would say I am the person they do not need to check on. During a holiday rush, they trusted me to keep waiting guests informed while they followed up with housekeeping. That trust taught me that reliability is not a label; it is built by following through every time.",keywords:["不用盯","學姊","追蹤到底","交接"],intent:"用團隊實際依賴你的片段回答。",pitfalls:["只說大家都喜歡我","把稱讚講得過滿","沒有證據"],storyId:"學姊"}),
  evaFinal("must","個人","你最大的優點是什麼？","我的優點是觀察後會採取行動。有位孕婦旅客沒有主動提出需求，我注意到她站得不舒服，就先詢問並安排較方便的房間。她後來在回饋中提到這件事。這讓我學到，細心不是看見而已，而是用不冒犯的方式確認，再做適合的協助。",{keywords:["觀察","先詢問","不預設","採取行動"],intent:"把優點落在具體行為和界線。",pitfalls:["說完美主義","一次講太多案例","擅自替旅客做決定"],storyId:"孕婦旅客"}),
  evaFinal("must","個人","你最大的缺點是什麼？","我以前忙起來時會太依賴記憶。剛到職時曾漏掉房型確認，造成旅客入住錯誤房型。我立刻承認並更正，之後做了檢查清單，每筆資料都再確認。現在我仍會提醒自己：快不等於省略步驟，重要資訊一定要留下可檢查的流程。",{enQ:"What is one weakness you are working on?",enA:"I used to rely too much on memory when I was busy. Early in my job, I missed a room-type confirmation and the guest was checked into the wrong room. I owned the mistake, fixed it, and created a checklist. Now I remind myself that working quickly must never mean skipping a verification step.",keywords:["依賴記憶","承認","檢查表","可驗證流程"],intent:"說真缺點、後果與持續改善方法。",pitfalls:["把優點包裝成缺點","說已完全克服","責怪系統太難"],storyId:"房型登打錯誤"}),
  evaFinal("must","個人","請分享一次犯錯的經驗。","剛到職時，我漏掉會員房型升等確認，旅客已經住進不對的房間。我沒有找理由，先向旅客道歉、立即更正，再和主管確認可提供的補救。之後我做了檢查表並養成複誦資料的習慣。那次讓我學到，負責不是只說對不起，而是讓同樣的錯誤更難再發生。",{enQ:"Tell me about a mistake you made.",enA:"Early in my job, I missed confirming a member's room upgrade and the guest entered the wrong room. I apologised, corrected it immediately, and checked with my manager on a suitable recovery. Then I built a checklist and started reading key details back. I learned that accountability means making the same mistake harder to repeat.",keywords:["房型錯誤","立刻承認","補救","制度化"],intent:"完整交代承認、補救、預防三步。",pitfalls:["選沒有後果的小錯","花太多篇幅解釋原因","只說會更小心"],storyId:"房型登打錯誤"}),
  evaFinal("must","服務","最難處理的客訴是什麼？","有位旅客在櫃檯突然情緒崩潰。表面上是房間安排，但她早上錯過班機，已經累積很多壓力。我先讓她把話說完，確認她真正需要的是休息和能同行的安排，再提出沙發床方案。那次讓我學到，處理客訴不能只修表面的問題，要先理解情緒從哪裡來。",{enQ:"Tell me about a difficult customer.",enA:"A guest once broke down at the front desk. The room issue was only the surface problem; she had missed a flight that morning and was exhausted. I let her explain, understood that she needed rest and a workable arrangement for her group, and offered a sofa-bed solution. I learned to understand the emotion before fixing the visible problem.",keywords:["錯過班機","先聽完","找根因","可行方案"],intent:"展現情緒辨識、釐清需求與落地處理。",pitfalls:["把旅客形容成奧客","只講自己很冷靜","沒有結果"],storyId:"情緒崩潰旅客"}),
  evaFinal("must","服務","什麼是好的服務？","我認為好的服務是先觀察，再確認，不讓主動變成自作主張。孕婦旅客沒有開口時，我先輕聲詢問，再安排離電梯較近的房間；她可以拒絕，也保有自己的選擇。好的服務不是做得最多，而是在對的時候提供對方真正需要的協助。",{enQ:"What does good service mean to you?",enA:"Good service means noticing first, then checking rather than assuming. When I noticed a pregnant guest looked uncomfortable, I quietly asked before moving her to a room closer to the lift. She still had a choice. Good service is not doing the most; it is offering the right help at the right time.",keywords:["觀察","先確認","保留選擇","適量協助"],intent:"定義服務並用一個真實故事證明。",pitfalls:["說顧客永遠是對的","把犧牲自己當服務","沒有安全或界線"],storyId:"孕婦旅客"}),
  evaFinal("must","團隊與SOP","資深組員和你意見不同時，你會怎麼做？","如果當下不影響安全，我會先照團隊指示完成工作，再找適合時間私下確認原因，並提出我觀察到的情況。如果涉及安全或明確程序，我會用事實和 SOP 說明，必要時依層級通報。重點不是證明誰對，而是讓資訊完整、工作不中斷。",{enQ:"What would you do if you disagreed with a senior crew member?",enA:"If safety is not affected, I would follow the team's direction first and discuss my concern privately at the right time. If it involves safety or a clear procedure, I would state the facts and the SOP, and escalate through the proper channel if needed. The goal is complete information and uninterrupted teamwork, not proving who is right.",keywords:["先完成","私下確認","事實與SOP","依層級通報"],intent:"同時展現尊重資深、程序意識與安全界線。",pitfalls:["一律服從不判斷","當眾爭辯","把意見不同當人際衝突"],storyId:"連假房務延遲"}),
  evaFinal("must","團隊與SOP","發現同事漏掉程序時，你會怎麼做？","我會先確認自己看到的資訊是否完整。如果是可以立即補上的步驟，我會低調提醒並協助完成；若涉及安全、紀錄或持續重複，我會依流程回報。我的目的不是抓錯，而是把風險補起來，同時讓同事知道發生了什麼。",{keywords:["先確認","立即補位","安全就回報","對事不對人"],intent:"展現不放過風險，也不羞辱同事。",pitfalls:["假裝沒看到","直接越級告狀","自己偷偷補完不告知"],storyId:"房型登打錯誤"}),
  evaFinal("must","團隊與SOP","Safety 和 service 衝突時，你怎麼選？","安全規定是不能交換的底線。我會先停止可能造成風險的服務，用清楚而不責備的方式說明原因，再提供規定內的替代方案。例如亂流時先停止送餐、固定自己與設備，穩定後再回來完成服務。服務可以延後或換方式，安全不能補做。",{keywords:["安全底線","停止風險","說明原因","替代方案"],intent:"清楚排出優先順序，並保留服務溫度。",pitfalls:["只喊安全第一沒有做法","為了討好破例","用強硬語氣責備旅客"],storyId:""}),
  evaFinal("must","工作條件","你能接受輪班嗎？","可以。Hyatt Place 的櫃檯讓我實際輪過早、中、晚班，我知道輪班不是只說願意，而是要管理睡眠、飲食和交接。我會提早調整作息，確保上班前有足夠休息，也會把身體狀況當成工作責任，不讓疲勞影響團隊。",{keywords:["實際輪班","睡眠管理","提前調整","不影響團隊"],intent:"用已經做過的經驗證明接受度。",pitfalls:["只回答可以","說年輕所以沒問題","忽略疲勞管理"],storyId:"Hyatt Place 輪班"}),
  evaFinal("familiar","個人","請分享一次失敗的經驗。","第一次航空面試沒有錄取時，我發現自己對安全知識理解不夠完整。難過之後，我把回饋拆成可以行動的項目，整理客艙安全流程、緊急裝備和口令，固定複習。那次失敗讓我知道，準備不是把答案寫得更漂亮，而是補上真正會影響工作的能力。",{keywords:["未錄取","安全缺口","拆成行動","補能力"],intent:"展示你如何使用失敗資訊，而不是賣慘。",pitfalls:["責怪考官","宣稱安全已成專家","只說更努力"],storyId:"第一次航空面試"}),
  evaFinal("familiar","個人","壓力最大的工作經驗是什麼？","連假期間房務進度落後，櫃檯前同時有很多等待旅客。我先統一說明可確認的進度，和房務即時同步，再依旅客需求安排房型或延退方案。那次讓我學到，壓力大時不能每個人各講一套，先建立共同資訊，團隊才有辦法往前。",{keywords:["連假","統一資訊","跨部門","替代方案"],intent:"說出壓力下如何排序與協作。",pitfalls:["只描述現場很忙","把功勞全放自己","沒有團隊資訊同步"],storyId:"連假房務延遲"}),
  evaFinal("familiar","服務","旅客完全不接受你提出的方案，怎麼辦？","我會先確認他不接受的是方案本身，還是覺得沒有被理解，再重述他的核心需求。如果仍超出權限或規定，我會清楚說明界線，提供可行選項，並請主管或座艙長加入，不讓對話停在反覆道歉。",{keywords:["確認真正問題","重述需求","清楚界線","適時升級"],intent:"避免無限討好，也不把旅客丟給上級。",pitfalls:["一直道歉沒有新資訊","立刻叫主管","答應做不到的事"],storyId:"情緒崩潰旅客"}),
  evaFinal("familiar","服務","遇到不合理要求，你會怎麼處理？","我會先讓旅客知道我理解他的需求，再區分是服務偏好還是規定限制。能在權限內調整的，我會找替代方案；涉及安全、公平或隱私，就會清楚拒絕並說明原因。以前遇到韓國旅客索取私人聯絡方式時，我拒絕但改提供服務專線，也提醒導遊留意。",{keywords:["理解需求","分類界線","替代方案","親切拒絕"],intent:"展現親切與界線可以同時存在。",pitfalls:["直接說不可能","為避免衝突而答應","把旅客貼標籤"],storyId:"韓國旅客"}),
  evaFinal("familiar","服務","如何處理情緒激動的旅客？","我會先降低自己的音量，讓對方把重點說完，再用一句話確認我理解的問題。等情緒稍微下降後才談可行方案。如果有安全風險或影響其他旅客，我會立即請組員支援。先接住情緒不代表接受不當行為，界線仍要清楚。",{keywords:["降音量","聽完","確認問題","安全界線"],intent:"把同理、處理與升級條件說清楚。",pitfalls:["跟著提高音量","急著解釋規定","把同理等同退讓"],storyId:"情緒崩潰旅客"}),
  evaFinal("familiar","團隊與SOP","如何和不好相處的同事合作？","我會把人際感受和工作任務分開，先確認分工、期限與交接方式，避免靠默契猜測。如果有摩擦，會私下用具體事件溝通，不在旅客面前表現不一致。客艙團隊不需要每個人成為朋友，但需要彼此資訊透明、能完成責任。",{keywords:["任務分開","明確分工","私下溝通","旅客前一致"],intent:"展示成熟合作，不要求關係完美。",pitfalls:["說自己跟誰都合得來","要求對方改個性","公開抱怨"],storyId:"連假房務延遲"}),
  evaFinal("familiar","團隊與SOP","同事今天狀態很差，你會怎麼辦？","我會先確認他是否能安全執行工作，再主動補位短時間任務並把資訊同步。如果只是情緒低落，我會在不影響工作的空檔關心；如果疲勞或身體狀況已影響安全，就必須回報帶班主管。照顧同事不是替他隱瞞風險。",{keywords:["先看安全","短暫補位","同步資訊","必要回報"],intent:"區分一般支持與安全風險。",pitfalls:["一個人把工作全扛下來","假裝沒看到","為義氣隱瞞"],storyId:"學姊"}),
  evaFinal("familiar","工作條件","你能接受外站生活嗎？","可以。我在韓國交換一學期時，曾從零建立生活節奏，也學會遇到不熟悉的規則先詢問、再調整。我知道外站不是旅遊，而是要在有限休息時間照顧身體、準時集合並遵守公司安排。這段經驗讓我知道自己能適應陌生環境，也不會把自由放在團隊紀律前面。",{keywords:["韓國交換","陌生環境","休息管理","集合紀律"],intent:"證明適應力並校正外站不是旅行。",pitfalls:["只談想去各國","忽略時差疲勞","說自己完全不會想家"],storyId:"韓國交換"}),
  evaFinal("familiar","工作條件","能接受體力工作嗎？","可以，但我不會只用年輕來保證。飯店輪班讓我知道久站、多工和情緒勞動會累，所以我會固定維持體能、安排睡眠，也在疲勞時更嚴格做交接與確認。能接受體力工作，代表願意長期管理自己，而不是某一天硬撐。",{keywords:["久站輪班","維持體能","疲勞時確認","長期管理"],intent:"展現對體力負荷的現實理解。",pitfalls:["只說我很健康","逞強不休息","忽略情緒勞動"],storyId:"Hyatt Place 輪班"}),
  evaFinal("familiar","工作條件","如果工作和想像不同，你會怎麼辦？","我會先分清楚是正常的新手落差，還是真的有安全或制度問題。對於辛苦、重複和高標準，我會透過請教、紀錄和練習調整，不會因為不浪漫就退縮。如果有不懂的程序，我會及早問清楚，不用自己的想像取代公司訓練。",{keywords:["新手落差","請教紀錄","不浪漫也做","以訓練為準"],intent:"展現務實、可訓練和長期投入。",pitfalls:["保證永遠不會失望","說不適合就離開","把疑問藏住"],storyId:"房型登打錯誤"}),
  evaFinal("familiar","工作條件","如果同期表現都比你好，你會怎麼辦？","我會先承認差距，觀察具體是哪一項能力，再請教做得好的同學和教官。團體受訓不是排名遊戲，別人做得好也能成為我的學習資源；同時我會把自己的進步記錄下來，避免只用焦慮比較。該合作時，我仍會確實完成自己的角色。",{keywords:["承認差距","具體能力","主動請教","完成角色"],intent:"展示不嫉妒、不自我放棄，也能追上。",pitfalls:["說一定要贏過別人","假裝完全不在意","只談努力沒有方法"],storyId:"第一次航空面試"}),
  evaFinal("familiar","語言","韓文真的能在機上使用嗎？","我有 TOPIK 4 級，也曾在飯店實際用韓文協助旅客。我不會把自己說成母語程度，但在基本需求、安撫和確認資訊上可以幫忙；遇到安全指令或超出能力的內容，我會改用公司標準語言並請更適合的組員支援。語言是增加理解的工具，不能取代正確程序。",{keywords:["TOPIK 4","實際服務","清楚界線","安全用標準語言"],intent:"證明語言實用性，同時不誇大程度。",pitfalls:["自稱流利無障礙","用韓文自行翻譯安全指令","只談證書"],storyId:"韓國旅客"}),
  evaFinal("familiar","語言","海外生活最大的收穫是什麼？","在加拿大我體會較直接的溝通，在韓國則更常需要讀語境。兩段經驗讓我學到，不能用自己的習慣判斷對方有沒有禮貌，而要先確認他真正的意思。現在面對國際旅客時，我會調整說法，但不改變必要的規則和資訊。",{keywords:["加拿大直接","韓國語境","不預設","調整說法"],intent:"把海外經驗轉成跨文化工作能力。",pitfalls:["只列旅遊見聞","把文化刻板化","沒有連回工作"],storyId:"加拿大與韓國"}),
  evaFinal("familiar","語言","遇到不會中文或英文的旅客，你會怎麼協助？","我會先用簡單句、手勢和視覺資訊確認最基本的需求，再使用公司允許的翻譯工具或請會該語言的組員協助。涉及安全時，我會用標準示範、圖卡和覆誦確認，不靠猜測。飯店工作讓我知道，溝通成功不是講很多，而是確認雙方理解同一件事。",{enQ:"How would you help a passenger who cannot communicate well in English?",enA:"I would use short sentences, gestures and visual information to identify the basic need, then use an approved translation tool or ask a crew member who speaks the language. For safety information, I would use standard demonstrations and confirm understanding rather than guess. Good communication means both sides understand the same thing.",keywords:["簡單句","視覺資訊","允許工具","確認理解"],intent:"說出低風險到高風險的溝通層級。",pitfalls:["直接拿私人手機亂翻","假裝聽懂","只說找別人"],storyId:"哥倫比亞旅客"}),
  evaFinal("familiar","壓力追問","如果華航也錄取你，你會怎麼選？","我會依報到承諾與實際職涯選擇負責，不會把兩家公司拿來互相抬價。現在我參加長榮招考，就會把注意力放在長榮的流程和職務要求，誠實完成每一步。如果已接受 offer，我會尊重承諾並及早處理，不讓公司和團隊被動。",{enQ:"What would you do if China Airlines also offered you a position?",enA:"I would make a responsible decision based on the commitment I have made, not use two airlines to negotiate against each other. While applying to EVA Air, I am focused on its process and role requirements. If I accept an offer, I would respect that commitment and communicate any decision early.",keywords:["不比較高下","尊重承諾","專注當下","及早溝通"],intent:"測試穩定度、誠信與選擇邏輯。",pitfalls:["貶低華航","說哪家先錄取就去哪家","過度保證終身不變"],storyId:""}),
  evaFinal("familiar","壓力追問","如果這次沒錄取，你會怎麼做？","我會先整理這次卡住的環節，能取得回饋就具體記下，不能取得就用錄音和模擬紀錄檢查。接著維持工作表現並補強弱點，再決定下一次機會。失落一定會有，但我不會用重複背更多題目代替真正改善。",{keywords:["整理環節","用紀錄檢查","維持工作","補真正弱點"],intent:"展示韌性與有效改善，而非口號。",pitfalls:["說一定不放棄但沒方法","把沒錄取怪運氣","立刻投所有公司"],storyId:"第一次航空面試"}),
  evaFinal("familiar","壓力追問","為什麼以前還沒有進航空業？","我過去先完成學業與海外經驗，再用一年飯店櫃檯確認自己是否真的適合第一線服務。這條路不是拖延，而是讓我現在不是只靠想像申請。我已經知道輪班、客訴和跨文化溝通的現實，也更清楚自己還要把安全與航空程序學好。",{keywords:["完成學業","飯店驗證","不是想像","知道待學能力"],intent:"把時間線說成有累積的準備，而非辯解。",pitfalls:["說之前沒機會","把每段經歷都硬湊航空","過度合理化"],storyId:"Hyatt Place 一年"}),
  evaFinal("improv","壓力追問","為什麼我們要相信你這次準備好了？","",{keywords:["具體改變","練習紀錄","安全補強","不保證完美"],intent:"不要說「我真的很努力」，請舉一個前後可比較的改變。",pitfalls:["保證不會緊張","把準備等同背完題庫","空泛喊決心"]}),
  evaFinal("improv","情境","旅客拒絕遵守安全指示，你會怎麼做？","",{enQ:"What would you do if a passenger refused a safety instruction?",keywords:["清楚重述","說明風險","給執行時間","通報座艙長"],intent:"測試你能否親切但堅定地執行安全規定。",pitfalls:["和旅客爭辯","為服務感受而放棄","自己承諾處罰"]}),
  evaFinal("improv","情境","旅客送你昂貴禮物，你會怎麼處理？","",{keywords:["感謝心意","公司規定","婉拒或回報","避免利益衝突"],intent:"測試誠信與職業界線。",pitfalls:["先收下再說","讓同事決定","以不傷感情為由破例"]}),
  evaFinal("improv","時事","空服員經營社群媒體，界線應該在哪裡？","",{keywords:["隱私","制服與職務身分","內部資訊","公司規範"],intent:"平衡個人表達、旅客隱私和職業責任。",pitfalls:["一律禁止社群","分享公眾人物行程","用未公開工作內容增加流量"]}),
  evaFinal("improv","時事","AI 能取代空服員嗎？","",{keywords:["支援資訊","不能取代責任","緊急判斷","人際安撫"],intent:"避免二分法，說出科技能支援與不能代替的工作。",pitfalls:["只說人有溫度","否定科技","把 AI 說成安全決策者"]}),
  evaFinal("improv","團隊與SOP","你比較喜歡獨立工作還是團隊合作？","",{enQ:"Do you prefer working independently or in a team?",keywords:["獨立完成責任","主動同步","需要時補位","客艙是團隊"],intent:"不要二選一，說清楚獨立責任如何接上團隊。",pitfalls:["只選團隊討好考官","說自己不需要別人","沒有例子"]}),
  evaFinal("improv","時事","請分享最近一則你關注的航空新聞。","",{keywords:["事件事實","為何關注","對旅客或組員影響","不知道就不猜"],intent:"題庫為手動更新位置；回答當週你真的看過的新聞。",pitfalls:["把舊聞說成最新","背標題沒有觀點","臆測未確認資訊"]}),
  evaFinal("improv","情境","兩位旅客同時需要協助，你會先處理誰？","",{keywords:["安全與急迫性","特殊需求","先說明等待","請組員支援"],intent:"說明排序原則，而不是憑直覺選人。",pitfalls:["只看誰聲音大","全部自己做","忽略向另一位說明"]}),
  evaFinal("improv","語言","旅客突然用你不熟悉的語言求助，你第一步做什麼？","",{keywords:["不要假裝懂","確認是否緊急","視覺與手勢","找資源"],intent:"測試臨場與不確定資訊下的安全處理。",pitfalls:["猜測需求","只說我不會","用不可靠翻譯處理安全資訊"]}),
  evaFinal("improv","時事","永續航空會如何影響客艙服務？","",{keywords:["減少浪費","旅客溝通","服務品質","依公司政策"],intent:"從組員可執行的行為回答，不背口號。",pitfalls:["自創公司政策","只談碳排數字","忽略旅客體驗"]})
];

var EVA_READING_PASSAGES = [
  {type:"航空／旅遊",text:"A delayed flight can be stressful, especially when passengers do not know what will happen next. Clear updates help people make decisions and reduce confusion. Even when there is no new information, telling passengers when the next update will come can make the wait feel more manageable."},
  {type:"城市",text:"Lisbon is known for its steep streets, yellow trams and views across the river. Many visitors explore the city on foot, but comfortable shoes are important. Small neighbourhood cafes are often busiest in the late afternoon, when local residents stop for coffee and conversation."},
  {type:"飲食",text:"Fermented food is part of many cultures. Yogurt, kimchi and sourdough are made with microorganisms that change flavour and texture over time. Although these foods share a similar process, their taste and role at the table can be very different."},
  {type:"文化",text:"In some cultures, direct eye contact shows confidence. In others, long eye contact may feel uncomfortable or disrespectful. Good communication therefore requires more than correct words. It also requires attention to how the other person responds."},
  {type:"健康",text:"Short periods of movement can be useful during a long day. A brief walk, gentle stretching or standing for a few minutes may help people feel more alert. The goal is not intense exercise, but a regular change of position."},
  {type:"環境",text:"Many cities are planting more trees to reduce heat in crowded neighbourhoods. Trees provide shade and may improve air quality, but they also need water and long-term care. Choosing the right species is important when space is limited."},
  {type:"科技",text:"Digital translation tools are improving quickly, but they still make mistakes with context and tone. They can support simple communication, yet important medical or safety information should be confirmed carefully rather than trusted without checking."},
  {type:"日常生活",text:"A small library started lending tools as well as books. Residents can borrow drills, sewing machines and gardening equipment for a few days. The programme saves money and storage space, while also helping neighbours share practical skills."},
  {type:"一般新聞型短文",text:"A regional railway introduced quieter carriages after a three-month trial. Passengers in these areas are asked to keep phone calls short and use headphones. The rule is voluntary, but early feedback suggests that clear signs make cooperation easier."}
];

var EVA_TAIWANESE = [
  {topic:"安全帶",zh:"飛機即將起飛，請繫妥安全帶。",tw:"飛行機欲起飛矣，請共安全帶縛予好。",hard:"即將：欲｜繫妥：縛予好"},
  {topic:"行李",zh:"請將隨身行李放入上方行李櫃。",tw:"請共隨身行李囥入頂懸的行李櫃。",hard:"放：囥 khǹg｜上方：頂懸 tíng-kuân"},
  {topic:"證件",zh:"下機前請再次確認護照與登機證。",tw:"落飛行機進前，請閣確認護照佮登機證。",hard:"再次：閣｜與：佮 kah"},
  {topic:"抵達",zh:"本班機即將抵達桃園國際機場。",tw:"咱這班飛行機欲到桃園國際機場矣。",hard:"抵達：到｜即將：欲"},
  {topic:"免稅商品",zh:"若需要購買免稅商品，請按服務鈴。",tw:"若欲買免稅商品，請揤服務鈴。",hard:"需要：欲｜按：揤 tsi̍h"},
  {topic:"服務鈴",zh:"如需協助，請按座位上方的服務鈴。",tw:"若需要鬥相共，請揤座位頂懸的服務鈴。",hard:"協助：鬥相共｜上方：頂懸"},
  {topic:"海關",zh:"入境後請依照指示前往海關檢查。",tw:"入境了後，請照指示去海關檢查。",hard:"依照：照｜前往：去"},
  {topic:"隨身物品",zh:"離開座位前，請確認隨身物品。",tw:"離開座位進前，請確認隨身的物件。",hard:"物品：物件 mi̍h-kiānn"},
  {topic:"登機",zh:"請依照登機證上的座位號碼入座。",tw:"請照登機證頂懸的座位號碼坐落去。",hard:"入座：坐落去"},
  {topic:"機上安全",zh:"安全帶指示燈熄滅前，請留在座位上。",tw:"安全帶指示燈烏去進前，請留佇座位。",hard:"熄滅：烏去｜在：佇 tī"},
  {topic:"椅背桌板",zh:"請將椅背豎直，並收妥桌板。",tw:"請共椅仔徛予直，桌枋收予好。",hard:"豎直：徛予直｜桌板：桌枋"},
  {topic:"下機",zh:"感謝您的搭乘，請小心拿取上方行李。",tw:"多謝你的乘坐，提頂懸行李的時請細膩。",hard:"小心：細膩 sè-jī｜拿取：提"}
];

var EVA_SJT = [
  {tag:"Safety／SOP",q:"餐車服務中突然出現明顯亂流，資深同事說再送完兩排就好。",o:["照做，避免旅客失望","先固定餐車並就近確保自身安全，同時依程序通報","請旅客自己把餐盤收好","等座艙長廣播後才行動"],best:1,worst:0,why:"亂流時先依程序中止服務並確保人員與設備安全。年資不能取代安全判斷。"},
  {tag:"Integrity",q:"你發現同事把公司備品帶回家，對方說只是少量而且大家都這樣。",o:["私下提醒並依規定處理或回報","當作沒看到維持關係","也拿一些才公平","在群組公開質問"],best:0,worst:2,why:"先對事不對人地提醒，但不能因人情忽略誠信與公司資產。"},
  {tag:"Privacy",q:"朋友詢問某位藝人是否搭乘你的航班。",o:["只告訴好友並要求保密","用暗示方式回答","說明不能透露旅客資訊","等航班結束後再說"],best:2,worst:0,why:"旅客資訊不因對方是朋友、公眾人物或航班已結束而失去隱私。"},
  {tag:"Teamwork",q:"交接時同事說很忙，請你自己看紀錄就好，但你發現資訊不完整。",o:["猜測後繼續工作","要求對方立刻全部重做","先確認影響安全與服務的關鍵資訊，再補齊交接","把問題留給下一班"],best:2,worst:3,why:"先補齊關鍵資訊讓工作不中斷，再處理流程改善。"},
  {tag:"Authority",q:"旅客要求免費升等，並說認識公司主管。",o:["立刻升等避免申訴","依權限與規定確認，提供可行選項","請旅客自己聯絡主管","承諾落地後一定補償"],best:1,worst:0,why:"不能因身分說法跳過權限與公平原則。"},
  {tag:"Attendance",q:"你可能因私人交通安排而遲到，但目前還來得及改搭較貴的交通工具。",o:["冒險等原班車","立即改搭可靠方式並提早通報可能風險","到最後一刻再說","請同事代打卡"],best:1,worst:3,why:"準時與誠信都是基本工作責任，不能用代打卡掩蓋。"},
  {tag:"Fatigue",q:"你感到異常疲倦，擔心會影響安全工作。",o:["喝咖啡硬撐不說","依公司疲勞與通報程序處理","請同事偷偷多做一點","等真的犯錯再說"],best:1,worst:3,why:"疲勞是安全風險，應依程序及早處理，不是個人意志力問題。"},
  {tag:"Conflict",q:"旅客辱罵同事，同事情緒也開始升高。",o:["加入爭辯保護同事","先支援現場、降低衝突並依需要通報","把同事拉走但不交接","錄影自保"],best:1,worst:0,why:"先控制風險並支援同事，避免用更高情緒回應。"},
  {tag:"Rules",q:"旅客希望你通融使用已明確禁止的設備，理由是只要一分鐘。",o:["一分鐘可以接受","清楚說明規定並提供可行替代方式","假裝沒看到","叫其他組員決定"],best:1,worst:2,why:"規定不能因時間短而失效；可在界線內保留服務感。"},
  {tag:"Service",q:"兩位旅客同時求助，一位想要飲料，一位表示呼吸不舒服。",o:["先服務先開口的人","先處理可能的醫療與安全需求並請組員協助另一位","兩位都請等","先送飲料比較快"],best:1,worst:2,why:"依安全與急迫性排序，同時用團隊分流。"},
  {tag:"Stress",q:"你連續犯了兩個小錯，開始很緊張。",o:["加快速度追回進度","短暫重整、依檢查步驟做並必要時告知組員","隱瞞錯誤","要求立即換工作區"],best:1,worst:2,why:"壓力下更需要可驗證的步驟與資訊透明。"},
  {tag:"SOP／Teamwork",q:"你不確定一項程序，但其他人都很忙。",o:["依印象處理","先查核標準資料或明確請示，不自行猜測","延後到旅客抱怨再說","請旅客決定"],best:1,worst:3,why:"不確定時要查核或請示；程序正確比怕打擾更重要。"}
];

var EVA_ETHICS = [
  {q:"空服員利用員工票替朋友代購並收取報酬，你怎麼看？",points:["利益衝突","員工福利用途","公司規定","停止並回報或詢問"]},
  {q:"穿制服經營個人社群並接商業合作，應注意什麼？",points:["職務身分","品牌與公司規範","廣告揭露","不可分享內部資訊"]},
  {q:"你知道公眾人物的搭機資訊，朋友私下詢問時怎麼做？",points:["旅客隱私","不暗示、不證實","航班後仍保密","必要時通報"]},
  {q:"發現同事違反 SOP，但他希望你不要說，你會怎麼做？",points:["先確認事實","立即降低風險","依程序回報","對事不對人"]},
  {q:"旅客為感謝服務送你昂貴禮物，怎麼處理？",points:["感謝心意","公司收禮規範","婉拒或申報","避免利益衝突"]},
  {q:"使用員工福利替朋友謀利，為何是問題？",points:["福利目的","公平","誠信","公司信任"]},
  {q:"同事在私人群組分享未公開工作資訊，你會怎麼做？",points:["資訊分級","提醒停止轉傳","保存必要事實","依規定回報"]},
  {q:"旅客要求的服務與安全規定衝突時，如何說明？",points:["安全優先","清楚原因","替代方案","必要升級"]},
  {q:"主管口頭要求你省略一項紀錄程序，你會怎麼處理？",points:["確認指示","說明程序風險","依正式規範","適當層級詢問"]}
];

var EVA_PICTURES = [
  {title:"機場報到櫃檯前的家庭",scene:"一個家庭站在報到櫃檯前，父母正在整理文件，小孩抱著玩具看向航班資訊板。"},
  {title:"雨中的公車站",scene:"兩位陌生人在大雨中的公車站共撐一把傘，其中一人把傘向另一邊傾斜。"},
  {title:"延誤中的登機門",scene:"登機門前坐滿旅客，螢幕顯示延誤，一名地勤正在向排隊的人說明。"},
  {title:"城市市場",scene:"早晨的市場裡，攤商把水果遞給一位觀光客，兩人用手勢溝通。"},
  {title:"機艙內的長者",scene:"一位年長旅客正嘗試把行李舉上行李櫃，旁邊的組員走向他。"},
  {title:"團隊簡報",scene:"四位同事圍著桌面地圖討論，其中一人指著路線，另一人正在做筆記。"}
];

var EVA_CURRENT_TOPICS = [
  "最近一則你真正讀過的航空新聞",
  "AI 能否取代部分空服工作",
  "空服員經營社群媒體的界線",
  "航空安全事件後公司如何溝通",
  "旅客不當行為與組員保護",
  "永續航空如何落實在客艙服務",
  "服務流程中的科技與人性"
];

var EVA_FOLLOWUP_CHAINS = [
  {title:"動機追問鏈",steps:["為什麼想當空服員？","飯店也能服務人，為什麼離開？","所以你不喜歡飯店嗎？","如果空服工作更累呢？"]},
  {title:"可靠追問鏈",steps:["你說自己的優點是可靠，怎麼證明？","有沒有哪一次別人不能依靠你？","你犯錯時怎麼處理？","怎麼確定不會再犯？"]},
  {title:"Why EVA 追問鏈",steps:["為什麼長榮？","華航也重視安全，差別在哪？","如果另一家公司先錄取你呢？","你如何證明不是只背公司資料？"]},
  {title:"語言追問鏈",steps:["韓文能在機上做什麼？","遇到超出能力的內容呢？","如果是安全指令怎麼辦？"]}
];
