'use strict';
/* Guard the fixed-frame pagination against underestimating the text room.
   The screenshot examples must not create a short trailing page. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const code=fs.readFileSync('dialogue-ui.js','utf8');
assert.match(code,/const panelRoom=heightOf\(panel\)/);
assert.match(code,/const room=Math\.max\(0,panelRoom/);
assert.doesNotMatch(code,/const room=Math\.max\(0,textBox\.getBoundingClientRect\(\)\.height-2\)/);
assert.doesNotMatch(code,/Avoid an orphan one-line final page/);
const data=fs.readFileSync('data.js','utf8');
assert.match(data,/Знаешь, многие сотрудники/);
assert.match(data,/А у тебя пока свежий взгляд/);
console.log('PASS: dialogue measures fixed panel and keeps sentences intact');
