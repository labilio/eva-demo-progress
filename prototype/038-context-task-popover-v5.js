
(function () {
  'use strict';

  var taskButtonOrigin = null;
  var taskCreateOrigin = null;
  var routeProjectId = null;
  var routeAttempts = 0;
  var routeTaskId = null;
  var routeTaskAttempts = 0;
  var routeConversationName = null;
  var conversationRouteAttempts = 0;
  var customTasksStorageKey = 'eva-context-my-tasks-v1';
  var currentUserName = '王宜林';
  var statusLabels = { todo: '待处理', in_progress: '进行中', in_review: '待验收', blocked: '已阻塞' };
  var tasksByConversation = {
    'EVA 产品改造': [
      { id: 'EVA-32', title: '重构全局消息层级', description: '保持项目、Channel 与 Thread 的消息上下文一致。', status: 'in_progress', priority: '高优先级', due: '今天 18:00' }
    ],
    '消息架构重构': [
      { id: 'EVA-35', title: '补齐项目任务的消息内入口', description: '在当前 Thread 中提供轻量的任务查看入口。', status: 'todo', priority: '中优先级', due: '明天' }
    ],
    '个人 / 协作双模式': [
      { id: 'EVA-28', title: '统一项目、Channel 与 Thread 命名', description: '收敛双模式下的导航口径和层级表达。', status: 'in_review', priority: '中优先级', due: '9 月 5 日' }
    ],
    '客户联合交付群': [
      { id: 'CLIENT-18', title: '准备客户试讲演示路径', description: '整理项目消息、任务与团队文件的完整演示路径。', status: 'in_progress', priority: '高优先级', due: '今天 17:30' }
    ],
    '本周试讲准备': [
      { id: 'CLIENT-19', title: '整理本周试讲检查清单', description: '确认演示账号、示例数据和讲解顺序。', status: 'todo', priority: '中优先级', due: '今天' }
    ],
    '权限与资料范围': [
      { id: 'CLIENT-21', title: '确认外部成员资料访问范围', description: '核对客户成员在项目与团队文件中的可见范围。', status: 'blocked', priority: '高优先级', due: '9 月 4 日' }
    ],
    '意见反馈': [
      { id: 'EVA-41', title: '整理双模式功能反馈', description: '汇总体验反馈并形成下一轮改进清单。', status: 'todo', priority: '中优先级', due: '9 月 6 日' }
    ],
    '团队文件功能设计群': [
      { id: 'DRIVE-7', title: '确认团队文件验收口径', description: '确认移动、复制、分享与权限异常的验收范围。', status: 'in_review', priority: '高优先级', due: '今天 16:00' },
      { id: 'DRIVE-8', title: '评审文件移动与复制交互', description: '检查同名冲突、跨项目移动和操作结果反馈。', status: 'todo', priority: '中优先级', due: '9 月 5 日' }
    ]
  };
  var taskConversationById = {
    'DRIVE-1': '团队文件功能设计群',
    'DRIVE-2': '团队文件功能设计群',
    'DRIVE-3': '团队文件功能设计群',
    'DRIVE-4': '团队文件功能设计群',
    'DRIVE-5': '团队文件功能设计群',
    'DRIVE-6': '团队文件功能设计群',
    'DRIVE-7': '团队文件功能设计群',
    'DRIVE-8': '团队文件功能设计群'
  };
  var customTasksByConversation = loadCustomTasks();

  function loadCustomTasks() {
    try {
      var stored = JSON.parse(localStorage.getItem(customTasksStorageKey) || '{}');
      return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
    } catch (error) {
      return {};
    }
  }

  function persistCustomTasks() {
    try {
      localStorage.setItem(customTasksStorageKey, JSON.stringify(customTasksByConversation));
    } catch (error) {}
  }

  function conversationTasks(contextName) {
    return (tasksByConversation[contextName] || []).concat(customTasksByConversation[contextName] || []);
  }

  function conversationForTaskId(taskId) {
    if (taskConversationById[taskId]) return taskConversationById[taskId];
    var names = Object.keys(tasksByConversation).concat(Object.keys(customTasksByConversation));
    for (var index = 0; index < names.length; index += 1) {
      var name = names[index];
      if (conversationTasks(name).some(function (task) { return task.id === taskId; })) return name;
    }
    return '';
  }

  function nextTaskId(contextName) {
    var localTasks = conversationTasks(contextName);
    var prefix = localTasks[0] && /^([A-Z]+)-\d+$/.test(localTasks[0].id) ? localTasks[0].id.split('-')[0] : 'TASK';
    var max = 0;
    Object.keys(tasksByConversation).concat(Object.keys(customTasksByConversation)).forEach(function (name) {
      conversationTasks(name).forEach(function (task) {
        var match = String(task.id || '').match(new RegExp('^' + prefix + '-(\\d+)$'));
        if (match) max = Math.max(max, Number(match[1]));
      });
    });
    return prefix + '-' + (max + 1);
  }

  function escapeHTML(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function icon(name) {
    var paths = {
      task: '<path d="M9 5h11M9 12h11M9 19h11"></path><path d="m3 5 1.5 1.5L7 3.5M3 12l1.5 1.5L7 10.5M3 19l1.5 1.5L7 17.5"></path>',
      plus: '<path d="M12 5v14M5 12h14"></path>',
      close: '<path d="M18 6 6 18M6 6l12 12"></path>'
    };
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (paths[name] || paths.task) + '</svg>';
  }

  function projectRegistry() {
    var defaults = window.__EVA_PROJECTS || [];
    try {
      var stored = JSON.parse(localStorage.getItem('eva-collab-spaces') || '[]');
      if (Array.isArray(stored) && stored.length) {
        var ids = new Set(stored.map(function (project) { return project.id; }));
        return stored.concat(defaults.filter(function (project) { return !ids.has(project.id); }));
      }
    } catch (error) {}
    return defaults;
  }

  function projectForTaskButton(button) {
    var projects = projectRegistry();
    var card = button.closest('.eva-space-card');
    var nameNode = card && card.querySelector('.wk-category-header__name');
    var name = nameNode ? nameNode.textContent.trim() : '';
    var match = projects.find(function (project) { return project.name === name; });
    if (match) return match;
    var buttons = Array.from(document.querySelectorAll('.eva-space-task-button'));
    return projects[buttons.indexOf(button)] || projects[0];
  }

  function projectTheme(project) {
    var accent = project && /^#[0-9a-f]{6}$/i.test(project.color || '') ? project.color : '#4f6bed';
    var surface = project && /^#[0-9a-f]{6,8}$/i.test(project.colorBg || '') ? project.colorBg : accent + '18';
    return { accent: accent, surface: surface };
  }

  function activeConversationSurface() {
    return document.querySelector('.eva-channel-surface[data-eva-channel-surface="project"]')
      || document.querySelector('.eva-msg');
  }

  function selectedConversationName() {
    var surface = activeConversationSurface();
    if (!surface) return '';
    var selected = surface.querySelector('.wk-conv-compact-item--selected .wk-conv-compact-name');
    if (selected) return selected.textContent.trim();
    var heading = surface.querySelector('.ch-head .wk-chat-conversation-header-channel');
    return heading ? heading.textContent.trim() : '';
  }

  function currentProject() {
    var projectName = document.querySelector('.collab-frame .collab-sp-chip .nm');
    var scope = document.querySelector('.eva-msg .ch-head__scope');
    var name = projectName ? projectName.textContent.trim() : '';
    if (!name) name = scope ? scope.textContent.trim() : '';
    return projectRegistry().find(function (project) { return project.name === name; }) || projectRegistry()[0];
  }

  function taskItemHTML(task, projectId) {
    var assignee = task.assignee
      ? '<span>·</span><span class="eva-context-task-popover__assignee-meta">我</span>'
      : '';
    return [
      '<button type="button" class="eva-context-task-popover__item" data-eva-context-task-id="' + escapeHTML(task.id) + '" data-eva-context-project-id="' + escapeHTML(projectId || '') + '" aria-label="打开任务 ' + escapeHTML(task.title) + '">',
        '<span class="eva-context-task-popover__item-icon">' + icon('task') + '</span>',
        '<div class="eva-context-task-popover__item-main">',
          '<div class="eva-context-task-popover__item-title"><strong>' + escapeHTML(task.title) + '</strong><span>' + escapeHTML(task.id) + '</span></div>',
          '<p>' + escapeHTML(task.description) + '</p>',
          '<div class="eva-context-task-popover__meta"><span class="eva-context-task-popover__status eva-context-task-popover__status--' + escapeHTML(task.status) + '">' + escapeHTML(statusLabels[task.status] || task.status) + '</span><span>·</span><span>' + escapeHTML(task.priority) + '</span><span>·</span><time>' + escapeHTML(task.due) + '</time>' + assignee + '</div>',
        '</div>',
      '</button>'
    ].join('');
  }

  function taskComposerHTML(contextName) {
    return [
      '<div class="wk-thread-modal eva-context-task-modal" role="dialog" aria-modal="true" aria-labelledby="eva-context-task-modal-title">',
        '<div class="wk-thread-modal-overlay" data-eva-context-task-cancel></div>',
        '<div class="wk-thread-modal-content">',
          '<div class="wk-thread-modal-header"><div class="wk-thread-modal-title" id="eva-context-task-modal-title">新建任务</div><button type="button" class="wk-thread-modal-close" data-eva-context-task-cancel aria-label="关闭新建任务">' + icon('close') + '</button></div>',
          '<div class="wk-thread-modal-body">',
            '<form class="wk-thread-create-form wk-thread-create-form--confirm" data-eva-context-task-form>',
              '<label class="wk-thread-create-form__label" for="eva-context-task-title">任务名称</label>',
              '<div class="wk-thread-create-form__input-row"><input id="eva-context-task-title" class="wk-thread-create-form__input" name="title" maxlength="60" required autocomplete="off" placeholder="输入需要跟进的待办"></div>',
              '<div class="wk-thread-create-form__meta"><span class="eva-context-task-modal__context">关联 ' + escapeHTML(contextName || '当前会话') + '</span><span class="wk-thread-create-form__counter" data-eva-context-task-counter>0 / 60</span></div>',
              '<label class="wk-thread-create-form__label eva-context-task-modal__secondary-label" for="eva-context-task-description">补充说明（可选）</label>',
              '<div class="wk-thread-create-form__input-row"><input id="eva-context-task-description" class="wk-thread-create-form__input" name="description" maxlength="160" autocomplete="off" placeholder="记录群聊背景或下一步"></div>',
              '<div class="eva-context-task-modal__assignee"><span class="eva-context-task-modal__assignee-avatar">我</span><div class="eva-context-task-modal__assignee-copy"><strong>' + escapeHTML(currentUserName) + '（我）</strong><span>默认负责人</span></div></div>',
              '<div class="wk-thread-create-form__footer"><button class="wk-thread-create-form__button wk-thread-create-form__button--cancel" type="button" data-eva-context-task-cancel>取消</button><button class="wk-thread-create-form__button wk-thread-create-form__button--submit" type="submit" disabled>创建</button></div>',
            '</form>',
          '</div>',
        '</div>',
      '</div>'
    ].join('');
  }

  function openTaskComposer(trigger) {
    if (document.querySelector('.eva-context-task-modal')) return;
    taskCreateOrigin = trigger;
    var contextName = selectedConversationName() || '当前会话';
    var theme = projectTheme(currentProject());
    document.body.insertAdjacentHTML('beforeend', taskComposerHTML(contextName));
    var modal = document.querySelector('.eva-context-task-modal');
    if (!modal) return;
    modal.style.setProperty('--eva-context-task-accent', theme.accent);
    modal.style.setProperty('--eva-context-task-surface', theme.surface);
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
    var title = modal.querySelector('[name="title"]');
    if (title) requestAnimationFrame(function () { title.focus(); });
  }

  function closeTaskComposer(restoreFocus) {
    var modal = document.querySelector('.eva-context-task-modal');
    var trigger = document.querySelector('[data-eva-context-task-create]');
    if (modal) modal.remove();
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus && taskCreateOrigin && taskCreateOrigin.isConnected) taskCreateOrigin.focus();
    taskCreateOrigin = null;
  }

  function createTask(form) {
    var titleField = form.querySelector('[name="title"]');
    var descriptionField = form.querySelector('[name="description"]');
    var title = titleField ? titleField.value.trim() : '';
    if (!title) {
      if (titleField) titleField.focus();
      return;
    }
    var contextName = selectedConversationName() || '当前会话';
    var task = {
      id: nextTaskId(contextName),
      title: title,
      description: descriptionField && descriptionField.value.trim() ? descriptionField.value.trim() : '来自当前群聊的个人跟进任务。',
      status: 'todo',
      priority: '中优先级',
      due: '待安排',
      assignee: currentUserName
    };
    if (!customTasksByConversation[contextName]) customTasksByConversation[contextName] = [];
    customTasksByConversation[contextName].push(task);
    persistCustomTasks();
    closeTaskComposer(false);
    renderPopover();
    ensureHeaderButton();
    requestAnimationFrame(function () {
      var created = document.querySelector('[data-eva-context-task-id="' + task.id + '"]');
      if (created) created.scrollIntoView({ block: 'nearest' });
    });
  }

  function closePopover(restoreFocus) {
    closeTaskComposer(false);
    var surface = activeConversationSurface();
    var popover = surface && surface.querySelector('.eva-context-task-popover');
    var button = surface && surface.querySelector('.eva-context-task-button');
    if (popover) popover.hidden = true;
    if (button) button.setAttribute('aria-expanded', 'false');
    if (restoreFocus && taskButtonOrigin && taskButtonOrigin.isConnected) taskButtonOrigin.focus();
    taskButtonOrigin = null;
  }

  function renderPopover() {
    var surface = activeConversationSurface();
    var main = surface && surface.querySelector('.ch-main');
    if (!main) return;
    var contextName = selectedConversationName();
    var tasks = conversationTasks(contextName);
    var project = currentProject();
    var theme = projectTheme(project);
    var popover = main.querySelector('.eva-context-task-popover');
    if (!popover) {
      popover = document.createElement('aside');
      popover.id = 'eva-context-task-popover';
      popover.className = 'ch-right-panel ch-right-panel--tasks eva-context-task-popover';
      popover.setAttribute('role', 'dialog');
      popover.setAttribute('aria-modal', 'false');
      main.appendChild(popover);
    }
    popover.style.setProperty('--eva-context-task-accent', theme.accent);
    popover.style.setProperty('--eva-context-task-surface', theme.surface);
    var content = tasks.length
      ? tasks.map(function (task) { return taskItemHTML(task, project && project.id); }).join('')
      : '<div class="eva-context-task-popover__empty"><div>' + icon('task') + '<strong>暂无分配给我的任务</strong><span>与当前 Channel / Thread 关联的任务会显示在这里</span></div></div>';
    popover.innerHTML = [
      '<div class="wk-thread-panel-header">',
        '<div class="wk-thread-panel-header-title">' + icon('task') + '<span>我的任务</span></div>',
        '<div class="wk-thread-panel-header-actions"><button type="button" class="wk-thread-panel-header-btn eva-context-task-popover__close" data-eva-context-task-close aria-label="关闭我的任务">' + icon('close') + '</button></div>',
      '</div>',
      '<button type="button" class="wk-thread-panel-create-btn eva-context-task-popover__create" data-eva-context-task-create aria-expanded="false">' + icon('plus') + '<span>新建任务</span></button>',
      '<div class="eva-context-task-popover__body">' + content + '</div>'
    ].join('');
    popover.hidden = false;
    var button = surface.querySelector('.eva-context-task-button');
    if (button) button.setAttribute('aria-expanded', 'true');
  }

  function ensureHeaderButton() {
    var surface = activeConversationSurface();
    var operations = surface && surface.querySelector('.ch-head .ops');
    if (!operations) return;
    var button = operations.querySelector('.eva-context-task-button');
    var contextName = selectedConversationName();
    var count = conversationTasks(contextName).length;
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'op eva-context-task-button';
      button.dataset.evaContextTaskButton = 'true';
      button.setAttribute('aria-controls', 'eva-context-task-popover');
      button.setAttribute('aria-expanded', 'false');
      operations.insertBefore(button, operations.firstChild);
    }
    var signature = contextName + '|' + count;
    if (button.dataset.evaContextTaskSignature !== signature) {
      button.title = '我的任务';
      button.setAttribute('aria-label', '我的任务' + (count ? '，' + count + ' 项' : ''));
      button.innerHTML = icon('task') + (count ? '<span class="eva-context-task-button__count">' + count + '</span>' : '');
      button.dataset.evaContextTaskSignature = signature;
    }
  }

  function updateTaskAssociations() {
    document.querySelectorAll('.loop-card').forEach(function (card) {
      var idNode = card.querySelector('.loop-card__id');
      var association = idNode && taskConversationById[idNode.textContent.trim()];
      var projectNode = card.querySelector('.loop-card__project');
      if (!association || !projectNode) return;
      if (projectNode.textContent.trim() !== association) projectNode.textContent = association;
      projectNode.classList.add('eva-loop-card__conversation');
      projectNode.title = '关联 Channel：' + association;
    });
  }

  function updateResourceLibraryLabels() {
    document.querySelectorAll('aside .collapsed-hidden').forEach(function (label) {
      if (['团队文件', '资料库'].indexOf(label.textContent.trim()) === -1) return;
      label.textContent = '文件库';
      var navItem = label.parentElement;
      if (navItem && ['团队文件', '资料库'].indexOf(navItem.getAttribute('title')) !== -1) navItem.setAttribute('title', '文件库');
    });
  }

  function updateTaskDetailConversationProperty() {
    var detail = document.querySelector('.loop-idp');
    var labelsRow = detail && detail.querySelector('.loop-idp__prop--labels');
    var taskIdNode = detail && detail.querySelector('.loop-idp__crumb-id');
    if (!detail || !labelsRow || !taskIdNode) return;
    var taskId = taskIdNode.textContent.trim();
    var conversationName = conversationForTaskId(taskId);
    var row = detail.querySelector('.eva-task-conversation-prop');
    if (!row) {
      row = document.createElement('div');
      row.className = 'loop-idp__prop loop-idp__prop--inline eva-task-conversation-prop';
      labelsRow.parentElement.insertBefore(row, labelsRow);
    }
    var signature = taskId + '|' + conversationName;
    if (row.dataset.evaConversationSignature !== signature) {
      row.dataset.evaConversationSignature = signature;
      row.innerHTML = conversationName
        ? '<span class="loop-idp__prop-k">关联群聊</span><button type="button" class="loop-idp__prop-edit loop-idp__prop-edit--text eva-task-conversation-link" data-eva-task-conversation-link="' + escapeHTML(conversationName) + '" title="打开群聊"><span>' + escapeHTML(conversationName) + '</span></button>'
        : '<span class="loop-idp__prop-k">关联群聊</span><button type="button" class="loop-idp__prop-edit loop-idp__prop-edit--text eva-task-conversation-link is-empty" disabled><span>未关联</span></button>';
    }
  }

  function settleConversationRoute() {
    if (!routeConversationName || conversationRouteAttempts > 30) {
      routeConversationName = null;
      return;
    }
    conversationRouteAttempts += 1;
    var surface = activeConversationSurface();
    var item = Array.from(surface ? surface.querySelectorAll('.wk-conv-compact-item') : []).find(function (candidate) {
      var name = candidate.querySelector('.wk-conv-compact-name');
      return name && name.textContent.trim() === routeConversationName;
    });
    if (item) {
      item.click();
      routeConversationName = null;
      return;
    }
    setTimeout(settleConversationRoute, 80);
  }

  function openAssociatedConversation(name) {
    if (!name) return;
    routeConversationName = name;
    conversationRouteAttempts = 0;
    var projectDetail = document.querySelector('.collab-frame .loop-idp');
    if (projectDetail) {
      var project = currentProject();
      if (project && typeof window.__evaOpenWorkspaceFromTree === 'function') {
        window.__evaOpenWorkspaceFromTree(project.id, 'channels');
      } else {
        var channelTab = Array.from(document.querySelectorAll('.collab-frame .collab-tab')).find(function (tab) {
          return tab.textContent.trim().replace(/\d+$/, '') === '群聊';
        });
        if (channelTab) channelTab.click();
      }
      setTimeout(settleConversationRoute, 80);
      return;
    }
    location.hash = '#/messages';
    setTimeout(settleConversationRoute, 80);
  }

  function settleProjectRoute() {
    if (!routeProjectId || routeAttempts > 30) {
      routeProjectId = null;
      return;
    }
    routeAttempts += 1;
    var project = projectRegistry().find(function (item) { return item.id === routeProjectId; });
    if (!project) {
      routeProjectId = null;
      return;
    }
    var frame = document.querySelector('.collab-frame');
    if (frame) {
      var taskTab = Array.from(frame.querySelectorAll('.collab-tab')).find(function (tab) {
        return tab.textContent.trim().replace(/\d+$/, '') === '任务';
      });
      if (taskTab) taskTab.click();
      routeProjectId = null;
      setTimeout(updateTaskAssociations, 80);
      if (routeTaskId) setTimeout(settleTaskRoute, 80);
      return;
    }
    var cards = Array.from(document.querySelectorAll('.eva-project-list-item, .eva-project-pinned-card, .collab-space-card'));
    var card = cards.find(function (item) {
      var name = item.querySelector('.name, .eva-project-list-title');
      return (name ? name.textContent : item.textContent).indexOf(project.name) >= 0;
    });
    if (card) card.click();
    setTimeout(settleProjectRoute, 80);
  }

  function taskForId(taskId) {
    var names = Object.keys(tasksByConversation).concat(Object.keys(customTasksByConversation));
    for (var index = 0; index < names.length; index += 1) {
      var task = conversationTasks(names[index]).find(function (candidate) { return candidate.id === taskId; });
      if (task) return task;
    }
    return null;
  }

  function registerProjectTask(projectId, projectName, task) {
    if (!projectId || !task || typeof window.__evaUpsertContextTask !== 'function') return;
    var numberMatch = String(task.id || '').match(/(\d+)$/);
    var priority = task.priority === '高优先级' ? 'high' : task.priority === '低优先级' ? 'low' : 'medium';
    window.__evaUpsertContextTask(projectId, {
      id: 'eva-context-' + String(task.id).toLowerCase(),
      workspace_id: projectId,
      number: numberMatch ? Number(numberMatch[1]) : Date.now(),
      identifier: task.id,
      title: task.title,
      description: task.description || null,
      status: task.status || 'todo',
      priority: priority,
      assignee_type: 'member',
      assignee_id: 'u-wangyilin',
      assignee_name: currentUserName,
      creator_id: 'u-wangyilin',
      creator_name: currentUserName,
      creator_avatar: window.__EVA_CURRENT_USER_PORTRAIT,
      project_id: projectId,
      project_name: projectName || null,
      position: numberMatch ? Number(numberMatch[1]) : Date.now(),
      created_at: '2026-09-03T09:00:00+08:00',
      updated_at: '2026-09-03T09:00:00+08:00'
    });
  }

  function settleTaskRoute() {
    if (!routeTaskId || routeTaskAttempts > 40) {
      routeTaskId = null;
      return;
    }
    routeTaskAttempts += 1;
    var detailId = document.querySelector('.loop-idp__crumb-id');
    if (detailId && detailId.textContent.trim() === routeTaskId) {
      routeTaskId = null;
      return;
    }
    var taskCard = Array.from(document.querySelectorAll('.loop-card')).find(function (card) {
      var idNode = card.querySelector('.loop-card__id');
      return idNode && idNode.textContent.trim() === routeTaskId;
    });
    if (taskCard) taskCard.click();
    setTimeout(settleTaskRoute, 80);
  }

  function openContextTask(item) {
    var taskId = item.dataset.evaContextTaskId || '';
    var project = projectRegistry().find(function (candidate) {
      return candidate.id === item.dataset.evaContextProjectId;
    }) || currentProject();
    var task = taskForId(taskId);
    if (!taskId || !project || !task) return;
    registerProjectTask(project.id, project.name, task);
    closePopover(false);
    routeProjectId = project.id;
    routeAttempts = 0;
    routeTaskId = taskId;
    routeTaskAttempts = 0;
    if (typeof window.__evaOpenWorkspaceFromTree === 'function') {
      window.__evaOpenWorkspaceFromTree(project.id, 'tasks');
    } else {
      location.hash = '#/collab';
    }
    setTimeout(settleProjectRoute, 80);
  }

  function openProjectTasks(button) {
    var project = projectForTaskButton(button);
    if (!project) return;
    closePopover(false);
    routeProjectId = project.id;
    routeAttempts = 0;
    if (typeof window.__evaOpenWorkspaceFromTree === 'function') {
      window.__evaOpenWorkspaceFromTree(project.id, 'tasks');
    } else {
      location.hash = '#/collab';
    }
    setTimeout(settleProjectRoute, 80);
  }

  document.addEventListener('click', function (event) {
    var contextTaskItem = event.target.closest('[data-eva-context-task-id]');
    if (contextTaskItem) {
      event.preventDefault();
      event.stopPropagation();
      openContextTask(contextTaskItem);
      return;
    }

    var conversationLink = event.target.closest('[data-eva-task-conversation-link]');
    if (conversationLink) {
      event.preventDefault();
      event.stopPropagation();
      openAssociatedConversation(conversationLink.dataset.evaTaskConversationLink || '');
      return;
    }

    var projectTaskButton = event.target.closest('.eva-space-task-button');
    if (projectTaskButton) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openProjectTasks(projectTaskButton);
      return;
    }

    var taskButton = event.target.closest('[data-eva-context-task-button]');
    if (taskButton) {
      event.preventDefault();
      event.stopPropagation();
      taskButtonOrigin = taskButton;
      var popover = document.querySelector('.eva-context-task-popover');
      if (popover && !popover.hidden) closePopover(true);
      else {
        var surface = activeConversationSurface();
        var activeNativePanelButtons = Array.from(surface ? surface.querySelectorAll('.ch-head .op.is-on') : []).filter(function (button) {
          return button !== taskButton;
        });
        activeNativePanelButtons.forEach(function (button) { button.click(); });
        requestAnimationFrame(renderPopover);
      }
      return;
    }

    if (event.target.closest('[data-eva-context-task-close]')) {
      event.preventDefault();
      event.stopPropagation();
      closePopover(true);
      return;
    }

    if (event.target.closest('[data-eva-context-task-create]')) {
      event.preventDefault();
      event.stopPropagation();
      openTaskComposer(event.target.closest('[data-eva-context-task-create]'));
      return;
    }

    if (event.target.closest('[data-eva-context-task-cancel]')) {
      event.preventDefault();
      event.stopPropagation();
      closeTaskComposer(true);
      return;
    }

    if (event.target.closest('.eva-context-task-modal')) return;

    if (!event.target.closest('.eva-context-task-popover')) closePopover(false);
  }, true);

  document.addEventListener('submit', function (event) {
    var form = event.target.closest('[data-eva-context-task-form]');
    if (!form) return;
    event.preventDefault();
    event.stopPropagation();
    createTask(form);
  }, true);

  document.addEventListener('input', function (event) {
    var title = event.target.closest('.eva-context-task-modal [name="title"]');
    if (!title) return;
    var modal = title.closest('.eva-context-task-modal');
    var counter = modal.querySelector('[data-eva-context-task-counter]');
    var submit = modal.querySelector('[type="submit"]');
    if (counter) counter.textContent = title.value.length + ' / 60';
    if (submit) submit.disabled = !title.value.trim();
  }, true);

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && document.querySelector('.eva-context-task-modal')) {
      event.preventDefault();
      closeTaskComposer(true);
      return;
    }
    if (event.key === 'Escape' && document.querySelector('.eva-context-task-popover:not([hidden])')) {
      event.preventDefault();
      closePopover(true);
    }
  });

  var queued = false;
  function scheduleEnhance() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      ensureHeaderButton();
      updateTaskAssociations();
      updateResourceLibraryLabels();
      updateTaskDetailConversationProperty();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleEnhance, { once: true });
  else scheduleEnhance();
  new MutationObserver(scheduleEnhance).observe(document.documentElement, { childList: true, subtree: true });
})();
