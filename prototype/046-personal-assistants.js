
(function () {
  'use strict';

  /* ============================================================
     个人 Eva · 助理数据仓
     原先住在 042-personal-conversation-columns.js（第 8-12、128-144 行），
     那个模块随 336px 会话栏一并删除；数据仓要留下来，因为它现在有两个
     消费者：React 侧栏面板（009-7-patch-sider.js）与创建／编辑助理编辑器
     （044-final-layout-convergence.js）。

     变更时派发 eva:personal-assistants-change，侧栏面板订阅后重渲染。
     ============================================================ */

  var personalAssistants = [
    { id: 'assistant-general', name: '通用助理' },
    { id: 'assistant-rd', name: 'Eva研发助理' }
  ];

  window.__EVA_PERSONAL_ASSISTANTS = personalAssistants;

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
