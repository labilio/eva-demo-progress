import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {randomUUID} from 'node:crypto';
import {parseHTML} from 'linkedom';

const storeSource=fs.readFileSync('prototype/046-personal-assistants.js','utf8');
const pageSource=fs.readFileSync('prototype/052-personal-eva-gds.js','utf8');
function setup(saved=new Map(),hash='#/guid') {
  const {window,document}=parseHTML('<html><body><main></main></body></html>');
  const location={hash}; let mount,complete;
  window.__evaLucide=()=>'';
  window.__evaNativePages={register:(_,fn)=>{mount=fn;}};
  window.HTMLElement.prototype.setSelectionRange=function(){};
  const context=vm.createContext({window,document,location,crypto:{randomUUID},localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},setTimeout:fn=>{complete=fn;return 1;},clearTimeout:()=>{}});
  vm.runInContext(storeSource,context);vm.runInContext(pageSource,context);mount(document.querySelector('main'));
  const q=s=>document.querySelector(s);
  const input=value=>{q('.eva-composer-prompt').value=value;q('.eva-composer-prompt').dispatchEvent(new window.Event('input',{bubbles:true}));};
  const route=id=>{location.hash='#/conversation/'+id;window.dispatchEvent(new window.Event('hashchange'));};
  const submit=()=>q('[data-eva-rail-form]').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
  return {window,document,q,input,route,submit,saved,complete:()=>complete(),store:window.EvaPersonal};
}

test('默认也是可折叠分类，历史会话稳定 ID 全部保留，个人页不再出现助理选择',()=>{
 const a=setup();assert.equal(a.store.getSnapshot().conversations.length,5);
 assert.equal(a.q('[data-eva-toggle-folder=""]').textContent,'默认');
 assert.equal(a.q('[data-eva-selected-assistant]'),null);assert.doesNotMatch(a.document.body.textContent,/通用助理|研发助理|创建助理|未归类/);
 a.q('[data-eva-toggle-folder=""]').click();assert.equal(a.q('[data-eva-personal-conversation-id="personal-ui-designer-ppt"]'),null);
 const b=setup(a.saved);assert.equal(b.q('[data-eva-toggle-folder=""]').getAttribute('aria-expanded'),'false');
 b.q('[data-eva-toggle-folder=""]').click();b.route('personal-ui-designer-ppt');assert.match(b.q('.eva-history-flow').textContent,/设计团队/);
});

test('创建、移动、重命名在刷新后保留，重名和空名被拒绝',()=>{
 const a=setup();const id=a.store.createFolder('本周工作');
 assert.throws(()=>a.store.createFolder(' 默认 '));assert.throws(()=>a.store.createFolder('本周工作'));assert.throws(()=>a.store.createFolder('  '));
 a.store.moveConversation('personal-api-regression',id);a.store.renameConversation('personal-api-regression','回归验收');
 const b=setup(a.saved,'#/conversation/personal-api-regression');const c=b.store.getSnapshot().conversations.find(c=>c.id==='personal-api-regression');
 assert.equal(c.folderId,id);assert.equal(c.title,'回归验收');assert.match(b.q('.eva-history-flow').textContent,/高风险/);
 b.store.moveConversation(c.id,'');assert.equal(b.store.getSnapshot().conversations.find(x=>x.id===c.id).folderId,'');
});

test('中栏创建表单和折叠不重建输入框，保存结果有实际数据',()=>{
 const a=setup();a.input('草稿不丢');const input=a.q('.eva-composer-prompt');
 a.q('[data-eva-create-folder]').click();a.q('#eva-rail-name').value='供应链材料';a.submit();
 assert.equal(a.q('.eva-composer-prompt'),input);assert.equal(input.value,'草稿不丢');assert.ok(a.store.getSnapshot().folders.some(f=>f.name==='供应链材料'));
 a.q('[data-eva-toggle-folder=""]').click();assert.equal(a.q('.eva-composer-prompt'),input);
});

test('组内新对话归属正确，发送后会话可刷新恢复，顶部新对话归默认',()=>{
 const a=setup();a.q('[data-eva-new-folder-chat="personal-supply"]').click();a.input('准备供应链周会');a.q('[data-eva-personal-send]').click();
 a.complete();const c=a.store.getSnapshot().conversations.find(c=>c.title==='准备供应链周会');assert.equal(c.folderId,'personal-supply');
 const b=setup(a.saved,'#/conversation/'+c.id);assert.match(b.q('.eva-history-flow').textContent,/准备供应链周会/);
 b.q('[data-eva-new-folder-chat=""]').click();b.input('日常问题');b.q('[data-eva-personal-send]').click();assert.equal(b.store.getSnapshot().conversations.find(c=>c.title==='日常问题').folderId,'');
});

test('同名对话按稳定 ID 路由，切换历史会话恢复独立草稿',()=>{
 const a=setup();a.store.renameConversation('personal-api-regression','整理本周会议结论');a.route('personal-api-regression');assert.match(a.q('.eva-history-flow').textContent,/高风险/);
 a.input('接口草稿');a.q('[data-eva-personal-conversation-id="personal-product-copy"]').click();a.route('personal-product-copy');a.input('文案草稿');
 a.q('[data-eva-personal-conversation-id="personal-api-regression"]').click();a.route('personal-api-regression');assert.equal(a.q('.eva-composer-prompt').value,'接口草稿');
});


test('存储失败不留下未保存的文件夹，刷新顺序保留最新对话',()=>{
 const a=setup(); const id=a.store.createConversation('', '最新对话');
 const b=setup(a.saved);assert.equal(b.store.getSnapshot().conversations[0].id,id);
 a.saved.set=()=>{throw Error('quota');};assert.throws(()=>a.store.createFolder('失败文件夹'),/无法保存/);
 assert.ok(!a.store.getSnapshot().folders.some(f=>f.name==='失败文件夹'));
});

test('Agent 创建中心不再提供第二个个人助理的创建路径',()=>{
 const data=fs.readFileSync('prototype/009-3-digital-employees-data.js','utf8');
 const center=fs.readFileSync('prototype/047-digital-employees.js','utf8');
 assert.doesNotMatch(data.slice(data.indexOf('"runtimes"')), /"key": "mine"/);
 assert.doesNotMatch(center,/saveLocalAssistant|navigatePersonal/);
 assert.match(center,/submitPersonaRequest/);
});


test('输入框下拉可选择默认或新建文件夹，不丢失草稿，发送归属选择的文件夹',()=>{
 const a=setup();a.input('保留这段中文输入');const textarea=a.q('.eva-composer-prompt');
 a.q('[data-eva-create-folder]').click();a.q('#eva-rail-name').value='下拉新文件夹';a.submit();
 const folder=a.store.getSnapshot().folders.find(f=>f.name==='下拉新文件夹');
 const picker=a.q('[data-eva-composer-folder]');assert.ok([...picker.querySelectorAll('option')].some(o=>o.textContent==='下拉新文件夹'));
 Object.defineProperty(picker,'value',{configurable:true,value:folder.id});picker.dispatchEvent(new a.window.Event('change',{bubbles:true}));
 assert.equal(a.q('.eva-composer-prompt'),textarea);assert.equal(textarea.value,'保留这段中文输入');
 a.q('[data-eva-personal-send]').click();assert.equal(a.store.getSnapshot().conversations.find(c=>c.title==='保留这段中文输入').folderId,folder.id);
});
