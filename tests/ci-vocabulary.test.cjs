const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.join(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");

function setup(saved=[]){
  const sandbox={
    Intl,
    window:{prompt(){throw new Error("Source words must not require manual translation");}},
    todayStr:()=>"2026-10-15",
    store:{get:()=>saved,set:(key,value)=>{sandbox.saved=JSON.parse(JSON.stringify(value));}},
  };
  vm.createContext(sandbox);
  for(const file of ["ci-2025-data.js","ci-vocabulary.js","ci-source-vocabulary.js"]){
    vm.runInContext(fs.readFileSync(path.join(root,file),"utf8"),sandbox);
  }
  const slice=(start,end)=>html.slice(html.indexOf(start),html.indexOf(end));
  vm.runInContext(slice("const CI_BROADCAST_DRILLS","const CI_EXTERNAL_FOLLOWUPS")+
    ";this.articles=[...CI_PDF_DRILLS,...CI_NEWS_RELEASES,...CI_EXTERNAL_BROADCASTS];",sandbox);
  vm.runInContext(slice("const PRONUNCIATION_ZH","function pronunciationRender"),sandbox);
  vm.runInContext(slice("function ciTokens(","function ciLcs("),sandbox);
  return sandbox;
}

test("every collectable source word has Chinese and a verbatim source sentence",()=>{
  const s=setup(),words=new Set();
  assert.ok(s.articles.length>=63);
  for(const article of s.articles){
    const tokens=[...s.ciTokens(article.text).filter(w=>w.length>3),...s.ciKeyTerms(article.text).map(x=>x.key)];
    for(const word of tokens){
      words.add(word);
      assert.ok(s.ciSourceMeaning(word),`${article.title}: missing Chinese for ${word}`);
      const sentence=s.ciWordSentence(word,article.text);
      assert.ok(sentence,`${article.title}: missing sentence for ${word}`);
      assert.ok(article.text.includes(sentence),`${word}: example must be verbatim`);
      const sentenceCount=Array.from(new Intl.Segmenter("en",{granularity:"sentence"}).segment(sentence)).length;
      assert.equal(sentenceCount,1,`${word}: example must contain only one sentence`);
    }
  }
  assert.ok(words.size>=1900);
});

test("new saves take only the matching sentence from a full article",()=>{
  const s=setup();
  const context="We enjoyed the trip. The exquisite design is unique. Thank you for flying with us.";
  assert.ok(s.savePronunciationWord("exquisite","華航廣播","",context));
  assert.equal(s.saved[0].zh,"精緻的；精美的");
  assert.equal(s.saved[0].context,"The exquisite design is unique.");
  s.savePronunciationWord("exquisite","華航廣播","我自己填寫的意思",context);
  s.savePronunciationWord("exquisite","華航廣播","",context);
  assert.equal(s.saved[0].zh,"我自己填寫的意思");
});

test("old saves repair missing Chinese and long contexts without changing progress",()=>{
  const s=setup([
    {word:"livery",zh:"",context:"First sentence. The aircraft has a themed livery. Final sentence.",hits:4,practice:3,due:"2026-11-01",ivl:8},
    {word:"themed",zh:"我的翻譯",context:"First sentence. The aircraft has a themed livery. Final sentence.",hits:2,practice:1,due:"2026-11-02",ivl:4},
    {word:"collaboration",zh:"",hits:1,practice:0},
  ]);
  s.repairPronunciationWords();
  assert.equal(s.saved[0].zh,"機身彩繪；塗裝");
  assert.equal(s.saved[0].context,"The aircraft has a themed livery.");
  assert.deepEqual([s.saved[0].hits,s.saved[0].practice,s.saved[0].due,s.saved[0].ivl],[4,3,"2026-11-01",8]);
  assert.equal(s.saved[1].zh,"我的翻譯");
  assert.equal(s.saved[1].context,"The aircraft has a themed livery.");
  assert.ok(s.saved[2].zh);
  assert.ok(s.articles.some(d=>d.text.includes(s.saved[2].context)));
  const next=setup(s.saved);
  next.repairPronunciationWords();
  assert.equal(next.saved,undefined,"repair must be idempotent after reload");
});

test("Unicode, whole-word boundaries, numbers and old fragments",()=>{
  const s=setup();
  assert.deepEqual(Array.from(s.ciTokens("Pokémon Glöckler paper-mâché")),["pokémon","glöckler","paper","mâché"]);
  assert.equal(s.ciWordSentence("art","The artist works. Art brings us together."),"Art brings us together.");
  assert.equal(s.ciWordSentence("350","The A350 is here. The A350-1000 is larger."),"The A350 is here.");
  assert.equal(s.ciWordSentence("pok","This Pokémon-themed aircraft is ready. Welcome aboard."),"This Pokémon-themed aircraft is ready.");
  assert.equal(s.ciWordSentence("notfound","No matching word here."),"");
  assert.equal(s.ciSourceMeaning("definitely-not-a-real-word"),"");
});
