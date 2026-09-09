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
 assert.equal(a.q('[data-eva-toggle-folder=""]').textContent,'最近');
 assert.equal(a.q('[data-eva-selected-assistant]'),null);assert.doesNotMatch(a.document.body.textContent,/通用助理|研发助理|创建助理|未归类/);
 a.q('[data-eva-toggle-folder=""]').click();assert.equal(a.q('[data-eva-personal-conversation-id="personal-ui-designer-ppt"]'),null);
 const b=setup(a.saved);assert.equal(b.q('[data-eva-toggle-folder=""]').getAttribute('aria-expanded'),'true');
 b.route('personal-ui-designer-ppt');assert.match(b.q('.eva-history-flow').textContent,/设计团队/);
});

test('创建、移动、重命名在刷新后保留，重名和空名被拒绝',()=>{
 const a=setup();const id=a.store.createFolder('本周工作');
 assert.throws(()=>a.store.createFolder(' 最近 '));assert.throws(()=>a.store.createFolder('本周工作'));assert.throws(()=>a.store.createFolder('  '));
 a.store.moveConversation('personal-api-regression',id);a.store.renameConversation('personal-api-regression','回归验收');
 const b=setup(a.saved,'#/conversation/personal-api-regression');const c=b.store.getSnapshot().conversations.find(c=>c.id==='personal-api-regression');
 assert.equal(c.folderId,id);assert.equal(c.title,'回归验收');assert.match(b.q('.eva-history-flow').textContent,/高风险/);
 b.store.moveConversation(c.id,'');assert.equal(b.store.getSnapshot().conversations.find(x=>x.id===c.id).folderId,'');
});

