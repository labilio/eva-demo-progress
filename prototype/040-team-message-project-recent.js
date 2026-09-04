
(function () {
  'use strict';

  var currentView = 'follow';
  var tuneQueued = false;
  var RECENT_CONVERSATIONS = [
    { id: 'im-eva-octo', title: 'EVA + OCTO 融合推进群', preview: 'EVA+OCTO项目助手：任务已创建，负责人已指定为威少。', time: '18:20', color: '#7567d8' },
    { id: 'im-delivery', title: '项目交付推进', preview: '王宜林的 Eva 助理：已整理交付清单并创建任务。', time: '17:30', color: '#66789e' },
    { id: 'im-review', title: '方案评审', preview: '王宜林的 Eva 助理：已读取附件并给出评审重点。', time: '16:42', color: '#5f8798' },
    { id: 'im-meeting', title: '会议跟进', preview: '王宜林的 Eva 助理：结论、行动项和风险已分类。', time: '15:40', color: '#9a8062' }
  ];

  function isCollaborationMode() {
    return document.body.classList.contains('eva-mode-collaboration');
  }

  function recentIcon() {
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>';
  }

  function renderRecentList(messageRoot) {
    var scroll = messageRoot.querySelector('.ch-list__scroll');
    if (!scroll) return;
    var list = scroll.querySelector('.eva-project-recent-list');
    if (!list) {
      list = document.createElement('div');
      list.className = 'eva-project-recent-list';
      list.setAttribute('role', 'list');
      scroll.appendChild(list);
    }
    if (list.dataset.evaRendered !== 'true') {
      list.dataset.evaRendered = 'true';
      list.dataset.selectedId = RECENT_CONVERSATIONS[0].id;
      list.innerHTML = '<div class="eva-project-recent-list__intro"><span><strong>重点演示对话</strong><small>4 个能力场景</small></span><button class="eva-project-recent-list__create" type="button" data-eva-context-task-create aria-expanded="false">＋ 新建任务</button></div>' + RECENT_CONVERSATIONS.map(function (item) {
        return '<button type="button" class="eva-project-recent-item" role="listitem" data-eva-im-conversation-id="' + item.id + '" aria-current="' + (item.id === RECENT_CONVERSATIONS[0].id ? 'true' : 'false') + '" style="--eva-recent-accent:' + item.color + ';--eva-recent-surface:' + item.color + '18"><span class="eva-project-recent-item__avatar">' + recentIcon() + '</span><span class="eva-project-recent-item__name">' + item.title + '</span><time class="eva-project-recent-item__time">' + item.time + '</time><span class="eva-project-recent-item__preview">' + item.preview + '</span></button>';
      }).join('');
    }
  }

  function openRecentItem(button) {
    var list = button.closest('.eva-project-recent-list');
    if (list) {
      list.dataset.selectedId = button.dataset.evaImConversationId;
      list.querySelectorAll('.eva-project-recent-item').forEach(function (candidate) {
        candidate.setAttribute('aria-current', candidate === button ? 'true' : 'false');
      });
    }
    window.EvaIMConversation.open(button.dataset.evaImConversationId);
  }

  window.__evaOpenRecentMessageEntry = openRecentItem;

  function setView(messageRoot, tabbar, view) {
    currentView = view;
    messageRoot.classList.toggle('eva-team-message-view--project', view === 'follow');
    messageRoot.classList.toggle('eva-team-message-view--recent', view === 'recent');
    tabbar.querySelectorAll('.wk-sidebar-tabbar__btn').forEach(function (button, index) {
      var active = (view === 'follow' && index === 0) || (view === 'recent' && index === 1);
      button.classList.toggle('wk-sidebar-tabbar__btn--active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    renderRecentList(messageRoot);
    if (view === 'recent') {
      var selected = messageRoot.querySelector('.eva-project-recent-item[aria-current="true"]') || messageRoot.querySelector('.eva-project-recent-item');
      if (selected) requestAnimationFrame(function () { openRecentItem(selected); });
    }
  }

  function tuneSwitcher() {
    tuneQueued = false;
    document.querySelectorAll('.eva-msg').forEach(function (messageRoot) {
      var top = messageRoot.querySelector('.ch-list__top');
      if (!top) return;
      var tabbar = messageRoot.querySelector('.wk-sidebar-tabbar');
      if (!tabbar) {
        tabbar = document.createElement('div');
        tabbar.className = 'wk-sidebar-tabbar';
        tabbar.innerHTML = '<div class="wk-sidebar-tabbar__container"><button class="wk-sidebar-tabbar__btn" type="button"><span class="wk-sidebar-tabbar__label">关注</span></button><button class="wk-sidebar-tabbar__btn" type="button"><span class="wk-sidebar-tabbar__label">最近</span></button></div>';
        top.insertAdjacentElement('afterend', tabbar);
      }
      tabbar.dataset.evaProjectRecentSwitcher = 'true';
      tabbar.hidden = !isCollaborationMode() || new URLSearchParams(location.hash.split('?')[1] || '').get('evaIM') === 'my-ai';
      tabbar.setAttribute('aria-hidden', tabbar.hidden ? 'true' : 'false');
      if (new URLSearchParams(location.hash.split('?')[1] || '').get('evaIM') === 'my-ai') {
        messageRoot.classList.remove('eva-team-message-view--project', 'eva-team-message-view--recent');
        return;
      }
      if (!tabbar.dataset.evaBound) {
        tabbar.dataset.evaBound = 'true';
        tabbar.querySelectorAll('.wk-sidebar-tabbar__btn').forEach(function (button, index) {
          button.addEventListener('click', function () { setView(messageRoot, tabbar, index === 0 ? 'follow' : 'recent'); });
        });
      }
      setView(messageRoot, tabbar, currentView);
    });
  }

  function queueTune() {
    if (tuneQueued) return;
    tuneQueued = true;
    requestAnimationFrame(tuneSwitcher);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', queueTune, { once: true });
  else queueTune();
  window.addEventListener('hashchange', queueTune);
  window.addEventListener('eva-mode-change', queueTune);
  new MutationObserver(queueTune).observe(document.documentElement, { childList: true, subtree: true });
})();
