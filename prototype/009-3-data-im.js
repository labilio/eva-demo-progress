(function () {
  'use strict';
  window.__EVA_IM_DEMO = {
    aiTeamSessions: [
  {
    "id": "team-assistant-welcome",
    "identityId": "ai-general",
    "title": "把今天的事情排出先后",
    "messages": [
      {
        "minute": 840,
        "ai": false,
        "text": "今天采购、质量和合同都在催。帮我排一下，先处理什么？"
      },
      {
        "minute": 841,
        "ai": true,
        "text": "先处理 A-2409 来料异常，它可能影响今天排产；其次确认两份到期合同；采购需求汇总可放到下午。\n我把每项的负责人、缺失证据和截止时间整理好了。"
      },
      {
        "minute": 842,
        "ai": false,
        "text": "给我一份十分钟晨会提纲，别只报进度。"
      },
      {
        "minute": 843,
        "ai": true,
        "text": "**晨会只讨论三件事：**\n- 林晓：复测证据是否齐全？\n- 何静：哪些合同条款需要拍板？\n- 周远：采购是否有交付缺口？"
      }
    ]
  },
  {
    "id": "team-persona-welcome",
    "identityId": "persona-initial",
    "title": "供应商催交期，这句话怎么回",
    "messages": [
      {
        "minute": 480,
        "ai": false,
        "text": "供应商催我确认恢复交期。我想回“应该没问题”，你觉得呢？"
      },
      {
        "minute": 481,
        "ai": true,
        "text": "这句话容易被理解成承诺。复测通过了，但现场放行和运输窗口还没确认。现在可以确认的是“正在复核”，还不是“何时恢复”。"
      },
      {
        "minute": 482,
        "ai": false,
        "text": "那替我拟一句，别写得像公文。"
      },
      {
        "minute": 483,
        "ai": true,
        "text": "可以这样回：\n\n> 复测材料我们已经收到，正在安排现场复核。放行和运输时间确认后，我第一时间给你明确交期。\n\n**有进展、有下一步，也不提前承诺。**"
      }
    ]
  },
  {
    "id": "team-rd-review",
    "identityId": "ai-rd",
    "title": "把评审意见变成可验收清单",
    "messages": [
      {
        "minute": 860,
        "ai": false,
        "text": "项目群聊这轮评审意见很多，帮我收成研发能执行的清单。"
      },
      {
        "minute": 861,
        "ai": true,
        "text": "这轮重点验收三项：未入群不能读历史、共享文件不扩大群权限、切换会话不串草稿。先查权限边界，再查交互。"
      },
      {
        "minute": 862,
        "ai": false,
        "text": "给测试同事一条能走通的路径。"
      },
      {
        "minute": 863,
        "ai": true,
        "text": "林晓转存整改报告 → 何静查看共享文件 → 确认何静仍不能读整改群历史。再往返消息与我的 AI 团队，检查草稿是否保留。"
      }
    ]
  },
  {
    "id": "team-pilot-night",
    "identityId": "persona-pilot",
    "title": "明早演示，先帮我挑刺",
    "messages": [
      {
        "minute": 480,
        "ai": false,
        "text": "明早给老板演示，你先帮我挑一个最容易翻车的地方。"
      },
      {
        "minute": 481,
        "ai": true,
        "text": "我会先盯入口往返：单个页面再漂亮，切回来丢了草稿，现场就很难解释。建议先走一遍“项目群 → 创建任务 → 回到原会话”。"
      },
      {
        "minute": 482,
        "ai": false,
        "text": "如果只有三分钟，你会怎么讲？"
      },
      {
        "minute": 483,
        "ai": true,
        "text": "**先讲一件事怎么做完，不从菜单开始。**\n\n**前 30 秒**：群里提出问题。\n**中间 2 分钟**：分身给判断，人确认并建任务。\n**最后 30 秒**：看结果，留一个问题让老板追问。\n\n最后停在任务结果上。配置细节留到老板追问时再展开。"
      }
    ]
  }
],
    channels: [
      { id: 'im-eva-octo', name: 'EVA + OCTO 融合推进群', color: '#7567d8', unread: 0, members: 6, lastAt: '2026-09-04T18:20:00+08:00', threads: [], demoOnly: true },
      { id: 'im-delivery', name: '项目交付推进', color: '#66789e', unread: 0, members: 5, lastAt: '2026-09-04T17:30:00+08:00', threads: [], demoOnly: true },
      { id: 'im-review', name: '方案评审', color: '#5f8798', unread: 0, members: 4, lastAt: '2026-09-04T16:42:00+08:00', threads: [], demoOnly: true },
      { id: 'im-meeting', name: '会议跟进', color: '#9a8062', unread: 0, members: 5, lastAt: '2026-09-04T15:40:00+08:00', threads: [], demoOnly: true },
    ],
    messages: {
      'im-eva-octo': [
        { kind: 'divider', text: '9月4日' },
        { kind: 'text', sender: { uid: 'u-haozong', name: '昊总', color: '#6f75a8', online: true }, time: '17:42', text: 'EVA+OCTO融合性怎么样了？' },
        { kind: 'text', sender: { uid: 'u-kangzhixi', name: '康执玺', color: '#4c83a5', online: true }, time: '17:45', text: '@Eva 项目管理专员 汇报一下最新进展和情况。', mentions: [{ name: '@Eva 项目管理专员', uid: 'b-eva-octo' }] },
        { kind: 'text', sender: { uid: 'b-eva-octo', name: 'Eva 项目管理专员', kind: 'project-agent', identityAppearance: window.EvaAIIdentity.projectAgentAppearance(), color: '#7567d8', ai: true, online: true }, time: '17:47', text: "### 项目进展与待确认项\n\n**进展**：消息、Loop 任务与团队文件的演示链路已贯通，统一 IM 会话框架正在收口。\n\n| 待确认项 | 影响 | 下一步 |\n| --- | --- | --- |\n| 任务触发后的身份与权限 | 可能影响可见范围 | 完成联调与权限核对 |\n| 数字员工异常恢复 | 失败后的处理不明确 | 确定重试与人工接管方式 |\n| 验收口径 | 影响交付判断 | 明确可验收结果与责任人 |\n\n> 上述为演示进展摘要，不代表已完成上线验收。" },
        { kind: 'text', sender: { uid: 'u-haozong', name: '昊总', color: '#6f75a8', online: true }, time: '17:55', text: '需要在月底前上线，并打通数字员工，让数字员工进入任务协作。' },
        { kind: 'text', sender: { uid: 'u-kangzhixi', name: '康执玺', color: '#4c83a5', online: true }, time: '18:02', text: '@Eva 项目管理专员 创建前面这个任务，并指定 @威少 做负责人。', mentions: [{ name: '@Eva 项目管理专员', uid: 'b-eva-octo' }, { name: '@威少', uid: 'u-weishao' }] },
        { kind: 'text', sender: { uid: 'b-eva-octo', name: 'Eva 项目管理专员', kind: 'project-agent', identityAppearance: window.EvaAIIdentity.projectAgentAppearance(), color: '#7567d8', ai: true, online: true }, time: '18:03', text: '任务已创建，负责人已指定为威少。' },
        { kind: 'refcard', sender: { uid: 'b-eva-octo', name: 'Eva 项目管理专员', kind: 'project-agent', identityAppearance: window.EvaAIIdentity.projectAgentAppearance(), color: '#7567d8', ai: true, online: true }, time: '18:03', ref: { target: 'issue', title: '月底前完成 EVA + OCTO 融合上线并接入数字员工', spaceName: 'EVA + OCTO 融合推进群', desc: '负责人：威少 · 截止：本月底', allowed: true, issueId: 'issue22' } }
      ],
      'im-delivery': [
        { kind: 'divider', text: '9月4日' },
        { kind: 'text', sender: { uid: 'u-chenbo', name: '陈博', color: '#8c658f', online: true }, time: '16:58', text: '客户演示环境已经更新，请把今天的交付风险和负责人一起收口。' },
        { kind: 'text', sender: { uid: 'u-wangyilin', name: '王宜林', color: '#557a94', online: true }, time: '17:02', text: '@王宜林的 Eva 助理 请根据群内结论整理交付清单。', mentions: [{ name: '@王宜林的 Eva 助理', uid: 'b-wangyilin' }] },
        { kind: 'text', sender: { uid: 'b-wangyilin', name: '王宜林的 Eva 助理', color: '#7567d8', ai: true, online: true }, time: '17:05', text: "### 交付前检查清单\n\n- [ ] **演示环境**：确认入口与目标版本一致。\n- [ ] **关键链路**：逐项确认消息、任务、文件之间的跳转。\n- [ ] **现场兜底**：明确异常处理人和备用演示路径。\n\n**待补充**：请各项负责人确认自己的截止时间；确认前不标记完成。" },
        { kind: 'taskcard', sender: { uid: 'b-wangyilin', name: '王宜林的 Eva 助理', color: '#7567d8', ai: true, online: true }, time: '17:06', note: '由群聊结论创建，负责人和截止时间已同步。' }
      ],
      'im-review': [
        { kind: 'divider', text: '9月4日' },
        { kind: 'text', sender: { uid: 'u-wangyilin', name: '王宜林', color: '#557a94', online: true }, time: '16:35', text: '@王宜林的 Eva 助理 读取附件，给出本次评审最需要确认的三项。', mentions: [{ name: '@王宜林的 Eva 助理', uid: 'b-wangyilin' }] },
        { kind: 'file', sender: { uid: 'u-chenbo', name: '陈博', color: '#8c658f', online: true }, time: '16:36', file: { name: 'EVA-OCTO融合方案评审稿.pdf', size: 2726297, extension: 'pdf' } },
        { kind: 'text', sender: { uid: 'b-wangyilin', name: '王宜林的 Eva 助理', color: '#7567d8', ai: true, online: true }, time: '16:42', text: '需要确认：一、IM 内核与 Eva 外壳的边界；二、AI 身份与权限继承；三、上线前的回归范围。文档第 6、11、18 页分别给出了对应方案。' }
      ],
      'im-meeting': [
        { kind: 'divider', text: '9月4日' },
        { kind: 'text', sender: { uid: 'u-kangzhixi', name: '康执玺', color: '#4c83a5', online: true }, time: '15:22', text: '刚才会议里有结论、有行动项，也有一个待确认风险。' },
        { kind: 'text', sender: { uid: 'u-wangyilin', name: '王宜林', color: '#557a94', online: true }, time: '15:24', text: '@王宜林的 Eva 助理 按这三类整理，并把行动项转成任务。', mentions: [{ name: '@王宜林的 Eva 助理', uid: 'b-wangyilin' }] },
        { kind: 'text', sender: { uid: 'b-wangyilin', name: '王宜林的 Eva 助理', color: '#7567d8', ai: true, online: true }, time: '15:28', text: '已完成分类：结论 2 项、行动项 3 项、待确认风险 1 项。行动项已转成任务并关联到原会议。' }
      ]
    }
  };
})();

