(function (root) {
  'use strict';
  root.__evaPatch('sidebar', function (source) {
        /* Keep desktop sidebar sizing in the native layout state instead of a visual overlay. */
        var sidebarWidthReplacements = [
          [
            'DEFAULT_SIDER_WIDTH=260,DESKTOP_COLLAPSED_WIDTH=0,SIDER_MIN_WIDTH=200',
            'DEFAULT_SIDER_WIDTH=248,DESKTOP_COLLAPSED_WIDTH=84,SIDER_MIN_WIDTH=200'
          ],
          [
            'Layout$1=({sider:rt,onSessionClick:ct})=>{const[ut,pt]=reactExports.useState(!1),[mt,gt]=reactExports.useState(!1),',
            'Layout$1=({sider:rt,onSessionClick:ct})=>{const[ut,pt]=reactExports.useState(!1),[evaSiderHidden,setEvaSiderHidden]=reactExports.useState(!1),[mt,gt]=reactExports.useState(!1),'
          ],
          [
            'storageKey:"sider-width-px"',
            'storageKey:"eva-unified-sider-width-px"'
          ],
          [
            'style:{"--eva-sider-w":`${ut?0:Ir}px`}',
            'style:{"--eva-sider-w":`${evaSiderHidden?0:ut?mt?0:DESKTOP_COLLAPSED_WIDTH:Ir}px`}'
          ],
          [
            'React.createElement(LayoutComponent.Sider,{collapsedWidth:0,collapsed:ut,width:Ir,',
            'React.createElement(LayoutComponent.Sider,{collapsedWidth:mt?0:DESKTOP_COLLAPSED_WIDTH,collapsed:ut,width:Ir,'
          ],
          [
            'value:{isMobile:mt,siderCollapsed:ut,setSiderCollapsed:pt}',
            'value:{isMobile:mt,siderCollapsed:ut,setSiderCollapsed:pt,siderHidden:evaSiderHidden,setSiderHidden:setEvaSiderHidden}'
          ],
          [
            'ir=!!Pt?.setSiderCollapsed&&!(Pt?.isMobile&&sn)',
            'ir=!!(Pt?.isMobile?Pt?.setSiderCollapsed:Pt?.setSiderHidden)&&!(Pt?.isMobile&&sn)'
          ],
          [
            'pr=Pt?.siderCollapsed?ct("common.expandMore",{defaultValue:"Expand sidebar"}):ct("common.collapse",{defaultValue:"Collapse sidebar"})',
            'pr=(Pt?.isMobile?Pt?.siderCollapsed:Pt?.siderHidden)?ct("common.expandMore",{defaultValue:"Expand sidebar"}):ct("common.collapse",{defaultValue:"Collapse sidebar"})'
          ],
          [
            'ur=()=>{!ir||!Pt?.setSiderCollapsed||Pt.setSiderCollapsed(!Pt.siderCollapsed)}',
            'ur=()=>{if(!ir)return;Pt?.isMobile?Pt?.setSiderCollapsed?.(!Pt.siderCollapsed):Pt?.setSiderHidden?.(!Pt.siderHidden)}'
          ],
          [
            '}:{position:"relative",overflow:"visible"};return React.createElement(LayoutContext.Provider',
            '}:{position:"relative",overflow:"visible",marginLeft:evaSiderHidden?-(ut?DESKTOP_COLLAPSED_WIDTH:Ir):0,transition:"margin-left 180ms ease",willChange:"margin-left",pointerEvents:evaSiderHidden?"none":"auto"};return React.createElement(LayoutContext.Provider'
          ],
          [
            'className:classNames("!bg-2 layout-sider",{collapsed:ut})',
            'className:classNames("!bg-2 layout-sider",{collapsed:ut,"eva-sider-hidden":!mt&&evaSiderHidden})'
          ],
          [
            'if(isPrimaryApplicationShortcut(gt,{key:"b",targetGuard:"embedded-editor"})){gt.preventDefault(),ct();return}',
            ''
          ],
          [
            ',onDoubleClick:()=>{Ht(ct),Pt?.(!1)}',
            ''
          ],
          [
            ',["切换侧栏","⌘ B"]',
            ''
          ]
        ];
        source = root.__evaCutAll(source, sidebarWidthReplacements, '侧栏宽度');

        /*
         * Sidebar architecture: React owns mode and first-level navigation.
         * Personal/team entries are separate configs; common entries are defined once.
         * Inapplicable entries are never mounted, so hidden DOM cannot leak across modes.
         */
        var siderComponentAnchor = 'Sider=({onSessionClick:rt,collapsed:ct=!1})=>{';
        var siderArchitecture = String.raw`
EvaContactsIcon=createLucideIcon("book-user",[["path",{d:"M15 13a3 3 0 1 0-6 0",key:"book-user-avatar"}],["path",{d:"M17 18a5 5 0 0 0-10 0",key:"book-user-profile"}],["path",{d:"M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20",key:"book-user-book"}]]),EvaDriveIcon=createLucideIcon("hard-drive",[["path",{d:"M10 16h.01",key:"1ra8yu"}],["path",{d:"M2.212 11.577a2 2 0 0 0-.212.896V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5.527a2 2 0 0 0-.212-.896L18.55 5.11A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",key:"1jiv2b"}],["path",{d:"M21.946 12.013H2.054",key:"12xlhc"}],["path",{d:"M6 16h.01",key:"1l4qyb"}]]),
EVA_PERSONAL_NAV=Object.freeze(["new-chat","workboard","automation"]),EVA_TEAM_NAV=Object.freeze(["messages","my-ai","projects","contacts","drive"]),EVA_COMMON_NAV=Object.freeze(["digital-employees","connection-center","sites"]),
evaSidebarMode=(rt,ct)=>{if(rt==="/collab"||rt==="/messages"||rt==="/contacts"||rt==="/drive")return"collaboration";if(rt==="/guid"||rt.indexOf("/conversation/")===0||rt==="/scheduled"||rt.indexOf("/eva-stub/%E5%B7%A5%E4%BD%9C%E6%9D%BF")===0)return"personal";const ut=new URLSearchParams(ct||"").get("evaMode");return ut==="collaboration"?"collaboration":"personal"},
evaSidebarSelectionFromRoute=(rt,ct)=>{if(rt==="/messages")return new URLSearchParams(ct||"").get("evaIM")==="my-ai"?"my-ai":"messages";if(rt==="/collab")return"projects";if(rt==="/contacts")return"contacts";if(rt==="/drive")return"drive";if(rt==="/scheduled")return"automation";if(rt==="/guid"||rt.indexOf("/conversation/")===0)return"new-chat";if(rt.indexOf("/eva-stub/%E5%B7%A5%E4%BD%9C%E6%9D%BF")===0)return"workboard";if(rt.indexOf("/eva-stub/%E6%95%B0%E5%AD%97%E5%91%98%E5%B7%A5")===0)return"digital-employees";if(rt.indexOf("/eva-stub/%E6%8A%80%E8%83%BD")===0)return"connection-center";if(rt.indexOf("/eva-stub/%E7%AB%99%E7%82%B9")===0)return"sites";return""},
EvaPersonalPlusIcon=createLucideIcon("plus",[["path",{d:"M5 12h14",key:"personal-plus-horizontal"}],["path",{d:"M12 5v14",key:"personal-plus-vertical"}]]),
EvaPersonalEntry=rt=>React.createElement("div",{className:classNames("eva-personal-entry",rt.collapsed&&"is-collapsed",rt.isActive&&"is-selected"),"data-eva-my-assistant-identity":"true","aria-current":rt.isActive?"page":void 0},React.createElement("button",{type:"button",className:"eva-personal-entry__main",onClick:rt.onClick,"aria-label":"Eva 同学",title:"Eva 同学"},React.createElement("span",{className:"eva-personal-entry__logo"},React.createElement("img",{src:window.__EVA_COLLEAGUE_PORTRAIT,alt:""})),React.createElement("span",{className:"eva-personal-entry__label"},"Eva 同学")),React.createElement("span",{className:"eva-personal-entry__plus","aria-hidden":"true"},React.createElement(EvaPersonalPlusIcon,{size:16,strokeWidth:1.8})),React.createElement("span",{className:"eva-personal-assistant-icon-template",hidden:!0,"aria-hidden":"true"},React.createElement(Brain$8,{size:18,strokeWidth:1.8}))),
EvaMyAiIcon=()=>{const rt=window.__EVA_MY_ASSISTANT_IDENTITY||{};return React.createElement("span",{className:"eva-identity-avatar eva-identity-avatar--nav",role:"img","aria-label":rt.name&&rt.ownerName?rt.name+"，"+rt.ownerName+"的 Eva 分身":"我的AI"},React.createElement("img",{className:"eva-identity-avatar__logo",src:rt.logo,alt:""}),React.createElement("img",{className:"eva-identity-avatar__owner",src:rt.ownerAvatar,alt:"",title:rt.ownerName?"由"+rt.ownerName+"创建":void 0}))},
EvaSidebarSection=({title:rt,items:ct,render:ut,collapsed:pt})=>React.createElement("section",{className:classNames("eva-nav-section",pt&&"is-collapsed"),"aria-label":rt},React.createElement("div",{className:"eva-nav-section__title"},rt),React.createElement("div",{className:"eva-nav-section__items"},ct.map(mt=>React.createElement("div",{className:"eva-nav-entry",key:mt,"data-eva-nav-id":mt},ut(mt))))),
EvaSidebarNavigation=rt=>{const ct={isMobile:rt.isMobile,collapsed:rt.isMobile&&rt.collapsed,siderTooltipProps:rt.siderTooltipProps},pt=gt=>{switch(gt){case"search":return React.createElement(SiderSearchEntry,{key:gt,...ct,onConversationSelect:rt.onConversationSelect,onSessionClick:rt.onSessionClick});case"new-chat":return React.createElement(EvaPersonalEntry,{key:gt,...ct,isActive:rt.activeNavId===gt,onClick:()=>rt.navigate("/guid")});case"workboard":return React.createElement(SiderEvaStub,{key:gt,label:"工作板",icon:React.createElement(Workbench,{theme:"outline",size:"16",fill:"currentColor",className:"block leading-none",style:{lineHeight:0}}),...ct,isActive:rt.activeNavId===gt,onClick:()=>rt.navigate("/eva-stub/工作板")});case"automation":return React.createElement(SiderEvaStub,{key:gt,label:"自动化任务",icon:React.createElement(AlarmClock$4,{theme:"outline",size:"16",fill:"currentColor",className:"block leading-none",style:{lineHeight:0}}),...ct,isActive:rt.activeNavId===gt,onClick:()=>rt.navigate("/scheduled")});case"messages":return React.createElement(SiderMessagesEntry,{key:gt,...ct,isActive:rt.activeNavId===gt,onClick:()=>rt.navigate("/messages")});case"my-ai":return React.createElement("div",{key:gt,id:"eva-my-avatar-nav","data-eva-my-avatar-nav":"true"},React.createElement(SiderEvaStub,{label:"我的AI",icon:React.createElement(EvaMyAiIcon,null),...ct,isActive:rt.activeNavId===gt,onClick:()=>{}}));case"projects":return React.createElement(SiderCollabEntry,{key:gt,...ct,isActive:rt.activeNavId===gt,onClick:()=>{window.dispatchEvent(new CustomEvent("eva:open-project-directory")),rt.navigate("/collab")}});case"contacts":return React.createElement("div",{key:gt,id:"eva-contacts-nav","data-eva-contacts-nav":"true"},React.createElement(SiderEvaStub,{label:"通讯录",icon:React.createElement(EvaContactsIcon,{size:16,strokeWidth:1.8,className:"block leading-none",style:{lineHeight:0}}),...ct,isActive:rt.activeNavId===gt,onClick:()=>{}}));case"drive":return React.createElement("div",{key:gt,id:"eva-drive-nav","data-eva-action":"drive","data-eva-native-clone":"true"},React.createElement(SiderEvaStub,{label:"文件库",icon:React.createElement(EvaDriveIcon,{size:16,strokeWidth:1.8,className:"block leading-none",style:{lineHeight:0}}),...ct,isActive:rt.activeNavId===gt,onClick:()=>{}}));case"digital-employees":return React.createElement(SiderEvaStub,{key:gt,label:"数字员工",icon:React.createElement(Bot,{size:16,strokeWidth:1.8,className:"block leading-none",style:{lineHeight:0}}),...ct,isActive:rt.activeNavId===gt,onClick:()=>rt.navigate("/eva-stub/数字员工?evaMode="+rt.mode)});case"connection-center":return React.createElement("div",{key:gt,id:"eva-connection-center-nav"},React.createElement(SiderEvaStub,{label:"连接中心",icon:React.createElement("svg",{width:16,height:16,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round",className:"block leading-none",style:{lineHeight:0},"aria-hidden":"true"},React.createElement("path",{d:"M17 19a1 1 0 0 1-1-1v-2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a1 1 0 0 1-1 1z"}),React.createElement("path",{d:"M17 21v-2"}),React.createElement("path",{d:"M19 14V6.5a1 1 0 0 0-7 0v11a1 1 0 0 1-7 0V10"}),React.createElement("path",{d:"M21 21v-2"}),React.createElement("path",{d:"M3 5V3"}),React.createElement("path",{d:"M4 10a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2z"}),React.createElement("path",{d:"M7 5V3"})),...ct,isActive:rt.activeNavId===gt,onClick:()=>rt.navigate("/eva-stub/技能?evaMode="+rt.mode)}));case"sites":return React.createElement(SiderEvaStub,{key:gt,label:"站点",icon:React.createElement(Earth$2,{theme:"outline",size:"16",fill:"currentColor",className:"block leading-none",style:{lineHeight:0}}),...ct,isActive:rt.activeNavId===gt,onClick:()=>rt.navigate("/eva-stub/站点?evaMode="+rt.mode)});default:return null}};return React.createElement(React.Fragment,null,React.createElement(EvaSidebarSection,{title:"个人",items:EVA_PERSONAL_NAV,render:pt,collapsed:rt.collapsed}),React.createElement(EvaSidebarSection,{title:"团队",items:EVA_TEAM_NAV,render:pt,collapsed:rt.collapsed}),React.createElement(EvaSidebarSection,{title:"其他",items:EVA_COMMON_NAV,render:pt,collapsed:rt.collapsed}))},
`;
        source = root.__evaCut(source, siderComponentAnchor, siderArchitecture + siderComponentAnchor, '标准侧栏组件');
        var evaMyAiNavigationNeedle = 'onClick:()=>{}}));case"projects"';
        var evaMyAiNavigationReplacement = 'onClick:()=>rt.navigate("/messages?evaIM=my-ai")}));case"projects"';
        source = root.__evaCut(source, evaMyAiNavigationNeedle, evaMyAiNavigationReplacement, 'My AI 导航');

        source = root.__evaCutAll(source, [
          ['case"contacts":return React.createElement("div",{key:gt,id:"eva-contacts-nav","data-eva-contacts-nav":"true"},React.createElement(SiderEvaStub,{label:"通讯录",icon:React.createElement(EvaContactsIcon,{size:16,strokeWidth:1.8,className:"block leading-none",style:{lineHeight:0}}),...ct,isActive:rt.activeNavId===gt,onClick:()=>{}}))', 'case"contacts":return React.createElement("div",{key:gt,id:"eva-contacts-nav","data-eva-contacts-nav":"true"},React.createElement(SiderEvaStub,{label:"通讯录",icon:React.createElement(EvaContactsIcon,{size:16,strokeWidth:1.8,className:"block leading-none",style:{lineHeight:0}}),...ct,isActive:rt.activeNavId===gt,onClick:()=>rt.navigate("/contacts")}))'],
          ['case"drive":return React.createElement("div",{key:gt,id:"eva-drive-nav","data-eva-action":"drive","data-eva-native-clone":"true"},React.createElement(SiderEvaStub,{label:"文件库",icon:React.createElement(EvaDriveIcon,{size:16,strokeWidth:1.8,className:"block leading-none",style:{lineHeight:0}}),...ct,isActive:rt.activeNavId===gt,onClick:()=>{}}))', 'case"drive":return React.createElement("div",{key:gt,id:"eva-drive-nav","data-eva-action":"drive","data-eva-native-clone":"true"},React.createElement(SiderEvaStub,{label:"文件库",icon:React.createElement(EvaDriveIcon,{size:16,strokeWidth:1.8,className:"block leading-none",style:{lineHeight:0}}),...ct,isActive:rt.activeNavId===gt,onClick:()=>rt.navigate("/drive")}))']
        ], '正式侧栏导航');

        var siderStateAnchor = 'Kt=typeof window<"u"&&!window.electronAPI&&Dt==="authenticated";reactExports.useEffect';
        var siderStateReplacement = 'Kt=typeof window<"u"&&!window.electronAPI&&Dt==="authenticated",evaMode=evaSidebarMode(gt,St),evaNavigate=mr=>{Pt(),Promise.resolve(xt(mr)).catch(()=>{})},evaActiveNavIdState=reactExports.useState(()=>evaSidebarSelectionFromRoute(gt,St)),evaActiveNavId=evaActiveNavIdState[0],setEvaActiveNavId=evaActiveNavIdState[1];reactExports.useEffect(()=>{setEvaActiveNavId(evaSidebarSelectionFromRoute(gt,St))},[gt,St]);reactExports.useEffect';
        source = root.__evaCut(source, siderStateAnchor, siderStateReplacement, '侧栏路由状态');

        var nativePageAnchor = 'PanelRoute=({layout:rt})=>{';
        var nativePageComponent = 'EvaNativePage=({pageId:rt})=>{const ct=reactExports.useRef(null);return reactExports.useEffect(()=>{const ut=ct.current;return window.__evaNativePages?.mount(rt,ut),()=>window.__evaNativePages?.unmount(rt,ut)},[rt]),React.createElement("div",{ref:ct,id:"eva-native-page-"+rt,className:"eva-native-page-host","data-eva-native-page":rt})},';
        source = root.__evaCut(source, nativePageAnchor, nativePageComponent + nativePageAnchor, '原生路由页面宿主');
        source = root.__evaCutAll(source, [
          ['React.createElement(Route,{path:"/guid",element:withRouteFallback(Guid)})', 'React.createElement(Route,{path:"/guid",element:React.createElement(EvaNativePage,{pageId:"personal"})})'],
          ['React.createElement(Route,{path:"/conversation/:id",element:withRouteFallback(Conversation)})', 'React.createElement(Route,{path:"/conversation/:id",element:React.createElement(EvaNativePage,{pageId:"personal"})})'],
          ['React.createElement(Route,{path:"/messages",element:withRouteFallback(MessagesPage$1)}),React.createElement(Route,{path:"/eva-stub/:name"', 'React.createElement(Route,{path:"/messages",element:withRouteFallback(MessagesPage$1)}),React.createElement(Route,{path:"/contacts",element:React.createElement(EvaNativePage,{pageId:"contacts"})}),React.createElement(Route,{path:"/drive",element:React.createElement(EvaNativePage,{pageId:"drive"})}),React.createElement(Route,{path:"/eva-stub/:name"'],
          ['function EvaStubPage(){const{name:rt}=useParams(),ct=decodeURIComponent(rt??"");if(ct==="技能")return React.createElement("div",{id:"eva-connection-center-native-host",className:"eva-connection-center-native-host"});', 'function EvaStubPage(){const{name:rt}=useParams(),ct=decodeURIComponent(rt??"");if(ct==="工作板")return React.createElement(EvaNativePage,{pageId:"workboard"});if(ct==="数字员工")return React.createElement(EvaNativePage,{pageId:"digital-employees"});if(ct==="技能")return React.createElement(EvaNativePage,{pageId:"connection-center"});']
        ], '正式页面路由');

        var nativeSiderStart = source.indexOf(siderComponentAnchor);
        var siderItemsStart = source.indexOf('React.createElement(SiderSearchEntry', nativeSiderStart);
        var siderItemsEnd = source.indexOf('))),React.createElement(SiderFooter', siderItemsStart);
        if (siderItemsStart < 0 || siderItemsEnd < 0) throw new Error('EVA 侧栏菜单替换范围不存在');
        var nativeNavigation = String.raw`React.createElement(EvaSidebarNavigation,{mode:evaMode,activeNavId:evaActiveNavId,isMobile:pt,collapsed:ct,siderTooltipProps:sr,pathname:gt,onConversationSelect:ln,onSessionClick:rt,isBatchMode:Vt,onNewChat:nn,onToggleBatchMode:()=>Ht(mr=>!mr),navigate:evaNavigate}),evaMode==="personal"?React.createElement(reactExports.Fragment,null,React.createElement("div",{className:classNames("shrink-0 mt-6px mb-2px h-1px bg-[var(--color-border-2)]",ct?"mx-6px":"mx-10px"),role:"separator","aria-label":"本地对话"}),React.createElement("div",{className:classNames("flex-1 min-h-0 overflow-y-auto",siderStyles.scrollArea)},React.createElement(reactExports.Suspense,{fallback:React.createElement("div",{className:"min-h-200px"})},React.createElement(WorkspaceGroupedHistory$1,{...pr})))):React.createElement("div",{className:"flex-1 min-h-0"})`;
        source = source.slice(0, siderItemsStart) + nativeNavigation + source.slice(siderItemsEnd + 1);
    source=root.__evaCut(source,'React.createElement("div",{className:"eva-user-row",onClick:gt},React.createElement("img",{className:"ava",src:window.__EVA_CURRENT_USER_PORTRAIT,alt:""}),React.createElement("span",{className:"nm"},"王宜林"),React.createElement("span",{className:"gt"},"›"),','React.createElement("div",{className:"eva-user-row"},React.createElement(evaMembers().ui.AccountSwitcher,{onAccount:gt}),','左下角统一演示身份');
    return source;
  });
})(window);
