import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createPatchedRuntime} from '../tools/build-runtime.mjs';
test('文件库回跳使用完整项目路由，不依赖目标页加载前的定时事件',()=>{
 const source=fs.readFileSync('prototype/020-mode-layer.js','utf8');
 const start=source.indexOf('  function bridgeSelectedResource()'),end=source.indexOf('  function openResourceLocation',start);
 const location={hash:''};let closed=false;
 vm.runInNewContext(source.slice(start,end)+';bridgeSelectedResource();',{selectedResource:()=>({projectId:'prod'}),state:{workspaceId:'other'},closeDrive:()=>{closed=true;},location,setTimeout:()=>{},window:{}});
 assert.equal(location.hash,'#/collab?evaProject=prod&evaTab=files');assert.equal(closed,true);
 const runtime=createPatchedRuntime().source;
 assert.match(runtime,/evaInitialProjectTab=new URLSearchParams\(useLocation\(\)\.search\)\.get\("evaTab"\)/);
 assert.match(runtime,/useState\(evaInitialProjectTab==="files"\?"files":"tasks"\)/);
});