// Contacts demo: additional personas of existing colleagues; no new people or projects.
window.__EVA_CONTACT_PERSONAS = [
  {id:'clone-zhouyuan',ownerId:'u-zhouyuan',name:'飞行员M号'},
  {id:'clone-suhang',ownerId:'u-suhang',name:'正在休假的预言家'},
  {id:'contact-clone:lin:quality',ownerId:'u-linxiao',name:'质量追踪员'},
  {id:'contact-clone:lin:report',ownerId:'u-linxiao',name:'复测报告整理员'}
];
window.__EVA_CONTACT_IDENTITY_ALIASES = {'b-wangyilin':'persona-initial','b-pilot':'persona-pilot'};

window.__EVA_IM_MARKDOWN_UPGRADES = {
  "已归为三项：成员权限、群文件共享、入口切换。每项都补了触发条件和预期结果。\n优先验证：未入群不能读历史；转存文件不授予来源群权限；切换会话不残留上一条草稿。": "### 评审意见 → 可验收清单\n\n| 范围 | 触发条件 | 预期结果 |\n| --- | --- | --- |\n| 成员权限 | 未加入整改群的成员打开会话 | 不可读取群历史 |\n| 文件共享 | 报告转存到项目团队文件 | 可读共享文件，不获得来源群权限 |\n| 入口切换 | 消息与我的 AI 团队往返 | 选中态正确，草稿不串会话 |\n\n**优先级**：先核对访问边界，再检查入口状态。以上是验收标准，不表示检查已通过。",
  "用林晓身份进入供应链项目 → 打开已加入的整改群 → 转存报告到项目团队文件 → 切换何静，只查看共享文件 → 确认她仍不能读取整改群历史。\n再往返消息与我的 AI 团队，检查选中态、输入区和草稿。": "### 最小验收路径\n\n1. 以 **林晓** 身份进入供应链运营协同项目。\n2. 打开已加入的整改群，将报告转存到项目团队文件。\n3. 切换 **何静**，确认能查看共享报告。\n4. 尝试访问来源整改群，确认仍无法读取群历史。\n5. 往返“消息”和“我的 AI 团队”，核对选中态、输入区和草稿。\n\n> 文件的共享范围与来源群的访问权限必须分开。\n\n- [ ] 文件内容与来源一致\n- [ ] 群历史没有额外开放\n- [ ] 草稿保留在原会话中",
  "23:10 巡检：发现一项失败——从项目群聊返回消息后，仍保留上一入口的筛选条件。已整理复现步骤和影响范围，其余检查通过。": "### 23:10 巡检 · 1 项异常\n\n**问题**：从项目群聊返回消息后，仍保留上一入口的筛选条件。\n\n**复现路径**\n1. 进入项目群聊并设置筛选。\n2. 返回消息入口。\n3. 观察列表是否仍使用原筛选。\n\n**影响**：可能误以为会话丢失；不代表消息数据被删除。\n\n> 当前是演示巡检记录。保留失败证据，修复后需重新执行入口往返。",
  "只需看一项发布决定。检查结果与复现记录已经放在摘要中；建议确认当前目标版本后再发布。你确认之前，我会继续观察新增失败。": "### 早间待办：确认是否发布\n\n- **已整理**：检查结果、失败复现与修复后的复核记录。\n- **待你确认**：当前目标版本是否就是计划交付的版本。\n- **仍未执行**：正式发布。\n\n> 检查通过与发布授权是两件事。你确认之前，继续观察新增失败。"
};

