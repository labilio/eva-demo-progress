(function (root) {
  'use strict';
  root.__evaPatch('general', function (source) {
        var evaRelease = root.__EVA_RELEASE;
        if (!evaRelease || !/^\d{2}-\d{2} v\d+$/.test(evaRelease.version || '') || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(evaRelease.updatedAt || '')) {
          throw new Error('release.json 缺失或格式错误');
        }
        var evaReleaseRevision = evaRelease.version.split(' ')[1];
        var evaReleaseDate = evaRelease.updatedAt.slice(0, 10);
        var projectDirectoryComponentSource = String.raw`EvaPinIcon=createLucideIcon("pin",[["path",{d:"M12 17v5",key:"pin-stem"}],["path",{d:"M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z",key:"pin-head"}]]),EvaProjectList=Object.assign(({dataSource:evaDataSource=[],renderItem:evaRenderItem,emptyContent:evaEmptyContent,className:evaClassName=""})=>React.createElement("div",{className:evaClassName,role:"list"},evaDataSource.length?evaDataSource.map(evaRenderItem):evaEmptyContent),{Item:({header:evaHeader,main:evaMain,extra:evaExtra,className:evaClassName="",...evaProps})=>React.createElement("div",{...evaProps,className:evaClassName},evaHeader,evaMain,evaExtra)}),EvaProjectDirectory=({spaces:evaSpaces,onEnter:evaEnter,onCreate:evaCreate,onSeed:evaSeed})=>{
          const[evaCreateOpen,setEvaCreateOpen]=reactExports.useState(!1),[evaProjectName,setEvaProjectName]=reactExports.useState(""),[evaProjectGoal,setEvaProjectGoal]=reactExports.useState(""),[evaSelectedClones,setEvaSelectedClones]=reactExports.useState([]),[evaProjectQuery,setEvaProjectQuery]=reactExports.useState(""),[evaPinnedIds,setEvaPinnedIds]=reactExports.useState(()=>{try{const evaRaw=localStorage.getItem("eva:pinned-project-ids:v3"),evaLegacy=evaRaw===null?localStorage.getItem("eva:pinned-project-ids:v2"):null;const evaSaved=JSON.parse(evaRaw??evaLegacy??'["prod"]');if(evaRaw===null&&Array.isArray(evaSaved)&&evaSaved.length===1&&evaSaved[0]==="drive-design")return["prod"];return Array.isArray(evaSaved)?evaSaved.slice(0,6):["prod"]}catch{return["prod"]}});
          reactExports.useEffect(()=>{try{localStorage.setItem("eva:pinned-project-ids:v3",JSON.stringify(evaPinnedIds))}catch{}},[evaPinnedIds]);
          const evaAllProjects=evaSpaces,evaPinnedProjects=evaPinnedIds.map(evaId=>evaAllProjects.find(evaProject=>evaProject.id===evaId)).filter(Boolean),evaNormalizedQuery=evaProjectQuery.trim().toLowerCase(),evaMatchesProject=evaProject=>!evaNormalizedQuery||((evaProject.name??"")+" "+(evaProject.desc??"")).toLowerCase().includes(evaNormalizedQuery),evaFilteredProjects=evaAllProjects.filter(evaMatchesProject),evaFilteredPinnedProjects=evaPinnedProjects.filter(evaMatchesProject);
          reactExports.useEffect(()=>{setEvaPinnedIds(evaIds=>evaIds.filter(evaId=>evaAllProjects.some(evaProject=>evaProject.id===evaId)).slice(0,6))},[evaSpaces]);
          const evaSubmitProject=()=>{evaProjectName.trim()&&((evaCreate(evaProjectName.trim(),evaSelectedClones,evaProjectGoal.trim()),setEvaCreateOpen(!1),setEvaProjectName(""),setEvaProjectGoal(""),setEvaSelectedClones([])))},evaTogglePinned=(evaProject,evaEvent)=>{evaEvent.preventDefault(),evaEvent.stopPropagation();const evaIsPinned=evaPinnedIds.includes(evaProject.id);if(!evaIsPinned&&evaPinnedIds.length>=6){Toast.warning("最多置顶 6 个项目");return}setEvaPinnedIds(evaIds=>evaIsPinned?evaIds.filter(evaId=>evaId!==evaProject.id):[...evaIds,evaProject.id])},evaOpenProject=evaProject=>{evaProject.organization||evaEnter(evaProject.id)},evaKeyboardOpen=(evaEvent,evaProject)=>{(evaEvent.key==="Enter"||evaEvent.key===" ")&&(evaEvent.preventDefault(),evaEvent.currentTarget.click())},evaProjectIcon=(evaProject,evaSize)=>React.createElement("span",{className:"eva-project-directory-icon",style:{backgroundColor:evaProject.colorBg??projectTint(evaProject.color),color:evaProject.color}},React.createElement(AllApplication,{theme:"outline",size:String(evaSize),fill:"currentColor"})),evaPinButton=evaProject=>{const evaIsPinned=evaPinnedIds.includes(evaProject.id);return React.createElement(Button,{theme:"borderless",type:"tertiary",size:"small",className:"eva-project-pin-button"+(evaIsPinned?" is-pinned":""),icon:React.createElement(EvaPinIcon,{size:16,strokeWidth:1.8,fill:"none"}),"aria-label":(evaIsPinned?"取消置顶 ":"置顶 ")+evaProject.name,title:evaIsPinned?"取消置顶":"置顶",onClick:evaEvent=>evaTogglePinned(evaProject,evaEvent)})},evaCreateModal=React.createElement(Modal,{className:"eva-members-modal",title:"新建项目",visible:evaCreateOpen,onCancel:()=>setEvaCreateOpen(!1),onOk:evaSubmitProject,okText:"创建项目",cancelText:"取消",okButtonProps:{className:"collab-btn-primary"}},React.createElement("div",{className:"collab-create-form"},React.createElement("p",{className:"eva-space-definition"},"为需要共同推进工作的人建立项目，创建后自动生成全员群。"),React.createElement("div",{className:"field"},React.createElement("label",null,"项目名称"),React.createElement(ForwardInput,{placeholder:"例如：AI 产品共创",value:evaProjectName,onChange:setEvaProjectName,autoFocus:!0,onEnterPress:evaSubmitProject})),React.createElement("div",{className:"field"},React.createElement("label",null,"共同目标"),React.createElement(ForwardInput,{placeholder:"例如：让产品、研发和业务共同推进 AI 能力",value:evaProjectGoal,onChange:setEvaProjectGoal,maxLength:2000,"aria-label":"共同目标"})),React.createElement(evaMembers().ui.CloneChoice,{actorId:evaMembers().store.snapshot().actorId,value:evaSelectedClones,onChange:setEvaSelectedClones})));
          return React.createElement("div",{className:"collab-list-page eva-project-directory"},React.createElement("div",{className:"eva-project-directory-actions"},React.createElement(ForwardInput,{className:"eva-project-directory-search",prefix:React.createElement(Search$1,{size:14}),showClear:!0,placeholder:"搜索项目",value:evaProjectQuery,onChange:setEvaProjectQuery,"aria-label":"搜索项目"}),React.createElement(Button,{className:"collab-btn-primary",onClick:()=>setEvaCreateOpen(!0)},"＋ 新建项目")),React.createElement("section",{className:"eva-project-pinned-section","aria-labelledby":"eva-project-pinned-title"},React.createElement("div",{className:"eva-project-directory-heading"},React.createElement("div",{className:"eva-project-directory-heading__title"},React.createElement("h2",{id:"eva-project-pinned-title"},"置顶项目"),React.createElement("span",null,evaFilteredPinnedProjects.length," / 6"))),evaFilteredPinnedProjects.length?React.createElement("div",{className:"eva-project-pinned-grid"},evaFilteredPinnedProjects.map(evaProject=>React.createElement(Card,{key:evaProject.id,className:"eva-project-pinned-card"+(evaProject.organization?" eva-organization-project-card":""),bordered:!0,headerLine:!1,shadows:"hover",role:"button",tabIndex:0,onClick:()=>evaOpenProject(evaProject),onKeyDown:evaEvent=>evaKeyboardOpen(evaEvent,evaProject),title:React.createElement("div",{className:"eva-project-card-title"},evaProjectIcon(evaProject,18),React.createElement("div",{className:"name"},React.createElement("span",null,evaProject.name),evaProject.official&&React.createElement("span",{className:"eva-official-badge"},"官方"))),headerExtraContent:evaPinButton(evaProject)},React.createElement("p",{className:"eva-project-card-description"},evaProject.desc||"暂无项目简介")))):React.createElement("div",{className:"eva-project-pinned-empty"},evaNormalizedQuery?"没有匹配的置顶项目":"从下方项目列表中置顶常用项目")),React.createElement("section",{className:"eva-project-all-section","aria-labelledby":"eva-project-all-title"},React.createElement("div",{className:"eva-project-directory-heading eva-project-directory-heading--all"},React.createElement("div",{className:"eva-project-directory-heading__title"},React.createElement("h2",{id:"eva-project-all-title"},"全部项目"),React.createElement("span",null,evaFilteredProjects.length," 个"))),React.createElement(EvaProjectList,{className:"eva-project-directory-list",dataSource:evaFilteredProjects,emptyContent:React.createElement("div",{className:"eva-project-list-empty"},evaNormalizedQuery?"没有匹配「"+evaProjectQuery.trim()+"」的项目":"暂无项目"),renderItem:evaProject=>React.createElement(EvaProjectList.Item,{key:evaProject.id,className:"eva-project-list-item"+(evaProject.organization?" eva-organization-project-card":""),role:"button",tabIndex:0,onClick:()=>evaOpenProject(evaProject),onKeyDown:evaEvent=>evaKeyboardOpen(evaEvent,evaProject),header:evaProjectIcon(evaProject,18),main:React.createElement("div",{className:"eva-project-list-main"},React.createElement("div",{className:"eva-project-list-title name"},React.createElement("span",null,evaProject.name),evaProject.official&&React.createElement("span",{className:"eva-official-badge"},"官方")),React.createElement("div",{className:"eva-project-list-description"},evaProject.desc||"暂无项目简介")),extra:evaPinButton(evaProject)})})),evaCreateModal)
        }`;
        var projectInfoComponentSource = String.raw`EvaProjectInfoPage=({workspace:evaWorkspace})=>{
          const evaMeta=evaWorkspace.overview||(evaWorkspace.id==="prod"?window.__EVA_SUPPLY_CHAIN_DEMO.overview:{}),evaPeriod=typeof evaMeta.period==="object"?[evaMeta.period.start,evaMeta.period.end].filter(Boolean).join(" 至 "):evaMeta.period||"尚未设置",evaInfo={summary:evaWorkspace.desc||"尚未填写项目目标",background:evaMeta.background||"尚未填写",goals:Array.isArray(evaMeta.goals)?evaMeta.goals:evaWorkspace.desc?[evaWorkspace.desc]:[],period:evaPeriod,stage:evaMeta.stage||"尚未设置",milestones:Array.isArray(evaMeta.milestones)?evaMeta.milestones:[]};
          return React.createElement("div",{className:"eva-project-info"},React.createElement("header",{className:"eva-project-info__hero"},React.createElement("div",{className:"eva-project-info__hero-main"},React.createElement("div",{className:"eva-project-info__eyebrow"},React.createElement("span",{className:"eva-project-info__status"},evaMeta.status||"项目"),React.createElement("span",null,"项目编号 · ",evaWorkspace.id)),React.createElement("h1",null,evaWorkspace.name),React.createElement("p",null,evaInfo.summary),React.createElement("div",{className:"eva-project-info__background"},React.createElement("strong",null,"项目背景"),React.createElement("p",null,evaInfo.background))),React.createElement("dl",{className:"eva-project-info__facts"},React.createElement("div",null,React.createElement("dt",null,"项目周期"),React.createElement("dd",null,evaInfo.period)),React.createElement("div",null,React.createElement("dt",null,"当前阶段"),React.createElement("dd",null,evaInfo.stage)))),React.createElement("div",{className:"eva-project-info__grid"},React.createElement("section",{className:"eva-project-info__card"},React.createElement("h2",null,"项目目标"),React.createElement("ol",{className:"eva-project-info__goals"},evaInfo.goals.map((evaGoal,evaIndex)=>React.createElement("li",{key:evaGoal},React.createElement("span",null,String(evaIndex+1).padStart(2,"0")),React.createElement("p",null,evaGoal))))),React.createElement("section",{className:"eva-project-info__card eva-project-info__card--milestones"},React.createElement("h2",null,"关键里程碑"),React.createElement("div",{className:"eva-project-info__timeline"},evaInfo.milestones.map(evaMilestone=>React.createElement("div",{key:evaMilestone[0],className:"eva-project-info__milestone is-"+evaMilestone[2]},React.createElement("span",{className:"eva-project-info__milestone-dot","aria-hidden":!0}),React.createElement("time",null,evaMilestone[0]),React.createElement("strong",null,evaMilestone[1]),React.createElement("span",{className:"eva-project-info__milestone-state"},evaMilestone[2]==="done"?"已完成":evaMilestone[2]==="active"?"进行中":"待开始")))))))
        }`;
        projectDirectoryComponentSource = projectDirectoryComponentSource
          .replace('React.createElement(Card,{key:evaProject.id,className:', 'React.createElement(Card,{key:evaProject.id,"data-eva-project-id":evaProject.id,className:')
          .replace('React.createElement(EvaProjectList.Item,{key:evaProject.id,className:', 'React.createElement(EvaProjectList.Item,{key:evaProject.id,"data-eva-project-id":evaProject.id,className:')
          .replaceAll('AI 产品共创', '供应链运营协同')
          .replaceAll('让产品、研发和业务共同推进 AI 能力', '协同推进采购、质量与合规工作');
        var replacements = [
          [
            '最近更新：2026-09-04 20:28',
            '最近更新：' + evaRelease.updatedAt
          ],
          [
            'function isPwaRegistrationSupported(){if(typeof window>"u"||typeof navigator>"u"||isElectronDesktop()||!("serviceWorker"in navigator))return!1;',
            'function isPwaRegistrationSupported(){return!1;if(typeof window>"u"||typeof navigator>"u"||isElectronDesktop()||!("serviceWorker"in navigator))return!1;'
          ],
          [
            'function titleForPath(rt,ct){return rt.startsWith("/login")?ct("login.pageTitle"):"Eva 同学"}',
            'function titleForPath(rt,ct){return rt.startsWith("/login")?ct("login.pageTitle"):"Eva · ' + evaReleaseDate + ' · ' + evaReleaseRevision + '"}'
          ],
          [
            'BY_SPACE={agents:{[SPACE_DATA_KEY]:AGENTS},squads:{[SPACE_DATA_KEY]:SQUADS},skills:{[SPACE_DATA_KEY]:SKILLS},autopilots:{[SPACE_DATA_KEY]:AUTOPILOTS},projects:{[SPACE_DATA_KEY]:PROJECTS},members:{[SPACE_DATA_KEY]:MEMBERS}}',
            'BY_SPACE={agents:{prod:window.__EVA_SUPPLY_CHAIN_DEMO.agents,"drive-design":window.__EVA_DRIVE_DEMO.agents},squads:{prod:window.__EVA_SUPPLY_CHAIN_DEMO.squads,"drive-design":window.__EVA_DRIVE_DEMO.squads},skills:{prod:window.__EVA_SUPPLY_CHAIN_DEMO.skills,"drive-design":window.__EVA_DRIVE_DEMO.skills},autopilots:{prod:window.__EVA_SUPPLY_CHAIN_DEMO.autopilots,"drive-design":window.__EVA_DRIVE_DEMO.autopilots},projects:{prod:window.__EVA_SUPPLY_CHAIN_DEMO.projects,"drive-design":window.__EVA_DRIVE_DEMO.projects},members:{prod:MEMBERS,"drive-design":MEMBERS}}'
          ],
          [
            'ISSUES_BY_SPACE={[SPACE_DATA_KEY]:MOCK_ISSUES}',
            'ISSUES_BY_SPACE={prod:window.__EVA_SUPPLY_CHAIN_DEMO.issues,"drive-design":window.__EVA_DRIVE_DEMO.issues}'
          ],
          [
            'CANDIDATES=[...AGENTS.map(rt=>({id:rt.id,type:"agent",name:rt.name})),...SQUADS.map(rt=>({id:rt.id,type:"squad",name:rt.name})),...MEMBERS.map(rt=>({id:rt.user_id,type:"member",name:rt.name??rt.user_id,octo_uid:rt.octo_uid}))]',
            'CANDIDATES=[...window.__EVA_SUPPLY_CHAIN_DEMO.agents.map(rt=>({id:rt.id,type:"agent",name:rt.name})),...window.__EVA_SUPPLY_CHAIN_DEMO.squads.map(rt=>({id:rt.id,type:"squad",name:rt.name})),...window.__EVA_DRIVE_DEMO.agents.map(rt=>({id:rt.id,type:"agent",name:rt.name})),...window.__EVA_DRIVE_DEMO.squads.map(rt=>({id:rt.id,type:"squad",name:rt.name})),...MEMBERS.map(rt=>({id:rt.user_id,type:"member",name:rt.name??rt.user_id,octo_uid:rt.octo_uid}))]'
          ],
          [
            'case"settings":return React.createElement(SettingsPage,{workspace:WORKSPACE})',
            'case"project-info":return React.createElement(EvaProjectInfoPage,{workspace:rt});case"settings":return React.createElement(SettingsPage,{workspace:{...WORKSPACE,id:rt.id,name:rt.name,slug:rt.id}})'
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
            'TABS=[{key:"tasks",label:"任务"},{key:"channels",label:"群聊"},{key:"files",label:"文件"},{key:"automation",label:"自动化"},{key:"project-info",label:"项目信息"},{key:"settings",label:"项目设置"}]'
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
            '),Ft)},' + projectDirectoryComponentSource + ',' + projectInfoComponentSource + ',SpaceFrame='
          ],
          [
            ':React.createElement(SpaceList,{spaces:rt,onEnter:',
            ':React.createElement(EvaProjectDirectory,{spaces:rt,onEnter:'
          ],
          [
            'function CollabPage(){const[rt,ct]=reactExports.useState(()=>loadSpaces()),[ut,pt]=reactExports.useState(null),mt=rt.find(gt=>gt.id===ut)??null;return',
            'function CollabPage(){const evaProjectLocation=useLocation(),evaProjectNavigate=useNavigate(),evaRouteMemberStore=evaMembers().store;reactExports.useSyncExternalStore(evaRouteMemberStore.subscribe,evaRouteMemberStore.getSnapshot);const[rt,ct]=reactExports.useState(()=>loadSpaces()),ut=new URLSearchParams(evaProjectLocation.search).get("evaProject"),pt=id=>evaProjectNavigate(id?"/collab?evaProject="+encodeURIComponent(id):"/collab"),mt=rt.find(gt=>gt.id===ut&&evaRouteMemberStore.canRead(gt.id,evaRouteMemberStore.snapshot().actorId))??null;reactExports.useEffect(()=>{const gt=()=>{WKApp$1.routeRight.popAll(),pt(null)},St=Ct=>{const xt=Ct.detail||{};xt.projectId&&evaRouteMemberStore.canRead(xt.projectId,evaRouteMemberStore.snapshot().actorId)&&(WKApp$1.routeRight.popAll(),pt(xt.projectId))};return window.addEventListener("eva:open-project-directory",gt),window.addEventListener("eva:open-project-view",St),()=>{window.removeEventListener("eva:open-project-directory",gt),window.removeEventListener("eva:open-project-view",St)}},[evaProjectNavigate]);return'
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


        source=root.__evaCut(source,'React.createElement("div",{id:"eva-titlebar-crumb",className:"eva-tb-crumb-slot"','React.createElement(evaMembers().ui.InvitationMailbox,null),React.createElement("div",{id:"eva-titlebar-crumb",className:"eva-tb-crumb-slot"','临时全局邀请信箱入口');
        var memberStart=source.indexOf('function MembersTab({workspaceId:rt}){');
        var memberEnd=source.indexOf('const listAutopilots=',memberStart);
        if(memberStart<0||memberEnd<memberStart||source.indexOf('function MembersTab({workspaceId:rt}){',memberStart+1)>=0)throw new Error('成员管理替换边界不匹配');
        source=root.__evaCut(source,source.slice(memberStart,memberEnd),String.raw`let evaMembershipStore,evaMembershipComponents,evaSharedFileStore;
        function evaMembers(){return evaMembershipStore||(evaMembershipStore=window.EvaMembership.bootstrap(ORG_PEOPLE,loadSpaces(),CHANNELS_BY_SPACE,ORG_CHANNELS,id=>loadSpaces().find(p=>p.id===id))),evaSharedFileStore||(evaSharedFileStore=window.EvaFileSharing.bootstrap(evaMembershipStore)),evaMembershipComponents||(evaMembershipComponents=window.EvaMembersUI.create({React:reactExports,Button,Select,Modal,Table,Input:ForwardInput,Tag,Checkbox,Radio,Switch,PlusIcon:Plus$c,CloseIcon:X,BackIcon:ArrowLeft$3,MailIcon:Mail$1},evaMembershipStore,evaSharedFileStore)),{store:evaMembershipStore,ui:evaMembershipComponents,files:evaSharedFileStore}}
        function MembersTab({workspaceId:rt}){return React.createElement(evaMembers().ui.Members,{key:rt,scopeId:rt})}`, '项目成员组件');
        source = root.__evaCutAll(source, replacements, '通用补丁');
        source=root.__evaCut(source,'onCreate:gt=>{const St=newSpace(gt),Ct=[...rt,St];','onCreate:(gt,evaClones,evaGoal)=>{const St={...newSpace(gt),desc:evaGoal||""},Ct=[...rt,St];evaMembers().store.createProject(St.id,St.name,evaMembers().store.snapshot().actorId,evaClones,evaGoal);','项目创建成员事务');

    source=root.__evaCut(source,'case"channels":return React.createElement(ChannelsView,{onOpenTask:', 'case"channels":return React.createElement(ChannelsView,{key:rt.id,membershipProjectId:rt.id,onManageProject:()=>Pt("settings"),onOpenTask:', '项目 IM 成员上下文');
    source=root.__evaCut(source,'SpaceFrame=({space:rt,spaces:ct,onSwitch:ut})=>{const[pt,mt]=reactExports.useState("tasks")',
      'SpaceFrame=({space:rt,spaces:ct,onSwitch:ut})=>{const evaProjectMemberStore=evaMembers().store,evaProjectMemberRevision=reactExports.useSyncExternalStore(evaProjectMemberStore.subscribe,evaProjectMemberStore.getSnapshot),evaProjectActor=evaProjectMemberStore.snapshot().actorId;const[pt,mt]=reactExports.useState("tasks")','项目内容访问状态');
    source=root.__evaCut(source,'Dt=reactExports.useMemo(()=>{switch(pt){case"tasks":return React.createElement(IssuePage',
      'Dt=reactExports.useMemo(()=>{if(!evaProjectMemberStore.canRead(rt.id,evaProjectActor))return React.createElement(MembersTab,{key:rt.id,workspaceId:rt.id});switch(pt){case"tasks":return React.createElement(IssuePage','未加入项目仅显示邀请');
    source=root.__evaCut(source,'}},[pt,xt]);return React.createElement("div",{className:"collab-frame',
      '}},[pt,xt,rt.id,evaProjectMemberRevision]);reactExports.useEffect(()=>{const Ft=Qt=>{const Nt=Qt.detail||{};Nt.projectId===rt.id&&Nt.tab&&mt(Nt.tab)};return window.addEventListener("eva:open-project-view",Ft),()=>window.removeEventListener("eva:open-project-view",Ft)},[rt.id]);return React.createElement("div",{className:"collab-frame','项目成员变更刷新内容与批注页签恢复');
    source=root.__evaCut(source,'React.createElement("div",{className:"collab-frame eva-channel-surface","data-eva-channel-surface":"project"}',
      'React.createElement("div",{className:"collab-frame eva-channel-surface","data-eva-channel-surface":"project","data-eva-project-id":rt.id,"data-eva-project-tab":pt}','项目批注定位上下文');
    source=root.__evaCut(source,'function SettingsPage({workspace:rt,onUpdated:ct}){','function SettingsPage({workspace:rt,onUpdated:ct,initialTab:evaInitialSettingsTab="general"}){','设置默认标签参数');
    source=root.__evaCut(source,'React.createElement(Tabs,{type:"line"},React.createElement(TabPane,{tab:"通用"','React.createElement(Tabs,{type:"line",defaultActiveKey:evaInitialSettingsTab},React.createElement(TabPane,{tab:"通用"','设置标签初始化');
    source=root.__evaCut(source,'case"settings":return React.createElement(SettingsPage,{workspace:{...WORKSPACE','case"settings":return React.createElement(SettingsPage,{initialTab:"general",workspace:{...WORKSPACE','项目设置默认基本信息');
    source=root.__evaCut(source,'toEntry=rt=>({id:rt.id,space_id:', 'toEntry=rt=>({...rt,id:rt.id,space_id:','文件视图保留来源元数据');
    source=root.__evaCut(source,'source:"user-upload",owner_uid:"u-wangyilin",updated_at:rt.updated_at','source:rt.source??"user-upload",owner_uid:"u-wangyilin",updated_at:rt.updated_at','文件来源不被通用转换覆盖');
    source=root.__evaCut(source,'FilesView=()=>{const[rt,ct]=reactExports.useState(driveEntriesOf()),',
      'FilesView=()=>{const evaFileContext=evaMembers(),evaFileProjectId=currentSpaceId(),evaFileActor=evaFileContext.store.snapshot().actorId,evaFileRevision=reactExports.useSyncExternalStore(evaFileContext.files.subscribe,evaFileContext.files.getSnapshot),[evaFilePreview,setEvaFilePreview]=reactExports.useState(null),[evaFileDrafts,ct]=reactExports.useState(driveEntriesOf()),rt=reactExports.useMemo(()=>[...evaFileContext.files.list(evaFileProjectId,evaFileActor),...evaFileDrafts],[evaFileDrafts,evaFileRevision,evaFileProjectId,evaFileActor]),evaPreviewEntry=async evaEntry=>{const url=await demoFileUrl(evaEntry.name);setEvaFilePreview({...evaEntry,url,extension:evaEntry.extension||evaEntry.name.split(".").pop()})};const', '项目文件读取共享副本');
    source=root.__evaCut(source,'rn=()=>Math.max(...rt.map(sr=>sr.id))+1,','rn=()=>Math.max(0,...rt.map(sr=>Number(sr.id)).filter(Number.isFinite))+1,','文件夹 ID 兼容共享文件');
    source=root.__evaCut(source,'className:"loop-page",style:{height:"100%"}},React.createElement("div",{className:"loop-page__head collab-drive-head"}',
      'className:"loop-page",style:{height:"100%"}},React.createElement(Modal,{className:"eva-members-modal",title:evaFilePreview?.name||"文件预览",width:900,visible:!!evaFilePreview,footer:null,onCancel:()=>setEvaFilePreview(null)},evaFilePreview&&React.createElement("div",{className:"eva-project-file-preview"},evaFilePreview.sharedVersion&&React.createElement("p",{className:"eva-members-notice"},"项目共享版本 v",evaFilePreview.sourceVersion," · 来源：",evaFilePreview.source.groupName,evaFilePreview.source.threadName?" / 子区 "+evaFilePreview.source.threadName:"",evaFilePreview.source.taskId?" / 任务 "+evaFilePreview.source.taskId:"","。访问此文件不会获得来源群的聊天权限。"),React.createElement(FilePreviewHost,{file:evaFilePreview,onClose:()=>setEvaFilePreview(null)}))),React.createElement("div",{className:"loop-page__head collab-drive-head"}', '项目文件预览复用组件');
    source=root.__evaCut(source,'entries:Kt,loading:!1,onOpenFolder:sn,onOpenDoc:()=>{}','entries:Kt,loading:!1,onOpenFolder:sn,onOpenDoc:evaPreviewEntry,onOpenFile:evaPreviewEntry','项目文件打开预览');
    source=root.__evaCut(source,'onShare:()=>{},onDownload:()=>{},canDownload:!1,canEdit:!0,canShare:!1','onShare:()=>{},onDownload:async evaEntry=>downloadFile(await demoFileUrl(evaEntry.name),evaEntry.name),canDownload:!0,canEdit:!0,canShare:!1','项目文件下载');
    var fileListStart=source.indexOf('function FileList({'),fileListEnd=source.indexOf('function Breadcrumb({',fileListStart);
    if(fileListStart<0||fileListEnd<fileListStart)throw new Error('FileList 组件边界不匹配');
    var oldFileList=source.slice(fileListStart,fileListEnd),newFileList=oldFileList;
    newFileList=root.__evaCut(newFileList,'canShare:Dt}){','canShare:Dt,onOpenFile:evaOpenFile}){','FileList 预览回调');
    newFileList=root.__evaCut(newFileList,'const Vt=Qt.type==="folder";','const Vt=Qt.type==="folder",evaCanEdit=Mt&&!Qt.sharedVersion;','共享版本只读操作');
    newFileList=root.__evaCut(newFileList,'React.createElement("span",{className:"drive-file__name-text",title:Qt.name},Qt.name)',
      'React.createElement("span",{className:"eva-file-name-content"},evaOpenFile?React.createElement("button",{type:"button",className:"drive-file__name-link",onClick:()=>evaOpenFile(Qt)},Qt.name):React.createElement("span",{className:"drive-file__name-text",title:Qt.name},Qt.name),Qt.sharedVersion&&React.createElement("small",{className:"eva-members-muted"},"共享版本 v",Qt.sourceVersion," · 来源：",Qt.source.groupName,Qt.source.threadName?" / "+Qt.source.threadName:"",Qt.source.taskId?" / "+Qt.source.taskId:""))','文件列表来源说明');
    newFileList=newFileList.replaceAll('Mt&&React.createElement','evaCanEdit&&React.createElement').replaceAll('(Mt||','(evaCanEdit||');
    source=root.__evaCut(source,oldFileList,newFileList,'FileList 共享文件能力');
    source=root.__evaCut(source,'async function demoFileUrl(rt){const ct=cache.get(rt);','async function demoFileUrl(rt){const evaSample=window.__EVA_FILE_SAMPLE_URLS?.[rt];if(evaSample)return evaSample;const ct=cache.get(rt);','演示文件静态内容');
    const infoStart=source.indexOf('function GeneralTab('),infoEnd=source.indexOf('function WebhooksTab(',infoStart);
    if(infoStart<0||infoEnd<infoStart)throw new Error('项目信息组件边界不匹配');
    source=root.__evaCut(source,source.slice(infoStart,infoEnd),String.raw`function evaProjectIssuePrefix(project){
      if(project.issue_prefix)return project.issue_prefix;
      const existing=(ISSUES_BY_SPACE[project.id]||[]).find(issue=>/^[A-Z][A-Z0-9]*-\d+$/.test(issue.identifier||''));
      return existing?existing.identifier.slice(0,existing.identifier.lastIndexOf('-')):'P'+Array.from(project.id).map(c=>c.charCodeAt(0).toString(16)).join('').toUpperCase();
    }
    function evaNormalizeProjectOverview(overview){
      if(!overview||typeof overview!=="object"||Array.isArray(overview))throw new Error("项目信息格式错误");
      const text=(value,max,label)=>{const normalized=String(value??"").trim();if(normalized.length>max)throw new Error(label+"最多 "+max+" 个字符");return normalized},states=["done","active","pending"];
      const start=text(overview.period?.start,50,"项目开始时间"),end=text(overview.period?.end,50,"项目结束时间");
      if((start&&!end)||(!start&&end))throw new Error("项目周期请同时填写开始和结束日期");
      const goals=Array.isArray(overview.goals)?overview.goals.map(goal=>text(goal,200,"项目目标")).filter(Boolean):[];
      if(goals.length>12)throw new Error("项目目标最多 12 项");
      const milestones=Array.isArray(overview.milestones)?overview.milestones.map(row=>{
        const date=text(Array.isArray(row)?row[0]:"",50,"里程碑日期"),title=text(Array.isArray(row)?row[1]:"",200,"里程碑事项"),state=Array.isArray(row)&&states.includes(row[2])?row[2]:"pending";
        return date&&title?[date,title,state]:null;
      }).filter(Boolean):[];
      if(milestones.length>12)throw new Error("关键里程碑最多 12 项");
      return {status:text(overview.status,30,"项目状态"),background:text(overview.background,2000,"项目背景"),period:{start,end},stage:text(overview.stage,100,"当前阶段"),goals,milestones};
    }
    function evaSaveProjectInfo(id,{name,goal,issuePrefix,overview}){
      const store=evaMembers().store,actor=store.snapshot().actorId;
      if(!store.manager(id,actor))throw new Error('仅项目负责人或管理员可修改');
      const projects=loadSpaces(),project=projects.find(p=>p.id===id);if(!project)throw new Error('项目不存在');
      name=name.trim();goal=goal.trim();issuePrefix=(issuePrefix??evaProjectIssuePrefix(project)).trim().toUpperCase();
      if(!name||name.length>50)throw new Error('项目名称须为 1–50 个字符');
      if(goal.length>2000)throw new Error('共同目标最多 2000 个字符');
      if(!/^[A-Z][A-Z0-9]*$/.test(issuePrefix))throw new Error('任务前缀须以英文字母开头，仅包含字母和数字');
      if(projects.some(p=>p.id!==id&&(evaProjectIssuePrefix(p)===issuePrefix||(ISSUES_BY_SPACE[p.id]||[]).some(issue=>String(issue.identifier||'').startsWith(issuePrefix+'-')))))throw new Error('该任务前缀已被其他项目使用');
      const normalizedOverview=overview===undefined?undefined:evaNormalizeProjectOverview(overview);
      const next=projects.map(p=>p.id===id?{...p,name,short:name.slice(0,1),desc:goal,issue_prefix:issuePrefix,...(normalizedOverview===undefined?{}:{overview:normalizedOverview})}:p);
      localStorage.setItem(KEY,JSON.stringify(next));
      store.renameProject(id,actor,name);
      return next;
    }
    function GeneralTab({workspace:project,onUpdated}){
      const store=evaMembers().store,revision=reactExports.useSyncExternalStore(store.subscribe,store.getSnapshot),actor=store.snapshot().actorId,seedOverview=project.overview||(project.id==='prod'?window.__EVA_SUPPLY_CHAIN_DEMO.overview:{}),overviewKey=JSON.stringify(seedOverview),readOverview=source=>({status:source.status||'',background:source.background||'',period:{start:source.period?.start||'',end:source.period?.end||''},stage:source.stage||'',goals:Array.isArray(source.goals)?source.goals.map(goal=>String(goal)):[],milestones:Array.isArray(source.milestones)?source.milestones.map(row=>[String(row?.[0]||''),String(row?.[1]||''),['done','active','pending'].includes(row?.[2])?row[2]:'pending']):[]});
      const [name,setName]=reactExports.useState(project.name),[goal,setGoal]=reactExports.useState(project.desc||''),[issuePrefix,setIssuePrefix]=reactExports.useState(evaProjectIssuePrefix(project)),[overview,setOverview]=reactExports.useState(()=>readOverview(seedOverview)),[error,setError]=reactExports.useState(''),[saved,setSaved]=reactExports.useState(false);
      reactExports.useEffect(()=>setSaved(false),[project.id,actor]);
      reactExports.useEffect(()=>{setName(project.name);setGoal(project.desc||'');setIssuePrefix(evaProjectIssuePrefix(project));setOverview(readOverview(seedOverview));setError('');},[project.id,project.name,project.desc,project.issue_prefix,overviewKey,actor]);
      const editable=store.manager(project.id,actor),savedOverview=readOverview(seedOverview),changed=name.trim()!==project.name||goal.trim()!==(project.desc||'')||issuePrefix.trim().toUpperCase()!==evaProjectIssuePrefix(project)||JSON.stringify(overview)!==JSON.stringify(savedOverview),updateOverview=(key,value)=>{setOverview(current=>({...current,[key]:value}));setSaved(false)},updateGoal=(index,value)=>{setOverview(current=>({...current,goals:current.goals.map((goal,goalIndex)=>goalIndex===index?value:goal)}));setSaved(false)},updateMilestone=(index,key,value)=>{setOverview(current=>({...current,milestones:current.milestones.map((row,rowIndex)=>rowIndex===index?key===0?[value,row[1],row[2]]:key===1?[row[0],value,row[2]]:[row[0],row[1],value]:row)}));setSaved(false)};
      const save=()=>{try{const next=evaSaveProjectInfo(project.id,{name,goal,issuePrefix,overview});onUpdated?.(next);setError('');setSaved(true);}catch(e){setError(e.message||'保存失败，请重试');}};
      const field=(label,id,control,hint)=>React.createElement('div',{className:'eva-project-info-field'},React.createElement('label',{htmlFor:id},label),control,hint&&React.createElement('p',{className:'eva-members-muted'},hint));
      return React.createElement('div',{className:'eva-project-settings-info'},
        React.createElement('header',{className:'eva-project-info__hero eva-project-settings-info__hero'},React.createElement('div',{className:'eva-project-info__hero-main'},
          React.createElement('div',{className:'eva-project-info__eyebrow'},field('项目状态','eva-project-status',React.createElement(ForwardInput,{id:'eva-project-status','aria-label':'项目状态',value:overview.status,maxLength:30,disabled:!editable,placeholder:'例如：协作中',onChange:value=>updateOverview('status',value)})),React.createElement('span',null,'项目编号 · ',project.id)),
          field('项目名称','eva-project-name',React.createElement(ForwardInput,{id:'eva-project-name','aria-label':'项目名称',className:'eva-project-settings-info__title',value:name,maxLength:50,disabled:!editable,onChange:value=>{setName(value);setSaved(false);}})),
          field('项目简介','eva-project-goal',React.createElement('textarea',{id:'eva-project-goal','aria-label':'项目简介',value:goal,maxLength:2000,rows:3,disabled:!editable,placeholder:'概括项目希望共同达成的结果',onChange:e=>{setGoal(e.target.value);setSaved(false);}})),
          field('项目背景','eva-project-background',React.createElement('textarea',{id:'eva-project-background','aria-label':'项目背景',value:overview.background,maxLength:2000,rows:3,disabled:!editable,placeholder:'说明项目发起背景与需要解决的问题',onChange:e=>updateOverview('background',e.target.value)}))),
          React.createElement('dl',{className:'eva-project-info__facts eva-project-settings-info__facts'},React.createElement('div',null,React.createElement('dt',null,React.createElement('label',{htmlFor:'eva-project-period-start'},'项目周期')),React.createElement('dd',{className:'eva-project-settings-info__period'},React.createElement(ForwardInput,{id:'eva-project-period-start','aria-label':'项目开始时间',value:overview.period.start,disabled:!editable,placeholder:'开始日期',onChange:value=>updateOverview('period',{...overview.period,start:value})}),React.createElement('span',{'aria-hidden':true},'至'),React.createElement(ForwardInput,{id:'eva-project-period-end','aria-label':'项目结束时间',value:overview.period.end,disabled:!editable,placeholder:'结束日期',onChange:value=>updateOverview('period',{...overview.period,end:value})}))),React.createElement('div',null,React.createElement('dt',null,React.createElement('label',{htmlFor:'eva-project-stage'},'当前阶段')),React.createElement('dd',null,React.createElement(ForwardInput,{id:'eva-project-stage','aria-label':'当前阶段',value:overview.stage,maxLength:100,disabled:!editable,placeholder:'例如：方案评审',onChange:value=>updateOverview('stage',value)}))))),
        React.createElement('div',{className:'eva-project-info__grid eva-project-settings-info__grid'},React.createElement('section',{className:'eva-project-info__card'},React.createElement('div',{className:'eva-project-settings-info__card-title'},React.createElement('h2',null,'项目目标'),editable&&React.createElement(Button,{theme:'borderless',type:'tertiary',size:'small',onClick:()=>{setOverview(current=>({...current,goals:[...current.goals,'']}));setSaved(false);}},'添加目标')),React.createElement('ol',{className:'eva-project-info__goals eva-project-settings-info__goals'},overview.goals.map((item,index)=>React.createElement('li',{key:index},React.createElement('span',null,String(index+1).padStart(2,'0')),React.createElement('div',{className:'eva-project-settings-info__row'},React.createElement(ForwardInput,{'aria-label':'项目目标 '+(index+1),value:item,maxLength:200,disabled:!editable,placeholder:'填写项目目标',onChange:value=>updateGoal(index,value)}),editable&&React.createElement(Button,{theme:'borderless',type:'tertiary',size:'small','aria-label':'删除项目目标 '+(index+1),onClick:()=>{setOverview(current=>({...current,goals:current.goals.filter((_,goalIndex)=>goalIndex!==index)}));setSaved(false);}},'删除')))),!overview.goals.length&&React.createElement('li',{className:'eva-project-settings-info__empty'},'尚未添加项目目标'))),React.createElement('section',{className:'eva-project-info__card eva-project-info__card--milestones'},React.createElement('div',{className:'eva-project-settings-info__card-title'},React.createElement('h2',null,'关键里程碑'),editable&&React.createElement(Button,{theme:'borderless',type:'tertiary',size:'small',onClick:()=>{setOverview(current=>({...current,milestones:[...current.milestones,['','', 'pending']]}));setSaved(false);}},'添加里程碑')),React.createElement('div',{className:'eva-project-info__timeline eva-project-settings-info__timeline'},overview.milestones.map((item,index)=>React.createElement('div',{key:index,className:'eva-project-info__milestone is-'+item[2]},React.createElement('span',{className:'eva-project-info__milestone-dot','aria-hidden':true}),React.createElement(ForwardInput,{'aria-label':'里程碑日期 '+(index+1),value:item[0],disabled:!editable,placeholder:'日期',onChange:value=>updateMilestone(index,0,value)}),React.createElement('div',{className:'eva-project-settings-info__milestone-copy'},React.createElement(ForwardInput,{'aria-label':'里程碑事项 '+(index+1),value:item[1],maxLength:200,disabled:!editable,placeholder:'里程碑事项',onChange:value=>updateMilestone(index,1,value)}),React.createElement('select',{'aria-label':'里程碑状态 '+(index+1),value:item[2],disabled:!editable,onChange:event=>updateMilestone(index,2,event.target.value)},React.createElement('option',{value:'pending'},'待开始'),React.createElement('option',{value:'active'},'进行中'),React.createElement('option',{value:'done'},'已完成'))),editable&&React.createElement(Button,{theme:'borderless',type:'tertiary',size:'small','aria-label':'删除里程碑 '+(index+1),onClick:()=>{setOverview(current=>({...current,milestones:current.milestones.filter((_,milestoneIndex)=>milestoneIndex!==index)}));setSaved(false);}},'删除'))),!overview.milestones.length&&React.createElement('p',{className:'eva-project-settings-info__empty'},'尚未添加关键里程碑')))),
        React.createElement('section',{className:'eva-project-settings-info__advanced'},field('任务前缀','eva-project-issue-prefix',React.createElement(ForwardInput,{id:'eva-project-issue-prefix','aria-label':'任务前缀',value:issuePrefix,disabled:!editable,placeholder:'例如 SC',onChange:value=>{setIssuePrefix(value.toUpperCase());setSaved(false);}}),'完整任务编号由前缀和数字组成，例如 SC-101。修改前缀只影响新任务，已有编号保留。')),
        React.createElement('div',{className:'eva-project-settings-info__actions'},React.createElement('div',null,error&&React.createElement('p',{role:'alert',className:'eva-members-error'},error),saved&&React.createElement('p',{role:'status',className:'eva-members-muted'},'项目信息已保存'),!editable&&React.createElement('p',{className:'eva-members-muted'},'仅项目负责人和管理员可编辑。')),editable&&React.createElement(Button,{theme:'solid',disabled:!name.trim()||!changed,onClick:save},'保存修改')));
    }`, '项目设置可编辑概览');
    source=root.__evaCut(source,'tab:"通用",itemKey:"general"','tab:"基本信息",itemKey:"general"','基本信息标签');
    source=root.__evaCut(source,'SpaceFrame=({space:rt,spaces:ct,onSwitch:ut})','SpaceFrame=({space:rt,spaces:ct,onSwitch:ut,onProjectUpdated:evaProjectUpdated})','项目更新回调');
    source=root.__evaCut(source,'workspace:{...WORKSPACE,id:rt.id,name:rt.name,slug:rt.id}','workspace:rt,onUpdated:evaProjectUpdated','设置读取当前项目');
    source=root.__evaCut(source,'space:mt,spaces:rt,onSwitch:gt=>pt(gt)','space:mt,spaces:rt,onSwitch:gt=>pt(gt),onProjectUpdated:ct','项目列表刷新');
    source=root.__evaCut(source,'[pt,xt,rt.id,evaProjectMemberRevision]','[pt,xt,rt,evaProjectMemberRevision,evaProjectUpdated]','项目信息更新刷新内容');
    source=root.__evaCut(source,'name:"团队文件功能设计",short:"团",desc:(St.desc||"").replaceAll("云盘","团队文件")','name:St.name,short:St.short,desc:St.desc||""','保留用户修改的项目名称与目标');
    source=root.__evaCut(source,'createIssue=rt=>{const ut={...MOCK_ISSUES[0],...rt,id:`mock-${Date.now().toString(36)}`,identifier:`WS-${issuesOf().length+1}`};return issuesOf().push(ut),Promise.resolve(ut)}',String.raw`createIssue=rt=>{
      const pid=rt.workspace_id||currentSpaceId(),project=loadSpaces().find(p=>p.id===pid),store=evaMembers().store,snapshot=store.snapshot(),scope=snapshot.projects[pid];
      if(!project||!scope||!store.canRead(pid,snapshot.actorId))return Promise.reject(new Error("请先进入已加入的项目"));
      if(!String(rt.title||"").trim())return Promise.reject(new Error("请填写任务名称"));
      const allowed=[...scope.humans.map(p=>p.id),...(scope.cloneIds||[]),...(scope.employeeIds||[]),store.projectAgent(pid)?.id];
      if(rt.assignee_id&&!allowed.includes(rt.assignee_id))return Promise.reject(new Error("负责人已不在本项目，请重新选择"));
      if(rt.reviewer_id&&!scope.humans.some(p=>p.id===rt.reviewer_id))return Promise.reject(new Error("验收人已不在本项目，请重新选择"));
      const list=ISSUES_BY_SPACE[pid]||(ISSUES_BY_SPACE[pid]=[]);
      if(rt.parent_issue_id&&!list.some(i=>i.id===rt.parent_issue_id))return Promise.reject(new Error("父任务不属于当前项目"));
      const prefix=evaProjectIssuePrefix(project),number=1+Math.max(0,...list.map(i=>{const match=String(i.identifier||"").match(/-(\d+)$/);return match?Number(match[1]):Number(i.number)||0;})),now=new Date().toISOString(),creator=store.person(snapshot.actorId),attachments=(rt.attachment_ids||[]).map(id=>evaLoopTaskAttachments.get(id)).filter(Boolean),attachmentText=attachments.length?"\n\n## 参考附件\n"+attachments.map(a=>"- ["+a.name.replace(/[\[\]]/g,"")+"]("+a.url+")").join("\n"):"";
      const isHuman=scope.humans.some(p=>p.id===rt.assignee_id),assignee=rt.assignee_id?(isHuman?store.person(rt.assignee_id):(scope.cloneIds||[]).includes(rt.assignee_id)?store.clone(rt.assignee_id):(scope.employeeIds||[]).includes(rt.assignee_id)?store.employee(rt.assignee_id):store.projectAgent(pid)):null;
      const ut={...rt,id:"issue-"+pid+"-"+prefix+"-"+number,title:rt.title.trim(),description:(rt.description||"")+attachmentText,workspace_id:pid,project_id:pid==='prod'?'p-supply':null,project_name:project.name,number,identifier:prefix+"-"+number,status:rt.status||"todo",priority:rt.priority||"none",assignee_id:rt.assignee_id||null,assignee_type:assignee?(isHuman?"member":"agent"):null,assignee_name:assignee?.name||null,creator_id:snapshot.actorId,creator_name:creator?.name||"",creator_avatar:creator?.avatar||window.__EVA_CURRENT_USER_PORTRAIT,created_at:now,updated_at:now,position:list.length+1,attachments};
      list.push(ut);return Promise.resolve(ut);
    }`,'项目任务完整编号');
    const evaCreateStart=source.indexOf('function CreateIssueModal('),evaCreateEnd=source.indexOf('const{Text:Text$c}=Typography;',evaCreateStart);
    if(evaCreateStart<0||evaCreateEnd<evaCreateStart)throw new Error('新建 Loop 任务组件边界不匹配');
    source=root.__evaCut(source,source.slice(evaCreateStart,evaCreateEnd),String.raw`const evaLoopTaskAttachments=new Map(),evaLoopTaskLabelsByProject=new Map();
    function evaTaskLabels(project){
      const key=project?.id;if(!key)return[];
      if(!evaLoopTaskLabelsByProject.has(key)){const seed=(window.__EVA_SUPPLY_CHAIN_DEMO?.taskLabels||[]).filter(label=>label.project_id===key||(key==='prod'&&label.project_id==='p-supply'));evaLoopTaskLabelsByProject.set(key,seed.map(label=>({...label})));}
      return evaLoopTaskLabelsByProject.get(key);
    }
    function evaCreateTaskLabel(project,name){
      const normalized=String(name||'').trim();if(!normalized||normalized.length>20)throw new Error('标签名称须为 1–20 个字符');
      const labels=evaTaskLabels(project),existing=labels.find(label=>label.name===normalized);if(existing)return existing;
      const labelProjectId=project.id==='prod'?'p-supply':project.id,label={id:'task-label:'+labelProjectId+':'+Date.now().toString(36)+':'+Math.random().toString(36).slice(2,7),project_id:labelProjectId,name:normalized};labels.push(label);return label;
    }
    function evaAttachTaskLabel(project,pid,issueId,labelId){
      const label=evaTaskLabels(project).find(item=>item.id===labelId),issue=(ISSUES_BY_SPACE[pid]||[]).find(item=>item.id===issueId);if(!label||!issue)throw new Error('标签或任务不存在');
      issue.labels=issue.labels||[];if(!issue.labels.some(item=>item.id===label.id))issue.labels.push({id:label.id,name:label.name});return issue;
    }
    function CreateIssueModal(props){
      const store=evaMembers().store;reactExports.useSyncExternalStore(store.subscribe,store.getSnapshot);
      const project=loadSpaces().find(p=>p.id===(props.projectId||currentSpaceId()));
      return window.EvaLoopTaskCreateUI.render(props,{React:reactExports,Modal,Button,Input:ForwardInput,TextArea,Select,icons:{X,Paperclip:Paperclip$3,Trash2},members:store,HumanIdentity:evaMembers().ui.HumanIdentity,project,getPrefix:()=>project?evaProjectIssuePrefix(project):'',createIssue:payload=>props.canCreate&&!props.canCreate()?Promise.reject(new Error('已失去当前会话或项目的访问权限')):createIssue(payload),uploadAttachment:file=>{
        if(!file||file.size>20*1024*1024)return Promise.reject(new Error('单个附件不能超过 20 MB'));
        const record={id:'task-file:'+crypto.randomUUID(),name:file.name,size:file.size,mime_type:file.type,url:URL.createObjectURL(file)};evaLoopTaskAttachments.set(record.id,record);return Promise.resolve(record);
      },listLabels:()=>Promise.resolve(evaTaskLabels(project)),createLabel:name=>Promise.resolve(evaCreateTaskLabel(project,name)),attachLabel:(issueId,labelId)=>Promise.resolve(evaAttachTaskLabel(project,project?.collaborationId||(project?.id==='p-supply'?'prod':project?.id),issueId,labelId))});
    }`,'项目 Loop 任务完整创建表单');
    source=root.__evaCut(source,'const evaProjectMemberStore=evaMembers().store,evaProjectMemberRevision=', 'const evaTaskLocation=useLocation();reactExports.useEffect(()=>{if(new URLSearchParams(evaTaskLocation.search).get("evaTab")==="tasks"){WKApp$1.routeRight.popAll();mt("tasks");}},[rt.id,evaTaskLocation.key]);const evaProjectMemberStore=evaMembers().store,evaProjectMemberRevision=', '项目 Loop 路由标签');
    source=root.__evaCut(source,'getIssue=rt=>Promise.resolve(issuesOf().find(ct=>ct.id===rt)??MOCK_ISSUES[0])','getIssue=rt=>{const issue=issuesOf().find(ct=>ct.id===rt||ct.identifier===rt);return issue?Promise.resolve(issue):Promise.reject(new Error("当前项目找不到任务："+rt))}','按完整任务编号查找');
    source=root.__evaCut(source,'listRuns=()=>Promise.resolve([{id:"run-supply-1-1"','listRuns=rt=>Promise.resolve((rt&&issuesOf().some(issue=>issue.id===rt)?[{id:"run-supply-1-1"','运行历史要求当前项目任务');
    source=root.__evaCut(source,'trigger_summary:"@提及后完成间接采购需求归集"}]),listRunMessages=', 'trigger_summary:"@提及后完成间接采购需求归集"}]:[]).filter(run=>run.issue_id===rt)),listRunMessages=', '运行历史按任务隔离');
    source=root.__evaCut(source,'Promise.all([getIssue(rt),listComments(rt),listRuns()])','Promise.all([getIssue(rt),listComments(rt),listRuns(rt)])','任务详情传入运行任务ID');
    source=root.__evaCut(source,'Pa=()=>listRuns().then(mr)','Pa=()=>listRuns(rt).then(mr)','刷新运行历史传入任务ID');
    source=root.__evaCut(source,'listComments=rt=>{const ct=', 'listComments=rt=>{if(!rt||!issuesOf().some(issue=>issue.id===rt))return Promise.resolve([]);const ct=', '评论限制当前项目任务');
    source=root.__evaCut(source,'listChildren=rt=>Promise.resolve(issuesOf().filter(ct=>ct.parent_issue_id===rt))','listChildren=rt=>Promise.resolve(rt&&issuesOf().some(issue=>issue.id===rt)?issuesOf().filter(ct=>ct.parent_issue_id===rt):[])','子任务限制当前项目父任务');
    source=root.__evaCut(source,'listTimeline().then(no=>{Wi()&&sr(no)})','listTimeline(rt).then(no=>{Wi()&&sr(no)})','任务动态明确任务ID');
    return source;
  });
})(window);
