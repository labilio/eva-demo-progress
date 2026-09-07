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

test('个人 Eva 主入口使用原版路由宿主，不再加载固定六态演示', () => {
 const {source}=createPatchedRuntime(),entry=read('index.html'),workspace=read('prototype/044-final-layout-convergence.js');
 assert.match(source,/case"new-chat":return React\.createElement\(EvaPersonalEntry,/);
 assert.match(source,/onClick:\(\)=>rt\.navigate\("\/guid"\)/);
 assert.match(workspace,/__evaNativePages\.register\('personal'/);
 assert.doesNotMatch(entry,/051-personal-eva-gds|052-personal-eva-gds/);
 assert.match(entry,/041-personal-conversation-columns.css/);
 assert.match(entry,/042-personal-conversation-columns.js/);
});
test('个人助理中间栏读取共享身份仓并保留创建与会话列表，团队布局保持独立',()=>{
 const columns=read('prototype/042-personal-conversation-columns.js'),im=read('prototype/009-5-patch-im.js'),css=read('prototype/043-final-layout-convergence.css');
 assert.match(columns,/aiTeamStore\.getSnapshot\(\)\.localAssistants/);
 assert.match(columns,/aiTeamStore\.subscribe/);
 assert.match(columns,/eva-personal-history-column/);
 assert.match(columns,/eva-assistant-tree__create/);
 assert.match(columns,/eva-assistant-conversation/);
 assert.match(im,/roleGroup\('persona','云端分身',personas\)/);
 assert.match(im,/roleGroup\('digital','数字员工',digitalEmployees\)/);
 assert.doesNotMatch(im,/roleGroup\('assistant','本地助理'/);
 assert.match(im,/eva-ai-team__new-session/);
 assert.match(im,/data-eva-conversation-rail-resizer/);
 assert.match(css,/width:\s*var\(--eva-conversation-rail-current\)/);
});
test('原版个人内容保持会话消息渲染，不将所有请求伪装成固定PPT生成',()=>{
 const workspace=read('prototype/044-final-layout-convergence.js');
 assert.match(workspace,/personalMessages\[personalConversation\]\.map\(personalMessageHTML\)/);
 assert.match(workspace,/escapeHTML/);
 assert.match(workspace,/renderPersonalChat\(personalConversation\)/);
 assert.doesNotMatch(workspace,/UI设计师发展前景|GENERATING_TOOLS|setState\('completed'\)/);
});
test('消息关注中的群聊可双击收缩子区并显示状态指示', () => {
  const imPatch = read('prototype/009-5-patch-im.js');
  const hierarchyCss = read('prototype/016-message-hierarchy.css');

  assert.match(imPatch, /onDoubleClick:Dt=>\{xt&&/);
  assert.match(imPatch, /wk-conv-compact-thread-toggle/);
  assert.match(imPatch, /threadsExpanded:Zi/);
  assert.match(hierarchyCss, /wk-conv-compact-thread-toggle\.is-collapsed/);
  assert.match(hierarchyCss, /--eva-space-group-indent:\s*12px/);
  assert.match(hierarchyCss, /--eva-space-thread-indent:\s*12px/);
  assert.match(hierarchyCss, /padding-inline-start:\s*calc\(var\(--eva-space-group-indent\) - var\(--gds-space-0-5\)\)/);
});

test('消息内嵌项目隐藏群聊标签并在会话选择时返回群聊', () => {
  const imPatch = read('prototype/009-5-patch-im.js');
  const hierarchyCss = read('prototype/016-message-hierarchy.css');

  assert.match(hierarchyCss, /eva-inline-project-panel[\s\S]+collab-tab:nth-child\(2\)\s*\{\s*display:\s*none/);
  assert.doesNotMatch(imPatch, /eva-inline-project-panel__head|返回群聊/);
  assert.doesNotMatch(hierarchyCss, /eva-inline-project-panel__(?:head|back|title)/);
  assert.match(imPatch, /La=ci=>\{setEvaInlineProjectId\(null\),xt\(ci\),Nt\(null\)/);
  assert.match(imPatch, /Za=\(ci,Zi\)=>\{setEvaInlineProjectId\(null\),xt\(ci\),Nt\(Zi\)/);
});

test('点击群聊内容区会关闭已打开的子区或聊天信息面板', () => {
  const imPatch = read('prototype/009-5-patch-im.js');

  assert.match(imPatch, /ch-main__stream",onClick:ci=>\{\(Mt===\"threads\"\|\|Mt===\"info\"\)&&!ci\.target\.closest\(\"\.wk-messageinput-box, \.wk-contextmenus\"\)&&Dt\(\"none\"\)\}/);
});

test('团队消息和我的 AI 的第二栏使用同一套 GDS 文字层级', () => {
  const hierarchyCss = read('prototype/016-message-hierarchy.css');
  const aiTeamCss = read('prototype/046-ai-team.css');
  const messageSwitcherCss = read('prototype/039-team-message-project-recent.css');
  const imPatch = read('prototype/009-5-patch-im.js');

  for (const css of [hierarchyCss, aiTeamCss]) {
    assert.match(css, /--gds-type-label-medium-font-size/);
    assert.match(css, /--gds-type-label-font-size/);
    assert.match(css, /--gds-type-caption-font-size/);
  }
  assert.match(hierarchyCss, /wk-category-header__name\s*\{[^}]*font-size:\s*var\(--gds-type-label-medium-font-size\)[^}]*font-weight:\s*var\(--gds-font-weight-medium\)/s);
  assert.match(hierarchyCss, /eva-space-card \.wk-category-header\s*\{[^}]*width:\s*100%[^}]*margin-inline-start:\s*0[^}]*gap:\s*var\(--gds-space-1\)/s);
  assert.match(hierarchyCss, /wk-category-header__arrow\s*\{[^}]*width:\s*var\(--gds-icon-size-chevron\)[^}]*margin-right:\s*0/s);
  assert.match(hierarchyCss, /wk-category-header__arrow svg\s*\{[^}]*width:\s*var\(--gds-icon-size-chevron\)[^}]*height:\s*var\(--gds-icon-size-chevron\)/s);
  assert.match(hierarchyCss, /wk-category-header__arrow\s*\{[^}]*transform:\s*none/s);
  assert.match(hierarchyCss, /wk-category-header__arrow--collapsed\s*\{[^}]*transform:\s*none/s);
  assert.match(imPatch, /项目一级分组使用共享 Lucide 折叠箭头/);
  assert.match(imPatch, /React\.createElement\(ChevronRight,\{size:12,className:"eva-ai-team__group-chevron"\+\(mt\?"":" is-expanded"\),"aria-hidden":true\}\)/);
  assert.match(hierarchyCss, /wk-conv-compact-item--thread \.wk-conv-compact-name\s*\{[^}]*font-size:\s*var\(--gds-type-label-font-size\)[^}]*font-weight:\s*var\(--gds-font-weight-regular\)/s);
  assert.match(aiTeamCss, /eva-ai-team__group-title\s*\{[^}]*font-size:\s*var\(--gds-type-label-medium-font-size\)/s);
  assert.match(aiTeamCss, /eva-ai-team__session-title\s*\{[^}]*font-size:\s*var\(--eva-rail-label-size\)[^}]*font-weight:\s*var\(--gds-font-weight-regular\)/s);
  assert.match(aiTeamCss, /--eva-rail-level-indent:\s*12px/);
  assert.match(aiTeamCss, /--eva-rail-session-indent:\s*calc\(24px \+ var\(--gds-space-1\) \+ var\(--eva-rail-level-indent\)\)/);
  assert.match(aiTeamCss, /eva-ai-team__sidebar-header\s*\{[^}]*padding:\s*var\(--gds-space-3\)/s);
  assert.match(aiTeamCss, /eva-ai-team__sidebar-header \.semi-button\s*\{[^}]*height:\s*34px/s);
  assert.match(messageSwitcherCss, /wk-sidebar-tabbar\[data-eva-project-recent-switcher="true"\]\s*\{[^}]*padding:\s*var\(--gds-space-3\)/s);
  assert.match(messageSwitcherCss, /wk-sidebar-tabbar__container\s*\{[^}]*height:\s*34px[^}]*padding:\s*0/s);
  assert.match(messageSwitcherCss, /wk-sidebar-tabbar__btn\s*\{[^}]*min-height:\s*34px/s);
  assert.match(messageSwitcherCss, /eva-msg \.ch-list__top\s*\{[^}]*display:\s*none/s);
  assert.match(imPatch, /EvaAIIdentityAvatar,\{appearance:evaIdentityAppearance\(i\),size:24\}/);
});

