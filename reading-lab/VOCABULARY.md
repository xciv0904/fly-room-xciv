# 全站詞彙擷取

這是原有 Reading Lab 解碼功能的資料供應器，不是另一套手工文章庫。原有 33 字的 ID、24 個起始待確認標記、IndexedDB、錄音 ID 和個人進度保持相容；文章移除後，已評級字詞的名稱與中文會保留在備份快照中，未再確認的讀音不冒充標準答案。

## 原始資料與範圍

- `index.html`：CI_BROADCAST_DRILLS、CI_MORE_MAGAZINE_DRILLS、CI_NEWS_RELEASES（包含 push 追加資料）、CI_EXTERNAL_BROADCASTS、READINGS、PA、FRAMES、STORY_BILINGUAL、PICTURE、STORY_LIBRARY。
- `ci-2025-data.js`：CI_2025_MAGAZINE_DRILLS、CI_2025_NEWS_RELEASES。組合陣列 CI_PDF_DRILLS 不再重複計算。
- `eva-data.js`：EVA_READING_PASSAGES 及英文面試回答。
- `question-bank.js`：六家航空／通用的英文問答長段落；同一題的英文問句、回答是分開的材料段落。
- `reading-lab/data.js`：實際產生的 288 個模擬版本，並非 288 篇獨立官方新聞。
- 原站 `ci-source-vocabulary.js` 與 `ci-vocabulary.js` 用於中文釋義，不作文章重複擷取。

AST 解析原始碼，不依賴目前 DOM 或展開狀態；有英文全文但目前未顯示的材料仍納入。只保留至少 12 個英文詞的段落，中文行、短問句、URL、字典、程式、測試及衍生檔案不作文章。沒有英文全文的新聞標題／中文摘要不能假裝掃描過英文原稿。航空公司可重疊，因此各公司列相加不等於去重材料數。

未來可直接在原有陣列新增物件，或新增 `articles/*.json`，使用 `title`、`airline`（或 `airlines`）、`text` 欄位。也支援 JSON/JavaScript 的 body/content/english/en/sample 等英文欄位，以及 articles/content/readings/materials 目錄的 Markdown；其他 Markdown 可在 frontmatter 設 `readingLabArticle: true`。動態連線取得或有插值的任意模板字串需要另加來源轉接器，不能聲稱已掃描遠端內容。

## 產生與部署

```sh
npm ci
npm run build:vocabulary -- --refresh-lexicon
npm test
npx playwright install chromium
npm run test:browser
```

首次下載鎖定版本字典到 `.cache/vocabulary`；`--refresh-lexicon` 重新挑出目前全文需要的字典項目，**不會改用未審核的新版字典**。無此參數時可使用已提交的字典子集離線建置，新字缺少資料會明示待確認。文章的內容與其使用的字典子集決定抽取快取；新增、刪除或修改文章時，無關文章沿用快取，最終來源索引重新彙整。

產物在 `generated/`：

- `vocabulary-index.json`：去重詞彙、所有來源與單句索引，以及原始檔案定位資訊。
- `vocabulary-report.json`：全數材料、各航空／種類計數、逐篇候選詞與出現次數、零候選及失敗清單。
- `vocabulary-audit.json`：固定種子隨機抽查 20 字的原句、IPA、CMU 音素及重音；自動核對字典原始資料，不代表人工音訊評分。
- `vocabulary-lexicon.json`：全文用到的字典子集，不是新建文章庫。
- `licenses/`：上游字典完整授權聲明。

合併至 main 後，`.github/workflows/vocabulary.yml` 自動建置、測試並提交有變動的 generated 檔，再明確要求既有 GitHub Pages 重建（bot push 不保證自動觸發 Pages）。使用 Actions 內建 token，沒有在公開前端放 API 金鑰。不更改現有 Pages 設定，也不強制推送。

## 資料品質邊界

候選規則包括 CMU 三音節以上、非首音節重音、多讀音、ECDICT 詞頻、航空專業詞、已知地名、待確認專名及個人曾標記的生字，非字母長度門檻。數字、日期、機型與縮寫另分類。篩選是候選機制，仍可能包含考生已熟悉的詞；可用已學會／未練習狀態縮小範圍。

每個主要詞保留原拼字、標準化形式、連結詞形、詞性候選、類型、難度、中文來源／確認狀態、IPA 選項、CMU 音節重音、全部來源原句與出現次數。不同屈折形式不強行合併；同拼字的詞性／多讀音各有讀音子 ID，語境未判定時不擅自選音；專名與普通詞分開。

IPA 原文來自 [ipa-dict 美式英語](https://github.com/open-dict-data/ipa-dict)，音素、音節數與重音來自 [CMUdict](https://github.com/cmusphinx/cmudict)，中文優先沿用原站語境字庫，其次採 [ECDICT](https://github.com/skywind3000/ECDICT) 並轉繁體。確切 commit 記於 JSON，便於查核。IPA 與 CMU 多讀音順序不假設一致。

顯示的「音素分組」只是在已知發音上做演算法輔助切分，不是假裝有字典確認的字母音節劃分。缺少可靠資料時 IPA、音節與重音待確認，專名另提示英文常見讀法不等於當地語言讀法。中文未收錄時明示待人工確認，不把整段中文文章冒充逐字翻譯。瀏覽器 TTS 僅是裝置合成音，字典連結可供另行核對。

前端只下載一次產生好的索引，不重掃全文；完整文章按需從原始資料檔讀取，SHA-256 核對內容，無 eval，不新增第二套完整文章庫。單字例句各為 Intl.Segmenter 切出的所在一句，可展開所有文章來源。錄音預設只存此裝置，不因辨識錯字自動判定發音錯誤。

## 驗收

`tests/vocabulary.test.cjs` 檢查全來源覆蓋、去重、單句與次數、20 字字典比對、暫存測試文章新增／修改／刪除及既有 ID、備份相容。測試文章只放系統暫存目錄，測後移除，不污染正式題庫。

`tests/reading-lab-browser.cjs` 測試 390/768/1280px、篩選搜尋隨機、先猜後揭曉、全文來源、Chromium 模擬麥克風 MediaRecorder、權限拒絕、不支援時貼稿／匯入、原有朗讀、逐字稿、每日任務、備份與地名功能，並阻擋外站請求。這不等於已在實體 iPhone/Safari 或真實麥克風完成驗證；仍需用本人裝置確認權限與音訊格式。
