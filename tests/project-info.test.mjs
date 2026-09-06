import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createPatchedRuntime} from '../tools/build-runtime.mjs';
const runtime=createPatchedRuntime().source;
function setup(){
 const start=runtime.indexOf('function evaSaveProjectInfo('),end=runtime.indexOf('function GeneralTab(',start);
 assert.ok(start>=0,'project-scoped save helper exists');
 let saved=[{id:'p',name:'原项目',desc:'原目标'},{id:'q',name:'其他项目',desc:'其他目标'}];
 let projection='原项目';
 const store={snapshot:()=>({actorId:'owner'}),manager:(_,actor)=>actor==='owner',renameProject:(_,actor,name)=>{assert.equal(actor,'owner');projection=name;}};
 const ctx={loadSpaces:()=>structuredClone(saved),KEY:'spaces',localStorage:{setItem:(_,value)=>{saved=JSON.parse(value);}},evaMembers:()=>({store})};
 vm.runInNewContext(runtime.slice(start,end),ctx);
 return {ctx,read:()=>saved,projection:()=>projection};
}
test('项目名称和共同目标按项目保存，不覆盖其他项目或创建第二份目标',()=>{
 const s=setup();s.ctx.evaSaveProjectInfo('p',{name:' 新名称 ',goal:' 共同达成交付目标 '});
 assert.deepEqual(s.read(),[{id:'p',name:'新名称',desc:'共同达成交付目标',short:'新'},{id:'q',name:'其他项目',desc:'其他目标'}]);
 assert.equal(s.projection(),'新名称');
});
test('普通成员和写入失败不会得到已保存结果',()=>{
 const s=setup();s.ctx.evaMembers().store.snapshot=()=>({actorId:'member'});
 assert.throws(()=>s.ctx.evaSaveProjectInfo('p',{name:'越权',goal:''}),/负责人|管理员/);
 assert.equal(s.read()[0].name,'原项目');
 s.ctx.evaMembers().store.snapshot=()=>({actorId:'owner'});
 s.ctx.localStorage.setItem=()=>{throw Error('storage full');};
 assert.throws(()=>s.ctx.evaSaveProjectInfo('p',{name:'未保存',goal:''}),/storage full/);
 assert.equal(s.projection(),'原项目');
});

test('启动时保留已编辑的项目名称和共同目标',async()=>{
 const {readFileSync}=await import('node:fs');
 let records=[{id:'prod',name:'已编辑的采购项目',desc:'共同目标'},{id:'lab',name:'已编辑的交付项目',desc:'交付目标'}];
 vm.runInNewContext(readFileSync('prototype/000-shell-seed.js','utf8'),{localStorage:{getItem:key=>key==='eva-collab-spaces'?JSON.stringify(records):null,setItem:(key,value)=>{if(key==='eva-collab-spaces')records=JSON.parse(value);}}});
 assert.equal(records[0].name,'已编辑的采购项目');assert.equal(records[0].desc,'共同目标');
 assert.equal(records[1].name,'已编辑的交付项目');assert.equal(records[1].desc,'交付目标');
});

test('旧预设仅迁移一次且不按名称覆盖自建项目',async()=>{
 const {readFileSync}=await import('node:fs');const source=readFileSync('prototype/000-shell-seed.js','utf8');
 const values=new Map([['eva-collab-spaces',JSON.stringify([{id:'prod',name:'AI 产品共创',desc:'旧目标'},{id:'custom',name:'AI 产品共创',desc:'自建目标'}])]]);
 const ctx={localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)}};
 vm.runInNewContext(source,ctx);let rows=JSON.parse(values.get('eva-collab-spaces'));assert.equal(rows[1].desc,'自建目标');assert.equal(rows[1].name,'AI 产品共创');
 rows[0].name='AI 产品共创';rows[0].desc='用户新目标';values.set('eva-collab-spaces',JSON.stringify(rows));vm.runInNewContext(source,ctx);
 assert.equal(JSON.parse(values.get('eva-collab-spaces'))[0].desc,'用户新目标');
});
