const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const acorn=require('acorn'),walk=require('acorn-walk');
const hash=t=>crypto.createHash('sha256').update(t).digest('hex');
const tokens=t=>String(t).replace(/https?:\/\/\S+|\b[\w.-]+\.(?:com|org|net|tw)(?:\/\S*)?/gi,' ').match(/[A-Za-z]+\d+(?:[-/]\d+)*[A-Za-z]*|\d{3}(?:-\d+[A-Za-z]*|X)|\d+(?:[.,/-]\d+)*(?:st|nd|rd|th)?|[\p{Script=Latin}]+(?:['’.-][\p{Script=Latin}]+)*/gu)||[];
function english(text){return String(text).replace(/\\n/g,'\n').split('\n').filter(line=>{const letters=(line.match(/[a-z]/gi)||[]).length,zh=(line.match(/[\u3400-\u9fff]/g)||[]).length;return letters>3&&zh<letters*.15;}).join('\n').trim();}
function literal(node){if(!node)return undefined;if(node.type==='Literal')return node.value;if(node.type==='TemplateLiteral'&&!node.expressions.length)return node.quasis.map(q=>q.value.cooked).join('');if(node.type==='ArrayExpression')return node.elements.map(literal);return undefined;}
const textFields=new Set(['text','body','content','english','en','sample','q_en','a_en','enQ','enA','zh']);
function collect(root){
  const articles=[],failures=[],files=[],excluded=[],seen=new Set();
  function add({file,collection,index,field,values,text,locator,line}){
    const cleaned=english(text);if(tokens(cleaned).length<12){excluded.push({file,collection,field,reason:'非英文長段落或少於 12 個英文詞，非文章'});return;}
    const title=String(values.title||values.t||values.n||values.type||values.q_zh||values.q||`${collection} ${index+1}`).slice(0,180);
    let airlines=Array.isArray(values.airlines)?values.airlines:values.airline?[values.airline]:values.air?[values.air]:collection.startsWith('CI_')?['華航']:collection.startsWith('EVA_')?['長榮']:['通用'];
    const kind=['雜誌','新聞稿','朗讀文章','廣播詞','面試英文段落','模擬朗讀'].includes(values.kind)?values.kind:/MAGAZINE|CI_BROADCAST_DRILLS/.test(collection)?'雜誌':/NEWS_RELEASES/.test(collection)?'新聞稿':/q_en|a_en|enA|enQ/.test(field)||/STORY|FRAME|QUESTION/.test(collection)?'面試英文段落':/EXTERNAL|^PA$/.test(collection)?'廣播詞':'朗讀文章';
    const key=`${file}:${collection}:${title}:${field}`;let id='article-'+hash(key).slice(0,16);if(seen.has(id))id+='-'+hash(cleaned).slice(0,8);if(seen.has(id))return;seen.add(id);
    const sentences=Array.from(new Intl.Segmenter('en',{granularity:'sentence'}).segment(cleaned),x=>x.segment.trim()).filter(Boolean);
    articles.push({id,title,airlines,kind,sourceFile:file,collection,field,line,locator,source:values.trace||values.source||file,sourceUrl:`https://github.com/xciv0904/fly-room-xciv/blob/main/${file}#L${line}`,contentHash:hash(cleaned),originalHash:hash(String(text)),sentences,text:cleaned});
  }
  function parseJS(source,file,offset=0){
    const lineOffset=offset?(fs.readFileSync(path.join(root,file),'utf8').slice(0,offset).match(/\n/g)||[]).length:0;
    let tree;try{tree=acorn.parse(source,{ecmaVersion:'latest',sourceType:'script',locations:true});}catch(error){failures.push({file,reason:'JavaScript 解析失敗：'+error.message});return;}
    walk.ancestor(tree,{ObjectExpression(node,ancestors){
      const values={},nodes={};for(const p of node.properties||[]){if(p.type!=='Property'||p.computed)continue;const key=p.key.name||p.key.value;values[key]=literal(p.value);nodes[key]=p.value;}
      const declaration=[...ancestors].reverse().find(a=>a.type==='VariableDeclarator'),assignment=ancestors.find(a=>a.type==='AssignmentExpression');
      const call=[...ancestors].reverse().find(a=>a.type==='CallExpression'&&a.callee.type==='MemberExpression'&&a.callee.property.name==='push');
      const collection=call?.callee.object.name||declaration?.id?.name||assignment?.left?.property?.name||'data';
      let index=0;for(let i=ancestors.length-2;i>=0;i--)if(ancestors[i].type==='ArrayExpression'){index=ancestors[i].elements.indexOf(ancestors[i+1]);break;}
      for(const field of textFields)if(typeof values[field]==='string'){
        const value=nodes[field];add({file,collection,index,field,values,text:values[field],line:lineOffset+value.loc.start.line,locator:{format:'js-string',start:offset+value.start,end:offset+value.end}});
      }
    }});
  }
  const ignored=new Set(['node_modules','.git','.cache','generated','tests','scripts']);
  function scan(dir){for(const name of fs.readdirSync(dir).sort()){
    if(ignored.has(name)||name.startsWith('.'))continue;const full=path.join(dir,name),file=path.relative(root,full).split(path.sep).join('/');if(fs.statSync(full).isDirectory()){scan(full);continue;}
    if(!/\.(js|json|md|html)$/i.test(file))continue;
    if(/(?:vocabulary|airline-data|app-router|app-accessibility|ci-mode|eva-mode|ci-reading)\.js$/.test(file)||/^reading-lab\/(?:app|core|db|media|ci-destinations)\.js$/.test(file)||/package(?:-lock)?\.json$/.test(file)||/README\.md$/.test(file))continue;
    const source=fs.readFileSync(full,'utf8');files.push({file,hash:hash(source)});
    if(file==='reading-lab/data.js')continue;
    if(file.endsWith('.js'))parseJS(source,file);
    else if(file.endsWith('.html')){for(const m of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)){const start=m.index+m[0].indexOf('>')+1;parseJS(m[1],file,start);}}
    else if(file.endsWith('.json')){
      try{const data=JSON.parse(source);(function visit(value,keys=[]){if(!value||typeof value!=='object')return;for(const [key,child]of Object.entries(value)){if(textFields.has(key)&&typeof child==='string')add({file,collection:keys.filter(k=>!/^\d+$/.test(k)).join('.')||'JSON',index:Number(keys.at(-1))||0,field:key,values:value,text:child,line:1,locator:{format:'json',path:[...keys,key]}});else if(typeof child==='object')visit(child,[...keys,key]);}})(data);}catch(error){failures.push({file,reason:'JSON 解析失敗：'+error.message});}
    }else if(/^(?:articles|content|readings|materials)\//.test(file)||/^---[\s\S]*?readingLabArticle:\s*true/.test(source)){
      const start=source.startsWith('---')?source.indexOf('\n---',3)+4:0;const body=source.slice(start);add({file,collection:'Markdown',index:0,field:'body',values:{title:body.match(/^#\s+(.+)$/m)?.[1]||path.basename(file)},text:body,line:1,locator:{format:'slice',start,end:source.length}});
    }
  }}
  scan(root);
  const sandbox={};sandbox.window=sandbox;vm.createContext(sandbox);try{vm.runInContext(fs.readFileSync(path.join(root,'reading-lab/data.js'),'utf8'),sandbox);for(const [index,q]of sandbox.ReadingLabData.questions.entries()){
    const before=articles.length;add({file:'reading-lab/data.js',collection:'ReadingLabData.questions',index,field:'text',values:{title:q.id+' · '+q.title,airline:q.airline,source:q.source},text:q.text,line:1,locator:{format:'lab-question',id:q.id}});if(articles.length>before)articles.at(-1).kind='模擬朗讀';
  }}catch(error){failures.push({file:'reading-lab/data.js',reason:error.message});}
  return {articles,failures,files,excluded};
}
module.exports={collect,tokens,hash,english};
