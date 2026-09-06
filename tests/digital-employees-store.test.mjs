import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
const source=readFileSync(new URL('../prototype/009-3-digital-employees-store.js',import.meta.url),'utf8');
function load(saved){
  let persisted=saved?JSON.stringify(saved):null;
  class FixedDate extends Date {constructor(...args){super(...(args.length?args:['2026-09-06T12:00:00.000Z']));}}
  const window={crypto:webcrypto,__EVA_DIGITAL_EMPLOYEES_DATA:{agents:[{id:'staff-1',kind:'staff',name:'专家',ownership:'organization'},{id:'project-1',kind:'team',name:'项目助手'}],runtimes:[{key:'dify'}]},localStorage:{getItem:()=>persisted,setItem:(_,value)=>persisted=value}};
  vm.runInNewContext(source,{window,structuredClone,Date:FixedDate});
  return {store:window.EvaDigitalEmployeesStore,saved:()=>JSON.parse(persisted)};
}
test('membership is explicit, duplicate-safe, persistent and removal preserves messages',()=>{
  const {store,saved}=load();store.send('staff-1','消息');assert.equal(store.teamIds().length,0);
  assert.equal(store.addToTeam('staff-1'),true);assert.equal(store.addToTeam('staff-1'),false);
  assert.throws(()=>store.addToTeam('project-1'));store.removeFromTeam('staff-1');
  const restored=load(saved()).store;assert.equal(restored.teamIds().length,0);assert.equal(restored.chat('staff-1').messages[0].text,'消息');
});
test('legacy migration preserves messages, draft and stable session id across refresh',()=>{
  const {store,saved}=load({chats:{'staff-1':{messages:[{sender:{uid:'u-wangyilin'},text:'历史消息'}],draft:'历史草稿'}}});
  const session=store.sessions('staff-1')[0];assert.equal(session.title,'历史消息');assert.equal(store.chat('staff-1').draft,'历史草稿');
  store.addToTeam('staff-1');assert.equal(load(saved()).store.sessions('staff-1')[0].id,session.id);
});
test('independent sessions keep drafts, title, pinning and deleted callbacks isolated',()=>{
  const {store}=load();const first=store.createSession('staff-1'),second=store.createSession('staff-1');
  const a=store.conversationSource('staff-1',first),b=store.conversationSource('staff-1',second);
  a.onDraftChange('草稿 A');b.onDraftChange('草稿 B');a.onSend('会话 A');
  assert.equal(store.conversationSource('staff-1',second).initialDraft,'草稿 B');
  assert.equal(store.sessions('staff-1').find(s=>s.id===first).title,'会话 A');
  store.setSessionFlag('staff-1',first,'pinned',true);assert.equal(store.sessions('staff-1')[0].id,first);
  store.deleteSession('staff-1',first);assert.equal(store.conversationSource('staff-1',first),null);assert.throws(()=>a.onSend('不能恢复已删会话'));
  assert.equal(store.sessions('staff-1').length,1);
});
test('market compatibility chooses newly created session even in the same millisecond',()=>{
  const {store}=load();store.createSession('staff-1');const newest=store.createSession('staff-1');
  store.setDraft('staff-1','给最新会话');assert.equal(store.conversationSource('staff-1',newest).initialDraft,'给最新会话');
});
test('creation preserves configuration and draft data without aliasing caller objects',()=>{
  const {store,saved}=load();const draft={name:'接入专家',skills:['分析'],conn:['mcp-1'],publication:'org',description:'专家说明'};
  store.saveDraft('dify',draft);draft.skills.push('后续修改');assert.equal(store.draft('dify').skills.length,1);
  const created=store.create('dify',draft);draft.name='外部更改';
  const restored=load(saved()).store;assert.equal(restored.get(created.id).name,'接入专家');assert.equal(restored.get(created.id).scope,'org');assert.equal(restored.get(created.id).configuration.conn[0],'mcp-1');assert.equal(restored.draft('dify'),undefined);
});
