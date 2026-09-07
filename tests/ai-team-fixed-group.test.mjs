import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const window={};vm.runInNewContext(readFileSync('prototype/009-3-ai-team-store.js','utf8'),{window,setTimeout,clearTimeout});
const members=[{id:'u-wangyilin',name:'王宜林',kind:'human'},{id:'persona',name:'执剑人',kind:'ai-direct'},{id:'assistant',name:'通用助理',kind:'ai-direct'},{id:'employee',name:'数字员工',kind:'ai-direct'}];
test('fixed group derives all member kinds without duplicates and isolates history',()=>{
 const group=window.EvaMyAITeamGroup.createStore({storage:null});
 const source=group.source([...members,members[1]]),channel=source.channels[0];
 assert.equal(channel.name,'我的AI团队');assert.equal(channel.members,4);assert.equal(channel.channel_type,2);
 assert.equal(channel.replyPolicy,'mention-only');assert.equal(channel.memberIds.join(','),members.map(m=>m.id).join(','));
 source.onSend('普通群消息');assert.equal(group.source(members).messages[group.id].length,1);
 source.onSend('@通用助理 请整理');let history=group.source(members).messages[group.id];assert.equal(history.length,3);assert.equal(history[2].sender.uid,'assistant');
 const next=group.source([...members,{id:'new-assistant',name:'新助理',kind:'ai-direct'}]);assert.equal(next.channels[0].members,5);assert.equal(next.messages[group.id].length,3);
 const ai=window.EvaAITeam.getSnapshot();assert.ok(ai.sessions.every(s=>s.messages.every(m=>m.text!=='普通群消息')));
});
test('fixed group retains its channel, messages and draft after reload',()=>{
 let saved;const storage={getItem:()=>saved,setItem:(_,v)=>{saved=v;}};
 const group=window.EvaMyAITeamGroup.createStore({storage});group.source(members).onSend('群记录');group.source(members).onDraftChange('未发送草稿');
 const restored=window.EvaMyAITeamGroup.createStore({storage});assert.equal(restored.id,group.id);const source=restored.source(members);
 assert.equal(source.initialDraft,'未发送草稿');assert.equal(source.messages[group.id][0].text,'群记录');
});
