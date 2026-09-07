
(function () {
  'use strict';

  /* ============================================================
     个人 Eva · 助理数据仓
     原先住在 042-personal-conversation-columns.js（第 8-12、128-144 行），
     那个模块随 336px 会话栏一并删除；数据仓要留下来，因为它现在有两个
     消费者：个人 Eva 路由页的中间栏（052-personal-eva-gds.js）与创建／编辑
     助理编辑器（044-final-layout-convergence.js）。全局侧栏不再持有这份业务内容。

     变更时派发 eva:personal-assistants-change，侧栏面板订阅后重渲染。
     ============================================================ */

  var personalAssistants = [
    { id: 'assistant-general', name: '通用助理' },
    { id: 'assistant-rd', name: 'Eva研发助理' }
  ];

  window.__EVA_PERSONAL_ASSISTANTS = personalAssistants;
  window.__EVA_PERSONAL_ASSISTANT_TASKS = Object.freeze({
    'assistant-general': [['UI设计师发展前景的PPT', '3 小时'], ['整理本周会议结论', '7 小时'], ['帮我改写产品说明', '1 天']],
    'assistant-rd': [['Eva 前端联调排期', '1 分钟'], ['接口回归清单', '2 天']]
  });
  /* 会话内容与会话树分开保存：树只负责列表顺序和时间，详情是
     `/conversation/:id` 的唯一内容源。每段保留用户请求、Eva 的可追问结论，
     以及实际产出的附件或待办，避免所有会话显示同一份静态聊天记录。 */
  window.__EVA_PERSONAL_CONVERSATIONS = Object.freeze([
    {
      id: 'personal-ui-designer-ppt', assistantId: 'assistant-general', title: 'UI设计师发展前景的PPT', assistant: '通用助理',
      messages: [
        { role: 'user', text: '为设计团队准备一份 UI 设计师发展前景的汇报，控制在 6 页，重点说明能力变化和后续行动。' },
        { role: 'assistant', intro: '我先按“行业变化—岗位路径—能力模型—行动建议”整理了演示结构，便于你在管理层同步时直接讲结论。', paragraphs: ['前两页说明需求从单纯界面产出转向体验决策；中间两页对应三类岗位路径和四项核心能力；最后两页收束到薪酬区间与团队下一步。'], artifact: ['UI设计师发展前景.pptx', '6 页 · 2.4 MB'] },
        { role: 'user', text: '把结论页改得更适合和业务负责人沟通。' },
        { role: 'assistant', intro: '已调整结论页，强调“把手艺做成系统”：用一个真实项目验证设计系统的交付效率，并在下次评审前补充业务指标。', note: '待确认 · 选择验证项目 · 本周五' }
      ]
    },
    {
      id: 'personal-weekly-meeting-summary', assistantId: 'assistant-general', title: '整理本周会议结论', assistant: '通用助理',
      messages: [
        { role: 'user', text: '把本周的设计同步、项目评审和供应商沟通整理成会议结论，并区分需要跟进的事项。' },
        { role: 'assistant', intro: '已按议题归并重复信息，结论和待办分开呈现，避免后续跟进时遗漏责任人。', paragraphs: ['设计同步确认继续沿用当前导航方案；项目评审需要补充文件权限边界；供应商沟通等待报价口径回收。'], note: '已创建 3 个会议待办 · 已关联负责人和时间' },
        { role: 'user', text: '把需要我确认的事项单独列出来。' },
        { role: 'assistant', intro: '需要你确认两项：文件跨项目共享的默认权限，以及下周评审中演示的方案顺序。' }
      ]
    },
    {
      id: 'personal-product-copy', assistantId: 'assistant-general', title: '帮我改写产品说明', assistant: '通用助理',
      messages: [
        { role: 'user', text: '把这段产品说明改成适合内部发布的版本，语气清晰一些，不要太营销化。' },
        { role: 'assistant', intro: '已保留功能边界和使用条件，改为“能力—适用场景—下一步”的内部说明结构。', paragraphs: ['新版说明明确了个人助理、团队消息和自动化任务各自的适用范围，也补充了文件与权限的使用前提。'], artifact: ['Eva 产品说明（内部版）.docx', '1.1 MB'] },
        { role: 'user', text: '再补一段给一线同事的使用建议。' },
        { role: 'assistant', intro: '已补充：先从一个真实任务开始，让助理沉淀上下文；涉及跨团队资料时，先检查项目范围和共享权限。' }
      ]
    },
    {
      id: 'personal-frontend-integration', assistantId: 'assistant-rd', title: 'Eva 前端联调排期', assistant: 'Eva研发助理',
      messages: [
        { role: 'user', text: '根据当前接口完成情况整理前端联调排期，标出本周会影响验收的风险。' },
        { role: 'assistant', intro: '联调拆成三个批次：消息与会话、文件与权限、自动化任务。前两批可在本周完成，自动化任务需要等执行结果接口稳定。', paragraphs: ['消息和会话接口已经具备联调条件；文件权限需要补齐跨项目授权的异常态；自动化任务的失败重试口径仍待接口确认。'], note: '风险待确认 · 自动化任务失败重试口径 · 今天 17:30' },
        { role: 'user', text: '把排期发成可同步的文档。' },
        { role: 'assistant', intro: '已生成按批次、负责人和验收条件展开的联调计划，下午同步会可直接使用。', artifact: ['Eva 前端联调排期-v2.docx', '248 KB'] }
      ]
    },
    {
      id: 'personal-api-regression', assistantId: 'assistant-rd', title: '接口回归清单', assistant: 'Eva研发助理',
      messages: [
        { role: 'user', text: '整理这次版本需要回归的接口，并把高风险路径优先排出来。' },
        { role: 'assistant', intro: '已按用户路径整理回归清单，高风险项集中在登录后路由恢复、文件权限继承和会话创建后的上下文恢复。', paragraphs: ['每项已标记请求前置条件、预期结果和异常分支；常规读取接口放在第二轮，先覆盖会造成数据错位或权限泄露的路径。'], artifact: ['接口回归清单.xlsx', '36 项 · 92 KB'] },
        { role: 'user', text: '把阻塞验收的项单独标出来。' },
        { role: 'assistant', intro: '已标记 4 项阻塞验收的问题，并同步到缺陷跟踪：跨项目授权、会话恢复、上传失败重试和任务结果回写。', note: '已同步 · 4 项阻塞验收问题' }
      ]
    }
  ]);
  function announce() {
    document.dispatchEvent(new CustomEvent('eva:personal-assistants-change', {
      detail: { assistants: personalAssistants }
    }));
  }

  window.__evaSavePersonalAssistant = function (options) {
    var settings = options || {};
    var name = String(settings.name || '').trim();
    if (!name) return false;
    if (settings.mode === 'edit') {
      var assistant = personalAssistants.find(function (item) { return item.id === settings.id; });
      if (!assistant) return false;
      assistant.name = name;
    } else {
      personalAssistants.push({ id: 'assistant-' + Date.now().toString(36), name: name });
    }
    announce();
    return true;
  };
})();
