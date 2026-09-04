
(function () {
  'use strict';

  var personalConversation = '整理今天的工作重点';
  var digitalDismissed = false;
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

  function ensurePersonalChat() {
    var root = document.getElementById('eva-personal-chat-surface');
    if (root) return root;
    root = document.createElement('section');
    root.id = 'eva-personal-chat-surface';
    root.className = 'eva-personal-chat-surface';
    root.hidden = true;
    root.innerHTML = '<header class="eva-personal-chat-surface__head"><img src="' + escapeHTML(window.__EVA_COLLEAGUE_PORTRAIT || '') + '" alt=""><strong>Eva 同学</strong><span>个人助理</span></header><div class="eva-personal-chat-surface__stream"></div><div class="eva-personal-chat-surface__composer">输入消息、添加文件或继续追问…</div>';
    document.body.appendChild(root);
    return root;
  }

  function personalMessageHTML(message) {
    var isUser = message.role === 'user';
    var avatar = isUser ? window.__EVA_CURRENT_USER_PORTRAIT : window.__EVA_COLLEAGUE_PORTRAIT;
    var name = isUser ? '王宜林' : 'Eva 同学';
    var quote = message.quote ? '<div class="eva-ai-mock-message__quote">' + escapeHTML(message.quote) + '</div>' : '';
    var file = message.file ? '<div class="eva-ai-mock-message__file">附件 · ' + escapeHTML(message.file) + '</div>' : '';
    var task = message.task ? '<div class="eva-ai-mock-message__task">' + escapeHTML(message.task) + '</div>' : '';
    return '<div class="eva-ai-mock-message' + (isUser ? ' is-user' : '') + '">' + (isUser ? '' : '<img class="eva-ai-mock-message__avatar" src="' + escapeHTML(avatar || '') + '" alt="">') + '<div class="eva-ai-mock-message__body"><div class="eva-ai-mock-message__meta"><span>' + escapeHTML(name) + '</span>' + (isUser ? '' : '<span class="ai-badge ai-badge-small eva-ai-mock-message__ai-badge">AI</span>') + '</div><div class="eva-ai-mock-message__bubble">' + quote + escapeHTML(message.text) + file + task + '</div></div>' + (isUser ? '<img class="eva-ai-mock-message__avatar" src="' + escapeHTML(avatar || '') + '" alt="">' : '') + '</div>';
  }

  function renderPersonalChat(title) {
    personalConversation = personalMessages[title] ? title : personalConversation;
    var root = ensurePersonalChat();
    if (root.dataset.conversation === personalConversation) return;
    var stream = root.querySelector('.eva-personal-chat-surface__stream');
    stream.innerHTML = '<div class="eva-ai-mock-thread">' + personalMessages[personalConversation].map(personalMessageHTML).join('') + '</div>';
    root.dataset.conversation = personalConversation;
  }

  function ensureCreateAssistantModal() {
    var layer = document.getElementById('eva-create-assistant-layer');
    if (layer) return layer;
    layer = document.createElement('div');
    layer.id = 'eva-create-assistant-layer';
    layer.className = 'eva-create-assistant-layer';
    layer.hidden = true;
    layer.innerHTML = '<section class="eva-create-assistant-modal" role="dialog" aria-modal="true" aria-labelledby="eva-create-assistant-title"><header class="eva-create-assistant-modal__head"><span class="eva-create-assistant-modal__mark"><img src="' + escapeHTML(window.__EVA_COLLEAGUE_PORTRAIT || '') + '" alt=""></span><label class="eva-create-assistant-modal__identity"><input id="eva-create-assistant-title" type="text" placeholder="助理名称"><span>简短描述</span></label><div class="eva-create-assistant-modal__head-actions"><button type="button">快速创建</button><button type="button">使用模板</button><button class="eva-create-assistant-modal__close" type="button" aria-label="关闭" data-eva-create-assistant-close>×</button></div></header><nav class="eva-create-assistant-modal__tabs" aria-label="助理设置"><button class="eva-create-assistant-modal__tab is-active" type="button" data-eva-assistant-tab="identity">助理身份</button><button class="eva-create-assistant-modal__tab" type="button" data-eva-assistant-tab="personality">助理性格</button><button class="eva-create-assistant-modal__tab" type="button" data-eva-assistant-tab="about">关于你</button><button class="eva-create-assistant-modal__tab" type="button" data-eva-assistant-tab="skills">技能</button><button class="eva-create-assistant-modal__tab" type="button" data-eva-assistant-tab="collaboration">协作</button></nav><div class="eva-create-assistant-modal__body"><p class="eva-create-assistant-modal__hint" data-eva-assistant-hint>定义助理是谁，包括名字、角色定位和能力范围。</p><div class="eva-create-assistant-modal__editor" contenteditable="true" role="textbox" aria-multiline="true" data-eva-assistant-editor>支持 Markdown 格式，可用中文或英文书写</div></div><footer class="eva-create-assistant-modal__footer"><span class="eva-create-assistant-modal__chip">Qwen3.7 Plus⌄</span><span class="eva-create-assistant-modal__chip">四两的产品脑袋 ×</span><span class="eva-create-assistant-modal__spacer"></span><button class="eva-create-assistant-modal__submit" type="button" data-eva-create-assistant-submit>创建</button></footer></section>';
    document.body.appendChild(layer);
    return layer;
  }

  function openCreateAssistantModal() {
    var layer = ensureCreateAssistantModal();
    layer.hidden = false;
    var input = layer.querySelector('input');
    if (input) setTimeout(function () { input.focus(); }, 0);
  }

  function closeCreateAssistantModal() {
    var layer = document.getElementById('eva-create-assistant-layer');
    if (layer) layer.hidden = true;
  }

  function ensureDigitalPage() {
    var root = document.getElementById('eva-digital-employee-page');
    if (root) return root;
    root = document.createElement('section');
    root.id = 'eva-digital-employee-page';
    root.className = 'eva-digital-employee-page';
    root.hidden = true;
    var employees = [['供应链保供专家','DE-0522','供应链'],['质量缺陷分析专家','DE-0523','质量域'],['销售机会跟进专家','DE-0468','国内营销'],['软件测试报告分析专家','DE-0421','研发域'],['项目风险巡检专家','DE-0039','战略与经营'],['客户需求洞察专家','DE-0449','客户运营']];
    root.innerHTML = '<header class="eva-digital-employee-page__head"><div><h1>数字员工市场</h1><p>按业务域找到数字员工，拉进群或放进项目即可开始协作</p></div></header><main class="eva-digital-employee-page__body"><aside class="eva-digital-employee-page__directory"><div class="eva-digital-market-search">⌕&nbsp; 搜专家</div><nav class="eva-digital-market-nav"><button class="is-active" type="button"><i>▣</i><span><strong>全部</strong><small>组织内可用的数字员工</small></span><em>18</em></button><button type="button"><i>♙</i><span><strong>我创建的</strong><small>由我创建或接入</small></span><em>2</em></button><button type="button"><i>✦</i><span><strong>平台内置</strong><small>开箱即用的官方专家</small></span><em>4</em></button><button type="button"><i>◎</i><span><strong>团队发布</strong><small>各业务团队共享</small></span><em>12</em></button></nav></aside><section class="eva-digital-market-main"><div class="eva-digital-market-query">⌕&nbsp;&nbsp;搜索数字员工：名称、能力或业务域</div><div class="eva-digital-market-filters">' + ['全部业务域 18','研发域 4','供应链 4','质量域 3','国内营销 3','战略与经营 2','客户运营 2'].map(function(label,index){return '<button class="eva-digital-market-filter' + (index===0?' is-active':'') + '" type="button">' + label + '</button>';}).join('') + '</div><header class="eva-digital-market-section-head"><h2>决策与执行专家</h2><p>直接加入协作场景，帮助分析信息、提出建议并推动任务完成</p></header><div class="eva-digital-market-list">' + employees.map(function(item){return '<article class="eva-digital-market-row"><div class="eva-digital-market-row__name"><span class="eva-digital-market-row__avatar">◇</span><strong>' + escapeHTML(item[0]) + '</strong><span class="ai-badge ai-badge-small">AI</span></div><span class="eva-digital-market-row__code">' + escapeHTML(item[1]) + '</span><span class="eva-digital-market-row__domain">' + escapeHTML(item[2]) + '</span><div class="eva-digital-market-row__actions"><button type="button" data-digital-action="拉进群">拉进群</button><button type="button" data-digital-action="放进项目">放进项目</button><button type="button" data-digital-action="接入配置">接入配置</button></div></article>';}).join('') + '</div></section></main><div class="eva-digital-employee-toast" role="status" hidden></div>';
    document.body.appendChild(root);
    return root;
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

  function syncSurfaces() {
    var personal = ensurePersonalChat();
    var digital = ensureDigitalPage();
    var digitalOpen = decodedHash().indexOf('/eva-stub/数字员工') >= 0 && !digitalDismissed && !document.body.classList.contains('eva-contacts-open');
    digital.hidden = !digitalOpen;
    document.body.classList.toggle('eva-digital-employee-open', digitalOpen);
    personal.hidden = digitalOpen || !personalRouteOpen();
    if (!personal.hidden) renderPersonalChat(personalConversation);
    tuneLegacyAutomation();
  }

  document.addEventListener('click', function (event) {
    var sidebarTarget = event.target.closest('[data-eva-nav-id], #eva-contacts-nav');
    if (sidebarTarget) {
      var selectedSidebarNavId = sidebarTarget.id === 'eva-contacts-nav' ? 'contacts' : sidebarTarget.dataset.evaNavId;
      window.dispatchEvent(new CustomEvent('eva:sidebar-select', { detail: { id: selectedSidebarNavId, overlay: ['my-ai', 'contacts', 'drive'].indexOf(selectedSidebarNavId) >= 0 } }));
      digitalDismissed = selectedSidebarNavId !== 'digital-employees';
    }
    var createAssistant = event.target.closest('#eva-personal-history-column .eva-assistant-tree__create');
    if (createAssistant) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openCreateAssistantModal();
      return;
    }
    if (event.target.closest('[data-eva-create-assistant-close]') || event.target.id === 'eva-create-assistant-layer') {
      closeCreateAssistantModal();
      return;
    }
    var assistantTab = event.target.closest('[data-eva-assistant-tab]');
    if (assistantTab) {
      var layer = ensureCreateAssistantModal();
      layer.querySelectorAll('[data-eva-assistant-tab]').forEach(function (tab) { tab.classList.toggle('is-active', tab === assistantTab); });
      var copy = {
        identity: ['定义助理是谁，包括名字、角色定位和能力范围。', '支持 Markdown 格式，可用中文或英文书写'],
        personality: ['描述助理的表达方式、判断风格和协作习惯。', '例如：简洁、主动，在关键决策前先向我确认'],
        about: ['补充助理需要长期了解的个人背景与偏好。', '例如：我的角色、工作重点和常用表达方式'],
        skills: ['选择助理可以使用的技能与工具。', '搜索或添加技能（Demo）'],
        collaboration: ['设置助理参与项目、群聊和 Loop 任务的方式。', '选择允许参与的协作范围（Demo）']
      }[assistantTab.dataset.evaAssistantTab];
      var hint = layer.querySelector('[data-eva-assistant-hint]');
      var editor = layer.querySelector('[data-eva-assistant-editor]');
      if (hint) hint.textContent = copy[0];
      if (editor) editor.textContent = copy[1];
      return;
    }
    if (event.target.closest('[data-eva-create-assistant-submit]')) {
      closeCreateAssistantModal();
      return;
    }
    var conversation = event.target.closest('#eva-personal-history-column .eva-assistant-conversation');
    var conversationTitle = conversation && conversation.dataset.conversationTitle;
    if (conversation && personalMessages[conversationTitle]) {
      personalConversation = conversationTitle;
      setTimeout(syncSurfaces, 0);
    }
    var legacyTab = event.target.closest('.eva-auto-tabs .eva-auto-tab');
    if (legacyTab) requestAnimationFrame(tuneLegacyAutomation);
    var digitalAction = event.target.closest('[data-digital-action]');
    if (digitalAction) {
      var toast = document.querySelector('.eva-digital-employee-toast');
      if (toast) { toast.textContent = digitalAction.dataset.digitalAction + '流程已打开（Demo）'; toast.hidden = false; clearTimeout(toast._timer); toast._timer = setTimeout(function () { toast.hidden = true; }, 1800); }
    }
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncSurfaces, { once: true });
  else syncSurfaces();
  window.addEventListener('hashchange', syncSurfaces);
  new MutationObserver(function () { requestAnimationFrame(syncSurfaces); }).observe(document.documentElement, { childList: true, subtree: true });
})();
