
(function () {
  'use strict';

  var state = { query: '' };
  var enhancing = false;
  var DEMO_AI_NAMES = {
    '林晓': '虾大厨',
    '周远': '飞行员M号',
    '苏航': '正在休假的预言家',
    '何静': '星期二临时气象员'
  };
  function icon(name) {
    var paths = {
      contacts: '<path d="M15 13a3 3 0 1 0-6 0"></path><path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"></path><path d="M9 18h6"></path>',
      users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>',
      folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"></path>',
      search: '<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>',
      bot: '<path d="M12 8V4H8"></path><rect x="4" y="8" width="16" height="12" rx="2"></rect><path d="M2 14h2M20 14h2M9 13v2M15 13v2"></path>'
    };
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] || paths.contacts) + '</svg>';
  }

  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function projects() {
    var defaults = Array.isArray(window.__EVA_PROJECTS) ? window.__EVA_PROJECTS : [];
    try {
      var stored = JSON.parse(localStorage.getItem('eva-collab-spaces') || '[]');
      if (Array.isArray(stored) && stored.length) {
        var storedIds = new Set(stored.map(function (project) { return project.id; }));
        return stored.concat(defaults.filter(function (project) { return !storedIds.has(project.id); }));
      }
    } catch (error) {}
    return defaults;
  }

  function people() {
    var registry = new Map();
    projects().forEach(function (project) {
      (Array.isArray(project.members) ? project.members : []).forEach(function (member) {
        var name = String(member && member.name || '').trim();
        var myIdentity = window.__EVA_MY_ASSISTANT_IDENTITY;
        if (!name || name === 'EVA 官方') return;
        if (!registry.has(name)) registry.set(name, {
          name: name,
          projects: [],
          ais: [{
            name: String(member.aiName || (myIdentity && name === myIdentity.ownerName ? myIdentity.name : DEMO_AI_NAMES[name]) || '不愿透露姓名的路由器'),
            avatar: String(member.aiAvatar || '')
          }]
        });
        var person = registry.get(name);
        if (member.aiName) person.ais[0].name = String(member.aiName);
        if (member.aiAvatar) person.ais[0].avatar = String(member.aiAvatar);
        person.projects.push({ id: project.id, name: project.name, color: project.color || '#8a8f99' });
      });
    });
    return Array.from(registry.values()).map(function (person) {
      var identities = Array.isArray(window.__EVA_MY_ASSISTANTS) ? window.__EVA_MY_ASSISTANTS : [];
      if (identities.length && identities[0].ownerName === person.name) {
        person.ais = identities.map(function (identity) { return { name: identity.name, avatar: identity.logo }; });
      }
      return person;
    });
  }

  function avatar(name) {
    return window.EvaAvatar && typeof window.EvaAvatar.personUri === 'function'
      ? window.EvaAvatar.personUri('eva-person:' + name)
      : '';
  }

  function filteredPeople() {
    var query = state.query.trim().toLowerCase();
    return people().filter(function (person) {
      var humanText = [person.name].concat(person.projects.map(function (project) { return project.name; })).join(' ').toLowerCase();
      var aiText = person.ais.map(function (identity) { return identity.name; }).concat(person.name).join(' ').toLowerCase();
      var searchable = humanText + ' ' + aiText;
      return !query || searchable.indexOf(query) >= 0;
    });
  }

  function shell(root) {
    root.classList.add('eva-contacts--redesigned');
    root.dataset.evaContactsRedesigned = 'true';
    root.innerHTML = [
      '<main class="eva-contacts__main">',
      '<header class="eva-contacts__main-head"><strong>通讯录</strong><div class="eva-contacts__search-action"><button class="eva-contacts__search-toggle" type="button" data-eva-contacts-search-toggle aria-label="搜索通讯录" aria-expanded="false">' + icon('search') + '</button><label class="eva-contacts__search-popover" hidden>' + icon('search') + '<input type="search" data-eva-contacts-search placeholder="搜索联系人" autocomplete="off" aria-label="搜索通讯录"></label></div></header>',
      '<div class="eva-contacts__list" aria-label="联系人列表"></div>',
      '</main>'
    ].join('');
  }

  function renderList(root, list) {
    var container = root.querySelector('.eva-contacts__list');
    if (!container) return;
    var columnHeader = '<div class="eva-contacts__columns" aria-hidden="true"><span>联系人</span><span>AI 分身</span></div>';
    var items = list.map(function (person) {
      var ownerLabel = '由' + person.name + '创建';
      var human = '<span class="eva-contacts__cell eva-contacts__cell--human">' +
        '<img class="semi-avatar semi-avatar-circle eva-contacts__avatar" src="' + escapeHTML(avatar(person.name)) + '" alt="">' +
        '<strong class="eva-contacts__person-name">' + escapeHTML(person.name) + '</strong></span>';
      var aiRows = person.ais.map(function (identity) {
        var botAvatar = '<span class="eva-identity-avatar eva-identity-avatar--contact" role="img" aria-label="' + escapeHTML(identity.name + '，AI 分身，' + ownerLabel) + '">' +
          '<img class="eva-identity-avatar__logo" src="' + escapeHTML(window.__EVA_COLLEAGUE_PORTRAIT) + '" alt="">' +
          '<img class="eva-identity-avatar__owner" src="' + escapeHTML(avatar(person.name)) + '" alt="" title="' + escapeHTML(ownerLabel) + '"></span>';
        return '<span class="eva-contacts__ai-row">' + botAvatar +
          '<span class="eva-contacts__ai-identity"><strong class="eva-contacts__ai-name">' + escapeHTML(identity.name) + '</strong>' +
          '<span class="ai-badge ai-badge-small">AI</span></span></span>';
      }).join('');
      var ai = '<span class="eva-contacts__cell eva-contacts__cell--ai eva-contacts__cell--ai-list">' + aiRows + '</span>';
      return '<li class="semi-list-item eva-contacts__person" role="listitem">' +
        '<div class="semi-list-item-body semi-list-item-body-center">' + human + ai + '</div></li>';
    }).join('');
    container.innerHTML = columnHeader + (items
      ? '<div class="semi-list semi-list-split eva-contacts__semi-list"><ul class="semi-list-items" role="list">' + items + '</ul></div>'
      : '<div class="semi-list-empty eva-contacts__empty-state">没有找到匹配的联系人</div>');
  }

  function render(root) {
    var list = filteredPeople();
    renderList(root, list);
  }

  function enhance() {
    if (enhancing) return;
    var root = document.getElementById('eva-contacts-root');
    if (!root) return;
    enhancing = true;
    try {
      var obsoleteNav = document.getElementById('eva-directory-nav');
      var obsoletePage = document.getElementById('eva-directory-page');
      if (obsoleteNav) obsoleteNav.remove();
      if (obsoletePage) obsoletePage.remove();
      if (root.dataset.evaContactsRedesigned !== 'true' || !root.querySelector('.eva-contacts__main')) shell(root);
      render(root);
    } finally {
      enhancing = false;
    }
  }

  window.__evaEnhanceContacts = enhance;

  document.addEventListener('input', function (event) {
    if (!event.target.matches('[data-eva-contacts-search]')) return;
    state.query = event.target.value;
    enhance();
  });

  function closeSearch(shouldRender) {
    var searchField = document.querySelector('.eva-contacts__search-popover');
    var searchToggle = document.querySelector('[data-eva-contacts-search-toggle]');
    if (!searchField || searchField.hidden) return;
    searchField.hidden = true;
    if (searchToggle) searchToggle.setAttribute('aria-expanded', 'false');
    var searchInput = searchField.querySelector('input');
    if (searchInput) searchInput.value = '';
    var hadQuery = Boolean(state.query);
    state.query = '';
    if (shouldRender && hadQuery) enhance();
  }

  document.addEventListener('click', function (event) {
    var searchToggle = event.target.closest('[data-eva-contacts-search-toggle]');
    if (searchToggle) {
      var searchField = document.querySelector('.eva-contacts__search-popover');
      var willOpen = Boolean(searchField && searchField.hidden);
      if (!willOpen) { closeSearch(true); return; }
      searchField.hidden = false;
      searchToggle.setAttribute('aria-expanded', 'true');
      if (willOpen) {
        var searchInput = searchField.querySelector('input');
        if (searchInput) searchInput.focus();
      }
      return;
    }
    if (event.target.closest('.eva-contacts__search-action')) return;
    closeSearch(true);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    closeSearch(true);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhance, { once: true });
  else enhance();

  new MutationObserver(function (mutations) {
    if (mutations.some(function (mutation) { return Array.from(mutation.addedNodes || []).some(function (node) { return node.nodeType === 1 && (node.id === 'eva-contacts-root' || node.querySelector && node.querySelector('#eva-contacts-root')); }); })) enhance();
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