window.__EVA_IM_RICH_FOLLOWUPS = [];
window.__EVA_IM_COMPACT_COPY = {"### 十分钟晨会提纲\n\n1. **质量 · 林晓（4 分钟）**：复测证据是否齐全？何时能给出放行建议？\n2. **合同 · 何静（3 分钟）**：哪些条款需要今天拍板？\n3. **采购 · 周远（3 分钟）**：采购需求是否存在交付缺口？\n\n会后统一记录：**结论 / 负责人 / 截止时间**。\n\n> 未确认的交期保持“待核实”，不要在纪要中写成承诺。": "**晨会只讨论三件事：**\n- 林晓：复测证据是否齐全？\n- 何静：哪些合同条款需要拍板？\n- 周远：采购是否有交付缺口？", "### A-2409 · 夜间跟进摘要\n\n| 检查项 | 当前状态 | 后续动作 |\n| --- | --- | --- |\n| 原因分析 | 已收齐 | 核对与异常批次的对应关系 |\n| 复测证据 | 三项指标符合要求 | 质量负责人现场复核 |\n| 恢复交期 | 待确认 | 获得现场确认后再更新 |\n\n**需要你决定：是否安排质量负责人现场复核？**\n\n> 建议通过复核后再决定放行。供应商预计时间不等于已确认交期。": "复测记录已补齐，但现场放行和恢复交期仍待确认。建议今天安排质量负责人复核；通过后再讨论放行。", "### 评审意见 → 可验收清单\n\n| 范围 | 触发条件 | 预期结果 |\n| --- | --- | --- |\n| 成员权限 | 未加入整改群的成员打开会话 | 不可读取群历史 |\n| 文件共享 | 报告转存到项目团队文件 | 可读共享文件，不获得来源群权限 |\n| 入口切换 | 消息与我的 AI 团队往返 | 选中态正确，草稿不串会话 |\n\n**优先级**：先核对访问边界，再检查入口状态。以上是验收标准，不表示检查已通过。": "这轮重点验收三项：未入群不能读历史、共享文件不扩大群权限、切换会话不串草稿。先查权限边界，再查交互。", "### 最小验收路径\n\n1. 以 **林晓** 身份进入供应链运营协同项目。\n2. 打开已加入的整改群，将报告转存到项目团队文件。\n3. 切换 **何静**，确认能查看共享报告。\n4. 尝试访问来源整改群，确认仍无法读取群历史。\n5. 往返“消息”和“我的 AI 团队”，核对选中态、输入区和草稿。\n\n> 文件的共享范围与来源群的访问权限必须分开。\n\n- [ ] 文件内容与来源一致\n- [ ] 群历史没有额外开放\n- [ ] 草稿保留在原会话中": "林晓转存整改报告 → 何静查看共享文件 → 确认何静仍不能读整改群历史。再往返消息与我的 AI 团队，检查草稿是否保留。", "### 23:10 巡检 · 1 项异常\n\n**问题**：从项目群聊返回消息后，仍保留上一入口的筛选条件。\n\n**复现路径**\n1. 进入项目群聊并设置筛选。\n2. 返回消息入口。\n3. 观察列表是否仍使用原筛选。\n\n**影响**：可能误以为会话丢失；不代表消息数据被删除。\n\n> 当前是演示巡检记录。保留失败证据，修复后需重新执行入口往返。": "发现一个问题：从项目群返回消息后，旧筛选条件仍然保留。复现步骤已记录，需要修复后重走这条路径。", "### 早间待办：确认是否发布\n\n- **已整理**：检查结果、失败复现与修复后的复核记录。\n- **待你确认**：当前目标版本是否就是计划交付的版本。\n- **仍未执行**：正式发布。\n\n> 检查通过与发布授权是两件事。你确认之前，继续观察新增失败。": "检查结果和复现记录已整理。你只需确认目标版本与是否发布；确认前我不会执行发布。"};

