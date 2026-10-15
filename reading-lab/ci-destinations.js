(function(root){
  "use strict";
  const D=root.ReadingLabData,category="華航航點與延伸地名";
  const groups=[
    ["日本","日本",`
東京|Tokyo||TOH-kee-oh
成田|Narita|NRT|nah-REE-tah
羽田|Haneda|HND|hah-NEH-dah
大阪|Osaka|KIX|oh-SAH-kah
名古屋|Nagoya|NGO|nah-GOH-yah
札幌|Sapporo|CTS|sah-POH-roh
福岡|Fukuoka|FUK|foo-koo-OH-kah
廣島|Hiroshima|HIJ|hee-roh-SHEE-mah
熊本|Kumamoto|KMJ|koo-mah-MOH-toh
鹿兒島|Kagoshima|KOJ|kah-goh-SHEE-mah
高松|Takamatsu|TAK|tah-kah-MAH-tsoo
沖繩|Okinawa|OKA|oh-kee-NAH-wah
石垣島|Ishigaki|ISG|ee-shee-GAH-kee
靜岡|Shizuoka|FSZ|shee-ZOO-oh-kah
富山|Toyama|TOY|toh-YAH-mah
宮崎|Miyazaki|KMI|mee-yah-ZAH-kee
青森|Aomori|AOJ|ah-oh-MOH-ree
秋田|Akita|AXT|ah-KEE-tah
函館|Hakodate|HKD|hah-koh-DAH-teh`],
    ["韓國","韓國",`
首爾|Seoul||SOHL
仁川|Incheon|ICN|IN-chun
金浦|Gimpo|GMP|GIM-poh
釜山|Busan|PUS|BOO-sahn
濟州島|Jeju|CJU|JEH-joo`],
    ["東南亞","",`
曼谷|Bangkok|BKK|bang-KOK|泰國
清邁|Chiang Mai|CNX|chee-AHNG MY|泰國
峴港|Da Nang|DAD|dah NAHNG|越南
河內|Hanoi|HAN|hah-NOY|越南
胡志明市|Ho Chi Minh City|SGN|hoh chee MIN CITY|越南
馬尼拉|Manila|MNL|muh-NIL-uh|菲律賓
宿霧|Cebu|CEB|seh-BOO|菲律賓
新加坡|Singapore|SIN|SING-uh-por|新加坡
吉隆坡|Kuala Lumpur|KUL|KWAH-luh LOOM-poor|馬來西亞
檳城|Penang|PEN|puh-NANG|馬來西亞
雅加達|Jakarta|CGK|juh-KAR-tuh|印尼
峇里島|Bali|DPS|BAH-lee|印尼
登巴薩|Denpasar|DPS|den-PAH-sar|印尼
泗水|Surabaya|SUB|soo-rah-BAH-yah|印尼
金邊|Phnom Penh|PNH|puh-NOM PEN|柬埔寨
仰光|Yangon|RGN|yan-GON|緬甸`],
    ["港澳、中國大陸及其他亞洲","",`
香港|Hong Kong|HKG|hong KONG|香港
北京|Beijing|PEK|bay-JING|中國大陸
上海|Shanghai|PVG/SHA|shang-HIGH|中國大陸
廣州|Guangzhou|CAN|gwang-JOH|中國大陸
深圳|Shenzhen|SZX|SHEN-JEN|中國大陸
成都|Chengdu|TFU|CHUNG-doo|中國大陸
重慶|Chongqing|CKG|chong-CHING|中國大陸
廈門|Xiamen|XMN|SHYAH-mun|中國大陸
福州|Fuzhou|FOC|foo-JOH|中國大陸
杭州|Hangzhou|HGH|hahng-JOH|中國大陸
南京|Nanjing|NKG|nan-JING|中國大陸
青島|Qingdao|TAO|ching-DOW|中國大陸
大連|Dalian|DLC|dah-lee-EN|中國大陸
武漢|Wuhan|WUH|woo-HAHN|中國大陸
西安|Xi'an|XIY|shee-AHN|中國大陸
鄭州|Zhengzhou|CGO|jung-JOH|中國大陸
德里|Delhi|DEL|DEL-ee|印度`],
    ["歐洲","",`
倫敦|London|LHR|LUN-duhn|英國
法蘭克福|Frankfurt|FRA|FRANK-furt|德國
阿姆斯特丹|Amsterdam|AMS|AM-ster-dam|荷蘭
維也納|Vienna|VIE|vee-EN-uh|奧地利
羅馬|Rome|FCO|ROHM|義大利
布拉格|Prague|PRG|PRAHG|捷克
巴黎|Paris||PAIR-iss|法國
慕尼黑|Munich||MYOO-nik|德國
雅典|Athens||ATH-inz|希臘
都柏林|Dublin||DUB-lin|愛爾蘭
馬德里|Madrid||muh-DRID|西班牙`],
    ["北美洲","",`
洛杉磯|Los Angeles|LAX|los AN-juh-luhs|美國
舊金山|San Francisco|SFO|san fran-SIS-koh|美國
西雅圖|Seattle|SEA|see-AT-uhl|美國
紐約|New York|JFK|noo YORK|美國
安大略（加州）|Ontario|ONT|on-TAIR-ee-oh|美國
鳳凰城|Phoenix|PHX|FEE-niks|美國
溫哥華|Vancouver|YVR|van-KOO-ver|加拿大`],
    ["大洋洲","",`
雪梨|Sydney|SYD|SID-nee|澳洲
墨爾本|Melbourne|MEL|MEL-burn|澳洲
布里斯本|Brisbane|BNE|BRIZ-buhn|澳洲
奧克蘭|Auckland|AKL|AWK-lund|紐西蘭
基督城|Christchurch|CHC|KRYST-church|紐西蘭`]
  ];
  const tips={
    Seoul:"英文常見讀法為一個音節，接近 soul，不要讀成 see-oul。",
    "Phnom Penh":"Phnom 的 ph 不按一般英文的 f 讀；保留原表的 puh-NOM PEN 作輔助記憶。",
    "Kuala Lumpur":"原表使用 KWAH-luh LOOM-poor，留意 Kuala 的連讀。近似拼讀不代表唯一英語或馬來語讀法。",
    "Chiang Mai":"原表的 chee-AHNG 是記憶提示；不要把拼讀格數視為當地語言的固定音節或重音規則。",
    Cebu:"原表提示第二音節較突出：seh-BOO。",
    Hanoi:"原表提示後段較突出：hah-NOY。",
    Surabaya:"原表分成四段：soo-rah-BAH-yah。",
    Denpasar:"原表提示中間較突出：den-PAH-sar；DPS 與峇里島 Bali 是同一機場的不同地名表達。",
    Bali:"DPS 位於登巴薩，Bali 指峇里島；保留兩種名稱，不把它們當成兩座不同機場。",
    Phoenix:"ph 發 f，oe 不分開讀，近似 FEE-niks。",
    Seattle:"中間接近 AT 的聲音，不是 see-TELL。",
    Ontario:"此處是美國加州的安大略市與 ONT 機場，不是加拿大安大略省。",
    Vancouver:"第二音節較突出：van-KOO-ver。",
    Christchurch:"作為延伸紐西蘭地名練習收錄，不表示華航目前有自營直飛。"
  };
  const extended=new Set(["Paris","Munich","Athens","Dublin","Madrid","Christchurch"]);
  const result=[];
  for(const [group,country,table]of groups)for(const line of table.trim().split("\n")){
    const [zh,en,code,hint,region]=line.split("|"),existing=D.places.find(p=>p.en===en);
    const status=extended.has(en)?"延伸地名／聯營轉機參考，非自營直飛清單":group==="日本"?"日本航點參考，含可能的集團／季節／歷史地名":"航點參考，實際營運方式請查班表";
    const item={...existing,id:existing?.id||`place-ci-${en.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/-$/,'')}`,en,zh,region:region||country,group,codes:code?code.split("/"):[],hint,category:existing?.category||category,categories:[...new Set([category,...(existing?.categories||[existing?.category||category])])],routeStatus:status,note:tips[en]||"",hintSource:"使用者提供的華航航點發音表（2026-10-15）；近似拼讀，非 IPA 或官方發音標準。",url:existing?.url||"https://booking.china-airlines.com/Flightschedule/",networkUrl:"https://www.china-airlines.com/tw/en/itinerary-booking/flight-information/global-destinations",checked:"2026-10-15",pronunciationUrl:existing?.pronunciationUrl||`https://www.collinsdictionary.com/search/?dictCode=english&q=${encodeURIComponent(en)}`,local:existing?.local||(group==="日本"?"日語地名的高低音與英語讀法不同，大寫記憶提示不代表日語重音。":""),example:existing?.example||`In this practice briefing, travelers check their itinerary for ${en}${code?` (${code})`:""}.`};
    if(existing)Object.assign(existing,item);else D.places.push(item);
    result.push(item);
  }
  D.ciDestinationGroups=groups.map(g=>g[0]);
  D.ciDestinations=result;
})(typeof window!=="undefined"?window:globalThis);
