(function(root){
  'use strict';

  // These short quotations identify the original reading material. Full articles
  // stay on the publisher's website; they are not substituted with generated text.
  const verifiedAt='2026-11-02';
  const rightsNote='此處僅提供短摘錄與自編學習提示；全文請至原文閱讀。';
  const studyOnlyReason='外部原文延伸閱讀：本站只保留短摘錄，不納入正式模擬抽題。';
  const common={airlines:['華航'],kind:'新聞稿',provenance:'practice-source',studyOnly:true,verifiedAt,rightsNote,studyOnlyReason,provenanceNote:'依主題選入的練習材料，未證實為面試考古題。'};
  const articles=[
    {
      ...common,id:'source-ci-noise-cancellation-20240402',title:'客艙服務｜主動降噪耳機與音質技術',topics:['service'],
      publisher:'中華航空',publishedAt:'2024-04-02',datePrecision:'day',dateLabel:'2024-04-02',
      sourceUrl:'https://www.china-airlines.com/us/en/about-china-airlines/media/news/20240402.html',
      source:'華航官方英文新聞稿｜旅行組與耳機升級',scope:'文末「豪華商務艙及商務艙耳機升級」小節；節錄聲學調校的完整一句。',excerptType:'sentence',
      sentences:['Professional acoustic tuning technology ensures precise transient response and phase accuracy.'],
      translation:'專業聲學調校技術確保精準的瞬態響應與相位準確度。',
      summaryZh:'同一篇官方新聞除了旅行組，也介紹耳機的降噪方式、音質與配戴設計，適合練習設備功能的英文說明。',
      readingTask:'開啟原文，找到文末耳機升級小節，閱讀最後兩段；先確認每個技術名詞的意思，再練習把功能與旅客感受連起來。',
      readingPrompts:['耳機如何處理飛機引擎噪音？','哪些描述談音質，哪些描述談長時間配戴？','遇到機型代號時，能否保持句子的語速與意群？'],
      vocabulary:[{word:'noise cancellation',zh:'降噪'},{word:'digital IC',zh:'數位積體電路'},{word:'acoustic',zh:'聲學的'},{word:'transient response',zh:'瞬態響應'},{word:'lightweight',zh:'輕量的'},{word:'headphones',zh:'耳機'}]
    },
    {
      ...common,id:'source-ci-rice-snack-20240925',title:'機上餐飲｜紅玉茶米香與聯名甜點',topics:['food','service'],
      publisher:'中華航空',publishedAt:'2024-09-25',datePrecision:'day',dateLabel:'2024-09-25',
      sourceUrl:'https://www.china-airlines.com/us/en/about-china-airlines/media/news/20240925',
      source:'華航官方英文新聞稿｜五桐號聯名餐飲',scope:'日式甜點小節中介紹米香的句首片段；本站摘錄不是完整句子。',excerptType:'fragment',
      sentences:['The Ruby Red Tea-Flavored Rice Snack with its rich tea fragrance'],
      translation:'帶有濃郁茶香的紅玉茶風味米香〔原文句首片段〕',
      summaryZh:'文章把產品名稱、風味、艙等與供應航線放在同一段，適合練習較長的餐點名稱，以及依條件提供服務的說明。',
      readingTask:'開啟原文，閱讀日式甜點小節。挑一個介紹餐點的完整段落練習，先標出產品、風味與供應對象，再進行朗讀。',
      readingPrompts:['如何在長串甜點名稱中找出主詞與動詞？','哪些餐點依航線或艙等供應？','能否不用原文，以中文說清楚米香與其他甜點的差別？'],
      vocabulary:[{word:'rice snack',zh:'米香；米製點心'},{word:'fragrance',zh:'香氣'},{word:'desserts',zh:'甜點'},{word:'sparkling',zh:'帶氣泡的'},{word:'Matcha',zh:'抹茶'},{word:'Dorayaki',zh:'銅鑼燒'}]
    },
    {
      ...common,id:'source-ci-saf-20250116',title:'航空永續｜SAF 示範航班與減碳合作',topics:['sustainability','business'],
      publisher:'中華航空',publishedAt:'2025-01-16',datePrecision:'day',dateLabel:'2025-01-16',
      sourceUrl:'https://www.china-airlines.com/nl/en/about-china-airlines/media/news/20250116.html',
      source:'華航官方英文新聞稿｜永續示範航班',scope:'介紹 2024 年 9 月示範航班之段落；節錄回程燃油比例的句首片段，完整條件請讀原文。',excerptType:'fragment',
      sentences:['In addition to using 20% Sustainable Aviation Fuel (SAF)'],
      translation:'除了使用 20% 的永續航空燃油（SAF）〔原文句首片段〕',
      summaryZh:'文章以特定示範航班說明燃油、企業與供應商合作，以及減碳主張。練習時要區分這次示範的條件、既有成果與未來策略。',
      readingTask:'開啟原文，閱讀示範航班與五項策略的段落。先核對日期、機型、航班及比例，再練習長句；不要把示範航班的條件推廣成所有航班現況。',
      readingPrompts:['20% 的比例是對哪一段航程提出的描述？','航空公司與哪些對象合作？','哪些敘述是該次成果，哪些是長期目標？'],
      vocabulary:[{word:'SAF',zh:'永續航空燃油的縮寫'},{word:'carbon neutral',zh:'碳中和的'},{word:'fuel-efficiency',zh:'燃油效率'},{word:'value chain',zh:'價值鏈'},{word:'net zero',zh:'淨零'},{word:'climate adaptation',zh:'氣候調適'}]
    },
    {
      ...common,id:'source-ci-chi-po-lin-20250304',title:'台灣文化｜齊柏林影像、原住民音樂與環境教育',topics:['culture','sustainability'],
      publisher:'中華航空',publishedAt:'2025-03-04',datePrecision:'day',dateLabel:'2025-03-04（網頁發布日）',
      sourceUrl:'https://www.china-airlines.com/sea/vi/about-china-airlines/media/news/20250304.html',
      source:'華航官方英文新聞稿｜登機影片公益合作',scope:'介紹紀錄片影像來源之段落的句首片段；原稿文末另標示 2025/2/26，網頁發布日為 2025/3/4。',excerptType:'fragment',
      sentences:['Footage from the renowned documentary Beyond Beauty: Taiwan from Above shot by Po-lin Chi'],
      translation:'取自齊柏林拍攝的知名紀錄片《看見台灣》的影像〔原文句首片段〕',
      summaryZh:'文章結合空拍影像、台灣地景、原住民學生樂團與航空公司的公益行動，能補足人物、文化及環境教育題材。',
      readingTask:'開啟原文，閱讀影像與配樂的介紹，並找出後段企業公益行動。先把人物、組織、作品和地名分開標記，再各選一段朗讀。',
      readingPrompts:['影像與音樂分別來自哪些人或組織？','登機影片如何呈現環境教育與文化傳承？','如何朗讀長作品名稱，同時保留整句的結構？'],
      vocabulary:[{word:'aerial',zh:'空中的；空拍的'},{word:'indigenous',zh:'原住民的'},{word:'heritage',zh:'傳承；文化遺產'},{word:'conservation',zh:'保育'},{word:'non-profit',zh:'非營利的'},{word:'environmental education',zh:'環境教育'}]
    },
    {
      ...common,id:'source-tsmc-water-education-20260421',title:'企業 ESG｜台積電再生水與環境教育（2026）',topics:['business','sustainability'],
      publisher:'台灣積體電路製造公司（TSMC）',publishedAt:'2026-04-21',datePrecision:'day',dateLabel:'2026-04-21',
      sourceUrl:'https://esg.tsmc.com.tw/en-US/articles/401',
      source:'台積電官方英文永續專文｜水資源環境教育',scope:'文末介紹水處理技術與教育行動段落的完整末句；相關成果與規劃均以 2026 年 4 月發布時點為準。',excerptType:'sentence',
      sentences:['TSMC continues to strengthen its environmental education efforts.'],
      translation:'台積電持續加強環境教育工作。',
      summaryZh:'這篇 2026 年企業永續專文結合再生水技術、導覽課程、家庭學習與國際交流，適合練習企業如何把環境行動轉為教育活動。發布者為台積電；「華航」只表示本區的備考範圍。',
      readingTask:'開啟原文，閱讀前段的用水管理與教育課程，再讀後段的技術及交流活動。先標記日期、參與人數與合作對象，再各挑一段朗讀。',
      readingPrompts:['再生水廠的用途如何延伸到環境教育？','哪些課程或活動面向學生、成人與家庭？','朗讀日期與參與人數時，能否保留發布時點的限制？'],
      vocabulary:[{word:'reclaimed water',zh:'再生水'},{word:'semiconductor',zh:'半導體'},{word:'water-saving',zh:'節水的'},{word:'monitoring',zh:'監測'},{word:'delegations',zh:'參訪團；代表團'},{word:'guided tours',zh:'導覽活動'}]
    }
  ];

  const metadataById=Object.create(null);
  const seasonNames={Spring:'春',Summer:'夏',Autumn:'秋',Winter:'冬'};
  const sourceCatalogUrl='https://www.china-airlines.com/us/en/prepare-for-the-fly/In-flight/entertainment?tab=MagazineTab';
  // Exact links are published by the official magazine catalog. All nine were
  // checked with HEAD on verifiedAt: HTTP 200 and Content-Type application/pdf.
  // This checks availability, not each stored excerpt or its printed page.
  const dynastyIssues={
    '2024-Summer':{file:'Dynasty-2024-Summer.pdf',contentLength:46741762},
    '2024-Autumn':{file:'Dynasty-2024-Autumn.pdf',contentLength:46963360},
    '2025-Spring':{file:'Dynasty-2025-Spring.pdf',contentLength:38997231},
    '2025-Summer':{file:'Dynasty-2025-Summer.pdf',contentLength:56381390},
    '2025-Autumn':{file:'Dynasty-2025-Autumn.pdf',contentLength:36805621},
    '2025-Winter':{file:'Dynasty-2025-Winter.pdf',contentLength:69061569},
    '2026-Spring':{file:'Dynasty-2026-Spring.pdf',contentLength:79515120},
    '2026-Summer':{file:'Dynasty-2026-Summer.pdf',contentLength:66214120},
    '2026-Autumn':{file:'Dynasty-2026-Autumn.pdf',contentLength:65787505}
  };
  const legacyTraceById={
    'article-547280f83fe67cb7':'Dynasty-2024-Autumn.pdf｜雜誌第 04 頁｜The Blue Aroma of Seattle',
    'article-6818e5c25263bc1e':'Dynasty-2024-Summer.pdf｜雜誌第 04 頁｜The Solitary Sojourns, The Literary Escapades',
    'article-2da4131844d974d1':'Dynasty-2025-Spring.pdf｜雜誌第 05 頁｜Unmissable Faraway Dream Destinations',
    'article-14ebb1ee39564574':'Dynasty-2025-Winter.pdf｜雜誌第 04 頁｜Healing in the Steam: A Soak Around the World',
    'article-e3b6492afc3c7208':'Dynasty-2026-Spring.pdf｜雜誌第 04 頁｜Shirakawa-go Light-up Event',
    'article-0011bd6c329d32d1':'Dynasty-2026-Spring.pdf｜雜誌第 04 頁｜Carnevale di Viareggio',
    'article-c0186cb6f533be45':'Dynasty-2026-Summer.pdf｜雜誌第 06 頁｜Recalibrate Your World Through a Grand Tour',
    'article-5a6e3cf99e482166':'Dynasty-2026-Autumn.pdf｜雜誌第 03 頁｜Seasons Painted in Art'
  };
  Object.values(dynastyIssues).forEach(issue=>{
    issue.originalUrl='https://cms-externalcontent-prod.s3.ap-northeast-1.amazonaws.com/ci/In-flight%20Entertainment/EN/Dynasty/'+issue.file;
    issue.originalUrlVerifiedAt=verifiedAt;
  });
  function legacyMetadata(article){
    const source=legacyTraceById[article?.id]||String(article?.source||'');
    const issue=source.match(/Dynasty-(20\d{2})-(Spring|Summer|Autumn|Winter)\.pdf/i);
    const localIssue=source.match(/^(20\d{2})\s*([春夏秋冬])/);
    let publicationYear,publicationSeason;
    if(issue){publicationYear=Number(issue[1]);publicationSeason=Object.keys(seasonNames).find(s=>s.toLowerCase()===issue[2].toLowerCase());}
    else if(localIssue){publicationYear=Number(localIssue[1]);publicationSeason=Object.keys(seasonNames).find(s=>seasonNames[s]===localIssue[2]);}
    const metadata={
      provenance:'practice-source',provenanceNote:'既有原稿練習材料，未證實為面試考古題。',
      scope:source||'既有站內原稿；原始發布資訊尚待核對。',
      sourceTraceUrl:article?.sourceUrl||'',verificationStatus:'not-reverified',
      verificationNote:'保留既有原稿出處；本輪未重新核對原始 PDF 或發布網頁。'
    };
    if(publicationYear){
      Object.assign(metadata,{publisher:'中華航空《Dynasty》',publicationYear,publicationSeason,
        publishedAt:`${publicationYear}-${publicationSeason}`,datePrecision:'issue',
        dateLabel:`${publicationYear} ${seasonNames[publicationSeason]}季號（依既有原稿出處）`});
      const original=dynastyIssues[`${publicationYear}-${publicationSeason}`];
      if(original){
        Object.assign(metadata,{originalUrl:original.originalUrl,sourceCatalogUrl,
          originalUrlVerifiedAt:verifiedAt,originalContentType:'application/pdf',
          originalContentLength:original.contentLength,verificationStatus:'original-link-verified',
          verificationScope:'publisher-catalog-link-and-http-content-type',excerptVerified:false,
          verificationNote:'已核對華航官方目錄連結及 PDF 回應（HTTP 200）；原稿內容與雜誌頁碼沿用既有出處，未重新逐句或逐頁核對。'});
        const page=source.match(/雜誌第\s*(\d+)\s*頁/);
        if(page)metadata.printedPage=Number(page[1]);
      }
    }
    metadata.sourceScope=metadata.scope;
    return metadata;
  }
  function enrich(article){
    if(!article)return article;
    const original=articles.find(item=>item.id===article.id);
    const metadata=original||metadataById[article.id]||legacyMetadata(article);
    if(!original&&article.id)metadataById[article.id]=metadata;
    return {...article,...metadata};
  }
  articles.forEach(article=>{
    article.originalUrl=article.sourceUrl;
    article.sourceScope=article.scope;
    metadataById[article.id]=article;
  });

  root.ReadingLabSources={schema:1,articles,metadataById,enrich,legacyMetadata,dynastyIssues,sourceCatalogUrl};
})(typeof window!=='undefined'?window:globalThis);
