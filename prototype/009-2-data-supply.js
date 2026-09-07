(function () {
  'use strict';
  var T0 = window.__EVA_DEMO_TIME.T0;
  var T1 = window.__EVA_DEMO_TIME.T1;
  var supplySkills = [
    {
      id: 'sk-supply-procurement', workspace_id: 'prod', name: '间接采购需求分析',
      description: '归集跨部门采购需求，识别重复项、预算缺口与交期冲突',
      created_by: '王宜林', created_at: T0, updated_at: T1,
      content: '# 间接采购需求分析\n\n按品类、数量、预算、交期和使用部门整理需求，输出缺口清单与询价建议。', files: []
    },
    {
      id: 'sk-supply-sqe', workspace_id: 'prod', name: 'SQE质量问题研判',
      description: '分析供应商质量异常、8D 报告、临时措施和长期整改证据',
      created_by: '王宜林', created_at: T0, updated_at: T1,
      content: '# SQE质量问题研判\n\n核对异常范围、根因、临时处置、长期措施与验证记录，形成供应商整改建议。', files: []
    },
    {
      id: 'sk-supply-compliance', workspace_id: 'prod', name: '供应链合规风险检查',
      description: '检查供应商准入材料、关联关系、合同条款与履约风险',
      created_by: '王宜林', created_at: T0, updated_at: T1,
      content: '# 供应链合规风险检查\n\n按资质、关联关系、关键条款和履约记录识别风险，输出待补材料和处理建议。', files: []
    },
    {
      id: 'sk-supply-tender', workspace_id: 'prod', name: '招投标文件评审',
      description: '核对招标范围、评分规则、商务条款与评审记录的一致性',
      created_by: '王宜林', created_at: T0, updated_at: T1,
      content: '# 招投标文件评审\n\n按采购范围、资格条件、评分标准和商务条款逐项复核，输出风险项与修订建议。', files: []
    },
    {
      id: 'sk-supply-cost', workspace_id: 'prod', name: '供应链成本偏差分析',
      description: '拆解采购价格、物流费用、汇率与用量变化造成的成本偏差',
      created_by: '王宜林', created_at: T0, updated_at: T1,
      content: '# 供应链成本偏差分析\n\n统一预算、合同与实际发生口径，定位价差和量差并形成降本建议。', files: []
    },
    {
      id: 'sk-supply-kd', workspace_id: 'prod', name: 'KD排产风险分析',
      description: '结合需求、产能、物料齐套和运输周期识别排产风险',
      created_by: '王宜林', created_at: T0, updated_at: T1,
      content: '# KD排产风险分析\n\n核对需求计划、产能约束、齐套率和运输节点，输出风险等级与调整方案。', files: []
    },
    {
      id: 'sk-supply-contract', workspace_id: 'prod', name: '供应链合同全周期检查',
      description: '检查合同签订、履约、变更、续签与终止节点',
      created_by: '王宜林', created_at: T0, updated_at: T1,
      content: '# 供应链合同全周期检查\n\n识别即将到期、履约偏差和关键条款风险，形成续签或处置清单。', files: []
    }
  ];

  function supplyExpert(id, name, description, skillIds) {
    return {
      id: id, workspace_id: 'prod', runtime_id: 'rt-org', name: name,
      description: description,
      instructions: description + '。按“供应链运营协同”项目口径执行，结论、证据和待处理项挂回对应任务。',
      status: 'idle', model: 'qwen3.8-max', visibility: 'shared', max_concurrent_tasks: 2,
      created_at: T0, updated_at: T1, runtime_name: '组织共享 Runtime', owner_name: '王宜林',
      skill_ids: skillIds,
      skills: supplySkills.filter(function (skill) { return skillIds.indexOf(skill.id) >= 0; })
    };
  }

  var supplyAgents = [
    supplyExpert('ag-supply-procurement', '间接采购专家', '负责需求归集、品类分析、询价比价与采购建议', ['sk-supply-procurement', 'sk-supply-compliance']),
    supplyExpert('ag-supply-tender', '招投标管理专家', '负责招标方案、资格条件、评分规则与评审过程管理', ['sk-supply-tender', 'sk-supply-compliance']),
    supplyExpert('ag-supply-sqe', 'SQE运营专家', '负责供应商质量异常研判、整改跟踪与验证闭环', ['sk-supply-sqe']),
    supplyExpert('ag-supply-cost', '供应链成本运营专家', '负责采购成本偏差分析、价格趋势研判与降本机会识别', ['sk-supply-cost', 'sk-supply-procurement']),
    supplyExpert('ag-supply-kd', '供应链KD排产专家', '负责需求、产能、齐套与运输节点的排产风险分析', ['sk-supply-kd']),
    supplyExpert('ag-supply-compliance', '供应链合规风控专家', '负责供应商准入、关联关系和履约环节的合规风险检查', ['sk-supply-compliance']),
    supplyExpert('ag-supply-contract', '供应链合同管理专家', '负责合同签订、履约、变更、续签与终止节点管理', ['sk-supply-contract', 'sk-supply-compliance'])
  ];

  var supplySquads = [{
    id: 'sq-supply-procurement', workspace_id: 'prod', name: '采购与招投标专家团',
    description: '联合完成需求归集、询价比价、招标文件与成本评审',
    instructions: '由间接采购专家担任团长。先汇总采购需求，再由招投标管理专家和供应链成本运营专家并行核对评审规则与成本口径，形成采购决策建议。',
    leader_id: 'ag-supply-procurement', creator_id: 'u-wangyilin', member_count: 3,
    members: [
      { member_type: 'agent', member_id: 'ag-supply-procurement', role: 'leader', member_name: '间接采购专家' },
      { member_type: 'agent', member_id: 'ag-supply-tender', role: '招投标管理', member_name: '招投标管理专家' },
      { member_type: 'agent', member_id: 'ag-supply-cost', role: '成本运营', member_name: '供应链成本运营专家' }
    ],
    created_at: T0, updated_at: T1, leader_name: '间接采购专家', creator_name: '王宜林'
  }, {
    id: 'sq-supply-risk', workspace_id: 'prod', name: '履约与风险专家团',
    description: '联合处理质量、排产、合规与合同履约风险',
    instructions: '由供应链合规风控专家担任团长。SQE运营专家、供应链KD排产专家和供应链合同管理专家分别核查质量、交付与合同风险，汇总为分级处置方案。',
    leader_id: 'ag-supply-compliance', creator_id: 'u-wangyilin', member_count: 4,
    members: [
      { member_type: 'agent', member_id: 'ag-supply-compliance', role: 'leader', member_name: '供应链合规风控专家' },
      { member_type: 'agent', member_id: 'ag-supply-sqe', role: '质量运营', member_name: 'SQE运营专家' },
      { member_type: 'agent', member_id: 'ag-supply-kd', role: 'KD排产', member_name: '供应链KD排产专家' },
      { member_type: 'agent', member_id: 'ag-supply-contract', role: '合同管理', member_name: '供应链合同管理专家' }
    ],
    created_at: T0, updated_at: T1, leader_name: '供应链合规风控专家', creator_name: '王宜林'
  }];

  var supplyProjects = [{
    id: 'p-supply', workspace_id: 'prod', title: '供应链运营协同',
    description: '协同推进间接采购、供应商质量与合规风控工作', icon: '📦',
    status: 'in_progress', priority: 'high', lead_type: 'member', lead_id: 'u-wangyilin',
    issue_count: 7, done_count: 1, created_at: T0, updated_at: T1, lead_name: '王宜林'
  }];

  function supplyTask(number, title, status, priority, assigneeType, assigneeId, assigneeName, description) {
    return {
      id: 'supply-' + number, workspace_id: 'prod', number: number,
      identifier: 'SC-' + (100 + number), title: title, description: description, status: status,
      priority: priority, assignee_type: assigneeType, assignee_id: assigneeId,
      assignee_name: assigneeName, creator_id: 'u-wangyilin', creator_name: '王宜林',
      creator_avatar: window.__EVA_CURRENT_USER_PORTRAIT,
      project_id: 'p-supply', project_name: '供应链运营协同', position: number,
      created_at: T0, updated_at: T1
    };
  }

  var supplyIssues = [
    supplyTask(1, '完成本季度间接采购需求归集', 'in_progress', 'high', 'squad', 'sq-supply-procurement', '采购与招投标专家团', '合并行政、IT 和设备维保需求，确认数量、预算、交期与待补信息。'),
    supplyTask(2, '完成供应商招投标文件评审', 'in_review', 'high', 'agent', 'ag-supply-tender', '招投标管理专家', '复核资格条件、评分规则、技术标与商务标，标记影响公平性和履约的风险项。'),
    supplyTask(3, '处理关键供应商来料质量异常', 'in_progress', 'high', 'agent', 'ag-supply-sqe', 'SQE运营专家', '复核批次 A-2409 的隔离措施、8D 根因分析和长期整改证据。'),
    supplyTask(4, '分析核心品类采购成本偏差', 'todo', 'medium', 'agent', 'ag-supply-cost', '供应链成本运营专家', '拆解预算、合同与实际采购金额的价差、量差和物流费用影响。'),
    supplyTask(5, '评估下月KD排产与齐套风险', 'todo', 'high', 'agent', 'ag-supply-kd', '供应链KD排产专家', '结合需求计划、产能、物料齐套率和运输周期识别高风险节点。'),
    supplyTask(6, '复核新供应商准入合规材料', 'todo', 'high', 'squad', 'sq-supply-risk', '履约与风险专家团', '检查供应商资质、关联关系声明、制裁名单与关键履约条款。'),
    supplyTask(7, '完成到期采购合同续签检查', 'done', 'medium', 'agent', 'ag-supply-contract', '供应链合同管理专家', '核对三份到期合同的履约情况、价格调整、续签期限和终止条件。')
  ];

  var supplyAgentTasks = {};
  supplyAgents.forEach(function (agent) {
    supplyAgentTasks[agent.id] = supplyIssues.filter(function (issue) { return issue.assignee_id === agent.id; }).map(function (issue, index) {
      return {
        id: 'at-' + agent.id + '-' + index, agent_id: agent.id, issue_id: issue.id,
        status: issue.status === 'done' ? 'completed' : issue.status === 'in_progress' ? 'running' : 'queued',
        created_at: issue.created_at, started_at: issue.created_at,
        completed_at: issue.status === 'done' ? issue.updated_at : null,
        kind: 'manual', trigger_summary: issue.title
      };
    });
  });

  window.__EVA_SUPPLY_CHAIN_DEMO = {
    overview: {
      status: '协作中', period: '2026年9月', stage: '风险处置与证据复核',
      background: '围绕采购交期、供应商质量与排产风险，集中协同处理影响保供的关键事项。',
      goals: ['明确物料缺口与恢复计划', '完成质量整改证据复核', '同步排产影响与待决策事项'],
      scope: ['采购', '供应商质量', '排产', '合规'],
      milestones: [['09月04日', '汇总保供风险', 'done'], ['09月07日', '复核整改证据与备选方案', 'active'], ['09月11日', '跟进恢复计划', 'pending']]
    },
    agents: supplyAgents, squads: supplySquads, skills: supplySkills, autopilots: [],
    projects: supplyProjects, issues: supplyIssues, agentTasks: supplyAgentTasks
  };
})();

