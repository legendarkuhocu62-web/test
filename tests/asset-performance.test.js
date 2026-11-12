'use strict';
/* Approved source artwork remains untouched. Compression is independent and local. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const report=JSON.parse(fs.readFileSync('assets/optimized/report.json','utf8'));
const scripts=['app.js','style.css','s02-ui.js','index.html','assets/manifest.json']
  .map(path=>fs.readFileSync(path,'utf8')).join('\n');
const manifest=JSON.parse(fs.readFileSync('assets/manifest.json','utf8'));
assert.ok(report.assets.length>=15,'not all expensive PNGs were converted');
let oldTotal=0,newTotal=0;
for(const entry of report.assets){
 const original=fs.readFileSync(entry.original),optimized=fs.readFileSync(entry.optimized);
 assert.equal(original.length,entry.original_bytes,entry.original);
 assert.equal(optimized.length,entry.optimized_bytes,entry.optimized);
 assert.equal(optimized.toString('ascii',0,4),'RIFF',entry.optimized);
 assert.equal(optimized.toString('ascii',8,12),'WEBP',entry.optimized);
 assert.ok(optimized.length<original.length*.95,'not meaningfully smaller: '+entry.optimized);
 assert.ok(scripts.includes(entry.optimized),'not used in runtime: '+entry.optimized);
 const registered=Object.values(manifest.assets).find(a=>a.path===entry.optimized);
 if(registered) assert.equal(registered.original_path,entry.original,'lost original backup in manifest');
 if(entry.original.includes('production-report')||entry.original.includes('employee_badge'))
   assert.equal(entry.pixel_lossless,true,'text-containing document must be lossless');
 oldTotal+=original.length;newTotal+=optimized.length;
}
assert.equal(oldTotal,report.original_total_bytes);
assert.equal(newTotal,report.optimized_total_bytes);
assert.ok(newTotal<oldTotal*.4,'expected significant reduction in bytes');
const index=fs.readFileSync('index.html','utf8');
assert.match(index,/media="\(max-width: 720px\)".+S00_start_mobile_composite\.jpeg/);
assert.match(index,/media="\(min-width: 721px\)".+Главный-экран\.webp/);
console.log('PASS optimized artwork: '+report.assets.length+
  ' originals preserved, original='+oldTotal+'B optimized='+newTotal+
  'B saved='+report.saved_percent+'%');
