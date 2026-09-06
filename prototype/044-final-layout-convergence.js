
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

  function ensureDigitalPage(host) {
    var root = document.getElementById('eva-digital-employee-page');
    if (!root) {
      root = document.createElement('section');
      root.id = 'eva-digital-employee-page';
      root.className = 'eva-digital-employee-page';
      var employees = [['供应链保供专家','DE-0522','供应链'],['质量缺陷分析专家','DE-0523','质量域'],['销售机会跟进专家','DE-0468','国内营销'],['软件测试报告分析专家','DE-0421','研发域'],['项目风险巡检专家','DE-0039','战略与经营'],['客户需求洞察专家','DE-0449','客户运营']];
      root.innerHTML = '<header class="eva-digital-employee-page__head"><div><h1>数字员工市场</h1><p>按业务域找到数字员工，拉进群或放进项目即可开始协作</p></div></header><main class="eva-digital-employee-page__body"><aside class="eva-digital-employee-page__directory"><div class="eva-digital-market-search">⌕&nbsp; 搜专家</div><nav class="eva-digital-market-nav"><button class="is-active" type="button"><i>▣</i><span><strong>全部</strong><small>组织内可用的数字员工</small></span><em>18</em></button><button type="button"><i>♙</i><span><strong>我创建的</strong><small>由我创建或接入</small></span><em>2</em></button><button type="button"><i>✦</i><span><strong>平台内置</strong><small>开箱即用的官方专家</small></span><em>4</em></button><button type="button"><i>◎</i><span><strong>团队发布</strong><small>各业务团队共享</small></span><em>12</em></button></nav></aside><section class="eva-digital-market-main"><div class="eva-digital-market-query">⌕&nbsp;&nbsp;搜索数字员工：名称、能力或业务域</div><div class="eva-digital-market-filters">' + ['全部业务域 18','研发域 4','供应链 4','质量域 3','国内营销 3','战略与经营 2','客户运营 2'].map(function(label,index){return '<button class="eva-digital-market-filter' + (index===0?' is-active':'') + '" type="button">' + label + '</button>';}).join('') + '</div><header class="eva-digital-market-section-head"><h2>决策与执行专家</h2><p>直接加入协作场景，帮助分析信息、提出建议并推动任务完成</p></header><div class="eva-digital-market-list">' + employees.map(function(item){return '<article class="eva-digital-market-row"><div class="eva-digital-market-row__name"><span class="eva-digital-market-row__avatar">◇</span><strong>' + escapeHTML(item[0]) + '</strong><span class="ai-badge ai-badge-small">AI</span></div><span class="eva-digital-market-row__code">' + escapeHTML(item[1]) + '</span><span class="eva-digital-market-row__domain">' + escapeHTML(item[2]) + '</span><div class="eva-digital-market-row__actions"><button type="button" data-digital-action="拉进群">拉进群</button><button type="button" data-digital-action="放进项目">放进项目</button><button type="button" data-digital-action="接入配置">接入配置</button></div></article>';}).join('') + '</div></section></main><div class="eva-digital-employee-toast" role="status" hidden></div>';
    }
    if (host && root.parentElement !== host) host.appendChild(root);
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
    var rail = handle.closest('.ch-list, .eva-personal-sider-panel');
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
      openAssistantEditor({ mode: 'edit', id: folder.dataset.evaAssistantId, name: folder.dataset.evaAssistantName });
      return;
    }
    var createAssistant = event.target.closest('.eva-personal-sider-panel .eva-assistant-tree__create');
    if (createAssistant) {
      event.preventDefault();
      openAssistantEditor({ mode: 'create' });
      return;
    }
    var legacyTab = event.target.closest('.eva-auto-tabs .eva-auto-tab');
    if (legacyTab) requestAnimationFrame(tuneLegacyAutomation);
    var digitalAction = event.target.closest('[data-digital-action]');
    if (digitalAction) {
      var toast = document.querySelector('.eva-digital-employee-toast');
      if (toast) { toast.textContent = digitalAction.dataset.digitalAction + '流程已打开（Demo）'; toast.hidden = false; clearTimeout(toast._timer); toast._timer = setTimeout(function () { toast.hidden = true; }, 1800); }
    }
  }, true);

  window.__evaNativePages.register('digital-employees', function (host) {
    var root = ensureDigitalPage(host);
    root.hidden = false;
    return function () {
      if (root.parentElement === host) root.remove();
    };
  });

  restoreConversationRailWidth();
  tuneLegacyAutomation();
})();
