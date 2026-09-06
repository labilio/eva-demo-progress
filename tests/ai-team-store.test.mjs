import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
const file = new URL('../prototype/009-3-ai-team-store.js', import.meta.url);
const context = { window: {}, setTimeout, clearTimeout, console };
if (existsSync(file)) vm.runInNewContext(readFileSync(file, 'utf8'), context);
const make = (options = {}) => { assert.equal(typeof context.window.EvaAITeam?.createStore, 'function'); return context.window.EvaAITeam.createStore({ storage: null, delay: 0, profile:'review', ...options }); };
const tick = () => new Promise(resolve => setTimeout(resolve, 5));
const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return {promise,resolve,reject}; };
const memory = () => { let value = null; return { getItem: () => value, setItem: (_, v) => { value = v; } }; };
test('snapshots are immutable, stable, and notify only mutations', () => {
 const s=make(); const first=s.getSnapshot(); assert.equal(first,s.getSnapshot()); assert.throws(()=>{first.identities[0].name='bad';}); let calls=0; const off=s.subscribe(()=>calls++); s.setDraft('draft:ai-general','hello'); assert.equal(calls,1); assert.equal(first.drafts['draft:ai-general'],undefined); off(); s.setDraft('draft:ai-general','hi'); assert.equal(calls,1);
});
test('connecting deduplicates concurrent calls and failed connections leave no identity', async () => {
 const d=deferred(); const s=make({adapter:{connect:()=>d.promise}}); const local=s.saveLocalAssistant({mode:'create',name:'连接测试'}); const a=s.connectAssistant(local.id); const b=s.connectAssistant(local.id); assert.equal(s.getSnapshot().identities.length,4); d.resolve(); assert.equal((await a).id,(await b).id); assert.equal(s.getSnapshot().identities.length,5); assert.equal((await s.connectAssistant(local.id)).id,(await a).id);
 const f=make({adapter:{connect:()=>Promise.reject(Error('demo fail'))}}); await assert.rejects(f.connectAssistant(f.saveLocalAssistant({mode:'create',name:'失败连接'}).id)); assert.equal(f.getSnapshot().identities.length,4);
});
test('multiple personas have distinct names and failed creation leaves no records',async()=>{
 const s=make(); const [a,b]=await Promise.all([s.createPersona('assistant-general'),s.createPersona('assistant-general')]); assert.notEqual(a.id,b.id); assert.notEqual(a.name,b.name); assert.equal(a.role,'persona'); const f=make({adapter:{createPersona:()=>Promise.reject(Error('fail'))}}); await assert.rejects(f.createPersona('assistant-general')); assert.equal(f.getSnapshot().identities.length,4);
});
test('send creates only nonempty sessions, isolates drafts, and refuses offline assistant',()=>{
 const s=make(); const n=s.getSnapshot().sessions.length; assert.equal(s.sendMessage('ai-general',null,'  '),null); assert.equal(s.getSnapshot().sessions.length,n); s.setDraft('draft:ai-general','send'); s.setDraft('draft:persona-initial','keep'); const id=s.sendMessage('ai-general',null,'  hello world  '); const session=s.getSnapshot().sessions.find(x=>x.id===id); assert.equal(session.title,'hello world'); assert.equal(session.messages[0].text,'hello world'); assert.equal(session.messages[1].text,'收到，我会协助你整理。'); assert.equal(s.getSnapshot().drafts['draft:ai-general'],undefined); assert.equal(s.getSnapshot().drafts['draft:persona-initial'],'keep'); assert.throws(()=>s.sendMessage('persona-initial',id,'wrong identity')); s.setLocalOnline('assistant-general',false); assert.throws(()=>s.sendMessage('ai-general',id,'offline')); assert.ok(s.sendMessage('persona-initial',null,'route'));
});
test('persistence restores messages and drafts; invalid nested values fallback safely',()=>{
 const storage=memory(); const s=make({storage}); const id=s.sendMessage('ai-general',null,'saved'); s.setDraft(id,'draft'); const r=make({storage}); assert.equal(r.getSnapshot().drafts[id],'draft'); assert.equal(r.getSnapshot().sessions.find(x=>x.id===id).messages[0].text,'saved'); const bad=JSON.parse(storage.getItem()); bad.sessions[0].messages=[{kind:'text',text:'bad'}]; storage.setItem('',JSON.stringify(bad)); const recovered=make({storage}); assert.equal(recovered.getSnapshot().sessions.length,2); assert.ok(recovered.getSnapshot().storageWarning);
});
test('storage failure remains usable with visible warning',()=>{
 const s=make({storage:{getItem(){throw Error('denied');},setItem(){throw Error('denied');}}}); assert.ok(s.getSnapshot().storageWarning); assert.ok(s.sendMessage('ai-general',null,'works'));
});
test('local edits sanitize configuration, update assistant names, and one-way sync personas',async()=>{
 const s=make(); const persona=s.getSnapshot().identities.find(x=>x.role==='persona'); const l=s.saveLocalAssistant({mode:'edit',id:'assistant-general',name:'王宜林的通用助理',configuration:{identity:'测试',personality:'简洁',skills:['文档'],privateContext:'secret'}}); assert.equal(l.version,2); assert.equal(l.configuration.privateContext,undefined); await tick(); const snap=s.getSnapshot(); assert.equal(snap.identities.find(x=>x.id==='ai-general').name,'王宜林的通用助理'); const p=snap.identities.find(x=>x.id===persona.id); assert.equal(p.name,persona.name); assert.equal(p.configVersion,2); assert.equal(p.configuration.identity,'测试'); assert.equal(p.syncStatus,'synced'); const created=s.saveLocalAssistant({mode:'create',name:'新本地'}); assert.ok(created.id); assert.equal(s.getSnapshot().identities.length,4);
});
test('offline updates wait and reconnect synchronizes latest configuration',async()=>{
 const s=make(); s.setLocalOnline('assistant-general',false); s.saveLocalAssistant({mode:'edit',id:'assistant-general',name:'王宜林的通用助理'}); assert.equal(s.getSnapshot().identities.find(x=>x.id==='persona-initial').syncStatus,'waiting'); s.setLocalOnline('assistant-general',true); await tick(); assert.equal(s.getSnapshot().identities.find(x=>x.id==='persona-initial').configVersion,2);
});
test('out of order sync cannot overwrite a newer configuration, failure is retryable',async()=>{
 const jobs=[]; const s=make({adapter:{sync:()=>{const d=deferred();jobs.push(d);return d.promise;}}}); s.saveLocalAssistant({mode:'edit',id:'assistant-general',name:'王宜林的通用助理'}); s.saveLocalAssistant({mode:'edit',id:'assistant-general',name:'王宜林的通用助理'}); await Promise.resolve(); jobs[1].resolve(); await tick(); jobs[0].resolve(); await tick(); assert.equal(s.getSnapshot().identities.find(x=>x.id==='persona-initial').configVersion,3);
 const f=make({adapter:{sync:()=>Promise.reject(Error('fail'))}}); await assert.rejects(f.syncPersona('persona-initial')); assert.equal(f.getSnapshot().identities.find(x=>x.id==='persona-initial').syncStatus,'error');
});
test('refresh converts in-progress sync to retryable state',()=>{
 const storage=memory(); const s=make({storage,adapter:{sync:()=>new Promise(()=>{})}}); s.syncPersona('persona-initial'); const r=make({storage}); assert.equal(r.getSnapshot().identities.find(x=>x.id==='persona-initial').syncStatus,'error');
});
test('offline transition invalidates in-flight sync and reconnect uses latest version', async () => {
 const jobs=[];
 const s=make({adapter:{sync:()=>{const d=deferred();jobs.push(d);return d.promise;}}});
 s.saveLocalAssistant({mode:'edit',id:'assistant-general',name:'王宜林的通用助理'});
 await Promise.resolve(); s.setLocalOnline('assistant-general',false); jobs[0].resolve(); await tick();
 assert.equal(s.getSnapshot().identities.find(i=>i.id==='persona-initial').syncStatus,'waiting');
 assert.equal(s.getSnapshot().identities.find(i=>i.id==='persona-initial').configVersion,1);
 s.setLocalOnline('assistant-general',true); await Promise.resolve(); jobs[1].resolve(); await tick();
 assert.equal(s.getSnapshot().identities.find(i=>i.id==='persona-initial').configVersion,2);
});
test('invalid persisted draft references and impossible config versions reset to seed', () => {
 for (const corrupt of [state=>{state.drafts['missing-session']='orphan';},state=>{state.identities[0].configVersion=999;}]) {
  const storage=memory(); const s=make({storage}); s.setDraft('draft:ai-general','valid');
  const parsed=JSON.parse(storage.getItem()); corrupt(parsed); storage.setItem('',JSON.stringify(parsed));
  assert.ok(make({storage}).getSnapshot().storageWarning);
 }
});

