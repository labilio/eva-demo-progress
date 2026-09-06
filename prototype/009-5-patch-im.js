(function (root) {
  'use strict';
  root.__evaPatch('im', function (source) {
        var evaMessageSourceNeedle = 'function messageSource(){const rt=loadSpaces(),ct={},ut=rt.map(mt=>({id:"space:"+mt.id,name:mt.name})),pt=rt.flatMap(mt=>channelsOfSpace(mt.id).map(gt=>(ct[gt.id]=mt.name,{...gt,category:"space:"+mt.id})));DMS.forEach(mt=>{ct[mt.id]="私聊消息"});return{channels:[...pt,...DMS.map(mt=>({...mt,category:"scope:dm"}))],cats:[...ut,{id:"scope:dm",name:"私聊消息"}],messages:{...CHANNEL_MESSAGES,...OWN_MESSAGES},threadMessages:{...THREAD_MESSAGES,...OWN_THREAD_MESSAGES},scopeNameOf:ct}}';
        var evaMessageSourceReplacement = 'function messageSource(evaMessageMode){const rt=loadSpaces(),ct={},ut=rt.map(mt=>({id:"space:"+mt.id,name:mt.name})),pt=rt.flatMap(mt=>channelsOfSpace(mt.id).map(gt=>(ct[gt.id]=mt.name,{...gt,category:"space:"+mt.id}))),evaDemo=window.__EVA_IM_DEMO??{channels:[],messages:{}};DMS.forEach(mt=>{ct[mt.id]="私聊消息"});if(evaMessageMode==="my-ai"){const evaMainIdentity={id:"assistant-main",name:"王宜林的 Eva 助理",avatarUrl:window.__EVA_COLLEAGUE_PORTRAIT},evaPilotIdentity={id:"assistant-pilot",name:"飞行员E号（王宜林的分身）",avatarUrl:window.__EVA_COLLEAGUE_PORTRAIT},evaAiChannels=evaDemo.channels.filter(mt=>mt.id.startsWith("im-ai-")||mt.id.startsWith("im-pilot-")).map(mt=>{const gt=mt.id.startsWith("im-pilot-")?evaPilotIdentity:evaMainIdentity,St=[...(evaDemo.messages[mt.id]??[])].reverse().find(Ct=>Ct.kind==="text");return{...mt,category:"scope:"+gt.id,conversationKind:"openclaw-session",identityId:gt.id,identityName:gt.name,identityAvatarUrl:gt.avatarUrl,sessionPreview:St?.text?.split("\\n")[0]??"",sessionTime:mt.lastAt?.slice(11,16)??""}});evaAiChannels.forEach(mt=>{ct[mt.id]=mt.identityName});return{sidebarVariant:"ai-sessions",channels:evaAiChannels,cats:[{id:"scope:assistant-main",name:evaMainIdentity.name,avatarUrl:evaMainIdentity.avatarUrl},{id:"scope:assistant-pilot",name:evaPilotIdentity.name,avatarUrl:evaPilotIdentity.avatarUrl}],messages:{...evaDemo.messages},threadMessages:{},scopeNameOf:ct}}evaDemo.channels.forEach(mt=>{ct[mt.id]="精选会话"});return{channels:[...pt,...DMS.map(mt=>({...mt,category:"scope:dm"})),...evaDemo.channels.map(mt=>({...mt,category:"scope:demo"}))],cats:[...ut,{id:"scope:dm",name:"私聊消息"}],messages:{...CHANNEL_MESSAGES,...OWN_MESSAGES,...evaDemo.messages},threadMessages:{...THREAD_MESSAGES,...OWN_THREAD_MESSAGES},scopeNameOf:ct}}';
        source = root.__evaCut(source, evaMessageSourceNeedle, evaMessageSourceReplacement, 'IM messageSource');
        var evaMessagesPageNeedle = 'MessagesPage=()=>{const rt=reactExports.useMemo(()=>messageSource(),[]);return React.createElement("div",{className:"eva-msg eva-channel-surface","data-eva-channel-surface":"global"},React.createElement(ChannelsView,{source:rt,onOpenTask:()=>{}}))}';
        var evaMessagesPageReplacement = 'MessagesPage=()=>{const{search:evaMessageSearch}=useLocation(),evaMessageMode=new URLSearchParams(evaMessageSearch).get("evaIM")==="my-ai"?"my-ai":"all",evaLiveMemberStore=evaMembers().store,evaLiveMemberRevision=reactExports.useSyncExternalStore(evaLiveMemberStore.subscribe,evaLiveMemberStore.getSnapshot),rt=reactExports.useMemo(()=>messageSource(evaMessageMode),[evaMessageMode,evaLiveMemberRevision]);return React.createElement("div",{className:"eva-msg eva-channel-surface","data-eva-channel-surface":"global","data-eva-message-mode":evaMessageMode},React.createElement(ChannelsView,{key:evaMessageMode,source:rt,onOpenTask:()=>{}}))}';
        source = root.__evaCut(source, evaMessagesPageNeedle, evaMessagesPageReplacement, 'IM MessagesPage');

        function replaceEvaRuntimeFragment(needle, replacement, label) {
          source = root.__evaCut(source, needle, replacement, 'IM ' + label);
        }

        replaceEvaRuntimeFragment(
          'dragHandleAttributes:Ft,dragHandleListeners:Qt})=>',
          'dragHandleAttributes:Ft,dragHandleListeners:Qt,avatarUrl:It})=>',
          'identity avatar property'
        );
        replaceEvaRuntimeFragment(
          'React.createElement("span",{className:`wk-category-header__arrow${mt?" wk-category-header__arrow--collapsed":""}`},React.createElement("svg",{viewBox:"0 0 16 16",width:"16",height:"16"},React.createElement("path",{d:"M4 6l4 5 4-5z",fill:"currentColor"}))),React.createElement("span",{className:"wk-category-header__name"}',
          'React.createElement("span",{className:`wk-category-header__arrow${mt?" wk-category-header__arrow--collapsed":""}`},React.createElement("svg",{viewBox:"0 0 16 16",width:"16",height:"16"},React.createElement("path",{d:"M4 6l4 5 4-5z",fill:"currentColor"}))),It&&React.createElement("img",{className:"wk-category-header__identity-avatar",src:It,alt:""}),React.createElement("span",{className:"wk-category-header__name"}',
          'identity avatar rendering'
        );
        replaceEvaRuntimeFragment(
          'title:React.createElement(CategoryHeader,{name:ci.name,groupCount:Fi.length,unreadCount:Ki,hasMention:Ms.hasMention,isCollapsed:ro,isEmpty:Fi.length===0,onToggle:zs})',
          'title:React.createElement(CategoryHeader,{name:ci.name,groupCount:Fi.length,unreadCount:Ki,hasMention:Ms.hasMention,isCollapsed:ro,isEmpty:Fi.length===0,onToggle:zs,avatarUrl:ci.avatarUrl})',
          'identity avatar data flow'
        );
        replaceEvaRuntimeFragment(
          'externalBadge:Mt,avatarUrl:It}){return React.createElement("div",{className:classNames("wk-conv-compact-item"',
          'externalBadge:Mt,avatarUrl:It,sessionRow:evaSessionRow,sessionPreview:evaSessionPreview,sessionTime:evaSessionTime}){return React.createElement("div",{className:classNames("wk-conv-compact-item",evaSessionRow?"wk-conv-compact-item--session":void 0',
          'session row property'
        );
        replaceEvaRuntimeFragment(
          'React.createElement("span",{className:"wk-conv-compact-icon"},pt?React.createElement(ThreadIcon,{size:13}):React.createElement("img",{className:"wk-conv-compact-entity-avatar"',
          '!evaSessionRow&&React.createElement("span",{className:"wk-conv-compact-icon"},pt?React.createElement(ThreadIcon,{size:13}):React.createElement("img",{className:"wk-conv-compact-entity-avatar"',
          'session row avatar suppression'
        );
        replaceEvaRuntimeFragment(
          'React.createElement("span",{className:"wk-conv-compact-name"},rt),Mt&&',
          'React.createElement("span",{className:"wk-conv-compact-name"},rt),evaSessionRow&&evaSessionPreview&&React.createElement("span",{className:"wk-conv-compact-session-preview"},evaSessionPreview),evaSessionRow&&evaSessionTime&&React.createElement("span",{className:"wk-conv-compact-session-time"},evaSessionTime),Mt&&',
          'session row metadata'
        );
        replaceEvaRuntimeFragment(
          'avatarUrl:window.EvaAvatar.uri({kind:ci.id.startsWith("dm-")?"person":"group",id:ci.id,color:ci.color}),selected:ci.id===Ct&&!Pt',
          'avatarUrl:ci.identityAvatarUrl??window.EvaAvatar.uri({kind:ci.id.startsWith("dm-")?"person":"group",id:ci.id,color:ci.color}),sessionRow:ci.conversationKind==="openclaw-session",sessionPreview:ci.sessionPreview,sessionTime:ci.sessionTime,selected:ci.id===Ct&&!Pt',
          'session row data flow'
        );
        replaceEvaRuntimeFragment(
          'React.createElement("div",{className:"ch-list__top"},React.createElement(ForwardInput,{className:"ch-list-search",prefix:React.createElement(Search$1,{size:13}),placeholder:"搜索",value:Va,onChange:ci=>Fa(ci),showClear:!0}),React.createElement(Dropdown,{trigger:"click",position:"bottomLeft",visible:sn,onVisibleChange:cn,render:React.createElement(Dropdown.Menu,null,React.createElement(Dropdown.Item,{onClick:()=>{cn(!1),ut?(Ir(null),Qr(null),hr(!0)):pr("channel")}},"新建群聊"))},React.createElement("button",{type:"button",className:"ch-cat-gear",title:"新建"},React.createElement(Plus$c,{size:15}))))',
          'React.createElement("div",{className:"ch-list__top"},ct?.sidebarVariant==="ai-sessions"?React.createElement("div",{className:"eva-my-ai-sidebar-actions"},React.createElement(Button,{className:"eva-my-ai-sidebar-actions__create-assistant",theme:"light",icon:React.createElement(Plus$c,{size:15}),onClick:()=>Toast.info("演示：进入创建助理")},"创建助理"),React.createElement(Button,{className:"eva-my-ai-sidebar-actions__new-session",theme:"solid",type:"primary",onClick:()=>Toast.info("演示：新建 OpenClaw 会话")},"新建对话")):React.createElement(React.Fragment,null,React.createElement(ForwardInput,{className:"ch-list-search",prefix:React.createElement(Search$1,{size:13}),placeholder:"搜索",value:Va,onChange:ci=>Fa(ci),showClear:!0}),React.createElement(Dropdown,{trigger:"click",position:"bottomLeft",visible:sn,onVisibleChange:cn,render:React.createElement(Dropdown.Menu,null,React.createElement(Dropdown.Item,{onClick:()=>{cn(!1),ut?(Ir(null),Qr(null),hr(!0)):pr("channel")}},"新建群聊"))},React.createElement("button",{type:"button",className:"ch-cat-gear",title:"新建"},React.createElement(Plus$c,{size:15})))))',
          'My AI sidebar actions'
        );
        replaceEvaRuntimeFragment(
          'src:window.EvaAvatar.uri({kind:Sa.id.startsWith("dm-")?"person":"group",id:Sa.id,color:Sa.color}),alt:""})),React.createElement("div",{className:"wk-chat-conversation-header-channel-info"}',
          'src:Sa.identityAvatarUrl??window.EvaAvatar.uri({kind:Sa.id.startsWith("dm-")?"person":"group",id:Sa.id,color:Sa.color}),alt:""})),React.createElement("div",{className:"wk-chat-conversation-header-channel-info"}',
          'selected session identity avatar'
        );
        replaceEvaRuntimeFragment(
          'React.createElement("span",{className:"ops"},!fa&&React.createElement("span",{className:`op${Mt==="threads"?" is-on":""}`',
          'React.createElement("span",{className:"ops"},!fa&&ct?.sidebarVariant!=="ai-sessions"&&React.createElement("span",{className:`op${Mt==="threads"?" is-on":""}`',
          'My AI team-only subzone action'
        );
        replaceEvaRuntimeFragment(
          '!fa&&Zi.push({separator:!0},{title:"创建子区"',
          '!fa&&ct?.sidebarVariant!=="ai-sessions"&&Zi.push({separator:!0},{title:"创建子区"',
          'My AI context menu subzone action'
        );
        source = root.__evaCut(source,
          'Za=(ci,Zi)=>{xt(ci),Nt(Zi),Dt("none"),Da(null)},za=ci=>',
          'Za=(ci,Zi)=>{xt(ci),Nt(Zi),Dt("none"),Da(null)},evaOpenEffect=reactExports.useEffect(()=>{const evaOpen=evaEvent=>{const evaId=evaEvent.detail?.conversationId;if(!evaId||!pt.some(evaChannel=>evaChannel.id===evaId))return;La(evaId),requestAnimationFrame(()=>da.current?.scrollTo({top:0}))};window.addEventListener("eva-im:open",evaOpen);return()=>window.removeEventListener("eva-im:open",evaOpen)},[pt]),za=ci=>',
          'IM external conversation open effect'
        );
    source=root.__evaCut(source,
      'ChannelsView=({onOpenTask:rt,source:ct})=>{const ut=!!ct,[pt,mt]=reactExports.useState(()=>ct?.channels??channelsOf()),',
      'ChannelsView=({onOpenTask:rt,source:ct,membershipProjectId:evaMembershipProjectId,onManageProject:evaManageProject})=>{const evaMemberStore=evaMembers().store,evaMemberRevision=reactExports.useSyncExternalStore(evaMemberStore.subscribe,evaMemberStore.getSnapshot),evaActorId=evaMemberStore.snapshot().actorId,[evaGroupCreateOpen,setEvaGroupCreateOpen]=reactExports.useState(false);const ut=!!ct,[evaChannelDrafts,mt]=reactExports.useState(()=>evaMembershipProjectId?evaMemberStore.channels(evaMembershipProjectId,evaActorId,channelsOf()):ct?.channels??channelsOf()),pt=evaMembershipProjectId?evaMemberStore.channels(evaMembershipProjectId,evaActorId,evaChannelDrafts):evaChannelDrafts,',
      'IM 项目群成员数据源');
    source=root.__evaCut(source,'Sa=pt.find(ci=>ci.id===Ct)??pt[0]??EMPTY_CHANNEL,',
      'evaMemberReset=reactExports.useEffect(()=>{Nt(null);Dt("none");Qt(null);Ht(null);setEvaGroupCreateOpen(false);},[evaMembershipProjectId,evaActorId]),evaSelectedChannel=pt.find(ci=>ci.id===Ct)??pt[0]??EMPTY_CHANNEL,Sa={...evaSelectedChannel,...evaMemberStore.chatSettings(evaSelectedChannel.id)},', 'IM 身份切换重置');
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
    const evaThreadBody=root.__evaCut(evaOldInfo.slice(evaThreadStart+3,evaThreadEnd),',React.createElement(InfoRow,{label:"GROUP.md",value:"未配置"})','','Remove unsupported thread GROUP.md placeholder');
    source=root.__evaCut(source,evaOldInfo,
      'React.createElement("div",{className:"ch-right-panel ch-right-panel--overlay"},fa?React.createElement(React.Fragment,null,React.createElement("div",{className:"ch-right-panel__head ch-info-head"},React.createElement("button",{type:"button",onClick:()=>Dt("none"),"aria-label":"关闭子区信息"},React.createElement(X,{size:20})),"子区信息"),'+evaThreadBody+'):React.createElement(evaMembers().ui.ChatSettings,{key:Sa.id+":"+evaActorId,channel:Sa,onClose:()=>Dt("none"),onManageProject:evaManageProject,onClear:()=>evaMemberStore.setChatPreferences(va,evaActorId,{clearedCount:evaAllMessages.length})}))',
      'Octo group and direct chat settings adapter');
    source=root.__evaCut(source,'return React.createElement(I18nProvider,null,React.createElement("div",{className:"ch-layout"}',
      'return React.createElement(I18nProvider,null,evaMembershipProjectId&&React.createElement(evaMembers().ui.CreateGroup,{projectId:evaMembershipProjectId,visible:evaGroupCreateOpen,onClose:()=>setEvaGroupCreateOpen(false),onCreated:evaId=>{mt(evaPrevious=>evaMemberStore.channels(evaMembershipProjectId,evaActorId,evaPrevious));xt(evaId);Nt(null);Dt("none")}}),React.createElement("div",{className:"ch-layout"}', 'IM 创建群聊组件');
    source=root.__evaCut(source,'channelsOfSpace=rt=>CHANNELS_BY_SPACE[rt]??[]', 'channelsOfSpace=rt=>evaMembers().store.channels(rt,evaMembers().store.snapshot().actorId,CHANNELS_BY_SPACE[rt]??[])','团队消息复用项目群访问范围');
    source=root.__evaCut(source,'React.createElement("div",{className:"ch-list__scroll"},wi,Ai,',
      'React.createElement("div",{className:"ch-list__scroll"},ct?.sidebarVariant!=="ai-sessions"&&React.createElement(evaMembers().ui.GroupInvitations,{projectId:evaMembershipProjectId}),wi,Ai,','群邀请收件入口');
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
      'evaAllMessages=reactExports.useMemo(()=>[...ca,...evaMemberStore.messagesFor(va,evaActorId),...oa[va]??[]],[ca,va,oa,evaActorId,evaMemberRevision]),Ta=evaMemberStore.visibleMessages(va,evaActorId,evaAllMessages)','消息记录持久化读取');
    source=root.__evaCut(source,'vi=(ci,Zi)=>{const Fi=new Date,','vi=(ci,Zi)=>{if(evaMemberStore.canRead(ci,evaActorId)){evaMemberStore.sendMessage(ci,evaActorId,Zi);return;}const Fi=new Date,','群消息按当前人类身份发送');
    source=root.__evaCut(source,'mt(Ki=>Ki.map(ro=>ro.id===Sa.id?{...ro,threads:[Fi,...ro.threads]}:ro)),pa(!1)',
      'evaMemberStore.canRead(Sa.id,evaActorId)&&evaMemberStore.createThread(Fi.id,Sa.id,{...Fi,creator_name:evaMemberStore.person(evaActorId)?.name},evaActorId),mt(Ki=>Ki.map(ro=>ro.id===Sa.id?{...ro,threads:[Fi,...ro.threads]}:ro)),pa(!1)','子区注册继承关系');
    source=root.__evaCut(source,'onOk:()=>{mt(Zi=>Zi.map(Fi=>Fi.id!==Sa.id?Fi:{...Fi,threads:Fi.threads.filter(Ki=>Ki.id!==ci.id)}))','onOk:()=>{evaMemberStore.updateThread(ci.id,{deleted:true},evaActorId);mt(Zi=>Zi.map(Fi=>Fi.id!==Sa.id?Fi:{...Fi,threads:Fi.threads.filter(Ki=>Ki.id!==ci.id)}))','子区删除持久化');
    source=root.__evaCut(source,'ai=(ci,Zi,Fi)=>mt(Ki=>Ki.map(ro=>ro.id!==ci?ro:{...ro,threads:ro.threads.map(ns=>ns.id===Zi?{...ns,...Fi}:ns)}))',
      'ai=(ci,Zi,Fi)=>{if(evaMemberStore.canRead(ci,evaActorId)){evaMemberStore.updateThread(Zi,Fi,evaActorId);}mt(Ki=>Ki.map(ro=>ro.id!==ci?ro:{...ro,threads:ro.threads.map(ns=>ns.id===Zi?{...ns,...Fi}:ns)}))}','子区修改持久化');
    source=root.__evaCut(source,'React.createElement(EvaIMComposer,{placeholder:`在 ${fa?fa.name:Sa.name} 中回复…`',
      'React.createElement(EvaIMComposer,{key:evaActorId+":"+va,scopeId:evaMemberStore.canRead(Sa.id,evaActorId)?Sa.id:null,placeholder:`在 ${fa?fa.name:Sa.name} 中回复…`','输入区身份重置与提及范围');
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
    source=root.__evaCut(source,'EvaIMComposer=({placeholder:rt,onSend:ct})=>{const[ut,pt]=reactExports.useState("")',
      'EvaIMComposer=({placeholder:rt,onSend:ct,scopeId:evaMentionScope})=>{const[evaMentionOpen,setEvaMentionOpen]=reactExports.useState(false);const[ut,pt]=reactExports.useState("")','共享输入区提及状态');
    source=root.__evaCut(source,'return React.createElement("div",{className:"wk-messageinput-box"},React.createElement("div",{className:"wk-messageinput-card"}',
      'return React.createElement("div",{className:"wk-messageinput-box"},evaMentionScope&&React.createElement(evaMembers().ui.MentionPicker,{scopeId:evaMentionScope,visible:evaMentionOpen,onClose:()=>setEvaMentionOpen(false),onChoose:evaName=>{const evaText=ut+"@"+evaName+" ";pt(evaText);if(mt.current)mt.current.textContent=evaText}}),React.createElement("div",{className:"wk-messageinput-card"}','提及选人复用输入区');
    source=root.__evaCut(source,'tabIndex:0,title:"提及","aria-label":"提及"},React.createElement(AtSign',
      'tabIndex:0,title:"提及","aria-label":"提及",onClick:()=>evaMentionScope&&setEvaMentionOpen(true),onKeyDown:evaEvent=>{if(evaMentionScope&&(evaEvent.key==="Enter"||evaEvent.key===" ")){evaEvent.preventDefault();setEvaMentionOpen(true)}}},React.createElement(AtSign','提及按钮接入');
    source=root.__evaCut(source,'!fa&&ct?.sidebarVariant!=="ai-sessions"&&React.createElement("span",{className:`op','!fa&&!Sa.id.startsWith("dm-")&&Sa.chatType!=="direct"&&ct?.sidebarVariant!=="ai-sessions"&&React.createElement("span",{className:`op','Hide group subzones in direct chat');
    source=root.__evaCut(source,'pt=evaMembershipProjectId?evaMemberStore.channels(evaMembershipProjectId,evaActorId,evaChannelDrafts):ct?[...ct.channels,...evaChannelDrafts.filter(evaC=>evaC.id.startsWith("dm-")&&!ct.channels.some(evaKnown=>evaKnown.id===evaC.id))]:evaChannelDrafts,gt=',
      'evaBaseChannels=evaMembershipProjectId?evaMemberStore.channels(evaMembershipProjectId,evaActorId,evaChannelDrafts):ct?[...ct.channels,...evaChannelDrafts.filter(evaC=>evaC.id.startsWith("dm-")&&!ct.channels.some(evaKnown=>evaKnown.id===evaC.id))]:evaChannelDrafts,pt=evaBaseChannels.map(evaC=>{const evaP=evaMemberStore.chatPreferences(evaC.id,evaActorId),evaS=evaMemberStore.chatSettings(evaC.id);return {...evaC,...evaS,name:evaS.name||evaC.name,identityAvatarUrl:evaS.avatar||evaC.identityAvatarUrl,unread:evaP.mute?0:evaC.unread,evaPinned:!!evaP.top}}).sort((a,b)=>Number(b.evaPinned)-Number(a.evaPinned)),gt=', 'Project shared conversation preferences');
    return source;
  });
})(window);
