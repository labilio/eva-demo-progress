
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

  var state = {
    mode: config.defaultMode || 'collaboration',
    workspaceId: config.defaultWorkspaceId || 'prod',
    sharedSpaceId: 'shared:brand',
    driveEntry: 'global',
    driveScope: 'personal',
    selectedId: null,
    query: '',
    parentId: 0,
    crumbs: [],
    dialog: null,
    previewId: null,
    menuId: null,
    menuAnchor: null,
    tableScroll: null,
    uploadTarget: null,
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
    return 'personal';
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
    if (/^#\/(collab|messages|contacts|drive)(?:[/?]|$)/.test(hash)) return 'collaboration';
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
    /* 项目快捷入口位于消息页中时，项目内容属于当前会话的右侧工作区。
       这里兜底旧监听器和遗留 React 回调，避免它们把消息路由改成 /collab。 */
    if (String(location.hash || '').indexOf('#/messages') === 0) {
      window.dispatchEvent(new CustomEvent('eva:open-inline-project', {
        detail: { projectId: id, tab: tab || 'tasks' }
      }));
      return;
    }
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
    var labels = { projects: '项目', tasks: '任务', channels: '群聊', files: '团队文件', experts: '专家', squads: '专家团', skills: '技能', automation: '自动化', settings: '设置' };
    var target = Array.from(frame.querySelectorAll('.collab-tab')).find(function (button) {
      return button.textContent.trim().replace(/\d+$/, '') === labels[tab];
    });
    if (target) target.click();
  }

  function fileContext() {
    return typeof window.__evaGetFileContext === 'function' ? window.__evaGetFileContext() : null;
  }

  function fileActor() {
    var context = fileContext();
    return context ? context.store.snapshot().actorId : 'u-wangyilin';
  }

  function personalSpaceId() {
    var context = fileContext();
    return context ? context.files.personalSpace(fileActor()) : 'personal:' + fileActor();
  }

  function workspaceName(id) {
    var workspace = WORKSPACES.find(function (item) { return item.id === id; });
    return workspace ? workspace.name : '项目';
  }

  function joinedSharedSpaces() {
    var context = fileContext();
    return context && context.files.sharedSpaces ? context.files.sharedSpaces(fileActor()) : [];
  }

  function sharedSpaceById(id) {
    return joinedSharedSpaces().find(function (space) { return space.id === id; }) || null;
  }

  function sharedSpaceName(id) {
    var space = sharedSpaceById(id);
    return space ? space.name : '共享空间';
  }

  function spaceName(id) {
    if (String(id || '').startsWith('personal:')) return '个人空间';
    if (String(id || '').startsWith('shared:')) return sharedSpaceName(id);
    return workspaceName(id);
  }

  function formatDriveBytes(value) {
    if (!value) return '—';
    var units = ['B', 'KB', 'MB', 'GB'];
    var size = Number(value), index = 0;
    while (size >= 1024 && index < units.length - 1) { size /= 1024; index += 1; }
    return (size >= 10 || index === 0 ? Math.round(size) : Math.round(size * 10) / 10) + ' ' + units[index];
  }

  function formatDriveTime(value) {
    if (!value) return '—';
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(date).replace('/', '-');
  }

  function scopeSpaceId() {
    if (state.driveScope === 'personal') return personalSpaceId();
    if (state.driveScope === 'shared-space') return state.sharedSpaceId;
    if (state.driveScope === 'workspace') return state.workspaceId;
    return null;
  }

  function resourcesForScope() {
    var context = fileContext();
    if (!context) return [];
    var actor = fileActor(), all = context.files.all(actor), list = [];
    if (state.driveScope === 'personal') list = context.files.list(personalSpaceId(), actor);
    if (state.driveScope === 'workspace') list = context.files.list(state.workspaceId, actor);
    if (state.driveScope === 'shared-space') list = context.files.list(state.sharedSpaceId, actor);
    if (state.driveScope === 'trash') {
      list = [];
      [personalSpaceId()].concat(joinedSharedSpaces().map(function (item) { return item.id; }), WORKSPACES.map(function (item) { return item.id; })).forEach(function (spaceId) {
        if (context.files.can('view-trash', spaceId, actor)) list = list.concat(context.files.trashList(spaceId, actor));
      });
    } else if (scopeSpaceId() && !state.query.trim()) {
      list = list.filter(function (resource) { return resource.parent_id === state.parentId; });
    }
    var query = state.query.trim().toLowerCase();
    if (query) list = list.filter(function (resource) {
      return [resource.name, resource.creator, resourceFileType(resource)].concat(resource.tags || [], relationsFor(resource).map(function (relation) { return relation.label; })).some(function (value) {
        return String(value || '').toLowerCase().includes(query);
      });
    });
    return list.sort(function (left, right) { return left.type === right.type ? String(right.deletedAt || right.createdAt).localeCompare(String(left.deletedAt || left.createdAt)) : left.type === 'folder' ? -1 : 1; });
  }

  function fileIconName(resource) {
    if (resource.type === 'folder') return 'folder';
    if (resource.type === 'shortcut') return 'file';
    if (['xlsx', 'xls', 'csv'].includes(resource.extension)) return 'sheet';
    return 'file';
  }

  function fileMarkClass(resource) {
    if (resource.type === 'folder') return 'is-folder';
    if (resource.type === 'shortcut') return 'is-shortcut';
    if (resource.extension === 'pdf') return 'is-pdf';
    if (['xlsx', 'xls', 'csv'].includes(resource.extension)) return 'is-sheet';
    return '';
  }

  function scopeCopy() {
    if (state.driveScope === 'personal') return { title: '个人空间', section: '个人文件', subtitle: '仅你可访问，可用于上传和整理个人资料' };
    if (state.driveScope === 'projects') return { title: '项目空间', section: '我的项目空间', subtitle: '选择一个已加入的项目后浏览和整理团队文件' };
    if (state.driveScope === 'workspace') return { title: workspaceName(state.workspaceId), section: '团队文件', subtitle: '权限继承项目角色，任务产出与群文件副本归属项目空间' };
    if (state.driveScope === 'shared') return { title: '共享空间', section: '我的共享空间', subtitle: '选择一个已加入的共享空间后浏览和整理文件' };
    if (state.driveScope === 'shared-space') return { title: sharedSpaceName(state.sharedSpaceId), section: sharedSpaceName(state.sharedSpaceId), subtitle: (sharedSpaceById(state.sharedSpaceId) || {}).description || '独立维护成员与角色的共享文件空间' };
    if (state.driveScope === 'trash') return { title: '回收站', section: '回收站', subtitle: '仅显示你有管理权限的空间中已删除的文件' };
    return { title: '个人空间', section: '个人文件', subtitle: '仅你可访问，可用于上传和整理个人资料' };
  }

  function ensureDriveRoot(host) {
    var root = document.getElementById('eva-drive-root');
    if (!root) {
      root = document.createElement('section');
      root.id = 'eva-drive-root';
      root.className = 'eva-drive';
      root.setAttribute('aria-label', '文件库');
    }
    if (host && root.parentElement !== host) host.appendChild(root);
    return root;
  }

  function inspectorHTML(resource) {
    if (!resource) {
      return '<div class="eva-drive__inspector-head"><h2>文件详情</h2></div><div class="eva-drive__empty">选择文件后，在这里查看来源和操作</div>';
    }
    var context = fileContext(), actor = fileActor();
    var canEdit = context.files.can('rename', resource.spaceId, actor);
    var canEditTags = resource.type !== 'folder' && context.files.can('edit-tags', resource.spaceId, actor);
    var canTrash = context.files.can('trash', resource.spaceId, actor);
    var canRestore = context.files.can('restore', resource.spaceId, actor);
    var canDeleteForever = context.files.can('delete-forever', resource.spaceId, actor);
    var isTrash = Boolean(resource.deletedAt);
    return [
      '<div class="eva-drive__inspector-head"><h2>文件详情</h2><button class="eva-drive__inspector-close" type="button" data-eva-drive-inspector-close="true" aria-label="关闭文件详情">×</button></div>',
      '<div class="eva-file-detail__identity' + (!isTrash ? ' eva-file-detail__identity--with-action' : '') + '"><span class="eva-drive__file-mark ' + fileMarkClass(resource) + '">' + icon(fileIconName(resource)) + '</span><span class="eva-file-detail__identity-content"><strong>' + escapeHTML(resource.name) + '</strong><small>' + escapeHTML(resourceFileType(resource) + (resource.type === 'folder' ? (isTrash && resource.trashedItemCount ? ' · 包含 ' + resource.trashedItemCount + ' 项' : '') : ' · ' + formatDriveBytes(resource.size))) + '</small></span>' + (!isTrash ? '<button class="eva-file-detail__copy-link" type="button" data-drive-action="copy-link" aria-label="复制内部链接" title="复制内部链接">' + icon('link') + '</button>' : '') + '</div>',
      resource.projectId && !isTrash ? '<div class="eva-drive__inspector-actions"><button class="eva-drive__text-button" type="button" data-drive-action="open-project">' + icon('external') + '在项目中打开</button></div>' : '',
      isTrash && (canRestore || canDeleteForever) ? '<div class="eva-drive__management-actions">' + (canRestore ? '<button type="button" data-drive-action="restore">恢复</button>' : '') + (canDeleteForever ? '<button class="is-danger" type="button" data-drive-action="delete-forever">永久删除</button>' : '') + '</div>' : '',
      canEdit && !isTrash ? '<div class="eva-drive__management-actions"><button type="button" data-drive-action="rename">重命名</button><button type="button" data-drive-action="move">移动</button>' + (resource.type !== 'shortcut' ? '<button type="button" data-drive-action="copy">创建副本</button>' : '') + (resource.type !== 'shortcut' && resource.type !== 'folder' ? '<button type="button" data-drive-action="create-shortcut">创建快捷方式</button>' : '') + (canTrash ? '<button class="is-danger" type="button" data-drive-action="trash">移至回收站</button>' : '') + '</div>' : '',
      resource.type !== 'folder' ? '<section class="eva-file-detail__section"><div class="eva-file-detail__section-head"><h3>标签</h3>' + (canEditTags && !isTrash ? '<button type="button" data-drive-action="tags">编辑</button>' : '') + '</div><div class="eva-file-detail__classification">' + (tagsHTML(resource) || '<span class="eva-file-muted">暂无标签</span>') + '</div></section>' : '',
      resource.type !== 'folder' ? '<section class="eva-file-detail__section"><div class="eva-file-detail__section-head"><h3>系统关联</h3><span class="eva-file-readonly">只读</span></div>' + relationDetailsHTML(resource) + '</section>' : '',
      resource.type === 'shortcut' ? shortcutDetailsHTML(resource) : '',
      '<section class="eva-file-detail__section"><div class="eva-file-detail__section-head"><h3>文件信息</h3></div><dl class="eva-drive__meta">',
      '<div><dt>文件类型</dt><dd>' + escapeHTML(resourceFileType(resource)) + '</dd></div>',
      '<div><dt>所在位置</dt><dd>' + escapeHTML(isTrash ? originalLocationLabel(resource) : resourceLocationLabel(resource)) + '</dd></div>',
      '<div><dt>产生方式</dt><dd>' + escapeHTML(resourceSourceLabel(resource)) + '</dd></div>',
      '<div><dt>创建者</dt><dd>' + escapeHTML(resource.creator || '—') + '</dd></div>',
      '<div><dt>创建时间</dt><dd>' + escapeHTML(formatDriveTime(resource.createdAt)) + '</dd></div>',
      '<div><dt>大小</dt><dd>' + escapeHTML(resource.type === 'folder' ? '—' : formatDriveBytes(resource.size)) + '</dd></div>',
      '</dl></section>'
    ].join('');
  }

  function resourceSourceLabel(resource) {
    var context = fileContext();
    if (context && context.files.sourceLabelFor) return context.files.sourceLabelFor(resource, fileActor());
    if (resource.source && resource.source.label) return resource.source.label;
    if (resource.area === 'project') return '项目 · ' + workspaceName(resource.projectId);
    if (resource.area === 'personal') return '个人空间';
    return '共享空间 · ' + sharedSpaceName(resource.spaceId);
  }

  function resourceFileType(resource) {
    var context = fileContext();
    return context && context.files.fileTypeFor ? context.files.fileTypeFor(resource, fileActor()) : resource.type === 'folder' ? '文件夹' : '其他';
  }

  function relationsFor(resource) {
    var context = fileContext();
    return context && context.files.relationsFor ? context.files.relationsFor(resource, fileActor()) : [];
  }

  function relationIconName(type) {
    return type === 'task' ? 'task' : type === 'group' || type === 'chat' ? 'users' : 'file';
  }

  function relationTypeLabel(type) {
    return type === 'task' ? '任务' : type === 'group' ? '群聊' : type === 'chat' ? '私聊' : '来源文件';
  }

  function tagsHTML(resource) {
    var tags = resource.tags || [];
    if (!tags.length) return resource.type === 'folder' ? '<span class="eva-file-muted">文件夹</span>' : '';
    return '<span class="eva-drive__name-tags">' + tags.slice(0, 2).map(function (tag) { return '<span class="eva-file-tag">' + escapeHTML(tag) + '</span>'; }).join('') + (tags.length > 2 ? '<span class="eva-file-tag is-more">+' + (tags.length - 2) + '</span>' : '') + '</span>';
  }

  function relationCellHTML(resource) {
    var relations = relationsFor(resource);
    if (!relations.length) return '<span class="eva-file-muted">—</span>';
    return '<span class="eva-relation-cell">' + relations.slice(0, 2).map(function (relation) {
      return '<span class="eva-relation-chip' + (relation.restricted ? ' is-restricted' : '') + '" title="' + escapeHTML(relation.meta || relation.label) + '">' + icon(relationIconName(relation.type)) + escapeHTML(relation.label) + '</span>';
    }).join('') + (relations.length > 2 ? '<span class="eva-relation-more">+' + (relations.length - 2) + '</span>' : '') + '</span>';
  }

  function relationDetailsHTML(resource) {
    var relations = relationsFor(resource);
    if (!relations.length) return '<p class="eva-file-detail__empty">当前文件没有系统关联</p>';
    return '<div class="eva-file-relations">' + relations.map(function (relation) {
      return '<div class="eva-file-relation"><span class="eva-file-relation__icon">' + icon(relationIconName(relation.type)) + '</span><span><small>' + relationTypeLabel(relation.type) + '</small><strong>' + escapeHTML(relation.label) + '</strong>' + (relation.meta ? '<em>' + escapeHTML(relation.meta) + '</em>' : '') + '</span></div>';
    }).join('') + '</div>';
  }

  function shortcutDetailsHTML(resource) {
    var info = fileContext().files.shortcutInfo(resource, fileActor());
    if (!info) return '';
    return '<section class="eva-file-detail__section"><div class="eva-file-detail__section-head"><h3>快捷方式信息</h3></div><dl class="eva-drive__meta"><div><dt>访问状态</dt><dd>' + escapeHTML(info.statusLabel) + '</dd></div>' + (info.status === 'available' ? '<div><dt>源文件</dt><dd>' + escapeHTML(info.sourceName) + '</dd></div><div><dt>来源空间</dt><dd>' + escapeHTML(info.sourceSpaceName) + '</dd></div>' : '<div><dt>权限说明</dt><dd>快捷方式不会授予源文件权限</dd></div>') + '</dl></section>';
  }

  function spaceRootLabel(resource) {
    if (resource.area === 'personal') return '个人空间';
    if (resource.area === 'project') return workspaceName(resource.projectId) + ' / 团队文件';
    return sharedSpaceName(resource.spaceId);
  }

  function resourceLocationLabel(resource) {
    var snapshot = fileContext().files.snapshot(fileActor()), names = [], current = resource;
    while (current && current.parent_id) {
      current = snapshot.find(function (item) { return item.id === current.parent_id; });
      if (current) names.unshift(current.name);
    }
    return [spaceRootLabel(resource)].concat(names).join(' / ');
  }

  function originalLocationLabel(resource) {
    var parent = fileContext().files.snapshot(fileActor()).find(function (item) { return item.id === resource.originalParentId; });
    return spaceRootLabel(resource) + (parent ? ' / ' + parent.name : ' / 根目录');
  }

  function rowMenuItemHTML(action, label, danger) {
    return '<button type="button" role="menuitem" data-drive-action="' + action + '"' + (danger ? ' class="is-danger"' : '') + '>' + escapeHTML(label) + '</button>';
  }

  function captureTableScroll() {
    var table = document.querySelector('#eva-drive-root .eva-drive__table');
    state.tableScroll = table ? { left: table.scrollLeft, top: table.scrollTop } : null;
  }

  function closeRowMenu(preserveScroll) {
    if (preserveScroll !== false) captureTableScroll();
    state.menuId = null;
    state.menuAnchor = null;
  }

  function rowMenuAnchor(trigger, itemCount) {
    var rect = trigger.getBoundingClientRect();
    var viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    var menuHeight = Math.min(itemCount * 34 + 10, Math.max(160, viewportHeight - 24));
    var roomBelow = viewportHeight - rect.bottom - 12;
    var opensUp = roomBelow < menuHeight && rect.top > roomBelow;
    return {
      left: Math.max(12, Math.round(rect.right - 168)),
      top: opensUp ? null : Math.round(rect.bottom + 4),
      bottom: opensUp ? Math.max(12, Math.round(viewportHeight - rect.top + 4)) : null,
      direction: opensUp ? 'up' : 'down'
    };
  }

  function rowActionsHTML(resource) {
    var context = fileContext(), actor = fileActor(), isTrash = state.driveScope === 'trash';
    var shortcutInfo = context.files.shortcutInfo(resource, actor), canOpen = !shortcutInfo || shortcutInfo.status === 'available';
    var open = state.menuId === String(resource.id), items = [];
    if (isTrash) {
      items.push(rowMenuItemHTML('select', '查看文件信息'));
      if (context.files.can('restore', resource.spaceId, actor)) items.push(rowMenuItemHTML('restore', '恢复'));
      if (context.files.can('delete-forever', resource.spaceId, actor)) items.push(rowMenuItemHTML('delete-forever', '永久删除', true));
    } else {
      if (resource.type === 'folder') items.push(rowMenuItemHTML('open-folder', '打开文件夹'));
      else if (canOpen) items.push(rowMenuItemHTML('preview', '预览'));
      items.push(rowMenuItemHTML('select', '查看文件信息'));
      items.push(rowMenuItemHTML('copy-link', '复制内部链接'));
      if (context.files.can('rename', resource.spaceId, actor)) items.push(rowMenuItemHTML('rename', '重命名'));
      if (context.files.can('move', resource.spaceId, actor)) items.push(rowMenuItemHTML('move', '移动'));
      if (resource.type !== 'shortcut' && context.files.can('copy', resource.spaceId, actor)) items.push(rowMenuItemHTML('copy', '创建副本'));
      if (resource.type !== 'folder' && resource.type !== 'shortcut' && context.files.can('create-shortcut', resource.spaceId, actor)) items.push(rowMenuItemHTML('create-shortcut', '创建快捷方式'));
      if (resource.type !== 'folder' && context.files.can('edit-tags', resource.spaceId, actor)) items.push(rowMenuItemHTML('tags', '编辑标签'));
      if (context.files.can('trash', resource.spaceId, actor)) items.push(rowMenuItemHTML('trash', '移至回收站', true));
    }
    var anchor = state.menuAnchor;
    var menuStyle = anchor ? 'left:' + anchor.left + 'px;' + (anchor.top == null ? 'bottom:' + anchor.bottom + 'px;' : 'top:' + anchor.top + 'px;') : '';
    return '<span class="eva-drive__row-actions"><button class="eva-drive__row-more" type="button" data-drive-action="row-menu" data-drive-menu-size="' + items.length + '" aria-label="更多操作：' + escapeHTML(resource.name) + '" aria-haspopup="menu" aria-expanded="' + open + '">' + icon('more') + '</button>' + (open ? '<span class="eva-drive__row-menu is-' + (anchor ? anchor.direction : 'down') + '" role="menu" aria-label="' + escapeHTML(resource.name) + '的操作" style="' + menuStyle + '">' + items.join('') + '</span>' : '') + '</span>';
  }

  function tableHTML(list) {
    if (!list.length) {
      var emptyCopy = state.query.trim()
        ? '没有匹配的文件'
        : state.driveScope === 'workspace' ? '当前项目暂无文件' : state.driveScope === 'shared-space' ? '当前共享空间暂无文件' : '暂无文件';
      return '<div class="eva-drive__empty">' + emptyCopy + '</div>';
    }
    return [
      '<div class="eva-drive__table eva-drive__table--with-source' + (state.driveScope === 'trash' ? ' eva-drive__table--trash' : '') + '" role="table" tabindex="0" aria-label="文件列表，可左右滚动">',
      '<div class="eva-drive__table-head" role="row"><span>名称</span><span>文件类型</span><span>' + (state.driveScope === 'trash' ? '原位置' : '关联内容') + '</span><span>大小</span><span>' + (state.driveScope === 'trash' ? '删除信息' : '创建信息') + '</span><span>操作</span></div>',
      list.map(function (resource) {
        return [
          '<div class="eva-drive__row" role="row" data-resource-id="' + resource.id + '" aria-selected="' + (resource.id === state.selectedId ? 'true' : 'false') + '">',
          '<button class="eva-drive__name-cell" type="button" data-drive-action="' + (resource.type === 'folder' && state.driveScope !== 'trash' ? 'open-folder' : state.driveScope === 'trash' ? 'select' : 'preview') + '"><span class="eva-drive__file-mark ' + fileMarkClass(resource) + '">' + icon(fileIconName(resource)) + '</span><span class="eva-drive__name-copy"><strong>' + escapeHTML(resource.name) + '</strong>' + tagsHTML(resource) + '</span></button>',
          '<span><span class="eva-file-type">' + escapeHTML(resourceFileType(resource)) + '</span></span>',
          state.driveScope === 'trash' ? '<span class="eva-file-location-cell">' + escapeHTML(originalLocationLabel(resource)) + '</span>' : relationCellHTML(resource),
          '<span>' + escapeHTML(resource.type === 'folder' ? '—' : formatDriveBytes(resource.size)) + '</span>',
          '<span class="eva-created-cell"><strong>' + escapeHTML(state.driveScope === 'trash' ? resource.deletedBy || '—' : resource.creator || '—') + '</strong><small>' + escapeHTML(formatDriveTime(state.driveScope === 'trash' ? resource.deletedAt : resource.createdAt)) + '</small></span>',
          rowActionsHTML(resource),
          '</div>'
        ].join('');
      }).join(''),
      '</div>'
    ].join('');
  }

  function treeButton(scope, label, iconName, child, spaceId) {
    var current = state.driveScope === scope && (!spaceId || (scope === 'shared-space' ? state.sharedSpaceId === spaceId : state.workspaceId === spaceId));
    var spaceAttribute = !spaceId ? '' : scope === 'shared-space' ? ' data-shared-space-id="' + escapeHTML(spaceId) + '"' : ' data-workspace-id="' + escapeHTML(spaceId) + '"';
    return '<button type="button" class="' + (child ? 'is-child' : '') + '" data-drive-scope="' + scope + '"' + spaceAttribute + ' aria-current="' + (current ? 'page' : 'false') + '">' + icon(iconName, 'eva-drive-icon ' + (iconName === 'folder' ? 'is-folder' : '')) + '<span>' + escapeHTML(label) + '</span></button>';
  }

  function targetOptionsHTML(selectedSpaceId) {
    var context = fileContext(), actor = fileActor();
    var personal = [{ id: personalSpaceId(), label: '个人空间' }];
    var shared = joinedSharedSpaces().map(function (space) {
      return { id: space.id, label: space.name };
    });
    var projects = [];
    WORKSPACES.forEach(function (workspace) {
      var role = context.files.role(workspace.id, actor);
      if (role) projects.push({ id: workspace.id, label: workspace.name });
    });
    function options(label, spaces) {
      return '<optgroup label="' + label + '">' + spaces.map(function (space) { return '<option value="' + escapeHTML(space.id) + '"' + (space.id === selectedSpaceId ? ' selected' : '') + '>' + escapeHTML(space.label) + '</option>'; }).join('') + '</optgroup>';
    }
    return options('个人空间', personal) + options('共享空间', shared) + options('项目空间', projects);
  }

  function shortcutTargetOptionsHTML(sourceSpaceId, selectedSpaceId) {
    return fileContext().files.writableSpaces(fileActor(), sourceSpaceId).map(function (space) {
      var prefix = space.kind === 'personal' ? '个人空间' : space.kind === 'shared' ? '共享空间' : '项目空间';
      return '<option value="' + escapeHTML(space.id) + '"' + (space.id === selectedSpaceId ? ' selected' : '') + '>' + escapeHTML(prefix + ' · ' + space.name) + '</option>';
    }).join('');
  }

  function shortcutFolderOptionsHTML(spaceId, selectedParentId) {
    if (!spaceId) return '<option value="0">根目录</option>';
    var folders = fileContext().files.list(spaceId, fileActor()).filter(function (item) { return item.type === 'folder'; });
    return '<option value="0">根目录</option>' + folders.map(function (folder) {
      return '<option value="' + escapeHTML(folder.id) + '"' + (folder.id === selectedParentId ? ' selected' : '') + '>' + escapeHTML(folder.name) + '</option>';
    }).join('');
  }

  function tagSuggestions(resource) {
    var selected = state.dialog && Array.isArray(state.dialog.tags) ? state.dialog.tags : [];
    var seen = {};
    return fileContext().files.list(resource.spaceId, fileActor()).reduce(function (tags, item) {
      (item.tags || []).forEach(function (tag) {
        if (!seen[tag] && !selected.includes(tag)) { seen[tag] = true; tags.push(tag); }
      });
      return tags;
    }, []);
  }

  function tagEditorHTML(resource) {
    var tags = Array.isArray(state.dialog.tags) ? state.dialog.tags : [];
    var query = String(state.dialog.tagInput || '').trim().toLowerCase();
    var suggestions = tagSuggestions(resource).filter(function (tag) { return !query || tag.toLowerCase().includes(query); });
    var selected = tags.length ? tags.map(function (tag) {
      return '<span class="eva-tag-editor__chip"><span>' + escapeHTML(tag) + '</span><button type="button" data-drive-action="tag-remove" data-drive-tag-value="' + escapeHTML(tag) + '" aria-label="移除标签 ' + escapeHTML(tag) + '">×</button></span>';
    }).join('') : '<span class="eva-tag-editor__empty">暂未选择标签</span>';
    var options = suggestions.length ? suggestions.map(function (tag) {
      return '<button class="eva-tag-editor__option" type="button" role="option" data-drive-action="tag-option" data-drive-tag-value="' + escapeHTML(tag) + '">' + escapeHTML(tag) + '</button>';
    }).join('') : '<span class="eva-tag-editor__empty">没有匹配标签，按回车新建</span>';
    var dropdown = state.dialog.tagDropdownOpen === false ? '' : '<div id="eva-drive-tag-options" class="eva-tag-editor__dropdown" role="listbox" aria-label="当前空间已有标签">' + options + '</div>';
    return '<div class="eva-tag-editor"><span class="eva-tag-editor__label">自定义标签</span><div class="eva-tag-editor__selected">' + selected + '</div><div class="eva-tag-editor__control"><input id="eva-drive-dialog-tags" data-drive-tag-input type="text" value="' + escapeHTML(state.dialog.tagInput || '') + '" maxlength="20" placeholder="输入或选择标签" role="combobox" aria-label="输入或选择标签" aria-expanded="' + (state.dialog.tagDropdownOpen === false ? 'false' : 'true') + '" aria-controls="eva-drive-tag-options" autocomplete="off"><button class="eva-tag-editor__toggle" type="button" data-drive-action="tag-dropdown-toggle" aria-label="' + (state.dialog.tagDropdownOpen === false ? '展开已有标签' : '收起已有标签') + '">' + icon('arrow') + '</button></div>' + dropdown + (state.dialog.tagError ? '<small class="eva-project-files__error">' + escapeHTML(state.dialog.tagError) + '</small>' : '') + '</div>';
  }

  function addDialogTag(value) {
    if (!state.dialog || state.dialog.type !== 'tags') return;
    var input = String(value == null ? state.dialog.tagInput || '' : value).trim().slice(0, 20);
    var tags = Array.isArray(state.dialog.tags) ? state.dialog.tags.slice() : [];
    var resource = fileContext().files.snapshot(fileActor()).find(function (item) { return item.id === state.dialog.id; });
    var existing = resource ? tagSuggestions(resource).find(function (tag) { return tag.toLowerCase() === input.toLowerCase(); }) : null;
    var tag = existing || input;
    if (!tag) { state.dialog.tagError = '请输入标签名称'; return; }
    if (tags.some(function (selected) { return selected.toLowerCase() === tag.toLowerCase(); })) { state.dialog.tagInput = ''; state.dialog.tagError = '该标签已选择'; return; }
    if (tags.length >= 8) { state.dialog.tagError = '每个文件最多添加 8 个标签'; return; }
    tags.push(tag);
    state.dialog.tags = tags;
    state.dialog.tagInput = '';
    state.dialog.tagError = '';
  }

  function dialogHTML() {
    if (!state.dialog) return '';
    var type = state.dialog.type, resource = state.dialog.id ? fileContext().files.snapshot(fileActor()).find(function (item) { return item.id === state.dialog.id; }) : null;
    var currentShared = sharedSpaceById(state.sharedSpaceId);
    var title = type === 'new-folder' ? '新建文件夹' : type === 'target-upload' ? '选择上传位置' : type === 'new-shared-space' ? '新建共享空间' : type === 'shared-manage' ? '管理共享空间' : type === 'shared-members' ? '成员与角色' : type === 'shared-settings' ? '空间设置' : type === 'shared-audit' ? '空间审计' : type === 'transfer-shared' ? '转移空间所有权' : type === 'create-shortcut' ? '创建快捷方式' : type === 'tags' ? '编辑标签' : type === 'rename' ? '重命名' : type === 'move' ? '移动到' : type === 'trash' ? '移至回收站' : '永久删除';
    var content = '';
    if (type === 'new-folder') content = '<label class="eva-drive-dialog__field"><span>文件夹名称</span><input id="eva-drive-dialog-name" value="" placeholder="请输入文件夹名称" autofocus></label><label class="eva-drive-dialog__field"><span>所属空间</span><select id="eva-drive-dialog-space">' + targetOptionsHTML(state.dialog.spaceId || scopeSpaceId() || personalSpaceId()) + '</select></label>';
    if (type === 'target-upload') content = '<label class="eva-drive-dialog__field"><span>上传到</span><select id="eva-drive-dialog-space">' + targetOptionsHTML(state.dialog.spaceId || personalSpaceId()) + '</select></label><p class="eva-drive-dialog__hint">上传后文件继承目标空间的角色权限。</p>';
    if (type === 'new-shared-space') content = '<label class="eva-drive-dialog__field"><span>空间名称</span><input id="eva-drive-dialog-name" placeholder="例如：销售资料共享" autofocus></label><label class="eva-drive-dialog__field"><span>空间说明</span><textarea id="eva-drive-dialog-description" rows="3" placeholder="说明该空间存放什么资料、供谁协作"></textarea></label><p class="eva-drive-dialog__hint">创建后你将成为该共享空间的 Owner。</p>';
    if (type === 'shared-manage' && currentShared) {
      var files = fileContext().files, actor = fileActor();
      content = '<div class="eva-drive-governance">' +
        (files.can('manage-members', currentShared.id, actor) ? '<button type="button" data-drive-action="shared-members"><span>' + icon('users') + '<strong>成员与角色</strong></span><small>管理普通成员；Owner 可设置 Manager</small>' + icon('chevron') + '</button>' : '') +
        (files.can('manage-links', currentShared.id, actor) ? '<button type="button" data-drive-action="shared-link"><span>' + icon('link') + '<strong>复制空间链接</strong></span><small>链接只定位空间，不会授予访问权限</small></button>' : '') +
        (files.can('manage-settings', currentShared.id, actor) ? '<button type="button" data-drive-action="shared-settings"><span>' + icon('more') + '<strong>空间设置</strong></span><small>修改空间名称与说明</small>' + icon('chevron') + '</button>' : '') +
        (files.can('view-audit', currentShared.id, actor) ? '<button type="button" data-drive-action="shared-audit"><span>' + icon('task') + '<strong>查看审计</strong></span><small>查看空间内关键操作记录</small>' + icon('chevron') + '</button>' : '') +
        (files.can('transfer-ownership', currentShared.id, actor) && currentShared.members.length > 1 ? '<button class="is-danger" type="button" data-drive-action="transfer-shared"><span>' + icon('external') + '<strong>转移空间所有权</strong></span><small>仅当前 Owner 可以执行</small>' + icon('chevron') + '</button>' : '') +
        '</div>';
    }
    if (type === 'shared-settings' && currentShared) content = '<label class="eva-drive-dialog__field"><span>空间名称</span><input id="eva-drive-dialog-name" value="' + escapeHTML(currentShared.name) + '" autofocus></label><label class="eva-drive-dialog__field"><span>空间说明</span><textarea id="eva-drive-dialog-description" rows="3">' + escapeHTML(currentShared.description) + '</textarea></label><p class="eva-drive-dialog__hint">只有 Owner 与 Manager 可以修改空间设置。</p>';
    if (type === 'shared-members' && currentShared) {
      var memberFiles = fileContext().files, memberActor = fileActor(), canSetManager = memberFiles.can('set-manager', currentShared.id, memberActor), availableMembers = memberFiles.sharedMemberCandidates(currentShared.id, memberActor);
      var addMember = availableMembers.length ? '<div class="eva-drive-member-add"><select id="eva-drive-dialog-add-member">' + availableMembers.map(function (member) { return '<option value="' + escapeHTML(member.id) + '">' + escapeHTML(member.name) + '</option>'; }).join('') + '</select><button type="button" data-drive-action="add-shared-member">添加为 Editor</button></div>' : '<p class="eva-drive-member-add__empty">所有可选成员均已加入</p>';
      content = '<p class="eva-drive-dialog__intro">成员在此空间内统一使用 Owner、Manager、Editor 三种角色。</p>' + addMember + '<div class="eva-drive-member-list">' + memberFiles.sharedMembers(currentShared.id, memberActor).map(function (member) {
        var roleLabel = member.role === 'owner' ? 'Owner' : member.role === 'manager' ? 'Manager' : 'Editor';
        var roleControl = member.role === 'owner' || !canSetManager ? '<span class="eva-drive-member-list__role">' + roleLabel + '</span>' : '<select data-drive-member-role="' + escapeHTML(member.id) + '"><option value="editor"' + (member.role === 'editor' ? ' selected' : '') + '>Editor</option><option value="manager"' + (member.role === 'manager' ? ' selected' : '') + '>Manager</option></select>';
        var canRemove = member.id !== currentShared.ownerId && member.id !== memberActor && (member.role === 'editor' || canSetManager);
        var control = '<span class="eva-drive-member-list__controls">' + roleControl + (canRemove ? '<button type="button" data-drive-action="remove-shared-member" data-drive-member-remove="' + escapeHTML(member.id) + '">移除</button>' : '') + '</span>';
        return '<div class="eva-drive-member-list__row"><span class="eva-drive-member-list__avatar">' + escapeHTML((member.name || member.id).slice(0, 1)) + '</span><span><strong>' + escapeHTML(member.name || member.id) + '</strong><small>' + (member.id === memberActor ? '你' : '空间成员') + '</small></span>' + control + '</div>';
      }).join('') + '</div><p class="eva-drive-dialog__hint">Manager 可管理普通成员；只有 Owner 可以设置 Manager。</p>';
    }
    if (type === 'shared-audit' && currentShared) content = '<div class="eva-drive-audit"><div><strong>王宜林上传了文件</strong><span>秋季发布会素材清单.xlsx · 今天 09:15</span></div><div><strong>何静更新了文件</strong><span>品牌使用说明.pdf · 昨天 18:05</span></div><div><strong>空间角色已校验</strong><span>当前成员权限无异常 · 09-05 16:20</span></div></div>';
    if (type === 'transfer-shared' && currentShared) {
      var candidates = fileContext().files.sharedMembers(currentShared.id, fileActor()).filter(function (member) { return member.id !== currentShared.ownerId; });
      content = '<label class="eva-drive-dialog__field"><span>新 Owner</span><select id="eva-drive-dialog-member">' + candidates.map(function (member) { return '<option value="' + escapeHTML(member.id) + '">' + escapeHTML(member.name + ' · ' + (member.role === 'manager' ? 'Manager' : 'Editor')) + '</option>'; }).join('') + '</select></label><p class="eva-drive-dialog__hint">转移后，你将变为 Manager。只有当前 Owner 可以执行此操作。</p>';
    }
    if (type === 'rename') content = '<label class="eva-drive-dialog__field"><span>新名称</span><input id="eva-drive-dialog-name" value="' + escapeHTML(resource ? resource.name : '') + '" autofocus></label>';
    if (type === 'tags' && resource) content = tagEditorHTML(resource) + '<p class="eva-drive-dialog__hint">从下拉框选择已有标签，或直接输入后按回车新建。最多 8 个标签。</p>';
    if (type === 'create-shortcut' && resource) {
      var shortcutSpaces = fileContext().files.writableSpaces(fileActor(), resource.spaceId);
      content = shortcutSpaces.length ? '<div class="eva-shortcut-source"><span>源文件</span><strong>' + escapeHTML(resource.name) + '</strong><small>' + escapeHTML(spaceRootLabel(resource)) + '</small></div><label class="eva-drive-dialog__field"><span>目标空间</span><select id="eva-drive-dialog-shortcut-space">' + shortcutTargetOptionsHTML(resource.spaceId, state.dialog.targetSpaceId) + '</select></label><label class="eva-drive-dialog__field"><span>目标文件夹</span><select id="eva-drive-dialog-shortcut-parent">' + shortcutFolderOptionsHTML(state.dialog.targetSpaceId, state.dialog.targetParentId || 0) + '</select></label><p class="eva-drive-dialog__hint">快捷方式不复制文件，也不会向目标空间成员授予源文件权限。</p>' : '<p>没有其他可写入的空间，暂时无法创建跨空间快捷方式。</p>';
    }
    if (type === 'move') {
      var folders = fileContext().files.list(resource.spaceId, fileActor()).filter(function (item) { return item.type === 'folder' && item.id !== resource.id; });
      content = '<label class="eva-drive-dialog__field"><span>目标文件夹</span><select id="eva-drive-dialog-parent"><option value="0">根目录</option>' + folders.map(function (item) { return '<option value="' + escapeHTML(item.id) + '">' + escapeHTML(item.name) + '</option>'; }).join('') + '</select></label><p class="eva-drive-dialog__hint">仅允许在当前空间内移动。</p>';
    }
    if (type === 'trash') content = '<p>将“' + escapeHTML(resource.name) + '”' + (resource.type === 'folder' ? '及其中内容' : '') + '移至回收站？Owner 或 Manager 可恢复。</p>';
    if (type === 'delete-forever') content = '<p>永久删除“' + escapeHTML(resource.name) + '”' + (resource.type === 'folder' ? '及其中内容' : '') + '后不可恢复。</p>';
    var confirmLabel = type === 'target-upload' ? '选择文件' : type === 'new-shared-space' ? '创建空间' : type === 'shared-settings' ? '保存设置' : type === 'transfer-shared' ? '确认转移' : type === 'create-shortcut' ? '创建快捷方式' : type === 'tags' ? '保存' : type === 'trash' ? '移至回收站' : type === 'delete-forever' ? '永久删除' : '确认';
    var noShortcutTarget = type === 'create-shortcut' && !fileContext().files.writableSpaces(fileActor(), resource.spaceId).length;
    var confirm = type === 'shared-manage' || type === 'shared-members' || type === 'shared-audit' || noShortcutTarget ? '' : '<button class="' + (type === 'delete-forever' || type === 'trash' || type === 'transfer-shared' ? 'is-danger' : 'is-primary') + '" type="button" data-drive-action="dialog-confirm">' + confirmLabel + '</button>';
    return '<div class="eva-drive-dialog" role="dialog" aria-modal="true" aria-labelledby="eva-drive-dialog-title"><button class="eva-drive-dialog__mask" type="button" data-drive-action="dialog-close" aria-label="关闭"></button><section class="eva-drive-dialog__panel"><header><h2 id="eva-drive-dialog-title">' + title + '</h2><button type="button" data-drive-action="dialog-close" aria-label="关闭">×</button></header><div class="eva-drive-dialog__body">' + content + '</div><footer><button type="button" data-drive-action="dialog-close">' + (confirm ? '取消' : '关闭') + '</button>' + confirm + '</footer></section></div>';
  }

  function previewHTML() {
    if (!state.previewId) return '';
    var context = fileContext(), actor = fileActor();
    var resource = context.files.snapshot(actor).find(function (item) { return item.id === state.previewId; });
    if (!resource) return '';
    var target;
    try { target = context.files.resolveFile(resource, actor); } catch (error) { return ''; }
    var sampleURL = window.__EVA_FILE_SAMPLE_URLS && window.__EVA_FILE_SAMPLE_URLS[target.name];
    var extension = String(target.extension || target.name.split('.').pop() || '').toLowerCase();
    var content = sampleURL && extension === 'pdf'
      ? '<iframe class="eva-drive-preview-dialog__frame" src="' + escapeHTML(sampleURL) + '" title="' + escapeHTML(target.name + '预览') + '"></iframe>'
      : sampleURL && ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension)
        ? '<img class="eva-drive-preview-dialog__image" src="' + escapeHTML(sampleURL) + '" alt="' + escapeHTML(target.name) + '">'
        : '<div class="eva-drive-preview-dialog__empty"><span class="eva-drive__file-mark ' + fileMarkClass(target) + '">' + icon(fileIconName(target)) + '</span><strong>' + escapeHTML(target.name) + '</strong><span>' + escapeHTML(context.files.fileTypeFor(target, actor) + ' · ' + formatDriveBytes(target.size)) + '</span><p>此演示文件暂无可展示的示例内容。</p></div>';
    return '<div class="eva-drive-dialog eva-drive-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="eva-drive-preview-title"><button class="eva-drive-dialog__mask" type="button" data-drive-action="preview-close" aria-label="关闭预览"></button><section class="eva-drive-dialog__panel eva-drive-preview-dialog__panel"><header><h2 id="eva-drive-preview-title">' + escapeHTML(resource.name) + '</h2><button type="button" data-drive-action="preview-close" aria-label="关闭预览">×</button></header><div class="eva-drive-dialog__body">' + content + '</div></section></div>';
  }

  function projectSpacesHTML() {
    var context = fileContext(), actor = fileActor(), all = context.files.all(actor);
    var projects = WORKSPACES.map(function (workspace) {
      var role = context.files.role(workspace.id, actor);
      if (!role) return null;
      var records = all.filter(function (resource) { return resource.projectId === workspace.id; });
      return { workspace: workspace, role: role, fileCount: records.filter(function (resource) { return resource.type !== 'folder'; }).length, folderCount: records.filter(function (resource) { return resource.type === 'folder'; }).length };
    }).filter(Boolean);
    if (!projects.length) return '<div class="eva-drive__empty">你还没有加入任何项目空间</div>';
    return '<div class="eva-drive-projects">' + projects.map(function (item) {
      var roleLabel = item.role === 'owner' ? 'Owner' : item.role === 'manager' ? 'Manager' : 'Editor';
      return '<button type="button" class="eva-drive-project-card" data-drive-scope="workspace" data-workspace-id="' + escapeHTML(item.workspace.id) + '"><span class="eva-drive-project-card__mark">' + escapeHTML(item.workspace.mark || item.workspace.name.slice(0, 1)) + '</span><span class="eva-drive-project-card__copy"><strong>' + escapeHTML(item.workspace.name) + '</strong><small>' + escapeHTML(item.workspace.description || '项目团队文件') + '</small><span>' + item.folderCount + ' 个文件夹 · ' + item.fileCount + ' 个文件</span></span><span class="eva-drive-project-card__role">' + roleLabel + '</span>' + icon('chevron') + '</button>';
    }).join('') + '</div>';
  }

  function sharedSpacesHTML() {
    var context = fileContext(), actor = fileActor(), all = context.files.all(actor), query = state.query.trim().toLowerCase();
    var spaces = joinedSharedSpaces().filter(function (space) { return !query || space.name.toLowerCase().includes(query) || String(space.description || '').toLowerCase().includes(query); }).map(function (space) {
      var role = context.files.role(space.id, actor);
      var records = all.filter(function (resource) { return resource.spaceId === space.id; });
      return { space: space, role: role, fileCount: records.filter(function (resource) { return resource.type !== 'folder'; }).length, folderCount: records.filter(function (resource) { return resource.type === 'folder'; }).length };
    });
    if (!spaces.length) return '<div class="eva-drive__empty">' + (query ? '没有匹配的共享空间' : '你还没有加入任何共享空间') + '</div>';
    return '<div class="eva-drive-projects eva-drive-projects--shared">' + spaces.map(function (item) {
      var roleLabel = item.role === 'owner' ? 'Owner' : item.role === 'manager' ? 'Manager' : 'Editor';
      return '<button type="button" class="eva-drive-project-card eva-drive-project-card--shared" data-drive-scope="shared-space" data-shared-space-id="' + escapeHTML(item.space.id) + '"><span class="eva-drive-project-card__mark">' + escapeHTML(item.space.mark || item.space.name.slice(0, 1)) + '</span><span class="eva-drive-project-card__copy"><strong>' + escapeHTML(item.space.name) + '</strong><small>' + escapeHTML(item.space.description || '团队共享文件空间') + '</small><span>' + item.space.members.length + ' 位成员 · ' + item.folderCount + ' 个文件夹 · ' + item.fileCount + ' 个文件</span></span><span class="eva-drive-project-card__role">' + roleLabel + '</span>' + icon('chevron') + '</button>';
    }).join('') + '</div>';
  }

  function driveHTML(list, selected) {
    var copy = scopeCopy();
    var context = fileContext(), actor = fileActor(), currentSpace = scopeSpaceId();
    var role = currentSpace ? context.files.role(currentSpace, actor) : null;
    var roleLabel = role === 'owner' ? 'Owner' : role === 'manager' ? 'Manager' : role === 'editor' ? 'Editor' : '';
    var crumbs = currentSpace && state.crumbs.length ? [{ id: 0, name: copy.section }].concat(state.crumbs) : [];
    return [
      '<aside class="eva-drive__side" aria-label="文件导航">',
      '<div class="eva-drive__side-head">' + icon('drive') + '<strong>文件库</strong></div>',
      '<label class="eva-drive__side-search">' + icon('search') + '<input type="search" data-drive-search="side" value="' + escapeHTML(state.query) + '" placeholder="搜索当前范围"></label>',
      '<nav class="eva-drive__tree">',
      '<div class="eva-drive__tree-group">文件空间</div>',
      treeButton('personal', '个人空间', 'file', false),
      treeButton('shared', '共享空间', 'users', false),
      joinedSharedSpaces().map(function (item) { return treeButton('shared-space', item.name, 'users', true, item.id); }).join(''),
      treeButton('projects', '项目空间', 'workspace', false),
      WORKSPACES.map(function (item) { return treeButton('workspace', item.name, 'workspace', true, item.id); }).join(''),
      '<div class="eva-drive__tree-spacer"></div>',
      '<div class="eva-drive__tree-group">管理</div>',
      treeButton('trash', '回收站', 'folder', false),
      '</nav>',
      '</aside>',
      '<main class="eva-drive__main">',
      '<header class="eva-drive__header"><div><strong>' + escapeHTML(copy.title) + '</strong><span>' + escapeHTML(copy.subtitle) + '</span></div><span class="eva-drive__header-spacer"></span>',
      roleLabel ? '<span class="eva-drive__role">' + roleLabel + '</span>' : '',
      state.driveScope === 'shared-space' && context.files.can('manage-settings', currentSpace, actor) ? '<button class="eva-drive__text-button" type="button" data-drive-action="shared-manage">' + icon('users') + '管理空间</button>' : '',
      state.driveScope === 'workspace' ? '<button class="eva-drive__text-button" type="button" data-drive-action="open-project">' + icon('external') + '进入项目</button>' : '',
      '</header>',
      '<div class="eva-drive__scroll">',
      state.driveScope === 'shared' ? '<div class="eva-drive__actions"><button class="eva-drive__action eva-drive__action--primary" type="button" data-drive-action="new-shared-space">' + icon('plus') + '<span>新建共享空间</span></button></div>' : '',
      currentSpace && state.driveScope !== 'trash' ? '<div class="eva-drive__actions"><button class="eva-drive__action" type="button" data-drive-action="new-folder">' + icon('plus') + '<span>新建文件夹</span></button><button class="eva-drive__action eva-drive__action--primary" type="button" data-drive-action="upload-file">' + icon('upload') + '<span>上传本地文件</span></button></div>' : '',
      crumbs.length ? '<div class="eva-drive__pathbar"><button class="eva-drive__back-button" type="button" data-drive-action="up-folder">' + icon('chevron') + '<span>返回上一级</span></button><nav class="eva-drive__breadcrumbs" aria-label="文件路径">' + crumbs.map(function (crumb, index) { return '<button type="button" data-drive-action="breadcrumb" data-breadcrumb-index="' + index + '"' + (index === crumbs.length - 1 ? ' aria-current="page"' : '') + '>' + escapeHTML(crumb.name) + '</button>'; }).join('<span>/</span>') + '</nav></div>' : '',
      '</div>',
      '<div class="eva-drive__section-head"><div><h1>' + escapeHTML(copy.section) + '</h1><p>' + escapeHTML(copy.subtitle) + '</p></div><label class="eva-drive__side-search">' + icon('search') + '<input type="search" data-drive-search="main" value="' + escapeHTML(state.query) + '" placeholder="搜索当前位置"></label></div>',
      state.driveScope === 'projects' ? projectSpacesHTML() : state.driveScope === 'shared' ? sharedSpacesHTML() : tableHTML(list),
      '</div>',
      '<input id="eva-file-upload" type="file" multiple hidden>',
      '</main>',
      '<aside class="eva-drive__inspector" aria-label="文件详情">' + inspectorHTML(selected) + '</aside>',
      '<div class="eva-drive__toast" role="status" aria-live="polite" hidden></div>',
      dialogHTML(),
      previewHTML()
    ].join('');
  }

  function renderDrive() {
    var root = ensureDriveRoot();
    var list = resourcesForScope();
    if (!state.selectedId || !list.some(function (resource) { return resource.id === state.selectedId; })) {
      state.selectedId = null;
    }
    var context = fileContext();
    var selected = context ? context.files.snapshot(fileActor()).find(function (resource) { return resource.id === state.selectedId; }) || null : null;
    root.innerHTML = driveHTML(list, selected);
    var table = root.querySelector('.eva-drive__table');
    if (table && state.tableScroll) {
      table.scrollLeft = state.tableScroll.left;
      table.scrollTop = state.tableScroll.top;
    }
    state.tableScroll = null;
    root.dataset.evaDriveScope = state.driveScope;
    root.dataset.evaWorkspaceId = state.workspaceId;
    root.dataset.evaSharedSpaceId = state.sharedSpaceId;
    root.classList.toggle('eva-drive--inspector-open', Boolean(selected));
    root.hidden = false;
    syncDriveLeft();
  }

  function openDrive(entry, workspaceId, scope) {
    if (entry === 'workspace') state.mode = 'collaboration';
    state.driveEntry = entry || 'global';
    if (workspaceId) state.workspaceId = workspaceId;
    state.driveScope = scope || (entry === 'workspace' ? 'workspace' : state.driveScope || 'personal');
    state.query = '';
    state.selectedId = null;
    state.parentId = 0;
    state.crumbs = [];
    state.dialog = null;
    state.previewId = null;
    closeRowMenu(false);
    if (String(location.hash || '').indexOf('#/drive') !== 0) location.hash = '#/drive';
    else {
      renderDrive();
      syncShellGeometry();
    }
  }

  function closeDrive() {
    var root = document.getElementById('eva-drive-root');
    state.previewId = null;
    if (root) root.hidden = true;
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

  function selectedResource() {
    var context = fileContext();
    return context ? context.files.snapshot(fileActor()).find(function (resource) { return resource.id === state.selectedId; }) || null : null;
  }

  function openDialog(type, resource, spaceId) {
    state.dialog = { type: type, id: resource ? resource.id : null, spaceId: spaceId || null };
    if (type === 'tags' && resource) {
      state.dialog.tags = (resource.tags || []).slice();
      state.dialog.tagInput = '';
      state.dialog.tagDropdownOpen = true;
    }
    if (type === 'create-shortcut' && resource) {
      var target = fileContext().files.writableSpaces(fileActor(), resource.spaceId)[0];
      state.dialog.targetSpaceId = target ? target.id : null;
      state.dialog.targetParentId = 0;
    }
    renderDrive();
  }

  function closeDialog() {
    state.dialog = null;
    renderDrive();
  }

  function confirmDialog() {
    if (!state.dialog) return;
    var dialog = state.dialog, context = fileContext(), actor = fileActor();
    var resource = dialog.id ? context.files.snapshot(actor).find(function (item) { return item.id === dialog.id; }) : null;
    var nameInput = document.getElementById('eva-drive-dialog-name');
    var descriptionInput = document.getElementById('eva-drive-dialog-description');
    var spaceInput = document.getElementById('eva-drive-dialog-space');
    var parentInput = document.getElementById('eva-drive-dialog-parent');
    var memberInput = document.getElementById('eva-drive-dialog-member');
    var shortcutSpaceInput = document.getElementById('eva-drive-dialog-shortcut-space');
    var shortcutParentInput = document.getElementById('eva-drive-dialog-shortcut-parent');
    try {
      state.dialog = null;
      if (dialog.type === 'new-folder') {
        var targetSpace = spaceInput ? spaceInput.value : dialog.spaceId || scopeSpaceId();
        state.selectedId = context.files.createFolder(actor, targetSpace, nameInput ? nameInput.value : '', targetSpace === scopeSpaceId() ? state.parentId : 0);
      }
      if (dialog.type === 'target-upload') {
        state.uploadTarget = spaceInput.value;
        renderDrive();
        setTimeout(function () { var input = document.getElementById('eva-file-upload'); if (input) input.click(); }, 0);
        return;
      }
      if (dialog.type === 'new-shared-space') {
        state.sharedSpaceId = context.files.createSharedSpace(actor, { name: nameInput ? nameInput.value : '', description: descriptionInput ? descriptionInput.value : '' });
        state.driveScope = 'shared-space';
        state.parentId = 0;
        state.crumbs = [];
      }
      if (dialog.type === 'shared-settings') context.files.updateSharedSpace(actor, state.sharedSpaceId, { name: nameInput.value, description: descriptionInput.value });
      if (dialog.type === 'transfer-shared') context.files.transferSharedOwnership(actor, state.sharedSpaceId, memberInput.value);
      if (dialog.type === 'tags') {
        var nextTags = Array.isArray(dialog.tags) ? dialog.tags.slice() : [];
        var pendingTag = String(dialog.tagInput || '').trim().slice(0, 20);
        var matchedTag = pendingTag && tagSuggestions(resource).find(function (tag) { return tag.toLowerCase() === pendingTag.toLowerCase(); });
        pendingTag = matchedTag || pendingTag;
        if (pendingTag && !nextTags.some(function (tag) { return tag.toLowerCase() === pendingTag.toLowerCase(); }) && nextTags.length < 8) nextTags.push(pendingTag);
        context.files.updateTags(actor, resource.id, nextTags);
      }
      if (dialog.type === 'create-shortcut') context.files.createShortcut(actor, resource.id, shortcutSpaceInput.value, shortcutParentInput.value === '0' ? 0 : shortcutParentInput.value);
      if (dialog.type === 'rename') context.files.rename(actor, resource.id, nameInput.value);
      if (dialog.type === 'move') context.files.move(actor, resource.id, parentInput.value === '0' ? 0 : parentInput.value);
      if (dialog.type === 'trash') { context.files.trash(actor, resource.id); state.selectedId = null; }
      if (dialog.type === 'delete-forever') { context.files.removeForever(actor, resource.id); state.selectedId = null; }
      renderDrive();
      if (dialog.type === 'create-shortcut') showToast('快捷方式已创建，源文件权限保持不变');
    } catch (error) {
      state.dialog = dialog;
      renderDrive();
      showToast(error.message || '操作失败');
    }
  }

  function bridgeSelectedResource() {
    var selected = selectedResource();
    var projectId = selected && selected.projectId ? selected.projectId : state.workspaceId;
    if (projectId) openWorkspace(projectId, 'files');
  }

  function handleDriveClick(event) {
    var row = event.target.closest('[data-resource-id]');
    var resource = row ? fileContext().files.snapshot(fileActor()).find(function (item) { return item.id === row.dataset.resourceId; }) : selectedResource();

    var scopeButton = event.target.closest('[data-drive-scope]');
    if (scopeButton) {
      state.driveScope = scopeButton.dataset.driveScope;
      if (scopeButton.dataset.workspaceId) state.workspaceId = scopeButton.dataset.workspaceId;
      if (scopeButton.dataset.sharedSpaceId) state.sharedSpaceId = scopeButton.dataset.sharedSpaceId;
      state.driveEntry = 'global';
      state.query = '';
      state.parentId = 0;
      state.crumbs = [];
      state.selectedId = null;
      closeRowMenu(false);
      renderDrive();
      return;
    }

    var action = event.target.closest('[data-drive-action]');
    if (!action && row) {
      state.selectedId = row.dataset.resourceId;
      closeRowMenu();
      renderDrive();
      return;
    }
    if (!action) return;
    event.preventDefault();
    event.stopPropagation();
    var name = action.dataset.driveAction;
    if (name === 'tag-dropdown-toggle') {
      state.dialog.tagDropdownOpen = state.dialog.tagDropdownOpen === false;
      renderDrive();
      return;
    }
    if (name === 'tag-option') {
      addDialogTag(action.dataset.driveTagValue);
      state.dialog.tagDropdownOpen = true;
      renderDrive();
      return;
    }
    if (name === 'tag-remove') {
      state.dialog.tags = state.dialog.tags.filter(function (tag) { return tag !== action.dataset.driveTagValue; });
      state.dialog.tagError = '';
      renderDrive();
      return;
    }
    if (name === 'row-menu') {
      if (state.menuId === String(resource.id)) closeRowMenu();
      else {
        captureTableScroll();
        state.menuId = String(resource.id);
        state.menuAnchor = rowMenuAnchor(action, Number(action.dataset.driveMenuSize || 1));
      }
      renderDrive();
      return;
    }
    if (state.menuId) {
      closeRowMenu();
      renderDrive();
    }
    if (name === 'select') { state.selectedId = resource.id; renderDrive(); }
    if (name === 'preview') {
      try {
        fileContext().files.resolveFile(resource, fileActor());
        state.previewId = resource.id;
        state.selectedId = null;
        renderDrive();
      } catch (error) {
        state.selectedId = resource.id;
        renderDrive();
        showToast(error.message || '当前文件无法预览');
      }
    }
    if (name === 'preview-close') { state.previewId = null; renderDrive(); }
    if (name === 'open-folder') {
      if (resource.area === 'personal') state.driveScope = 'personal';
      if (resource.area === 'project') { state.driveScope = 'workspace'; state.workspaceId = resource.projectId; }
      if (resource.area === 'shared') { state.driveScope = 'shared-space'; state.sharedSpaceId = resource.spaceId; }
      state.parentId = resource.id;
      state.crumbs = [{ id: resource.id, name: resource.name }];
      state.query = '';
      state.selectedId = null;
      renderDrive();
    }
    if (name === 'breadcrumb') {
      var index = Number(action.dataset.breadcrumbIndex);
      state.parentId = index === 0 ? 0 : state.crumbs[index - 1].id;
      state.crumbs = state.crumbs.slice(0, index);
      state.selectedId = null;
      renderDrive();
    }
    if (name === 'up-folder') {
      state.crumbs = state.crumbs.slice(0, -1);
      state.parentId = state.crumbs.length ? state.crumbs[state.crumbs.length - 1].id : 0;
      state.query = '';
      state.selectedId = null;
      renderDrive();
    }
    if (name === 'new-folder') openDialog('new-folder', null, scopeSpaceId());
    if (name === 'new-shared-space') openDialog('new-shared-space');
    if (name === 'upload-file') {
      var spaceId = scopeSpaceId();
      if (spaceId) { state.uploadTarget = spaceId; document.getElementById('eva-file-upload').click(); }
      else openDialog('target-upload');
    }
    if (name === 'copy-link') {
      var internalLink = location.origin + location.pathname + '#/drive?file=' + encodeURIComponent(resource.id);
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(internalLink).catch(function () {});
      showToast('已复制内部链接，不会改变访问权限');
    }
    if (name === 'shared-link') {
      var spaceLink = location.origin + location.pathname + '#/drive?space=' + encodeURIComponent(state.sharedSpaceId);
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(spaceLink).catch(function () {});
      showToast('已复制空间链接，链接本身不会授予权限');
    }
    if (name === 'shared-manage') openDialog('shared-manage');
    if (name === 'shared-members') openDialog('shared-members');
    if (name === 'add-shared-member') {
      try {
        var addMemberInput = document.getElementById('eva-drive-dialog-add-member');
        fileContext().files.addSharedMember(fileActor(), state.sharedSpaceId, addMemberInput.value);
        state.dialog = { type: 'shared-members', id: null, spaceId: state.sharedSpaceId };
        renderDrive();
        showToast('成员已加入，共享空间角色为 Editor');
      } catch (error) { renderDrive(); showToast(error.message || '添加成员失败'); }
    }
    if (name === 'remove-shared-member') {
      try {
        fileContext().files.removeSharedMember(fileActor(), state.sharedSpaceId, action.dataset.driveMemberRemove);
        state.dialog = { type: 'shared-members', id: null, spaceId: state.sharedSpaceId };
        renderDrive();
        showToast('成员已移出共享空间');
      } catch (error) { renderDrive(); showToast(error.message || '移除成员失败'); }
    }
    if (name === 'shared-settings') openDialog('shared-settings');
    if (name === 'shared-audit') openDialog('shared-audit');
    if (name === 'transfer-shared') openDialog('transfer-shared');
    if (name === 'open-project') bridgeSelectedResource();
    if (name === 'tags') openDialog('tags', resource);
    if (name === 'create-shortcut') openDialog('create-shortcut', resource);
    if (name === 'rename') openDialog('rename', resource);
    if (name === 'move') openDialog('move', resource);
    if (name === 'copy') { fileContext().files.copy(fileActor(), resource.id); showToast('已在当前空间创建副本'); }
    if (name === 'trash') openDialog('trash', resource);
    if (name === 'restore') {
      var restoreResult = fileContext().files.restore(fileActor(), resource.id);
      state.selectedId = null;
      showToast(restoreResult && restoreResult.restoredToRoot ? '原位置不存在，已恢复到空间根目录' : '已恢复到原位置');
    }
    if (name === 'delete-forever') openDialog('delete-forever', resource);
    if (name === 'dialog-close') closeDialog();
    if (name === 'dialog-confirm') confirmDialog();
  }

  function handleDriveInput(event) {
    if (event.type === 'input' && event.target.matches('[data-drive-tag-input]')) {
      state.dialog.tagInput = event.target.value;
      state.dialog.tagError = '';
      state.dialog.tagDropdownOpen = true;
      renderDrive();
      var editorInput = document.querySelector('[data-drive-tag-input]');
      if (editorInput) {
        editorInput.focus();
        editorInput.setSelectionRange(editorInput.value.length, editorInput.value.length);
      }
    }
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
      var context = fileContext(), actor = fileActor(), targetSpace = state.uploadTarget || scopeSpaceId() || personalSpaceId();
      var parentId = targetSpace === scopeSpaceId() ? state.parentId : 0;
      Array.from(event.target.files).forEach(function (file) { state.selectedId = context.files.upload(actor, targetSpace, file, parentId); });
      state.uploadTarget = null;
      event.target.value = '';
      renderDrive();
      showToast('文件已上传到' + spaceName(targetSpace));
    }
    if (event.type === 'change' && event.target.id === 'eva-drive-dialog-shortcut-space') {
      state.dialog.targetSpaceId = event.target.value;
      state.dialog.targetParentId = 0;
      renderDrive();
    }
    if (event.type === 'change' && event.target.matches('[data-drive-member-role]')) {
      try {
        fileContext().files.setSharedMemberRole(fileActor(), state.sharedSpaceId, event.target.dataset.driveMemberRole, event.target.value);
        state.dialog = { type: 'shared-members', id: null, spaceId: state.sharedSpaceId };
        renderDrive();
        showToast('成员角色已更新');
      } catch (error) {
        renderDrive();
        showToast(error.message || '角色更新失败');
      }
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
      else if (state.menuId && document.getElementById('eva-drive-root')) {
        closeRowMenu();
        renderDrive();
      }
    });
    document.addEventListener('input', function (event) {
      if (event.target.closest('#eva-drive-root')) handleDriveInput(event);
    });
    document.addEventListener('focusin', function (event) {
      if (state.dialog && state.dialog.type === 'tags' && event.target.matches('[data-drive-tag-input]') && state.dialog.tagDropdownOpen === false) {
        state.dialog.tagDropdownOpen = true;
        renderDrive();
        var input = document.querySelector('[data-drive-tag-input]');
        if (input) input.focus();
      }
    });
    document.addEventListener('change', function (event) {
      if (event.target.closest('#eva-drive-root')) handleDriveInput(event);
    });
    document.addEventListener('keydown', function (event) {
      if (state.dialog && state.dialog.type === 'tags' && event.target.matches('[data-drive-tag-input]') && event.key === 'Enter') {
        event.preventDefault();
        addDialogTag();
        renderDrive();
        var tagInput = document.querySelector('[data-drive-tag-input]');
        if (tagInput) tagInput.focus();
        return;
      }
      if (event.key === 'Escape') {
        var menu = document.querySelector('.eva-space-picker__menu:not([hidden])');
        if (menu) menu.hidden = true;
        if (state.menuId) { closeRowMenu(); renderDrive(); }
        if (state.dialog) closeDialog();
      }
    });
    window.addEventListener('resize', function () {
      if (state.menuId) { closeRowMenu(); renderDrive(); }
      syncDriveLeft();
    });
  }

  function initialize() {
    installSprite();
    installEvents();
    window.__evaOpenDrive = openDrive;
    window.__evaNativePages.register('drive', function (host) {
      var root = ensureDriveRoot(host);
      root.hidden = false;
      renderDrive();
      syncShellGeometry();
      return function () {
        closeDrive();
        if (root.parentElement === host) root.remove();
      };
    });
    var context = fileContext();
    if (context) context.files.subscribe(function () {
      var root = document.getElementById('eva-drive-root');
      if (root && !root.hidden) renderDrive();
    });
    var observer = new MutationObserver(scheduleEnhance);
    observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
    scheduleEnhance();
    syncShellGeometry();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