test('product copy migration preserves user text, identities and drafts', () => {
 const storage=memory(); const s=make({storage}); const id=s.sendMessage('ai-general',null,'【演示】用户自己的文字'); s.setDraft(id,'保留草稿');
 const saved=JSON.parse(storage.getItem());
 saved.sessions[0].title='团队协作演示';
 saved.sessions[0].messages[0].text='【演示】这是独立的团队会话，不包含个人会话历史。';
 saved.sessions[1].messages[0].text='【演示】我负责团队沟通与请求转交；专业推理由关联的本地助理完成。';
 saved.sessions.find(x=>x.id===id).messages[1].text='【演示回执】消息已保存在本机。本原型未连接 OpenClaw，也未执行真实任务。';
 saved.sessions.find(x=>x.id===id).messages.push({...saved.sessions.find(x=>x.id===id).messages[0],text:'【演示】这是独立的团队会话，不包含个人会话历史。'});
 saved.sessions[1].messages.push({...saved.sessions[1].messages[0],text:'【演示回执】已记录沟通请求，待关联本地助理处理。本原型未执行专业推理或真实转发。'});
 storage.setItem('',JSON.stringify(saved));
 const r=make({storage}); const snap=r.getSnapshot();
 assert.equal(snap.sessions[0].title,'整理工作安排');
 assert.equal(snap.sessions[0].messages[0].text,'把需要整理的事项发给我，我们一起安排。');
 assert.equal(snap.sessions[1].messages[0].text,'你好，我可以替你接收协作请求并跟进进展。');
 assert.equal(snap.sessions.find(x=>x.id===id).messages[0].text,'【演示】用户自己的文字');
 assert.equal(snap.sessions.find(x=>x.id===id).messages[1].text,'收到，我会协助你整理。');
 assert.equal(snap.sessions.find(x=>x.id===id).messages[2].text,'【演示】这是独立的团队会话，不包含个人会话历史。');
 assert.equal(snap.sessions[1].messages[1].text,'收到，我会跟进这项请求。');
 assert.equal(snap.drafts[id],'保留草稿'); assert.equal(snap.identities.length,saved.identities.length);
 const personaId=r.sendMessage('persona-initial',null,'跟进请求');
 assert.equal(r.getSnapshot().sessions.find(x=>x.id===personaId).messages[1].text,'收到，我会跟进这项请求。');
});
test('complete editor fields persist and local updates sync to personas without losing tabs', async()=>{
 const storage=memory(), s=make({storage});
 const configuration={identity:'角色',personality:'风格',about:'背景',skills:['整理'],collaboration:'协作说明',description:'简介',model:'Qwen3.7 Plus',toolset:'四两的产品脑袋'};
 s.saveLocalAssistant({mode:'edit',id:'assistant-general',name:'王宜林的通用助理',configuration}); await tick();
 const p=s.getSnapshot().identities.find(i=>i.id==='persona-initial'); assert.equal(p.configuration.about,'背景'); assert.equal(p.configuration.collaboration,'协作说明');
 const restored=make({storage}); assert.equal(restored.getSnapshot().localAssistants[0].configuration.toolset,'四两的产品脑袋');
 restored.savePersona({id:p.id,name:'我的分身',configuration:{...configuration,about:'云端背景'}});
 assert.equal(restored.getSnapshot().identities.find(i=>i.id===p.id).configuration.about,'云端背景');
 assert.equal(restored.getSnapshot().localAssistants[0].configuration.about,'背景');
 const created=await restored.createPersona('assistant-general',{name:'导入分身',configuration}); assert.equal(created.name,'导入分身'); assert.equal(created.configuration.description,'简介');
});

