
      (async function () {
        var T0 = '2026-08-28T09:00:00Z';
        var T1 = '2026-09-02T17:30:00Z';
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
            created_at: T0, updated_at: T1, runtime_name: '组织共享 Runtime', owner_name: '王宜林',
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
          issue_count: 6, done_count: 1, created_at: T0, updated_at: T1, lead_name: '王宜林'
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
          agents: supplyAgents, squads: supplySquads, skills: supplySkills, autopilots: [],
          projects: supplyProjects, issues: supplyIssues, agentTasks: supplyAgentTasks
        };


        window.__EVA_IM_DEMO = {
          channels: [
            { id: 'im-eva-octo', name: 'EVA + OCTO 融合推进群', color: '#7567d8', unread: 0, members: 6, lastAt: '2026-09-04T18:20:00+08:00', threads: [], demoOnly: true },
            { id: 'im-delivery', name: '项目交付推进', color: '#66789e', unread: 0, members: 5, lastAt: '2026-09-04T17:30:00+08:00', threads: [], demoOnly: true },
            { id: 'im-review', name: '方案评审', color: '#5f8798', unread: 0, members: 4, lastAt: '2026-09-04T16:42:00+08:00', threads: [], demoOnly: true },
            { id: 'im-meeting', name: '会议跟进', color: '#9a8062', unread: 0, members: 5, lastAt: '2026-09-04T15:40:00+08:00', threads: [], demoOnly: true },
            { id: 'im-ai-focus', name: '整理今天的工作重点', color: '#7567d8', unread: 0, members: 2, lastAt: '2026-09-04T10:28:00+08:00', threads: [], demoOnly: true },
            { id: 'im-ai-drive', name: '云盘权限方案梳理', color: '#7567d8', unread: 0, members: 2, lastAt: '2026-09-04T10:18:00+08:00', threads: [], demoOnly: true },
            { id: 'im-ai-meeting', name: '会议纪要与待办', color: '#7567d8', unread: 0, members: 2, lastAt: '2026-09-03T18:20:00+08:00', threads: [], demoOnly: true },
            { id: 'im-pilot-trip', name: '明天的出差行程', color: '#4b91b8', unread: 0, members: 2, lastAt: '2026-09-02T17:15:00+08:00', threads: [], demoOnly: true },
            { id: 'im-pilot-client', name: '客户拜访准备', color: '#4b91b8', unread: 0, members: 2, lastAt: '2026-09-02T16:25:00+08:00', threads: [], demoOnly: true },
            { id: 'im-pilot-brief', name: '本周飞行简报', color: '#4b91b8', unread: 0, members: 2, lastAt: '2026-09-02T15:30:00+08:00', threads: [], demoOnly: true }
          ],
          messages: {
            'im-eva-octo': [
              { kind: 'divider', text: '9月4日' },
              { kind: 'text', sender: { uid: 'u-haozong', name: '昊总', color: '#6f75a8', online: true }, time: '17:42', text: 'EVA+OCTO融合性怎么样了？' },
              { kind: 'text', sender: { uid: 'u-kangzhixi', name: '康执玺', color: '#4c83a5', online: true }, time: '17:45', text: '@EVA+OCTO项目助手 汇报一下最新进展和情况。', mentions: [{ name: '@EVA+OCTO项目助手', uid: 'b-eva-octo' }] },
              { kind: 'text', sender: { uid: 'b-eva-octo', name: 'EVA+OCTO项目助手', color: '#7567d8', ai: true, online: true }, time: '17:47', text: '最新进展：消息、Loop 任务与团队文件的演示链路已贯通；统一 IM 会话框架正在收口。\n当前问题：任务触发后的身份与权限仍需联调。\n主要风险：月底上线窗口较紧，数字员工进入任务后的异常恢复与验收口径需要尽快确认。' },
              { kind: 'text', sender: { uid: 'u-haozong', name: '昊总', color: '#6f75a8', online: true }, time: '17:55', text: '需要在月底前上线，并打通数字员工，让数字员工进入任务协作。' },
              { kind: 'text', sender: { uid: 'u-kangzhixi', name: '康执玺', color: '#4c83a5', online: true }, time: '18:02', text: '@EVA+OCTO项目助手 创建前面这个任务，并指定 @威少 做负责人。', mentions: [{ name: '@EVA+OCTO项目助手', uid: 'b-eva-octo' }, { name: '@威少', uid: 'u-weishao' }] },
              { kind: 'text', sender: { uid: 'b-eva-octo', name: 'EVA+OCTO项目助手', color: '#7567d8', ai: true, online: true }, time: '18:03', text: '任务已创建，负责人已指定为威少。' },
              { kind: 'refcard', sender: { uid: 'b-eva-octo', name: 'EVA+OCTO项目助手', color: '#7567d8', ai: true, online: true }, time: '18:03', ref: { target: 'issue', title: '月底前完成 EVA + OCTO 融合上线并接入数字员工', spaceName: 'EVA + OCTO 融合推进群', desc: '负责人：威少 · 截止：本月底', allowed: true, issueId: 'issue22' } }
            ],
            'im-delivery': [
              { kind: 'divider', text: '9月4日' },
              { kind: 'text', sender: { uid: 'u-chenbo', name: '陈博', color: '#8c658f', online: true }, time: '16:58', text: '客户演示环境已经更新，请把今天的交付风险和负责人一起收口。' },
              { kind: 'text', sender: { uid: 'u-wangyilin', name: '王宜林', color: '#557a94', online: true }, time: '17:02', text: '@王宜林的 Eva 助理 请根据群内结论整理交付清单。', mentions: [{ name: '@王宜林的 Eva 助理', uid: 'b-wangyilin' }] },
              { kind: 'text', sender: { uid: 'b-wangyilin', name: '王宜林的 Eva 助理', color: '#7567d8', ai: true, online: true }, time: '17:05', text: '已整理为三项：演示环境确认、关键链路回归、现场异常兜底。每项都已补齐负责人和截止时间。' },
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
            ],
            'im-ai-focus': [
              { kind: 'divider', text: '9月4日' },
              { kind: 'text', sender: { uid: 'u-wangyilin', name: '王宜林', color: '#557a94', online: true }, time: '10:26', text: '帮我把今天要推进的事情排一下优先级。' },
              { kind: 'text', sender: { uid: 'b-wangyilin', name: '王宜林的 Eva 助理', color: '#7567d8', ai: true, online: true }, time: '10:28', text: '建议先处理三件事：\n1. 确认项目群聊的任务归属；\n2. 补齐通讯录中的 AI 身份；\n3. 下午评审前检查 Demo 的关键跳转。' },
              { kind: 'taskcard', sender: { uid: 'b-wangyilin', name: '王宜林的 Eva 助理', color: '#7567d8', ai: true, online: true }, time: '10:28', note: '已创建待办：Demo 评审前检查 · 今天 17:30' }
            ],
            'im-ai-drive': [
              { kind: 'divider', text: '9月4日' },
              { kind: 'text', sender: { uid: 'u-wangyilin', name: '王宜林', color: '#557a94', online: true }, time: '10:12', text: '把云盘权限方案压缩成一个能评审的版本。' },
              { kind: 'text', sender: { uid: 'b-wangyilin', name: '王宜林的 Eva 助理', color: '#7567d8', ai: true, online: true }, time: '10:18', text: '核心边界可以收敛为：个人文件默认私有，团队文件继承项目权限，跨项目分享必须显式授权。评审时重点确认继承关系和失效后的回收规则。' }
            ],
            'im-ai-meeting': [
              { kind: 'divider', text: '9月3日' },
              { kind: 'text', sender: { uid: 'u-wangyilin', name: '王宜林', color: '#557a94', online: true }, time: '18:12', text: '把刚才会议里的结论和待办分开。' },
              { kind: 'text', sender: { uid: 'b-wangyilin', name: '王宜林的 Eva 助理', color: '#7567d8', ai: true, online: true }, time: '18:20', text: '结论：新版导航继续使用当前方案；团队 IM 全部进入统一内核。\n待办：补齐我的 AI 多身份入口，并同步更新通讯录展示。' }
            ],
            'im-pilot-trip': [
              { kind: 'divider', text: '9月2日' },
              { kind: 'text', sender: { uid: 'u-wangyilin', name: '王宜林', color: '#557a94', online: true }, time: '17:08', text: '明天去杭州，把行程整理得紧凑一点。' },
              { kind: 'text', sender: { uid: 'b-pilot', name: '飞行员E号（王宜林的分身）', color: '#4b91b8', ai: true, online: true }, time: '17:15', text: '建议 08:30 出发，上午留给客户沟通，午后安排现场确认，返程前预留 40 分钟整理结论。关键材料已按出发、会议、返程三个阶段归类。' }
            ],
            'im-pilot-client': [
              { kind: 'divider', text: '9月2日' },
              { kind: 'text', sender: { uid: 'u-wangyilin', name: '王宜林', color: '#557a94', online: true }, time: '16:18', text: '客户拜访前我还需要准备什么？' },
              { kind: 'text', sender: { uid: 'b-pilot', name: '飞行员E号（王宜林的分身）', color: '#4b91b8', ai: true, online: true }, time: '16:25', text: '还需要确认参会人、目标问题、可现场演示的版本，以及会后负责人。建议把演示链路提前离线走一遍，并准备一页异常兜底说明。' }
            ],
            'im-pilot-brief': [
              { kind: 'divider', text: '9月2日' },
              { kind: 'text', sender: { uid: 'u-wangyilin', name: '王宜林', color: '#557a94', online: true }, time: '15:24', text: '给我一份本周推进简报。' },
              { kind: 'text', sender: { uid: 'b-pilot', name: '飞行员E号（王宜林的分身）', color: '#4b91b8', ai: true, online: true }, time: '15:30', text: '本周已完成导航结构统一和个人会话三栏改造；正在收口团队 IM 内核。下一步是核对通讯录身份展示和关键入口切换一致性。' }
            ]
          }
        };

        var sourceResponse = await fetch('vendor/eva-legacy-runtime.js');
    if (!sourceResponse.ok) throw new Error('EVA 临时兼容运行时加载失败：HTTP ' + sourceResponse.status);
    var source = await sourceResponse.text();

        var evaMessageSourceNeedle = 'function messageSource(){const rt=loadSpaces(),ct={},ut=rt.map(mt=>({id:"space:"+mt.id,name:mt.name})),pt=rt.flatMap(mt=>channelsOfSpace(mt.id).map(gt=>(ct[gt.id]=mt.name,{...gt,category:"space:"+mt.id})));DMS.forEach(mt=>{ct[mt.id]="私聊消息"});return{channels:[...pt,...DMS.map(mt=>({...mt,category:"scope:dm"}))],cats:[...ut,{id:"scope:dm",name:"私聊消息"}],messages:{...CHANNEL_MESSAGES,...OWN_MESSAGES},threadMessages:{...THREAD_MESSAGES,...OWN_THREAD_MESSAGES},scopeNameOf:ct}}';
        var evaMessageSourceReplacement = 'function messageSource(evaMessageMode){const rt=loadSpaces(),ct={},ut=rt.map(mt=>({id:"space:"+mt.id,name:mt.name})),pt=rt.flatMap(mt=>channelsOfSpace(mt.id).map(gt=>(ct[gt.id]=mt.name,{...gt,category:"space:"+mt.id}))),evaDemo=window.__EVA_IM_DEMO??{channels:[],messages:{}};DMS.forEach(mt=>{ct[mt.id]="私聊消息"});if(evaMessageMode==="my-ai"){const evaAiChannels=evaDemo.channels.filter(mt=>mt.id.startsWith("im-ai-")||mt.id.startsWith("im-pilot-")).map(mt=>({...mt,category:mt.id.startsWith("im-pilot-")?"scope:assistant-pilot":"scope:assistant-main"}));evaAiChannels.forEach(mt=>{ct[mt.id]=mt.category==="scope:assistant-pilot"?"飞行员E号（王宜林的分身）":"王宜林的 Eva 助理"});return{channels:evaAiChannels,cats:[{id:"scope:assistant-main",name:"王宜林的 Eva 助理"},{id:"scope:assistant-pilot",name:"飞行员E号（王宜林的分身）"}],messages:{...evaDemo.messages},threadMessages:{},scopeNameOf:ct}}evaDemo.channels.forEach(mt=>{ct[mt.id]="精选会话"});return{channels:[...pt,...DMS.map(mt=>({...mt,category:"scope:dm"})),...evaDemo.channels.map(mt=>({...mt,category:"scope:demo"}))],cats:[...ut,{id:"scope:dm",name:"私聊消息"}],messages:{...CHANNEL_MESSAGES,...OWN_MESSAGES,...evaDemo.messages},threadMessages:{...THREAD_MESSAGES,...OWN_THREAD_MESSAGES},scopeNameOf:ct}}';
        if (!source.includes(evaMessageSourceNeedle)) throw new Error('Eva IM source anchor missing: messageSource');
        source = source.replace(evaMessageSourceNeedle, evaMessageSourceReplacement);
        var evaMessagesPageNeedle = 'MessagesPage=()=>{const rt=reactExports.useMemo(()=>messageSource(),[]);return React.createElement("div",{className:"eva-msg eva-channel-surface","data-eva-channel-surface":"global"},React.createElement(ChannelsView,{source:rt,onOpenTask:()=>{}}))}';
        var evaMessagesPageReplacement = 'MessagesPage=()=>{const{search:evaMessageSearch}=useLocation(),evaMessageMode=new URLSearchParams(evaMessageSearch).get("evaIM")==="my-ai"?"my-ai":"all",rt=reactExports.useMemo(()=>messageSource(evaMessageMode),[evaMessageMode]);return React.createElement("div",{className:"eva-msg eva-channel-surface","data-eva-channel-surface":"global","data-eva-message-mode":evaMessageMode},React.createElement(ChannelsView,{key:evaMessageMode,source:rt,onOpenTask:()=>{}}))}';
        if (!source.includes(evaMessagesPageNeedle)) throw new Error('Eva IM source anchor missing: MessagesPage');
        source = source.replace(evaMessagesPageNeedle, evaMessagesPageReplacement);
        source = source.replace(
          'Za=(ci,Zi)=>{xt(ci),Nt(Zi),Dt("none"),Da(null)},za=ci=>',
          'Za=(ci,Zi)=>{xt(ci),Nt(Zi),Dt("none"),Da(null)},evaOpenEffect=reactExports.useEffect(()=>{const evaOpen=evaEvent=>{const evaId=evaEvent.detail?.conversationId;if(!evaId||!pt.some(evaChannel=>evaChannel.id===evaId))return;La(evaId),requestAnimationFrame(()=>da.current?.scrollTo({top:0}))};window.addEventListener("eva-im:open",evaOpen);return()=>window.removeEventListener("eva-im:open",evaOpen)},[pt]),za=ci=>'
        );


        var projectDirectoryComponentSource = String.raw`EvaPinIcon=createLucideIcon("pin",[["path",{d:"M12 17v5",key:"eva-pin-stem"}],["path",{d:"M5 17h14",key:"eva-pin-base"}],["path",{d:"M15 3.3a1 1 0 0 1 .7 1.7L13 7.7V12l1.8 1.8a1 1 0 0 1-.7 1.7H9.9a1 1 0 0 1-.7-1.7L11 12V7.7L8.3 5A1 1 0 0 1 9 3.3z",key:"eva-pin-body"}]]),EvaPinOffIcon=createLucideIcon("pin-off",[["path",{d:"M12 17v5",key:"eva-pin-off-stem"}],["path",{d:"M7 17h10",key:"eva-pin-off-base"}],["path",{d:"M5 5l14 14",key:"eva-pin-off-slash"}],["path",{d:"M15 3.3a1 1 0 0 1 .7 1.7L14 6.7",key:"eva-pin-off-top"}],["path",{d:"M10.3 10.3 11 9.6V7.7L8.3 5A1 1 0 0 1 9 3.3h1",key:"eva-pin-off-body"}]]),EvaProjectList=Object.assign(({dataSource:evaDataSource=[],renderItem:evaRenderItem,emptyContent:evaEmptyContent,className:evaClassName=""})=>React.createElement("div",{className:evaClassName,role:"list"},evaDataSource.length?evaDataSource.map(evaRenderItem):evaEmptyContent),{Item:({header:evaHeader,main:evaMain,extra:evaExtra,className:evaClassName="",...evaProps})=>React.createElement("div",{...evaProps,className:evaClassName},evaHeader,evaMain,evaExtra)}),EvaProjectDirectory=({spaces:evaSpaces,onEnter:evaEnter,onCreate:evaCreate,onSeed:evaSeed})=>{
          const[evaCreateOpen,setEvaCreateOpen]=reactExports.useState(!1),[evaProjectName,setEvaProjectName]=reactExports.useState(""),[evaPinnedIds,setEvaPinnedIds]=reactExports.useState(()=>{try{const evaRaw=localStorage.getItem("eva:pinned-project-ids:v2");if(evaRaw===null)return["drive-design"];const evaSaved=JSON.parse(evaRaw||"[]");return Array.isArray(evaSaved)?evaSaved.slice(0,6):["drive-design"]}catch{return["drive-design"]}}),[evaOrganizationProjects,setEvaOrganizationProjects]=reactExports.useState([]);
          reactExports.useEffect(()=>{try{localStorage.setItem("eva:pinned-project-ids:v2",JSON.stringify(evaPinnedIds))}catch{}},[evaPinnedIds]);
          reactExports.useEffect(()=>{const evaSyncOrganizations=()=>setEvaOrganizationProjects([...(window.__EVA_CREATED_GROUPS||[])]);evaSyncOrganizations(),window.addEventListener("eva:created-projects-changed",evaSyncOrganizations);return()=>window.removeEventListener("eva:created-projects-changed",evaSyncOrganizations)},[]);
          const evaOrganizationData=evaOrganizationProjects.map(evaGroup=>({id:evaGroup.id,name:evaGroup.name,desc:"由群聊自动形成的项目",members:new Array(evaGroup.memberCount||0).fill(null),bots:0,lastActive:"刚刚创建",memberNames:evaGroup.memberNames,organization:!0,color:"#59636d",colorBg:"#f1f3f5"})),evaAllProjects=[...evaSpaces,...evaOrganizationData.filter(evaProject=>!evaSpaces.some(evaSpace=>evaSpace.id===evaProject.id))],evaPinnedProjects=evaPinnedIds.map(evaId=>evaAllProjects.find(evaProject=>evaProject.id===evaId)).filter(Boolean);
          reactExports.useEffect(()=>{setEvaPinnedIds(evaIds=>evaIds.filter(evaId=>evaAllProjects.some(evaProject=>evaProject.id===evaId)).slice(0,6))},[evaSpaces,evaOrganizationProjects]);
          const evaSubmitProject=()=>{evaProjectName.trim()&&(evaCreate(evaProjectName.trim()),setEvaCreateOpen(!1),setEvaProjectName(""))},evaTogglePinned=(evaProject,evaEvent)=>{evaEvent.preventDefault(),evaEvent.stopPropagation();const evaIsPinned=evaPinnedIds.includes(evaProject.id);if(!evaIsPinned&&evaPinnedIds.length>=6){Toast.warning("最多置顶 6 个项目");return}setEvaPinnedIds(evaIds=>evaIsPinned?evaIds.filter(evaId=>evaId!==evaProject.id):[...evaIds,evaProject.id])},evaOpenProject=evaProject=>{evaProject.organization||evaEnter(evaProject.id)},evaKeyboardOpen=(evaEvent,evaProject)=>{(evaEvent.key==="Enter"||evaEvent.key===" ")&&(evaEvent.preventDefault(),evaEvent.currentTarget.click())},evaProjectIcon=(evaProject,evaSize)=>React.createElement("span",{className:"eva-project-directory-icon",style:{backgroundColor:evaProject.colorBg??projectTint(evaProject.color),color:evaProject.color}},React.createElement(AllApplication,{theme:"outline",size:String(evaSize),fill:"currentColor"})),evaPinButton=evaProject=>{const evaIsPinned=evaPinnedIds.includes(evaProject.id);return React.createElement(Button,{theme:"borderless",type:"tertiary",size:"small",className:"eva-project-pin-button"+(evaIsPinned?" is-pinned":""),icon:React.createElement(EvaPinIcon,{size:16,strokeWidth:1.8,fill:"none"}),"aria-label":(evaIsPinned?"取消置顶 ":"置顶 ")+evaProject.name,title:evaIsPinned?"取消置顶":"置顶",onClick:evaEvent=>evaTogglePinned(evaProject,evaEvent)})},evaCreateModal=React.createElement(Modal,{title:"新建项目",visible:evaCreateOpen,onCancel:()=>setEvaCreateOpen(!1),onOk:evaSubmitProject,okText:"创建项目",cancelText:"取消",okButtonProps:{className:"collab-btn-primary"}},React.createElement("div",{className:"collab-create-form"},React.createElement("p",{className:"eva-space-definition"},"为一组需要共享成员、助理与工作资产的人建立独立协作环境。"),React.createElement("div",{className:"field"},React.createElement("label",null,"项目名称"),React.createElement(ForwardInput,{placeholder:"例如：AI 产品共创",value:evaProjectName,onChange:setEvaProjectName,autoFocus:!0,onEnterPress:evaSubmitProject})),React.createElement("div",{className:"field"},React.createElement("label",null,"协作目标"),React.createElement(ForwardInput,{placeholder:"例如：让产品、研发和业务共同推进 AI 能力"}))));
          return React.createElement("div",{className:"collab-list-page eva-project-directory"},React.createElement("div",{className:"collab-hero eva-project-directory-hero"},React.createElement("div",{className:"left"},React.createElement("h1",null,"项目"),React.createElement("p",{className:"slogan"},"把需要共同使用成员、助理、文件和任务的工作放在一起。"),React.createElement(Button,{className:"collab-btn-primary",onClick:()=>setEvaCreateOpen(!0)},"＋ 新建项目")),React.createElement("img",{className:"illustration",src:spaceIllustration,alt:"",onDoubleClick:evaSeed})),React.createElement("section",{className:"eva-project-pinned-section","aria-labelledby":"eva-project-pinned-title"},React.createElement("div",{className:"eva-project-directory-heading"},React.createElement("div",{className:"eva-project-directory-heading__title"},React.createElement("h2",{id:"eva-project-pinned-title"},"置顶项目"),React.createElement("span",null,evaPinnedProjects.length," / 6"))),evaPinnedProjects.length?React.createElement("div",{className:"eva-project-pinned-grid"},evaPinnedProjects.map(evaProject=>React.createElement(Card,{key:evaProject.id,className:"eva-project-pinned-card"+(evaProject.organization?" eva-organization-project-card":""),bordered:!0,headerLine:!1,shadows:"hover",role:"button",tabIndex:0,onClick:()=>evaOpenProject(evaProject),onKeyDown:evaEvent=>evaKeyboardOpen(evaEvent,evaProject),title:React.createElement("div",{className:"eva-project-card-title"},evaProjectIcon(evaProject,18),React.createElement("div",{className:"name"},React.createElement("span",null,evaProject.name),evaProject.official&&React.createElement("span",{className:"eva-official-badge"},"官方"))),headerExtraContent:evaPinButton(evaProject)},React.createElement("p",{className:"eva-project-card-description"},evaProject.desc||"暂无项目简介")))):React.createElement("div",{className:"eva-project-pinned-empty"},"从下方项目列表中置顶常用项目")),React.createElement("section",{className:"eva-project-all-section","aria-labelledby":"eva-project-all-title"},React.createElement("div",{className:"eva-project-directory-heading eva-project-directory-heading--all"},React.createElement("div",{className:"eva-project-directory-heading__title"},React.createElement("h2",{id:"eva-project-all-title"},"全部项目"),React.createElement("span",null,evaAllProjects.length," 个"))),React.createElement(EvaProjectList,{className:"eva-project-directory-list",dataSource:evaAllProjects,emptyContent:React.createElement("div",{className:"eva-project-list-empty"},"暂无项目"),renderItem:evaProject=>React.createElement(EvaProjectList.Item,{key:evaProject.id,className:"eva-project-list-item"+(evaProject.organization?" eva-organization-project-card":""),role:"button",tabIndex:0,onClick:()=>evaOpenProject(evaProject),onKeyDown:evaEvent=>evaKeyboardOpen(evaEvent,evaProject),header:evaProjectIcon(evaProject,18),main:React.createElement("div",{className:"eva-project-list-main"},React.createElement("div",{className:"eva-project-list-title name"},React.createElement("span",null,evaProject.name),evaProject.official&&React.createElement("span",{className:"eva-official-badge"},"官方")),React.createElement("div",{className:"eva-project-list-description"},evaProject.desc||"暂无项目简介")),extra:evaPinButton(evaProject)})})),evaCreateModal)
        }`;
        projectDirectoryComponentSource = projectDirectoryComponentSource
          .replaceAll('AI 产品共创', '供应链运营协同')
          .replaceAll('让产品、研发和业务共同推进 AI 能力', '协同推进采购、质量与合规工作');
        var replacements = [
          [
            'function titleForPath(rt,ct){return rt.startsWith("/login")?ct("login.pageTitle"):"Eva 同学"}',
            'function titleForPath(rt,ct){return rt.startsWith("/login")?ct("login.pageTitle"):"Eva · 2026-09-04 · v1"}'
          ],
          [
            'BY_SPACE={agents:{[SPACE_DATA_KEY]:AGENTS},squads:{[SPACE_DATA_KEY]:SQUADS},skills:{[SPACE_DATA_KEY]:SKILLS},autopilots:{[SPACE_DATA_KEY]:AUTOPILOTS},projects:{[SPACE_DATA_KEY]:PROJECTS},members:{[SPACE_DATA_KEY]:MEMBERS}}',
            'BY_SPACE={agents:{prod:window.__EVA_SUPPLY_CHAIN_DEMO.agents,"drive-design":window.__EVA_DRIVE_DEMO.agents},squads:{prod:window.__EVA_SUPPLY_CHAIN_DEMO.squads,"drive-design":window.__EVA_DRIVE_DEMO.squads},skills:{prod:window.__EVA_SUPPLY_CHAIN_DEMO.skills,"drive-design":window.__EVA_DRIVE_DEMO.skills},autopilots:{prod:window.__EVA_SUPPLY_CHAIN_DEMO.autopilots,"drive-design":window.__EVA_DRIVE_DEMO.autopilots},projects:{prod:window.__EVA_SUPPLY_CHAIN_DEMO.projects,"drive-design":window.__EVA_DRIVE_DEMO.projects},members:{prod:MEMBERS,"drive-design":MEMBERS}}'
          ],
          [
            'ISSUES_BY_SPACE={[SPACE_DATA_KEY]:MOCK_ISSUES}',
            'ISSUES_BY_SPACE={prod:window.__EVA_SUPPLY_CHAIN_DEMO.issues,"drive-design":window.__EVA_DRIVE_DEMO.issues},evaUpsertContextTask=window.__evaUpsertContextTask=(rt,ct)=>{const ut=ISSUES_BY_SPACE[rt]??(ISSUES_BY_SPACE[rt]=[]),pt=ut.findIndex(mt=>mt.identifier===ct.identifier);pt>=0?ut[pt]={...ut[pt],...ct}:ut.push(ct)}'
          ],
          [
            'CANDIDATES=[...AGENTS.map(rt=>({id:rt.id,type:"agent",name:rt.name})),...SQUADS.map(rt=>({id:rt.id,type:"squad",name:rt.name})),...MEMBERS.map(rt=>({id:rt.user_id,type:"member",name:rt.name??rt.user_id,octo_uid:rt.octo_uid}))]',
            'CANDIDATES=[...window.__EVA_SUPPLY_CHAIN_DEMO.agents.map(rt=>({id:rt.id,type:"agent",name:rt.name})),...window.__EVA_SUPPLY_CHAIN_DEMO.squads.map(rt=>({id:rt.id,type:"squad",name:rt.name})),...window.__EVA_DRIVE_DEMO.agents.map(rt=>({id:rt.id,type:"agent",name:rt.name})),...window.__EVA_DRIVE_DEMO.squads.map(rt=>({id:rt.id,type:"squad",name:rt.name})),...MEMBERS.map(rt=>({id:rt.user_id,type:"member",name:rt.name??rt.user_id,octo_uid:rt.octo_uid}))]'
          ],
          [
            'case"settings":return React.createElement(SettingsPage,{workspace:WORKSPACE})',
            'case"settings":return React.createElement(SettingsPage,{workspace:{...WORKSPACE,id:rt.id,name:rt.name,slug:rt.id}})'
          ],
          [
            'listAgentTasks=rt=>{if(rt&&rt!=="ag-feedback")return Promise.resolve([]);',
            'listAgentTasks=rt=>{if(window.__EVA_SUPPLY_CHAIN_DEMO.agentTasks[rt])return Promise.resolve(window.__EVA_SUPPLY_CHAIN_DEMO.agentTasks[rt]);if(window.__EVA_DRIVE_DEMO.agentTasks[rt])return Promise.resolve(window.__EVA_DRIVE_DEMO.agentTasks[rt]);if(rt&&rt!=="ag-feedback")return Promise.resolve([]);'
          ],
          [
            'agentStatusMap=()=>Promise.resolve(Object.fromEntries(AGENTS.map(rt=>[rt.id,rt.status])))',
            'agentStatusMap=()=>Promise.resolve(Object.fromEntries(agentsOf().map(rt=>[rt.id,rt.status])))'
          ],
          [
            'TABS=[{key:"channels",label:"群聊"},{key:"tasks",label:"任务"},{key:"experts",label:"专家"},{key:"squads",label:"专家团"},{key:"skills",label:"技能"},{key:"automation",label:"自动化"},{key:"settings",label:"设置"}]',
            'TABS=[{key:"tasks",label:"任务"},{key:"channels",label:"群聊"},{key:"files",label:"团队文件"},{key:"automation",label:"自动化"},{key:"settings",label:"项目设置"}]'
          ],
          [
            'SpaceFrame=({space:rt,spaces:ct,onSwitch:ut})=>{const[pt,mt]=reactExports.useState("channels")',
            'SpaceFrame=({space:rt,spaces:ct,onSwitch:ut})=>{const[pt,mt]=reactExports.useState("tasks")'
          ],
          [
            'TABS.map(Ft=>React.createElement("button"',
            '(rt.id==="prod"?TABS:TABS.filter(Ft=>Ft.key!=="experts"&&Ft.key!=="squads"&&Ft.key!=="skills")).map(Ft=>React.createElement("button"'
          ],
          [
            'React.createElement(Avatar,{name:rt.short,color:rt.color,size:20,square:!0}),React.createElement("span",{className:"nm",title:rt.name},rt.name)',
            'React.createElement("span",{className:"nm",title:rt.name},rt.name)'
          ],
          [
            'React.createElement(Avatar,{name:Ft.short,color:Ft.color,size:20,square:!0})," ",Ft.name',
            'Ft.name'
          ],
          [
            'Mt=React.createElement("span",{className:"collab-sp-chip",role:"button",tabIndex:0,"aria-haspopup":"menu","aria-expanded":St,onClick:()=>Ct(Ft=>!Ft),onKeyDown:Ft=>{Ft.key==="Enter"&&Ct(Qt=>!Qt)}},React.createElement("span",{className:"nm",title:rt.name},rt.name),React.createElement("span",{className:"caret"},"▾"),St&&React.createElement("div",{className:"sp-menu",onClick:Ft=>Ft.stopPropagation()},ct.map(Ft=>React.createElement("div",{key:Ft.id,className:"mi",onClick:()=>{Ct(!1),WKApp$1.routeRight.popAll(),ut(Ft.id)}},Ft.name)),React.createElement("div",{className:"divider"}),React.createElement("div",{className:"mi",onClick:()=>{Ct(!1),WKApp$1.routeRight.popAll(),ut(null)}},"⌂ 全部项目")))',
            'Mt=React.createElement(Dropdown,{trigger:"click",position:"bottomLeft",spacing:4,clickToHide:!0,render:React.createElement(Dropdown.Menu,{className:"eva-project-switcher-menu"},ct.map(Ft=>React.createElement(Dropdown.Item,{key:Ft.id,"data-eva-project-id":Ft.id,onClick:()=>{WKApp$1.routeRight.popAll(),ut(Ft.id)}},Ft.name)))},React.createElement("span",{className:"eva-project-switcher-anchor"},React.createElement(Button,{size:"small",theme:"borderless",type:"tertiary",className:"collab-sp-chip eva-project-switcher"},React.createElement(AllApplication,{theme:"outline",size:"16",fill:"currentColor",className:"eva-project-switcher__icon","aria-hidden":!0}),React.createElement("span",{className:"nm",title:rt.name},rt.name),React.createElement(ChevronDown,{size:13,className:"eva-project-switcher__chevron","aria-hidden":!0}))))'
          ],
          [
            '),Ft)},SpaceFrame=',
            '),Ft)},' + projectDirectoryComponentSource + ',SpaceFrame='
          ],
          [
            ':React.createElement(SpaceList,{spaces:rt,onEnter:',
            ':React.createElement(EvaProjectDirectory,{spaces:rt,onEnter:'
          ],
          [
            'function CollabPage(){const[rt,ct]=reactExports.useState(()=>loadSpaces()),[ut,pt]=reactExports.useState(null),mt=rt.find(gt=>gt.id===ut)??null;return',
            'function CollabPage(){const[rt,ct]=reactExports.useState(()=>loadSpaces()),[ut,pt]=reactExports.useState(null),mt=rt.find(gt=>gt.id===ut)??null;reactExports.useEffect(()=>{const gt=()=>{WKApp$1.routeRight.popAll(),pt(null)};return window.addEventListener("eva:open-project-directory",gt),()=>window.removeEventListener("eva:open-project-directory",gt)},[]);return'
          ],
          [
            'if(Array.isArray(ct)&&ct.length){const ut=new Set(ct.map(pt=>pt.id));return[...ct,...DEFAULTS.filter(pt=>!ut.has(pt.id))]}',
            'if(Array.isArray(ct)&&ct.length){const ut=ct.map(pt=>{const mt=DEFAULTS.find(gt=>gt.id===pt.id),St=mt?{...pt,color:mt.color,colorBg:mt.colorBg}:pt;return St.id==="drive-design"?{...St,name:"团队文件功能设计",short:"团",desc:(St.desc||"").replaceAll("云盘","团队文件")}:St}),mt=new Set(ut.map(pt=>pt.id));return[...ut,...DEFAULTS.filter(pt=>!mt.has(pt.id))]}'
          ],
          [
            'case"experts":return React.createElement(AgentPage,null);case"squads":return React.createElement(SquadPage,null);',
            'case"experts":return React.createElement(EvaExpertCenterPage,null);case"squads":return React.createElement(EvaExpertCenterPage,{initialTab:"squads"});'
          ],
          [
            'listAssigneeCandidates$1().then(ha=>{ur(ha.filter(Oa=>Oa.type!=="squad"));const ga=ha.find(Oa=>Oa.type==="agent");',
            'listAssigneeCandidates$1().then(ha=>{ur(ha.filter(Oa=>Oa.type==="agent"));const ga=ha.find(Oa=>Oa.type==="agent");'
          ],
          [
            'reactExports.useEffect(()=>{listAssigneeCandidates$1().then(pa=>sn(pa.filter(ha=>ha.type!=="squad"))).catch(()=>sn([]))},[])',
            'reactExports.useEffect(()=>{listAssigneeCandidates$1().then(pa=>sn(pa.filter(ha=>ha.type==="agent"))).catch(()=>sn([]))},[])'
          ],
          [
            'React.createElement(TabPane,{tab:ut("loop.settings.general"),itemKey:"general"},React.createElement(GeneralTab,{workspace:rt,onUpdated:ct})),React.createElement(TabPane,{tab:ut("loop.settings.members"),itemKey:"members"},React.createElement(MembersTab,{workspaceId:rt.id})),React.createElement(TabPane,{tab:ut("loop.settings.webhooks"),itemKey:"webhooks"},React.createElement(WebhooksTab,null))',
            'React.createElement(TabPane,{tab:"通用",itemKey:"general"},React.createElement(GeneralTab,{workspace:rt,onUpdated:ct})),React.createElement(TabPane,{tab:"成员管理",itemKey:"members"},React.createElement(MembersTab,{workspaceId:rt.id})),React.createElement(TabPane,{tab:"专家",itemKey:"experts"},React.createElement(AgentPage,null)),React.createElement(TabPane,{tab:"专家团",itemKey:"squads"},React.createElement(SquadPage,null)),React.createElement(TabPane,{tab:"技能",itemKey:"skills"},React.createElement(SkillPage,null))'
          ],
          [
            'React.createElement("div",{className:"loop-page__toolbar"},!mt&&React.createElement("div",{className:"loop-agent-scope"',
            'React.createElement("div",{className:"loop-page__toolbar"},ut==="collab-tasks"?React.createElement("div",{className:"loop-seg eva-task-view-switcher",role:"tablist","aria-label":pt("loop.action.show")},["board","grouped","list"].map($a=>React.createElement("button",{key:$a,type:"button",role:"tab","aria-selected":Kt===$a,className:`loop-seg__btn${Kt===$a?" is-active":""}`,onClick:()=>Da($a)},$a==="board"?React.createElement(Workbench,{theme:"outline",size:"14",fill:"currentColor"}):$a==="grouped"?React.createElement(Users,{size:14}):React.createElement(List$1,{size:14}),pt(`loop.view.${$a}`)))):!mt&&React.createElement("div",{className:"loop-agent-scope"'
          ],
          [
            'React.createElement("div",{className:"loop-page__spacer"}),React.createElement(Dropdown,{trigger:"click",visible:pr,onVisibleChange:mr,position:"bottomRight",render:Ta}',
            'ut!=="collab-tasks"&&React.createElement("div",{className:"loop-page__spacer"}),React.createElement(Dropdown,{trigger:"click",visible:pr,onVisibleChange:mr,position:"bottomRight",render:Ta}'
          ],
          [
            '!mt&&React.createElement(Dropdown,{trigger:"click",visible:dr,onVisibleChange:ur,position:"bottomRight",render:Na}',
            'ut!=="collab-tasks"&&!mt&&React.createElement(Dropdown,{trigger:"click",visible:dr,onVisibleChange:ur,position:"bottomRight",render:Na}'
          ],
          [
            'pt("loop.action.show"))),React.createElement(LoopButton,{icon:React.createElement(Plus$c,{size:14}),onClick:Ra}',
            'pt("loop.action.show"))),ut==="collab-tasks"&&React.createElement("div",{className:"loop-page__spacer"}),React.createElement(LoopButton,{icon:React.createElement(Plus$c,{size:14}),onClick:Ra}'
          ],
          [
            'React.createElement(SiderEvaStub,{label:"工作板",',
            'gt==="/collab"?null:React.createElement(SiderEvaStub,{label:"工作板",'
          ],
          [
            'React.createElement(SiderScheduledEntry,{isMobile:pt,isActive:gt==="/scheduled",',
            'gt==="/collab"?null:React.createElement(SiderScheduledEntry,{isMobile:pt,isActive:gt==="/scheduled",'
          ]
        ];

        replacements.forEach(function (replacement) {
          if (source.indexOf(replacement[0]) < 0) {
            throw new Error('EVA 云盘演示数据注入点不存在');
          }
          source = source.replace(replacement[0], replacement[1]);
        });

        /* Keep desktop sidebar sizing in the native layout state instead of a visual overlay. */
        var sidebarWidthReplacements = [
          [
            'DEFAULT_SIDER_WIDTH=260,DESKTOP_COLLAPSED_WIDTH=0,SIDER_MIN_WIDTH=200',
            'DEFAULT_SIDER_WIDTH=248,DESKTOP_COLLAPSED_WIDTH=84,SIDER_MIN_WIDTH=200'
          ],
          [
            'Layout$1=({sider:rt,onSessionClick:ct})=>{const[ut,pt]=reactExports.useState(!1),[mt,gt]=reactExports.useState(!1),',
            'Layout$1=({sider:rt,onSessionClick:ct})=>{const[ut,pt]=reactExports.useState(!1),[evaSiderHidden,setEvaSiderHidden]=reactExports.useState(!1),[mt,gt]=reactExports.useState(!1),'
          ],
          [
            'storageKey:"sider-width-px"',
            'storageKey:"eva-unified-sider-width-px"'
          ],
          [
            'style:{"--eva-sider-w":`${ut?0:Ir}px`}',
            'style:{"--eva-sider-w":`${evaSiderHidden?0:ut?mt?0:DESKTOP_COLLAPSED_WIDTH:Ir}px`}'
          ],
          [
            'React.createElement(LayoutComponent.Sider,{collapsedWidth:0,collapsed:ut,width:Ir,',
            'React.createElement(LayoutComponent.Sider,{collapsedWidth:mt?0:DESKTOP_COLLAPSED_WIDTH,collapsed:ut,width:Ir,'
          ],
          [
            'value:{isMobile:mt,siderCollapsed:ut,setSiderCollapsed:pt}',
            'value:{isMobile:mt,siderCollapsed:ut,setSiderCollapsed:pt,siderHidden:evaSiderHidden,setSiderHidden:setEvaSiderHidden}'
          ],
          [
            'ir=!!Pt?.setSiderCollapsed&&!(Pt?.isMobile&&sn)',
            'ir=!!(Pt?.isMobile?Pt?.setSiderCollapsed:Pt?.setSiderHidden)&&!(Pt?.isMobile&&sn)'
          ],
          [
            'pr=Pt?.siderCollapsed?ct("common.expandMore",{defaultValue:"Expand sidebar"}):ct("common.collapse",{defaultValue:"Collapse sidebar"})',
            'pr=(Pt?.isMobile?Pt?.siderCollapsed:Pt?.siderHidden)?ct("common.expandMore",{defaultValue:"Expand sidebar"}):ct("common.collapse",{defaultValue:"Collapse sidebar"})'
          ],
          [
            'ur=()=>{!ir||!Pt?.setSiderCollapsed||Pt.setSiderCollapsed(!Pt.siderCollapsed)}',
            'ur=()=>{if(!ir)return;Pt?.isMobile?Pt?.setSiderCollapsed?.(!Pt.siderCollapsed):Pt?.setSiderHidden?.(!Pt.siderHidden)}'
          ],
          [
            '}:{position:"relative",overflow:"visible"};return React.createElement(LayoutContext.Provider',
            '}:{position:"relative",overflow:"visible",marginLeft:evaSiderHidden?-(ut?DESKTOP_COLLAPSED_WIDTH:Ir):0,transition:"margin-left 180ms ease",willChange:"margin-left",pointerEvents:evaSiderHidden?"none":"auto"};return React.createElement(LayoutContext.Provider'
          ],
          [
            'className:classNames("!bg-2 layout-sider",{collapsed:ut})',
            'className:classNames("!bg-2 layout-sider",{collapsed:ut,"eva-sider-hidden":!mt&&evaSiderHidden})'
          ],
          [
            'if(isPrimaryApplicationShortcut(gt,{key:"b",targetGuard:"embedded-editor"})){gt.preventDefault(),ct();return}',
            ''
          ],
          [
            ',onDoubleClick:()=>{Ht(ct),Pt?.(!1)}',
            ''
          ],
          [
            ',["切换侧栏","⌘ B"]',
            ''
          ]
        ];
        sidebarWidthReplacements.forEach(function (replacement) {
          if (source.indexOf(replacement[0]) < 0) throw new Error('EVA 侧栏宽度注入点不存在');
          source = source.replace(replacement[0], replacement[1]);
        });

        /*
         * Sidebar architecture: React owns mode and first-level navigation.
         * Personal/team entries are separate configs; common entries are defined once.
         * Inapplicable entries are never mounted, so hidden DOM cannot leak across modes.
         */
        var siderComponentAnchor = 'Sider=({onSessionClick:rt,collapsed:ct=!1})=>{';
        var siderArchitecture = String.raw`
EvaContactsIcon=createLucideIcon("book-user",[["path",{d:"M15 13a3 3 0 1 0-6 0",key:"book-user-avatar"}],["path",{d:"M17 18a5 5 0 0 0-10 0",key:"book-user-profile"}],["path",{d:"M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20",key:"book-user-book"}]]),EvaDriveIcon=createLucideIcon("hard-drive",[["path",{d:"M10 16h.01",key:"1ra8yu"}],["path",{d:"M2.212 11.577a2 2 0 0 0-.212.896V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5.527a2 2 0 0 0-.212-.896L18.55 5.11A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",key:"1jiv2b"}],["path",{d:"M21.946 12.013H2.054",key:"12xlhc"}],["path",{d:"M6 16h.01",key:"1l4qyb"}]]),
EVA_PERSONAL_NAV=Object.freeze(["new-chat","workboard","automation"]),EVA_TEAM_NAV=Object.freeze(["messages","my-ai","projects","contacts","drive"]),EVA_COMMON_NAV=Object.freeze(["digital-employees","connection-center","sites"]),
evaSidebarMode=(rt,ct)=>{if(rt==="/collab"||rt==="/messages")return"collaboration";if(rt==="/guid"||rt==="/scheduled"||rt.indexOf("/eva-stub/%E5%B7%A5%E4%BD%9C%E6%9D%BF")===0)return"personal";const ut=new URLSearchParams(ct||"").get("evaMode");return ut==="collaboration"?"collaboration":"personal"},
evaSidebarSelectionFromRoute=(rt,ct)=>{if(rt==="/messages")return"messages";if(rt==="/collab")return"projects";if(rt==="/scheduled")return"automation";if(rt==="/guid"||rt.indexOf("/conversation/")===0)return"new-chat";if(rt.indexOf("/eva-stub/%E5%B7%A5%E4%BD%9C%E6%9D%BF")===0)return"workboard";if(rt.indexOf("/eva-stub/%E6%95%B0%E5%AD%97%E5%91%98%E5%B7%A5")===0)return"digital-employees";if(rt.indexOf("/eva-stub/%E6%8A%80%E8%83%BD")===0)return"connection-center";if(rt.indexOf("/eva-stub/%E7%AB%99%E7%82%B9")===0)return"sites";return""},
EvaCompactAssistantEntry=rt=>React.createElement(TooltipComponent,{...rt.siderTooltipProps,content:"Eva 同学",position:"right"},React.createElement("button",{type:"button",className:"eva-compact-assistant",onClick:rt.onNewChat},React.createElement("span",{className:"eva-compact-assistant__icon"},React.createElement("img",{src:window.__EVA_COLLEAGUE_PORTRAIT,alt:""})),React.createElement("span",{className:"eva-compact-assistant__label"},"Eva 同学"))),
EvaMyAiIcon=()=>{const rt=window.__EVA_MY_ASSISTANT_IDENTITY||{};return React.createElement("span",{className:"eva-identity-avatar eva-identity-avatar--nav",role:"img","aria-label":rt.name&&rt.ownerName?rt.name+"，"+rt.ownerName+"的 Eva 分身":"我的AI"},React.createElement("img",{className:"eva-identity-avatar__logo",src:rt.logo,alt:""}),React.createElement("img",{className:"eva-identity-avatar__owner",src:rt.ownerAvatar,alt:"",title:rt.ownerName?"由"+rt.ownerName+"创建":void 0}))},
EvaSidebarSection=({title:rt,items:ct,render:ut,collapsed:pt})=>React.createElement("section",{className:classNames("eva-nav-section",pt&&"is-collapsed"),"aria-label":rt},React.createElement("div",{className:"eva-nav-section__title"},rt),React.createElement("div",{className:"eva-nav-section__items"},ct.map(mt=>React.createElement("div",{className:"eva-nav-entry",key:mt,"data-eva-nav-id":mt},ut(mt))))),
EvaSidebarNavigation=rt=>{const ct={isMobile:rt.isMobile,collapsed:rt.isMobile&&rt.collapsed,siderTooltipProps:rt.siderTooltipProps},pt=gt=>{switch(gt){case"search":return React.createElement(SiderSearchEntry,{key:gt,...ct,onConversationSelect:rt.onConversationSelect,onSessionClick:rt.onSessionClick});case"new-chat":return rt.collapsed&&!rt.isMobile?React.createElement(EvaCompactAssistantEntry,{key:gt,siderTooltipProps:rt.siderTooltipProps,onNewChat:rt.onNewChat}):React.createElement(SiderToolbar,{key:gt,...ct,isBatchMode:rt.isBatchMode,onNewChat:rt.onNewChat,onToggleBatchMode:rt.onToggleBatchMode});case"workboard":return React.createElement(SiderEvaStub,{key:gt,label:"工作板",icon:React.createElement(Workbench,{theme:"outline",size:"16",fill:"currentColor",className:"block leading-none",style:{lineHeight:0}}),...ct,isActive:rt.activeNavId===gt,onClick:()=>rt.navigate("/eva-stub/工作板")});case"automation":return React.createElement(SiderEvaStub,{key:gt,label:"自动化任务",icon:React.createElement(AlarmClock$4,{theme:"outline",size:"16",fill:"currentColor",className:"block leading-none",style:{lineHeight:0}}),...ct,isActive:rt.activeNavId===gt,onClick:()=>rt.navigate("/scheduled")});case"messages":return React.createElement(SiderMessagesEntry,{key:gt,...ct,isActive:rt.activeNavId===gt,onClick:()=>rt.navigate("/messages")});case"my-ai":return React.createElement("div",{key:gt,id:"eva-my-avatar-nav","data-eva-my-avatar-nav":"true"},React.createElement(SiderEvaStub,{label:"我的AI",icon:React.createElement(EvaMyAiIcon,null),...ct,isActive:rt.activeNavId===gt,onClick:()=>{}}));case"projects":return React.createElement(SiderCollabEntry,{key:gt,...ct,isActive:rt.activeNavId===gt,onClick:()=>{window.dispatchEvent(new CustomEvent("eva:open-project-directory")),rt.navigate("/collab")}});case"contacts":return React.createElement("div",{key:gt,id:"eva-contacts-nav","data-eva-contacts-nav":"true"},React.createElement(SiderEvaStub,{label:"通讯录",icon:React.createElement(EvaContactsIcon,{size:16,strokeWidth:1.8,className:"block leading-none",style:{lineHeight:0}}),...ct,isActive:rt.activeNavId===gt,onClick:()=>{}}));case"drive":return React.createElement("div",{key:gt,id:"eva-drive-nav","data-eva-action":"drive","data-eva-native-clone":"true"},React.createElement(SiderEvaStub,{label:"文件库",icon:React.createElement(EvaDriveIcon,{size:16,strokeWidth:1.8,className:"block leading-none",style:{lineHeight:0}}),...ct,isActive:rt.activeNavId===gt,onClick:()=>{}}));case"digital-employees":return React.createElement(SiderEvaStub,{key:gt,label:"数字员工",icon:React.createElement(Bot,{size:16,strokeWidth:1.8,className:"block leading-none",style:{lineHeight:0}}),...ct,isActive:rt.activeNavId===gt,onClick:()=>rt.navigate("/eva-stub/数字员工?evaMode="+rt.mode)});case"connection-center":return React.createElement("div",{key:gt,id:"eva-connection-center-nav"},React.createElement(SiderEvaStub,{label:"连接中心",icon:React.createElement("svg",{width:16,height:16,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round",className:"block leading-none",style:{lineHeight:0},"aria-hidden":"true"},React.createElement("path",{d:"M17 19a1 1 0 0 1-1-1v-2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a1 1 0 0 1-1 1z"}),React.createElement("path",{d:"M17 21v-2"}),React.createElement("path",{d:"M19 14V6.5a1 1 0 0 0-7 0v11a1 1 0 0 1-7 0V10"}),React.createElement("path",{d:"M21 21v-2"}),React.createElement("path",{d:"M3 5V3"}),React.createElement("path",{d:"M4 10a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2z"}),React.createElement("path",{d:"M7 5V3"})),...ct,isActive:rt.activeNavId===gt,onClick:()=>rt.navigate("/eva-stub/技能?evaMode="+rt.mode)}));case"sites":return React.createElement(SiderEvaStub,{key:gt,label:"站点",icon:React.createElement(Earth$2,{theme:"outline",size:"16",fill:"currentColor",className:"block leading-none",style:{lineHeight:0}}),...ct,isActive:rt.activeNavId===gt,onClick:()=>rt.navigate("/eva-stub/站点?evaMode="+rt.mode)});default:return null}};return React.createElement(React.Fragment,null,React.createElement(EvaSidebarSection,{title:"个人",items:EVA_PERSONAL_NAV,render:pt,collapsed:rt.collapsed}),React.createElement(EvaSidebarSection,{title:"团队",items:EVA_TEAM_NAV,render:pt,collapsed:rt.collapsed}),React.createElement(EvaSidebarSection,{title:"其他",items:EVA_COMMON_NAV,render:pt,collapsed:rt.collapsed}))},
`;
        if (source.indexOf(siderComponentAnchor) < 0) throw new Error('EVA 标准侧栏组件注入点不存在');
        source = source.replace(siderComponentAnchor, siderArchitecture + siderComponentAnchor);
        var evaMyAiSelectionNeedle = 'evaSidebarSelectionFromRoute=(rt,ct)=>{if(rt==="/messages")return"messages";';
        var evaMyAiSelectionReplacement = 'evaSidebarSelectionFromRoute=(rt,ct)=>{if(rt==="/messages")return new URLSearchParams(ct||"").get("evaIM")==="my-ai"?"my-ai":"messages";';
        var evaMyAiNavigationNeedle = 'onClick:()=>{}}));case"projects"';
        var evaMyAiNavigationReplacement = 'onClick:()=>rt.navigate("/messages?evaIM=my-ai")}));case"projects"';
        if (!source.includes(evaMyAiSelectionNeedle) || !source.includes(evaMyAiNavigationNeedle)) throw new Error('Eva My AI route anchors missing');
        source = source.replace(evaMyAiSelectionNeedle, evaMyAiSelectionReplacement).replace(evaMyAiNavigationNeedle, evaMyAiNavigationReplacement);

        var siderStateAnchor = 'Kt=typeof window<"u"&&!window.electronAPI&&Dt==="authenticated";reactExports.useEffect';
        var siderStateReplacement = 'Kt=typeof window<"u"&&!window.electronAPI&&Dt==="authenticated",evaMode=evaSidebarMode(gt,St),evaNavigate=mr=>{Pt(),Promise.resolve(xt(mr)).catch(()=>{})},evaActiveNavIdState=reactExports.useState(()=>evaSidebarSelectionFromRoute(gt,St)),evaActiveNavId=evaActiveNavIdState[0],setEvaActiveNavId=evaActiveNavIdState[1];reactExports.useEffect(()=>{setEvaActiveNavId(window.__evaSidebarOverlayNavId||evaSidebarSelectionFromRoute(gt,St))},[gt,St]);reactExports.useEffect(()=>{const evaSelectionListener=event=>{const detail=event.detail||{},id=detail.id;if(!id)return;window.__evaSidebarOverlayNavId=detail.overlay?id:"";setEvaActiveNavId(id)};window.addEventListener("eva:sidebar-select",evaSelectionListener);return()=>window.removeEventListener("eva:sidebar-select",evaSelectionListener)},[]);reactExports.useEffect';
        if (source.indexOf(siderStateAnchor) < 0) throw new Error('EVA 侧栏路由状态注入点不存在');
        source = source.replace(siderStateAnchor, siderStateReplacement);

        var nativeSiderStart = source.indexOf(siderComponentAnchor);
        var siderItemsStart = source.indexOf('React.createElement(SiderSearchEntry', nativeSiderStart);
        var siderItemsEnd = source.indexOf('))),React.createElement(SiderFooter', siderItemsStart);
        if (siderItemsStart < 0 || siderItemsEnd < 0) throw new Error('EVA 侧栏菜单替换范围不存在');
        var nativeNavigation = String.raw`React.createElement(EvaSidebarNavigation,{mode:evaMode,activeNavId:evaActiveNavId,isMobile:pt,collapsed:ct,siderTooltipProps:sr,pathname:gt,onConversationSelect:ln,onSessionClick:rt,isBatchMode:Vt,onNewChat:nn,onToggleBatchMode:()=>Ht(mr=>!mr),navigate:evaNavigate}),evaMode==="personal"?React.createElement(reactExports.Fragment,null,React.createElement("div",{className:classNames("shrink-0 mt-6px mb-2px h-1px bg-[var(--color-border-2)]",ct?"mx-6px":"mx-10px"),role:"separator","aria-label":"本地对话"}),React.createElement("div",{className:classNames("flex-1 min-h-0 overflow-y-auto",siderStyles.scrollArea)},React.createElement(reactExports.Suspense,{fallback:React.createElement("div",{className:"min-h-200px"})},React.createElement(WorkspaceGroupedHistory$1,{...pr})))):React.createElement("div",{className:"flex-1 min-h-0"})`;
        source = source.slice(0, siderItemsStart) + nativeNavigation + source.slice(siderItemsEnd + 1);

        var sharedAutomationSource = String.raw`
function EvaExpertCenterPage({initialTab:rt="experts"}){
  const[ct,ut]=reactExports.useState(rt);
  return React.createElement("div",{className:"eva-expert-center"},
    React.createElement("div",{className:"eva-expert-center__tabs"},
      React.createElement(Tabs,{type:"line",activeTab:ct,onChange:ut},
        React.createElement(TabPane,{tab:"专家",itemKey:"experts"}),
        React.createElement(TabPane,{tab:"专家团",itemKey:"squads"})
      )
    ),
    React.createElement("div",{className:"eva-expert-center__body"},ct==="squads"?React.createElement(SquadPage,null):React.createElement(AgentPage,null))
  );
}
const EVA_PERSONAL_AUTOMATION_DEMO=[
  {id:"personal-daily-brief",name:"每日工作简报",description:"汇总当天日程、待办和重点消息，并创建一个新会话返回简报。",instruction:"读取今天的日程、待办与重点消息，生成一份可直接执行的工作简报。",schedule:"工作日 08:30",nextRun:"明天 08:30",executor:"通用助理",enabled:true,lastStatus:"completed",lastRun:"9月3日 08:31",output:"Session",runTargetName:"每日工作简报 · 9月3日",runContent:"今日共有 3 项重点工作：完成云盘权限方案评审、跟进文件预览异常、准备下午的设计同步会。"},
  {id:"personal-weekly-review",name:"每周工作复盘",description:"整理本周完成事项、风险和下周计划。",instruction:"汇总本周完成事项、遗留风险和下周计划，并给出优先级建议。",schedule:"每周五 17:30",nextRun:"本周五 17:30",executor:"通用助理",enabled:true,lastStatus:"completed",lastRun:"8月29日 17:34",output:"Session",runTargetName:"每周工作复盘 · 第36周",runContent:"本周完成云盘交互方案与权限矩阵梳理；主要风险是外链权限边界仍待确认。"}
];
function EvaAutomationSettingsModal({item:rt,visible:ct,onClose:ut,onSave:pt}){
  const[mt,gt]=reactExports.useState(""),[St,Ct]=reactExports.useState(""),[xt,Pt]=reactExports.useState("");
  reactExports.useEffect(()=>{gt(rt?.name||"");Ct(rt?.instruction||rt?.description||"");Pt(rt?.schedule||"")},[rt]);
  return React.createElement(Modal,{title:"定时任务设置",visible:ct,onCancel:ut,closeOnEsc:true,maskClosable:false,footer:React.createElement(React.Fragment,null,React.createElement(ButtonComponent$1,{onClick:ut},"取消"),React.createElement(ButtonComponent$1,{type:"primary",disabled:!mt.trim(),onClick:()=>{pt&&pt({...rt,name:mt.trim(),instruction:St.trim(),description:St.trim(),schedule:xt.trim()});ut&&ut()}},"保存"))},rt&&React.createElement("div",{className:"eva-auto-settings"},
    React.createElement("label",null,React.createElement("span",null,"名称"),React.createElement(ForwardInput,{value:mt,onChange:gt,placeholder:"例如 每日晨报"})),
    React.createElement("label",null,React.createElement("span",null,"执行方"),React.createElement("div",{className:"eva-auto-settings__static"},rt.executor||"未指定执行方")),
    React.createElement("label",null,React.createElement("span",null,"触发时间"),React.createElement(ForwardInput,{value:xt,onChange:Pt,placeholder:"例如 工作日 09:00"})),
    React.createElement("label",null,React.createElement("span",null,"任务说明"),React.createElement("textarea",{value:St,onChange:Nt=>Ct(Nt.target.value),rows:7,placeholder:"写清楚目标、上下文和步骤"})),
    React.createElement("p",{className:"eva-auto-settings__hint"},"每次触发都会创建一个可追踪的任务。个人中生成 Session，团队项目中生成 Loop 任务。")
  ));
}
function EvaAutomationSessionResult({item:rt,onBack:ct}){
  return React.createElement("div",{className:"eva-auto-session"},
    React.createElement("header",{className:"eva-auto-session__head"},React.createElement("button",{type:"button",className:"eva-auto-icon-button",onClick:ct,"aria-label":"返回自动化任务"},React.createElement(ChevronLeft,{size:20})),React.createElement("div",null,React.createElement("h1",null,rt.runTargetName||rt.name),React.createElement("p",null,"由自动化任务“",rt.name,"”生成的 Session"))),
    React.createElement("main",{className:"eva-auto-session__body"},React.createElement("div",{className:"eva-auto-session__message"},React.createElement("strong",null,rt.executor||"通用助理"),React.createElement("span",null,rt.lastRun||"刚刚"),React.createElement("p",null,rt.runContent||"自动化任务已执行完成，结果已写入本次 Session。"))),
    React.createElement("footer",{className:"eva-auto-session__composer"},React.createElement("span",null,"继续追问这个 Session…"))
  );
}
function EvaSharedAutomationPage({scope:rt,items:ct,loading:ut,onCreate:pt,onOpenRun:mt,notice:gt}){
  const[St,Ct]=reactExports.useState("tasks"),[Nt,Mt]=reactExports.useState(ct||[]),[Dt,Ft]=reactExports.useState(null);
  reactExports.useEffect(()=>Mt(ct||[]),[ct]);
  const Qt=St==="tasks"?Nt:Nt.filter(Vt=>Vt.lastRun);
  const Vt=Ht=>Ht==="completed"||Ht==="succeeded"?"成功":Ht==="running"?"运行中":Ht==="failed"||Ht==="error"?"失败":Ht==="missed"?"已错过":"待运行";
  const Ht=Lt=>{if(Lt.key==="Enter"||Lt.key===" "){Lt.preventDefault();Lt.currentTarget.click()}};
  const Lt=Kt=>Mt(Yt=>Yt.map(Xt=>Xt.id===Kt.id?Kt:Xt));
  const $t=Kt=>{const Xt=String(Kt||"");const Zt=Xt.match(/(\d{1,2})月(\d{1,2})日/);if(Zt)return Number(Zt[1])+"月"+Number(Zt[2])+"日";const en=Xt.match(/(?:\d{4}[\/.-])?(\d{1,2})[\/.-](\d{1,2})/);if(en)return Number(en[1])+"月"+Number(en[2])+"日";const tn=new Date(Kt);return Number.isNaN(tn.getTime())?Xt.replace(/\s+\d{1,2}:\d{2}.*$/,""):(tn.getMonth()+1)+"月"+tn.getDate()+"日"};
  const Kt=Yt=>React.createElement("div",{key:Yt.id,className:"eva-auto-unified-row",role:"button",tabIndex:0,onKeyDown:Ht,onClick:()=>St==="tasks"?Ft(Yt):mt&&mt(Yt)},
    React.createElement("div",{className:"eva-auto-unified-row__main"},React.createElement("strong",null,Yt.name),React.createElement("span",null,St==="tasks"?(Yt.description||Yt.executor||"自动化任务"):Vt(Yt.lastStatus)),St==="tasks"&&React.createElement("span",null,Yt.schedule||"未设置计划")),
    React.createElement("div",{className:"eva-auto-unified-row__aside"},St==="tasks"?(Yt.enabled===false?"暂无后续执行":Yt.nextRun||"暂无后续执行"):$t(Yt.lastRun))
  );
  return React.createElement("div",{className:"eva-shared-auto","data-scope":rt},
    React.createElement("header",{className:"eva-shared-auto__head"},React.createElement(GroupComponent,{className:"eva-auto-segmented",role:"tablist","aria-label":"自动化任务视图","data-active":St},React.createElement(ButtonComponent$1,{type:"text",role:"tab","aria-selected":St==="tasks",className:St==="tasks"?"is-active":"",onClick:()=>Ct("tasks"),icon:React.createElement(Clock3,{size:18})},"定时任务"),React.createElement(ButtonComponent$1,{type:"text",role:"tab","aria-selected":St==="runs",className:St==="runs"?"is-active":"",onClick:()=>Ct("runs"),icon:React.createElement(ListChecks,{size:18})},"运行记录")),St==="tasks"&&React.createElement(ButtonComponent$1,{type:"primary",className:"eva-auto-create-button",onClick:pt},"+ 添加自动化")),
    ut?React.createElement("div",{className:"eva-shared-auto__loading"},React.createElement(SpinComponent,null)):React.createElement("div",{className:"eva-auto-unified-list",role:"list"},Qt.length?Qt.map(Kt):React.createElement("div",{className:"eva-shared-auto__empty"},St==="tasks"?"暂无定时任务":"暂无运行记录")),
    React.createElement(EvaAutomationSettingsModal,{item:Dt,visible:!!Dt,onClose:()=>Ft(null),onSave:Lt})
  );
}
`;

        var personalAutomationStart = source.indexOf('ScheduledTasksPage=()=>{');
        var personalAutomationEnd = source.indexOf(',index$6=Object.freeze(', personalAutomationStart);
        if (personalAutomationStart < 0 || personalAutomationEnd < 0) throw new Error('个人自动化组件注入点不存在');
        var sharedAutomationInsert = source.lastIndexOf('const Attention$1=', personalAutomationStart);
        if (sharedAutomationInsert < 0) throw new Error('共用自动化组件注入点不存在');
        source = source.slice(0, sharedAutomationInsert) + sharedAutomationSource + source.slice(sharedAutomationInsert);
        personalAutomationStart = source.indexOf('ScheduledTasksPage=()=>{', sharedAutomationInsert + sharedAutomationSource.length);
        personalAutomationEnd = source.indexOf(',index$6=Object.freeze(', personalAutomationStart);
        source = source.slice(0, personalAutomationStart) + String.raw`ScheduledTasksPage=()=>{
  const{t:rt,i18n:ct}=useTranslation(),{jobs:ut,loading:pt}=useAllCronJobs(),{presetAssistants:mt}=useConversationAssistants(),gt=useAgentLogos(),[St,Ct]=reactExports.useState(false),[xt,Pt]=reactExports.useState(null);
  const Nt=reactExports.useMemo(()=>ut.length?ut.map(Mt=>{const Dt=getJobAgentMeta(Mt,mt,gt);return{id:Mt.id,name:Mt.name,description:Mt.description||Mt.target.payload.text,instruction:Mt.target.payload.text,schedule:formatSchedule(Mt,rt),nextRun:Mt.state.next_run_at_ms?formatNextRun(Mt.state.next_run_at_ms,ct.language):"-",executor:Dt.name,enabled:Mt.enabled,lastStatus:Mt.state.last_status,lastRun:Mt.state.last_run_at_ms?formatNextRun(Mt.state.last_run_at_ms,ct.language):null,output:"Session",runTargetName:Mt.metadata.conversation_title||Mt.name,runContent:Mt.state.last_error||"自动化任务已执行完成，结果已写入本次 Session。",raw:Mt}}):EVA_PERSONAL_AUTOMATION_DEMO,[ut,mt,gt,rt,ct.language]);
  if(xt)return React.createElement(EvaAutomationSessionResult,{item:xt,onBack:()=>Pt(null)});
  return React.createElement(React.Fragment,null,React.createElement(EvaSharedAutomationPage,{scope:"personal",items:Nt,loading:pt,onCreate:()=>Ct(true),onOpenRun:Mt=>Pt(Mt),notice:"每次触发都会创建一个新的 Session，并在这里保留运行记录。"}),React.createElement(CreateTaskDialog,{visible:St,onClose:()=>Ct(false)}));
}` + source.slice(personalAutomationEnd);

        var projectAutomationStart = source.indexOf('function AutomationPage(){');
        var projectAutomationEnd = source.indexOf('const{Text}=Typography;function ProjectDetailPage', projectAutomationStart);
        if (projectAutomationStart < 0 || projectAutomationEnd < 0) throw new Error('项目自动化组件注入点不存在');
        source = source.slice(0, projectAutomationStart) + String.raw`function AutomationPage(){
  const{t:rt}=useI18n$1(),[ct,ut]=reactExports.useState([]),[pt,mt]=reactExports.useState(true),[gt,St]=reactExports.useState(false),Ct=reactExports.useRef(0);
  const xt=reactExports.useCallback(()=>{const Dt=++Ct.current;mt(true),listAutopilots().then(Ft=>{Dt===Ct.current&&ut(Ft)}).finally(()=>{Dt===Ct.current&&mt(false)})},[]);reactExports.useEffect(xt,[xt]);
  const Pt=reactExports.useMemo(()=>ct.map(Dt=>{const Ft=window.__EVA_DRIVE_DEMO?.issues?.find(Qt=>Qt.automation_id===Dt.id);return{id:Dt.id,name:Dt.title,description:Dt.description,instruction:Dt.description,schedule:Dt.trigger_kinds&&Dt.trigger_kinds.includes("schedule")?"按时间表执行":"未设置计划",nextRun:formatNextRunAt(Dt.next_run_at)||"-",executor:Dt.assignee_name||Dt.assignee_id,enabled:Dt.status!=="paused",lastStatus:Dt.last_run_status,lastRun:Dt.last_run_at?formatNextRunAt(Dt.last_run_at):null,output:"Loop 任务",runTargetId:Ft?.id,runTargetName:Ft?.title||Dt.title,raw:Dt}}),[ct]);
  const Nt=Dt=>Dt.runTargetId?WKApp$1.routeRight.push(React.createElement(IssueDetailPage,{issueId:Dt.runTargetId,onChanged:xt,onClose:()=>WKApp$1.routeRight.pop()})):Toast.warning("暂无可跳转的 Loop 任务");
  return React.createElement(React.Fragment,null,React.createElement(EvaSharedAutomationPage,{scope:"project",items:Pt,loading:pt,onCreate:()=>St(true),onOpenRun:Nt,notice:"每次触发都会在当前项目中创建一个新的 Loop 任务，并保留运行记录。"}),React.createElement(CreateAutomationModal,{visible:gt,onClose:()=>St(false),onSaved:xt}));
}` + source.slice(projectAutomationEnd);

        var moduleScript = document.createElement('script');
        moduleScript.type = 'module';
        moduleScript.textContent = source + '\n//# sourceURL=eva-demo-0904-v1.module.js';
        var startEvaModule = function () { document.head.appendChild(moduleScript); };
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', startEvaModule, { once: true });
        } else {
          startEvaModule();
        }
      })();
    