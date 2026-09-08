(function () {
  'use strict';
  var T0 = window.__EVA_DEMO_TIME.T0;
  var T1 = window.__EVA_DEMO_TIME.T1;
  var skills = [
    {
      id: 'sk-drive-requirement', workspace_id: 'drive-design', name: '云盘需求拆解',
      description: '把功能目标拆成用户场景、边界条件、验收标准和待确认事项',
      created_by: '王宜林', created_at: T0, updated_at: T1,
      content: '# 云盘需求拆解\n\n识别用户目标、文件对象、权限边界和异常路径，输出可执行任务清单。', files: []
    },
    {
      id: 'sk-drive-interaction', workspace_id: 'drive-design', name: '交互规范检查',
      description: '检查文件上传、移动、复制、分享等流程的状态与反馈是否完整',
      created_by: '王宜林', created_at: T0, updated_at: T1,
      content: '# 交互规范检查\n\n覆盖默认、悬停、处理中、成功、失败、无权限和空状态。', files: []
    },
    {
      id: 'sk-drive-permission', workspace_id: 'drive-design', name: '文件权限矩阵检查',
      description: '核对个人文件、项目文件、群聊文件及分享链接的权限边界',
      created_by: '王宜林', created_at: T0, updated_at: T1,
      content: '# 文件权限矩阵检查\n\n按文件归属、操作者身份和操作类型检查可见、可编辑、可下载与可分享范围。', files: []
    },
    {
      id: 'sk-drive-regression', workspace_id: 'drive-design', name: '云盘回归检查单',
      description: '按固定用例检查上传、预览、移动、复制、删除和分享链路',
      created_by: '王宜林', created_at: T0, updated_at: T1,
      content: '# 云盘回归检查单\n\n逐项执行核心文件操作并记录预期结果、实际结果和阻塞问题。', files: []
    }
  ];

  function expert(id, name, description, model, skillIds) {
    return {
      id: id, workspace_id: 'drive-design', runtime_id: 'rt-org', name: name,
      description: description,
      instructions: description + '。按“团队文件功能设计”项目口径执行，结论和交付物挂回对应任务。',
      status: 'idle', model: model, visibility: 'shared', max_concurrent_tasks: 2,
      created_at: T0, updated_at: T1, runtime_name: '组织共享 Runtime', owner_id: 'u-wangyilin', owner_name: '王宜林',
      skill_ids: skillIds,
      skills: skills.filter(function (skill) { return skillIds.indexOf(skill.id) >= 0; })
    };
  }

  var agents = [
    expert('ag-drive-product', '云盘产品专家', '负责场景梳理、需求拆解、优先级判断和验收口径', 'qwen3.8-max', ['sk-drive-requirement', 'sk-drive-permission']),
    expert('ag-drive-ux', '云盘交互设计专家', '负责文件操作流程、状态反馈、异常路径和交互一致性', 'qwen3.8-max', ['sk-drive-interaction', 'sk-drive-permission']),
    expert('ag-drive-fe', '云盘前端开发专家', '负责把确认后的云盘交互实现为可验证的前端功能', 'qwen3.7-plus', ['sk-drive-interaction', 'sk-drive-regression']),
    expert('ag-drive-qa', '云盘测试验收专家', '负责权限、文件操作和异常恢复的回归测试与验收', 'qwen3.7-plus', ['sk-drive-permission', 'sk-drive-regression'])
  ];

  var squads = [{
    id: 'sq-drive-delivery', workspace_id: 'drive-design', name: '云盘功能交付团',
    description: '从需求拆解、交互设计到开发和回归验收的一体化专家编队',
    instructions: '由云盘产品专家担任团长。先确认目标和权限边界，再分派设计、开发与测试任务；存在阻塞时回到原任务说明，最终由团长汇总交付物。',
    leader_id: 'ag-drive-product', creator_id: 'u-wangyilin', member_count: 4,
    members: [
      { member_type: 'agent', member_id: 'ag-drive-product', role: 'leader', member_name: '云盘产品专家' },
      { member_type: 'agent', member_id: 'ag-drive-ux', role: '交互设计', member_name: '云盘交互设计专家' },
      { member_type: 'agent', member_id: 'ag-drive-fe', role: '前端实现', member_name: '云盘前端开发专家' },
      { member_type: 'agent', member_id: 'ag-drive-qa', role: '测试验收', member_name: '云盘测试验收专家' }
    ],
    created_at: T0, updated_at: T1, leader_name: '云盘产品专家', creator_name: '王宜林'
  }];

  var autopilots = [
    {
      id: 'ap-drive-daily', workspace_id: 'drive-design', title: '每日云盘设计进展汇总',
      description: '汇总当天需求、交互、开发和测试任务的进展、阻塞与下一步，并生成项目任务',
      assignee_type: 'squad', assignee_id: 'sq-drive-delivery', assignee_name: '云盘功能交付团',
      status: 'active', execution_mode: 'create_issue', issue_title_template: '{{date}}-云盘设计进展汇总',
      created_by_type: 'member', created_by_id: 'u-wangyilin', trigger_kinds: ['schedule'],
      last_run_at: '2026-09-02T09:00:00Z', next_run_at: '2026-09-03T09:00:00Z',
      last_run_status: 'succeeded', created_at: T0, updated_at: T1
    },
    {
      id: 'ap-drive-permission', workspace_id: 'drive-design', title: '每周文件权限回归检查',
      description: '每周检查项目文件、群聊文件和分享链接的权限矩阵，发现异常时自动创建待处理任务',
      assignee_type: 'agent', assignee_id: 'ag-drive-qa', assignee_name: '云盘测试验收专家',
      status: 'active', execution_mode: 'create_issue', issue_title_template: '{{date}}-文件权限回归检查',
      created_by_type: 'member', created_by_id: 'u-wangyilin', trigger_kinds: ['schedule'],
      last_run_at: '2026-08-31T10:00:00Z', next_run_at: '2026-09-07T10:00:00Z',
      last_run_status: 'succeeded', created_at: T0, updated_at: T1
    }
  ];

  var projects = [{
    id: 'p-drive', workspace_id: 'drive-design', title: '团队文件功能设计',
    description: '完善文件上传、移动、复制、分享和权限体验', icon: '☁️',
    status: 'in_progress', priority: 'high', lead_type: 'member', lead_id: 'u-wangyilin',
    issue_count: 9, done_count: 1, created_at: T0, updated_at: T1, lead_name: '王宜林'
  }];

  function task(number, title, status, priority, assigneeType, assigneeId, assigneeName, extra) {
    return Object.assign({
      id: 'drive-' + number, workspace_id: 'drive-design', number: number,
      identifier: 'DRIVE-' + number, title: title, description: null, status: status,
      priority: priority, assignee_type: assigneeType, assignee_id: assigneeId,
      assignee_name: assigneeName, creator_id: 'u-wangyilin', creator_name: '王宜林',
      creator_avatar: window.__EVA_CURRENT_USER_PORTRAIT,
      project_id: 'p-drive', project_name: '团队文件功能设计', position: number,
      created_at: T0, updated_at: T1
    }, extra || {});
  }

  var issues = [
    task(1, '完成共享链接权限方案', 'in_progress', 'high', 'squad', 'sq-drive-delivery', '云盘功能交付团', {
      description: '梳理项目文件和群聊文件生成分享链接后的查看、下载、有效期与撤销规则，由专家团完成方案、交互与验收口径。'
    }),
    task(2, '设计大文件上传失败恢复流程', 'in_review', 'medium', 'agent', 'ag-drive-ux', '云盘交互设计专家', {
      description: '覆盖断网、超时、空间不足和客户端退出后的失败提示、保留状态与重试入口。'
    }),
    task(3, '实现文件移动与复制交互', 'todo', 'high', 'agent', 'ag-drive-fe', '云盘前端开发专家', {
      description: '复用现有文件选择与目标目录组件，实现移动、复制、同名冲突和操作反馈。'
    }),
    task(4, '执行文件权限回归检查', 'todo', 'medium', 'agent', 'ag-drive-qa', '云盘测试验收专家', {
      description: '由“每周文件权限回归检查”自动化任务生成，核对个人、项目、群聊和分享链接四类文件权限。',
      automation_id: 'ap-drive-permission'
    }),
    task(5, '补齐云盘空状态与错误提示', 'backlog', 'low', 'agent', 'ag-drive-product', '云盘产品专家', {
      description: '统一空文件夹、无权限、文件不存在和网络失败时的提示与下一步操作。'
    }),
    task(6, '每日云盘设计进展汇总', 'done', 'low', 'squad', 'sq-drive-delivery', '云盘功能交付团', {
      description: '由“每日云盘设计进展汇总”自动化任务生成，已汇总当天进展、阻塞和下一步。',
      automation_id: 'ap-drive-daily', updated_at: '2026-09-02T09:08:00Z'
    })
  ];

  issues.push(
    task(7, '补齐同名文件冲突处理', 'in_progress', 'high', 'member', 'u-linxiao', '林晓', {description:'移动或复制遇到同名文件时提供保留两份与取消路径；失败不删除原文件，在文件功能开发群复核。'}),
    task(8, '验收批量文件操作反馈', 'todo', 'medium', 'member', 'u-hejing', '何静', {description:'覆盖部分成功、部分失败与无权限文件，逐项说明结果并允许重试失败项；在文件验收与反馈群记录复现步骤。'}),
    task(9, '完善文件搜索与空状态说明', 'in_review', 'medium', 'member', 'u-wangyilin', '王宜林', {description:'区分无匹配结果、文件夹为空与无访问权限，搜索结果仅展示当前可访问文件；评审后补充验收记录。'})
  );

  var agentTasks = {};
  agents.forEach(function (agent) {
    agentTasks[agent.id] = issues.filter(function (issue) { return issue.assignee_id === agent.id; }).map(function (issue, index) {
      return {
        id: 'at-' + agent.id + '-' + index, agent_id: agent.id, issue_id: issue.id,
        status: issue.status === 'done' ? 'completed' : issue.status === 'in_progress' ? 'running' : 'queued',
        created_at: issue.created_at, started_at: issue.created_at,
        completed_at: issue.status === 'done' ? issue.updated_at : null,
        kind: issue.automation_id ? 'autopilot' : 'manual', trigger_summary: issue.title
      };
    });
  });

  window.__EVA_DRIVE_DEMO = {
    agents: agents, squads: squads, skills: skills, autopilots: autopilots,
    projects: projects, issues: issues, agentTasks: agentTasks
  };
})();

