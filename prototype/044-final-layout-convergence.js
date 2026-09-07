
(function () {
  'use strict';

  /* 个人 Eva 会话页已由 052-personal-eva-gds.js 按 GDS 六态重建，
     原先这里的头像气泡串（design.md:424 禁止的形态）连同
     personalMessages 假数据一并移除。本模块只剩：
     创建／编辑助理编辑器、数字员工市场页、旧自动化页签校正。 */

  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function openAssistantEditor(options) {
    if (window.__evaOpenAssistantEditor) window.__evaOpenAssistantEditor(options || {});
  }

  function tuneLegacyAutomation() {
    document.querySelectorAll('.eva-auto-tabs').forEach(function (tabs) {
      tabs.classList.add('eva-auto-segmented');
      var active = tabs.querySelector('.eva-auto-tab.is-active');
      tabs.dataset.active = active && active.dataset.evaAutoTab === 'history' ? 'history' : 'tasks';
      var buttons = tabs.querySelectorAll('.eva-auto-tab');
      if (buttons[0] && buttons[0].firstChild && buttons[0].firstChild.nodeType === 3 && buttons[0].firstChild.textContent !== '定时任务 ') buttons[0].firstChild.textContent = '定时任务 ';
      if (buttons[1] && buttons[1].textContent !== '运行记录') buttons[1].textContent = '运行记录';
    });
  }

  /* 消息与个人 Eva 共用一个中间栏宽度偏好。宽度归 documentElement 所有，
     页面切换只重新挂载视图，不复制状态；双击分隔线可恢复 260px。 */
  var conversationRailStorageKey = 'eva:conversation-rail-width';
  var conversationRailDefault = 260;
  var conversationRailMin = 220;
  var conversationRailMax = 480;
  var activeConversationRailDrag = null;

  function clampConversationRailWidth(width) {
    return Math.min(conversationRailMax, Math.max(conversationRailMin, Math.round(width)));
  }

  function setConversationRailWidth(width, persist) {
    var next = clampConversationRailWidth(width);
    document.documentElement.style.setProperty('--eva-conversation-rail-current', next + 'px');
    document.querySelectorAll('[data-eva-conversation-rail-resizer]').forEach(function (handle) {
      handle.setAttribute('aria-valuemin', String(conversationRailMin));
      handle.setAttribute('aria-valuemax', String(conversationRailMax));
      handle.setAttribute('aria-valuenow', String(next));
    });
    if (persist) localStorage.setItem(conversationRailStorageKey, String(next));
    return next;
  }

  function restoreConversationRailWidth() {
    var saved = Number(localStorage.getItem(conversationRailStorageKey));
    setConversationRailWidth(Number.isFinite(saved) && saved > 0 ? saved : conversationRailDefault, false);
  }

  document.addEventListener('pointerdown', function (event) {
    var handle = event.target.closest && event.target.closest('[data-eva-conversation-rail-resizer]');
    if (!handle || event.button !== 0) return;
    var rail = handle.closest('.ch-list, .eva-personal-sider-panel, .eva-ai-team__sidebar');
    if (!rail) return;
    event.preventDefault();
    activeConversationRailDrag = { pointerId: event.pointerId, startX: event.clientX, startWidth: rail.getBoundingClientRect().width };
    handle.setPointerCapture(event.pointerId);
    document.documentElement.classList.add('eva-conversation-rail-resizing');
  });

  document.addEventListener('pointermove', function (event) {
    if (!activeConversationRailDrag || event.pointerId !== activeConversationRailDrag.pointerId) return;
    setConversationRailWidth(activeConversationRailDrag.startWidth + event.clientX - activeConversationRailDrag.startX, false);
  });

  function finishConversationRailDrag(event) {
    if (!activeConversationRailDrag || event.pointerId !== activeConversationRailDrag.pointerId) return;
    var width = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--eva-conversation-rail-current'));
    setConversationRailWidth(width, true);
    activeConversationRailDrag = null;
    document.documentElement.classList.remove('eva-conversation-rail-resizing');
  }

  document.addEventListener('pointerup', finishConversationRailDrag);
  document.addEventListener('pointercancel', finishConversationRailDrag);
  document.addEventListener('dblclick', function (event) {
    if (event.target.closest && event.target.closest('[data-eva-conversation-rail-resizer]')) setConversationRailWidth(conversationRailDefault, true);
  });
  document.addEventListener('keydown', function (event) {
    if (!event.target.matches || !event.target.matches('[data-eva-conversation-rail-resizer]')) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Home') return;
    event.preventDefault();
    var current = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--eva-conversation-rail-current')) || conversationRailDefault;
    setConversationRailWidth(event.key === 'Home' ? conversationRailDefault : current + (event.key === 'ArrowLeft' ? -10 : 10), true);
  });

  document.addEventListener('click', function (event) {
    var editAssistant = event.target.closest('.eva-personal-sider-panel [data-eva-edit-assistant]');
    if (editAssistant) {
      event.preventDefault();
      var folder = editAssistant.closest('[data-eva-assistant-id]');
      openAssistantEditor({ mode: 'edit', id: folder.dataset.evaAssistantId, name: folder.dataset.evaAssistantName, presentation: 'personal-workspace' });
      return;
    }
    var createAssistant = event.target.closest('.eva-personal-sider-panel .eva-assistant-tree__create');
    if (createAssistant) {
      event.preventDefault();
      openAssistantEditor({ mode: 'create', presentation: 'personal-workspace' });
      return;
    }
    var legacyTab = event.target.closest('.eva-auto-tabs .eva-auto-tab');
    if (legacyTab) requestAnimationFrame(tuneLegacyAutomation);
  }, true);

  restoreConversationRailWidth();
  tuneLegacyAutomation();
})();
