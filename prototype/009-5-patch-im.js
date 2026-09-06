(function (root) {
  'use strict';
  root.__evaPatch('im', function (source) {
function EvaAITeamPage() {
  const h = React.createElement, store = window.EvaAITeam;
  const snapshot = reactExports.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [selection, setSelection] = reactExports.useState(() => ({identityId:snapshot.identities[0]?.id, sessionId:snapshot.sessions[0]?.id}));
  const [modal,setModal] = reactExports.useState(null), [sourceId,setSourceId] = reactExports.useState(null);
  const [busy,setBusy] = reactExports.useState(false), [error,setError] = reactExports.useState('');
  const host = reactExports.useRef(null), form = reactExports.useRef(null), alive = reactExports.useRef(true);
  reactExports.useEffect(() => {alive.current=true;return()=>{alive.current=false;};},[]);
  const identity = snapshot.identities.find(i=>i.id===selection.identityId);
  const session = snapshot.sessions.find(s=>s.id===selection.sessionId&&s.identityId===identity?.id);
  const draftKey = session?.id || (identity ? 'draft:'+identity.id : '');
  const status = i => i.role==='assistant' ? (i.status==='offline'?'本地离线':'本地已连接') : ({synced:'已自动同步',syncing:'正在同步',waiting:'等待本地上线',error:'同步失败'}[i.syncStatus]);
  const choose = (identityId,sessionId) => {setSelection({identityId,sessionId});setError('');};
  const open = kind => {setError('');setSourceId(null);setModal(kind);};
  const close = () => {if(!busy){setModal(null);setError('');}};
  const sources = snapshot.localAssistants.filter(l=>modal!=='connect'||!snapshot.identities.some(i=>i.role==='assistant'&&i.sourceAssistantId===l.id));
  async function submit() {
    if(!sourceId||busy)return;
    setBusy(true);setError('');
    try {const result=await (modal==='connect'?store.connectAssistant(sourceId):store.createPersona(sourceId));if(alive.current){choose(result.id,null);setModal(null);}}
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
    const sessions=snapshot.sessions.filter(s=>s.identityId===i.id).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
    return h('div',{className:'eva-ai-team__identity',key:i.id},
      h('button',{type:'button',className:'eva-ai-team__identity-button'+(identity?.id===i.id?' is-selected':''),'aria-current':identity?.id===i.id?'true':undefined,onClick:()=>choose(i.id,sessions[0]?.id)},h(i.role==='assistant'?Bot:Users,{size:18}),h('span',null,i.name),h('span',{className:'eva-ai-team__identity-meta'},status(i))),
      h('div',{className:'eva-ai-team__sessions'},sessions.map(s=>h('button',{type:'button',key:s.id,className:'eva-ai-team__session'+(session?.id===s.id?' is-selected':''),'aria-current':session?.id===s.id?'true':undefined,onClick:()=>choose(i.id,s.id)},h('span',{className:'eva-ai-team__session-title'},s.title),h('span',{className:'eva-ai-team__session-preview'},s.messages.at(-1)?.text.split('\n')[0]),h('span',{className:'eva-ai-team__session-time'},new Date(s.updatedAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false}))))));
  }
  const local=snapshot.localAssistants.find(l=>l.id===identity?.sourceAssistantId);
  const detailRows=identity?[['身份',identity.role==='assistant'?'私人助理':'对外分身'],['来源助理',local?.name||''],['运行位置',identity.role==='assistant'?'本地':'云端'],['配置状态',status(identity)],['配置版本','v'+identity.configVersion],['身份设定',identity.configuration.identity],['交流风格',identity.configuration.personality],['能力',identity.configuration.skills.join('、')||'暂无'],['最近同步',new Date(identity.lastSyncedAt).toLocaleString('zh-CN',{hour12:false})]]:[];
  return h('div',{className:'eva-ai-team'},
    h('aside',{className:'eva-ai-team__sidebar','aria-label':'我的 AI 团队'},
      h('div',{className:'eva-ai-team__sidebar-header'},h('h2',null,'我的 AI 团队')),
      h('div',{className:'eva-ai-team__roles'},[['assistant','助理','连接助理'],['persona','分身','创建分身']].map(([role,label,action])=>h('section',{className:'eva-ai-team__role',key:role},h('div',{className:'eva-ai-team__role-heading'},h('h3',null,label),h(Button,{theme:'borderless',size:'small',icon:h(Plus$c,{size:16}),'aria-label':action,onClick:()=>open(role==='assistant'?'connect':'create')},action)),snapshot.identities.filter(i=>i.role===role).map(identityItem),!snapshot.identities.some(i=>i.role===role)&&h('p',{className:'eva-ai-team__notice'},role==='assistant'?'连接已有本地助理，开始团队会话。':'从本地助理自动创建云端分身。'))),
        h('section',{className:'eva-ai-team__role'},h('div',{className:'eva-ai-team__role-heading'},h('button',{type:'button',className:'eva-ai-team__identity-button'+(!identity?' is-selected':''),'aria-current':!identity?'true':undefined,onClick:()=>choose(null,null)},h(Users,{size:18}),h('span',null,'数字员工')),h('span',{className:'eva-ai-team__identity-meta'},'未接入'))))),
    h('main',{className:'eva-ai-team__main'},
      snapshot.storageWarning&&h('p',{className:'eva-ai-team__notice',role:'status'},snapshot.storageWarning),
      identity?h(React.Fragment,null,h('div',{className:'eva-ai-team__toolbar'},h('div',{className:'eva-ai-team__toolbar-meta'},h('strong',null,identity.name),h('span',null,status(identity))),h(Button,{theme:'borderless',onClick:()=>open('details')},'查看配置'),h(Button,{theme:'solid',type:'primary',onClick:()=>choose(identity.id,null)},'新建对话')),
        identity.status==='offline'&&h('p',{className:'eva-ai-team__notice',role:'status'},'本地助理离线，历史记录仍可查看；上线后可继续发送。'),
        identity.role==='persona'&&identity.syncStatus==='error'&&h(Button,{theme:'borderless',onClick:()=>store.syncPersona(identity.id).catch(e=>setError(e.message))},'重试同步'),
        !modal&&error&&h('p',{className:'eva-ai-team__error',role:'alert'},error),
        h(ChannelsView,{key:draftKey,source,onOpenTask:()=>{}})):
      h('div',{className:'eva-ai-team__empty'},h(Users,{size:32}),h('h2',null,'暂无可用的数字员工'),h('p',null,'接入公司数字员工后，即可在这里使用。'))),
    h('div',{className:'eva-ai-team__modal-host',ref:host}),
    modal&&h(Modal,{visible:true,title:modal==='connect'?'连接本地助理':modal==='create'?'创建分身':'配置详情',className:'eva-ai-team__modal',getPopupContainer:()=>host.current,onCancel:close,maskClosable:!busy,closable:!busy,closeOnEsc:!busy,width:480,cancelText:'取消',confirmLoading:busy,okText:modal==='connect'?'连接助理':'创建分身',okButtonProps:{disabled:!sourceId||!sources.find(l=>l.id===sourceId)?.online},cancelButtonProps:{disabled:busy},onOk:submit,...(modal==='details'?{footer:h(Button,{onClick:close},'关闭')}: {})},
      modal==='details'?h('div',{className:'eva-ai-team__details'},detailRows.map(([label,value])=>h('div',{className:'eva-ai-team__detail-row',key:label},h('span',null,label),h('span',null,value)))):
      h('div',{className:'eva-ai-team__form',ref:form},h('p',null,modal==='connect'?'选择要连接的本地助理。':'选择来源助理，自动同步配置并创建分身。'),h('label',{className:'eva-ai-team__field'},h('span',null,'来源助理'),h(Select,{value:sourceId,placeholder:'选择本地助理',disabled:busy,getPopupContainer:()=>form.current||host.current,'aria-label':'来源助理',onChange:value=>{setSourceId(value);setError('');}},sources.map(l=>h(Select.Option,{key:l.id,value:l.id,disabled:!l.online},l.name+(l.online?'':'（离线）'))))),sources.length===0&&h('p',{className:'eva-ai-team__notice'},'所有已有助理均已连接。可以在个人 Eva 同学中管理本地助理。'),error&&h('p',{className:'eva-ai-team__error',role:'alert'},error))));
}

    function cut(needle,replacement,label){source=root.__evaCut(source,needle,replacement,'IM '+label);}
    cut("function messageSource(){const rt=loadSpaces(),ct={},ut=rt.map(mt=>({id:\"space:\"+mt.id,name:mt.name})),pt=rt.flatMap(mt=>channelsOfSpace(mt.id).map(gt=>(ct[gt.id]=mt.name,{...gt,category:\"space:\"+mt.id})));DMS.forEach(mt=>{ct[mt.id]=\"私聊消息\"});return{channels:[...pt,...DMS.map(mt=>({...mt,category:\"scope:dm\"}))],cats:[...ut,{id:\"scope:dm\",name:\"私聊消息\"}],messages:{...CHANNEL_MESSAGES,...OWN_MESSAGES},threadMessages:{...THREAD_MESSAGES,...OWN_THREAD_MESSAGES},scopeNameOf:ct}}",
      "function messageSource(evaMessageMode,evaSnapshot,evaIdentity,evaSession){if(evaMessageMode===\"my-ai\"){if(!evaIdentity)return{sidebarVariant:\"ai-sessions\",channels:[],cats:[],messages:{},threadMessages:{},scopeNameOf:{}};const id=evaSession?.id??\"draft:\"+evaIdentity.id,channel={id,name:evaSession?.title??\"新对话\",members:1,threads:[],category:evaIdentity.id,conversationKind:\"openclaw-session\",identityId:evaIdentity.id,identityName:evaIdentity.name,identityAvatarUrl:window.EvaAvatar.uri({kind:\"person\",id:evaIdentity.id}),lastAt:evaSession?.updatedAt??\"\",unread:0};return{sidebarVariant:\"ai-sessions\",conversationOnly:true,channels:[channel],cats:[],messages:{[id]:(evaSession?.messages??[]).map(message=>({...message,sender:message.sender.uid===\"self\"?SENDERS[\"u-wangyilin\"]:message.sender,time:new Date(message.time).toLocaleTimeString(\"zh-CN\",{hour:\"2-digit\",minute:\"2-digit\",hour12:false})}))},threadMessages:{},scopeNameOf:{[id]:evaIdentity.name}}}const rt=loadSpaces(),ct={},ut=rt.map(mt=>({id:\"space:\"+mt.id,name:mt.name})),pt=rt.flatMap(mt=>channelsOfSpace(mt.id).map(gt=>(ct[gt.id]=mt.name,{...gt,category:\"space:\"+mt.id}))),evaDemo=window.__EVA_IM_DEMO??{channels:[],messages:{}},evaTeamChannels=evaDemo.channels.filter(mt=>!mt.id.startsWith(\"im-ai-\")&&!mt.id.startsWith(\"im-pilot-\"));DMS.forEach(mt=>{ct[mt.id]=\"私聊消息\"});evaTeamChannels.forEach(mt=>{ct[mt.id]=\"精选会话\"});return{channels:[...pt,...DMS.map(mt=>({...mt,category:\"scope:dm\"})),...evaTeamChannels.map(mt=>({...mt,category:\"scope:demo\"}))],cats:[...ut,{id:\"scope:dm\",name:\"私聊消息\"}],messages:{...CHANNEL_MESSAGES,...OWN_MESSAGES,...evaDemo.messages},threadMessages:{...THREAD_MESSAGES,...OWN_THREAD_MESSAGES},scopeNameOf:ct}}", "messageSource role adapter");
    cut("MessagesPage=()=>{const rt=reactExports.useMemo(()=>messageSource(),[]);return React.createElement(\"div\",{className:\"eva-msg eva-channel-surface\",\"data-eva-channel-surface\":\"global\"},React.createElement(ChannelsView,{source:rt,onOpenTask:()=>{}}))}",
      "MessagesPage=()=>{const{search:evaMessageSearch}=useLocation(),evaMessageMode=new URLSearchParams(evaMessageSearch).get(\"evaIM\")===\"my-ai\"?\"my-ai\":\"all\",rt=reactExports.useMemo(()=>messageSource(evaMessageMode),[evaMessageMode]);return React.createElement(\"div\",{className:\"eva-msg eva-channel-surface\",\"data-eva-channel-surface\":\"global\",\"data-eva-message-mode\":evaMessageMode},evaMessageMode===\"my-ai\"?React.createElement(EvaAITeamPage,{key:evaMessageMode}):React.createElement(ChannelsView,{key:evaMessageMode,source:rt,onOpenTask:()=>{}}))}", "MessagesPage role host");
    cut("React.createElement(\"div\",{className:\"ch-layout\"},React.createElement(\"div\",{className:\"ch-list\"}",
      "React.createElement(\"div\",{className:\"ch-layout\"},!ct?.conversationOnly&&React.createElement(\"div\",{className:\"ch-list\"}", "conversation-only sidebar slot");
    cut("Sa=pt.find(ci=>ci.id===Ct)??pt[0]??EMPTY_CHANNEL",
      "Sa=(ct?.conversationOnly?ct.channels[0]:pt.find(ci=>ci.id===Ct)??pt[0])??EMPTY_CHANNEL", "current selected source");
    cut("di=ci=>{const Zi=(ci??la).trim();Zi&&(vi(va,Zi),aa(\"\"),requestAnimationFrame(()=>da.current?.scrollTo({top:da.current.scrollHeight,behavior:\"smooth\"})))}",
      "di=ci=>{const Zi=(ci??la).trim();if(!Zi)return false;if(ct?.onSend){const sent=ct.onSend(Zi);if(sent===false)return false;}else vi(va,Zi);aa(\"\");requestAnimationFrame(()=>da.current?.scrollTo({top:da.current.scrollHeight,behavior:\"smooth\"}));return true}", "store send callback");
    cut("React.createElement(EvaIMComposer,{placeholder:`在 ${fa?fa.name:Sa.name} 中回复…`,onSend:di})",
      "React.createElement(EvaIMComposer,{placeholder:ct?.composerDisabled?\"本地助理离线\":`在 ${fa?fa.name:Sa.name} 中回复…`,onSend:di,initialDraft:ct?.initialDraft,onDraftChange:ct?.onDraftChange,disabled:ct?.composerDisabled})", "shared composer source configuration");
    cut("EvaIMComposer=({placeholder:rt,onSend:ct})=>{const[ut,pt]=reactExports.useState(\"\"),mt=reactExports.useRef(null),gt=()=>{const St=ut.trim();St&&(ct(St),pt(\"\"),mt.current&&(mt.current.textContent=\"\"))}",
      "EvaIMComposer=({placeholder:rt,onSend:ct,initialDraft:evaInitialDraft=\"\",onDraftChange:evaDraftChange,disabled:evaDisabled=false})=>{const[ut,pt]=reactExports.useState(evaInitialDraft),mt=reactExports.useRef(null);reactExports.useEffect(()=>{if(mt.current)mt.current.textContent=evaInitialDraft},[]);const gt=()=>{if(evaDisabled)return;const St=ut.trim();if(St&&ct(St)!==false){pt(\"\");if(mt.current)mt.current.textContent=\"\"}}", "shared composer persisted draft");
    cut("contentEditable:!0,suppressContentEditableWarning:!0,role:\"textbox\",\"aria-label\":rt,\"data-placeholder\":rt,onInput:St=>pt(St.currentTarget.textContent??\"\")",
      "contentEditable:!evaDisabled,suppressContentEditableWarning:!0,role:\"textbox\",\"aria-disabled\":evaDisabled,\"aria-label\":rt,\"data-placeholder\":rt,onInput:St=>{const text=St.currentTarget.textContent??\"\";pt(text);evaDraftChange?.(text)}", "shared composer change callback");
    cut("src:window.EvaAvatar.uri({kind:Sa.id.startsWith(\"dm-\")?\"person\":\"group\",id:Sa.id,color:Sa.color}),alt:\"\"})),React.createElement(\"div\",{className:\"wk-chat-conversation-header-channel-info\"}",
      "src:Sa.identityAvatarUrl??window.EvaAvatar.uri({kind:Sa.id.startsWith(\"dm-\")?\"person\":\"group\",id:Sa.id,color:Sa.color}),alt:\"\"})),React.createElement(\"div\",{className:\"wk-chat-conversation-header-channel-info\"}", "selected identity avatar");
    cut("React.createElement(\"span\",{className:\"ops\"},!fa&&React.createElement(\"span\",{className:`op${Mt===\"threads\"?\" is-on\":\"\"}`",
      "ct?.sidebarVariant!==\"ai-sessions\"&&React.createElement(\"span\",{className:\"ops\"},!fa&&React.createElement(\"span\",{className:`op${Mt===\"threads\"?\" is-on\":\"\"}`", "team-only header actions");
    cut("!fa&&Zi.push({separator:!0},{title:\"创建子区\"",
      "!fa&&ct?.sidebarVariant!==\"ai-sessions\"&&Zi.push({separator:!0},{title:\"创建子区\"", "team-only subzone menu");
    cut("Za=(ci,Zi)=>{xt(ci),Nt(Zi),Dt(\"none\"),Da(null)},za=ci=>",
      "Za=(ci,Zi)=>{xt(ci),Nt(Zi),Dt(\"none\"),Da(null)},evaOpenEffect=reactExports.useEffect(()=>{const evaOpen=evaEvent=>{const evaId=evaEvent.detail?.conversationId;if(!evaId||!pt.some(evaChannel=>evaChannel.id===evaId))return;La(evaId),requestAnimationFrame(()=>da.current?.scrollTo({top:0}))};window.addEventListener(\"eva-im:open\",evaOpen);return()=>window.removeEventListener(\"eva-im:open\",evaOpen)},[pt]),za=ci=>", "external conversation open effect");
    return EvaAITeamPage.toString()+'\n'+source;
  });
})(window);
