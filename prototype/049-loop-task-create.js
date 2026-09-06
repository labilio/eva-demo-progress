(function(root){
  'use strict';
  let Component;
  root.EvaLoopTaskCreateUI={render(props,deps){Component||=create(deps.React);return deps.React.createElement(Component,{...props,deps});}};
  function create(R){
    const h=R.createElement;
    return function LoopTaskCreate({visible,onClose,onCreated,parentIssueId,deps}){
      const {Modal,Button,Input,TextArea,Select,icons,members,createIssue,uploadAttachment,listLabels,attachLabel,getPrefix}=deps;
      const project=typeof deps.project==='function'?deps.project():deps.project;
      R.useSyncExternalStore(members.subscribe,members.getSnapshot,members.getSnapshot);
      const snapshot=members.snapshot(),pid=project?.collaborationId||(project?.id==='p-supply'?'prod':project?.id),scope=snapshot.projects[pid];
      const empty=()=>({title:'',goal:'',criteria:'',context:'',priority:'medium',due:'',assignee:'',reviewer:'',labels:[]});
      const [form,setForm]=R.useState(empty),[labels,setLabels]=R.useState([]),[files,setFiles]=R.useState([]),[busy,setBusy]=R.useState(false),[error,setError]=R.useState('');
      const lock=R.useRef(false),host=R.useRef(null),fileInput=R.useRef(null),generation=R.useRef(0),created=R.useRef(null),uploaded=R.useRef(new Map()),attached=R.useRef(new Set());
      R.useEffect(()=>{
        const token=++generation.current;
        setForm(empty());setFiles([]);setError('');setBusy(false);lock.current=false;created.current=null;uploaded.current.clear();attached.current.clear();setLabels([]);
        if(visible)Promise.resolve().then(()=>listLabels()).then(rows=>{if(generation.current===token)setLabels(Array.isArray(rows)?rows:rows?.items||[]);}).catch(()=>{if(generation.current===token)setError('标签暂时无法加载，其他内容仍可填写。');});
        return()=>{generation.current++;};
      },[visible,project?.id,parentIssueId]);
      const humans=(scope?.humans||[]).map(row=>snapshot.people.find(p=>p.id===row.id)).filter(Boolean);
      const clones=(scope?.cloneIds||[]).map(id=>snapshot.clones.find(c=>c.id===id)).filter(Boolean);
      const employees=(scope?.employeeIds||[]).map(id=>members.employee(id)).filter(Boolean);
      const projectAgent=scope?members.projectAgent(pid):null;
      const candidates=[...humans.map(p=>({...p,type:'member'})),...clones.map(p=>({...p,type:'agent'})),...employees.map(p=>({...p,type:'agent'})),...(projectAgent?[{...projectAgent,type:'agent'}]:[])];
      const selected=candidates.find(p=>p.id===form.assignee),patch=(key,value)=>setForm(old=>({...old,[key]:value}));
      const popup=()=>host.current;
      function identity(person){
        if(person.type!=='agent'&&deps.HumanIdentity)return h(deps.HumanIdentity,{id:person.id,compact:true});
        const ai=person.type==='agent',owner=snapshot.people.find(p=>p.id===person.ownerId);
        const appearance=person.identityAppearance||(person.kind==='project-agent'?root.EvaAIIdentity.projectAgentAppearance():{name:person.name,logo:root.__EVA_COLLEAGUE_PORTRAIT,ownerName:owner?.name,ownerAvatar:owner?.id==='u-wangyilin'?root.__EVA_CURRENT_USER_PORTRAIT:root.EvaAvatar.personUri(owner?.id||person.ownerId)});
        return h('span',{className:'eva-loop-task-create__identity'},ai?root.EvaAIIdentity.avatar(appearance,24,h):h('img',{src:person.id==='u-wangyilin'?root.__EVA_CURRENT_USER_PORTRAIT:root.EvaAvatar.personUri(person.id),alt:'',width:24,height:24}),h('span',null,person.name),ai&&root.EvaAIIdentity.badge(h));
      }
      const field=(title,content,hint)=>h('div',{className:'eva-loop-task-create__field'},h('label',{className:'eva-loop-task-create__label'},title),content,hint&&h('p',{className:'eva-loop-task-create__hint'},hint));
      const text=(key,placeholder,required=false)=>h(TextArea,{value:form[key],onChange:value=>patch(key,value),placeholder,disabled:busy||!!created.current,autosize:{minRows:3,maxRows:7},'aria-label':placeholder,'aria-required':required});
      const close=()=>{if(!lock.current)onClose();};
      async function submit(){
        if(lock.current)return;
        if(!scope||!project?.id||!members.canRead(pid,snapshot.actorId)){setError('请从具体项目中创建任务。');return;}
        if(!form.title.trim()||!form.goal.trim()||!form.criteria.trim()){setError('请填写任务标题、任务目标和完成标准。');return;}
        if(!selected){setError('请选择当前项目内的执行负责人。');return;}
        if(form.reviewer&&!humans.some(p=>p.id===form.reviewer)){setError('验收人已不在项目中，请重新选择。');return;}
        lock.current=true;setBusy(true);setError('');const token=generation.current;
        try{
          const attachmentIds=[];
          for(const file of files){if(!uploaded.current.has(file)){const result=await uploadAttachment(file);if(token!==generation.current)return;if(!result?.id)throw new Error('附件上传失败');uploaded.current.set(file,result.id);}attachmentIds.push(uploaded.current.get(file));}
          if(token!==generation.current)return;
          if(!created.current){const result=await createIssue({title:form.title.trim(),description:['## 任务目标',form.goal.trim(),'','## 完成标准',form.criteria.trim(),...(form.context.trim()?['','## 补充上下文',form.context.trim()]:[]),...((form.due||form.reviewer)?['','## 验收安排',...(form.due?['截止日期：'+form.due]:[]),...(form.reviewer?['验收人：'+humans.find(p=>p.id===form.reviewer).name]:[])]:[])].join('\n'),status:'todo',priority:form.priority,project_id:project.id,workspace_id:pid,assignee_id:selected.id,assignee_type:selected.type,assignee_name:selected.name,acceptance_criteria:form.criteria.trim(),due_date:form.due||null,reviewer_id:form.reviewer||null,attachment_ids:attachmentIds,parent_issue_id:parentIssueId});if(token!==generation.current)return;created.current=result;}
          if(!created.current?.id)throw new Error('任务创建未返回任务编号，请重试。');
          for(const id of form.labels){if(!attached.current.has(id)){await attachLabel(created.current.id,id);if(token!==generation.current)return;attached.current.add(id);}}
          if(token===generation.current){onCreated?.(created.current);onClose();}
        }catch(e){if(token===generation.current)setError((created.current?'任务已创建，标签未全部保存。再次点击仅补存标签。':'')+(e?.message||'保存失败，请重试。'));}
        finally{if(token===generation.current){lock.current=false;setBusy(false);}}
      }
      const disabled=busy||!!created.current;
      const selector=(key,options,placeholder,more={})=>h(Select,{value:form[key]||undefined,onChange:value=>patch(key,value||''),optionList:options,getPopupContainer:popup,disabled,placeholder,'aria-label':placeholder,...more});
      const attachmentField=h(R.Fragment,null,
        h('input',{type:'file',multiple:true,hidden:true,ref:fileInput,onChange:e=>{setFiles(old=>[...old,...Array.from(e.target.files||[])]);e.target.value='';}}),
        h('p',{className:'eva-loop-task-create__hint'},'任务与附件保留在当前原型页面内，附件未上传至服务端。'),
        h(Button,{theme:'borderless',icon:h(icons.Paperclip,{size:16}),disabled,onClick:()=>fileInput.current?.click()},'添加附件'),
        files.map((file,index)=>h('div',{className:'eva-loop-task-create__attachment',key:index},h('span',null,file.name),h(Button,{theme:'borderless',icon:h(icons.Trash2,{size:14}),'aria-label':'移除 '+file.name,disabled,onClick:()=>setFiles(old=>old.filter((_,i)=>i!==index))})))
      );
      const main=h('div',{className:'eva-loop-task-create__main'},
        field('任务标题 *',h(Input,{value:form.title,onChange:value=>patch('title',value),placeholder:'需要完成什么任务',maxLength:200,disabled,'aria-label':'任务标题','aria-required':true})),
        field('任务目标 *',text('goal','说明任务要解决的问题与预期结果',true)),
        field('完成标准 *',text('criteria','列出可以逐项验收的结果与交付物',true)),
        field('补充上下文',text('context','背景、参考资料、约束或协作说明')),
        field('附件',attachmentField)
      );
      const properties=h('aside',{className:'eva-loop-task-create__properties'},
        field('执行负责人 *',selector('assignee',candidates.map(p=>({value:p.id,label:identity(p)})),'执行负责人'),selected?.type==='agent'?'创建后进入待办，等待分派与执行；不会立即启动 AI。':'由负责人按完成标准推进任务。'),
        field('优先级',selector('priority',[['urgent','紧急'],['high','高'],['medium','中'],['low','低'],['none','无']].map(([value,label])=>({value,label})),'优先级')),
        field('截止日期',h(Input,{type:'date',value:form.due,onChange:value=>patch('due',value),disabled,'aria-label':'截止日期'})),
        field('验收人',selector('reviewer',humans.map(p=>({value:p.id,label:identity({...p,type:'member'})})),'验收人',{showClear:true})),
        labels.length>0&&field('标签',selector('labels',labels.map(label=>({value:label.id,label:label.name})),'标签',{multiple:true})),
        field('初始状态',h('span',null,'待办'),'完成后按任务流程提交验收。')
      );
      return h(R.Fragment,null,
        h('div',{className:'eva-loop-task-create-portal',ref:host}),
        h(Modal,{visible,className:'eva-loop-task-create',width:720,title:parentIssueId?'新建子任务':'新建任务',getPopupContainer:popup,onCancel:close,maskClosable:!busy,closable:!busy,closeOnEsc:!busy,
          footer:h('div',{className:'eva-loop-task-create__actions'},h(Button,{onClick:close,disabled:busy},'取消'),h(Button,{theme:'solid',onClick:submit,loading:busy,disabled:busy||!scope||!members.canRead(pid,snapshot.actorId)},created.current?'补存标签':'创建任务'))},
          h('div',{className:'eva-loop-task-create__body'},
            h('p',{className:'eva-loop-task-create__hint'},(project?.name||project?.title||'未选择项目')+' · '+(getPrefix?.(project?.id)||'')+' 编号将在创建时分配'),
            h('div',{className:'eva-loop-task-create__layout'},main,properties),
            error&&h('p',{className:'eva-loop-task-create__error',role:'alert'},error)
          )
        )
      );
    };
  }
})(window);