// Membership demo identities: clone ownership is explicit and distinct from assistants.
window.__EVA_MEMBERSHIP_CLONES = [
  {id:'b-wangyilin',ownerId:'u-wangyilin',name:'王宜林的分身',active:true},
  {id:'clone-wangyilin-procurement',ownerId:'u-wangyilin',name:'王宜林的采购分身',active:true},
  {id:'clone-linxiao',ownerId:'u-linxiao',name:'林晓的分身',active:true},
  {id:'clone-hejing',ownerId:'u-hejing',name:'何静的分身',active:true}
];

// Review scenario belongs to the existing collaboration workspace (prod).
// p-supply is its task-board project, not its membership scope.
window.__EVA_SUPPLY_MEMBER_DEMO = {
  projectId:'prod', version:1,
  humans:[{id:'u-wangyilin',role:'owner'},{id:'u-linxiao',role:'member'},{id:'u-zhouyuan',role:'admin'}],
  cloneIds:['b-wangyilin','clone-linxiao'],
  group:{id:'supply-demo-rectification',name:'供应商整改协同',ownerId:'u-wangyilin',humans:[{id:'u-wangyilin',role:'member'},{id:'u-linxiao',role:'member'}],cloneIds:['clone-linxiao']},
  thread:{id:'supply-demo-evidence',name:'A-2409整改证据',status:1,created_at:'2026-09-02T10:00:00+08:00',creator_name:'林晓',message_count:1,member_count:2,unread:0},
  invitation:{scopeId:'prod',inviterId:'u-linxiao',inviteeId:'u-hejing',status:'pending_approval'},
  messages:[
    {kind:'text',senderId:'u-linxiao',time:'10:00',text:'A-2409 来料异常已隔离，整改证据已整理。已发起邀请何静加入项目，请负责人审批。'},
    {kind:'text',senderId:'u-wangyilin',time:'10:02',text:'先将分析报告共享给项目成员。是否对供应商承诺执行，由人类负责人确认。'},
    {kind:'file',senderId:'u-linxiao',time:'10:03',file:{name:'A-2409来料异常分析报告.pdf',size:42000,extension:'pdf',version:1,taskId:'SC-103'}}
  ]
};

