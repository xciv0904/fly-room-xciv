(function(root){
  "use strict";
  const date="2026-10-15";
  const airlines=["華航","長榮","星宇"];
  const names={華航:"China Airlines",長榮:"EVA Air",星宇:"STARLUX Airlines"};
  const levels=["初級","中級","高級","挑戰級"];
  const bands=[[100,150],[150,200],[200,250]];
  const themes=[
    ["航空公司新聞稿","Service Information Workshop",[
      "The airline is preparing a practice workshop to help its teams explain service information clearly. Staff members will compare sample announcements, discuss unfamiliar expressions, and read short messages aloud. The workshop focuses on accurate information rather than speed. Participants will learn to identify the main action in each sentence before adding supporting details. A trainer will demonstrate how a calm voice and a short pause can make an important message easier to understand.",
      "During the workshop, each participant will give a colleague time to check the message and ask questions.",
      "The exercise also includes a discussion of respectful language when a traveler needs additional assistance at the airport.",
      "Team members will review the same message again after receiving feedback, paying special attention to names and numbers.",
      "An observation sheet will separate information that is clearly stated from assumptions that still require confirmation.",
      "Rather than promising an immediate solution, staff will explain the next available step and confirm who can provide further help.",
      "The final discussion will consider how consistent wording can support cooperation between airport colleagues and cabin crew.",
      "Participants will keep a personal note of one expression they want to practice during their next session."
    ]],
    ["航線開航與航點介紹","Planning a New Destination Briefing",[
      "A fictional route planning team is designing a destination briefing for passengers visiting a new city. The briefing introduces the airport, public transportation, and local visitor information. It does not announce a real flight or a confirmed schedule. Staff members are asked to explain place names carefully and distinguish the city center from the airport area. Travelers are encouraged to check current entry requirements and transportation services before making their own arrangements.",
      "The sample itinerary includes a transfer by train and a short walk through a neighborhood near the river.",
      "A map helps visitors understand the distance between the terminal, the station, and the main hotel district.",
      "Participants will practice giving directions in complete sentences without rushing through a list of unfamiliar place names.",
      "The team will also discuss how to respond when a traveler asks about a connection that has not been confirmed.",
      "Seasonal weather can affect a visitor's plans, so the briefing recommends checking reliable information before departure.",
      "The closing message explains that operating details may change and should always be checked with the appropriate provider.",
      "Each reader will identify two useful details and explain why those details matter to a first time visitor."
    ]],
    ["觀光及旅遊景點","A Walk Through Local Culture",[
      "A visitor center is creating a short guide to a neighborhood where old buildings stand beside contemporary galleries. Travelers can begin their walk at a public square and continue toward a quiet riverside park. Local workshops introduce traditional craftsmanship through small exhibitions and conversations with artisans. The guide encourages visitors to observe daily life respectfully, ask before taking photographs, and leave enough time to explore at a comfortable pace.",
      "A nearby market offers seasonal ingredients and simple meals prepared by families who have worked there for many years.",
      "Visitors who prefer a quieter experience can choose an early morning walk and listen to the sounds of the neighborhood.",
      "The information desk can suggest accessible routes, although visitors should confirm the conditions that match their own needs.",
      "The guide describes cultural differences as opportunities to listen and learn rather than reasons to make quick judgments.",
      "Travelers are reminded that respectful behavior includes keeping public spaces clean and following instructions at historic sites.",
      "The walk concludes with a view of the surrounding landscape and an invitation to reflect on the day's discoveries.",
      "Participants will read the guide aloud, using clear pauses to distinguish practical directions from descriptive details."
    ]],
    ["航空安全及機上服務","Clear Communication in the Cabin",[
      "This training scenario considers how clear communication can support a comfortable cabin environment. A passenger asks a crew member where to store a small bag before departure. The crew member listens, checks the available space, and explains the next step in simple language. If further assistance is required, the request is passed to an appropriate colleague. This is a fictional communication exercise and does not replace approved safety procedures or instructions from operating crew.",
      "The reader should make a clear distinction between a polite request, a practical explanation, and an important instruction.",
      "A calm tone can help the passenger feel heard while the crew member continues to follow the required procedure.",
      "Participants will practice saying familiar service expressions without adding promises that the situation does not support.",
      "When information is unclear, the crew member asks a brief question instead of assuming what the passenger needs.",
      "The exercise encourages careful listening and appropriate coordination rather than independent action beyond a person's responsibilities.",
      "After reading the passage, each participant will identify the information that should be confirmed before offering an answer.",
      "The review focuses on clarity, complete words, and respectful delivery, with particular attention to the ends of sentences."
    ]],
    ["品牌合作與彩繪機","An Imaginary Art Collaboration",[
      "An imaginary airline and a group of artists are discussing a themed aircraft for a creative exhibition. The proposed design places colorful illustrations along the fuselage and combines familiar characters with floral patterns. Inside the exhibition hall, visitors can examine sketches and learn how a large design develops from a small idea. The project is fictional and does not represent a confirmed partnership, a real aircraft delivery, or an actual airline announcement.",
      "The artists explain how the choice of color can connect separate illustrations while keeping the overall design easy to recognize.",
      "A display introduces the craftsmanship involved in adapting a drawing to a curved surface with different viewing angles.",
      "The sample announcement describes the visual concept without suggesting that decorative features change the aircraft's safety requirements.",
      "Participants will pay attention to words such as collaboration, exquisite, and aesthetics when reading the explanation aloud.",
      "The exhibition also includes a simple activity where visitors create a small design inspired by their own travel memories.",
      "Readers are asked to separate imaginative descriptions from operational information that would require an official source.",
      "The closing paragraph invites visitors to appreciate the creative process and the teamwork behind a shared visual identity."
    ]],
    ["ESG、永續航空","A Sustainability Learning Session",[
      "A training group is preparing a discussion about environmental responsibility in the travel industry. Participants examine how waste reduction, careful purchasing, and clear information can support a more thoughtful visitor experience. The exercise asks readers to distinguish a measurable result from a general statement of intention. No environmental achievement or emissions reduction is claimed for any real airline. Instead, the passage introduces questions that can help a reader assess a sustainability announcement more carefully.",
      "One question concerns the period covered by a report and whether the same method was used for each comparison.",
      "Another question asks how an organization describes the boundaries of its data and the limitations of its conclusions.",
      "The group will discuss why a successful pilot project does not automatically demonstrate the same result across an entire network.",
      "Readers are encouraged to recognize terms such as environmental, operational, and initiatives without treating unfamiliar language as evidence of progress.",
      "The facilitator will invite participants to propose a practical question that could clarify an incomplete public statement.",
      "The discussion emphasizes transparency and evidence while acknowledging that improvements may involve several teams and different time frames.",
      "At the end of the session, each reader will summarize one idea in ordinary language and identify any remaining uncertainty."
    ]],
    ["慈善活動及體育賽事","A Community Sports Afternoon",[
      "A fictional community organization is planning a sports afternoon for young people and their families. Volunteer coaches will introduce simple activities that encourage participation, fitness, and cooperation. The schedule includes a warm up, a demonstration, and time to practice in small groups. The organizers want every participant to feel welcome, including those who have never joined a sports activity before. This sample describes a training scenario rather than an announced event or a confirmed charity partnership.",
      "Each coach will explain an activity before it begins and check that participants understand the instructions for their group.",
      "Families can visit an information area to ask about the day's schedule and the support available at the venue.",
      "The organizers will provide a quiet space where a participant can rest and speak with a volunteer when needed.",
      "The exercise highlights the difference between encouraging someone to try and pressuring them to compete beyond their comfort level.",
      "Participants reading the passage will practice the stress in words such as athletes, nurturing, and collaboration.",
      "The closing activity celebrates effort and teamwork, with an invitation for families to share feedback about their experience.",
      "Readers will identify the purpose of the event and explain how the proposed arrangements support that purpose."
    ]],
    ["機場設施與航空產業新聞","A More Understandable Terminal",[
      "A fictional airport team is reviewing signs and passenger information inside a terminal. The project focuses on helping travelers locate transfer desks, waiting areas, and accessible facilities. Staff will test whether a person can understand a sign without already knowing the building. The team will also compare written directions with information provided at a service counter. This is a simulated industry briefing and does not announce construction, a terminal opening, or a service change at a real airport.",
      "Travelers may arrive with different language backgrounds, so the sample signs use a consistent structure and familiar words.",
      "The review includes the route between a train platform and a departure area, with attention to important decision points.",
      "When a facility is temporarily unavailable, the information should explain where a traveler can obtain an alternative service.",
      "The team will collect observations before deciding whether a proposed change actually makes the journey easier to understand.",
      "Participants will practice reading numbers, terminal names, and connecting instructions at a steady pace with clear sentence endings.",
      "The final briefing will explain the findings and identify questions that still require consultation with other airport teams.",
      "Readers are asked to summarize the purpose of the review without adding details that the passage does not provide."
    ]]
  ];
  const style=[
    "The following practice report uses short statements to introduce a travel related topic.",
    "The following practice report connects a proposed activity with the needs of travelers and staff.",
    "Although the activity is hypothetical, its description invites readers to consider how accurate information influences a traveler's experience.",
    "Provided that readers distinguish illustrative proposals from verified commitments, the following hypothetical report offers an opportunity to interpret qualified statements whose implications depend on the evidence available."
  ];
  const questions=[];
  for(let a=0;a<airlines.length;a++)for(let t=0;t<themes.length;t++)for(let l=0;l<levels.length;l++)for(let b=0;b<bands.length;b++){
    const [topic,title,parts]=themes[t],range=bands[b];
    let text=`${style[l]} This reading is intended for candidates preparing for ${names[airlines[a]]}. ${parts[0]}`;
    let n=1;while(text.split(/\s+/).length<range[0]&&n<parts.length)text+=" "+parts[n++];
    if(text.split(/\s+/).length>range[1])throw Error("Reading Lab question exceeds its length band");
    questions.push({id:`lab-${a}-${t}-${l}-${b}`,airline:airlines[a],difficulty:levels[l],band:b,topic,title:`${title} · ${levels[l]}`,text,words:text.split(/\s+/).length,date,kind:"模擬稿",source:"Fly Room 原創訓練稿；非官方新聞、非官方面試題",sourceUrl:"https://github.com/xciv0904/fly-room-xciv",proper:["China Airlines","EVA Air","STARLUX Airlines"]});
  }
  // IPA and stress are curated entries, never guessed from spelling or TTS.
  const entries=[
    ["exquisite","精緻的","/ɪkˈskwɪzɪt/","ex-QUI-site","Pikachu Jet"],
    ["fuselage","機身","/ˈfjuːzəlɑːʒ/","FU-se-lage","Pikachu Jet"],
    ["exemplifies","體現；展現","/ɪɡˈzemplɪfaɪz/","ex-EM-pli-fies","Pikachu Jet"],
    ["aesthetics","美學","/esˈθetɪks/","aes-THET-ics","Pikachu Jet"],
    ["amenities","設備；便利設施","/əˈmenətiz/","a-MEN-i-ties","Pikachu Jet"],
    ["collaboration","合作","/kəˌlæbəˈreɪʃən/","col-lab-o-RA-tion","Pikachu Jet"],
    ["travelers","旅客","/ˈtrævələrz/","TRAV-el-ers","Pikachu Jet"],
    ["transforms","轉變；改造","/trænsˈfɔːrmz/","trans-FORMS","2025 Calendar"],
    ["catchy","朗朗上口的；吸引人的","/ˈkætʃi/","CATCH-y","2025 Calendar"],
    ["uniformed","穿制服的","/ˈjuːnɪfɔːrmd/","U-ni-formed","2025 Calendar"],
    ["backdrops","背景","/ˈbækdrɑːps/","BACK-drops","2025 Calendar"],
    ["Eryanping","二延平","","er-YAN-ping（英語近似提示）","2025 Calendar","https://www.ali-nsa.net/"],
    ["Banff","班夫","/bænf/","BANFF（單音節）","2025 Calendar"],
    ["evokes","喚起","/ɪˈvoʊks/","e-VOKES","2025 Calendar"],
    ["Karlovy Vary","卡羅維瓦利","","KAR-lo-vee VAH-ree（英語近似提示）","2025 Calendar","https://www.karlovyvary.cz/en"],
    ["rejuvenating","使人恢復活力的","/rɪˈdʒuːvəneɪtɪŋ/","re-JU-ve-nat-ing","2025 Calendar"],
    ["marathon","馬拉松","/ˈmærəθɑːn/","MAR-a-thon","Marathon Starlight Night Run"],
    ["featured","以……為特色","/ˈfiːtʃərd/","FEA-tured","Marathon Starlight Night Run"],
    ["carnival","嘉年華","/ˈkɑːrnəvəl/","CAR-ni-val","Marathon Starlight Night Run"],
    ["athletes","運動員","/ˈæθliːts/","ATH-letes","Marathon Starlight Night Run"],
    ["nurturing","培育；養成","/ˈnɜːrtʃərɪŋ/","NUR-tur-ing","Marathon Starlight Night Run"],
    ["fitness","體能；健身","/ˈfɪtnəs/","FIT-ness","Marathon Starlight Night Run"],
    ["collaborates","合作","/kəˈlæbəreɪts/","col-LAB-o-rates","Marathon Starlight Night Run"],
    ["initiatives","倡議；措施","/ɪˈnɪʃətɪvz/","i-NI-tia-tives","Marathon Starlight Night Run"],
    ["sustainability","永續性","/səˌsteɪnəˈbɪləti/","sus-tain-a-BIL-i-ty","解碼字庫"],
    ["operational","營運的","/ˌɑːpəˈreɪʃənəl/","op-er-A-tion-al","解碼字庫"],
    ["connectivity","連通性；航網連結","/ˌkɑːnekˈtɪvəti/","con-nec-TIV-i-ty","解碼字庫"],
    ["environmental","環境的","/ɪnˌvaɪrənˈmentəl/","en-vi-ron-MEN-tal","解碼字庫"],
    ["destination","目的地","/ˌdestɪˈneɪʃən/","des-ti-NA-tion","解碼字庫"],
    ["international","國際的","/ˌɪntərˈnæʃənəl/","in-ter-NA-tion-al","解碼字庫"],
    ["participation","參與","/pɑːrˌtɪsɪˈpeɪʃən/","par-tic-i-PA-tion","解碼字庫"],
    ["craftsmanship","工藝；匠心","/ˈkræftsmənʃɪp/","CRAFTS-man-ship","解碼字庫"],
    ["commemorative","紀念的","/kəˈmemərətɪv/","com-MEM-o-ra-tive","解碼字庫"]
  ];
  const words=entries.map(([word,zh,ipa,syllables,source,url],i)=>({id:`word-${i}`,word,zh,ipa,syllables,source,seed:i<24,url:url||`https://dictionary.cambridge.org/dictionary/english/${word.toLowerCase().replace(/ /g,"-")}`,note:"大寫段為主要重音提示；劃分為朗讀輔助，不是唯一音節標法。IPA 採常見美式讀法；變體請核對詞典。"}));
  const rules=[
    ["-tion","常見讀作 /ʃən/，主要重音常在字尾前一音節。","destination → des-ti-NA-tion","question 的 -tion 讀 /tʃən/；不能只看字尾決定全部發音。"],
    ["-sion","可能讀 /ʒən/ 或 /ʃən/，須查單字。","decision /dɪˈsɪʒən/；discussion /dɪˈskʌʃən/","不可把所有 -sion 都讀成同一個音。"],
    ["-ture","常見 /tʃər/（美式），不單獨決定重音。","nature /ˈneɪtʃər/；mature /məˈtʃʊr/","nature 與 mature 的主要重音位置不同。"],
    ["-ity","常影響前面的重音位置，通常重音在 -ity 前一音節。","activity → ac-TIV-i-ty","從原形到衍生字可能移動重音，仍須逐字核對。"],
    ["-ment","通常讀 /mənt/，許多衍生字保留原形重音。","development → de-VEL-op-ment","不保證字首重音，例如 develop 與 development。"],
    ["-ous","常見 /əs/，拼字不能直接決定重音。","famous → FA-mous；dangerous → DAN-ger-ous","有其他複合字尾，例如 -ious，須連同前面的音一起判讀。"],
    ["-cial","常見 /ʃəl/，前一音節常承擔主要重音。","commercial → com-MER-cial","把 /ʃəl/ 視為讀音線索，仍需查核整個字。"],
    ["-tial","常見 /ʃəl/；部分單字出現 /tʃəl/。","essential → es-SEN-tial","例如 bestial 有 /ˈbestʃəl/ 讀法，字尾規則有例外。"],
    ["-able","常見 /əbəl/，不是固定重音規則。","comfortable → COM-fort-a-ble","comfortable 在自然語流中可弱化音節；不可把拼字格數當成必須念出的音節數。"],
    ["-ive","常見 /ɪv/，重音位置需看完整單字。","active → AC-tive；alternative → al-TER-na-tive","不同詞形與衍生結構可能有不同重音。"]
  ].map(([suffix,rule,example,exception])=>({suffix,rule,example,exception}));
  const ci="https://www.china-airlines.com/at/en/Images/全球航點_260131_tcm283-57777.pdf";
  const eva="https://www.evaair.com/en-global/about-eva-air/about-us/market-and-sales-overview/main-business-and-services/";
  const placeExamples=[
    "The sample destination report introduces Seattle as a gateway to the Pacific Northwest.",
    "Travelers visiting Tokyo should confirm which airport appears on their itinerary.",
    "The destination briefing introduces Vienna's cultural attractions and public transportation.",
    "Passengers traveling to Paris should check their arrival airport before arranging ground transportation.",
    "The simulated airport report explains how travelers can find assistance at Heathrow Airport.",
    "The sample transfer guide describes a meeting point at Changi Airport.",
    "The travel report introduces Taiwan through its landscapes, food, and local communities.",
    "The visitor briefing asks travelers to check current entry requirements for Canada.",
    "The sample itinerary includes a visit to Banff and time to explore the surrounding landscape.",
    "The tourism briefing describes Karlovy Vary as a spa destination in the Czech Republic.",
    "The sample Paris itinerary includes a view of the Eiffel Tower.",
    "The practice report asks readers to identify the difference between China Airlines and Air China.",
    "The fictional service workshop includes a reading exercise for candidates preparing for EVA Air.",
    "The practice session introduces candidates preparing for STARLUX Airlines to unfamiliar aviation vocabulary.",
    "The sample announcement identifies the aircraft as a Boeing 777.",
    "The fictional exhibition includes an illustration of an Airbus A350.",
    "The industry briefing explains that IATA represents airlines in the air transport industry.",
    "The reading exercise introduces ICAO as the International Civil Aviation Organization.",
    "The practice report asks travelers to check which airline operates a codeshare flight."
  ];
  const places=[
    ["Seattle","西雅圖","美國","華航實際航點","see-AT-uhl",ci],
    ["Tokyo","東京","日本","華航實際航點","TOH-kee-oh",ci,"當地日語 Tōkyō 與英語常見讀法的節奏不同。"],
    ["Vienna","維也納","奧地利","長榮實際航點","vee-EN-uh",eva,"德文名稱 Wien，近似 veen；勿與英語 Vienna 混讀。"],
    ["Paris","巴黎","法國","長榮實際航點","PAIR-iss",eva,"法語 Paris 近似 pah-REE，末尾 s 不發音；英文常見讀法不同。"],
    ["Heathrow Airport","希斯洛機場","英國","其他國際重要機場","HEETH-roh", "https://www.heathrow.com/"],
    ["Changi Airport","樟宜機場","新加坡","其他國際重要機場","CHANG-ee","https://www.changiairport.com/"],
    ["Taiwan","台灣","台灣","國家及城市","tie-WAHN","https://eng.taiwan.net.tw/"],
    ["Canada","加拿大","加拿大","國家及城市","KAN-uh-duh","https://travel.destinationcanada.com/"],
    ["Banff","班夫","加拿大","世界知名旅遊景點","BANF（單音節）","https://parks.canada.ca/pn-np/ab/banff"],
    ["Karlovy Vary","卡羅維瓦利","捷克","世界知名旅遊景點","KAR-lo-vee VAH-ree","https://www.karlovyvary.cz/en","捷克語重音原則與英語習慣不同；此處提示用於英文朗讀，非當地語音標準。"],
    ["Eiffel Tower","艾菲爾鐵塔","法國","世界知名旅遊景點","EYE-fuhl TOW-er","https://www.toureiffel.paris/en"],
    ["China Airlines","中華航空","台灣","航空公司與機型","CHY-nuh AIR-lines","https://www.china-airlines.com/"],
    ["EVA Air","長榮航空","台灣","航空公司與機型","E-V-A Air（字母分開念）","https://www.evaair.com/"],
    ["STARLUX Airlines","星宇航空","台灣","航空公司與機型","STAR-lux AIR-lines","https://www.starlux-airlines.com/"],
    ["Boeing 777","波音 777","美國","航空公司與機型","BOH-ing Triple Seven","https://www.boeing.com/commercial/777"],
    ["Airbus A350","空中巴士 A350","歐洲","航空公司與機型","AIR-bus A Three Fifty","https://www.airbus.com/en/products-services/commercial-aircraft/passenger-aircraft/a350-family"],
    ["IATA","國際航空運輸協會","國際","常見航空組織及服務用語","eye-AH-tuh","https://www.iata.org/"],
    ["ICAO","國際民用航空組織","國際","常見航空組織及服務用語","eye-KAY-oh","https://www.icao.int/"],
    ["codeshare","共用班號","國際","常見航空組織及服務用語","CODE-share","https://dictionary.cambridge.org/dictionary/english/code-share"]
  ].map(([en,zh,region,category,hint,url,local],i)=>({id:`place-${i}`,en,zh,region,category,hint,url,local:local||"",checked:date,example:placeExamples[i],pronunciationUrl:`https://www.collinsdictionary.com/search/?dictCode=english&q=${encodeURIComponent(en)}`}));
  root.ReadingLabData={airlines,levels,bands,themes:themes.map(x=>x[0]),questions,words,rules,places,date};
})(typeof window!=="undefined"?window:globalThis);
