import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createPatchedRuntime} from '../tools/build-runtime.mjs';
const read = path => fs.readFileSync(path, 'utf8');
const runtime = createPatchedRuntime().source;

test('历史栏识别不把可滚动的一级导航隐藏', () => {
  const source=read('prototype/042-personal-conversation-columns.js');
  const start=source.indexOf('  function historyIn('), end=source.indexOf('  function isPersonalConversation',start);
  assert.ok(start>=0&&end>start);
  const ctx={}; vm.runInNewContext(source.slice(start,end),ctx);
  const node=(nav,history)=>({className:'flex-1 overflow-y-auto',querySelector:s=>s.includes('eva-nav-section')?nav:history});
  const navigation=node(true,false), unrelated=node(false,false), history=node(false,true);
  assert.equal(ctx.historyIn({children:[navigation,unrelated]}),null);
  assert.equal(ctx.historyIn({children:[navigation,history]}),history);
  assert.equal(ctx.historyIn(null),null);
});

test('AI团队筛选排除历史助理且保留分身员工', () => {
  const source=read('prototype/009-5-patch-im.js');
  const match=source.match(/const teamIdentities\s*=\s*([^;]+);/);
  assert.ok(match,'缺少团队身份过滤');
  const snapshot={identities:[{id:'old',role:'assistant'},{id:'p',role:'persona'},{id:'e',role:'employee'}]};
  const ids=vm.runInNewContext(`(${match[1]}).map(i=>i.id).join(',')`,{snapshot});
  assert.equal(ids,'p,e');
  const body=source.slice(source.indexOf('function EvaAITeamPage()'),source.indexOf('\n    const cut',source.indexOf('function EvaAITeamPage()')));
  assert.doesNotMatch(body,/open\('connect'\)|store\.connectAssistant\(|roleGroup\('assistant'/);
  assert.match(body,/requestedIdentityId/);
  assert.match(body,/const identity = teamIdentities\.find/);
});

test('项目设置与概览使用独立根类，设置字段样式可以命中', () => {
  assert.match(runtime,/className:'eva-project-settings-info'/);
  assert.match(runtime,/className:"eva-project-info"/);
  const css=read('prototype/009-2-members.css');
  assert.match(css,/\.eva-project-settings-info\s*\{/);
  assert.match(css,/\.eva-project-settings-info \.eva-project-info-field\s*\{[^}]*flex-direction:column/);
  assert.match(css,/\.eva-project-settings-info \.eva-project-info-field textarea\s*\{[^}]*width:100%/);
});

test('AI名称与标记共用身份行，标题不扩大组合头像子图', () => {
  const css=read('prototype/046-ai-team.css');
  assert.match(css,/\.eva-ai-team__identity-name\s*\{[^}]*flex:\s*0 1 auto/);
  assert.match(read('prototype/009-5-patch-im.js'),/className:'eva-identity-name-row'/);
  const hierarchy=read('prototype/016-message-hierarchy.css');
  assert.doesNotMatch(hierarchy,/\.wk-chat-conversation-header-channel-avatar img\s*\{[^}]*width:\s*28px\s*!important/);
  assert.match(runtime,/eva:contact-personas/);
});
