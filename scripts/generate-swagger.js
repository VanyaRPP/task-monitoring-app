const fs = require('fs');
const path = require('path');
function getApiFiles(dir){
  const entries = fs.readdirSync(dir,{withFileTypes:true});
  let files=[];
  for(const entry of entries){
    const fullPath=path.join(dir,entry.name);
    if(entry.isDirectory()) files=files.concat(getApiFiles(fullPath));
    else if(entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') && !entry.name.endsWith('.json')){
      files.push(fullPath);
    }
  }
  return files;
}
function pathFromFile(file){
  let rel = path.relative(path.join(__dirname,'..','pages','api'), file).replace(/\\/g,'/').replace(/\.ts$/,'');
  if(rel.endsWith('/index')) rel = rel.slice(0,-6);
  return '/api/'+rel;
}
function parseMethods(file){
  const content = fs.readFileSync(file,'utf8');
  const methods=new Set();
  const regex=/case ['"`]([A-Z]+)['"`]/g;
  let m;while((m=regex.exec(content))) methods.add(m[1].toLowerCase());
  if(methods.size===0){
    if(/req\.method\s*===\s*['"`]([A-Z]+)['"`]/.test(content)){
      methods.add(RegExp.$1.toLowerCase());
    } else {
      methods.add('get');
    }
  }
  return Array.from(methods);
}
function generate(){
  const apiDir=path.join(__dirname,'..','pages','api');
  const files=getApiFiles(apiDir);
  const paths={};
  for(const file of files){
    const url=pathFromFile(file);
    const methods=parseMethods(file);
    if(!paths[url]) paths[url]={};
    for(const method of methods){
      paths[url][method]={ summary:`${method.toUpperCase()} ${url}`, responses:{200:{description:'OK'}} };
    }
  }
  const spec={ openapi:'3.0.0', info:{ title:'Task Monitoring App', version:'1.0.0'}, paths };
  const outPath=path.join(__dirname,'..','public','swagger.json');
  fs.writeFileSync(outPath, JSON.stringify(spec,null,2));
  console.log('Swagger spec generated with', Object.keys(paths).length,'paths');
}
if(require.main===module) generate();
