(function (root) {
  'use strict';
  root.__evaPatch('automation', function (source) {
        var sharedAutomationSource = String.raw`
function EvaExpertCenterPage({initialTab:rt="experts"}){
  const[ct,ut]=reactExports.useState(rt);
  return React.createElement("div",{className:"eva-expert-center"},
    React.createElement("div",{className:"eva-expert-center__tabs"},
      React.createElement(Tabs,{type:"line",activeTab:ct,onChange:ut},
        React.createElement(TabPane,{tab:"专家",itemKey:"experts"}),
        React.createElement(TabPane,{tab:"专家团",itemKey:"squads"})
      )
    ),
    React.createElement("div",{className:"eva-expert-center__body"},ct==="squads"?React.createElement(SquadPage,null):React.createElement(AgentPage,null))
  );
}
const EVA_PERSONAL_AUTOMATION_DEMO=[
  {id:"personal-daily-brief",name:"每日工作简报",description:"汇总当天日程、待办和重点消息，并创建一个新会话返回简报。",instruction:"读取今天的日程、待办与重点消息，生成一份可直接执行的工作简报。",schedule:"工作日 08:30",nextRun:"明天 08:30",executor:"通用助理",enabled:true,lastStatus:"completed",lastRun:"9月3日 08:31",output:"Session",runTargetName:"每日工作简报 · 9月3日",runContent:"今日共有 3 项重点工作：完成云盘权限方案评审、跟进文件预览异常、准备下午的设计同步会。"},
  {id:"personal-weekly-review",name:"每周工作复盘",description:"整理本周完成事项、风险和下周计划。",instruction:"汇总本周完成事项、遗留风险和下周计划，并给出优先级建议。",schedule:"每周五 17:30",nextRun:"本周五 17:30",executor:"通用助理",enabled:true,lastStatus:"completed",lastRun:"8月29日 17:34",output:"Session",runTargetName:"每周工作复盘 · 第36周",runContent:"本周完成云盘交互方案与权限矩阵梳理；主要风险是外链权限边界仍待确认。"}
];
function EvaAutomationRunDetail({run,onOpenTask}){
  const h=React.createElement,failed=["failed","error"].includes(run.lastStatus),status=failed?"失败":["completed","succeeded"].includes(run.lastStatus)?"成功":run.lastStatus==="running"?"运行中":"待运行";
  const date=new Date(run.lastRun),time=Number.isNaN(date.getTime())?run.lastRun:new Intl.DateTimeFormat("zh-CN",{timeZone:"Asia/Shanghai",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}).format(date);
  const task=(ISSUES_BY_SPACE[currentSpaceId()]||[]).find(item=>item.id===run.runTargetId);
  return h("div",{className:"eva-auto-run-detail"},
    h("div",{className:"eva-auto-run-heading"},h("h3",null,run.name),h("span",{className:"eva-auto-run-status"+(failed?" is-failed":"")},status)),
    h("p",{className:"eva-auto-run-time"},time," · 北京时间"),
    h("section",{className:"eva-auto-run-result"},h("h4",null,failed?"失败原因":"执行结果"),h("p",null,run.runContent||"本次运行暂无结果摘要。")),
    task&&h("section",{className:"eva-auto-run-related"},h("h4",null,"关联任务"),h("button",{type:"button",onClick:onOpenTask},h("span",{className:"eva-auto-run-task-id"},task.identifier),h("span",{className:"eva-auto-run-task-name"},task.title),h(ChevronRight,{size:16}))),
    h("span",{className:"eva-auto-run-demo",title:"预置演示记录；关联任务用于呈现场景，不代表真实自动执行。",tabIndex:0},"演示记录")
  );
}
function EvaAutomationSettingsModal({item:rt,visible:ct,onClose:ut,onSave:pt}){
  const[mt,gt]=reactExports.useState(""),[St,Ct]=reactExports.useState(""),[xt,Pt]=reactExports.useState("");
  reactExports.useEffect(()=>{gt(rt?.name||"");Ct(rt?.instruction||rt?.description||"");Pt(rt?.schedule||"")},[rt]);
  return React.createElement(Modal,{width:640,title:"定时任务设置",visible:ct,onCancel:ut,closeOnEsc:true,maskClosable:false,footer:React.createElement(React.Fragment,null,React.createElement(ButtonComponent$1,{onClick:ut},"取消"),React.createElement(ButtonComponent$1,{type:"primary",disabled:!mt.trim(),onClick:()=>{pt&&pt({...rt,name:mt.trim(),instruction:St.trim(),description:St.trim(),schedule:xt.trim()});ut&&ut()}},"保存"))},rt&&React.createElement("div",{className:"eva-auto-settings"},
    React.createElement("label",null,React.createElement("span",null,"名称"),React.createElement(ForwardInput,{value:mt,onChange:gt,placeholder:"例如 每日晨报"})),
    React.createElement("label",null,React.createElement("span",null,"执行方"),React.createElement("div",{className:"eva-auto-settings__static"},rt.executor||"未指定执行方")),
    React.createElement("label",null,React.createElement("span",null,"触发时间"),React.createElement(ForwardInput,{value:xt,onChange:Pt,placeholder:"例如 工作日 09:00"})),
    React.createElement("label",null,React.createElement("span",null,"任务说明"),React.createElement("textarea",{value:St,onChange:Nt=>Ct(Nt.target.value),rows:7,placeholder:"写清楚目标、上下文和步骤"})),
    React.createElement("p",{className:"eva-auto-settings__hint"},"每次触发都会创建一个可追踪的任务。个人中生成 Session，团队项目中生成 Loop 任务。")
  ));
}
function EvaAutomationSessionResult({item:rt,onBack:ct}){
  return React.createElement("div",{className:"eva-auto-session"},
    React.createElement("header",{className:"eva-auto-session__head"},React.createElement("button",{type:"button",className:"eva-auto-icon-button",onClick:ct,"aria-label":"返回自动化任务"},React.createElement("svg",{width:20,height:20,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.5,"aria-hidden":true},React.createElement("path",{d:"m15 18-6-6 6-6",strokeLinecap:"round",strokeLinejoin:"round"}))),React.createElement("div",null,React.createElement("h1",null,rt.runTargetName||rt.name),React.createElement("p",null,"由自动化任务“",rt.name,"”生成的 Session"))),
    React.createElement("main",{className:"eva-auto-session__body"},React.createElement("div",{className:"eva-auto-session__message"},React.createElement("strong",null,rt.executor||"通用助理"),React.createElement("span",null,rt.lastRun||"刚刚"),React.createElement("p",null,rt.runContent||"自动化任务已执行完成，结果已写入本次 Session。"))),
    React.createElement("footer",{className:"eva-auto-session__composer"},React.createElement("span",null,"继续追问这个 Session…"))
  );
}
function EvaSharedAutomationPage({scope:rt,items:ct,loading:ut,onCreate:pt,onOpenRun:mt,notice:gt}){
  const[St,Ct]=reactExports.useState("tasks"),[Nt,Mt]=reactExports.useState(ct||[]),[Dt,Ft]=reactExports.useState(null);
  reactExports.useEffect(()=>Mt(ct||[]),[ct]);
  const Qt=St==="tasks"?Nt:Nt.flatMap(item=>item.runs?.length?item.runs.map(run=>({...item,id:run.id,lastRun:run.at,lastStatus:run.status,runContent:run.summary,runTargetId:run.taskId})):item.lastRun?[item]:[]).sort((a,b)=>new Date(b.lastRun)-new Date(a.lastRun));
  const Vt=Ht=>Ht==="completed"||Ht==="succeeded"?"成功":Ht==="running"?"运行中":Ht==="failed"||Ht==="error"?"失败":Ht==="missed"?"已错过":"待运行";
  const Ht=Lt=>{if(Lt.key==="Enter"||Lt.key===" "){Lt.preventDefault();Lt.currentTarget.click()}};
  const Lt=Kt=>Mt(Yt=>Yt.map(Xt=>Xt.id===Kt.id?Kt:Xt));
  const $t=Kt=>{const Xt=String(Kt||"");const Zt=Xt.match(/(\d{1,2})月(\d{1,2})日/);if(Zt)return Number(Zt[1])+"月"+Number(Zt[2])+"日";const en=Xt.match(/(?:\d{4}[\/.-])?(\d{1,2})[\/.-](\d{1,2})/);if(en)return Number(en[1])+"月"+Number(en[2])+"日";const tn=new Date(Kt);return Number.isNaN(tn.getTime())?Xt.replace(/\s+\d{1,2}:\d{2}.*$/,""):(tn.getMonth()+1)+"月"+tn.getDate()+"日"};
  const Kt=Yt=>React.createElement("div",{key:Yt.id,className:"eva-auto-unified-row",role:"button",tabIndex:0,onKeyDown:Ht,onClick:()=>St==="tasks"?Ft(Yt):mt&&mt(Yt)},
    React.createElement("div",{className:"eva-auto-unified-row__main"},React.createElement("strong",null,Yt.name),React.createElement("span",null,St==="tasks"?(Yt.description||Yt.executor||"自动化任务"):Vt(Yt.lastStatus)+(Yt.runContent?" · "+Yt.runContent:"")),St==="tasks"&&React.createElement("span",null,Yt.schedule||"未设置计划")),
    React.createElement("div",{className:"eva-auto-unified-row__aside"},St==="tasks"?(Yt.enabled===false?"暂无后续执行":Yt.nextRun||"暂无后续执行"):$t(Yt.lastRun))
  );
  return React.createElement("div",{className:"eva-shared-auto","data-scope":rt},
    React.createElement("header",{className:"eva-shared-auto__head"},React.createElement(GroupComponent,{className:"eva-auto-segmented",role:"tablist","aria-label":"自动化任务视图","data-active":St},React.createElement(ButtonComponent$1,{type:"text",role:"tab","aria-selected":St==="tasks",className:St==="tasks"?"is-active":"",onClick:()=>Ct("tasks"),icon:React.createElement(Clock3,{size:18})},"定时任务"),React.createElement(ButtonComponent$1,{type:"text",role:"tab","aria-selected":St==="runs",className:St==="runs"?"is-active":"",onClick:()=>Ct("runs"),icon:React.createElement(ListChecks,{size:18})},"运行记录")),St==="tasks"&&React.createElement(ButtonComponent$1,{type:"primary",className:"eva-auto-create-button",icon:React.createElement(Plus$c,{size:16}),onClick:pt},"添加自动化")),
    rt==="project"&&gt&&React.createElement("p",{className:"eva-members-muted"},gt),
    ut?React.createElement("div",{className:"eva-shared-auto__loading"},React.createElement(SpinComponent,null)):React.createElement("div",{className:"eva-auto-unified-list",role:"list"},Qt.length?Qt.map(Kt):React.createElement("div",{className:"eva-shared-auto__empty"},React.createElement(St==="tasks"?Clock3:ListChecks,{size:20,"aria-hidden":!0}),React.createElement("span",null,St==="tasks"?"暂无定时任务":"暂无运行记录"))),
    React.createElement(EvaAutomationSettingsModal,{item:Dt,visible:!!Dt,onClose:()=>Ft(null),onSave:Lt})
  );
}
`;

        var personalAutomationStart = source.indexOf('ScheduledTasksPage=()=>{');
        var personalAutomationEnd = source.indexOf(',index$6=Object.freeze(', personalAutomationStart);
        if (personalAutomationStart < 0 || personalAutomationEnd < 0) throw new Error('个人自动化组件注入点不存在');
        var sharedAutomationInsert = source.lastIndexOf('const Attention$1=', personalAutomationStart);
        if (sharedAutomationInsert < 0) throw new Error('共用自动化组件注入点不存在');
        source = source.slice(0, sharedAutomationInsert) + sharedAutomationSource + source.slice(sharedAutomationInsert);
        personalAutomationStart = source.indexOf('ScheduledTasksPage=()=>{', sharedAutomationInsert + sharedAutomationSource.length);
        personalAutomationEnd = source.indexOf(',index$6=Object.freeze(', personalAutomationStart);
        source = source.slice(0, personalAutomationStart) + String.raw`ScheduledTasksPage=()=>{
  const{t:rt,i18n:ct}=useTranslation(),{jobs:ut,loading:pt}=useAllCronJobs(),{presetAssistants:mt}=useConversationAssistants(),gt=useAgentLogos(),[St,Ct]=reactExports.useState(false),[xt,Pt]=reactExports.useState(null);
  const Nt=reactExports.useMemo(()=>ut.length?ut.map(Mt=>{const Dt=getJobAgentMeta(Mt,mt,gt);return{id:Mt.id,name:Mt.name,description:Mt.description||Mt.target.payload.text,instruction:Mt.target.payload.text,schedule:formatSchedule(Mt,rt),nextRun:Mt.state.next_run_at_ms?formatNextRun(Mt.state.next_run_at_ms,ct.language):"-",executor:Dt.name,enabled:Mt.enabled,lastStatus:Mt.state.last_status,lastRun:Mt.state.last_run_at_ms?formatNextRun(Mt.state.last_run_at_ms,ct.language):null,output:"Session",runTargetName:Mt.metadata.conversation_title||Mt.name,runContent:Mt.state.last_error||"自动化任务已执行完成，结果已写入本次 Session。",raw:Mt}}):EVA_PERSONAL_AUTOMATION_DEMO,[ut,mt,gt,rt,ct.language]);
  if(xt)return React.createElement(EvaAutomationSessionResult,{item:xt,onBack:()=>Pt(null)});
  return React.createElement(React.Fragment,null,React.createElement(EvaSharedAutomationPage,{scope:"personal",items:Nt,loading:pt,onCreate:()=>Ct(true),onOpenRun:Mt=>Pt(Mt),notice:"每次触发都会创建一个新的 Session，并在这里保留运行记录。"}),React.createElement(CreateTaskDialog,{visible:St,onClose:()=>Ct(false)}));
}` + source.slice(personalAutomationEnd);

        var projectAutomationStart = source.indexOf('function AutomationPage(){');
        var projectAutomationEnd = source.indexOf('const{Text}=Typography;function ProjectDetailPage', projectAutomationStart);
        if (projectAutomationStart < 0 || projectAutomationEnd < 0) throw new Error('项目自动化组件注入点不存在');
        source = source.slice(0, projectAutomationStart) + String.raw`function AutomationPage(){
  const{t:rt}=useI18n$1(),[ct,ut]=reactExports.useState([]),[pt,mt]=reactExports.useState(true),[gt,St]=reactExports.useState(false),[run,setRun]=reactExports.useState(null),Ct=reactExports.useRef(0);
  const xt=reactExports.useCallback(()=>{const Dt=++Ct.current;mt(true),listAutopilots().then(Ft=>{Dt===Ct.current&&ut(Ft)}).finally(()=>{Dt===Ct.current&&mt(false)})},[]);reactExports.useEffect(xt,[xt]);
  const Pt=reactExports.useMemo(()=>ct.map(Dt=>{const Ft=window.__EVA_DRIVE_DEMO?.issues?.find(Qt=>Qt.automation_id===Dt.id);return{id:Dt.id,name:Dt.title,description:Dt.description,instruction:Dt.description,schedule:Dt.schedule_label||(Dt.trigger_kinds&&Dt.trigger_kinds.includes("schedule")?"按时间表执行":"未设置计划"),nextRun:formatNextRunAt(Dt.next_run_at)||"-",executor:(Dt.assignee_id?.startsWith("project-agent:")?evaMembers().store.projectAgent(Dt.assignee_id.slice(14))?.name:null)||Dt.assignee_name||Dt.assignee_id,enabled:Dt.status!=="paused",lastStatus:Dt.last_run_status,lastRun:Dt.last_run_at?formatNextRunAt(Dt.last_run_at):null,output:"Loop 任务",runTargetId:Ft?.id,runTargetName:Ft?.title||Dt.title,runs:Dt.runs,runContent:Dt.runs?.[0]?.summary,demo:Dt.demo,raw:Dt}}),[ct]);
  const Nt=Dt=>setRun(Dt);
  const openRelated=()=>{if(!run?.runTargetId)return;const id=run.runTargetId;setRun(null);WKApp$1.routeRight.push(React.createElement(IssueDetailPage,{issueId:id,onChanged:xt,onClose:()=>WKApp$1.routeRight.pop()}));};
  return React.createElement(React.Fragment,null,React.createElement(EvaSharedAutomationPage,{scope:"project",items:Pt,loading:pt,onCreate:()=>St(true),onOpenRun:Nt,notice:"场景演示：以下预置运行记录为 Mock 数据，未连接真实调度或外部业务系统。"}),React.createElement(CreateAutomationModal,{visible:gt,onClose:()=>St(false),onSaved:xt}),React.createElement(Modal,{className:"eva-members-modal eva-auto-run-modal",width:560,title:"运行详情",visible:!!run,onCancel:()=>setRun(null),footer:React.createElement(Button,{onClick:()=>setRun(null)},"关闭")},run&&React.createElement(EvaAutomationRunDetail,{run,onOpenTask:openRelated})));
}` + source.slice(projectAutomationEnd);
    source = root.__evaCut(source, 'className:"w-[min(560px,calc(100vw-32px))] max-w-560px",unmountOnExit:!0', 'className:"eva-auto-create-modal w-[min(560px,calc(100vw-32px))] max-w-560px",unmountOnExit:!0', '自动化创建样式宿主');
    return source;
  });
})(window);
