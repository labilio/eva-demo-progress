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
        "text": "晨会只讨论三件事：\n1. 林晓：复测证据是否齐全，何时能给出放行建议？\n2. 何静：合同哪些条款需要今天拍板？\n3. 周远：采购需求是否存在交付缺口？\n会后按“结论、负责人、截止时间”记录，未确认的交期保持待核实。"
      }
    ]
  },
  {
    "id": "team-persona-welcome",
    "identityId": "persona-initial",
    "title": "电脑关机后，供应风险继续跟进",
    "messages": [
      {
        "minute": 0,
        "ai": false,
        "text": "我准备关电脑了。今晚帮我盯 A-2409 的整改进展，明早给我结论。不要代我承诺交期。"
      },
      {
        "minute": 1,
        "ai": true,
        "text": "收到。我在云端继续跟进，不依赖你的电脑在线。会核对复测报告和供应商回复，只提醒缺失材料；涉及放行或交期承诺，留给你确认。"
      },
      {
        "minute": 185,
        "ai": true,
        "text": "21:05 跟进：已收到供应商原因分析，仍缺复测原始记录。已提醒林晓核对这项证据，当前状态保持“待验证”。"
      },
      {
        "minute": 742,
        "ai": true,
        "text": "06:22 更新：复测记录已补齐，三项指标符合要求；“供应商预计恢复时间”仍未获得现场确认，我没有据此修改交期。"
      },
      {
        "minute": 850,
        "ai": false,
        "text": "我回来了，昨晚有什么需要我决定？"
      },
      {
        "minute": 851,
        "ai": true,
        "text": "材料已整理为一页摘要：原因分析、复测证据、剩余风险。\n现在只需你确认：是否安排质量负责人现场复核？建议通过复核后再决定放行。交期仍标记为待确认。"
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
        "text": "已归为三项：成员权限、群文件共享、入口切换。每项都补了触发条件和预期结果。\n优先验证：未入群不能读历史；转存文件不授予来源群权限；切换会话不残留上一条草稿。"
      },
      {
        "minute": 862,
        "ai": false,
        "text": "给测试同事一条能走通的路径。"
      },
      {
        "minute": 863,
        "ai": true,
        "text": "用林晓身份进入供应链项目 → 打开已加入的整改群 → 转存报告到项目团队文件 → 切换何静，只查看共享文件 → 确认她仍不能读取整改群历史。\n再往返消息与我的 AI 团队，检查选中态、输入区和草稿。"
      }
    ]
  },
  {
    "id": "team-pilot-night",
    "identityId": "persona-pilot",
    "title": "夜间巡检，早上只看需要处理的事",
    "messages": [
      {
        "minute": 15,
        "ai": false,
        "text": "今晚我不在线。你在云端盯一下版本验收，失败就整理原因，先别发布。"
      },
      {
        "minute": 16,
        "ai": true,
        "text": "我会持续检查已授权的验收结果；电脑关闭后也会继续。通过项汇总到晨报，失败项保留证据，正式发布等你确认。"
      },
      {
        "minute": 310,
        "ai": true,
        "text": "23:10 巡检：发现一项失败——从项目群聊返回消息后，仍保留上一入口的筛选条件。已整理复现步骤和影响范围，其余检查通过。"
      },
      {
        "minute": 795,
        "ai": true,
        "text": "07:15 复核：该问题修复后，入口往返检查已通过。验收记录已汇总，尚未触发正式发布。"
      },
      {
        "minute": 865,
        "ai": false,
        "text": "早上我需要看哪些？"
      },
      {
        "minute": 866,
        "ai": true,
        "text": "只需看一项发布决定。检查结果与复现记录已经放在摘要中；建议确认当前目标版本后再发布。你确认之前，我会继续观察新增失败。"
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
      ]
    }
  };
})();
