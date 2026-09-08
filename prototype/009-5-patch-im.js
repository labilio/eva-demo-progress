(function (root) {
  'use strict';
  root.__evaPatch('im', function (source) {
function evaIdentityAppearance(identity) {
  const original = window.__EVA_MY_ASSISTANT_IDENTITY;
  return {name:identity.name, sourceName:'Eva', sourceAssistantId:identity.sourceAssistantId,
    avatar:identity.configuration?.avatar||original.logo, logo:original.logo};
}
function EvaAIIdentityAvatar({appearance,size=32}) {
  return window.EvaAIIdentity.avatar(appearance,size,React.createElement);
}

function EvaInlineProjectPanel({projectId}) {
  const h=React.createElement;
  const [spaces,setSpaces]=reactExports.useState(()=>loadSpaces());
  const [activeProjectId,setActiveProjectId]=reactExports.useState(projectId);
  reactExports.useEffect(()=>setActiveProjectId(projectId),[projectId]);
  const space=spaces.find(item=>item.id===activeProjectId);
  if(!space)return null;
  setCurrentSpace(space.id,space.name);
  return h('section',{className:'eva-inline-project-panel','aria-label':space.name+' 项目页面'},
    h('div',{className:'eva-inline-project-panel__body'},
      h(SpaceFrame,{key:space.id,space,spaces,onSwitch:setActiveProjectId,onProjectUpdated:setSpaces})));
}

function EvaAssistantSourceCards({sources,value,disabled,onChange}) {
  const h=React.createElement;
  const group=reactExports.useId();
  return h('fieldset',{className:'eva-ai-team__source-options'},h('legend',null,'来源助理'),
    h('div',{className:'eva-ai-team__connection-list'},[...sources,{id:'__independent__',name:'不关联助理',online:true,independent:true}].map(l=>
      h('label',{key:l.id,className:'eva-ai-team__connection-option'+(value===l.id?' is-selected':'')},
        !l.independent&&h(EvaAIIdentityAvatar,{appearance:evaIdentityAppearance(l),size:32}),
        h('span',{className:'eva-ai-team__connection-title'},h('strong',{title:l.name},l.name),h('span',{className:'eva-ai-team__connection-status'},l.independent?'独立配置':!l.online?'本地离线':l.isDefault?'默认助理':'')),
        h('input',{type:'radio',name:group,value:l.id,checked:value===l.id,disabled:disabled||!l.online,onChange:()=>onChange(l.id),'aria-label':l.name})))));
}

function EvaAssistantEditorHost({children}) {
  const [request,setRequest]=reactExports.useState(null), host=reactExports.useRef(null);
  reactExports.useEffect(()=>{const open=options=>setRequest(options?{...options,key:Date.now()}:null);window.__evaOpenAssistantEditor=open;return()=>{if(window.__evaOpenAssistantEditor===open)delete window.__evaOpenAssistantEditor;};},[]);
  reactExports.useEffect(()=>{const close=()=>setRequest(null);window.addEventListener('hashchange',close);return()=>window.removeEventListener('hashchange',close);},[]);
  return React.createElement(React.Fragment,null,children,React.createElement('div',{className:'eva-editor-host',ref:host}),request&&React.createElement(EvaAssistantEditor,{key:request.key,request,host,onClose:()=>setRequest(null)}));
}
function EvaAssistantEditor({request,host,onClose}) {
  const h=React.createElement, store=window.EvaAITeam, snapshot=reactExports.useSyncExternalStore(store.subscribe,store.getSnapshot,store.getSnapshot);
  const persona=request.role==='persona', editing=request.mode==='edit';
  const existing=persona?snapshot.identities.find(i=>i.id===request.id):snapshot.localAssistants.find(i=>i.id===request.id);
  const [sourceAssistantId,setSourceAssistantId]=reactExports.useState(editing?existing?.sourceAssistantId??null:request.sourceId??null);
  const local=snapshot.localAssistants.find(i=>i.id===sourceAssistantId);
  const config=(editing?existing?.configuration:local?.configuration)||{};
  const [draft,setDraft]=reactExports.useState(()=>({name:editing?existing?.name||'':persona?(local?local.name+'的分身':''):'',description:config.description||'',identity:config.identity||'',personality:config.personality||'',about:config.about||'',skills:(config.skills||[]).join('\n'),collaboration:config.collaboration||'',model:config.model||'Qwen3.7 Plus',toolset:config.toolset??'四两的产品脑袋',avatar:config.avatar||''}));
  const [tab,setTab]=reactExports.useState('identity'),[busy,setBusy]=reactExports.useState(false),[error,setError]=reactExports.useState('');
  const scope=reactExports.useRef(null), alive=reactExports.useRef(true);
  reactExports.useEffect(()=>()=>{alive.current=false;},[]);
  const update=(key,value)=>{setDraft(d=>({...d,[key]:value}));setError('');};
  const role=persona?'分身':'助理';
  const editorTitle=(editing?'编辑':'创建')+(persona?'云端分身':'本地助理');
  const syncLabel=editing?({synced:'已同步',syncing:'正在同步',waiting:'等待记忆同步',error:'同步失败'}[existing?.syncStatus]||'等待记忆同步'):'创建后同步';
  const tabs=[['identity',role+'身份','定义'+role+'是谁，包括名字、头像、角色定位和能力范围。'],['personality',role+'性格','描述表达方式、判断风格和协作习惯。'],['about','关于你','补充需要了解的个人背景与偏好。'],['skills','技能','配置可以使用的技能，每行一个。'],['collaboration','协作','设置参与协作时的职责和规则。']];
  if(persona)tabs.push(['source','来源与同步','选择来源助理后，配置与已授权记忆将自动同步到云端分身。']);
  function changeSource(value){const next=value==='__independent__'?null:value;setSourceAssistantId(next);const selected=snapshot.localAssistants.find(i=>i.id===next);if(selected)setDraft(d=>({...d,...selected.configuration,skills:(selected.configuration.skills||[]).join('\n')}));setError('');}
  function applyTemplate(item){setDraft(d=>({...d,name:d.name||item.name, ...item.configuration,skills:item.configuration.skills.join('\n')}));setError('');}
  function quickCreate(){if(!draft.name.trim()){setError('请先填写'+role+'名称');return;}setDraft(d=>({...d,identity:d.identity||('你是'+d.name+'，协助主人处理工作事项。'),personality:d.personality||'清晰、友善；关键决策由主人确认。'}));}
  async function save(){
    if(!draft.name.trim()){setError('请填写'+role+'名称');return;}
    if(draft.avatar.trim()&&!/^(?:https:\/\/\S+|data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+)$/.test(draft.avatar.trim())){setError('头像请使用 HTTPS 图片地址或 data:image 图片数据');return;}
    setBusy(true);setError('');
    const configuration={...draft,skills:draft.skills.split('\n').map(x=>x.trim()).filter(Boolean)};delete configuration.name;
    try{
      let result;
      if(persona) result=editing?store.savePersona({id:request.id,name:draft.name,configuration,sourceAssistantId}):await store.createPersona(sourceAssistantId,{name:draft.name,configuration});
      else {result=store.saveLocalAssistant({mode:editing?'edit':'create',id:request.id,name:draft.name,configuration});if(request.connect)result=await store.connectAssistant(result.id);}
      if(alive.current){request.onSaved?.(result);onClose();}
    }catch(e){if(alive.current)setError(e.message||'保存失败，请重试');}
    finally{if(alive.current)setBusy(false);}
  }
  const appearance={name:draft.name||role,sourceName:'Eva',avatar:draft.avatar||window.__EVA_MY_ASSISTANT_IDENTITY.logo,logo:window.__EVA_MY_ASSISTANT_IDENTITY.logo};
  const editor=h('section',{className:'eva-create-assistant-modal',ref:scope,'aria-label':editorTitle},
      h('header',{className:'eva-create-assistant-modal__head'},h(EvaAIIdentityAvatar,{appearance,size:34}),
        h('div',{className:'eva-create-assistant-modal__identity'},h('span',{className:'eva-editor-kind'},editorTitle),h('div',{className:'eva-editor-title-row'},h('input',{'aria-label':role+'名称',placeholder:role+'名称',value:draft.name,readOnly:!persona&&existing?.isDefault,disabled:busy,onChange:e=>update('name',e.target.value)})),h('input',{className:'eva-editor-description','aria-label':'简短描述',placeholder:'简短描述',value:draft.description,disabled:busy,onChange:e=>update('description',e.target.value)}),persona&&h('span',null,local?'同步自：'+local.name:'独立配置')),
        h('div',{className:'eva-create-assistant-modal__head-actions'},
          h(Button,{theme:'outline',type:'tertiary',onClick:quickCreate,disabled:busy},'快速创建'),
          h(Dropdown,{trigger:'click',position:'bottomRight',getPopupContainer:()=>scope.current,clickToHide:true,render:h(Dropdown.Menu,null,snapshot.localAssistants.map(i=>h(Dropdown.Item,{key:i.id,onClick:()=>applyTemplate(i)},i.name)))},h('span',{className:'eva-ai-team__menu-anchor'},h(Button,{theme:'outline',type:'tertiary',disabled:busy},'使用模板'))),
          h(Button,{theme:'borderless',type:'tertiary',icon:h(X,{size:20}),'aria-label':'关闭编辑器',disabled:busy,onClick:onClose}))),
      h('nav',{className:'eva-create-assistant-modal__tabs',role:'tablist','aria-label':role+'设置'},tabs.map(([key,label])=>h('button',{type:'button',role:'tab','aria-selected':tab===key,key,className:'eva-create-assistant-modal__tab'+(tab===key?' is-active':''),onClick:()=>setTab(key)},label))),
      h('div',{className:'eva-create-assistant-modal__body',role:'tabpanel'},h('p',{className:'eva-create-assistant-modal__hint'},tabs.find(t=>t[0]===tab)[2]),tab==='source'?h('div',{className:'eva-editor-source'},h(EvaAssistantSourceCards,{sources:snapshot.localAssistants,value:sourceAssistantId||'__independent__',disabled:busy,onChange:changeSource}),h('p',null,local?'默认自动同步配置；当前 AI 的头像独立保存。更换来源并保存后将使用新助理配置。':'独立维护当前配置，不从助理同步。'),local&&h('span',{role:'status'},sourceAssistantId===existing?.sourceAssistantId?'本地 → 云端 · '+syncLabel:'保存后自动同步')):tab==='identity'?h('div',{className:'eva-editor-identity-fields'},h('textarea',{className:'eva-create-assistant-modal__editor','aria-label':tabs.find(t=>t[0]===tab)[1],placeholder:'支持 Markdown 格式，可用中文或英文书写',value:draft.identity,disabled:busy,onChange:e=>update('identity',e.target.value)}),h('label',{className:'eva-editor-avatar-field'},h('span',null,'头像图片地址'),h('input',{type:'url','aria-label':'头像图片地址',placeholder:'https://… 或 data:image/…',value:draft.avatar,disabled:busy,onChange:e=>update('avatar',e.target.value)}),h('small',null,'保存后会在该 AI 的会话、消息、成员与选择器中保持一致。'))):h('textarea',{className:'eva-create-assistant-modal__editor','aria-label':tabs.find(t=>t[0]===tab)[1],placeholder:tab==='skills'?'每行填写一个技能':'支持 Markdown 格式，可用中文或英文书写',value:draft[tab],disabled:busy,onChange:e=>update(tab,e.target.value)})),
      error&&h('p',{className:'eva-ai-team__error',role:'alert'},error),
      h('footer',{className:'eva-create-assistant-modal__footer'},h(Select,{value:draft.model,'aria-label':'模型',getPopupContainer:()=>scope.current,onChange:value=>update('model',value),disabled:busy},h(Select.Option,{value:'Qwen3.7 Plus'},'Qwen3.7 Plus')),
        draft.toolset&&h('span',{className:'eva-create-assistant-modal__chip'},draft.toolset,h(Button,{theme:'borderless',type:'tertiary',size:'small',icon:h(X,{size:12}),'aria-label':'移除'+draft.toolset,onClick:()=>update('toolset','')})),h('span',{className:'eva-create-assistant-modal__spacer'}),h(Button,{theme:'solid',type:'primary',className:'eva-create-assistant-modal__submit',loading:busy,onClick:save},editing?'保存':'创建')));
  const inlineTarget=request.presentation==='personal-workspace'
    ? document.querySelector('.eva-personal-workspace__stage')
    : request.presentation==='ai-team-workspace'
      ? document.querySelector('.eva-ai-team__main')
      : null;
  return inlineTarget
    ? ReactDOM.createPortal(h('div',{className:'eva-assistant-editor-inline'},editor),inlineTarget)
    : h(Modal,{visible:true,title:null,footer:null,closable:false,closeOnEsc:!busy,maskClosable:!busy,onCancel:()=>!busy&&onClose(),width:920,className:'eva-editor-dialog',getPopupContainer:()=>host.current},editor);
}

function EvaChannelSearchPanel({store,scopeId,actorId,messages,locatedMessageId,onLocate,onClose}) {
  const h=React.createElement;
  const inputRef=reactExports.useRef(null),filterRef=reactExports.useRef(null),tabRefs=reactExports.useRef([]);
  const [keyword,setKeyword]=reactExports.useState(''),[query,setQuery]=reactExports.useState('');
  const [tab,setTab]=reactExports.useState('all'),[filterOpen,setFilterOpen]=reactExports.useState(false);
  const emptyFilters={senderIds:[],sort:'desc',datePreset:'',startDate:'',endDate:''};
  const [filters,setFilters]=reactExports.useState(emptyFilters),[draftFilters,setDraftFilters]=reactExports.useState(emptyFilters);
  const [senderQuery,setSenderQuery]=reactExports.useState(''),[status,setStatus]=reactExports.useState('idle');
  const [result,setResult]=reactExports.useState({items:[],nextCursor:null,hasMore:false,total:0,mediaKeywordBlocked:false});
  const [retryKey,setRetryKey]=reactExports.useState(0),[limitHit,setLimitHit]=reactExports.useState(false);
  const tabs=[['all','全部'],['message','消息'],['media','图片/视频'],['file','文件']];
  const senders=reactExports.useMemo(()=>{
    const map=new Map;
    for(const message of messages||[]){const sender=message?.sender;if(sender?.uid&&!map.has(sender.uid))map.set(sender.uid,sender);}
    return [...map.values()];
  },[messages]);
  const activeFilterCount=(filters.senderIds.length?1:0)+(filters.sort==='asc'?1:0)+(filters.datePreset||filters.startDate||filters.endDate?1:0);
  const criteria=reactExports.useMemo(()=>{
    let sentFrom='',sentTo='';
    if(filters.datePreset){
      const end=new Date(),start=new Date(end);
      start.setHours(0,0,0,0);end.setHours(23,59,59,999);
      if(filters.datePreset==='7')start.setDate(start.getDate()-6);
      if(filters.datePreset==='30')start.setDate(start.getDate()-29);
      sentFrom=start.toISOString();sentTo=end.toISOString();
    }else{
      if(filters.startDate)sentFrom=filters.startDate+'T00:00:00+08:00';
      if(filters.endDate)sentTo=filters.endDate+'T23:59:59+08:00';
    }
    return{keyword:query,tab,senderIds:filters.senderIds,sentFrom,sentTo,sort:filters.sort,pageSize:20};
  },[query,tab,filters]);
  const shouldSearch=!!query||activeFilterCount>0||tab==='file'||tab==='media';

  reactExports.useEffect(()=>{inputRef.current?.focus();},[]);
  reactExports.useEffect(()=>{
    const timer=window.setTimeout(()=>setQuery(keyword.trim()),250);
    return()=>window.clearTimeout(timer);
  },[keyword]);
  reactExports.useEffect(()=>{
    if(!shouldSearch){setStatus('idle');setResult({items:[],nextCursor:null,hasMore:false,total:0,mediaKeywordBlocked:false});return;}
    setStatus('loading');
    const timer=window.setTimeout(()=>{
      try{setResult(store.searchMessages(scopeId,actorId,messages,criteria));setStatus('ready');}
      catch(error){console.error('[EvaChannelSearch] search failed',error);setStatus('error');}
    },120);
    return()=>window.clearTimeout(timer);
  },[store,scopeId,actorId,messages,criteria,shouldSearch,retryKey]);
  reactExports.useEffect(()=>{
    const keydown=event=>{
      if(event.key!=='Escape')return;
      event.preventDefault();
      if(filterOpen)setFilterOpen(false);else onClose();
    };
    const pointer=event=>{if(filterOpen&&filterRef.current&&!filterRef.current.contains(event.target))setFilterOpen(false);};
    document.addEventListener('keydown',keydown,true);document.addEventListener('pointerdown',pointer,true);
    return()=>{document.removeEventListener('keydown',keydown,true);document.removeEventListener('pointerdown',pointer,true);};
  },[filterOpen,onClose]);

  const updateKeyword=event=>{
    const value=event.target.value;
    if(value.length>64){setKeyword(value.slice(0,64));setLimitHit(true);Toast.info('搜索关键词最多输入 64 个字符');return;}
    setKeyword(value);setLimitHit(false);
  };
  const clearKeyword=()=>{setKeyword('');setQuery('');setLimitHit(false);inputRef.current?.focus();};
  const openFilters=()=>{setDraftFilters({...filters,senderIds:[...filters.senderIds]});setSenderQuery('');setFilterOpen(value=>!value);};
  const toggleSender=uid=>setDraftFilters(value=>({...value,senderIds:value.senderIds.includes(uid)?value.senderIds.filter(id=>id!==uid):[...value.senderIds,uid]}));
  const applyFilters=()=>{setFilters({...draftFilters,senderIds:[...draftFilters.senderIds]});setFilterOpen(false);};
  const clearFilters=()=>{setDraftFilters(emptyFilters);setFilters(emptyFilters);setFilterOpen(false);};
  const changeTab=(next,index)=>{setTab(next);requestAnimationFrame(()=>tabRefs.current[index]?.focus());};
  const onTabKeyDown=(event,index)=>{
    if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
    event.preventDefault();const delta=event.key==='ArrowRight'?1:-1,next=(index+delta+tabs.length)%tabs.length;
    changeTab(tabs[next][0],next);
  };
  const loadMore=()=>{
    if(!result.nextCursor||status==='loading')return;
    try{const next=store.searchMessages(scopeId,actorId,messages,{...criteria,cursor:result.nextCursor});setResult(value=>({...next,items:[...value.items,...next.items]}));}
    catch(error){console.error('[EvaChannelSearch] load more failed',error);setStatus('error');}
  };
  const formatTime=value=>{
    const date=new Date(value);if(Number.isNaN(date.getTime()))return'';
    return new Intl.DateTimeFormat('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(date).replace(/\//g,'/');
  };
  const formatSize=size=>{if(!Number(size))return'';if(size<1024)return size+'B';if(size<1048576)return(Math.round(size/102.4)/10)+'KB';return(Math.round(size/104857.6)/10)+'MB';};
  const plainText=value=>String(value||'')
    .replace(/\[([^\]]+)\]\([^)]+\)/g,'$1')
    .replace(/(^|\n)\s{0,3}#{1,6}\s+/g,'$1')
    .replace(/(^|\n)\s*[-*+]\s+/g,'$1')
    .replace(/(^|\n)\s*>\s?/g,'$1')
    .replace(/\|(?:\s*:?-+:?\s*\|)+/g,'')
    .replace(/[*_`~]/g,'')
    .replace(/\s*\|\s*/g,' · ')
    .replace(/(?:\s*·\s*){2,}/g,' · ')
    .replace(/\s+/g,' ').trim();
  const contentOf=message=>message.file?.name||plainText(message.text||message.note||message.ref?.title||message.thread?.name)||'消息';
  const highlight=(text,value)=>{
    const source=String(text||''),needle=String(value||'').trim();if(!needle)return source;
    const escaped=needle.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),parts=source.split(new RegExp('('+escaped+')','ig'));
    return parts.map((part,index)=>part.toLocaleLowerCase('zh-CN')===needle.toLocaleLowerCase('zh-CN')?h('mark',{key:index},part):h(React.Fragment,{key:index},part));
  };
  const renderResult=message=>{
    const file=message.kind==='file'||message.file,media=['image','video'].includes(message.kind),content=contentOf(message);
    return h('article',{key:message.id,className:'eva-channel-search__result'+(locatedMessageId===message.id?' is-selected':''),'data-search-message-id':message.id},
      h('div',{className:'eva-channel-search__result-main'},
        file?h('span',{className:'eva-channel-search__file-icon','aria-hidden':'true'},h(FileText,{size:24})):media&&message.image?.url?h('img',{className:'eva-channel-search__media-thumb',src:message.image.url,alt:''}):h('img',{className:'eva-channel-search__avatar',src:window.EvaAvatar.personUri(message.sender?.uid||message.sender?.name),alt:''}),
        h('div',{className:'eva-channel-search__result-content'},
          h('div',{className:'eva-channel-search__result-meta'},h('span',null,message.sender?.name||'系统消息'),h('time',{dateTime:message.sentAt},formatTime(message.sentAt))),
          h('div',{className:'eva-channel-search__result-text',title:content},highlight(content,query)),
          file&&h('div',{className:'eva-channel-search__file-meta'},[message.file?.extension?.toUpperCase(),formatSize(message.file?.size)].filter(Boolean).join(' · ')),
          h('button',{type:'button',className:'eva-channel-search__locate',onClick:()=>onLocate(message.id),'aria-label':'定位到聊天位置：'+content},'点击定位到聊天'))));
  };
  const renderState=()=>{
    if(status==='loading')return h('div',{className:'eva-channel-search__state',role:'status'},h('span',{className:'eva-channel-search__spinner','aria-hidden':'true'}),h('span',null,'搜索中...'));
    if(status==='error')return h('div',{className:'eva-channel-search__state',role:'alert'},h(Search$1,{size:44,'aria-hidden':'true'}),h('span',null,'搜索失败，请稍后重试'),h('button',{type:'button',className:'wk-button wk-button--secondary',onClick:()=>setRetryKey(value=>value+1)},'重试'));
    if(status==='idle')return h('div',{className:'eva-channel-search__state'},h('span',{className:'eva-channel-search__empty-visual','aria-hidden':'true'},h(Search$1,{size:48})),h('span',null,'输入关键字或使用筛选查找消息记录'));
    if(result.mediaKeywordBlocked)return h('div',{className:'eva-channel-search__state'},h('span',{className:'eva-channel-search__empty-visual','aria-hidden':'true'},h(Search$1,{size:48})),h('span',null,'图片和视频暂不支持按关键词搜索，可按发送人或日期查找。'));
    if(!result.items.length)return h('div',{className:'eva-channel-search__state'},h('span',{className:'eva-channel-search__empty-visual','aria-hidden':'true'},h(Search$1,{size:48})),h('span',null,'暂无匹配结果'));
    return h(React.Fragment,null,result.items.map(renderResult),result.hasMore&&h('button',{type:'button',className:'eva-channel-search__load-more',onClick:loadMore},'加载更多'));
  };

  const header=h('header',{className:'eva-channel-search__header'},
    h('div',{className:'eva-channel-search__input-wrap'},
      h(Search$1,{size:16,'aria-hidden':'true'}),
      h('input',{ref:inputRef,type:'text',value:keyword,onChange:updateKeyword,placeholder:'输入关键字搜索','aria-label':'输入关键字搜索','aria-describedby':limitHit?'eva-search-limit':undefined}),
      keyword&&h('button',{type:'button',className:'eva-channel-search__clear','aria-label':'清空搜索关键词',onClick:clearKeyword},h(X,{size:16}))),
    h('button',{type:'button',className:'eva-channel-search__close','aria-label':'关闭搜索',onClick:onClose},h(X,{size:20})),
    limitHit&&h('span',{id:'eva-search-limit',className:'eva-channel-search__limit',role:'status'},'最多 64 字符'));
  const filterPanel=filterOpen&&h('section',{id:'eva-channel-search-filter',ref:filterRef,className:'eva-channel-search__filter-panel','aria-label':'搜索筛选条件'},
    h('div',{className:'eva-channel-search__filter-head'},h('strong',null,'筛选'),h('button',{type:'button',onClick:clearFilters},'清空')),
    h('div',{className:'eva-channel-search__field'},
      h('label',{htmlFor:'eva-search-sender'},'发送者'),
      h('input',{id:'eva-search-sender',type:'search',value:senderQuery,onChange:event=>setSenderQuery(event.target.value),placeholder:'搜索成员'}),
      h('div',{className:'eva-channel-search__sender-list'},senders.filter(sender=>sender.name?.includes(senderQuery)).map(sender=>h('label',{key:sender.uid},
        h('input',{type:'checkbox',checked:draftFilters.senderIds.includes(sender.uid),onChange:()=>toggleSender(sender.uid)}),
        h('img',{src:window.EvaAvatar.personUri(sender.uid),alt:''}),h('span',null,sender.name))))),
    h('div',{className:'eva-channel-search__field'},
      h('label',{htmlFor:'eva-search-sort'},'排序'),
      h('select',{id:'eva-search-sort',value:draftFilters.sort,onChange:event=>setDraftFilters(value=>({...value,sort:event.target.value}))},
        h('option',{value:'desc'},'时间倒序'),h('option',{value:'asc'},'时间正序'))),
    h('fieldset',{className:'eva-channel-search__field eva-channel-search__date'},
      h('legend',null,'发送时间'),
      h('div',{className:'eva-channel-search__date-presets'},[['1','今天'],['7','最近7天'],['30','最近30天']].map(([value,label])=>h('button',{key:value,type:'button',className:draftFilters.datePreset===value?'is-active':'',onClick:()=>setDraftFilters(filters=>({...filters,datePreset:value,startDate:'',endDate:''}))},label))),
      h('div',{className:'eva-channel-search__date-custom'},
        h('input',{type:'date','aria-label':'开始日期',value:draftFilters.startDate,onChange:event=>setDraftFilters(filters=>({...filters,datePreset:'',startDate:event.target.value}))}),
        h('span',null,'至'),
        h('input',{type:'date','aria-label':'结束日期',value:draftFilters.endDate,onChange:event=>setDraftFilters(filters=>({...filters,datePreset:'',endDate:event.target.value}))}))),
    h('footer',{className:'eva-channel-search__filter-actions'},
      h('button',{type:'button',className:'wk-button wk-button--secondary',onClick:()=>setFilterOpen(false)},'取消'),
      h('button',{type:'button',className:'wk-button wk-button--primary',onClick:applyFilters},'确定')));
  const toolbar=h('div',{className:'eva-channel-search__toolbar'},
    h('div',{className:'eva-channel-search__tabs',role:'tablist','aria-label':'搜索类型'},tabs.map(([key,label],index)=>h('button',{key,type:'button',ref:node=>tabRefs.current[index]=node,role:'tab','aria-selected':tab===key,tabIndex:tab===key?0:-1,className:'eva-channel-search__tab'+(tab===key?' is-active':''),onClick:()=>changeTab(key,index),onKeyDown:event=>onTabKeyDown(event,index)},label))),
    h('button',{type:'button',className:'eva-channel-search__filter-trigger'+(activeFilterCount?' is-active':''),'aria-expanded':filterOpen,'aria-controls':'eva-channel-search-filter',onClick:openFilters},
      h(Funnel,{size:16,'aria-hidden':'true'}),h('span',null,'筛选'),activeFilterCount?h('span',{className:'eva-channel-search__filter-count'},activeFilterCount):null),
    filterPanel);
  return h('aside',{className:'ch-right-panel ch-right-panel--search eva-channel-search','aria-label':'查找聊天内容','data-screen-label':'群聊消息搜索'},header,toolbar,
    h('div',{className:'eva-channel-search__results',role:'tabpanel','aria-label':tabs.find(item=>item[0]===tab)?.[1]+'搜索结果'},renderState()));
}
// Mirrors Octo ChatComposer.buildPlaceholder and its zh-CN translation keys.
function evaIMPlaceholder(name) {
  return name ? '发送给 ' + name : '发送消息';
}
function evaTeamThreadSource(snapshot, identity, selected) {
  const records=snapshot.sessions.filter(record=>record.identityId===identity.id);
  // An unselected identity gets an empty draft topic, not another conversation's history.
  const visible=selected?records:[];
  return window.EvaAIPrivateConversations.source({identityId:identity.id,name:identity.name,
    appearance:evaIdentityAppearance(identity),records:visible,selectedId:selected?.id,
    messages:id=>(visible.find(record=>record.id===id)?.messages||[]).flatMap((message,index,all)=>{
      const day=new Date(message.time).toLocaleDateString('zh-CN',{month:'long',day:'numeric'});
      const divider=index===0||new Date(message.time).toDateString()!==new Date(all[index-1].time).toDateString();
      return [...(divider?[{kind:'divider',text:day}]:[]),{...message,
        sender:message.sender.uid==='self'?SENDERS['u-wangyilin']:{...message.sender,name:identity.name,identityAppearance:evaIdentityAppearance(identity)},
        time:new Date(message.time).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false})}];
    })});
}

function EvaAITeamPage() {
  const h = React.createElement, store = window.EvaAITeam;
  const snapshot = reactExports.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const digitalStore=window.EvaDigitalEmployeesStore;
  const groupStore=window.EvaMyAITeamGroup;
  reactExports.useSyncExternalStore(groupStore.subscribe,groupStore.getSnapshot,groupStore.getSnapshot);
  reactExports.useSyncExternalStore(digitalStore.subscribe,digitalStore.getSnapshot,digitalStore.getSnapshot);
  const digitalEmployees=digitalStore.teamIds().map(id=>digitalStore.get(id)).filter(Boolean);
  const {search:teamSearch}=useLocation(),requestedIdentityId=new URLSearchParams(teamSearch).get('evaIdentity');
  // 本地助理、云端分身和数字员工都是“我的 AI”的独立对话入口；
  // 它们各自维护会话，不能借用另一个身份的当前会话。
  const teamIdentities = snapshot.identities.filter(i=>i.role==='assistant'||i.role==='persona'||i.role==='employee');
  const availableIdentities=[...teamIdentities,...digitalEmployees];
  const requestedIdentity=availableIdentities.find(i=>i.id===requestedIdentityId);
  const [selection, setSelection] = reactExports.useState(() => {const id=requestedIdentity?.id||groupStore.id;return {identityId:id,sessionId:snapshot.sessions.find(s=>s.identityId===id)?.id||digitalStore.sessions(id)[0]?.id};});
  const [rename,setRename]=reactExports.useState(null),[renameTitle,setRenameTitle]=reactExports.useState(''),[renameError,setRenameError]=reactExports.useState('');
  const openRename=(identityId,record)=>{setRename({identityId,id:record.id});setRenameTitle(record.title);setRenameError('');};
  const saveRename=()=>{try{(digitalEmployees.some(i=>i.id===rename.identityId)?digitalStore:store).renameThread(rename.identityId,rename.id,renameTitle);setRename(null);}catch(e){setRenameError(e.message);}};
  const [collapsed,setCollapsed] = reactExports.useState(()=>requestedIdentity?{[requestedIdentity.id]:false}:{});
  reactExports.useEffect(()=>{
    if(!requestedIdentity)return;
    setSelection({identityId:requestedIdentity.id,sessionId:snapshot.sessions.find(s=>s.identityId===requestedIdentity.id)?.id||digitalStore.sessions(requestedIdentity.id)[0]?.id});
    setCollapsed(value=>({...value,[requestedIdentity.id]:false}));
  },[teamSearch,requestedIdentity?.id]);
  const [collapsedGroups,setCollapsedGroups]=reactExports.useState({assistant:false,persona:false,digital:false});
  const rail = reactExports.useRef(null);
  const [error,setError] = reactExports.useState('');
  const host = reactExports.useRef(null);
  const identity = teamIdentities.find(i=>i.id===selection.identityId);
  const employee = digitalEmployees.find(i=>i.id===selection.identityId);
  const session = snapshot.sessions.find(s=>s.id===selection.sessionId&&s.identityId===identity?.id);
  const draftKey = session?.id || (identity ? 'draft:'+identity.id : '');
  const status = i => i.role==='assistant' ? (i.status==='offline'?'本地离线':'本地已连接') : ({synced:'已自动同步',syncing:'正在同步',waiting:'等待记忆同步',error:'同步失败'}[i.syncStatus]);
  const choose = (identityId,sessionId) => {window.__evaOpenAssistantEditor?.(null);setSelection({identityId,sessionId});setError('');};
  const newConversation = id => {setCollapsed(value=>({...value,[id]:false}));choose(id,digitalEmployees.some(item=>item.id===id)?digitalStore.createThread(id):store.createThread(id));};
  const employeeSessions=employee?digitalStore.sessions(employee.id):[];
  const employeeSession=employeeSessions.find(item=>item.id===selection.sessionId)||employeeSessions[0];

  const groupSelected=selection.identityId===groupStore.id;
  const fixedMembers=[{id:'u-wangyilin',name:'王宜林',kind:'human'},
    ...teamIdentities.map(item=>({...item,kind:'ai-direct',identityAppearance:evaIdentityAppearance(item)})),
    ...digitalEmployees.map(item=>({...item,kind:'ai-direct',identityAppearance:digitalStore.appearance(item)}))];
  const source = groupSelected?groupStore.source(fixedMembers,selection.sessionId):employee?digitalStore.conversationSource(employee.id,employeeSession?.id):identity ? messageSource('my-ai', snapshot, identity, session) : null;
  if(groupSelected){
    source.onCreateThread=record=>{const id=groupStore.createThread(record);setCollapsed(value=>({...value,[groupStore.id]:false}));return id;};
    source.onUpdateThread=(id,patch)=>{groupStore.updateThread(id,patch);if(patch.deleted&&selection.sessionId===id)choose(groupStore.id,null);};
    source.onSelectThread=id=>choose(groupStore.id,id);
  }
  if(source&&!employee&&!groupSelected){
    source.initialDraft=snapshot.drafts[draftKey]||'';
    source.onDraftChange=text=>store.setDraft(draftKey,text);
    source.composerDisabled=identity.status==='offline';
    source.onSend=text=>{try{const id=store.sendMessage(identity.id,session?.id||null,text);setError('');if(!session)setSelection({identityId:identity.id,sessionId:id});return true;}catch(e){setError(e.message);return false;}};
  }
  if(source&&!groupSelected){
    const current=employee?employeeSession:session;
    const owner=employee?digitalStore:store,ownerId=employee?.id||identity?.id;
    source.conversationActions=current?{
      rename:name=>owner.renameThread(ownerId,current.id,name),
      pinned:!!current.pinned,
      togglePinned:value=>employee?owner.setSessionFlag(ownerId,current.id,'pinned',value):owner.setSessionFlag(current.id,'pinned',value)
    }:null;
  }
  function conversationMenu(identityId,record,employee=false){
    const owner=employee?digitalStore:store;
    return h(Dropdown,{trigger:'click',position:'bottomRight',clickToHide:true,getPopupContainer:()=>rail.current,
      render:h(Dropdown.Menu,null,
        h(Dropdown.Item,{onClick:()=>openRename(identityId,record)},'重命名'),
        h(Dropdown.Item,{onClick:()=>employee?owner.setSessionFlag(identityId,record.id,'pinned',!record.pinned):owner.setSessionFlag(record.id,'pinned',!record.pinned)},record.pinned?'取消置顶':'置顶'),
        h(Dropdown.Item,{onClick:()=>{if(employee)owner.deleteSession(identityId,record.id);else owner.deleteSession(record.id);if(selection.sessionId===record.id){const remaining=employee?owner.sessions(identityId):owner.getSnapshot().sessions.filter(s=>s.identityId===identityId).sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)||b.updatedAt.localeCompare(a.updatedAt));choose(identityId,remaining[0]?.id||null);}}},'删除'))},
      h('span',{className:'eva-ai-team__menu-anchor'},h(Button,{theme:'borderless',type:'tertiary',size:'small',icon:h(EllipsisIcon),title:'会话操作','aria-label':'会话操作 '+record.title})));
  }
  function identityItem(i){
    const sessions=snapshot.sessions.filter(s=>s.identityId===i.id).sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)||b.updatedAt.localeCompare(a.updatedAt));
    const expanded=collapsed[i.id]===false, abnormal=i.status==='offline'||(i.role==='persona'&&i.syncStatus!=='synced');
    return h('section',{className:'eva-ai-team__identity',key:i.id},
      h('div',{className:'eva-ai-team__identity-heading'},
        h('button',{type:'button',className:'eva-ai-team__identity-button','aria-expanded':expanded,'aria-controls':'ai-sessions-'+i.id,onClick:()=>{setCollapsed(value=>({...value,[i.id]:expanded}));if(identity?.id!==i.id)choose(i.id,sessions[0]?.id||null);}},
          h(EvaAIIdentityAvatar,{appearance:evaIdentityAppearance(i),size:22}),
          h('span',{className:'eva-identity-name-row'},h('span',{className:'eva-ai-team__identity-name eva-identity-name-text',title:i.name},i.name),h(AiBadge,{size:'small'})),
          h(ChevronRight,{size:12,className:'eva-ai-team__chevron'+(expanded?' is-expanded':'')})),
        h(TooltipComponent,{content:'新建会话',position:'right'},h('span',{className:'eva-ai-team__new-session-anchor'},h('button',{type:'button',className:'eva-ai-team__identity-action eva-ai-team__new-session'+(identity?.id===i.id?' is-active':''),'aria-label':'新建会话',onClick:event=>{event.stopPropagation();newConversation(i.id);}},h(Plus$c,{size:16}))))),
      abnormal&&h('p',{className:'eva-ai-team__identity-status'},status(i)),
      expanded&&h('div',{className:'eva-ai-team__sessions',id:'ai-sessions-'+i.id},
        identity?.id===i.id&&!session&&h('button',{type:'button',className:'eva-ai-team__session is-selected','aria-current':'true',onClick:()=>choose(i.id,null)},h('span',{className:'eva-ai-team__session-title'},'新对话')),
        sessions.map(s=>h('div',{key:s.id,className:'eva-ai-team__session-row'+(session?.id===s.id?' is-selected':'')},
          h('button',{type:'button',className:'eva-ai-team__session','aria-current':session?.id===s.id?'true':undefined,onClick:()=>choose(i.id,s.id)},h('span',{className:'eva-ai-team__session-title',title:s.title},s.title),h('span',{className:'eva-ai-team__session-time'},new Date(s.updatedAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false}))),
          h('div',{className:'eva-ai-team__session-actions'},conversationMenu(i.id,s)))),
        sessions.length===0&&!(identity?.id===i.id&&!session)&&h('button',{type:'button',className:'eva-ai-team__session',onClick:()=>newConversation(i.id)},h('span',{className:'eva-ai-team__session-title'},'新建会话'))));
  }
  function employeeItem(item){
    const sessions=digitalStore.sessions(item.id), expanded=collapsed[item.id]===false;
    return h('section',{className:'eva-ai-team__identity',key:item.id},
      h('div',{className:'eva-ai-team__identity-heading'},
        h('button',{type:'button',className:'eva-ai-team__identity-button','aria-expanded':expanded,'aria-controls':'ai-sessions-'+item.id,onClick:()=>{setCollapsed(value=>({...value,[item.id]:expanded}));if(employee?.id!==item.id)choose(item.id,sessions[0]?.id||null);}},
          window.EvaAIIdentity.avatar(digitalStore.appearance(item),22,h),
          h('span',{className:'eva-identity-name-row'},h('span',{className:'eva-ai-team__identity-name eva-identity-name-text',title:item.name},item.name),h(AiBadge,{size:'small'})),
          h(ChevronRight,{size:12,className:'eva-ai-team__chevron'+(expanded?' is-expanded':'')})),
        h(TooltipComponent,{content:'新建会话',position:'right'},h('span',{className:'eva-ai-team__new-session-anchor'},h('button',{type:'button',className:'eva-ai-team__identity-action eva-ai-team__new-session'+(employee?.id===item.id?' is-active':''),'aria-label':'新建会话',onClick:event=>{event.stopPropagation();newConversation(item.id);}},h(Plus$c,{size:16})))),
        h(Dropdown,{trigger:'click',position:'bottomRight',clickToHide:true,getPopupContainer:()=>rail.current,render:h(Dropdown.Menu,null,
          h(Dropdown.Item,{onClick:()=>newConversation(item.id)},'新建对话'),
          h(Dropdown.Item,{onClick:()=>{digitalStore.removeFromTeam(item.id);if(employee?.id===item.id){const next=teamIdentities[0]||digitalEmployees.find(candidate=>candidate.id!==item.id);choose(next?.id,next&&snapshot.identities.some(candidate=>candidate.id===next.id)?snapshot.sessions.find(candidate=>candidate.identityId===next.id)?.id:digitalStore.sessions(next?.id)[0]?.id);}}},'从我的 AI 团队移除'))},
          h('span',{className:'eva-ai-team__menu-anchor'},h(Button,{theme:'borderless',type:'tertiary',size:'small',className:'eva-ai-team__more',icon:h(EllipsisIcon,{size:16}),'aria-label':item.name+'的更多操作'})))),
      expanded&&h('div',{className:'eva-ai-team__sessions',id:'ai-sessions-'+item.id},
        sessions.map(itemSession=>{const selected=employee?.id===item.id&&employeeSession?.id===itemSession.id;return h('div',{key:itemSession.id,className:'eva-ai-team__session-row'+(selected?' is-selected':'')},
          h('button',{type:'button',className:'eva-ai-team__session','aria-current':selected?'true':undefined,onClick:()=>choose(item.id,itemSession.id)},h('span',{className:'eva-ai-team__session-title',title:itemSession.title},itemSession.title),h('span',{className:'eva-ai-team__session-time'},new Date(itemSession.updatedAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false}))),
          h('div',{className:'eva-ai-team__session-actions'},conversationMenu(item.id,itemSession,true)));}),
        !sessions.length&&h('button',{type:'button',className:'eva-ai-team__session',onClick:()=>newConversation(item.id)},h('span',{className:'eva-ai-team__session-title'},'新建会话'))));
  }
  function roleGroup(role,label,items) {
    const groupId='eva-ai-team-group-'+role, groupCollapsed=collapsedGroups[role];
    return h('section',{className:'eva-ai-team__role-group'+(groupCollapsed?' is-collapsed':''),key:role,'aria-label':label},
      h('button',{type:'button',className:'eva-ai-team__group-toggle','aria-expanded':!groupCollapsed,'aria-controls':groupId,onClick:()=>setCollapsedGroups(value=>({...value,[role]:!value[role]}))},
        h(ChevronRight,{size:12,className:'eva-ai-team__group-chevron'+(groupCollapsed?'':' is-expanded')}),
        h('span',{className:'eva-ai-team__group-title'},label),h('span',{className:'eva-ai-team__group-count'},items.length)),
      !groupCollapsed&&h('div',{className:'eva-ai-team__group-content',id:groupId},items.map(role==='digital'?employeeItem:identityItem)));
  }
  const personas=snapshot.identities.filter(i=>i.role==='persona');
  return h('div',{className:'eva-ai-team'},
    h('aside',{className:'eva-ai-team__sidebar','aria-label':'我的 AI 团队',ref:rail},
      h('div',{className:'eva-conversation-rail-resizer',role:'separator','aria-label':'调整中间栏宽度','aria-orientation':'vertical',tabIndex:0,'data-eva-conversation-rail-resizer':true}),
      h('div',{className:'eva-ai-team__roles'},h('div',{className:'eva-ai-team__fixed-group-tree'},
        h(ConvCompactItem,{name:'我的 AI 团队',avatarUrl:window.EvaAvatar.uri({kind:'group',id:groupStore.id}),selected:groupSelected&&!selection.sessionId,onClick:()=>{setCollapsed(value=>({...value,[groupStore.id]:value[groupStore.id]===false}));choose(groupStore.id,null);}}),
        collapsed[groupStore.id]===false&&groupStore.source(fixedMembers).channels[0].threads.filter(item=>item.status!==2).map(item=>h(ConvCompactItem,{key:item.id,isThread:true,name:item.name,selected:groupSelected&&selection.sessionId===item.id,onClick:()=>choose(groupStore.id,item.id)}))),roleGroup('persona','云端分身',personas),roleGroup('assistant','个人助理',teamIdentities.filter(i=>i.role==='assistant')),roleGroup('digital','数字员工',digitalEmployees))),
    h('main',{className:'eva-ai-team__main'},
      snapshot.storageWarning&&h('p',{className:'eva-ai-team__notice',role:'status'},snapshot.storageWarning),
      groupSelected?h(ChannelsView,{key:groupStore.id+':'+(selection.sessionId||'group'),source,onOpenTask:()=>{}}):employee?h(ChannelsView,{key:'digital-chat:'+employee.id+':'+(employeeSession?.id||'empty'),source,onOpenTask:()=>{}}):identity?h(React.Fragment,null,
        identity.role==='assistant'&&identity.status==='offline'&&h('p',{className:'eva-ai-team__notice',role:'status'},'本地助理离线，历史记录仍可查看；上线后可继续发送。'),
        identity.role==='persona'&&identity.syncStatus==='error'&&h(Button,{theme:'borderless',onClick:()=>store.syncPersona(identity.id).catch(e=>setError(e.message))},'重试同步'),
        error&&h('p',{className:'eva-ai-team__error',role:'alert'},error),
        h(ChannelsView,{key:draftKey,source,onOpenTask:()=>{}})):
      h('div',{className:'eva-ai-team__empty'},h(Users,{size:32}),h('h2',null,'暂无可用的数字员工'),h('p',null,'接入公司数字员工后，即可在这里使用。'))),
    h('div',{className:'eva-ai-team__modal-host',ref:host}),
    h(Modal,{visible:!!rename,title:'重命名会话',className:'eva-ai-team__modal',getPopupContainer:()=>host.current,onCancel:()=>setRename(null),onOk:saveRename,okText:'保存',cancelText:'取消',width:420},
      h(ForwardInput,{value:renameTitle,onChange:setRenameTitle,maxLength:50,'aria-label':'会话名称',autoFocus:true}),renameError&&h('p',{role:'alert',className:'eva-ai-team__error'},renameError)));
}

    // Octo-Web ConversationListGrouped: handle-only PointerSensor (6px),
    // vertical sorting, parent channels carry their child threads.
    function EvaFollowGrip(props){
      const Grip=reactExports.useMemo(()=>createLucideIcon('GripVertical',[
        ['circle',{cx:'9',cy:'12',r:'1',key:'1'}],['circle',{cx:'9',cy:'5',r:'1',key:'2'}],
        ['circle',{cx:'9',cy:'19',r:'1',key:'3'}],['circle',{cx:'15',cy:'12',r:'1',key:'4'}],
        ['circle',{cx:'15',cy:'5',r:'1',key:'5'}],['circle',{cx:'15',cy:'19',r:'1',key:'6'}]
      ]),[]);
      return React.createElement(Grip,{size:14,'aria-hidden':true,...props});
    }
    function EvaFollowChannel({id,categoryId,enabled,children}){
      const drag=useSortable({id:'item:'+id,data:{type:'item',categoryId},disabled:!enabled});
      const items=React.Children.toArray(children);
      if(!enabled)return React.createElement(React.Fragment,null,children);
      items[0]=React.cloneElement(items[0],{dragHandleProps:{...drag.attributes,...drag.listeners,ref:drag.setActivatorNodeRef,'aria-label':'拖动排序：'+items[0].props.name}});
      return React.createElement('div',{ref:drag.setNodeRef,className:'eva-follow-channel'+(drag.isDragging?' is-dragging':''),style:{transform:CSS$1.Transform.toString(drag.transform),transition:drag.transition}},items);
    }
    function EvaConversationCategoryEditor({store,actorId,record,channels,onClose,onSaved}){
      const h=React.createElement, [name,setName]=reactExports.useState(record.name||''),[error,setError]=reactExports.useState('');
      const available=channels.filter(c=>!c.category?.startsWith('space:'));
      const [selected,setSelected]=reactExports.useState(()=>record.id?available.filter(c=>c.category===record.id).map(c=>c.id):[]);
      return h(Modal,{visible:true,title:record.id?'编辑分组':'创建分组',width:440,okText:record.id?'保存':'创建',cancelText:'取消',onCancel:onClose,onOk:()=>{try{store.saveConversationCategory(actorId,{id:record.id,name,channelIds:selected,availableChannels:available});onSaved();}catch(e){setError(e.message);}}},
        h(ForwardInput,{value:name,onChange:setName,maxLength:50,placeholder:'输入分组名称','aria-label':'分组名称',autoFocus:true}),
        h('p',null,'选择放入此分组的非项目会话（可选）'),
        h('div',{className:'eva-category-conversations'},available.map(c=>h('label',{key:c.id,className:'eva-category-conversation'},
          h('input',{type:'checkbox',checked:selected.includes(c.id),onChange:e=>setSelected(ids=>e.target.checked?[...ids,c.id]:ids.filter(id=>id!==c.id))}),
          h('img',{src:c.identityAvatarUrl||window.EvaAvatar.uri({kind:c.id.startsWith('dm-')?'person':'group',id:c.id}),width:22,height:22,alt:''}),h('span',null,c.name)))),
        error&&h('p',{role:'alert'},error));
    }
    function EvaFollowCategory({categoryId,sortableItems,children,title,extra}){
      const drag=useSortable({id:'category:'+categoryId,data:{type:'category'}});
      const project=categoryId.startsWith('space:')?loadSpaces().find(p=>p.id===categoryId.slice(6)):null;
      return React.createElement('section',{ref:drag.setNodeRef,className:'eva-follow-category'+(drag.isDragging?' is-dragging':''),style:{transform:CSS$1.Transform.toString(drag.transform),transition:drag.transition},'aria-label':title.props.name},
        React.createElement('div',{className:'eva-follow-category-title'},
          React.createElement('button',{type:'button',className:'eva-follow-category-handle',...drag.attributes,...drag.listeners,ref:drag.setActivatorNodeRef,'aria-label':'拖动分组：'+title.props.name,onClick:e=>e.stopPropagation()},React.createElement(EvaFollowGrip)),project&&React.createElement(LayoutGrid,{size:14,style:{flexShrink:0,color:window.EvaProjectAppearance.css(project).accent},"aria-hidden":true}),title,extra),
        React.createElement(SortableContext,{items:sortableItems.map(id=>'item:'+id),strategy:verticalListSortingStrategy},children));
    }
    function EvaFollowList({store,actorId,categories,channels,children}){
      const sensors=useSensors$1(useSensor(PointerSensor,{activationConstraint:{distance:6}}),useSensor(KeyboardSensor,{coordinateGetter:sortableKeyboardCoordinates}));
      const collision=args=>closestCenter({...args,droppableContainers:args.droppableContainers.filter(c=>{
        const active=args.active.data.current,target=c.data.current;
        return active?.type===target?.type&&(active?.type==='category'||active?.categoryId===target?.categoryId);
      })});
      const onDragEnd=({active,over})=>{
        if(!over||active.id===over.id)return;
        const data=active.data.current,target=over.data.current;
        if(data?.type!==target?.type)return;
        const category=data.type==='category';
        if(!category&&data.categoryId!==target.categoryId)return;
        const bucket=category?'categories':'channels:'+data.categoryId;
        const list=category?categories:store.followOrder(actorId,bucket,channels.filter(c=>c.category===data.categoryId));
        const prefix=category?'category:':'item:',from=list.findIndex(c=>prefix+c.id===active.id),to=list.findIndex(c=>prefix+c.id===over.id);
        if(from<0||to<0)return;
        store.setFollowOrder(actorId,bucket,arrayMove(list,from,to).map(c=>c.id));
      };
      return React.createElement(DndContext,{sensors,collisionDetection:collision,onDragEnd},
        React.createElement(SortableContext,{items:categories.map(c=>'category:'+c.id),strategy:verticalListSortingStrategy},children));
    }

    function cut(needle,replacement,label){source=root.__evaCut(source,needle,replacement,'IM '+label);}
    cut(
      'externalBadge:Mt,avatarUrl:It}){return React.createElement("div",{className:classNames("wk-conv-compact-item"',
      'externalBadge:Mt,avatarUrl:It,threadsExpanded:evaThreadsExpanded}){return React.createElement("div",{className:classNames("wk-conv-compact-item"',
      '会话行展开状态属性'
    );
    cut(
      'React.createElement("span",{className:"wk-conv-compact-name"},rt),Mt&&',
      'React.createElement("span",{className:"wk-conv-compact-name",onDoubleClick:Dt=>{xt&&(Dt.preventDefault(),Dt.stopPropagation(),Pt?.(Dt))}},rt),Mt&&',
      '群名双击展开收起'
    );
    cut(
      'avatarUrl:window.EvaAvatar.uri({kind:ci.id.startsWith("dm-")?"person":"group",id:ci.id,color:ci.color}),selected:ci.id===Ct&&!Pt',
      'avatarUrl:ci.identityAvatarUrl??window.EvaAvatar.uri({kind:ci.id.startsWith("dm-")?"person":"group",id:ci.id,color:ci.color}),threadsExpanded:Zi,selected:ci.id===Ct&&!Pt',
      '群展开状态数据流'
    );
    cut(
      '(St||gt>0)&&React.createElement("span",{className:"wk-conv-compact-badges"},St&&React.createElement("span",{className:"wk-conv-compact-mention","aria-hidden":"true"},"@我"),gt>0&&React.createElement("span",{className:"wk-conv-compact-badge"},gt>99?"99+":gt)),!1&&',
      '(St||gt>0)&&React.createElement("span",{className:"wk-conv-compact-badges"},St&&React.createElement("span",{className:"wk-conv-compact-mention","aria-hidden":"true"},"@我"),gt>0&&React.createElement("span",{className:"wk-conv-compact-badge"},gt>99?"99+":gt)),xt&&React.createElement("span",{className:`wk-conv-compact-thread-toggle${evaThreadsExpanded?" is-expanded":" is-collapsed"}`,role:"button",tabIndex:0,title:evaThreadsExpanded?"收起子区":"展开子区","aria-label":evaThreadsExpanded?"收起子区":"展开子区",onClick:Dt=>{Dt.stopPropagation(),Pt?.(Dt)},onKeyDown:Dt=>{(Dt.key==="Enter"||Dt.key===" ")&&(Dt.preventDefault(),Dt.stopPropagation(),Pt?.(Dt))}},React.createElement(ChevronDown,{size:16})),!1&&',
      '群展开状态图标'
    );
    cut(
      'React.createElement("span",{className:`wk-category-header__arrow${mt?" wk-category-header__arrow--collapsed":""}`},React.createElement("svg",{viewBox:"0 0 16 16",width:"16",height:"16"},React.createElement("path",{d:"M4 6l4 5 4-5z",fill:"currentColor"})))',
      'React.createElement("span",{className:`wk-category-header__arrow${mt?" wk-category-header__arrow--collapsed":""}`},React.createElement(ChevronRight,{size:12,className:"eva-ai-team__group-chevron"+(mt?"":" is-expanded"),"aria-hidden":true}))',
      '项目一级分组使用共享 Lucide 折叠箭头'
    );
    cut("function messageSource(){const rt=loadSpaces(),ct={},ut=rt.map(mt=>({id:\"space:\"+mt.id,name:mt.name})),pt=rt.flatMap(mt=>channelsOfSpace(mt.id).map(gt=>(ct[gt.id]=mt.name,{...gt,category:\"space:\"+mt.id})));DMS.forEach(mt=>{ct[mt.id]=\"私聊消息\"});return{channels:[...pt,...DMS.map(mt=>({...mt,category:\"scope:dm\"}))],cats:[...ut,{id:\"scope:dm\",name:\"私聊消息\"}],messages:{...CHANNEL_MESSAGES,...OWN_MESSAGES},threadMessages:{...THREAD_MESSAGES,...OWN_THREAD_MESSAGES},scopeNameOf:ct}}",
      "function messageSource(evaMessageMode,evaSnapshot,evaIdentity,evaSession){if(evaMessageMode===\"my-ai\"){if(!evaIdentity)return{channels:[],cats:[],messages:{},threadMessages:{},scopeNameOf:{}};return evaTeamThreadSource(evaSnapshot,evaIdentity,evaSession)}const rt=loadSpaces(),ct={},ut=rt.map(mt=>({id:\"space:\"+mt.id,name:mt.name})),pt=rt.flatMap(mt=>channelsOfSpace(mt.id).map(gt=>(ct[gt.id]=mt.name,{...gt,category:\"space:\"+mt.id}))),evaDemo=window.__EVA_IM_DEMO??{channels:[],messages:{}},evaTeamChannels=evaDemo.channels.filter(mt=>!mt.id.startsWith(\"im-ai-\")&&!mt.id.startsWith(\"im-pilot-\"));DMS.forEach(mt=>{ct[mt.id]=\"私聊消息\"});evaTeamChannels.forEach(mt=>{ct[mt.id]=\"精选会话\"});return{channels:[...pt,...DMS.map(mt=>({...mt,category:\"scope:dm\"})),...evaTeamChannels.map(mt=>({...mt,category:\"scope:demo\"}))],cats:[...ut,{id:\"scope:dm\",name:\"私聊消息\"}],messages:{...CHANNEL_MESSAGES,...OWN_MESSAGES,...evaDemo.messages},threadMessages:{...THREAD_MESSAGES,...OWN_THREAD_MESSAGES},scopeNameOf:ct}}", "messageSource role adapter");
    cut("MessagesPage=()=>{const rt=reactExports.useMemo(()=>messageSource(),[]);return React.createElement(\"div\",{className:\"eva-msg eva-channel-surface\",\"data-eva-channel-surface\":\"global\"},React.createElement(ChannelsView,{source:rt,onOpenTask:()=>{}}))}",
      "MessagesPage=()=>{const{search:evaMessageSearch}=useLocation(),evaMessageMode=new URLSearchParams(evaMessageSearch).get(\"evaIM\")===\"my-ai\"?\"my-ai\":\"all\",evaLiveMemberStore=evaMembers().store,evaLiveMemberRevision=reactExports.useSyncExternalStore(evaLiveMemberStore.subscribe,evaLiveMemberStore.getSnapshot),rt=reactExports.useMemo(()=>messageSource(evaMessageMode),[evaMessageMode,evaLiveMemberRevision]);return React.createElement(\"div\",{className:\"eva-msg eva-channel-surface\",\"data-eva-channel-surface\":\"global\",\"data-eva-message-mode\":evaMessageMode},evaMessageMode===\"my-ai\"?React.createElement(EvaAITeamPage,{key:evaMessageMode}):React.createElement(ChannelsView,{key:evaMessageMode,source:rt,onOpenTask:()=>{}}))}", "MessagesPage role host");
    cut("React.createElement(\"div\",{className:\"ch-layout\"},React.createElement(\"div\",{className:\"ch-list\"}",
      "React.createElement(\"div\",{className:\"ch-layout\"},!ct?.conversationOnly&&React.createElement(\"div\",{className:\"ch-list\"}", "conversation-only sidebar slot");
    cut('!ct?.conversationOnly&&React.createElement("div",{className:"ch-list"},React.createElement("div",{className:"ch-list__top"}',
      '!ct?.conversationOnly&&React.createElement("div",{className:"ch-list"},React.createElement("div",{className:"eva-conversation-rail-resizer",role:"separator","aria-label":"调整中间栏宽度","aria-orientation":"vertical",tabIndex:0,"data-eva-conversation-rail-resizer":true}),React.createElement("div",{className:"ch-list__top"}', "shared conversation rail resizer");
    cut("Sa=pt.find(ci=>ci.id===Ct)??pt[0]??EMPTY_CHANNEL",
      "Sa=(ct?.conversationOnly?ct.channels[0]:pt.find(ci=>ci.id===Ct)??pt[0])??EMPTY_CHANNEL", "current selected source");
    cut("di=ci=>{const Zi=(ci??la).trim();Zi&&(vi(va,Zi),aa(\"\"),requestAnimationFrame(()=>da.current?.scrollTo({top:da.current.scrollHeight,behavior:\"smooth\"})))}",
      "di=ci=>{const Zi=(ci??la).trim();if(!Zi)return false;if(ct?.onSend){const sent=ct.onSend(Zi);if(sent===false)return false;}else vi(va,Zi);aa(\"\");requestAnimationFrame(()=>da.current?.scrollTo({top:da.current.scrollHeight,behavior:\"smooth\"}));return true}", "store send callback");
    cut("React.createElement(EvaIMComposer,{placeholder:`在 ${fa?fa.name:Sa.name} 中回复…`,onSend:di})",
      "React.createElement(EvaIMComposer,{placeholder:ct?.composerDisabled?\"本地助理离线\":Sa.chatType===\"direct\"?`发送给 ${Sa.name}…`:`在 ${fa?fa.name:Sa.name} 中回复…`,onSend:di,initialDraft:ct?.initialDraft,onDraftChange:ct?.onDraftChange,disabled:ct?.composerDisabled})", "shared composer source configuration");
    cut("EvaIMComposer=({placeholder:rt,onSend:ct})=>{const[ut,pt]=reactExports.useState(\"\"),mt=reactExports.useRef(null),gt=()=>{const St=ut.trim();St&&(ct(St),pt(\"\"),mt.current&&(mt.current.textContent=\"\"))}",
      "EvaIMComposer=({placeholder:rt,onSend:ct,initialDraft:evaInitialDraft=\"\",onDraftChange:evaDraftChange,disabled:evaDisabled=false})=>{const[ut,pt]=reactExports.useState(evaInitialDraft),mt=reactExports.useRef(null);reactExports.useEffect(()=>{if(mt.current)mt.current.textContent=evaInitialDraft},[]);const gt=()=>{if(evaDisabled)return;const St=ut.trim();if(St&&ct(St)!==false){pt(\"\");if(mt.current)mt.current.textContent=\"\"}}", "shared composer persisted draft");
    cut("contentEditable:!0,suppressContentEditableWarning:!0,role:\"textbox\",\"aria-label\":rt,\"data-placeholder\":rt,onInput:St=>pt(St.currentTarget.textContent??\"\")",
      "contentEditable:!evaDisabled,suppressContentEditableWarning:!0,role:\"textbox\",\"aria-disabled\":evaDisabled,\"aria-label\":rt,\"data-placeholder\":rt,onInput:St=>{const text=St.currentTarget.textContent??\"\";pt(text);evaDraftChange?.(text)}", "shared composer change callback");
    cut("React.createElement(\"img\",{className:\"collab-avatar eva-entity-avatar\",style:{width:24,height:24},src:window.EvaAvatar.uri({kind:Sa.id.startsWith(\"dm-\")?\"person\":\"group\",id:Sa.id,color:Sa.color}),alt:\"\"})","Sa.identityAppearance?React.createElement(EvaAIIdentityAvatar,{appearance:Sa.identityAppearance,size:28}):React.createElement(\"img\",{className:\"collab-avatar eva-entity-avatar\",style:{width:24,height:24},src:window.EvaAvatar.uri({kind:Sa.id.startsWith(\"dm-\")?\"person\":\"group\",id:Sa.id,color:Sa.color}),alt:\"\"})","conversation identity avatar");
    cut("avatarUrl:avatarUri(rt.sender.uid??rt.sender.name,rt.sender.color),senderName:rt.sender.name","avatarUrl:rt.sender.identityAppearance?.avatar??rt.sender.identityAppearance?.logo??avatarUri(rt.sender.uid??rt.sender.name,rt.sender.color),identityAppearance:rt.sender.identityAppearance??(/^(b-wangyilin|b-pilot)$/.test(rt.sender.uid)?evaIdentityAppearance(rt.sender):undefined),senderName:rt.sender.name","message identity metadata");
    cut("showAvatar:pt,avatarUrl:mt,senderName:gt","showAvatar:pt,avatarUrl:mt,identityAppearance:evaIdentityAppearanceData,senderName:gt","shared message identity property");
    cut("React.createElement(Avatar$1,{src:mt,size:36,isOnline:Nt,showOnlineDot:!0,alt:gt,onClick:ir||Ct?void 0:sn})","React.createElement(Avatar$1,{src:mt,size:36,isOnline:Nt,showOnlineDot:!0,alt:gt,onClick:ir||Ct?void 0:sn,identityAppearance:evaIdentityAppearanceData})","shared message identity flow");
    cut("function Avatar$1({src:rt,size:ct=32,isOnline:ut,showOnlineDot:pt,alt:mt,onClick:gt})","function Avatar$1({src:rt,size:ct=32,isOnline:ut,showOnlineDot:pt,alt:mt,onClick:gt,identityAppearance:evaAppearance})","shared avatar property");
    cut("React.createElement(\"img\",{src:rt,alt:Ct,className:\"wk-msg-avatar-img\"}),pt&&ut&&React.createElement(\"span\",{className:\"wk-msg-avatar-online-dot\"})","evaAppearance?React.createElement(EvaAIIdentityAvatar,{appearance:evaAppearance,size:ct}):React.createElement(\"img\",{src:rt,alt:Ct,className:\"wk-msg-avatar-img\"}),!evaAppearance&&pt&&ut&&React.createElement(\"span\",{className:\"wk-msg-avatar-online-dot\"})","shared identity avatar rendering");
    cut("React.createElement(\"span\",{className:\"ops\"},!fa&&React.createElement(\"span\",{className:`op${Mt===\"threads\"?\" is-on\":\"\"}`",
      "React.createElement(\"span\",{className:\"ops\"},!fa&&ct?.sidebarVariant!==\"ai-sessions\"&&React.createElement(\"span\",{className:`op${Mt===\"threads\"?\" is-on\":\"\"}`", "team-only subzone header action");
    cut("!fa&&Zi.push({separator:!0},{title:\"创建子区\"",
      "!fa&&ct?.sidebarVariant!==\"ai-sessions\"&&Zi.push({separator:!0},{title:\"创建子区\"", "team-only subzone menu");
    cut('React.createElement("div",{className:"ch-main__stream"},React.createElement("div",{className:"ch-stream",ref:da},Ta.map((ci,Zi)=>hi(ci,Zi,Ta)))',
      'React.createElement("div",{className:"ch-main__stream",onClick:ci=>{(Mt==="threads"||Mt==="info")&&!ci.target.closest(".wk-messageinput-box, .wk-contextmenus")&&Dt("none")}},React.createElement("div",{className:"ch-stream",ref:da},Ta.map((ci,Zi)=>hi(ci,Zi,Ta)))', "点击群聊内容时关闭子区或聊天信息面板");
    cut("La=ci=>{xt(ci),Nt(null),Da(null),Dt(\"none\"),Qt(null),Ht(null)}",
      "La=ci=>{setEvaInlineProjectId(null),xt(ci),Nt(null),Da(null),Dt(\"none\"),Qt(null),Ht(null)}", "切换群聊时关闭消息内联项目");
    cut("Za=(ci,Zi)=>{xt(ci),Nt(Zi),Dt(\"none\"),Da(null)},za=ci=>",
      "Za=(ci,Zi)=>{setEvaInlineProjectId(null),xt(ci),Nt(Zi),Dt(\"none\"),Da(null)},evaOpenEffect=reactExports.useEffect(()=>{const evaOpen=evaEvent=>{const evaId=evaEvent.detail?.conversationId;if(!evaId||!pt.some(evaChannel=>evaChannel.id===evaId))return;La(evaId),requestAnimationFrame(()=>da.current?.scrollTo({top:0}))};window.addEventListener(\"eva-im:open\",evaOpen);return()=>window.removeEventListener(\"eva-im:open\",evaOpen)},[pt]),za=ci=>", "切换子区时关闭消息内联项目");
    cut('React.createElement(AppProviders,null,React.createElement(App,null))','React.createElement(AppProviders,null,React.createElement(EvaAssistantEditorHost,null,React.createElement(App,null)))','shared assistant editor host');
    cut('React.createElement("span",{className:"t"},Sa.name)', 'Sa.identityId?React.createElement("span",{className:"eva-identity-name-row"},React.createElement("span",{className:"t eva-identity-name-text"},Sa.name),React.createElement(AiBadge,{size:"small"})):React.createElement("span",{className:"t"},Sa.name)', 'AI 会话顶部沿用私聊身份标题');
    cut('return React.createElement("span",{className:gt,...pt},ut)},WebhookBadge=', 'return window.EvaAIIdentity.badge(React.createElement,ct)},WebhookBadge=', 'canonical Octo AI badge');
    source=root.__evaCut(source,
      'ChannelsView=({onOpenTask:rt,source:ct})=>{const ut=!!ct,[pt,mt]=reactExports.useState(()=>ct?.channels??channelsOf()),',
      'ChannelsView=({onOpenTask:rt,source:ct,membershipProjectId:evaMembershipProjectId,onManageProject:evaManageProject})=>{const evaMemberStore=evaMembers().store,evaMemberRevision=reactExports.useSyncExternalStore(evaMemberStore.subscribe,evaMemberStore.getSnapshot),evaActorId=evaMemberStore.snapshot().actorId,[evaGroupCreateOpen,setEvaGroupCreateOpen]=reactExports.useState(false);const ut=!!ct,[evaChannelDrafts,mt]=reactExports.useState(()=>evaMembershipProjectId?evaMemberStore.channels(evaMembershipProjectId,evaActorId,channelsOf()):ct?.channels??channelsOf()),pt=evaMembershipProjectId?evaMemberStore.channels(evaMembershipProjectId,evaActorId,evaChannelDrafts):evaChannelDrafts,',
      'IM 项目群成员数据源');
    source=root.__evaCut(source,'Sa=(ct?.conversationOnly?ct.channels[0]:pt.find(ci=>ci.id===Ct)??pt[0])??EMPTY_CHANNEL,',
      'evaMemberReset=reactExports.useEffect(()=>{Nt(null);Dt("none");Qt(null);Ht(null);setEvaGroupCreateOpen(false);},[evaMembershipProjectId,evaActorId]),evaSelectedChannel=(ct?.conversationOnly?ct.channels[0]:pt.find(ci=>ci.id===Ct)??pt[0])??EMPTY_CHANNEL,Sa={...evaSelectedChannel,...evaMemberStore.chatSettings(evaSelectedChannel.id)},', 'IM 身份切换重置');
    source=root.__evaCut(source,'cn(!1),ut?(Ir(null),Qr(null),hr(!0)):pr("channel")',
      'cn(!1),evaMembershipProjectId?setEvaGroupCreateOpen(true):ut?(Ir(null),Qr(null),hr(!0)):pr("channel")','IM 创建项目群入口');
    // The panel is a sibling of the stable conversation. No scrim, key change, or IM remount.
    const evaInfoStart=source.indexOf('React.createElement("div",{className:"ch-right-panel ch-right-panel--overlay"}');
    const evaInfoEnd=source.indexOf(',Ss=React.createElement(Modal',evaInfoStart);
    if(evaInfoStart<0||evaInfoEnd<evaInfoStart)throw new Error('Octo chat settings panel boundaries changed');
    const evaOldInfo=source.slice(evaInfoStart,evaInfoEnd);
    // Retain the existing thread-specific branch; group/direct settings share one adapter.
    const evaThreadStart=evaOldInfo.indexOf('fa?React.createElement("div",{className:"ch-right-panel__body"}');
    const evaThreadEnd=evaOldInfo.indexOf(':React.createElement("div",{className:"ch-right-panel__body"},React.createElement("div",{className:"ch-info-members"}');
    if(evaThreadStart<0||evaThreadEnd<0)throw new Error('Thread settings boundary changed');
    let evaThreadBody=root.__evaCut(evaOldInfo.slice(evaThreadStart+3,evaThreadEnd),',React.createElement(InfoRow,{label:"GROUP.md",value:"未配置"})','','Remove unsupported thread GROUP.md placeholder');
    // Use the same Octo settings rows and card shell as group/direct settings.
    evaThreadBody=evaThreadBody.replaceAll('className:"ch-right-panel__body"','className:"eva-chat-settings-body"')
      .replaceAll('className:"ch-info-group"','className:"eva-chat-setting-section"')
      .replaceAll('React.createElement(InfoRow,{label:','React.createElement(evaMembers().ui.ChatSettings.Row,{title:')
      .replaceAll('className:"ch-info-row"','className:"eva-chat-setting-row"')
      .replaceAll('className:"lb"','className:"eva-thread-setting-label"')
      .replaceAll('className:"vl"','className:"eva-chat-setting-value"')
      .replace('value:fa.creator_name','value:fa.creator_name||"未记录"')
      .replace('value:`${fa.member_count} 人`','value:Number.isFinite(fa.member_count)?`${fa.member_count} 人`:"未记录"');
    source=root.__evaCut(source,evaOldInfo,
      'React.createElement("div",{className:"ch-right-panel ch-right-panel--overlay"},fa?React.createElement("aside",{className:"eva-chat-settings eva-thread-settings","aria-label":"子区信息管理"},React.createElement("header",{className:"eva-chat-settings-head"},React.createElement("button",{type:"button",onClick:()=>Dt("none"),"aria-label":"关闭子区信息"},React.createElement(X,{size:20})),React.createElement("h3",null,"子区信息")),'+evaThreadBody+'):React.createElement(evaMembers().ui.ChatSettings,{key:Sa.id+":"+evaActorId,channel:Sa,sessionInfoOnly:!!ct?.conversationOnly,onClose:()=>Dt("none"),onManageProject:evaManageProject,onClear:()=>evaMemberStore.setChatPreferences(va,evaActorId,{clearedCount:evaAllMessages.length})}))',
      'Octo group and direct chat settings adapter');
    source=root.__evaCut(source,'return React.createElement(I18nProvider,null,React.createElement("div",{className:"ch-layout"}',
      'return React.createElement(I18nProvider,null,evaMembershipProjectId&&React.createElement(evaMembers().ui.CreateGroup,{projectId:evaMembershipProjectId,visible:evaGroupCreateOpen,onClose:()=>setEvaGroupCreateOpen(false),onCreated:evaId=>{mt(evaPrevious=>evaMemberStore.channels(evaMembershipProjectId,evaActorId,evaPrevious));xt(evaId);Nt(null);Dt("none")}}),React.createElement("div",{className:"ch-layout"}', 'IM 创建群聊组件');
    source=root.__evaCut(source,'channelsOfSpace=rt=>CHANNELS_BY_SPACE[rt]??[]', 'channelsOfSpace=rt=>evaMembers().store.channels(rt,evaMembers().store.snapshot().actorId,CHANNELS_BY_SPACE[rt]??[])','团队消息复用项目群访问范围');
    source=root.__evaCut(source,'[evaGroupCreateOpen,setEvaGroupCreateOpen]=reactExports.useState(false);','[evaGroupCreateOpen,setEvaGroupCreateOpen]=reactExports.useState(false),[evaTransferFile,setEvaTransferFile]=reactExports.useState(null);','IM 文件转存状态');
    source=root.__evaCut(source,'evaMenuItems=ci=>{if(!ci)return[];const Zi=[','evaMenuItems=ci=>{if(!ci)return[];const Zi=[];if(ci.kind==="file"&&ci.file&&evaMemberStore.canRead(Sa.id,evaActorId))Zi.push({title:"转存到项目",icon:React.createElement(FolderPlus,{size:18}),onClick:()=>setEvaTransferFile(ci.file)});Zi.push(','IM 文件转存菜单');
    source=root.__evaCut(source,'onClick:()=>Toast.info("已进入回复")}];ci.kind===','onClick:()=>Toast.info("已进入回复")});ci.kind===','IM 文件菜单数组结束');
    source=root.__evaCut(source,'return React.createElement(I18nProvider,null,evaMembershipProjectId&&React.createElement(evaMembers().ui.CreateGroup',
      'return React.createElement(I18nProvider,null,React.createElement(evaMembers().ui.FileTransfer,{file:evaTransferFile,source:{groupId:Sa.id,groupName:Sa.name,threadId:fa?.id,threadName:fa?.name,taskId:evaTransferFile?.taskId},onClose:()=>setEvaTransferFile(null)}),evaMembershipProjectId&&React.createElement(evaMembers().ui.CreateGroup','IM 文件转存组件');
    source=root.__evaCut(source,'return{channels:[...pt,...DMS.map(mt=>({...mt,category:"scope:dm"}))',
      'return{channels:[...pt,...evaMembers().store.channels(null,evaMembers().store.snapshot().actorId,ORG_CHANNELS).map(mt=>({...mt,category:"scope:groups"})),...DMS.map(mt=>({...mt,category:"scope:dm"}))','非项目群消息数据');
    source=root.__evaCut(source,'cats:[...ut,{id:"scope:dm",name:"私聊消息"}],messages:{...CHANNEL_MESSAGES,...OWN_MESSAGES,...evaDemo.messages}',
      'cats:[...ut,{id:"scope:groups",name:"非项目群"},{id:"scope:dm",name:"私聊消息"}],messages:{...CHANNEL_MESSAGES,...OWN_MESSAGES,...evaDemo.messages}','非项目群分类');
    source=root.__evaCut(source,':evaChannelDrafts,[gt]',':ct?.channels??evaChannelDrafts,[gt]','全局消息实时读取来源');
    source=root.__evaCut(source,'cn(!1),evaMembershipProjectId?setEvaGroupCreateOpen(true):ut?(Ir(null),Qr(null),hr(!0)):pr("channel")', 'cn(!1),setEvaGroupCreateOpen(true)','统一新建群入口');
    source=root.__evaCut(source,'evaMembershipProjectId&&React.createElement(evaMembers().ui.CreateGroup','ct?.sidebarVariant!=="ai-sessions"&&React.createElement(evaMembers().ui.CreateGroup','非项目群创建组件');
    source=root.__evaCut(source,'Ta=reactExports.useMemo(()=>[...ca,...oa[va]??[]],[ca,va,oa])',
      'evaAllMessages=reactExports.useMemo(()=>[...ca,...evaMemberStore.messagesFor(va,evaActorId),...oa[va]??[]].sort((a,b)=>Number(!!b.fixtureId?.startsWith("project-agent-welcome:"))-Number(!!a.fixtureId?.startsWith("project-agent-welcome:"))),[ca,va,oa,evaActorId,evaMemberRevision]),Ta=evaMemberStore.visibleMessages(va,evaActorId,evaAllMessages)','消息记录持久化读取');
    source=root.__evaCut(source,'vi=(ci,Zi)=>{const Fi=new Date,','vi=(ci,Zi)=>{if(evaMemberStore.canRead(ci,evaActorId)){evaMemberStore.sendMessage(ci,evaActorId,Zi);return;}const Fi=new Date,','群消息按当前人类身份发送');
    source=root.__evaCut(source,'mt(Ki=>Ki.map(ro=>ro.id===Sa.id?{...ro,threads:[Fi,...ro.threads]}:ro)),pa(!1)',
      'evaMemberStore.canRead(Sa.id,evaActorId)&&evaMemberStore.createThread(Fi.id,Sa.id,{...Fi,creator_name:evaMemberStore.person(evaActorId)?.name},evaActorId),mt(Ki=>Ki.map(ro=>ro.id===Sa.id?{...ro,threads:[Fi,...ro.threads]}:ro)),pa(!1)','子区注册继承关系');
    source=root.__evaCut(source,'onOk:()=>{mt(Zi=>Zi.map(Fi=>Fi.id!==Sa.id?Fi:{...Fi,threads:Fi.threads.filter(Ki=>Ki.id!==ci.id)}))','onOk:()=>{evaMemberStore.updateThread(ci.id,{deleted:true},evaActorId);mt(Zi=>Zi.map(Fi=>Fi.id!==Sa.id?Fi:{...Fi,threads:Fi.threads.filter(Ki=>Ki.id!==ci.id)}))','子区删除持久化');
    source=root.__evaCut(source,'ai=(ci,Zi,Fi)=>mt(Ki=>Ki.map(ro=>ro.id!==ci?ro:{...ro,threads:ro.threads.map(ns=>ns.id===Zi?{...ns,...Fi}:ns)}))',
      'ai=(ci,Zi,Fi)=>{if(evaMemberStore.canRead(ci,evaActorId)){evaMemberStore.updateThread(Zi,Fi,evaActorId);}mt(Ki=>Ki.map(ro=>ro.id!==ci?ro:{...ro,threads:ro.threads.map(ns=>ns.id===Zi?{...ns,...Fi}:ns)}))}','子区修改持久化');
    source=root.__evaCut(source,'React.createElement(EvaIMComposer,{placeholder:ct?.composerDisabled?"本地助理离线":Sa.chatType==="direct"?`发送给 ${Sa.name}…`:`在 ${fa?fa.name:Sa.name} 中回复…`',
      'React.createElement(EvaIMComposer,{key:evaActorId+":"+va,scopeId:evaMemberStore.canRead(Sa.id,evaActorId)?Sa.id:null,placeholder:ct?.composerDisabled?"本地助理离线":Sa.chatType==="direct"?`发送给 ${Sa.name}…`:`在 ${fa?fa.name:Sa.name} 中回复…`','输入区身份重置与提及范围');
    source=root.__evaCut(source,'React.createElement(EvaIMComposer,{placeholder:`在 ${Es.name} 中回复…`',
      'React.createElement(EvaIMComposer,{key:evaActorId+":"+Es.id,scopeId:evaMemberStore.canRead(Sa.id,evaActorId)?Sa.id:null,placeholder:`在 ${Es.name} 中回复…`','子区输入提及范围');
    source=root.__evaCut(source,'Cs=Es?[...THREAD_MESSAGES[Es.id]??[],...oa[Es.id]??[]]:[]','Cs=Es?[...(ct?.threadMessages??THREAD_MESSAGES)[Es.id]??[],...evaMemberStore.messagesFor(Es.id,evaActorId),...oa[Es.id]??[]]:[]','子区侧栏复用持久化消息');
    source=root.__evaCut(source,':ct?.channels??evaChannelDrafts,[gt]=reactExports.useState(()=>ct?.cats??[])',
      ':ct?[...ct.channels,...evaChannelDrafts.filter(evaC=>evaC.id.startsWith("dm-")&&!ct.channels.some(evaKnown=>evaKnown.id===evaC.id))]:evaChannelDrafts,gt=ct?.cats??[]','全局来源更新保留本地私聊入口');
    var legacyStart=source.indexOf('ChannelsView=({'),legacyEnd=source.indexOf('},listSkills=rt=>',legacyStart);
    if(legacyStart<0||legacyEnd<legacyStart)throw new Error('ChannelsView 边界不匹配');
    var oldChannelBody=source.slice(legacyStart,legacyEnd),channelBody=oldChannelBody;
    function cutChannelRange(start,end,label){var a=channelBody.indexOf(start),b=channelBody.indexOf(end,a);if(a<0||b<a)throw new Error(label+' 边界不匹配');channelBody=root.__evaCut(channelBody,channelBody.slice(a,b),'',label);}
    channelBody=root.__evaCut(channelBody,'ut?(Ir(null),Qr(null),hr(!0)):pr("channel")','setEvaGroupCreateOpen(true)','空列表统一创建入口');
    cutChannelRange('Ci=()=>{pr(null)', 'ii=ci=>', '移除直接添加成员的旧创建处理器');
    cutChannelRange('{t:Ea}=useI18n$1(),[Pa,Ha]', 'ui=pt.length===0?', '移除旧群创建候选人状态');
    cutChannelRange('Bi=$r==="org"', 'dl={cancel:', '移除旧群创建弹窗');
    channelBody=root.__evaCut(channelBody,')),uo,ys,ki,Ss)', ')),ki,Ss)', '移除旧弹窗渲染');
    for(var fragment of [',[sr,pr]=reactExports.useState(null)',',[mr,dr]=reactExports.useState("")',',[ur,hr]=reactExports.useState(!1)',',[$r,Ir]=reactExports.useState(null)',',[Ur,Qr]=reactExports.useState(null)'])channelBody=root.__evaCut(channelBody,fragment,'','移除旧群表单状态');
    source=root.__evaCut(source,oldChannelBody,channelBody,'统一群创建移除平行实现');
    source=root.__evaCut(source,'EvaIMComposer=({placeholder:rt,onSend:ct,initialDraft:evaInitialDraft="",onDraftChange:evaDraftChange,disabled:evaDisabled=false})=>{const[ut,pt]=reactExports.useState(evaInitialDraft)',
      'EvaIMComposer=({placeholder:rt,onSend:ct,initialDraft:evaInitialDraft="",onDraftChange:evaDraftChange,disabled:evaDisabled=false,scopeId:evaMentionScope})=>{const[evaMentionOpen,setEvaMentionOpen]=reactExports.useState(false);const[ut,pt]=reactExports.useState(evaInitialDraft)','共享输入区提及状态');
    source=root.__evaCut(source,'return React.createElement("div",{className:"wk-messageinput-box"},React.createElement("div",{className:"wk-messageinput-card"}',
      'return React.createElement("div",{className:"wk-messageinput-box"},evaMentionScope&&React.createElement(evaMembers().ui.MentionPicker,{scopeId:evaMentionScope,visible:evaMentionOpen,onClose:()=>setEvaMentionOpen(false),onChoose:evaName=>{const evaText=ut+"@"+evaName+" ";pt(evaText);if(mt.current)mt.current.textContent=evaText}}),React.createElement("div",{className:"wk-messageinput-card"}','提及选人复用输入区');
    source=root.__evaCut(source,'tabIndex:0,title:"提及","aria-label":"提及"},React.createElement(AtSign',
      'tabIndex:0,title:"提及","aria-label":"提及",onClick:()=>evaMentionScope&&setEvaMentionOpen(true),onKeyDown:evaEvent=>{if(evaMentionScope&&(evaEvent.key==="Enter"||evaEvent.key===" ")){evaEvent.preventDefault();setEvaMentionOpen(true)}}},React.createElement(AtSign','提及按钮接入');
    source=root.__evaCut(source,'!fa&&ct?.sidebarVariant!=="ai-sessions"&&React.createElement("span",{className:`op','!fa&&!Sa.id.startsWith("dm-")&&Sa.chatType!=="direct"&&ct?.sidebarVariant!=="ai-sessions"&&React.createElement("span",{className:`op','Hide group subzones in direct chat');
    source=root.__evaCut(source,'pt=evaMembershipProjectId?evaMemberStore.channels(evaMembershipProjectId,evaActorId,evaChannelDrafts):ct?[...ct.channels,...evaChannelDrafts.filter(evaC=>evaC.id.startsWith("dm-")&&!ct.channels.some(evaKnown=>evaKnown.id===evaC.id))]:evaChannelDrafts,gt=',
      'evaBaseChannels=evaMembershipProjectId?evaMemberStore.channels(evaMembershipProjectId,evaActorId,evaChannelDrafts):ct?[...ct.channels,...evaChannelDrafts.filter(evaC=>evaC.id.startsWith("dm-")&&!ct.channels.some(evaKnown=>evaKnown.id===evaC.id))]:evaChannelDrafts,pt=evaBaseChannels.map(evaC=>{const evaP=evaMemberStore.chatPreferences(evaC.id,evaActorId),evaS=evaMemberStore.chatSettings(evaC.id);return {...evaC,...evaS,name:evaS.name||evaC.name,identityAvatarUrl:evaS.avatar||evaC.identityAvatarUrl,unread:evaP.mute?0:evaC.unread,evaPinned:!!evaP.top}}).sort((a,b)=>Number(b.evaPinned)-Number(a.evaPinned)),gt=', 'Project shared conversation preferences');
    cut('!fa&&ct?.sidebarVariant!=="ai-sessions"&&Zi.push', '!fa&&!Sa.id.startsWith("dm-")&&Sa.chatType!=="direct"&&ct?.sidebarVariant!=="ai-sessions"&&Zi.push', 'group-only message subzone menu');

    source=root.__evaCut(source,
      '[evaGroupCreateOpen,setEvaGroupCreateOpen]=reactExports.useState(false),[evaTransferFile,setEvaTransferFile]=reactExports.useState(null);',
      '[evaGroupCreateOpen,setEvaGroupCreateOpen]=reactExports.useState(false),[evaTransferFile,setEvaTransferFile]=reactExports.useState(null),[evaInlineProjectId,setEvaInlineProjectId]=reactExports.useState(null);',
      '消息内联项目状态');
    source=root.__evaCut(source,
      'evaMemberReset=reactExports.useEffect(()=>{Nt(null);Dt("none");Qt(null);Ht(null);setEvaGroupCreateOpen(false);},[evaMembershipProjectId,evaActorId]),evaSelectedChannel=',
      'evaMemberReset=reactExports.useEffect(()=>{Nt(null);Dt("none");Qt(null);Ht(null);setEvaGroupCreateOpen(false);setEvaInlineProjectId(null);},[evaMembershipProjectId,evaActorId]),evaInlineProjectEffect=reactExports.useEffect(()=>{const evaOpenInlineProject=evaEvent=>{const evaProjectId=evaEvent.detail?.projectId;if(evaProjectId)setEvaInlineProjectId(evaProjectId)};window.addEventListener("eva:open-inline-project",evaOpenInlineProject);return()=>window.removeEventListener("eva:open-inline-project",evaOpenInlineProject)},[]),evaSelectedChannel=',
      '消息内联项目事件');
    source=root.__evaCut(source,
      'onClick:ns=>{ns.stopPropagation(),window.__evaOpenWorkspaceFromTree?.(ci.id.slice(6),"tasks")}',
      'onClick:ns=>{ns.stopPropagation(),window.dispatchEvent(new CustomEvent("eva:open-inline-project",{detail:{projectId:ci.id.slice(6)}}))}',
      '项目入口内联打开');
    source=root.__evaCut(source,
      '!ui&&Vs)),ki,Ss)',
      '!ui&&Vs),evaInlineProjectId&&React.createElement(EvaInlineProjectPanel,{projectId:evaInlineProjectId})),ki,Ss)',
      '消息内容区内联项目面板');

    cut('function getMentionRenderState(rt){return rt==="all"||rt==="channel"?{className:"mention-highlight",interactive:!1}', 'function getMentionRenderState(rt){return rt==="all"||rt==="channel"?{className:"mention-entity",interactive:!1}', '所有人提及沿用成员提及样式');
    // Restore the historical message search while retaining the shared member picker.
    cut('ii=ci=>{const Zi=SENDERS[ci];if(!Zi)return;Fa(""),ir("recent");const Fi=pt.find(ro=>ro.members===2&&ro.name===Zi.name);if(Fi){La(Fi.id);return}const Ki={id:`dm-${ci}`,name:Zi.name,color:Zi.color,unread:0,members:2,category:NO_CAT,lastAt:new Date().toISOString(),threads:[]};mt(ro=>[...ro,Ki]),La(Ki.id)}',
      'ii=ci=>{const id=evaMemberStore.openDirect(evaActorId,ci);Fa("");La(id)}', '搜索联系人沿用持久化私聊');
    cut('searchPeople(ci).filter(Zi=>Zi.uid!==ME&&!Zi.ai).slice(0,6)',
      'evaMemberStore.snapshot().people.filter(p=>p.active!==false&&p.id!==evaActorId&&p.name.includes(ci)).slice(0,6).map(p=>({...p,uid:p.id}))', '搜索仅展示当前有效人类身份');
    cut('src:avatarUri(ci.uid??ci.name,ci.color),alt:""}),React.createElement("span",{className:"nm"},ci.name),React.createElement("span",{className:"ds"},ci.dept,ci.title?` · ${ci.title}`:""))',
      'src:window.EvaAvatar.personUri(ci.uid),alt:""}),React.createElement("span",{className:"nm"},ci.name))', '搜索结果复用账号头像并保持无组织架构');
    cut('Vs=Mt==="none"?null:Mt==="threads"?', 'Vs=Mt==="tasks"&&evaCanOpenProjectTasks?React.createElement("div",{className:"ch-right-panel ch-right-panel--overlay"},React.createElement(EvaChatTaskList,{projectId:evaTaskProjectId,conversationId:fa?.id||Sa.id,messages:evaAllMessages,onClose:()=>Dt("none"),onCreate:()=>setEvaTaskContext({projectId:evaTaskProjectId,groupId:evaTaskGroupId,channelId:Sa.id,conversationId:fa?.id||Sa.id})})):Mt==="none"?null:Mt==="search"?React.createElement(EvaChannelSearchPanel,{key:va,store:evaMemberStore,scopeId:va,actorId:evaActorId,messages:evaAllMessages,locatedMessageId:evaLocatedMessageId,onLocate:evaLocateMessage,onClose:evaCloseSearch}):Mt==="threads"?', 'chat task and channel search panels');
    // Loop belongs to the parent project, never to a direct conversation or a
    // name-matched local task list. Subzones inherit their parent group's scope.
    cut('const evaMemberStore=evaMembers().store,evaMemberRevision=',
      'const [evaTaskContext,setEvaTaskContext]=reactExports.useState(null),evaMemberStore=evaMembers().store,evaMemberRevision=', 'IM project task native navigation');
    cut('Sa={...evaSelectedChannel,...evaMemberStore.chatSettings(evaSelectedChannel.id)},',
      'Sa={...evaSelectedChannel,...evaMemberStore.chatSettings(evaSelectedChannel.id)},evaTaskMembership=evaMemberStore.snapshot(),evaTaskGroupId=evaTaskMembership.threads[Sa.id]||Sa.id,evaTaskProjectId=Sa.chatType!=="direct"&&!Sa.id.startsWith("dm-")&&!ct?.conversationOnly&&(evaTaskGroupId.startsWith("all:")?evaTaskGroupId.slice(4):evaTaskMembership.groups[evaTaskGroupId]?.projectId),evaCanOpenProjectTasks=!!evaTaskProjectId&&evaMemberStore.canRead(evaTaskGroupId,evaActorId)&&evaMemberStore.canRead(evaTaskProjectId,evaActorId),', 'IM Loop project ownership and permissions');
    cut('React.createElement("span",{className:"ops"},!fa&&!Sa.id.startsWith("dm-")',
      'React.createElement("span",{className:"ops"},evaCanOpenProjectTasks&&React.createElement("span",{className:"op",role:"button",tabIndex:0,onKeyDown:e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();e.currentTarget.click();}},title:"聊天任务","aria-label":"查看聊天任务",onClick:()=>{if(evaMemberStore.canRead(evaTaskGroupId,evaActorId)&&evaMemberStore.canRead(evaTaskProjectId,evaActorId))Dt(Mt==="tasks"?"none":"tasks")}},React.createElement(ClipboardList,{size:20,color:"currentColor"})),evaCanOpenProjectTasks&&evaTaskContext?.channelId===Sa.id&&React.createElement(CreateIssueModal,{key:Sa.id,visible:true,projectId:evaTaskContext.projectId,conversationId:evaTaskContext.conversationId,canCreate:()=>evaMemberStore.canRead(evaTaskContext.groupId,evaActorId)&&evaMemberStore.canRead(evaTaskContext.projectId,evaActorId),onClose:()=>setEvaTaskContext(null),onCreated:issue=>{setEvaTaskContext(null);Toast.success("任务 "+issue.identifier+" 已创建");}}),!fa&&!Sa.id.startsWith("dm-")', 'IM shared project Loop task entry');
    cut('fa=Pt?Sa.threads.find(ci=>ci.id===Pt)??null:null',
      'fa=(ct?.selectedThreadId??Pt)?Sa.threads.find(ci=>ci.id===(ct?.selectedThreadId??Pt))??null:null', 'AI selected topic uses Octo thread state');
    cut('fa?React.createElement("div",{className:"wk-chat-conversation-header-channel-thread-icon"}',
      'fa&&ct?.presentation!=="ai-direct"?React.createElement("div",{className:"wk-chat-conversation-header-channel-thread-icon"}', 'AI topic keeps identity avatar');
    cut('fa?React.createElement("span",{className:"wk-chat-conversation-header-channel-info-name wk-chat-conversation-header-channel-info-name--thread"}',
      'fa&&ct?.presentation!=="ai-direct"?React.createElement("span",{className:"wk-chat-conversation-header-channel-info-name wk-chat-conversation-header-channel-info-name--thread"}', 'AI topic keeps direct title');
    cut('title:fa?"子区信息":"聊天信息"', 'title:fa&&ct?.presentation!=="ai-direct"?"子区信息":"聊天信息"', 'AI direct info label');
    cut('className:"ch-right-panel ch-right-panel--overlay"},fa?React.createElement',
      'className:"ch-right-panel ch-right-panel--overlay"},fa&&ct?.presentation!=="ai-direct"?React.createElement', 'AI topics reuse direct chat settings');
    cut('channel:Sa,sessionInfoOnly:!!ct?.conversationOnly',
      'channel:ct?.presentation==="ai-direct"?{...Sa,id:va,chatType:"direct"}:Sa,conversationActions:ct?.conversationActions,sessionInfoOnly:!!ct?.conversationOnly', 'AI settings topic identity and actions');
    // Octo directWithName copy applies to every IM target; AI topics display the AI identity.
    cut('placeholder:ct?.composerDisabled?"本地助理离线":Sa.chatType==="direct"?`发送给 ${Sa.name}…`:`在 ${fa?fa.name:Sa.name} 中回复…`',
      'placeholder:evaIMPlaceholder(ct?.presentation==="ai-direct"?Sa.name:(fa?.name??Sa.name))', 'Unified recipient placeholder');
    cut('placeholder:`在 ${Es.name} 中回复…`',
      'placeholder:evaIMPlaceholder(Es.name)', 'Thread side composer recipient placeholder');
    // Contact identity navigation shares the existing IM patch registry entry.
  cut('const{search:evaMessageSearch}=useLocation(),evaMessageMode=', 'const{search:evaMessageSearch,key:evaContactRequestKey}=useLocation(),evaMessageMode=', '身份卡导航请求');
  cut('rt=reactExports.useMemo(()=>messageSource(evaMessageMode),[evaMessageMode,evaLiveMemberRevision])', 'rt=reactExports.useMemo(()=>({...messageSource(evaMessageMode),openChannelId:new URLSearchParams(evaMessageSearch).get("evaDM"),openRequestKey:evaContactRequestKey}),[evaMessageMode,evaLiveMemberRevision,evaMessageSearch,evaContactRequestKey])', '私聊路由数据');
  cut('...DMS.map(mt=>({...mt,category:"scope:dm"}))', '...(evaMembers().store.snapshot().actorId==="u-wangyilin"?DMS:[]).filter(mt=>!evaMembers().store.directChannels(evaMembers().store.snapshot().actorId).some(c=>c.id===mt.id)).map(mt=>({...mt,personId:"u-"+mt.id.slice(3),chatType:"direct",category:"scope:dm"})),...evaMembers().store.directChannels(evaMembers().store.snapshot().actorId).map(mt=>({...mt,category:"scope:dm"}))', '私聊稳定身份索引');
  cut('messages:{...CHANNEL_MESSAGES,...OWN_MESSAGES,...evaDemo.messages}', 'messages:evaMembers().store.directMessages(evaMembers().store.snapshot().actorId,{...CHANNEL_MESSAGES,...OWN_MESSAGES,...evaDemo.messages})', '私聊业务消息读取');
  cut('const [evaTaskContext,setEvaTaskContext]=reactExports.useState(null),evaMemberStore=', 'const [evaIdentityProfile,setEvaIdentityProfile]=reactExports.useState(null),[evaTaskContext,setEvaTaskContext]=reactExports.useState(null),evaMemberStore=', '会话资料状态所有者');
  cut('vi=(ci,Zi)=>{if(evaMemberStore.canRead(ci,evaActorId))', 'vi=(ci,Zi)=>{if(ci.startsWith("dm-")){const target=pt.find(c=>c.id===ci)?.personId;if(target){const id=evaMemberStore.openDirect(evaActorId,target);evaMemberStore.sendDirect(id,evaActorId,Zi);return;}}if(evaMemberStore.canRead(ci,evaActorId))', '人类私聊持久化发送');
  cut('evaOpenEffect=reactExports.useEffect(()=>{const evaOpen=', 'evaContactOpenEffect=reactExports.useEffect(()=>{if(ct?.openChannelId&&pt.some(c=>c.id===ct.openChannelId)){La(ct.openChannelId);ir("recent");}},[ct?.openChannelId,ct?.openRequestKey]),evaOpenEffect=reactExports.useEffect(()=>{const evaOpen=', '私聊路由选择');
  cut('return React.createElement(I18nProvider,null,React.createElement(evaMembers().ui.FileTransfer', 'return React.createElement(I18nProvider,null,React.createElement(evaMembers().ui.IdentityCard,{identity:evaIdentityProfile,onClose:()=>setEvaIdentityProfile(null)}),React.createElement(evaMembers().ui.FileTransfer', '消息头像统一身份卡');
  for(const continuation of ['!1','ro'])cut('...rowProps(ci,'+continuation+'),onContextMenu:', '...rowProps(ci,'+continuation+'),onAvatarClick:()=>setEvaIdentityProfile(ci.sender),onSenderNameClick:()=>setEvaIdentityProfile(ci.sender),onContextMenu:', '消息身份点击 '+continuation);
    cut('initialDraft:ct?.initialDraft,onDraftChange:ct?.onDraftChange', 'initialDraft:Sa.personId?evaMemberStore.directDraft(Sa.id,evaActorId):ct?.initialDraft,onDraftChange:Sa.personId?text=>evaMemberStore.setDirectDraft(evaMemberStore.openDirect(evaActorId,Sa.personId),evaActorId,text):ct?.onDraftChange', '私聊草稿业务隔离');
    cut('setEvaGroupCreateOpen(false);setEvaInlineProjectId(null);},[evaMembershipProjectId,evaActorId])', 'setEvaGroupCreateOpen(false);setEvaInlineProjectId(null);setEvaIdentityProfile(null);},[evaMembershipProjectId,evaActorId])', '身份切换关闭资料卡');
    cut(':ct?[...ct.channels,...evaChannelDrafts.filter(evaC=>evaC.id.startsWith("dm-")&&!ct.channels.some(evaKnown=>evaKnown.id===evaC.id))]:evaChannelDrafts', ':ct?ct.channels:evaChannelDrafts', '私聊仅使用当前账号业务来源');
    cut('ChannelsView,{key:evaMessageMode,source:rt', 'ChannelsView,{key:evaMessageMode+":"+evaLiveMemberStore.snapshot().actorId,source:rt', '切换账号重置内部会话身份');
    cut('className:"ch-cat-gear",title:"新建"', 'className:"ch-cat-gear eva-message-invite",title:"新建群聊","aria-label":"新建群聊"', '恢复顶部拉人图标语义');
    // The follow/recent switch now belongs to ChannelsView. No DOM controller.
    cut('className:"ch-list__scroll"},wi,Ai,',
      'className:"ch-list__scroll"},wi,ut&&!ct?.conversationOnly?(Cn==="recent"?Aa:React.createElement(EvaFollowList,{store:evaMemberStore,actorId:evaActorId,categories:evaFollowCategories,channels:pt},Ai)):Ai,', 'React 关注最近统一列表');
    cut('React.createElement("div",{className:"ch-list__scroll"}',
      'ut&&!ct?.conversationOnly&&React.createElement("div",{className:"wk-sidebar-tabbar","data-eva-project-recent-switcher":true},React.createElement("div",{className:"wk-sidebar-tabbar__container"},["follow","recent"].map(mode=>React.createElement("button",{key:mode,type:"button",className:"wk-sidebar-tabbar__btn"+(Cn===mode?" wk-sidebar-tabbar__btn--active":""),"aria-pressed":Cn===mode,onClick:()=>ir(mode)},React.createElement("span",{className:"wk-sidebar-tabbar__label"},mode==="follow"?"关注":"最近"))))),React.createElement("div",{className:"ch-list__scroll"}', '关注最近 React 入口');
    cut('threadsExpanded:evaThreadsExpanded}){return React.createElement("div",{className:classNames("wk-conv-compact-item"',
      'threadsExpanded:evaThreadsExpanded,dragHandleProps:evaDragHandleProps}){return React.createElement("div",{className:classNames("wk-conv-compact-item"', '关注手柄属性');
    const handleStart=source.indexOf('!pt&&React.createElement("span",{className:"wk-conv-compact-drag-handle"'),handleEnd=source.indexOf(',React.createElement("span",{className:"wk-conv-compact-icon"}',handleStart);
    if(handleStart<0||handleEnd<0)throw new Error('Octo compact drag handle boundary changed');
    cut(source.slice(handleStart,handleEnd),'!pt&&evaDragHandleProps&&React.createElement("button",{type:"button",className:"wk-conv-compact-drag-handle",...evaDragHandleProps,onClick:e=>e.stopPropagation()},React.createElement(EvaFollowGrip))','Octo 六点手柄');
    cut('return React.createElement(React.Fragment,{key:ci.id},React.createElement(ConvCompactItem',
      'return React.createElement(EvaFollowChannel,{key:ci.id,id:ci.id,categoryId:ci.category,enabled:ut&&!ct?.conversationOnly},React.createElement(ConvCompactItem', '父群和子区整体拖动');
    cut('Ai=ut?gt.map(ci=>{const Zi=Va.trim(),Fi=pt.filter(ns=>ns.category===ci.id).filter(',
      'evaFollowCategories=evaMemberStore.followOrder(evaActorId,"categories",gt.filter(c=>c.id==="scope:other"||evaMemberStore.pinnedProjects(evaActorId).includes(c.id.slice(6)))),Ai=ut?evaFollowCategories.map(ci=>{const Zi=Va.trim(),Fi=evaMemberStore.followOrder(evaActorId,"channels:"+ci.id,pt.filter(ns=>ns.category===ci.id)).filter(', 'pin 推导关注并保留手工排序');
    cut('return React.createElement(Card,{key:ci.id,className:`eva-space-card-foundation',
      'return React.createElement(EvaFollowCategory,{key:ci.id,categoryId:ci.id,sortableItems:Fi.map(c=>c.id),className:`eva-space-card-foundation', 'Octo 分组展示');
    // Group memberships remain the access authority; pin never grants membership.
    cut('category:"scope:groups"','category:"scope:other"','非项目群统一分组');
    cut('category:"scope:demo"','category:"scope:other"','无项目演示会话统一分组');
    cut('category:"scope:dm"','category:"scope:other"','历史私聊统一分组');
    cut('category:"scope:dm"','category:"scope:other"','新增私聊统一分组');
    cut('{id:"scope:groups",name:"非项目群"},{id:"scope:dm",name:"私聊消息"}',
      '{id:"scope:other",name:"其他会话"}', '唯一其他会话分类');
    cut('xt(evaId);Nt(null);Dt("none")','xt(evaId);Nt(null);Dt("none");ir("recent");setEvaInlineProjectId(null)', '建群后显示新会话');
    cut('const id=evaMemberStore.openDirect(evaActorId,ci);Fa("");La(id)',
      'const id=evaMemberStore.openDirect(evaActorId,ci);Fa("");ir("recent");La(id)', '搜索私聊显示最近');
    cut('ut&&Cn==="follow"&&Qa===0&&gt.every(ci=>pt.every(Zi=>Zi.category!==ci.id))',
      'ut&&Cn==="follow"&&evaFollowCategories.length===0', '关注空状态使用真实分类');
    cut('name:Fi.name,at:Fi.lastAt??""','name:Fi.name,crumb:evaMemberStore.conversationContext(Fi.id,evaActorId)?.path,at:Fi.lastAt??""','最近项目群归属');
    cut('crumb:Fi.name,at:Ki.updated_at','crumb:evaMemberStore.conversationContext(Ki.id,evaActorId)?.path||Fi.name,at:Ki.updated_at','最近子区项目路径');
    cut('className:"wk-conv-breadcrumb"},ci.crumb','className:"wk-conv-breadcrumb",title:ci.crumb},evaMemberStore.conversationContext(ci.th?.id||ci.ch.id,evaActorId)&&React.createElement(LayoutGrid,{size:12,style:{color:window.EvaProjectAppearance.css(evaMemberStore.conversationContext(ci.th?.id||ci.ch.id,evaActorId)).accent},"aria-hidden":true}),React.createElement("span",null,ci.crumb)','完整项目路径提示');
    cut('Cn==="recent"?Aa:React.createElement(EvaFollowList','Cn==="recent"||Va.trim()?Aa:React.createElement(EvaFollowList','跨项目搜索统一归属行');
    cut('React.createElement("span",{className:"t"},Sa.name))),ut&&!fa&&(ct?.scopeNameOf[Sa.id]??Kr[Sa.id])&&React.createElement("span",{className:"ch-head__scope"},ct?.scopeNameOf[Sa.id]??Kr[Sa.id]),',
      'React.createElement("span",{className:"t"},Sa.name),!ct?.conversationOnly&&evaMemberStore.conversationContext(fa?.id||Sa.id,evaActorId)&&React.createElement("span",{className:"eva-chat-project-context",title:evaMemberStore.conversationContext(fa?.id||Sa.id,evaActorId).path},React.createElement(LayoutGrid,{size:12,style:{color:window.EvaProjectAppearance.css(evaMemberStore.conversationContext(fa?.id||Sa.id,evaActorId)).accent},"aria-hidden":true}),React.createElement("span",null,evaMemberStore.conversationContext(fa?.id||Sa.id,evaActorId).path)))),','聊天顶部项目归属');
    cut('Wa=ci=>{const Zi=[...(ct?.messages??CHANNEL_MESSAGES)[ci]??[],...oa[ci]??[]];',
      'Wa=ci=>{const Zi=evaMemberStore.visibleMessages(ci,evaActorId,[...(ct?.messages??CHANNEL_MESSAGES)[ci]??[],...evaMemberStore.messagesFor(ci,evaActorId),...oa[ci]??[]].sort((a,b)=>Number(!!b.fixtureId?.startsWith("project-agent-welcome:"))-Number(!!a.fixtureId?.startsWith("project-agent-welcome:"))));','会话摘要读取与聊天流相同的成员消息');
    cut('},[pt,Va,oa,ct]).map(ci=>','},[pt,Va,oa,ct,evaMemberRevision,evaActorId]).map(ci=>','成员消息更新时刷新最近摘要');
    cut('scopeId:evaMentionScope})=>', 'scopeId:evaMentionScope,mentionMembers:evaMentionMembers})=>', '固定群成员传入共享输入区');
    cut('scopeId:evaMentionScope,visible:evaMentionOpen', 'scopeId:evaMentionScope,members:evaMentionMembers,visible:evaMentionOpen', '固定群成员传入共享提及选择器');
    cut('key:evaActorId+":"+va,scopeId:evaMemberStore.canRead(Sa.id,evaActorId)?Sa.id:null,placeholder:',
      'key:evaActorId+":"+va,mentionMembers:Sa.fixedMembers,scopeId:Sa.fixedMembers?Sa.id:evaMemberStore.canRead(Sa.id,evaActorId)?Sa.id:null,placeholder:', '固定群提及成员范围');
    cut('key:evaActorId+":"+Es.id,scopeId:evaMemberStore.canRead(Sa.id,evaActorId)?Sa.id:null,placeholder:',
      'key:evaActorId+":"+Es.id,mentionMembers:Sa.fixedMembers,scopeId:Sa.fixedMembers?Sa.id:evaMemberStore.canRead(Sa.id,evaActorId)?Sa.id:null,placeholder:', '固定群侧面子区提及成员');
    cut('sessionInfoOnly:!!ct?.conversationOnly', 'sessionInfoOnly:ct?.presentation==="ai-direct"', '固定群沿用群聊信息');
    cut('evaMemberStore.canRead(Sa.id,evaActorId)&&evaMemberStore.createThread(Fi.id,Sa.id,{...Fi,creator_name:evaMemberStore.person(evaActorId)?.name},evaActorId)',
      'ct?.onCreateThread?ct.onCreateThread(Fi):evaMemberStore.canRead(Sa.id,evaActorId)&&evaMemberStore.createThread(Fi.id,Sa.id,{...Fi,creator_name:evaMemberStore.person(evaActorId)?.name},evaActorId)', '固定团队群复用创建子区表单');
    cut('evaMemberStore.updateThread(ci.id,{deleted:true},evaActorId);', 'ct?.onUpdateThread?ct.onUpdateThread(ci.id,{deleted:true}):evaMemberStore.updateThread(ci.id,{deleted:true},evaActorId);', '固定团队群删除子区');
    cut('ai=(ci,Zi,Fi)=>{if(evaMemberStore.canRead(ci,evaActorId))', 'ai=(ci,Zi,Fi)=>{if(ct?.onUpdateThread){ct.onUpdateThread(Zi,Fi);return;}if(evaMemberStore.canRead(ci,evaActorId))', '固定团队群修改子区');
    cut('const sent=ct.onSend(Zi);', 'const sent=ct.onSend(Zi,va);', '主消息流按子区发送');
    cut('vi=(ci,Zi)=>{if(ci.startsWith("dm-"))', 'vi=(ci,Zi)=>{if(ct?.onSend){ct.onSend(Zi,ci);return;}if(ci.startsWith("dm-"))', '侧面子区消息按频道发送');
    cut('initialDraft:Sa.personId?', 'initialDraft:ct?.getDraft?ct.getDraft(va):Sa.personId?', '固定群主消息流草稿隔离');
    cut(':ct?.onDraftChange,disabled:', ':ct?.getDraft?text=>ct.onDraftChange(text,va):ct?.onDraftChange,disabled:', '固定群草稿写入当前频道');
    cut('placeholder:evaIMPlaceholder(Es.name),onSend:ci=>vi(Es.id,ci)', 'placeholder:evaIMPlaceholder(Es.name),initialDraft:ct?.getDraft?.(Es.id),onDraftChange:ct?.getDraft?text=>ct.onDraftChange(text,Es.id):undefined,onSend:ci=>vi(Es.id,ci)', '侧面子区草稿隔离');
    cut('Za=(ci,Zi)=>{setEvaInlineProjectId(null),xt(ci),Nt(Zi)', 'Za=(ci,Zi)=>{ct?.onSelectThread?.(Zi);setEvaInlineProjectId(null),xt(ci),Nt(Zi)', '固定群中栏子区选择同步');
    cut('[evaGroupCreateOpen,setEvaGroupCreateOpen]=reactExports.useState(false),', '[evaCategoryEditor,setEvaCategoryEditor]=reactExports.useState(null),[evaGroupCreateOpen,setEvaGroupCreateOpen]=reactExports.useState(false),', '自定义分类编辑状态');
    cut('return {...evaC,...evaS,name:', 'return {...evaC,...evaS,category:ct&&!ct.conversationOnly?evaMemberStore.conversationCategory(evaActorId,evaC):evaC.category,name:', '非项目会话分类来源');
    cut('gt=ct?.cats??[]', 'gt=ct&&!ct.conversationOnly?[...(ct.cats||[]).filter(c=>c.id.startsWith("space:")),...evaMemberStore.conversationCategories(evaActorId)]:ct?.cats??[]', '用户分类列表');
    cut('c.id==="scope:other"||evaMemberStore.pinnedProjects', 'c.id.startsWith("scope:")||evaMemberStore.pinnedProjects', '自定义分类在关注展示');
    cut('React.createElement(Dropdown.Item,{onClick:()=>{cn(!1),setEvaGroupCreateOpen(true)}},"新建群聊")', 'React.createElement(Dropdown.Item,{onClick:()=>{cn(!1),setEvaGroupCreateOpen(true)}},"新建群聊"),React.createElement(Dropdown.Item,{onClick:()=>{cn(false);setEvaCategoryEditor({});}},"创建分组")', '消息加号创建分组');
    cut('title:"新建群聊","aria-label":"新建群聊"', 'title:"新建","aria-label":"新建"', '消息加号多操作语义');
    cut('return React.createElement(I18nProvider,null,', 'return React.createElement(I18nProvider,null,evaCategoryEditor&&React.createElement(EvaConversationCategoryEditor,{key:evaActorId+":"+(evaCategoryEditor.id||"new"),store:evaMemberStore,actorId:evaActorId,record:evaCategoryEditor,channels:pt,onClose:()=>setEvaCategoryEditor(null),onSaved:()=>{setEvaCategoryEditor(null);Fa("");ir("follow");}}),', '分类编辑表单');
    cut('projectId:ci.id.slice(6)}}))}}):null,headerStyle:', 'projectId:ci.id.slice(6)}}))}}):React.createElement(Button,{theme:"borderless",type:"tertiary",size:"small",icon:React.createElement(EllipsisIcon,{size:16}),"aria-label":"编辑分组 "+ci.name,onClick:()=>setEvaCategoryEditor(ci)}),headerStyle:', '其他会话和自定义分类可编辑');
    cut('setEvaIdentityProfile(null);},[evaMembershipProjectId,evaActorId])', 'setEvaIdentityProfile(null);setEvaCategoryEditor(null);},[evaMembershipProjectId,evaActorId])', '分类表单身份重置');
    cut('React.createElement(Dropdown,{trigger:"click",position:"bottomLeft",visible:sn,onVisibleChange:cn,render:React.createElement(Dropdown.Menu,null,React.createElement(Dropdown.Item,{onClick:()=>{cn(!1),setEvaGroupCreateOpen(true)}},"新建群聊"),React.createElement(Dropdown.Item,{onClick:()=>{cn(false);setEvaCategoryEditor({});}},"创建分组"))},React.createElement("button",{type:"button",className:"ch-cat-gear eva-message-invite",title:"新建","aria-label":"新建"},React.createElement(Plus$c,{size:15})))','evaMembershipProjectId?React.createElement("button",{type:"button",className:"ch-cat-gear eva-message-invite",title:"新建群聊","aria-label":"新建群聊",onClick:()=>setEvaGroupCreateOpen(true)},React.createElement(Plus$c,{size:15})):React.createElement(Dropdown,{trigger:"click",position:"bottomLeft",visible:sn,onVisibleChange:cn,render:React.createElement(Dropdown.Menu,null,React.createElement(Dropdown.Item,{onClick:()=>{cn(!1),setEvaGroupCreateOpen(true)}},"新建群聊"),React.createElement(Dropdown.Item,{onClick:()=>{cn(false);setEvaCategoryEditor({});}},"创建分组"))},React.createElement("button",{type:"button",className:"ch-cat-gear eva-message-invite",title:"新建","aria-label":"新建"},React.createElement(Plus$c,{size:15})))',"项目群聊直接打开拉人建群模板");
    // 群聊与项目群聊共用同一套搜索状态和右侧面板；私聊、AI 会话不展示入口。
    cut('const [evaIdentityProfile,setEvaIdentityProfile]=reactExports.useState(null),[evaTaskContext,setEvaTaskContext]=reactExports.useState(null),evaMemberStore=',
      'const [evaIdentityProfile,setEvaIdentityProfile]=reactExports.useState(null),[evaTaskContext,setEvaTaskContext]=reactExports.useState(null),[evaLocatedMessageId,setEvaLocatedMessageId]=reactExports.useState(null),evaSearchTriggerRef=reactExports.useRef(null),evaMemberStore=', '群聊搜索状态所有者');
    cut('Sa={...evaSelectedChannel,...evaMemberStore.chatSettings(evaSelectedChannel.id)},evaTaskMembership=',
      'Sa={...evaSelectedChannel,...evaMemberStore.chatSettings(evaSelectedChannel.id)},evaCanSearchCurrent=!Sa.id.startsWith("dm-")&&Sa.chatType!=="direct"&&ct?.sidebarVariant!=="ai-sessions",evaTaskMembership=', '群聊搜索入口权限');
    cut('Ta=evaMemberStore.visibleMessages(va,evaActorId,evaAllMessages)',
      'Ta=evaMemberStore.normalizeMessages(va,evaMemberStore.visibleMessages(va,evaActorId,evaAllMessages))', '消息流使用稳定搜索索引');
    cut('rowProps=(rt,ct)=>({isSend:', 'rowProps=(rt,ct,evaLocatedMessageId)=>({isSend:', '消息行接收搜索定位状态');
    cut('isOnline:rt.sender.online,isBot:rt.sender.ai})',
      'isOnline:rt.sender.online,isBot:rt.sender.ai,messageId:rt.id,isLocated:rt.id===evaLocatedMessageId})', '消息行透传稳定消息标识');
    for(const continuation of ['!1','ro'])cut('...rowProps(ci,'+continuation+'),onAvatarClick:',
      '...rowProps(ci,'+continuation+',evaLocatedMessageId),onAvatarClick:', '搜索定位消息行 '+continuation);
    cut('onSenderNameClick:cn}){const{t:Cn}=useI18n()',
      'onSenderNameClick:cn,messageId:evaMessageId,isLocated:evaIsLocated}){const{t:Cn}=useI18n()', '消息行定位属性');
    cut('ln&&"wk-msg-row--active"),onContextMenu:pr,onClick:sr}',
      'ln&&"wk-msg-row--active",evaIsLocated&&"eva-message-search-located"),"data-message-id":evaMessageId,tabIndex:evaIsLocated?-1:void 0,onContextMenu:pr,onClick:sr}', '定位消息视觉和可聚焦语义');
    cut('La=ci=>{setEvaInlineProjectId(null),',
      'La=ci=>{setEvaLocatedMessageId(null);setEvaInlineProjectId(null),', '切换群聊清理搜索定位');
    cut('Za=(ci,Zi)=>{ct?.onSelectThread?.(Zi);setEvaInlineProjectId(null),',
      'Za=(ci,Zi)=>{ct?.onSelectThread?.(Zi);setEvaLocatedMessageId(null),setEvaInlineProjectId(null),', '切换子区清理搜索定位');
    cut('evaMemberReset=reactExports.useEffect(()=>{',
      'evaSearchModeEffect=reactExports.useEffect(()=>{if(Mt!=="search")setEvaLocatedMessageId(null)},[Mt]),evaMemberReset=reactExports.useEffect(()=>{', '关闭搜索清理定位');
    cut('setEvaIdentityProfile(null);setEvaCategoryEditor(null);},[evaMembershipProjectId,evaActorId])',
      'setEvaIdentityProfile(null);setEvaCategoryEditor(null);setEvaLocatedMessageId(null);},[evaMembershipProjectId,evaActorId])', '身份切换重置搜索定位');
    cut('no=za(Sa),ls=',
      'evaCloseSearch=()=>{Dt("none");setEvaLocatedMessageId(null);requestAnimationFrame(()=>evaSearchTriggerRef.current?.focus())},evaLocateMessage=evaMessageId=>{setEvaLocatedMessageId(evaMessageId);requestAnimationFrame(()=>{const evaRows=[...(da.current?.querySelectorAll("[data-message-id]")||[])],evaRow=evaRows.find(evaItem=>evaItem.dataset.messageId===evaMessageId);evaRow?.scrollIntoView({behavior:"smooth",block:"center"});evaRow?.focus({preventScroll:true})})},no=za(Sa),ls=', '搜索关闭与消息定位');
    cut('React.createElement("span",{className:"ops"},evaCanOpenProjectTasks&&',
      'React.createElement("span",{className:"ops"},evaCanSearchCurrent&&React.createElement("button",{type:"button",ref:evaSearchTriggerRef,className:`op${Mt==="search"?" is-on":""}`,title:"查找聊天内容","aria-label":"查找聊天内容","aria-expanded":Mt==="search",onClick:()=>Mt==="search"?evaCloseSearch():(setEvaLocatedMessageId(null),Dt("search"))},React.createElement(Search$1,{size:20,color:"currentColor"})),evaCanOpenProjectTasks&&', '群聊搜索顶部入口');
    return EvaConversationCategoryEditor.toString()+'\n'+EvaFollowGrip.toString()+'\n'+EvaFollowChannel.toString()+'\n'+EvaFollowCategory.toString()+'\n'+EvaFollowList.toString()+'\n'+EvaChannelSearchPanel.toString()+'\n'+evaIMPlaceholder.toString()+'\n'+evaTeamThreadSource.toString()+'\n'+EvaAssistantSourceCards.toString()+'\n'+EvaAssistantEditorHost.toString()+'\n'+EvaAssistantEditor.toString()+'\n'+evaIdentityAppearance.toString()+'\n'+EvaAIIdentityAvatar.toString()+'\n'+EvaInlineProjectPanel.toString()+'\n'+EvaAITeamPage.toString()+'\n'+source;
  });
})(window);
