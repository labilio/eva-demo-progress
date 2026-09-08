
(function () {
  'use strict';

  /* GDS personal lifecycle: native personal sessions retain their own rail and
     data. One active lifecycle is rendered at a time. Completed tasks replace
     the assistant rail with a 390px context column beside the editor; the
     application navigation/titlebar remain owned by the router shell.
     All generated artifacts here are explicitly local prototype previews. */

  /* history 是已有会话的上下文态；它不属于一次新任务的六态生命周期，
     但与 generating 共用 GDS 的会话骨架和输入器。 */
  var STATES = ['home', 'input', 'skill-picker', 'operation', 'generating', 'completed', 'history'];

  var SCENARIOS = [
    { id: 'agent', label: '星睿智能体', icon: 'sparkles' },
    { id: 'mail', label: '邮件操作', icon: 'mail' },
    { id: 'data', label: '数据分析', icon: 'layout-grid' },
    { id: 'skill', label: '技能开发', icon: 'cpu' },
    { id: 'knowledge', label: '知识助手', icon: 'book-open' },
    { id: 'collaboration', label: '飞书协作', icon: 'link-2' }
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
  var pickerIndex = 0;
  var conversationPickerOpen = false;
  var generatingTimer = 0;
  var submitted = null;
  var activeDocument = 'presentation';
  var slideIndex = 0;
  var slideDrafts = Object.create(null);
  var zoom = 100;
  var feedback = '';
  var editing = false;
  var root = null;
  var selectedConversation = '';
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

  function selectedAssistant() {
    var assistants = window.__EVA_PERSONAL_ASSISTANTS || [];
    return assistants.find(function (assistant) { return assistant.id === selectedAssistantId; })
      || assistants[0]
      || { id: 'assistant-general', name: '通用助理' };
  }

  function isNewConversationState() {
    return state === 'home' || state === 'input' || state === 'skill-picker' || state === 'operation';
  }

  function skillPickerOpen() {
    return state === 'skill-picker' || conversationPickerOpen;
  }

  // The personal page owns the picker. Within a conversation it only updates
  // the composer, leaving the result DOM, selection and editor undo stack intact.
  function updateConversationComposer() {
    var composer = root.querySelector('[data-eva-personal-composer]');
    if (composer) composer.outerHTML = composerPanelHTML(state === 'completed' ? 'eva-composer-narrow' : '');
    var input = root.querySelector('.eva-composer-prompt');
    if (input) { input.focus({preventScroll:true}); input.setSelectionRange(input.value.length, input.value.length); }
  }

  function openSkillPicker() {
    pickerQuery = ''; pickerIndex = 0;
    if (state === 'completed' || state === 'history') {
      conversationPickerOpen = true;
      updateConversationComposer();
    } else setState('skill-picker');
  }

  function closeSkillPicker() {
    pickerQuery = '';
    if (conversationPickerOpen) {
      conversationPickerOpen = false;
      updateConversationComposer();
    } else setState(activeSkill && activeSkill.operation ? 'operation' : draft || activeSkill ? 'input' : 'home');
  }

  function assistantRailHTML() {
    var assistants = window.__EVA_PERSONAL_ASSISTANTS || [];
    var tasks = window.__EVA_PERSONAL_ASSISTANT_TASKS || {};
    return '<aside class="eva-personal-sider-panel" aria-label="Eva 助理与对话">'
      + '<div class="eva-personal-sider-panel__body"><div class="eva-assistant-tree">'
      + '<div class="eva-my-ai-sidebar-actions eva-personal-sidebar-actions">'
      + '<a href="#/eva-stub/Agent创建中心?evaCreate=mine" class="eva-assistant-tree__create eva-my-ai-sidebar-actions__create-assistant" aria-label="创建助理">'
      + icon('plus', 16, 'eva-i') + '<span>创建助理</span></a></div>'
      + assistants.map(function (assistant) {
        var collapsed = collapsedAssistants.has(assistant.id);
        var selected = selectedAssistantId === assistant.id;
        return '<section class="eva-assistant-folder eva-personal-assistant-folder' + (collapsed ? ' is-collapsed' : '') + (selected ? ' is-selected-assistant' : '') + '" data-eva-assistant-id="' + escapeHTML(assistant.id) + '" data-eva-assistant-name="' + escapeHTML(assistant.name) + '">'
          + '<div class="eva-personal-assistant-folder__row"><button type="button" class="eva-assistant-folder__button" aria-expanded="' + String(!collapsed) + '" data-eva-toggle-assistant>'
          + '<span class="eva-assistant-folder__icon" aria-hidden="true">' + icon('brain', 18, 'eva-i') + '</span>'
          + '<span class="eva-assistant-folder__name">' + escapeHTML(assistant.name) + '</span>'
          + '<span class="eva-assistant-folder__chevron" aria-hidden="true">' + icon('chevron-right', 12, 'eva-i-chevron') + '</span></button>'
          + '<span class="eva-personal-assistant-folder__actions"><button type="button" aria-label="查看' + escapeHTML(assistant.name) + '配置" title="查看配置" data-eva-edit-assistant>' + icon('link-2', 16, 'eva-i') + '</button>'
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
      + '<div class="eva-personal-workspace__hero-grid" aria-hidden="true"></div>'
      + '<h1 class="eva-personal-workspace__welcome">'
      + '<span>你好，我是Eva同学</span>'
      + '</h1><span class="eva-personal-workspace__hi" aria-hidden="true">hi</span><img class="eva-personal-workspace__mascot" src="prototype/assets/eva-wave.png" alt="">'
      + '</div>';
  }

  /* ---- 场景 chip 排 ---------------------------------------- */
  function railHTML() {
    return '<div class="eva-rail eva-personal-workspace__rail" role="group" aria-label="快捷能力">'
      + SCENARIOS.map(function (item) {
        return '<button class="eva-chip eva-t-chip eva-personal-workspace__capability" type="button" data-eva-scenario="' + item.id + '">'
          + icon(item.icon, 16, 'eva-i') + '<span>' + escapeHTML(item.label) + '</span></button>';
      }).join('')
      + '<button class="eva-rail-next" type="button" aria-label="更多快捷能力">' + icon('chevron-right', 12, 'eva-i-chevron') + '</button>'
      + '</div>';
  }

  /* Native composer: selection, paste and IME are browser-owned. */
  function sendHTML() {
    if (state === 'generating') {
      return '<button class="eva-send" type="button" data-state="running" data-eva-personal-stop aria-label="停止生成">'
        + '<span class="eva-personal-tool__icon">' + icon('square', 12, 'eva-i') + '</span></button>';
    }
    var ready = !skillPickerOpen() && Boolean(draft.trim());
    return '<button class="eva-send" type="button" data-state="' + (ready ? 'enabled' : 'disabled') + '"'
      + (ready ? ' data-eva-personal-send' : ' disabled')
      + ' aria-label="' + (ready ? '发送' : '发送（输入后可用）') + '">'
      + icon('arrow-up', 16, 'eva-i') + '</button>';
  }

  function actionsHTML() {
    return '<div class="eva-composer-actions">'
      + '<button class="eva-round eva-round-ghost" type="button" disabled title="原型暂未实现此操作" aria-label="添加附件">' + icon('plus', 16, 'eva-i') + '</button>'
      + '<span style="flex:1 1 auto"></span>'
      + '<button class="eva-model eva-t-label" type="button" disabled title="当前原型使用 Auto">Auto' + icon('chevron-down', 12, 'eva-i-chevron') + '</button>'
      + '<button class="eva-round eva-round-plain" type="button" disabled title="原型暂未实现此操作" aria-label="语音输入">' + icon('mic', 16, 'eva-i') + '</button>'
      + sendHTML()
      + '</div>';
  }

  function composerPanelHTML(extraClass) {
    var value = skillPickerOpen() ? pickerQuery : draft;
    var mention = activeSkill && !skillPickerOpen()
      ? '<span class="eva-mention eva-t-body-medium">' + icon(activeSkill.icon, 16, 'eva-i') + escapeHTML(activeSkill.name) + '</span>' : '';
    return '<div class="eva-composer' + (extraClass ? ' ' + extraClass : '') + '" data-eva-personal-composer>'
      + (conversationPickerOpen ? pickerHTML() : '')
      + '<div class="eva-composer-input-area">' + (skillPickerOpen() ? '<span aria-hidden="true">@</span>' : '') + mention
      + '<textarea class="eva-composer-prompt" aria-label="向 Eva 同学提问"' + (skillPickerOpen() ? ' role="combobox" aria-expanded="true" aria-controls="eva-skill-list" aria-activedescendant="eva-skill-option-' + pickerIndex + '"' : '') + ' placeholder="' + (skillPickerOpen() ? '输入技能名称' : '要我帮你做些什么？ @ 调用技能与指令') + '"'
      + (state === 'generating' ? ' disabled' : '') + '>' + escapeHTML(value) + '</textarea></div>'
      + actionsHTML() + '</div>';
  }

  /* ---- 技能选择器 ------------------------------------------ */
  function pickerHTML() {
    var query = pickerQuery.toLowerCase();
    var rows = SKILLS.filter(function (skill) {
      return !query || skill.name.toLowerCase().indexOf(query) >= 0 || skill.desc.indexOf(pickerQuery) >= 0;
    });
    return '<div class="eva-personal-workspace__pickerhost">'
      + '<div class="eva-picker" role="listbox" id="eva-skill-list" aria-label="技能">'
      + '<div class="eva-picker-head eva-t-label-medium">技能(' + rows.length + ')</div>'
      + '<div class="eva-picker-list">'
      + rows.map(function (skill, index) {
        return '<button class="eva-skillrow" type="button" role="option" aria-selected="' + String(index === pickerIndex) + '"'
          + (index === pickerIndex ? ' data-active="true"' : '')
          + ' id="eva-skill-option-' + index + '" data-eva-skill="' + skill.id + '">'
          + '<span class="ic eva-personal-tool__icon">' + icon(skill.icon, 16, 'eva-i') + '</span>'
          + '<span class="nm eva-t-label">' + escapeHTML(skill.name) + '</span>'
          + '<span class="ds eva-t-label">' + escapeHTML(skill.desc) + '</span>'
          + '</button>';
      }).join('')
      + (rows.length ? '' : '<div class="eva-picker-empty eva-t-label" role="status">没有匹配的技能，换个关键词试试</div>')
      + '</div></div></div>';
  }

  /* ---- 操作卡 ---------------------------------------------- */
  function opcardHTML() {
    return '<div class="eva-personal-workspace__opcard">'
      + '<aside class="eva-opcard" aria-label="运营推荐">'
      + '<div class="eva-opcard-img">'
      + '<img src="prototype/assets/operation-card.png" alt="Eva 新模型介绍">'
      + '<button class="eva-dismiss" type="button" aria-label="关闭" data-eva-personal-dismiss>' + icon('x', 12, 'eva-i') + '</button>'
      + '</div>'
      + '<div class="eva-opcard-copy">'
      + '<p class="eva-t-label">Eva同学上线新模型啦～功能更加强悍，更加聪明。</p>'
      + '<button class="eva-opcard-cta eva-t-label-medium" type="button" data-eva-personal-dismiss>立即体验</button>'
      + '</div></aside></div>';
  }

  /* ---- 会话流片段 ------------------------------------------ */
  function taskTitle() { return submitted ? submitted.text : TASK_TITLE; }
  function isPresentation() { return !submitted || submitted.skill && submitted.skill.id === 'ppt'; }
  function userMessageHTML() {
    var skill = submitted ? submitted.skill : TASK_SKILL;
    return '<div class="eva-usermsg"><div>'
      + (skill ? '<span class="eva-mention eva-t-body-medium">' + icon(skill.icon, 16, 'eva-i') + escapeHTML(skill.name) + '</span>' : '')
      + '<span class="eva-t-body">' + escapeHTML(taskTitle()) + '</span></div></div>';
  }

  function statusHTML(text) {
    return '<div class="eva-status eva-t-label" role="status" aria-live="polite"><span>' + escapeHTML(text) + '</span>'
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
      + '<span class="ttl eva-t-header">' + escapeHTML(taskTitle()) + '</span>'
      + '<button class="eva-iconbtn" type="button" disabled title="原型暂未实现此操作" aria-label="更多操作">' + icon('ellipsis', 16, 'eva-i') + '</button>'
      + '<span style="flex:1 1 auto"></span>'
      + '<div class="eva-topbar-icons">'
      + '<button class="eva-iconbtn" type="button" disabled title="原型暂未实现此操作" aria-label="收起侧栏">' + icon('arrow-left', 16, 'eva-i') + '</button>'
      + '</div></header>'
      + '<div class="eva-personal-workspace__stream"><div class="eva-flow">'
      + userMessageHTML()
      + statusHTML('正在准备本地预览')
      + toolHTML({state:'success', text:'已收到你的要求'})
      + toolHTML({state:'running', text:'正在加载原型示例'})
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
      + '<div class="eva-history-message__sender eva-t-label">' + escapeHTML(isUser ? '王宜林' : assistantName) + '' + '</div>'
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
      + '<button class="eva-iconbtn" type="button" disabled title="原型暂未实现此操作" aria-label="更多操作">' + icon('ellipsis', 16, 'eva-i') + '</button></header>'
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
      + '<button class="eva-iconbtn" type="button" disabled title="原型暂未实现此操作" aria-label="收起侧栏">' + icon('arrow-left', 16, 'eva-i') + '</button>'
      + '<button class="eva-iconbtn" type="button" disabled title="原型暂未实现此操作" aria-label="搜索会话">' + icon('search', 16, 'eva-i') + '</button>'
      + '<button class="eva-iconbtn" type="button" aria-label="新建任务" data-eva-personal-new>' + icon('plus', 16, 'eva-i') + '</button>'
      + '<span class="eva-tool-sep"></span>'
      + '<span class="eva-personal-topbar__mark">' + icon('monitor', 18, 'eva-i-nav') + '</span>'
      + '<span class="ttl eva-t-header">' + escapeHTML(taskTitle()) + '</span>'
      + '<button class="eva-iconbtn" type="button" disabled title="原型暂未实现此操作" aria-label="更多操作">' + icon('ellipsis', 16, 'eva-i') + '</button>'
      + '</header>'
      + '<div class="eva-personal-completed__stream"><div class="eva-flow">'
      + userMessageHTML()
      + statusHTML('本地预览已就绪')
      + '<p class="eva-para eva-t-body">' + (isPresentation() ? '以下为预置的 6 页演示稿，用于体验预览与编辑。' : '已记录你的要求，可在右侧继续编辑。') + '此原型未调用模型生成内容。</p>'
      + '<div class="eva-artifact">'
      + '<span class="eva-filemark ppt">P</span>'
      + '<span class="meta"><span class="nm eva-t-body">' + (isPresentation() ? 'UI设计师发展前景.pptx' : '任务草稿.txt') + '</span>'
      + '<span class="sub eva-t-caption">本地示例预览</span></span>'
      + '<button class="eva-iconbtn" type="button" aria-label="打开文件">' + icon('external-link', 16, 'eva-i') + '</button>'
      + '</div>'
      + '<div class="eva-actionrow">'
      + '<button type="button" aria-label="复制">' + icon('copy', 16, 'eva-i') + '</button>'
      + '<button type="button" aria-label="有帮助">' + icon('circle-check', 16, 'eva-i') + '</button>'
      + '<button type="button" aria-label="没帮助">' + icon('circle-slash', 16, 'eva-i') + '</button>'
      + '<button type="button" aria-label="重新生成">' + icon('rotate-ccw', 16, 'eva-i') + '</button>'
      + '<button type="button" disabled title="原型暂未实现此操作" aria-label="更多">' + icon('ellipsis', 16, 'eva-i') + '</button>'
      + '</div><span class="eva-t-caption" role="status" data-eva-feedback>' + escapeHTML(feedback) + '</span>'
      + '</div></div>'
      + '<div class="eva-personal-completed__dock">' + composerPanelHTML('eva-composer-narrow') + '</div>'
      + '</aside>';
  }

  function toolbarButton(label, name) {
    return '<button class="eva-tool-btn eva-t-toolbar" type="button" aria-label="' + escapeHTML(label) + '"' + (label === '文字' ? ' data-eva-edit-text aria-pressed="false"' : ' disabled title="原型暂未实现此编辑操作"') + '>'
      + icon(name, 20, 'eva-i-toolbar') + '<span class="lb">' + escapeHTML(label) + '</span></button>';
  }

  function completedEditorHTML() {
    return '<section class="eva-ed-col" aria-label="演示文稿编辑">'
      + '<div class="eva-tabbar" role="tablist">'
      + '<button class="eva-tab eva-t-label" type="button" role="tab" aria-selected="true" data-eva-document="presentation">'
      + '<span class="eva-filemark ppt" style="width:14px;height:18px;font-size:9px">P</span>'
      + '<span class="nm">UI设计师发展前景.pptx</span>'
      + '</button>'
      + '<button class="eva-tab eva-t-label" type="button" role="tab" aria-selected="false" data-eva-document="document">'
      + '<span class="eva-filemark doc" style="width:14px;height:18px;font-size:9px">W</span>'
      + '<span class="nm">任务草稿.txt</span>'
      + '</button>'
      + '</div>'
      + '<div class="eva-fileheader">'
      + '<span class="nm eva-t-body">' + (isPresentation() ? 'UI设计师发展前景.pptx' : '任务草稿.txt') + '</span>'
      + '<button class="eva-iconbtn" type="button" disabled title="原型暂未实现此操作" aria-label="保存">' + icon('save', 16, 'eva-i') + '</button>'
      + '<button class="eva-iconbtn" type="button" disabled title="原型暂未实现此操作" aria-label="分享">' + icon('upload', 16, 'eva-i') + '</button>'
      + '<button class="eva-iconbtn" type="button" disabled title="原型暂未实现此操作" aria-label="下载">' + icon('download', 16, 'eva-i') + '</button>'
      + '</div>'
      + '<div class="eva-personal-completed__body">'
      + '<div class="eva-rail-slides" role="tablist" aria-label="页面">'
      + SLIDES.map(function (slide, index) {
        return '<div class="eva-sliderow">'
          + '<span class="no eva-t-caption">' + (index + 1) + '</span>'
          + '<button class="eva-thumb" type="button" role="tab" aria-current="' + (index === 0 ? 'true' : 'false') + '"'
          + ' aria-selected="' + String(index === 0) + '" aria-label="第 ' + (index + 1) + ' 页" data-eva-personal-slide="' + index + '">'
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
      + '<div class="eva-viewport"><div class="eva-canvas" data-eva-personal-canvas>' + slideHTML(SLIDES[0], 16) + '</div></div></div></div>'
      + '<div class="eva-statusbar eva-t-caption">'
      + '<span data-eva-personal-page>第 1 页</span><span>第 ' + SLIDES.length + ' 页</span>'
      + '<span class="sp"></span>'
      + '<button class="eva-iconbtn" type="button" aria-label="适应窗口">' + icon('maximize-2', 16, 'eva-i') + '</button>'
      + '<button class="eva-iconbtn" type="button" aria-label="缩小">' + icon('minus', 16, 'eva-i') + '</button>'
      + '<span data-eva-zoom>100%</span>'
      + '<button class="eva-iconbtn" type="button" aria-label="放大">' + icon('plus', 16, 'eva-i') + '</button>'
      + '</div></section>';
  }

  /* ---- 整页 ------------------------------------------------ */
  function workspaceHTML() {
    var content;
    if (isNewConversationState()) {
      content = '<div class="eva-personal-workspace__scroll"><div class="eva-personal-workspace__column">'
        + heroHTML() + railHTML() + '<div class="eva-personal-workspace__composer">'
        + (skillPickerOpen() ? pickerHTML() : '')
        + '<div class="eva-composer-wrap">' + composerPanelHTML()
        + '<div class="eva-personal-quickskills"><button type="button" data-eva-open-skills>' + icon('sparkles', 16, 'eva-i') + '调用技能' + icon('chevron-down', 12, 'eva-i-chevron')
        + '</button><span data-eva-selected-assistant="' + escapeHTML(selectedAssistant().id) + '">' + icon('brain', 16, 'eva-i') + escapeHTML(selectedAssistant().name) + '</span></div></div></div></div></div>';
    } else if (state === 'generating') content = generatingHTML();
    else if (state === 'history') content = historyConversationHTML();
    else content = '<div class="eva-personal-workspace__completed">' + completedConversationHTML() + completedEditorHTML() + '</div>';
    return (state === 'completed' ? '' : assistantRailHTML())
      + '<div class="eva-personal-workspace__stage">' + content + '</div>'
      + (state === 'operation' ? opcardHTML() : '');
  }

  function render() {
    if (!root) return;
    var input = root.querySelector('.eva-composer-prompt');
    var focused = input && document.activeElement === input;
    var caret = input ? input.selectionStart : 0;
    root.setAttribute('data-eva-state', state);
    root.innerHTML = workspaceHTML();
    if (state === 'completed') syncEditor();
    if (focused) {
      input = root.querySelector('.eva-composer-prompt');
      if (input && !input.disabled) {
        input.focus({preventScroll:true});
        input.setSelectionRange(Math.min(caret,input.value.length), Math.min(caret,input.value.length));
      }
    }
  }

  function syncEditor() {
    if (!root) return;
    root.querySelectorAll('[data-eva-document]').forEach(function(tab) {
      tab.setAttribute('aria-selected', String(tab.dataset.evaDocument === activeDocument));
    });
    var headerName = root.querySelector('.eva-fileheader .nm');
    if (headerName) headerName.textContent = activeDocument === 'presentation' ? 'UI设计师发展前景.pptx' : '任务草稿.txt';
    var body = root.querySelector('.eva-personal-completed__body');
    if (!body) return;
    body.dataset.document = activeDocument;
    var doc = body.querySelector('.eva-document-preview');
    if (!doc) {
      doc = document.createElement('article');
      doc.className = 'eva-document-preview eva-t-body';
      doc.setAttribute('contenteditable','true');
      doc.setAttribute('aria-label','编辑任务草稿');
      doc.textContent = taskTitle() + '\n\n此处记录你的任务要求，可直接修改和补充。';
      body.appendChild(doc);
    }
    var canvas = root.querySelector('[data-eva-personal-canvas]');
    if (canvas) { canvas.style.transform = 'scale(' + zoom / 100 + ')'; }
    var scale = root.querySelector('[data-eva-zoom]');
    if (scale) scale.textContent = zoom + '%';
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
    conversationPickerOpen = false;
    state = next;
    render();
    return state;
  }

  function startGenerating() {
    if (!draft.trim()) return;
    submitted = {text:draft.trim(), skill:activeSkill};
    draft = ''; activeSkill = null; feedback = ''; slideIndex = 0; zoom = 100;
    slideDrafts = Object.create(null); editing = false;
    activeDocument = isPresentation() ? 'presentation' : 'document';
    setState('generating');
    generatingTimer = setTimeout(function () {
      generatingTimer = 0;
      setState('completed');
    }, 2400);
  }

  function resetToHome() {
    draft = '';
    activeSkill = null;
    submitted = null;
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

    if (event.target.closest('[data-eva-edit-text]')) {
      editing = !editing;
      event.target.closest('button').setAttribute('aria-pressed', String(editing));
      var editableCanvas = root.querySelector('[data-eva-personal-canvas]');
      editableCanvas.setAttribute('contenteditable', String(editing));
      editableCanvas.setAttribute('aria-label', '编辑当前幻灯片文字');
      if (editing) editableCanvas.focus();
      return;
    }

    var documentTab = event.target.closest('[data-eva-document]');
    if (documentTab) { activeDocument = documentTab.dataset.evaDocument; syncEditor(); return; }
    var action = event.target.closest('button[aria-label]');
    if (state === 'completed' && action) {
      var label = action.getAttribute('aria-label');
      if (label === '缩小' || label === '放大' || label === '适应窗口') {
        zoom = label === '适应窗口' ? 100 : Math.max(50, Math.min(150, zoom + (label === '放大' ? 10 : -10)));
        syncEditor(); return;
      }
      if (label === '有帮助' || label === '没帮助') {
        action.setAttribute('aria-pressed','true');
        feedback = '已记录反馈'; root.querySelector('[data-eva-feedback]').textContent = feedback; return;
      }
      if (label === '重新生成') { draft = taskTitle(); activeSkill = submitted && submitted.skill; startGenerating(); return; }
      if (label === '打开文件') { root.querySelector('.eva-ed-col').scrollIntoView({block:'nearest'}); return; }
      if (label === '复制') {
        navigator.clipboard.writeText(taskTitle()).then(function() { if(root && root.querySelector('[data-eva-feedback]')) root.querySelector('[data-eva-feedback]').textContent='已复制'; }); return;
      }
    }

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
      draft = !draft.trim() && activeSkill && activeSkill.id === 'ppt' ? TASK_TITLE : draft;
      closeSkillPicker();
      var input = root.querySelector('.eva-composer-prompt');
      if (input) { input.focus(); input.setSelectionRange(input.value.length,input.value.length); }
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
      draft = submitted ? submitted.text : ''; activeSkill = submitted ? submitted.skill : null;
      setState('input');
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
      slideIndex = index;
      root.querySelectorAll('[data-eva-personal-slide]').forEach(function (item) {
        item.setAttribute('aria-current', item === thumb ? 'true' : 'false');
        item.setAttribute('aria-selected', item === thumb ? 'true' : 'false');
      });
      var canvas = root.querySelector('[data-eva-personal-canvas]');
      if (canvas) canvas.innerHTML = slideDrafts[index] ?? slideHTML(SLIDES[index], 16);
      var label = root.querySelector('[data-eva-personal-page]');
      if (label) label.textContent = '第 ' + (index + 1) + ' 页';
      return;
    }

    var prompt = event.target.closest('.eva-composer-prompt');
    if (prompt) prompt.focus();
  }, true);

  document.addEventListener('keydown', function(event) {
    if (!root || !root.contains(event.target)) return;
    var tab = event.target.closest('[role="tab"]');
    if (!tab || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
    var list = tab.closest('[role="tablist"]');
    var tabs = Array.from(list.querySelectorAll('[role="tab"]'));
    var current = tabs.indexOf(tab);
    var next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length-1 : (current + (['ArrowLeft','ArrowUp'].includes(event.key) ? -1 : 1) + tabs.length) % tabs.length;
    event.preventDefault(); tabs[next].focus(); tabs[next].click();
  });

  // Keep edits with their slide for this generated result, not with the active DOM node.
  document.addEventListener('input', function(event) {
    if (!root || !root.contains(event.target)) return;
    var canvas = event.target.closest('[data-eva-personal-canvas]');
    if (canvas && editing) slideDrafts[slideIndex] = canvas.innerHTML;
  });

  // Native textarea owns IME composition, paste, selection and undo. Updating
  // draft never replaces the focused input; only the picker list is refreshed.
  document.addEventListener('input', function (event) {
    if (!root || !root.contains(event.target) || !event.target.matches('.eva-composer-prompt')) return;
    if (skillPickerOpen()) {
      pickerQuery = event.target.value;
      pickerIndex = 0;
      var host = root.querySelector('.eva-personal-workspace__pickerhost');
      if (host) host.outerHTML = pickerHTML();
      if (root.querySelector('[data-eva-skill]')) event.target.setAttribute('aria-activedescendant','eva-skill-option-0');
      else event.target.removeAttribute('aria-activedescendant');
    } else {
      draft = event.target.value;
      if (isNewConversationState() && state !== 'operation') {
        state = draft || activeSkill ? 'input' : 'home';
        root.dataset.evaState = state;
      }
      var send = root.querySelector('.eva-send');
      if (send) send.outerHTML = sendHTML();
    }
  });
  document.addEventListener('keydown', function (event) {
    if (!root || !root.contains(event.target) || !event.target.matches('.eva-composer-prompt') || event.isComposing || event.keyCode === 229) return;
    if (skillPickerOpen()) {
      var rows = Array.from(root.querySelectorAll('[data-eva-skill]'));
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        pickerIndex = rows.length ? (pickerIndex + (event.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length : 0;
        rows.forEach(function(row, i) { row.dataset.active = String(i === pickerIndex); row.setAttribute('aria-selected', String(i === pickerIndex)); });
        event.target.setAttribute('aria-activedescendant','eva-skill-option-' + pickerIndex);
        if (rows[pickerIndex]) rows[pickerIndex].scrollIntoView({block:'nearest'});
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (rows[pickerIndex]) rows[pickerIndex].click();
      } else if (event.key === 'Escape') {
        event.preventDefault(); closeSkillPicker();
      }
      return;
    }
    if (event.key === '@') {
      event.preventDefault(); openSkillPicker();
    } else if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); startGenerating();
    }
  }, true);
  document.addEventListener('click', function(event) {
    if (!root || !root.contains(event.target)) return;
    if (event.target.closest('[data-eva-open-skills]')) {
      openSkillPicker();
      root.querySelector('.eva-composer-prompt').focus();
    }
    if (event.target.closest('.eva-rail-next')) {
      root.querySelector('.eva-rail').scrollBy({left:200, behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
    }
  });

  /* 路由是会话选中态的唯一权威源。/guid 是新对话首页，/conversation/:id
     从数据仓恢复所选助理与会话；组件重挂载时同样调用这个函数。 */
  function syncRouteState() {
    conversationPickerOpen = false;
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
    if (hash.indexOf('#/guid') === 0) {
      selectedConversation = '';
      if (state !== 'home') resetToHome();
    }
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
      conversationPickerOpen = false;
      if (generatingTimer) { clearTimeout(generatingTimer); generatingTimer = 0; }
      if (root.parentElement === host) root.remove();
    };
  });
})();
