'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const app=fs.readFileSync('app.js','utf8');
const css=fs.readFileSync('style.css','utf8');
const index=fs.readFileSync('index.html','utf8');
for(const path of ['assets/edu01/schema-ek-v20-01.jpg','assets/edu01/act-ns-008-26.jpg']){
  const bytes=fs.readFileSync(path);
  assert.ok(bytes.length>150000,path+' missing or too short');
  assert.equal(bytes[0],0xff,path+' is not JPEG');
  assert.equal(bytes[1],0xd8,path+' is not JPEG');
  assert.equal(bytes[bytes.length-2],0xff,path+' is not complete JPEG');
  assert.equal(bytes[bytes.length-1],0xd9,path+' is not complete JPEG');
  assert.ok(app.includes(path),'EDU-01 has no document '+path);
}
assert.ok(app.includes('edu-doc--scans'),'EDU-01 image cards missing');
assert.ok(app.includes('edu-document-dialog'),'EDU-01 document modal missing');
assert.ok(app.includes('edu-reference--result'),'EDU-01 feedback page missing');
assert.ok(app.includes("action==='eduContinue'"),'EDU-01 continue after result missing');
assert.ok(app.includes('data-zoom-in'),'EDU-01 document zoom missing');
assert.ok(!app.includes('class="edu-doc"><b>СХЕМА КОНТРОЛЯ'),'old text imitation still active');
assert.ok(css.includes('EDU-01 approved scanned documents'),'new styles missing');
assert.ok(app.includes('class="edu-subtle-hint"'),'EDU-01 step 4 hint missing');
assert.ok(app.includes('какая информация поможет проверить причины и масштаб проблемы'),'hint text missing');
assert.ok(css.includes('quiet methodological cue'),'hint styling missing');
assert.ok(app.includes("chosen.join(',')==='1,2,3,4'"),'correct answers must stay unchanged');
assert.match(index,/app\.js\?v=[a-z0-9-]+/,'versioned app script missing');
assert.match(index,/style\.css\?v=[a-z0-9-]+/,'versioned styles missing');
for(const key of ["action==='edu1'","action==='edu2'","action==='edu3'","action==='edu4'","action==='finish'"]){
  assert.ok(app.includes(key),'existing EDU-01 exercise logic lost: '+key);
}
new Function(app);
console.log('EDU-01 approved-document test passed: 2 JPEGs, modal, old answer checks preserved.');
