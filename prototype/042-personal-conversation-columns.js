
(function () {
  'use strict';

  var historyNode = null;
  var historyDivider = null;
  var tuneQueued = false;
  function sidebar() {
    return document.querySelector('aside.arco-layout-sider') || document.querySelector('aside');
  }

  function navContainer(side) {
    return side && side.querySelector('.size-full.flex.flex-col.gap-2px');
  }

  function historyIn(container) {
    return Array.from(container ? container.children : []).find(function (child) {
      return String(child.className || '').indexOf('overflow-y-auto') >= 0;
    }) || null;
  }

  function isPersonalConversation() {
    var hash = String(location.hash || '');
    return hash.indexOf('#/guid') === 0 || hash.indexOf('#/conversation/') === 0;
  }

  function ensureColumn(side) {
    var column = document.getElementById('eva-personal-history-column');
    if (!column) {
      column = document.createElement('nav');
      column.id = 'eva-personal-history-column';
      column.setAttribute('aria-label', 'Eva 同学的对话');
    }
    if (column.parentNode !== side.parentNode || column.previousElementSibling !== side) {
      side.parentNode.insertBefore(column, side.nextSibling);
    }
    return column;
  }

  function assistantIcon(history) {
    var source = history.querySelector('.chat-history__item > span.size-22px');
    if (!source) return '<span aria-hidden="true">✦</span>';
    var clone = source.cloneNode(true);
    clone.removeAttribute('class');
    clone.querySelectorAll('[id]').forEach(function (node) { node.removeAttribute('id'); });
    return clone.innerHTML || '<span aria-hidden="true">✦</span>';
  }

  function personalFolderMarkup(name, index) {
    return [
      '<section class="eva-assistant-folder eva-personal-assistant-folder" data-eva-folder="', String(index), '">',
        '<div class="eva-personal-assistant-folder__row">',
          '<button class="eva-assistant-folder__button" type="button" aria-expanded="true">',
            '<span class="eva-assistant-folder__icon" aria-hidden="true"></span>',
            '<span class="eva-assistant-folder__name">', name, '</span>',
          '</button>',
          '<span class="eva-personal-assistant-folder__actions">',
            '<button type="button" aria-label="更多操作">···</button>',
            '<button class="eva-personal-assistant-folder__new-chat" type="button" aria-label="新建对话">＋</button>',
          '</span>',
        '</div>',
        '<div class="eva-assistant-folder__conversations"></div>',
      '</section>'
    ].join('');
  }

  function escapeText(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function ensureAssistantTree(column) {
    var rows = historyNode ? Array.from(historyNode.querySelectorAll('.chat-history__item')).slice(0, 5) : [];
    if (!rows.length) return;
    var signature = 'personal-v2:' + rows.map(function (row) {
      var name = row.querySelector('.chat-history__item-name span');
      return row.id + ':' + (name ? name.textContent : '新对话');
    }).join('|');
    var tree = column.querySelector(':scope > .eva-assistant-tree');
    if (tree && tree.dataset.signature === signature) return;
    if (!tree) {
      tree = document.createElement('div');
      tree.className = 'eva-assistant-tree';
      column.prepend(tree);
    }
    tree.dataset.signature = signature;
    tree.innerHTML = '<div class="eva-personal-assistant-heading"><span>我的助理</span><button class="eva-assistant-tree__create" type="button" aria-label="创建助理">＋</button></div>' + personalFolderMarkup('通用助理', 0) + personalFolderMarkup('Eva研发助理', 1);
    var createAssistant = tree.querySelector('.eva-assistant-tree__create');
    if (createAssistant) createAssistant.addEventListener('click', function () { this.textContent = '已进入创建助理'; });
    var folders = tree.querySelectorAll('.eva-assistant-folder');
    var sourceIcon = historyNode ? assistantIcon(historyNode) : '';
    folders.forEach(function (folder) {
      folder.querySelector('.eva-assistant-folder__icon').innerHTML = sourceIcon;
      folder.querySelector('.eva-assistant-folder__button').addEventListener('click', function () {
        var collapsed = folder.classList.toggle('is-collapsed');
        this.setAttribute('aria-expanded', String(!collapsed));
      });
      var personalNewChat = folder.querySelector('.eva-personal-assistant-folder__new-chat');
      if (personalNewChat) personalNewChat.addEventListener('click', function () {
        var trigger = document.querySelector('[data-eva-nav-id="new-chat"] button, [data-eva-nav-id="new-chat"] [class*="cursor-pointer"]');
        if (trigger) trigger.click();
      });
    });
    rows.forEach(function (row, index) {
      var name = row.querySelector('.chat-history__item-name span');
      var conversationTitle = name ? name.textContent : '新对话';
      var displayTime = index === 0 ? '3 小时' : (index === 1 ? '7 小时' : (index === 2 ? '1 天' : '1 分钟'));
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'eva-assistant-conversation';
      button.dataset.conversationTitle = conversationTitle;
      button.innerHTML = '<span class="eva-assistant-conversation__title">' + escapeText(conversationTitle) + '</span><time class="eva-assistant-conversation__time">' + displayTime + '</time>';
      if (index === 0) button.classList.add('is-selected');
      button.__evaSourceConversation = row;
      folders[index < 3 ? 0 : 1].querySelector('.eva-assistant-folder__conversations').appendChild(button);
    });
  }

  function hideHistoryColumn() {
    if (historyDivider) historyDivider.classList.add('eva-personal-history-divider-hidden');
    var column = document.getElementById('eva-personal-history-column');
    if (column) column.hidden = true;
  }

  function tuneColumns() {
    tuneQueued = false;
    var side = sidebar();
    if (!side) return;
    var container = navContainer(side);
    if (!container) return;

    var candidate = historyIn(container);
    if (candidate && candidate !== historyNode) {
      historyNode = candidate;
      historyDivider = candidate.previousElementSibling;
    }
    if (!historyNode || !historyNode.isConnected) {
      if (!isPersonalConversation()) hideHistoryColumn();
      return;
    }

    var column = ensureColumn(side);
    if (historyDivider) historyDivider.classList.add('eva-personal-history-divider-hidden');
    historyNode.classList.add('eva-history-source');
    ensureAssistantTree(column);
    if (!isPersonalConversation()) {
      hideHistoryColumn();
      return;
    }
    column.hidden = false;
  }

  function queueTune() {
    if (tuneQueued) return;
    tuneQueued = true;
    requestAnimationFrame(tuneColumns);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', queueTune, { once: true });
  else queueTune();
  window.addEventListener('hashchange', queueTune);
  document.addEventListener('click', queueTune, true);
  if (!document.documentElement.dataset.evaMessageEntryDelegation) {
    document.documentElement.dataset.evaMessageEntryDelegation = 'true';
    document.addEventListener('click', function (event) {
      var recentItem = event.target.closest('.eva-project-recent-item');
      if (recentItem && recentItem.closest('.eva-project-recent-list')) {
        event.preventDefault();
        if (window.__evaOpenRecentMessageEntry) window.__evaOpenRecentMessageEntry(recentItem);
        return;
      }
      var conversation = event.target.closest('#eva-personal-history-column .eva-assistant-conversation');
      if (!conversation) return;
      event.preventDefault();
      conversation.closest('.eva-assistant-tree').querySelectorAll('.eva-assistant-conversation').forEach(function (item) {
        item.classList.toggle('is-selected', item === conversation);
      });
      if (conversation.__evaSourceConversation) conversation.__evaSourceConversation.click();
    }, true);
  }
  if (!document.documentElement.dataset.evaImEntryKeyboard) {
    document.documentElement.dataset.evaImEntryKeyboard = 'true';
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      var entry = event.target.closest('.eva-project-recent-item, #eva-personal-history-column .eva-assistant-conversation');
      if (!entry) return;
      event.preventDefault();
      entry.click();
    });
  }
  new MutationObserver(queueTune).observe(document.documentElement, { childList: true, subtree: true });
})();
