import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { createPatchedRuntime } from '../tools/build-runtime.mjs';

const read = path => fs.readFileSync(path, 'utf8');

test('构建产物直接包含补丁后的运行时，浏览器不再现场改写源码', () => {
  const entry = read('index.html');
  const { source, patchOrder } = createPatchedRuntime();

  assert.deepEqual(patchOrder, ['im', 'general', 'sidebar', 'automation']);
  assert.ok(source.length > 18_000_000, '构建产物缺少 legacy runtime 主体');
  assert.match(entry, /<script type="module" src="vendor\/eva-runtime\.module\.js"><\/script>/);
  assert.doesNotMatch(entry, /009-[4-9]-/);
  assert.doesNotMatch(entry, /eva-legacy-runtime\.js/);
});

test('正式一级路由在原生 PanelRoute 中注册并位于兜底路由之前', () => {
  const { source } = createPatchedRuntime();
  const wildcardIndex = source.indexOf('path:"*"');

  for (const route of ['/contacts', '/drive']) {
    const routeIndex = source.indexOf(`path:"${route}"`);
    assert.ok(routeIndex >= 0, `${route} 未注册`);
    assert.ok(routeIndex < wildcardIndex, `${route} 位于兜底路由之后`);
  }
  assert.match(source, /EvaNativePage=\(\{pageId:/);
});

test('侧栏模式和唯一选中态完全由路由推导', () => {
  const { source } = createPatchedRuntime();

  for (const [route, selection] of [
    ['/contacts', 'contacts'],
    ['/drive', 'drive'],
  ]) {
    assert.ok(source.includes(`rt==="${route}"`), `${route} 未进入侧栏路由推导`);
    assert.ok(source.includes(`return"${selection}"`), `${selection} 未成为路由选中态`);
  }
  assert.doesNotMatch(source, /__evaSidebarOverlayNavId|eva:sidebar-select/);
});

test('个人 Eva 主入口进入个人三栏页且加号仅作提示', () => {
  const { source } = createPatchedRuntime();
  const hierarchy = read('prototype/021-message-hierarchy.js');
  const personalColumns = read('prototype/042-personal-conversation-columns.js');

  assert.match(source, /EvaPersonalEntry=/);
  assert.match(source, /className:"eva-personal-entry__plus","aria-hidden":"true"/);
  assert.match(source, /case"new-chat":return React\.createElement\(EvaPersonalEntry,/);
  assert.match(source, /onClick:\(\)=>rt\.navigate\("\/guid"\)/);
  assert.doesNotMatch(source, /case"new-chat":return[^;]+SiderToolbar/);
  assert.doesNotMatch(hierarchy, /syncPersonalAssistantNav/);
  assert.match(personalColumns, /#\/guid/);
});

test('个人创建入口保留，团队通过连接助理与创建分身组织来源', () => {
  const personalColumns = read('prototype/042-personal-conversation-columns.js');
  const imPatch = read('prototype/009-5-patch-im.js');

  assert.match(imPatch, /连接助理/);
  assert.match(imPatch, /创建分身/);
  assert.match(imPatch, /store\.connectAssistant/);
  assert.match(imPatch, /store\.createPersona/);
  assert.match(personalColumns, /eva-my-ai-sidebar-actions eva-personal-sidebar-actions/);
  assert.match(personalColumns, /eva-my-ai-sidebar-actions__create-assistant/);
  assert.match(personalColumns, />创建助理<\/button>/);
  assert.match(personalColumns, /personalPlusIcon\.cloneNode\(true\)/);
  assert.match(personalColumns, /eva-my-ai-sidebar-actions__new-session/);
  assert.match(personalColumns, />新建对话<\/button>/);
  assert.doesNotMatch(personalColumns, /eva-personal-assistant-heading/);
});

test('个人助理使用 Brain 身份图标且整行提供 Hover', () => {
  const { source } = createPatchedRuntime();
  const personalColumns = read('prototype/042-personal-conversation-columns.js');
  const convergence = read('prototype/043-final-layout-convergence.css');

  assert.match(source, /eva-personal-assistant-icon-template/);
  assert.match(source, /React\.createElement\(Brain\$8,/);
  assert.match(personalColumns, /eva-personal-assistant-icon-template svg/);
  assert.doesNotMatch(personalColumns, /chat-history__item > span\.size-22px/);
  assert.match(convergence, /eva-personal-assistant-folder__row:hover\s*\{[^}]*background:\s*#e2e3e5/s);
  assert.match(convergence, /eva-personal-assistant-folder__row:hover\s+\.eva-assistant-folder__button\s*\{[^}]*background:\s*transparent/s);
  assert.match(convergence, /eva-assistant-conversation:hover\s*\{[^}]*background:\s*#e2e3e5/s);
});

test('创建和编辑助理共用编辑器并按模式新增或原位更新', () => {
  const personalColumns = read('prototype/042-personal-conversation-columns.js');
  const convergence = read('prototype/044-final-layout-convergence.js');

  assert.match(personalColumns, /data-eva-edit-assistant/);
  assert.match(personalColumns, /window\.__evaSavePersonalAssistant/);
  assert.match(convergence, /function openAssistantEditor\(options\)/);
  assert.match(convergence, /mode:\s*'create'/);
  assert.match(convergence, /mode:\s*'edit'/);
  assert.match(convergence, /data-eva-assistant-editor-mode/);
  assert.match(convergence, /__evaSavePersonalAssistant/);
});

test('一级页面只挂入路由宿主，不再追加到 document.body', () => {
  const files = [
    'prototype/020-mode-layer.js',
    'prototype/021-message-hierarchy.js',
    'prototype/025-demo-0902-v2-pages.js',
    'prototype/029-connection-center-v2-functional.js',
    'prototype/044-final-layout-convergence.js',
  ];
  const source = files.map(read).join('\n');

  assert.doesNotMatch(source, /document\.body\.appendChild\((?:root|page|center)\)/);
  assert.doesNotMatch(source, /document\.body\.insertAdjacentHTML\([^,]+,\s*build(?:Workboard|Automation)\(/);
  assert.doesNotMatch(source, /stopImmediatePropagation\(\)/);
  for (const pageId of ['contacts', 'drive', 'workboard', 'digital-employees', 'connection-center', 'personal']) {
    assert.match(source, new RegExp(`__evaNativePages\\.register\\(['"]${pageId}['"]`));
  }
});

test('迁移后的一级页面不再保留 DOM 导航状态或浏览器补丁加载器', () => {
  const hierarchy = read('prototype/021-message-hierarchy.js');
  const drive = read('prototype/020-mode-layer.js');
  const recent = read('prototype/040-team-message-project-recent.js');
  const connectionCenter = read('prototype/029-connection-center-v2-functional.js');

  assert.equal(fs.existsSync('prototype/009-9-loader.js'), false, '浏览器补丁加载器仍然存在');
  assert.doesNotMatch(hierarchy, /sync(?:Overview|Contacts|DriveShell)Selection|build(?:Overview|Contacts)Nav/);
  assert.doesNotMatch(drive, /driveNav\.classList\.(?:add|remove)\('is-active'\)/);
  assert.doesNotMatch(recent, /eva-mode-collaboration/);
  assert.match(recent, /route === '\/messages'/);
  assert.doesNotMatch(connectionCenter, /new MutationObserver|centerOpen|setCenterOpen/);
});
