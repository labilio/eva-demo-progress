import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function setup(){
 const people=[{id:'u-wangyilin',name:'王宜林'},{id:'other',name:'林晓'}];
 const clones=[{id:'clone-a',name:'同名分身',ownerId:'u-wangyilin'},{id:'clone-b',name:'同名分身',ownerId:'other'},{id:'orphan',name:'无主数据',ownerId:'missing'}];
 const window={EvaAvatar:{personUri:id=>id},EvaAITeam:{getSnapshot:()=>({identities:[{id:'persona',role:'persona',name:'执剑人'},{id:'assistant',role:'assistant',name:'个人助理'}]})},EvaDigitalEmployeesStore:{get:()=>null},__EVA_CONTACT_IDENTITY_ALIASES:{'legacy':'persona'}};
 for(const f of ['003-my-assistant-identity.js','009-3-contact-identities.js'])vm.runInNewContext(readFileSync('prototype/'+f,'utf8'),{window});
 const store={snapshot:()=>({actorId:'u-wangyilin'}),person:id=>people.find(p=>p.id===id),clone:id=>clones.find(c=>c.id===id)};
 const model=window.EvaContactIdentities.create(store);
 return {window,people,model};
}
test('同名分身按身份关系显示主人，改名后重新读取，不改分身名',()=>{
 const {window,people,model}=setup();
 assert.equal(typeof window.EvaAIIdentity.ownerLabel,'function');
 assert.match(window.EvaAIIdentity.ownerLabel(model.resolve('clone-a')),/@王宜林/);
 assert.match(window.EvaAIIdentity.ownerLabel(model.resolve('clone-b')),/@林晓/);
 people[1].name='林晓新名';assert.match(window.EvaAIIdentity.ownerLabel(model.resolve('clone-b')),/@林晓新名/);
 assert.equal(model.resolve('clone-b').name,'同名分身');
 assert.match(window.EvaAIIdentity.ownerLabel(model.resolve('legacy')),/@王宜林/);
});
test('只给有真实主人的分身显示归属；HTML 和 React 文字一致且安全',()=>{
 const {window,model}=setup(),label=window.EvaAIIdentity.ownerLabel;
 assert.equal(typeof label,'function');
 for(const p of [null,model.resolve('orphan'),model.resolve('assistant'),{kind:'human',owner:{name:'人'}},{kind:'employee',owner:{name:'组织'}},{kind:'project-agent',owner:{name:'项目'}}])assert.equal(label(p),null);
 const p={kind:'clone',owner:{name:'林<晓>'}};
 assert.match(label(p),/@林&lt;晓&gt;/);
 const h=(tag,props,...children)=>({tag,props,children});
 assert.equal(label(p,h,'candidate').children[0],'@林<晓>');
 assert.equal(label(p,h,'detail').children[0],'主人：林<晓>');
});
