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

test('个人 Eva 主入口进入 GDS 工作区且加号仅作提示', () => {
  const { source } = createPatchedRuntime();
  const hierarchy = read('prototype/021-message-hierarchy.js');
  const workspace = read('prototype/052-personal-eva-gds.js');

  assert.match(source, /EvaPersonalEntry=/);
  assert.match(source, /className:"eva-personal-entry__plus","aria-hidden":"true"/);
  assert.match(source, /case"new-chat":return React\.createElement\(EvaPersonalEntry,/);
  assert.match(source, /onClick:\(\)=>rt\.navigate\("\/guid"\)/);
  assert.doesNotMatch(source, /case"new-chat":return[^;]+SiderToolbar/);
  assert.doesNotMatch(hierarchy, /syncPersonalAssistantNav/);
  assert.match(workspace, /register\('personal'/);
  assert.equal(fs.existsSync('prototype/041-personal-conversation-columns.css'), false, '336px 会话中栏样式仍然存在');
  assert.equal(fs.existsSync('prototype/042-personal-conversation-columns.js'), false, '336px 会话中栏脚本仍然存在');
});

test('个人 Eva 侧栏面板与团队我的 AI 共用双操作顶部结构', () => {
  const { source } = createPatchedRuntime();
  const imPatch = read('prototype/009-5-patch-im.js');

  assert.match(imPatch, /eva-my-ai-sidebar-actions/);
  assert.match(source, /eva-my-ai-sidebar-actions eva-personal-sidebar-actions/);
  assert.match(source, /eva-my-ai-sidebar-actions__create-assistant/);
  assert.match(source, /"创建助理"\)/);
  assert.match(source, /React\.createElement\(EvaPersonalPlusIcon,\{size:16,strokeWidth:1\.5\}\),"创建助理"/);
  assert.match(source, /eva-my-ai-sidebar-actions__new-session/);
  assert.match(source, /"新建对话"\)/);
  assert.doesNotMatch(source, /eva-personal-assistant-heading/);
});

