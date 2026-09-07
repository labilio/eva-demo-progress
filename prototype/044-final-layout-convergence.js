
(function () {
  'use strict';

  var personalConversation = '整理今天的工作重点';
  var personalMessages = {
    '整理今天的工作重点': [
      { role: 'user', text: '把今天最重要的工作按优先级排一下，并标出需要我确认的事项。' },
      { role: 'assistant', quote: '按优先级排一下，并标出需要我确认的事项。', text: '已按影响范围整理为三项：先确认客户演示路径，再完成导航回归，最后准备下午的项目同步。第一项需要你确认演示顺序。', task: '待确认 · 客户演示路径 · 今天 11:30' },
      { role: 'user', text: '把演示路径整理成文件发给我。' },
      { role: 'assistant', text: '已整理完成，包含消息中新建任务、项目团队文件和数字员工三个关键场景。', file: '老板演示路径-v1.docx · 186 KB' }
    ],
    '云盘权限方案梳理': [
      { role: 'user', text: '回复苏航刚才的权限问题，并把结论整理成附件。' },
      { role: 'assistant', quote: '苏航：客户资料能不能直接跨项目共享？', text: '已回复：团队文件继承当前项目权限，跨项目使用需要显式授权；项目外文件仍保留在文件库。', file: '客户资料权限边界.pdf · 1.2 MB' }
    ],
    '会议纪要与待办': [
      { role: 'user', text: '继续刚才的会议，把结论和待办分开。' },
      { role: 'assistant', text: '结论已整理为三条，待办已分别关联负责人和时间。你可以继续追问任一条，我会保留本轮上下文。', task: '已创建 3 个会议待办' }
    ]
  };

  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function decodedHash() {
    try { return decodeURIComponent(String(location.hash || '')); }
    catch (error) { return String(location.hash || ''); }
  }

  function personalRouteOpen() {
    var hash = decodedHash();
    return hash.indexOf('#/guid') === 0 || hash.indexOf('#/conversation/') === 0;
  }

  function ensurePersonalChat(host) {
    var root = document.getElementById('eva-personal-chat-surface');
    if (!root) {
      root = document.createElement('section');
      root.id = 'eva-personal-chat-surface';
      root.className = 'eva-personal-chat-surface';
      root.innerHTML = '<header class="eva-personal-chat-surface__head"><img src="' + escapeHTML(window.__EVA_COLLEAGUE_PORTRAIT || '') + '" alt=""><strong>Eva 同学</strong><span>个人助理</span></header><div class="eva-personal-chat-surface__stream"></div><div class="eva-personal-chat-surface__composer">输入消息、添加文件或继续追问…</div>';
    }
    if (host && root.parentElement !== host) host.appendChild(root);
    return root;
  }

  function personalMessageHTML(message) {
    var isUser = message.role === 'user';
    var avatar = isUser ? window.__EVA_CURRENT_USER_PORTRAIT : window.__EVA_COLLEAGUE_PORTRAIT;
    var name = isUser ? '王宜林' : 'Eva 同学';
    var quote = message.quote ? '<div class="eva-ai-mock-message__quote">' + escapeHTML(message.quote) + '</div>' : '';
    var file = message.file ? '<div class="eva-ai-mock-message__file">附件 · ' + escapeHTML(message.file) + '</div>' : '';
    var task = message.task ? '<div class="eva-ai-mock-message__task">' + escapeHTML(message.task) + '</div>' : '';
    return '<div class="eva-ai-mock-message' + (isUser ? ' is-user' : '') + '">' + (isUser ? '' : '<img class="eva-ai-mock-message__avatar" src="' + escapeHTML(avatar || '') + '" alt="">') + '<div class="eva-ai-mock-message__body"><div class="eva-ai-mock-message__meta"><span>' + escapeHTML(name) + '</span>' + '</div><div class="eva-ai-mock-message__bubble">' + quote + escapeHTML(message.text) + file + task + '</div></div>' + (isUser ? '<img class="eva-ai-mock-message__avatar" src="' + escapeHTML(avatar || '') + '" alt="">' : '') + '</div>';
  }

  function renderPersonalChat(title) {
    personalConversation = personalMessages[title] ? title : personalConversation;
    var root = ensurePersonalChat();
    if (root.dataset.conversation === personalConversation) return;
    var stream = root.querySelector('.eva-personal-chat-surface__stream');
    stream.innerHTML = '<div class="eva-ai-mock-thread">' + personalMessages[personalConversation].map(personalMessageHTML).join('') + '</div>';
    root.dataset.conversation = personalConversation;
  }

  function openAssistantEditor(options) {
    window.__evaOpenAssistantEditor(options);
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
    var editAssistant = event.target.closest('#eva-personal-history-column [data-eva-edit-assistant]');
    if (editAssistant) {
      event.preventDefault();
      var folder = editAssistant.closest('[data-eva-assistant-id]');
      openAssistantEditor({ mode: 'edit', id: folder.dataset.evaAssistantId, name: folder.dataset.evaAssistantName });
      return;
    }
    var createAssistant = event.target.closest('#eva-personal-history-column .eva-assistant-tree__create');
    if (createAssistant) {
      event.preventDefault();
      openAssistantEditor({ mode: 'create' });
      return;
    }
    var conversation = event.target.closest('#eva-personal-history-column .eva-assistant-conversation');
    var conversationTitle = conversation && conversation.dataset.conversationTitle;
    if (conversation && personalMessages[conversationTitle]) {
      personalConversation = conversationTitle;
      setTimeout(function () { renderPersonalChat(personalConversation); }, 0);
    }
    var legacyTab = event.target.closest('.eva-auto-tabs .eva-auto-tab');
    if (legacyTab) requestAnimationFrame(tuneLegacyAutomation);

  }, true);

  window.__evaNativePages.register('personal', function (host) {
    var root = ensurePersonalChat(host);
    root.hidden = false;
    renderPersonalChat(personalConversation);
    return function () {
      if (root.parentElement === host) root.remove();
    };
  });


  restoreConversationRailWidth();
  tuneLegacyAutomation();
})();
