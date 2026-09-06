(function () {
  'use strict';
  window.__EVA_IM_DEMO = {
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
