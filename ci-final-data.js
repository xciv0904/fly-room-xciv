/* Bilingual interview drafts. News facts and personal recollections remain distinct. */
(function(root){
  "use strict";
  const checkedAt="2026-11-10";
  const sources={
    review:{title:"本人面試回顧",url:"#review",date:"",kind:"personal"},
    stories:{title:"本人飯店服務故事",url:"#tools",date:"",kind:"personal"},
    runway:{title:"中央社：曼谷機場跑道受損與航班延誤",url:"https://www.cna.com.tw/news/aopl/202610290323.aspx",date:"2026-10-29",kind:"news"},
    privacy:{title:"公視：涉嫌利用 AI 竊取個資案件",url:"https://news.pts.org.tw/article/834582",date:"2026-11-06",kind:"news"},
    newyear:{title:"華航：跨年主題航班",url:"https://www.china-airlines.com/tw/zh/about-china-airlines/media/news/20261104.html",date:"2026-11-04",kind:"official"},
    fleet:{title:"華航：2027 年 787 主題月曆",url:"https://www.china-airlines.com/cn/zh/about-china-airlines/media/news/20261029.html",date:"2026-10-29",kind:"official"},
    safety:{title:"華航：工程先鋒・飛航守護者",url:"https://www.china-airlines.com/tw/zh/about-china-airlines/media/news/20261006.html",date:"2026-10-06",kind:"official"},
    saf:{title:"華航：長程示範航班與 40% SAF",url:"https://www.china-airlines.com/tw/zh/about-china-airlines/media/news/20260914.html",date:"2026-09-14",kind:"official"},
    battery:{title:"民航局：4 月 8 日起限帶兩個行動電源",url:"https://www.caa.gov.tw/NewsPublish-Content.aspx?a=381&lang=1&nid=2547",date:"2026-04-02",kind:"official"},
    website:{title:"華航：新版網站與 12 種語系",url:"https://www.china-airlines.com/tw/zh/about-china-airlines/media/news/20260504",date:"2026-05-04",kind:"official"},
    industryBombs:{title:"Reuters：歐洲多航班炸彈威脅事件整理",url:"https://new.streetinsider.com/Reuters/Factbox-Bomb%2Bthreats%2Bcause%2Bflight%2Bdisruptions%2Bacross%2BEurope/27279387.html",date:"2026-11-06",dateLabel:"報導更新",kind:"news"},
    flydubaiOps:{title:"flydubai：FZ1073 事件與營運公告",url:"https://www.flydubai.com/en/help/operational-updates/",date:"2026-10-01",kind:"official"},
    flydubaiCEO:{title:"Emirates 24/7：flydubai 執行長說明保安事件與轉降",url:"https://www.emirates247.com/uae/flydubai-ceo-a-full-official-investigation-is-currently-underway-regarding-flight-fz1073/6284",date:"2026-10-02",kind:"news"},
    natsOutage:{title:"NATS：9 月 8 日航管技術故障初步報告",url:"https://www.nats.aero/news/nats-publishes-preliminary-report-on-technical-incident-of-8-september/",date:"2026-09-18",kind:"official"},
    miamiCargo:{title:"NTSB：21 Air 7598 邁阿密衝出跑道調查",url:"https://www.ntsb.gov/investigations/Pages/DCA26MA352.aspx/",date:"2026-10-01",dateLabel:"調查更新",kind:"official"},
    townsville:{title:"ATSB：捷星 JQ908 與地面車輛跑道入侵事件",url:"https://www.atsb.gov.au/investigations/ao-2026-100",date:"2026-10-26",dateLabel:"調查更新",kind:"official"},
    conflictAirspace:{title:"EASA：沙烏地阿拉伯空域衝突風險通報 R1",url:"https://www.easa.europa.eu/en/domains/air-operations/czibs/czib-2026-09-r1",date:"2026-10-09",dateLabel:"通報修訂",kind:"official"},
    ebolaOrder:{title:"美國 CDC：赴美航空旅客伊波拉聲明命令",url:"https://www.cdc.gov/port-health/media/pdfs/2026/10/CDC-Ebola-Attestation-Order-Signed.pdf",date:"2026-10-28",dateLabel:"命令簽署",kind:"official"},
    fuelSurcharge:{title:"民航局：11 月 8 日起調漲國際線燃油附加費",url:"https://www.caa.gov.tw/NewsPublish-Content.aspx?a=381&lang=1&nid=2594",date:"2026-11-02",kind:"official"},
    iataPassenger:{title:"IATA：2026 全球旅客調查，生物辨識、AI 與入境障礙",url:"https://www.iata.org/en/pressroom/2026-releases/10-28-iata-2026-global-passenger-survey-travelers-biometrics-ai-entry-requirements/",date:"2026-10-28",kind:"official"},
    koreanAsiana:{title:"韓亞航空：大韓／韓亞哩程整合計畫與生效日期",url:"https://flyasiana.com/C/US/EN/customer/notice/detail?id=CM202609040002530347",date:"2026-09-15",kind:"official"},
    westernSydney:{title:"西雪梨國際機場：正式啟用與首批客運航班",url:"https://www.wsiairport.com.au/corporate/media-releases/new-era-aviation-takes-flight-wsi",date:"2026-10-25",kind:"official"},
    typhoonDisruption:{title:"民航局：颱風逼近，10 月 23 日國內線全數取消公告",url:"https://www.caa.gov.tw/NewsPublish-Content.aspx?a=381&lang=1&nid=2591",date:"2026-10-22",kind:"official"}
  };
  const CI_FINAL_ITEMS=[
    {
      key:"intro",group:"實戰回顧",kind:"asked",priority:1,englishCore:true,coverage:["R1","E1"],match:["請簡單介紹你自己。","請用英文做自我介紹","請用中文做自我介紹","請簡單用 30 秒左右自我介紹"],sources:["review"],updatedAt:"2026-11-09",answerLabel:"本人提供三語完整版",
      q_zh:"請用 30 秒自我介紹。",q_en:"Please introduce yourself in 30 seconds.",
      a_zh:`考官好，我是張萱利。
我具備英文和韓語溝通能力，目前在凱悅集團任職飯店櫃檯，在工作中，我總能專注細節並預判旅客需求，同事們也形容我是團隊裡最令人安心的後盾，因為我始終以最高標準維持服務品質。
我相信，優質的服務，不僅是走完標準流程，而是在每一次互動中，讓旅客感到安心與被重視。
我期待將這份經驗延伸到機艙服務中，與團隊合作，為旅客提供細緻且專業的飛行體驗。
謝謝`,
      a_en:`Hello. My name is Shelly.
I'm confident in communicating in both English and Korean. Currently, I work at the front desk of Hyatt hotel. I’m good at meeting guest needs with a focus on detail. My teammates see me as a very reliable person because I always maintain the highest standards of service.
I believe that great service is more than just following rules; it’s about making every guest feel comfortable and valued.
I’m excited to bring my hospitality experience to the cabin and work with your team to provide a professional experience for every passenger.
Thank you.`,
      a_ko:`안녕하십니까, 장선리입니다.
저는 영어와 한국어 2개 국어를 할 수 있습니다.
지금은 하얏트 호텔에서 프런트 데스크로 근무하고 있습니다.
저는 항상 세부적인 세심한 부분에 집중하고 고객의 요구를 미리 예측하며 최고의 서비스를 제공하고 있습니다.
최고의 서비스는 고객이 안심하고 존중 받고 계신다는 것을 느끼도록 하는 것이라고 믿습니다
이 경험으로 기내 서비스로 확장하여 해서 팀원들과 함께 승객들에게 꼼꼼한 전문적인 비행 경험을 제공하고 싶습니다.`,
      tip:"2026-11-09 本人提供的中英韓完整原稿。若現場限時 30 秒，請另備精簡版，勿加速唸完全文。"
    },
    {
      key:"preparation",group:"實戰回顧",kind:"asked",priority:1,coverage:["R2"],sources:["review"],
      q_zh:"為了應考華航，妳做了哪些準備？",q_en:"What have you done to prepare for this China Airlines interview?",
      a_zh:"我的準備分成語言、實戰和職務理解。語言方面，我持續練習英文表達，也維持韓文能力；實戰方面，一年的飯店櫃檯工作讓我累積客訴處理與跨文化溝通經驗。我也閱讀華航新聞，思考新聞與旅客服務的關係，並補強安全優先、正確通報及不自行推測資訊的觀念。我希望帶著可轉移的經驗來學習，也清楚航空專業仍需要正式訓練。",
      a_en:"I've prepared in three areas: language, service experience, and understanding the role. I practise expressing myself in English and maintain my Korean. My year at the hotel gave me experience with complaints and cross-cultural communication. I also read China Airlines news and study the importance of safety, reporting concerns, and sharing accurate information. I bring useful experience, while recognising that aviation duties require formal training.",
      personalCheck:"只保留妳確實完成的準備；英文練習方式與安全學習內容，面試前各準備一個實例。",tip:"不要把飯店工作說成已完成空服員訓練。"
    },
    {
      key:"delay-honesty",group:"實戰回顧",kind:"asked",priority:1,englishCore:true,coverage:["R3","E6"],sources:["review"],
      q_zh:"飛機無法起飛，旅客詢問原因，妳會說實話嗎？",q_en:"Would you tell passengers the truth about why their flight cannot depart?",
      a_zh:"會，我會誠實說明已確認、可對外傳達的資訊。如果原因還在確認，我會直接說目前仍在評估，不用猜測填補空白，也不因為可能涉及人為因素就刻意含糊。我會向負責人員確認最新狀況，讓旅客知道有新資訊會再更新，同時了解是否有轉機、用藥或其他急迫需求。對我而言，誠實也包括清楚說明目前不知道什麼。",
      a_en:"Yes. I would share confirmed information honestly and follow the crew's communication guidance. If the cause is still being assessed, I would say so rather than guess or hide it. I would check for updates and ask about urgent needs, such as connections or medication. Being honest also means clearly explaining what we do not yet know.",
      tip:"修正舊答『人為疏失說籠統一點』。確認是為了準確，不是隱瞞已確認的重要資訊。"
    },
    {
      key:"social-media",group:"實戰回顧",kind:"asked",priority:1,coverage:["R4"],sources:["review"],
      q_zh:"妳會在社群媒體上炫耀空服員工作嗎？",q_en:"Would you show off your cabin crew job on social media?",
      a_zh:"我會把制服看成責任與榮譽，也會留意分享方式。若公司規範允許，我可以分享自己的學習或正面的生活感受，但不會公開旅客資料、未獲同意的影像、內部訊息或用工作抱怨吸引注意。發布前，我會想這是否尊重當事人、符合公司規範，也能代表團隊的專業。讓人信任我的工作方式，比讓人羨慕我的工作更重要。",
      a_en:"I see the uniform as a responsibility and an honour. If company policy allows, I may share positive reflections about my learning, but not passenger information, images without permission, or internal details. Before posting, I would consider privacy, company rules, and the team's professional image. I would rather earn trust through how I work than attention through how I present the job.",
      tip:"不必承諾完全不用社群。說清楚可分享的範圍與發布前的判斷。"
    },
    {
      key:"runway-news",group:"新聞延伸",kind:"news",priority:1,coverage:["N1.main"],sources:["runway"],
      fact:"10/28 曼谷機場跑道受損影響 CI840，考量高雄機場宵禁改隔日出發；10/29 報導時事故原因仍待調查。",eventDate:"2026-10-28",
      q_zh:"最近有沒有關注華航新聞？如果妳是曼谷延誤航班的空服員，會怎麼做？",q_en:"What China Airlines news have you followed, and what would you do as cabin crew on the affected Bangkok flight?",
      a_zh:"我關注十月底曼谷機場跑道受損、影響華航航班的新聞。這讓我想到，旅客除了等待，也可能擔心安全和後續行程。我會先確認可以傳達的最新資訊，清楚區分已知事實與仍在調查的部分，再了解旅客的急迫需求，與座艙長及地面團隊協調協助。在飯店處理等待入住的旅客時，我也體會到，持續而準確的更新能減少不確定感。",
      a_en:"I followed the late-October news about runway damage at Bangkok airport affecting a China Airlines flight. Passengers may worry about both safety and their plans. I would confirm the latest information, distinguish known facts from matters under investigation, and coordinate support for urgent needs. At the hotel, I learned that clear, consistent updates help guests cope with uncertainty, even when the situation cannot be resolved immediately.",
      tip:"報導當時的調查狀態要加上日期，不能自行斷言洪水或維護疏失就是原因。"
    },
    {
      key:"delay-pressure",parentKey:"runway-news",group:"新聞延伸",kind:"followup",priority:1,coverage:["N1.follow"],sources:["runway","review"],
      q_zh:"旅客指控公司隱瞞，並要求妳保證起飛時間，妳怎麼回應？",q_en:"A passenger accuses the airline of hiding information and demands a guaranteed departure time. How would you respond?",
      a_zh:"我會先回應他的焦慮：我理解您需要確定時間安排後續行程。接著說明目前已確認的狀況，以及哪些資訊還在等待更新。我不會為了讓他暫時安心而保證未確認的起飛時間，也不會和他爭辯。我會確認最新公告和可提供的協助，請座艙長支援超出權限的需求，並在取得新資訊後主動回來說明。",
      a_en:"I would acknowledge that the passenger needs reliable information to plan ahead. I would explain what has been confirmed and what is still pending. I would not promise a departure time simply to calm them down. Instead, I would check the latest update, offer available assistance, and involve the purser where necessary. I would return with new information rather than leave them feeling ignored.",
      tip:"可承諾自己會再確認與更新，不能承諾尚未獲確認的結果。"
    },
    {
      key:"privacy-news",group:"新聞延伸",kind:"news",priority:2,englishCore:true,coverage:["N2.main","E5"],sources:["privacy"],
      fact:"11/6 公視報導警方查獲涉嫌利用 AI 生成工具建立攻擊系統、竊取並販售個資的案件。",eventDate:"2026 年 10 月中旬查緝；11/6 報導",
      q_zh:"分享一則最近關注的社會新聞，以及妳的看法。",q_en:"Tell us about a recent news story that caught your attention and explain your view.",
      a_zh:"我注意到警方查獲涉嫌利用 AI 工具竊取個資的新聞。我的看法是，科技提高效率的同時，也讓保護資料的責任更重要。飯店與航空服務都會接觸旅客的私人資訊，第一線人員不能因為方便就任意查閱、轉傳或輸入外部工具。我會確認使用目的與公司規範，只在工作需要的範圍內處理資料。服務上的信任，也包含旅客看不見的資料保護。",
      a_en:"I read a report about a suspect allegedly using AI tools to steal personal information. It reminded me that greater efficiency brings greater responsibility. Both hotels and airlines handle private guest information, so staff should not access, share, or upload it just because doing so is convenient. I would follow company policy and use information only for legitimate work needs. Protecting trust includes what happens behind the scenes.",
      tip:"區分『警方指控／涉嫌』與已判決事實；觀點要連回自己的工作責任。"
    },
    {
      key:"ai-translation",parentKey:"privacy-news",group:"新聞延伸",kind:"followup",priority:2,coverage:["N2.follow.ai"],sources:["privacy"],
      q_zh:"為了協助外國旅客，妳會把旅客資料貼進 AI 翻譯工具嗎？",q_en:"Would you enter a passenger's personal details into an AI translation tool to help them?",
      a_zh:"我不會把旅客資料直接貼進未經公司允許的外部工具。我會先用簡單語言、手勢或請合適的同事協助；需要翻譯工具時，先確認公司允許的工具、用途與資料範圍，只提供完成任務必要的內容。若無法確定是否可以使用，我會先請教主管。協助旅客溝通很重要，但不能因此讓他的資料暴露在不必要的風險中。",
      a_en:"I would not put passenger details into an external tool without company approval. I would first try simple language or seek help from an appropriate colleague. If a translation tool is needed, I would check which tools and data uses the company permits, and share only what is necessary. If I am unsure, I would ask my supervisor before proceeding. Helpful service must also protect privacy.",
      tip:"不要說所有 AI 都不能用；重點是核准工具、必要用途與資料最小化。"
    },
    {
      key:"passenger-lookup",parentKey:"privacy-news",group:"新聞延伸",kind:"followup",priority:2,coverage:["N2.follow.friend"],sources:["privacy"],
      q_zh:"朋友請妳查某位名人或熟人是否搭機，妳會幫忙嗎？",q_en:"Would you help a friend check whether a celebrity or someone they know is on a flight?",
      a_zh:"不會。即使只是確認有沒有搭機，也是在透露私人行程，和我的工作需求無關。我會友善但清楚地說明，旅客資訊不能用來滿足私人好奇，也不會替朋友截圖或轉傳。如果對方有正當需求，我會請他使用正式管道。我認為專業界線不只是在面對陌生人時遵守，面對熟人也要一致。",
      a_en:"No. Even confirming that someone is on a flight reveals private travel information and has no legitimate work purpose. I would explain politely that I cannot use passenger records for personal requests, send screenshots, or pass details along. If there is a valid concern, I would direct them to the proper channel. Professional boundaries should be consistent, including with people I know.",
      tip:"『只看、不告訴別人』仍不等於具有工作需要。"
    },
    {
      key:"theme-flight",group:"新聞延伸",kind:"news",priority:2,coverage:["N3.main"],sources:["newyear"],
      fact:"11/4 華航宣布 12/31 台北—曼谷 CI837 跨年主題航班，規劃機上慶祝與限定服務。",eventDate:"2026-11-04",
      q_zh:"妳怎麼看華航跨年主題航班？它能帶來什麼價值？",q_en:"What do you think of China Airlines' New Year-themed flight, and what value can it create?",
      a_zh:"我認為主題航班能讓旅程本身成為回憶，而不只是交通，也能讓旅客更具體感受到品牌。華航把跨年體驗延伸到出發前與抵達後，讓我想到飯店服務也重視整段旅程。不過，活動越有吸引力，團隊越需要事先確認流程、分工和不同旅客的需求。我希望提供讓人記得的服務，同時確保每個活動都建立在安全與清楚溝通之上。",
      a_en:"I think a themed flight can turn the journey itself into a memorable experience and make the brand more tangible. The New Year programme also connects services before departure and after arrival, which reminds me of hospitality's focus on the whole guest journey. Delivering that experience requires preparation, teamwork, and attention to different needs. Memorable service should always rest on safety and clear communication.",
      tip:"這是已宣布的未來活動；不要說自己已搭乘，也不保證活動完全不受天候影響。"
    },
    {
      key:"countdown-turbulence",parentKey:"theme-flight",group:"新聞延伸",kind:"followup",priority:1,coverage:["N3.follow"],sources:["newyear"],
      q_zh:"跨年倒數遇到亂流，旅客堅持站起來拍照，妳怎麼辦？",q_en:"During the New Year countdown, turbulence occurs and a passenger insists on standing to take photos. What would you do?",
      a_zh:"我會依安全指示與受訓程序行動，先確保自身安全，再清楚請旅客就座並繫好安全帶。必要時活動必須暫停或調整，我會用簡短、穩定的語氣說明原因，並與組員保持協調。我理解旅客很期待倒數，但不會為了照片放寬安全要求；等狀況允許，再由團隊確認是否有合適的替代安排。",
      a_en:"I would follow the safety instructions and my training, secure my own safety, and clearly ask the passenger to sit down and fasten their seat belt. The activity may need to pause or change. I would explain briefly and calmly and coordinate with the crew. I understand the excitement, but a photo cannot justify a safety exception. Any alternative activity would depend on conditions and the team's guidance.",
      tip:"不要承諾一定補辦，也不要為了勸說而讓自己在亂流中冒險移動。"
    },
    {
      key:"fleet-news",group:"新聞延伸",kind:"news",priority:2,coverage:["N4.main"],sources:["fleet"],
      fact:"10/29 華航發布 787 主題月曆，呈現跨部門迎接新機；客艙圖為模擬示意，配置以交機構型為準。",eventDate:"2026-10-29",
      q_zh:"最近華航哪項發展讓妳印象深刻？",q_en:"Which recent China Airlines development impressed you most?",
      a_zh:"我對華航以 787 為主題的新月曆印象深刻，因為它除了呈現客艙，也讓人看到空服、地勤、機師與修護共同迎接新機的準備。我在飯店櫃檯工作時，也需要和房務及其他同事合作，才能讓旅客感受到一致的服務。這讓我更期待加入需要跨部門協作的團隊，同時保持學習心態。我也留意到圖片是示意，實際設備仍以交機配置為準。",
      a_en:"The new 787-themed calendar impressed me because it highlights not only the cabin but also the teams preparing for the aircraft. At the hotel, consistent service depended on coordination between the front desk, housekeeping, and other colleagues. I would like to bring that team mindset to China Airlines while learning new procedures. I also noticed that the cabin images are illustrations, with final details subject to the delivered configuration.",
      tip:"不要由月曆推論已交機或已全面投入營運。"
    },
    {
      key:"learning-procedures",parentKey:"fleet-news",group:"新聞延伸",kind:"followup",priority:2,coverage:["N4.follow"],match:["航空公司的服務規範與安全手冊會不斷更新，你如何保持學習習慣？"],sources:["fleet"],
      q_zh:"新設備與新流程很多，妳如何確保自己真的學會？",q_en:"How would you make sure you have learned new equipment and procedures correctly?",
      a_zh:"我會先依正式教材和訓練掌握操作目的與步驟，記下不確定的地方，在允許的練習情境中實際演練，再請教官或主管確認理解。更新時，我會核對版本，避免把舊習慣當成新規定。飯店經驗讓我知道，能照著做一次不代表真正熟悉；對涉及安全的設備，我更不會靠猜測或未經允許的試用來學習。",
      a_en:"I would start with the official training materials, understand the purpose and steps, and note anything unclear. I would practise in the approved training setting and ask an instructor or supervisor to check my understanding. I would also verify which version applies when procedures change. Hotel work taught me that doing something once is not the same as mastering it; safety equipment requires proper instruction, not guesswork.",
      tip:"『學很快』要落到核對版本、演練、回饋與再確認。"
    },
    {
      key:"safety-role",group:"新聞延伸",kind:"news",priority:1,coverage:["N5.main"],match:["你認為空服員最重要的職責是什麼？"],sources:["safety"],
      fact:"10/6 華航介紹修護紀錄片，內容包含維修驗證、24 小時修管中心及訓練。",eventDate:"2026-10-06",
      q_zh:"除了提供服務，空服員還有什麼重要責任？",q_en:"Besides providing service, what important responsibilities do cabin crew have?",
      a_zh:"我認為最重要的是維護客艙安全，包括依訓練完成檢查、觀察異常、清楚傳達指示，以及和團隊協作應變。我讀到華航修護紀錄片的介紹，更理解一趟飛行需要許多職位共同完成安全工作。空服員也必須確實完成自己的部分，發現疑慮要提出，而不能因為服務忙碌就忽略。我有服務經驗，也知道自己仍需接受完整航空安全訓練。",
      a_en:"Their central responsibility is cabin safety: completing trained checks, noticing unusual conditions, communicating clearly, and responding as a team. Reading about China Airlines' maintenance documentary reminded me that safe flights depend on many roles doing their part. Cabin crew must speak up about concerns even during busy service. I bring hospitality experience, but I also recognise that aviation safety requires thorough formal training.",
      tip:"讀過介紹不等於看過整部影片；勿虛構觀看心得或自己已具備的航空資格。"
    },
    {
      key:"senior-safety",parentKey:"safety-role",group:"新聞延伸",kind:"followup",priority:1,coverage:["N5.follow"],sources:["safety"],
      q_zh:"如果資深同事漏做安全步驟，妳敢提醒嗎？",q_en:"Would you speak up if a senior colleague missed a safety step?",
      a_zh:"會。我會先確認自己觀察到的情況，用尊重但直接的方式提醒，例如：這個步驟我們是不是還需要再確認？若有立即的安全風險，我會依訓練採取必要行動並通報座艙長，不等到下班才私下討論。事後可以再回顧如何改善。我尊重資深同事的經驗，也相信共同確認是在保護旅客和彼此，不是在挑戰誰的地位。",
      a_en:"Yes. I would check what I observed and raise it respectfully but directly, for example, 'Could we check this step once more?' If there is an immediate safety concern, I would act within my training and notify the purser rather than wait for a private conversation later. Respecting experience and speaking up are compatible. The purpose is to protect passengers and colleagues, not challenge someone's status.",
      tip:"『先遵守、事後私下建議』不能套用到已發現的安全疑慮。"
    },
    {
      key:"sustainability",group:"新聞延伸",kind:"news",priority:2,coverage:["N6.main"],sources:["saf"],
      fact:"9/14 華航公布長程示範航班的 40% SAF Book & Claim 安排，以及輕量餐具等措施；並非全機隊固定使用比例。",eventDate:"2026-09-13",
      q_zh:"妳認為空服員可以如何支持永續？",q_en:"How can cabin crew support sustainability?",
      a_zh:"我認為可以從準確確認需求、減少不必要的耗用，以及清楚介紹旅客可選的服務開始。我也注意到華航把永續延伸到 SAF、輕量餐具與數位服務，並非只靠第一線少發一件物品。身為組員，我會依公司的服務與衛生規範執行，不強迫旅客接受，也不誇大環保效果。我希望讓旅客理解措施的目的，同時維持應有的服務品質。",
      a_en:"Cabin crew can confirm needs accurately, avoid unnecessary waste, and explain available choices clearly. I noticed that China Airlines' initiatives also include SAF, lighter tableware, and digital services, so sustainability is broader than handing out fewer items. I would follow service and hygiene standards, respect passenger choices, and avoid overstating environmental benefits. My aim would be to support the initiative while maintaining thoughtful service.",
      tip:"40% 是特定示範安排的 Book & Claim 資訊，不是所有航班實際加油比例，也不是零碳排。"
    },
    {
      key:"eco-objection",parentKey:"sustainability",group:"新聞延伸",kind:"followup",priority:2,coverage:["N6.follow"],sources:["saf"],
      q_zh:"旅客認為環保只是減少服務，妳怎麼回答？",q_en:"How would you respond to a passenger who says sustainability is just an excuse to reduce service?",
      a_zh:"我會先理解他在意的是哪些服務，避免只重複環保口號。如果他需要某項用品，我會確認能否依規範提供；若是服務形式改變，就清楚解釋可用的替代方式。我會說明措施的目的，也坦白自己不知道的部分，不把旅客的不同選擇當成不環保。對我而言，好的推廣應該讓人理解並願意參與，而不是讓人感到被責備。",
      a_en:"I would first ask which part of the service concerns them, rather than repeat a slogan. If they need an item, I would check whether it can be provided under the service guidelines. If the format has changed, I would explain the available alternative. I would share the purpose honestly without judging their choice. Good communication should help passengers understand and participate, not make them feel blamed.",
      tip:"尊重需求，提供可行選項；不要自行承諾不存在的用品或補償。"
    },
    {
      key:"power-bank",group:"年度議題",kind:"annual",priority:1,coverage:["A1"],sources:["battery"],
      fact:"民航局 4/2 公告自 4/8 起每人限帶兩個行動電源、不得託運；並提醒國籍航空機上禁止使用及充電。",eventDate:"2026-04-08",
      q_zh:"旅客手機快沒電，堅持使用行動電源，妳怎麼勸說？",q_en:"A passenger's phone is almost out of battery and they insist on using a power bank. What would you say?",
      a_zh:"我會先表示理解手機沒電的不便，再清楚說明機上禁止使用行動電源及為它充電，這是安全要求。我會請他停止使用、依規範妥善收放，並確認該機型是否有可以依規定使用的座位電源。若沒有，就誠實說明可行範圍；若仍不配合，請座艙長協助。我會提供選項，但不因為旅客著急就允許安全例外。",
      a_en:"I would acknowledge the inconvenience and explain clearly that using or charging a power bank on board is prohibited for safety reasons. I would ask them to stop and store it appropriately, then check whether approved seat power is available on that aircraft. If not, I would explain the limits honestly. If they still refuse, I would seek the purser's support rather than make a safety exception.",
      tip:"這是年度安全議題，不標成最近一週的新規；設備供電方式與攜帶條件仍依最新官方規範。"
    },
    {
      key:"digital-service",group:"年度議題",kind:"review-extension",priority:2,coverage:["A2"],sources:["website","stories"],
      fact:"5/4 華航新版網站新聞提及 12 種語系及響應式跨裝置體驗；這也是本人初試已確認朗讀題的延伸。",eventDate:"2026-05-04",
      q_zh:"妳初試讀到網站改版，數位化會取代人員服務嗎？",q_en:"Your initial interview passage was about the new website. Will digital services replace human service?",
      a_zh:"我認為數位工具能讓很多標準流程更方便，但旅客是否能順利使用，仍取決於語言、熟悉程度和當下的狀況。一位哥倫比亞旅客曾因中文介面及不熟悉手機操作，無法完成線上報到。我協助核對資料、翻譯畫面，陪她完成步驟。這讓我理解，人員服務的價值是注意到工具沒有解決的困難，再用耐心與判斷補上。",
      a_en:"Digital tools can make routine steps easier, but passengers may still face language barriers or unfamiliar technology. A Colombian guest once struggled with online check-in because the interface was in Chinese and she was not confident using her phone. I checked the details with her and translated the instructions step by step. It taught me that human service remains valuable when we notice and address difficulties the tool has not solved.",
      tip:"哥倫比亞旅客＝線上報到；不要和加拿大旅客租車混在一起。"
    },
    {
      key:"why-cabin-crew",group:"履歷與服務",kind:"derived",priority:1,coverage:["P1"],match:["為什麼想當空服員？"],sources:["stories"],
      q_zh:"為什麼想從飯店轉到航空業？",q_en:"Why do you want to move from hotel service to a cabin crew role?",
      a_zh:"飯店工作讓我確定，協助旅客把問題真正解決，是我很有成就感的事。我曾協助一位加拿大旅客在連假找到可租的車，他隔天回來道謝，讓我更喜歡參與旅程的第一線工作。航空業吸引我的地方，還包含在有限環境中與團隊共同承擔安全和服務責任。我希望延續已有的服務能力，也接受完整訓練，學會航空專業需要的新能力。",
      a_en:"Hotel work confirmed how much I value helping travellers solve real problems. A Canadian guest once came back to thank me after I helped him find an available rental car during a holiday. Cabin crew work also appeals to me because of the teamwork and responsibility for safety in a limited environment. I want to build on my service experience while receiving the formal training needed for a new profession.",
      tip:"肯定飯店累積，說清楚航空工作的具體吸引力，避免只說舞台更大或可以旅行。"
    },
    {
      key:"why-china-airlines",group:"履歷與服務",kind:"derived",priority:1,englishCore:true,coverage:["P2","E2.company"],match:["為什麼想加入我們公司？為什麼選擇我們？"],sources:["fleet","safety","stories"],
      q_zh:"為什麼選擇華航？",q_en:"Why do you want to join China Airlines?",
      a_zh:"我選擇華航，是因為研究公司時，看到它把旅客服務和各部門的專業合作連在一起。像最近的 787 主題月曆與修護紀錄片介紹，都讓我更具體理解一趟飛行背後的團隊。在凱悅櫃檯，我也必須和房務等同事協調，才能讓旅客安心。我希望把這種願意確認、主動協作的態度帶進華航，並在正式訓練中建立航空安全與服務能力。",
      a_en:"I chose China Airlines because my research showed how its passenger experience depends on professional cooperation across teams. The 787-themed calendar and maintenance documentary introduction made that especially tangible. At Hyatt, I also relied on close coordination with housekeeping and other colleagues to support guests. I would like to bring that careful, cooperative approach to China Airlines and build solid aviation safety and service skills through training.",
      tip:"談讀過的具體資料與自己的連結，不把未曾任職的內部文化描述成親身確認。"
    },
    {
      key:"growth",group:"履歷與服務",kind:"derived",priority:1,coverage:["P3"],sources:["review"],
      q_zh:"跟上次應考相比，妳最大的進步是什麼？",q_en:"What is your biggest improvement since your previous interview?",
      a_zh:"我最大的進步是對這份工作的理解更具體。回看以前的回答，我曾把延誤溝通想成不同原因可以有不同程度的說明，現在我更清楚，重點應該是確認資訊、誠實傳達，不猜測也不隱瞞。我也更能分清服務經驗與航空安全訓練的界線。這讓我準備答案時，不只想怎麼說得好聽，也會問自己：現場真的能怎麼做？",
      a_en:"My biggest improvement is a more concrete understanding of the role. Reviewing an earlier answer about delays, I realised the issue is not whether to be vague about certain causes. It is to confirm information, communicate honestly, and avoid guessing or concealment. I also better understand the boundary between hospitality experience and aviation training. I now focus on what I could responsibly do, not only how an answer sounds.",
      personalCheck:"先確認這些反思確實是妳認同的改變，再用自己的話表達；不要聲稱考官提供過未記錄的回饋。",tip:"可坦白修正以前的觀念，不必虛構練習成績或保證自己不再犯錯。"
    },
    {
      key:"why-hire",group:"履歷與服務",kind:"derived",priority:1,coverage:["P4"],match:["為什麼我們航空公司一定要錄取你？"],sources:["stories"],
      q_zh:"為什麼我們應該錄取妳？",q_en:"Why should we hire you?",
      a_zh:"我能帶來的是細心、穩定和願意把事情追到完成的態度。飯店旅客遇到中文介面無法報到時，我會陪他核對、一步一步處理；遇到客訴，我也學會先聽清楚，再找可行方案。我有英文和韓文溝通經驗，同時願意承認不懂、主動請教。我不會說自己已經具備全部航空能力，但我有經驗可以轉移，也願意依訓練重新學習。",
      a_en:"I bring attentiveness, composure, and a willingness to follow through. At the hotel, I helped guests work through language barriers and learned to listen before offering solutions to complaints. I also have experience communicating in English and Korean. Just as importantly, I am willing to ask when I do not know. I bring transferable skills and the readiness to learn aviation procedures properly, rather than assume I already know them.",
      tip:"用證據說明貢獻，不需要比較或貶低其他考生。"
    },
    {
      key:"reliability",group:"履歷與服務",kind:"derived",priority:2,coverage:["P5"],sources:["stories"],
      q_zh:"同事叫妳「學姊」，妳如何避免太有自信、不願請教？",q_en:"Your colleagues call you their go-to person. How do you avoid becoming overconfident?",
      a_zh:"對我而言，可靠不是什麼都知道，而是交辦後會確認、完成和回報，也知道何時需要請教。飯店經驗可以讓我更有條理，但進入航空業，我仍然是需要重新學習的新人。我會依正式流程工作，關鍵資訊再核對，遇到不確定的事情主動詢問。我希望同事信任我，是因為我會把事情處理清楚，而不是因為我不需要任何協助。",
      a_en:"Being reliable does not mean knowing everything. It means clarifying a task, following through, reporting back, and knowing when to ask for help. Hotel experience helps me stay organised, but I would still be a beginner in aviation. I would follow the official procedures, double-check important details, and raise uncertainties. I want colleagues to trust my judgement, including my willingness to seek support.",
      tip:"把『不用確認第二次』改成『關鍵資訊會核對，交辦後有回報』。"
    },
    {
      key:"service-mistake",group:"履歷與服務",kind:"derived",priority:1,englishCore:true,coverage:["P6","E4"],match:["過去工作遇到困難或犯過的錯？如何解決？"],sources:["review"],
      q_zh:"分享一次服務失誤，以及妳如何補救。",q_en:"Tell us about a service mistake you made and what you learned.",
      a_zh:"有一次高卡會員入住時，我沒有完整說明他的禮遇，造成後續不滿。我沒有把責任推給對方趕時間，而是在有機會再次說明時，親自致歉、逐項補充權益並確認需求。這提醒我，完成說明不只是把話講過，而是要確認對方真的理解。之後遇到匆忙的旅客，我會先講最重要的資訊，再確認是否需要後續補充。",
      a_en:"A high-tier hotel member was upset because I had not fully explained his benefits at check-in. Rather than blame him for being in a hurry, I apologised and explained the benefits when I had another opportunity, then checked what he needed. It taught me that communication is not complete just because I have spoken. With a guest in a rush, I would prioritise essential information and confirm any follow-up needed.",
      tip:"保留自己承擔的部分，不虛構補償金額、旅客稱讚或零失誤紀錄。"
    },
    {
      key:"unavailable-request",group:"履歷與服務",kind:"derived",priority:2,coverage:["P7"],sources:["review"],
      q_zh:"分享一次無法完全滿足客人要求的經驗。",q_en:"Tell us about a time you could not fully meet a guest's request.",
      a_zh:"有位旅客因為早上錯過班機，又遇到房型問題，在入住時情緒崩潰。我先讓她把話說完，了解她當下需要休息；原本想要的房型已無法提供，我就協助以沙發床作為替代方案。這次經驗讓我明白，不能滿足原要求時，仍可以誠實說明限制、理解真正的需要，並在可行範圍內找到幫助，而不是只說沒有辦法。",
      a_en:"A guest became very upset at check-in after missing her flight and encountering a room issue. I listened first and understood that she mainly needed rest. Her preferred room was unavailable, so I helped arrange a sofa bed as an alternative. I learned that when the original request cannot be met, honest explanations and a practical alternative can still address the underlying need.",
      tip:"避免暗示每種客訴都可以升等或加床；說明當時確實可行的方案。"
    },
    {
      key:"exceed-expectations",group:"履歷與服務",kind:"derived",priority:2,coverage:["P8"],match:["曾經接過哪一次你覺得自己做得最棒的服務？"],sources:["stories"],
      q_zh:"什麼是超出期待的服務？請舉例。",q_en:"What does exceeding expectations mean to you? Please give an example.",
      a_zh:"我認為是注意到旅客真正卡住的地方，並在能力範圍內多確認一步。一位加拿大旅客想在台北車站附近租車，我不只查位置，也因為連假先打電話確認是否有車。發現租完後，我改找飯店附近的公司，協助他完成預約。他隔天回來道謝。這讓我理解，多做的那一步不一定很大，但要真的讓旅客的問題往前走。",
      a_en:"To me, it means noticing what may prevent a guest from completing their plan and taking a useful extra step. A Canadian guest wanted a rental car near Taipei Main Station. Because it was a holiday, I called ahead and found there were none available. I then helped arrange a reservation near the hotel. He returned to thank me. The extra step mattered because it helped solve the actual problem.",
      tip:"加拿大旅客＝連假租車；別說成哥倫比亞旅客，也別誇大成私自保證供應。"
    },
    {
      key:"proactive-boundaries",group:"履歷與服務",kind:"derived",priority:2,coverage:["P9"],sources:["stories"],
      q_zh:"主動服務會不會變成過度介入？",q_en:"Can proactive service become intrusive? How would you avoid that?",
      a_zh:"會，所以觀察之後還要詢問，而不是直接替對方決定。例如看到旅客不熟悉手機操作，我可以先問是否需要協助，說明要做的步驟，並讓他確認資料。我不會未經同意翻看其他內容或代替他做重要決定。如果對方婉拒，我也會尊重。主動服務是提供選擇和支持，而不是用自己的好意取代旅客的意願。",
      a_en:"Yes. Observation should be followed by permission, not assumptions. If a guest seems unsure about using their phone, I would ask whether they want help, explain the steps, and let them confirm their details. I would not browse other information or make important decisions for them. If they decline, I would respect that. Proactive service should offer support and choices while preserving the guest's control.",
      tip:"不要因外表就替旅客判定身體狀況或需要；先詢問。"
    },
    {
      key:"korean",group:"履歷與服務",kind:"derived",priority:2,coverage:["P10"],match:["韓文TOPIK 4級，有沒有在真實情境中幫到人？"],sources:["review"],
      q_zh:"韓文能力曾如何實際幫助妳工作？",q_en:"How has your Korean helped you in real service situations?",
      a_zh:"我在韓國交換一學期，也取得 TOPIK 4 級，飯店工作時能用韓文協助旅客理解需求與服務資訊。有一次喝醉的韓國旅客索取私人電話，我仍能保持禮貌，清楚拒絕並提供公務聯絡方式，也提醒同行導遊留意。語言能力讓我能直接溝通，但遇到重要資訊或超出能力的內容，我仍會再確認或請合適的人協助。",
      a_en:"I spent a semester on exchange in Korea and earned TOPIK Level 4. At the hotel, Korean helped me communicate with guests. For example, when a Korean guest who had been drinking asked for my personal number, I could decline politely, offer the hotel's contact number, and alert the tour guide. Language helps me connect, but I would still confirm important information and seek assistance when something exceeds my ability.",
      personalCheck:"TOPIK 級數依最新有效資料確認；若不想用界線事件，可換成妳確實記得的入住說明對話。",tip:"避免宣稱能獨力翻譯所有安全或醫療內容。"
    },
    {
      key:"harassment",group:"履歷與服務",kind:"derived",priority:1,coverage:["P11"],sources:["review"],
      q_zh:"喝醉旅客要求私人聯絡方式，甚至碰觸妳，妳會怎麼辦？",q_en:"What would you do if an intoxicated passenger asked for your personal contact details or touched you?",
      a_zh:"我會保持清楚、堅定的界線，拒絕提供私人資料，並請他停止不當碰觸。如果涉及安全威脅，我會先保持安全距離，立即依程序尋求同事和座艙長支援，不獨自忍耐或爭辯。飯店曾有醉酒旅客向我要私人電話，我改提供公務電話並提醒導遊；若升高到碰觸，處理就必須提高到人身安全與通報層次。",
      a_en:"I would set a clear boundary, decline to share personal details, and ask the passenger to stop any inappropriate contact. If there is a threat, I would keep a safe distance and seek support from colleagues and the purser according to procedure. At the hotel, I offered the official number to a guest who asked for my private number. Physical contact would require a stronger safety response, not simply more patience.",
      tip:"要求私人電話是已記錄的經驗；碰觸是本題假設，不能說成真實發生過。"
    },
    {
      key:"prioritisation",group:"履歷與服務",kind:"derived",priority:1,coverage:["P12"],sources:["stories"],
      q_zh:"同時有三位旅客需要協助，妳如何排序？",q_en:"How would you prioritise if three passengers needed help at the same time?",
      a_zh:"我會先快速確認各自需求，優先處理涉及安全、身體不適或其他急迫風險的狀況，再依時間敏感性與可用資源安排服務。我會向需要等待的旅客簡短說明，並請同事分工，不讓人以為被忽略。飯店尖峰時段讓我學到，多工不是同時答應所有人，而是有順序地處理、保持資訊清楚，並確認每項需求有人接手。",
      a_en:"I would first identify what each passenger needs, prioritising safety concerns, illness, or other urgent risks. Then I would consider time sensitivity and available resources. I would acknowledge those waiting and coordinate with colleagues so requests are not lost. Busy hotel shifts taught me that multitasking is not promising everything at once. It means setting priorities, communicating clearly, and making sure each task has someone responsible for it.",
      tip:"資訊不足時先問，不要只因旅客艙等、音量或身分決定優先順序。"
    },
    {
      key:"colleague-promise",group:"履歷與服務",kind:"derived",priority:2,coverage:["P13"],sources:["review"],
      q_zh:"同事答應旅客一件妳做不到的事，妳怎麼處理？",q_en:"What would you do if a colleague promised a passenger something you could not provide?",
      a_zh:"我會先確認同事答應的內容，以及目前資源和權限，避免誤會。如果確實無法提供，我會和同事或主管協調一致的說明，再向旅客致歉並提出可行替代方案。我不會當著旅客責怪同事，也不會為了圓場再給另一個做不到的承諾。事後再一起檢討資訊如何同步，讓旅客感受到有人負責把事情接下去。",
      a_en:"I would first confirm what was promised and check the available resources and authority. If it cannot be provided, I would coordinate a clear explanation with my colleague or supervisor, apologise, and offer a workable alternative. I would not blame my colleague in front of the passenger or make another unrealistic promise. Afterwards, we could review how to share information better and avoid repeating the problem.",
      tip:"先查明，不把『保護同事』變成對旅客隱瞞事實。"
    },
    {
      key:"filming",group:"履歷與服務",kind:"derived",priority:2,coverage:["P14"],sources:["review"],
      q_zh:"旅客拿手機拍妳，說要上網公審，妳怎麼辦？",q_en:"How would you respond if a passenger filmed you and threatened to shame you online?",
      a_zh:"我會先保持穩定，了解他不滿的原因，把注意力放在可處理的需求。我不會搶手機、爭辯或用自己的手機反拍，也會留意其他旅客的隱私與現場安全。若持續干擾工作或威脅人員，我會依公司程序請座艙長支援，清楚表達界線，並如實記錄經過。被拍攝的壓力不能讓我做出影響安全或不專業的反應。",
      a_en:"I would stay composed, understand the complaint, and focus on what can be resolved. I would not grab the phone, argue, or film back. I would also consider other passengers' privacy and safety. If the behaviour disrupts duties or threatens anyone, I would seek the purser's support under company procedures and record the facts accurately. The pressure of being filmed should not drive an unsafe or unprofessional response.",
      tip:"不要自行斷言所有拍攝都違法；依現場行為、公司規範與程序處理。"
    },
    {
      key:"unfamiliar-equipment",group:"履歷與服務",kind:"derived",priority:1,coverage:["P15"],sources:["review"],
      q_zh:"飯店遇到不會的工具會自己摸索，機上也可以嗎？",q_en:"You worked out how to use an unfamiliar tool at the hotel. Would you do the same with aircraft equipment?",
      a_zh:"不能直接類比。飯店的吸塵器故事展現我願意解決問題，但航空設備可能涉及飛安，不能靠自行試用來學習。我會依正式訓練和程序操作，不確定時立即請教合適的組員或主管，也不因為怕麻煩別人就猜測。對我而言，主動不是凡事自己做，而是主動找到安全、正確的處理方式。",
      a_en:"I would not treat them as equivalent. The vacuum story shows willingness to solve a problem, but aircraft equipment can involve safety and must not be learned through unauthorised trial and error. I would follow training and procedures and ask an appropriate crew member or supervisor when unsure. Taking initiative does not mean doing everything alone; it means actively finding the safe and correct way forward.",
      tip:"這是針對妳真實故事的關鍵追問；求援也可以是主動與可靠的表現。"
    },
    {
      key:"fatigue",group:"履歷與服務",kind:"derived",priority:1,coverage:["P16"],sources:["review"],
      q_zh:"輪班或長途飛行後很疲倦，妳如何確保工作表現？",q_en:"How would you manage fatigue from shift work or long-haul flights?",
      a_zh:"我會把休息當成工作準備，依班表安排睡眠、飲食與體能，也觀察自己的專注力和身體狀況。飯店輪班讓我理解，不能只靠意志力維持表現。若疲勞或不適已影響安全執勤，我會依公司程序如實反映，請主管評估支援或調整，而不是隱瞞硬撐。穩定的服務來自持續管理狀態，也來自知道何時需要協助。",
      a_en:"I would treat rest as part of professional preparation by planning sleep, meals, and exercise around the roster and monitoring my condition. Hotel shifts taught me that willpower alone is not a reliable strategy. If fatigue or illness affects my ability to work safely, I would report it honestly through company procedures and seek guidance. Consistent performance requires both managing my condition and recognising when support is needed.",
      tip:"不承諾永遠不累；也不把咖啡、硬撐或私人用藥當成標準解法。"
    },
    {
      key:"not-selected",group:"履歷與服務",kind:"derived",priority:2,coverage:["P17"],match:["如果這次沒錄取，你會怎麼做？"],sources:["review"],
      q_zh:"如果這次仍未錄取，妳會怎麼做？",q_en:"What would you do if you were not selected this time?",
      a_zh:"我會失望，因為我認真看待這次機會，但我不會把一次結果當成對自己的全部評價。我會記下現場題目和表現，分清楚可以改善的地方，再安排具體練習，同時持續累積服務與語言能力。如果之後仍符合招募條件，也確定這是我要的職涯，我會再次準備。我希望每一次應考都能帶來實際成長，而不是只重複同一份答案。",
      a_en:"I would be disappointed because this opportunity matters to me, but I would not treat one result as a complete judgement of my ability. I would review the questions and my performance, identify changes I can make, and continue developing service and language skills. If I remain eligible and committed to this career, I would prepare to apply again. Each attempt should lead to real improvement, not just another repetition.",
      tip:"承認正常情緒，再說明可執行的下一步；不聲稱知道未錄取的官方原因。"
    },
    {
      key:"life-learning",group:"履歷與服務",kind:"derived",priority:2,coverage:["P18"],sources:["stories"],
      q_zh:"除了工作，妳最近在學什麼、喜歡什麼？",q_en:"What do you enjoy or learn outside work?",
      a_zh:"工作之外，我喜歡維持韓文學習，也透過運動整理自己的狀態。交換經驗讓我發現，語言不只是考試，而是能更直接理解別人的生活。我會把學習放進日常，例如練習把常見需求說得更清楚。對我而言，有固定投入的事情能讓生活保持節奏，也提醒我進步來自持續練習，而不是一次表現。",
      a_en:"Outside work, I enjoy maintaining my Korean and staying active. My exchange experience showed me that language is not only about an exam; it also helps me understand how other people live. I try to connect learning with everyday situations, such as expressing common requests more clearly. Having regular interests gives my life balance and reminds me that progress comes from consistent practice rather than a single performance.",
      personalCheck:"把最近確實在做的活動、頻率或一個新學到的內容補進去；沒有持續做的興趣就換掉。",tip:"這題可以自然聊生活，不必每句都硬接航空。"
    },
    {
      key:"why-now",group:"英文核心",kind:"derived",priority:1,englishCore:true,coverage:["E2.now"],sources:["review"],
      q_zh:"為什麼是現在選擇成為空服員？",q_en:"Why is now the right time for you to become a cabin crew member?",
      a_zh:"現在我對第一線服務有實際理解，也更清楚自己為什麼想走航空業。一年的飯店工作讓我面對過客訴、語言差異和忙碌時的協調；以前的面試則提醒我，服務熱情之外還需要安全觀念與清楚的判斷。我希望在這個基礎上接受新的專業訓練，把累積轉成下一階段的能力，而不是只因為嚮往工作外表就轉職。",
      a_en:"Now I have practical experience in frontline service and a clearer reason for choosing aviation. A year at the hotel exposed me to complaints, language differences, and busy-team coordination. Earlier interviews also reminded me that enthusiasm must be supported by safety awareness and sound judgement. I am ready to build on that foundation through professional training and take on a new responsibility with a more realistic understanding of the role.",
      tip:"英文『Why China Airlines, and why now?』可合併此題與『為什麼選華航』各一個重點，避免講成兩篇長稿。"
    },
    {
      key:"hotel-vs-cabin",group:"英文核心",kind:"derived",priority:1,englishCore:true,coverage:["E3"],match:["你覺得空服員和飯店櫃檯最大的差異是什麼？你怎麼確定你可以適應？"],sources:["review"],
      q_zh:"飯店櫃檯與空服員最大的不同是什麼？妳如何適應？",q_en:"What is the biggest difference between hotel service and cabin crew duties, and how would you adapt?",
      a_zh:"兩者都需要傾聽、溝通與合作，但空服員在有限的客艙環境裡，還直接負有安全、保安與應變責任，可取得的資源也不同。飯店經驗能幫助我穩定面對旅客，但不能直接取代航空訓練。我會把自己當成新人，依正式程序學習、反覆演練並接受回饋，保留已有的服務態度，同時建立新工作的判斷方式。",
      a_en:"Both roles require listening, communication, and teamwork. Cabin crew also have direct safety, security, and emergency responsibilities in a confined environment with different resources. My hotel experience helps me stay composed with guests, but it does not replace aviation training. I would adapt as a beginner: learn the official procedures, practise, and accept feedback, while bringing the service attitude I have already developed.",
      tip:"不要只回答一個在地上、一個在空中；講出責任、資源與學習方式。"
    }
  ];
  /* Append new topics after the original 39: saved negative IDs must remain stable. */
  const CI_INDUSTRY_ITEMS=[
    {
      key:"europe-bomb-threats",kind:"news",priority:1,coverage:["I1.main"],sources:["industryBombs"],
      q_zh:"歐洲近期多個航班接獲炸彈威脅，妳怎麼看航空保安？",q_en:"What do the recent bomb threats against flights in Europe tell you about aviation security?",
      fact:"Reuters 11 月 6 日彙整：11 月 2–6 日歐洲多家航空公司航班遭炸彈威脅，出現轉降與安全檢查；該報導時點尚未發現爆裂物。不能因此預先把下一次威脅當成惡作劇。",
      fact_en:"Reuters' 6 November roundup described bomb threats affecting several airlines in Europe on 2–6 November, with diversions and security checks. No explosives had been found at that reporting point.",eventDate:"2026-11-02 至 2026-11-06",newsStatus:"報導截至 11/6；未發現爆裂物不等於可以忽略威脅",
      a_zh:"我關注到歐洲近期有多個航班因炸彈威脅接受檢查或轉降。即使報導當時沒有找到爆裂物，每一次警訊仍需要認真處理。對空服員而言，我認為重點是依保安程序通報、維持客艙秩序，並清楚傳達獲准發布的指示。旅客可能因資訊不足而害怕，我會用穩定的語氣協助他們配合，同時避免轉述網路猜測或自行保證沒有危險。",
      a_en:"I have been following the bomb threats affecting flights across Europe. Even though no explosives had been found in the reported cases, each warning still needed a serious response. For cabin crew, the priorities are reporting through security procedures, keeping the cabin orderly, and communicating approved instructions calmly. I would help worried passengers understand what they need to do, without repeating online speculation or promising that there is no risk.",
      tip:"順序：一個已確認事實 → 保安不能憑感覺 → 空服員的通報與溝通。不要自行判定恐嚇真假或公開保安細節。"
    },
    {
      key:"security-joke",parentKey:"europe-bomb-threats",kind:"followup",priority:1,coverage:["I1.follow"],sources:["industryBombs"],
      q_zh:"旅客說行李裡有炸彈，接著又說只是開玩笑，妳怎麼做？",q_en:"A passenger says there is a bomb in their bag, then says it was a joke. What would you do?",
      a_zh:"我會保持冷靜，把這句話視為需要通報的保安資訊，不會因為對方說是玩笑就自行結案。我會依公司訓練，立即向座艙長及相關人員回報原話、位置與觀察到的情況，並依指示處理客艙。面對旅客，我會清楚說明這類言論必須依程序處理，請他配合。我不會自行搜查可疑物品、與對方爭論，也不會向其他旅客散播未確認的內容。",
      a_en:"I would stay calm and treat the statement as security information that must be reported, even if the passenger later calls it a joke. Following my training, I would promptly report the exact words, location, and observed circumstances to the senior crew member and follow instructions. I would explain that such statements require a formal response and ask the passenger to cooperate. I would not investigate a suspicious item on my own or spread unconfirmed details.",
      tip:"假設情境，不是事件中已確認的旅客行為。說出原話通報、服從指揮、避免自行處置；不背誦未受訓的搜索程序。"
    },
    {
      key:"flydubai-security",kind:"news",priority:1,coverage:["I2.main"],sources:["flydubaiOps","flydubaiCEO"],
      q_zh:"flydubai FZ1073 駕駛艙保安事件，讓妳想到空服員哪些責任？",q_en:"What cabin crew responsibilities come to mind after the flydubai FZ1073 security incident?",
      fact:"9 月 30 日杜拜往特拉維夫的 FZ1073 發生駕駛艙保安事件，轉降沙烏地阿拉伯並安全落地。航空公司 10 月 1 日公告暫停以色列航班以配合調查，執行長 10 月 2 日感謝協助的機組與旅客。此處不判定涉案者動機或司法責任。",
      fact_en:"FZ1073 from Dubai to Tel Aviv diverted to Saudi Arabia after a flight-deck security incident on 30 September and landed safely. The airline's 1 October notice cited an investigation; its CEO thanked the crew and assisting passengers on 2 October.",eventDate:"2026-09-30",newsStatus:"保留航空公司 10/1 公告及 10/2 說明；不作動機或司法判決",
      a_zh:"九月底 flydubai 駕駛艙保安事件讓我更清楚，空服員的責任包含保安、觀察與團隊溝通。我不會只根據社群影片推論整起事件，而會先確認官方資訊。若在工作中發現異常，我會及早依程序回報，讓有權責的人員掌握情況；同時依指示維持客艙秩序，協助旅客配合。我希望成為能穩定提供資訊與支援的隊友，而不是在緊急時各自判斷、各自採取行動。",
      a_en:"The September flydubai flight-deck incident reminds me that cabin crew responsibilities include security, observation, and clear teamwork. I would rely on official information rather than draw conclusions from social media videos. At work, I would report unusual behaviour early through the proper channels, follow the crew's coordinated instructions, and help passengers cooperate. My goal would be to support a calm, organised response, with accurate information reaching the people responsible for decisions.",
      tip:"可談保安意識與團隊合作；不要把新聞中的個人行為推論成某國籍、宗教或職業群體的特徵，也不要假裝掌握駕駛艙應變程序。"
    },
    {
      key:"security-trust",parentKey:"flydubai-security",kind:"followup",priority:1,coverage:["I2.follow"],sources:["flydubaiOps"],
      q_zh:"旅客因這則新聞說「我不信任機組人員」，妳會怎麼回答？",q_en:"How would you respond to a passenger who says this news has made them lose trust in flight crews?",
      a_zh:"我會先理解他的不安，不會立刻反駁或要求他別想太多。我會說，看到這類新聞感到擔心是可以理解的，並說明我們的工作會依正式訓練、保安程序及團隊分工進行。我不會代表調查單位評論個案，也不會保證零風險。如果他有具體需要，例如想再次了解安全說明，我會耐心協助；若焦慮影響搭機，我會通知座艙長，一起提供適當支援。",
      a_en:"I would acknowledge the passenger's concern before offering reassurance. I might say that it is understandable to feel worried after such news, and explain that our work follows formal training, security procedures, and coordinated responsibilities. I would not comment on an investigation or promise zero risk. I would ask what would help them feel more comfortable, review safety information if needed, and involve the senior crew member if further support was required.",
      tip:"練習有同理心的回應，不以『保證絕對安全』或貶低其他航空公司換取信任。"
    },
    {
      key:"uk-atc-outage",kind:"news",priority:1,coverage:["I3.main"],sources:["natsOutage"],
      q_zh:"英國航管系統故障造成大規模航班受影響，妳學到什麼？",q_en:"What did you learn from the UK air traffic control system outage and the resulting flight disruption?",
      fact:"NATS 9 月 18 日初步報告說明，9 月 8 日英國航管事件涉及飛航資料系統一部分的軟體缺陷，造成廣泛旅運中斷；NATS 表示與 2023 年事件無關。這是該次初步報告的說法，不應自行改稱網路攻擊。",
      fact_en:"NATS' preliminary report of 18 September attributed the 8 September UK disruption to a software defect in part of its flight data system. It said the incident was unrelated to the 2023 outage.",eventDate:"2026-09-08；初步報告 2026-09-18",newsStatus:"NATS 初步報告；不是自行認定的駭客攻擊",
      a_zh:"九月英國航管故障提醒我，航空服務的可靠度也取決於航管與資訊系統，不能只看單一航班。系統故障時，第一線人員更需要一致而誠實的溝通。我會確認目前已知的影響、下一次更新時間，以及哪些需求要轉交地勤，特別留意轉機與需要協助的旅客。我在飯店學到，無法立即排除問題時，讓客人知道有人持續跟進，比給一個沒有根據的恢復時間更有幫助。",
      a_en:"September's UK outage showed me how much air travel depends on air traffic control and information systems. During an outage, frontline staff need to give consistent, honest updates. I would confirm what is known, when the next update will come, and which passenger needs require ground support, especially missed connections or assistance needs. My hotel experience has taught me that reliable follow-up is more helpful than giving a recovery time that has not been confirmed.",
      tip:"分清航管系統故障、航空公司訂位系統故障與資安攻擊；不能只因『系統出問題』就把三者混為一談。"
    },
    {
      key:"outage-no-eta",parentKey:"uk-atc-outage",kind:"followup",priority:1,coverage:["I3.follow"],sources:["natsOutage","review"],
      q_zh:"系統何時恢復還不知道，旅客卻一直要求確切起飛時間，怎麼辦？",q_en:"Passengers demand an exact departure time, but the system recovery time is unknown. What would you say?",
      a_zh:"我會先承認等待會影響他的行程，再把已確認與尚未確認的資訊分開說清楚。我會說，目前仍在等待系統恢復及航班確認，因此還不能提供可靠的起飛時間；我會在下一次指定更新時點回來說明，即使當時沒有新的進度也會告知。我也會詢問是否有轉機、用藥或其他急迫需求，依程序協調支援，避免只反覆說請稍候，卻沒有實際跟進。",
      a_en:"I would acknowledge how the uncertainty affects the passenger's plans and separate confirmed information from what is still unknown. I would explain that we cannot give a reliable departure time yet, then provide a specific time for the next update, even if there is no change. I would also ask about urgent needs, such as a connection or access to medication, and coordinate support within my role rather than simply repeat, 'Please wait.'",
      tip:"可以承諾下一次回報時間；不要把預估時間說成確定起飛時間，也不要擅自承諾補償或改票結果。"
    },
    {
      key:"miami-cargo-accident",kind:"news",priority:1,coverage:["I4.main"],sources:["miamiCargo"],
      q_zh:"21 Air 貨機在邁阿密衝出跑道的事故，對航空業有什麼提醒？",q_en:"What lessons do you take from the 21 Air cargo aircraft runway overrun in Miami?",
      fact:"NTSB 資料記載，21 Air 7598 貨機於 9 月 6 日在邁阿密落地後衝出跑道，撞及地面車輛，造成地面人員死亡與受傷。10 月 1 日更新仍屬初步資料，調查頁標示進行中；不能據此判定最終肇因。",
      fact_en:"NTSB records describe the 6 September runway overrun of 21 Air flight 7598 in Miami, involving ground vehicles and fatal ground injuries. Its 1 October update is preliminary, and the investigation page lists the investigation as ongoing.",eventDate:"2026-09-06；調查更新 2026-10-01",newsStatus:"NTSB 初步資料／調查進行中；未有最終肇因結論",
      a_zh:"九月邁阿密的 21 Air 貨機事故讓我想到，航空安全保護的不只是機上的人，也包括地面工作者。我會尊重調查程序，不從零碎影片判定是某一個人或機型的問題。雖然空服員不負責操縱飛機，但我們仍需把異常回報、客艙檢查及交接做確實。對我而言，可靠的服務來自整個團隊把各自的安全責任完成，也願意在發現風險時及早說出來。",
      a_en:"The September 21 Air accident in Miami reminds me that aviation safety also protects people working on the ground. I would respect the investigation and avoid blaming a person or aircraft type based on short video clips. Although cabin crew do not operate the aircraft, we contribute through accurate reporting, cabin checks, and clear handovers. Reliable service depends on every team completing its safety responsibilities and speaking up when something needs attention.",
      tip:"貨機事故可談全系統安全與地面同仁；不需要背黑盒子參數，也不要把初步資料中的單一發現說成唯一事故原因。"
    },
    {
      key:"accident-aircraft-fear",parentKey:"miami-cargo-accident",kind:"followup",priority:2,coverage:["I4.follow"],sources:["miamiCargo"],
      q_zh:"旅客說「這個機型出過事故，所以一定不安全」，妳會如何回應？",q_en:"A passenger says an aircraft type must be unsafe because one has been involved in an accident. How would you respond?",
      a_zh:"我會先傾聽他最擔心的地方，承認事故新聞確實可能讓人不安。我不會自行做機型安全排名，也不會用一句都是人為疏失來結束對話。我會說，個別事故需要由調查單位釐清，而我們會依適用的安全要求與正式程序執行工作。如果他希望了解本次飛行的具體資訊，我會在職責範圍內說明，必要時請座艙長協助，不以猜測取代專業資訊。",
      a_en:"I would listen to the passenger's specific concern and acknowledge that accident news can be unsettling. I would not rank aircraft types myself or dismiss the accident as human error. I would explain that an accident requires a formal investigation and that our operation follows applicable safety requirements and procedures. For questions about this flight, I would share information within my role and ask the senior crew member for help when needed.",
      tip:"同理、資訊界線、尋求適當協助；避免『一定安全』『一定是駕駛錯誤』這類沒有根據的保證。"
    },
    {
      key:"jetstar-runway-incursion",kind:"news",priority:1,coverage:["I5.main"],sources:["townsville"],
      q_zh:"捷星在澳洲發生跑道入侵近失事件，為什麼沒有撞上也值得重視？",q_en:"Why does the Jetstar runway incursion in Australia matter even though there was no collision?",
      fact:"ATSB 記載，10 月 7 日捷星 JQ908 進場湯斯維爾機場時，機組發現一輛廂型車進入跑道。飛機最後落地，無人受傷、無損害；10 月 26 日頁面更新顯示仍在調查。這是跑道入侵近失事件，不是兩架飛機相撞。",
      fact_en:"ATSB is investigating a 7 October runway incursion at Townsville involving Jetstar JQ908 and a ground vehicle. The aircraft landed with no injuries or damage. The investigation was active in the 26 October update.",eventDate:"2026-10-07；調查更新 2026-10-26",newsStatus:"ATSB 調查中；無碰撞、無人受傷，仍屬嚴重事件",
      a_zh:"十月捷星的跑道入侵事件雖然沒有碰撞，仍然有風險。這提醒我，安全管理也要從尚未造成傷害的警訊中學習，而不是等到事故才處理。以空服員的角色來說，我會確實完成自己的檢查，對看見的異常清楚回報，交接時也確認對方收到關鍵資訊。我不會評論跑道操作的技術責任，但會把這種及早發現、及早通報的態度帶進工作。",
      a_en:"October's Jetstar runway incursion shows that a near miss still involves risk. It reminds me that safety teams must learn from warning signs before people are hurt. In a cabin crew role, I would complete my checks, report what I actually observed, and make sure important information is received during handovers. I would leave technical runway decisions to the responsible professionals while bringing the same habit of early reporting to my work.",
      tip:"near miss＝近失；runway incursion＝跑道入侵。說明為何應回報，不把自己放到航管或駕駛的職責。"
    },
    {
      key:"near-miss-report",parentKey:"jetstar-runway-incursion",kind:"followup",priority:1,coverage:["I5.follow"],sources:["townsville"],
      q_zh:"同事說「又沒有人受傷，不用通報了」，妳會怎麼做？",q_en:"A colleague says, 'No one was hurt, so there is no need to report it.' What would you do?",
      a_zh:"我會平靜說明，通報的目的在讓團隊了解風險，避免下一次真的造成傷害，不是先找人責備。如果情況涉及安全，我會依規定向座艙長或指定管道回報觀察到的事實、時間與位置，不會因同事覺得麻煩而省略。我也會願意聽他的說明，必要時請主管協助確認通報要求，但不會私下約定把事情當作沒有發生。",
      a_en:"I would explain calmly that reporting helps the team understand a risk and prevent future harm; it is not about immediately blaming someone. If the situation involved safety, I would follow the reporting requirements and provide the facts, time, and location through the proper channel. I would listen to my colleague and ask a supervisor to clarify any uncertainty, but I would not agree to hide an event simply because no one was injured.",
      tip:"尊重同事仍可堅持通報；講實際觀察，區分通報風險與判定責任。"
    },
    {
      key:"middle-east-airspace",kind:"news",priority:1,coverage:["I6.main"],sources:["conflictAirspace"],
      q_zh:"中東衝突與機場遭攻擊如何影響民航？空服員可以做什麼？",q_en:"How do conflict and attacks on airports in the Middle East affect civil aviation, and what can cabin crew do?",
      fact:"EASA 10 月 9 日修訂沙烏地阿拉伯空域風險通報，提及利雅德及機場遭飛彈、無人機攻擊，對指定區域建議不飛，其餘空域提高警覺與應變規劃。該版列有效至 11 月 16 日、可能提前檢討；不是全球航空公司一律禁飛整個中東。",
      fact_en:"EASA's 9 October revision of its Saudi airspace bulletin described missile and drone risks, recommended avoiding specified areas, and urged caution elsewhere. That version listed validity to 16 November, subject to earlier review; it was not a worldwide ban on all Middle Eastern airspace.",eventDate:"2026 年 9–10 月風險升高；通報修訂 2026-10-09",newsStatus:"EASA 區域風險通報；適用對象、範圍與期限需個別確認",
      a_zh:"EASA 近期的沙烏地空域通報讓我看到，航線可能因外部安全風險臨時改道、停飛或轉降，不能只以準點衡量服務。航路與飛行決策需要由專業單位依最新資訊判斷；空服員則要熟悉當班簡報，配合調整，並留意客艙需求。我會清楚轉達已確認的安排，協助受影響旅客，也避免評論政治立場或擅自保證某條航線絕對沒有風險。",
      a_en:"The recent EASA bulletin on Saudi airspace shows how external security risks can lead to rerouting, cancellations, or diversions, so punctuality cannot be the only measure of service. Route decisions belong to the professionals assessing current information. Cabin crew need to understand the flight briefing, adapt to changes, and monitor passenger needs. I would communicate confirmed arrangements and support affected passengers, without debating politics or promising that a particular route carries no risk.",
      tip:"以空域風險、航班調整、旅客協助作答；不提供自己的飛行路線判斷。面試前重查最新通報，不能把 11/16 當永久期限。"
    },
    {
      key:"diversion-connection",parentKey:"middle-east-airspace",kind:"followup",priority:1,coverage:["I6.follow"],sources:["conflictAirspace"],
      q_zh:"因空域風險改道，旅客擔心接不上下一班飛機，妳怎麼協助？",q_en:"A flight is rerouted because of airspace risk, and a passenger fears missing a connection. How would you help?",
      a_zh:"我會先確認他的轉機資訊與急迫需求，說明目前已獲確認的航班安排及可提供的協助，不會先保證一定趕得上。如果允許，我會依公司流程將資訊交給座艙長及地勤，協助後續轉機處理；同時提醒他留意正式通知。對需要特別照顧的旅客，我會主動確認需求並交接，讓資訊與照顧能延續到落地，而不是只回答這不在我的職責。",
      a_en:"I would check the passenger's connection details and urgent needs, then explain the confirmed arrangements without promising they will make the next flight. Following company procedures, I would pass the information to the senior crew member and ground team for further assistance. I would also help the passenger follow official updates and hand over any special assistance needs so that support could continue after landing.",
      tip:"可協調、可交接，不能承諾放行、保留航班或保證所有費用由公司負擔。"
    },
    {
      key:"ebola-travel-attestation",kind:"news",priority:1,coverage:["I7.main"],sources:["ebolaOrder"],
      q_zh:"美國近期因伊波拉疫情新增赴美航空旅客聲明要求，妳怎麼看？",q_en:"What is your view on the recent Ebola-related attestation requirement for air travel to the United States?",
      fact:"CDC 命令於 10 月 28 日簽署，列明美東標準時間 11 月 3 日 23:59 起，適用的國外赴美航班旅客須提交已簽署聲明，確認登機前 21 日未曾在剛果民主共和國。命令有豁免與期限，最晚至 12 月 18 日，或提前撤銷／修改；不能泛稱所有非洲旅客禁搭。",
      fact_en:"The CDC order signed on 28 October applies from 11:59 p.m. EST on 3 November. Covered travellers boarding US-bound flights from abroad must provide a signed attestation about not having been in the DRC during the preceding 21 days. Exemptions and an expiry provision apply.",eventDate:"2026-10-28 簽署；2026-11-03 23:59 美東標準時間生效",newsStatus:"限時公共衛生命令；有豁免，適用性須查當日官方規定",
      a_zh:"我認為公共衛生措施需要準確執行，也需要讓旅客理解。這次赴美旅客聲明要求提醒我，第一線人員不能只憑過去經驗，必須依當日公告確認適用對象與文件。我會以中性、清楚的方式協助旅客理解要求，保護健康與個資，遇到不確定情況交由指定人員處理。對我而言，尊重旅客也包含不因國籍、外貌或口音，就自行推測他的旅遊史或健康狀況。",
      a_en:"I believe public health measures need both accurate implementation and clear communication. The new US-bound travel attestation reminds me that frontline staff must check current requirements rather than rely on memory. I would help passengers understand the process respectfully, protect their privacy, and refer uncertain cases to the designated staff. I would never assume someone's travel history or health condition from their nationality, appearance, or accent.",
      tip:"用作時事與溝通練習，不自行診斷或認定豁免資格。DRC 是剛果民主共和國；核對時區、適用對象、更新及期限。"
    },
    {
      key:"health-form-refusal",parentKey:"ebola-travel-attestation",kind:"followup",priority:1,coverage:["I7.follow"],sources:["ebolaOrder"],
      q_zh:"旅客說自己很健康，不願填寫適用的健康聲明，妳怎麼回應？",q_en:"A passenger says they are healthy and refuses a required health attestation. How would you respond?",
      a_zh:"我會先確認這份文件確實適用，再說明它是該航程需要完成的要求，不是由我依外觀判斷他是否健康。我會提供正式說明，協助他理解填寫方式，但不代替他回答或要求他填不實內容。如果仍拒絕，我會請負責的地勤或主管依規定處理，不自行允許例外，也不在其他旅客面前討論他的健康與旅遊史。我會保持尊重，同時清楚說明未完成可能影響登機。",
      a_en:"I would first confirm that the requirement applies, then explain that it is a travel requirement rather than a personal judgement about the passenger's health. I would provide the official guidance and help them understand the form without answering for them or encouraging an inaccurate statement. If they still refused, I would refer the matter to the responsible ground staff or supervisor, protect their privacy, and explain that incomplete documentation could affect boarding.",
      tip:"先確認適用再說明；不要說『看起來健康就沒關係』。空服員不能擅自核准文件例外或保證入境。"
    },
    {
      key:"fuel-surcharge-news",kind:"news",priority:2,coverage:["I8.main"],sources:["fuelSurcharge"],
      q_zh:"近期國際線燃油附加費調漲，妳怎麼看票價與服務期待？",q_en:"How do you view the recent fuel surcharge increase and its effect on passenger expectations?",
      fact:"民航局 11 月 2 日公告，國籍航空公司國際線客運燃油附加費自 11 月 8 日起，短程由 37.5 調為 40 美元、長程由 97.5 調為 104 美元，並要求充分揭露資訊。實際票價、計收與票務處理仍需查航空公司及票券條件。",
      fact_en:"Taiwan's CAA announced on 2 November that international passenger fuel surcharges for Taiwanese carriers would rise from 8 November: short-haul from US$37.50 to US$40, and long-haul from US$97.50 to US$104, with clear disclosure required.",eventDate:"2026-11-02 公告；2026-11-08 生效",newsStatus:"國籍航空國際線燃油附加費公告；不等於所有票價固定上漲同一金額",
      a_zh:"我關注到十一月的燃油附加費調漲。燃油成本變動讓航空公司面對營運壓力，也會讓旅客更在意資訊是否透明、服務是否值得。我認為第一線人員需要理解費用的基本說明，但不應臆測個別票價。我會把能確認的資訊說清楚，票務問題交由適當管道處理。在自己的職責上，我會維持細心與回應速度，讓旅客感受到被尊重；同時也理解成本控制不能省略必要的安全措施。",
      a_en:"I followed Taiwan's November fuel surcharge increase. Changing fuel costs put pressure on airlines and make passengers more sensitive to value and transparency. Frontline staff should understand the basic explanation without guessing how an individual ticket was priced. I would share confirmed information and refer ticketing questions to the appropriate team. Within my role, I would maintain attentive, responsive service so passengers feel respected, while recognising that cost control must never remove necessary safety measures.",
      tip:"區分票價、稅費與燃油附加費；不要承諾補收、退差額或把本次級距當作所有國家的統一規定。"
    },
    {
      key:"fare-service-complaint",parentKey:"fuel-surcharge-news",kind:"followup",priority:2,coverage:["I8.follow"],sources:["fuelSurcharge"],
      q_zh:"旅客說「機票變貴，服務卻沒變好」，妳會怎麼回答？",q_en:"A passenger says, 'Tickets cost more, but the service is no better.' How would you respond?",
      a_zh:"我會先聽他具體覺得哪個部分沒有達到期待，不會立刻拿油價當理由反駁。如果是我能立即改善的需求，例如回應不夠清楚或協助尚未完成，我會先處理並回來確認。若涉及票價或產品內容，我會提供正確的聯絡管道並協助留下意見，不承諾自己無權決定的優惠。我希望把他的不滿轉成可以跟進的問題，而不是只說成本上升請見諒。",
      a_en:"I would ask which part of the experience fell short instead of immediately using fuel prices as a defence. If I could improve something now, such as an unclear response or an unfinished request, I would address it and check back. For pricing or product concerns, I would help the passenger reach the appropriate channel and record the feedback, without promising an unauthorised discount. The aim is to turn frustration into something we can follow up.",
      tip:"先處理具體服務落差，再說明費用；同理不代表承認未查明的錯誤或擅自允諾升等。"
    },
    {
      key:"iata-biometrics-ai",kind:"news",priority:2,coverage:["I9.main"],sources:["iataPassenger"],
      q_zh:"IATA 調查顯示旅客更接受生物辨識與 AI，妳認為人員服務會被取代嗎？",q_en:"As IATA's survey shows greater use of biometrics and AI, do you think human service will be replaced?",
      fact:"IATA 10 月 28 日發布 2026 全球旅客調查，指出生物辨識與 AI 的使用、接受度提升，入境要求仍是旅行障礙。這是受訪旅客的調查結果，不代表所有機場已全面採用，也不是取消護照或簽證要求。",
      fact_en:"IATA's 28 October Global Passenger Survey highlighted growing use and acceptance of biometrics and AI, while entry requirements remained a barrier. Survey preferences do not mean these technologies are deployed at every airport or replace travel-document requirements.",eventDate:"2026-10-28 調查發布",newsStatus:"IATA 旅客調查；不是全球機場已實施的統一制度",
      a_zh:"IATA 最新旅客調查呈現了數位服務的趨勢。我認為科技會改變服務分工，但旅客仍需要有人理解例外與不安。生物辨識與 AI 可以讓部分流程更有效率，第一線人員則能把時間用在需要協助的人身上。我曾協助一位哥倫比亞旅客處理不熟悉的線上報到，讓我理解數位工具好用，不代表每位客人都能獨立操作。我會學習新工具，也保留清楚說明、保護個資及必要時尋求人工支援的能力。",
      a_en:"IATA's latest passenger survey highlights a shift towards digital services. I think technology will change service roles, but passengers will still need people who understand unusual situations and anxiety. Biometrics and AI can simplify some processes, allowing staff to focus on those who need help. I once assisted a Colombian guest with an unfamiliar online check-in process, which taught me that a useful tool is not automatically easy for everyone. I would learn new tools while maintaining clear explanations, privacy awareness, and access to human support.",
      tip:"可連結本人哥倫比亞旅客線上報到故事；別與加拿大旅客租車混淆。調查趨勢不等於通關規則或 AI 可以決定安全例外。"
    },
    {
      key:"biometric-human-option",parentKey:"iata-biometrics-ai",kind:"followup",priority:2,coverage:["I9.follow"],sources:["iataPassenger"],
      q_zh:"旅客擔心臉部辨識會外洩個資，或不會用自助設備，妳怎麼協助？",q_en:"How would you help a passenger who worries about facial recognition privacy or cannot use a self-service device?",
      a_zh:"我會先確認他是不熟悉操作，還是擔心資料使用，兩種需求需要不同的協助。若需要操作說明，我會先徵求同意，再一步一步引導，避免代為掌握密碼或不必要的個資。若是隱私疑慮，我會提供官方說明，確認現場可用的人工處理方式並協助轉介，不會保證資料永不外洩。需要完成的身分查驗仍須遵守，不能為了加快速度就自行略過。",
      a_en:"I would first find out whether the passenger needs help operating the device or understanding how their data is used. With permission, I would guide them step by step without taking control of passwords or unnecessary personal information. For privacy concerns, I would provide official guidance and check what staffed alternatives are available. I would not promise that a data breach is impossible or bypass required identity checks just to make the process faster.",
      tip:"人工選項要先查現場是否提供，不能一概保證可拒絕任何邊境查驗。重點是同意、最少必要資料與適當轉介。"
    },
    {
      key:"korean-asiana-integration",kind:"news",priority:2,coverage:["I10.main"],sources:["koreanAsiana"],
      q_zh:"大韓與韓亞航空即將進一步整合，妳認為航空合併的挑戰是什麼？",q_en:"What challenges do you see in the upcoming integration of Korean Air and Asiana Airlines?",
      fact:"韓亞航空 9 月 15 日公告哩程整合計畫，列整合日為 2026 年 12 月 17 日，相關會員條款與個資移轉有不同安排。截至本題 11 月 10 日查核，這仍是未來日期；不能說所有哩程、會員權益及流程已全面合一。",
      fact_en:"Asiana's 15 September notice sets 17 December 2026 as the integration date for the announced mileage arrangements and related terms. On this guide's 10 November check date, that date is still in the future; not all benefits and processes should be described as already unified.",eventDate:"2026-09-15 公告；預定整合日 2026-12-17",newsStatus:"已公告的未來整合安排；實際服務與會員條件需個別確認",
      a_zh:"大韓與韓亞預定十二月的整合，讓我想到挑戰不只在品牌，也包括系統、服務標準與旅客權益的銜接。對旅客而言，最重要的是清楚知道訂位、哩程與原有權益會如何處理。第一線人員需要跟上公告、分清已生效與尚未生效的安排，不憑印象回答。我會把韓語溝通能力用在確認旅客需求，並查明正式資訊；語言能力能幫助理解，但不能取代對規則的核對。",
      a_en:"Korean Air and Asiana's planned December integration involves more than branding. Systems, service standards, and passenger benefits also need a clear transition. Passengers want to know what will happen to their bookings, miles, and existing benefits. Frontline staff must distinguish between arrangements already in effect and those planned for later. I would use my Korean communication skills to understand a passenger's concern, then verify the official information rather than assume language ability means I know every rule.",
      tip:"很適合連結韓語優勢；不要背未查證的哩程兌換比例，也不要將預定 12/17 說成已完成。"
    },
    {
      key:"merger-benefit-confusion",parentKey:"korean-asiana-integration",kind:"followup",priority:2,coverage:["I10.follow"],sources:["koreanAsiana"],
      q_zh:"合併期間旅客認為自己應有某項會員權益，但系統沒有顯示，妳怎麼做？",q_en:"During an airline integration, a passenger expects a membership benefit that the system does not show. What would you do?",
      a_zh:"我會先聽清楚他期待的權益，確認旅程日期與相關資料，再請有權限的單位核對當時適用的規定。我不會只因系統沒顯示就否定旅客，也不會立刻答應額外待遇。如果需要等待，我會說明目前正在確認哪個部分，以及下一步由誰回覆；完成後也會確認結果有交接。這與飯店處理會員需求一樣，需要把資訊查清楚，避免不同人員給出互相矛盾的承諾。",
      a_en:"I would listen to the benefit the passenger expects, check the travel date and relevant information, and ask the authorised team to verify the applicable rules. I would neither dismiss the passenger because of a missing system entry nor immediately promise an extra benefit. If verification took time, I would explain what was being checked and who would follow up, then ensure a clear handover so different staff did not make conflicting promises.",
      tip:"確認當日規則、權限與交接；不把本人過往會員溝通失誤改寫成曾處理航空合併的真實經驗。"
    },
    {
      key:"western-sydney-opening",kind:"news",priority:2,coverage:["I11.main"],sources:["westernSydney"],
      q_zh:"西雪梨國際機場正式啟用，妳覺得新機場為航空服務帶來什麼機會與挑戰？",q_en:"What opportunities and service challenges come with the opening of Western Sydney International Airport?",
      fact:"西雪梨國際機場公告，10 月 25 日正式迎接首批客運航班，採 24 小時營運，為雪梨增加航空容量與選擇。它與既有雪梨機場是不同機場；新機場啟用不代表所有航空公司或航線同日進駐。",
      fact_en:"Western Sydney International announced its opening and first passenger flights on 25 October, adding a 24-hour airport to the Sydney market. It is a separate airport from the existing Sydney airport, and airlines have different service launch dates.",eventDate:"2026-10-25 客運啟用",newsStatus:"已啟用；各航空公司進駐與地面交通資訊另查最新公告",
      a_zh:"西雪梨機場十月啟用，能增加運能與旅客選擇，也帶來新的工作與航線機會。但對第一次使用的旅客來說，機場名稱、交通方式和報到位置都可能不熟悉。我認為好的服務要把資訊講得具體，不能只說到了雪梨就好。我會在職責範圍內協助確認正確機場與後續聯繫方式，遇到不確定的轉乘資訊則查官方來源，讓旅客的整段旅程更順暢。",
      a_en:"Western Sydney's October opening adds capacity, travel choices, and opportunities for routes and jobs. However, first-time users may be unfamiliar with the airport name, transport options, or check-in location. Good service needs specific information rather than simply saying 'Sydney.' Within my role, I would help passengers confirm the correct airport and relevant contacts, using official sources for unfamiliar transfer information so that support extends beyond the flight itself.",
      tip:"WSI 與既有 SYD 不同；不要保證兩機場可快速轉機、同航廈或已有鐵路直達。焦點放在資訊清楚與旅程銜接。"
    },
    {
      key:"wrong-airport-help",parentKey:"western-sydney-opening",kind:"followup",priority:2,coverage:["I11.follow"],sources:["westernSydney","stories"],
      q_zh:"旅客因城市有兩座機場而訂錯接送，妳會如何協助？",q_en:"A passenger booked a transfer to the wrong airport in a city with two airports. How would you help?",
      a_zh:"我會先核對他實際的航班、機場代碼及接送資訊，避免在錯誤資訊上繼續安排。接著在可協助的範圍內，提供官方交通資訊或聯繫地勤，幫他了解下一步，但不保證趕得上或自行估一個不可靠的車程。我曾協助加拿大旅客找租車替代方案，知道有幫助的服務是先把條件問清楚，再確認可行選項，最後讓對方清楚知道怎麼做。",
      a_en:"I would first verify the actual flight, airport code, and transfer booking so that we did not build another plan on incorrect information. I would then provide official transport information or coordinate with ground staff within my role, without guaranteeing arrival times. Helping a Canadian hotel guest find an alternative rental car taught me to clarify the situation first, check realistic options, and make the next steps easy to understand.",
      tip:"這是新機場衍生假設題；真實加拿大故事僅是飯店租車，不要改成曾處理雪梨接送事故。"
    },
    {
      key:"typhoon-flight-cancellations",kind:"news",priority:1,coverage:["I12.main"],sources:["typhoonDisruption"],
      q_zh:"近期颱風造成國內線全數取消，妳認為空服員該如何面對大規模異動？",q_en:"How should cabin crew respond to large-scale disruption such as the recent typhoon-related domestic flight cancellations?",
      fact:"民航局 10 月 22 日因颱風逼近，公告 10 月 23 日國內線全日取消，國際線依天候調整，提醒旅客出發前向航空公司確認。這是特定日期的防颱公告，不能說成現在國內線仍全數停飛。",
      fact_en:"On 22 October, Taiwan's CAA announced cancellation of all domestic flights for 23 October because of an approaching typhoon, with international schedules subject to adjustment. This was a date-specific disruption, not a statement that domestic flights remain suspended today.",eventDate:"2026-10-22 公告；2026-10-23 國內線取消",newsStatus:"特定日期防颱措施；復飛與個別航班依後續公告確認",
      a_zh:"十月颱風造成航班大規模取消，讓旅客失望，也增加第一線工作壓力，但安全條件不能因為行程急迫就改變。我認為空服員需要先掌握正式簡報與派遣資訊，保持團隊聯繫，並對旅客提供一致的說明。我會特別留意需要協助或不熟悉語言的旅客，依職責協調後續支援。我在飯店遇過行程受阻的客人，學到先讓人穩定下來，再一起釐清下一步，比急著給保證更有效。",
      a_en:"Taiwan's October typhoon cancellations disappointed passengers and put pressure on frontline staff, but urgent travel plans cannot change safety requirements. Cabin crew need to follow official briefings and roster updates, stay connected with the team, and provide consistent information. I would pay particular attention to passengers needing assistance or language support. My hotel experience with disrupted travel plans taught me to first help people feel heard, then clarify practical next steps instead of rushing to make promises.",
      tip:"天候改善不等於每班立即復飛；還需確認機場、航機與組員等條件。不要自行預測起飛時間或飛時合法性。"
    },
    {
      key:"other-airline-still-flies",parentKey:"typhoon-flight-cancellations",kind:"followup",priority:1,coverage:["I12.follow"],sources:["typhoonDisruption"],
      q_zh:"旅客問「別家航空都飛了，為什麼你們還不能飛？」妳怎麼回答？",q_en:"A passenger asks, 'Other airlines are flying, so why can't we?' How would you respond?",
      a_zh:"我會理解他看到別的航班起飛會感到疑惑，再說明每個航班的時間、航路、目的地與作業條件不同，不能只憑另一班起飛就判定本班也能飛。我會提供本班已確認的原因與目前安排；如果詳細原因仍在確認，就坦白說明並約定下一次更新。我不會批評其他航空公司，也不會為了安撫旅客而催促略過檢查，會把注意力放在安全與可實際提供的協助上。",
      a_en:"I would acknowledge why seeing another flight depart feels confusing. Different flights can have different timing, routes, destinations, and operating conditions, so another departure does not confirm that ours can leave. I would explain our flight's verified situation and arrangements. If details were still being checked, I would say so and give the next update time. I would not criticise another airline or suggest skipping checks to satisfy pressure.",
      tip:"不要臆測別家冒險起飛，也不能只用『公司規定』結束回答。以本班已確認的資訊與後續協助為主。"
    }
  ];
  CI_FINAL_ITEMS.push(...CI_INDUSTRY_ITEMS.map(item=>({...item,group:"航空業時事",checkedAt})));
  const items=CI_FINAL_ITEMS;
  items.forEach((item,index)=>{
    const itemCheckedAt=item.checkedAt||"2026-11-08";
    Object.assign(item,{id:-11001-index,airlines:["華航"],cat:`華航複試・${item.group}`,src:`${item.kind==="asked"?"本人回顧已問過":"擬題，非確認考古題"}｜整理 ${itemCheckedAt}`,checkedAt:itemCheckedAt});
  });
  const byKey=Object.fromEntries(items.map(item=>[item.key,item]));
  const englishPrompts=[
    {zh:"請用 30 秒自我介紹。",en:"Please introduce yourself in 30 seconds.",keys:["intro"]},
    {zh:"為什麼選華航？為什麼是現在？",en:"Why China Airlines, and why now?",keys:["why-china-airlines","why-now"]},
    {zh:"飯店服務與空服員最大的差別？",en:"What is the biggest difference between hotel service and cabin crew duties?",keys:["hotel-vs-cabin"]},
    {zh:"分享一次失誤與學習。",en:"Tell us about a mistake you made and what you learned.",keys:["service-mistake"]},
    {zh:"分享最近關注的新聞。",en:"Tell us about a recent news story that caught your attention.",keys:["privacy-news"]},
    {zh:"如何回答旅客對延誤原因的追問？",en:"How would you respond to a passenger who demands to know the cause of a delay?",keys:["delay-honesty"]}
  ];
  /* Attach after legacy IDs are assigned. Reuse exact legacy prompts; never renumber saved records. */
  function attach(bank){
    const list=bank.slice(),registry=[];
    for(const item of items){
      const matches=list.filter(row=>row.ciFinalKey===item.key||(item.match||[]).includes(row.q_zh));
      const existing=matches[0];
      if(existing){
        for(const row of matches){
          row.ciFinalKey=item.key;
          row.variants={...row.variants,"華航":{a_zh:item.a_zh,a_en:item.a_en,...(item.a_ko?{a_ko:item.a_ko}:{})}};
          row.ciFinalDraft=item;
          if(!row.airlines?.includes("華航"))row.airlines=[...(row.airlines||[row.airline]).filter(Boolean),"華航"];
        }
        registry.push({...item,id:existing.id});
      }else{
        const row={...item,ciFinalKey:item.key};list.push(row);registry.push(row);
      }
    }
    return {bank:list,items:registry};
  }
  function markdown(){
    const industry=items.filter(item=>item.group==="航空業時事");
    const out=["# 華航複試中英文擬答",`內容更新：${checkedAt}；各題新聞查核日期另列，舊題維持原查核紀錄。`,`共 ${items.length} 題，包含原有 39 題與新增航空業時事 ${industry.length} 題（${industry.filter(item=>item.kind==="news").length} 個主題及各一題追問）。保留 18 題履歷服務題與六組英文核心問法；英文重疊題共用同一份雙語擬答。`, "只有「實戰回顧」四題是本人記錄已問過；其餘為延伸練習。擬答需依個人事實調整，新聞狀態以所列日期為準。", "航空業時事作答：一個有日期的已確認事實 → 自己的觀點 → 空服員能做的事。初步報告不等於最終肇因，規定與未來計畫須在面試前再次確認。"];
    items.forEach((item,i)=>{
      out.push(`\n## ${i+1}. ${item.q_zh}`,item.q_en,`分類：${item.group}${item.parentKey?`｜追問自：${byKey[item.parentKey].q_zh}`:""}`);
      if(item.answerLabel)out.push(`${item.answerLabel}｜更新 ${item.updatedAt}`);
      out.push("\n中文擬答：",item.a_zh,"\nEnglish draft:",item.a_en);
      if(item.a_ko)out.push("\n한국어 원고（韓文原稿）：",item.a_ko);
      out.push(`\n回答提醒：${item.tip}`);
      if(item.fact){
        out.push(`新聞事實：${item.fact}`);
        if(item.fact_en)out.push(`News background: ${item.fact_en}`);
        out.push(`事件／措施日期：${item.eventDate}｜查核：${item.checkedAt}`);
        if(item.newsStatus)out.push(`資料狀態：${item.newsStatus}`);
      }
      if(item.personalCheck)out.push(`個人事實確認：${item.personalCheck}`);
      out.push("來源："+item.sources.map(key=>{const s=sources[key];return `[${s.title}](${s.url})${s.date?`（${s.dateLabel||"發布"} ${s.date}）`:""}`}).join("、"));
    });
    out.push("\n## 六組英文核心問法與對應",...englishPrompts.map(p=>`- ${p.en}\n  對應：${p.keys.map(key=>byKey[key].q_zh).join("／")}`));
    return out.join("\n\n");
  }
  const api={checkedAt,sources,items,byKey,englishPrompts,attach,markdown};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.CIFinalPrep=api;
})(typeof window!=="undefined"?window:globalThis);
