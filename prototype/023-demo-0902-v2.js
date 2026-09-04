
(function () {
  'use strict';

  var PERSON_MEMBERS = [
    { id: 'person-he', name: '何静', detail: '项目交付推进', mark: '何' },
    { id: 'person-su', name: '苏航', detail: '方案评审', mark: '苏' },
    { id: 'person-qin', name: '秦漱', detail: '会议跟进', mark: '秦' },
    { id: 'person-lin', name: '林晓', detail: '客户问题响应', mark: '林' }
  ];
  var ASSISTANT_MEMBERS = [
    { id: 'assistant-pilot', name: '飞行员E号（王宜林的分身）', detail: '自己的分身' }
  ];
  var selectedMemberIds = new Set();
  var groupSequence = 0;
  var createdGroups = [];
  window.__EVA_CREATED_GROUPS = createdGroups;
  window.dispatchEvent(new CustomEvent('eva:created-projects-changed'));
  var activeGroupId = null;
  var lastDialogTrigger = null;
  var tuneQueued = false;

  function lucide(name) {
    var paths = {
      createGroup: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path><path d="M8 12h8"></path><path d="M12 8v8"></path>',
      close: '<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>',
      group: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>'
    };
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + paths[name] + '</svg>';
  }

  function navContainer() {
    var side = document.querySelector('aside.arco-layout-sider') || document.querySelector('aside');
    return side && side.querySelector('.size-full.flex.flex-col.gap-2px');
  }

  function directChildForText(container, text, excludeId) {
    return Array.from(container ? container.children : []).find(function (child) {
      if (excludeId && child.id === excludeId) return false;
      return Array.from(child.querySelectorAll('span')).some(function (span) {
        return span.textContent.trim() === text;
      });
    }) || null;
  }

  function findHistoryArea(container) {
    return Array.from(container ? container.children : []).find(function (child) {
      return String(child.className || '').indexOf('overflow-y-auto') >= 0;
    }) || null;
  }

  function findNativeDivider(container) {
    return Array.from(container ? container.children : []).find(function (child) {
      var className = String(child.className || '');
      return child.classList && !child.classList.contains('eva-common-nav-divider') && className.indexOf('h-1px') >= 0 && className.indexOf('bg-') >= 0;
    }) || null;
  }

  function showElement(element) {
    if (!element) return;
    if (element.style.display === 'none') element.style.display = '';
    if (element.getAttribute('aria-hidden') !== 'false') element.setAttribute('aria-hidden', 'false');
  }

  function hideElement(element) {
    if (!element) return;
    if (element.style.display !== 'none') element.style.display = 'none';
    if (element.getAttribute('aria-hidden') !== 'true') element.setAttribute('aria-hidden', 'true');
  }

  function isCollaborationMode() {
    var hash = String(location.hash || '');
    return /^#\/(collab|messages)(?:[/?]|$)/.test(hash) && !/[?&]evaIM=my-ai/.test(hash);
  }

  function memberRows(members, kind) {
    return members.map(function (member) {
      var portrait = window.EvaAvatar && typeof window.EvaAvatar.personUri === 'function'
        ? window.EvaAvatar.personUri('eva-person:' + member.name)
        : '';
      var avatar = kind === 'assistant'
        ? '<span class="eva-identity-avatar eva-identity-avatar--contact eva-create-group-member__avatar" role="img" aria-label="' + member.name + '"><img class="eva-identity-avatar__logo" src="' + (window.__EVA_COLLEAGUE_PORTRAIT || '') + '" alt=""><img class="eva-identity-avatar__owner" src="' + (window.__EVA_CURRENT_USER_PORTRAIT || '') + '" alt=""></span>'
        : (portrait ? '<img class="eva-create-group-member__avatar" src="' + portrait + '" alt="">' : '<span class="eva-create-group-member__avatar" aria-hidden="true">' + member.mark + '</span>');
      return [
        '<label class="eva-create-group-member" data-member-kind="' + kind + '" data-member-id="' + member.id + '" data-member-name="' + member.name + '">',
          '<input type="checkbox" value="' + member.id + '" aria-label="选择' + member.name + '">',
          avatar,
          '<span class="eva-create-group-member__copy"><strong>' + member.name + (kind === 'assistant' ? '<span class="ai-badge ai-badge-small">AI</span>' : '') + '</strong><span>' + member.detail + '</span></span>',
        '</label>'
      ].join('');
    }).join('');
  }

  function ensureCreateGroupDialog() {
    var layer = document.getElementById('eva-create-group-layer');
    if (layer) return layer;

    layer = document.createElement('div');
    layer.id = 'eva-create-group-layer';
    layer.className = 'eva-create-group-layer';
    layer.hidden = true;
    layer.innerHTML = [
      '<div class="eva-create-group-backdrop" data-create-group-close></div>',
      '<section class="eva-create-group-dialog" role="dialog" aria-modal="true" aria-labelledby="eva-create-group-title">',
        '<header class="eva-create-group-dialog__header">',
          '<h2 id="eva-create-group-title">新建群聊</h2>',
          '<button type="button" class="eva-create-group-dialog__close" data-create-group-close aria-label="关闭新建群聊">' + lucide('close') + '</button>',
        '</header>',
        '<div class="eva-create-group-dialog__body">',
          '<p class="eva-create-group-dialog__hint">选择要加入群聊的真人或助理。你会自动加入该群聊。</p>',
          '<input class="eva-create-group-dialog__search" type="search" placeholder="搜索真人或助理" aria-label="搜索真人或助理">',
          '<section class="eva-create-group-dialog__section" data-member-kind="person">',
            '<h3 class="eva-create-group-dialog__section-title">真人</h3>',
            memberRows(PERSON_MEMBERS, 'person'),
          '</section>',
          '<section class="eva-create-group-dialog__section" data-member-kind="assistant">',
            '<h3 class="eva-create-group-dialog__section-title">助理</h3>',
            '<p class="eva-create-group-dialog__section-description">每个人只能将自己的分身加入群聊</p>',
            memberRows(ASSISTANT_MEMBERS, 'assistant'),
          '</section>',
          '<p class="eva-create-group-dialog__empty" hidden>没有匹配的真人或助理</p>',
        '</div>',
        '<footer class="eva-create-group-dialog__footer">',
          '<button type="button" class="eva-create-group-cancel" data-create-group-close>取消</button>',
          '<button type="button" class="eva-create-group-confirm" data-create-group-confirm disabled>创建群聊</button>',
        '</footer>',
      '</section>'
    ].join('');
    document.body.appendChild(layer);

    layer.querySelectorAll('[data-create-group-close]').forEach(function (button) {
      button.addEventListener('click', closeCreateGroupDialog);
    });
    layer.querySelectorAll('.eva-create-group-member input').forEach(function (input) {
      input.addEventListener('change', function () {
        if (input.checked) selectedMemberIds.add(input.value);
        else selectedMemberIds.delete(input.value);
        updateCreateGroupConfirm(layer);
      });
    });
    layer.querySelector('.eva-create-group-dialog__search').addEventListener('input', function (event) {
      filterMembers(layer, event.target.value);
    });
    layer.querySelector('[data-create-group-confirm]').addEventListener('click', function () {
      createGroupFromSelection(layer);
    });
    layer.addEventListener('keydown', trapDialogKeyboard);
    return layer;
  }

  function updateCreateGroupConfirm(layer) {
    var confirm = layer.querySelector('[data-create-group-confirm]');
    confirm.disabled = selectedMemberIds.size === 0;
    confirm.textContent = selectedMemberIds.size ? '创建群聊（' + selectedMemberIds.size + '）' : '创建群聊';
  }

  function filterMembers(layer, query) {
    var normalized = query.trim().toLowerCase();
    var visibleCount = 0;
    layer.querySelectorAll('.eva-create-group-member').forEach(function (row) {
      var visible = !normalized || row.dataset.memberName.toLowerCase().indexOf(normalized) >= 0;
      row.hidden = !visible;
      if (visible) visibleCount += 1;
    });
    layer.querySelector('.eva-create-group-dialog__empty').hidden = visibleCount !== 0;
  }

  function openCreateGroupDialog(trigger) {
    var layer = ensureCreateGroupDialog();
    lastDialogTrigger = trigger;
    selectedMemberIds.clear();
    layer.querySelectorAll('.eva-create-group-member input').forEach(function (input) { input.checked = false; });
    var search = layer.querySelector('.eva-create-group-dialog__search');
    search.value = '';
    filterMembers(layer, '');
    updateCreateGroupConfirm(layer);
    layer.hidden = false;
    document.body.classList.add('eva-create-group-dialog-open');
    requestAnimationFrame(function () { search.focus(); });
  }

  function closeCreateGroupDialog() {
    var layer = document.getElementById('eva-create-group-layer');
    if (!layer || layer.hidden) return;
    layer.hidden = true;
    document.body.classList.remove('eva-create-group-dialog-open');
    if (lastDialogTrigger && document.contains(lastDialogTrigger)) lastDialogTrigger.focus();
  }

  function trapDialogKeyboard(event) {
    var layer = event.currentTarget;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeCreateGroupDialog();
      return;
    }
    if (event.key !== 'Tab') return;
    var focusable = Array.from(layer.querySelectorAll('button:not(:disabled), input:not(:disabled)')).filter(function (node) {
      return !node.closest('[hidden]');
    });
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function selectedMembers() {
    return PERSON_MEMBERS.concat(ASSISTANT_MEMBERS).filter(function (member) {
      return selectedMemberIds.has(member.id);
    });
  }

  function automaticGroupName(members) {
    var names = members.slice(0, 2).map(function (member) {
      return member.name.replace(/^王琛的/, '');
    });
    return names.join('、') + (members.length > 2 ? '等人的群聊' : '群聊');
  }

  function ensureCreatedGroupSection(scroll) {
    var section = scroll.querySelector(':scope > .eva-created-group-section');
    if (section) return section;
    section = document.createElement('section');
    section.className = 'eva-created-group-section';
    section.innerHTML = '<div class="eva-created-group-section__title">刚刚创建</div>';
    scroll.prepend(section);
    return section;
  }

  function ensureCreatedGroupView(layout) {
    var view = layout.querySelector(':scope > .eva-created-group-view');
    if (view) return view;
    view = document.createElement('section');
    view.className = 'eva-created-group-view';
    view.hidden = true;
    view.innerHTML = [
      '<header class="eva-created-group-view__header"><h2></h2><p></p></header>',
      '<div class="eva-created-group-view__body"><div><span class="eva-created-group-view__empty-icon">' + lucide('group') + '</span><div>群聊已创建，可以开始发送消息</div></div></div>',
      '<div class="eva-created-group-view__composer">发送消息到这个群聊…</div>'
    ].join('');
    layout.style.position = 'relative';
    layout.appendChild(view);
    return view;
  }

  function openCreatedGroup(item) {
    var layout = document.querySelector('.eva-msg .ch-layout');
    if (!layout) return;
    activeGroupId = item.dataset.groupId;
    var view = ensureCreatedGroupView(layout);
    view.querySelector('h2').textContent = item.dataset.groupName;
    view.querySelector('p').textContent = item.dataset.groupMemberNames;
    view.hidden = false;
    layout.classList.add('eva-created-group-open');
    document.querySelectorAll('.eva-created-group-item').forEach(function (button) {
      button.setAttribute('aria-current', button === item ? 'page' : 'false');
    });
  }

  function closeCreatedGroup() {
    activeGroupId = null;
    var layout = document.querySelector('.eva-msg .ch-layout');
    if (!layout) return;
    layout.classList.remove('eva-created-group-open');
    var view = layout.querySelector(':scope > .eva-created-group-view');
    if (view) view.hidden = true;
    document.querySelectorAll('.eva-created-group-item').forEach(function (button) {
      button.setAttribute('aria-current', 'false');
    });
  }

  function createGroupFromSelection(layer) {
    var members = selectedMembers();
    if (!members.length) return;
    var scroll = document.querySelector('.eva-msg .ch-list__scroll');
    var layout = document.querySelector('.eva-msg .ch-layout');
    if (!scroll || !layout) return;

    groupSequence += 1;
    var groupName = automaticGroupName(members);
    var group = {
      id: 'eva-created-group-' + groupSequence,
      name: groupName,
      memberNames: '你、' + members.map(function (member) { return member.name; }).join('、'),
      memberCount: members.length + 1
    };
    createdGroups.push(group);
    window.dispatchEvent(new CustomEvent('eva:created-projects-changed'));
    renderCreatedGroups();
    var item = document.querySelector('[data-group-id="' + group.id + '"]');
    closeCreateGroupDialog();
    if (item) openCreatedGroup(item);
  }

  function renderCreatedGroups() {
    if (!createdGroups.length) return;
    var scroll = document.querySelector('.eva-msg .ch-list__scroll');
    if (!scroll) return;
    var section = ensureCreatedGroupSection(scroll);
    var validIds = new Set(createdGroups.map(function (group) { return group.id; }));
    section.querySelectorAll('.eva-created-group-item').forEach(function (item) {
      if (!validIds.has(item.dataset.groupId)) item.remove();
    });
    createdGroups.forEach(function (group) {
      var item = section.querySelector('[data-group-id="' + group.id + '"]');
      if (!item) {
        item = document.createElement('button');
        item.type = 'button';
        item.className = 'eva-created-group-item';
        item.dataset.groupId = group.id;
        item.setAttribute('aria-current', 'false');
        item.innerHTML = [
          '<span class="eva-created-group-item__avatar" aria-hidden="true">' + lucide('group') + '</span>',
          '<span class="eva-created-group-item__copy"><strong></strong><span></span></span>'
        ].join('');
        item.addEventListener('click', function () { openCreatedGroup(item); });
        section.appendChild(item);
      }
      item.dataset.groupName = group.name;
      item.dataset.groupMemberNames = group.memberNames;
      item.querySelector('strong').textContent = group.name;
      item.querySelector('.eva-created-group-item__copy span').textContent = group.memberCount + ' 位成员';
    });
    if (activeGroupId) {
      var activeItem = section.querySelector('[data-group-id="' + activeGroupId + '"]');
      if (activeItem) openCreatedGroup(activeItem);
    }
  }

  function ensureCreateGroupButton() {
    var top = document.querySelector('.eva-msg .ch-list__top');
    if (!top) return;
    top.classList.add('eva-message-search-row');
    var button = top.querySelector(':scope > .eva-create-group-button');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'eva-create-group-button';
      button.setAttribute('aria-label', '新建群聊');
      button.setAttribute('title', '新建群聊');
      button.innerHTML = lucide('createGroup');
      button.addEventListener('click', function () { openCreateGroupDialog(button); });
      top.appendChild(button);
    }
    button.hidden = !isCollaborationMode();
  }

  function tuneV2() {
    tuneQueued = false;
    ensureCreateGroupButton();
    renderCreatedGroups();
    var layer = document.getElementById('eva-create-group-layer');
    if (layer && !isCollaborationMode() && !layer.hidden) closeCreateGroupDialog();
    if (!isCollaborationMode()) closeCreatedGroup();
  }

  function queueTuneV2() {
    if (tuneQueued) return;
    tuneQueued = true;
    requestAnimationFrame(tuneV2);
  }

  document.addEventListener('click', function (event) {
    if (event.target.closest('.wk-conv-compact-item') && !event.target.closest('.eva-created-group-item')) {
      closeCreatedGroup();
    }
    if (event.target.closest('aside')) queueTuneV2();
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', queueTuneV2, { once: true });
  else queueTuneV2();

  new MutationObserver(queueTuneV2).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'aria-hidden', 'aria-selected']
  });
})();
