
(function () {
  'use strict';

  /* ============================================================
     个人 Eva · GDS 六态渲染器
     替代 044-final-layout-convergence.js 里那串头像气泡（design.md:424
     明令禁止的形态）。布局与状态切换见 051-personal-eva-gds.css，
     组件外观见 048-gds-components.css，色值见 047-gds-tokens.css。

     六态与 GDS spec/components.json 的 pageStates 对应，逐态核对过
     required／forbidden：
       home         hero + 场景排 + 空输入器
       input        同上，输入器带文字与 @ 技能提示
       skill-picker 同上 + 技能选择器（压在输入器上方）
       operation    同上 + 操作卡
       generating   会话顶栏 + 生成中流 + 会话态输入器（无 hero／场景排）
       completed    390 会话列 + 810 编辑列（无 hero／场景排／技能选择器）

     Demo 级交互（本仓库是演示原型，不接真模型）：
       输入文字            home → input
       输入 @              input → skill-picker（Esc 或选中关闭）
       点场景 chip／选技能  → operation（带操作卡的技能）或 input
       Enter 或点发送       → generating，2400ms 后 → completed
       助理行「新建会话」    → home，并选中对应助理

     图标一律走 050-lucide-dom.js 的 window.__evaLucide（官方 Lucide
     node 数组），不出现任何 Unicode 代用字形（AGENTS.md:151）。
     打包运行时里的 lucide-react v0.577.0 没有 presentation／chart-*／
     type／panel-left／undo-2／redo-2／thumbs-up 等名字，凡是缺的就用
     语义最近的现有图标（PPT→monitor、数据分析→layout-grid、
     产品开发→cpu、收起侧栏→arrow-left、有帮助→circle-check），
     绝不手绘路径补齐。
     ============================================================ */

  /* history 是已有会话的上下文态；它不属于一次新任务的六态生命周期，
     但与 generating 共用 GDS 的会话骨架和输入器。 */
  var STATES = ['home', 'input', 'skill-picker', 'operation', 'generating', 'completed', 'history'];

  var SCENARIOS = [
    { id: 'image', label: '图像', icon: 'file-image' },
    { id: 'video', label: '视频', icon: 'play' },
    { id: 'ppt', label: 'PPT', icon: 'monitor', skill: 'ppt' },
    { id: 'doc', label: '文档', icon: 'file-text' },
    { id: 'data', label: '数据分析', icon: 'layout-grid' },
    { id: 'product', label: '产品开发', icon: 'cpu' },
    { id: 'more', label: '更多创作', icon: 'sparkles' }
  ];

  var SKILLS = [
    { id: 'ppt', name: 'PPT DESIGN', desc: '按主题生成结构完整的演示文稿', icon: 'monitor', operation: true },
    { id: 'research', name: '深度研究', desc: '多轮检索后给出带来源的研究报告', icon: 'book-open' },
    { id: 'search', name: '网页搜索', desc: '实时检索公开网页并归纳要点', icon: 'globe' },
    { id: 'image', name: '图像生成', desc: '按描述生成图片并支持局部重绘', icon: 'file-image' },
    { id: 'data', name: '数据分析', desc: '上传表格后给出图表与结论', icon: 'layout-grid' },
    { id: 'writing', name: '文档写作', desc: '长文写作、润色与格式整理', icon: 'file-text' }
  ];

  var TASK_TITLE = 'UI设计师发展前景的PPT';
  var TASK_SKILL = SKILLS[0];

  var GENERATING_TOOLS = [
    { state: 'success', text: '已理解需求：面向设计团队的行业前景汇报' },
    { state: 'success', text: '检索公开资料', path: '· 14 个来源' },
    { state: 'success', text: '生成大纲', path: '· 6 页' },
    { state: 'running', text: '正在排版第 4 页', path: '· 岗位能力模型' }
  ];

  var SLIDES = [
    { kicker: 'UI DESIGNER · 2026', title: 'UI设计师<br>发展前景', by: '汇报人 <em>王宜林</em>', hint: '数据截至 2026 年 8 月' },
    { kicker: '01 行业现状', title: '需求结构正在迁移', sm: true, bullets: [['从界面产出到体验决策', '交付物从视觉稿转向可运行的设计系统'], ['AI 承接重复排版', '设计师的时间回到问题定义'] ] },
    { kicker: '02 岗位画像', title: '三类典型路径', sm: true, cols: [['体验设计', '面向业务目标做流程与信息架构'], ['设计系统', '维护组件契约与跨端一致性'], ['创意方向', '品牌表达与视觉语言'] ] },
    { kicker: '03 能力模型', title: '四项核心能力', sm: true, rows: ['问题定义与目标拆解', '系统化的组件思维', '数据与实验的基本素养', '跨职能的表达与说服'] },
    { kicker: '04 薪酬区间', title: '经验与城市的双重影响', sm: true, cols: [['1-3 年', '以执行为主，看基本功'], ['3-5 年', '独立负责模块与规范'], ['5 年以上', '定方向、带团队'] ] },
    { kicker: '05 结论', title: '把手艺做成系统', sm: true, hint: '下一步：用一个真实项目验证设计系统的收益' }
  ];

  var state = 'home';
  var draft = '';
  var activeSkill = null;
  var pickerQuery = '';
  var generatingTimer = 0;
  var root = null;
  var selectedConversation = 'UI设计师发展前景的PPT';
  var selectedAssistantId = 'assistant-general';
  var collapsedAssistants = new Set();

  function icon(name, size, className) {
    return window.__evaLucide(name, { size: size || 16, className: className || '' });
  }

  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function conversationCatalog() {
    return window.__EVA_PERSONAL_CONVERSATIONS || [];
  }

  function conversationForTitle(title) {
    return conversationCatalog().find(function (item) { return item.title === title; }) || null;
  }

  function conversationForId(id) {
    return conversationCatalog().find(function (item) { return item.id === id; }) || null;
  }

  function assistantRailHTML() {
    var assistants = window.__EVA_PERSONAL_ASSISTANTS || [];
    var tasks = window.__EVA_PERSONAL_ASSISTANT_TASKS || {};
    return '<aside class="eva-personal-sider-panel" aria-label="Eva 助理与对话">'
      + '<div class="eva-personal-sider-panel__body"><div class="eva-assistant-tree">'
      + '<div class="eva-my-ai-sidebar-actions eva-personal-sidebar-actions">'
      + '<button type="button" class="eva-assistant-tree__create eva-my-ai-sidebar-actions__create-assistant" aria-label="创建助理">'
      + icon('plus', 16, 'eva-i') + '<span>创建助理</span></button></div>'
      + assistants.map(function (assistant) {
        var collapsed = collapsedAssistants.has(assistant.id);
        var selected = selectedAssistantId === assistant.id;
        return '<section class="eva-assistant-folder eva-personal-assistant-folder' + (collapsed ? ' is-collapsed' : '') + (selected ? ' is-selected-assistant' : '') + '" data-eva-assistant-id="' + escapeHTML(assistant.id) + '" data-eva-assistant-name="' + escapeHTML(assistant.name) + '">'
          + '<div class="eva-personal-assistant-folder__row"><button type="button" class="eva-assistant-folder__button" aria-expanded="' + String(!collapsed) + '" data-eva-toggle-assistant>'
          + '<span class="eva-assistant-folder__icon" aria-hidden="true">' + icon('brain', 18, 'eva-i') + '</span>'
          + '<span class="eva-assistant-folder__name">' + escapeHTML(assistant.name) + '</span>'
          + '<span class="eva-assistant-folder__chevron" aria-hidden="true">' + icon('chevron-right', 12, 'eva-i-chevron') + '</span></button>'
          + '<span class="eva-personal-assistant-folder__actions"><button type="button" aria-label="编辑' + escapeHTML(assistant.name) + '" data-eva-edit-assistant>' + icon('ellipsis', 16, 'eva-i') + '</button>'
          + '<button type="button" class="eva-personal-assistant-folder__new-chat" aria-label="新建会话" title="新建会话" data-eva-new-assistant-chat="' + escapeHTML(assistant.id) + '">' + icon('plus', 16, 'eva-i') + '</button></span></div>'
          + '<div class="eva-assistant-folder__conversations">' + (tasks[assistant.id] || []).map(function (item) {
            var detail = conversationForTitle(item[0]);
            return '<button type="button" class="eva-assistant-conversation' + (selectedConversation === item[0] ? ' is-selected' : '') + '" data-eva-personal-conversation="' + escapeHTML(item[0]) + '"' + (detail ? ' data-eva-personal-conversation-id="' + escapeHTML(detail.id) + '"' : '') + '><span class="eva-assistant-conversation__title">' + escapeHTML(item[0]) + '</span><time class="eva-assistant-conversation__time">' + escapeHTML(item[1]) + '</time></button>';
          }).join('') + '</div></section>';
      }).join('') + '</div></div><div class="eva-conversation-rail-resizer" role="separator" aria-label="调整中间栏宽度" aria-orientation="vertical" tabindex="0" data-eva-conversation-rail-resizer></div></aside>';
  }

  /* ---- hero ------------------------------------------------ */
  function heroHTML() {
    return '<div class="eva-personal-workspace__hero">'
      + '<h1 class="eva-hero-title eva-t-hero">你好，我是Eva同学</h1>'
      + '<div class="eva-dotfield" aria-hidden="true"></div>'
      + '<div class="eva-bubble eva-t-mascot" aria-hidden="true"><span>Hi</span></div>'
      /* 相对路径按 index.html 的 base URL 解析，所以必须带 prototype/ 前缀；
         写成 assets/eva-wave.png 会去请求根目录的 /assets/，404。 */
      + '<div class="eva-mascot" aria-hidden="true"><img src="prototype/assets/eva-wave.png" alt=""></div>'
      + '</div>';
  }

  /* ---- 场景 chip 排 ---------------------------------------- */
  function railHTML() {
    return '<div class="eva-rail eva-personal-workspace__rail" role="group" aria-label="创作场景">'
      + SCENARIOS.map(function (item) {
        return '<button class="eva-chip eva-t-chip" type="button" data-eva-scenario="' + item.id + '">'
          + icon(item.icon, 16, 'eva-i') + '<span>' + escapeHTML(item.label) + '</span></button>';
      }).join('')
      + '<button class="eva-rail-next" type="button" aria-label="更多场景">' + icon('chevron-right', 12, 'eva-i-chevron') + '</button>'
      + '</div>';
  }

  /* ---- 输入器 ----------------------------------------------
     四种 prompt 形态严格照 GDS：
       homeEmpty  占位文案 + @ 提示
       homeFilled 技能 mention + 已输入文字
       skillQuery @ + 光标 + 「输入技能名称」
       conversation 会话态（无外框、无快捷技能）
     -------------------------------------------------------- */
  function promptHTML() {
    if (state === 'skill-picker') {
      return '<span class="eva-t-body">@</span><span class="eva-caret"></span>'
        + (pickerQuery
          ? '<span class="eva-t-body">' + escapeHTML(pickerQuery) + '</span>'
          : '<span class="eva-t-body eva-composer-ph">输入技能名称</span>');
    }
    var mention = activeSkill
      ? '<span class="eva-mention eva-t-body-medium">' + icon(activeSkill.icon, 16, 'eva-i') + escapeHTML(activeSkill.name) + '</span>'
      : '';
    if (draft) return mention + '<span class="eva-t-body">' + escapeHTML(draft) + '</span>';
    if (mention) return mention + '<span class="eva-t-body eva-composer-ph">补充你的要求</span>';
    return '<span class="eva-t-body eva-composer-ph">要我帮你做些什么？</span>'
      + '<span class="eva-at">@</span><span class="eva-t-body eva-composer-ph">调用技能与指令</span>';
  }

  function sendHTML() {
    if (state === 'generating') {
      return '<button class="eva-send" type="button" data-state="running" data-eva-personal-stop aria-label="停止生成">'
        + '<span class="eva-personal-tool__icon">' + icon('square', 12, 'eva-i') + '</span></button>';
    }
    var ready = Boolean(draft || activeSkill);
    return '<button class="eva-send" type="button" data-state="' + (ready ? 'enabled' : 'disabled') + '"'
      + (ready ? ' data-eva-personal-send' : ' disabled')
      + ' aria-label="' + (ready ? '发送' : '发送（输入后可用）') + '">'
      + icon('arrow-up', 16, 'eva-i') + '</button>';
  }

  function actionsHTML() {
    return '<div class="eva-composer-actions">'
      + '<button class="eva-round eva-round-ghost" type="button" aria-label="添加附件">' + icon('plus', 16, 'eva-i') + '</button>'
      + '<span style="flex:1 1 auto"></span>'
      + '<button class="eva-model eva-t-label" type="button">Auto' + icon('chevron-down', 12, 'eva-i-chevron') + '</button>'
      + '<button class="eva-round eva-round-plain" type="button" aria-label="语音输入">' + icon('mic', 16, 'eva-i') + '</button>'
      + sendHTML()
      + '</div>';
  }

  function composerPanelHTML(extraClass) {
    return '<div class="eva-composer' + (extraClass ? ' ' + extraClass : '') + '" data-eva-personal-composer>'
      + '<div class="eva-composer-prompt" role="textbox" aria-label="向 Eva 同学提问" tabindex="0">' + promptHTML() + '</div>'
      + actionsHTML()
      + '</div>';
  }

  function quickSkillsHTML() {
    var assistants = window.__EVA_PERSONAL_ASSISTANTS || [];
    var selectedAssistant = assistants.find(function (assistant) { return assistant.id === selectedAssistantId; }) || assistants[0] || { name: '通用助理' };
    return '<div class="eva-quickskills">'
      + '<button class="eva-quick eva-t-caption" type="button">' + icon('eye', 16, 'eva-i') + '<span>视觉探索</span>' + icon('chevron-down', 12, 'eva-i-chevron') + '</button>'
      + '<button class="eva-quick eva-t-caption" type="button" data-eva-selected-assistant="' + escapeHTML(selectedAssistantId) + '">' + icon('brain', 16, 'eva-i') + '<span>' + escapeHTML(selectedAssistant.name) + '</span>' + icon('chevron-down', 12, 'eva-i-chevron') + '</button>'
      + '</div>';
  }

  /* ---- 技能选择器 ------------------------------------------ */
  function pickerHTML() {
    var query = pickerQuery.toLowerCase();
    var rows = SKILLS.filter(function (skill) {
      return !query || skill.name.toLowerCase().indexOf(query) >= 0 || skill.desc.indexOf(pickerQuery) >= 0;
    });
    return '<div class="eva-personal-workspace__pickerhost">'
      + '<div class="eva-picker" role="listbox" aria-label="技能">'
      + '<div class="eva-picker-head eva-t-label-medium">技能(' + rows.length + ')</div>'
      + '<div class="eva-picker-list">'
      + rows.map(function (skill, index) {
        return '<button class="eva-skillrow" type="button" role="option" aria-selected="false"'
          + (index === 0 ? ' data-active="true"' : '')
          + ' data-eva-skill="' + skill.id + '">'
          + '<span class="ic eva-personal-tool__icon">' + icon(skill.icon, 16, 'eva-i') + '</span>'
          + '<span class="nm eva-t-label">' + escapeHTML(skill.name) + '</span>'
          + '<span class="ds eva-t-label">' + escapeHTML(skill.desc) + '</span>'
          + '</button>';
      }).join('')
      + '</div></div></div>';
  }

  /* ---- 操作卡 ---------------------------------------------- */
  function opcardHTML() {
    return '<div class="eva-personal-workspace__opcard">'
      + '<aside class="eva-opcard" aria-label="运营推荐">'
      + '<div class="eva-opcard-img">'
      + '<div class="eva-slide" style="font-size:9px"><div class="pad">'
      + '<div class="kicker">EVA · NEW MODEL</div>'
      + '<h4 class="sm">更强的<br>长任务能力</h4>'
      + '<div class="hint">支持更长的上下文与多步工具调用</div>'
      + '</div></div>'
      + '<button class="eva-dismiss" type="button" aria-label="关闭" data-eva-personal-dismiss>' + icon('x', 12, 'eva-i') + '</button>'
      + '</div>'
      + '<div class="eva-opcard-copy">'
      + '<p class="eva-t-label">Eva同学上线新模型啦～功能更加强悍，更加聪明。</p>'
      + '<button class="eva-opcard-cta eva-t-label-medium" type="button">立即体验</button>'
      + '</div></aside></div>';
  }

  /* ---- 会话流片段 ------------------------------------------ */
  function userMessageHTML() {
    return '<div class="eva-usermsg"><div>'
      + '<span class="eva-mention eva-t-body-medium">' + icon(TASK_SKILL.icon, 16, 'eva-i') + escapeHTML(TASK_SKILL.name) + '</span>'
      + '<span class="eva-t-body">' + escapeHTML(TASK_TITLE) + '</span>'
      + '</div></div>';
  }

  function statusHTML(text) {
    return '<div class="eva-status eva-t-label"><span>' + escapeHTML(text) + '</span>'
      + icon('chevron-down', 12, 'eva-i-chevron') + '</div>';
  }

  function toolHTML(tool) {
    return '<div class="eva-tool eva-t-label" data-state="' + tool.state + '">'
      + '<span class="ic eva-personal-tool__icon">'
      + icon(tool.state === 'running' ? 'loader-circle' : 'check', 16, 'eva-i')
      + '</span>'
      + '<span class="tx">' + escapeHTML(tool.text) + '</span>'
      + (tool.path ? '<span class="path">' + escapeHTML(tool.path) + '</span>' : '')
      + '</div>';
  }

  function generatingHTML() {
    return '<section class="eva-personal-workspace__conversation">'
      + '<header class="eva-topbar eva-personal-workspace__topbar">'
      + '<span class="eva-personal-topbar__mark">' + icon('monitor', 18, 'eva-i-nav') + '</span>'
      + '<span class="ttl eva-t-header">' + escapeHTML(TASK_TITLE) + '</span>'
      + '<button class="eva-iconbtn" type="button" aria-label="更多操作">' + icon('ellipsis', 16, 'eva-i') + '</button>'
      + '<span style="flex:1 1 auto"></span>'
      + '<div class="eva-topbar-icons">'
      + '<button class="eva-iconbtn" type="button" aria-label="收起侧栏">' + icon('arrow-left', 16, 'eva-i') + '</button>'
      + '</div></header>'
      + '<div class="eva-personal-workspace__stream"><div class="eva-flow">'
      + userMessageHTML()
      + statusHTML('已处理 1分钟 52秒')
      + '<p class="eva-para eva-t-body">先把行业数据和岗位画像对齐，再按汇报节奏排 6 页；每页只保留一个结论。</p>'
      + GENERATING_TOOLS.map(toolHTML).join('')
      + '</div></div>'
      + '<div class="eva-personal-workspace__dock">' + composerPanelHTML() + '</div>'
      + '</section>';
  }

  function historyMessageHTML(message, assistantName) {
    var isUser = message.role === 'user';
    var body = '<p class="eva-history-message__text eva-t-body">' + escapeHTML(message.text || message.intro || '') + '</p>';
    if (message.paragraphs) {
      body += message.paragraphs.map(function (paragraph) {
        return '<p class="eva-history-message__text eva-t-body">' + escapeHTML(paragraph) + '</p>';
      }).join('');
    }
    if (message.note) body += '<div class="eva-history-message__note eva-t-label">' + escapeHTML(message.note) + '</div>';
    if (message.artifact) {
      body += '<div class="eva-history-artifact"><span class="eva-history-artifact__icon">' + icon('file-text', 16, 'eva-i') + '</span><span><span class="eva-history-artifact__name eva-t-label-medium">' + escapeHTML(message.artifact[0]) + '</span><span class="eva-history-artifact__meta eva-t-caption">' + escapeHTML(message.artifact[1]) + '</span></span><span class="eva-history-artifact__action">' + icon('download', 16, 'eva-i') + '</span></div>';
    }
    return '<article class="eva-history-message' + (isUser ? ' is-user' : ' is-assistant') + '">'
      + '<div class="eva-history-message__sender eva-t-label">' + escapeHTML(isUser ? '王宜林' : assistantName) + (isUser ? '' : '<span class="eva-history-message__ai">AI</span>') + '</div>'
      + '<div class="eva-history-message__body">' + body + '</div></article>';
  }

  function historyConversationHTML() {
    var detail = conversationForTitle(selectedConversation) || conversationCatalog()[0];
    if (!detail) return '';
    return '<section class="eva-personal-workspace__conversation eva-personal-workspace__history">'
      + '<header class="eva-topbar eva-personal-workspace__topbar">'
      + '<span class="eva-personal-topbar__mark">' + icon('brain', 18, 'eva-i-nav') + '</span>'
      + '<span class="ttl eva-t-header">' + escapeHTML(detail.title) + '</span>'
      + '<span class="eva-history-header__assistant eva-t-label">' + escapeHTML(detail.assistant) + '</span>'
      + '<span style="flex:1 1 auto"></span>'
      + '<button class="eva-iconbtn" type="button" aria-label="更多操作">' + icon('ellipsis', 16, 'eva-i') + '</button></header>'
      + '<div class="eva-personal-workspace__stream"><div class="eva-flow eva-history-flow">'
      + detail.messages.map(function (message) { return historyMessageHTML(message, detail.assistant); }).join('')
      + '</div></div><div class="eva-personal-workspace__dock">' + composerPanelHTML() + '</div></section>';
  }

  /* ---- 完成态 ---------------------------------------------- */
  function slideHTML(slide, fontSize) {
    var body = '<div class="kicker">' + escapeHTML(slide.kicker) + '</div>'
      + '<h4' + (slide.sm ? ' class="sm"' : '') + '>' + slide.title + '</h4>';
    if (slide.by) body += '<div class="by">' + slide.by + '</div>';
    if (slide.rows) {
      body += '<div class="rows">' + slide.rows.map(function (row) {
        return '<div><span class="dot">•</span>' + escapeHTML(row) + '</div>';
      }).join('') + '</div>';
    }
    if (slide.cols) {
      body += '<div class="cols">' + slide.cols.map(function (col) {
        return '<div><b>' + escapeHTML(col[0]) + '</b><p>' + escapeHTML(col[1]) + '</p></div>';
      }).join('') + '</div>';
    }
    if (slide.bullets) {
      body += '<div class="bullets">' + slide.bullets.map(function (item) {
        return '<div><b><span class="accent">•</span> ' + escapeHTML(item[0]) + '</b><p>' + escapeHTML(item[1]) + '</p></div>';
      }).join('') + '</div>';
    }
    if (slide.hint) body += '<div class="hint">' + escapeHTML(slide.hint) + '</div>';
    return '<div class="eva-slide" style="font-size:' + fontSize + 'px"><div class="pad">' + body + '</div></div>';
  }

  function completedConversationHTML() {
    return '<aside class="eva-cv-col eva-personal-completed__conversation">'
      + '<header class="eva-topbar" style="gap:6px;padding:14px 12px">'
      + '<button class="eva-iconbtn" type="button" aria-label="收起侧栏">' + icon('arrow-left', 16, 'eva-i') + '</button>'
      + '<button class="eva-iconbtn" type="button" aria-label="搜索会话">' + icon('search', 16, 'eva-i') + '</button>'
      + '<button class="eva-iconbtn" type="button" aria-label="新建任务" data-eva-personal-new>' + icon('plus', 16, 'eva-i') + '</button>'
      + '<span class="eva-tool-sep"></span>'
      + '<span class="eva-personal-topbar__mark">' + icon('monitor', 18, 'eva-i-nav') + '</span>'
      + '<span class="ttl eva-t-header">' + escapeHTML(TASK_TITLE) + '</span>'
      + '<button class="eva-iconbtn" type="button" aria-label="更多操作">' + icon('ellipsis', 16, 'eva-i') + '</button>'
      + '</header>'
      + '<div class="eva-personal-completed__stream"><div class="eva-flow">'
      + userMessageHTML()
      + statusHTML('用时 9分钟 47秒')
      + '<p class="eva-para eva-t-body">已完成 6 页演示文稿：行业现状、岗位画像、能力模型、薪酬区间和结论各一页，首页是封面。</p>'
      + '<div class="eva-artifact">'
      + '<span class="eva-filemark ppt">P</span>'
      + '<span class="meta"><span class="nm eva-t-body">UI设计师发展前景.pptx</span>'
      + '<span class="sub eva-t-caption">6 页 · 2.4 MB</span></span>'
      + '<button class="eva-iconbtn" type="button" aria-label="打开文件">' + icon('external-link', 16, 'eva-i') + '</button>'
      + '</div>'
      + '<div class="eva-actionrow">'
      + '<button type="button" aria-label="复制">' + icon('copy', 16, 'eva-i') + '</button>'
      + '<button type="button" aria-label="有帮助">' + icon('circle-check', 16, 'eva-i') + '</button>'
      + '<button type="button" aria-label="没帮助">' + icon('circle-slash', 16, 'eva-i') + '</button>'
      + '<button type="button" aria-label="重新生成">' + icon('rotate-ccw', 16, 'eva-i') + '</button>'
      + '<button type="button" aria-label="更多">' + icon('ellipsis', 16, 'eva-i') + '</button>'
      + '</div>'
      + '</div></div>'
      + '<div class="eva-personal-completed__dock">' + composerPanelHTML('eva-composer-narrow') + '</div>'
      + '</aside>';
  }

  function toolbarButton(label, name) {
    return '<button class="eva-tool-btn eva-t-toolbar" type="button">'
      + icon(name, 20, 'eva-i-toolbar') + '<span class="lb">' + escapeHTML(label) + '</span></button>';
  }

  function completedEditorHTML() {
    return '<section class="eva-ed-col" aria-label="演示文稿编辑">'
      + '<div class="eva-tabbar" role="tablist">'
      + '<button class="eva-tab eva-t-label" type="button" role="tab" aria-selected="true">'
      + '<span class="eva-filemark ppt" style="width:14px;height:18px;font-size:9px">P</span>'
      + '<span class="nm">UI设计师发展前景.pptx</span>'
      + '<span class="cl">' + icon('x', 14, 'eva-i') + '</span></button>'
      + '<button class="eva-tab eva-t-label" type="button" role="tab" aria-selected="false">'
      + '<span class="eva-filemark doc" style="width:14px;height:18px;font-size:9px">W</span>'
      + '<span class="nm">行业数据摘要.docx</span>'
      + '<span class="cl">' + icon('x', 14, 'eva-i') + '</span></button>'
      + '</div>'
      + '<div class="eva-fileheader">'
      + '<span class="nm eva-t-body">UI设计师发展前景.pptx</span>'
      + '<button class="eva-iconbtn" type="button" aria-label="保存">' + icon('save', 16, 'eva-i') + '</button>'
      + '<button class="eva-iconbtn" type="button" aria-label="分享">' + icon('upload', 16, 'eva-i') + '</button>'
      + '<button class="eva-iconbtn" type="button" aria-label="下载">' + icon('download', 16, 'eva-i') + '</button>'
      + '</div>'
      + '<div class="eva-personal-completed__body">'
      + '<div class="eva-rail-slides" role="tablist" aria-label="页面">'
      + SLIDES.map(function (slide, index) {
        return '<div class="eva-sliderow">'
          + '<span class="no eva-t-caption">' + (index + 1) + '</span>'
          + '<button class="eva-thumb" type="button" role="tab" aria-current="' + (index === 0 ? 'true' : 'false') + '"'
          + ' aria-label="第 ' + (index + 1) + ' 页" data-eva-personal-slide="' + index + '">'
          + slideHTML(slide, 5.45) + '</button></div>';
      }).join('')
      + '</div>'
      + '<div class="eva-ed-main">'
      + '<div class="eva-toolbar" role="toolbar" aria-label="编辑工具">'
      + toolbarButton('撤销', 'rotate-ccw')
      + '<span class="eva-tool-sep"></span>'
      + toolbarButton('文字', 'pencil')
      + toolbarButton('图片', 'file-image')
      + toolbarButton('形状', 'hexagon')
      + toolbarButton('表格', 'layout-grid')
      + '<span class="eva-tool-sep"></span>'
      + toolbarButton('单页样式', 'sliders-horizontal')
      + '</div>'
      + '<div class="eva-viewport"><div class="eva-canvas" data-eva-personal-canvas>' + slideHTML(SLIDES[0], 16) + '</div></div>'
      + '<div class="eva-statusbar eva-t-caption">'
      + '<span data-eva-personal-page>第 1 页</span><span>第 ' + SLIDES.length + ' 页</span>'
      + '<span class="sp"></span>'
      + '<button class="eva-iconbtn" type="button" aria-label="适应窗口">' + icon('maximize-2', 16, 'eva-i') + '</button>'
      + '<button class="eva-iconbtn" type="button" aria-label="缩小">' + icon('minus', 16, 'eva-i') + '</button>'
      + '<span>155%</span>'
      + '<button class="eva-iconbtn" type="button" aria-label="放大">' + icon('plus', 16, 'eva-i') + '</button>'
      + '</div></div></div></section>';
  }

  /* ---- 整页 ------------------------------------------------ */
  function workspaceHTML() {
    return assistantRailHTML() + '<div class="eva-personal-workspace__stage"><div class="eva-personal-workspace__scroll">'
      + '<div class="eva-personal-workspace__column">'
      + heroHTML()
      + railHTML()
      + '<div class="eva-personal-workspace__composer">'
      + pickerHTML()
      + '<div class="eva-composer-wrap">' + composerPanelHTML() + quickSkillsHTML() + '</div>'
      + '</div></div></div>'
      + generatingHTML()
      + historyConversationHTML()
      + '<div class="eva-personal-workspace__completed">'
      + completedConversationHTML()
      + completedEditorHTML()
      + '</div>'
      + opcardHTML() + '</div>';
  }

  function render() {
    if (!root) return;
    root.setAttribute('data-eva-state', state);
    root.innerHTML = workspaceHTML();
  }

  function ensureRoot(host) {
    if (!root) {
      root = document.createElement('section');
      root.id = 'eva-personal-workspace';
      root.className = 'eva-personal-workspace';
      root.setAttribute('aria-label', '个人 Eva 工作区');
    }
    if (host && root.parentElement !== host) host.appendChild(root);
    return root;
  }

  function setState(next) {
    if (STATES.indexOf(next) < 0) return state;
    if (generatingTimer && next !== 'generating') {
      clearTimeout(generatingTimer);
      generatingTimer = 0;
    }
    state = next;
    render();
    return state;
  }

  function startGenerating() {
    if (!draft && !activeSkill) return;
    setState('generating');
    generatingTimer = setTimeout(function () {
      generatingTimer = 0;
      setState('completed');
    }, 2400);
  }

  function resetToHome() {
    draft = '';
    activeSkill = null;
    pickerQuery = '';
    setState('home');
  }

  /* ---- 交互 ------------------------------------------------
     捕获阶段单一委托，与 044 同样的写法；只处理挂在本页根节点内的
     目标，不碰侧栏与其它页。
     -------------------------------------------------------- */
  document.addEventListener('click', function (event) {
    if (!root || !root.isConnected) return;
    var inside = event.target.closest && event.target.closest('#eva-personal-workspace');
    if (!inside) return;

    var scenario = event.target.closest('[data-eva-scenario]');
    if (scenario) {
      event.preventDefault();
      var picked = SCENARIOS.filter(function (item) { return item.id === scenario.dataset.evaScenario; })[0];
      var skill = picked && picked.skill
        ? SKILLS.filter(function (item) { return item.id === picked.skill; })[0]
        : null;
      activeSkill = skill || null;
      draft = skill ? TASK_TITLE : (picked ? picked.label + '：' : '');
      setState(skill && skill.operation ? 'operation' : 'input');
      return;
    }

    var skillRow = event.target.closest('[data-eva-skill]');
    if (skillRow) {
      event.preventDefault();
      activeSkill = SKILLS.filter(function (item) { return item.id === skillRow.dataset.evaSkill; })[0] || null;
      pickerQuery = '';
      draft = activeSkill && activeSkill.id === 'ppt' ? TASK_TITLE : draft;
      setState(activeSkill && activeSkill.operation ? 'operation' : 'input');
      return;
    }

    if (event.target.closest('[data-eva-personal-dismiss]')) {
      event.preventDefault();
      setState('input');
      return;
    }

    if (event.target.closest('[data-eva-personal-send]')) {
      event.preventDefault();
      startGenerating();
      return;
    }

    if (event.target.closest('[data-eva-personal-stop]')) {
      event.preventDefault();
      setState('completed');
      return;
    }

    if (event.target.closest('[data-eva-personal-new]')) {
      event.preventDefault();
      resetToHome();
      return;
    }

    var toggleAssistant = event.target.closest('[data-eva-toggle-assistant]');
    if (toggleAssistant) {
      event.preventDefault();
      var assistantFolder = toggleAssistant.closest('[data-eva-assistant-id]');
      selectedAssistantId = assistantFolder.dataset.evaAssistantId;
      if (collapsedAssistants.has(assistantFolder.dataset.evaAssistantId)) collapsedAssistants.delete(assistantFolder.dataset.evaAssistantId);
      else collapsedAssistants.add(assistantFolder.dataset.evaAssistantId);
      render();
      return;
    }

    var assistantNewChat = event.target.closest('[data-eva-new-assistant-chat]');
    if (assistantNewChat) {
      event.preventDefault();
      selectedAssistantId = assistantNewChat.dataset.evaNewAssistantChat;
      selectedConversation = '';
      resetToHome();
      if (location.hash.indexOf('#/guid') !== 0) location.hash = '#/guid';
      return;
    }

    var conversation = event.target.closest('[data-eva-personal-conversation]');
    if (conversation) {
      event.preventDefault();
      selectedConversation = conversation.dataset.evaPersonalConversation;
      selectedAssistantId = conversation.closest('[data-eva-assistant-id]').dataset.evaAssistantId;
      var detail = conversationForId(conversation.dataset.evaPersonalConversationId) || conversationForTitle(selectedConversation);
      if (detail && location.hash !== '#/conversation/' + detail.id) location.hash = '#/conversation/' + detail.id;
      else setState('history');
      return;
    }

    var thumb = event.target.closest('[data-eva-personal-slide]');
    if (thumb) {
      event.preventDefault();
      var index = Number(thumb.dataset.evaPersonalSlide) || 0;
      root.querySelectorAll('[data-eva-personal-slide]').forEach(function (item) {
        item.setAttribute('aria-current', item === thumb ? 'true' : 'false');
      });
      var canvas = root.querySelector('[data-eva-personal-canvas]');
      if (canvas) canvas.innerHTML = slideHTML(SLIDES[index], 16);
      var label = root.querySelector('[data-eva-personal-page]');
      if (label) label.textContent = '第 ' + (index + 1) + ' 页';
      return;
    }

    var prompt = event.target.closest('.eva-composer-prompt');
    if (prompt) prompt.focus();
  }, true);

  /* 输入器是 GDS 的复合展示件（mention + 占位 + @ 提示），不是原生
     input，所以在 keydown 上做 demo 级录入：可打字、退格、@ 开选择器、
     Esc 关闭、Enter 发送。 */
  document.addEventListener('keydown', function (event) {
    if (!root || !root.isConnected) return;
    if (state === 'generating' || state === 'completed') return;
    var prompt = event.target.closest && event.target.closest('#eva-personal-workspace .eva-composer-prompt');
    if (!prompt) return;

    if (event.key === 'Escape') {
      if (state === 'skill-picker') {
        event.preventDefault();
        pickerQuery = '';
        setState(draft || activeSkill ? 'input' : 'home');
      }
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (state === 'skill-picker') {
        var first = root.querySelector('[data-eva-skill]');
        if (first) first.click();
        return;
      }
      startGenerating();
      return;
    }
    if (event.key === 'Backspace') {
      event.preventDefault();
      if (state === 'skill-picker') {
        if (pickerQuery) { pickerQuery = pickerQuery.slice(0, -1); render(); }
        else setState(draft || activeSkill ? 'input' : 'home');
        return;
      }
      if (draft) { draft = draft.slice(0, -1); setState(draft || activeSkill ? 'input' : 'home'); return; }
      if (activeSkill) { activeSkill = null; setState('home'); }
      return;
    }
    if (event.key === '@' && state !== 'skill-picker') {
      event.preventDefault();
      pickerQuery = '';
      setState('skill-picker');
      return;
    }
    if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      if (state === 'skill-picker') { pickerQuery += event.key; render(); return; }
      draft += event.key;
      setState('input');
    }
  }, true);

  /* 路由是会话选中态的唯一权威源。/guid 是新对话首页，/conversation/:id
     从数据仓恢复所选助理与会话；组件重挂载时同样调用这个函数。 */
  function syncRouteState() {
    var hash = String(location.hash || '');
    var match = hash.match(/^#\/conversation\/([^?]+)/);
    var detail = match && conversationForId(decodeURIComponent(match[1]));
    if (detail) {
      selectedConversation = detail.title;
      selectedAssistantId = detail.assistantId;
      draft = '';
      activeSkill = null;
      pickerQuery = '';
      state = 'history';
      return;
    }
    if (hash.indexOf('#/guid') === 0 && state !== 'home') resetToHome();
  }

  window.addEventListener('hashchange', function () {
    syncRouteState();
    if (root && root.isConnected) render();
  });

  document.addEventListener('eva:personal-assistants-change', function () {
    if (root && root.isConnected) render();
  });

  /* 评审用：直接跳任一态，或不带参数读当前态。 */
  window.__evaPersonalState = function (next) {
    if (next == null) return state;
    return setState(next);
  };

  window.__evaNativePages.register('personal', function (host) {
    ensureRoot(host);
    root.hidden = false;
    syncRouteState();
    render();
    return function () {
      if (generatingTimer) { clearTimeout(generatingTimer); generatingTimer = 0; }
      if (root.parentElement === host) root.remove();
    };
  });
})();
