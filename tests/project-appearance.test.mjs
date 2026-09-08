import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
function setup(){const window={};const ctx=vm.createContext({window});for(const file of ['004-project-appearance','014-avatar'])vm.runInContext(fs.readFileSync(`prototype/${file}.js`,'utf8'),ctx);return window;}
test('project color migration retains legacy palette and persists only a stable key',()=>{
 const {EvaProjectAppearance:a}=setup();
 const p=a.normalize({id:'prod',name:'项目',color:'#4F6BED',colorBg:'#EEF2FF'});
 assert.equal(p.colorKey,'blue');assert.equal(p.color,undefined);assert.equal(p.colorBg,undefined);
 assert.equal(a.get(p).accent,'#4F6BED');assert.equal(a.keyFor({...p,name:'改名'}),'blue');
 assert.equal(a.keyFor({id:'new'}),a.keyFor({id:'new',name:'另一个名字'}));
 assert.equal(a.keyFor({id:'prod',colorKey:'teal',color:'#4F6BED'}),'teal');
 assert.notEqual(a.get(p,'dark').surface,a.get(p).surface);
});
test('default group avatars resolve live project colors, preserve custom avatars and independent groups',()=>{
 const {EvaProjectAppearance:a,EvaAvatar:v}=setup();let project={id:'prod',colorKey:'blue'},custom='';
 v.setGroupAppearanceResolver(id=>id==='standalone'?null:{project,avatar:custom});
 const original=v.groupUri('group');assert.match(decodeURIComponent(original),/#4F6BED/);
 assert.equal(v.groupUri('group'),v.groupUri('all:prod'));assert.equal(v.groupUri('child'),original);
 const independent=v.groupUri('standalone');project={...project,colorKey:'teal'};
 assert.notEqual(v.groupUri('group'),original);assert.equal(v.groupUri('standalone'),independent);
 custom='data:image/png;base64,example';assert.equal(v.groupUri('group'),custom);
});
test('project agent identity uses project surface and unscoped identities retain their fallback',()=>{
 const window=setup();vm.runInNewContext(fs.readFileSync('prototype/003-my-assistant-identity.js','utf8'),{window});
 const scoped=window.EvaAIIdentity.avatar(window.EvaAIIdentity.projectAgentAppearance({id:'prod',colorKey:'blue'}));
 assert.match(scoped,/--eva-identity-avatar-background:light-dark\(#EEF2FF/);
 const plain=window.EvaAIIdentity.avatar(window.EvaAIIdentity.projectAgentAppearance());
 assert.doesNotMatch(plain,/--eva-identity-avatar-background/);
 assert.match(scoped,/project-agent-bot.svg/);assert.match(plain,/project-agent-bot.svg/);
});
