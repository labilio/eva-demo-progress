import test from 'node:test';
import assert from 'node:assert/strict';
import {menuOf, filterRows, visibleDeveloperRows, buildDeveloperPrompt, prototypeLink} from '../review/developer-domain.mjs';
import {createCommentsStore} from '../review/comments-store.mjs';
import {runCommentsCommand} from '../tools/comments-cli.mjs';
const id='aaaaaaaa-1111-4111-8111-111111111111';
const row={id,seq:28,page_path:'#/collab',status:'approved',kind:'function',body:'保持完整原文\n第二段',anchor:{selector:'[data-project]',view:{projectId:'prod',tab:'settings'},quote:'项目设置'},replies:[{author_name:'同事',body:'补充讨论'}]};
test('menus separate personal and team AI and handle encoded routes',()=>{
 assert.equal(menuOf('#/conversation/abc'),'personal');assert.equal(menuOf('#/messages?evaIM=my-ai'),'my-ai');assert.equal(menuOf('#/messages'),'messages');assert.equal(menuOf('#/eva-stub/%E6%8A%80%E8%83%BD'),'skills');assert.equal(menuOf('#/unknown'),'other');
});
test('filters intersect menu status owner and discussion search',()=>{
 const rows=[row,{...row,id:'b',status:'doing',claimed_by:'同事'}];
 assert.deepEqual(filterRows(rows,{menu:'projects',status:'approved',claim:'unclaimed',search:'补充讨论'}),[row]);assert.equal(filterRows(rows,{menu:'messages'}).length,0);
});
test('prompt contains actual Git context and complete frontend discussion context without mutating data',()=>{
 const before=JSON.stringify(row);const prompt=buildDeveloperPrompt([row],{commit:'abc123',branch:'codex/example',version:'v1'},'https://example.com');
 for(const text of ['abc123','codex/example','github.com/labilio/eva-demo-progress',id,'prototype-manifest.json','补充讨论','prod','settings','第二段','AGENTS.md'])assert.ok(prompt.includes(text),text);
 assert.equal(JSON.stringify(row),before);assert.equal(new URL(prototypeLink(row,'https://example.com')).hash,'#/collab');
});
test('claim sends one atomic batch RPC and validates empty names before requests',async()=>{
 const calls=[];const store=createCommentsStore({url:'https://example.com',key:'public',fetchImpl:async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify([{...row,claimed_by:'甲',status:'doing'}]));}});
 await assert.rejects(store.claim([id],''));assert.equal(calls.length,0);
 const rows=await store.claim([id,id],'甲');assert.equal(rows[0].status,'doing');assert.match(calls[0].url,/rpc\/eva_claim_comments$/);assert.deepEqual(JSON.parse(calls[0].options.body),{comment_ids:[id],actor:'甲',release_claim:false});
});
test('CLI can fetch selected IDs and claim without changing approval itself',async()=>{
 let captured;await runCommentsCommand(['list','--ids',id],{store:{list:async(...args)=>{captured=args;return[];}},write:()=>{}});assert.deepEqual(captured,[undefined,[id]]);
 await runCommentsCommand(['claim','--ids',id,'--author','甲'],{store:{claim:async(...args)=>{captured=args;return[];}},write:()=>{}});assert.deepEqual(captured,[[id],'甲',false]);
});
test('column filters intersect exact names and kind while preserving incoming order',()=>{
 const rows=[{...row,id:'c',author_name:'甲',claimed_by:'乙'}, {...row,id:'b',author_name:'甲乙',claimed_by:'乙'}, {...row,id:'a',author_name:'甲',claimed_by:null}, {...row,id:'d',author_name:'甲',claimed_by:'乙',kind:'ui'}];
 assert.deepEqual(filterRows(rows,{kind:'function',author:'name:甲',claim:'name:乙'}).map(r=>r.id),['c']);
 assert.deepEqual(filterRows(rows,{author:'name:甲',claim:'unclaimed'}).map(r=>r.id),['a']);
 assert.deepEqual(filterRows(rows,{claim:'claimed'}).map(r=>r.id),['c','b','d']);
 assert.deepEqual(filterRows(rows,{author:'name:不存在'}),[]);
 assert.deepEqual(filterRows(rows).map(r=>r.id),['c','b','a','d']);
});

test('status changes retain the edited row at its original position until explicit filtering',()=>{
 const rows=[{...row,id:'before'}, {...row,id:'edited',status:'done',claimed_by:'Codex'}, {...row,id:'after'}];
 const filters={status:'approved',claim:'unclaimed'};
 assert.deepEqual(visibleDeveloperRows(rows,filters,new Set(['edited'])).map(r=>r.id),['before','edited','after']);
 assert.deepEqual(visibleDeveloperRows(rows,filters).map(r=>r.id),['before','after']);
 assert.deepEqual(visibleDeveloperRows(rows,{status:'done',claim:'all'}).map(r=>r.id),['edited']);
 assert.deepEqual(visibleDeveloperRows(rows,{}).map(r=>r.id),['before','edited','after']);
});
