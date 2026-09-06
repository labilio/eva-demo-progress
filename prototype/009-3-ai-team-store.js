/* Eva My AI team: local demo data only; adapters never contact a live service. */
(function (window) {
  'use strict';
  const STORAGE_KEY = 'eva:ai-team:v1';
  const copy = value => JSON.parse(JSON.stringify(value));
  function freeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  }
  const configuration = value => ({
    identity: typeof value?.identity === 'string' ? value.identity : '通用助理',
    personality: typeof value?.personality === 'string' ? value.personality : '清晰、友善',
    skills: Array.isArray(value?.skills) ? value.skills.filter(x => typeof x === 'string') : []
  });
  const makeIdentity = (id, role, name, local, time) => ({
    id, role, name, sourceAssistantId: local.id,
    status: role === 'persona' || local.online ? 'ready' : 'offline',
    configVersion: local.version, syncStatus: 'synced', lastSyncedAt: time,
    configuration: configuration(local.configuration)
  });
  function seed(time) {
    const localAssistants = [
      { id: 'assistant-general', name: '通用助理', version: 1, online: true, configuration: configuration({ identity: '通用助理', skills: ['沟通', '文档整理'] }) },
      { id: 'assistant-rd', name: 'Eva研发助理', version: 1, online: true, configuration: configuration({ identity: 'Eva研发助理', skills: ['研发资料整理'] }) }
    ];
    const identities = [makeIdentity('ai-general', 'assistant', '通用助理', localAssistants[0], time), makeIdentity('persona-initial', 'persona', '通用助理的分身', localAssistants[0], time)];
    const sessions = identities.map((identity, i) => ({
      id: i ? 'team-persona-welcome' : 'team-assistant-welcome', identityId: identity.id,
      title: i ? '团队沟通接待' : '整理工作安排', updatedAt: time,
      messages: [{ id: 'team-seed-' + i, kind: 'text', sender: { uid: identity.id, name: identity.name, color: '#1563EB', ai: true }, time,
        text: i ? '你好，我可以替你接收协作请求并跟进进展。' : '把需要整理的事项发给我，我们一起安排。' }]
    }));
    return { schemaVersion: 1, localAssistants, identities, sessions, drafts: {}, storageWarning: null };
  }
  function valid(state) {
    const str = value => typeof value === 'string';
    const record = value => !!value && typeof value === 'object' && !Array.isArray(value);
    const config = value => record(value) && str(value.identity) && str(value.personality) && Array.isArray(value.skills) && value.skills.every(str);
    const unique = rows => new Set(rows.map(x => x.id)).size === rows.length;
    if (!record(state) || state.schemaVersion !== 1 || !Array.isArray(state.localAssistants) || !Array.isArray(state.identities) || !Array.isArray(state.sessions) || !record(state.drafts)) return false;
    if (!state.localAssistants.every(x => record(x) && str(x.id) && str(x.name) && Number.isInteger(x.version) && x.version > 0 && typeof x.online === 'boolean' && config(x.configuration))) return false;
    if (!state.identities.every(x => record(x) && str(x.id) && str(x.name) && ['assistant', 'persona'].includes(x.role) && ['ready', 'offline'].includes(x.status) && ['synced', 'syncing', 'waiting', 'error'].includes(x.syncStatus) && str(x.lastSyncedAt) && Number.isInteger(x.configVersion) && x.configVersion > 0 && config(x.configuration) && state.localAssistants.some(l => l.id === x.sourceAssistantId && x.configVersion <= l.version))) return false;
    if (!state.sessions.every(x => record(x) && str(x.id) && str(x.title) && str(x.updatedAt) && state.identities.some(i => i.id === x.identityId) && Array.isArray(x.messages) && x.messages.every(m => record(m) && m.kind === 'text' && str(m.text) && str(m.time) && record(m.sender) && str(m.sender.uid) && str(m.sender.name) && str(m.sender.color) && typeof m.sender.ai === 'boolean'))) return false;
    return unique(state.localAssistants) && unique(state.identities) && unique(state.sessions) && Object.entries(state.drafts).every(([key, value]) => str(value) && (state.sessions.some(s => s.id === key) || state.identities.some(i => 'draft:' + i.id === key))) && new Set(state.identities.filter(i => i.role === 'assistant').map(i => i.sourceAssistantId)).size === state.identities.filter(i => i.role === 'assistant').length;
  }
  // Migrate only known generated copy; never rewrite user-authored messages.
  function normalizeProductCopy(state) {
    const replacements = new Map([
      ['【演示】这是独立的团队会话，不包含个人会话历史。', '把需要整理的事项发给我，我们一起安排。'],
      ['【演示】我负责团队沟通与请求转交；专业推理由关联的本地助理完成。', '你好，我可以替你接收协作请求并跟进进展。'],
      ['【演示回执】消息已保存在本机。本原型未连接 OpenClaw，也未执行真实任务。', '收到，我会协助你整理。'],
      ['【演示回执】已记录沟通请求，待关联本地助理处理。本原型未执行专业推理或真实转发。', '收到，我会跟进这项请求。'],
    ]);
    state.sessions.forEach(session => {
      if (session.id === 'team-assistant-welcome' && session.title === '团队协作演示') session.title = '整理工作安排';
      session.messages.forEach(message => {
        if (message.sender.ai && replacements.has(message.text)) message.text = replacements.get(message.text);
      });
    });
  }
  function createStore(options = {}) {
    const now = () => { const value = options.now ? options.now() : new Date(); return value instanceof Date ? value.toISOString() : String(value); };
    let storage, warning = null;
    try { storage = Object.prototype.hasOwnProperty.call(options, 'storage') ? options.storage : window.localStorage; } catch (_) { warning = '本地存储不可用，刷新后数据可能丢失。'; }
    let state = seed(now());
    try {
      const saved = storage?.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!valid(parsed)) throw new Error('Invalid demo state');
        state = parsed;
        normalizeProductCopy(state);
        state.localAssistants.forEach(l => { l.configuration = configuration(l.configuration); });
        state.identities.forEach(i => {
          i.configuration = configuration(i.configuration);
          if (i.syncStatus === 'syncing') i.syncStatus = state.localAssistants.find(l => l.id === i.sourceAssistantId).online ? 'error' : 'waiting';
        });
      }
    } catch (_) { warning = '无法读取已保存的数据，已恢复初始内容。'; }
    state.storageWarning = warning;
    let snapshot = freeze(copy(state));
    const listeners = new Set(), connections = new Map(), syncTokens = new Map();
    let serial = 0;
    const id = prefix => { let value; do { value = prefix + '-' + (++serial); } while ([...state.localAssistants, ...state.identities, ...state.sessions].some(x => x.id === value)); return value; };
    function publish() {
      try { storage?.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { state.storageWarning = '本地存储不可用，刷新后数据可能丢失。'; }
      snapshot = freeze(copy(state));
      [...listeners].forEach(listener => listener());
    }
    const localById = key => { const local = state.localAssistants.find(l => l.id === key); if (!local) throw new Error('找不到本地助理'); return local; };
    const identityById = key => { const identity = state.identities.find(i => i.id === key); if (!identity) throw new Error('找不到 AI 身份'); return identity; };
    const simulate = (method, data) => Promise.resolve().then(() => options.adapter?.[method] ? options.adapter[method](freeze(copy(data))) : new Promise(resolve => setTimeout(resolve, options.delay ?? 350)));
    function connectAssistant(sourceId) {
      const existing = state.identities.find(i => i.role === 'assistant' && i.sourceAssistantId === sourceId);
      if (existing) return Promise.resolve(freeze(copy(existing)));
      if (connections.has(sourceId)) return connections.get(sourceId);
      let local;
      try { local = localById(sourceId); if (!local.online) throw new Error('本地助理离线'); } catch (error) { return Promise.reject(error); }
      const work = simulate('connect', local).then(() => {
        const current = localById(sourceId);
        if (!current.online) throw new Error('本地助理离线');
        const identity = makeIdentity(id('ai'), 'assistant', current.name, current, now());
        state.identities.push(identity); publish(); return freeze(copy(identity));
      }).finally(() => connections.delete(sourceId));
      connections.set(sourceId, work); return work;
    }
    async function createPersona(sourceId) {
      const local = localById(sourceId);
      if (!local.online) throw new Error('本地助理离线');
      await simulate('createPersona', local);
      const current = localById(sourceId);
      if (!current.online) throw new Error('本地助理离线');
      const base = current.name + '的分身';
      let name = base, number = 2;
      while (state.identities.some(i => i.name === name)) name = base + ' ' + number++;
      const identity = makeIdentity(id('persona'), 'persona', name, current, now());
      state.identities.push(identity); publish(); return freeze(copy(identity));
    }
    async function syncPersona(identityId) {
      const identity = identityById(identityId);
      if (identity.role !== 'persona') throw new Error('只有分身需要同步');
      const local = localById(identity.sourceAssistantId);
      const token = (syncTokens.get(identityId) || 0) + 1;
      syncTokens.set(identityId, token);
      if (!local.online) { identity.syncStatus = 'waiting'; publish(); return freeze(copy(identity)); }
      const version = local.version, config = configuration(local.configuration);
      identity.syncStatus = 'syncing'; publish();
      try {
        await simulate('sync', { identityId, sourceAssistantId: local.id, version, configuration: config });
        if (syncTokens.get(identityId) !== token) return freeze(copy(identity));
        if (!localById(local.id).online) { identity.syncStatus = 'waiting'; publish(); return freeze(copy(identity)); }
        identity.configVersion = version; identity.configuration = config; identity.syncStatus = 'synced'; identity.lastSyncedAt = now(); publish();
      } catch (error) {
        if (syncTokens.get(identityId) === token) { identity.syncStatus = localById(local.id).online ? 'error' : 'waiting'; publish(); }
        throw error;
      }
      return freeze(copy(identity));
    }
    function saveLocalAssistant(input) {
      if (!input || !['edit', 'create'].includes(input.mode) || !input.name?.trim()) throw new Error('请填写助理名称');
      let local;
      if (input.mode === 'create') {
        local = { id: id('assistant-local'), name: input.name.trim(), version: 1, online: true, configuration: configuration(input.configuration || { identity: input.name.trim() }) };
        state.localAssistants.push(local);
      } else {
        local = localById(input.id); local.name = input.name.trim(); local.version++;
        local.configuration = configuration(input.configuration || local.configuration);
        state.identities.filter(i => i.role === 'assistant' && i.sourceAssistantId === local.id).forEach(i => {
          i.name = local.name; i.configuration = configuration(local.configuration); i.configVersion = local.version; i.lastSyncedAt = now();
        });
      }
      publish();
      state.identities.filter(i => i.role === 'persona' && i.sourceAssistantId === local.id).forEach(i => { syncPersona(i.id).catch(() => {}); });
      return freeze(copy(local));
    }
    function setLocalOnline(sourceId, online) {
      if (typeof online !== 'boolean') throw new Error('无效在线状态');
      const local = localById(sourceId); local.online = online;
      state.identities.filter(i => i.sourceAssistantId === sourceId).forEach(i => {
        if (i.role === 'assistant') i.status = online ? 'ready' : 'offline';
        else if (!online && (i.syncStatus === 'syncing' || i.configVersion !== local.version)) {
          syncTokens.set(i.id, (syncTokens.get(i.id) || 0) + 1); i.syncStatus = 'waiting';
        }
      });
      publish();
      if (online) state.identities.filter(i => i.sourceAssistantId === sourceId && i.role === 'persona' && i.syncStatus === 'waiting').forEach(i => { syncPersona(i.id).catch(() => {}); });
    }
    function setDraft(key, text) {
      if (typeof key !== 'string' || typeof text !== 'string' || ['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error('无效草稿');
      if (!state.sessions.some(s => s.id === key) && !state.identities.some(i => 'draft:' + i.id === key)) throw new Error('找不到草稿所属会话');
      if ((state.drafts[key] || '') === text) return;
      if (text) state.drafts[key] = text; else delete state.drafts[key];
      publish();
    }
    function sendMessage(identityId, sessionId, text) {
      if (typeof text !== 'string' || !text.trim()) return null;
      const identity = identityById(identityId);
      if (identity.status === 'offline') throw new Error('本地助理离线，请连接后重试');
      let session = sessionId ? state.sessions.find(s => s.id === sessionId && s.identityId === identityId) : null;
      if (sessionId && !session) throw new Error('会话不属于当前 AI 身份');
      const time = now(), body = text.trim();
      if (!session) { session = { id: id('team-session'), identityId, title: Array.from(body).slice(0, 20).join(''), messages: [], updatedAt: time }; state.sessions.push(session); }
      const base = session.id + '-' + session.messages.length;
      session.messages.push({ id: base + '-self', kind: 'text', sender: { uid: 'self', name: '我', color: '#1563EB', ai: false }, time, text: body });
      session.messages.push({ id: base + '-receipt', kind: 'text', sender: { uid: identity.id, name: identity.name, color: '#1563EB', ai: true }, time, text: identity.role === 'persona' ? '收到，我会跟进这项请求。' : '收到，我会协助你整理。' });
      session.updatedAt = time;
      delete state.drafts[sessionId || 'draft:' + identityId]; publish(); return session.id;
    }
    return Object.freeze({ getSnapshot: () => snapshot, subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); }, connectAssistant, createPersona, syncPersona, saveLocalAssistant, setLocalOnline, setDraft, sendMessage });
  }
  window.EvaAITeam = Object.freeze({ ...createStore(), createStore });
})(window);