// Local sample assets for prototype preview/download; never real supplier records.
window.__EVA_FILE_SAMPLE_URLS = {
  'A-2409来料异常分析报告.pdf': 'prototype/assets/file-samples/a-2409-demo.pdf'
};

Object.assign(window.__EVA_FILE_SAMPLE_URLS, {"EVA-上传恢复排查清单.md": "prototype/assets/file-samples/EVA-上传恢复排查清单.md", "EVA-分享权限验收矩阵.csv": "prototype/assets/file-samples/EVA-分享权限验收矩阵.csv", "EVA-会议行动项模板.md": "prototype/assets/file-samples/EVA-会议行动项模板.md"});

Object.assign(window.__EVA_FILE_SAMPLE_URLS, {
  'A-2409现场复核清单.md': 'prototype/assets/file-samples/A-2409现场复核清单.md',
  'A-2409排产影响测算.html': 'prototype/assets/file-samples/A-2409排产影响测算.html',
  'A-2409临时放行评审纪要.docx': 'prototype/assets/file-samples/A-2409临时放行评审纪要.docx.html'
});

Object.assign(window.__EVA_FILE_SAMPLE_URLS, {"供应链晨会行动清单.md":"prototype/assets/file-samples/供应链晨会行动清单.md","A-2409整改证据检查表.csv":"prototype/assets/file-samples/A-2409整改证据检查表.csv","采购合同评审提纲.md":"prototype/assets/file-samples/采购合同评审提纲.md"});

window.__EVA_FILE_DOWNLOAD_FALLBACK_URL = 'prototype/assets/file-samples/file-placeholder.txt';
