const fs = require('fs');
const vm = require('vm');

function read(path){
  return fs.readFileSync(path, 'utf8');
}

function checkSyntax(label, source){
  try{
    new vm.Script(source, {filename: label});
    console.log(`ok syntax: ${label}`);
  }catch(error){
    console.error(`syntax error: ${label}`);
    console.error(error.message);
    process.exitCode = 1;
  }
}

const html = read('index.html');
const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(match=>match[1])
  .join('\n');

checkSyntax('index.html inline scripts', inlineScripts);
checkSyntax('sw.js', read('sw.js'));
checkSyntax('js/core/dom.js', read('js/core/dom.js'));

const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(match=>match[1]));
const missing = [];
const directBinding = /document\.getElementById\(['"]([^'"]+)['"]\)\.(addEventListener|onclick|classList|style|textContent|innerHTML|value|checked)/g;
let match;
while((match = directBinding.exec(html))){
  if(!ids.has(match[1])) missing.push(`${match[1]} via ${match[2]}`);
}

if(missing.length){
  console.error('missing DOM ids:');
  [...new Set(missing)].forEach(item=>console.error(`- ${item}`));
  process.exitCode = 1;
}else{
  console.log('ok DOM ids: direct bindings resolve');
}
