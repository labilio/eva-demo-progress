(function (root) {
  'use strict';
  root.__evaPatch('im', function (source) {
function evaIdentityAppearance(identity) {
  const original = window.__EVA_MY_ASSISTANT_IDENTITY;
  return {name:identity.name, sourceName:'Eva', sourceAssistantId:identity.sourceAssistantId,
    logo:original.logo, ownerName:original.ownerName, ownerAvatar:original.ownerAvatar};
}
function EvaAIIdentityAvatar({appearance,size=32}) {
  return window.EvaAIIdentity.avatar(appearance,size,React.createElement);
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
  reactExports.useEffect(()=>{const open=options=>setRequest({...options,key:Date.now()});window.__evaOpenAssistantEditor=open;return()=>{if(window.__evaOpenAssistantEditor===open)delete window.__evaOpenAssistantEditor;};},[]);
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
  const [draft,setDraft]=reactExports.useState(()=>({name:editing?existing?.name||'':persona?(local?local.name+'的分身':''):'',description:config.description||'',identity:config.identity||'',personality:config.personality||'',about:config.about||'',skills:(config.skills||[]).join('\n'),collaboration:config.collaboration||'',model:config.model||'Qwen3.7 Plus',toolset:config.toolset??'四两的产品脑袋'}));
  const [tab,setTab]=reactExports.useState('identity'),[busy,setBusy]=reactExports.useState(false),[error,setError]=reactExports.useState('');
  const scope=reactExports.useRef(null), alive=reactExports.useRef(true);
  reactExports.useEffect(()=>()=>{alive.current=false;},[]);
  const update=(key,value)=>{setDraft(d=>({...d,[key]:value}));setError('');};
  const role=persona?'分身':'助理';
  const editorTitle=(editing?'编辑':'创建')+(persona?'云端分身':'本地助理');
  const syncLabel=editing?({synced:'已同步',syncing:'正在同步',waiting:'等待记忆同步',error:'同步失败'}[existing?.syncStatus]||'等待记忆同步'):'创建后同步';
  const tabs=[['identity',role+'身份','定义'+role+'是谁，包括名字、角色定位和能力范围。'],['personality',role+'性格','描述表达方式、判断风格和协作习惯。'],['about','关于你','补充需要了解的个人背景与偏好。'],['skills','技能','配置可以使用的技能，每行一个。'],['collaboration','协作','设置参与协作时的职责和规则。']];
  if(persona)tabs.push(['source','来源与同步','选择来源助理后，配置与已授权记忆将自动同步到云端分身。']);
  function changeSource(value){const next=value==='__independent__'?null:value;setSourceAssistantId(next);const selected=snapshot.localAssistants.find(i=>i.id===next);if(selected)setDraft(d=>({...d,...selected.configuration,skills:(selected.configuration.skills||[]).join('\n')}));setError('');}
  function applyTemplate(item){setDraft(d=>({...d,name:d.name||item.name, ...item.configuration,skills:item.configuration.skills.join('\n')}));setError('');}
  function quickCreate(){if(!draft.name.trim()){setError('请先填写'+role+'名称');return;}setDraft(d=>({...d,identity:d.identity||('你是'+d.name+'，协助主人处理工作事项。'),personality:d.personality||'清晰、友善；关键决策由主人确认。'}));}
  async function save(){
    if(!draft.name.trim()){setError('请填写'+role+'名称');return;}
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
  const appearance={name:draft.name||role,sourceName:'Eva',logo:window.__EVA_MY_ASSISTANT_IDENTITY.logo,ownerName:window.__EVA_MY_ASSISTANT_IDENTITY.ownerName,ownerAvatar:window.__EVA_MY_ASSISTANT_IDENTITY.ownerAvatar};
  return h(Modal,{visible:true,title:null,footer:null,closable:false,closeOnEsc:!busy,maskClosable:!busy,onCancel:()=>!busy&&onClose(),width:920,className:'eva-editor-dialog',getPopupContainer:()=>host.current},
    h('section',{className:'eva-create-assistant-modal',ref:scope,'aria-label':editorTitle},
      h('header',{className:'eva-create-assistant-modal__head'},h(EvaAIIdentityAvatar,{appearance,size:34}),
        h('div',{className:'eva-create-assistant-modal__identity'},h('span',{className:'eva-editor-kind'},editorTitle),h('div',{className:'eva-editor-title-row'},h('input',{'aria-label':role+'名称',placeholder:role+'名称',value:draft.name,readOnly:!persona&&existing?.isDefault,disabled:busy,onChange:e=>update('name',e.target.value)})),h('input',{className:'eva-editor-description','aria-label':'简短描述',placeholder:'简短描述',value:draft.description,disabled:busy,onChange:e=>update('description',e.target.value)}),persona&&h('span',null,local?'同步自：'+local.name:'独立配置')),
        h('div',{className:'eva-create-assistant-modal__head-actions'},
          h(Button,{theme:'outline',type:'tertiary',onClick:quickCreate,disabled:busy},'快速创建'),
          h(Dropdown,{trigger:'click',position:'bottomRight',getPopupContainer:()=>scope.current,clickToHide:true,render:h(Dropdown.Menu,null,snapshot.localAssistants.map(i=>h(Dropdown.Item,{key:i.id,onClick:()=>applyTemplate(i)},i.name)))},h('span',{className:'eva-ai-team__menu-anchor'},h(Button,{theme:'outline',type:'tertiary',disabled:busy},'使用模板'))),
          h(Button,{theme:'borderless',type:'tertiary',icon:h(X,{size:20}),'aria-label':'关闭编辑器',disabled:busy,onClick:onClose}))),
      h('nav',{className:'eva-create-assistant-modal__tabs',role:'tablist','aria-label':role+'设置'},tabs.map(([key,label])=>h('button',{type:'button',role:'tab','aria-selected':tab===key,key,className:'eva-create-assistant-modal__tab'+(tab===key?' is-active':''),onClick:()=>setTab(key)},label))),
      h('div',{className:'eva-create-assistant-modal__body',role:'tabpanel'},h('p',{className:'eva-create-assistant-modal__hint'},tabs.find(t=>t[0]===tab)[2]),tab==='source'?h('div',{className:'eva-editor-source'},h(EvaAssistantSourceCards,{sources:snapshot.localAssistants,value:sourceAssistantId||'__independent__',disabled:busy,onChange:changeSource}),h('p',null,local?'默认自动同步。更换来源并保存后，将使用新助理的配置；分身名称保持不变。':'独立维护当前配置，不从助理同步。'),local&&h('span',{role:'status'},sourceAssistantId===existing?.sourceAssistantId?'本地 → 云端 · '+syncLabel:'保存后自动同步')):h('textarea',{className:'eva-create-assistant-modal__editor','aria-label':tabs.find(t=>t[0]===tab)[1],placeholder:tab==='skills'?'每行填写一个技能':'支持 Markdown 格式，可用中文或英文书写',value:draft[tab],disabled:busy,onChange:e=>update(tab,e.target.value)})),
      error&&h('p',{className:'eva-ai-team__error',role:'alert'},error),
      h('footer',{className:'eva-create-assistant-modal__footer'},h(Select,{value:draft.model,'aria-label':'模型',getPopupContainer:()=>scope.current,onChange:value=>update('model',value),disabled:busy},h(Select.Option,{value:'Qwen3.7 Plus'},'Qwen3.7 Plus')),
        draft.toolset&&h('span',{className:'eva-create-assistant-modal__chip'},draft.toolset,h(Button,{theme:'borderless',type:'tertiary',size:'small',icon:h(X,{size:12}),'aria-label':'移除'+draft.toolset,onClick:()=>update('toolset','')})),h('span',{className:'eva-create-assistant-modal__spacer'}),h(Button,{theme:'solid',type:'primary',className:'eva-create-assistant-modal__submit',loading:busy,onClick:save},editing?'保存':'创建'))));
}
function EvaAITeamPage() {
  const h = React.createElement, store = window.EvaAITeam, navigate=useNavigate();
  const snapshot = reactExports.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [selection, setSelection] = reactExports.useState(() => ({identityId:snapshot.identities[0]?.id, sessionId:snapshot.sessions.find(s=>s.identityId===snapshot.identities[0]?.id)?.id}));
  const [collapsed,setCollapsed] = reactExports.useState({});
  const PinIcon=reactExports.useMemo(()=>createLucideIcon('pin', [['path',{d:'M12 17v5',key:'stem'}],['path',{d:'M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z',key:'head'}]]),[]);
  const LinkIcon=reactExports.useMemo(()=>createLucideIcon('link-2', [['path',{d:'M9 17H7A5 5 0 0 1 7 7h2',key:'left'}],['path',{d:'M15 7h2a5 5 0 0 1 0 10h-2',key:'right'}],['line',{x1:'8',x2:'16',y1:'12',y2:'12',key:'center'}]]),[]);
  const rail = reactExports.useRef(null);
  const [modal,setModal] = reactExports.useState(null), [sourceId,setSourceId] = reactExports.useState(null);
  const [busy,setBusy] = reactExports.useState(false), [error,setError] = reactExports.useState('');
  const host = reactExports.useRef(null), form = reactExports.useRef(null), alive = reactExports.useRef(true);
  reactExports.useEffect(() => {alive.current=true;return()=>{alive.current=false;};},[]);
  const identity = snapshot.identities.find(i=>i.id===selection.identityId);
  const session = snapshot.sessions.find(s=>s.id===selection.sessionId&&s.identityId===identity?.id);
  const draftKey = session?.id || (identity ? 'draft:'+identity.id : '');
  const status = i => i.role==='assistant' ? (i.status==='offline'?'本地离线':'本地已连接') : ({synced:'已自动同步',syncing:'正在同步',waiting:'等待记忆同步',error:'同步失败'}[i.syncStatus]);
  const choose = (identityId,sessionId) => {setSelection({identityId,sessionId});setError('');};
  const newConversation = id => {setCollapsed(value=>({...value,[id]:false}));choose(id,null);};
  const openDetails = id => {const item=snapshot.identities.find(i=>i.id===id);window.__evaOpenAssistantEditor({mode:'edit',role:item.role,id:item.role==='assistant'?item.sourceAssistantId:item.id});};
  const open = kind => {setError('');setSourceId(kind==='create'&&snapshot.localAssistants.length===1?snapshot.localAssistants[0].id:null);setModal(kind);};
  const close = () => {if(!busy){setModal(null);setError('');}};
  const sources = snapshot.localAssistants;
  const connected = id => snapshot.identities.find(i=>i.role==='assistant'&&i.sourceAssistantId===id);
  async function submit() {
    if(!sourceId||busy||(modal==='connect'&&connected(sourceId)))return;
    if(modal==='create'){setModal(null);window.__evaOpenAssistantEditor({mode:'create',role:'persona',sourceId:sourceId==='__independent__'?null:sourceId,onSaved:result=>{if(alive.current)choose(result.id,null);}});return;}
    setBusy(true);setError('');
    try {const result=await store.connectAssistant(sourceId);if(alive.current){choose(result.id,null);setModal(null);}}
    catch(e){if(alive.current)setError(e.message||'操作失败，请重试');}
    finally{if(alive.current)setBusy(false);}
  }
  const source = identity ? messageSource('my-ai', snapshot, identity, session) : null;
  if(source){
    source.initialDraft=snapshot.drafts[draftKey]||'';
    source.onDraftChange=text=>store.setDraft(draftKey,text);
    source.composerDisabled=identity.status==='offline';
    source.onSend=text=>{try{const id=store.sendMessage(identity.id,session?.id||null,text);setError('');if(!session)setSelection({identityId:identity.id,sessionId:id});return true;}catch(e){setError(e.message);return false;}};
  }
  function identityItem(i){
    const sessions=snapshot.sessions.filter(s=>s.identityId===i.id).sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)||b.updatedAt.localeCompare(a.updatedAt));
    const related=i.sourceAssistantId?(i.role==='assistant'?snapshot.identities.filter(p=>p.role==='persona'&&p.sourceAssistantId===i.sourceAssistantId):snapshot.localAssistants.filter(l=>l.id===i.sourceAssistantId)):[];
    const relationText=related.length?(i.role==='assistant'?'同步到分身：\n':'来源助理：\n')+related.map(r=>r.name).join('\n')+(i.role==='persona'?'\n自动同步':''):'';
    const expanded=collapsed[i.id]===false, abnormal=i.status==='offline'||(i.role==='persona'&&i.syncStatus!=='synced');
    return h('section',{className:'eva-ai-team__identity',key:i.id},
      h('div',{className:'eva-ai-team__identity-heading'},
        h('button',{type:'button',className:'eva-ai-team__identity-button','aria-expanded':expanded,'aria-controls':'ai-sessions-'+i.id,onClick:()=>setCollapsed(value=>({...value,[i.id]:expanded}))},
          h(ChevronRight,{size:12,className:'eva-ai-team__chevron'+(expanded?' is-expanded':'')}),
          h(EvaAIIdentityAvatar,{appearance:evaIdentityAppearance(i),size:26}),
          h('span',{className:'eva-ai-team__identity-name',title:i.name},i.name),h(AiBadge,{size:'small'})),
        relationText&&h(TooltipComponent,{position:'right',content:h('span',{style:{whiteSpace:'pre-line'}},relationText)},h('span',{className:'eva-ai-team__relation','aria-label':relationText},h(LinkIcon,{size:14,'aria-hidden':true}))),
        h(Dropdown,{trigger:'click',position:'bottomRight',clickToHide:true,getPopupContainer:()=>rail.current,render:h(Dropdown.Menu,null,
          h(Dropdown.Item,{onClick:()=>newConversation(i.id)},'新建对话'),
          h(Dropdown.Item,{onClick:()=>openDetails(i.id)},'查看配置'))},
          h('span',{className:'eva-ai-team__menu-anchor'},h(Button,{theme:'borderless',type:'tertiary',size:'small',className:'eva-ai-team__more',icon:h(EllipsisIcon,{size:16}),'aria-label':i.name+'的更多操作'})))),
      abnormal&&h('p',{className:'eva-ai-team__identity-status'},status(i)),
      expanded&&h('div',{className:'eva-ai-team__sessions',id:'ai-sessions-'+i.id},
        identity?.id===i.id&&!session&&h('button',{type:'button',className:'eva-ai-team__session is-selected','aria-current':'true',onClick:()=>choose(i.id,null)},h('span',{className:'eva-ai-team__session-title'},'新对话')),
        sessions.map(s=>h('div',{key:s.id,className:'eva-ai-team__session-row'+(session?.id===s.id?' is-selected':'')},
          h('button',{type:'button',className:'eva-ai-team__session','aria-current':session?.id===s.id?'true':undefined,onClick:()=>choose(i.id,s.id)},h('span',{className:'eva-ai-team__session-title',title:s.title},s.title),h('span',{className:'eva-ai-team__session-time'},new Date(s.updatedAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false}))),
          h('div',{className:'eva-ai-team__session-actions'},
            h(Button,{theme:'borderless',type:'tertiary',size:'small',icon:h(PinIcon,{size:14}),title:s.pinned?'取消置顶':'置顶','aria-label':(s.pinned?'取消置顶':'置顶')+' '+s.title,'aria-pressed':!!s.pinned,onClick:()=>store.setSessionFlag(s.id,'pinned',!s.pinned)}),
            h(Button,{theme:'borderless',type:'tertiary',size:'small',icon:h(Trash2,{size:14}),title:'删除','aria-label':'删除 '+s.title,onClick:()=>{store.deleteSession(s.id);if(session?.id===s.id){const next=sessions.find(x=>x.id!==s.id);choose(i.id,next?.id||null);}}})))),
        sessions.length===0&&!(identity?.id===i.id&&!session)&&h('button',{type:'button',className:'eva-ai-team__session',onClick:()=>newConversation(i.id)},h('span',{className:'eva-ai-team__session-title'},'新建对话'))));
  }
  return h('div',{className:'eva-ai-team'},
    h('aside',{className:'eva-ai-team__sidebar','aria-label':'我的 AI 团队',ref:rail},
      h('div',{className:'eva-ai-team__sidebar-header'},
        h(Dropdown,{trigger:'click',position:'bottomLeft',clickToHide:true,getPopupContainer:()=>rail.current,render:h(Dropdown.Menu,null,
          h(Dropdown.Item,{onClick:()=>open('connect')},'助理'),h(Dropdown.Item,{onClick:()=>open('create')},'分身'),h(Dropdown.Item,{disabled:true},'数字员工（暂未接入）'))},
          h('span',{className:'eva-ai-team__add-anchor'},h(Button,{theme:'light',type:'tertiary',icon:h(Plus$c,{size:16}),className:'eva-ai-team__add'},'添加 AI'))),
        identity?h(Button,{theme:'solid',type:'tertiary',className:'eva-ai-team__new',onClick:()=>newConversation(identity.id)},'新建对话'):
          h(Dropdown,{trigger:'click',position:'bottomRight',clickToHide:true,getPopupContainer:()=>rail.current,render:h(Dropdown.Menu,null,snapshot.identities.map(i=>h(Dropdown.Item,{key:i.id,onClick:()=>newConversation(i.id)},i.name)))},h('span',{className:'eva-ai-team__menu-anchor'},h(Button,{theme:'solid',type:'tertiary',className:'eva-ai-team__new',disabled:!snapshot.identities.length},'新建对话')))),
      h('div',{className:'eva-ai-team__roles'},[['assistant','本地助理'],['persona','云端分身']].map(([role,label])=>h('section',{className:'eva-ai-team__role-group',key:role,'aria-label':label},h('h3',{className:'eva-ai-team__group-title'},label),snapshot.identities.filter(i=>i.role===role).map(identityItem))),
        h('section',{className:'eva-ai-team__role-group','aria-label':'数字员工'},h('h3',{className:'eva-ai-team__group-title'},'数字员工')))),
    h('main',{className:'eva-ai-team__main'},
      snapshot.storageWarning&&h('p',{className:'eva-ai-team__notice',role:'status'},snapshot.storageWarning),
      identity?h(React.Fragment,null,
        identity.status==='offline'&&h('p',{className:'eva-ai-team__notice',role:'status'},'本地助理离线，历史记录仍可查看；上线后可继续发送。'),
        identity.role==='persona'&&identity.syncStatus==='error'&&h(Button,{theme:'borderless',onClick:()=>store.syncPersona(identity.id).catch(e=>setError(e.message))},'重试同步'),
        !modal&&error&&h('p',{className:'eva-ai-team__error',role:'alert'},error),
        h(ChannelsView,{key:draftKey,source,onOpenTask:()=>{}})):
      h('div',{className:'eva-ai-team__empty'},h(Users,{size:32}),h('h2',null,'暂无可用的数字员工'),h('p',null,'接入公司数字员工后，即可在这里使用。'))),
    h('div',{className:'eva-ai-team__modal-host',ref:host}),
    modal&&h(Modal,{visible:true,title:modal==='connect'?'连接本地助理':'创建云端分身',className:'eva-ai-team__modal',getPopupContainer:()=>host.current,onCancel:close,maskClosable:!busy,closable:!busy,closeOnEsc:!busy,width:480,cancelText:'取消',cancelButtonProps:{'aria-label':'取消',disabled:busy},confirmLoading:busy,okText:modal==='connect'?'连接本地助理':'下一步',okButtonProps:{'aria-label':modal==='connect'?'连接本地助理':'下一步',disabled:!sourceId||(sourceId!=='__independent__'&&!sources.find(l=>l.id===sourceId)?.online)||(modal==='connect'&&!!connected(sourceId))},onOk:submit},
      h('div',{className:'eva-ai-team__form',ref:form},h('p',null,modal==='connect'?'选择个人「Eva 同学」中已有的助理。灰色项已连接，不能重复选择。':'选择助理自动同步配置与已授权记忆，也可以独立配置分身。'),modal==='connect'?h('div',{className:'eva-ai-team__connections'},h('div',{className:'eva-ai-team__connection-heading'},h('span',null,'个人助理'),h(Button,{theme:'borderless',type:'tertiary',size:'small',className:'eva-ai-team__personal-link',icon:h(ArrowUpRight,{size:14}),iconPosition:'right',onClick:()=>{setModal(null);navigate('/guid');}},'前往个人 Eva 同学')),h('div',{className:'eva-ai-team__connection-list'},sources.map(l=>{const linked=connected(l.id),disabled=busy||!!linked||!l.online;return h('button',{type:'button',key:l.id,className:'eva-ai-team__connection-option'+(sourceId===l.id?' is-selected':''),disabled,'aria-pressed':sourceId===l.id,onClick:()=>setSourceId(l.id)},h(EvaAIIdentityAvatar,{appearance:evaIdentityAppearance(l),size:32}),h('span',{className:'eva-ai-team__connection-title'},h('strong',{title:l.name},l.name),h('span',{className:'eva-ai-team__connection-status'},l.isDefault?'默认 · 已连接':linked?'已连接':l.online?'可连接':'本地离线'))); }))):h(EvaAssistantSourceCards,{sources,value:sourceId,disabled:busy,onChange:value=>{setSourceId(value);setError('');}}),modal==='connect'&&sources.length===0&&h('p',{className:'eva-ai-team__notice'},'所有已有助理均已连接。可以在个人 Eva 同学中管理本地助理。'),error&&h('p',{className:'eva-ai-team__error',role:'alert'},error))));
}

    function cut(needle,replacement,label){source=root.__evaCut(source,needle,replacement,'IM '+label);}
    cut("function messageSource(){const rt=loadSpaces(),ct={},ut=rt.map(mt=>({id:\"space:\"+mt.id,name:mt.name})),pt=rt.flatMap(mt=>channelsOfSpace(mt.id).map(gt=>(ct[gt.id]=mt.name,{...gt,category:\"space:\"+mt.id})));DMS.forEach(mt=>{ct[mt.id]=\"私聊消息\"});return{channels:[...pt,...DMS.map(mt=>({...mt,category:\"scope:dm\"}))],cats:[...ut,{id:\"scope:dm\",name:\"私聊消息\"}],messages:{...CHANNEL_MESSAGES,...OWN_MESSAGES},threadMessages:{...THREAD_MESSAGES,...OWN_THREAD_MESSAGES},scopeNameOf:ct}}",
      "function messageSource(evaMessageMode,evaSnapshot,evaIdentity,evaSession){if(evaMessageMode===\"my-ai\"){if(!evaIdentity)return{sidebarVariant:\"ai-sessions\",channels:[],cats:[],messages:{},threadMessages:{},scopeNameOf:{}};const id=evaSession?.id??\"draft:\"+evaIdentity.id,channel={id,name:evaIdentity.name,sessionTitle:evaSession?.title??\"新对话\",chatType:\"direct\",members:2,threads:[],category:evaIdentity.id,conversationKind:\"openclaw-session\",identityId:evaIdentity.id,identityName:evaIdentity.name,identityAppearance:evaIdentityAppearance(evaIdentity),identityAvatarUrl:evaIdentityAppearance(evaIdentity).logo,lastAt:evaSession?.updatedAt??\"\",unread:0};return{sidebarVariant:\"ai-sessions\",conversationOnly:true,channels:[channel],cats:[],messages:{[id]:(evaSession?.messages??[]).flatMap((message,index,all)=>{const day=new Date(message.time).toLocaleDateString(\"zh-CN\",{month:\"long\",day:\"numeric\"}),divider=index===0||new Date(message.time).toDateString()!==new Date(all[index-1].time).toDateString();return[...(divider?[{kind:\"divider\",text:day}]:[]),{...message,sender:message.sender.uid===\"self\"?SENDERS[\"u-wangyilin\"]:{...message.sender,identityAppearance:evaIdentityAppearance(evaIdentity)},time:new Date(message.time).toLocaleTimeString(\"zh-CN\",{hour:\"2-digit\",minute:\"2-digit\",hour12:false})}]})},threadMessages:{},scopeNameOf:{}}}const rt=loadSpaces(),ct={},ut=rt.map(mt=>({id:\"space:\"+mt.id,name:mt.name})),pt=rt.flatMap(mt=>channelsOfSpace(mt.id).map(gt=>(ct[gt.id]=mt.name,{...gt,category:\"space:\"+mt.id}))),evaDemo=window.__EVA_IM_DEMO??{channels:[],messages:{}},evaTeamChannels=evaDemo.channels.filter(mt=>!mt.id.startsWith(\"im-ai-\")&&!mt.id.startsWith(\"im-pilot-\"));DMS.forEach(mt=>{ct[mt.id]=\"私聊消息\"});evaTeamChannels.forEach(mt=>{ct[mt.id]=\"精选会话\"});return{channels:[...pt,...DMS.map(mt=>({...mt,category:\"scope:dm\"})),...evaTeamChannels.map(mt=>({...mt,category:\"scope:demo\"}))],cats:[...ut,{id:\"scope:dm\",name:\"私聊消息\"}],messages:{...CHANNEL_MESSAGES,...OWN_MESSAGES,...evaDemo.messages},threadMessages:{...THREAD_MESSAGES,...OWN_THREAD_MESSAGES},scopeNameOf:ct}}", "messageSource role adapter");
    cut("MessagesPage=()=>{const rt=reactExports.useMemo(()=>messageSource(),[]);return React.createElement(\"div\",{className:\"eva-msg eva-channel-surface\",\"data-eva-channel-surface\":\"global\"},React.createElement(ChannelsView,{source:rt,onOpenTask:()=>{}}))}",
      "MessagesPage=()=>{const{search:evaMessageSearch}=useLocation(),evaMessageMode=new URLSearchParams(evaMessageSearch).get(\"evaIM\")===\"my-ai\"?\"my-ai\":\"all\",rt=reactExports.useMemo(()=>messageSource(evaMessageMode),[evaMessageMode]);return React.createElement(\"div\",{className:\"eva-msg eva-channel-surface\",\"data-eva-channel-surface\":\"global\",\"data-eva-message-mode\":evaMessageMode},evaMessageMode===\"my-ai\"?React.createElement(EvaAITeamPage,{key:evaMessageMode}):React.createElement(ChannelsView,{key:evaMessageMode,source:rt,onOpenTask:()=>{}}))}", "MessagesPage role host");
    cut("React.createElement(\"div\",{className:\"ch-layout\"},React.createElement(\"div\",{className:\"ch-list\"}",
      "React.createElement(\"div\",{className:\"ch-layout\"},!ct?.conversationOnly&&React.createElement(\"div\",{className:\"ch-list\"}", "conversation-only sidebar slot");
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
    cut("avatarUrl:avatarUri(rt.sender.uid??rt.sender.name,rt.sender.color),senderName:rt.sender.name","avatarUrl:rt.sender.identityAppearance?.logo??avatarUri(rt.sender.uid??rt.sender.name,rt.sender.color),identityAppearance:rt.sender.identityAppearance??(/^(b-wangyilin|b-pilot)$/.test(rt.sender.uid)?evaIdentityAppearance(rt.sender):undefined),senderName:rt.sender.name","message identity metadata");
    cut("showAvatar:pt,avatarUrl:mt,senderName:gt","showAvatar:pt,avatarUrl:mt,identityAppearance:evaIdentityAppearanceData,senderName:gt","shared message identity property");
    cut("React.createElement(Avatar$1,{src:mt,size:36,isOnline:Nt,showOnlineDot:!0,alt:gt,onClick:ir||Ct?void 0:sn})","React.createElement(Avatar$1,{src:mt,size:36,isOnline:Nt,showOnlineDot:!0,alt:gt,onClick:ir||Ct?void 0:sn,identityAppearance:evaIdentityAppearanceData})","shared message identity flow");
    cut("function Avatar$1({src:rt,size:ct=32,isOnline:ut,showOnlineDot:pt,alt:mt,onClick:gt})","function Avatar$1({src:rt,size:ct=32,isOnline:ut,showOnlineDot:pt,alt:mt,onClick:gt,identityAppearance:evaAppearance})","shared avatar property");
    cut("React.createElement(\"img\",{src:rt,alt:Ct,className:\"wk-msg-avatar-img\"}),pt&&ut&&React.createElement(\"span\",{className:\"wk-msg-avatar-online-dot\"})","evaAppearance?React.createElement(EvaAIIdentityAvatar,{appearance:evaAppearance,size:ct}):React.createElement(\"img\",{src:rt,alt:Ct,className:\"wk-msg-avatar-img\"}),!evaAppearance&&pt&&ut&&React.createElement(\"span\",{className:\"wk-msg-avatar-online-dot\"})","shared identity avatar rendering");
    cut("React.createElement(\"span\",{className:\"ops\"},!fa&&React.createElement(\"span\",{className:`op${Mt===\"threads\"?\" is-on\":\"\"}`",
      "React.createElement(\"span\",{className:\"ops\"},!fa&&ct?.sidebarVariant!==\"ai-sessions\"&&React.createElement(\"span\",{className:`op${Mt===\"threads\"?\" is-on\":\"\"}`", "team-only subzone header action");
    cut('fa?"子区信息":`聊天信息（${Sa.members}）`', 'fa?"子区信息":ct?.conversationOnly?"聊天信息":`聊天信息（${Sa.members}）`', 'session info heading');
    cut('fa?React.createElement("div",{className:"ch-right-panel__body"},React.createElement("div",{className:"ch-info-group"}', 'ct?.conversationOnly?React.createElement("div",{className:"ch-right-panel__body"},React.createElement("div",{className:"ch-info-group"},React.createElement(InfoRow,{label:"对话",value:Sa.sessionTitle}),React.createElement(InfoRow,{label:"聊天对象",value:Sa.identityName}))):fa?React.createElement("div",{className:"ch-right-panel__body"},React.createElement("div",{className:"ch-info-group"}', 'session info data');
    cut("!fa&&Zi.push({separator:!0},{title:\"创建子区\"",
      "!fa&&ct?.sidebarVariant!==\"ai-sessions\"&&Zi.push({separator:!0},{title:\"创建子区\"", "team-only subzone menu");
    cut("Za=(ci,Zi)=>{xt(ci),Nt(Zi),Dt(\"none\"),Da(null)},za=ci=>",
      "Za=(ci,Zi)=>{xt(ci),Nt(Zi),Dt(\"none\"),Da(null)},evaOpenEffect=reactExports.useEffect(()=>{const evaOpen=evaEvent=>{const evaId=evaEvent.detail?.conversationId;if(!evaId||!pt.some(evaChannel=>evaChannel.id===evaId))return;La(evaId),requestAnimationFrame(()=>da.current?.scrollTo({top:0}))};window.addEventListener(\"eva-im:open\",evaOpen);return()=>window.removeEventListener(\"eva-im:open\",evaOpen)},[pt]),za=ci=>", "external conversation open effect");
    cut('React.createElement(AppProviders,null,React.createElement(App,null))','React.createElement(AppProviders,null,React.createElement(EvaAssistantEditorHost,null,React.createElement(App,null)))','shared assistant editor host');
    cut('React.createElement("span",{className:"t"},Sa.name)', 'React.createElement("span",{className:"t"},Sa.name),Sa.identityId&&React.createElement(AiBadge,{size:"small"})', 'AI badge in private chat header');
    cut('return React.createElement("span",{className:gt,...pt},ut)},WebhookBadge=', 'return window.EvaAIIdentity.badge(React.createElement,ct)},WebhookBadge=', 'canonical Octo AI badge');
    return EvaAssistantSourceCards.toString()+'\n'+EvaAssistantEditorHost.toString()+'\n'+EvaAssistantEditor.toString()+'\n'+evaIdentityAppearance.toString()+'\n'+EvaAIIdentityAvatar.toString()+'\n'+EvaAITeamPage.toString()+'\n'+source;
  });
})(window);
