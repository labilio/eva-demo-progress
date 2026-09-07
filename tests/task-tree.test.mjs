import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const window={};vm.runInNewContext(fs.readFileSync(new URL('../prototype/050-task-tree.js',import.meta.url),'utf8'),{window});
const family=window.EvaTaskTree.family;
const rows=Array.from({length:8},(_,i)=>({id:'t'+i,parent_issue_id:i?'t'+(i-1):null,workspace_id:'prod'}));
test('deep leaf resolves full ancestor path and siblings without a two-level limit',()=>{
 const data=family([...rows,{id:'sibling',parent_issue_id:'t1',workspace_id:'prod'}],'t7');
 assert.equal(data.root.id,'t0');assert.equal(data.path.length,8);assert.deepEqual(Array.from(data.children.get('t1'),r=>r.id),['t2','sibling']);
});
test('task tree never follows parent or children across project boundaries',()=>{
 const data=family([...rows,{id:'other',parent_issue_id:'t0',workspace_id:'other'}],'t7');assert.equal(data.index.has('other'),false);
 const orphan=family([{id:'a',workspace_id:'prod',parent_issue_id:'b'},{id:'b',workspace_id:'other'}],'a');assert.equal(orphan.root.id,'a');
});
test('cycle fails safely and missing tasks do not show another family',()=>{
 assert.ok(family([{id:'a',parent_issue_id:'b'},{id:'b',parent_issue_id:'a'}],'a').error);assert.equal(family(rows,'missing'),null);
});
