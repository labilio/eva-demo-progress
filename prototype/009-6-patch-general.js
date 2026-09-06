(function (root) {
  'use strict';
  root.__evaPatch('general', function (source) {
        var projectDirectoryComponentSource = String.raw`EvaPinIcon=createLucideIcon("pin",[["path",{d:"M12 17v5",key:"eva-pin-stem"}],["path",{d:"M5 17h14",key:"eva-pin-base"}],["path",{d:"M15 3.3a1 1 0 0 1 .7 1.7L13 7.7V12l1.8 1.8a1 1 0 0 1-.7 1.7H9.9a1 1 0 0 1-.7-1.7L11 12V7.7L8.3 5A1 1 0 0 1 9 3.3z",key:"eva-pin-body"}]]),EvaPinOffIcon=createLucideIcon("pin-off",[["path",{d:"M12 17v5",key:"eva-pin-off-stem"}],["path",{d:"M7 17h10",key:"eva-pin-off-base"}],["path",{d:"M5 5l14 14",key:"eva-pin-off-slash"}],["path",{d:"M15 3.3a1 1 0 0 1 .7 1.7L14 6.7",key:"eva-pin-off-top"}],["path",{d:"M10.3 10.3 11 9.6V7.7L8.3 5A1 1 0 0 1 9 3.3h1",key:"eva-pin-off-body"}]]),EvaProjectList=Object.assign(({dataSource:evaDataSource=[],renderItem:evaRenderItem,emptyContent:evaEmptyContent,className:evaClassName=""})=>React.createElement("div",{className:evaClassName,role:"list"},evaDataSource.length?evaDataSource.map(evaRenderItem):evaEmptyContent),{Item:({header:evaHeader,main:evaMain,extra:evaExtra,className:evaClassName="",...evaProps})=>React.createElement("div",{...evaProps,className:evaClassName},evaHeader,evaMain,evaExtra)}),EvaProjectDirectory=({spaces:evaSpaces,onEnter:evaEnter,onCreate:evaCreate,onSeed:evaSeed})=>{
          const[evaCreateOpen,setEvaCreateOpen]=reactExports.useState(!1),[evaProjectName,setEvaProjectName]=reactExports.useState(""),[evaProjectQuery,setEvaProjectQuery]=reactExports.useState(""),[evaPinnedIds,setEvaPinnedIds]=reactExports.useState(()=>{try{const evaRaw=localStorage.getItem("eva:pinned-project-ids:v2");if(evaRaw===null)return["drive-design"];const evaSaved=JSON.parse(evaRaw||"[]");return Array.isArray(evaSaved)?evaSaved.slice(0,6):["drive-design"]}catch{return["drive-design"]}}),[evaOrganizationProjects,setEvaOrganizationProjects]=reactExports.useState([]);
          reactExports.useEffect(()=>{try{localStorage.setItem("eva:pinned-project-ids:v2",JSON.stringify(evaPinnedIds))}catch{}},[evaPinnedIds]);
          reactExports.useEffect(()=>{const evaSyncOrganizations=()=>setEvaOrganizationProjects([...(window.__EVA_CREATED_GROUPS||[])]);evaSyncOrganizations(),window.addEventListener("eva:created-projects-changed",evaSyncOrganizations);return()=>window.removeEventListener("eva:created-projects-changed",evaSyncOrganizations)},[]);
          const evaOrganizationData=evaOrganizationProjects.map(evaGroup=>({id:evaGroup.id,name:evaGroup.name,desc:"由群聊自动形成的项目",members:new Array(evaGroup.memberCount||0).fill(null),bots:0,lastActive:"刚刚创建",memberNames:evaGroup.memberNames,organization:!0,color:"#59636d",colorBg:"#f1f3f5"})),evaAllProjects=[...evaSpaces,...evaOrganizationData.filter(evaProject=>!evaSpaces.some(evaSpace=>evaSpace.id===evaProject.id))],evaPinnedProjects=evaPinnedIds.map(evaId=>evaAllProjects.find(evaProject=>evaProject.id===evaId)).filter(Boolean),evaNormalizedQuery=evaProjectQuery.trim().toLowerCase(),evaMatchesProject=evaProject=>!evaNormalizedQuery||((evaProject.name??"")+" "+(evaProject.desc??"")).toLowerCase().includes(evaNormalizedQuery),evaFilteredProjects=evaAllProjects.filter(evaMatchesProject),evaFilteredPinnedProjects=evaPinnedProjects.filter(evaMatchesProject);
          reactExports.useEffect(()=>{setEvaPinnedIds(evaIds=>evaIds.filter(evaId=>evaAllProjects.some(evaProject=>evaProject.id===evaId)).slice(0,6))},[evaSpaces,evaOrganizationProjects]);
          const evaSubmitProject=()=>{evaProjectName.trim()&&(evaCreate(evaProjectName.trim()),setEvaCreateOpen(!1),setEvaProjectName(""))},evaTogglePinned=(evaProject,evaEvent)=>{evaEvent.preventDefault(),evaEvent.stopPropagation();const evaIsPinned=evaPinnedIds.includes(evaProject.id);if(!evaIsPinned&&evaPinnedIds.length>=6){Toast.warning("最多置顶 6 个项目");return}setEvaPinnedIds(evaIds=>evaIsPinned?evaIds.filter(evaId=>evaId!==evaProject.id):[...evaIds,evaProject.id])},evaOpenProject=evaProject=>{evaProject.organization||evaEnter(evaProject.id)},evaKeyboardOpen=(evaEvent,evaProject)=>{(evaEvent.key==="Enter"||evaEvent.key===" ")&&(evaEvent.preventDefault(),evaEvent.currentTarget.click())},evaProjectIcon=(evaProject,evaSize)=>React.createElement("span",{className:"eva-project-directory-icon",style:{backgroundColor:evaProject.colorBg??projectTint(evaProject.color),color:evaProject.color}},React.createElement(AllApplication,{theme:"outline",size:String(evaSize),fill:"currentColor"})),evaPinButton=evaProject=>{const evaIsPinned=evaPinnedIds.includes(evaProject.id);return React.createElement(Button,{theme:"borderless",type:"tertiary",size:"small",className:"eva-project-pin-button"+(evaIsPinned?" is-pinned":""),icon:React.createElement(EvaPinIcon,{size:16,strokeWidth:1.8,fill:"none"}),"aria-label":(evaIsPinned?"取消置顶 ":"置顶 ")+evaProject.name,title:evaIsPinned?"取消置顶":"置顶",onClick:evaEvent=>evaTogglePinned(evaProject,evaEvent)})},evaCreateModal=React.createElement(Modal,{title:"新建项目",visible:evaCreateOpen,onCancel:()=>setEvaCreateOpen(!1),onOk:evaSubmitProject,okText:"创建项目",cancelText:"取消",okButtonProps:{className:"collab-btn-primary"}},React.createElement("div",{className:"collab-create-form"},React.createElement("p",{className:"eva-space-definition"},"为一组需要共享成员、助理与工作资产的人建立独立协作环境。"),React.createElement("div",{className:"field"},React.createElement("label",null,"项目名称"),React.createElement(ForwardInput,{placeholder:"例如：AI 产品共创",value:evaProjectName,onChange:setEvaProjectName,autoFocus:!0,onEnterPress:evaSubmitProject})),React.createElement("div",{className:"field"},React.createElement("label",null,"协作目标"),React.createElement(ForwardInput,{placeholder:"例如：让产品、研发和业务共同推进 AI 能力"}))));
          return React.createElement("div",{className:"collab-list-page eva-project-directory"},React.createElement("div",{className:"eva-project-directory-actions"},React.createElement(ForwardInput,{className:"eva-project-directory-search",prefix:React.createElement(Search$1,{size:14}),showClear:!0,placeholder:"搜索项目",value:evaProjectQuery,onChange:setEvaProjectQuery,"aria-label":"搜索项目"}),React.createElement(Button,{className:"collab-btn-primary",onClick:()=>setEvaCreateOpen(!0)},"＋ 新建项目")),React.createElement("section",{className:"eva-project-pinned-section","aria-labelledby":"eva-project-pinned-title"},React.createElement("div",{className:"eva-project-directory-heading"},React.createElement("div",{className:"eva-project-directory-heading__title"},React.createElement("h2",{id:"eva-project-pinned-title"},"置顶项目"),React.createElement("span",null,evaFilteredPinnedProjects.length," / 6"))),evaFilteredPinnedProjects.length?React.createElement("div",{className:"eva-project-pinned-grid"},evaFilteredPinnedProjects.map(evaProject=>React.createElement(Card,{key:evaProject.id,className:"eva-project-pinned-card"+(evaProject.organization?" eva-organization-project-card":""),bordered:!0,headerLine:!1,shadows:"hover",role:"button",tabIndex:0,onClick:()=>evaOpenProject(evaProject),onKeyDown:evaEvent=>evaKeyboardOpen(evaEvent,evaProject),title:React.createElement("div",{className:"eva-project-card-title"},evaProjectIcon(evaProject,18),React.createElement("div",{className:"name"},React.createElement("span",null,evaProject.name),evaProject.official&&React.createElement("span",{className:"eva-official-badge"},"官方"))),headerExtraContent:evaPinButton(evaProject)},React.createElement("p",{className:"eva-project-card-description"},evaProject.desc||"暂无项目简介")))):React.createElement("div",{className:"eva-project-pinned-empty"},evaNormalizedQuery?"没有匹配的置顶项目":"从下方项目列表中置顶常用项目")),React.createElement("section",{className:"eva-project-all-section","aria-labelledby":"eva-project-all-title"},React.createElement("div",{className:"eva-project-directory-heading eva-project-directory-heading--all"},React.createElement("div",{className:"eva-project-directory-heading__title"},React.createElement("h2",{id:"eva-project-all-title"},"全部项目"),React.createElement("span",null,evaFilteredProjects.length," 个"))),React.createElement(EvaProjectList,{className:"eva-project-directory-list",dataSource:evaFilteredProjects,emptyContent:React.createElement("div",{className:"eva-project-list-empty"},evaNormalizedQuery?"没有匹配「"+evaProjectQuery.trim()+"」的项目":"暂无项目"),renderItem:evaProject=>React.createElement(EvaProjectList.Item,{key:evaProject.id,className:"eva-project-list-item"+(evaProject.organization?" eva-organization-project-card":""),role:"button",tabIndex:0,onClick:()=>evaOpenProject(evaProject),onKeyDown:evaEvent=>evaKeyboardOpen(evaEvent,evaProject),header:evaProjectIcon(evaProject,18),main:React.createElement("div",{className:"eva-project-list-main"},React.createElement("div",{className:"eva-project-list-title name"},React.createElement("span",null,evaProject.name),evaProject.official&&React.createElement("span",{className:"eva-official-badge"},"官方")),React.createElement("div",{className:"eva-project-list-description"},evaProject.desc||"暂无项目简介")),extra:evaPinButton(evaProject)})})),evaCreateModal)
        }`;
        projectDirectoryComponentSource = projectDirectoryComponentSource
          .replaceAll('AI 产品共创', '供应链运营协同')
          .replaceAll('让产品、研发和业务共同推进 AI 能力', '协同推进采购、质量与合规工作');
        var replacements = [
          [
            '最近更新：2026-09-04 20:28',
            '最近更新：2026-09-06 13:55'
          ],
          [
            'function isPwaRegistrationSupported(){if(typeof window>"u"||typeof navigator>"u"||isElectronDesktop()||!("serviceWorker"in navigator))return!1;',
            'function isPwaRegistrationSupported(){return!1;if(typeof window>"u"||typeof navigator>"u"||isElectronDesktop()||!("serviceWorker"in navigator))return!1;'
          ],
          [
            'function titleForPath(rt,ct){return rt.startsWith("/login")?ct("login.pageTitle"):"Eva 同学"}',
            'function titleForPath(rt,ct){return rt.startsWith("/login")?ct("login.pageTitle"):"Eva · 2026-09-06 · v1"}'
          ],
          [
            'BY_SPACE={agents:{[SPACE_DATA_KEY]:AGENTS},squads:{[SPACE_DATA_KEY]:SQUADS},skills:{[SPACE_DATA_KEY]:SKILLS},autopilots:{[SPACE_DATA_KEY]:AUTOPILOTS},projects:{[SPACE_DATA_KEY]:PROJECTS},members:{[SPACE_DATA_KEY]:MEMBERS}}',
            'BY_SPACE={agents:{prod:window.__EVA_SUPPLY_CHAIN_DEMO.agents,"drive-design":window.__EVA_DRIVE_DEMO.agents},squads:{prod:window.__EVA_SUPPLY_CHAIN_DEMO.squads,"drive-design":window.__EVA_DRIVE_DEMO.squads},skills:{prod:window.__EVA_SUPPLY_CHAIN_DEMO.skills,"drive-design":window.__EVA_DRIVE_DEMO.skills},autopilots:{prod:window.__EVA_SUPPLY_CHAIN_DEMO.autopilots,"drive-design":window.__EVA_DRIVE_DEMO.autopilots},projects:{prod:window.__EVA_SUPPLY_CHAIN_DEMO.projects,"drive-design":window.__EVA_DRIVE_DEMO.projects},members:{prod:MEMBERS,"drive-design":MEMBERS}}'
          ],
          [
            'ISSUES_BY_SPACE={[SPACE_DATA_KEY]:MOCK_ISSUES}',
            'ISSUES_BY_SPACE={prod:window.__EVA_SUPPLY_CHAIN_DEMO.issues,"drive-design":window.__EVA_DRIVE_DEMO.issues},evaUpsertContextTask=window.__evaUpsertContextTask=(rt,ct)=>{const ut=ISSUES_BY_SPACE[rt]??(ISSUES_BY_SPACE[rt]=[]),pt=ut.findIndex(mt=>mt.identifier===ct.identifier);pt>=0?ut[pt]={...ut[pt],...ct}:ut.push(ct)}'
          ],
          [
            'CANDIDATES=[...AGENTS.map(rt=>({id:rt.id,type:"agent",name:rt.name})),...SQUADS.map(rt=>({id:rt.id,type:"squad",name:rt.name})),...MEMBERS.map(rt=>({id:rt.user_id,type:"member",name:rt.name??rt.user_id,octo_uid:rt.octo_uid}))]',
            'CANDIDATES=[...window.__EVA_SUPPLY_CHAIN_DEMO.agents.map(rt=>({id:rt.id,type:"agent",name:rt.name})),...window.__EVA_SUPPLY_CHAIN_DEMO.squads.map(rt=>({id:rt.id,type:"squad",name:rt.name})),...window.__EVA_DRIVE_DEMO.agents.map(rt=>({id:rt.id,type:"agent",name:rt.name})),...window.__EVA_DRIVE_DEMO.squads.map(rt=>({id:rt.id,type:"squad",name:rt.name})),...MEMBERS.map(rt=>({id:rt.user_id,type:"member",name:rt.name??rt.user_id,octo_uid:rt.octo_uid}))]'
          ],
          [
            'case"settings":return React.createElement(SettingsPage,{workspace:WORKSPACE})',
            'case"settings":return React.createElement(SettingsPage,{workspace:{...WORKSPACE,id:rt.id,name:rt.name,slug:rt.id}})'
          ],
          [
            'listAgentTasks=rt=>{if(rt&&rt!=="ag-feedback")return Promise.resolve([]);',
            'listAgentTasks=rt=>{if(window.__EVA_SUPPLY_CHAIN_DEMO.agentTasks[rt])return Promise.resolve(window.__EVA_SUPPLY_CHAIN_DEMO.agentTasks[rt]);if(window.__EVA_DRIVE_DEMO.agentTasks[rt])return Promise.resolve(window.__EVA_DRIVE_DEMO.agentTasks[rt]);if(rt&&rt!=="ag-feedback")return Promise.resolve([]);'
          ],
          [
            'agentStatusMap=()=>Promise.resolve(Object.fromEntries(AGENTS.map(rt=>[rt.id,rt.status])))',
            'agentStatusMap=()=>Promise.resolve(Object.fromEntries(agentsOf().map(rt=>[rt.id,rt.status])))'
          ],
          [
            'TABS=[{key:"channels",label:"群聊"},{key:"tasks",label:"任务"},{key:"experts",label:"专家"},{key:"squads",label:"专家团"},{key:"skills",label:"技能"},{key:"automation",label:"自动化"},{key:"settings",label:"设置"}]',
            'TABS=[{key:"tasks",label:"任务"},{key:"channels",label:"群聊"},{key:"files",label:"团队文件"},{key:"automation",label:"自动化"},{key:"settings",label:"项目设置"}]'
          ],
          [
            'SpaceFrame=({space:rt,spaces:ct,onSwitch:ut})=>{const[pt,mt]=reactExports.useState("channels")',
            'SpaceFrame=({space:rt,spaces:ct,onSwitch:ut})=>{const[pt,mt]=reactExports.useState("tasks")'
          ],
          [
            'TABS.map(Ft=>React.createElement("button"',
            '(rt.id==="prod"?TABS:TABS.filter(Ft=>Ft.key!=="experts"&&Ft.key!=="squads"&&Ft.key!=="skills")).map(Ft=>React.createElement("button"'
          ],
          [
            'React.createElement(Avatar,{name:rt.short,color:rt.color,size:20,square:!0}),React.createElement("span",{className:"nm",title:rt.name},rt.name)',
            'React.createElement("span",{className:"nm",title:rt.name},rt.name)'
          ],
          [
            'React.createElement(Avatar,{name:Ft.short,color:Ft.color,size:20,square:!0})," ",Ft.name',
            'Ft.name'
          ],
          [
            'Mt=React.createElement("span",{className:"collab-sp-chip",role:"button",tabIndex:0,"aria-haspopup":"menu","aria-expanded":St,onClick:()=>Ct(Ft=>!Ft),onKeyDown:Ft=>{Ft.key==="Enter"&&Ct(Qt=>!Qt)}},React.createElement("span",{className:"nm",title:rt.name},rt.name),React.createElement("span",{className:"caret"},"▾"),St&&React.createElement("div",{className:"sp-menu",onClick:Ft=>Ft.stopPropagation()},ct.map(Ft=>React.createElement("div",{key:Ft.id,className:"mi",onClick:()=>{Ct(!1),WKApp$1.routeRight.popAll(),ut(Ft.id)}},Ft.name)),React.createElement("div",{className:"divider"}),React.createElement("div",{className:"mi",onClick:()=>{Ct(!1),WKApp$1.routeRight.popAll(),ut(null)}},"⌂ 全部项目")))',
            'Mt=React.createElement(Dropdown,{trigger:"click",position:"bottomLeft",spacing:4,clickToHide:!0,render:React.createElement(Dropdown.Menu,{className:"eva-project-switcher-menu"},ct.map(Ft=>React.createElement(Dropdown.Item,{key:Ft.id,"data-eva-project-id":Ft.id,onClick:()=>{WKApp$1.routeRight.popAll(),ut(Ft.id)}},Ft.name)))},React.createElement("span",{className:"eva-project-switcher-anchor"},React.createElement(Button,{size:"small",theme:"borderless",type:"tertiary",className:"collab-sp-chip eva-project-switcher"},React.createElement(AllApplication,{theme:"outline",size:"16",fill:"currentColor",className:"eva-project-switcher__icon","aria-hidden":!0}),React.createElement("span",{className:"nm",title:rt.name},rt.name),React.createElement(ChevronDown,{size:13,className:"eva-project-switcher__chevron","aria-hidden":!0}))))'
          ],
          [
            '),Ft)},SpaceFrame=',
            '),Ft)},' + projectDirectoryComponentSource + ',SpaceFrame='
          ],
          [
            ':React.createElement(SpaceList,{spaces:rt,onEnter:',
            ':React.createElement(EvaProjectDirectory,{spaces:rt,onEnter:'
          ],
          [
            'function CollabPage(){const[rt,ct]=reactExports.useState(()=>loadSpaces()),[ut,pt]=reactExports.useState(null),mt=rt.find(gt=>gt.id===ut)??null;return',
            'function CollabPage(){const[rt,ct]=reactExports.useState(()=>loadSpaces()),[ut,pt]=reactExports.useState(null),mt=rt.find(gt=>gt.id===ut)??null;reactExports.useEffect(()=>{const gt=()=>{WKApp$1.routeRight.popAll(),pt(null)};return window.addEventListener("eva:open-project-directory",gt),()=>window.removeEventListener("eva:open-project-directory",gt)},[]);return'
          ],
          [
            'if(Array.isArray(ct)&&ct.length){const ut=new Set(ct.map(pt=>pt.id));return[...ct,...DEFAULTS.filter(pt=>!ut.has(pt.id))]}',
            'if(Array.isArray(ct)&&ct.length){const ut=ct.map(pt=>{const mt=DEFAULTS.find(gt=>gt.id===pt.id),St=mt?{...pt,color:mt.color,colorBg:mt.colorBg}:pt;return St.id==="drive-design"?{...St,name:"团队文件功能设计",short:"团",desc:(St.desc||"").replaceAll("云盘","团队文件")}:St}),mt=new Set(ut.map(pt=>pt.id));return[...ut,...DEFAULTS.filter(pt=>!mt.has(pt.id))]}'
          ],
          [
            'case"experts":return React.createElement(AgentPage,null);case"squads":return React.createElement(SquadPage,null);',
            'case"experts":return React.createElement(EvaExpertCenterPage,null);case"squads":return React.createElement(EvaExpertCenterPage,{initialTab:"squads"});'
          ],
          [
            'listAssigneeCandidates$1().then(ha=>{ur(ha.filter(Oa=>Oa.type!=="squad"));const ga=ha.find(Oa=>Oa.type==="agent");',
            'listAssigneeCandidates$1().then(ha=>{ur(ha.filter(Oa=>Oa.type==="agent"));const ga=ha.find(Oa=>Oa.type==="agent");'
          ],
          [
            'reactExports.useEffect(()=>{listAssigneeCandidates$1().then(pa=>sn(pa.filter(ha=>ha.type!=="squad"))).catch(()=>sn([]))},[])',
            'reactExports.useEffect(()=>{listAssigneeCandidates$1().then(pa=>sn(pa.filter(ha=>ha.type==="agent"))).catch(()=>sn([]))},[])'
          ],
          [
            'React.createElement(TabPane,{tab:ut("loop.settings.general"),itemKey:"general"},React.createElement(GeneralTab,{workspace:rt,onUpdated:ct})),React.createElement(TabPane,{tab:ut("loop.settings.members"),itemKey:"members"},React.createElement(MembersTab,{workspaceId:rt.id})),React.createElement(TabPane,{tab:ut("loop.settings.webhooks"),itemKey:"webhooks"},React.createElement(WebhooksTab,null))',
            'React.createElement(TabPane,{tab:"通用",itemKey:"general"},React.createElement(GeneralTab,{workspace:rt,onUpdated:ct})),React.createElement(TabPane,{tab:"成员管理",itemKey:"members"},React.createElement(MembersTab,{workspaceId:rt.id})),React.createElement(TabPane,{tab:"专家",itemKey:"experts"},React.createElement(AgentPage,null)),React.createElement(TabPane,{tab:"专家团",itemKey:"squads"},React.createElement(SquadPage,null)),React.createElement(TabPane,{tab:"技能",itemKey:"skills"},React.createElement(SkillPage,null))'
          ],
          [
            'React.createElement("div",{className:"loop-page__toolbar"},!mt&&React.createElement("div",{className:"loop-agent-scope"',
            'React.createElement("div",{className:"loop-page__toolbar"},ut==="collab-tasks"?React.createElement("div",{className:"loop-seg eva-task-view-switcher",role:"tablist","aria-label":pt("loop.action.show")},["board","grouped","list"].map($a=>React.createElement("button",{key:$a,type:"button",role:"tab","aria-selected":Kt===$a,className:`loop-seg__btn${Kt===$a?" is-active":""}`,onClick:()=>Da($a)},$a==="board"?React.createElement(Workbench,{theme:"outline",size:"14",fill:"currentColor"}):$a==="grouped"?React.createElement(Users,{size:14}):React.createElement(List$1,{size:14}),pt(`loop.view.${$a}`)))):!mt&&React.createElement("div",{className:"loop-agent-scope"'
          ],
          [
            'React.createElement("div",{className:"loop-page__spacer"}),React.createElement(Dropdown,{trigger:"click",visible:pr,onVisibleChange:mr,position:"bottomRight",render:Ta}',
            'ut!=="collab-tasks"&&React.createElement("div",{className:"loop-page__spacer"}),React.createElement(Dropdown,{trigger:"click",visible:pr,onVisibleChange:mr,position:"bottomRight",render:Ta}'
          ],
          [
            '!mt&&React.createElement(Dropdown,{trigger:"click",visible:dr,onVisibleChange:ur,position:"bottomRight",render:Na}',
            'ut!=="collab-tasks"&&!mt&&React.createElement(Dropdown,{trigger:"click",visible:dr,onVisibleChange:ur,position:"bottomRight",render:Na}'
          ],
          [
            'pt("loop.action.show"))),React.createElement(LoopButton,{icon:React.createElement(Plus$c,{size:14}),onClick:Ra}',
            'pt("loop.action.show"))),ut==="collab-tasks"&&React.createElement("div",{className:"loop-page__spacer"}),React.createElement(LoopButton,{icon:React.createElement(Plus$c,{size:14}),onClick:Ra}'
          ],
          [
            'React.createElement(SiderEvaStub,{label:"工作板",',
            'gt==="/collab"?null:React.createElement(SiderEvaStub,{label:"工作板",'
          ],
          [
            'React.createElement(SiderScheduledEntry,{isMobile:pt,isActive:gt==="/scheduled",',
            'gt==="/collab"?null:React.createElement(SiderScheduledEntry,{isMobile:pt,isActive:gt==="/scheduled",'
          ]
        ];

        source = root.__evaCutAll(source, replacements, '通用补丁');
    return source;
  });
})(window);
