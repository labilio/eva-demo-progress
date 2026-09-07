/* Eva My AI team: local demo data only; adapters never contact a live service. */
(function (window) {
  'use strict';
  // Octo Thread DTO adapter (octo-web c2e2aeed, datasource.threadCreate/threadUpdate).
  // Stable identity -> private two-member group; each conversation is a topic (type 5).
  // `sessions` remains the persisted legacy collection name, never an OpenClaw session.
  const privateGroup = identityId => ({
    id: 'ai-pair:u-wangyilin:' + identityId, chatType: 'group', channel_type: 2,
    identityId, ownerId: 'u-wangyilin', memberIds: ['u-wangyilin', identityId],
    members: 2, presentation: 'ai-direct', replyPolicy: 'direct-only'
  });
  const threadRecord = (identityId, record) => {
    const group = privateGroup(identityId);
    return {...record, group_no: group.id, short_id: record.id,
      channel_id: group.id + '____' + record.id, channel_type: 5};
  };
  const threadSource = ({identityId, name, appearance, records, selectedId, messages}) => {
    const group = privateGroup(identityId);
    const rows = records.length ? records : [{id: 'draft:' + identityId, title: '新对话', messages: []}];
    const threads = rows.map(record => {
      const dto = threadRecord(identityId, record);
      return {...dto, id: dto.channel_id, name: record.title, status: 1,
        member_count: 2, creator_uid: group.ownerId, created_at: record.updatedAt,
        updated_at: record.updatedAt};
    });
    const selected = threads.find(t => t.short_id === selectedId) || threads[0];
    return {sidebarVariant: 'ai-sessions', conversationOnly: true, presentation: 'ai-direct',
      selectedThreadId: selected.id, channels: [{...group, name, threads, unread: 0,
        sessionTitle: selected.name, identityName: name, identityAppearance: appearance,
        identityAvatarUrl: appearance.logo, conversationKind: 'ai-private-group'}],
      cats: [], messages: {}, threadMessages: Object.fromEntries(threads.map(t => [t.id, messages(t.short_id)])),
      scopeNameOf: {}};
  };
  window.EvaAIPrivateConversations = Object.freeze({group: privateGroup, threadRecord, source: threadSource});
  const STORAGE_KEY = 'eva:ai-team:v2';
  const copy = value => JSON.parse(JSON.stringify(value));
  function freeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  }
  const configuration = value => ({
    creationCenter: value?.creationCenter || null,
    description: typeof value?.description === 'string' ? value.description : '',
    about: typeof value?.about === 'string' ? value.about : '',
    collaboration: typeof value?.collaboration === 'string' ? value.collaboration : '',
    model: typeof value?.model === 'string' ? value.model : 'Qwen3.7 Plus',
    toolset: typeof value?.toolset === 'string' ? value.toolset : '四两的产品脑袋',
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
  function seed(time, options = {}) {
    const ownerName=options.ownerName||window.__EVA_MY_ASSISTANT_IDENTITY?.ownerName||'王宜林';
    const defaultName=ownerName+'的通用助理';
    const localAssistants = [
      { id: 'assistant-general', name: defaultName, isDefault:true, version: 1, online: true, configuration: configuration({ identity: defaultName, skills: ['沟通', '文档整理'] }) },
      { id: 'assistant-rd', name: 'Eva研发助理', version: 1, online: true, configuration: configuration({ identity: 'Eva研发助理', skills: ['研发资料整理'] }) }
    ];
    const identities = [makeIdentity('ai-general', 'assistant', defaultName, localAssistants[0], time), makeIdentity('persona-initial', 'persona', '执剑人', localAssistants[0], time)];
    const sessions = identities.map((identity, i) => ({
      id: i ? 'team-persona-welcome' : 'team-assistant-welcome', identityId: identity.id,
      title: i ? '团队沟通接待' : '整理工作安排', updatedAt: time,
      messages: [{ id: 'team-seed-' + i, kind: 'text', sender: { uid: identity.id, name: identity.name, color: '#1563EB', ai: true }, time,
        text: i ? '你好，我可以替你接收协作请求并跟进进展。' : '把需要整理的事项发给我，我们一起安排。' }]
    }));
    if(options.profile==='review') {
      identities.push(makeIdentity('ai-rd','assistant',localAssistants[1].name,localAssistants[1],time),makeIdentity('persona-pilot','persona','飞行员E号',localAssistants[1],time));
    } else {localAssistants.splice(1);identities.splice(1);sessions.splice(1);}
    return { schemaVersion: 1, localAssistants, identities, sessions, drafts: {}, storageWarning: null };
  }
  function valid(state) {
    const str = value => typeof value === 'string';
    const record = value => !!value && typeof value === 'object' && !Array.isArray(value);
    const config = value => record(value) && str(value.identity) && str(value.personality) && Array.isArray(value.skills) && value.skills.every(str);
    const unique = rows => new Set(rows.map(x => x.id)).size === rows.length;
    if (!record(state) || state.schemaVersion !== 1 || !Array.isArray(state.localAssistants) || !Array.isArray(state.identities) || !Array.isArray(state.sessions) || !record(state.drafts)) return false;
    if (!state.localAssistants.every(x => record(x) && str(x.id) && str(x.name) && Number.isInteger(x.version) && x.version > 0 && typeof x.online === 'boolean' && config(x.configuration))) return false;
    if (!state.identities.every(x => record(x) && str(x.id) && str(x.name) && ['assistant', 'persona'].includes(x.role) && ['ready', 'offline'].includes(x.status) && ['synced', 'syncing', 'waiting', 'error'].includes(x.syncStatus) && str(x.lastSyncedAt) && Number.isInteger(x.configVersion) && x.configVersion > 0 && config(x.configuration) && ((x.role === 'persona' && x.sourceAssistantId === null && x.syncStatus === 'synced') || state.localAssistants.some(l => l.id === x.sourceAssistantId && x.configVersion <= l.version)))) return false;
    if (!state.sessions.every(x => record(x) && str(x.id) && str(x.title) && str(x.updatedAt) && (x.pinned === undefined || typeof x.pinned === 'boolean') && state.identities.some(i => i.id === x.identityId) && Array.isArray(x.messages) && x.messages.every(m => record(m) && m.kind === 'text' && str(m.text) && str(m.time) && record(m.sender) && str(m.sender.uid) && str(m.sender.name) && str(m.sender.color) && typeof m.sender.ai === 'boolean'))) return false;
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
    let state = seed(now(), options);
    try {
      const saved = storage?.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Older demo follow-ups omitted this presentation-only field.
        // Repair it before validation without replacing conversations or drafts.
        if (parsed?.schemaVersion === 1 && Array.isArray(parsed.sessions)) {
          parsed.sessions.forEach(session => {
            if (!Array.isArray(session?.messages)) return;
            session.messages.forEach(message => {
              if (message?.sender && typeof message.sender === 'object' && message.sender.color === undefined) message.sender.color = '#1563EB';
            });
          });
        }
        if (!valid(parsed)) throw new Error('Invalid demo state');
        state = parsed;
        normalizeProductCopy(state);
        state.sessions.forEach(session => { delete session.archived; });
        state.localAssistants.forEach(l => { l.configuration = configuration(l.configuration); });
        state.identities.forEach(i => {
          i.configuration = configuration(i.configuration);
          if (i.syncStatus === 'syncing') i.syncStatus = state.localAssistants.find(l => l.id === i.sourceAssistantId).online ? 'error' : 'waiting';
        });
      }
    } catch (_) { warning = '无法读取已保存的数据，已恢复初始内容。'; }
    // Add review stories once; preserve edited conversations, drafts and later deletions.
    if (options.profile === 'review' && !state.reviewStoriesVersion && window.__EVA_IM_DEMO?.aiTeamSessions) {
      const base = new Date(window.__EVA_DEMO_TIME.AI_REVIEW_START).getTime();
      window.__EVA_IM_DEMO.aiTeamSessions.forEach(story => {
        const identity = state.identities.find(i => i.id === story.identityId);
        if (!identity) return;
        const old = state.sessions.find(s => s.id === story.id);
        const placeholder = old && old.messages.length === 1 && ['team-seed-0','team-seed-1'].includes(old.messages[0].id);
        const messages = story.messages.map((message, index) => ({id: story.id + '-story-' + index, kind: 'text', text: message.text, time: new Date(base + message.minute * 60000).toISOString(), sender: {uid: message.ai ? identity.id : 'self', name: message.ai ? identity.name : '我', color: '#1563EB', ai: message.ai}}));
        const session = {id: old && !placeholder ? story.id + '-example' : story.id, identityId: identity.id, title: story.title, updatedAt: messages.at(-1).time, messages};
        if (placeholder) Object.assign(old, session); else if (!state.sessions.some(s => s.id === session.id)) state.sessions.push(session);
      });
      state.reviewStoriesVersion = 1;
      try { storage?.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { warning = '本地存储不可用，刷新后数据可能丢失。'; }
    }
    // Upgrade only exact shipped demo copy; preserve user edits, drafts and deleted sessions.
    if (options.profile === 'review' && !state.markdownDemoV1) {
      const upgrades = window.__EVA_IM_MARKDOWN_UPGRADES || {};
      state.sessions.forEach(session => session.messages.forEach(message => {
        if (message.sender?.ai && message.id?.includes('-story-') && Object.hasOwn(upgrades, message.text)) message.text = upgrades[message.text];
      }));
      state.markdownDemoV1 = true;
      try { storage?.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { warning = '本地存储不可用，刷新后数据可能丢失。'; }
    }
    if (options.profile === 'review' && !state.richFollowupsIMV4) {
      state.sessions.forEach(session => { const identity=state.identities.find(i=>i.id===session.identityId); if(identity?.role!=='persona') session.messages=session.messages.filter(m=>!/^rich-v2-/.test(m.id||'')); });
      (window.__EVA_IM_RICH_FOLLOWUPS || []).forEach(item => {
        const session = state.sessions.find(s => s.id === item.sessionId + '-example') || state.sessions.find(s => s.id === item.sessionId);
        if (!session || session.messages.some(m => m.id === item.id + '-ai')) return;
        const identity = state.identities.find(i => i.id === session.identityId);
        if (!identity || identity.role !== 'persona') return;
        const time = session.updatedAt;
        session.messages.push({id:item.id+'-self',kind:'text',time,text:item.question,sender:{uid:'self',name:'我',color:'#1563EB',ai:false}}, {id:item.id+'-ai',kind:'text',time,text:item.answer,sender:{uid:identity.id,name:identity.name,color:'#1563EB',ai:true}});
      });
      state.richFollowupsIMV4 = true;
      try { storage?.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { warning = '本地存储不可用，刷新后数据可能丢失。'; }
    }
    if(options.profile==='review'&&!state.compactPresentationV1){
      state.sessions.forEach(session=>{
        session.messages=session.messages.filter(m=>!/^rich-v2-|^rich-supply-private-/.test(m.id||''));
        session.messages.forEach(m=>{const map=window.__EVA_IM_COMPACT_COPY||{};if(m.sender?.ai&&m.id?.includes('-story-')&&Object.hasOwn(map,m.text))m.text=map[m.text];});
      });
      state.compactPresentationV1=true;
      try{storage?.setItem(STORAGE_KEY,JSON.stringify(state));}catch(_){}
    }
    if(options.profile==='review'&&!state.personaShortDemoV1){
      Object.entries(window.__EVA_PERSONA_SHORT_DEMO||{}).forEach(([id,texts])=>{
        const session=state.sessions.find(s=>s.id===id+'-example')||state.sessions.find(s=>s.id===id);
        if(!session)return;
        const identity=state.identities.find(i=>i.id===session.identityId);
        if(identity?.role!=='persona')return;
        const retained=session.messages.filter(m=>!String(m.id||'').startsWith(id+'-story-')&&!/^rich-v2-|^rich-supply-private-/.test(m.id||''));
        const base=new Date(window.__EVA_DEMO_TIME.AI_REVIEW_START).getTime();
        session.messages=texts.map((text,index)=>({id:id+'-story-'+index,kind:'text',text,time:new Date(base+(480+index)*60000).toISOString(),sender:{uid:index%2?identity.id:'self',name:index%2?identity.name:'我',color:'#1563EB',ai:!!(index%2)}})).concat(retained);
      });
      state.personaShortDemoV1=true;
      try{storage?.setItem(STORAGE_KEY,JSON.stringify(state));}catch(_){}
    }
    if(options.profile==='review'&&!state.personaVarietyV2){
      Object.entries(window.__EVA_PERSONA_VARIETY_DEMO||{}).forEach(([id,copy])=>{
        const session=state.sessions.find(s=>s.id===id+'-example')||state.sessions.find(s=>s.id===id);
        if(!session)return;
        const identity=state.identities.find(i=>i.id===session.identityId);
        if(identity?.role!=='persona')return;
        const old=window.__EVA_PERSONA_SHORT_DEMO?.[id];
        session.messages.forEach(m=>{const index=Number(String(m.id||'').replace(id+'-story-',''));if(old&&Number.isInteger(index)&&index>=0&&index<4&&m.id===id+'-story-'+index&&m.text===old[index])m.text=copy.texts[index];});
        if(session.title==='电脑关机后，供应风险继续跟进'||session.title==='夜间巡检，早上只看需要处理的事')session.title=copy.title;
      });
      state.personaVarietyV2=true;
      try{storage?.setItem(STORAGE_KEY,JSON.stringify(state));}catch(_){}
    }
    // Add the Octo parent/topic relationship without changing local IDs or user content.
    state.sessions = state.sessions.map(record => state.identities.find(i => i.id === record.identityId)?.role === 'persona'
      ? threadRecord(record.identityId, record) : record);
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
    async function createPersona(sourceId, input = {}) {
      const independent = sourceId == null;
      const local = independent ? {id:null,name:'独立',online:true,version:1,configuration:{}} : localById(sourceId);
      if (!local.online) throw new Error('本地助理离线');
      await simulate('createPersona', local);
      const current = independent ? local : localById(sourceId);
      if (!current.online) throw new Error('本地助理离线');
      const base = typeof input.name === 'string' && input.name.trim() ? input.name.trim() : current.name + '的分身';
      let name = base, number = 2;
      while (state.identities.some(i => i.name === name)) name = base + ' ' + number++;
      const identity = makeIdentity(id('persona'), 'persona', name, current, now());
      if(independent)identity.lastSyncedAt='';
      if(input.configuration)identity.configuration=configuration(input.configuration);
      state.identities.push(identity); publish(); return freeze(copy(identity));
    }
    function savePersona(input) {
      const identity=identityById(input.id);
      if(identity.role!=='persona')throw new Error('只能编辑分身');
      if(typeof input.name!=='string'||!input.name.trim())throw new Error('请填写分身名称');
      const nextSource=Object.prototype.hasOwnProperty.call(input,'sourceAssistantId')?input.sourceAssistantId:identity.sourceAssistantId;
      const changed=nextSource!==identity.sourceAssistantId;
      const local=nextSource===null?null:localById(nextSource);
      if(changed&&local&&!local.online)throw new Error('本地助理离线');
      identity.name=input.name.trim();identity.configuration=configuration(input.configuration||identity.configuration);
      if(changed){identity.sourceAssistantId=nextSource;identity.configVersion=local?.version||1;identity.lastSyncedAt=local?now():'';if(local)identity.configuration=configuration(local.configuration);}

      syncTokens.set(identity.id,(syncTokens.get(identity.id)||0)+1);
      identity.syncStatus='synced';publish();return freeze(copy(identity));
    }
    async function syncPersona(identityId) {
      const identity = identityById(identityId);
      if (identity.role !== 'persona') throw new Error('只有分身需要同步');
      if(identity.sourceAssistantId===null)return freeze(copy(identity));
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
        local = localById(input.id);
        if(local.id==='assistant-general'&&input.name.trim()!==local.name)throw new Error('通用助理不可改名');
        local.name = input.name.trim(); local.version++;
        local.configuration = configuration({...local.configuration,...input.configuration});
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
    function setSessionFlag(sessionId, flag, value) {
      const session = state.sessions.find(s => s.id === sessionId);
      if (!session) throw new Error('找不到会话');
      if (flag !== 'pinned' || typeof value !== 'boolean') throw new Error('无效会话状态');
      session[flag] = value;
      publish();
    }
    function deleteSession(sessionId) {
      if (!state.sessions.some(s => s.id === sessionId)) throw new Error('找不到会话');
      state.sessions = state.sessions.filter(s => s.id !== sessionId);
      delete state.drafts[sessionId];
      publish();
    }
    function createThread(identityId) {
      const identity = identityById(identityId);
      if (identity.role !== 'persona') throw new Error('请选择云端分身');
      const records = state.sessions.filter(s => s.identityId === identityId);
      let title = '新对话', number = 2;
      while (records.some(s => s.title === title)) title = '新对话 ' + number++;
      const record = threadRecord(identityId, {id: id('team-thread-' + (window.crypto?.randomUUID?.() || Date.now())), identityId, title,
        autoTitle: true, messages: [], updatedAt: now()});
      state.sessions.push(record);
      publish();
      return record.id;
    }
    function renameThread(identityId, threadId, name) {
      const record = state.sessions.find(s => s.id === threadId && s.identityId === identityId);
      if (!record) throw new Error('会话已删除或不属于当前 AI');
      const title = String(name || '').trim();
      if (!title || Array.from(title).length > 50) throw new Error('请输入 1–50 个字符的会话名称');
      record.title = title; record.autoTitle = false; publish();
    }
    function sendMessage(identityId, sessionId, text) {
      if (typeof text !== 'string' || !text.trim()) return null;
      const identity = identityById(identityId);
      if (identity.status === 'offline') throw new Error('本地助理离线，请连接后重试');
      let session = sessionId ? state.sessions.find(s => s.id === sessionId && s.identityId === identityId) : null;
      if (sessionId && !session) throw new Error('会话不属于当前 AI 身份');
      const time = now(), body = text.trim();
      if (!session) {
        session = {id: id(identity.role === 'persona' ? 'team-thread' : 'team-session'), identityId,
          title: Array.from(body).slice(0, 20).join(''), messages: [], updatedAt: time};
        if (identity.role === 'persona') session = threadRecord(identityId, session);
        state.sessions.push(session);
      }
      if (session.autoTitle) {session.title = Array.from(body).slice(0, 20).join(''); session.autoTitle = false;}
      const base = session.id + '-' + session.messages.length;
      session.messages.push({ id: base + '-self', kind: 'text', sender: { uid: 'self', name: '我', color: '#1563EB', ai: false }, time, text: body });
      session.messages.push({ id: base + '-receipt', kind: 'text', sender: { uid: identity.id, name: identity.name, color: '#1563EB', ai: true }, time, text: identity.role === 'persona' ? '收到，我会跟进这项请求。' : '收到，我会协助你整理。' });
      session.updatedAt = time;
      delete state.drafts[sessionId || 'draft:' + identityId]; publish(); return session.id;
    }
    return Object.freeze({ getSnapshot: () => snapshot, subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); }, connectAssistant, createPersona, syncPersona, savePersona, saveLocalAssistant, setLocalOnline, setDraft, createThread, renameThread, sendMessage, setSessionFlag, deleteSession });
  }
  window.EvaAITeam = Object.freeze({ ...createStore({profile:'review'}), createStore });
})(window);
