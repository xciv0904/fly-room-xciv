const fs=require('node:fs'),path=require('node:path'),{Readable}=require('node:stream'),{pipeline}=require('node:stream/promises'),{parse}=require('csv-parse');
const sources={
  cmu:{repo:'cmusphinx/cmudict',revision:'74790861f652b15e4ac49015a90074ad62a27690',file:'cmudict.dict'},
  ipa:{repo:'open-dict-data/ipa-dict',revision:'43c3570eb3553bdd19fccd2bd0091534889af023',file:'data/en_US.txt'},
  zh:{repo:'skywind3000/ECDICT',revision:'bc015ed2e24a7abef49fc6dbbb7fe32c1dadaf8b',file:'ecdict.csv'}
};
async function download(root){
  const cache=path.join(root,'.cache/vocabulary');fs.mkdirSync(cache,{recursive:true});
  for(const [name,s]of Object.entries(sources)){
    const target=path.join(cache,name+'-'+s.revision);if(!fs.existsSync(target)){
      const url=`https://raw.githubusercontent.com/${s.repo}/${s.revision}/${s.file}`;console.log('Downloading',url);
      const response=await fetch(url,{signal:AbortSignal.timeout(180000)});if(!response.ok)throw Error(`詞典下載失敗 ${response.status}: ${name}`);
      const pending=target+'.pending';await pipeline(Readable.fromWeb(response.body),fs.createWriteStream(pending));fs.renameSync(pending,target);
    }
    s.local=target;
    const license=path.join(root,'generated/licenses',name+'.txt');fs.mkdirSync(path.dirname(license),{recursive:true});if(!fs.existsSync(license)){
      const r=await fetch(`https://raw.githubusercontent.com/${s.repo}/${s.revision}/LICENSE`);if(!r.ok)throw Error('缺少字典授權');fs.writeFileSync(license,await r.text());
    }
  }
}
async function prepare(root,wanted){
  await download(root);const result={};const row=key=>result[key]||(result[key]={});
  for(const line of fs.readFileSync(sources.cmu.local,'utf8').split('\n')){
    const [key,...phones]=line.split('#')[0].trim().split(/\s+/),word=key?.replace(/\(\d+\)$/,'');if(wanted.has(word)){const item=row(word);(item.phones||(item.phones=[])).push(phones);}
  }
  for(const line of fs.readFileSync(sources.ipa.local,'utf8').split('\n')){const [word,text]=line.split('\t');if(wanted.has(word)&&text)row(word).ipa=[...text.matchAll(/\/[^/]+\//g)].map(m=>m[0]);}
  const converter=require('opencc-js').Converter({from:'cn',to:'twp'});
  const csv=fs.createReadStream(sources.zh.local).pipe(parse({columns:true,skip_empty_lines:true,relax_quotes:true}));
  for await(const record of csv)if(wanted.has(record.word?.toLowerCase()))Object.assign(row(record.word.toLowerCase()),{headword:record.word,zh:converter(record.translation||'').replace(/\\n/g,'\n'),pos:record.pos||'',bnc:Number(record.bnc)||0,frq:Number(record.frq)||0,exchange:record.exchange||''});
  const meta=Object.fromEntries(Object.entries(sources).map(([key,{repo,revision,file}])=>[key,{repo,revision,file,url:`https://github.com/${repo}/blob/${revision}/${file}`} ]));
  return {sources:meta,entries:result};
}
module.exports={prepare,sources};
