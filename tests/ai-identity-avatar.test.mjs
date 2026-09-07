import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import { createPatchedRuntime } from '../tools/build-runtime.mjs';

const runtime = createPatchedRuntime().source;
const helper = runtime.slice(runtime.indexOf('function evaIdentityAppearance('), runtime.indexOf('function EvaAITeamPage('));
function render(name, size, avatar) {
  const context = {
    window: { __EVA_MY_ASSISTANT_IDENTITY: { logo: 'eva-logo' } },
    React: { createElement: (type, props, ...children) => ({type, props, children}) },
    input: {name, sourceAssistantId:'assistant-rd',configuration:{avatar}}, size
  };
  vm.runInNewContext(readFileSync(new URL('../prototype/003-my-assistant-identity.js',import.meta.url),'utf8').split('/* One identity contract')[1].replace(/^/, '/* One identity contract'),context);
  return vm.runInNewContext(helper + '\nEvaAIIdentityAvatar({appearance:evaIdentityAppearance(input),size})', context);
}

test('AI identity renders one circular image and uses the configured avatar at all sizes', () => {
  for (const size of [28,32,36]) {
    const avatar = render('研发助理的分身', size, 'https://example.test/rd.png');
    assert.equal(avatar.props.role, 'img');
    assert.equal(avatar.props['aria-label'], '研发助理的分身，来自Eva');
    assert.equal(avatar.children.length, 1);
    assert.equal(avatar.children[0].props.src, 'https://example.test/rd.png');
    assert.equal(avatar.props.style['--eva-identity-avatar-size'], size+'px');
  }
});

test('AI identity falls back to its standard avatar when no custom image is set', () => {
  const avatar=render('新的分身',32,'');
  assert.equal(avatar.props.title, '新的分身，来自Eva');
  assert.equal(avatar.children[0].props.src, 'eva-logo');
});


test('project identity keeps one shared circular avatar without a secondary owner portrait', () => {
  const css=readFileSync(new URL('../prototype/003-ai-identity.css',import.meta.url),'utf8');
  assert.match(css,/border-radius: 50%/);
  assert.doesNotMatch(css,/eva-identity-avatar__owner/);
  for(const file of ['032-contacts-redesign-v2.css','046-ai-team.css']) {
    const feature=readFileSync(new URL('../prototype/'+file,import.meta.url),'utf8');
    assert.doesNotMatch(feature,/--eva-identity-owner-(size|offset|border)/);
    assert.doesNotMatch(feature,/\.eva-identity-avatar__owner\s*\{/);
  }
});

test('React and HTML badges share the same fixed Octo badge contract', () => {
  const ctx={window:{}};
  const src=readFileSync(new URL('../prototype/003-my-assistant-identity.js',import.meta.url),'utf8');
  vm.runInNewContext(src.slice(src.indexOf('/* One identity contract')),ctx);
  const identity=ctx.window.EvaAIIdentity;
  assert.equal(identity.badge(),'<span class="ai-badge ai-badge-small">AI</span>');
  const badge=identity.badge((tag,props,...children)=>({tag,props,children}));
  assert.equal(badge.props.className,'ai-badge ai-badge-small');
  assert.equal(badge.children[0],'AI');
});

test('project agent uses its stable bot avatar',()=>{
 const ctx={window:{__EVA_COLLEAGUE_PORTRAIT:'eva-logo',__EVA_CURRENT_USER_PORTRAIT:'human'}};
 vm.runInNewContext(readFileSync(new URL('../prototype/003-my-assistant-identity.js',import.meta.url),'utf8'),ctx);
 const appearance=ctx.window.EvaAIIdentity.projectAgentAppearance();const markup=ctx.window.EvaAIIdentity.avatar(appearance,32);
 assert.match(markup,/Eva 云端项目 AI/);assert.match(markup,/project-agent-bot.svg/);assert.doesNotMatch(markup,/eva-identity-avatar__owner/);
});
