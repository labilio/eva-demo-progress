import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const ctx={window:{}};
vm.runInNewContext(readFileSync(new URL('../prototype/003-my-assistant-identity.js',import.meta.url),'utf8'),ctx);
const render=(type,props,...children)=>({type,props,children});
test('member identity preserves source and owner at shared avatar sizes',()=>{
  for(const size of [32,36]){
    const a=ctx.window.EvaAIIdentity.avatar({name:'采购分身',sourceName:'Eva',logo:'eva-logo',ownerName:'何静',ownerAvatar:'hejing-avatar'},size,render);
    assert.equal(a.props['aria-label'],'采购分身，来自Eva，属于何静');
    assert.equal(a.children[0].props.src,'eva-logo');
    assert.equal(a.children[1].props.src,'hejing-avatar');
    assert.equal(a.props.style['--eva-identity-avatar-size'],size+'px');
  }
});
test('HTML and React use the same AI badge',()=>{
  assert.equal(ctx.window.EvaAIIdentity.badge(),'<span class="ai-badge ai-badge-small">AI</span>');
  assert.equal(ctx.window.EvaAIIdentity.badge(render).props.className,'ai-badge ai-badge-small');
});
test('member surfaces keep owner geometry in shared stylesheet',()=>{
  const css=readFileSync(new URL('../prototype/003-ai-identity.css',import.meta.url),'utf8');
  assert.match(css,/0\.4375/);assert.match(css,/-0\.03125/);
  for(const f of ['009-2-picker-preview.css','009-2-members.css','032-contacts-redesign-v2.css'])assert.doesNotMatch(readFileSync(new URL('../prototype/'+f,import.meta.url),'utf8'),/eva-identity-avatar__owner|eva-picker-owner/);
});