test('个人助理使用 Brain 身份图标且整行提供 Hover', () => {
  const { source } = createPatchedRuntime();
  const convergence = read('prototype/043-final-layout-convergence.css');

  // 助理身份图标由侧栏面板直接渲染，不再靠隐藏模板 + DOM 抓取克隆。
  assert.match(source, /EvaPersonalAssistantFolder=/);
  assert.match(source, /eva-assistant-folder__icon","aria-hidden":"true"\},React\.createElement\(Brain\$8,/);
  assert.doesNotMatch(source, /eva-personal-assistant-icon-template/);
  // Hover／选中态取 047 的语义 token，业务 CSS 不再写原始色值。
  assert.match(convergence, /eva-personal-assistant-folder__row:hover\s*\{[^}]*background:\s*var\(--eva-overlay-hover\)/s);
  assert.match(convergence, /eva-personal-assistant-folder__row:hover\s+\.eva-assistant-folder__button\s*\{[^}]*background:\s*transparent/s);
  assert.match(convergence, /eva-assistant-conversation:hover\s*\{[^}]*background:\s*var\(--eva-overlay-hover\)/s);
  assert.match(convergence, /eva-assistant-conversation\.is-selected\s*\{[^}]*background:\s*var\(--eva-overlay-pressed\)/s);
});

test('创建和编辑助理共用编辑器并按模式新增或原位更新', () => {
  const { source } = createPatchedRuntime();
  const assistants = read('prototype/046-personal-assistants.js');
  const convergence = read('prototype/044-final-layout-convergence.js');

  assert.match(source, /data-eva-edit-assistant/);
  assert.match(assistants, /window\.__evaSavePersonalAssistant/);
  assert.match(convergence, /\.eva-personal-sider-panel \[data-eva-edit-assistant\]/);
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
    'prototype/052-personal-eva-gds.js',
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

test('GDS 经语义 token 与组件适配层进入，业务层不写原始色值', () => {
  const tokens = read('prototype/047-gds-tokens.css');
  const reroot = read('prototype/049-gds-brand-reroot.css');
  const workspaceCss = read('prototype/051-personal-eva-gds.css');

  assert.match(tokens, /--eva-font-sans:\s*"PingFang SC"/);
  assert.match(tokens, /--eva-action-primary:\s*var\(--eva-c-brand-blue\)/);
  assert.match(tokens, /--eva-c-brand-blue:\s*#1563eb/);
  // 改根层把项目既有的品牌槽位接到 GDS 主色上，而不是逐条覆盖 .semi-* 规则。
  assert.match(reroot, /--wk-brand-primary:\s*var\(--eva-action-primary\)/);
  assert.doesNotMatch(workspaceCss, /#[0-9a-fA-F]{3,8}\b/, '051 出现了十六进制字面量');
});

test('个人 Eva 六态挂在路由宿主内，不使用全屏或 fixed 根节点', () => {
  const workspace = read('prototype/052-personal-eva-gds.js');
  const workspaceCss = read('prototype/051-personal-eva-gds.css');

  for (const state of ['home', 'input', 'skill-picker', 'operation', 'generating', 'completed']) {
    assert.ok(workspace.includes(`'${state}'`), `缺少 GDS 页面态：${state}`);
    assert.ok(
      workspaceCss.includes(`[data-eva-state="${state}"]`),
      `缺少 ${state} 的态选择器`,
    );
  }
  assert.match(workspace, /window\.__evaPersonalState/);
  assert.doesNotMatch(workspaceCss, /position:\s*fixed/);
});

test('侧栏宽度回到 GDS 标准外壳的 260 并保留 84 折叠宽', () => {
  const { source } = createPatchedRuntime();

  assert.match(source, /DEFAULT_SIDER_WIDTH=260,DESKTOP_COLLAPSED_WIDTH=84,SIDER_MIN_WIDTH=200/);
  assert.doesNotMatch(source, /DEFAULT_SIDER_WIDTH=248/);
  assert.match(source, /EvaPersonalWorkspacePanel=/);
  assert.match(source, /className:"eva-personal-sider-panel"/);
  // 连接中心图标改用 createLucideIcon，不再手写内联 svg（AGENTS.md:151）。
  assert.match(source, /EvaConnectionCenterIcon=createLucideIcon\("unplug",/);
});

test('折叠侧栏整列可滚动，导航与历史共用同一个滚动容器', () => {
  const { source } = createPatchedRuntime();

  // vendor 宿主 .flex-1.min-h-0.overflow-hidden 会裁掉一切溢出，而三段导航都是
  // shrink-0：折叠态 11 个 entry 各 56px + 3 个分组标题实测 700px > 宿主 662px。
  // 所以注入内容必须自己套一层 flex-1 min-h-0 overflow-y-auto 的滚动容器。
  assert.match(
    source,
    /React\.createElement\("div",\{className:classNames\("flex-1 min-h-0 flex flex-col gap-2px overflow-y-auto",siderStyles\.scrollArea\)\},React\.createElement\(EvaSidebarNavigation,/
  );
  // 折叠态的分组历史跟着外层一起滚：shrink-0，不再抢 flex-1 被压成 0 高。
  assert.match(
    source,
    /ct\?React\.createElement\("div",\{className:"shrink-0"\},React\.createElement\(reactExports\.Suspense,.*?React\.createElement\(WorkspaceGroupedHistory\$1,\{\.\.\.pr\}\)\)\):React\.createElement\(EvaPersonalWorkspacePanel,/
  );
  // 折叠态曾经落到没有滚动容器的静态占位块上，导致整列无法上下滚动。
  assert.doesNotMatch(source, /evaMode==="personal"&&!ct\?/);
});

test('--topbar-height 全库只定义一次，浮层不再回退到 2.6rem', () => {
  const roots = ['prototype', 'review', 'index.html'];
  const files = [];
  const walk = target => {
    const stat = fs.statSync(target);
    if (stat.isDirectory()) fs.readdirSync(target).forEach(name => walk(`${target}/${name}`));
    else if (/\.(css|js|mjs|html)$/.test(target)) files.push(target);
  };
  roots.forEach(walk);

  const definitions = files.flatMap(file => {
    const hits = read(file).match(/--topbar-height\s*:/g) || [];
    return hits.map(() => file);
  });
  assert.deepEqual(definitions, ['prototype/049-gds-brand-reroot.css']);
  for (const file of files) {
    assert.doesNotMatch(read(file), /--topbar-height\s*,\s*2\.6rem/, `${file} 仍在回退到 2.6rem`);
  }
});