test('浏览本地目录和折叠不重建输入框，也不创建分组',async()=>{
 const a=setup();a.input('草稿不丢');const input=a.q('.eva-composer-prompt');
 a.window.showDirectoryPicker=async()=>({name:'供应链材料'});
 const picker=a.q('[data-eva-composer-directory]');Object.defineProperty(picker,'value',{configurable:true,writable:true,value:'__browse_local__'});picker.dispatchEvent(new a.window.Event('change',{bubbles:true}));await new Promise(resolve=>setImmediate(resolve));
 assert.ok(a.q('[data-eva-create-folder]'));
 assert.equal(a.q('.eva-composer-prompt'),input);assert.equal(input.value,'草稿不丢');assert.ok(!a.store.getSnapshot().folders.some(f=>f.name==='供应链材料'));
 assert.equal(a.q('.eva-personal-directory-picker__label').textContent,'供应链材料');
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

test('个人 Eva 不暴露助理创建，但我的 AI 可复用个人助理创建流程',()=>{
 const data=fs.readFileSync('prototype/009-3-digital-employees-data.js','utf8');
 const center=fs.readFileSync('prototype/047-digital-employees.js','utf8');
 assert.doesNotMatch(pageSource,/evaCreate=mine|data-eva-edit-assistant/);
 assert.match(data.slice(data.indexOf('"runtimes"')), /"key": "mine"/);
 assert.match(center,/initialType==='mine'.+saveLocalAssistant/s);
 assert.match(center,/returnTo\?navigate\(returnTo\):navigatePersonal/);
 assert.match(center,/submitPersonaRequest/);
});


test('目录与分组独立：组内发送保留目录，移动和删除分组不改变目录',async()=>{
 const a=setup();a.q('[data-eva-new-folder-chat="personal-supply"]').click();a.input('保留这段中文输入');const textarea=a.q('.eva-composer-prompt');
 a.window.showDirectoryPicker=async()=>({name:'本地材料'});
 const browse=a.q('[data-eva-composer-directory]');
 Object.defineProperty(browse,'value',{configurable:true,writable:true,value:'__browse_local__'});browse.dispatchEvent(new a.window.Event('change',{bubbles:true}));await new Promise(resolve=>setImmediate(resolve));
 assert.equal(a.store.getSnapshot().folders.length,1);
 assert.equal(a.q('.eva-composer-prompt'),textarea);assert.equal(textarea.value,'保留这段中文输入');
 assert.ok(![...a.q('[data-eva-composer-directory]').querySelectorAll('option')].some(o=>o.textContent==='供应链运营协同'));
 a.q('[data-eva-personal-send]').click();
 const c=a.store.getSnapshot().conversations.find(c=>c.title==='保留这段中文输入');
 assert.equal(c.folderId,'personal-supply');assert.equal(c.workingDirectory,'本地材料');
 a.store.moveConversation(c.id,'');assert.equal(a.store.getSnapshot().conversations.find(x=>x.id===c.id).workingDirectory,'本地材料');
 const b=setup(a.saved);assert.equal(b.store.getSnapshot().conversations.find(x=>x.id===c.id).workingDirectory,'本地材料');
 a.store.deleteFolder('personal-supply');
 a.q('[data-eva-new-folder-chat=""]').click();
 assert.equal(a.q('.eva-personal-directory-picker__label').textContent,'本地材料');
 const picker=a.q('[data-eva-composer-directory]');Object.defineProperty(picker,'value',{value:''});picker.dispatchEvent(new a.window.Event('change',{bubbles:true}));
 assert.equal(a.q('.eva-personal-directory-picker__label').textContent,'本地目录');
 assert.equal(a.store.getSnapshot().conversations.find(x=>x.id===c.id).workingDirectory,'本地材料');
});

test('从加号创建分组，支持校验、取消与刷新，不干扰输入和目录',()=>{
 const a=setup();a.input('正在编辑的草稿');const textarea=a.q('.eva-composer-prompt');
 a.q('[data-eva-create-folder]').click();a.q('[name="name"]').value='最近';a.submit();
 assert.match(a.q('[data-eva-rail-error]').textContent,/同名分组/);
 a.q('[name="name"]').value='本周工作';a.submit();
 assert.equal(a.q('[data-eva-rail-form]'),null);assert.equal(a.q('.eva-composer-prompt'),textarea);
 assert.equal(textarea.value,'正在编辑的草稿');assert.equal(a.q('.eva-personal-directory-picker__label').textContent,'本地目录');
 assert.ok(setup(a.saved).store.getSnapshot().folders.some(f=>f.name==='本周工作'));
 a.q('[data-eva-create-folder]').click();a.q('[data-eva-cancel-rail]').click();
 assert.equal(a.q('[data-eva-rail-form]'),null);assert.equal(a.store.getSnapshot().folders.length,2);
});

test('取消本地目录选择保留分组、草稿和默认目录',async()=>{
 const a=setup();a.input('草稿');a.window.showDirectoryPicker=async()=>{throw Object.assign(new Error(),{name:'AbortError'});};
 const before=JSON.stringify(a.store.getSnapshot());
 const picker=a.q('[data-eva-composer-directory]');Object.defineProperty(picker,'value',{configurable:true,writable:true,value:'__browse_local__'});
 picker.dispatchEvent(new a.window.Event('change',{bubbles:true}));await new Promise(resolve=>setImmediate(resolve));
 assert.equal(JSON.stringify(a.store.getSnapshot()),before);assert.equal(a.q('.eva-composer-prompt').value,'草稿');
 assert.equal(a.q('.eva-personal-directory-picker__label').textContent,'本地目录');
});

function drag(a, source, target, drop=true) {
 const transfer={setData(){},effectAllowed:'',dropEffect:''};
 const dispatch=(element,type)=>{const e=new a.window.Event(type,{bubbles:true,cancelable:true});Object.defineProperty(e,'dataTransfer',{value:transfer});element.dispatchEvent(e);return e;};
 dispatch(source,'dragstart');dispatch(target,'dragover');
 if(drop) dispatch(target,'drop'); else dispatch(source,'dragend');
}

test('拖拽移动当前会话到折叠分组，保存归属且保留正文、路由和草稿',()=>{
 const a=setup(undefined,'#/conversation/personal-api-regression');a.input('正在编辑');
 const textarea=a.q('.eva-composer-prompt'),flow=a.q('.eva-history-flow');
 a.q('[data-eva-toggle-folder="personal-supply"]').click();
 drag(a,a.q('[data-eva-personal-conversation-id="personal-api-regression"]'),a.q('[data-eva-drop-folder="personal-supply"]'));
 assert.equal(a.store.getSnapshot().conversations.find(c=>c.id==='personal-api-regression').folderId,'personal-supply');
 assert.equal(a.q('.eva-composer-prompt'),textarea);assert.equal(textarea.value,'正在编辑');assert.equal(a.q('.eva-history-flow'),flow);
 assert.equal(a.q('[data-eva-toggle-folder="personal-supply"]').getAttribute('aria-expanded'),'true');
 assert.ok(a.q('[data-eva-drop-folder="personal-supply"] [aria-current="page"]'));
 const savedAfterMove=new Map(a.saved);
 drag(a,a.q('[data-eva-personal-conversation-id="personal-api-regression"]'),a.q('[data-eva-drop-folder=""]'));
 assert.equal(a.store.getSnapshot().conversations.find(c=>c.id==='personal-api-regression').folderId,'');
 const b=setup(savedAfterMove);assert.equal(b.store.getSnapshot().conversations.find(c=>c.id==='personal-api-regression').folderId,'personal-supply');
});

test('取消拖动、拖到原组和外部拖放不改变会话归属',()=>{
 const a=setup(),before=JSON.stringify(a.store.getSnapshot());
 const source=a.q('[data-eva-personal-conversation-id="personal-api-regression"]');
 drag(a,source,a.q('[data-eva-drop-folder="personal-supply"]'),false);
 assert.equal(a.q('.is-drop-target'),null);assert.equal(a.q('.is-dragging'),null);
 drag(a,source,a.q('[data-eva-drop-folder=""]'));
 a.q('[data-eva-drop-folder="personal-supply"]').dispatchEvent(new a.window.Event('drop',{bubbles:true,cancelable:true}));
 assert.equal(JSON.stringify(a.store.getSnapshot()),before);
});
