
(function () {
  'use strict';

  var activeFeature = null;
  var pageTuneQueued = false;

  function icon(name) {
    var paths = {
      refresh: '<path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5"></path><path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5"></path>',
      bolt: '<path d="m13 2-9 12h8l-1 8 9-12h-8z"></path>',
      plus: '<path d="M12 5v14M5 12h14"></path>',
      grid: '<rect width="7" height="7" x="3" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="3" rx="1"></rect><rect width="7" height="7" x="3" y="14" rx="1"></rect><rect width="7" height="7" x="14" y="14" rx="1"></rect>',
      check: '<circle cx="12" cy="12" r="9"></circle><path d="m9 12 2 2 4-4"></path>',
      play: '<path d="m9 7 8 5-8 5z"></path>',
      shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path>',
      clock: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
      search: '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path>',
      file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6M8 13h8M8 17h5"></path>',
      briefcase: '<rect width="18" height="14" x="3" y="7" rx="2"></rect><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"></path>',
      calendar: '<rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path>',
      chart: '<path d="M3 3v18h18M7 16v-5M12 16V8M17 16v-9"></path>',
      bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"></path>',
      users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>'
    };
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (paths[name] || paths.grid) + '</svg>';
  }

  function isTeamMode() {
    return /^#\/(collab|messages)(?:[/?]|$)/.test(String(location.hash || ''));
  }

  function buildWorkboard() {
    var stats = [
      ['grid', '总数', '0'], ['check', '活跃', '0'], ['play', '运行中', '0'], ['shield', '诊断', '0'], ['clock', '最早就绪', '-']
    ];
    var columns = [
      ['', '收件箱'], ['', '积压'], ['eva-board-column--todo', '待办'], ['eva-board-column--planned', '已计划'], ['eva-board-column--ready', '就绪']
    ];
    return [
      '<section class="eva-personal-feature-page eva-feature-page" data-eva-page="workboard" hidden>',
      '<header class="eva-feature-head"><h1>工作板</h1></header>',
      '<div class="eva-feature-body"><div class="eva-board-topline"><p class="eva-feature-intro">管理任务卡片、依赖、调度、运行和诊断</p>',
      '<div class="eva-feature-actions"><button class="eva-ui-btn" type="button">' + icon('refresh') + '刷新</button><button class="eva-ui-btn" type="button">' + icon('bolt') + '提醒调度器</button><button class="eva-ui-btn eva-ui-btn--primary" type="button">' + icon('plus') + '新建卡片</button></div></div>',
      '<div class="eva-board-stats">' + stats.map(function (item) { return '<div class="eva-board-stat"><span>' + icon(item[0]) + item[1] + '</span><strong>' + item[2] + '</strong></div>'; }).join('') + '</div>',
      '<section class="eva-board-filter"><div class="eva-board-filter__row"><div class="eva-faux-field eva-faux-field--muted">' + icon('search') + '搜索卡片、标签、助理或运行信息…</div><div class="eva-faux-field">全部优先级</div><div class="eva-faux-field">全部助理</div><div class="eva-faux-field">default</div></div><label class="eva-board-check"><input type="checkbox">显示已归档</label></section>',
      '<div class="eva-board-scroll"><div class="eva-board-columns">' + columns.map(function (item) { return '<section class="eva-board-column ' + item[0] + '"><div class="eva-board-column__head"><span class="eva-board-column__dot"></span><span>' + item[1] + '</span><span class="eva-board-column__count">0</span></div><div class="eva-board-column__empty">暂无卡片</div></section>'; }).join('') + '</div></div></div></section>'
    ].join('');
  }

  function taskCard(title, desc, time) {
    return '<article class="eva-auto-task"><div class="eva-auto-task__top"><strong>' + title + '</strong><span class="eva-auto-task__spacer"></span><button class="eva-auto-switch" type="button" role="switch" aria-checked="false" aria-label="启用或暂停"></button><button class="eva-auto-more" type="button" aria-label="更多">⋮</button></div><p class="eva-auto-task__desc">' + desc + '</p><div class="eva-auto-task__meta">' + icon('clock') + time + '<span class="eva-auto-status">● 已暂停</span></div></article>';
  }

  function templateCard(iconName, title, desc, time) {
    return '<button class="eva-auto-template" type="button"><span class="eva-auto-template__icon">' + icon(iconName) + '</span><span><strong>' + title + '</strong><p>' + desc + '</p><time>' + icon('clock') + time + '</time></span></button>';
  }

  function buildAutomation() {
    return [
      '<section class="eva-personal-feature-page eva-feature-page" data-eva-page="automation" hidden>',
      '<header class="eva-feature-head"><h1>自动化任务</h1></header>',
      '<div class="eva-feature-body"><p class="eva-feature-intro">按计划自动执行任务，让 AI 替你处理重复工作</p><div class="eva-auto-toolbar"><button class="eva-ui-btn eva-ui-btn--primary" type="button">' + icon('plus') + '新建</button></div>',
      '<div class="eva-auto-tabs" role="tablist"><button class="eva-auto-tab is-active" data-eva-auto-tab="tasks" type="button">任务 <span class="eva-auto-count">2</span></button><button class="eva-auto-tab" data-eva-auto-tab="history" type="button">历史</button></div>',
      '<div data-eva-auto-panel="tasks"><div class="eva-auto-task-grid">',
      taskCard('每日开源AI工具推介', '请搜索近期（过去7天内）发布或更新的、适合企业办公场景的开源AI Skill/插件/工具。要求：1. 排除已推介过…', '每天 09:00'),
      taskCard('每日开源Skill探索', '你是GeelyClaw，一个企业办公AI助手。请执行以下任务：【任务目标】搜索并整理行业内最新的开源Skill（…', '每天 11:00'),
      '</div><div class="eva-auto-template-title">从模板快速创建</div><div class="eva-auto-template-grid">',
      templateCard('file', '科技早报', '工作日早晨汇总科技、AI 和产品动态，筛出适合办公人群快速浏览的重点。', '工作日 08:30'),
      templateCard('briefcase', '每日工作收尾', '下班前整理当天进展、风险和明日待办，适合个人复盘或团队同步。', '工作日 18:00'),
      templateCard('calendar', '会议准备', '每天开始前梳理会议目标、待确认问题和需要提前准备的材料。', '工作日 08:45'),
      templateCard('chart', '周报草稿', '每周五生成一份结构化周报草稿，减少临下班补材料的成本。', '周五 17:30'),
      templateCard('shield', '项目健康巡检', '定期检查项目状态、近期变更和潜在风险，适合研发或运营项目。', '每天 10:00'),
      templateCard('bell', '月度行政提醒', '月底前提醒整理发票、报销、续费、合同和常规行政待办。', '每月 25 日 10:00'),
      '</div></div><div class="eva-auto-history" data-eva-auto-panel="history" hidden>暂无运行历史</div></div></section>'
    ].join('');
  }

  function ensureFeaturePages() {
    if (!document.querySelector('[data-eva-page="workboard"]')) document.body.insertAdjacentHTML('beforeend', buildWorkboard());
  }

  function setFeaturePage(name) {
    activeFeature = name;
    document.querySelectorAll('.eva-personal-feature-page').forEach(function (page) {
      page.hidden = isTeamMode() || page.dataset.evaPage !== name;
    });
  }

  function clearFeaturePage() { setFeaturePage(null); }

  function renameExact(root, from, to) {
    if (!root) return;
    root.querySelectorAll('span, h1, h2, button').forEach(function (node) {
      if (node.children.length === 0 && node.textContent.trim() === from) node.textContent = to;
    });
  }

  function tuneProjectTerminology() {
    var activeProjectName = document.querySelector('.collab-sp-chip .nm');
    document.body.classList.toggle('eva-official-project-open', Boolean(activeProjectName && activeProjectName.textContent.trim() === 'EVA Official Space'));

    if (isTeamMode()) {
      var list = document.querySelector('.collab-list-page');
      if (list) {
        renameExact(list, '空间', '项目');
        renameExact(list, '新建空间', '新建项目');
        var search = list.querySelector('input[placeholder="搜索空间"]');
        if (search) search.placeholder = '搜索项目';
        list.querySelectorAll('button').forEach(function (button) {
          if (button.textContent.indexOf('新建空间') >= 0) button.textContent = button.textContent.replace('新建空间', '新建项目');
        });
      }
      document.querySelectorAll('.semi-modal').forEach(function (modal) {
        if (!modal.querySelector('.collab-create-form')) return;
        renameExact(modal, '新建空间', '新建项目');
        renameExact(modal, '创建空间', '创建项目');
        renameExact(modal, '空间名称', '项目名称');
      });
      document.querySelectorAll('.collab-tab').forEach(function (tab) {
        var label = tab.textContent.trim().replace(/\d+$/, '');
        if (label === '项目') {
          if (tab.getAttribute('aria-selected') === 'true') {
            var chatTab = Array.from(document.querySelectorAll('.collab-tab')).find(function (item) { return item.textContent.trim() === '群聊'; });
            if (chatTab) chatTab.click();
          }
          tab.hidden = true;
          tab.setAttribute('aria-hidden', 'true');
        } else if (['专家', '专家团', '技能'].indexOf(label) >= 0) {
          tab.hidden = true;
          tab.setAttribute('aria-hidden', 'true');
        } else {
          if (['文件', '资料', '团队文件'].indexOf(label) >= 0) tab.textContent = '团队文件';
          tab.hidden = false;
          tab.removeAttribute('aria-hidden');
        }
      });
      document.querySelectorAll('.sp-menu .mi').forEach(function (item) {
        if (item.textContent.indexOf('全部空间') >= 0) item.textContent = item.textContent.replace('全部空间', '全部项目');
      });
    }
  }

  function organizationProjectCard(title, desc, meta) {
    var card = document.createElement('div');
    card.className = 'collab-space-card eva-organization-project-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.dataset.evaProjectKind = 'organization';
    card.innerHTML = '<span class="collab-space-ic">' + icon('users') + '</span><div class="info"><div class="name"><span>' + title + '</span><span class="eva-project-tag eva-project-tag--org">组织空间</span></div><div class="eva-space-card-desc">' + desc + '</div><div class="meta">' + meta + '</div></div>';
    return card;
  }

  function ensureProjectCards() {
    if (!isTeamMode()) return;
    var list = document.querySelector('.collab-list-page');
    if (!list) return;
    if (list.classList.contains('eva-project-directory')) return;
    var grid = list.querySelector('.collab-space-grid');
    if (!grid) {
      var section = document.createElement('section');
      section.className = 'eva-official-project-section';
      section.innerHTML = '<div class="collab-section-head"><h2>已加入</h2></div><div class="collab-space-grid"></div>';
      list.appendChild(section);
      grid = section.querySelector('.collab-space-grid');
    }
    /* Official is rendered by the native project list from window.__EVA_PROJECTS. */
    grid.querySelectorAll(':scope > .eva-official-project-card').forEach(function (card) { card.remove(); });
    var groupItems = Array.from(document.querySelectorAll('.eva-created-group-item'));
    groupItems.forEach(function (item) {
      var id = item.dataset.groupId;
      if (grid.querySelector('[data-eva-organization-id="' + id + '"]')) return;
      var org = organizationProjectCard(item.dataset.groupName, '由无项目拉群自动创建的组织空间', item.dataset.groupMemberNames);
      org.dataset.evaOrganizationId = id;
      grid.appendChild(org);
    });
  }

  function ensureProjectDetail() {
    var page = document.querySelector('.eva-project-detail-page');
    if (page) return page;
    page = document.createElement('section');
    page.className = 'eva-project-detail-page';
    page.hidden = true;
    page.innerHTML = '<header class="eva-project-detail-head"><h1></h1><span class="eva-project-tag"></span></header><nav class="eva-project-tabs" aria-label="项目功能"><button class="eva-project-tab is-active" type="button">任务</button><button class="eva-project-tab" type="button">群聊</button><button class="eva-project-tab" type="button">团队文件</button><button class="eva-project-tab" type="button">自动化</button><button class="eva-project-tab" type="button">项目设置</button></nav><div class="eva-project-detail-body"><p class="eva-project-detail-note"></p><div class="eva-project-groups"></div></div>';
    document.body.appendChild(page);
    return page;
  }

  function openProjectDetail(card) {
    clearFeaturePage();
    var page = ensureProjectDetail();
    var title = card.querySelector('.name > span').textContent.trim();
    page.querySelector('h1').textContent = title;
    var tag = page.querySelector('.eva-project-detail-head .eva-project-tag');
    tag.textContent = '项目';
    tag.classList.add('eva-project-tag--org');
    page.querySelector('.eva-project-detail-note').textContent = '无项目拉群时自动形成的项目；本次群聊是该项目的首个群聊。';
    var groups = [[title, card.querySelector('.meta').textContent.trim()]];
    page.querySelector('.eva-project-groups').innerHTML = groups.map(function (group) { return '<article class="eva-project-group-card"><strong># ' + group[0] + '</strong><span>' + group[1] + '</span></article>'; }).join('');
    page.hidden = false;
  }

  function closeProjectDetail() {
    var page = document.querySelector('.eva-project-detail-page');
    if (page) page.hidden = true;
  }

  function bindStaticInteractions() {
    document.querySelectorAll('.eva-auto-switch').forEach(function (button) {
      if (button.dataset.evaBound) return;
      button.dataset.evaBound = 'true';
      button.addEventListener('click', function () { button.setAttribute('aria-checked', button.getAttribute('aria-checked') === 'true' ? 'false' : 'true'); });
    });
    document.querySelectorAll('[data-eva-auto-tab]').forEach(function (button) {
      if (button.dataset.evaBound) return;
      button.dataset.evaBound = 'true';
      button.addEventListener('click', function () {
        var page = button.closest('[data-eva-page="automation"]');
        page.querySelectorAll('[data-eva-auto-tab]').forEach(function (tab) { tab.classList.toggle('is-active', tab === button); });
        page.querySelectorAll('[data-eva-auto-panel]').forEach(function (panel) { panel.hidden = panel.dataset.evaAutoPanel !== button.dataset.evaAutoTab; });
      });
    });
  }

  function tunePages() {
    pageTuneQueued = false;
    var currentHash = decodeURI(String(location.hash || ''));
    activeFeature = currentHash.indexOf('#/eva-stub/工作板') === 0 ? 'workboard' : null;
    ensureFeaturePages();
    tuneProjectTerminology();
    ensureProjectCards();
    bindStaticInteractions();
    setFeaturePage(activeFeature);
    if (!isTeamMode()) closeProjectDetail();
  }

  function queueTunePages() {
    if (pageTuneQueued) return;
    pageTuneQueued = true;
    requestAnimationFrame(tunePages);
  }

  document.addEventListener('click', function (event) {
    var organization = event.target.closest('.eva-organization-project-card');
      if (organization) { event.preventDefault(); event.stopPropagation(); openProjectDetail(organization); return; }

    var nav = event.target.closest('aside [data-eva-nav-id]');
    if (!nav) return;
    var navId = nav.dataset.evaNavId;
    if (navId === 'workboard') setFeaturePage('workboard');
    else clearFeaturePage();
    closeProjectDetail();
    queueTunePages();
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', queueTunePages, { once: true });
  else queueTunePages();

  window.addEventListener('hashchange', queueTunePages);

  new MutationObserver(queueTunePages).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-selected'] });
})();
