
(function () {
  'use strict';

  var DEFAULT_SPACE_NAMES = (window.__EVA_PROJECTS || []).map(function (project) { return project.name; });
  var SPACE_TONES = {
    'EVA Official Space': 'official',
    '供应链运营协同': 'product',
    '客户联合交付': 'delivery',
    '团队文件功能设计': 'drive'
  };
  var SPACE_IDS = (window.__EVA_PROJECTS || []).reduce(function (ids, project) {
    ids[project.name] = project.id;
    return ids;
  }, {});

  function projectRegistry() {
    var defaults = window.__EVA_PROJECTS || [];
    try {
      var stored = JSON.parse(localStorage.getItem('eva-collab-spaces') || '[]');
      if (Array.isArray(stored) && stored.length) {
        var storedIds = new Set(stored.map(function (project) { return project.id; }));
        return stored.concat(defaults.filter(function (project) { return !storedIds.has(project.id); }));
      }
    } catch (error) {}
    return defaults;
  }

  function projectTheme(project) {
    var accent = project && /^#[0-9a-f]{6}$/i.test(project.color || '') ? project.color : '#59636d';
    var surface = project && /^#[0-9a-f]{6,8}$/i.test(project.colorBg || '') ? project.colorBg : accent + '18';
    return {
      accent: accent,
      surface: surface,
      border: accent + '2e',
      noticeSurface: surface,
      noticeText: accent
    };
  }

  function overviewProjectTheme(spaceId, spaceName) {
    var projects = projectRegistry();
    var project = projects.find(function (item) { return item.id === spaceId; }) || projects.find(function (item) { return item.name === spaceName; });
    return projectTheme(project);
  }

  function projectThemeCSS(theme) {
    return '--eva-space-card-surface:' + theme.surface + ';--eva-space-card-accent:' + theme.accent + ';--eva-space-card-border:' + theme.border + ';--eva-space-card-notice-surface:' + theme.noticeSurface + ';--eva-space-card-notice-text:' + theme.noticeText + ';';
  }

  function applyProjectTheme(element, project) {
    if (!element) return;
    var theme = projectTheme(project);
    element.style.setProperty('--eva-space-card-surface', theme.surface);
    element.style.setProperty('--eva-space-card-accent', theme.accent);
    element.style.setProperty('--eva-space-card-border', theme.border);
    element.style.setProperty('--eva-space-card-notice-surface', theme.noticeSurface);
    element.style.setProperty('--eva-space-card-notice-text', theme.noticeText);
  }
  var spaceTreeExpanded = true;
  var overviewDetailOrigin = null;

  var MESSAGE_ACTION_ICONS = {
    reply: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"></path><path d="M8 10h.01M12 10h.01M16 10h.01"></path>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>',
    forward: '<path d="m15 17 5-5-5-5"></path><path d="M4 18v-2a4 4 0 0 1 4-4h12"></path>',
    multi: '<path d="M11 12H3M16 6H3M16 18H3"></path><path d="m16 12 2 2 4-4"></path>',
    revoke: '<path d="M9 14 4 9l5-5"></path><path d="M4 9h11a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5H9"></path>',
    createThread: '<path d="M8 12h.01M12 12h.01M16 12h.01"></path><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"></path><path d="M19 2v4M17 4h4"></path>',
    driveNav: '<path d="M10 16h.01"></path><path d="M2.212 11.577a2 2 0 0 0-.212.896V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5.527a2 2 0 0 0-.212-.896L18.55 5.11A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path><path d="M21.946 12.013H2.054"></path><path d="M6 16h.01"></path>'
  };

  function messageActionIcon(name, className) {
    var iconBody = window.EvaFileMessage.iconBody(name) || MESSAGE_ACTION_ICONS[name] || '';
    return '<svg class="' + (className || '') + '" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + iconBody + '</svg>';
  }

  function directText(element) {
    if (!element) return '';
    return String(element.textContent || '').trim();
  }

  function labelText(element) {
    if (!element) return '';
    var node = Array.from(element.childNodes).find(function (item) {
      return item.nodeType === Node.TEXT_NODE && String(item.textContent || '').trim();
    });
    return node ? String(node.textContent || '').trim() : directText(element);
  }

  function nativeNavItem(container, label) {
    if (!container) return null;
    return Array.from(container.children).find(function (child) {
      return Array.from(child.querySelectorAll('span')).some(function (span) {
        return directText(span) === label;
      });
    }) || null;
  }

  function replaceDriveNavWithNativeClone() {
    var driveNav = document.getElementById('eva-drive-nav');
    if (!driveNav || driveNav.dataset.evaNativeClone === 'true') return driveNav;
    var container = driveNav.parentElement;
    var template = nativeNavItem(container, '消息') || nativeNavItem(container, '项目') || nativeNavItem(container, '空间');
    if (!template || template === driveNav) return driveNav;

    var clone = template.cloneNode(true);
    clone.id = 'eva-drive-nav';
    clone.dataset.evaAction = 'drive';
    clone.dataset.evaNativeClone = 'true';
    clone.classList.remove('eva-native-nav-suppressed', 'is-active');
    clone.removeAttribute('aria-current');
    clone.removeAttribute('aria-selected');
    clone.querySelectorAll('[id]').forEach(function (node) { node.removeAttribute('id'); });

    var labelNode = Array.from(clone.querySelectorAll('span')).reverse().find(function (span) {
      var text = directText(span);
      return text === '消息' || text === '项目' || text === '空间' || text === '协作空间';
    });
    if (labelNode) labelNode.textContent = '团队文件';

    var svg = clone.querySelector('svg');
    if (svg) {
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
      svg.innerHTML = MESSAGE_ACTION_ICONS.driveNav;
    }

    driveNav.replaceWith(clone);
    return clone;
  }

  function overviewIsOpen() {
    var root = document.getElementById('eva-collab-overview-root');
    return Boolean(root && !root.hidden);
  }

  function overviewIcon(name) {
    var paths = {
      project: '<path d="M4 5h6l2 3h8v11H4z"></path><path d="M8 12v3M12 11v4M16 10v5"></path>',
      task: '<rect x="3" y="5" width="6" height="6" rx="1"></rect><path d="m5 8 1 1 2-2M13 8h8M3 16h6M13 16h8"></path>',
      expert: '<path d="M12 8V4H8"></path><rect x="4" y="8" width="16" height="12" rx="2"></rect><path d="M2 14h2M20 14h2M9 13v2M15 13v2"></path>',
      squad: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>',
      skill: '<path d="m13 2-2 7h6l-8 13 2-9H5z"></path>',
      automation: '<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path><circle cx="12" cy="12" r="3"></circle>',
      message: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"></path>',
      file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path>',
      drive: '<path d="M10 16h.01"></path><path d="M2.212 11.577a2 2 0 0 0-.212.896V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5.527a2 2 0 0 0-.212-.896L18.55 5.11A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path><path d="M21.946 12.013H2.054"></path><path d="M6 16h.01"></path>',
      member: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M19 8v6M22 11h-6"></path>',
      space: '<rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect>',
      result: '<path d="M20 6 9 17l-5-5"></path>',
      close: '<path d="M18 6 6 18M6 6l12 12"></path>',
      arrow: '<path d="m9 18 6-6-6-6"></path>',
      plus: '<path d="M12 5v14M5 12h14"></path>'
    };
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (paths[name] || '') + '</svg>';
  }

  var overviewEvents = [
    {
      id: 'evt-mention',
      kind: 'mention',
      filter: 'mention',
      actor: '供应链负责人王总',
      avatarId: 'overview-wang',
      avatarTone: 'person',
      statement: [
        '在群聊',
        { objectType: '群聊', label: '采购与招投标', icon: 'message' },
        '中提到了你'
      ],
      preview: '“今天 18:00 前确认高风险需求，明早进入招投标评审。”',
      spaceId: 'prod',
      spaceName: '供应链运营协同',
      spaceTone: 'product',
      objectName: '群聊 · 采购与招投标',
      occurredAt: '8 分钟前',
      target: { objectType: 'message', objectId: 'c-eva', messageId: 'msg-wang-demo-request', label: '采购与招投标' },
      presentationId: 'evt-mention',
      actions: [
        { action: 'messages', label: '查看消息', icon: 'message' }
      ]
    },
    {
      id: 'evt-assignment',
      kind: 'assignment',
      filter: 'assignment',
      actor: '采购经理林晓',
      avatarId: 'overview-lin-owner',
      avatarTone: 'member',
      statement: [
        '把任务',
        { objectType: '任务', label: '完成本季度间接采购需求归集', icon: 'task' },
        '指派给你'
      ],
      spaceId: 'prod',
      spaceName: '供应链运营协同',
      spaceTone: 'product',
      objectName: '任务 · 完成本季度间接采购需求归集',
      occurredAt: '16 分钟前',
      target: { objectType: 'task', objectId: 'supply-1', taskId: 'supply-1', section: 'tasks' },
      actions: [
        { action: 'tasks', label: '查看任务', icon: 'task' }
      ]
    },
    {
      id: 'evt-review',
      kind: 'review',
      filter: 'review',
      actor: 'SQE运营专家',
      avatarId: 'expert-prototype-review',
      avatarTone: 'expert',
      isAI: true,
      statement: [
        '提交了任务',
        { objectType: '任务', label: '处理关键供应商来料质量异常', icon: 'task' },
        '的研判结果，发现 3 个待验证项，等待你验收'
      ],
      spaceId: 'prod',
      spaceName: '供应链运营协同',
      spaceTone: 'product',
      objectName: '任务 · 处理关键供应商来料质量异常',
      occurredAt: '24 分钟前',
      target: { objectType: 'task-review', objectId: 'supply-2', taskId: 'supply-2', section: 'tasks' },
      presentationId: 'evt-review',
      actions: [
        { action: 'tasks', label: '前往验收', icon: 'result' }
      ]
    },
    {
      id: 'evt-waiting-input',
      kind: 'waiting_input',
      filter: 'assignment',
      actor: '交付专家团',
      avatarId: 'group-delivery-experts',
      avatarTone: 'squad',
      isAI: true,
      statement: [
        '生成任务',
        { objectType: '任务', label: '本周客户试讲', icon: 'task' },
        '的材料时，发现缺少最新试讲背景'
      ],
      spaceId: 'client',
      spaceName: '客户联合交付',
      spaceTone: 'delivery',
      objectName: '任务 · 本周客户试讲',
      occurredAt: '31 分钟前',
      target: { objectType: 'task', objectId: 'task-client-trial', taskId: 'task-client-trial', section: 'tasks' },
      actions: [
        { action: 'tasks', label: '查看任务', icon: 'task' }
      ]
    },
    {
      id: 'evt-task-file',
      kind: 'task_file',
      filter: 'task_file',
      actor: '客户项目经理苏航',
      avatarId: 'u-suhang',
      avatarTone: 'member',
      statement: [
        '把文件',
        { objectType: '文件', label: '客户高管试讲反馈-终版.docx', icon: 'file' },
        '上传到你负责的任务',
        { objectType: '任务', label: '高管试讲准备', icon: 'task' }
      ],
      spaceId: 'client',
      spaceName: '客户联合交付',
      spaceTone: 'delivery',
      objectName: '任务 · 高管试讲准备',
      occurredAt: '42 分钟前',
      target: { objectType: 'task-file', objectId: 'task-executive-demo', taskId: 'task-executive-demo', fileId: 'file-executive-demo-final', section: 'tasks' },
      actions: [
        { action: 'tasks', label: '查看文件', icon: 'file' }
      ]
    },
    {
      id: 'evt-membership-request',
      kind: 'membership_request',
      filter: 'system',
      actor: '客户项目负责人陈总',
      avatarId: 'client-manager-chen',
      avatarTone: 'member',
      statement: [
        '申请加入 Space',
        { objectType: 'Space', label: '客户联合交付', icon: 'space' }
      ],
      spaceId: 'client',
      spaceName: '客户联合交付',
      spaceTone: 'delivery',
      objectName: '成员 · 加入申请',
      occurredAt: '50 分钟前',
      target: { objectType: 'membership-request', objectId: 'membership-client-manager-chen', section: 'members' },
      actions: [
        { action: 'workspace', label: '查看加入申请', icon: 'member' }
      ]
    },
    {
      id: 'evt-skill-authorization',
      kind: 'skill_authorization',
      filter: 'system',
      actor: '交付专家团',
      avatarId: 'group-delivery-experts',
      avatarTone: 'squad',
      isAI: true,
      statement: [
        '因技能',
        { objectType: '技能', label: '客户数据分析', icon: 'skill' },
        '尚未授权，已暂停生成试讲材料'
      ],
      spaceId: 'client',
      spaceName: '客户联合交付',
      spaceTone: 'delivery',
      objectName: '技能 · 客户数据分析',
      occurredAt: '1 小时前',
      target: { objectType: 'skill-authorization', objectId: 'skill-client-data-analysis', section: 'skills' },
      actions: [
        { action: 'skills', label: '查看授权请求', icon: 'skill' }
      ]
    },
    {
      id: 'evt-automation-failure',
      kind: 'automation_failure',
      filter: 'system',
      actor: '客户日报自动化',
      avatarId: 'automation-client-daily',
      avatarTone: 'automation',
      isAI: true,
      statement: [
        '自动化',
        { objectType: '自动化', label: '客户日报汇总', icon: 'automation' },
        '连续第 2 次运行失败，明早 9:00 的高管日报可能无法生成'
      ],
      spaceId: 'client',
      spaceName: '客户联合交付',
      spaceTone: 'delivery',
      objectName: '自动化 · 客户日报汇总',
      occurredAt: '今天 09:30',
      target: { objectType: 'automation-run', objectId: 'automation-client-daily', runId: 'run-client-daily-latest', section: 'automation' },
      actions: [
        { action: 'automation', label: '查看运行记录', icon: 'automation' }
      ]
    }
  ];

  var overviewNoticeEvents = [
    {
      id: 'evt-notice-member-left',
      kind: 'member_left',
      filter: 'system',
      actor: '客户项目负责人陈总',
      avatarId: 'overview-client-chen-left',
      avatarTone: 'member',
      statement: [
        '已退出 Space',
        { objectType: 'Space', label: '客户联合交付', icon: 'space' }
      ],
      preview: '其成员权限已自动收回，历史任务与协作记录仍保留。',
      spaceId: 'client',
      spaceName: '客户联合交付',
      spaceTone: 'delivery',
      objectName: '成员变动 · 陈总退出 Space',
      occurredAt: '12 分钟前',
      actions: []
    },
    {
      id: 'evt-notice-member-joined',
      kind: 'member_joined',
      filter: 'system',
      actor: '高志远',
      avatarId: 'overview-gao-joined',
      avatarTone: 'member',
      statement: [
        '已接受邀请并加入 Space',
        { objectType: 'Space', label: '供应链运营协同', icon: 'space' }
      ],
      preview: '现在可以访问该 Space 中对成员开放的项目、任务与文件。',
      spaceId: 'prod',
      spaceName: '供应链运营协同',
      spaceTone: 'product',
      objectName: '成员变动 · 高志远加入 Space',
      occurredAt: '今天 09:18',
      actions: []
    }
  ];

  var overviewProcessedEvents = [
    {
      id: 'evt-processed-reply',
      kind: 'mention',
      filter: 'mention',
      actor: '你',
      avatarId: 'u-current-user',
      avatarTone: 'person',
      statement: [
        '已回复群聊',
        { objectType: '群聊', label: '采购与招投标', icon: 'message' }
      ],
      spaceId: 'prod',
      spaceName: '供应链运营协同',
      spaceTone: 'product',
      objectName: '群聊 · 采购与招投标',
      occurredAt: '今天 13:42',
      target: { objectType: 'message', objectId: 'c-eva', messageId: 'msg-wang-demo-request', label: '采购与招投标' },
      presentationId: 'evt-mention',
      resolution: { label: '已回复', icon: 'result', tone: 'positive' },
      actions: [
        { action: 'messages', label: '查看消息', icon: 'message' }
      ]
    },
    {
      id: 'evt-processed-review',
      kind: 'review',
      filter: 'review',
      actor: '你',
      avatarId: 'u-current-user-review',
      avatarTone: 'person',
      statement: [
        '已验收任务',
        { objectType: '任务', label: '处理关键供应商来料质量异常', icon: 'task' }
      ],
      spaceId: 'prod',
      spaceName: '供应链运营协同',
      spaceTone: 'product',
      objectName: '任务 · 处理关键供应商来料质量异常',
      occurredAt: '今天 11:20',
      target: { objectType: 'task-review', objectId: 'supply-2', taskId: 'supply-2', section: 'tasks' },
      presentationId: 'evt-review',
      resolution: { label: '已验收', icon: 'result', tone: 'positive' },
      actions: [
        { action: 'tasks', label: '查看评审', icon: 'result' }
      ]
    },
    {
      id: 'evt-processed-member',
      kind: 'membership_request',
      filter: 'system',
      actor: '你',
      avatarId: 'u-current-user-member',
      avatarTone: 'person',
      statement: [
        '已同意项目总监王总加入 Space',
        { objectType: 'Space', label: '客户联合交付', icon: 'space' }
      ],
      spaceId: 'client',
      spaceName: '客户联合交付',
      spaceTone: 'delivery',
      objectName: '成员申请 · 项目总监王总',
      occurredAt: '今天 16:18',
      target: { objectType: 'membership-request', objectId: 'membership-project-director-wang', section: 'members' },
      presentationId: 'evt-membership-request',
      resolution: { label: '已同意', icon: 'result', tone: 'positive' },
      actions: [
        { action: 'workspace', label: '查看申请', icon: 'member' }
      ]
    },
    {
      id: 'evt-processed-daily-report',
      kind: 'assignment',
      filter: 'assignment',
      actor: '你',
      avatarId: 'u-current-user-report',
      avatarTone: 'person',
      statement: [
        '已验收供应链合同管理专家提交的任务',
        { objectType: '任务', label: '完成到期采购合同续签检查', icon: 'task' },
        '续签清单和处理建议已归档'
      ],
      spaceId: 'prod',
      spaceName: '供应链运营协同',
      spaceTone: 'product',
      objectName: '任务 · 完成到期采购合同续签检查',
      occurredAt: '今天 17:46',
      target: { objectType: 'task', objectId: 'supply-7', taskId: 'supply-7', section: 'tasks' },
      presentationId: 'evt-processed-daily-report',
      resolution: { label: '已完成', icon: 'result', tone: 'positive' },
      actions: [
        { action: 'tasks', label: '查看任务', icon: 'task' }
      ]
    }
  ];

  var overviewTargets = {
    'evt-mention': {
      icon: 'message', eyebrow: '供应链运营协同 · 群聊', title: '采购与招投标',
      description: '供应链负责人王总在这条消息中提到了你。',
      facts: [
        { label: '消息', value: '今天 18:00 前确认高风险需求，明早进入招投标评审。' },
        { label: '发送人', value: '供应链负责人王总' }
      ],
      panel: {
        label: '回复消息', title: '直接回复到对应群聊',
        text: '回复会发送到「采购与招投标」，不会回到宽泛的消息页。',
        mode: 'composer', placeholder: '回复供应链负责人王总…', primaryLabel: '发送回复', primaryResultTone: 'success'
      }
    },
    'evt-assignment': {
      icon: 'task', eyebrow: '供应链运营协同 · 任务 SC-101', title: '完成本季度间接采购需求归集',
      description: '合并行政、IT 和设备维保需求，确认数量、预算、交期与待补信息。',
      facts: [
        { label: '负责人', value: '你' },
        { label: '状态', value: '待开始' },
        { label: '截止时间', value: '今天 18:00' }
      ],
      panel: {
        label: '任务讨论', title: '从这里继续推进',
        text: '任务说明、执行过程、附件和讨论都沉淀在同一任务中。',
        mode: 'actions', primaryLabel: '开始处理', secondaryLabel: '打开任务讨论', primaryResultTone: 'info'
      }
    },
    'evt-review': {
      icon: 'result', eyebrow: '供应链运营协同 · 任务 SC-103', title: '处理关键供应商来料质量异常',
      description: 'SQE运营专家已提交批次 A-2409 的异常研判结果，等待你验收。',
      facts: [
        { label: '交付者', value: 'SQE运营专家' },
        { label: '交付物', value: 'A-2409来料异常分析报告' },
        { label: '发现', value: '3 个待验证项' }
      ],
      panel: {
        label: '验收区', title: '检查交付物并给出结论',
        text: '验收通过后任务进入完成态；退回时继续沿用这条任务的讨论和附件。',
        mode: 'actions', primaryLabel: '验收通过', secondaryLabel: '退回补充', primaryResultTone: 'success'
      }
    },
    'evt-waiting-input': {
      icon: 'plus', eyebrow: '客户联合交付 · 任务 EVA-51', title: '本周客户试讲',
      description: '交付专家团执行到资料准备阶段时暂停，正在等待你的输入。',
      facts: [
        { label: '当前步骤', value: '整理客户背景' },
        { label: '缺少内容', value: '最新试讲对象、关注议题和现场时长' },
        { label: '执行者', value: '交付专家团' }
      ],
      tone: 'warning',
      panel: {
        label: '需要你补充', title: '补齐试讲背景后继续执行',
        text: '可以输入说明，也可以上传客户资料；补充内容会留在任务上下文中。',
        mode: 'composer', placeholder: '例如：试讲对象为事业部总经理，重点关注交付周期…',
        primaryLabel: '提交补充', secondaryLabel: '上传文件', primaryResultTone: 'success'
      }
    },
    'evt-task-file': {
      icon: 'drive', eyebrow: '客户联合交付 · 云盘', title: '客户高管试讲反馈-终版.docx',
      description: '这个文件从任务「高管试讲准备」上传，正本归属客户联合交付 Space。',
      facts: [
        { label: '位置', value: '客户联合交付 / 高管试讲准备' },
        { label: '上传人', value: '客户项目经理苏航' },
        { label: '更新时间', value: '42 分钟前' }
      ],
      panel: {
        label: '文件预览', title: '客户高管试讲反馈',
        text: '文档预览、评论与下载共用同一个 Space 文件对象和权限。',
        mode: 'preview', primaryLabel: '在云盘中打开', secondaryLabel: '下载', primaryResultTone: 'info'
      }
    },
    'evt-membership-request': {
      icon: 'member', eyebrow: '客户联合交付 · 加入申请', title: '客户项目负责人陈总',
      description: '陈总申请加入客户联合交付 Space，等待具有成员管理权限的人审批。',
      facts: [
        { label: '申请人', value: '客户项目负责人陈总' },
        { label: '申请理由', value: '参与本周高管试讲准备与交付验收' },
        { label: '申请时间', value: '50 分钟前' }
      ],
      panel: {
        label: '成员审批', title: '确认后将获得 Space 成员权限',
        text: '加入后可访问该 Space 中对成员开放的项目、任务、群聊和文件。',
        mode: 'actions', primaryLabel: '同意加入', secondaryLabel: '拒绝', primaryResultTone: 'success'
      }
    },
    'evt-skill-authorization': {
      icon: 'skill', eyebrow: '客户联合交付 · 授权请求 AUTH-07', title: '允许交付专家团使用客户数据分析？',
      description: '任务「本周客户试讲」需要读取本 Space 中已选定的客户资料。',
      facts: [
        { label: '申请者', value: '交付专家团' },
        { label: '使用范围', value: '客户联合交付 Space · 已选文件' },
        { label: '有效时间', value: '仅本次任务' }
      ],
      panel: {
        label: '授权范围', title: '只允许完成这次任务所需的访问',
        text: '不会开放你的个人文件、本机目录或其他 Space；每次执行记录触发者和使用范围。',
        mode: 'actions', primaryLabel: '允许本次使用', secondaryLabel: '拒绝', primaryResultTone: 'success'
      }
    },
    'evt-automation-failure': {
      icon: 'automation', eyebrow: '客户联合交付 · 自动化运行 RUN-1024', title: '客户日报汇总',
      description: '今天 09:30 的运行在读取试讲反馈时失败，这是连续第 2 次失败。',
      facts: [
        { label: '失败步骤', value: '读取客户高管试讲反馈' },
        { label: '影响', value: '明早 9:00 的高管日报可能无法生成' },
        { label: '下次运行', value: '明天 08:30' }
      ],
      tone: 'error',
      panel: {
        label: '运行记录', title: '文件读取超时',
        text: '系统保留了本次输入和已完成步骤，可以修复后从失败处重新运行。',
        mode: 'actions', primaryLabel: '重新运行', secondaryLabel: '查看完整日志', primaryResultTone: 'info'
      }
    },
    'evt-processed-daily-report': {
      icon: 'task', eyebrow: '供应链运营协同 · 任务 SC-107', title: '完成到期采购合同续签检查',
      description: '三份到期合同的续签检查和处理建议已经提交，任务当前处于已完成状态。',
      facts: [
        { label: '负责人', value: '你' },
        { label: '执行者', value: '供应链合同管理专家' },
        { label: '完成时间', value: '今天 17:46' }
      ],
      panel: {
        label: '完成结果', title: '合同续签检查清单已提交',
        text: '履约情况、价格调整、续签期限和终止条件继续保留在该任务中。',
        mode: 'preview', primaryLabel: '查看续签清单', secondaryLabel: '下载', primaryResultTone: 'info'
      }
    }
  };

  function overviewStatementHTML(item) {
    return item.statement.map(function (part) {
      if (typeof part === 'string') {
        return '<span class="eva-overview-event__statement-text">' + part + '</span>';
      }
      return '<span class="eva-overview-event__statement-text">「' + part.label + '」</span>';
    }).join('');
  }

  function overviewAvatarUri(item) {
    var kind = item.avatarTone === 'squad' ? 'group' : item.avatarTone === 'automation' ? 'automation' : 'person';
    var colors = { group: '#6f827a', automation: '#8f7869' };
    return window.EvaAvatar.uri({ kind: kind, id: item.avatarId, color: colors[kind] });
  }

  function overviewDetailFactsHTML(target) {
    return target.facts.map(function (fact) {
      return '<div class="eva-overview-detail__fact"><dt>' + fact.label + '</dt><dd>' + fact.value + '</dd></div>';
    }).join('');
  }

  function overviewDetailInteractionHTML(panel) {
    var composer = panel.mode === 'composer'
      ? '<textarea class="eva-overview-detail__composer" rows="4" placeholder="' + panel.placeholder + '" aria-label="' + panel.label + '"></textarea>'
      : '';
    var preview = panel.mode === 'preview'
      ? '<div class="eva-overview-detail__preview"><strong>试讲反馈摘要</strong><p>建议将方案说明压缩到 10 分钟，并增加客户数据边界与失败恢复的演示。</p><span>客户反馈 · 第 2 页</span></div>'
      : '';
    var secondary = panel.secondaryLabel
      ? '<button type="button" class="eva-overview-detail__button eva-overview-detail__button--secondary" data-eva-overview-detail-action="secondary">' + panel.secondaryLabel + '</button>'
      : '';
    return [
      composer,
      preview,
      '<div class="eva-overview-detail__actions">',
        secondary,
        '<button type="button" class="eva-overview-detail__button eva-overview-detail__button--primary" data-eva-overview-detail-action="primary">' + panel.primaryLabel + '</button>',
      '</div>',
      '<p class="eva-overview-detail__result" data-eva-overview-detail-result role="status" hidden></p>'
    ].join('');
  }

  function ensureOverviewDetail() {
    var detail = document.getElementById('eva-overview-detail');
    if (detail) return detail;
    detail = document.createElement('div');
    detail.id = 'eva-overview-detail';
    detail.className = 'eva-overview-detail';
    detail.hidden = true;
    detail.innerHTML = [
      '<div class="eva-overview-detail__backdrop" data-eva-overview-detail-close></div>',
      '<section class="eva-overview-detail__dialog" role="dialog" aria-modal="true" aria-labelledby="eva-overview-detail-title">',
        '<header class="eva-overview-detail__header">',
          '<div class="eva-overview-detail__heading">',
            '<span class="eva-overview-detail__icon" data-eva-overview-detail-icon></span>',
            '<div><span class="eva-overview-detail__eyebrow" data-eva-overview-detail-eyebrow></span><h2 id="eva-overview-detail-title" data-eva-overview-detail-title></h2></div>',
          '</div>',
          '<button type="button" class="eva-overview-detail__close" data-eva-overview-detail-close aria-label="关闭详情">' + overviewIcon('close') + '</button>',
        '</header>',
        '<div class="eva-overview-detail__body">',
          '<p class="eva-overview-detail__description" data-eva-overview-detail-description></p>',
          '<dl class="eva-overview-detail__facts" data-eva-overview-detail-facts></dl>',
          '<section class="eva-overview-detail__panel">',
            '<span class="eva-overview-detail__panel-label" data-eva-overview-detail-panel-label></span>',
            '<h3 data-eva-overview-detail-panel-title></h3>',
            '<p data-eva-overview-detail-panel-text></p>',
            '<div data-eva-overview-detail-interaction></div>',
          '</section>',
        '</div>',
      '</section>'
    ].join('');
    document.body.appendChild(detail);
    return detail;
  }

  function openOverviewDetail(item, origin) {
    if (!item || !item.target) return;
    var detail = ensureOverviewDetail();
    var target = item.target;
    overviewDetailOrigin = origin || document.activeElement;
    detail.dataset.evaOverviewEventId = item.id;
    detail.dataset.evaOverviewTone = target.tone || 'neutral';
    detail.querySelector('[data-eva-overview-detail-icon]').innerHTML = overviewIcon(target.icon);
    detail.querySelector('[data-eva-overview-detail-eyebrow]').textContent = target.eyebrow;
    detail.querySelector('[data-eva-overview-detail-title]').textContent = target.title;
    detail.querySelector('[data-eva-overview-detail-description]').textContent = target.description;
    detail.querySelector('[data-eva-overview-detail-facts]').innerHTML = overviewDetailFactsHTML(target);
    detail.querySelector('[data-eva-overview-detail-panel-label]').textContent = target.panel.label;
    detail.querySelector('[data-eva-overview-detail-panel-title]').textContent = target.panel.title;
    detail.querySelector('[data-eva-overview-detail-panel-text]').textContent = target.panel.text;
    detail.querySelector('[data-eva-overview-detail-interaction]').innerHTML = overviewDetailInteractionHTML(target.panel);
    detail.hidden = false;
    var composer = detail.querySelector('.eva-overview-detail__composer');
    var close = detail.querySelector('.eva-overview-detail__close');
    if (composer) composer.focus();
    else if (close) close.focus();
  }

  function closeOverviewDetail() {
    var detail = document.getElementById('eva-overview-detail');
    if (!detail || detail.hidden) return;
    detail.hidden = true;
    detail.removeAttribute('data-eva-overview-event-id');
    detail.removeAttribute('data-eva-overview-tone');
    if (overviewDetailOrigin && overviewDetailOrigin.isConnected) overviewDetailOrigin.focus();
    overviewDetailOrigin = null;
  }

  function resolveOverviewDetail(action) {
    var detail = document.getElementById('eva-overview-detail');
    if (!detail || detail.hidden) return;
    var button = detail.querySelector('[data-eva-overview-detail-action="' + action + '"]');
    var result = detail.querySelector('[data-eva-overview-detail-result]');
    if (!button || !result) return;
    var item = overviewEvents.find(function (entry) {
      return entry.id === detail.dataset.evaOverviewEventId;
    });
    var panel = item && item.target ? item.target.panel : null;
    var resultTone = action === 'primary' && panel && panel.primaryResultTone
      ? panel.primaryResultTone
      : 'neutral';
    result.hidden = false;
    result.className = 'eva-overview-detail__result eva-overview-detail__result--' + resultTone;
    result.textContent = '已模拟：' + directText(button);
    detail.querySelectorAll('[data-eva-overview-detail-action]').forEach(function (item) {
      item.disabled = true;
    });
  }

  function overviewEventActionsHTML(item) {
    var parts = [];
    if (item.resolution) {
      parts.push('<span class="eva-overview-event__resolution eva-overview-event__resolution--' + item.resolution.tone + '" role="status">' + overviewIcon(item.resolution.icon) + '<span>' + item.resolution.label + '</span></span>');
    }
    (item.actions || []).forEach(function (action) {
      var tone = action.tone || 'secondary';
      var target = item.target || {};
      var targetAttrs = '';
      if (target.objectType) targetAttrs += ' data-eva-overview-object-type="' + target.objectType + '"';
      if (target.objectId) targetAttrs += ' data-eva-overview-object-id="' + target.objectId + '"';
      if (target.taskId) targetAttrs += ' data-eva-overview-task-id="' + target.taskId + '"';
      if (target.fileId) targetAttrs += ' data-eva-overview-file-id="' + target.fileId + '"';
      if (target.messageId) targetAttrs += ' data-eva-overview-message-id="' + target.messageId + '"';
      if (target.runId) targetAttrs += ' data-eva-overview-run-id="' + target.runId + '"';
      parts.push('<button type="button" class="eva-overview-event__action eva-overview-event__action--' + tone + '" data-eva-overview-action="' + action.action + '" data-eva-overview-event-id="' + item.id + '"' + (item.spaceId ? ' data-eva-overview-space-id="' + item.spaceId + '"' : '') + targetAttrs + ' aria-label="' + action.label + '：' + item.objectName + '">' + overviewIcon(action.icon) + '<span>' + action.label + '</span></button>');
    });
    return parts.join('');
  }

  function overviewEventHTML(item) {
    var actionsHTML = overviewEventActionsHTML(item);
    return [
      '<article class="eva-overview-event" data-eva-overview-event="' + item.kind + '" data-eva-overview-event-id="' + item.id + '">',
        '<img class="eva-overview-event__avatar" src="' + overviewAvatarUri(item) + '" alt="">',
        '<div class="eva-overview-event__main">',
          '<div class="eva-overview-event__statement"><span class="eva-overview-event__actor"><strong>' + item.actor + '</strong>' + (item.isAI ? '<span class="ai-badge ai-badge-small eva-overview-ai-badge">AI</span>' : '') + '</span><span class="eva-overview-event__statement-copy">' + overviewStatementHTML(item) + '</span></div>',
          (item.preview ? '<p class="eva-overview-event__preview">' + item.preview + '</p>' : ''),
          (actionsHTML ? '<div class="eva-overview-event__followup">' + actionsHTML + '</div>' : ''),
        '</div>',
        '<time class="eva-overview-event__time">' + item.occurredAt + '</time>',
      '</article>'
    ].join('');
  }

  function overviewEventGroupsHTML(items) {
    if (!items.length) {
      return '<div class="eva-overview-empty"><strong>当前没有符合条件的事项</strong><span>切换类型或状态后可以继续查看。</span></div>';
    }
    var groups = [];
    items.forEach(function (item) {
      var group = groups.find(function (entry) { return entry.spaceId === item.spaceId; });
      if (!group) {
        group = { spaceId: item.spaceId, spaceName: item.spaceName, spaceTone: item.spaceTone || 'neutral', items: [] };
        groups.push(group);
      }
      group.items.push(item);
    });
    return groups.map(function (group) {
      var headingId = 'eva-overview-space-' + group.spaceId;
      var theme = overviewProjectTheme(group.spaceId, group.spaceName);
      return [
        '<section class="eva-space-card-foundation eva-space-card-foundation--activity eva-overview-space-group" style="' + projectThemeCSS(theme) + '" data-eva-space-tone="' + group.spaceTone + '" data-eva-component="space-event-card" data-eva-overview-space-group="' + group.spaceId + '" aria-labelledby="' + headingId + '">',
          '<header class="eva-overview-space-group__header"><strong id="' + headingId + '">' + group.spaceName + '</strong><span class="eva-overview-space-group__count">' + group.items.length + ' 项</span></header>',
          '<div class="eva-overview-space-group__body">' + group.items.map(overviewEventHTML).join('') + '</div>',
        '</section>'
      ].join('');
    }).join('');
  }

  function renderOverviewEvents(filter, status) {
    var root = document.getElementById('eva-collab-overview-root');
    if (!root) return;
    var activeStatus = status || root.dataset.evaOverviewStatus || 'pending';
    var activeFilter = filter || root.dataset.evaOverviewFilter || 'all';
    if (activeStatus === 'notice') activeFilter = 'all';
    root.dataset.evaOverviewStatus = activeStatus;
    root.dataset.evaOverviewFilter = activeFilter;
    var sourceEvents = activeStatus === 'processed'
      ? overviewProcessedEvents
      : activeStatus === 'notice'
        ? overviewNoticeEvents
        : overviewEvents;
    var visibleEvents = activeFilter === 'all' ? sourceEvents : sourceEvents.filter(function (item) {
      return item.filter === activeFilter;
    });
    var list = root.querySelector('[data-eva-overview-events]');
    if (list) list.innerHTML = overviewEventGroupsHTML(visibleEvents);
    var count = root.querySelector('[data-eva-overview-count]');
    if (count) count.textContent = String(overviewEvents.length);
    var noticeCount = root.querySelector('[data-eva-overview-notice-count]');
    if (noticeCount) noticeCount.textContent = String(overviewNoticeEvents.length);
    root.querySelectorAll('[data-eva-overview-status]').forEach(function (button) {
      var active = button.dataset.evaOverviewStatus === activeStatus;
      var selectedValue = active ? 'true' : 'false';
      var tabIndexValue = active ? '0' : '-1';
      if (button.getAttribute('aria-selected') !== selectedValue) button.setAttribute('aria-selected', selectedValue);
      if (button.getAttribute('tabindex') !== tabIndexValue) button.setAttribute('tabindex', tabIndexValue);
    });
    root.querySelectorAll('[data-eva-overview-filter]').forEach(function (button) {
      var active = button.dataset.evaOverviewFilter === activeFilter;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    var filters = root.querySelector('.eva-overview-filters');
    var filtersShouldBeHidden = activeStatus === 'notice';
    if (filters && filters.hidden !== filtersShouldBeHidden) filters.hidden = filtersShouldBeHidden;
  }

  function bindOverviewControls(root) {
    if (!root || root.dataset.evaOverviewControlsBound === 'true') return;
    root.dataset.evaOverviewControlsBound = 'true';
    root.querySelectorAll('[data-eva-overview-status]').forEach(function (statusButton) {
      statusButton.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        renderOverviewEvents('all', statusButton.dataset.evaOverviewStatus);
      });
    });
    root.querySelectorAll('[data-eva-overview-filter]').forEach(function (filterButton) {
      filterButton.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        renderOverviewEvents(filterButton.dataset.evaOverviewFilter);
      });
    });
  }

  function ensureOverviewRoot() {
    var root = document.getElementById('eva-collab-overview-root');
    if (root) {
      bindOverviewControls(root);
      return root;
    }
    root = document.createElement('section');
    root.id = 'eva-collab-overview-root';
    root.className = 'eva-collab-overview';
    root.hidden = true;
    root.setAttribute('aria-label', '协作事项');
    root.innerHTML = `
      <header class="eva-collab-overview__header">
        <div><strong>协作事项</strong><span>集中处理各 Space 中与你有关的工作</span></div>
        <button type="button" class="eva-overview-create-space" data-eva-overview-action="create-space" aria-label="新建空间">${overviewIcon('plus')}<span>新建空间</span></button>
      </header>
      <div class="eva-collab-overview__body">
        <main class="eva-overview-canvas">
          <section class="eva-overview-section eva-overview-attention" aria-label="协作事项列表">
            <div class="eva-overview-status-tabs" role="tablist" aria-label="事项状态">
              <button type="button" role="tab" data-eva-overview-status="pending" aria-selected="true"><span>待处理</span><em data-eva-overview-count>8</em></button>
              <button type="button" role="tab" data-eva-overview-status="notice" aria-selected="false" tabindex="-1"><span>通知</span><em data-eva-overview-notice-count>2</em></button>
              <button type="button" role="tab" data-eva-overview-status="processed" aria-selected="false" tabindex="-1"><span>已处理</span></button>
            </div>
            <div class="eva-overview-filters" role="group" aria-label="筛选协作事项">
              <button type="button" data-eva-overview-filter="all" aria-pressed="true">全部</button>
              <button type="button" data-eva-overview-filter="mention" aria-pressed="false">提及</button>
              <button type="button" data-eva-overview-filter="assignment" aria-pressed="false">指派</button>
              <button type="button" data-eva-overview-filter="review" aria-pressed="false">验收</button>
              <button type="button" data-eva-overview-filter="task_file" aria-pressed="false">文件</button>
              <button type="button" data-eva-overview-filter="system" aria-pressed="false">系统提醒</button>
            </div>
            <div class="eva-overview-event-list" data-eva-overview-events aria-live="polite">${overviewEventGroupsHTML(overviewEvents)}</div>
          </section>
        </main>
      </div>`;
    document.body.appendChild(root);
    bindOverviewControls(root);
    return root;
  }

  function buildOverviewNav() {
    var driveNav = replaceDriveNavWithNativeClone();
    var container = driveNav && driveNav.parentElement;
    var messagesNav = nativeNavItem(container, '消息');
    if (!container) return;
    if (!messagesNav) return;
    var overviewNav = document.getElementById('eva-collab-overview-nav');
    if (!overviewNav) {
      overviewNav = messagesNav.cloneNode(true);
      overviewNav.id = 'eva-collab-overview-nav';
      overviewNav.dataset.evaOverviewNav = 'true';
      overviewNav.classList.remove('eva-native-nav-suppressed', 'is-active');
      overviewNav.removeAttribute('aria-current');
      overviewNav.removeAttribute('aria-selected');
      overviewNav.querySelectorAll('[id]').forEach(function (node) { node.removeAttribute('id'); });

      var labelNode = Array.from(overviewNav.querySelectorAll('span')).reverse().find(function (span) {
        return directText(span) === '消息';
      });
      if (labelNode) labelNode.textContent = '协作概览';

      var svg = overviewNav.querySelector('svg');
      if (svg) {
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '1.8');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.innerHTML = '<rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect>';
      }
    }

    var overviewAnchor = document.getElementById('eva-my-avatar-nav') || messagesNav;
    if (overviewAnchor.nextElementSibling !== overviewNav) {
      overviewAnchor.insertAdjacentElement('afterend', overviewNav);
    }

    overviewNav.style.removeProperty('display');
    overviewNav.setAttribute('aria-hidden', 'false');
    ensureOverviewRoot();
  }

  function createMyAssistantAvatar(context) {
    var identity = window.__EVA_MY_ASSISTANT_IDENTITY;
    if (!identity) return document.createElement('span');
    var avatar = document.createElement('span');
    avatar.className = 'eva-identity-avatar eva-identity-avatar--' + context;
    avatar.setAttribute('role', 'img');
    avatar.setAttribute('aria-label', identity.name + '，' + identity.ownerName + '的 Eva 分身');
    var logo = document.createElement('img');
    logo.className = 'eva-identity-avatar__logo';
    logo.src = identity.logo;
    logo.alt = '';
    var owner = document.createElement('img');
    owner.className = 'eva-identity-avatar__owner';
    owner.src = identity.ownerAvatar;
    owner.alt = '';
    owner.title = '由' + identity.ownerName + '创建';
    avatar.appendChild(logo);
    avatar.appendChild(owner);
    return avatar;
  }

  function createEvaLogoAvatar(context) {
    var avatar = document.createElement('span');
    avatar.className = 'eva-identity-avatar eva-identity-avatar--' + context;
    avatar.setAttribute('role', 'img');
    avatar.setAttribute('aria-label', 'Eva 同学');
    var logo = document.createElement('img');
    logo.className = 'eva-identity-avatar__logo';
    logo.src = window.__EVA_COLLEAGUE_PORTRAIT;
    logo.alt = '';
    avatar.appendChild(logo);
    return avatar;
  }

  function syncOverviewSelection() {
    var open = overviewIsOpen();
    var overviewNav = document.getElementById('eva-collab-overview-nav');
    if (overviewNav) overviewNav.setAttribute('aria-current', open ? 'page' : 'false');
    document.body.classList.toggle('eva-collab-overview-open', open);

    if (!overviewNav || !overviewNav.parentElement) return;
    var container = overviewNav.parentElement;
    ['消息', '项目', '空间'].forEach(function (label) {
      var nav = nativeNavItem(container, label);
      if (nav) nav.classList.toggle('eva-overview-underlay-suppressed', open);
    });
    ['eva-drive-nav', 'eva-contacts-nav', 'eva-my-avatar-nav'].forEach(function (id) {
      var nav = document.getElementById(id);
      if (open && nav) nav.setAttribute('aria-current', 'false');
    });
    document.querySelectorAll('[data-eva-space-child]').forEach(function (button) {
      if (open) button.setAttribute('aria-current', 'false');
    });
  }

  function openOverview() {
    closeContacts();
    var driveRoot = document.getElementById('eva-drive-root');
    if (driveRoot && !driveRoot.hidden) driveRoot.hidden = true;
    ensureOverviewRoot().hidden = false;
    syncOverviewSelection();
  }

  function closeOverview() {
    closeOverviewDetail();
    var root = document.getElementById('eva-collab-overview-root');
    if (root && !root.hidden) root.hidden = true;
    syncOverviewSelection();
  }

  function openExistingSpaceCreate() {
    closeOverview();
    var attempts = 0;
    var workspaceRequested = false;

    function advance() {
      attempts += 1;
      var list = document.querySelector('.collab-list-page');
      if (list) {
        var createButton = Array.from(list.querySelectorAll('button')).find(function (button) {
          return directText(button).indexOf('新建空间') >= 0;
        });
        if (createButton) {
          createButton.click();
          queueTune();
          return;
        }
      }

      var frame = document.querySelector('.collab-frame');
      if (frame) {
        var picker = frame.querySelector('.collab-sp-chip');
        if (picker && !frame.querySelector('.sp-menu')) picker.click();
        var allSpaces = Array.from(frame.querySelectorAll('.sp-menu .mi')).find(function (item) {
          return directText(item).indexOf('全部空间') >= 0 || directText(item).indexOf('全部项目') >= 0;
        });
        if (allSpaces) allSpaces.click();
      } else if (!workspaceRequested && typeof window.__evaOpenWorkspaceFromTree === 'function') {
        workspaceRequested = true;
        window.__evaOpenWorkspaceFromTree('prod');
      }

      if (attempts < 12) setTimeout(advance, 50);
    }

    advance();
  }

  function openOverviewMessageTarget(item) {
    closeOverview();
    var overviewNav = document.getElementById('eva-collab-overview-nav');
    var messagesNav = overviewNav && nativeNavItem(overviewNav.parentElement, '消息');
    if (messagesNav) messagesNav.click();

    var attempts = 0;
    function focusConversation() {
      attempts += 1;
      var label = item.target && item.target.label;
      var candidates = Array.from(document.querySelectorAll('.wk-conv-compact-item, button, [role="button"]'));
      var conversation = label && candidates.find(function (node) {
        return directText(node) === label;
      }) || (label && Array.from(document.querySelectorAll('.wk-conv-compact-name')).map(function (node) {
        return node.closest('.wk-conv-compact-item');
      }).find(function (node) {
        return node && node.querySelector('.wk-conv-compact-name') && directText(node.querySelector('.wk-conv-compact-name')) === label;
      }));
      if (conversation) {
        conversation.click();
        return;
      }
      if (attempts < 10) setTimeout(focusConversation, 50);
    }
    focusConversation();
  }

  function overviewDestinationInteractionHTML(panel) {
    var content = '';
    if (panel.mode === 'composer') {
      content = '<textarea class="eva-overview-destination__composer" rows="3" placeholder="' + panel.placeholder + '" aria-label="' + panel.title + '"></textarea>';
    } else if (panel.mode === 'preview') {
      content = '<div class="eva-overview-destination__preview">' + overviewIcon('file') + '<div><strong>' + panel.title + '</strong><span>' + panel.text + '</span></div></div>';
    }
    var secondary = panel.secondaryLabel
      ? '<button type="button" class="eva-overview-destination__button" data-eva-destination-action="secondary">' + panel.secondaryLabel + '</button>'
      : '';
    return [
      content,
      '<div class="eva-overview-destination__actions">',
        secondary,
        '<button type="button" class="eva-overview-destination__button eva-overview-destination__button--primary" data-eva-destination-action="primary">' + panel.primaryLabel + '</button>',
      '</div>',
      '<p class="eva-overview-destination__result" data-eva-destination-result role="status" hidden></p>'
    ].join('');
  }

  function overviewDestinationResult(item, action) {
    var results = {
      'evt-assignment': { primary: '任务已开始处理', secondary: '已打开任务讨论' },
      'evt-review': { primary: '已验收通过', secondary: '已退回补充' },
      'evt-waiting-input': { primary: '补充已提交，专家团将继续执行', secondary: '已选择要上传的文件' },
      'evt-task-file': { primary: '已在云盘中打开', secondary: '文件已开始下载' },
      'evt-membership-request': { primary: '已同意加入', secondary: '已拒绝申请' },
      'evt-skill-authorization': { primary: '已允许本次使用', secondary: '已拒绝授权' },
      'evt-automation-failure': { primary: '已重新运行', secondary: '已打开完整日志' },
      'evt-processed-daily-report': { primary: '已打开日报', secondary: '日报已开始下载' }
    };
    var itemResults = results[item.presentationId || item.id] || {};
    return itemResults[action] || '操作已记录';
  }

  function showOverviewDestination(item) {
    var presentationId = item.presentationId || item.id;
    var presentation = overviewTargets[presentationId];
    if (!presentation || item.target.objectType === 'message') return;
    var attempts = 0;

    function mount() {
      attempts += 1;
      var frame = document.querySelector('.collab-frame');
      var tabs = frame && frame.querySelector('.collab-tabs');
      if (!frame || !tabs) {
        if (attempts < 12) setTimeout(mount, 50);
        return;
      }

      var existing = frame.querySelector('.eva-overview-destination');
      if (existing) existing.remove();
      var card = document.createElement('section');
      card.className = 'eva-space-card-foundation eva-overview-destination';
      card.dataset.evaOverviewDestination = presentationId;
      card.dataset.evaSpaceTone = item.spaceTone || 'neutral';
      card.setAttribute('aria-labelledby', 'eva-overview-destination-title');
      card.innerHTML = [
        '<header class="eva-overview-destination__header">',
          '<span class="eva-overview-destination__icon">' + overviewIcon(presentation.icon) + '</span>',
          '<div><span>' + presentation.eyebrow + '</span><h2 id="eva-overview-destination-title">' + presentation.title + '</h2></div>',
        '</header>',
        '<div class="eva-overview-destination__body">',
          '<p class="eva-overview-destination__description">' + presentation.description + '</p>',
          '<dl class="eva-overview-destination__facts">' + overviewDetailFactsHTML(presentation) + '</dl>',
          '<section class="eva-overview-destination__panel"><span>' + presentation.panel.label + '</span><h3>' + presentation.panel.title + '</h3><p>' + presentation.panel.text + '</p>' + overviewDestinationInteractionHTML(presentation.panel) + '</section>',
        '</div>'
      ].join('');
      tabs.insertAdjacentElement('afterend', card);
      card.querySelectorAll('[data-eva-destination-action]').forEach(function (button) {
        button.addEventListener('click', function () {
          var result = card.querySelector('[data-eva-destination-result]');
          result.textContent = overviewDestinationResult(item, button.dataset.evaDestinationAction);
          result.hidden = false;
        });
      });
      card.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
    setTimeout(mount, 80);
  }

  function clearOverviewDestination() {
    document.querySelectorAll('.eva-overview-destination').forEach(function (card) {
      card.remove();
    });
  }

  function openOverviewObject(item, action) {
    var target = item.target || {};
    window.__evaOverviewTarget = {
      spaceId: item.spaceId,
      objectType: target.objectType || '',
      objectId: target.objectId || '',
      taskId: target.taskId || '',
      fileId: target.fileId || '',
      messageId: target.messageId || '',
      runId: target.runId || ''
    };

    if (action === 'messages') {
      openOverviewMessageTarget(item);
      return;
    }

    var section = target.section || (action === 'workspace' ? null : action);
    if (section === 'members') section = null;
    if (item.spaceId && typeof window.__evaOpenWorkspaceFromTree === 'function') {
      closeOverview();
      window.__evaOpenWorkspaceFromTree(item.spaceId, section || undefined);
      showOverviewDestination(item);
    }
  }

  function contactsIsOpen() {
    var root = document.getElementById('eva-contacts-root');
    return Boolean(root && !root.hidden);
  }

  function ensureContactsRoot() {
    var root = document.getElementById('eva-contacts-root');
    if (root) return root;
    root = document.createElement('section');
    root.id = 'eva-contacts-root';
    root.className = 'eva-contacts';
    root.hidden = true;
    root.setAttribute('aria-label', '通讯录');
    root.innerHTML = '<header class="eva-contacts__header"><strong>通讯录</strong></header><div class="eva-contacts__empty"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 13a3 3 0 1 0-6 0"></path><path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"></path><path d="M9 18h6"></path></svg></div>';
    document.body.appendChild(root);
    return root;
  }

  function buildContactsNav() {
    var driveNav = replaceDriveNavWithNativeClone();
    var container = driveNav && driveNav.parentElement;
    if (!container) return;
    var contactsNav = document.getElementById('eva-contacts-nav');
    if (!contactsNav) {
      var template = nativeNavItem(container, '消息') || nativeNavItem(container, '项目') || nativeNavItem(container, '空间');
      if (!template) return;
      contactsNav = template.cloneNode(true);
      contactsNav.id = 'eva-contacts-nav';
      contactsNav.dataset.evaContactsNav = 'true';
      contactsNav.classList.remove('eva-native-nav-suppressed', 'is-active');
      contactsNav.removeAttribute('aria-current');
      contactsNav.removeAttribute('aria-selected');
      contactsNav.querySelectorAll('[id]').forEach(function (node) { node.removeAttribute('id'); });

      var labelNode = Array.from(contactsNav.querySelectorAll('span')).reverse().find(function (span) {
        var text = directText(span);
        return text === '消息' || text === '项目' || text === '空间' || text === '协作空间';
      });
      if (labelNode) labelNode.textContent = '通讯录';

      var svg = contactsNav.querySelector('svg');
      if (svg) {
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '1.8');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.innerHTML = '<path d="M15 13a3 3 0 1 0-6 0"></path><path d="M17 18a5 5 0 0 0-10 0"></path><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"></path>';
      }
      driveNav.insertAdjacentElement('afterend', contactsNav);
    }

    var contactsLabel = Array.from(contactsNav.querySelectorAll('span')).reverse().find(function (span) {
      return directText(span) === 'Eva 通讯录' || directText(span) === '通讯录';
    });
    if (contactsLabel) contactsLabel.textContent = '通讯录';
    ensureContactsRoot();
  }

  function syncContactsSelection() {
    var open = contactsIsOpen();
    var contactsNav = document.getElementById('eva-contacts-nav');
    if (contactsNav) contactsNav.setAttribute('aria-current', open ? 'page' : 'false');
    document.body.classList.toggle('eva-contacts-open', open);

    if (!contactsNav || !contactsNav.parentElement) return;
    var container = contactsNav.parentElement;
    ['消息', '项目', '空间'].forEach(function (label) {
      var nav = nativeNavItem(container, label);
      if (nav) nav.classList.toggle('eva-contacts-underlay-suppressed', open);
    });
    document.querySelectorAll('[data-eva-space-child]').forEach(function (button) {
      if (open) button.setAttribute('aria-current', 'false');
    });
  }

  function openContacts() {
    window.dispatchEvent(new CustomEvent('eva:sidebar-select', { detail: { id: 'contacts', overlay: true } }));
    closeOverview();
    var driveRoot = document.getElementById('eva-drive-root');
    if (driveRoot && !driveRoot.hidden) driveRoot.hidden = true;
    var root = ensureContactsRoot();
    root.hidden = false;
    if (typeof window.__evaEnhanceContacts === 'function') {
      window.__evaEnhanceContacts();
      requestAnimationFrame(window.__evaEnhanceContacts);
    }
    syncContactsSelection();
  }

  function closeContacts() {
    var root = document.getElementById('eva-contacts-root');
    if (root && !root.hidden) root.hidden = true;
    syncContactsSelection();
  }

  function buildSpaceTree() {
    var tree = document.getElementById('eva-space-tree');
    if (tree) tree.remove();
    var driveNav = document.getElementById('eva-drive-nav');
    var container = driveNav && driveNav.parentElement;
    var spaceNav = nativeNavItem(container, '项目') || nativeNavItem(container, '空间');
    if (!spaceNav) return;
    spaceNav.classList.remove('eva-space-tree-parent', 'eva-space-tree-parent--child-active');
    spaceNav.removeAttribute('data-eva-space-tree-parent');
    spaceNav.removeAttribute('aria-expanded');
    var chevron = spaceNav.querySelector('.eva-space-tree-parent__chevron');
    if (chevron) chevron.remove();
  }

  function syncSpaceTreeSelection() {
    var root = document.getElementById('eva-drive-root');
    var driveOpen = Boolean(root && !root.hidden);
    var contactsOpen = contactsIsOpen();
    var overviewOpen = overviewIsOpen();
    var currentName = directText(document.querySelector('.collab-sp-chip .nm'));
    var spaceParent = document.querySelector('[data-eva-space-tree-parent]');
    var childIsActive = Boolean(!driveOpen && !contactsOpen && !overviewOpen && currentName && DEFAULT_SPACE_NAMES.indexOf(currentName) >= 0);

    if (spaceParent) {
      spaceParent.classList.toggle('eva-space-tree-parent--child-active', childIsActive);
      if (childIsActive) {
        if (!Object.prototype.hasOwnProperty.call(spaceParent.dataset, 'evaSpaceTreePreviousAriaCurrent')) {
          spaceParent.dataset.evaSpaceTreePreviousAriaCurrent = spaceParent.getAttribute('aria-current') || '';
        }
        spaceParent.setAttribute('aria-current', 'false');
      } else if (Object.prototype.hasOwnProperty.call(spaceParent.dataset, 'evaSpaceTreePreviousAriaCurrent')) {
        var previous = spaceParent.dataset.evaSpaceTreePreviousAriaCurrent;
        if (previous) spaceParent.setAttribute('aria-current', previous);
        else spaceParent.removeAttribute('aria-current');
        delete spaceParent.dataset.evaSpaceTreePreviousAriaCurrent;
      }
    }

    document.querySelectorAll('[data-eva-space-child]').forEach(function (button) {
      var selected = !driveOpen && !contactsOpen && !overviewOpen && currentName && button.dataset.evaSpaceChild === currentName;
      button.setAttribute('aria-current', selected ? 'page' : 'false');
    });
  }

  function syncDriveShellSelection(root) {
    var driveNav = replaceDriveNavWithNativeClone();
    if (!driveNav) return;
    var spaceNav = nativeNavItem(driveNav.parentElement, '项目') || nativeNavItem(driveNav.parentElement, '空间');
    var driveOpen = Boolean(root && !root.hidden);

    driveNav.setAttribute('aria-current', driveOpen ? 'page' : 'false');
    if (!spaceNav) return;
    /* 一级菜单互不控制显隐；只清理旧版云盘遗留的隐藏状态。 */
    spaceNav.classList.remove('eva-native-nav-suppressed');
    if (Object.prototype.hasOwnProperty.call(spaceNav.dataset, 'evaPreviousAriaCurrent')) {
      var previous = spaceNav.dataset.evaPreviousAriaCurrent;
      if (previous) spaceNav.setAttribute('aria-current', previous);
      else spaceNav.removeAttribute('aria-current');
      delete spaceNav.dataset.evaPreviousAriaCurrent;
    }
  }

  function buildDriveScopebar(root) {
    if (!root || root.querySelector('.eva-drive-scopebar')) return;
    var side = root.querySelector('.eva-drive__side');
    var main = root.querySelector('.eva-drive__main');
    var header = main && main.querySelector('.eva-drive__header');
    if (!side || !main || !header) return;

    var owned = side.querySelector('[data-drive-scope="owned"]');
    var shared = side.querySelector('[data-drive-scope="shared-all"]');
    var workspaceButtons = Array.from(side.querySelectorAll('[data-drive-scope="workspace"]'));
    if (!owned || !shared || !workspaceButtons.length) return;

    var bar = document.createElement('div');
    bar.className = 'eva-drive-scopebar';
    bar.setAttribute('aria-label', '文件范围');

    var tabs = document.createElement('div');
    tabs.className = 'eva-drive-scopebar__tabs';
    tabs.setAttribute('role', 'tablist');

    var currentScope = root.dataset.evaDriveScope || 'owned';
    var currentWorkspaceId = root.dataset.evaWorkspaceId || '';
    shared.dataset.driveScope = 'shared-all';

    [owned, shared].forEach(function (button) {
      button.className = 'eva-drive-scopebar__tab';
      button.setAttribute('role', 'tab');
      var selected = button === owned ? currentScope === 'owned' : currentScope !== 'owned';
      button.setAttribute('aria-selected', selected ? 'true' : 'false');
      tabs.appendChild(button);
    });

    var sources = document.createElement('div');
    sources.className = 'eva-drive-sourcebar';
    sources.hidden = currentScope === 'owned';
    sources.setAttribute('aria-label', '来自共享的文件来源');
    var sourceLabel = document.createElement('span');
    sourceLabel.className = 'eva-drive-sourcebar__label';
    sourceLabel.textContent = '来源';
    var sourceOptions = document.createElement('div');
    sourceOptions.className = 'eva-drive-sourcebar__options';
    sourceOptions.setAttribute('role', 'radiogroup');

    function sourceButton(label, scope, workspaceId) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'eva-drive-sourcebar__button';
      button.dataset.driveScope = scope;
      if (workspaceId) button.dataset.workspaceId = workspaceId;
      button.setAttribute('role', 'radio');
      var selected = scope === 'workspace'
        ? currentScope === 'workspace' && currentWorkspaceId === workspaceId
        : currentScope === scope;
      button.setAttribute('aria-checked', selected ? 'true' : 'false');
      button.textContent = label;
      return button;
    }

    sourceOptions.appendChild(sourceButton('全部', 'shared-all'));
    workspaceButtons.forEach(function (button) {
      var icon = button.querySelector('.eva-drive-icon');
      if (icon) icon.remove();
      button.className = 'eva-drive-sourcebar__button';
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-checked', currentScope === 'workspace' && button.dataset.workspaceId === currentWorkspaceId ? 'true' : 'false');
      sourceOptions.appendChild(button);
    });
    sourceOptions.appendChild(sourceButton('私聊分享', 'shared'));
    sources.append(sourceLabel, sourceOptions);
    bar.append(tabs, sources);
    header.insertAdjacentElement('afterend', bar);
  }

  function syncDriveInspector(root) {
    if (!root) return;
    var inspector = root.querySelector('.eva-drive__inspector');
    if (!inspector) return;
    var populated = Boolean(inspector.querySelector('.eva-drive__meta'));
    var dismissed = root.dataset.evaInspectorDismissed === 'true';
    root.classList.toggle('eva-drive--inspector-open', populated && !dismissed);

    var head = inspector.querySelector('.eva-drive__inspector-head');
    if (populated && head && !head.querySelector('.eva-drive__inspector-close')) {
      var close = document.createElement('button');
      close.type = 'button';
      close.className = 'eva-drive__inspector-close';
      close.dataset.evaDriveInspectorClose = 'true';
      close.textContent = '关闭';
      close.setAttribute('aria-label', '关闭文件详情');
      head.appendChild(close);
    }
  }

  function tuneDriveView() {
    var root = document.getElementById('eva-drive-root');
    syncDriveShellSelection(root);
    if (!root || root.hidden) return;
    buildDriveScopebar(root);
    root.querySelectorAll('[data-drive-action="bridge"]').forEach(function (button) {
      if (!button.hidden) button.hidden = true;
      button.setAttribute('aria-hidden', 'true');
    });
    syncDriveInspector(root);
  }

  function fileNameFromCard(card) {
    return directText(card && card.querySelector('.wk-message-file-name'));
  }

  function openDrive() {
    closeOverview();
    closeContacts();
    if (typeof window.__evaOpenDrive === 'function') {
      window.__evaOpenDrive('global', null, 'owned');
      return;
    }
    var driveNav = replaceDriveNavWithNativeClone();
    if (driveNav) driveNav.click();
  }

  window.EvaFileMessage.setOpenDriveHandler(openDrive);

  window.EvaIMConversation = Object.freeze({
    open: function (conversationId) {
      if (!conversationId) return;
      window.dispatchEvent(new CustomEvent('eva-im:open', { detail: { conversationId: conversationId } }));
    }
  });

  function syncPersonalAssistantNav() {
    var row = document.querySelector('aside [data-eva-my-assistant-identity="true"]');
    var label = row && Array.from(row.querySelectorAll('span')).find(function (span) {
      return span.children.length === 0 && (directText(span) === 'Eva 同学' || directText(span) === '我的AI');
    });
    if (!row) {
      label = Array.from(document.querySelectorAll('aside span')).find(function (span) {
        return directText(span) === 'Eva 同学';
      });
      row = label && label.closest('.h-34px');
      if (!row) return;
      var iconSlot = Array.from(row.querySelectorAll('span')).find(function (span) {
        return span !== label && span.querySelector('svg');
      });
      if (!iconSlot) return;
      iconSlot.replaceChildren(createEvaLogoAvatar('nav'));
      row.dataset.evaMyAssistantIdentity = 'true';
    }

    var personalLabel = 'Eva 同学';
    if (label) label.textContent = personalLabel;
    row.setAttribute('aria-label', personalLabel);
    row.setAttribute('title', personalLabel);
    var avatar = row.querySelector('.eva-identity-avatar');
    if (avatar) avatar.setAttribute('aria-label', personalLabel);

    var myAiNav = document.getElementById('eva-my-avatar-nav');
    if (myAiNav) {
      myAiNav.setAttribute('aria-label', '我的AI');
      myAiNav.setAttribute('title', '我的AI');
      var myAiSurface = myAiNav.firstElementChild;
      if (myAiSurface) {
        myAiSurface.setAttribute('aria-label', '我的AI');
        myAiSurface.setAttribute('title', '我的AI');
      }
    }
  }

  function tuneMessageView() {
    document.body.classList.add('eva-message-hierarchy-ready');
    buildOverviewNav();
    syncPersonalAssistantNav();
    buildContactsNav();
    buildSpaceTree();
    syncSpaceTreeSelection();
    syncContactsSelection();
    syncOverviewSelection();
    tuneDriveView();

    var spaceFrame = document.querySelector('.collab-frame');
    if (spaceFrame) {
      var currentSpaceName = directText(spaceFrame.querySelector('.collab-sp-chip .nm'));
      spaceFrame.classList.add('eva-space-card-foundation');
      spaceFrame.dataset.evaSpaceTone = SPACE_TONES[currentSpaceName] || 'neutral';
      applyProjectTheme(spaceFrame, projectRegistry().find(function (project) { return project.name === currentSpaceName; }));
    }

    document.querySelectorAll('.eva-msg .wk-sidebar-tabbar').forEach(function (tabbar) {
      if (tabbar.dataset.evaProjectRecentSwitcher === 'true') return;
      if (!tabbar.hidden) tabbar.hidden = true;
      if (tabbar.getAttribute('aria-hidden') !== 'true') tabbar.setAttribute('aria-hidden', 'true');
    });

    document.querySelectorAll('.eva-msg input[placeholder="搜索"]').forEach(function (input) {
      input.placeholder = '搜索群聊、子区或联系人';
      input.setAttribute('aria-label', '搜索群聊、子区或联系人');
    });

    document.querySelectorAll('.wk-category-section').forEach(function (section) {
      var header = section.querySelector(':scope > .wk-category-header');
      var nameNode = header && header.querySelector('.wk-category-header__name');
      var name = labelText(nameNode);
      var expanded = Boolean(section.querySelector(':scope > .wk-category-section__content--expanded'));
      section.classList.toggle('eva-dm-scope', name === '私聊消息');
      section.classList.toggle('eva-org-scope', name === '全员沟通');
      if (header) {
        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');
        header.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        header.setAttribute('aria-label', (expanded ? '收起' : '展开') + name);
      }
    });

    document.querySelectorAll('.eva-msg').forEach(function (messageRoot) {
      var selected = messageRoot.querySelector('.wk-conv-compact-item--selected');
      var privateSection = selected && selected.closest('.eva-dm-scope');
      messageRoot.classList.toggle('eva-private-chat-selected', Boolean(privateSection));
      if (privateSection) {
        var threadButton = messageRoot.querySelector('.ch-head .op[title="子区"]');
        if (threadButton && threadButton.classList.contains('is-on')) threadButton.click();
      }
    });

    document.querySelectorAll('.wk-conv-compact-item').forEach(function (item) {
      item.setAttribute('role', 'button');
      if (!item.hasAttribute('tabindex')) item.setAttribute('tabindex', '0');
    });
  }

  document.addEventListener('keydown', function (event) {
    var overviewDetail = document.getElementById('eva-overview-detail');
    if (event.key === 'Escape' && overviewDetail && !overviewDetail.hidden) {
      event.preventDefault();
      closeOverviewDetail();
      return;
    }
    if (event.key === 'Tab' && overviewDetail && !overviewDetail.hidden) {
      var detailFocusables = Array.from(overviewDetail.querySelectorAll('button:not(:disabled), textarea:not(:disabled)'));
      if (detailFocusables.length) {
        var detailFirst = detailFocusables[0];
        var detailLast = detailFocusables[detailFocusables.length - 1];
        if (event.shiftKey && document.activeElement === detailFirst) {
          event.preventDefault();
          detailLast.focus();
          return;
        }
        if (!event.shiftKey && document.activeElement === detailLast) {
          event.preventDefault();
          detailFirst.focus();
          return;
        }
      }
    }
    if (event.key !== 'Enter' && event.key !== ' ') return;
    var target = event.target.closest('.wk-category-header, .wk-conv-compact-item');
    if (!target) return;
    event.preventDefault();
    target.click();
  });






  document.addEventListener('click', function (event) {
    var root = document.getElementById('eva-drive-root');
    if (event.target.closest('.collab-tab')) clearOverviewDestination();
    var detailClose = event.target.closest('[data-eva-overview-detail-close]');
    if (detailClose) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      closeOverviewDetail();
      return;
    }
    var detailAction = event.target.closest('[data-eva-overview-detail-action]');
    if (detailAction) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      resolveOverviewDetail(detailAction.dataset.evaOverviewDetailAction);
      return;
    }
    var overviewAction = event.target.closest('[data-eva-overview-action]');
    if (overviewAction && overviewIsOpen()) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      var action = overviewAction.dataset.evaOverviewAction;
      var overviewSpaceId = overviewAction.dataset.evaOverviewSpaceId;
      var overviewEventId = overviewAction.dataset.evaOverviewEventId;
      var overviewEvent = overviewEvents.concat(overviewNoticeEvents, overviewProcessedEvents).find(function (item) { return item.id === overviewEventId; });
      var overviewEventAction = overviewEvent && overviewEvent.actions.find(function (item) { return item.action === action; });

      if (action === 'create-space') {
        openExistingSpaceCreate();
      } else if (overviewEvent && overviewEventAction) {
        openOverviewObject(overviewEvent, action);
      } else if (action === 'drive') {
        closeOverview();
        var driveNav = replaceDriveNavWithNativeClone();
        if (driveNav) driveNav.click();
      }
      queueTune();
      return;
    }

    var overviewNav = event.target.closest('[data-eva-overview-nav]');
    if (overviewNav) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openOverview();
      return;
    }

    if (overviewIsOpen() && event.target.closest('aside')) closeOverview();

    var contactsNav = event.target.closest('[data-eva-contacts-nav]');
    if (contactsNav) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openContacts();
      return;
    }

    if (contactsIsOpen() && event.target.closest('aside')) closeContacts();

    var spaceChild = event.target.closest('[data-eva-space-child]');
    if (spaceChild) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      spaceTreeExpanded = true;
      clearOverviewDestination();
      var workspaceId = SPACE_IDS[spaceChild.dataset.evaSpaceChild];
      if (workspaceId && typeof window.__evaOpenWorkspaceFromTree === 'function') {
        window.__evaOpenWorkspaceFromTree(workspaceId);
      }
      queueTune();
      return;
    }

    if (event.target.closest('[data-eva-drive-inspector-close]')) {
      if (root) {
        root.dataset.evaInspectorDismissed = 'true';
        root.classList.remove('eva-drive--inspector-open');
      }
      event.stopPropagation();
      return;
    }

    if (root && event.target.closest('.eva-drive__row')) {
      root.dataset.evaInspectorDismissed = 'false';
    }
    if (root && event.target.closest('[data-drive-scope]')) {
      root.dataset.evaInspectorDismissed = 'true';
    }
  }, true);

  var queued = false;
  function queueTune() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      tuneMessageView();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', queueTune, { once: true });
  } else {
    queueTune();
  }

  function mutationNeedsTune(mutation) {
    var target = mutation.target && mutation.target.nodeType === 1
      ? mutation.target
      : mutation.target && mutation.target.parentElement;
    if (!target) return true;
    return !target.closest('#eva-collab-overview-root, #eva-overview-detail, #eva-contacts-root, [data-eva-my-assistant-identity="true"]');
  }

  new MutationObserver(function (mutations) {
    if (mutations.some(mutationNeedsTune)) queueTune();
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['hidden', 'aria-hidden', 'aria-selected']
  });
})();