window.__EVA_PERSONA_SHORT_DEMO = {"team-persona-welcome": ["A-2409 现在能恢复供货了吗？", "还不能确认。复测记录已补齐，但现场放行和运输窗口仍待确认，建议先安排质量复核。", "帮我列一下接下来要做的事。", "**下一步：**\n- 林晓核对批次与复测记录。\n- 质量负责人确认放行条件。\n- 放行后再确定运输和交期。"], "team-pilot-night": ["今晚帮我看一下版本验收，先别发布。", "好，我会整理已授权的检查结果，发现问题保留复现记录，发布等你确认。", "明早我需要关注什么？", "**明早确认两件事：**\n- 失败项是否已修复并复核。\n- 目标版本是否可以发布。\n\n未确认前，我不会发布。"]};

window.__EVA_PERSONA_VARIETY_DEMO = {"team-persona-welcome": {"title": "供应商催交期，这句话怎么回", "texts": ["供应商催我确认恢复交期。我想回“应该没问题”，你觉得呢？", "这句话容易被理解成承诺。复测通过了，但现场放行和运输窗口还没确认。现在可以确认的是“正在复核”，还不是“何时恢复”。", "那替我拟一句，别写得像公文。", "可以这样回：\n\n> 复测材料我们已经收到，正在安排现场复核。放行和运输时间确认后，我第一时间给你明确交期。\n\n**有进展、有下一步，也不提前承诺。**"]}, "team-pilot-night": {"title": "明早演示，先帮我挑刺", "texts": ["明早给老板演示，你先帮我挑一个最容易翻车的地方。", "我会先盯入口往返：单个页面再漂亮，切回来丢了草稿，现场就很难解释。建议先走一遍“项目群 → 创建任务 → 回到原会话”。", "如果只有三分钟，你会怎么讲？", "**先讲一件事怎么做完，不从菜单开始。**\n\n**前 30 秒**：群里提出问题。\n**中间 2 分钟**：分身给判断，人确认并建任务。\n**最后 30 秒**：看结果，留一个问题让老板追问。\n\n最后停在任务结果上。配置细节留到老板追问时再展开。"]}};
