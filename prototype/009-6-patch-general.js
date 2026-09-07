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
          const evaIsDrive=evaWorkspace.id==="drive-design",evaInfo=evaIsDrive?{summary:"统一团队文件的规划、设计与交付标准，让项目资料更易查找、共享和持续维护。",background:"当前团队文件分散在多个入口，目录、权限和版本规则不统一，成员在查找与交接时成本较高。",goals:["建立清晰、可复用的团队文件信息架构","统一权限、版本与归档规则","完成核心场景验证并沉淀设计规范"],period:"2026.08.25 — 2026.10.16",stage:"核心场景验证",scope:["目录与检索","权限与分享","版本与归档"],people:[["王宜林","项目负责人"],["林晓","产品设计"],["陈屿","研发负责人"]],milestones:[["08.29","范围与现状梳理","done"],["09.18","核心方案评审","active"],["10.02","可用性验证","pending"],["10.16","方案验收与交付","pending"]]}:{summary:"连接采购、质量与合规团队，建立从需求发起到风险闭环的统一协作机制。",background:"采购需求、供应商质量和合同合规信息分散在不同群聊与文件中，关键事项缺少统一追踪，跨部门协同成本较高。",goals:["建立采购需求、询比价、质量异常和合同续签的协作闭环","让关键事项全程可追溯、责任人清晰","提前识别供应与合规风险，缩短决策周期"],period:"2026.08.18 — 2026.10.30",stage:"方案收口与试运行",scope:["采购与招投标","质量与排产","合规与合同"],people:[["王宜林","发起人 / 项目负责人"],["何静","采购运营"],["周远","供应商质量"],["苏航","合规与合同"]],milestones:[["08.22","范围和角色确认","done"],["09.12","核心流程试运行","active"],["09.30","权限与文件规则验收","pending"],["10.30","项目复盘与推广","pending"]]};
          return React.createElement("div",{className:"eva-project-info"},React.createElement("header",{className:"eva-project-info__hero"},React.createElement("div",{className:"eva-project-info__hero-main"},React.createElement("div",{className:"eva-project-info__eyebrow"},React.createElement("span",{className:"eva-project-info__status"},"进行中"),React.createElement("span",null,"项目编号 · ",evaIsDrive?"PRJ-2608-07":"PRJ-2608-03")),React.createElement("h1",null,evaWorkspace.name),React.createElement("p",null,evaInfo.summary)),React.createElement("dl",{className:"eva-project-info__facts"},React.createElement("div",null,React.createElement("dt",null,"项目周期"),React.createElement("dd",null,evaInfo.period)),React.createElement("div",null,React.createElement("dt",null,"当前阶段"),React.createElement("dd",null,evaInfo.stage)))),React.createElement("div",{className:"eva-project-info__grid"},React.createElement("section",{className:"eva-project-info__card eva-project-info__card--background"},React.createElement("h2",null,"发起背景"),React.createElement("p",null,evaInfo.background)),React.createElement("section",{className:"eva-project-info__card"},React.createElement("h2",null,"项目目标"),React.createElement("ol",{className:"eva-project-info__goals"},evaInfo.goals.map((evaGoal,evaIndex)=>React.createElement("li",{key:evaGoal},React.createElement("span",null,String(evaIndex+1).padStart(2,"0")),React.createElement("p",null,evaGoal))))),React.createElement("section",{className:"eva-project-info__card eva-project-info__card--milestones"},React.createElement("h2",null,"关键里程碑"),React.createElement("div",{className:"eva-project-info__timeline"},evaInfo.milestones.map(evaMilestone=>React.createElement("div",{key:evaMilestone[0],className:"eva-project-info__milestone is-"+evaMilestone[2]},React.createElement("span",{className:"eva-project-info__milestone-dot","aria-hidden":!0}),React.createElement("time",null,evaMilestone[0]),React.createElement("strong",null,evaMilestone[1]),React.createElement("span",{className:"eva-project-info__milestone-state"},evaMilestone[2]==="done"?"已完成":evaMilestone[2]==="active"?"进行中":"待开始")))),React.createElement("section",{className:"eva-project-info__card"},React.createElement("h2",null,"协作范围"),React.createElement("div",{className:"eva-project-info__scope"},evaInfo.scope.map(evaItem=>React.createElement("span",{key:evaItem},evaItem))),React.createElement("h2",{className:"eva-project-info__people-title"},"关键协作人"),React.createElement("div",{className:"eva-project-info__people"},evaInfo.people.map(evaPerson=>React.createElement("div",{key:evaPerson[0]},React.createElement(Avatar,{name:evaPerson[0],size:"small"}),React.createElement("span",null,React.createElement("strong",null,evaPerson[0]),React.createElement("small",null,evaPerson[1])))))))))
        }`;
        projectDirectoryComponentSource = projectDirectoryComponentSource
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
            'ISSUES_BY_SPACE={prod:window.__EVA_SUPPLY_CHAIN_DEMO.issues,"drive-design":window.__EVA_DRIVE_DEMO.issues},evaUpsertContextTask=window.__evaUpsertContextTask=(rt,ct)=>{const ut=ISSUES_BY_SPACE[rt]??(ISSUES_BY_SPACE[rt]=[]),pt=ut.findIndex(mt=>mt.identifier===ct.identifier);pt>=0?ut[pt]={...ut[pt],...ct}:ut.push(ct)}'
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


        source=root.__evaCut(source,'React.createElement("div",{id:"eva-titlebar-crumb",className:"eva-tb-crumb-slot"','React.createElement(evaMembers().ui.InvitationMailbox,null),React.createElement("div",{id:"eva-titlebar-crumb",className:"eva-tb-crumb-slot"','临时全局邀请信箱入口');
        var memberStart=source.indexOf('function MembersTab({workspaceId:rt}){');
        var memberEnd=source.indexOf('const listAutopilots=',memberStart);
        if(memberStart<0||memberEnd<memberStart||source.indexOf('function MembersTab({workspaceId:rt}){',memberStart+1)>=0)throw new Error('成员管理替换边界不匹配');
        source=root.__evaCut(source,source.slice(memberStart,memberEnd),String.raw`let evaMembershipStore,evaMembershipComponents,evaSharedFileStore;
        function evaMembers(){return evaMembershipStore||(evaMembershipStore=window.EvaMembership.bootstrap(ORG_PEOPLE,loadSpaces(),CHANNELS_BY_SPACE,ORG_CHANNELS,id=>loadSpaces().find(p=>p.id===id))),evaSharedFileStore||(evaSharedFileStore=window.EvaFileSharing.bootstrap(evaMembershipStore)),evaMembershipComponents||(evaMembershipComponents=window.EvaMembersUI.create({React:reactExports,Button,Select,Modal,Table,Input:ForwardInput,Tag,Checkbox,Radio,Switch,PlusIcon:Plus$c,CloseIcon:X,BackIcon:ArrowLeft$3,MailIcon:Mail$1},evaMembershipStore,evaSharedFileStore)),{store:evaMembershipStore,ui:evaMembershipComponents,files:evaSharedFileStore}}
        function MembersTab({workspaceId:rt}){return React.createElement(evaMembers().ui.Members,{key:rt,scopeId:rt})}`, '项目成员组件');
        source = root.__evaCutAll(source, replacements, '通用补丁');

        /* Loop 任务数据必须以当前项目为边界。兼容运行时原先会从首个 mock
         * 任务复制字段，并在未传任务 ID 时回退到预置任务，导致新任务继承运行、
         * 评论等历史。这一层直接替换数据适配器，不让页面组件承担隔离职责。 */
        source = root.__evaCut(
          source,
          'getIssue=rt=>Promise.resolve(issuesOf().find(ct=>ct.id===rt)??MOCK_ISSUES[0])',
          'getIssue=rt=>{const ct=issuesOf().find(ut=>ut.id===rt||ut.identifier===rt);return ct?Promise.resolve(ct):Promise.reject(new Error("找不到任务"))}',
          '任务详情按内部 ID 或完整编号读取'
        );
        source = root.__evaCut(
          source,
          'createIssue=rt=>{const ut={...MOCK_ISSUES[0],...rt,id:`mock-${Date.now().toString(36)}`,identifier:`WS-${issuesOf().length+1}`};return issuesOf().push(ut),Promise.resolve(ut)}',
          'createIssue=rt=>{const ct=rt??{},ut=ct.workspace_id??currentSpaceId(),pt=loadSpaces().find(Et=>Et.id===ut);if(!pt)throw new Error("项目不存在");const mt=evaMembers().store,gt=mt.snapshot(),St=gt.actorId,Ct=gt.projects?.[ut];if(!Ct||!mt.canRead(ut,St))throw new Error("无权在此项目创建任务");const xt=String(ct.title??"").trim();if(!xt)throw new Error("任务名称不能为空");const Pt=Et=>Ct.humans?.some(Qt=>Qt.id===Et),Nt=Et=>Ct.cloneIds?.includes(Et),Mt=Et=>Ct.employeeIds?.includes(Et),Dt=Et=>mt.projectAgent?.(ut)?.id===Et,Ft=ct.assignee_id;let Qt=null;if(Ft){if(Pt(Ft))Qt={...mt.person(Ft),type:"member"};else if(Nt(Ft))Qt={...mt.clone(Ft),type:"agent"};else if(Mt(Ft))Qt={...mt.employee(Ft),type:"agent"};else if(Dt(Ft))Qt={...mt.projectAgent(ut),type:"agent"};if(!Qt?.id)throw new Error("负责人必须属于当前项目")}if(ct.reviewer_id&&!Pt(ct.reviewer_id))throw new Error("验收人必须是当前项目成员");const Vt=ISSUES_BY_SPACE[ut]??(ISSUES_BY_SPACE[ut]=[]),Ht=ct.parent_issue_id;if(Ht&&!Vt.some(Et=>Et.id===Ht))throw new Error("父任务必须属于当前项目");const jt=evaProjectIssuePrefix(pt),tn=Math.max(0,...Vt.map(Et=>{const Qt=String(Et.identifier??"").match(new RegExp("^"+jt+"-(\\d+)$"));return Qt?Number(Qt[1]):0}))+1,Kt=Array.isArray(ct.attachment_ids)?ct.attachment_ids.map(Et=>evaLoopTaskAttachments.get(Et)).filter(Boolean):[],nn=Kt.map(Et=>"["+String(Et.name??"").replace(/[\\[\\]]/g,"")+"]("+(Et.url??"")+")").filter(Boolean),rn=ct.project_id==="p-supply"&&ut!=="prod"?null:ct.project_id,{attachment_ids:ln,run_id:sn,labels:cn,...Cn}=ct,ir={...Cn,id:"issue-"+ut+"-"+Date.now().toString(36)+"-"+(Vt.length+1),identifier:jt+"-"+tn,workspace_id:ut,project_id:rn,status:ct.status??"todo",title:xt,description:(ct.description??"")+(nn.length?"\\n\\n"+nn.join("\\n"):""),assignee_id:Qt?.id??null,assignee_type:Qt?.type??null,assignee_name:Qt?.name??null,creator_id:St,creator_name:mt.person?.(St)?.name??St,created_at:new Date().toISOString(),attachments:Kt};return Vt.push(ir),Promise.resolve(ir)\n    }',
          '新任务不继承 mock 数据并按项目编号'
        );
        source = root.__evaCut(source, 'createIssue=rt=>{const ct=', 'createIssue=rt=>{try{const ct=', '任务创建失败返回 Promise 拒绝');
        source = root.__evaCut(source, 'return Vt.push(ir),Promise.resolve(ir)\n    }', 'return Vt.push(ir),Promise.resolve(ir)}catch(Et){return Promise.reject(Et)}\n    }', '任务创建错误边界');
        source = root.__evaCut(source, 'new RegExp("^"+jt+"-(\\d+)$")', 'new RegExp("^"+jt+"-(\\\\d+)$")', '任务编号数字后缀');
        source = root.__evaCut(
          source,
          'if(rt&&rt!=="mock-1")return Promise.resolve([]);return Promise.resolve(',
          'if(rt!=="supply-1"||!issuesOf().some(ut=>ut.id===rt))return Promise.resolve([]);return Promise.resolve(',
          '评论不回退到其他任务或项目的预置内容'
        );
        var evaRunsStart = source.indexOf('listRuns=()=>Promise.resolve(');
        var evaRunsEnd = source.indexOf(',listRunMessages=', evaRunsStart);
        if (evaRunsStart < 0 || evaRunsEnd < evaRunsStart) throw new Error('任务运行记录适配器边界不匹配');
        var evaLegacyRuns = source.slice(evaRunsStart, evaRunsEnd);
        var evaSeededRuns = evaLegacyRuns.slice('listRuns=()=>Promise.resolve('.length, -1);
        source = root.__evaCut(source, evaLegacyRuns, 'listRuns=rt=>Promise.resolve(rt==="supply-1"?' + evaSeededRuns + ':[])', '任务运行记录按任务隔离');
        source = root.__evaCut(source, 'listRuns=rt=>Promise.resolve(rt==="supply-1"?', 'listRuns=rt=>Promise.resolve(rt==="supply-1"&&issuesOf().some(ct=>ct.id===rt)?', '任务运行记录不跨项目泄漏');
        source = root.__evaCut(source, 'if(rt==="supply-1")return Promise.resolve(', 'if(rt==="supply-1"&&issuesOf().some(ut=>ut.id===rt))return Promise.resolve(', '任务评论不跨项目泄漏');
        source = root.__evaCut(source, 'listChildren=rt=>Promise.resolve(issuesOf().filter(ct=>ct.parent_issue_id===rt))', 'listChildren=rt=>Promise.resolve(issuesOf().some(ct=>ct.id===rt)?issuesOf().filter(ct=>ct.parent_issue_id===rt):[])', '子任务不跨项目泄漏');
        source = root.__evaCut(source, 'listTimeline=()=>Promise.resolve([])', 'listTimeline=rt=>Promise.resolve([])', '任务动态按任务参数读取');
        source = root.__evaCut(source, 'Promise.all([getIssue(rt),listComments(rt),listRuns()])', 'Promise.all([getIssue(rt),listComments(rt),listRuns(rt)])', '任务详情初始运行记录');
        source = root.__evaCut(source, 'listTimeline().then(no=>{Wi()&&sr(no)})', 'listTimeline(rt).then(no=>{Wi()&&sr(no)})', '任务详情初始动态');
        source = root.__evaCut(source, 'Pa=()=>listRuns().then(mr)', 'Pa=()=>listRuns(rt).then(mr)', '任务重新运行后刷新当前任务');

        /* 批注恢复项目内部 Tab 时必须有可定位的项目与标签状态，不依赖展示文案。 */
        source = root.__evaCut(
          source,
          'className:"collab-frame eva-channel-surface","data-eva-channel-surface":"project"',
          'className:"collab-frame eva-channel-surface","data-eva-channel-surface":"project","data-eva-project-id":rt.id,"data-eva-project-tab":pt',
          '项目批注定位属性'
        );
        source = root.__evaCut(
          source,
          'function CollabPage(){const[rt,ct]=reactExports.useState(()=>loadSpaces()),[ut,pt]=reactExports.useState(null),mt=rt.find(gt=>gt.id===ut)??null;reactExports.useEffect(()=>{const gt=()=>{WKApp$1.routeRight.popAll(),pt(null)};return window.addEventListener("eva:open-project-directory",gt),()=>window.removeEventListener("eva:open-project-directory",gt)},[]);return',
          'function CollabPage(){const[rt,ct]=reactExports.useState(()=>loadSpaces()),[ut,pt]=reactExports.useState(null),[evaProjectView,setEvaProjectView]=reactExports.useState(null),mt=rt.find(gt=>gt.id===ut)??null;reactExports.useEffect(()=>{const gt=()=>{WKApp$1.routeRight.popAll(),pt(null)},St=Ct=>{const xt=Ct.detail??{};rt.some(Pt=>Pt.id===xt.projectId)&&(WKApp$1.routeRight.popAll(),setEvaProjectView({projectId:xt.projectId,tab:xt.tab||"tasks"}),pt(xt.projectId))};return window.addEventListener("eva:open-project-directory",gt),window.addEventListener("eva:open-project-view",St),()=>{window.removeEventListener("eva:open-project-directory",gt),window.removeEventListener("eva:open-project-view",St)}},[rt]);return',
          '批注恢复项目内部视图'
        );
        source = root.__evaCut(
          source,
          'React.createElement(SpaceFrame,{key:mt.id,space:mt,spaces:rt,onSwitch:gt=>pt(gt)})',
          'React.createElement(SpaceFrame,{key:mt.id+":"+(evaProjectView?.projectId===mt.id?evaProjectView.tab:"tasks"),space:mt,spaces:rt,onSwitch:gt=>pt(gt),initialTab:evaProjectView?.projectId===mt.id?evaProjectView.tab:"tasks"})',
          '批注进入指定项目标签'
        );
        source=root.__evaCut(source,'onCreate:gt=>{const St=newSpace(gt),Ct=[...rt,St];','onCreate:(gt,evaClones,evaGoal)=>{const St={...newSpace(gt),desc:evaGoal||""},Ct=[...rt,St];evaMembers().store.createProject(St.id,St.name,evaMembers().store.snapshot().actorId,evaClones,evaGoal);','项目创建成员事务');

    source=root.__evaCut(source,'case"channels":return React.createElement(ChannelsView,{onOpenTask:', 'case"channels":return React.createElement(ChannelsView,{key:rt.id,membershipProjectId:rt.id,onManageProject:()=>Pt("settings"),onOpenTask:', '项目 IM 成员上下文');
    source=root.__evaCut(source,'SpaceFrame=({space:rt,spaces:ct,onSwitch:ut})=>{const[pt,mt]=reactExports.useState("tasks")',
      'SpaceFrame=({space:rt,spaces:ct,onSwitch:ut,initialTab:evaInitialTab="tasks"})=>{const evaProjectMemberStore=evaMembers().store,evaProjectMemberRevision=reactExports.useSyncExternalStore(evaProjectMemberStore.subscribe,evaProjectMemberStore.getSnapshot),evaProjectActor=evaProjectMemberStore.snapshot().actorId;const[pt,mt]=reactExports.useState(evaInitialTab)','项目内容访问状态');
    source=root.__evaCut(source,'Dt=reactExports.useMemo(()=>{switch(pt){case"tasks":return React.createElement(IssuePage',
      'Dt=reactExports.useMemo(()=>{if(!evaProjectMemberStore.canRead(rt.id,evaProjectActor))return React.createElement(MembersTab,{key:rt.id,workspaceId:rt.id});switch(pt){case"tasks":return React.createElement(IssuePage','未加入项目仅显示邀请');
    source=root.__evaCut(source,'}},[pt,xt]);return React.createElement("div",{className:"collab-frame',
      '}},[pt,xt,rt.id,evaProjectMemberRevision]);return React.createElement("div",{className:"collab-frame','项目成员变更刷新内容');
    source=root.__evaCut(source,'function SettingsPage({workspace:rt,onUpdated:ct}){','function SettingsPage({workspace:rt,onUpdated:ct,initialTab:evaInitialSettingsTab="general"}){','设置默认标签参数');
    source=root.__evaCut(source,'React.createElement(Tabs,{type:"line"},React.createElement(TabPane,{tab:"通用"','React.createElement(Tabs,{type:"line",defaultActiveKey:evaInitialSettingsTab},React.createElement(TabPane,{tab:"通用"','设置标签初始化');
    source=root.__evaCut(source,'case"settings":return React.createElement(SettingsPage,{workspace:{...WORKSPACE','case"settings":return React.createElement(SettingsPage,{initialTab:"members",workspace:{...WORKSPACE','项目设置默认成员管理');
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
    function evaSaveProjectInfo(id,{name,goal,issuePrefix}){
      const store=evaMembers().store,actor=store.snapshot().actorId;
      if(!store.manager(id,actor))throw new Error('仅项目负责人或管理员可修改');
      const projects=loadSpaces(),project=projects.find(p=>p.id===id);if(!project)throw new Error('项目不存在');
      name=name.trim();goal=goal.trim();issuePrefix=(issuePrefix??evaProjectIssuePrefix(project)).trim().toUpperCase();
      if(!name||name.length>50)throw new Error('项目名称须为 1–50 个字符');
      if(goal.length>2000)throw new Error('共同目标最多 2000 个字符');
      if(!/^[A-Z][A-Z0-9]*$/.test(issuePrefix))throw new Error('任务前缀须以英文字母开头，仅包含字母和数字');
      if(projects.some(p=>p.id!==id&&(evaProjectIssuePrefix(p)===issuePrefix||(ISSUES_BY_SPACE[p.id]||[]).some(issue=>String(issue.identifier||'').startsWith(issuePrefix+'-')))))throw new Error('该任务前缀已被其他项目使用');
      const next=projects.map(p=>p.id===id?{...p,name,short:name.slice(0,1),desc:goal,issue_prefix:issuePrefix}:p);
      localStorage.setItem(KEY,JSON.stringify(next));
      store.renameProject(id,actor,name);
      return next;
    }
    function GeneralTab({workspace:project,onUpdated}){
      const store=evaMembers().store,revision=reactExports.useSyncExternalStore(store.subscribe,store.getSnapshot),actor=store.snapshot().actorId;
      const [name,setName]=reactExports.useState(project.name),[goal,setGoal]=reactExports.useState(project.desc||''),[issuePrefix,setIssuePrefix]=reactExports.useState(evaProjectIssuePrefix(project)),[error,setError]=reactExports.useState(''),[saved,setSaved]=reactExports.useState(false);
      reactExports.useEffect(()=>setSaved(false),[project.id,actor]);
      reactExports.useEffect(()=>{setName(project.name);setGoal(project.desc||'');setIssuePrefix(evaProjectIssuePrefix(project));setError('');},[project.id,project.name,project.desc,project.issue_prefix,actor]);
      const editable=store.manager(project.id,actor),changed=name.trim()!==project.name||goal.trim()!==(project.desc||'')||issuePrefix.trim().toUpperCase()!==evaProjectIssuePrefix(project);
      const save=()=>{try{const next=evaSaveProjectInfo(project.id,{name,goal,issuePrefix});onUpdated?.(next);setError('');setSaved(true);}catch(e){setError(e.message||'保存失败，请重试');}};
      return React.createElement('div',{className:'eva-project-info'},
        React.createElement('div',{className:'eva-project-info-field'},React.createElement('label',{htmlFor:'eva-project-name'},'项目名称'),React.createElement(ForwardInput,{id:'eva-project-name','aria-label':'项目名称',value:name,maxLength:50,disabled:!editable,onChange:value=>{setName(value);setSaved(false);}})),
        React.createElement('div',{className:'eva-project-info-field'},React.createElement('label',{htmlFor:'eva-project-issue-prefix'},'任务前缀'),React.createElement(ForwardInput,{id:'eva-project-issue-prefix','aria-label':'任务前缀',value:issuePrefix,disabled:!editable,placeholder:'例如 SC',onChange:value=>{setIssuePrefix(value.toUpperCase());setSaved(false);}}),React.createElement('p',{className:'eva-members-muted'},'完整任务编号由前缀和数字组成，例如 SC-101。Bot / CLI 按完整编号查找任务；修改前缀只影响新任务，已有编号保留。')),
        React.createElement('div',{className:'eva-project-info-field'},React.createElement('label',{htmlFor:'eva-project-goal'},'共同目标'),React.createElement('textarea',{id:'eva-project-goal','aria-label':'共同目标',value:goal,maxLength:2000,rows:6,disabled:!editable,placeholder:'说明大家为什么协作，以及希望共同达成什么结果',onChange:e=>{setGoal(e.target.value);setSaved(false);}}),React.createElement('p',{className:'eva-members-muted'},'帮助项目成员和 AI 理解协作背景与预期成果。')),
        error&&React.createElement('p',{role:'alert',className:'eva-members-error'},error),
        saved&&React.createElement('p',{role:'status',className:'eva-members-muted'},'项目信息已保存'),
        editable?React.createElement(Button,{theme:'solid',disabled:!name.trim()||!changed,onClick:save},'保存'):React.createElement('p',{className:'eva-members-muted'},'仅项目负责人和管理员可编辑。'));
    }`, '项目名称与共同目标');
    source=root.__evaCut(source,'tab:"通用",itemKey:"general"','tab:"项目信息",itemKey:"general"','项目信息标签');
    source=root.__evaCut(source,'SpaceFrame=({space:rt,spaces:ct,onSwitch:ut,initialTab:evaInitialTab="tasks"})','SpaceFrame=({space:rt,spaces:ct,onSwitch:ut,onProjectUpdated:evaProjectUpdated,initialTab:evaInitialTab="tasks"})','项目更新回调');
    source=root.__evaCut(source,'workspace:{...WORKSPACE,id:rt.id,name:rt.name,slug:rt.id}','workspace:rt,onUpdated:evaProjectUpdated','设置读取当前项目');
    source=root.__evaCut(source,'space:mt,spaces:rt,onSwitch:gt=>pt(gt)','space:mt,spaces:rt,onSwitch:gt=>pt(gt),onProjectUpdated:ct','项目列表刷新');
    source=root.__evaCut(source,'[pt,xt,rt.id,evaProjectMemberRevision]','[pt,xt,rt,evaProjectMemberRevision,evaProjectUpdated]','项目信息更新刷新内容');
    source=root.__evaCut(source,'name:"团队文件功能设计",short:"团",desc:(St.desc||"").replaceAll("云盘","团队文件")','name:St.name,short:St.short,desc:St.desc||""','保留用户修改的项目名称与目标');
    return source;
  });
})(window);
