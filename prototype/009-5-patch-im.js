(function (root) {
  'use strict';
  root.__evaPatch('im', function (source) {
        var evaMessageSourceNeedle = 'function messageSource(){const rt=loadSpaces(),ct={},ut=rt.map(mt=>({id:"space:"+mt.id,name:mt.name})),pt=rt.flatMap(mt=>channelsOfSpace(mt.id).map(gt=>(ct[gt.id]=mt.name,{...gt,category:"space:"+mt.id})));DMS.forEach(mt=>{ct[mt.id]="私聊消息"});return{channels:[...pt,...DMS.map(mt=>({...mt,category:"scope:dm"}))],cats:[...ut,{id:"scope:dm",name:"私聊消息"}],messages:{...CHANNEL_MESSAGES,...OWN_MESSAGES},threadMessages:{...THREAD_MESSAGES,...OWN_THREAD_MESSAGES},scopeNameOf:ct}}';
        var evaMessageSourceReplacement = 'function messageSource(evaMessageMode){const rt=loadSpaces(),ct={},ut=rt.map(mt=>({id:"space:"+mt.id,name:mt.name})),pt=rt.flatMap(mt=>channelsOfSpace(mt.id).map(gt=>(ct[gt.id]=mt.name,{...gt,category:"space:"+mt.id}))),evaDemo=window.__EVA_IM_DEMO??{channels:[],messages:{}};DMS.forEach(mt=>{ct[mt.id]="私聊消息"});if(evaMessageMode==="my-ai"){const evaMainIdentity={id:"assistant-main",name:"王宜林的 Eva 助理",avatarUrl:window.__EVA_COLLEAGUE_PORTRAIT},evaPilotIdentity={id:"assistant-pilot",name:"飞行员E号（王宜林的分身）",avatarUrl:window.__EVA_COLLEAGUE_PORTRAIT},evaAiChannels=evaDemo.channels.filter(mt=>mt.id.startsWith("im-ai-")||mt.id.startsWith("im-pilot-")).map(mt=>{const gt=mt.id.startsWith("im-pilot-")?evaPilotIdentity:evaMainIdentity,St=[...(evaDemo.messages[mt.id]??[])].reverse().find(Ct=>Ct.kind==="text");return{...mt,category:"scope:"+gt.id,conversationKind:"openclaw-session",identityId:gt.id,identityName:gt.name,identityAvatarUrl:gt.avatarUrl,sessionPreview:St?.text?.split("\\n")[0]??"",sessionTime:mt.lastAt?.slice(11,16)??""}});evaAiChannels.forEach(mt=>{ct[mt.id]=mt.identityName});return{sidebarVariant:"ai-sessions",channels:evaAiChannels,cats:[{id:"scope:assistant-main",name:evaMainIdentity.name,avatarUrl:evaMainIdentity.avatarUrl},{id:"scope:assistant-pilot",name:evaPilotIdentity.name,avatarUrl:evaPilotIdentity.avatarUrl}],messages:{...evaDemo.messages},threadMessages:{},scopeNameOf:ct}}evaDemo.channels.forEach(mt=>{ct[mt.id]="精选会话"});return{channels:[...pt,...DMS.map(mt=>({...mt,category:"scope:dm"})),...evaDemo.channels.map(mt=>({...mt,category:"scope:demo"}))],cats:[...ut,{id:"scope:dm",name:"私聊消息"}],messages:{...CHANNEL_MESSAGES,...OWN_MESSAGES,...evaDemo.messages},threadMessages:{...THREAD_MESSAGES,...OWN_THREAD_MESSAGES},scopeNameOf:ct}}';
        source = root.__evaCut(source, evaMessageSourceNeedle, evaMessageSourceReplacement, 'IM messageSource');
        var evaMessagesPageNeedle = 'MessagesPage=()=>{const rt=reactExports.useMemo(()=>messageSource(),[]);return React.createElement("div",{className:"eva-msg eva-channel-surface","data-eva-channel-surface":"global"},React.createElement(ChannelsView,{source:rt,onOpenTask:()=>{}}))}';
        var evaMessagesPageReplacement = 'MessagesPage=()=>{const{search:evaMessageSearch}=useLocation(),evaMessageMode=new URLSearchParams(evaMessageSearch).get("evaIM")==="my-ai"?"my-ai":"all",rt=reactExports.useMemo(()=>messageSource(evaMessageMode),[evaMessageMode]);return React.createElement("div",{className:"eva-msg eva-channel-surface","data-eva-channel-surface":"global","data-eva-message-mode":evaMessageMode},React.createElement(ChannelsView,{key:evaMessageMode,source:rt,onOpenTask:()=>{}}))}';
        source = root.__evaCut(source, evaMessagesPageNeedle, evaMessagesPageReplacement, 'IM MessagesPage');

        function replaceEvaRuntimeFragment(needle, replacement, label) {
          source = root.__evaCut(source, needle, replacement, 'IM ' + label);
        }

        replaceEvaRuntimeFragment(
          'React.createElement("div",{className:"ch-list"},React.createElement("div",{className:"ch-list__top"}',
          'React.createElement("div",{className:"ch-list"},React.createElement("div",{className:"eva-conversation-rail-resizer",role:"separator","aria-label":"调整中间栏宽度","aria-orientation":"vertical",tabIndex:0,"data-eva-conversation-rail-resizer":!0}),React.createElement("div",{className:"ch-list__top"}',
          'shared conversation rail resizer'
        );

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
          'title:React.createElement(CategoryHeader,{name:ci.name,groupCount:Fi.length,unreadCount:Ki,hasMention:Ms.hasMention,isCollapsed:ro,isEmpty:Fi.length===0,onToggle:()=>{ct?.sidebarVariant==="ai-sessions"&&Fi[0]&&La(Fi[0].id),zs()},avatarUrl:ci.avatarUrl})',
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
          'React.createElement("div",{className:"ch-list__top"},ct?.sidebarVariant==="ai-sessions"?null:React.createElement(React.Fragment,null,React.createElement(ForwardInput,{className:"ch-list-search",prefix:React.createElement(Search$1,{size:13}),placeholder:"搜索",value:Va,onChange:ci=>Fa(ci),showClear:!0}),React.createElement(Dropdown,{trigger:"click",position:"bottomLeft",visible:sn,onVisibleChange:cn,render:React.createElement(Dropdown.Menu,null,React.createElement(Dropdown.Item,{onClick:()=>{cn(!1),ut?(Ir(null),Qr(null),hr(!0)):pr("channel")}},"新建群聊"))},React.createElement("button",{type:"button",className:"ch-cat-gear",title:"新建"},React.createElement(Plus$c,{size:15})))))',
          'My AI sidebar actions'
        );
        replaceEvaRuntimeFragment(
          'className:`eva-space-card-foundation eva-space-card-foundation--compact eva-space-card eva-space-card--${ci.id.slice(6)}`,',
          'className:`eva-space-card-foundation eva-space-card-foundation--compact eva-space-card eva-space-card--${ci.id.slice(6)}${ct?.sidebarVariant==="ai-sessions"&&Fi.some(ns=>ns.id===Ct&&!Pt)?" eva-my-ai-identity-active":""}`,',
          'My AI identity active state'
        );
        replaceEvaRuntimeFragment(
          'extra:ci.id.startsWith("space:")?React.createElement(Button,{className:"eva-space-task-button",icon:React.createElement(ClipboardList,{size:16}),theme:"borderless",type:"tertiary",size:"small","aria-label":`打开${ci.name}任务页`,title:`打开${ci.name}任务页`,onClick:ns=>{ns.stopPropagation(),window.__evaOpenWorkspaceFromTree?.(ci.id.slice(6),"tasks")}}):null,headerStyle:',
          'extra:ci.id.startsWith("space:")?React.createElement(Button,{className:"eva-space-task-button",icon:React.createElement(ClipboardList,{size:16}),theme:"borderless",type:"tertiary",size:"small","aria-label":`打开${ci.name}任务页`,title:`打开${ci.name}任务页`,onClick:ns=>{ns.stopPropagation(),window.__evaOpenWorkspaceFromTree?.(ci.id.slice(6),"tasks")}}):ct?.sidebarVariant==="ai-sessions"?React.createElement(React.Fragment,null,React.createElement(Button,{className:"eva-my-ai-identity-new-session",icon:React.createElement(Plus$c,{size:16}),theme:"borderless",type:"tertiary",size:"small","aria-label":`新建${ci.name}会话`,title:"新建会话",onClick:ns=>{ns.stopPropagation(),Toast.info(`演示：为${ci.name}新建 OpenClaw 会话`)}}),React.createElement("button",{type:"button",className:"eva-my-ai-identity-toggle","aria-label":`${ro?"展开":"收起"}${ci.name}`,title:ro?"展开":"收起",onClick:ns=>{ns.stopPropagation(),zs()}},React.createElement(ro?ChevronDown:ChevronRight,{size:16}))):null,headerStyle:',
          'My AI identity new session action'
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
    return source;
  });
})(window);