// Small, explicit cast for the leadership prototype walkthrough.
window.__EVA_MEMBER_DEMO_IDS=["u-wangyilin","u-hejing","u-linxiao","u-zhouyuan","u-suhang"];

// Conversation fixtures stay in the supply-chain project. Stable IDs allow additive upgrades.
window.__EVA_SUPPLY_CHAT_CONTENT = [
  {scopeId:'all:prod',notice:'同步跨条线进展和待决事项；具体讨论留在对应群，确认后的结论回到这里。',messages:[
  [
    "u-wangyilin",
    "09:00",
    "今天先看 A-2409，会不会影响下午排产？"
  ],
  [
    "u-linxiao",
    "09:02",
    "异常批次已隔离，现有合格库存能撑到今天下班。供应商还缺连续验证数据，我在整改群催。"
  ],
  [
    "u-zhouyuan",
    "09:03",
    "我先保留原排产，备选顺序已经准备好。中午前需要一个明确结论。"
  ],
  [
    "u-wangyilin",
    "09:04",
    "@Eva 项目管理专员 帮我汇总一下，今天哪些事需要拍板？"
  ],
  [
    "project-agent:prod",
    "09:05",
    "**今天需要确认两件事**\n\n| 事项 | 当前缺口 | 下一步 |\n| --- | --- | --- |\n| A-2409 放行 | 连续验证数据 | 林晓收齐后发起现场复核 |\n| 是否调整排产 | 放行时间未定 | 周远评估备选方案，王宜林确认 |\n\n采购需求继续按 SC-101 推进，暂不占用这次决策。"
  ],
  [
    "u-wangyilin",
    "09:06",
    "好，先不承诺恢复交期。林晓 11 点前同步证据进展，周远把备选方案的影响带上。"
  ],
  [
    "u-linxiao",
    "10:48",
    "供应商补了数据，我已放进整改证据子区。还在核对样本批次，暂时不能按放行处理。"
  ],
  [
    "u-zhouyuan",
    "10:50",
    "备选方案会多一次换型。我把产能影响补到 SC-105，等质量结论一起确认。\n@Eva 项目管理专员 请结合刚才的更新，简要汇总还需要确认的事项。"
  ],
  [
    "project-agent:prod",
    "10:52",
    "收到，**待决事项仍是放行与排产**。\n\n- SC-103：等待批次核对与现场复核。\n- SC-105：备选方案已补影响说明。\n\n> 证据已收到，不等于已经放行。"
  ],
  [
    "u-wangyilin",
    "10:54",
    "按这个推进。细节留在对应群，有结论再同步这里。"
  ]
]},
  {scopeId:'supply-demo-rectification',notice:'跟进 A-2409 来料异常与供应商整改。证据放入“A-2409整改证据”子区；对外承诺和放行由人类负责人确认。',messages:[
    ['u-linxiao','10:06','补充现场情况：本批抽检 200 件，发现 12 件尺寸偏差。仓库已按批次隔离，同型号其他批次正在复核。'],
    ['u-wangyilin','10:09','先分开确认两件事：异常是否只涉及这一批，以及临时筛选方案能否稳定识别不合格件。'],
    ['u-linxiao','10:13','供应商提供了设备调整记录，但还没有调整后的连续生产验证。我把这项列为证据缺口，暂不建议关闭异常。'],
    ['u-wangyilin','10:18','按这个口径推进。今天先完成复测和影响范围确认，不直接承诺恢复供货。'],
    ['u-linxiao','10:24','待办已明确：我跟进复测记录和现场照片；供应商补连续验证数据；你确认临时放行条件。文件集中放子区，不在多个群重复传。'],
    ['u-wangyilin','10:28','可以。何静加入项目后先看共享的分析报告；需要参与整改讨论时，再单独邀请进这个群。']
  ]},
  {scopeId:'supply-demo-evidence',messages:[
    ['u-linxiao','10:08','证据清单：① 来料抽检原始记录；② 批次隔离与标识照片；③ 设备调整记录；④ 调整后连续生产验证。前两项已收齐，后两项待补。'],
    ['u-wangyilin','10:14','复测记录请保留样本编号、测量工具和复核人，避免只有一张结论截图。'],
    ['u-linxiao','10:21','已通知现场按同一模板补齐。还要核对量具校准状态，供应商口头说明先不作为有效证据。'],
    ['u-wangyilin','10:30','收齐后先做内部复核。验证不通过就继续整改，不自动关闭 SC-103。']
  ]},
  {groupName:'采购与招投标',messages:[
    ['u-zhouyuan','16:05','本季度需求归集还有两个缺口：设备维保的服务范围、IT 配件的交付批次。先补口径，再进入询价。'],
    ['u-linxiao','16:08','供应商报价里有一项把运输费单列了。比价表需要统一含税、含运口径，不能只比较单价。'],
    ['u-wangyilin','16:12','同意。SC-101 先补齐需求；SC-102 的评审记录要写清技术偏差和商务偏差，不把两者合成一个分数。']
  ]},
  {groupName:'质量与排产',messages:[
    ['u-linxiao','16:15','A-2409 当前保持隔离。没有收到连续验证数据之前，排产请继续按已确认的合格库存计算。'],
    ['u-zhouyuan','16:19','我已在排产风险里单列这批物料。备选方案是调整装配顺序，暂不修改对客户的承诺日期。'],
    ['u-wangyilin','16:23','先把调整顺序后的产能影响算出来。是否启用备选方案，等质量验证和交付影响一起确认。']
  ]},
  {groupName:'合规与合同',messages:[
    ['u-zhouyuan','16:26','新供应商准入还缺关联关系声明，合同续签还要确认质保起算时间。两项分别跟踪，材料齐全不等于合同条款已通过。'],
    ['u-linxiao','16:30','供应商表示今天会补声明，我收到后先核对签章和主体名称。质量附件继续使用本轮确认的检验标准。'],
    ['u-wangyilin','16:35','未完成审核前不要通知供应商“准入通过”。续签条款有变化的部分单独标出，交给对应负责人确认。']
  ]}
];

// All-hands demo is maintained only in __EVA_SUPPLY_CHAT_CONTENT.
window.__EVA_PROJECT_AGENT_DEMO = [];
