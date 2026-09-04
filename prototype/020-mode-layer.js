
(function () {
  'use strict';

  var config = {"variant":"unified-sidebar","name":"个人与团队统一导航","defaultMode":"collaboration","defaultWorkspaceId":"prod"};
  /* Project cards, the left project tree, switching and messages share this registry. */
  var WORKSPACES = (window.__EVA_PROJECTS || []).map(function (project) {
    return {
      id: project.id,
      name: project.name,
      mark: project.short,
      description: project.desc,
      members: Array.isArray(project.members) ? project.members.length : Number(project.members || 0),
      assistants: Number(project.bots || 0),
      official: Boolean(project.official)
    };
  });

  /* Global drive and Workspace files always read and mutate this same collection. */
  var resources = [
    { id: 'outside-group-brief', name: '合作伙伴联合方案.docx', kind: 'word', owner: '何静', permission: '可编辑', modified: '今天 14:20', size: '386 KB', workspaceIds: [], area: 'group', source: '项目外群聊 · 合作伙伴沟通群', description: '项目外群聊中共享的联合方案' },
    { id: 'dm-brand', name: '品牌视觉素材.zip', kind: 'archive', owner: '何静', permission: '可下载', modified: '昨天 18:05', size: '24.6 MB', workspaceIds: [], area: 'dm', source: '私聊 · 何静', description: '由何静在私聊中发送的品牌素材压缩包' },
    { id: 'prod-folder', name: '供应链运营资料', kind: 'folder', owner: '王宜林', permission: '可管理', modified: '今天 14:20', size: '—', workspaceIds: ['prod'], area: 'workspace', description: '采购、质量与合规工作的共享资料' },
    { id: 'prod-ia', name: '本季度间接采购需求清单.xlsx', kind: 'sheet', owner: '王宜林', permission: '可管理', modified: '今天 13:48', size: '2.8 MB', workspaceIds: ['prod'], area: 'workspace', description: '各部门提交的采购数量、预算与期望到货时间' },
    { id: 'prod-research', name: 'A-2409来料异常分析报告.pdf', kind: 'pdf', owner: '林晓', permission: '可编辑', modified: '今天 11:32', size: '412 KB', workspaceIds: ['prod'], area: 'workspace', description: '关键供应商来料异常的根因、措施与验证记录' },
    { id: 'prod-agents', name: '新供应商准入合规材料.zip', kind: 'archive', owner: '周远', permission: '可编辑', modified: '昨天 17:26', size: '18 MB', workspaceIds: ['prod'], area: 'workspace', description: '供应商资质、关联关系声明与准入审核材料' },
    { id: 'client-folder', name: '交付资料', kind: 'folder', owner: '苏航', permission: '可管理', modified: '今天 09:50', size: '—', workspaceIds: ['lab'], area: 'workspace', description: '客户联合交付的共享文件夹' },
    { id: 'client-scope', name: '客户XX公司资料.pdf', kind: 'pdf', owner: '苏航', permission: '可编辑', modified: '今天 09:18', size: '1.4 MB', workspaceIds: ['lab'], area: 'workspace', source: '消息 · 客户联合交付群', description: '项目消息中发送的客户 XX 公司背景与需求资料' },
    { id: 'client-script', name: '客户XX公司销售话术.docx', kind: 'word', owner: '王宜林的 Eva 助理', permission: '可编辑', modified: '今天 09:26', size: '128 KB', workspaceIds: ['lab'], area: 'workspace', source: 'Loop 产出 · 客户销售准备', description: 'Loop 任务读取客户资料后产出的针对性销售话术' },
    { id: 'client-plan', name: '联合交付计划.xlsx', kind: 'sheet', owner: '客户项目组', permission: '可编辑', modified: '昨天 16:40', size: '732 KB', workspaceIds: ['lab'], area: 'workspace', source: '消息 · 客户联合交付群', description: '内部团队与客户共同维护的交付计划' }
  ];

  var state = {
    mode: config.defaultMode || 'collaboration',
    workspaceId: config.defaultWorkspaceId || 'prod',
    driveEntry: 'global',
    driveScope: 'all',
    selectedId: null,
    query: '',
    pendingWorkspaceId: null,
    pendingTab: null,
    toastTimer: null
  };

  var frameQueued = false;
  var internalMutation = false;

  function workspaceById(id) {
    return WORKSPACES.find(function (workspace) { return workspace.id === id; }) || WORKSPACES[0];
  }

  function driveScopeForMode(mode) {
    return 'all';
  }

  function escapeHTML(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function icon(name, className) {
    return '<svg class="' + (className || 'eva-drive-icon') + '" aria-hidden="true"><use href="#eva-i-' + name + '"></use></svg>';
  }

  function installSprite() {
    if (document.getElementById('eva-mode-icon-sprite')) return;
    var sprite = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    sprite.setAttribute('id', 'eva-mode-icon-sprite');
    sprite.setAttribute('aria-hidden', 'true');
    sprite.style.display = 'none';
    sprite.innerHTML = [
      '<symbol id="eva-i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></symbol>',
      '<symbol id="eva-i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></symbol>',
      '<symbol id="eva-i-upload" viewBox="0 0 24 24"><path d="M12 16V3M7 8l5-5 5 5M4 16v4h16v-4"></path></symbol>',
      '<symbol id="eva-i-link" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1"></path><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1"></path></symbol>',
      '<symbol id="eva-i-folder" viewBox="0 0 24 24"><path d="M3 6h7l2 3h9v11H3z"></path></symbol>',
      '<symbol id="eva-i-file" viewBox="0 0 24 24"><path d="M6 2h8l4 4v16H6z"></path><path d="M14 2v5h5"></path></symbol>',
      '<symbol id="eva-i-sheet" viewBox="0 0 24 24"><path d="M6 2h8l4 4v16H6z"></path><path d="M14 2v5h5M8 11h8v8H8zM12 11v8M8 15h8"></path></symbol>',
      '<symbol id="eva-i-drive" viewBox="0 0 24 24"><path d="M4 4h16v6H4zM4 14h16v6H4z"></path><path d="M16 7h1M16 17h1"></path></symbol>',
      '<symbol id="eva-i-workspace" viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="1"></rect><rect x="13" y="3" width="8" height="8" rx="1"></rect><rect x="3" y="13" width="8" height="8" rx="1"></rect><rect x="13" y="13" width="8" height="8" rx="1"></rect></symbol>',
      '<symbol id="eva-i-users" viewBox="0 0 24 24"><circle cx="9" cy="8" r="4"></circle><path d="M2 21v-2a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v2M17 4a4 4 0 0 1 0 8M18 14a5 5 0 0 1 4 5v2"></path></symbol>',
      '<symbol id="eva-i-task" viewBox="0 0 24 24"><path d="M9 5h11M9 12h11M9 19h11"></path><path d="m3 5 1.5 1.5L7 3.5M3 12l1.5 1.5L7 10.5M3 19l1.5 1.5L7 17.5"></path></symbol>',
      '<symbol id="eva-i-automation" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="3"></rect><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3M10 10h4v4h-4z"></path></symbol>',
      '<symbol id="eva-i-bolt" viewBox="0 0 24 24"><path d="m13 2-8 12h7l-1 8 8-12h-7z"></path></symbol>',
      '<symbol id="eva-i-arrow" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"></path></symbol>',
      '<symbol id="eva-i-chevron" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"></path></symbol>',
      '<symbol id="eva-i-external" viewBox="0 0 24 24"><path d="M14 3h7v7M21 3l-9 9"></path><path d="M18 13v7H4V6h7"></path></symbol>',
      '<symbol id="eva-i-more" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1"></circle><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle></symbol>'
    ].join('');
    document.body.prepend(sprite);
  }

  function sidebar() {
    return document.querySelector('aside.arco-layout-sider') || document.querySelector('aside');
  }

  function navContainer() {
    var side = sidebar();
    if (!side) return null;
    return side.querySelector('.size-full.flex.flex-col.gap-2px');
  }

  function directChildForText(container, text) {
    if (!container) return null;
    return Array.from(container.children).find(function (child) {
      return Array.from(child.querySelectorAll('span')).some(function (span) {
        return span.textContent.trim() === text;
      });
    }) || null;
  }

  function searchEntry(container) {
    return directChildForText(container, '搜索会话') || directChildForText(container, '搜索');
  }

  function newConversationEntry(container) {
    return directChildForText(container, '新建会话');
  }

  function historyArea(container) {
    return Array.from(container ? container.children : []).find(function (child) {
      return child.className && String(child.className).indexOf('overflow-y-auto') >= 0;
    }) || null;
  }

  function nativeDivider(container) {
    return Array.from(container ? container.children : []).find(function (child) {
      var className = String(child.className || '');
      return className.indexOf('h-1px') >= 0 && className.indexOf('bg-') >= 0;
    }) || null;
  }

  function currentModeFromLocation() {
    var hash = String(location.hash || '');
    if (hash.indexOf('#/collab') === 0 || hash.indexOf('#/messages') === 0) return 'collaboration';
    if (hash.indexOf('evaMode=collaboration') >= 0) return 'collaboration';
    return 'personal';
  }

  /* Business overlays may sync their geometry, but never mutate first-level navigation. */
  function syncShellGeometry() {
    state.mode = currentModeFromLocation();
    syncDriveLeft();
  }

  function navigatePersonal() {
    closeDrive();
    if (location.hash !== '#/guid') location.hash = '#/guid';
  }

  function navigateCollaboration() {
    closeDrive();
    if (location.hash !== '#/collab') location.hash = '#/collab';
  }

  function setMode(mode, workspaceId) {
    state.mode = mode;
    if (workspaceId) state.workspaceId = workspaceId;
    if (mode === 'personal') {
      navigatePersonal();
    } else if (config.variant === 'workspace-picker') {
      openWorkspace(state.workspaceId, null);
    } else {
      navigateCollaboration();
    }
    syncShellGeometry();
  }

  function currentWorkspaceIdFromUI() {
    var chip = document.querySelector('.collab-sp-chip .nm');
    if (chip) {
      var match = WORKSPACES.find(function (workspace) { return workspace.name === chip.textContent.trim(); });
      if (match) return match.id;
    }
    return state.workspaceId || 'prod';
  }

  function openWorkspace(id, tab) {
    state.mode = 'collaboration';
    state.workspaceId = id || state.workspaceId || 'prod';
    state.pendingWorkspaceId = state.workspaceId;
    state.pendingTab = tab || null;
    closeDrive();
    if (location.hash !== '#/collab') location.hash = '#/collab';
    syncShellGeometry();
    setTimeout(fulfillPendingNavigation, 30);
  }

  window.__evaOpenWorkspaceFromTree = function (id, tab) {
    openWorkspace(id, tab || null);
  };

  function fulfillPendingNavigation() {
    if (!state.pendingWorkspaceId) return;
    var workspace = workspaceById(state.pendingWorkspaceId);
    var list = document.querySelector('.collab-list-page');
    if (list) {
      var card = Array.from(list.querySelectorAll('.collab-space-card')).find(function (item) {
        return item.textContent.indexOf(workspace.name) >= 0;
      });
      if (card) {
        card.click();
        return;
      }
    }

    var frame = document.querySelector('.collab-frame');
    if (!frame) return;
    var currentName = frame.querySelector('.collab-sp-chip .nm');
    if (currentName && currentName.textContent.trim() !== workspace.name) {
      var chip = frame.querySelector('.collab-sp-chip');
      if (chip && !document.querySelector('[data-eva-project-id]')) {
        chip.click();
        setTimeout(fulfillPendingNavigation, 30);
        return;
      }
      var option = Array.from(document.querySelectorAll('[data-eva-project-id]')).find(function (item) {
        return item.textContent.indexOf(workspace.name) >= 0;
      });
      if (option) {
        option.click();
        return;
      }
    }

    var tab = state.pendingTab;
    state.pendingWorkspaceId = null;
    state.pendingTab = null;
    if (!tab) return;
    if (tab === 'files') {
      openDrive('workspace', workspace.id, 'workspace');
      return;
    }
    var labels = { projects: '项目', tasks: '任务', channels: '群聊', experts: '专家', squads: '专家团', skills: '技能', automation: '自动化' };
    var target = Array.from(frame.querySelectorAll('.collab-tab')).find(function (button) {
      return button.textContent.trim().replace(/\d+$/, '') === labels[tab];
    });
    if (target) target.click();
  }

  function resourcesForScope() {
    var list;
    if (state.driveScope === 'all') {
      list = resources.slice();
    } else if (state.driveScope === 'workspace') {
      list = resources.filter(function (resource) { return resource.workspaceIds.indexOf(state.workspaceId) >= 0; });
    } else if (state.driveScope === 'shared-all') {
      list = resources.filter(function (resource) { return resource.area === 'group' || resource.area === 'dm' || resource.area === 'workspace'; });
    } else {
      list = resources.filter(function (resource) { return resource.area === state.driveScope; });
    }
    var query = state.query.trim().toLowerCase();
    if (query) {
      list = list.filter(function (resource) {
        return resource.name.toLowerCase().indexOf(query) >= 0 || resource.owner.toLowerCase().indexOf(query) >= 0;
      });
    }
    return list;
  }

  function fileIconName(resource) {
    if (resource.kind === 'folder') return 'folder';
    if (resource.kind === 'sheet') return 'sheet';
    return 'file';
  }

  function fileMarkClass(resource) {
    if (resource.kind === 'folder') return 'is-folder';
    if (resource.kind === 'pdf') return 'is-pdf';
    if (resource.kind === 'sheet') return 'is-sheet';
    return '';
  }

  function scopeCopy() {
    if (state.driveScope === 'workspace') {
      return {
        title: workspaceById(state.workspaceId).name,
        subtitle: '仅属于当前项目，汇集消息文件与 Loop 任务产出',
        section: '团队文件'
      };
    }
    return { title: '文件库', subtitle: '汇集所有项目、项目外群聊与私聊中的文件', section: '全部文件' };
  }

  function ensureDriveRoot() {
    var root = document.getElementById('eva-drive-root');
    if (root) return root;
    root = document.createElement('section');
    root.id = 'eva-drive-root';
    root.className = 'eva-drive';
    root.setAttribute('aria-label', '文件库');
    root.hidden = true;
    document.body.appendChild(root);
    return root;
  }

  function inspectorHTML(resource) {
    if (!resource) {
      return '<div class="eva-drive__inspector-head"><h2>文件详情</h2></div><div class="eva-drive__empty">选择一个文件查看详情</div>';
    }
    var workspace = resource.workspaceIds.length ? workspaceById(resource.workspaceIds[0]) : null;
    var location = state.driveScope === 'workspace' ? workspaceById(state.workspaceId).name + ' / 团队文件' : scopeCopy().title + ' / ' + resource.name;
    var bridgeLabel = state.driveEntry === 'workspace' ? '在文件库中查看' : (workspace ? '在项目中打开' : '分享');
    var bridgeAction = workspace ? 'bridge' : 'share';
    return [
      '<div class="eva-drive__inspector-head"><h2>' + escapeHTML(resource.name) + '</h2><button class="eva-drive__text-button" type="button" data-drive-action="more" aria-label="更多操作">' + icon('more') + '</button></div>',
      '<div class="eva-drive__preview">' + icon(fileIconName(resource)) + '</div>',
      '<div class="eva-drive__inspector-actions">',
      '<button class="eva-drive__ghost-button" type="button" data-drive-action="share">' + icon('link') + '分享</button>',
      '<button class="eva-drive__text-button" type="button" data-drive-action="' + bridgeAction + '">' + icon('external') + escapeHTML(bridgeLabel) + '</button>',
      '</div>',
      '<dl class="eva-drive__meta">',
      '<div><dt>描述</dt><dd>' + escapeHTML(resource.description) + '</dd></div>',
      '<div><dt>所有者</dt><dd>' + escapeHTML(resource.owner) + '</dd></div>',
      '<div><dt>我的权限</dt><dd>' + escapeHTML(resource.permission) + '</dd></div>',
      '<div><dt>大小</dt><dd>' + escapeHTML(resource.size) + '</dd></div>',
      '<div><dt>位置</dt><dd>' + escapeHTML(location) + '</dd></div>',
      '</dl>'
    ].join('');
  }

  function resourceSourceLabel(resource) {
    if (resource.source) return resource.source;
    if (resource.area === 'workspace' && resource.workspaceIds.length) return '项目 · ' + workspaceById(resource.workspaceIds[0]).name;
    if (resource.area === 'group') return '项目外群聊';
    if (resource.area === 'dm') return '私聊 · ' + resource.owner;
    return '';
  }

  function tableHTML(list) {
    if (!list.length) {
      var emptyCopy = state.query.trim()
        ? '没有匹配的文件'
        : state.driveScope === 'workspace' ? '当前项目暂无文件' : '暂无文件';
      return '<div class="eva-drive__empty">' + emptyCopy + '</div>';
    }
    var showSource = state.driveEntry !== 'workspace';
    return [
      '<div class="eva-drive__table' + (showSource ? ' eva-drive__table--with-source' : '') + '" role="table" aria-label="文件列表">',
      '<div class="eva-drive__table-head" role="row"><span>名称</span>' + (showSource ? '<span>来源</span>' : '') + '<span>所有者</span><span>我的权限</span><span>修改时间</span><span></span></div>',
      list.map(function (resource) {
        return [
          '<button class="eva-drive__row" type="button" role="row" data-resource-id="' + resource.id + '" aria-selected="' + (resource.id === state.selectedId ? 'true' : 'false') + '">',
          '<span class="eva-drive__name-cell"><span class="eva-drive__file-mark ' + fileMarkClass(resource) + '">' + icon(fileIconName(resource)) + '</span><span class="eva-drive__name-copy"><strong>' + escapeHTML(resource.name) + '</strong><span>' + escapeHTML(resource.kind === 'folder' ? '文件夹' : resource.size) + '</span></span></span>',
          showSource ? '<span class="eva-drive__source-cell">' + icon(resource.area === 'workspace' ? 'workspace' : 'users', 'eva-drive__source-icon') + '<span>' + escapeHTML(resourceSourceLabel(resource)) + '</span></span>' : '',
          '<span>' + escapeHTML(resource.owner) + '</span>',
          '<span>' + escapeHTML(resource.permission) + '</span>',
          '<span>' + escapeHTML(resource.modified) + '</span>',
          icon('chevron'),
          '</button>'
        ].join('');
      }).join(''),
      '</div>'
    ].join('');
  }

  function treeButton(scope, label, iconName, child, workspaceId) {
    var current = state.driveScope === scope && (!workspaceId || state.workspaceId === workspaceId);
    return '<button type="button" class="' + (child ? 'is-child' : '') + '" data-drive-scope="' + scope + '"' + (workspaceId ? ' data-workspace-id="' + workspaceId + '"' : '') + ' aria-current="' + (current ? 'page' : 'false') + '">' + icon(iconName, 'eva-drive-icon ' + (iconName === 'folder' ? 'is-folder' : '')) + '<span>' + escapeHTML(label) + '</span></button>';
  }

  function driveHTML(list, selected) {
    var copy = scopeCopy();
    var workspace = workspaceById(state.workspaceId);
    var bridgeLabel = state.driveEntry === 'workspace' ? '在文件库中查看' : (state.driveScope === 'workspace' ? '在项目中打开' : '');
    return [
      '<aside class="eva-drive__side" aria-label="文件导航">',
      '<div class="eva-drive__side-head">' + icon('drive') + '<strong>' + escapeHTML(state.driveEntry === 'workspace' ? '团队文件' : '文件库') + '</strong></div>',
      '<label class="eva-drive__side-search">' + icon('search') + '<input type="search" data-drive-search="side" value="' + escapeHTML(state.query) + '" placeholder="搜索文件"></label>',
      '<nav class="eva-drive__tree">',
      '<div class="eva-drive__tree-group">全部来源</div>',
      treeButton('all', '所有文件', 'folder', false),
      '<div class="eva-drive__tree-group">项目文件</div>',
      WORKSPACES.map(function (item) { return treeButton('workspace', item.name, 'workspace', true, item.id); }).join(''),
      '</nav>',
      '</aside>',
      '<main class="eva-drive__main">',
      '<header class="eva-drive__header"><strong>' + escapeHTML(state.driveEntry === 'workspace' ? workspace.name + ' / 团队文件' : '文件库') + '</strong><span>' + escapeHTML(copy.subtitle) + '</span><span class="eva-drive__header-spacer"></span>',
      bridgeLabel ? '<button class="eva-drive__text-button" type="button" data-drive-action="bridge">' + icon('external') + escapeHTML(bridgeLabel) + '</button>' : '',
      '</header>',
      '<div class="eva-drive__scroll">',
      '<div class="eva-drive__eyebrow">' + escapeHTML(state.driveEntry === 'workspace' ? '当前项目' : '跨场景文件管理') + '</div>',
      '<div class="eva-drive__actions">',
      '<div class="eva-drive__action" role="button" tabindex="0" data-menu-target="new"><span class="eva-drive__action-icon">' + icon('plus') + '</span><span class="eva-drive__action-copy"><strong>新建</strong><span>新建文件夹</span></span>' + icon('arrow') + '<span class="eva-drive__action-menu" data-action-menu="new" hidden><button type="button" data-drive-action="new-folder">' + icon('folder') + '新建文件夹</button></span></div>',
      '<div class="eva-drive__action" role="button" tabindex="0" data-menu-target="upload"><span class="eva-drive__action-icon">' + icon('upload') + '</span><span class="eva-drive__action-copy"><strong>上传</strong><span>上传文件或文件夹到当前位置</span></span>' + icon('arrow') + '<span class="eva-drive__action-menu" data-action-menu="upload" hidden><button type="button" data-drive-action="upload-file">' + icon('file') + '上传文件</button><button type="button" data-drive-action="upload-folder">' + icon('folder') + '上传文件夹</button></span></div>',
      '<div class="eva-drive__action" role="button" tabindex="0" data-menu-target="add"><span class="eva-drive__action-icon">' + icon('link') + '</span><span class="eva-drive__action-copy"><strong>添加</strong><span>添加已有文件的快捷入口</span></span>' + icon('arrow') + '<span class="eva-drive__action-menu" data-action-menu="add" hidden><button type="button" data-drive-action="add-file-shortcut">' + icon('file') + '添加文件快捷入口</button><button type="button" data-drive-action="add-folder-shortcut">' + icon('folder') + '添加文件夹快捷入口</button></span></div>',
      '</div>',
      '<div class="eva-drive__section-head"><div><h1>' + escapeHTML(copy.section) + '</h1><p>' + escapeHTML(copy.subtitle) + '</p></div><label class="eva-drive__side-search">' + icon('search') + '<input type="search" data-drive-search="main" value="' + escapeHTML(state.query) + '" placeholder="搜索当前位置"></label></div>',
      tableHTML(list),
      '</div>',
      '<input id="eva-file-upload" type="file" multiple hidden>',
      '<input id="eva-folder-upload" type="file" webkitdirectory multiple hidden>',
      '</main>',
      '<aside class="eva-drive__inspector" aria-label="文件详情">' + inspectorHTML(selected) + '</aside>',
      '<div class="eva-drive__toast" role="status" aria-live="polite" hidden></div>'
    ].join('');
  }

  function renderDrive() {
    var root = ensureDriveRoot();
    var list = resourcesForScope();
    if (!state.selectedId || !list.some(function (resource) { return resource.id === state.selectedId; })) {
      state.selectedId = null;
    }
    var selected = resources.find(function (resource) { return resource.id === state.selectedId; }) || null;
    root.innerHTML = driveHTML(list, selected);
    root.dataset.evaDriveScope = state.driveScope;
    root.dataset.evaWorkspaceId = state.workspaceId;
    root.hidden = false;
    syncDriveLeft();
    document.querySelectorAll('.eva-layer-nav').forEach(function (button) { button.classList.remove('is-active'); });
    var driveNav = document.getElementById('eva-drive-nav');
    if (driveNav) driveNav.classList.add('is-active');
  }

  function openDrive(entry, workspaceId, scope) {
    if (entry === 'global') window.dispatchEvent(new CustomEvent('eva:sidebar-select', { detail: { id: 'drive', overlay: true } }));
    if (entry === 'workspace') state.mode = 'collaboration';
    state.driveEntry = entry || 'global';
    if (workspaceId) state.workspaceId = workspaceId;
    state.driveScope = scope || (entry === 'workspace' ? 'workspace' : state.driveScope || 'all');
    state.query = '';
    state.selectedId = null;
    renderDrive();
    syncShellGeometry();
  }

  function closeDrive() {
    var root = document.getElementById('eva-drive-root');
    if (root) root.hidden = true;
    var driveNav = document.getElementById('eva-drive-nav');
    if (driveNav) driveNav.classList.remove('is-active');
  }

  function syncDriveLeft() {
    var side = sidebar();
    var left = side ? Math.max(0, Math.round(side.getBoundingClientRect().right)) : 260;
    document.documentElement.style.setProperty('--eva-drive-left', left + 'px');
  }

  function showToast(message) {
    var toast = document.querySelector('.eva-drive__toast');
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(function () { toast.hidden = true; }, 1800);
  }

  function addResource(kind, name, description) {
    var item = {
      id: 'resource-' + Date.now().toString(36),
      name: name,
      kind: kind,
      owner: '王宜林',
      permission: '可管理',
      modified: '刚刚',
      size: kind === 'folder' ? '—' : '0 KB',
      workspaceIds: state.driveScope === 'workspace' ? [state.workspaceId] : [],
      area: state.driveScope === 'workspace' ? 'workspace' : 'owned',
      description: description
    };
    resources.unshift(item);
    state.selectedId = item.id;
    renderDrive();
  }

  function toggleActionMenu(target) {
    var root = document.getElementById('eva-drive-root');
    if (!root) return;
    root.querySelectorAll('[data-action-menu]').forEach(function (menu) {
      menu.hidden = menu.dataset.actionMenu !== target || !menu.hidden;
    });
  }

  function bridgeSelectedResource() {
    var selected = resources.find(function (resource) { return resource.id === state.selectedId; });
    if (selected && selected.workspaceIds.length) state.workspaceId = selected.workspaceIds[0];
    if (state.driveEntry === 'workspace') {
      state.driveEntry = 'global';
      state.driveScope = 'workspace';
      renderDrive();
    } else {
      state.driveEntry = 'workspace';
      state.driveScope = 'workspace';
      renderDrive();
      state.pendingWorkspaceId = state.workspaceId;
      state.pendingTab = null;
      if (location.hash !== '#/collab') location.hash = '#/collab';
    }
  }

  function handleDriveClick(event) {
    var row = event.target.closest('[data-resource-id]');
    if (row) {
      state.selectedId = row.dataset.resourceId;
      renderDrive();
      return;
    }

    var scopeButton = event.target.closest('[data-drive-scope]');
    if (scopeButton) {
      state.driveScope = scopeButton.dataset.driveScope;
      if (scopeButton.dataset.workspaceId) state.workspaceId = scopeButton.dataset.workspaceId;
      state.driveEntry = 'global';
      state.query = '';
      renderDrive();
      return;
    }

    var menuTarget = event.target.closest('[data-menu-target]');
    if (menuTarget && !event.target.closest('[data-drive-action]')) {
      toggleActionMenu(menuTarget.dataset.menuTarget);
      return;
    }

    var action = event.target.closest('[data-drive-action]');
    if (!action) return;
    event.preventDefault();
    event.stopPropagation();
    var name = action.dataset.driveAction;
    if (name === 'new-folder') addResource('folder', '新建文件夹', '当前目录中的新文件夹');
    if (name === 'upload-file') document.getElementById('eva-file-upload').click();
    if (name === 'upload-folder') document.getElementById('eva-folder-upload').click();
    if (name === 'add-file-shortcut') addResource('file', '文件快捷入口', '指向已有文件的快捷入口');
    if (name === 'add-folder-shortcut') addResource('folder', '文件夹快捷入口', '指向已有文件夹的快捷入口');
    if (name === 'share') showToast('分享入口已打开');
    if (name === 'more') showToast('更多文件操作');
    if (name === 'bridge') bridgeSelectedResource();
  }

  function handleDriveInput(event) {
    if (event.type === 'input' && event.target.matches('[data-drive-search]')) {
      state.query = event.target.value;
      renderDrive();
      var input = document.querySelector('[data-drive-search="' + event.target.dataset.driveSearch + '"]');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }
    if (event.type === 'change' && event.target.id === 'eva-file-upload' && event.target.files.length) {
      var file = event.target.files[0];
      addResource('file', file.name, '刚刚上传的文件');
      showToast('已添加 ' + file.name);
    }
    if (event.type === 'change' && event.target.id === 'eva-folder-upload' && event.target.files.length) {
      var folderName = event.target.files[0].webkitRelativePath.split('/')[0] || '上传的文件夹';
      addResource('folder', folderName, '刚刚上传的文件夹');
      showToast('已添加 ' + folderName);
    }
  }

  function handleCustomNavigation(event) {
    var trigger = event.target.closest('.eva-space-picker__trigger');
    if (trigger) {
      var menu = trigger.parentElement.querySelector('.eva-space-picker__menu');
      menu.hidden = !menu.hidden;
      trigger.setAttribute('aria-expanded', menu.hidden ? 'false' : 'true');
      return true;
    }

    var picker = event.target.closest('[data-eva-picker]');
    if (picker) {
      var value = picker.dataset.evaPicker;
      var pickerRoot = picker.closest('.eva-space-picker');
      pickerRoot.querySelector('.eva-space-picker__menu').hidden = true;
      pickerRoot.querySelector('.eva-space-picker__trigger').setAttribute('aria-expanded', 'false');
      if (value === 'personal') setMode('personal');
      else setMode('collaboration', value);
      return true;
    }

    var custom = event.target.closest('[data-eva-action]');
    if (!custom) return false;
    var action = custom.dataset.evaAction;
    if (action === 'drive') openDrive('global', null, driveScopeForMode('collaboration'));
    if (action === 'workspace-home') openWorkspace(state.workspaceId, null);
    if (action === 'workspace-tasks') openWorkspace(state.workspaceId, 'tasks');
    if (action === 'workspace-automation') openWorkspace(state.workspaceId, 'automation');
    if (action === 'workspace-skills') openWorkspace(state.workspaceId, 'skills');
    return true;
  }

  function enhanceSpaceCopy() {
    document.querySelectorAll('.collab-space-card .meta').forEach(function (meta) {
      meta.textContent = meta.textContent.replace(/(\d+)\s*人\s*·\s*(\d+)\s*分身/, '$1 位成员 · $2 个专家');
    });
    var title = document.querySelector('.collab-list-page .collab-hero h1');
    if (title) title.textContent = '项目';
    var slogan = document.querySelector('.collab-list-page .collab-hero .slogan');
    if (slogan) slogan.textContent = '把需要共同使用成员、助理、文件和任务的工作放在一起。';
    var section = document.querySelector('.collab-list-page .collab-section-head h2');
    if (section) section.textContent = '已加入';
    var input = document.querySelector('.collab-create-form input');
    if (input) input.placeholder = '例如：供应链运营协同';

    document.querySelectorAll('.collab-tab').forEach(function (button) {
      button.style.display = '';
    });
  }

  function scheduleEnhance() {
    if (frameQueued) return;
    frameQueued = true;
    requestAnimationFrame(function () {
      frameQueued = false;
      syncShellGeometry();
      enhanceSpaceCopy();
      fulfillPendingNavigation();
    });
  }

  function installEvents() {
    document.addEventListener('click', function (event) {
      if (handleCustomNavigation(event)) return;
      if (event.target.closest('#eva-drive-root')) return;

      var tab = event.target.closest('.collab-tab');
      if (tab) {
        closeDrive();
      }

      var side = sidebar();
      if (side && side.contains(event.target)) closeDrive();
    }, true);

    document.addEventListener('click', function (event) {
      if (event.target.closest('#eva-drive-root')) handleDriveClick(event);
    });
    document.addEventListener('input', function (event) {
      if (event.target.closest('#eva-drive-root')) handleDriveInput(event);
    });
    document.addEventListener('change', function (event) {
      if (event.target.closest('#eva-drive-root')) handleDriveInput(event);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        var menu = document.querySelector('.eva-space-picker__menu:not([hidden])');
        if (menu) menu.hidden = true;
      }
      var actionCard = event.target.closest('[data-menu-target]');
      if (actionCard && !event.target.closest('[data-drive-action]') && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        toggleActionMenu(actionCard.dataset.menuTarget);
      }
    });
    window.addEventListener('resize', syncDriveLeft);
  }

  function initialize() {
    installSprite();
    ensureDriveRoot();
    installEvents();
    window.__evaOpenDrive = openDrive;
    var observer = new MutationObserver(scheduleEnhance);
    observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
    scheduleEnhance();
    syncShellGeometry();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();

