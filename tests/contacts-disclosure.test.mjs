import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const window={};vm.runInNewContext(readFileSync('prototype/033-contacts-redesign-v2.js','utf8'),{window});
const personas=Array.from({length:10},(_,i)=>({id:'clone-'+i,name:'分身'+i}));
test('分身数量自适应：少量全部显示，多量可在原组展开及收起',()=>{
 const preview=window.EvaContactsUI.personaPreview;assert.equal(typeof preview,'function');
 assert.equal(preview(personas.slice(0,3),false,'').visible.length,3);
 assert.equal(preview(personas,false,'').visible.length,6);
 assert.equal(preview(personas,false,'').hiddenCount,4);
 assert.equal(preview(personas,true,'').visible.length,10);
 assert.equal(preview(personas,true,'').hiddenCount,0);
 assert.equal(preview([],false,'').visible.length,0);
 assert.equal(personas.length,10);
});
test('搜索能直接显示折叠区域里的命中分身；没有分身命中时保留主人分组',()=>{
 const preview=window.EvaContactsUI.personaPreview;assert.equal(typeof preview,'function');
 assert.equal(preview(personas,false,'分身9').visible[0].id,'clone-9');
 assert.equal(preview(personas,false,'分身9').visible.length,1);
 assert.equal(preview(personas,false,'分身9').filtered,true);
 assert.equal(preview(personas,false,'主人姓名').visible.length,6);
});
