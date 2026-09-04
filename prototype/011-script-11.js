
(function () {
  var USER = { id: 'u-wangyilin', username: 'admin', name: '王宜林', email: 'wangyilin@example.com', avatar: window.__EVA_CURRENT_USER_PORTRAIT };
  var LOCAL_CONVERSATIONS = [
    { id: 'local-eva-today', name: '整理今天的工作重点', type: 'aionrs', status: 'idle', created_at: Date.parse('2026-09-03T01:20:00+08:00'), modified_at: Date.parse('2026-09-03T09:40:00+08:00'), project_id: null, extra: {} },
    { id: 'local-eva-drive', name: '云盘权限方案梳理', type: 'aionrs', status: 'idle', created_at: Date.parse('2026-09-02T03:10:00+08:00'), modified_at: Date.parse('2026-09-02T16:25:00+08:00'), project_id: null, extra: {} },
    { id: 'local-eva-meeting', name: '会议纪要与待办', type: 'aionrs', status: 'idle', created_at: Date.parse('2026-09-01T02:30:00+08:00'), modified_at: Date.parse('2026-09-01T11:05:00+08:00'), project_id: null, extra: {} },
    { id: 'local-eva-weekly', name: '周报内容整理', type: 'aionrs', status: 'idle', created_at: Date.parse('2026-08-29T04:00:00+08:00'), modified_at: Date.parse('2026-08-29T17:15:00+08:00'), project_id: null, extra: {} },
    { id: 'local-eva-product', name: '产品方案讨论', type: 'aionrs', status: 'idle', created_at: Date.parse('2026-08-25T06:40:00+08:00'), modified_at: Date.parse('2026-08-25T14:30:00+08:00'), project_id: null, extra: {} }
  ];
  // 返回数组的端点：给对象会让调用方的 .map 直接抛（cron 修表就是这么炸的）
  function json(body, status) {
    return new Response(JSON.stringify(body), { status: status || 200, headers: { 'Content-Type': 'application/json' } });
  }
  var realFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var path = url.replace(/^https?:\/\/[^/]+/, '').split('?')[0];
    // AuthContext 要的是 { success, user }，不是裸用户对象
    if (path === '/api/auth/user') return Promise.resolve(json({ success: true, user: USER }));
    if (path === '/login') return Promise.resolve(json({ success: true, user: USER }));
    if (path === '/logout') return Promise.resolve(json({ success: true }));
    if (path.indexOf('/api/') === 0) {
      window.__stubHits = window.__stubHits || [];
      window.__stubHits.push(path);
      // httpBridge 会拆 { success, data } 取 data——不给 data 就把信封当数据用，
      // 于是调用方拿到 {success:true} 再去 .map/[...x] 就抛「not iterable」。
      // 会话历史是分页对象；其余未知端点一律给数组：数组可迭代、可 map、可 Object.entries，
      // 被当对象读键也只是 undefined，是最不容易炸的兜底形状。
      var conversationMessagesMatch = path.match(/^\/api\/conversations\/([^/]+)\/messages$/);
      if (conversationMessagesMatch) return Promise.resolve(json({ success: true, data: [] }));
      var conversationMatch = path.match(/^\/api\/conversations\/([^/]+)$/);
      if (conversationMatch) {
        var conversation = LOCAL_CONVERSATIONS.find(function (item) { return item.id === decodeURIComponent(conversationMatch[1]); });
        return Promise.resolve(json({ success: true, data: conversation || null }, conversation ? 200 : 404));
      }
      if (path === '/api/conversations') return Promise.resolve(json({ success: true, data: { items: LOCAL_CONVERSATIONS, total: LOCAL_CONVERSATIONS.length, page: 1, page_size: 50, conversations: LOCAL_CONVERSATIONS } }));
      if (path.indexOf('/api/conversations') === 0) return Promise.resolve(json({ success: true, data: [] }));
      if (path.indexOf('/api/settings') === 0) return Promise.resolve(json({ success: true, data: {} }));
      return Promise.resolve(json({ success: true, data: [] }));
    }
    return realFetch(input, init);
  };
  // 演示种子：协作空间直接有数据，不必双击插画播种
  try {
    if (!localStorage.getItem('eva-collab-spaces')) {
      localStorage.setItem('eva-collab-spaces', JSON.stringify([
        { id: 'prod', name: '供应链运营协同', short: '供', color: '#4c6ef5', desc: '协同推进间接采购、供应商质量与合规风控工作',
          members: [{ name: '王宜林', color: '#4c6ef5' }, { name: '林晓', color: '#0ca678' }, { name: '周远', color: '#f59f00' }, { name: '苏航', color: '#e8590c' }, { name: '何静', color: '#9c36b5' }],
          bots: 7, lastActive: '12 分钟前活跃' },
        { id: 'lab', name: '客户联合交付', short: '验', color: '#0ca678', desc: '内部交付团队与客户成员在独立权限下共同推进工作',
          members: [{ name: '王宜林', color: '#4c6ef5' }, { name: '何静', color: '#9c36b5' }, { name: '苏航', color: '#e8590c' }],
          bots: 0, lastActive: '3 天前活跃' },
      ]));
    }
  } catch (e) { /* 无痕模式忽略 */ }
  // 没有后端就没有实时通道。httpBridge 的 ensureWs 用 `readyState === WebSocket.CONNECTING` 判重连，
  // 所以桩必须①带齐静态常量②停在 CONNECTING——否则它会永远重连刷错误。
  try {
    var RealWS = window.WebSocket;
    var StubWS = function (url) {
      if (String(url).indexOf('ws') === 0 && String(url).indexOf('/ws') > -1 || String(url).indexOf('ws://ws') === 0) {
        return { readyState: 0, close: function () {}, send: function () {}, addEventListener: function () {}, removeEventListener: function () {} };
      }
      return new RealWS(url);
    };
    StubWS.CONNECTING = 0; StubWS.OPEN = 1; StubWS.CLOSING = 2; StubWS.CLOSED = 3;
    window.WebSocket = StubWS;
  } catch (e) { /* 忽略 */ }
  // 第一屏停在协作空间主页
  if (!location.hash || location.hash === '#/') location.hash = '#/collab';
})();
