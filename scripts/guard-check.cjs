const fs = require('fs');
const path = require('path');
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

function walk(dir){
  if(!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if(entry.isDirectory()) return walk(full);
    return full;
  });
}

walk('js')
  .filter(file => file.endsWith('.js'))
  .filter(file => !file.startsWith(path.join('vendor', path.sep)))
  .forEach(file => checkSyntax(file.replace(/\\/g, '/'), read(file)));

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

const missingAssets = [];
const sw = read('sw.js');
const assetsMatch = sw.match(/const ASSETS = \[([\s\S]*?)\];/);
if(assetsMatch){
  const assetPattern = /['"]([^'"]+)['"]/g;
  let assetMatch;
  while((assetMatch = assetPattern.exec(assetsMatch[1]))){
    const asset = assetMatch[1];
    if(/^https?:\/\//.test(asset)) continue;
    const clean = asset.replace(/^\.\//, '');
    const file = clean === '' ? 'index.html' : clean;
    if(!fs.existsSync(file)) missingAssets.push(asset);
  }
}

if(missingAssets.length){
  console.error('missing service-worker assets:');
  missingAssets.forEach(asset=>console.error(`- ${asset}`));
  process.exitCode = 1;
}else{
  console.log('ok service-worker assets exist');
}
