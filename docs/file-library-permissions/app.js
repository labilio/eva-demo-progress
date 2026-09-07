(function () {
  'use strict';

  const roles = [
    {
      id: 'Owner',
      title: 'FileSpace.Owner',
      position: '项目负责人 / 个人空间本人',
      summary: '完整管理文件空间内容、生命周期、设置和治理。项目空间中唯一，并随项目负责人转让自动同步。',
      allowed: ['全部文件内容动作', '管理设置、审计和完整回收站', '永久删除和项目所有权联动'],
      blocked: ['不能绕过来源群权限读取原始附件', '不能把文件链接当成访问授权']
    },
    {
      id: 'Manager',
      title: 'FileSpace.Manager',
      position: '项目管理员',
      summary: '管理文件空间内容、生命周期、设置和审计，但不能独立改变项目及文件空间归属。',
      allowed: ['全部文件内容动作', '管理设置、审计和完整回收站', '管理链接策略和永久删除'],
      blocked: ['不能转让项目或文件空间 Owner', '不能读取未加入私密群的原始附件']
    },
    {
      id: 'Editor',
      title: 'FileSpace.Editor',
      position: '普通项目成员',
      summary: '项目成员的最低文件角色，可浏览、上传和管理项目文件内容，不承担成员、设置和审计治理。',
      allowed: ['浏览、预览和下载', '上传、新建文件夹和上传新版本', '重命名、移动、复制、删除到回收站和恢复'],
      blocked: ['不能浏览完整回收站或永久删除', '不能修改项目成员、文件空间设置和链接策略']
    }
  ];

  const actions = [
    { id: 'A01', category: 'browse', categoryLabel: '浏览', name: '发现文件空间', code: 'space.discover', roles: ['Owner', 'Manager', 'Editor'], object: 'FileSpace', condition: '账号有效且属于同一租户', result: '空间可出现在当前用户的文件库来源列表中。' },
    { id: 'A02', category: 'browse', categoryLabel: '浏览', name: '查看空间信息', code: 'space.read', roles: ['Owner', 'Manager', 'Editor'], object: 'FileSpace', condition: '空间有效且未归档', result: '可查看空间名称、项目来源和当前角色。' },
    { id: 'A03', category: 'browse', categoryLabel: '浏览', name: '浏览空间条目', code: 'space.list_items', roles: ['Owner', 'Manager', 'Editor'], object: 'FileSpace / Folder', condition: '有效项目成员关系', result: '返回当前目录中可见的文件、文件夹和快捷方式。' },
    { id: 'A04', category: 'browse', categoryLabel: '浏览', name: '搜索空间条目', code: 'space.search_items', roles: ['Owner', 'Manager', 'Editor'], object: 'FileSpace', condition: '仅搜索有权访问的所属空间', result: '返回匹配的可访问条目，不先返回全量数据再由前端过滤。' },
    { id: 'A05', category: 'browse', categoryLabel: '浏览', name: '查看文件元数据', code: 'uploaded_file.metadata.read', roles: ['Owner', 'Manager', 'Editor'], object: 'FileEntry', condition: '文件属于当前有效空间', result: '可查看名称、大小、类型、来源、版本和上传/生成者。' },
    { id: 'A06', category: 'browse', categoryLabel: '浏览', name: '在线预览本地文件', code: 'uploaded_file.preview', roles: ['Owner', 'Manager', 'Editor'], object: 'FileVersion', condition: '安全扫描通过；格式支持预览', result: '签发短期预览地址；扫描中或已隔离时拒绝。' },
    { id: 'A07', category: 'browse', categoryLabel: '浏览', name: '下载本地文件', code: 'uploaded_file.download', roles: ['Owner', 'Manager', 'Editor'], object: 'FileVersion', condition: '安全扫描通过；下载时重新校验成员关系', result: '签发短期下载地址；文件链接本身不提供下载资格。' },
    { id: 'A08', category: 'browse', categoryLabel: '浏览', name: '复制文件链接', code: 'uploaded_file.link.copy', roles: ['Owner', 'Manager', 'Editor'], object: 'FileEntry', condition: '当前用户可查看文件元数据', result: '只复制定位链接；接收人仍需自身拥有来源空间权限。' },
    { id: 'A09', category: 'browse', categoryLabel: '浏览', name: '查看自己的权限', code: 'permissions.self.read', roles: ['Owner', 'Manager', 'Editor'], object: 'FileSpace', condition: '返回实时派生的项目角色来源', result: '显示当前角色和可执行动作，不保存“可编辑”等权限文案。' },

    { id: 'A10', category: 'content', categoryLabel: '内容', name: '上传本地文件', code: 'space.upload', roles: ['Owner', 'Manager', 'Editor'], object: 'FileSpace / Folder', condition: '目标明确、配额足够、类型和大小通过检查', result: '创建 FileEntry 和首个 FileVersion，随后进入安全扫描。' },
    { id: 'A11', category: 'content', categoryLabel: '内容', name: '新建文件夹', code: 'space.create_folder', roles: ['Owner', 'Manager', 'Editor'], object: 'FileSpace / Folder', condition: '名称有效且父目录属于同一空间', result: '创建继承所属空间角色的 Folder 条目；文件夹不形成独立 ACL。' },
    { id: 'A12', category: 'content', categoryLabel: '内容', name: '上传新版本', code: 'uploaded_file.version.create', roles: ['Owner', 'Manager', 'Editor'], object: 'FileEntry', condition: '文件未锁定或隔离；同名上传经用户确认', result: '追加 FileVersion，不覆盖旧版本、来源、确认和审计记录。' },
    { id: 'A13', category: 'content', categoryLabel: '内容', name: '重命名文件', code: 'uploaded_file.rename', roles: ['Owner', 'Manager', 'Editor'], object: 'FileEntry', condition: '名称有效且条目处于 active 生命周期', result: '只修改条目名称，不改变文件内容、所属空间或历史版本。' },
    { id: 'A14', category: 'content', categoryLabel: '内容', name: '移动空间条目', code: 'space.move_item', roles: ['Owner', 'Manager', 'Editor'], object: 'FileEntry / Folder', condition: '源和目标目录属于同一 FileSpace', result: '修改 parent_id；跨空间操作必须使用复制或转存。' },
    { id: 'A15', category: 'content', categoryLabel: '内容', name: '复制文件到另一空间', code: 'uploaded_file.copy_to_space', roles: ['Owner', 'Manager', 'Editor'], object: 'Source FileVersion + Target FileSpace', condition: '源 download AND 目标 upload 同时通过', result: '创建目标空间独立文件，保留来源记录但不复制成员权限。' },
    { id: 'A16', category: 'content', categoryLabel: '内容', name: '删除文件', code: 'uploaded_file.delete', roles: ['Owner', 'Manager', 'Editor'], object: 'FileEntry', condition: '文件 active；删除者拥有有效空间角色', result: '将文件移入所属空间回收站并写入审计，不立即物理删除。' },
    { id: 'A17', category: 'content', categoryLabel: '内容', name: '恢复文件', code: 'uploaded_file.restore', roles: ['Owner', 'Manager', 'Editor'], object: 'FileEntry', condition: '文件处于 trashed；原目录无效时恢复到空间根目录', result: '恢复 FileEntry；Editor 可通过最近删除记录或直接入口恢复。' },
    { id: 'A18', category: 'content', categoryLabel: '内容', name: '创建快捷方式', code: 'reference.create', roles: ['Owner', 'Manager', 'Editor'], object: 'Source FileEntry + Target FileSpace', condition: '源 reference_source.use AND 目标 create_reference', result: '只创建 Reference；目标空间不因此获得源文件预览或下载资格。' },
    { id: 'A19', category: 'content', categoryLabel: '内容', name: '删除快捷方式', code: 'reference.delete', roles: ['Owner', 'Manager', 'Editor'], object: 'Reference', condition: '拥有快捷方式所在空间的有效角色', result: '只删除 Reference，不删除或移动源文件。' },

    { id: 'A20', category: 'governance', categoryLabel: '治理', name: '查看全部权限来源', code: 'permissions.sources.read', roles: ['Owner', 'Manager'], object: 'FileSpace', condition: '项目负责人或管理员身份仍有效', result: '查看角色由哪个项目成员关系派生，以及最近的变更记录。' },
    { id: 'A21', category: 'governance', categoryLabel: '治理', name: '修改文件空间设置', code: 'space.update', roles: ['Owner', 'Manager'], object: 'FileSpace', condition: '项目空间不得脱离项目单独改成员体系', result: '可修改名称显示、配额策略和允许的文件类型等空间设置。' },
    { id: 'A22', category: 'governance', categoryLabel: '治理', name: '管理链接策略', code: 'space.link.manage', roles: ['Owner', 'Manager'], object: 'FileSpace', condition: '链接范围不得创建空间外单文件授权', result: '可启停定位链接；链接始终在打开时重新鉴权。' },
    { id: 'A23', category: 'governance', categoryLabel: '治理', name: '查看空间审计', code: 'audit.read', roles: ['Owner', 'Manager'], object: 'FileSpace', condition: '审计范围限当前项目文件空间', result: '查看上传、下载、版本、移动、转存、删除、恢复和权限变化。' },
    { id: 'A24', category: 'governance', categoryLabel: '治理', name: '浏览完整回收站', code: 'trash.list_items', roles: ['Owner', 'Manager'], object: 'FileSpace', condition: '项目有效且当前角色未失效', result: '查看空间内所有被删除条目及删除人、时间和到期策略。' },
    { id: 'A25', category: 'governance', categoryLabel: '治理', name: '永久删除文件', code: 'trash.purge', roles: ['Owner', 'Manager'], object: 'FileEntry / FileVersion', condition: '文件在回收站；满足组织留存和审计策略', result: '删除可访问条目并进入底层存储清理流程；需要危险确认。' },
    { id: 'A26', category: 'governance', categoryLabel: '治理', name: '同步文件空间 Owner', code: 'project.owner.transfer', roles: ['Owner'], object: 'Project + FileSpace', condition: '项目负责人转让成功；目标是有效项目人类成员', result: '文件空间 Owner 原子同步为新项目负责人，不提供独立转让入口。' },

    { id: 'A27', category: 'task', categoryLabel: '任务与会话', name: '读取任务选定输入', code: 'task.input.read_selected', roles: ['AI delegation'], object: 'Task + FileVersion', condition: '执行方匹配且 file_version_id 位于任务输入白名单', result: 'AI 获得单次、限时读取地址，不能据此列出项目文件。' },
    { id: 'A28', category: 'task', categoryLabel: '任务与会话', name: '提交任务产出', code: 'task.output.create', roles: ['AI delegation'], object: 'Task + Project FileSpace', condition: '任务有效、AI 是当前执行方、业务责任人仍是项目成员', result: '在项目空间创建待确认文件，生成者记录 AI，责任人记录人类。' },
    { id: 'A29', category: 'task', categoryLabel: '任务与会话', name: '确认任务产出版本', code: 'task.output.accept', roles: ['Owner', 'Manager', 'Editor'], object: 'Task + FileVersion', condition: 'Owner/Manager 可治理确认；Editor 必须是该任务的业务责任人或验收人', result: '将指定版本标记为已确认，并进入项目正式成果。' },
    { id: 'A30', category: 'task', categoryLabel: '任务与会话', name: '保存群文件到项目', code: 'message_file.snapshot_to_project', roles: ['Owner', 'Manager', 'Editor'], object: 'Conversation FileVersion + Project FileSpace', condition: '来源群 read AND 目标项目 upload 同时通过', result: '创建项目共享版本；项目成员不会因此获得来源群或其他附件权限。' }
  ];

  const matrixGroups = [
    { label: '浏览与获取', actions: ['A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08', 'A09'] },
    { label: '内容与版本', actions: ['A10', 'A11', 'A12', 'A13', 'A14', 'A15', 'A16', 'A17', 'A18', 'A19'] },
    { label: '空间治理', actions: ['A20', 'A21', 'A22', 'A23', 'A24', 'A25', 'A26'] },
    { label: '任务与会话复合操作', actions: ['A29', 'A30'] }
  ];

  const categoryLabels = { all: '全部', browse: '浏览', content: '内容', governance: '治理', task: '任务与会话' };
  const pageTitles = { overview: '模型总览', roles: '角色设计', actions: '权限动作', matrix: '角色权限矩阵', 'task-flow': '任务与 AI', acceptance: '验收规则' };
  const conditionalMatrixActions = new Set(['A06', 'A07', 'A15', 'A18', 'A25', 'A26', 'A30']);
  const state = { view: 'overview', role: 'Owner', category: 'all', query: '', lastDrawerTrigger: null };

  const byId = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[character]);
  const icon = name => `<svg class="wk-icon" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;

  function switchView(view) {
    if (!pageTitles[view]) return;
    state.view = view;
    document.querySelectorAll('[data-panel]').forEach(panel => { panel.hidden = panel.dataset.panel !== view; });
    document.querySelectorAll('[data-view]').forEach(button => {
      const active = button.dataset.view === view;
      button.classList.toggle('is-active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    byId('pageTitle').textContent = pageTitles[view];
    byId('mobileViewPicker').value = view;
    if (view === 'actions') {
      byId('actionSearch').value = state.query;
      requestAnimationFrame(() => byId('actionSearch').focus());
    }
    closeDrawer(false);
  }

  function renderRoleSwitch() {
    byId('roleSwitch').innerHTML = roles.map(role => `<button type="button" data-role="${role.id}" aria-pressed="${role.id === state.role}">${role.title}</button>`).join('');
    renderRoleDetail();
  }

  function renderRoleDetail() {
    const role = roles.find(item => item.id === state.role) || roles[0];
    byId('roleDetail').innerHTML = `
      <div class="role-summary"><h3>${escapeHtml(role.title)}</h3><p>${escapeHtml(role.position)}</p><p>${escapeHtml(role.summary)}</p></div>
      <div class="role-column"><h4>主要允许</h4><ul>${role.allowed.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>
      <div class="role-column"><h4>固定边界</h4><ul>${role.blocked.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>`;
  }

  function renderFilters() {
    byId('actionFilters').innerHTML = Object.entries(categoryLabels).map(([key, label]) => `<button class="wk-segmented__item" type="button" data-category="${key}" aria-pressed="${key === state.category}">${label}</button>`).join('');
  }

  function roleTags(roleList) {
    return `<span class="role-tags">${roleList.map(role => `<span class="role-tag">${escapeHtml(role)}</span>`).join('')}</span>`;
  }

  function filteredActions() {
    const query = state.query.trim().toLowerCase();
    return actions.filter(action => {
      const categoryMatch = state.category === 'all' || action.category === state.category;
      const searchText = [action.name, action.code, action.object, action.condition, action.result, action.categoryLabel].join(' ').toLowerCase();
      return categoryMatch && (!query || searchText.includes(query));
    });
  }

  function renderActions() {
    const list = filteredActions();
    byId('actionRows').innerHTML = list.map(action => `
      <tr>
        <td><button class="action-name-button" type="button" data-action-id="${action.id}">${escapeHtml(action.name)}</button></td>
        <td><code>${escapeHtml(action.code)}</code></td>
        <td>${roleTags(action.roles)}</td>
        <td>${escapeHtml(action.condition)}</td>
        <td><button class="details-button" type="button" data-action-id="${action.id}" aria-label="查看${escapeHtml(action.name)}详情">${icon('chevron')}</button></td>
      </tr>`).join('');
    byId('actionEmpty').hidden = list.length > 0;
    document.querySelector('.action-table-wrap').hidden = list.length === 0;
  }

  function matrixCell(action, role) {
    if (!action.roles.includes(role)) return '<span class="matrix-cell is-deny">—</span>';
    if (action.id === 'A29' && role === 'Editor') return '<span class="matrix-cell is-condition">条件</span>';
    if (conditionalMatrixActions.has(action.id)) return '<span class="matrix-cell is-condition">条件</span>';
    if (action.roles.includes(role)) return '<span class="matrix-cell is-allow">允许</span>';
    return '<span class="matrix-cell is-deny">—</span>';
  }

  function renderMatrix() {
    const actionById = new Map(actions.map(action => [action.id, action]));
    const rows = matrixGroups.map(group => {
      const groupRow = `<tr class="matrix-group"><th colspan="4">${escapeHtml(group.label)}</th></tr>`;
      const actionRows = group.actions.map(id => {
        const action = actionById.get(id);
        return `<tr><td><strong>${escapeHtml(action.name)}</strong><br><code>${escapeHtml(action.code)}</code></td>${roles.map(role => `<td>${matrixCell(action, role.id)}</td>`).join('')}</tr>`;
      }).join('');
      return groupRow + actionRows;
    }).join('');
    byId('matrixTable').innerHTML = `<table class="matrix-table"><thead><tr><th>权限动作</th>${roles.map(role => `<th>${role.id}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`;
  }

  function openDrawer(actionId, trigger) {
    const action = actions.find(item => item.id === actionId);
    if (!action) return;
    state.lastDrawerTrigger = trigger || document.activeElement;
    byId('drawerTitle').textContent = action.name;
    byId('drawerBody').innerHTML = `
      <section class="drawer-section"><h3>动作定义</h3><p>${escapeHtml(action.result)}</p></section>
      <section class="drawer-section"><dl class="drawer-facts">
        <div><dt>Action</dt><dd><code class="drawer-code">${escapeHtml(action.code)}</code></dd></div>
        <div><dt>主对象</dt><dd>${escapeHtml(action.object)}</dd></div>
        <div><dt>角色来源</dt><dd>${action.roles.map(escapeHtml).join('、')}</dd></div>
        <div><dt>所属分类</dt><dd>${escapeHtml(action.categoryLabel)}</dd></div>
      </dl></section>
      <section class="drawer-section"><h3>必须同时满足</h3><p>账号、租户、对象类型、生命周期和安全扫描有效；${escapeHtml(action.condition)}。</p></section>
      <section class="drawer-section"><h3>权限解释</h3><p>权限来自当前有效项目身份或明确的任务委托。文件链接、创建者身份和快捷方式都不会单独产生访问资格。</p></section>`;
    byId('actionDrawer').hidden = false;
    byId('closeDrawer').focus();
  }

  function closeDrawer(restoreFocus = true) {
    if (byId('actionDrawer').hidden) return;
    byId('actionDrawer').hidden = true;
    if (restoreFocus && state.lastDrawerTrigger instanceof HTMLElement) state.lastDrawerTrigger.focus();
  }

  function renderCalculatorOptions() {
    const allowedActions = actions.filter(action => !action.roles.includes('AI delegation') || action.category === 'task');
    byId('calculatorAction').innerHTML = allowedActions.map(action => `<option value="${action.id}">${escapeHtml(action.name)} · ${escapeHtml(action.code)}</option>`).join('');
  }

  function calculatePermission() {
    const role = byId('calculatorRole').value;
    const action = actions.find(item => item.id === byId('calculatorAction').value);
    if (!action) return;
    const delegated = role === 'AI' && action.roles.includes('AI delegation');
    const allowed = roles.some(item => item.id === role) ? action.roles.includes(role) : delegated;
    const result = byId('calculatorResult');
    result.className = `calculator-result ${allowed ? 'is-allow' : 'is-deny'}`;
    result.innerHTML = allowed
      ? `<strong>已有候选资格</strong><span>角色或任务委托提供 <code>${escapeHtml(action.code)}</code>；执行时仍需通过：${escapeHtml(action.condition)}。</span>`
      : `<strong>拒绝</strong><span>当前身份不提供 <code>${escapeHtml(action.code)}</code>。链接、上传者身份和文件创建者身份不能补足该动作。</span>`;
  }

  let toastTimer;
  function showToast(message) {
    clearTimeout(toastTimer);
    byId('toastText').textContent = message;
    byId('appToast').hidden = false;
    toastTimer = setTimeout(() => { byId('appToast').hidden = true; }, 2200);
  }

  document.addEventListener('click', event => {
    const viewButton = event.target.closest('[data-view], [data-view-jump]');
    if (viewButton) {
      switchView(viewButton.dataset.view || viewButton.dataset.viewJump);
      return;
    }
    const roleButton = event.target.closest('[data-role]');
    if (roleButton) {
      state.role = roleButton.dataset.role;
      renderRoleSwitch();
      return;
    }
    const categoryButton = event.target.closest('[data-category]');
    if (categoryButton) {
      state.category = categoryButton.dataset.category;
      renderFilters();
      renderActions();
      return;
    }
    const actionButton = event.target.closest('[data-action-id]');
    if (actionButton) openDrawer(actionButton.dataset.actionId, actionButton);
  });

  byId('globalSearch').addEventListener('input', event => {
    state.query = event.target.value;
    state.category = 'all';
    renderFilters();
    renderActions();
    if (state.view !== 'actions') switchView('actions');
  });

  byId('actionSearch').addEventListener('input', event => {
    state.query = event.target.value;
    byId('globalSearch').value = state.query;
    renderActions();
  });

  byId('mobileViewPicker').addEventListener('change', event => switchView(event.target.value));

  byId('closeDrawer').addEventListener('click', () => closeDrawer());
  byId('openCalculator').addEventListener('click', () => {
    byId('calculatorResult').className = 'calculator-result';
    byId('calculatorResult').textContent = '选择身份和动作后开始试算。系统有效性及业务条件仍需在请求发生时检查。';
    byId('permissionCalculator').showModal();
    requestAnimationFrame(() => byId('calculatorRole').focus());
  });
  byId('calculatePermission').addEventListener('click', () => {
    calculatePermission();
    showToast('已按当前角色和动作完成试算');
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !byId('actionDrawer').hidden) {
      event.preventDefault();
      closeDrawer();
    }
  });

  renderRoleSwitch();
  renderFilters();
  renderActions();
  renderMatrix();
  renderCalculatorOptions();
})();
