(function(root){
'use strict';
function family(rows,currentId){
 const current=rows.find(r=>r.id===currentId);if(!current)return null;
 const scope=r=>(r.workspace_id||r.project_id)===(current.workspace_id||current.project_id);
 const index=new Map(rows.filter(scope).map(r=>[r.id,r])),path=[],seen=new Set();let node=current;
 while(node&&!seen.has(node.id)){seen.add(node.id);path.unshift(node.id);node=index.get(node.parent_issue_id);}
 if(node)return {error:'任务层级存在循环，请检查父任务关系'};
 const children=new Map();for(const row of index.values()){if(index.has(row.parent_issue_id)){if(!children.has(row.parent_issue_id))children.set(row.parent_issue_id,[]);children.get(row.parent_issue_id).push(row);}}
 return {root:index.get(path[0]),index,children,path};
}
let Component;
root.EvaTaskTree={family,render(props,deps){Component||=create(deps.React);return deps.React.createElement(Component,{...props,deps});}};
function create(R){const h=R.createElement;return function TaskTree({rows,currentId,onOpen,onChanged,readonly,deps}){
 const [collapsed,setCollapsed]=R.useState(new Set()),[parent,setParent]=R.useState(null),[revision,setRevision]=R.useState(0),viewport=R.useRef(null),active=R.useRef(null);
 const data=family(rows,currentId);
 function locate(){const box=viewport.current,item=active.current;if(box&&item){const a=box.getBoundingClientRect(),b=item.getBoundingClientRect();box.scrollTo({left:box.scrollLeft+b.left-a.left-(a.width-b.width)/2,top:box.scrollTop+b.top-a.top-(a.height-b.height)/2,behavior:'smooth'});}}
 R.useEffect(()=>{setCollapsed(new Set());},[currentId]);
 R.useEffect(()=>{locate();},[currentId,revision]);
 if(!data)return null;if(data.error)return h('p',{role:'alert'},data.error);
 const toggle=id=>setCollapsed(old=>{const next=new Set(old);next.has(id)?next.delete(id):next.add(id);return next;});
 function branch(task){const kids=data.children.get(task.id)||[],selected=task.id===currentId,expanded=!collapsed.has(task.id),Status=deps.statusIcons[task.status];
 return h('li',{key:task.id,className:'eva-task-tree__branch'},h('article',{className:'eva-task-tree__node'+(selected?' is-current':data.path.includes(task.id)?' is-ancestor':''),ref:selected?active:null},
 h('button',{type:'button',className:'eva-task-tree__open','aria-current':selected?'location':undefined,'aria-label':task.identifier+' '+task.title+(selected?'，当前任务':''),onClick:()=>onOpen(task.id),disabled:readonly},
 h('span',{className:'eva-task-tree__meta'},Status&&h(Status,{size:14,style:{color:deps.statusColors[task.status]}}),task.identifier,h('span',null,deps.statusLabels[task.status]||task.status)),h('strong',null,task.title),selected&&h('span',{className:'eva-task-tree__current'},'当前任务')),
 h('div',{className:'eva-task-tree__actions'},h('small',null,kids.length?'直接子任务 '+kids.filter(k=>k.status==='done').length+'/'+kids.length:'暂无子任务'),kids.length>0&&h('button',{type:'button','aria-expanded':expanded,onClick:()=>toggle(task.id)},expanded?'收起':'展开'),!readonly&&h('button',{type:'button','aria-label':'分解 '+task.identifier,onClick:()=>setParent(task.id)},h(deps.Plus,{size:12}),'分解'))),kids.length>0&&expanded&&h('ul',null,kids.map(branch)));
 }
 return h('section',{className:'eva-task-tree','aria-label':'任务分解树'},h('header',null,h('strong',null,'任务分解树'),h('button',{type:'button',onClick:()=>{setCollapsed(new Set());setRevision(v=>v+1);}},'定位当前任务')),
 h('nav',{'aria-label':'当前任务层级路径'},data.path.map((id,i)=>h(R.Fragment,{key:id},i>0&&h('span',null,' / '),h('button',{type:'button',onClick:()=>onOpen(id),disabled:readonly,'aria-current':id===currentId?'location':undefined},data.index.get(id).identifier)))),
 h('div',{className:'eva-task-tree__viewport',ref:viewport},h('ul',{className:'eva-task-tree__root'},branch(data.root))),
 parent&&h(deps.CreateIssueModal,{visible:true,parentIssueId:parent,projectId:data.index.get(parent).workspace_id||deps.projectId,onClose:()=>setParent(null),onCreated:()=>{setRevision(v=>v+1);onChanged?.();}}));
};}
})(window);
