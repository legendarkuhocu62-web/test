/* Check narrative punctuation without changing original authored story or answer options. */
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync('data.js','utf8'),sandbox);
const d=sandbox.window.CEH_DATA;
const dialogues=[
 ...d.intro.map(x=>['intro',x]),
 ...d.questions.map(x=>['question answer',x.answer]),
 ...d.hypotheses.map(x=>['hypothesis reply',x.reply]),
 ...d.people.flatMap(x=>[['speech',x.speech],['specialist reply',x.reply]])
];
for(const [label,raw] of dialogues){
 const value=String(raw).trim();
 assert.match(value,/[.!?…»”]$/,'Missing terminal punctuation in '+label+': '+value);
}
assert.equal(dialogues.length,16,'Unexpected change in the number of dialogues');
console.log('PASS: terminal punctuation in '+dialogues.length+' scripted dialogue fragments');
