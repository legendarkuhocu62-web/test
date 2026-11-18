'use strict';
/* Run from the project root: node tests/name-registry.test.js
   Does not use internet or install third-party packages. */
const assert=require('node:assert/strict');
const registry=require('../name-registry.js');
const cases=[
 ['Анна Петрова','female','name'],
 ['Михаил Березанский','male','name'],
 ['Александр Иванов','male','name'],
 ['Иванов Александр','male','name'],
 ['Ирина Соколова','female','name'],
 ['Марина Власова','female','name'],
 ['Алина','female','name'],
 ['Пётр','male','name'],
 ['Саша Иванова','female','surname-hint'],
 ['Саша Иванов','male','surname-hint'],
 ['Алекс Ким',null,'unknown-or-ambiguous'],
 ['Женя',null,'unknown-or-ambiguous'],
 ['Ким',null,'unknown-or-ambiguous'],
 ['Анна Иванов',null,'conflict'],
 ['',null,'empty'],
 ['Анна Петрович',null,'conflict'],
 ['Мария Иванова', 'female','name'],
 ['АЛЕКСАНДР ИВАНОВ','male','name'],
 ['  Анна    Петрова  ','female','name'],
 ['Руслан Шевченко','male','name']
];
for(const [name,expected,reason] of cases){
 const got=registry.detect(name);
 assert.equal(got.recommendedAvatar,expected,name);
 assert.equal(got.reason,reason,name+' reason');
}
assert.ok(registry.counts.male>=80,'male names unexpectedly missing');
assert.ok(registry.counts.female>=80,'female names unexpectedly missing');
console.log('PASS offline name registry: '+cases.length+' name and surname cases');