test('new users receive one protected named assistant and no personas',()=>{
 const s=make({profile:'new-user',ownerName:'林晓'});const snap=s.getSnapshot();
 assert.equal(snap.localAssistants.length,1);assert.equal(snap.identities.length,1);
 assert.equal(snap.localAssistants[0].name,'林晓的通用助理');assert.equal(snap.localAssistants[0].isDefault,true);
 assert.throws(()=>s.saveLocalAssistant({mode:'edit',id:'assistant-general',name:'改名'}),/不可改名/);
 assert.equal(s.getSnapshot().identities[0].name,'林晓的通用助理');
});
test('review account has two assistants and two independently renameable personas',()=>{
 const s=make();assert.equal(s.getSnapshot().identities.filter(i=>i.role==='assistant').length,2);assert.equal(s.getSnapshot().identities.filter(i=>i.role==='persona').length,2);
 s.savePersona({id:'persona-initial',name:'新分身名字'});assert.equal(s.getSnapshot().identities.find(i=>i.id==='persona-initial').name,'新分身名字');
});

test('independent persona persists and is unaffected by local updates',async()=>{
 const storage=memory(),s=make({storage});const p=await s.createPersona(null,{name:'独立分身',configuration:{identity:'独立设置'}});
 assert.equal(p.sourceAssistantId,null);assert.equal(p.lastSyncedAt,'');
 s.saveLocalAssistant({mode:'edit',id:'assistant-general',name:'王宜林的通用助理',configuration:{identity:'本地更新'}});await tick();
 assert.equal(s.getSnapshot().identities.find(i=>i.id===p.id).configuration.identity,'独立设置');
 assert.equal(make({storage}).getSnapshot().identities.find(i=>i.id===p.id).sourceAssistantId,null);
});
test('persona source change imports config, unlink cancels in-flight sync',async()=>{
 const d=deferred(),s=make({adapter:{sync:()=>d.promise}}),p=await s.createPersona(null,{name:'自定义名字'});
 const linked=s.savePersona({id:p.id,name:p.name,sourceAssistantId:'assistant-rd'});
 assert.equal(linked.name,p.name);assert.equal(linked.configuration.identity,s.getSnapshot().localAssistants.find(i=>i.id==='assistant-rd').configuration.identity);
 const work=s.syncPersona(p.id);const independent=s.savePersona({id:p.id,name:p.name,sourceAssistantId:null});d.resolve();await work;
 assert.equal(s.getSnapshot().identities.find(i=>i.id===p.id).sourceAssistantId,null);
 assert.equal(s.getSnapshot().identities.find(i=>i.id===p.id).configuration.identity,independent.configuration.identity);
 assert.throws(()=>s.savePersona({id:p.id,name:p.name,sourceAssistantId:'missing'}));
});