test('个人助理复用原版身份图标模板，个人消息不重复加团队AI标',()=>{
 const columns=read('prototype/042-personal-conversation-columns.js'),workspace=read('prototype/044-final-layout-convergence.js');
 assert.match(columns,/eva-personal-assistant-icon-template svg/);
 assert.match(columns,/source\.cloneNode\(true\)/);
 assert.doesNotMatch(workspace,/EvaAIIdentity\.badge|AiBadge|class="ai-badge"/);
});
test('原版个人创建编辑入口复用共享助理编辑器与身份数据仓',()=>{
 const workspace=read('prototype/044-final-layout-convergence.js'),editor=read('prototype/009-5-patch-im.js');
 assert.match(workspace,/function openAssistantEditor\(options\)/);
 assert.match(workspace,/window\.__evaOpenAssistantEditor/);
 assert.match(workspace,/mode:\s*'create'/);
 assert.match(workspace,/mode:\s*'edit'/);
 assert.match(editor,/function EvaAssistantEditor\(/);
 assert.match(editor,/store\.saveLocalAssistant/);
 assert.match(editor,/store\.savePersona/);
 assert.doesNotMatch(workspace,/function ensureCreateAssistantModal/);
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
  for (const pageId of ['contacts', 'drive', 'workboard', 'connection-center', 'personal']) {
    assert.match(source, new RegExp(`__evaNativePages\\.register\\(['"]${pageId}['"]`));
  }
});

test('数字员工已React化，路由直接选择唯一组件而非旧DOM注册桥',()=>{
 const {source}=createPatchedRuntime();
 assert.match(source,/React\.createElement\(EvaDigitalEmployeesPage/);
 assert.match(source,/view:"market"/);
 assert.doesNotMatch(read('prototype/025-demo-0902-v2-pages.js'),/__evaNativePages\.register\(['"]digital-employees/);
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

test('GDS 保留语义token定义，已删除六态业务样式不再进入装配链',()=>{
 const tokens=read('prototype/047-gds-tokens.css'),entry=read('index.html'),manifest=read('prototype-manifest.json');
 assert.match(tokens,/--eva-action-primary:\s*var\(--eva-c-brand-blue\)/);
 assert.match(tokens,/--eva-c-brand-blue:\s*#1563eb/);
 for(const source of [entry,manifest])assert.doesNotMatch(source,/051-personal-eva-gds|052-personal-eva-gds/);
});
test('项目内项目信息位于项目设置前并展示核心项目档案', () => {
  const patch = read('prototype/009-6-patch-general.js');
  const projectCss = read('prototype/036-project-directory-v3.css');
  const { source } = createPatchedRuntime();

  assert.match(patch, /eva-project-directory-actions/);
  assert.match(patch, /eva-project-directory-search/);
  assert.match(patch, /evaFilteredPinnedProjects/);
  assert.match(patch, /evaFilteredProjects/);
  assert.doesNotMatch(patch, /eva-project-directory-hero/);
  assert.match(projectCss, /\.eva-project-info\s*\{[^}]*height:\s*100%[^}]*overflow-y:\s*auto/s);
  assert.match(patch, /key:\"project-info\",label:\"项目信息\"\},\{key:\"settings\",label:\"项目设置\"/);
  assert.match(source, /case\"project-info\":return React\.createElement\(EvaProjectInfoPage/);
  for (const section of ['发起背景', '项目目标', '项目周期', '关键里程碑', '协作范围', '关键协作人']) {
    assert.ok(source.includes(section), `项目信息缺少：${section}`);
  }
});

test('原版个人内容在宿主内创建并在离开时清理，不覆盖客户端标题栏',()=>{
 const workspace=read('prototype/044-final-layout-convergence.js');
 assert.match(workspace,/host\.appendChild\(root\)/);
 assert.match(workspace,/if \(root\.parentElement === host\) root\.remove\(\)/);
 assert.doesNotMatch(workspace,/document\.body\.appendChild\(root\)/);
 assert.doesNotMatch(workspace,/root\.style\.(?:position|top)\s*=/);
 assert.doesNotMatch(read('index.html'),/052-personal-eva-gds/);
});
test('侧栏展开默认宽度为 180、折叠宽度为 80 且不渲染广告栏', () => {
  const { source } = createPatchedRuntime();

  assert.match(source, /DEFAULT_SIDER_WIDTH=180,DESKTOP_COLLAPSED_WIDTH=80,SIDER_MIN_WIDTH=200/);
  assert.doesNotMatch(source, /eva-promo-banner|打造王牌Skill|瓜分万元奖金池/);
  assert.doesNotMatch(source, /DEFAULT_SIDER_WIDTH=248/);
  assert.doesNotMatch(source, /EvaPersonalWorkspacePanel=/);
  assert.match(source, /minWidth:DEFAULT_SIDER_WIDTH/);
  assert.match(source, /collapseThreshold:SIDER_MIN_WIDTH/);
  assert.match(source, /if\(Mt&&oa<St&&!xt\)/);
  assert.match(source, /if\(ra!==null\?Mt&&ra<St&&!xt:hr\)/);
  assert.match(source, /eva-sider-resize-handle/);
  assert.match(source, /onDoubleClick:\(\)=>\{if\(Kt\?\.includes\("eva-sider-resize-handle"\)\)/);
  // 连接中心图标改用 createLucideIcon，不再手写内联 svg（AGENTS.md:151）。
  assert.match(source, /EvaConnectionCenterIcon=createLucideIcon\("unplug",/);
});

test('折叠侧栏只承载一级导航并保持可滚动', () => {
  const { source } = createPatchedRuntime();

  // vendor 宿主 .flex-1.min-h-0.overflow-hidden 会裁掉一切溢出，而三段导航都是
  // shrink-0：折叠态 11 个 entry 各 56px + 3 个分组标题实测 700px > 宿主 662px。
  // 所以注入内容必须自己套一层 flex-1 min-h-0 overflow-y-auto 的滚动容器。
  assert.match(
    source,
    /React\.createElement\("div",\{className:classNames\("flex-1 min-h-0 flex flex-col gap-2px overflow-y-auto",siderStyles\.scrollArea\)\},React\.createElement\(EvaSidebarNavigation,/
  );
  assert.doesNotMatch(source, /WorkspaceGroupedHistory\$1,\{\.\.\.pr\}/);
  assert.doesNotMatch(source, /EvaPersonalWorkspacePanel/);
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
