import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function setup(){
 const window={__EVA_DEMO_TIME:{T0:'2026-09-02',T1:'2026-09-02'}};
 for(const file of ['009-2-data-supply.js','009-2-membership.js','009-1-file-sharing.js'])vm.runInNewContext(fs.readFileSync(new URL('../prototype/'+file,import.meta.url),'utf8'),{window});
 const people=['wangyilin','linxiao','zhouyuan','hejing'].map(id=>({id:'u-'+id,name:id}));
 const s=window.EvaMembership.create({people,clones:window.__EVA_MEMBERSHIP_CLONES});
 s.createProject('prod','供应链运营协同','u-wangyilin',[]);s.createProject('other','其他项目','u-wangyilin',[]);
 return {s,files:window.EvaFileSharing.create(s)};
}
test('供应链教程闭环：审批、带分身加入、文件共享不泄漏群、独立进群、退出级联、重复载入',()=>{
 const {s,files}=setup();const before=JSON.stringify(s.snapshot().projects.other);s.loadSupplyDemo();
 assert.ok(s.channels('prod','u-wangyilin').every(c=>typeof c.lastAt==='string'&&c.threads.every(t=>typeof t.updated_at==='string')));assert.equal(s.snapshot().projects.prod.humans.length,3);assert.equal(s.canRead('prod','u-hejing'),false);
 const invite=s.snapshot().invitations[0];assert.equal(invite.status,'pending_approval');
 s.approve(invite.id,'u-wangyilin');s.accept(invite.id,'u-hejing',['clone-hejing']);
 assert.equal(s.groupMembers('all:prod').length,8);assert.equal(s.canRead('supply-demo-rectification','u-hejing'),false);
 const file=s.messagesFor('supply-demo-rectification','u-wangyilin').find(m=>m.kind==='file').file;
 files.transfer('u-wangyilin','prod',file,{groupId:'supply-demo-rectification',groupName:'供应商整改协同'});
 assert.equal(files.list('prod','u-hejing').length,1);assert.equal(s.canRead('supply-demo-evidence','u-hejing'),false);
 const groupInvite=s.invite('supply-demo-rectification','u-wangyilin','u-hejing');s.accept(groupInvite.id,'u-hejing',['clone-hejing']);
 assert.equal(s.canRead('supply-demo-evidence','clone-hejing'),true);
 s.remove('prod','u-hejing','u-hejing');assert.equal(files.list('prod','u-hejing').length,0);assert.equal(s.canRead('supply-demo-evidence','clone-hejing'),false);
 s.loadSupplyDemo();files.resetProjectDemo('prod');
 assert.equal(s.snapshot().invitations.length,1);assert.equal(s.snapshot().projects.prod.humans.length,3);assert.equal(files.list('prod','u-wangyilin').length,0);
 assert.equal(JSON.stringify(s.snapshot().projects.other),before);
});

test('群聊预设增量加载不重复、不覆盖成员与手动消息',()=>{
 const {s}=setup();s.loadSupplyDemo();s.sendMessage('supply-demo-rectification','u-wangyilin','手动补充');
 const before=JSON.stringify(s.snapshot());s.seedSupplyChatContent();s.seedSupplyChatContent();assert.equal(JSON.stringify(s.snapshot()),before);
 assert.equal(s.messagesFor('all:prod','u-wangyilin').filter(m=>m.fixtureId?.startsWith('supply-chat-v1:')).length,5);
 assert.equal(s.messagesFor('supply-demo-rectification','u-wangyilin').filter(m=>m.fixtureId).length,6);
 assert.equal(s.messagesFor('supply-demo-evidence','u-wangyilin').filter(m=>m.fixtureId).length,4);
 assert.equal(s.canRead('prod','u-hejing'),false);
});