test('delete removes only the target session and draft, persists, and preserves pin on survivors', () => {
 const storage=memory(), store=make({storage});
 const before=store.getSnapshot(), first=before.sessions[0], second=before.sessions[1];
 store.setDraft(first.id,'待删除的草稿'); store.setSessionFlag(second.id,'pinned',true);
 store.deleteSession(first.id);
 const restored=make({storage}).getSnapshot();
 assert.equal(restored.sessions.some(s=>s.id===first.id),false);
 assert.equal(restored.drafts[first.id],undefined);
 assert.deepEqual(restored.sessions.find(s=>s.id===second.id).messages,second.messages);
 assert.equal(restored.sessions.find(s=>s.id===second.id).pinned,true);
 store.setSessionFlag(second.id,'pinned',false);
 assert.equal(store.getSnapshot().sessions.find(s=>s.id===second.id).pinned,false);
 store.deleteSession(second.id);
 assert.equal(make({storage}).getSnapshot().sessions.length,0);
 assert.throws(()=>store.deleteSession('missing'));
});
test('legacy archived sessions remain accessible after retiring archive mode', () => {
 const seed=make().getSnapshot();const data=JSON.parse(JSON.stringify(seed));
 data.sessions[0].archived=true;
 const store=make({storage:{getItem:()=>JSON.stringify(data),setItem:()=>{}}});
 assert.equal(store.getSnapshot().sessions.length,seed.sessions.length);
 assert.equal(store.getSnapshot().sessions[0].archived,undefined);
});
